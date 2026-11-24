const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const esbuild=require('../../frontend/node_modules/esbuild');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'vdebut-discovery-test-'));
const output=path.join(temporary,'bundle.cjs');
esbuild.buildSync({stdin:{contents:`export * from './backend/src/debutAutomation/policy';export * from './backend/src/debutAutomation/network';export * from './backend/src/debutAutomation/store';export * from './backend/src/debutAutomation/runner';export * from './backend/src/debutAutomation/profileEnrichment';export * from './backend/src/debutAutomation/enrichment';export * from './backend/src/debutAutomation/agency';export * from './backend/src/debutAutomation/csvLedger';export * from './backend/src/debutAutomation/webSearch';export * from './backend/src/debutAutomation/tavilyScheduledTest';export * from './backend/src/debutAutomation/tavilyDiscovery';export {parseCsvRows} from './backend/src/services/crawlerCsv';export {officialChannel} from './backend/src/debutAutomation/sources';export {isPublicProfile,reviewedProfile,reviewSnapshot} from './shared/contentReview';export {portalProfileEvent} from './backend/src/services/unifiedEventService';`,resolveDir:path.resolve(__dirname,'../..'),loader:'ts'},outfile:output,bundle:true,platform:'node',format:'cjs',target:'node22',logLevel:'silent'});
const A=require(output);
test('18시 시험 예약은 지정 일시와 10분 창에서만 허용한다',()=>{
 const at='2026-11-13T09:00:00.000Z',time=Date.parse(at);
 assert.equal(A.isTavilyTestSchedule('0 9 13 11 *',time,at,time+30000),true);
 assert.equal(A.isTavilyTestSchedule('0 9 13 11 *',time+86400000,at,time+86400000),false);
 assert.equal(A.isTavilyTestSchedule('0 9 13 11 *',time,at,time+600000),false);
 assert.equal(A.isTavilyTestSchedule('0 0 * * *',time,at,time),false);
 assert.equal(A.isTavilyTestSchedule('* * * * *',time+60000,at,time+61000),true);
 assert.equal(A.isTavilyTestSchedule('* * * * *',time-60000,at,time-59000),false);
 const later='2026-11-13T09:20:00.000Z',laterTime=Date.parse(later);
 assert.equal(A.isTavilyTestSchedule('20 9 13 11 *',laterTime+30000,later,laterTime+31000),true);
 assert.equal(A.isTavilyTestSchedule('0 9 13 11 *',laterTime,later,laterTime),false);
});
test('Workers 지원 수동 모드에서 Tavily 리디렉션을 따라가지 않는다',async()=>{
 let calls=0;const net=new A.BudgetNetwork(Date.now()+30000,async(url,init)=>{calls++;assert.equal(init.redirect,'manual');return new Response('',{status:302,headers:{Location:'https://x.com/credential-trap'}});});
 await assert.rejects(net.tavilySearch({query:'test'},'test-only'),/TAVILY_HTTP_302/);assert.equal(calls,1);
});
test('Tavily 결과는 최대 10개와 HTTPS만 수용한다',()=>{
 assert.throws(()=>A.tavilyTestResults({results:Array(11).fill({})}),/SCHEMA/);
 assert.deepEqual(A.tavilyTestResults({results:[{url:'http://example.com',title:'x'}]}),[]);
 assert.equal(A.tavilyTestResults({results:[{url:'https://example.com/p?utm_source=x#z',title:'x'}]})[0].url,'https://example.com/p');
});
test('서버 Tavily 시험은 검색·CSV를 저장하지만 프로필은 공개하지 않는다',async()=>{
 const f=fixture();f.env.TAVILY_API_KEY='test-key';let calls=0;
 const fetcher=async(url,init)=>{calls++;assert.equal(url,'https://api.tavily.com/search');assert.equal(init.redirect,'manual');const body=JSON.parse(init.body);assert.equal(body.search_depth,'basic');assert.equal(body.auto_parameters,false);return Response.json({usage:{credits:1},results:[{url:'https://x.com/new_author/status/12345',title:'검증 전 공지',content:'추측 등록 금지'}]});};
 const r=await A.runTavilyScheduledTest(f.env,NOW,fetcher);
 assert.equal(r.searches,4);assert.equal(r.reportedCredits,4);assert.equal(r.uniqueUrls,1);assert.equal(r.csvReadback,true);assert.equal(r.publicWrites,0);assert.equal(r.publicUnchanged,true);assert.equal(calls,4);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM portal_profiles').get().n,0);
 assert.ok(csvFiles(f)['research-log.csv'].includes('SEARCH_LEAD_HOLD'));assert.ok(csvFiles(f)['research-log.csv'].includes(',F\r\n'));
 const again=await A.runTavilyScheduledTest(f.env,NOW,fetcher);assert.equal(again,null);assert.equal(calls,4);
});
test('월 Tavily 280회 예약 한도에서는 요청하지 않는다',async()=>{
 const f=fixture();f.env.TAVILY_API_KEY='test-key';f.sql.prepare('UPDATE debut_search_usage SET reserved_credits=280').run();
 let calls=0;const r=await A.runTavilyScheduledTest(f.env,NOW,async()=>{calls++;throw new Error('MUST_NOT_CALL');});
 assert.equal(calls,0);assert.equal(r.status,'FAILED');assert.ok(r.errors.includes('TAVILY_MONTHLY_LIMIT'));
});
test('Tavily 인증 실패도 예약을 환불하거나 무한 재시도하지 않는다',async()=>{
 const f=fixture();f.env.TAVILY_API_KEY='test-key';let calls=0;
 const r=await A.runTavilyScheduledTest(f.env,NOW,async()=>{calls++;return new Response('',{status:401});});
 assert.equal(calls,1);assert.equal(r.status,'FAILED');assert.equal(r.reservedCredits,1);assert.equal(f.sql.prepare('SELECT reserved_credits n FROM debut_search_usage').get().n,5);
});
test('Tavily 키가 없으면 외부 호출 없이 실패를 남긴다',async()=>{
 const f=fixture();let calls=0;const r=await A.runTavilyScheduledTest(f.env,NOW,async()=>{calls++;throw new Error('MUST_NOT_CALL');});
 assert.equal(calls,0);assert.equal(r.status,'FAILED');assert.ok(r.errors.includes('TAVILY_CREDENTIALS_MISSING'));
});
test('기존 초기 시험과 분리하되 Tavily는 최초와 복구 시도 두 번만 허용한다',async()=>{
 const f=fixture(),now=new Date().toISOString();
 for(let i=0;i<12;i++){const store=new A.DiscoveryStore(f.db,'old-smoke-'+i);assert.equal(await store.begin('old-smoke-'+i,'2026-11','SMOKE',now),true);await store.finish('COMPLETED',{});}
 const first=new A.DiscoveryStore(f.db,'tavily-once');assert.equal(await first.begin('tavily-once','2026-11','TAVILY_TEST',now),true);await first.finish('COMPLETED',{});
 const second=new A.DiscoveryStore(f.db,'tavily-once:retry-1');assert.equal(await second.begin('tavily-once:retry-1','2026-11','TAVILY_TEST',now),true);await second.finish('COMPLETED',{});const third=new A.DiscoveryStore(f.db,'tavily-once:retry-2');assert.equal(await third.begin('tavily-once:retry-2','2026-11','TAVILY_TEST',now),false);
});
test('뒤 검색이 실패해도 앞서 받은 단서 CSV를 남긴다',async()=>{
 const f=fixture();f.env.TAVILY_API_KEY='test-key';let calls=0;
 const r=await A.runTavilyScheduledTest(f.env,NOW,async()=>{calls++;return calls===1?Response.json({usage:{credits:1},results:[{url:'https://example.com/notice',title:'앞선 단서'}]}):new Response('',{status:429});});
 assert.equal(r.status,'FAILED');assert.equal(r.searches,1);assert.equal(r.reservedCredits,2);assert.equal(r.csvReadback,true);assert.ok(csvFiles(f)['research-log.csv'].includes('앞선 단서'));
});
const NOW=Date.parse('2026-11-12T00:00:00Z');
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6OmIAAAAASUVORK5CYII=','base64');
const IMAGE='https://profile.img.sooplive.co.kr/LOGO/te/testvt/testvt.jpg';
const channelUrl='https://www.sooplive.com/station/testvt';
function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE streamerChannel(id INTEGER PRIMARY KEY,platform TEXT,channel_url TEXT,channel_name TEXT);
 CREATE TABLE streamerChannel_info(id INTEGER PRIMARY KEY,channel_id INTEGER UNIQUE,slug TEXT UNIQUE,display_name TEXT,description TEXT,profile_image_url TEXT,agency_name TEXT,country_code TEXT,x_url TEXT,debut_date TEXT,debut_time TEXT,timezone TEXT,start_at_utc TEXT);
 CREATE TABLE portal_profiles(slug TEXT PRIMARY KEY,channel_url TEXT UNIQUE,data TEXT,updated_at TEXT);
 CREATE TABLE portal_profile_channels(channel_key TEXT PRIMARY KEY,slug TEXT UNIQUE);
 CREATE TABLE portal_pending_channels(channel_key TEXT PRIMARY KEY,request_id TEXT UNIQUE);
 CREATE TABLE portal_requests(id TEXT PRIMARY KEY,kind TEXT,status TEXT,slug TEXT,payload TEXT);
 CREATE TABLE debut_submissions(id INTEGER PRIMARY KEY,status TEXT,channel_url TEXT);
 CREATE TABLE portal_profile_history(id TEXT PRIMARY KEY,slug TEXT,before_data TEXT,after_data TEXT,reason TEXT,admin_hash TEXT,created_at TEXT);`);
 sql.exec(fs.readFileSync(path.resolve(__dirname,'../migrations/0063_debut_server_automation.sql'),'utf8'));
 sql.exec(fs.readFileSync(path.resolve(__dirname,'../migrations/0065_debut_csv_pipeline.sql'),'utf8'));
 sql.exec(fs.readFileSync(path.resolve(__dirname,'../migrations/0066_tavily_test_usage.sql'),'utf8'));
 let operations=0;
 const execute=(query,args)=>{operations++;const s=sql.prepare(query);if(/^\s*SELECT/i.test(query)){const rows=s.all(...args);return {success:true,results:rows,meta:{changes:0,rows_read:rows.length,rows_written:0}};}const r=s.run(...args);return {success:true,results:[],meta:{changes:Number(r.changes),rows_read:1,rows_written:Number(r.changes)}};};
 const statement=(query,args=[])=>({query,args,bind(...values){return statement(query,values);},async all(){return execute(query,args);},async run(){return execute(query,args);},async first(){return execute(query,args).results[0]||null;}});
 const db={prepare:statement,async batch(statements){sql.exec('BEGIN');try{const results=statements.map(s=>execute(s.query,s.args));sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const site={async fetch(request){const profiles=sql.prepare('SELECT data FROM portal_profiles').all().map(r=>JSON.parse(r.data)).filter(A.isPublicProfile);return Response.json(new URL(request.url).pathname.endsWith('/events')?{success:true,events:profiles.map(A.portalProfileEvent)}:{profiles});}};
 return {db,sql,env:{DB:db,SITE:site,AUTOMATION_VERSION:'test',SMOKE_TEST_UNTIL:''},operations:()=>operations};
}
const soopItem=(extras={})=>({idx:'test-1',expose_yn:'Y',strm_id:'testvt',strm_nick:'테스트 버튜버',schedule_dtm:'2026-11-14 18:00:00',schedule_type:'debut',strm_img_link_path:channelUrl,...extras});
const seed=()=>A.parseSoop({data:[soopItem()]},'2026-11-05','2026-12-12',A.CALENDAR_URL)[0];
const emptySheet='머리1\n머리2\n머리3\n머리4\n번호,날짜,시,분,이름,채널,X,공지\n';
function sourceFetcher({changedImage=false,channelMismatch=false,failedX=false,calendar=[],bio=''}={}){
 let requests=0;const fetcher=async input=>{requests++;const url=new URL(typeof input==='string'?input:input.url);
  if(url.hostname==='welcomevirtual.sooplive.com')return Response.json({data:calendar.length?calendar:[soopItem()]});
  if(url.hostname==='docs.google.com')return new Response(emptySheet);
  if(['www.charonuniverse.com','revernia.co.kr'].includes(url.hostname))return new Response('<html></html>');
  if(url.hostname==='x.com')return failedX?new Response('',{status:403}):new Response('<a href="/test_author/status/2119301126755643875">공지</a>');
  if(url.hostname==='chapi.sooplive.co.kr'&&url.pathname.endsWith('/home'))return Response.json({boards:[]});
  if(url.hostname==='chapi.sooplive.co.kr')return Response.json({station:{user_id:channelMismatch?'other':'testvt',user_nick:'테스트 버튜버',station_title:bio},profile_image:changedImage?IMAGE+'?version=2':IMAGE});
  if(url.hostname==='profile.img.sooplive.co.kr')return new Response(PNG,{headers:{'Content-Type':'image/png'}});
  throw new Error('UNEXPECTED_TEST_URL');
 };return {fetcher,count:()=>requests};
}
function notice(text,extras=''){return `<meta property="og:title" content="신인 (@test_author) on X"><meta property="og:description" content="${text.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${extras}`;}
const primary='https://x.com/test_author/status/2119301126755643875';
const chi='https://chzzk.naver.com/037d7ba305538de29dbf2789071dbb82';

