import type { ProfileDetails } from '../../../shared/profileDetails';
import { needsContentReview } from '../../../shared/contentReview';
import { decodeHtml, type Seed } from './policy';
import { BudgetNetwork } from './network';

type Evidence={url:string;fields:string[]};
export type ProfileEnrichment={details:ProfileDetails;regularSchedule:string;evidence:Evidence[];conflicts:string[]};
const HEADERS={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'};

// 공개 글의 문단·줄 경계만 보존한다. 이미지 속 글자와 댓글은 추출하지 않는다.
export function profilePlainText(html:string):string{
  return decodeHtml(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6]|tr)>/gi,'\n').replace(/<[^>]+>/g,' '))
    .replace(/&nbsp;|\u00a0/g,' ').replace(/[\t ]+/g,' ').replace(/\r\n?/g,'\n').trim();
}
function birthday(value:string):string{
  const m=value.match(/^(\d{1,2})\s*(?:월|[./-])\s*(\d{1,2})(?:\s*일)?$/)||value.match(/^(\d{2})(\d{2})$/);
  if(!m)return '';const month=Number(m[1]),day=Number(m[2]);
  const date=new Date(Date.UTC(2000,month-1,day));return date.getUTCMonth()===month-1&&date.getUTCDate()===day?`${month}월 ${day}일`:'';
}
// 명시된 라벨과 독립된 제원 행만 읽는다. 팬닉·게임 캐릭터·나이를 종족이나 팬덤명으로 바꾸지 않는다.
export function extractProfileFacts(text:string):Pick<ProfileEnrichment,'details'|'regularSchedule'|'conflicts'>{
  const lines=profilePlainText(text).normalize('NFKC').split('\n').map(s=>s.trim()).filter(Boolean),details:ProfileDetails={},conflicts:string[]=[];
  const put=(key:keyof ProfileDetails,value:string)=>{if(!value||/미정|비공개|추후|TBD/i.test(value)||needsContentReview(value))return;if(details[key]&&details[key]!==value){delete details[key];conflicts.push(key);}else if(!conflicts.includes(key))details[key]=value;};
  const labels:[keyof ProfileDetails,string][]=[['species','종족'],['birthday','생일'],['height','신장|키'],['bloodType','혈액형'],['mbti','MBTI'],['zodiac','별자리'],['fandomName','팬덤명|팬네임|팬덤'],['oshiMark','오시\\s*마크|팬\\s*마크'],['fanArtTag','팬아트\\s*태그'],['contentSummary','주요\\s*콘텐츠|자주\\s*하는\\s*게임|좋아하는\\s*게임|자주\\s*하고\\s*싶은\\s*컨텐츠']];
  let regularSchedule='';
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    for(const [key,label]of labels){
      const m=line.match(new RegExp(`^(?:${label})\\s*[:：•·]\\s*(.{1,400})$`,'i'));if(!m)continue;
      let value=m[1].trim();
      if(key==='mbti'){const match=value.match(/^([IE][NS][FT][JP](?:-[AT])?)(?=$|\s|\()/i);value=match?match[1].toUpperCase():'';}
      else if(key==='birthday')value=birthday(value);
      else if(key==='height')value=value.match(/^\d{2,3}(?:\.\d)?\s*cm(?=$|\s)/i)?.[0].trim()||'';
      else if(key==='bloodType')value=/^(?:A|B|AB|O)형$/i.test(value)?value.toUpperCase():'';
      else if(key==='zodiac')value=/^(?:양|황소|쌍둥이|게|사자|처녀|천칭|전갈|궁수|염소|물병|물고기)자리$/.test(value)?value:'';
      if(value.length<=(key==='contentSummary'?400:key==='species'?80:key==='fanArtTag'?100:60))put(key,value);
    }
    const born=line.match(/^(\d{1,2}월\s*\d{1,2})일생(?:\s*[•·]\s*.*)?$/);
    if(born)put('birthday',birthday(`${born[1]}일`));
    if(/^[IE][NS][FT][JP](?:-[AT])?$/i.test(line))put('mbti',line.toUpperCase());
    // 한 줄에 함께 명시한 별자리·혈액형은 직접 표기된 값만 분리한다.
    if(born)for(const token of line.split(/[•·]/).slice(1).map(s=>s.trim())){if(/^(?:A|B|AB|O)형$/i.test(token))put('bloodType',token.toUpperCase());if(/^(?:양|황소|쌍둥이|게|사자|처녀|천칭|전갈|궁수|염소|물병|물고기)자리$/.test(token))put('zodiac',token);}
    const schedule=line.match(/^방송\s*(?:시간대|시간)\s*[:：•·]\s*(.{1,160})$/i);
    if(schedule&&!/미정|비공개|추후/.test(schedule[1])){
      let value=schedule[1].trim();if(lines[i+1]&&/^[(*（].*(?:유동|랜덤|스케|휴뱅|공지)/.test(lines[i+1]))value+=` ${lines[i+1]}`;
      if(!needsContentReview(value)){if(regularSchedule&&regularSchedule!==value)conflicts.push('regularSchedule');else regularSchedule=value;}
    }
  }
  if(conflicts.includes('regularSchedule'))regularSchedule='';
  return {details,regularSchedule,conflicts};
}
export async function collectProfileEnrichment(net:BudgetNetwork,seed:Seed,channel:{bio:string;apiUrl:string}):Promise<ProfileEnrichment>{
  const texts=[{url:channel.apiUrl,text:channel.bio}];
  if(seed.platform==='SOOP'){
    const id=seed.channelKey.slice(5),base=channel.apiUrl.replace(/\/station$/,''),home=await net.json(`${base}/home`,HEADERS);
    const boards=(home.data&&typeof home.data==='object'?(home.data as Record<string,unknown>).boards:home.boards);
    if(!Array.isArray(boards))throw new Error('PROFILE_HOME_SCHEMA_CHANGED');
    const selected=boards.filter((b:Record<string,unknown>)=>/^\d{1,16}$/.test(String(b.title_no||''))&&/프로필|profile|소개|정보/i.test(`${b.bbs_name||''} ${b.title_name||''}`)).slice(0,1);
    for(const item of selected){
      const url=`${base}/title/${item.title_no}`,raw=await net.json(url,HEADERS),post=(raw.data&&typeof raw.data==='object'?raw.data:raw) as Record<string,unknown>;
      if(String(post.user_id||'').toLowerCase()!==id||String(post.title_no)!==String(item.title_no))throw new Error('PROFILE_POST_AUTHOR_HOLD');
      const content=post.content as Record<string,unknown>|undefined;
      if(typeof content?.content==='string')texts.push({url,text:profilePlainText(content.content)});
    }
  }
  const result:ProfileEnrichment={details:{},regularSchedule:'',evidence:[],conflicts:[]};
  for(const {url,text}of texts){
    const facts=extractProfileFacts(text),fields:string[]=[];
    for(const [key,value]of Object.entries(facts.details)){
      if(result.details[key as keyof ProfileDetails]&&result.details[key as keyof ProfileDetails]!==value){delete result.details[key as keyof ProfileDetails];result.conflicts.push(key);}
      else if(!result.conflicts.includes(key)){result.details[key as keyof ProfileDetails]=value;fields.push(`details.${key}`);}
    }
    if(facts.regularSchedule){if(result.regularSchedule&&result.regularSchedule!==facts.regularSchedule){result.regularSchedule='';result.conflicts.push('regularSchedule');}else if(!result.conflicts.includes('regularSchedule')){result.regularSchedule=facts.regularSchedule;fields.push('regularSchedule');}}
    result.conflicts.push(...facts.conflicts);result.evidence.push({url,fields});
  }
  for(const key of result.conflicts)if(key!=='regularSchedule')delete result.details[key as keyof ProfileDetails];
  return result;
}
