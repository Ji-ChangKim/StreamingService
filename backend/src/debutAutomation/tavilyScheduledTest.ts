import { BudgetNetwork, sha256 } from './network';
import { DiscoveryStore } from './store';
import { CsvLedger } from './csvLedger';
import { canonicalChannel, kstDay } from './policy';
import { safeError } from './sources';

export function isTavilyTestSchedule(cron:string,scheduledTime:number,expected:string,now:number):boolean{
 const target=Date.parse(expected);
 const at=new Date(target),expectedCron=`${at.getUTCMinutes()} ${at.getUTCHours()} ${at.getUTCDate()} ${at.getUTCMonth()+1} *`;
 return Number.isFinite(target)&&now>=target&&now-target<10*60000&&now>=scheduledTime&&
  (cron===expectedCron&&scheduledTime>=target&&scheduledTime-target<60000||cron==='* * * * *'&&scheduledTime>=target&&scheduledTime-target<10*60000);
}
export function tavilyTestQueries(today:string):string[]{
 const y=today.slice(0,4),m=Number(today.slice(5,7));
 return [`치지직 버튜버 데뷔 첫 방송 ${y}년 ${m}월`,`site:x.com 치지직 버츄얼 데뷔 ${m}월 ${y}`,`SOOP 숲 버츄얼 데뷔 첫 방송 ${y}년 ${m}월`,`site:game.naver.com/lounge/chzzk 버튜버 데뷔 ${y} ${m}월`];
}
export function tavilyTestResults(value:Record<string,unknown>):{url:string;title:string;content:string}[]{
 if(!Array.isArray(value.results)||value.results.length>10)throw new Error('TAVILY_SCHEMA_CHANGED');
 return value.results.flatMap((item:unknown)=>{
  if(!item||typeof item!=='object')throw new Error('TAVILY_RESULT_INVALID');
  const r=item as Record<string,unknown>;if(typeof r.url!=='string'||typeof r.title!=='string')throw new Error('TAVILY_RESULT_INVALID');
  let url:URL;try{url=new URL(r.url);}catch{return [];}
  if(url.protocol!=='https:'||url.username||url.password||url.port)return [];
  url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/.test(key))url.searchParams.delete(key);
  return [{url:url.href,title:r.title.slice(0,180),content:typeof r.content==='string'?r.content.slice(0,1200):''}];
 });
}

