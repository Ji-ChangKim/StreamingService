import { addDays, nextRegularRun, type Mode, type Seed } from './policy';
import { sha256 } from './network';
import { DiscoveryStore, type Snapshot } from './store';
import { portalChannelKey } from '../../../shared/portal';
import { isPublicProfile } from '../../../shared/contentReview';

type Target={key:string;week:string};
// 주간 미완료 대상을 원천 캐시와 별도로 보관해 다음 일일 회차에서도 계속 처리한다.
export async function queueEnrichment(store:DiscoveryStore,snapshot:Snapshot,mode:Mode,today:string,now:string,backfill?:{from:string;to:string;at?:number}):Promise<number>{
  const rows=await store.all<{cached:string}>("SELECT cached FROM debut_automation_sources WHERE id='enrichment-targets'");
  const targets=new Map<string,Target>((rows.length?JSON.parse(rows[0].cached):[]).map((t:Target)=>[t.key,t]));
  if(['WEEKLY','DISCOVER','RECHECK'].includes(mode)){
    // 이전 월요일 표기와 일요일 표기가 같은 주를 중복 보강하던 기록만 정규화한다.
    const canonical="'profile:'||date(json_extract(evidence,'$.enrichmentWeek'),'-7 days')||':'||date(json_extract(evidence,'$.enrichmentWeek'),'-1 day')";
    await store.execute(`UPDATE debut_automation_candidates SET evidence=json_set(evidence,'$.enrichmentPending',CASE WHEN json_extract(evidence,'$.enrichmentCompletedWeek')=(${canonical}) THEN 0 ELSE 1 END,'$.enrichmentWeek',(${canonical})) WHERE json_extract(evidence,'$.enrichmentPending')=1 AND json_extract(evidence,'$.enrichmentWeek') GLOB '20??-??-??' AND date(json_extract(evidence,'$.enrichmentWeek')) IS NOT NULL`);
    await store.execute(`UPDATE debut_automation_candidates SET next_check_at=? WHERE next_check_at='' AND status IN ('UNCHANGED','PUBLIC_VERIFIED') AND json_extract(evidence,'$.enrichmentPending')=0 AND json_extract(evidence,'$.enrichmentCompletedWeek')=json_extract(evidence,'$.enrichmentWeek') AND json_extract(evidence,'$.enrichmentWeek') LIKE 'profile:%'`,[nextRegularRun(Date.parse(now))]);
    for(const target of targets.values())if(/^20\d{2}-\d{2}-\d{2}$/.test(target.week))target.week=`profile:${addDays(target.week,-7)}:${addDays(target.week,-1)}`;
  }
  const profiles=new Map(snapshot.profiles.map(p=>[portalChannelKey(p.channelUrl,p.platform),p]));
  const periodWeek=backfill?`${mode==='PROFILE'?'profile':'backfill'}:${backfill.from}:${backfill.to}`:mode==='WEEKLY'?`profile:${addDays(today,-7)}:${addDays(today,-1)}`:today;
  if(mode==='WEEKLY'||mode==='BACKFILL'||mode==='PROFILE')for(const [key,p]of profiles){
    const from=backfill?.from||addDays(today,-7),to=backfill?.to||addDays(today,-1),week=periodWeek;
    // 일요일 아침 이후 일정과 당일 시각 미정은 이미 데뷔한 대상으로 세지 않는다.
    if(mode==='PROFILE'&&(p.debutDate===today&&(!p.startAtUtc||!Number.isFinite(Date.parse(p.startAtUtc)))||p.startAtUtc&&Date.parse(p.startAtUtc)>(backfill?.at??Date.parse(now))))continue;
    if(key&&['SOOP','CHZZK'].includes(p.platform)&&isPublicProfile(p)&&['FIXED','TIME_TBD'].includes(p.dateState)&&p.debutDate>=from&&p.debutDate<=to)targets.set(key,{key,week});
  }
  if(!targets.size)return 0;
  const candidates=await store.all<{id:string;channel_key:string;source:string;seed:string;evidence:string}>("SELECT id,channel_key,source,seed,evidence FROM debut_automation_candidates LIMIT 2001");
  let queued=0,notQueued=0;
  for(const [key,target]of targets){
    if(mode==='PROFILE'&&target.week!==periodWeek)continue;
    const profile=profiles.get(key);if(!profile||!isPublicProfile(profile)||snapshot.removed.has(key)){targets.delete(key);continue;}
    const matching=candidates.filter(c=>c.channel_key===key);
    if(matching.some(c=>JSON.parse(c.evidence||'{}').enrichmentCompletedWeek===target.week)){targets.delete(key);continue;}
    if(mode!=='PROFILE'&&matching.some(c=>JSON.parse(c.evidence||'{}').enrichmentPending)){continue;}
    if(queued>=20||store.calls>100||store.writes>420){notQueued++;continue;}
    let selected=(mode==='PROFILE'?matching.find(c=>JSON.parse(c.evidence||'{}').enrichmentPending):undefined)||matching.find(c=>c.source==='REGISTERED')||matching.find(c=>c.source==='SOOP_CALENDAR'&&JSON.parse(c.seed).kind==='PLATFORM_DEBUT');
    if(!selected){
      // 이미 공개된 이적 채널도 제원 보강은 가능하다. 데뷔 종류·일정은 수정하지 않는다.
      const seed:Seed={id:`registered:${key}`,channelKey:key,platform:profile.platform as Seed['platform'],channelUrl:profile.channelUrl,name:profile.displayName,
        date:profile.debutDate,time:profile.debutTime,timezone:profile.timezone,kind:profile.debutKind||'FIRST_DEBUT',source:'REGISTERED',sourceUrl:profile.noticeUrl||profile.xUrl,
        primaryUrl:profile.noticeUrl||'',xUrl:profile.xUrl,scopeConfirmed:false};
      await store.saveSeed(seed,now);selected={id:seed.id,channel_key:key,source:seed.source,seed:JSON.stringify(seed),evidence:'{}'};
    }
    await store.execute("UPDATE debut_automation_candidates SET evidence=json_set(evidence,'$.enrichmentPending',1,'$.enrichmentWeek',?),next_check_at='' WHERE id=?",[target.week,selected.id]);queued++;
  }
  const cached=JSON.stringify([...targets.values()]);
  if(rows[0]?.cached!==cached)await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,last_success_at,cached,content_hash) VALUES('enrichment-targets','https://vdebut.live/','OK',?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET cached=excluded.cached,content_hash=excluded.content_hash,checked_at=excluded.checked_at,last_success_at=excluded.last_success_at`,[now,now,cached,await sha256(cached)]);
  return notQueued;
}
