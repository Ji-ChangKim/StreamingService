import { LIMITS, seedHashInput, type Mode, type Seed } from './policy';
import type { PortalProfile } from '../../../shared/portal';
import { portalChannelKey } from '../../../shared/portal';
import { legacyProfile, isAnalyticsAutoRegisteredRow } from '../services/portalProfileRepository';
import { sha256 } from './network';

export type Candidate = {id:string;channel_key:string;source:string;seed:string;source_hash:string;status:string;reason:string;
  profile_slug:string;managed_json:string;image_hash:string;evidence:string;last_checked_at:string;next_check_at:string;failures:number};
export type SourceRow = {id:string;url:string;status:string;checked_at:string;last_success_at:string;failures:number;reason:string;content_hash:string;cached:string;etag:string;last_modified:string};
type Legacy = Parameters<typeof legacyProfile>[0];
export type Snapshot = {profiles:PortalProfile[];raw:Map<string,string>;legacy:Map<string,Legacy>;keys:Map<string,PortalProfile>;pending:Set<string>;pendingSlugs:Set<string>;removed:Set<string>};

export class DiscoveryStore {
  calls=0;reads=0;writes=0;
  constructor(readonly db:D1Database,readonly runId:string){}
  private before(count=1,writeAllowance=60){if(this.calls+count>LIMITS.dbCalls || this.reads>LIMITS.dbReads-8000 || this.writes>LIMITS.dbWrites-writeAllowance)throw new Error('DATABASE_BUDGET_EXCEEDED');this.calls+=count;}
  private account(results:D1Result[]){for(const r of results){this.reads+=r.meta.rows_read||0;this.writes+=r.meta.rows_written||0;}}
  async all<T>(sql:string,args:unknown[]=[]):Promise<T[]>{this.before();const r=await this.db.prepare(sql).bind(...args).all<T>();this.account([r]);return r.results;}
  async execute(sql:string,args:unknown[]=[],writeAllowance=60){this.before(1,writeAllowance);const r=await this.db.prepare(sql).bind(...args).run();this.account([r]);return r;}
  async batch(statements:{sql:string;args:unknown[]}[]){this.before(statements.length);const results=await this.db.batch(statements.map(s=>this.db.prepare(s.sql).bind(...s.args)));this.account(results);return results;}

