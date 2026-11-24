import type { PortalProfile } from '../../../shared/portal';
import { portalChannelKey, portalDay, portalUtc } from '../../../shared/portal';
import { isPublicProfile, needsContentReview, reviewSnapshot, reviewedProfile } from '../../../shared/contentReview';
import { addDays, buildProfile, extractLabelledDetails, kstDay, LIMITS, nextRegularRun, officialAuthorLink, parsePrimaryNotice, seedHashInput, validDay, windowFor, xMetadata, type Mode, type Seed } from './policy';
import { BudgetNetwork, sha256, verifyImage } from './network';
import { DiscoveryStore, type Candidate, type Snapshot } from './store';
import { collectSources, officialChannel, safeError, type SourceStatus } from './sources';
import { queueEnrichment } from './enrichment';
import { collectProfileEnrichment } from './profileEnrichment';
import { CsvLedger, type CsvPublication } from './csvLedger';
import { searchWeb } from './webSearch';
import { searchTavily } from './tavilyDiscovery';
import { agencyNoticeEntries } from './agency';
import { canonicalChannel, noticeLinks } from './policy';

export type RunSummary={runId:string;mode:Mode;slot:string;range:ReturnType<typeof windowFor>;status:string;coverage:string;
  sources:SourceStatus[];discovered:number;discoveredCandidates:{name:string;channelKey:string;source:string;date:string;sourceUrl:string}[];sourceChanges:number;seedDeferred:number;enrichmentDeferred:number;checked:number;published:{name:string;slug:string;date:string;time:string;kind:string}[];
  updated:string[];unchanged:number;held:{id:string;reason:string}[];failed:{id:string;reason:string}[];remaining:number;
  externalRequests:number;downloadBytes:number;dbCalls:number;dbRowsRead:number;dbRowsWritten:number;publicVerified:boolean;errors:string[];
  reconfirmed:string[];allocations:Record<string,{limit:number;used:number}>;csvBytesWritten:number};

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
  if(new URL(seed.primaryUrl).hostname==='www.charonuniverse.com'){
    const {title,text}=xMetadata(r.text);
    const entry=agencyNoticeEntries(r.text).find(e=>e.name===seed.name&&e.date===seed.date&&e.time===seed.time);
    if(entry&&/(KST|한국\s*시간|서울\s*시간)/i.test(text)&&/(생애\s*첫|첫\s*버[튜츄]버\s*데뷔|신인\s*버[튜츄]버.{0,15}데뷔)/.test(`${title}\n${text}`)){
      const url=entry.link.startsWith('https://ch.ci/')?await net.resolveChannel(entry.link):entry.link;
      if(canonicalChannel(url)?.key===seed.channelKey)return {...seed,kind:'FIRST_DEBUT',timezone:'Asia/Seoul',scopeConfirmed:true};
    }
    throw new Error('PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD');
  }
  const parsed=parsePrimaryNotice(r.text,seed.primaryUrl);
  if(parsed&&parsed.channelKey===seed.channelKey)return {...parsed,id:seed.id,sourceUrl:seed.sourceUrl};
  if(existing&&seed.source==='REGISTERED'&&isPublicProfile(existing)&&KNOWN_NOTICES[seed.channelKey]===seed.primaryUrl&&confirmsRegisteredNotice(r.text,seed))return {...seed,scopeConfirmed:true};
  throw new Error('PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD');
}
async function checkCandidate(store:DiscoveryStore,net:BudgetNetwork,candidate:Candidate,snapshot:Snapshot,summary:RunSummary,now:string,freshIds:Set<string>,ledger:CsvLedger,publications:CsvPublication[]){
  let seed=JSON.parse(candidate.seed) as Seed;
  const priorEvidence=JSON.parse(candidate.evidence||'{}'),wantsEnrichment=Boolean(priorEvidence.enrichmentPending);
  const existing=snapshot.keys.get(seed.channelKey);
  const freshSoop=seed.source==='SOOP_CALENDAR'&&freshIds.has(seed.id)&&seed.kind==='PLATFORM_DEBUT';
  const enrichmentOnly=wantsEnrichment&&!!existing&&isPublicProfile(existing)&&!freshSoop;
  if(snapshot.removed.has(seed.channelKey)||(candidate.managed_json&&!existing))throw new Error('OPERATOR_REMOVAL_HOLD');
  if(existing&&portalChannelKey(existing.channelUrl,existing.platform)!==seed.channelKey)throw new Error('SECONDARY_CHANNEL_REVIEW_HOLD');
  if(snapshot.pending.has(seed.channelKey)||(existing&&snapshot.pendingSlugs.has(existing.slug)))throw new Error('PENDING_OR_OPERATOR_CONFLICT');
  if(existing&&candidate.managed_json&&candidate.managed_json!==(snapshot.raw.get(existing.slug)||JSON.stringify(existing)))throw new Error('OPERATOR_MODIFICATION_HOLD');
  if(seed.date>addDays(summary.range.today,30))throw new Error('LONG_RANGE_CANDIDATE_ONLY');
  if(!enrichmentOnly&&seed.source==='SOOP_CALENDAR'&&seed.kind!=='PLATFORM_DEBUT')throw new Error('EVENT_SCOPE_HOLD');
  if(!enrichmentOnly&&seed.source==='SOOP_CALENDAR'&&!freshIds.has(seed.id))throw new Error('OFFICIAL_SCHEDULE_NOT_PRESENT_NO_DELETE');
  // 원문이 없는 후보는 채널·이미지 조회비를 쓰기 전에 보류한다.
  seed=enrichmentOnly?{...seed,scopeConfirmed:true}:await validateSeed(net,seed,existing,summary.sources.some(s=>s.id.startsWith('soop-calendar')&&s.status==='OK'));
  const channel=await officialChannel(net,seed);
  if(needsContentReview(`${channel.name}\n${channel.bio}`))throw new Error('CONTENT_REVIEW_HOLD');
  // 제원 보완에서는 기존 승인 이미지를 바꾸지 않는다. 큰 원본을 다시 받느라 텍스트 조사가 막히지 않게 한다.
  let imageHash='';
  const sameApprovedImage=existing&&isPublicProfile(existing)&&(enrichmentOnly||existing.avatarUrl===channel.image);
  if(sameApprovedImage)await net.approvedImageHeaders(existing.avatarUrl);
  else imageHash=await verifyImage(net,channel.image);
  // 이미 공개된 전주 대상의 빈 제원만 보강하는 경우에는 데뷔 일정을 새로 확정하지 않는다.
  if(seed.source==='X_NOTICE'&&KNOWN_NOTICES[seed.channelKey]!==seed.primaryUrl&&!officialAuthorLink(channel.bio,seed.xUrl||''))throw new Error('OFFICIAL_AUTHOR_RELATIONSHIP_HOLD');
  const enrichment=wantsEnrichment?await collectProfileEnrichment(net,seed,channel):null;
  const evidence={channel:channel.apiUrl,notice:seed.primaryUrl,verifiedAt:now,scope:seed.kind,scheduleReconfirmed:!enrichmentOnly,
    ...(wantsEnrichment?{detailsSource:channel.apiUrl,fieldEvidence:enrichment?.evidence,detailConflicts:enrichment?.conflicts,enrichmentPending:false,enrichmentCompletedWeek:priorEvidence.enrichmentWeek||summary.range.today}:{}),imagePolicy:sameApprovedImage?'EXISTING_APPROVED_IMAGE_UNCHANGED_HTTP_CHECK':'OFFICIAL_CDN_RASTER_AND_TEXT_SCREEN'};
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
      // 변경 없는 공개 정보는 영수증·CSV 묶음을 매번 재작성하지 않는다. 실패한 이전 반영은 recoverPending이 복구한다.
      summary.reconfirmed.push(existing.slug);
      const retryPublicCheck=candidate.status==='PUBLISHED_PENDING_CHECK';
      await store.mark(candidate,retryPublicCheck?'PUBLISHED_PENDING_CHECK':'UNCHANGED','',now,nextRegularRun(Date.parse(now)),evidence,imageHash);
      return;
    }
    profile=reviewedProfile(profile,'APPROVED',now);
    if(!isPublicProfile(profile))throw new Error('PUBLIC_POLICY_HOLD');
  }
  const prepared=await ledger.prepare(candidate,profile,existing||null,enrichment?.evidence||[]);
  profile=prepared.profile;
  if(!await store.publish(candidate,profile,existing||null,snapshot,now))throw new Error('CONCURRENT_CHANGE_OR_PENDING_HOLD');
  publications.push(prepared);
  if(existing)summary.updated.push(profile.slug);else summary.published.push({name:profile.displayName,slug:profile.slug,date:profile.debutDate,time:profile.debutTime,kind:profile.debutKind||'FIRST_DEBUT'});
  await store.mark(candidate,'PUBLISHED_PENDING_CHECK','',now,nextRegularRun(Date.parse(now)),evidence,imageHash);
}
async function collectNotices(store:DiscoveryStore,net:BudgetNetwork,summary:RunSummary,now:string,knownChannels:Set<string>,ledger:CsvLedger){
  const fresh=await store.all<{url:string}>("SELECT url FROM debut_automation_notices WHERE next_check_at<=? AND source_url LIKE 'tavily:%' ORDER BY first_seen_at DESC,checked_at LIMIT 1",[now]);
  const older=await store.all<{url:string}>("SELECT url FROM debut_automation_notices WHERE next_check_at<=? AND url!=? ORDER BY checked_at,first_seen_at LIMIT ?",[now,fresh[0]?.url||'',2-fresh.length]);
  const notices=[...fresh,...older];
  for(const notice of notices){
    try{
      const r=await net.get(notice.url);if(r.status!==200)throw new Error(`PRIMARY_HTTP_${r.status}`);
      if(!/^https:\/\/x\.com\//.test(notice.url)){
        const links=noticeLinks(r.text).slice(0,3);
        if(links.length)await store.execute(`INSERT OR IGNORE INTO debut_automation_notices(url,source_url,first_seen_at) VALUES ${links.map(()=>'(?,?,?)').join(',')}`,links.flatMap(url=>[url,notice.url,now]));
        const reason=links.length?'OFFICIAL_NOTICE_LINKS_QUEUED':'PRIMARY_AUTHOR_OR_SCOPE_REQUIRED';
        summary.held.push({id:notice.url,reason});
        await store.execute("UPDATE debut_automation_notices SET checked_at=?,next_check_at=?,status='HOLD',reason=? WHERE url=?",[now,new Date(Date.parse(now)+86400000).toISOString(),reason,notice.url]);continue;
      }
      const seed=parsePrimaryNotice(r.text,notice.url);
      const inRange=seed&&seed.date>=summary.range.from&&seed.date<=summary.range.to;
      if(!inRange)summary.held.push({id:notice.url,reason:seed?'NOTICE_OUT_OF_RANGE':'PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD'});
      const imported=inRange?(await ledger.ingest([seed])).get(seed.id):undefined;
      if(imported&&await store.saveSeed(imported,now)&&!knownChannels.has(imported.channelKey)){
        knownChannels.add(imported.channelKey);summary.discovered++;summary.discoveredCandidates.push({name:imported.name,channelKey:imported.channelKey,source:imported.source,date:imported.date,sourceUrl:imported.sourceUrl});
      }
      await store.execute('UPDATE debut_automation_notices SET checked_at=?,next_check_at=?,status=?,reason=? WHERE url=?',[now,new Date(Date.parse(now)+(inRange?7*86400000:12*3600000)).toISOString(),inRange?'PARSED':'HOLD',inRange?'':'PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD',notice.url]);
    }catch(error){summary.failed.push({id:notice.url,reason:safeError(error)});await store.execute("UPDATE debut_automation_notices SET checked_at=?,next_check_at=?,status='FAILED',reason=? WHERE url=?",[now,new Date(Date.parse(now)+12*3600000).toISOString(),safeError(error),notice.url]);}
  }
}
async function verifyPublic(env:DiscoveryEnv,summary:RunSummary,snapshot:Snapshot){
  const slugs=[...new Set([...summary.published.map(p=>p.slug),...summary.updated,...summary.reconfirmed])];if(!slugs.length)return;
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
  const profileOnly=mode==='PROFILE'||mode==='BACKFILL';
  const enrichmentRange=backfill||(mode==='PROFILE'?{from:range.from,to:range.to,at:scheduledTime}:undefined);
  const restrictedMode=profileOnly?'BACKFILL':mode;
  const enrichmentWeek=enrichmentRange?`${mode==='PROFILE'?'profile':'backfill'}:${enrichmentRange.from}:${enrichmentRange.to}`:'';
  const store=new DiscoveryStore(env.DB,runId);
  if(!await store.begin(slot,range.today.slice(0,7),mode,now))return null;
  const net=new BudgetNetwork(started+LIMITS.wallMs-45000,fetcher);
  const ledger=new CsvLedger(store,now),publications:CsvPublication[]=[];
  const summary:RunSummary={runId,mode,slot,range,status:'RUNNING',coverage:'LIMITED_PUBLIC_SOURCES',sources:[],discovered:0,discoveredCandidates:[],sourceChanges:0,seedDeferred:0,enrichmentDeferred:0,checked:0,published:[],updated:[],unchanged:0,held:[],failed:[],remaining:0,externalRequests:0,downloadBytes:0,dbCalls:0,dbRowsRead:0,dbRowsWritten:0,publicVerified:false,errors:[],reconfirmed:[],allocations:net.allocations,csvBytesWritten:0};
  try{
    // 검색·새 원문은 기존 프로필 재확인보다 먼저 별도 예산으로 실행한다.
    const snapshot=await store.snapshot();
    const contractProfile=snapshot.profiles.find(p=>p.debutKind==='PLATFORM_DEBUT'&&p.dateState==='FIXED'&&isPublicProfile(p));
    if(contractProfile)await verifyPublic(env,{...summary,reconfirmed:[contractProfile.slug]},snapshot);
    await ledger.repairFieldSources(snapshot.profiles,await store.all<Candidate>("SELECT * FROM debut_automation_candidates WHERE json_extract(evidence,'$.fieldEvidence') IS NOT NULL LIMIT 80"));
    // 이미 저장한 사실의 공개 확인·T 기록 복구는 원문을 다시 받거나 재등록하지 않는다.
    const recoveries=await ledger.recoverPending(snapshot);
    publications.push(...recoveries);summary.reconfirmed.push(...recoveries.map(r=>r.profile.slug));
    const initialCandidates=await store.all<{channel_key:string}>('SELECT channel_key FROM debut_automation_candidates LIMIT 2001');
    const csvKnown=await ledger.knownChannelKeys();
    const initiallyKnown=new Set([...csvKnown,...initialCandidates.map(c=>c.channel_key),...snapshot.keys.keys(),...snapshot.pending]);
    net.startPhase('SEARCH_AND_NOTICES',8);
    if(!profileOnly){
      const pendingProfiles=await store.all<{count:number}>("SELECT COUNT(*) count FROM debut_automation_candidates WHERE json_extract(evidence,'$.enrichmentPending')=1");
      if(String(env.SEARCH_PROVIDER)==='TAVILY')summary.sources.push(await searchTavily(store,net,ledger,range.today,now,env.TAVILY_API_KEY,pendingProfiles[0]?.count>=20?1:pendingProfiles[0]?.count>=8?2:4,Number(env.TAVILY_MONTHLY_LIMIT||64)));
      else if(env.SEARCH_PROVIDER==='NAVER_HUB'&&String(env.SEARCH_STORAGE_RIGHTS_APPROVED)==='true')summary.sources.push(await searchWeb(store,net,range.today,now,{clientId:env.NAVER_SEARCH_CLIENT_ID,clientSecret:env.NAVER_SEARCH_CLIENT_SECRET}));
      else if(env.SEARCH_PROVIDER)summary.sources.push({id:'web-search',status:'NOT_CONFIGURED',count:0,reason:'SEARCH_PROVIDER_REVIEW_REQUIRED'});
      await collectNotices(store,net,summary,now,initiallyKnown,ledger);
    }
    net.startPhase('FIXED_SOURCES',12);
    const {seeds,sources}=profileOnly?{seeds:[] as Seed[],sources:[{id:'registered-enrichment',status:'OK',count:0,reason:''}]}:await collectSources(store,net,range.from,range.to,now);summary.sources.push(...sources);
    const seen=new Set(seeds.filter(s=>s.source==='SOOP_CALENDAR').map(s=>s.channelKey));
    for(const seed of seeds)if(seed.kind==='PLATFORM_DEBUT'&&seeds.some(other=>other.id!==seed.id&&other.channelKey===seed.channelKey&&other.kind===seed.kind&&(other.date!==seed.date||other.time!==seed.time)))snapshot.pending.add(seed.channelKey);
    const existingRows=await store.all<{id:string;source_hash:string;channel_key:string}>('SELECT id,source_hash,channel_key FROM debut_automation_candidates LIMIT 2001');
    const existingHashes=new Map(existingRows.map(c=>[c.id,c.source_hash])),existingIds=new Set(existingHashes.keys());
    const knownChannels=new Set([...csvKnown,...existingRows.map(c=>c.channel_key),...snapshot.keys.keys(),...snapshot.pending]);
    if(existingIds.size>2000)throw new Error('CANDIDATE_STORAGE_LIMIT');
    const wideCaches=profileOnly?[]:await store.all<{cached:string}>("SELECT cached FROM debut_automation_sources WHERE id IN ('soop-calendar-wide','community-sheet-wide') AND status='OK' AND checked_at>=?",[new Date(started-8*86400000).toISOString()]);
    // 수요일→일요일의 4일 간격도 다음 조사 전 일정이 확인 대상에서 빠지지 않게 한다.
    const nextRunDay=kstDay(Date.parse(nextRegularRun(scheduledTime)));
    const imminentTo=nextRunDay>addDays(range.today,3)?nextRunDay:addDays(range.today,3);
    const allSeeds=new Map((profileOnly?[]:[...seeds,...registeredSeeds(snapshot,seen,mode==='WEEKLY'?addDays(range.today,-7):range.today,imminentTo)]).map(s=>[s.id,s]));
    for(const row of wideCaches)for(const s of JSON.parse(row.cached) as Seed[])if(!allSeeds.has(s.id))allSeeds.set(s.id,s);
    const importedSeeds=await ledger.ingest([...allSeeds.values()]);
    for(const original of allSeeds.values()){
      const seed=importedSeeds.get(original.id);if(!seed)throw new Error('CSV_IMPORT_MISSING');
      if(existingHashes.get(seed.id)===await sha256(seedHashInput(seed)))continue;
      if(store.calls>LIMITS.dbCalls-110||store.writes>LIMITS.dbWrites-220){summary.seedDeferred++;continue;}
      if(await store.saveSeed(seed,now)){
        if(existingIds.has(seed.id))summary.sourceChanges++;
        else if(!knownChannels.has(seed.channelKey)){knownChannels.add(seed.channelKey);summary.discovered++;summary.discoveredCandidates.push({name:seed.name,channelKey:seed.channelKey,source:seed.source,date:seed.date,sourceUrl:seed.sourceUrl});}
        if(seed.source==='AGENCY_NOTICE'&&!seed.date){await store.execute("UPDATE debut_automation_candidates SET status='HOLD',reason='AGENCY_YEAR_SCOPE_TIMEZONE_HOLD' WHERE id=?",[seed.id]);summary.held.push({id:seed.id,reason:'AGENCY_YEAR_SCOPE_TIMEZONE_HOLD'});}
      }
    }
    summary.enrichmentDeferred=await queueEnrichment(store,snapshot,mode,range.today,now,enrichmentRange);
    // 직전 회차에서 남긴 후보도 같은 대기열에서 이어서 처리한다.
    const candidates=await store.all<Candidate>(`SELECT * FROM debut_automation_candidates WHERE (next_check_at<=? OR reason IN ('SOURCE_OR_PARSE_ERROR','FETCH_INVOCATION_ERROR','SOURCE_TYPE_ERROR') OR (?='SMOKE' AND reason IN ('SOURCE_HTTP_404','SOURCE_HTTP_502','IMAGE_HOST_HOLD'))) AND (json_extract(seed,'$.date') BETWEEN ? AND ? OR json_extract(evidence,'$.enrichmentPending')=1)
      AND (?!='BACKFILL' OR (json_extract(evidence,'$.enrichmentPending')=1 AND json_extract(evidence,'$.enrichmentWeek')=?))
      ORDER BY CASE WHEN json_extract(evidence,'$.enrichmentPending')=1 THEN -2 WHEN profile_slug='' AND NOT EXISTS(SELECT 1 FROM portal_profiles p WHERE p.channel_url=json_extract(seed,'$.channelUrl')) AND source!='REGISTERED' THEN -1 WHEN json_extract(seed,'$.date') BETWEEN ? AND ? THEN 0
        WHEN json_extract(evidence,'$.enrichmentPending')=1 OR (?='WEEKLY' AND json_extract(seed,'$.date') BETWEEN ? AND ?) THEN 1 ELSE 2 END,
        last_checked_at,CASE WHEN managed_json='' THEN 0 ELSE 1 END,json_extract(seed,'$.date'),id LIMIT ?`,[now,mode,range.from,range.to,restrictedMode,enrichmentWeek,range.today,addDays(range.today,3),mode,addDays(range.today,-7),addDays(range.today,-1),mode==='WEEKLY'||mode==='PROFILE'?LIMITS.weeklyProfiles:LIMITS.candidates]);
    // 새 후보는 최소 12회, 기존 재확인은 최대 8회로 분리한다. 총 40회 제한은 그대로다.
    const newCandidates=profileOnly?[]:candidates.filter(c=>!snapshot.keys.has(c.channel_key));
    const existingCandidates=candidates.filter(c=>snapshot.keys.has(c.channel_key));
    const backlog=existingCandidates.filter(c=>JSON.parse(c.evidence||'{}').enrichmentPending);
    for(const group of [{name:'ENRICHMENT_BACKLOG',items:backlog},{name:'NEW_CANDIDATES',items:newCandidates},{name:'EXISTING_RECHECK',items:existingCandidates.filter(c=>!backlog.includes(c))}]){
    net.startPhase(group.name,LIMITS.external-net.requests);
    for(const candidate of group.items){
      const changed=summary.published.length+summary.updated.length;
      if(net.requests>LIMITS.external-3||Date.now()>started+LIMITS.wallMs-45000||store.calls+changed+14>LIMITS.dbCalls||store.writes+changed*4+120>LIMITS.dbWrites||store.reads>20000){summary.errors.push('DETAIL_BUDGET_DEFERRED');break;}
      summary.checked++;
      try{await checkCandidate(store,net,candidate,snapshot,summary,now,new Set(seeds.filter(s=>s.source==='SOOP_CALENDAR').map(s=>s.id)),ledger,publications);}catch(error){
        const reason=safeError(error);
        if(/BUDGET/.test(reason)){summary.errors.push(reason);break;}
        const failure=!/HOLD|REQUIRED|NO_DELETE|CANDIDATE_ONLY|PENDING_OR_OPERATOR_CONFLICT/.test(reason);
        (failure?summary.failed:summary.held).push({id:candidate.id,reason});
        await store.mark(candidate,failure?'FAILED':'HOLD',reason,now,nextRegularRun(Date.parse(now)+(candidate.failures>=2?12*3600000:0)));
      }
    }
    }
    const pending=await store.all<{count:number}>(`SELECT COUNT(*) AS count FROM debut_automation_candidates WHERE next_check_at<=? AND (json_extract(seed,'$.date') BETWEEN ? AND ? OR json_extract(evidence,'$.enrichmentPending')=1)
      AND (?!='BACKFILL' OR (json_extract(evidence,'$.enrichmentPending')=1 AND json_extract(evidence,'$.enrichmentWeek')=?))`,[now,range.from,range.to,restrictedMode,enrichmentWeek]);summary.remaining=pending[0]?.count||0;
    await verifyPublic(env,summary,snapshot);
    if(summary.publicVerified)await ledger.repairFieldSources(snapshot.profiles,await store.all<Candidate>("SELECT * FROM debut_automation_candidates WHERE json_extract(evidence,'$.fieldEvidence') IS NOT NULL LIMIT 80"));
    const currentPublications:CsvPublication[]=[];
    for(const receipt of new Map(publications.map(p=>[p.candidateId,p])).values()){
      const actual=snapshot.profiles.find(p=>p.slug===receipt.profile.slug);
      if(actual&&await sha256(JSON.stringify(actual))===receipt.profileHash)currentPublications.push(receipt);
    }
    await ledger.complete(summary.publicVerified?currentPublications:[],[...summary.held,...summary.failed]);
    for(const slug of new Set([...summary.published.map(p=>p.slug),...summary.updated,...summary.reconfirmed]))await store.execute("UPDATE debut_automation_candidates SET status='PUBLIC_VERIFIED' WHERE profile_slug=? AND status='PUBLISHED_PENDING_CHECK'",[slug]);
    summary.status=summary.sources.some(s=>['FAILED','BACKOFF','NOT_CONFIGURED'].includes(s.status))||summary.failed.length||summary.remaining||summary.seedDeferred||summary.enrichmentDeferred||summary.errors.length?'PARTIAL':summary.held.length?'COMPLETED_WITH_HOLDS':'COMPLETED';
    // 조사 원본 HTML은 보관하지 않으며, 실행 기록은 90일 뒤 소량씩 정리한다.
    await store.execute("DELETE FROM debut_automation_runs WHERE slot IN (SELECT slot FROM debut_automation_runs WHERE started_at<? LIMIT 10)",[new Date(started-90*86400000).toISOString()]);
    await store.execute(`DELETE FROM debut_csv_revisions WHERE (month,revision) IN (SELECT r.month,r.revision FROM debut_csv_revisions r WHERE created_at<? AND NOT EXISTS(SELECT 1 FROM debut_csv_months m WHERE m.month=r.month AND m.revision=r.revision) AND NOT EXISTS(SELECT 1 FROM debut_csv_receipts c WHERE c.month=r.month AND c.revision=r.revision) LIMIT 32)`,[new Date(started-90*86400000).toISOString()]);
    // 삭제·이름 변경으로 연결이 끊긴 자동 관리 기록은 운영자 의도 보호용으로 남긴다.
    await store.execute("DELETE FROM debut_automation_candidates WHERE id IN (SELECT id FROM debut_automation_candidates c WHERE COALESCE(NULLIF(json_extract(seed,'$.date'),''),substr(first_seen_at,1,10))<? AND status!='PUBLISHED_PENDING_CHECK' AND NOT (managed_json!='' AND NOT EXISTS(SELECT 1 FROM portal_profiles p WHERE p.slug=c.profile_slug) AND NOT EXISTS(SELECT 1 FROM streamerChannel_info i WHERE i.slug=c.profile_slug)) LIMIT 10)",[addDays(range.today,-180)]);
  }catch(error){summary.errors.push(safeError(error));summary.status='FAILED';}
  finally{
    Object.assign(summary,{externalRequests:net.requests,downloadBytes:net.bytes,dbCalls:store.calls,dbRowsRead:store.reads,dbRowsWritten:store.writes,csvBytesWritten:ledger.writtenBytes});
    await store.finish(summary.status,summary);
    console.log(JSON.stringify({event:'debut-discovery',...summary}));
  }
  return summary;
}
