import { attributes, canonicalChannel, decodeHtml, noticeLinks, primaryChannels, validDay, xMetadata, type Seed } from './policy';
import { BudgetNetwork } from './network';
import { needsContentReview } from '../../../shared/contentReview';

export const AGENCY_INDEX='https://www.charonuniverse.com/notice/';
export const REVERNIA_INDEX='https://revernia.co.kr/news/';
// 사람 이름과 게시물 ID를 설정하지 않고 공식 공지 목록의 제목으로 조사 대상을 고른다.
export function agencyNoticeLinks(html:string):string[]{
  const urls:string[]=[];
  for(const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
    const attrs=attributes(`<a ${match[1]}>`),title=decodeHtml(match[2].replace(/<[^>]+>/g,' ')).normalize('NFKC');
    if(!/데뷔|DEBUT/i.test(title))continue;
    try{const url=new URL(attrs.href,AGENCY_INDEX),id=url.searchParams.get('idx');if(url.origin===new URL(AGENCY_INDEX).origin&&url.pathname==='/notice/'&&/^\d{1,16}$/.test(id||''))urls.push(`${AGENCY_INDEX}?bmode=view&idx=${id}`);}catch{}
  }
  return [...new Set(urls)];
}
export function agencyNoticeEntries(html:string):{name:string;date:string;time:string;link:string}[]{
  const {title,text}=xMetadata(html),body=decodeHtml(text).replace(/&nbsp;/g,' ').normalize('NFKC');
  if(!/데뷔|DEBUT/i.test(title.normalize('NFKC'))||/취소|연기/.test(body))return [];
  const dates=[...body.matchAll(/(20\d{2})\.(\d{2})\.(\d{2})/g)];if(dates.length!==1)return [];
  const d=dates[0],date=`${d[1]}-${d[2]}-${d[3]}`;if(!validDay(date))return [];
  return [...body.matchAll(/✧\s*([^✧|]{1,60})\|\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*~?\s*(https:\/\/(?:ch\.ci\/\w+|chzzk\.naver\.com\/[a-f0-9]{32}))/gi)].flatMap(m=>{
    if(/프리뷰|프리데뷔|재데뷔|신의상|모델/.test(m[1])||Number(m[2])<1||Number(m[2])>12||Number(m[3])>59)return [];
    const hour=Number(m[2])%12+(m[4].toUpperCase()==='PM'?12:0);
    return [{name:m[1].trim(),date,time:`${String(hour).padStart(2,'0')}:${m[3]}`,link:m[5]}];
  });
}
export async function collectAgency(net:BudgetNetwork,indexHtml:string,from:string,to:string):Promise<Seed[]>{
  const seeds:Seed[]=[];
  // 회차당 목록 1회·공식 공지 2개 이하. 본문에 있는 공식 단축 방송국 링크만 확인한다.
  for(const url of agencyNoticeLinks(indexHtml).slice(0,2)){
    const r=await net.get(url);if(r.status!==200)throw new Error(`SOURCE_HTTP_${r.status}`);
    const entries=agencyNoticeEntries(r.text).filter(e=>e.date>=from&&e.date<=to).slice(0,6);
    for(const entry of entries){
      const resolved=entry.link.startsWith('https://ch.ci/')?await net.resolveChannel(entry.link):entry.link,channel=canonicalChannel(resolved);
      if(!channel||channel.platform!=='CHZZK')throw new Error('AGENCY_CHANNEL_LINK_HOLD');
      const postId=new URL(url).searchParams.get('idx');
      seeds.push({id:`agency:charon:${postId}:${channel.key}`,channelKey:channel.key,platform:'CHZZK',channelUrl:channel.url,name:entry.name,date:entry.date,time:entry.time,
        timezone:'',kind:'UNKNOWN',source:'AGENCY_NOTICE',sourceUrl:url,primaryUrl:url,scopeConfirmed:false});
    }
  }
  return seeds;
}
export function agencyMemberNoticeLinks(html:string):string[]{
  const urls:string[]=[];
  for(const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
    const attrs=attributes(`<a ${match[1]}>`),title=decodeHtml(match[2].replace(/<[^>]+>/g,' '));
    if(!/라이버|데뷔|새로운.*멤버/i.test(title))continue;
    try{const url=new URL(attrs.href,REVERNIA_INDEX),id=url.searchParams.get('uid');if(url.origin===new URL(REVERNIA_INDEX).origin&&url.pathname==='/news/'&&/^\d{1,16}\/?$/.test(id||''))urls.push(`${REVERNIA_INDEX}?mod=document&uid=${id?.replace('/','')}`);}catch{}
  }
  return [...new Set(urls)].slice(0,1);
}
// 소속사가 직접 연결한 본인 공지에서도 연도가 생략되면 빈 값으로 보관한다. 검색일의 연도로 채우지 않는다.
export function parseAgencyMemberNotice(html:string,url:string,agencyUrl:string):Seed|null{
  const {title,text}=xMetadata(html),author=url.match(/^https:\/\/x\.com\/([a-z0-9_]+)\/status\/(\d+)$/i);
  if(!author||!title.toLowerCase().includes(`@${author[1].toLowerCase()}`)||!text||!/데뷔|첫\s*방송/.test(text)||/재데뷔|프리데뷔|신의상|모델\s*공개|취소|연기/.test(text))return null;
  const channels=primaryChannels(html);if(channels.length!==1||channels[0]?.platform!=='CHZZK')return null;
  const dates=[...new Set([...text.matchAll(/(20\d{2})\s*[년.\-/]\s*(\d{1,2})\s*[월.\-/]\s*(\d{1,2})/g)].map(m=>`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`))];
  if(dates.length>1||dates[0]&&!validDay(dates[0]))return null;
  const times=[...new Set([...text.matchAll(/(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/g)].flatMap(m=>Number(m[2])>=1&&Number(m[2])<=12&&Number(m[3]||0)<60?[`${String(Number(m[2])%12+(m[1]==='오후'?12:0)).padStart(2,'0')}:${(m[3]||'00').padStart(2,'0')}`]:[]))];
  if(times.length!==1)return null;
  const channel=channels[0];
  return {id:`agency:revernia:${author[2]}`,channelKey:channel.key,platform:'CHZZK',channelUrl:channel.url,name:title.split('(@')[0].trim(),date:dates[0]||'',time:times[0],timezone:'',kind:'UNKNOWN',source:'AGENCY_NOTICE',sourceUrl:agencyUrl,primaryUrl:url,xUrl:`https://x.com/${author[1]}`,scopeConfirmed:false};
}
export async function collectAgencyMembers(net:BudgetNetwork,indexHtml:string,from:string,to:string):Promise<Seed[]>{
  const seeds:Seed[]=[];
  for(const agencyUrl of agencyMemberNoticeLinks(indexHtml)){
    const page=await net.get(agencyUrl);if(page.status!==200)throw new Error(`SOURCE_HTTP_${page.status}`);
    const urls=[...new Set((xMetadata(page.text).text.match(/https:\/\/x\.com\/[a-z0-9_]+\/status\/\d+/gi)||[]))].slice(0,2);
    for(const url of urls){const r=await net.get(url);if(r.status!==200)throw new Error(`SOURCE_HTTP_${r.status}`);const seed=parseAgencyMemberNotice(r.text,url,agencyUrl);if(seed&&(!seed.date||seed.date>=from&&seed.date<=to))seeds.push(seed);}
  }
  return seeds;
}
// 공식 소속사가 공개한 방송국 링크로 새 채널을 식별한다. 이벤트 종료일은 데뷔일로 옮기지 않는다.
export async function collectAgencyRoster(net:BudgetNetwork,indexHtml:string):Promise<Seed[]>{
  const seeds:Seed[]=[];
  for(const url of noticeLinks(indexHtml,'revernia_kr').slice(0,1)){
    const r=await net.get(url);if(r.status!==200)throw new Error(`SOURCE_HTTP_${r.status}`);
    const {title,text}=xMetadata(r.text);
    if(!title.toLowerCase().includes('@revernia_kr')||!/첫\s*방송|데뷔/.test(text)||!/참여\s*채널|멤버/.test(text))continue;
    for(const channel of primaryChannels(r.text).filter(c=>c?.platform==='CHZZK').slice(0,3)){
      if(!channel)continue;const id=channel.key.slice(6),raw=await net.json(`https://api.chzzk.naver.com/service/v1/channels/${id}`),content=raw.content as Record<string,unknown>|undefined;
      if(raw.code!==200||content?.channelId!==id)throw new Error('CHANNEL_ID_MISMATCH');
      const name=String(content.channelName||'');if(!name||needsContentReview(name))throw new Error('NAME_CONTENT_HOLD');
      seeds.push({id:`agency:revernia:roster:${channel.key}`,channelKey:channel.key,platform:'CHZZK',channelUrl:channel.url,name,date:'',time:'',timezone:'',kind:'UNKNOWN',source:'AGENCY_NOTICE',sourceUrl:'https://x.com/revernia_kr',primaryUrl:url,scopeConfirmed:false});
    }
  }
  return seeds;
}
