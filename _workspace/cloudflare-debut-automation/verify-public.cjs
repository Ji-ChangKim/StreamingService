const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const esbuild=require('../../frontend/node_modules/esbuild');
const directory=__dirname,root=path.resolve(directory,'../..');
const get=name=>{try{return JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));}catch{throw new Error(`${name}: JSON 응답 수신이 완료되지 않았습니다.`);}};
const outfile=path.join(directory,'verification-functions.cjs');
esbuild.buildSync({stdin:{contents:`export {buildCalendarIndex} from './frontend/src/portal/calendarIndex'; export {portalChannelKey} from './shared/portal'; export {isPublicProfile} from './shared/contentReview';`,resolveDir:root,loader:'ts'},outfile,bundle:true,platform:'node',format:'cjs',logLevel:'silent'});
const {buildCalendarIndex,portalChannelKey,isPublicProfile}=require(outfile);
const before=get('public-before.json').profiles,after=get('public-final.json').profiles,events=get('events-final.json').events,summary=get('server-test-summary.json');
const registry=new Map(after.map(p=>[p.slug,p])),prior=new Map(before.map(p=>[p.slug,p]));
assert.equal(after.length,before.length+summary.published.length);
const index=buildCalendarIndex(after.filter(p=>p.countryCode==='KR'),'Asia/Seoul');
const cohort=[];
for(const info of summary.published){
  const p=registry.get(info.slug);assert.ok(p);assert.ok(isPublicProfile(p));assert.equal(p.debutDate,info.date);assert.equal(p.debutTime,info.time);assert.equal(p.debutKind,info.kind);assert.equal(p.countryCode,'KR');
  assert.ok(index.byDay.get(info.date).some(p=>p.slug===info.slug));assert.equal(index.days.get(info.slug),info.date);
  assert.ok(!before.some(old=>portalChannelKey(old.channelUrl,old.platform)===portalChannelKey(p.channelUrl,p.platform)));
  const event=events.find(e=>e.creator.slug===p.slug);assert.ok(event);assert.equal(event.type,info.kind);assert.equal(event.startAtUtc,p.startAtUtc);assert.equal(event.creator.avatarUrl,p.avatarUrl);assert.ok(event.links.some(l=>l.url===p.channelUrl));
  cohort.push({...info,profileUrl:`https://vdebut.live/creator/${p.slug}`,channelUrl:p.channelUrl,avatarUrl:p.avatarUrl,defaultCalendarVerified:true});
}
const diffs=[];
for(const [slug,old]of prior){const current=registry.get(slug);assert.ok(current,`기존 프로필 삭제: ${slug}`);const changes=Object.keys({...old,...current}).filter(k=>JSON.stringify(old[k])!==JSON.stringify(current[k]));if(changes.length){assert.ok(summary.updated.includes(slug));for(const key of changes){assert.ok(['debutKind','contentReview','countryCode'].includes(key),`${slug} 예기치 않은 변경: ${key}`);if(key==='countryCode')assert.ok(!old.countryCode&&current.countryCode==='KR');}diffs.push({slug,changes});}}
const report={before:before.length,after:after.length,newlyPublished:cohort.length,existingUpdated:diffs.length,unchangedExisting:before.length-diffs.length,cohort,diffs,verification:'공개 프로필·이벤트·실제 프론트 달력 색인·기본 KR 필터 대조 통과'};
fs.writeFileSync(path.join(directory,'public-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({before:report.before,after:report.after,newlyPublished:report.newlyPublished,existingUpdated:report.existingUpdated,unchangedExisting:report.unchangedExisting,verified:true}));