test('정규 Tavily는 이름 없는 검색→원문→CSV→중복→새 프로필·달력 공개까지 연결한다',async()=>{
 const f=fixture(),id='f'.repeat(32),url=`https://chzzk.naver.com/${id}`,image='https://nng-phinf.pstatic.net/new.jpg';
 Object.assign(f.env,{SEARCH_PROVIDER:'TAVILY',TAVILY_API_KEY:'test-key',TAVILY_MONTHLY_LIMIT:'64'});
 const base=sourceFetcher().fetcher;let calls=0;
 const fetcher=async(input,init)=>{const u=new URL(typeof input==='string'?input:input.url);
  if(u.hostname==='api.tavily.com'){calls++;assert.equal(JSON.parse(init.body).search_depth,'basic');return Response.json({usage:{credits:1},results:[{url:primary,title:'새 버튜버 본인 공지'},{url:'https://namu.wiki/w/SOOP',title:'일반 목록 제외'}]});}
  if(u.href===primary)return new Response(notice(`2026년 11월 14일 오후 6시 KST 버튜버 데뷔 ${url}`));
  if(u.hostname==='api.chzzk.naver.com')return Response.json({code:200,content:{channelId:id,channelName:'새로 찾은 채널',channelImageUrl:image,channelDescription:'Twitter: https://x.com/test_author'}});
  if(u.hostname==='nng-phinf.pstatic.net')return new Response(PNG,{headers:{'Content-Type':'image/png'}});
  return base(input,init);
 };
 const result=await A.runDiscovery(f.env,'DISCOVER',NOW,'tavily-full-pipeline',fetcher);
 assert.equal(calls,4);assert.ok(result.sources.some(s=>s.id==='web-search:tavily'&&s.status==='OK'));
 assert.ok(result.published.some(p=>p.slug===id+'-chzzk'));assert.equal(result.publicVerified,true);
 assert.ok(csvFiles(f)['new-debuts.csv'].includes('새로 찾은 채널'));assert.ok(csvFiles(f)['research-log.csv'].includes('PUBLIC_VERIFIED'));
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM debut_automation_notices').get().n>0,true);
});

test('검색 주소는 개별 공지로 제한하고 월 64크레딧 소진 시 Tavily를 호출하지 않는다',async()=>{
 assert.equal(A.discoveryNoticeUrl('https://namu.wiki/w/SOOP'),null);
 assert.equal(A.discoveryNoticeUrl('https://x.com/a/status/123evil'),null);
 assert.equal(A.discoveryNoticeUrl('https://x.com/a/status/123/photo/1'),'https://x.com/a/status/123');
 const f=fixture(),store=new A.DiscoveryStore(f.db,'limited'),now=new Date().toISOString();await store.begin('limited','2026-11','DISCOVER',now);f.sql.prepare('UPDATE debut_search_usage SET reserved_credits=64').run();let calls=0;
 const net=new A.BudgetNetwork(Date.now()+10000,async()=>{calls++;throw new Error('MUST_NOT_CALL');});net.startPhase('SEARCH',8);
 const result=await A.searchTavily(store,net,new A.CsvLedger(store,now),'2026-11-12',now,'test-key',4,64);
 assert.equal(calls,0);assert.equal(result.reason,'TAVILY_MONTHLY_LIMIT');
});

test('운영 달력이 플랫폼 데뷔를 첫 데뷔로 바꾸면 검색·저장 전에 중단한다',async()=>{
 const f=fixture(),p=A.buildProfile(seed(),'기존',IMAGE,new Date().toISOString());f.sql.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(p.slug,p.channelUrl,JSON.stringify(p));
 const original=f.env.SITE.fetch;f.env.SITE.fetch=async request=>{const r=await original(request);if(!request.url.endsWith('/events'))return r;const body=await r.json();body.events[0].type='FIRST_DEBUT';return Response.json(body);};
 let requests=0;const result=await A.runDiscovery(f.env,'DISCOVER',NOW,'bad-public-contract',async()=>{requests++;throw new Error('MUST_NOT_CALL');});
 assert.equal(result.status,'FAILED');assert.equal(requests,0);assert.ok(result.errors.includes('PUBLIC_PROFILE_CALENDAR_MISMATCH'));assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM portal_profile_history').get().n,0);
});

test('같은 프로필을 재확인하면 CSV 버전을 늘리지 않고 실제 확인 시각은 남긴다',async()=>{
 const f=fixture(),fetcher=sourceFetcher().fetcher;await A.runDiscovery(f.env,'DISCOVER',NOW,'first-save',fetcher);
 const before=f.sql.prepare("SELECT revision FROM debut_csv_months WHERE month='2026-11'").get().revision;
 f.sql.exec("UPDATE debut_automation_candidates SET next_check_at=''");const result=await A.runDiscovery(f.env,'DISCOVER',NOW,'same-save',fetcher);
 assert.equal(result.unchanged,1);assert.equal(result.csvBytesWritten,0);assert.equal(f.sql.prepare("SELECT revision FROM debut_csv_months WHERE month='2026-11'").get().revision,before);
 assert.ok(f.sql.prepare('SELECT last_checked_at FROM debut_automation_candidates').get().last_checked_at);
});

test('항목별 원문을 CSV에 기록하고 이전 자동 기록의 근거도 날짜·T/F 변경 없이 복구한다',async()=>{
 const f=fixture(),store=new A.DiscoveryStore(f.db,'provenance'),now=new Date().toISOString();await store.begin('provenance','2026-11','DISCOVER',now);await store.saveSeed(seed(),now);
 const candidate=(await store.all('SELECT * FROM debut_automation_candidates'))[0],before=A.buildProfile(seed(),'기존',IMAGE,now),after=A.reviewedProfile({...before,details:{birthday:'3월 2일'}},'APPROVED',now),source='https://chapi.sooplive.co.kr/api/testvt/title/123';candidate.profile_slug=after.slug;candidate.evidence=JSON.stringify({fieldEvidence:[{url:source,fields:['details.birthday']}]});
 const ledger=new A.CsvLedger(store,now);await ledger.prepare(candidate,after,before);
 const old=csvFiles(f)['profile-updates.csv'];assert.ok(!old.includes(source));
 assert.equal(await ledger.repairFieldSources([after],[candidate]),1);
 const rows=A.parseCsvRows(csvFiles(f)['profile-updates.csv']),row=rows[1];assert.equal(row[8],source);assert.equal(row.at(-1),'F');assert.equal(row[0],A.parseCsvRows(old)[1][0]);
 const count=ledger.writtenBytes;assert.equal(await ledger.repairFieldSources([after],[candidate]),0);assert.equal(ledger.writtenBytes,count);
});

