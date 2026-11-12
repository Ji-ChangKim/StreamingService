import type { PortalProfile } from '../../../shared/portal';
import { portalChannelKey, portalDay, portalUtc } from '../../../shared/portal';
import { isPublicProfile, needsContentReview, reviewSnapshot, reviewedProfile } from '../../../shared/contentReview';
import { addDays, buildProfile, extractLabelledDetails, LIMITS, nextRegularRun, officialAuthorLink, parsePrimaryNotice, seedHashInput, validDay, windowFor, xMetadata, type Mode, type Seed } from './policy';
import { BudgetNetwork, sha256, verifyImage } from './network';
import { DiscoveryStore, type Candidate, type Snapshot } from './store';
import { collectSources, officialChannel, safeError, type SourceStatus } from './sources';
import { queueEnrichment } from './enrichment';
import { collectProfileEnrichment } from './profileEnrichment';

export type RunSummary={runId:string;mode:Mode;slot:string;range:ReturnType<typeof windowFor>;status:string;coverage:string;
  sources:SourceStatus[];discovered:number;discoveredCandidates:{name:string;channelKey:string;source:string;date:string;sourceUrl:string}[];sourceChanges:number;seedDeferred:number;enrichmentDeferred:number;checked:number;published:{name:string;slug:string;date:string;time:string;kind:string}[];
  updated:string[];unchanged:number;held:{id:string;reason:string}[];failed:{id:string;reason:string}[];remaining:number;
  externalRequests:number;downloadBytes:number;dbCalls:number;dbRowsRead:number;dbRowsWritten:number;publicVerified:boolean;errors:string[]};