  // 슬롯 고유키와 전역 임대로 중복 실행을 막고 월 사용량을 실행 전에 예약한다.
  async begin(slot:string,month:string,mode:Mode,now:string):Promise<boolean>{
    const until=new Date(Date.parse(now)+10*60000).toISOString();
    const r=await this.batch([
      {sql:`INSERT OR IGNORE INTO debut_automation_months(month) VALUES(?)`,args:[month]},
      {sql:`INSERT OR IGNORE INTO debut_automation_runs(slot,id,month,mode,status,started_at)
       SELECT ?,?,?,?,'RUNNING',? WHERE EXISTS(SELECT 1 FROM debut_automation_control WHERE id='discovery' AND enabled=1 AND lease_until<?)
       AND EXISTS(SELECT 1 FROM debut_automation_months WHERE month=? AND runs<?)
       AND (?!='SMOKE' OR (SELECT COUNT(*) FROM debut_automation_runs WHERE month=? AND mode='SMOKE')<12)
       AND (?!='BACKFILL' OR (SELECT COUNT(*) FROM debut_automation_runs WHERE month=? AND mode='BACKFILL')<8)`,args:[slot,this.runId,month,mode,now,now,month,LIMITS.monthlyRuns,mode,month,mode,month]},
      {sql:`UPDATE debut_automation_control SET lease_owner=?,lease_until=? WHERE id='discovery' AND enabled=1 AND lease_until<?
       AND EXISTS(SELECT 1 FROM debut_automation_runs WHERE id=? AND status='RUNNING')`,args:[this.runId,until,now,this.runId]},
      {sql:`UPDATE debut_automation_months SET runs=runs+1,reserved_external=reserved_external+?,reserved_reads=reserved_reads+?,reserved_writes=reserved_writes+?
       WHERE month=? AND EXISTS(SELECT 1 FROM debut_automation_control WHERE id='discovery' AND lease_owner=?)`,args:[LIMITS.external,LIMITS.dbReads,LIMITS.dbWrites,month,this.runId]},
    ]);
    return r[2].meta.changes===1;
  }
  async finish(status:string,summary:unknown){
    // 마감 기록은 조사 예산을 소진한 경우에도 남긴다. 최대 두 개의 PK 갱신만 수행한다.
    await this.db.batch([
      this.db.prepare('UPDATE debut_automation_runs SET status=?,finished_at=?,summary=? WHERE id=?').bind(status,new Date().toISOString(),JSON.stringify(summary),this.runId),
      this.db.prepare("UPDATE debut_automation_control SET lease_owner='',lease_until='' WHERE id='discovery' AND lease_owner=?").bind(this.runId),
    ]);
  }
  async saveSeed(seed:Seed,now:string):Promise<boolean>{
    const json=JSON.stringify(seed),hash=await sha256(seedHashInput(seed));
    const r=await this.execute(`INSERT INTO debut_automation_candidates(id,channel_key,source,seed,source_hash,first_seen_at,last_seen_at)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET seed=excluded.seed,source_hash=excluded.source_hash,last_seen_at=excluded.last_seen_at,
      status='QUEUED',next_check_at='' WHERE debut_automation_candidates.source_hash!=excluded.source_hash`,[seed.id,seed.channelKey,seed.source,json,hash,now,now]);
    return r.meta.changes===1;
  }
  async snapshot():Promise<Snapshot>{
    const legacyRows=await this.all<Legacy>(`SELECT i.slug,i.display_name,i.description,i.profile_image_url,i.agency_name,i.country_code,i.x_url,i.debut_date,i.debut_time,i.timezone,i.start_at_utc,c.platform,c.channel_url FROM streamerChannel_info i JOIN streamerChannel c ON c.id=i.channel_id WHERE i.slug IS NOT NULL AND i.slug!='' AND NOT (COALESCE(i.debut_time,'')='00:00' AND COALESCE(i.description,'')=COALESCE(i.display_name,'')||' 스트리머의 채널입니다.') ORDER BY i.id ASC LIMIT 2001`);
    const additions=await this.all<{data:string}>('SELECT data FROM portal_profiles LIMIT 2001');
    const pending=await this.all<{slug:string;platform:string;channel_url:string;payload_channels:string}>(`SELECT slug,json_extract(payload,'$.platform') AS platform,json_extract(payload,'$.channelUrl') AS channel_url,COALESCE(json_extract(payload,'$.additionalChannels'),'[]') AS payload_channels FROM portal_requests WHERE status='PENDING' LIMIT 501`);
    const pendingKeys=await this.all<{channel_key:string}>('SELECT channel_key FROM portal_pending_channels LIMIT 501');
    if(legacyRows.length>2000||additions.length>2000||pending.length>500||pendingKeys.length>500)throw new Error('REGISTRY_SNAPSHOT_LIMIT');
    const legacy=new Map(legacyRows.filter(r=>!isAnalyticsAutoRegisteredRow(r)).map(r=>[r.slug,r])), profiles=new Map<string,PortalProfile>(),channelSlugs=new Map<string,string>();
    const merge=(p:PortalProfile)=>{const key=portalChannelKey(p.channelUrl,p.platform),prior=channelSlugs.get(key);if(prior&&prior!==p.slug)profiles.delete(prior);profiles.set(p.slug,p);if(key)channelSlugs.set(key,p.slug);};
    for(const row of legacyRows)if(!isAnalyticsAutoRegisteredRow(row))merge(legacyProfile(row));
    const raw=new Map<string,string>();for(const row of additions){const p=JSON.parse(row.data) as PortalProfile;raw.set(p.slug,row.data);merge(p);}
    const keys=new Map<string,PortalProfile>();for(const p of profiles.values())for(const c of [{platform:p.platform,channelUrl:p.channelUrl},...(p.additionalChannels||[])]){const key=portalChannelKey(c.channelUrl,c.platform);if(key)keys.set(key,p);}
    const pk=new Set(pendingKeys.map(r=>r.channel_key)),ps=new Set<string>();
    for(const r of pending){if(r.slug)ps.add(r.slug);const key=portalChannelKey(r.channel_url||'',r.platform);if(key)pk.add(key);for(const c of JSON.parse(r.payload_channels||'[]')){const k=portalChannelKey(c.channelUrl||'',c.platform);if(k)pk.add(k);}}
    const managed=await this.all<{channel_key:string}>("SELECT channel_key FROM debut_automation_candidates WHERE managed_json!='' LIMIT 2001");
    const removed=new Set(managed.filter(c=>!keys.has(c.channel_key)).map(c=>c.channel_key));
    return {profiles:[...profiles.values()],raw,legacy,keys,pending:pk,pendingSlugs:ps,removed};
  }
  async mark(candidate:Candidate,status:string,reason:string,now:string,next:string,evidence:unknown={},imageHash=''){
    const merged={...JSON.parse(candidate.evidence||'{}'),...(evidence as Record<string,unknown>)};
    await this.execute(`UPDATE debut_automation_candidates SET status=?,reason=?,last_checked_at=?,next_check_at=?,evidence=?,image_hash=CASE WHEN ?!='' THEN ? ELSE image_hash END,
      failures=CASE WHEN ?='FAILED' THEN failures+1 ELSE 0 END WHERE id=?`,[status,reason,now,next,JSON.stringify(merged),imageHash,imageHash,status,candidate.id]);
  }
  async adopt(candidate:Candidate,profile:PortalProfile,raw:string){
    await this.execute("UPDATE debut_automation_candidates SET profile_slug=?,managed_json=? WHERE id=? AND managed_json=''",[profile.slug,raw,candidate.id]);
    candidate.profile_slug=profile.slug;candidate.managed_json=raw;
  }
  async publish(candidate:Candidate,profile:PortalProfile,previous:PortalProfile|null,snapshot:Snapshot,now:string):Promise<boolean>{
    const json=JSON.stringify(profile),key=portalChannelKey(profile.channelUrl,profile.platform),aliases=channelAliases(profile);
    if(candidate.channel_key!==key)throw new Error('CHANNEL_ID_MISMATCH');
    const placeholders=aliases.map(()=>'?').join(','),old=previous?snapshot.raw.get(previous.slug):undefined;
    const legacy=previous?snapshot.legacy.get(previous.slug):undefined;
    if(previous&&candidate.managed_json!==(old||JSON.stringify(previous)))throw new Error('OPERATOR_MODIFICATION_HOLD');
    const guardArgs:unknown[]=[this.runId,new Date().toISOString(),key,profile.slug];
    let guard=`EXISTS(SELECT 1 FROM debut_automation_control WHERE id='discovery' AND enabled=1 AND lease_owner=? AND lease_until>?)
      AND NOT EXISTS(SELECT 1 FROM portal_pending_channels WHERE channel_key=?)
      AND NOT EXISTS(SELECT 1 FROM portal_requests WHERE status='PENDING' AND (slug=?`;
    guard+=` OR json_extract(payload,'$.channelUrl') IN (${placeholders})))`;guardArgs.push(...aliases);
    guard+=` AND NOT EXISTS(SELECT 1 FROM portal_requests r,json_each(r.payload,'$.additionalChannels') a WHERE r.status='PENDING' AND json_extract(a.value,'$.channelUrl') IN (${placeholders}))`;guardArgs.push(...aliases);
    guard+=` AND NOT EXISTS(SELECT 1 FROM portal_profiles p,json_each(p.data,'$.additionalChannels') a WHERE p.slug!=? AND json_extract(a.value,'$.channelUrl') IN (${placeholders}))`;guardArgs.push(profile.slug,...aliases);
    guard+=` AND NOT EXISTS(SELECT 1 FROM debut_submissions WHERE status='PENDING' AND channel_url IN (${placeholders}))`;guardArgs.push(...aliases);
    if(old!==undefined){guard+=' AND EXISTS(SELECT 1 FROM portal_profiles WHERE slug=? AND data=?)';guardArgs.push(profile.slug,old);}
    else{
      guard+=' AND NOT EXISTS(SELECT 1 FROM portal_profiles WHERE slug=? OR channel_url IN ('+placeholders+'))';guardArgs.push(profile.slug,...aliases);
      if(legacy){const entries=Object.entries(legacy).filter(([k])=>!['platform','channel_url'].includes(k));guard+=` AND EXISTS(SELECT 1 FROM streamerChannel_info WHERE ${entries.map(([k])=>`${k} IS ?`).join(' AND ')})`;guardArgs.push(...entries.map(([,v])=>v));}
      else{guard+=` AND NOT EXISTS(SELECT 1 FROM streamerChannel_info WHERE slug=?) AND NOT EXISTS(SELECT 1 FROM streamerChannel_info i JOIN streamerChannel c ON c.id=i.channel_id WHERE c.channel_url IN (${placeholders}) AND NOT (i.debut_time='00:00' AND i.description=i.display_name||' 스트리머의 채널입니다.'))`;guardArgs.push(profile.slug,...aliases);}
    }
    guard+=' AND NOT EXISTS(SELECT 1 FROM portal_profile_channels WHERE (channel_key=? AND slug!=?) OR (slug=? AND channel_key!=?))';guardArgs.push(key,profile.slug,profile.slug,key);
    // 중간의 고유키 충돌은 D1 batch 전체를 취소한다. 일부 테이블만 공개된 상태는 남기지 않는다.
    const tokenSql="EXISTS(SELECT 1 FROM debut_automation_candidates WHERE id=? AND publish_token=?)";
    const r=await this.batch([
      {sql:`UPDATE debut_automation_candidates SET publish_token=? WHERE id=? AND source_hash=? AND ${guard}`,args:[this.runId,candidate.id,candidate.source_hash,...guardArgs]},
      {sql:`INSERT INTO portal_profile_channels(channel_key,slug) SELECT ?,? WHERE ${tokenSql} ON CONFLICT(channel_key) DO NOTHING`,args:[key,profile.slug,candidate.id,this.runId]},
      {sql:`INSERT INTO portal_profiles(slug,channel_url,data,updated_at) SELECT ?,?,?,? WHERE ${tokenSql} ON CONFLICT(slug) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`,args:[profile.slug,profile.channelUrl,json,now,candidate.id,this.runId]},
      {sql:`INSERT INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash,created_at) SELECT ?,?,?,?,?,?,? WHERE ${tokenSql}`,args:[crypto.randomUUID(),profile.slug,old||JSON.stringify(previous||{}),json,`공식 출처 자동 검증: ${candidate.id}`,`automation:${this.runId}`,now,candidate.id,this.runId]},
      // 다른 원천의 동일 채널 작업도, 이번 자동 변경 전 값과 정확히 같을 때만 기준값을 함께 옮긴다.
      {sql:`UPDATE debut_automation_candidates SET managed_json=? WHERE channel_key=? AND profile_slug=? AND managed_json=? AND ${tokenSql}`,args:[json,key,profile.slug,old||JSON.stringify(previous||{}),candidate.id,this.runId]},
      {sql:`UPDATE debut_automation_candidates SET managed_json=?,profile_slug=?,status='PUBLISHED_PENDING_CHECK',reason='',publish_token='' WHERE id=? AND publish_token=?`,args:[json,profile.slug,candidate.id,this.runId]},
    ]);
    if(r[0].meta.changes!==1)return false;
    snapshot.raw.set(profile.slug,json);snapshot.keys.set(key,profile);snapshot.profiles=snapshot.profiles.filter(p=>p.slug!==profile.slug).concat(profile);
    candidate.managed_json=json;candidate.profile_slug=profile.slug;return true;
  }
}
export function channelAliases(profile:Pick<PortalProfile,'platform'|'channelUrl'>):string[]{
  const key=portalChannelKey(profile.channelUrl,profile.platform),id=key.split(':')[1];
  if(profile.platform==='CHZZK')return [`https://chzzk.naver.com/${id}`,`https://chzzk.naver.com/live/${id}`];
  return ['www.sooplive.com/station/','ch.sooplive.co.kr/','www.sooplive.co.kr/station/','bj.afreecatv.com/','ch.sooplive.com/'].map(p=>`https://${p}${id}`);
}
