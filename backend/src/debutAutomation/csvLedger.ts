import type { PortalProfile } from '../../../shared/portal';
import { portalChannelKey } from '../../../shared/portal';
import { parseCsvRows } from '../services/crawlerCsv';
import { sha256 } from './network';
import { canonicalChannel, kstDay, seedHashInput, type Seed } from './policy';
import type { Candidate, DiscoveryStore, Snapshot } from './store';

export const CSV_HEADERS = {
 'new-debuts.csv':'작성일,스트리머명*,플랫폼*,채널URL*,데뷔날짜*,데뷔시간*,소속사,국가코드,소개글,프로필이미지URL,X(트위터)URL,연락처이메일,업데이트 여부 T/F',
 'profile-updates.csv':'작성일,프로필식별자,플랫폼,채널URL,활동명,수정항목,기존값,변경값,출처URL,공지일,확인시각,검증상태,비고,업데이트 여부 T/F',
 'research-log.csv':'작성일,후보ID,활동명,플랫폼,채널URL,기존프로필식별자,등록대조,행사분류,일정확인상태,대상월,확인된날짜,확인된시간,시간대,처리결과,출처URL,채널검증URL,공지일,확인시각,근거요약,보류제외사유,추가확인정보_JSON,기존등록조회시각,원문SHA256,업로드주의사항,조사한계,업데이트 여부 T/F',
} as const;
type Filename=keyof typeof CSV_HEADERS;
export type CsvBundle=Record<Filename,string>;
type State={month:string;revision:number;hash:string;files:CsvBundle};
type Evidence={schemaVersion:number;seed:Seed;sourceHash?:string;verifiedProfile?:PortalProfile;fields?:string[];fieldEvidence?:{url:string;fields:string[]}[]};
export type CsvPublication={candidateId:string;profile:PortalProfile;month:string;revision:number;bundleHash:string;sourceHash:string;profileHash:string;fields:string[]};
const N='new-debuts.csv',U='profile-updates.csv',R='research-log.csv';
const MAX_BUNDLE=512*1024,MAX_WRITE=4*1024*1024;