// 기존에 승인한 원문은 일정 변경 확인의 출발점이다. 이 목록 자체로 새 인물을 승인하지 않는다.
const KNOWN_NOTICES:Record<string,string>={
  'CHZZK:037d7ba305538de29dbf2789071dbb82':'https://x.com/_amyangyang/status/2119427989998108786',
  'CHZZK:7795f5c37a5941cc20f44f5ee2744cd8':'https://x.com/leopyaco/status/2117611502249312379',
  'CHZZK:bce5bac086baed274db13a2c9aacd41b':'https://x.com/huto00q/status/2118989751785226662',
};
function registeredSeeds(snapshot:Snapshot,seen:Set<string>,from:string,to:string):Seed[]{
  return snapshot.profiles.filter(p=>['CHZZK','SOOP'].includes(p.platform)&&p.dateState==='FIXED'&&p.debutDate>=from&&p.debutDate<=to).flatMap(p=>{
    const key=portalChannelKey(p.channelUrl,p.platform);
    if(!key||seen.has(key))return [];
    return [{id:`registered:${key}`,channelKey:key,platform:p.platform as Seed['platform'],channelUrl:p.channelUrl,name:p.displayName,date:p.debutDate,time:p.debutTime,timezone:p.timezone,
      kind:p.debutKind||'FIRST_DEBUT',source:'REGISTERED',sourceUrl:p.noticeUrl||KNOWN_NOTICES[key]||p.xUrl,primaryUrl:p.noticeUrl||KNOWN_NOTICES[key]||'',xUrl:p.xUrl,scopeConfirmed:false} satisfies Seed];
  });
}
function aligned(profile:PortalProfile,seed:Seed,name:string,image:string):boolean{
  return profile.displayName===name&&profile.avatarUrl===image&&profile.debutDate===seed.date&&profile.debutTime===seed.time&&profile.timezone===seed.timezone&&profile.dateState==='FIXED';
}
// 앞서 확인한 KST 원문은 본문의 날짜·시각이 유지된 경우에만 재확인 근거로 쓴다.
export function confirmsRegisteredNotice(html:string,seed:Seed):boolean{
  const {text,title}=xMetadata(html),author=seed.primaryUrl.match(/x\.com\/([\w]+)\/status\//)?.[1];
  if(!author||!title.toLowerCase().includes(`@${author.toLowerCase()}`)||!text||/(취소|연기|해외|시차)/.test(text))return false;
  const month=Number(seed.date.slice(5,7)),day=Number(seed.date.slice(8,10)),hour=Number(seed.time.slice(0,2)),minute=seed.time.slice(3);
  const date=new RegExp(`(?:^|[^0-9])0?${month}\\s*[월./-]\\s*0?${day}(?:일|[^0-9]|$)`);
  const match=date.exec(text);if(!match||!/(첫\s*방송|데뷔)/.test(text))return false;
  const following=text.slice(match.index+match[0].length,match.index+match[0].length+100);
  const time=following.match(/(?:(오전|오후|AM|PM)\s*)?(\d{1,2})(?:\s*:\s*(\d{2})|\s*시(?:\s*(\d{1,2})\s*분)?)/i);
  if(!time||/\d{1,2}\s*[월./-]\s*\d{1,2}/.test(following.slice(0,time.index)))return false;
  let actualHour=Number(time[2]);if(time[1]){if(actualHour<1||actualHour>12)return false;actualHour=actualHour%12+(/오후|PM/i.test(time[1])?12:0);}
  return actualHour===hour&&(time[3]||time[4]||'00').padStart(2,'0')===minute;
}
async function validateSeed(net:BudgetNetwork,seed:Seed,existing:PortalProfile|undefined,sourceOk:boolean):Promise<Seed>{
  if(seed.source==='SOOP_CALENDAR'){
    if(!sourceOk)throw new Error('SOURCE_NOT_FRESH');
    if(seed.kind!=='PLATFORM_DEBUT')throw new Error('EVENT_SCOPE_HOLD');return seed;
  }
  if(!seed.primaryUrl)throw new Error('PRIMARY_NOTICE_REQUIRED');
  const r=await net.get(seed.primaryUrl);if(r.status!==200)throw new Error(`PRIMARY_HTTP_${r.status}`);
  const parsed=parsePrimaryNotice(r.text,seed.primaryUrl);
  if(parsed&&parsed.channelKey===seed.channelKey)return {...parsed,id:seed.id,sourceUrl:seed.sourceUrl};
  if(existing&&seed.source==='REGISTERED'&&isPublicProfile(existing)&&KNOWN_NOTICES[seed.channelKey]===seed.primaryUrl&&confirmsRegisteredNotice(r.text,seed))return {...seed,scopeConfirmed:true};
  throw new Error('PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD');
}
async function checkCandidate(store:DiscoveryStore,net:BudgetNetwork,candidate:Candidate,snapshot:Snapshot,summary:RunSummary,now:string,freshIds:Set<string>){
  let seed=JSON.parse(candidate.seed) as Seed;
  const priorEvidence=JSON.parse(candidate.evidence||'{}'),wantsEnrichment=Boolean(priorEvidence.enrichmentPending);
  if(seed.source==='AGENCY_NOTICE')throw new Error('AGENCY_FIRST_ACTIVITY_SCOPE_OR_TIMEZONE_HOLD');
  const existing=snapshot.keys.get(seed.channelKey);
  const freshSoop=seed.source==='SOOP_CALENDAR'&&freshIds.has(seed.id)&&seed.kind==='PLATFORM_DEBUT';
  const enrichmentOnly=wantsEnrichment&&!!existing&&isPublicProfile(existing)&&!freshSoop;
  if(snapshot.removed.has(seed.channelKey)||(candidate.managed_json&&!existing))throw new Error('OPERATOR_REMOVAL_HOLD');
  if(existing&&portalChannelKey(existing.channelUrl,existing.platform)!==seed.channelKey)throw new Error('SECONDARY_CHANNEL_REVIEW_HOLD');
  if(snapshot.pending.has(seed.channelKey)||(existing&&snapshot.pendingSlugs.has(existing.slug)))throw new Error('PENDING_OR_OPERATOR_CONFLICT');
  if(seed.date>addDays(summary.range.today,30))throw new Error('LONG_RANGE_CANDIDATE_ONLY');
  if(!enrichmentOnly&&seed.source==='SOOP_CALENDAR'&&seed.kind!=='PLATFORM_DEBUT')throw new Error('EVENT_SCOPE_HOLD');
  if(!enrichmentOnly&&seed.source==='SOOP_CALENDAR'&&!freshIds.has(seed.id))throw new Error('OFFICIAL_SCHEDULE_NOT_PRESENT_NO_DELETE');
  const channel=await officialChannel(net,seed);
  if(needsContentReview(`${channel.name}\n${channel.bio}`))throw new Error('CONTENT_REVIEW_HOLD');
  const imageHash=await verifyImage(net,channel.image);
  // 이미 공개된 전주 대상의 빈 제원만 보강하는 경우에는 데뷔 일정을 새로 확정하지 않는다.
  seed=enrichmentOnly?{...seed,scopeConfirmed:true}:await validateSeed(net,seed,existing,summary.sources.some(s=>s.id.startsWith('soop-calendar')&&s.status==='OK'));
  if(seed.source==='X_NOTICE'&&KNOWN_NOTICES[seed.channelKey]!==seed.primaryUrl&&!officialAuthorLink(channel.bio,seed.xUrl||''))throw new Error('OFFICIAL_AUTHOR_RELATIONSHIP_HOLD');
  const enrichment=wantsEnrichment?await collectProfileEnrichment(net,seed,channel):null;
  const evidence={channel:channel.apiUrl,notice:seed.primaryUrl,verifiedAt:now,scope:seed.kind,scheduleReconfirmed:!enrichmentOnly,
    ...(wantsEnrichment?{detailsSource:channel.apiUrl,fieldEvidence:enrichment?.evidence,detailConflicts:enrichment?.conflicts,enrichmentPending:false,enrichmentCompletedWeek:priorEvidence.enrichmentWeek||summary.range.today}:{}),imagePolicy:'OFFICIAL_CDN_RASTER_AND_TEXT_SCREEN'};
  let fresh=enrichmentOnly&&existing?existing:buildProfile(seed,channel.name,channel.image,now);
  if(!existing){const details=extractLabelledDetails(channel.bio);if(Object.keys(details).length)fresh=reviewedProfile({...fresh,details},'APPROVED',now);}
  let profile:PortalProfile=fresh;
  if(existing){
    profile=enrichmentOnly?{...existing}:{...existing,displayName:channel.name,avatarUrl:channel.image,countryCode:existing.countryCode||fresh.countryCode,debutDate:seed.date,debutTime:seed.time,timezone:seed.timezone,startAtUtc:portalUtc(seed.date,seed.time,seed.timezone),targetMonth:seed.date.slice(0,7),dateState:'FIXED',debutKind:seed.kind as PortalProfile['debutKind']};
    profile.slug=existing.slug;
    if(enrichmentOnly)profile.debutKind=existing.debutKind;
    const original=snapshot.raw.get(existing.slug)||JSON.stringify(existing);
    if(!candidate.managed_json){
      if(!enrichmentOnly&&!aligned(existing,seed,channel.name,channel.image))throw new Error('EXISTING_INFORMATION_CONFLICT_HOLD');
      if(!isPublicProfile(existing))throw new Error('EXISTING_REVIEW_HOLD');
      await store.adopt(candidate,existing,original);
    }else if(candidate.managed_json!==original)throw new Error('OPERATOR_MODIFICATION_HOLD');
    if(wantsEnrichment){
      const details=enrichment?.details||extractLabelledDetails(channel.bio),merged={...existing.details};
      for(const [key,value]of Object.entries(details))if(!merged[key as keyof typeof merged])merged[key as keyof typeof merged]=value;
      if(Object.keys(merged).length)profile.details=merged;
      if(!existing.regularSchedule&&enrichment?.regularSchedule)profile.regularSchedule=enrichment.regularSchedule;
    }
    if(reviewSnapshot(existing)===reviewSnapshot(profile)){
      summary.unchanged++;
      const retryPublicCheck=candidate.status==='PUBLISHED_PENDING_CHECK';
      if(retryPublicCheck)summary.updated.push(existing.slug);
      await store.mark(candidate,retryPublicCheck?'PUBLISHED_PENDING_CHECK':'UNCHANGED','',now,nextRegularRun(Date.parse(now)),evidence,imageHash);
      return;
    }
    profile=reviewedProfile(profile,'APPROVED',now);
    if(!isPublicProfile(profile))throw new Error('PUBLIC_POLICY_HOLD');
  }
  if(!await store.publish(candidate,profile,existing||null,snapshot,now))throw new Error('CONCURRENT_CHANGE_OR_PENDING_HOLD');
  if(existing)summary.updated.push(profile.slug);else summary.published.push({name:profile.displayName,slug:profile.slug,date:profile.debutDate,time:profile.debutTime,kind:profile.debutKind||'FIRST_DEBUT'});
  await store.mark(candidate,'PUBLISHED_PENDING_CHECK','',now,nextRegularRun(Date.parse(now)),evidence,imageHash);
}
async function collectNotices(store:DiscoveryStore,net:BudgetNetwork,summary:RunSummary,now:string,knownChannels:Set<string>){
  const notices=await store.all<{url:string}>(`SELECT url FROM debut_automation_notices WHERE next_check_at<=? ORDER BY checked_at,first_seen_at,CAST(substr(url,instr(url,'/status/')+8) AS INTEGER) DESC LIMIT 2`,[now]);
  for(const notice of notices){
    try{
      const r=await net.get(notice.url);if(r.status!==200)throw new Error(`PRIMARY_HTTP_${r.status}`);
      const seed=parsePrimaryNotice(r.text,notice.url);
      const inRange=seed&&seed.date>=summary.range.from&&seed.date<=summary.range.to;
      if(inRange&&await store.saveSeed(seed,now)&&!knownChannels.has(seed.channelKey)){
        knownChannels.add(seed.channelKey);summary.discovered++;summary.discoveredCandidates.push({name:seed.name,channelKey:seed.channelKey,source:seed.source,date:seed.date,sourceUrl:seed.sourceUrl});
      }
      await store.execute('UPDATE debut_automation_notices SET checked_at=?,next_check_at=?,status=?,reason=? WHERE url=?',[now,new Date(Date.parse(now)+7*86400000).toISOString(),inRange?'PARSED':'HOLD',inRange?'':'PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD',notice.url]);
    }catch(error){summary.failed.push({id:notice.url,reason:safeError(error)});await store.execute("UPDATE debut_automation_notices SET checked_at=?,next_check_at=?,status='FAILED',reason=? WHERE url=?",[now,new Date(Date.parse(now)+12*3600000).toISOString(),safeError(error),notice.url]);}
  }
}
async function verifyPublic(env:DiscoveryEnv,summary:RunSummary,snapshot:Snapshot){
  const slugs=[...summary.published.map(p=>p.slug),...summary.updated];if(!slugs.length)return;
  // 내부 연결을 사용해 공개 경로를 검증한다. 영상·방송 상태를 불러오는 상세 API는 호출하지 않는다.
  const request=new Request('https://vdebut.live/api/v1/portal/profiles?version=3',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
  const response=await env.SITE.fetch(request);if(!response.ok)throw new Error('PUBLIC_PROFILE_HTTP_FAILURE');
  const text=await readPublicBody(response),payload=JSON.parse(text) as {profiles:PortalProfile[]};
  if(!Array.isArray(payload.profiles))throw new Error('PUBLIC_PROFILE_SCHEMA_FAILURE');
  const eventResponse=await env.SITE.fetch(new Request('https://vdebut.live/api/v1/events',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)}));
  if(!eventResponse.ok)throw new Error('PUBLIC_CALENDAR_HTTP_FAILURE');
  const eventPayload=JSON.parse(await readPublicBody(eventResponse)) as {success:boolean;events:{creator:{slug:string};type:string;startAtUtc:string;links:{url:string}[]}[]};
  const events=eventPayload.events;
  if(!eventPayload.success||!Array.isArray(events))throw new Error('PUBLIC_CALENDAR_SCHEMA_FAILURE');
  for(const slug of slugs){
    const wanted=snapshot.profiles.find(p=>p.slug===slug),actual=payload.profiles.find(p=>p.slug===slug),event=events.find(e=>e.creator.slug===slug);
    if(!wanted||!actual||reviewSnapshot(wanted)!==reviewSnapshot(actual)||!event||event.type!==(wanted.debutKind||'FIRST_DEBUT')||event.startAtUtc!==wanted.startAtUtc||!event.links.some(l=>l.url===wanted.channelUrl)||portalDay(actual,wanted.timezone)!==wanted.debutDate||portalDay(actual,'Asia/Seoul')!==portalDay(wanted,'Asia/Seoul')||actual.countryCode!==wanted.countryCode)throw new Error('PUBLIC_PROFILE_CALENDAR_MISMATCH');
  }
  summary.publicVerified=true;
}
async function readPublicBody(response:Response):Promise<string>{
  const reader=response.body?.getReader();if(!reader)throw new Error('PUBLIC_BODY_EMPTY');let bytes=0,text='';const decoder=new TextDecoder();
  try{for(;;){const r=await reader.read();if(r.done)break;bytes+=r.value.byteLength;if(bytes>4*1024*1024){await reader.cancel();throw new Error('PUBLIC_BODY_LIMIT');}text+=decoder.decode(r.value,{stream:true});}return text+decoder.decode();}finally{reader.releaseLock();}
}
export async function runDiscovery(env:DiscoveryEnv,mode:Mode,scheduledTime:number,slot:string,fetcher:typeof fetch=fetch):Promise<RunSummary|null>{
  const started=Date.now(),now=new Date(started).toISOString(),range=windowFor(scheduledTime,mode),runId=crypto.randomUUID();
  const backfill=mode==='BACKFILL'?{from:env.BACKFILL_FROM,to:env.BACKFILL_TO}:undefined;
  if(backfill){if(!validDay(backfill.from)||!validDay(backfill.to)||backfill.from>backfill.to||backfill.to>range.today||Date.parse(backfill.to)-Date.parse(backfill.from)>31*86400000)throw new Error('INVALID_BACKFILL_RANGE');Object.assign(range,backfill);}
  const store=new DiscoveryStore(env.DB,runId);
  if(!await store.begin(slot,range.today.slice(0,7),mode,now))return null;
  const net=new BudgetNetwork(started+LIMITS.wallMs-45000,fetcher);
  const summary:RunSummary={runId,mode,slot,range,status:'RUNNING',coverage:'LIMITED_PUBLIC_SOURCES',sources:[],discovered:0,discoveredCandidates:[],sourceChanges:0,seedDeferred:0,enrichmentDeferred:0,checked:0,published:[],updated:[],unchanged:0,held:[],failed:[],remaining:0,externalRequests:0,downloadBytes:0,dbCalls:0,dbRowsRead:0,dbRowsWritten:0,publicVerified:false,errors:[]};
  try{
    const {seeds,sources}=backfill?{seeds:[] as Seed[],sources:[{id:'registered-enrichment',status:'OK',count:0,reason:''}]}:await collectSources(store,net,range.from,range.to,now);summary.sources=sources;
    const snapshot=await store.snapshot(),seen=new Set(seeds.filter(s=>s.source==='SOOP_CALENDAR').map(s=>s.channelKey));
    for(const seed of seeds)if(seed.kind==='PLATFORM_DEBUT'&&seeds.some(other=>other.id!==seed.id&&other.channelKey===seed.channelKey&&other.kind===seed.kind&&(other.date!==seed.date||other.time!==seed.time)))snapshot.pending.add(seed.channelKey);
    const existingRows=await store.all<{id:string;source_hash:string;channel_key:string}>('SELECT id,source_hash,channel_key FROM debut_automation_candidates LIMIT 2001');
    const existingHashes=new Map(existingRows.map(c=>[c.id,c.source_hash])),existingIds=new Set(existingHashes.keys());
    const knownChannels=new Set([...existingRows.map(c=>c.channel_key),...snapshot.keys.keys(),...snapshot.pending]);
    if(existingIds.size>2000)throw new Error('CANDIDATE_STORAGE_LIMIT');
    const wideCaches=backfill?[]:await store.all<{cached:string}>("SELECT cached FROM debut_automation_sources WHERE id IN ('soop-calendar-wide','community-sheet-wide') AND status='OK' AND checked_at>=?",[new Date(started-8*86400000).toISOString()]);
    const allSeeds=new Map((backfill?[]:[...seeds,...registeredSeeds(snapshot,seen,mode==='WEEKLY'?addDays(range.today,-7):range.today,addDays(range.today,3))]).map(s=>[s.id,s]));
    for(const row of wideCaches)for(const s of JSON.parse(row.cached) as Seed[])if(!allSeeds.has(s.id))allSeeds.set(s.id,s);
    for(const seed of allSeeds.values()){
      if(existingHashes.get(seed.id)===await sha256(seedHashInput(seed)))continue;
      if(store.calls>LIMITS.dbCalls-110||store.writes>LIMITS.dbWrites-220){summary.seedDeferred++;continue;}
      if(await store.saveSeed(seed,now)){
        if(existingIds.has(seed.id))summary.sourceChanges++;
        else if(!knownChannels.has(seed.channelKey)){knownChannels.add(seed.channelKey);summary.discovered++;summary.discoveredCandidates.push({name:seed.name,channelKey:seed.channelKey,source:seed.source,date:seed.date,sourceUrl:seed.sourceUrl});}
        if(seed.source==='AGENCY_NOTICE'&&!seed.date){await store.execute("UPDATE debut_automation_candidates SET status='HOLD',reason='AGENCY_YEAR_SCOPE_TIMEZONE_HOLD' WHERE id=?",[seed.id]);summary.held.push({id:seed.id,reason:'AGENCY_YEAR_SCOPE_TIMEZONE_HOLD'});}
      }
    }
    summary.enrichmentDeferred=await queueEnrichment(store,snapshot,mode,range.today,now,backfill);
    // 직전 회차에서 남긴 후보도 같은 대기열에서 이어서 처리한다.
    const candidates=await store.all<Candidate>(`SELECT * FROM debut_automation_candidates WHERE (next_check_at<=? OR reason IN ('SOURCE_OR_PARSE_ERROR','FETCH_INVOCATION_ERROR','SOURCE_TYPE_ERROR') OR (?='SMOKE' AND reason IN ('SOURCE_HTTP_404','SOURCE_HTTP_502','IMAGE_HOST_HOLD'))) AND (json_extract(seed,'$.date') BETWEEN ? AND ? OR json_extract(evidence,'$.enrichmentPending')=1)
      AND (?!='BACKFILL' OR (json_extract(evidence,'$.enrichmentPending')=1 AND json_extract(evidence,'$.enrichmentWeek')=?))
      ORDER BY CASE WHEN json_extract(seed,'$.date') BETWEEN ? AND ? THEN 0
        WHEN json_extract(evidence,'$.enrichmentPending')=1 OR (?='WEEKLY' AND json_extract(seed,'$.date') BETWEEN ? AND ?) THEN 1 ELSE 2 END,
        last_checked_at,CASE WHEN managed_json='' THEN 0 ELSE 1 END,json_extract(seed,'$.date'),id LIMIT ?`,[now,mode,range.from,range.to,mode,`backfill:${range.from}:${range.to}`,range.today,addDays(range.today,3),mode,addDays(range.today,-7),addDays(range.today,-1),mode==='WEEKLY'?LIMITS.weeklyProfiles:LIMITS.candidates]);
    for(const candidate of candidates){
      const changed=summary.published.length+summary.updated.length;
      if(net.requests>LIMITS.external-3||Date.now()>started+LIMITS.wallMs-45000||store.calls+changed+14>LIMITS.dbCalls||store.writes+changed*4+120>LIMITS.dbWrites||store.reads>20000){summary.errors.push('DETAIL_BUDGET_DEFERRED');break;}
      summary.checked++;
      try{await checkCandidate(store,net,candidate,snapshot,summary,now,new Set(seeds.filter(s=>s.source==='SOOP_CALENDAR').map(s=>s.id)));}catch(error){
        const reason=safeError(error);
        if(/BUDGET/.test(reason)){summary.errors.push(reason);break;}
        const failure=!/HOLD|REQUIRED|NO_DELETE|CANDIDATE_ONLY|PENDING_OR_OPERATOR_CONFLICT/.test(reason);
        (failure?summary.failed:summary.held).push({id:candidate.id,reason});
        await store.mark(candidate,failure?'FAILED':'HOLD',reason,now,nextRegularRun(Date.parse(now)+(candidate.failures>=2?12*3600000:0)));
      }
    }
    if(!backfill&&net.requests<LIMITS.external-2&&Date.now()<started+LIMITS.wallMs-55000)await collectNotices(store,net,summary,now,knownChannels);
    const pending=await store.all<{count:number}>(`SELECT COUNT(*) AS count FROM debut_automation_candidates WHERE next_check_at<=? AND (json_extract(seed,'$.date') BETWEEN ? AND ? OR json_extract(evidence,'$.enrichmentPending')=1)
      AND (?!='BACKFILL' OR (json_extract(evidence,'$.enrichmentPending')=1 AND json_extract(evidence,'$.enrichmentWeek')=?))`,[now,range.from,range.to,mode,`backfill:${range.from}:${range.to}`]);summary.remaining=pending[0]?.count||0;
    await verifyPublic(env,summary,snapshot);
    for(const slug of [...summary.published.map(p=>p.slug),...summary.updated])await store.execute("UPDATE debut_automation_candidates SET status='PUBLIC_VERIFIED' WHERE profile_slug=? AND status='PUBLISHED_PENDING_CHECK'",[slug]);
    summary.status=summary.sources.some(s=>s.status==='FAILED'||s.status==='BACKOFF')||summary.failed.length||summary.remaining||summary.seedDeferred||summary.enrichmentDeferred||summary.errors.length?'PARTIAL':summary.held.length?'COMPLETED_WITH_HOLDS':'COMPLETED';
    // 조사 원본 HTML은 보관하지 않으며, 실행 기록은 90일 뒤 소량씩 정리한다.
    await store.execute("DELETE FROM debut_automation_runs WHERE slot IN (SELECT slot FROM debut_automation_runs WHERE started_at<? LIMIT 10)",[new Date(started-90*86400000).toISOString()]);
    // 삭제·이름 변경으로 연결이 끊긴 자동 관리 기록은 운영자 의도 보호용으로 남긴다.
    await store.execute("DELETE FROM debut_automation_candidates WHERE id IN (SELECT id FROM debut_automation_candidates c WHERE COALESCE(NULLIF(json_extract(seed,'$.date'),''),substr(first_seen_at,1,10))<? AND status!='PUBLISHED_PENDING_CHECK' AND NOT (managed_json!='' AND NOT EXISTS(SELECT 1 FROM portal_profiles p WHERE p.slug=c.profile_slug) AND NOT EXISTS(SELECT 1 FROM streamerChannel_info i WHERE i.slug=c.profile_slug)) LIMIT 10)",[addDays(range.today,-180)]);
  }catch(error){summary.errors.push(safeError(error));summary.status='FAILED';}
  finally{
    Object.assign(summary,{externalRequests:net.requests,downloadBytes:net.bytes,dbCalls:store.calls,dbRowsRead:store.reads,dbRowsWritten:store.writes});
    await store.finish(summary.status,summary);
    console.log(JSON.stringify({event:'debut-discovery',...summary}));
  }
  return summary;
}
