import { portalChannelKey, portalUtc, type PortalProfile } from '../../../shared/portal';
import { isPublicProfile, looksLikeVideoTitle, needsContentReview, reviewedProfile } from '../../../shared/contentReview';
import { parseCrawlerCsv } from '../services/crawlerCsv';
import type { ProfileDetails } from '../../../shared/profileDetails';

export const LIMITS = Object.freeze({ external: 40, candidates: 20, weeklyProfiles: 10, cpuMs: 5000,
  dbCalls: 220, dbReads: 30000, dbWrites: 700, monthlyRuns: 70, wallMs: 150000, sourceBytes: 2 * 1024 * 1024 });
export type Mode = 'DISCOVER' | 'RECHECK' | 'WEEKLY' | 'SMOKE' | 'BACKFILL';
export type Seed = {
  id: string; channelKey: string; platform: 'SOOP' | 'CHZZK'; channelUrl: string; name: string;
  date: string; time: string; timezone: string; kind: 'FIRST_DEBUT' | 'PLATFORM_DEBUT' | 'TRANSFER' | 'UNKNOWN';
  source: 'SOOP_CALENDAR' | 'COMMUNITY_SHEET' | 'X_NOTICE' | 'REGISTERED' | 'AGENCY_NOTICE';
  sourceUrl: string; primaryUrl: string; xUrl?: string; scopeConfirmed: boolean;
};
export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1SEcOZAhMqFLUW7bxSsBkWK0UriMD3fD82xXX2HrUf38/export?format=csv&gid=1884409648';
export const CALENDAR_URL = 'https://welcomevirtual.sooplive.com/';
export const CURATORS = ['VtuberDebutBot', 'KRVtubefollower', 'vvw_kr'];
// 조회 기간만 다른 같은 공식 일정은 변경된 행사로 세지 않는다.
export function seedHashInput(seed:Seed):string{return JSON.stringify(seed.source==='SOOP_CALENDAR'?{...seed,sourceUrl:CALENDAR_URL}:seed);}

export function kstDay(now: number): string { return new Date(now + 9 * 3600000).toISOString().slice(0, 10); }
export function addDays(date: string, days: number): string { return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10); }
export function nextRegularRun(time:number):string{
  const local=new Date(time+9*3600000),day=kstDay(time),hour=local.getUTCHours();
  const date=hour>=21?addDays(day,1):day,nextHour=hour<9||hour>=21?'09':'21';
  return new Date(`${date}T${nextHour}:00:00+09:00`).toISOString();
}
export function windowFor(time: number, mode: Mode) {
  const today = kstDay(time);
  return { today, from: addDays(today, mode === 'WEEKLY' ? -30 : -7), to: addDays(today, mode === 'WEEKLY' ? 90 : 30) };
}
export function modeFor(cron: string): Mode | null {
  return cron === '0 0 * * *' ? 'DISCOVER' : cron === '0 12 * * *' ? 'RECHECK' : cron === '0 1 * * MON' ? 'WEEKLY' : null;
}
export function canonicalChannel(value: string): { key: string; url: string; platform: Seed['platform'] } | null {
  for (const platform of ['SOOP', 'CHZZK'] as const) {
    const key = portalChannelKey(value, platform);
    if (key) return { key, platform, url: platform === 'SOOP' ? `https://www.sooplive.com/station/${key.slice(5)}` : `https://chzzk.naver.com/${key.slice(6)}` };
  }
  return null;
}
export function validDay(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; }