export function encodeCsv(rows:string[][]):string {
 return '\uFEFF'+rows.map(row=>row.map(cell=>/[",\r\n]/.test(cell)?`"${cell.replace(/"/g,'""')}"`:cell).join(',')).join('\r\n')+'\r\n';
}
export function validateBundle(files:CsvBundle):void {
 for(const name of Object.keys(CSV_HEADERS) as Filename[]){
  if(typeof files[name]!=='string')throw new Error('CSV_FILE_MISSING');
  const rows=parseCsvRows(files[name]),header=CSV_HEADERS[name].split(',');
  if(rows[0]?.join(',')!==CSV_HEADERS[name]||rows.length>2001||rows.some(row=>row.length!==header.length))throw new Error('CSV_SCHEMA_HOLD');
  if(rows.slice(1).some(row=>!/^\d{4}-\d{2}-\d{2}$/.test(row[0])||!['T','F'].includes(row[row.length-1]||'')))throw new Error('CSV_STATE_HOLD');
 }
}
function emptyBundle():CsvBundle{return Object.fromEntries(Object.entries(CSV_HEADERS).map(([name,header])=>[name,encodeCsv([header.split(',')])])) as CsvBundle;}
function evidence(row:string[]):Evidence|null{try{const value=JSON.parse(row[20]||'{}') as Evidence;return value.schemaVersion===1&&value.seed?.id===row[1]?value:null;}catch{return null;}}
function valueText(value:unknown):string{return value===undefined||value===null?'':typeof value==='string'?value:JSON.stringify(value);}
export function profileChanges(before:PortalProfile,after:PortalProfile):{field:string;before:string;after:string}[]{
 const result:{field:string;before:string;after:string}[]=[];
 for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
  if(['contentReview','updatedAt'].includes(key))continue;
  if(key==='details'){
   for(const field of new Set([...Object.keys(before.details||{}),...Object.keys(after.details||{})])){
    const b=valueText((before.details as Record<string,unknown>|undefined)?.[field]),a=valueText((after.details as Record<string,unknown>|undefined)?.[field]);
    if(b!==a)result.push({field:`details.${field}`,before:b,after:a});
   }
  }else{
   const b=valueText(before[key as keyof PortalProfile]),a=valueText(after[key as keyof PortalProfile]);
   if(b!==a)result.push({field:key,before:b,after:a});
  }
 }
 return result;
}

export class CsvLedger {
 private states=new Map<string,State>();
 writtenBytes=0;
 constructor(private store:DiscoveryStore,private now:string){}
 private async read(month:string):Promise<State>{
  const rows=await this.store.all<{revision:number;bundle_hash:string;bundle_json:string}>(`SELECT m.revision,m.bundle_hash,r.bundle_json FROM debut_csv_months m JOIN debut_csv_revisions r ON r.month=m.month AND r.revision=m.revision WHERE m.month=?`,[month]);
  if(!rows.length)return {month,revision:0,hash:'',files:emptyBundle()};
  const row=rows[0];if(await sha256(row.bundle_json)!==row.bundle_hash)throw new Error('CSV_HASH_MISMATCH');
  const files=JSON.parse(row.bundle_json) as CsvBundle;validateBundle(files);
  return {month,revision:row.revision,hash:row.bundle_hash,files};
 }
 private async state(month:string):Promise<State>{
  if(!/^20\d{2}-\d{2}$/.test(month))throw new Error('CSV_MONTH_INVALID');
  let value=this.states.get(month);if(!value){value=await this.read(month);this.states.set(month,value);}return value;
 }
 private async save(state:State,phase:string):Promise<State>{
  validateBundle(state.files);
  const json=JSON.stringify(state.files),hash=await sha256(json),bytes=new TextEncoder().encode(json).byteLength;
  if(hash===state.hash)return state;
  const limit=phase==='AFTER_PUBLIC_CHECK'?MAX_WRITE:MAX_WRITE-2*MAX_BUNDLE;
  if(bytes>MAX_BUNDLE||this.writtenBytes+bytes>limit)throw new Error('CSV_WRITE_BUDGET_EXCEEDED');
  const revision=state.revision+1;
  const results=await this.store.batch([
   {sql:`INSERT INTO debut_csv_revisions(month,revision,run_id,phase,bundle_json,bundle_hash,created_at) SELECT ?,?,?,?,?,?,? WHERE COALESCE((SELECT revision FROM debut_csv_months WHERE month=?),0)=? AND EXISTS(SELECT 1 FROM debut_automation_control WHERE enabled=1 AND lease_owner=? AND lease_until>?)`,args:[state.month,revision,this.store.runId,phase,json,hash,this.now,state.month,state.revision,this.store.runId,new Date().toISOString()]},
   {sql:`INSERT INTO debut_csv_months(month,revision,bundle_hash) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM debut_csv_revisions WHERE month=? AND revision=? AND run_id=?) ON CONFLICT(month) DO UPDATE SET revision=excluded.revision,bundle_hash=excluded.bundle_hash WHERE debut_csv_months.revision=?`,args:[state.month,revision,hash,state.month,revision,this.store.runId,state.revision]},
  ]);
  if(results.some(r=>r.meta.changes!==1))throw new Error('CSV_CONCURRENT_CHANGE_HOLD');
  this.writtenBytes+=bytes;
  // 저장 전에 가지고 있던 객체를 등록 입력으로 쓰지 않고 DB의 CSV를 다시 읽는다.
  const saved=await this.read(state.month);if(saved.hash!==hash)throw new Error('CSV_READBACK_MISMATCH');
  this.states.set(state.month,saved);return saved;
 }
 async knownChannelKeys():Promise<Set<string>>{
  const rows=await this.store.all<{bundle_json:string;bundle_hash:string}>(`SELECT r.bundle_json,r.bundle_hash FROM debut_csv_months m JOIN debut_csv_revisions r ON r.month=m.month AND r.revision=m.revision ORDER BY m.month DESC LIMIT 12`);
  const keys=new Set<string>();
  for(const row of rows){
   if(await sha256(row.bundle_json)!==row.bundle_hash)throw new Error('CSV_HASH_MISMATCH');
   const files=JSON.parse(row.bundle_json) as CsvBundle;validateBundle(files);
   for(const record of parseCsvRows(files[N]).slice(1)){const key=canonicalChannel(record[3])?.key;if(key)keys.add(key);}
   for(const record of parseCsvRows(files[R]).slice(1)){const key=canonicalChannel(record[4])?.key;if(key)keys.add(key);}
  }
  return keys;
 }
 async recordSearchLeads(month:string,leads:{id:string;url:string;title:string;query:string;known:boolean;channelUrl:string}[]):Promise<number>{
  const state=await this.state(month),rows=parseCsvRows(state.files[R]);let added=0;
  for(const lead of leads){
   if(rows.some(row=>row[1]===lead.id))continue;
   const row=Array(26).fill('');row[0]=kstDay(Date.parse(this.now));row[1]=lead.id;row[4]=lead.channelUrl;
   row[6]=lead.known?'기존 고유 ID·CSV 일치':'고유 ID 미확인';
   row[8]='UNCONFIRMED';row[9]=month;row[13]='SEARCH_LEAD_HOLD';row[14]=lead.url;row[17]=this.now;
   row[18]=`검색 제목: ${lead.title}`;row[19]='검색 결과는 원문 검증 근거가 아님';row[20]=JSON.stringify({schemaVersion:1,searchOnly:true,query:lead.query});
   row[24]='검색 단서. 행사·일시·작성자 미확인. 자동 공개 입력으로 사용하지 않음.';row[25]='F';rows.push(row);added++;
  }
  state.files[R]=encodeCsv(rows);const saved=await this.save(state,'SEARCH_LEADS');
  const actual=parseCsvRows(saved.files[R]);if(leads.some(lead=>!actual.some(row=>row[1]===lead.id)))throw new Error('SEARCH_CSV_READBACK_MISSING');
  return added;
 }
 async recoverPending(snapshot:Snapshot):Promise<CsvPublication[]>{
  const rows=await this.store.all<{candidate_id:string;source_hash:string;profile_hash:string;month:string;revision:number;bundle_hash:string;channel_key:string}>(`SELECT c.*,a.channel_key FROM debut_csv_receipts c JOIN debut_automation_candidates a ON a.id=c.candidate_id AND a.source_hash=c.source_hash WHERE a.status IN ('PUBLISHED_PENDING_CHECK','UNCHANGED') LIMIT 64`);
  const pending:CsvPublication[]=[];
  for(const receipt of rows){
   const state=await this.state(receipt.month),row=parseCsvRows(state.files[R]).slice(1).find(r=>r[1]===receipt.candidate_id);
   if(!row||row[25]==='T')continue;
   const profile=evidence(row)?.verifiedProfile,actual=snapshot.keys.get(receipt.channel_key);
   if(!profile||!actual||await sha256(JSON.stringify(profile))!==receipt.profile_hash||await sha256(JSON.stringify(actual))!==receipt.profile_hash)continue;
   pending.push({candidateId:receipt.candidate_id,profile,month:receipt.month,revision:receipt.revision,bundleHash:receipt.bundle_hash,sourceHash:receipt.source_hash,profileHash:receipt.profile_hash,fields:evidence(row)?.fields||[]});
  }
  return pending;
 }
 private research(state:State,seed:Seed):{rows:string[][];row:string[]}{
  const rows=parseCsvRows(state.files[R]);let row=rows.slice(1).find(r=>r[1]===seed.id);
  if(!row){row=Array(26).fill('');row[0]=kstDay(Date.parse(this.now));row[1]=seed.id;row[25]='F';rows.push(row);}
  const prior=evidence(row);
  if(prior&&JSON.stringify(prior.seed)!==JSON.stringify(seed))row[25]='F';
  Object.assign(row,{2:seed.name,3:seed.platform,4:seed.channelUrl,7:seed.kind,8:seed.date&&seed.time?'FIXED':'UNCONFIRMED',9:state.month,10:seed.date,11:seed.time,12:seed.timezone,14:seed.primaryUrl||seed.sourceUrl,17:this.now,18:`발견 출처: ${seed.source}`,20:JSON.stringify({...prior,schemaVersion:1,seed})});
  return {rows,row};
 }
 async ingest(seeds:Seed[]):Promise<Map<string,Seed>>{
  const months=new Set<string>();
  for(const seed of seeds){
   const month=seed.date?.slice(0,7)||kstDay(Date.parse(this.now)).slice(0,7),state=await this.state(month);
   const stored=parseCsvRows(state.files[R]).slice(1).find(r=>r[1]===seed.id),prior=stored&&evidence(stored);
   months.add(month);
   if(prior&&seedHashInput(prior.seed)===seedHashInput(seed))continue;
   const {rows}=this.research(state,seed);
   state.files[R]=encodeCsv(rows);months.add(month);
  }
  const imported=new Map<string,Seed>();
  for(const month of months){
   const saved=await this.save(await this.state(month),'DISCOVERY');
   for(const row of parseCsvRows(saved.files[R]).slice(1)){
    const item=evidence(row);if(!item)continue;
    const channel=canonicalChannel(row[4]);
    if(!channel||channel.key!==item.seed.channelKey||row[3]!==item.seed.platform)throw new Error('CSV_CHANNEL_MISMATCH');
    imported.set(row[1],{...item.seed,name:row[2],channelUrl:channel.url,date:row[10],time:row[11],timezone:row[12]});
   }
  }
  return imported;
 }
 async prepare(candidate:Candidate,profile:PortalProfile,previous:PortalProfile|null,fieldEvidence:{url:string;fields:string[]}[]=[]):Promise<CsvPublication>{
  const seed=JSON.parse(candidate.seed) as Seed,month=profile.debutDate.slice(0,7)||kstDay(Date.parse(this.now)).slice(0,7),state=await this.state(month);
  const {rows,row}=this.research(state,seed),changes=previous?profileChanges(previous,profile):[];
  const item:Evidence={schemaVersion:1,seed,sourceHash:candidate.source_hash,verifiedProfile:profile,fields:changes.map(c=>c.field),fieldEvidence};
  Object.assign(row,{2:profile.displayName,5:profile.slug,6:previous?'EXISTING':'NEW',7:profile.debutKind||seed.kind,10:profile.debutDate,11:profile.debutTime,12:profile.timezone,13:'VERIFIED_PENDING_APPLY',15:profile.channelUrl,17:this.now,19:'',20:JSON.stringify(item),21:this.now});
  state.files[R]=encodeCsv(rows);
  if(!previous){
   const list=parseCsvRows(state.files[N]),key=portalChannelKey(profile.channelUrl,profile.platform);
   let target=list.slice(1).find(r=>canonicalChannel(r[3])?.key===key);
   if(!target){target=Array(13).fill('');target[0]=row[0];target[12]='F';list.push(target);}
   const updated=[target[0],profile.displayName,profile.platform,profile.channelUrl,`${profile.debutDate} (KST)`,profile.debutTime,profile.agency||'',profile.countryCode||'',profile.description,profile.avatarUrl,profile.xUrl||'','',target[12]];
   if(target.slice(1,12).join('\0')!==updated.slice(1,12).join('\0'))updated[12]='F';
   list[list.indexOf(target)]=updated;state.files[N]=encodeCsv(list);
  }else if(changes.length){
   const list=parseCsvRows(state.files[U]);
   for(const change of changes){
    const old=list.slice(1).find(r=>r[1]===profile.slug&&r[5]===change.field);
    const source=fieldEvidence.find(e=>e.fields.includes(change.field))?.url||profile.noticeUrl||seed.primaryUrl||seed.sourceUrl;
    const update=[old?.[0]||row[0],profile.slug,profile.platform,profile.channelUrl,profile.displayName,change.field,change.before,change.after,source,'',this.now,'VERIFIED','공식 근거 자동 검사',old?.[7]===change.after?old[13]:'F'];
    if(old)list[list.indexOf(old)]=update;else list.push(update);
   }
   state.files[U]=encodeCsv(list);
  }
  const saved=await this.save(state,'BEFORE_PUBLICATION'),stored=parseCsvRows(saved.files[R]).slice(1).find(r=>r[1]===candidate.id),prepared=stored&&evidence(stored);
  if(!prepared?.verifiedProfile||prepared.sourceHash!==candidate.source_hash)throw new Error('CSV_PUBLICATION_PROOF_MISSING');
  const actual=prepared.verifiedProfile;
  if(JSON.stringify(actual)!==JSON.stringify(profile)||actual.slug!==profile.slug||portalChannelKey(actual.channelUrl,actual.platform)!==candidate.channel_key)throw new Error('CSV_PUBLICATION_MISMATCH');
  const receipt:CsvPublication={candidateId:candidate.id,profile:actual,month,revision:saved.revision,bundleHash:saved.hash,sourceHash:candidate.source_hash,profileHash:await sha256(JSON.stringify(actual)),fields:prepared.fields||[]};
  await this.store.execute(`INSERT INTO debut_csv_receipts(candidate_id,source_hash,profile_hash,month,revision,bundle_hash,run_id,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(candidate_id) DO UPDATE SET source_hash=excluded.source_hash,profile_hash=excluded.profile_hash,month=excluded.month,revision=excluded.revision,bundle_hash=excluded.bundle_hash,run_id=excluded.run_id,created_at=excluded.created_at`,[candidate.id,candidate.source_hash,receipt.profileHash,month,saved.revision,saved.hash,this.store.runId,this.now]);
  return receipt;
 }
 async repairFieldSources(profiles:PortalProfile[],candidates:Candidate[]):Promise<number>{
  let corrected=0;const changed=new Set<string>();
  for(const candidate of candidates){
   const metadata=JSON.parse(candidate.evidence||'{}');
   const facts=metadata.fieldEvidence as {url:string;fields:string[]}[]|undefined;
   const profile=profiles.find(p=>p.slug===candidate.profile_slug);if(!facts?.length||!profile)continue;
   const month=profile.debutDate.slice(0,7);if(!/^20\d{2}-\d{2}$/.test(month))continue;
   const state=await this.state(month),rows=parseCsvRows(state.files[U]);
   for(const row of rows.slice(1)){
    if(row[1]!==profile.slug||row[12]!=='공식 근거 자동 검사')continue;
    if(metadata.detailConflicts?.includes(row[5].replace(/^details\./,'')))continue;
    const seed=JSON.parse(candidate.seed) as Seed;
    if(![profile.noticeUrl,seed.primaryUrl,seed.sourceUrl].includes(row[8]))continue;
    const source=facts.find(e=>e.fields.includes(row[5]))?.url;
    const value=row[5].split('.').reduce<unknown>((v,k)=>v&&typeof v==='object'?(v as Record<string,unknown>)[k]:undefined,profile);
    if(!source||row[7]!==valueText(value)||row[8]===source)continue;
    row[8]=source;corrected++;changed.add(month);
   }
   state.files[U]=encodeCsv(rows);
  }
  for(const month of changed)await this.save(await this.state(month),'FIELD_SOURCE_REPAIR');
  return corrected;
 }
 async complete(publications:CsvPublication[],outcomes:{id:string;reason:string}[]=[]):Promise<void>{
  const months=new Set<string>();
  for(const state of this.states.values()){
   const rows=parseCsvRows(state.files[R]);let changed=false;
   for(const result of outcomes){const row=rows.slice(1).find(r=>r[1]===result.id);if(row){row[13]='HOLD_OR_FAILED';row[19]=result.reason;changed=true;}}
   if(changed){state.files[R]=encodeCsv(rows);months.add(state.month);}
  }
  for(const receipt of publications){
   const state=await this.state(receipt.month),rows=parseCsvRows(state.files[R]),row=rows.slice(1).find(r=>r[1]===receipt.candidateId);
   if(!row||await sha256(JSON.stringify(evidence(row)?.verifiedProfile))!==receipt.profileHash)throw new Error('CSV_COMPLETION_CONFLICT');
   row[13]='PUBLIC_VERIFIED';row[25]='T';state.files[R]=encodeCsv(rows);
   const list=parseCsvRows(state.files[N]),key=portalChannelKey(receipt.profile.channelUrl,receipt.profile.platform);
   const proposal=list.slice(1).find(r=>canonicalChannel(r[3])?.key===key&&r[4]===`${receipt.profile.debutDate} (KST)`&&r[5]===receipt.profile.debutTime);
   if(proposal&&proposal[1]===receipt.profile.displayName&&proposal[9]===receipt.profile.avatarUrl&&proposal[8]===receipt.profile.description)proposal[12]='T';state.files[N]=encodeCsv(list);
   const updates=parseCsvRows(state.files[U]);
   for(const update of updates.slice(1))if(update[1]===receipt.profile.slug&&receipt.fields.includes(update[5])){update[13]='T';update[11]='PUBLIC_VERIFIED';}
   state.files[U]=encodeCsv(updates);months.add(receipt.month);
  }
  for(const month of months)await this.save(await this.state(month),'AFTER_PUBLIC_CHECK');
 }
}