export async function runTavilyScheduledTest(env:DiscoveryEnv,scheduledTime:number,fetcher:typeof fetch=fetch,retry=false){
 const started=Date.now(),now=new Date(started).toISOString(),today=kstDay(scheduledTime),month=today.slice(0,7),slot=`tavily-test:${new Date(scheduledTime).toISOString()}${retry?':retry-1':''}`;
 const store=new DiscoveryStore(env.DB,crypto.randomUUID());if(!await store.begin(slot,month,'TAVILY_TEST',now))return null;
 const net=new BudgetNetwork(started+95000,fetcher),ledger=new CsvLedger(store,now);
 const summary={test:'TAVILY_SCHEDULED_READ_ONLY',slot,status:'RUNNING',scheduledAt:new Date(scheduledTime).toISOString(),startedAt:now,searches:0,reservedCredits:0,reportedCredits:0,resultRows:0,uniqueUrls:0,knownChannelLinks:0,unverifiedLinks:0,csvRowsAdded:0,csvReadback:false,publicUnchanged:false,publicWrites:0,holds:[] as string[],errors:[] as string[],externalRequests:0,dbCalls:0,csvBytesWritten:0,results:[] as {id:string;url:string;title:string;query:string;known:boolean;channelUrl:string}[]};
 let stage='SETUP';
 try{
  if(!env.TAVILY_API_KEY)throw new Error('TAVILY_CREDENTIALS_MISSING');
  const testCreditCeiling=Number(env.TAVILY_TEST_CREDIT_CEILING||'8');
  if(!Number.isInteger(testCreditCeiling)||testCreditCeiling<1||testCreditCeiling>280)throw new Error('TAVILY_TEST_BUDGET_INVALID');
  const snapshot=await store.snapshot(),known=await ledger.knownChannelKeys();for(const key of snapshot.keys.keys())known.add(key);
  const candidates=await store.all<{channel_key:string}>('SELECT channel_key FROM debut_automation_candidates LIMIT 2001');for(const row of candidates)known.add(row.channel_key);for(const key of snapshot.pending)known.add(key);
  await store.execute('INSERT OR IGNORE INTO debut_search_usage(month,updated_at) VALUES(?,?)',[month,now]);
  net.startPhase('TAVILY_SEARCH',4);
  const seen=new Set<string>();
  for(const query of tavilyTestQueries(today)){
   const reserve=await store.execute(`UPDATE debut_search_usage SET reserved_credits=reserved_credits+1,updated_at=? WHERE month=? AND reserved_credits<280 AND reserved_credits<? AND EXISTS(SELECT 1 FROM debut_automation_control WHERE enabled=1 AND lease_owner=? AND lease_until>?)`,[now,month,testCreditCeiling,store.runId,new Date().toISOString()]);
   if(reserve.meta.changes!==1){if(summary.searches){summary.holds.push('TEST_TOTAL_CREDIT_LIMIT_REACHED');break;}throw new Error('TAVILY_MONTHLY_LIMIT');}summary.reservedCredits++;
   try{
    stage='SEARCH_HTTP';
    const value=await net.tavilySearch({query,search_depth:'basic',max_results:10,topic:'general',auto_parameters:false,include_answer:false,include_raw_content:false,include_images:false,include_usage:true},env.TAVILY_API_KEY);
    stage='SEARCH_PARSE';
    const results=tavilyTestResults(value),usage=value.usage as {credits?:unknown}|undefined;
    if(usage?.credits!==1)throw new Error('TAVILY_USAGE_UNEXPECTED');
    summary.searches++;summary.reportedCredits++;summary.resultRows+=results.length;
    await store.execute('UPDATE debut_search_usage SET reported_credits=reported_credits+1,completed_requests=completed_requests+1,updated_at=? WHERE month=?',[now,month]);
    for(const result of results){
     if(seen.has(result.url))continue;seen.add(result.url);
     const channelMatches=[...`${result.url} ${result.content}`.matchAll(/https:\/\/(?:m\.)?chzzk\.naver\.com\/[a-f0-9]{32}|https:\/\/(?:www\.)?sooplive\.(?:com|co.kr)\/station\/[a-z0-9_]+/gi)].map(m=>canonicalChannel(m[0])).filter(c=>c!==null);
     const channel=channelMatches.length===1?channelMatches[0]:null;
     const author=result.url.match(/^https:\/\/(?:www\.)?(?:x|twitter)\.com\/([\w]+)\/status\//)?.[1];
     const knownAuthor=author&&snapshot.profiles.some(p=>String(p.xUrl||'').toLowerCase().replace(/\/$/,'')===`https://x.com/${author.toLowerCase()}`);
     const alreadyKnown=Boolean(channel&&known.has(channel.key)||knownAuthor);
     if(alreadyKnown)summary.knownChannelLinks++;else summary.unverifiedLinks++;
     summary.results.push({id:`tavily:${(await sha256(result.url)).slice(0,24)}`,url:result.url,title:result.title,query,known:alreadyKnown,channelUrl:channel?.url||''});
    }
   }catch(error){await store.execute('UPDATE debut_search_usage SET failed_requests=failed_requests+1,updated_at=? WHERE month=?',[now,month]);throw error;}
  }
  summary.uniqueUrls=summary.results.length;summary.csvRowsAdded=await ledger.recordSearchLeads(month,summary.results);summary.csvReadback=true;
  summary.holds.push('PRIMARY_BODY_EVENT_TIME_AUTHOR_UNVERIFIED_NO_PUBLICATION');
  // 시험은 실제 운영 명단과 대조하지만 공개 프로필·행사 저장 함수는 호출하지 않는다.
  const after=await store.snapshot();summary.publicUnchanged=JSON.stringify([...snapshot.raw])===JSON.stringify([...after.raw]);
  if(!summary.publicUnchanged)summary.holds.push('PUBLIC_CHANGED_DURING_TEST_REQUIRES_REVIEW');
  const response=await env.SITE.fetch(new Request('https://vdebut.live/api/v1/portal/profiles?version=3',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(10000)}));
  await response.body?.cancel();if(!response.ok)throw new Error('PUBLIC_PROFILE_HTTP_FAILURE');
  const events=await env.SITE.fetch(new Request('https://vdebut.live/api/v1/events',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(10000)}));
  await events.body?.cancel();if(!events.ok)throw new Error('PUBLIC_CALENDAR_HTTP_FAILURE');
  summary.status='COMPLETED_WITH_HOLDS';
 }catch(error){
  summary.status='FAILED';summary.errors.push(safeError(error));
  const message=String(error instanceof Error?error.message:'unknown').split(env.TAVILY_API_KEY||'__no_key__').join('[REDACTED]').replace(/tvly-[a-zA-Z0-9_-]+/g,'[REDACTED]').slice(0,240);
  console.log(JSON.stringify({event:'tavily-test-error',stage,error:message}));
  // 뒤 검색이 실패해도 앞서 받은 단서는 잃지 않되, 공개 입력으로 승격하지 않는다.
  if(summary.results.length&&!summary.csvReadback)try{summary.csvRowsAdded=await ledger.recordSearchLeads(month,summary.results);summary.csvReadback=true;}catch(saveError){summary.errors.push(safeError(saveError));}
 }
 finally{
  Object.assign(summary,{externalRequests:net.requests,dbCalls:store.calls,csvBytesWritten:ledger.writtenBytes});
  await store.finish(summary.status,summary);console.log(JSON.stringify({event:'tavily-scheduled-test',...summary,results:undefined}));
 }
 return summary;
}