// 공개 달력 응답은 플랫폼 일정의 근거다. 생애 첫 활동의 근거로 승격하지 않는다.
export function parseSoop(value: unknown, from: string, to: string, sourceUrl: string): Seed[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as {data?: unknown}).data)) throw new Error('SOOP_SCHEMA_CHANGED');
  const seeds: Seed[] = [];
  for (const item of (value as {data: Record<string, unknown>[]}).data) {
    if (item.expose_yn !== 'Y') continue;
    const id = String(item.strm_id || ''), dt = String(item.schedule_dtm || '');
    const date = dt.slice(0, 10), time = dt.slice(11, 16);
    if (!/^[a-z0-9_]{1,50}$/i.test(id) || !validDay(date) || !portalUtc(date, time, 'Asia/Seoul')) throw new Error('SOOP_INVALID_ITEM');
    if (date < from || date > to) continue;
    if(!/^[a-z0-9_-]{1,64}$/i.test(String(item.idx||''))||seeds.some(s=>s.id===`soop:${item.idx}`))throw new Error('SOOP_DUPLICATE_OR_INVALID_EVENT_ID');
    const channel = canonicalChannel(String(item.strm_img_link_path || `https://www.sooplive.com/station/${id}`));
    if (!channel || channel.key !== `SOOP:${id.toLowerCase()}`) throw new Error('SOOP_CHANNEL_MISMATCH');
    seeds.push({ id: `soop:${item.idx}`, channelKey: channel.key, platform: 'SOOP', channelUrl: channel.url,
      name: String(item.strm_nick || '').slice(0, 100), date, time, timezone: 'Asia/Seoul',
      kind: item.schedule_type === 'debut' ? 'PLATFORM_DEBUT' : item.schedule_type === 'transfer' ? 'TRANSFER' : 'UNKNOWN',
      source: 'SOOP_CALENDAR', sourceUrl, primaryUrl: CALENDAR_URL, scopeConfirmed: item.schedule_type === 'debut' });
  }
  return seeds;
}
export function parseSheet(text: string, from: string, to: string): Seed[] {
  const rows = parseCrawlerCsv(text);
  if (!rows[4]?.some((cell) => cell.includes('날짜'))) throw new Error('SHEET_HEADER_CHANGED');
  return rows.slice(5).flatMap((row) => {
    const match = (row[1] || '').match(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
    if (!match) return [];
    const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    const channel = canonicalChannel(row[5] || '');
    if (!channel || !validDay(date) || date < from || date > to) return [];
    const h = (row[2] || '').match(/\d{1,2}/)?.[0], m = (row[3] || '').match(/\d{1,2}/)?.[0] || '00';
    return [{ id: `sheet:${channel.key}:${date}`, channelKey: channel.key, platform: channel.platform, channelUrl: channel.url,
      name: (row[4] || '').slice(0, 100), date, time: h ? `${h.padStart(2,'0')}:${m.padStart(2,'0')}` : '', timezone: '', kind: 'UNKNOWN',
      source: 'COMMUNITY_SHEET', sourceUrl: SHEET_URL, primaryUrl: /^https:\/\/(?:www\.)?(?:x|twitter)\.com\/[\w]+\/status\/\d+\/?$/.test(row[7] || '') ? row[7] : '',
      xUrl: /^@?[a-z0-9_]{1,15}$/i.test(row[6] || '') ? `https://x.com/${row[6].replace('@','')}` : '', scopeConfirmed: false } satisfies Seed];
  });
}
export function decodeHtml(text: string): string {
  return text.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => { const n=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):parseInt(code,10); return n>0&&n<=0x10ffff?String.fromCodePoint(n):''; })
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
export function attributes(tag: string): Record<string,string> {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map((m) => [m[1].toLowerCase(), decodeHtml(m[3])]));
}
export function xMetadata(html: string) {
  const meta = Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/gi)].map(m => attributes(m[0])).filter(a => a.property).map(a => [a.property, a.content || '']));
  const links = [...html.matchAll(/<a\b[^>]*>/gi)].map(m => attributes(m[0]));
  return { title: meta['og:title'] || '', text: meta['og:description'] || '', links };
}
export function noticeLinks(html: string, ownAuthor?: string): string[] {
  const urls = xMetadata(html).links.flatMap(({href = ''}) => {
    const match = href.match(/^(?:https:\/\/(?:x|twitter)\.com)?\/([a-z0-9_]{1,15})\/status\/(\d+)(?:[/?#].*)?$/i);
    return match && (!ownAuthor || match[1].toLowerCase() === ownAuthor.toLowerCase()) ? [`https://x.com/${match[1]}/status/${match[2]}`] : [];
  });
  return [...new Set(urls)];
}
// 게시물 본문에 실제로 들어 있는 단축 링크만 확장한다. 답글의 채널 주소는 근거에서 제외한다.
export function primaryChannels(html: string): ReturnType<typeof canonicalChannel>[] {
  const {text,links} = xMetadata(html);
  const values = [...text.matchAll(/https:\/\/[^\s<>"'…]+/g)].map(m => m[0]);
  for (const a of links) if (a.href && text.includes(a.href) && a.title) values.push(a.title);
  return [...new Map(values.map(canonicalChannel).filter((c): c is NonNullable<typeof c> => !!c).map(c=>[c.key,c])).values()];
}
// 이름 유사성이나 일방적인 채널 링크로 공지 작성자를 본인으로 단정하지 않는다.
export function officialAuthorLink(bio:string,xUrl:string):boolean{
  const author=xUrl.match(/^https:\/\/(?:x|twitter)\.com\/([a-z0-9_]{1,15})\/?$/i)?.[1];if(!author)return false;
  const link=new RegExp(`https?:\\/\\/(?:www\\.)?(?:x|twitter)\\.com\\/${author}(?=[/\\s?#\"'<>]|$)`,'i');
  return decodeHtml(bio).replace(/<br\s*\/?>/gi,'\n').split(/\r?\n/).some(line=>link.test(line)
    && !/(사칭|도용|팬아트|일러스트|리깅|디자인|그림|mama|papa|artist|rigger|credit)/i.test(line)
    && (/(트위터|twitter|공식\s*(?:X|계정)|(?:^|\s)X\s*[:：])/i.test(line)||/^\s*https?:\/\/\S+\s*$/.test(line)));
}
// 연도·날짜·시각·시간대를 모두 명시한 단일 데뷔 공지만 자동 확정한다.
export function parsePrimaryNotice(html: string, url: string): Seed | null {
  const {title,text} = xMetadata(html), author=url.match(/x\.com\/([\w]+)\/status\/(\d+)/i);
  if (!author || !title.toLowerCase().includes(`@${author[1].toLowerCase()}`) || !text || needsContentReview(text)) return null;
  if (/(재데뷔|재\s*데뷔|프리\s*데뷔|신의상|모델\s*공개|Live\s*2D|이적|플랫폼\s*데뷔|연기|취소|해외|시차)/i.test(text)) return null;
  if (!/(첫\s*방송|버[튜츄]버\s*데뷔|버[튜츄]얼\s*데뷔)/i.test(text)) return null;
  const dates=[...text.matchAll(/(20\d{2})\s*[년.\-/]\s*(\d{1,2})\s*[월.\-/]\s*(\d{1,2})\s*일?/g)];
  const times=[...text.matchAll(/(?:(오전|오후|AM|PM)\s*)?(\d{1,2})(?:\s*:\s*(\d{2})|\s*시(?:\s*(\d{1,2})\s*분)?)/gi)];
  if (dates.length!==1 || times.length!==1 || !/(KST|한국\s*시간|서울\s*시간)/i.test(text)) return null;
  const d=dates[0],t=times[0],date=`${d[1]}-${d[2].padStart(2,'0')}-${d[3].padStart(2,'0')}`;
  let hour=Number(t[2]); if(t[1]){if(hour<1||hour>12)return null;hour=hour%12+(/오후|PM/i.test(t[1])?12:0);}
  const time=`${String(hour).padStart(2,'0')}:${(t[3]||t[4]||'00').padStart(2,'0')}`;
  const channels=primaryChannels(html); if(channels.length!==1 || !channels[0] || !validDay(date) || !portalUtc(date,time,'Asia/Seoul'))return null;
  const channel=channels[0];
  return { id:`x:${author[2]}`,channelKey:channel.key,platform:channel.platform,channelUrl:channel.url,name:'',date,time,timezone:'Asia/Seoul',kind:'FIRST_DEBUT',source:'X_NOTICE',sourceUrl:url,primaryUrl:url,xUrl:`https://x.com/${author[1]}`,scopeConfirmed:true };
}
export function extractLabelledDetails(text: string): ProfileDetails {
  const result: ProfileDetails = {};
  const labels = [['species','종족'],['birthday','생일'],['height','신장|키'],['mbti','MBTI'],['fandomName','팬덤명|팬네임'],['oshiMark','오시마크|팬마크']] as const;
  for (const [key,label] of labels) {
    const m=text.normalize('NFKC').match(new RegExp(`(?:^|\\n)\\s*(?:${label})\\s*[:：]\\s*([^\\r\\n<>]{1,60})`,'i'));
    if (!m || needsContentReview(m[1]) || /미정|비공개|추후|TBD/i.test(m[1]))continue;
    const value=m[1].trim();
    if(key==='mbti'&&!/^[IE][NS][FT][JP]$/i.test(value))continue;
    if(key==='height'&&!/^\d{2,3}(?:\.\d)?\s*cm$/i.test(value))continue;
    if(key==='birthday'&&!/^\d{1,2}월\s*\d{1,2}일$/.test(value))continue;
    result[key]=value;
  }
  return result;
}
export function buildProfile(seed: Seed, name: string, avatarUrl: string, now: string): PortalProfile {
  if (!seed.scopeConfirmed || !['FIRST_DEBUT','PLATFORM_DEBUT'].includes(seed.kind)) throw new Error('EVENT_SCOPE_UNCONFIRMED');
  if (!name || name.length>100 || looksLikeVideoTitle(name) || needsContentReview(name)) throw new Error('NAME_CONTENT_HOLD');
  const startAtUtc=portalUtc(seed.date,seed.time,seed.timezone);if(!startAtUtc)throw new Error('SCHEDULE_UNCONFIRMED');
  const scope=seed.kind==='PLATFORM_DEBUT'?`${seed.platform} 플랫폼 데뷔`:'버튜버 데뷔';
  const profile: PortalProfile={slug:`${seed.channelKey.split(':')[1]}-${seed.platform.toLowerCase()}`, displayName:name,
    description:`${name}의 ${scope} 일정입니다. 공식 공지와 방송국에서 확인한 정보를 안내합니다.`,avatarUrl,
    platform:seed.platform,channelUrl:seed.channelUrl,countryCode:seed.timezone==='Asia/Seoul'?'KR':'',languages:[],tags:[],agency:'',xUrl:seed.xUrl||'',
    debutKind:seed.kind as 'FIRST_DEBUT'|'PLATFORM_DEBUT', dateState:'FIXED',debutDate:seed.date,debutTime:seed.time,timezone:seed.timezone,startAtUtc,targetMonth:seed.date.slice(0,7),
    ownerVerified:false,source:'REGISTERED',noticeUrl:seed.primaryUrl,headline:scope};
  const reviewed=reviewedProfile(profile,'APPROVED',now);
  if(!isPublicProfile(reviewed))throw new Error('PUBLIC_POLICY_HOLD');return reviewed;
}
