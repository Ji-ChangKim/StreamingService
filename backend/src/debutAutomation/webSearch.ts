import { BudgetNetwork, sha256 } from './network';
import { DiscoveryStore } from './store';
import { safeError, type SourceStatus } from './sources';

export type SearchCredentials={clientId?:string;clientSecret?:string};
// 검색 결과의 장기 저장·광고 서비스 활용 조건 검토 전에는 runner에서 이 시험용 연결부를 호출하지 않는다.
export function discoveryQueries(today:string):string[]{
 const month=Number(today.slice(5,7)),day=Number(today.slice(8,10));
 return [`치지직 버튜버 데뷔 ${today.slice(0,4)} ${month}월`,
  `치지직 버츄얼 첫 방송 ${month}월 ${day}일`,
  `site:x.com 치지직 데뷔 ${month}월`,
  `SOOP 숲 버튜버 첫 방송 ${month}월`,
  `site:game.naver.com/lounge/chzzk 데뷔 ${month}월`,
  `site:x.com 버츄얼 데뷔 ${month}월`];
}
export function searchNoticeUrls(value:unknown):string[]{
 if(!value||typeof value!=='object'||!Array.isArray((value as {items?:unknown}).items))throw new Error('SEARCH_SCHEMA_CHANGED');
 return [...new Set((value as {items:{link?:unknown}[]}).items.flatMap(item=>{
  if(typeof item.link!=='string')return [];
  const match=item.link.match(/^https:\/\/(?:www\.)?(?:x|twitter)\.com\/([a-z0-9_]{1,15})\/status\/(\d+)(?:[/?#].*)?$/i);
  return match?[`https://x.com/${match[1]}/status/${match[2]}`]:[];
 }))];
}

export async function searchWeb(store:DiscoveryStore,net:BudgetNetwork,today:string,now:string,credentials:SearchCredentials):Promise<SourceStatus>{
 const id='web-search:naver-hub';
 if(!credentials.clientId||!credentials.clientSecret){
  const reason='SEARCH_CREDENTIALS_MISSING';
  await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,reason) VALUES(?,?,'FAILED',?,?) ON CONFLICT(id) DO UPDATE SET status='FAILED',checked_at=excluded.checked_at,reason=excluded.reason`,[id,'https://naverapihub.apigw.ntruss.com/search/v1/webkr',now,reason]);
  return {id,status:'FAILED',count:0,reason};
 }
 const prior=await store.all<{cached:string}>('SELECT cached FROM debut_automation_sources WHERE id=?',[id]);
 let cursor=0;try{cursor=JSON.parse(prior[0]?.cached||'{}').cursor||0;}catch{}
 const queries=discoveryQueries(today),records:{query:string;urls:string[]}[]=[];
 try{
  // 월 70회 × 회차 4개 이하. 검색·원문 확인을 합친 단계 예산 8회 안에서 실행한다.
  for(let i=0;i<4;i++){
   const query=queries[(cursor+i)%queries.length],url=new URL('https://naverapihub.apigw.ntruss.com/search/v1/webkr');
   url.searchParams.set('query',query);url.searchParams.set('display','10');url.searchParams.set('start','1');
   const payload=await net.json(url.href,{'X-NCP-APIGW-API-KEY-ID':credentials.clientId,'X-NCP-APIGW-API-KEY':credentials.clientSecret});
   const urls=searchNoticeUrls(payload);records.push({query,urls});
   if(urls.length)await store.execute(`INSERT OR IGNORE INTO debut_automation_notices(url,source_url,first_seen_at) VALUES ${urls.map(()=>'(?,?,?)').join(',')}`,urls.flatMap(link=>[link,url.href,now]),urls.length*4+10);
  }
  const cached=JSON.stringify({cursor:(cursor+records.length)%queries.length,records});
  await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,last_success_at,cached,content_hash,reason) VALUES(?,?,'OK',?,?,?,?, '') ON CONFLICT(id) DO UPDATE SET status='OK',checked_at=excluded.checked_at,last_success_at=excluded.last_success_at,cached=excluded.cached,content_hash=excluded.content_hash,reason=''`,[id,'https://naverapihub.apigw.ntruss.com/search/v1/webkr',now,now,cached,await sha256(cached)]);
  return {id,status:'OK',count:records.reduce((n,r)=>n+r.urls.length,0),reason:''};
 }catch(error){
  const reason=safeError(error),cached=JSON.stringify({cursor:(cursor+records.length)%queries.length,records});
  await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,cached,reason) VALUES(?,?,'FAILED',?,?,?) ON CONFLICT(id) DO UPDATE SET status='FAILED',checked_at=excluded.checked_at,cached=excluded.cached,reason=excluded.reason`,[id,'https://naverapihub.apigw.ntruss.com/search/v1/webkr',now,cached,reason]);
  return {id,status:'FAILED',count:records.reduce((n,r)=>n+r.urls.length,0),reason};
 }
}
