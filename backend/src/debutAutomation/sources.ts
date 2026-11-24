import { BudgetNetwork, sha256 } from './network';
import { CALENDAR_URL, CURATORS, SHEET_URL, noticeLinks, parseSheet, parseSoop, type Seed } from './policy';
import { DiscoveryStore, type SourceRow } from './store';
import { AGENCY_INDEX, collectAgency, collectAgencyRoster } from './agency';

export type SourceStatus={id:string;status:string;count:number;reason:string};
export function safeError(error:unknown):string{
  const message=error instanceof Error?error.message:'';
  if(/Illegal invocation|incorrect.*this/i.test(message))return 'FETCH_INVOCATION_ERROR';
  if(/abort|timeout/i.test(message))return 'SOURCE_TIMEOUT';
  if(/different request|I\/O.*request/i.test(message))return 'CROSS_REQUEST_IO_CONTEXT';
  if(error instanceof TypeError)return 'SOURCE_TYPE_ERROR';
  // 외부 원문이나 비공개 응답을 실행 로그에 복사하지 않는다.
  return /^[A-Z][A-Z0-9_]{2,80}$/.test(message)?message:'SOURCE_OR_PARSE_ERROR';
}
export async function collectSources(store:DiscoveryStore,net:BudgetNetwork,from:string,to:string,now:string):Promise<{seeds:Seed[];sources:SourceStatus[]}> {
  const previous=new Map((await store.all<SourceRow>('SELECT * FROM debut_automation_sources LIMIT 32')).map(r=>[r.id,r]));
  const wide=Date.parse(to)-Date.parse(from)>40*86400000;
  // 주간 원천을 별도 보존해야 다음 일일 조사로 넘어가도 미처 적재하지 못한 후보가 사라지지 않는다.
  const definitions=[{id:wide?'soop-calendar-wide':'soop-calendar',url:`${CALENDAR_URL}api/api.php?work=getScheduleList&startDate=${from}&endDate=${to}`,kind:'soop'},
    {id:wide?'community-sheet-wide':'community-sheet',url:SHEET_URL,kind:'sheet'},...CURATORS.map(author=>({id:`x-curator:${author}`,url:`https://x.com/${author}`,kind:'x'})),{id:'agency:charon',url:AGENCY_INDEX,kind:'agency'},{id:'agency-x:revernia',url:'https://x.com/revernia_kr',kind:'roster'}];
  const seeds:Seed[]=[],sources:SourceStatus[]=[];
  for(let offset=0;offset<definitions.length;offset+=3){
    const results=await Promise.allSettled(definitions.slice(offset,offset+3).map(async definition=>{
      const old=previous.get(definition.id);
      if(old&&old.failures>=3&&/^(?:SOURCE_HTTP_|SOURCE_TIMEOUT|X_PUBLIC_FEED_UNAVAILABLE)/.test(old.reason)&&Date.parse(old.checked_at)+86400000>Date.parse(now))return {definition,old,status:'BACKOFF',value:old.cached,reason:old.reason};
      // 주간 점검 직전 정상 수집한 공지 계정은 재조회하지 않는다. 일정 범위가 달라진 달력·시트는 다시 파싱한다.
      if(definition.kind==='x'&&old?.status==='OK'&&Date.parse(old.checked_at)+2*3600000>Date.parse(now))return {definition,old,status:'CACHED',value:old.cached,reason:''};
      try{
        const r=await net.get(definition.url);if(r.status!==200)throw new Error(`SOURCE_HTTP_${r.status}`);
        const parsed=definition.kind==='soop'?parseSoop(JSON.parse(r.text),from,to,definition.url):definition.kind==='sheet'?parseSheet(r.text,from,to):definition.kind==='agency'?await collectAgency(net,r.text,from,to):definition.kind==='roster'?await collectAgencyRoster(net,r.text):noticeLinks(r.text);
        if(definition.kind==='x'&&parsed.length===0)throw new Error('X_PUBLIC_FEED_UNAVAILABLE');
        return {definition,old,status:'OK',value:JSON.stringify(parsed),reason:''};
      }catch(error){return {definition,old,status:'FAILED',value:old?.cached||'',reason:safeError(error)};}
    }));
    for(let index=0;index<results.length;index++){
      const result=results[index];if(result.status!=='fulfilled')throw result.reason;
      const {definition,old,status,value,reason}=result.value;
      if(status==='OK'){
        await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,last_success_at,content_hash,cached) VALUES(?,?,'OK',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET url=excluded.url,status='OK',checked_at=excluded.checked_at,last_success_at=excluded.last_success_at,failures=0,reason='',content_hash=excluded.content_hash,cached=excluded.cached`,[definition.id,definition.url,now,now,await sha256(value),value]);
      }else if(status==='FAILED'){
        await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,failures,reason) VALUES(?,?,'FAILED',?,1,?)
         ON CONFLICT(id) DO UPDATE SET status='FAILED',checked_at=excluded.checked_at,failures=failures+1,reason=excluded.reason`,[definition.id,definition.url,now,reason]);
      }
      const items=status==='OK'||status==='CACHED'?JSON.parse(value):[];
      if(definition.kind==='x'){
        // 원문 상세 확인은 별도 대기열로 넘긴다. 재게시만으로 인물을 등록하지 않는다.
        const urls=(items as string[]).slice(0,60);
        if(urls.length)await store.execute(`INSERT OR IGNORE INTO debut_automation_notices(url,source_url,first_seen_at) VALUES ${urls.map(()=>'(?,?,?)').join(',')}`,urls.flatMap(url=>[url,definition.url,now]),urls.length*4+10);
      }else seeds.push(...items as Seed[]);
      sources.push({id:definition.id,status,count:items.length,reason:reason||''});
    }
  }
  return {seeds,sources};
}