test('정규 검색의 뒤 요청이 실패해도 앞선 URL과 크레딧 예약을 보존한다',async()=>{
 const f=fixture(),store=new A.DiscoveryStore(f.db,'search-partial'),now=new Date().toISOString();await store.begin('search-partial','2026-11','DISCOVER',now);let calls=0;
 const net=new A.BudgetNetwork(Date.now()+10000,async()=>++calls===1?Response.json({usage:{credits:1},results:[{url:primary,title:'첫 단서'}]}):new Response('',{status:429}));net.startPhase('SEARCH',8);
 const result=await A.searchTavily(store,net,new A.CsvLedger(store,now),'2026-11-12',now,'test-key',4,64);
 assert.equal(calls,2);assert.equal(result.status,'FAILED');assert.equal(result.count,1);assert.ok(csvFiles(f)['research-log.csv'].includes(primary));assert.equal(f.sql.prepare('SELECT reserved_credits n FROM debut_search_usage').get().n,6);
});

test('이미 승인된 큰 이미지를 유지하는 제원 보완은 HEAD로 확인하고 새 이미지는 전체 검사한다',async()=>{
 let calls=0;const net=new A.BudgetNetwork(Date.now()+10000,async(url,init)=>{calls++;assert.equal(init.method,'HEAD');return new Response(null,{headers:{'Content-Type':'image/png','Content-Length':'3116721'}});});
 net.startPhase('PROFILE',4);await net.approvedImageHeaders(IMAGE);assert.equal(calls,1);assert.equal(net.bytes,0);
 await assert.rejects(net.approvedImageHeaders('https://evil.example/image.png'),/IMAGE_HOST/);assert.equal(calls,1);
});

test('이미 완료된 주의 빈 재조회 시각은 다음 정규 회차로 정리하되 확인 시각을 꾸미지 않는다',async()=>{
 const f=fixture(),now='2026-11-18T03:00:00.000Z',store=new A.DiscoveryStore(f.db,'finished-week');await store.begin('finished-week','2026-11','DISCOVER',new Date().toISOString());await store.saveSeed(seed(),now);
 const evidence=JSON.stringify({enrichmentPending:0,enrichmentWeek:'profile:2026-11-09:2026-11-15',enrichmentCompletedWeek:'profile:2026-11-09:2026-11-15'});
 f.sql.prepare("UPDATE debut_automation_candidates SET status='UNCHANGED',evidence=?,last_checked_at='2026-11-15T01:00:00.000Z',next_check_at=''").run(evidence);
 await A.queueEnrichment(store,await store.snapshot(),'DISCOVER','2026-11-18',now);
 const c=f.sql.prepare('SELECT next_check_at,last_checked_at FROM debut_automation_candidates').get();assert.equal(c.next_check_at,A.nextRegularRun(Date.parse(now)));assert.equal(c.last_checked_at,'2026-11-15T01:00:00.000Z');
});

function csvFiles(f,month='2026-11'){
 const current=f.sql.prepare('SELECT r.bundle_json FROM debut_csv_months m JOIN debut_csv_revisions r ON r.month=m.month AND r.revision=m.revision WHERE m.month=?').get(month);
 return current?JSON.parse(current.bundle_json):null;
}

test('서버 CSV는 BOM·CRLF와 인용된 쉼표·줄바꿈을 보존한다',()=>{
 const files=Object.fromEntries(Object.entries(A.CSV_HEADERS).map(([k,v])=>[k,A.encodeCsv([v.split(',')])]));
 files['new-debuts.csv']=A.encodeCsv([A.CSV_HEADERS['new-debuts.csv'].split(','),['2026-11-12','이름, "별"','SOOP',channelUrl,'2026-11-14 (KST)','18:00','','','한 줄\n다음 줄',IMAGE,'','','F']]);
 assert.doesNotThrow(()=>A.validateBundle(files));assert.ok(files['new-debuts.csv'].startsWith('\uFEFF'));assert.ok(files['new-debuts.csv'].endsWith('\r\n'));
});

test('CSV 영수증 없이 공개 저장을 직접 호출해도 등록되지 않는다',async()=>{
 const f=fixture(),store=new A.DiscoveryStore(f.db,'no-csv'),now=new Date().toISOString();
 await store.begin('no-csv','2026-11','DISCOVER',now);await store.saveSeed(seed(),now);
 const candidate=(await store.all('SELECT * FROM debut_automation_candidates'))[0];
 assert.equal(await store.publish(candidate,A.buildProfile(seed(),'새 후보',IMAGE,now),null,await store.snapshot(),now),false);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM portal_profiles').get().n,0);
});

test('CSV 저장이 실패하면 공개 프로필·이력을 쓰지 않는다',async()=>{
 const f=fixture(),batch=f.db.batch;
 f.db.batch=async statements=>{if(statements.some(s=>s.query.includes('INSERT INTO debut_csv_revisions')))throw new Error('CSV_STORAGE_UNAVAILABLE');return batch(statements);};
 const r=await A.runDiscovery(f.env,'SMOKE',NOW,'csv-fail',sourceFetcher().fetcher);
 assert.equal(r.status,'FAILED');assert.equal(r.published.length,0);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM portal_profiles').get().n,0);
});

test('저장된 CSV 내용과 해시가 다르면 공개를 중단한다',async()=>{
 const f=fixture(),network=sourceFetcher();await A.runDiscovery(f.env,'SMOKE',NOW,'csv-good',network.fetcher);
 f.sql.exec("UPDATE debut_csv_revisions SET bundle_json='{}'");
 const r=await A.runDiscovery(f.env,'SMOKE',NOW,'csv-corrupt',network.fetcher);
 assert.equal(r.status,'FAILED');assert.ok(r.errors.includes('CSV_HASH_MISMATCH'));assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM portal_profile_history').get().n,1);
});

test('DB 저장 뒤 T 기록 실패는 다음 회차에 이력 중복 없이 복구한다',async()=>{
 const f=fixture(),batch=f.db.batch;let fail=true;
 f.db.batch=async statements=>{if(fail&&statements.some(s=>s.query.includes('INSERT INTO debut_csv_revisions')&&s.args[3]==='AFTER_PUBLIC_CHECK'))throw new Error('CSV_FINAL_SAVE_UNAVAILABLE');return batch(statements);};
 const first=await A.runDiscovery(f.env,'SMOKE',NOW,'t-first',sourceFetcher().fetcher);
 assert.equal(first.status,'FAILED');assert.equal(first.published.length,1);assert.ok(csvFiles(f)['new-debuts.csv'].includes(',F\r\n'));
 fail=false;
 const second=await A.runDiscovery(f.env,'SMOKE',NOW,'t-recover',sourceFetcher().fetcher);
 assert.equal(second.published.length,0);assert.equal(second.publicVerified,true);assert.ok(csvFiles(f)['new-debuts.csv'].includes(',T\r\n'));
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM portal_profile_history').get().n,1);
});

test('공개 응답이 틀리면 CSV의 F를 T로 바꾸지 않는다',async()=>{
 const f=fixture();f.env.SITE={fetch:async()=>Response.json({profiles:[]})};
 const r=await A.runDiscovery(f.env,'SMOKE',NOW,'public-csv-fail',sourceFetcher().fetcher);
 assert.equal(r.publicVerified,false);assert.ok(csvFiles(f)['new-debuts.csv'].includes(',F\r\n'));
 assert.equal(f.sql.prepare('SELECT status FROM debut_automation_candidates').get().status,'PUBLISHED_PENDING_CHECK');
});

test('단계별 예산을 소진해도 다음 신규 검증 예산은 보존한다',async()=>{
 const net=new A.BudgetNetwork(Date.now()+60000,async()=>new Response('ok'));
 net.startPhase('SEARCH',8);for(let i=0;i<8;i++)await net.get('https://x.com/example');
 await assert.rejects(net.get('https://x.com/example'),/PHASE_BUDGET/);
 net.startPhase('NEW',12);for(let i=0;i<12;i++)await net.get('https://x.com/example');
 assert.equal(net.requests,20);assert.equal(net.allocations.NEW.used,12);
});

test('검색 키가 없으면 검색 성공으로 숨기지 않고 유료 요청도 보내지 않는다',async()=>{
 const f=fixture(),network=sourceFetcher();f.env.SEARCH_PROVIDER='NAVER_HUB';f.env.SEARCH_STORAGE_RIGHTS_APPROVED='true';
 const r=await A.runDiscovery(f.env,'SMOKE',NOW,'missing-search',network.fetcher);
 assert.equal(r.status,'PARTIAL');assert.ok(r.sources.some(s=>s.reason==='SEARCH_CREDENTIALS_MISSING'));assert.equal(r.published.length,1);
});

test('검색 공급자와 저장 권한을 승인하기 전에는 키가 있어도 호출하지 않는다',async()=>{
 const f=fixture(),network=sourceFetcher();Object.assign(f.env,{SEARCH_PROVIDER:'NAVER_HUB',SEARCH_STORAGE_RIGHTS_APPROVED:'false',NAVER_SEARCH_CLIENT_ID:'unused-id',NAVER_SEARCH_CLIENT_SECRET:'unused-secret'});
 const result=await A.runDiscovery(f.env,'SMOKE',NOW,'unapproved-search',network.fetcher);
 assert.equal(result.status,'PARTIAL');assert.ok(result.sources.some(s=>s.reason==='SEARCH_PROVIDER_REVIEW_REQUIRED'));
 assert.equal(result.allocations.SEARCH_AND_NOTICES.used,0);
});

