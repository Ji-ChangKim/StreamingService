import { addDays } from './policy';
import { sha256, type BudgetNetwork } from './network';
import type { DiscoveryStore } from './store';
import type { CsvLedger } from './csvLedger';
import { safeError, type SourceStatus } from './sources';

export function discoveryNoticeUrl(value:string):string|null{
 let u:URL;try{u=new URL(value);}catch{return null;}
 if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
 const x=u.href.match(/^https:\/\/(?:www\.)?(?:x|twitter)\.com\/([a-z0-9_]{1,15})\/status\/(\d+)(?:[/?#]|$)/i);
 if(x)return `https://x.com/${x[1]}/status/${x[2]}`;
 if(u.hostname==='game.naver.com'&&/^\/lounge\/chzzk\/board\/detail\/\d+\/?$/.test(u.pathname))return u.origin+u.pathname;
 if(['www.sooplive.com','sooplive.com'].includes(u.hostname)&&/^\/station\/[a-z0-9_]+\/post\/\d+\/?$/i.test(u.pathname))return `https://www.sooplive.com${u.pathname}`;
 return null;
}
export function tavilyDiscoveryQueries(today:string):string[]{
 const date=(offset:number)=>{const d=addDays(today,offset);return `${d.slice(0,4)}년 ${Number(d.slice(5,7))}월 ${Number(d.slice(8,10))}일`;};
 return [`site:x.com 치지직 버튜버 데뷔 첫 방송 ${date(0)}`,`site:x.com 치지직 버츄얼 데뷔 ${date(2)}`,`site:game.naver.com/lounge/chzzk/board/detail 버튜버 데뷔 ${date(4)}`,`site:sooplive.com/station 버츄얼 데뷔 ${date(7)}`,`site:x.com 치지직 신인 첫 방송 ${date(7)}`,`site:x.com 치지직 데뷔 ${date(-3)}`,`site:game.naver.com/lounge/chzzk/board/detail 버츄얼 첫 방송 ${date(0)}`,`site:x.com SOOP 버튜버 데뷔 ${date(14)}`,`site:x.com 치지직 버튜버 데뷔 ${date(21)}`,`site:x.com 치지직 버츄얼 데뷔 ${date(30)}`,`site:x.com 치지직 첫 방송 ${date(-7)}`];
}
export async function searchTavily(store:DiscoveryStore,net:BudgetNetwork,ledger:CsvLedger,today:string,now:string,key:string|undefined,limit=4,monthlyLimit=64):Promise<SourceStatus>{
 const id='web-search:tavily',month=today.slice(0,7);
 if(!key)return {id,status:'FAILED',count:0,reason:'TAVILY_CREDENTIALS_MISSING'};
 if(!Number.isInteger(monthlyLimit)||monthlyLimit<1||monthlyLimit>280)return {id,status:'FAILED',count:0,reason:'TAVILY_BUDGET_INVALID'};
 const prior=await store.all<{cached:string}>('SELECT cached FROM debut_automation_sources WHERE id=?',[id]);
 let cursor=0;try{cursor=Number(JSON.parse(prior[0]?.cached||'{}').cursor)||0;}catch{}
 const queries=tavilyDiscoveryQueries(today),records:{query:string;urls:string[]}[]=[],leads:{id:string;url:string;title:string;query:string;known:boolean;channelUrl:string}[]=[];
 let reason='';
 await store.execute('INSERT OR IGNORE INTO debut_search_usage(month,updated_at) VALUES(?,?)',[month,now]);
 for(let i=0;i<Math.min(4,limit);i++){
  const reserved=await store.execute(`UPDATE debut_search_usage SET reserved_credits=reserved_credits+1,updated_at=? WHERE month=? AND reserved_credits<? AND reserved_credits<280 AND EXISTS(SELECT 1 FROM debut_automation_control WHERE enabled=1 AND lease_owner=? AND lease_until>?)`,[now,month,monthlyLimit,store.runId,new Date().toISOString()]);
  if(reserved.meta.changes!==1){reason='TAVILY_MONTHLY_LIMIT';break;}
  const query=queries[(cursor+records.length)%queries.length];
  try{
   const raw=await net.tavilySearch({query,search_depth:'basic',max_results:10,topic:'general',auto_parameters:false,include_answer:false,include_raw_content:false,include_images:false,include_usage:true},key);
   if(!Array.isArray(raw.results)||raw.results.length>10||(raw.usage as {credits?:unknown})?.credits!==1)throw new Error('TAVILY_RESPONSE_OR_USAGE_CHANGED');
   await store.execute('UPDATE debut_search_usage SET reported_credits=reported_credits+1,completed_requests=completed_requests+1,updated_at=? WHERE month=?',[now,month]);
   const urls:string[]=[];
   for(const item of raw.results as {url?:unknown;title?:unknown}[]){
    if(typeof item.url!=='string')continue;const url=discoveryNoticeUrl(item.url);if(!url)continue;
    urls.push(url);if(!leads.some(l=>l.url===url))leads.push({id:`tavily:${(await sha256(url)).slice(0,24)}`,url,title:typeof item.title==='string'?item.title.slice(0,180):'',query,known:false,channelUrl:''});
   }
   records.push({query,urls:[...new Set(urls)]});
  }catch(error){reason=safeError(error);await store.execute('UPDATE debut_search_usage SET failed_requests=failed_requests+1,updated_at=? WHERE month=?',[now,month]);break;}
 }
 // 검색 요약은 버리고 공지 주소·짧은 제목만 내부 CSV에 저장한다. 사실은 원문에서 다시 확인한다.
 if(leads.length){
  await ledger.recordSearchLeads(month,leads);
  await store.execute(`INSERT OR IGNORE INTO debut_automation_notices(url,source_url,first_seen_at) VALUES ${leads.map(()=>'(?,?,?)').join(',')}`,leads.flatMap(l=>[l.url,`tavily:${l.query}`,now]),leads.length*4+10);
 }
 const cached=JSON.stringify({cursor:(cursor+records.length)%queries.length,records});
 await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,last_success_at,cached,reason) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,checked_at=excluded.checked_at,last_success_at=CASE WHEN excluded.status='OK' THEN excluded.last_success_at ELSE debut_automation_sources.last_success_at END,cached=excluded.cached,reason=excluded.reason`,[id,'https://api.tavily.com/search',reason?'FAILED':'OK',now,reason?'':now,cached,reason]);
 return {id,status:reason?'FAILED':'OK',count:leads.length,reason};
}