export async function officialChannel(net:BudgetNetwork,seed:Seed):Promise<{name:string;image:string;bio:string;apiUrl:string}> {
  const id=seed.channelKey.split(':')[1];
  let apiUrl=seed.platform==='SOOP'?`https://chapi.sooplive.co.kr/api/${id}/station`:`https://api.chzzk.naver.com/service/v1/channels/${id}`;
  let value:Record<string,unknown>;
  if(seed.platform==='SOOP'){
    // 기존 플랫폼 연동과 같은 공개 요청 헤더·공식 대체 호스트를 사용한다. 대체 조회도 40회에 포함된다.
    const headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'};
    try{value=await net.json(apiUrl,headers);}catch(error){if(!/^SOURCE_HTTP_(404|502|503|504)$/.test(safeError(error)))throw error;apiUrl=`https://chapi.sooplive.com/api/${id}/station`;value=await net.json(apiUrl,headers);}
    if(value.data&&typeof value.data==='object')value=value.data as Record<string,unknown>;
  }else value=await net.json(apiUrl);
  if(seed.platform==='SOOP'){
    const station=value.station as Record<string,unknown>|undefined;
    if(!station||String(station.user_id||'').toLowerCase()!==id)throw new Error('CHANNEL_ID_MISMATCH');
    const image=String(value.profile_image||'');
    const display=station.display as Record<string,unknown>|undefined;
    const bio=[display?.profile_text,station.profile_text,station.station_title].filter(v=>typeof v==='string'&&v.trim()).join('\n');
    return {name:String(station.user_nick||''),image:image.startsWith('//')?`https:${image}`:image,bio,apiUrl};
  }
  const content=value.content as Record<string,unknown>|undefined;
  if(value.code!==200||!content||content.channelId!==id)throw new Error('CHANNEL_ID_MISMATCH');
  return {name:String(content.channelName||''),image:String(content.channelImageUrl||''),bio:String(content.channelDescription||''),apiUrl};
}