test('검색 인증 헤더를 다른 호스트 리디렉션으로 보내지 않는다',async()=>{
 let calls=0;const net=new A.BudgetNetwork(Date.now()+10000,async()=>{calls++;return new Response('',{status:302,headers:{Location:'https://x.com/wrong'}});});
 await assert.rejects(net.get('https://naverapihub.apigw.ntruss.com/search/v1/webkr',200,{'X-NCP-APIGW-API-KEY':'secret-test-only'}),/CREDENTIAL_REDIRECT_REJECTED/);assert.equal(calls,1);
});

test('이름 없는 검색 결과를 원문·CSV·새 프로필·달력까지 연결한다',async()=>{
 const f=fixture(),id='f'.repeat(32),channel=`https://chzzk.naver.com/${id}`,image='https://nng-phinf.pstatic.net/new.jpg',base=sourceFetcher().fetcher,queries=[];
 Object.assign(f.env,{SEARCH_PROVIDER:'NAVER_HUB',SEARCH_STORAGE_RIGHTS_APPROVED:'true',NAVER_SEARCH_CLIENT_ID:'test-id',NAVER_SEARCH_CLIENT_SECRET:'test-secret'});
 const fetcher=async(input,init)=>{
  const u=new URL(typeof input==='string'?input:input.url);
  if(u.hostname==='naverapihub.apigw.ntruss.com'){queries.push(u.searchParams.get('query'));return Response.json({items:[{link:primary}]});}
  if(u.href===primary)return new Response(notice(`2026년 11월 14일 18시 KST 첫 버튜버 데뷔 ${channel}`));
  if(u.hostname==='api.chzzk.naver.com')return Response.json({code:200,content:{channelId:id,channelName:'검색으로 찾은 테스트 신인',channelImageUrl:image,channelDescription:'트위터: https://x.com/test_author'}});
  if(u.hostname==='nng-phinf.pstatic.net')return new Response(PNG,{headers:{'Content-Type':'image/png'}});
  return base(input,init);
 };
 const r=await A.runDiscovery(f.env,'DISCOVER',NOW,'search-complete',fetcher);
 assert.ok(queries.length>0&&queries.every(q=>!q.includes('테스트 신인')));
 assert.ok(r.published.some(p=>p.slug===id+'-chzzk'));assert.equal(r.publicVerified,true);assert.ok(r.externalRequests<=40);
 assert.ok(csvFiles(f)['new-debuts.csv'].includes('검색으로 찾은 테스트 신인'));assert.ok(csvFiles(f)['new-debuts.csv'].includes(',T\r\n'));
 assert.ok(f.sql.prepare('SELECT COUNT(*) n FROM debut_csv_receipts').get().n>=1);
});

test('소속사 원문도 채널·첫 데뷔·일시·KST가 명시되면 같은 기준으로 공개한다',async()=>{
 const f=fixture(),id='a'.repeat(32),channel=`https://chzzk.naver.com/${id}`,image='https://nng-phinf.pstatic.net/agency.jpg',base=sourceFetcher().fetcher;
 const fetcher=async(input,init)=>{
  const u=new URL(typeof input==='string'?input:input.url);
  if(u.hostname==='www.charonuniverse.com')return new Response(u.searchParams.has('idx')?`<meta property="og:title" content="신인 버튜버 데뷔"><meta property="og:description" content="2026.11.14 KST ✧ 새멤버 | 3:00 PM~ ${channel}">`:'<a href="/notice/?bmode=view&amp;idx=123">신인 데뷔</a>');
  if(u.hostname==='api.chzzk.naver.com')return Response.json({code:200,content:{channelId:id,channelName:'새멤버',channelImageUrl:image,channelDescription:''}});
  if(u.hostname==='nng-phinf.pstatic.net')return new Response(PNG,{headers:{'Content-Type':'image/png'}});
  return base(input,init);
 };
 const r=await A.runDiscovery(f.env,'DISCOVER',NOW,'agency-complete',fetcher);
 assert.ok(r.published.some(p=>p.slug===id+'-chzzk'));assert.equal(r.publicVerified,true);
});

test('한국 자정과 연말에도 일일·주간 날짜 범위를 유지한다',()=>{
 assert.equal(A.kstDay(Date.parse('2026-11-11T15:00:00Z')),'2026-11-12');
 assert.deepEqual(A.windowFor(NOW,'DISCOVER'),{today:'2026-11-12',from:'2026-11-05',to:'2026-12-12'});
 assert.equal(A.windowFor(Date.parse('2026-12-28T01:00:00Z'),'WEEKLY').to,'2027-03-28');
 assert.equal(A.modeFor('0 1 * * MON'),'WEEKLY');assert.equal(A.modeFor('* * * * *'),null);
 assert.equal(A.modeFor('0 1 * * WED'),'RECHECK');assert.equal(A.modeFor('0 1 * * SUN'),'PROFILE');
 assert.equal(A.modeFor('0 0 * * *'),null);assert.equal(A.modeFor('0 12 * * *'),null);
});

test('다음 조사는 월·수·일 한국시간 10시이며 수요일 이후 4일·연말을 넘긴다',()=>{
 for(const [from,to] of [
  ['2026-11-15T09:59:59+09:00','2026-11-15T01:00:00.000Z'],
  ['2026-11-15T10:00:00+09:00','2026-11-16T01:00:00.000Z'],
  ['2026-11-16T10:00:00+09:00','2026-11-18T01:00:00.000Z'],
  ['2026-11-18T10:00:00+09:00','2026-11-22T01:00:00.000Z'],
  ['2026-12-30T10:00:00+09:00','2027-01-03T01:00:00.000Z']
 ])assert.equal(A.nextRegularRun(Date.parse(from)),to);
});

test('일요일은 이번 주 기존 프로필만 보강하고 검색·신규 후보·미래 일정은 건드리지 않는다',async()=>{
 const f=fixture(),at=Date.parse('2026-11-15T10:00:00+09:00'),image='https://nng-phinf.pstatic.net/profile.jpg';
 const profiles=[];
 for(const [i,date,time,state]of [[1,'2026-11-09','18:00','FIXED'],[2,'2026-11-15','09:00','FIXED'],[3,'2026-11-15','21:00','FIXED'],[4,'2026-11-16','18:00','FIXED'],[5,'2026-11-08','18:00','FIXED'],[6,'2026-11-15','','TIME_TBD']]){
  const id=String(i).repeat(32);let p=A.buildProfile({...seed(),channelKey:`CHZZK:${id}`,platform:'CHZZK',channelUrl:`https://chzzk.naver.com/${id}`,date,time:time||'18:00',kind:'FIRST_DEBUT'},'기존 프로필',image,new Date().toISOString());
  p=A.reviewedProfile({...p,dateState:state,...(state==='TIME_TBD'?{startAtUtc:'',debutTime:''}:{}),...(i===2?{details:{fandomName:'기존 팬덤'}}:{})},'APPROVED',new Date().toISOString());
  f.sql.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(p.slug,p.channelUrl,JSON.stringify(p));profiles.push(p);
 }
 const store=new A.DiscoveryStore(f.db,'seed-only');await store.saveSeed(seed(),new Date().toISOString());
 const newBefore=f.sql.prepare('SELECT * FROM debut_automation_candidates').get();
 Object.assign(f.env,{SEARCH_PROVIDER:'NAVER_HUB',SEARCH_STORAGE_RIGHTS_APPROVED:'true',NAVER_SEARCH_CLIENT_ID:'unused',NAVER_SEARCH_CLIENT_SECRET:'unused'});
 let requests=0;const fetcher=async input=>{requests++;const u=new URL(input);
  if(u.hostname==='api.chzzk.naver.com'){const id=u.pathname.split('/').at(-1);return Response.json({code:200,content:{channelId:id,channelName:'기존 프로필',channelImageUrl:image,channelDescription:'팬덤명: 공식 팬덤\n생일: 3월 2일'}});}
  if(u.hostname==='nng-phinf.pstatic.net')return new Response(PNG,{headers:{'Content-Type':'image/png'}});
  throw new Error('SUNDAY_MUST_NOT_DISCOVER');
 };
 const r=await A.runDiscovery(f.env,'PROFILE',at,'sunday-profile',fetcher);
 assert.equal(r.status,'COMPLETED');assert.deepEqual(r.range,{today:'2026-11-15',from:'2026-11-09',to:'2026-11-15'});
 assert.equal(r.discovered,0);assert.equal(r.published.length,0);assert.equal(r.checked,2);assert.equal(r.updated.length,2);assert.equal(r.publicVerified,true);
 assert.equal(r.sources.length,1);assert.equal(r.sources[0].id,'registered-enrichment');
 const after=f.sql.prepare('SELECT data FROM portal_profiles').all().map(row=>JSON.parse(row.data));
 assert.equal(after.find(p=>p.slug===profiles[0].slug).details.fandomName,'공식 팬덤');
 assert.equal(after.find(p=>p.slug===profiles[1].slug).details.fandomName,'기존 팬덤');
 for(const p of profiles.slice(2))assert.deepEqual(after.find(a=>a.slug===p.slug),p);
 assert.deepEqual(f.sql.prepare('SELECT * FROM debut_automation_candidates WHERE id=?').get(seed().id),newBefore);
 const count=requests;const again=await A.runDiscovery(f.env,'PROFILE',at,'sunday-profile-again',fetcher);assert.equal(again.checked,0);assert.equal(requests,count);
});

test('일요일 프로필 기간은 월요일 시작이며 월말·연말도 같은 주로 계산한다',()=>{
 assert.deepEqual(A.windowFor(Date.parse('2027-01-03T10:00:00+09:00'),'PROFILE'),{today:'2027-01-03',from:'2026-12-28',to:'2027-01-03'});
});
test('공식 달력의 debut을 생애 첫 데뷔로 확정하지 않는다',()=>{assert.equal(seed().kind,'PLATFORM_DEBUT');assert.equal(A.parseSoop({data:[soopItem({schedule_type:'transfer'})]},'2026-11-01','2026-11-30','x')[0].scopeConfirmed,false);});
test('달력의 타 채널 링크와 잘못된 날짜를 거부한다',()=>{assert.throws(()=>A.parseSoop({data:[soopItem({strm_img_link_path:'https://www.sooplive.com/station/other'})]},'2026-11-01','2026-11-30','x'),/MISMATCH/);assert.equal(A.validDay('2026-02-30'),false);assert.equal(A.validDay('2026-99-99'),false);});
test('공개 시트는 단서이며 원문 검증 전 자동 승인하지 않는다',()=>{const s=A.parseSheet(emptySheet+`1,2026. 11. 14,18시,00분,"테스트, 신인",${channelUrl},@test_author,${primary}\n`,'2026-11-01','2026-11-30');assert.equal(s[0].scopeConfirmed,false);assert.equal(s[0].timezone,'');assert.equal(s[0].primaryUrl,primary);});
test('연도·KST·채널이 본문에 명시된 첫 방송을 해석한다',()=>{const p=A.parsePrimaryNotice(notice(`2026년 11월 14일 오후 6시 KST 첫 방송 ${chi}`),primary);assert.equal(p.time,'18:00');assert.equal(p.kind,'FIRST_DEBUT');});
test('시차·모델 공개·복수 날짜·시간대 누락은 보류한다',()=>{
 for(const text of [`2026년 11월 14일 18시 첫 방송 ${chi}`,`2026년 11월 14일 18시 KST Live2D 데뷔 ${chi}`,`2026년 11월 14일 18시 KST 해외 첫 방송 ${chi}`,`2026년 11월 14일 18시 KST 첫 방송, 2026년 11월 15일 추첨 ${chi}`])assert.equal(A.parsePrimaryNotice(notice(text),primary),null);
});
test('답글의 방송국 URL을 본인 방송국으로 사용하지 않는다',()=>{const html=notice('2026년 11월 14일 18시 KST 첫 방송',`<a href="https://t.co/reply" title="${chi}">답글</a>`);assert.equal(A.parsePrimaryNotice(html,primary),null);});
test('본문에 포함된 단축 링크만 채널 연결 근거로 쓴다',()=>{assert.ok(A.parsePrimaryNotice(notice('2026년 11월 14일 18시 KST 첫 방송 https://t.co/owned',`<a href="https://t.co/owned" title="${chi}">링크</a>`),primary));});
test('명시된 캐릭터 항목만 추출하고 별자리·국적은 추정하지 않는다',()=>{assert.deepEqual(A.extractLabelledDetails('종족: 고양이\n생일: 3월 2일\nMBTI: INFP\n드래곤이 등장하는 게임을 좋아함'),{species:'고양이',birthday:'3월 2일',mbti:'INFP'});assert.deepEqual(A.extractLabelledDetails('팬덤명: 미정\nMBTI: 준비중'),{});});
test('외부 조회는 재시도 포함 40회에서 차단한다',async()=>{let n=0;const net=new A.BudgetNetwork(Date.now()+60000,async()=>{n++;return new Response('ok');});for(let i=0;i<40;i++)await net.get('https://x.com/test');await assert.rejects(net.get('https://x.com/test'),/EXTERNAL_BUDGET/);assert.equal(n,40);});
test('리디렉션도 조회량에 포함하고 허용되지 않은 호스트는 접근하지 않는다',async()=>{const net=new A.BudgetNetwork(Date.now()+60000,async()=>new Response('',{status:302,headers:{Location:'https://127.0.0.1/private'}}));await assert.rejects(net.get('https://x.com/test'),/HOST_REJECTED/);assert.equal(net.requests,1);});
test('크기를 넘긴 원문과 HTML 이미지는 거부한다',async()=>{const net=new A.BudgetNetwork(Date.now()+60000,async()=>new Response('x'.repeat(300)));await assert.rejects(net.get('https://x.com/test',50),/SOURCE_TOO_LARGE/);const imageNet=new A.BudgetNetwork(Date.now()+60000,async()=>new Response('<html>'+ 'x'.repeat(100)));await assert.rejects(A.verifyImage(imageNet,IMAGE),/INVALID_RASTER/);});
test('같은 실행 슬롯과 동시 실행은 한 번만 사용량을 예약한다',async()=>{const f=fixture(),now=new Date().toISOString();const a=new A.DiscoveryStore(f.db,'a'),b=new A.DiscoveryStore(f.db,'b');assert.equal(await a.begin('slot','2026-11','DISCOVER',now),true);assert.equal(await b.begin('other','2026-11','DISCOVER',now),false);await a.finish('COMPLETED',{});assert.equal(await b.begin('slot','2026-11','DISCOVER',now),false);assert.equal(f.sql.prepare('SELECT runs FROM debut_automation_months').get().runs,1);});
test('월 70회 이후 실행은 외부 조회 없이 중지된다',async()=>{const f=fixture(),network=sourceFetcher();f.sql.prepare('INSERT INTO debut_automation_months(month,runs) VALUES(?,70)').run('2026-11');assert.equal(await A.runDiscovery(f.env,'SMOKE',NOW,'capped',network.fetcher),null);assert.equal(network.count(),0);});
test('조사→공식 채널·이미지 검증→원자적 공개→실제 공개 응답 검증',async()=>{const f=fixture(),network=sourceFetcher();const r=await A.runDiscovery(f.env,'SMOKE',NOW,'first',network.fetcher);assert.equal(r.status,'COMPLETED');assert.equal(r.published.length,1);assert.equal(r.publicVerified,true);const p=JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data);assert.equal(p.debutKind,'PLATFORM_DEBUT');assert.equal(A.portalProfileEvent(p).type,'PLATFORM_DEBUT');assert.equal(f.sql.prepare('SELECT status FROM debut_automation_candidates').get().status,'PUBLIC_VERIFIED');assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM portal_profile_history').get().n,1);});
test('반복 조사에서 동일 프로필·수정 이력을 다시 쓰지 않는다',async()=>{const f=fixture(),n=sourceFetcher();await A.runDiscovery(f.env,'SMOKE',NOW,'first',n.fetcher);f.sql.exec("UPDATE debut_automation_candidates SET next_check_at=''");const r=await A.runDiscovery(f.env,'SMOKE',NOW,'second',n.fetcher);assert.equal(r.published.length,0);assert.equal(r.updated.length,0);assert.equal(r.unchanged,1);assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM portal_profile_history').get().n,1);const before=n.count();assert.equal(await A.runDiscovery(f.env,'SMOKE',NOW,'second',n.fetcher),null);assert.equal(n.count(),before);});
test('운영자가 수정한 프로필을 다음 조사에서 덮어쓰지 않는다',async()=>{const f=fixture(),n=sourceFetcher();await A.runDiscovery(f.env,'SMOKE',NOW,'first',n.fetcher);const p=JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data);p.description='운영자가 작성한 소개';f.sql.prepare('UPDATE portal_profiles SET data=?').run(JSON.stringify(p));f.sql.exec("UPDATE debut_automation_candidates SET next_check_at=''");const r=await A.runDiscovery(f.env,'SMOKE',NOW,'second',sourceFetcher({changedImage:true}).fetcher);assert.ok(r.held.some(h=>h.reason==='OPERATOR_MODIFICATION_HOLD'));assert.equal(JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data).description,'운영자가 작성한 소개');});
test('심사대기 중인 채널은 공개하지 않는다',async()=>{const f=fixture();f.sql.prepare('INSERT INTO portal_pending_channels VALUES(?,?)').run('SOOP:testvt','request-1');const r=await A.runDiscovery(f.env,'SMOKE',NOW,'pending',sourceFetcher().fetcher);assert.equal(r.published.length,0);assert.ok(r.held.some(h=>h.reason==='PENDING_OR_OPERATOR_CONFLICT'));assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM portal_profiles').get().n,0);});
test('공식 채널 ID가 맞지 않으면 실패를 신규 0건 성공으로 바꾸지 않는다',async()=>{const f=fixture();const r=await A.runDiscovery(f.env,'SMOKE',NOW,'badid',sourceFetcher({channelMismatch:true}).fetcher);assert.equal(r.status,'PARTIAL');assert.equal(r.failed[0].reason,'CHANNEL_ID_MISMATCH');assert.equal(r.published.length,0);});
test('X 접근 실패와 SOOP 공개 성공을 분리해서 보고한다',async()=>{const f=fixture();const r=await A.runDiscovery(f.env,'SMOKE',NOW,'partial',sourceFetcher({failedX:true}).fetcher);assert.equal(r.status,'PARTIAL');assert.equal(r.published.length,1);assert.deepEqual(r.sources.filter(s=>s.status==='FAILED').map(s=>s.id).sort(),['agency-x:revernia','x-curator:KRVtubefollower','x-curator:VtuberDebutBot','x-curator:vvw_kr']);assert.equal(r.publicVerified,true);});
test('게시 중 고유키 오류는 공개·채널 인덱스·수정 이력을 모두 되돌린다',async()=>{const f=fixture();f.sql.exec("CREATE TRIGGER fail_insert BEFORE INSERT ON portal_profile_history BEGIN SELECT RAISE(ABORT,'TEST_ABORT'); END");const r=await A.runDiscovery(f.env,'SMOKE',NOW,'rollback',sourceFetcher().fetcher);assert.equal(r.published.length,0);for(const table of ['portal_profiles','portal_profile_channels','portal_profile_history'])assert.equal(f.sql.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n,0);assert.equal(f.sql.prepare('SELECT publish_token FROM debut_automation_candidates').get().publish_token,'');});
test('사이트 반영 검증 실패는 등록 완료로 기록하지 않는다',async()=>{const f=fixture();f.env.SITE.fetch=async()=>new Response('failed',{status:503});const r=await A.runDiscovery(f.env,'SMOKE',NOW,'public-failed',sourceFetcher().fetcher);assert.equal(r.status,'FAILED');assert.equal(r.publicVerified,false);assert.equal(f.sql.prepare('SELECT status FROM debut_automation_candidates').get().status,'PUBLISHED_PENDING_CHECK');});
test('수집기의 실행 URL과 유료 API·AI 바인딩은 없다',()=>{const config=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../wrangler.debut-automation.jsonc'),'utf8'));assert.equal(config.workers_dev,false);assert.equal(config.limits.cpu_ms,5000);assert.equal(config.limits.subrequests,400);assert.ok(['0 1 * * MON','0 1 * * WED','0 1 * * SUN'].every(c=>config.triggers.crons.includes(c)));const extra=config.triggers.crons.filter(c=>!['0 1 * * MON','0 1 * * WED','0 1 * * SUN'].includes(c));assert.ok(!extra.length||extra.length===1&&extra[0]==='* * * * *'&&Number.isFinite(Date.parse(config.vars.SMOKE_TEST_UNTIL))); assert.equal(config.ai,undefined);assert.equal(config.queues,undefined);});
test('오전·오후를 바꾼 공지는 기존 일정 유지로 판정하지 않는다',()=>{const registered={...seed(),primaryUrl:primary,date:'2026-11-14',time:'09:00'};assert.equal(A.confirmsRegisteredNotice(notice('첫 방송 11/14 오후 9시'),registered),false);assert.equal(A.confirmsRegisteredNotice(notice('첫 방송 11/14 오전 9시'),registered),true);});
test('기존 구형 프로필을 연결할 때도 다른 소개 항목을 보존한다',async()=>{const f=fixture();f.sql.prepare('INSERT INTO streamerChannel VALUES(1,?,?,?)').run('SOOP',channelUrl,'테스트 버튜버');f.sql.prepare('INSERT INTO streamerChannel_info(id,channel_id,slug,display_name,description,profile_image_url,agency_name,country_code,x_url,debut_date,debut_time,timezone,start_at_utc) VALUES(1,1,?,?,?,?,?,?,?,?,?,?,?)').run('original-slug','테스트 버튜버','운영자 소개',IMAGE,'확인된 소속','KR','','2026-11-14','18:00','Asia/Seoul','2026-11-14T09:00:00.000Z');const r=await A.runDiscovery(f.env,'SMOKE',NOW,'legacy',sourceFetcher().fetcher);assert.deepEqual(r.updated,['original-slug']);assert.equal(r.publicVerified,true);const p=JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data);assert.equal(p.description,'운영자 소개');assert.equal(p.agency,'확인된 소속');});
test('조사 뒤 저장 직전에 생긴 수정도 원자적 비교에서 보호한다',async()=>{const f=fixture();await A.runDiscovery(f.env,'SMOKE',NOW,'initial',sourceFetcher().fetcher);const store=new A.DiscoveryStore(f.db,'race');await store.begin('race','2026-11','DISCOVER',new Date().toISOString());const snapshot=await store.snapshot(),candidate=(await store.all('SELECT * FROM debut_automation_candidates'))[0],previous=snapshot.profiles[0];const changed={...previous,description:'동시 운영자 수정'};f.sql.prepare('UPDATE portal_profiles SET data=?').run(JSON.stringify(changed));assert.equal(await store.publish(candidate,{...previous,avatarUrl:IMAGE+'?new'},previous,snapshot,new Date().toISOString()),false);assert.equal(JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data).description,'동시 운영자 수정');assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM portal_profile_history').get().n,1);});
test('예산 경계와 실행 임대 만료 뒤에는 게시하지 않는다',async()=>{const f=fixture(),store=new A.DiscoveryStore(f.db,'expired'),now=new Date().toISOString();await store.begin('expired','2026-11','DISCOVER',now);await store.saveSeed(seed(),now);const candidate=(await store.all('SELECT * FROM debut_automation_candidates'))[0],snapshot=await store.snapshot();f.sql.exec("UPDATE debut_automation_control SET lease_until='2000-01-01T00:00:00Z'");assert.equal(await store.publish(candidate,A.buildProfile(seed(),'테스트 버튜버',IMAGE,now),null,snapshot,now),false);store.writes=699;await assert.rejects(store.execute('UPDATE debut_automation_control SET enabled=0'),/DATABASE_BUDGET/);});
test('임시 서버 예약 시험도 오류 수정 재시험을 포함해 열두 회까지만 실행한다',async()=>{const f=fixture(),now=new Date().toISOString();for(let i=0;i<12;i++){const s=new A.DiscoveryStore(f.db,`smoke-${i}`);assert.equal(await s.begin(`smoke-${i}`,'2026-11','SMOKE',now),true);await s.finish('COMPLETED',{});}assert.equal(await new A.DiscoveryStore(f.db,'smoke-13').begin('smoke-13','2026-11','SMOKE',now),false);});
test('Workers 전역 fetch에 수집기 객체를 this로 넘기지 않는다',async()=>{const net=new A.BudgetNetwork(Date.now()+10000,function(){assert.equal(this,globalThis);return Promise.resolve(new Response('ok'));});assert.equal((await net.get('https://x.com/test')).status,200);});
test('주간 보강은 전주 대상의 빈 항목만 채우고 기존 캐릭터 정보를 보존한다',async()=>{const f=fixture();await A.runDiscovery(f.env,'SMOKE',NOW,'first',sourceFetcher().fetcher);let p=JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data);p=A.reviewedProfile({...p,details:{height:'170cm'}},'APPROVED',new Date().toISOString());const json=JSON.stringify(p);f.sql.prepare('UPDATE portal_profiles SET data=?').run(json);f.sql.prepare("UPDATE debut_automation_candidates SET managed_json=?,next_check_at=''").run(json);const r=await A.runDiscovery(f.env,'WEEKLY',Date.parse('2026-11-16T01:00:00Z'),'weekly',sourceFetcher({bio:'신장: 160cm\n팬덤명: 테스트즈\nMBTI: ENFP'}).fetcher);const actual=JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data);assert.equal(actual.details.height,'170cm');assert.equal(actual.details.fandomName,'테스트즈');assert.equal(actual.details.mbti,'ENFP');assert.equal(r.publicVerified,true);});
test('주간 적재 한도를 넘긴 후보는 별도 원천 캐시로 보존하고 다음 일일 조사에서 이어 적재한다',async()=>{const f=fixture();const calendar=Array.from({length:160},(_,i)=>soopItem({idx:`bulk-${i}`,strm_id:`bulk${i}`,strm_img_link_path:`https://www.sooplive.com/station/bulk${i}`}));const wide=await A.runDiscovery(f.env,'WEEKLY',NOW,'wide',sourceFetcher({calendar}).fetcher);assert.ok(wide.seedDeferred>0);assert.equal(f.sql.prepare("SELECT COUNT(*) AS n FROM debut_automation_sources WHERE id='soop-calendar-wide'").get().n,1);const before=f.sql.prepare('SELECT COUNT(*) AS n FROM debut_automation_candidates').get().n;await A.runDiscovery(f.env,'DISCOVER',NOW,'carry',sourceFetcher().fetcher);assert.ok(f.sql.prepare('SELECT COUNT(*) AS n FROM debut_automation_candidates').get().n>before);assert.ok(wide.dbCalls<=A.LIMITS.dbCalls);});
test('공식 응답으로 확인한 SOOP 이미지 CDN 별칭만 허용한다',async()=>{const net=new A.BudgetNetwork(Date.now()+60000,async()=>new Response(PNG,{headers:{'Content-Type':'image/png'}}));assert.match(await A.verifyImage(net,'https://profile.img.sooplive.com/LOGO/ha/ham2ko/ham2ko.jpg'),/^[a-f0-9]{64}$/);await assert.rejects(A.verifyImage(net,'https://unverified.example/profile.png'),/IMAGE_HOST_HOLD/);});
test('이미 승인된 전주 치지직 프로필은 첫 데뷔를 재판정하지 않고 공식 소개의 빈 제원만 보강한다',async()=>{const f=fixture(),id='a'.repeat(32),image='https://nng-phinf.pstatic.net/profile.jpg',channel=`https://chzzk.naver.com/${id}`;let p=A.buildProfile({...seed(),channelKey:`CHZZK:${id}`,platform:'CHZZK',channelUrl:channel,kind:'FIRST_DEBUT',date:'2026-11-10',primaryUrl:''},'치지직 테스트',image,new Date().toISOString());delete p.debutKind;p=A.reviewedProfile(p,'APPROVED',new Date().toISOString());f.sql.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(p.slug,channel,JSON.stringify(p));const base=sourceFetcher().fetcher;const fetcher=async(input,init)=>{const u=new URL(typeof input==='string'?input:input.url);if(u.hostname==='api.chzzk.naver.com')return Response.json({code:200,content:{channelId:id,channelName:p.displayName,channelImageUrl:image,channelDescription:'팬덤명: 새팬즈'}});if(u.hostname==='nng-phinf.pstatic.net')return new Response(PNG,{headers:{'Content-Type':'image/png'}});return base(input,init);};const r=await A.runDiscovery(f.env,'WEEKLY',Date.parse('2026-11-16T01:00:00Z'),'weekly-chzzk',fetcher);const actual=JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles WHERE slug=?').get(p.slug).data);assert.equal(actual.details.fandomName,'새팬즈');assert.equal(actual.debutKind,undefined);assert.equal(actual.debutDate,'2026-11-10');assert.equal(r.publicVerified,true);const evidence=JSON.parse(f.sql.prepare('SELECT evidence FROM debut_automation_candidates WHERE profile_slug=?').get(p.slug).evidence);assert.equal(evidence.scheduleReconfirmed,false);});
test('운영자가 삭제한 프로필을 같은 후보나 새로운 일정 ID로 재생성하지 않는다',async()=>{const f=fixture();await A.runDiscovery(f.env,'SMOKE',NOW,'created',sourceFetcher().fetcher);f.sql.exec("DELETE FROM portal_profiles;DELETE FROM portal_profile_channels;UPDATE debut_automation_candidates SET next_check_at=''");const r=await A.runDiscovery(f.env,'SMOKE',NOW,'deleted',sourceFetcher({calendar:[soopItem({idx:'replacement-id'})]}).fetcher);assert.equal(r.published.length,0);assert.ok(r.held.some(h=>h.reason==='OPERATOR_REMOVAL_HOLD'));assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM portal_profiles').get().n,0);});
test('다른 대표 채널의 보조 채널로 등록된 주소는 데뷔 일정을 덮어쓰지 않는다',async()=>{const f=fixture();const profile=A.reviewedProfile({...A.buildProfile({...seed(),channelKey:'SOOP:another',channelUrl:'https://www.sooplive.com/station/another'},'테스트 버튜버',IMAGE,new Date().toISOString()),additionalChannels:[{platform:'SOOP',channelUrl}]},'APPROVED',new Date().toISOString());f.sql.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(profile.slug,profile.channelUrl,JSON.stringify(profile));const r=await A.runDiscovery(f.env,'SMOKE',NOW,'secondary',sourceFetcher().fetcher);assert.ok(r.held.some(h=>h.reason==='SECONDARY_CHANNEL_REVIEW_HOLD'));assert.deepEqual(JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data),profile);});
test('주간 조회 기간만 바뀐 공식 일정은 임박 일정을 재조사 대기 상태로 되돌리지 않는다',async()=>{const f=fixture(),store=new A.DiscoveryStore(f.db,'hash');const first={...seed(),sourceUrl:'https://welcomevirtual.sooplive.com/api/api.php?startDate=2026-11-05'};assert.equal(await store.saveSeed(first,new Date().toISOString()),true);f.sql.exec("UPDATE debut_automation_candidates SET status='UNCHANGED',next_check_at='2099-01-01T00:00:00Z'");assert.equal(await store.saveSeed({...first,sourceUrl:'https://welcomevirtual.sooplive.com/api/api.php?startDate=2026-10-17'},new Date().toISOString()),false);assert.equal(f.sql.prepare('SELECT status FROM debut_automation_candidates').get().status,'UNCHANGED');});
test('요청 40회 상한으로 남은 보강 대상도 날짜 범위 밖에서 우선 이어 처리한다',async()=>{const f=fixture(),people=new Map(),image='https://nng-phinf.pstatic.net/profile.jpg';for(let i=1;i<=24;i++){const id=i.toString(16).padStart(32,'0'),channel=`https://chzzk.naver.com/${id}`;let p=A.buildProfile({...seed(),channelKey:`CHZZK:${id}`,platform:'CHZZK',channelUrl:channel,kind:'FIRST_DEBUT',date:'2026-11-10',primaryUrl:''},`주간 대상 ${i}`,image,new Date().toISOString());delete p.debutKind;p=A.reviewedProfile(p,'APPROVED',new Date().toISOString());people.set(id,p);f.sql.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(p.slug,channel,JSON.stringify(p));}const base=sourceFetcher().fetcher;const fetcher=async(input,init)=>{const u=new URL(typeof input==='string'?input:input.url);if(u.hostname==='api.chzzk.naver.com'){const p=people.get(u.pathname.split('/').pop());return Response.json({code:200,content:{channelId:u.pathname.split('/').pop(),channelName:p.displayName,channelImageUrl:image,channelDescription:'팬덤명: 새팬즈'}});}if(u.hostname==='nng-phinf.pstatic.net')return new Response(PNG,{headers:{'Content-Type':'image/png'}});return base(input,init);};const weekly=await A.runDiscovery(f.env,'WEEKLY',Date.parse('2026-11-16T01:00:00Z'),'weekly-cap',fetcher);assert.ok(weekly.checked<=20);assert.ok(weekly.externalRequests<=40);const missing=()=>f.sql.prepare('SELECT data FROM portal_profiles').all().map(r=>JSON.parse(r.data)).filter(p=>people.has(p.channelUrl.split('/').pop())&&!p.details?.fandomName);assert.ok(missing().length>0);for(let i=0;i<3&&missing().length;i++)await A.runDiscovery(f.env,'DISCOVER',Date.parse('2026-11-20T00:00:00Z'),`daily-carry:${i}`,fetcher);assert.equal(missing().length,0);for(const p of f.sql.prepare('SELECT data FROM portal_profiles').all().map(r=>JSON.parse(r.data)).filter(p=>people.has(p.channelUrl.split('/').pop()))){assert.equal(p.debutDate,'2026-11-10');assert.equal(p.debutKind,undefined);}});
test('공식 채널 소개의 작성자 연결과 제작자·사칭 링크를 구분한다',()=>{assert.equal(A.officialAuthorLink('트위터: https://x.com/test_author','https://x.com/test_author'),true);assert.equal(A.officialAuthorLink('https://twitter.com/test_author','https://x.com/test_author'),true);assert.equal(A.officialAuthorLink('일러스트 작가 Twitter: https://x.com/test_author','https://x.com/test_author'),false);assert.equal(A.officialAuthorLink('Twitter: https://x.com/test_author_fake','https://x.com/test_author'),false);});
test('신규 X 공지는 채널이 안내한 작성자 관계까지 맞을 때만 자동 공개한다',async()=>{for(const trusted of [false,true]){const f=fixture(),image='https://nng-phinf.pstatic.net/profile.jpg';const base=sourceFetcher().fetcher;const fetcher=async(input,init)=>{const u=new URL(typeof input==='string'?input:input.url);if(u.hostname==='x.com'&&u.pathname.includes('/status/'))return new Response(notice(`2026년 11월 14일 18시 KST 버튜버 데뷔 ${chi}`));if(u.hostname==='api.chzzk.naver.com')return Response.json({code:200,content:{channelId:chi.split('/').pop(),channelName:'새 치지직 채널',channelImageUrl:image,channelDescription:trusted?'Twitter: https://x.com/test_author':'그림 작가 Twitter: https://x.com/test_author'}});if(u.hostname==='nng-phinf.pstatic.net')return new Response(PNG,{headers:{'Content-Type':'image/png'}});return base(input,init);};await A.runDiscovery(f.env,'SMOKE',NOW,'discover',fetcher);const result=await A.runDiscovery(f.env,'SMOKE',NOW,'verify-author',fetcher);if(trusted)assert.equal(result.published.filter(p=>p.slug.endsWith('chzzk')).length,1);else{assert.equal(result.published.filter(p=>p.slug.endsWith('chzzk')).length,0);assert.ok(result.held.some(h=>h.reason==='OFFICIAL_AUTHOR_RELATIONSHIP_HOLD'));}}});
test('SOOP의 실제 display.profile_text를 소개 근거로 읽는다',async()=>{const net=new A.BudgetNetwork(Date.now()+10000,async()=>Response.json({station:{user_id:'testvt',user_nick:'테스트',display:{profile_text:'생일: 3월 28일'}},profile_image:IMAGE}));assert.equal((await A.officialChannel(net,seed())).bio,'생일: 3월 28일');});
test('공식 프로필 문단의 제원·콘텐츠·일정만 읽고 잘못된 MBTI와 팬닉은 제외한다',()=>{const facts=A.extractProfileFacts('<p>생일 : 3월 28일</p><p>MBTI : INTTTP</p><p>혈액형 : O형</p><p>팬닉 : ㅇㅇ땅</p><p>자주하는 게임: 발로란트, 배그</p><p>방송 시간대: 오후 8시</p><p>(휴뱅은 랜덤입니다!)</p>');assert.deepEqual(facts.details,{birthday:'3월 28일',bloodType:'O형',contentSummary:'발로란트, 배그'});assert.equal(facts.regularSchedule,'오후 8시 (휴뱅은 랜덤입니다!)');});
test('서로 다른 생일과 불가능한 날짜는 자동 보강하지 않는다',()=>{assert.equal(A.extractProfileFacts('생일: 2월 30일').details.birthday,undefined);const conflict=A.extractProfileFacts('생일: 3월 28일\n생일: 4월 1일');assert.equal(conflict.details.birthday,undefined);assert.ok(conflict.conflicts.includes('birthday'));assert.equal(A.extractProfileFacts('생일: 0613').details.birthday,'6월 13일');assert.equal(A.extractProfileFacts('5월 16일생 • 황소자리 • O형').details.bloodType,'O형');});
test('프로필 게시판이어도 다른 작성자의 글은 보강 근거로 쓰지 않는다',async()=>{const net=new A.BudgetNetwork(Date.now()+10000,async input=>new URL(input).pathname.endsWith('/home')?Response.json({boards:[{title_no:123,title_name:'프로필'}]}):Response.json({title_no:123,user_id:'viewer',content:{content:'생일: 1월 1일'}}));await assert.rejects(A.collectProfileEnrichment(net,seed(),{bio:'',apiUrl:'https://chapi.sooplive.co.kr/api/testvt/station'}),/PROFILE_POST_AUTHOR_HOLD/);});
test('과거 범위 보강은 신규 발굴 원천 없이 기존 대상의 빈 항목만 공개한다',async()=>{const f=fixture(),id='b'.repeat(32),image='https://nng-phinf.pstatic.net/profile.jpg';let p=A.buildProfile({...seed(),channelKey:`CHZZK:${id}`,platform:'CHZZK',channelUrl:`https://chzzk.naver.com/${id}`,date:'2026-11-01',kind:'FIRST_DEBUT'},'기존 이름',image,new Date().toISOString());p=A.reviewedProfile({...p,details:{height:'170cm'}},'APPROVED',new Date().toISOString());f.sql.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(p.slug,p.channelUrl,JSON.stringify(p));Object.assign(f.env,{BACKFILL_FROM:'2026-11-01',BACKFILL_TO:'2026-11-11'});const calls=[];const fetcher=async input=>{const url=new URL(typeof input==='string'?input:input.url);calls.push(url.hostname);if(url.hostname==='api.chzzk.naver.com')return Response.json({code:200,content:{channelId:id,channelName:'바뀐 공식 이름',channelImageUrl:image,channelDescription:'신장: 160cm\n생일: 3월 28일'}});if(url.hostname==='nng-phinf.pstatic.net')return new Response(PNG,{headers:{'Content-Type':'image/png'}});throw new Error('UNEXPECTED_TEST_URL');};const result=await A.runDiscovery(f.env,'BACKFILL',NOW,'backfill-test',fetcher);const actual=JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data);assert.equal(actual.displayName,'기존 이름');assert.equal(actual.details.height,'170cm');assert.equal(actual.details.birthday,'3월 28일');assert.equal(actual.debutDate,p.debutDate);assert.equal(result.publicVerified,true);assert.equal(result.published.length,0);assert.ok(!calls.includes('x.com'));assert.ok(!calls.includes('welcomevirtual.sooplive.com'));const repeat=await A.runDiscovery(f.env,'BACKFILL',NOW,'backfill-repeat',fetcher);assert.equal(repeat.updated.length,0);assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM portal_profile_history').get().n,1);});
test('임시 과거 보강도 월 여덟 회 이후에는 실행하지 않는다',async()=>{const f=fixture(),now=new Date().toISOString();for(let i=0;i<8;i++){const s=new A.DiscoveryStore(f.db,`backfill-${i}`);assert.equal(await s.begin(`backfill-${i}`,'2026-11','BACKFILL',now),true);await s.finish('COMPLETED',{});}assert.equal(await new A.DiscoveryStore(f.db,'backfill-9').begin('backfill-9','2026-11','BACKFILL',now),false);});
test('소속사 목록에서 이름 없이 데뷔 공지를 고르고 프리뷰 행을 제외한다',()=>{const list='<a href="/notice/?bmode=view&amp;idx=123">새 멤버 데뷔 안내</a><a href="https://evil.example/notice/?idx=456">데뷔</a>';assert.deepEqual(A.agencyNoticeLinks(list),['https://www.charonuniverse.com/notice/?bmode=view&idx=123']);const html='<meta property="og:title" content="DEBUT 안내"><meta property="og:description" content="2026.11.07 ✧ 진행자 (데뷔 프리뷰) | 2:00 PM~ https://ch.ci/preview ✧ 새멤버 | 3:00 PM~ https://ch.ci/new">';assert.deepEqual(A.agencyNoticeEntries(html),[{name:'새멤버',date:'2026-11-07',time:'15:00',link:'https://ch.ci/new'}]);});
test('방송국 단축 링크도 조회량에 포함하고 외부 임의 주소 이동을 거부한다',async()=>{const safe=new A.BudgetNetwork(Date.now()+10000,async()=>new Response(null,{status:302,headers:{Location:chi}}));assert.equal(await safe.resolveChannel('https://ch.ci/test'),chi);assert.equal(safe.requests,1);const unsafe=new A.BudgetNetwork(Date.now()+10000,async()=>new Response(null,{status:302,headers:{Location:'https://127.0.0.1/private'}}));await assert.rejects(unsafe.resolveChannel('https://ch.ci/test'),/CHANNEL_REDIRECT_HOST_HOLD/);});
test('새 소속사 후보를 발굴해도 최초 활동 범위와 시간대 미확인은 공개하지 않는다',async()=>{const f=fixture(),base=sourceFetcher().fetcher;const fetcher=async(input,init)=>{const url=new URL(typeof input==='string'?input:input.url);if(url.hostname==='www.charonuniverse.com')return new Response(url.searchParams.has('idx')?`<meta property="og:title" content="DEBUT 안내"><meta property="og:description" content="2026.11.07 ✧ 새멤버 | 3:00 PM~ ${chi}">`:'<a href="/notice/?bmode=view&amp;idx=123">새 멤버 데뷔 안내</a>');return base(input,init);};const r=await A.runDiscovery(f.env,'DISCOVER',NOW,'agency-discovery',fetcher);assert.ok(r.discovered>=1);const candidate=f.sql.prepare("SELECT status,reason FROM debut_automation_candidates WHERE source='AGENCY_NOTICE'").get();assert.equal(candidate.status,'HOLD');assert.equal(candidate.reason,'PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD');assert.equal(r.published.filter(p=>p.slug.endsWith('chzzk')).length,0);});
test('소속사 목록의 본인 공지에서 같은 시간 반복은 허용하되 생략된 연도는 채우지 않는다',()=>{assert.deepEqual(A.agencyMemberNoticeLinks('<a href="/news/?mod=document&amp;uid=8">새로운 라이버 X 계정 공개</a>'),['https://revernia.co.kr/news/?mod=document&uid=8']);const url='https://x.com/test_author/status/2119301126755643875';let seed=A.parseAgencyMemberNotice(notice(`11월 8일 오후 7시 버튜버 데뷔\n2026. 11. 8. 오후 7시 ${chi}`),url,'https://revernia.co.kr/news/?mod=document&uid=8');assert.equal(seed.date,'2026-11-08');assert.equal(seed.time,'19:00');assert.equal(seed.scopeConfirmed,false);seed=A.parseAgencyMemberNotice(notice(`11월 8일 오후 8시 버튜버 데뷔 ${chi}`),url,'https://revernia.co.kr/news/?mod=document&uid=8');assert.equal(seed.date,'');});
test('데뷔 날짜만 알려진 소개도 시간을 확정하지 않고 빈 제원만 보강한다',async()=>{const f=fixture(),id='c'.repeat(32),image='https://nng-phinf.pstatic.net/profile.jpg';let p=A.buildProfile({...seed(),channelKey:`CHZZK:${id}`,platform:'CHZZK',channelUrl:`https://chzzk.naver.com/${id}`,date:'2026-11-03',kind:'FIRST_DEBUT'},'시간 미정',image,new Date().toISOString());p=A.reviewedProfile({...p,dateState:'TIME_TBD',debutTime:'',startAtUtc:''},'APPROVED',new Date().toISOString());f.sql.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(p.slug,p.channelUrl,JSON.stringify(p));Object.assign(f.env,{BACKFILL_FROM:'2026-11-01',BACKFILL_TO:'2026-11-11'});const fetcher=async input=>new URL(input).hostname==='api.chzzk.naver.com'?Response.json({code:200,content:{channelId:id,channelName:'시간 미정',channelImageUrl:image,channelDescription:'팬덤명: 새팬즈'}}):new Response(PNG,{headers:{'Content-Type':'image/png'}});const result=await A.runDiscovery(f.env,'BACKFILL',NOW,'time-tbd',fetcher);const actual=JSON.parse(f.sql.prepare('SELECT data FROM portal_profiles').get().data);assert.equal(actual.dateState,'TIME_TBD');assert.equal(actual.debutTime,'');assert.equal(actual.startAtUtc,'');assert.equal(actual.details.fandomName,'새팬즈');assert.equal(result.publicVerified,true);});
test('이름을 모르는 소속사 채널을 발굴하되 이벤트 종료일로 데뷔일을 만들지 않는다',async()=>{const id='d'.repeat(32),channel=`https://chzzk.naver.com/${id}`,index='<a href="/revernia_kr/status/2112492682186727841">공지</a>';const net=new A.BudgetNetwork(Date.now()+10000,async input=>new URL(input).hostname==='x.com'?new Response(`<meta property="og:title" content="공식 (@revernia_kr) on X"><meta property="og:description" content="첫 방송을 앞둔 두 멤버 참여 채널 ${channel} 진행 기간 2026. 11. 7 23:59까지">`):Response.json({code:200,content:{channelId:id,channelName:'처음 발견한 채널'}}));const seeds=await A.collectAgencyRoster(net,index);assert.equal(seeds[0].name,'처음 발견한 채널');assert.equal(seeds[0].date,'');assert.equal(seeds[0].time,'');assert.equal(seeds[0].kind,'UNKNOWN');assert.equal(net.requests,2);});
test('날짜 미확인 신규 후보는 보존하고 반복 조사에서 신규 발굴로 다시 세지 않는다',async()=>{const f=fixture(),id='e'.repeat(32),channel=`https://chzzk.naver.com/${id}`,base=sourceFetcher().fetcher;const fetcher=async(input,init)=>{const u=new URL(typeof input==='string'?input:input.url);if(u.pathname==='/revernia_kr')return new Response('<a href="/revernia_kr/status/2112492682186727841">공지</a>');if(u.hostname==='x.com'&&u.pathname.startsWith('/revernia_kr/status/'))return new Response(`<meta property="og:title" content="공식 (@revernia_kr) on X"><meta property="og:description" content="첫 방송을 앞둔 멤버 참여 채널 ${channel} 진행 기간 2026. 11. 7까지">`);if(u.hostname==='api.chzzk.naver.com')return Response.json({code:200,content:{channelId:id,channelName:'신규 후보'}});return base(input,init);};const first=await A.runDiscovery(f.env,'DISCOVER',NOW,'undated-first',fetcher);assert.ok(first.discoveredCandidates.some(c=>c.channelKey===`CHZZK:${id}`));let c=f.sql.prepare('SELECT status,seed FROM debut_automation_candidates WHERE channel_key=?').get(`CHZZK:${id}`);assert.equal(c.status,'HOLD');assert.equal(JSON.parse(c.seed).date,'');const second=await A.runDiscovery(f.env,'DISCOVER',NOW,'undated-second',fetcher);assert.equal(second.discovered,0);c=f.sql.prepare('SELECT status FROM debut_automation_candidates WHERE channel_key=?').get(`CHZZK:${id}`);assert.equal(c.status,'HOLD');assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM portal_profiles WHERE channel_url=?').get(channel).n,0);});
