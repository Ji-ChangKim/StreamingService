const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const esbuild = require(path.join(root, 'frontend/node_modules/esbuild'));

function load(relative) {
  const source = path.join(root, relative);
  const loaded = new Module(source, module);
  loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
  return loaded.exports;
}

const { reviewedProfile, isPublicProfile } = load('shared/contentReview.ts');
const { portalChannelKey, portalUtc } = load('shared/portal.ts');
const { portalProfileEvent } = load('backend/src/services/unifiedEventService.ts');
const { buildCalendarIndex } = load('frontend/src/portal/calendarIndex.ts');
const at = new Date().toISOString();
const profiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'proposed-profiles.json'), 'utf8')).map(p => reviewedProfile(p, 'APPROVED', at));
const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'target-db-before.json'), 'utf8'));
const prior = before[0].results.find(p => p.slug === 'hasinyang-soop');
assert.ok(prior);
const old = JSON.parse(prior.data);
assert.equal(old.displayName, '하시냥:');
const corrected = reviewedProfile({ ...old, displayName: '꾼구마', description: old.description.replaceAll('하시냥', '꾼구마') }, 'APPROVED', at);
const q = value => "'" + String(value).replaceAll("'", "''") + "'";
const sql = [
  '-- 0061: 사용자 요청으로 2026-11-11~14 SOOP 데뷔 5명 공개 등록 및 기존 활동명 1명 정정.',
  '-- 공식 캘린더의 플랫폼 데뷔 일정이며 전 플랫폼 최초 활동으로 확정하지 않는다.',
  '-- 이 파일만 명시 실행한다. 기존/심사대기 채널은 신규 등록으로 덮어쓰지 않는다.',
  '-- countryCode KR은 한국 SOOP·한국어 공지·KST 일정의 활동권역이며 국적 정보가 아니다.',
];

for (const p of profiles) {
  assert.ok(isPublicProfile(p));
  assert.equal(portalUtc(p.debutDate, p.debutTime, p.timezone), p.startAtUtc);
  const key = portalChannelKey(p.channelUrl, p.platform);
  assert.equal(key, 'SOOP:' + p.slug.replace(/-soop$/, ''));
  assert.ok(p.avatarUrl && p.countryCode === 'KR');
  const sid = key.slice(5);
  const aliases = [`https://www.sooplive.com/station/${sid}`, `https://www.sooplive.co.kr/station/${sid}`, `https://ch.sooplive.co.kr/${sid}`, `https://bj.afreecatv.com/${sid}`].map(q).join(',');
  const data = JSON.stringify(p);
  const guard = `NOT EXISTS(SELECT 1 FROM portal_profiles WHERE slug=${q(p.slug)} OR channel_url IN (${aliases})) AND NOT EXISTS(SELECT 1 FROM portal_profile_channels WHERE slug=${q(p.slug)} OR channel_key=${q(key)}) AND NOT EXISTS(SELECT 1 FROM streamerChannel WHERE channel_url IN (${aliases})) AND NOT EXISTS(SELECT 1 FROM debut_submissions WHERE channel_url IN (${aliases}) AND status='PENDING') AND NOT EXISTS(SELECT 1 FROM portal_pending_channels WHERE channel_key=${q(key)})`;
  sql.push(`INSERT INTO portal_profiles(slug,channel_url,data) SELECT ${q(p.slug)},${q(p.channelUrl)},${q(data)} WHERE ${guard};`);
  sql.push(`INSERT INTO portal_profile_channels(channel_key,slug) SELECT ${q(key)},${q(p.slug)} WHERE EXISTS(SELECT 1 FROM portal_profiles WHERE slug=${q(p.slug)} AND data=${q(data)}) AND NOT EXISTS(SELECT 1 FROM portal_profile_channels WHERE channel_key=${q(key)} OR slug=${q(p.slug)});`);
  sql.push(`INSERT OR IGNORE INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash) SELECT ${q('0061-new-' + p.slug)},${q(p.slug)},'{}',${q(data)},${q('사용자 요청: SOOP 공식 데뷔 일정·방송국 URL·공식 프로필 이미지 확인 후 공개 등록 / ' + p.noticeUrl)},'user-authorized:2026-11-11-debut-registration' WHERE EXISTS(SELECT 1 FROM portal_profiles WHERE slug=${q(p.slug)} AND data=${q(data)});`);
}

const correctedData = JSON.stringify(corrected);
sql.push(`UPDATE portal_profiles SET data=${q(correctedData)},updated_at=CURRENT_TIMESTAMP WHERE slug='hasinyang-soop' AND channel_url=${q(prior.channel_url)} AND data=${q(prior.data)};`);
const legacy = before[3].results;
assert.equal(legacy.length, 1);
const l = legacy[0];
sql.push(`UPDATE streamerChannel_info SET display_name='꾼구마',description=${q(l.description.replaceAll('하시냥', '꾼구마'))},updated_at=CURRENT_TIMESTAMP WHERE channel_id=${Number(l.id)} AND slug='hasinyang-soop' AND display_name=${q(l.display_name)} AND description=${q(l.description)} AND EXISTS(SELECT 1 FROM portal_profiles WHERE slug='hasinyang-soop' AND data=${q(correctedData)});`);
sql.push(`UPDATE streamerChannel SET channel_name='꾼구마' WHERE id=${Number(l.id)} AND channel_url=${q(l.channel_url)} AND EXISTS(SELECT 1 FROM portal_profiles WHERE slug='hasinyang-soop' AND data=${q(correctedData)});`);
sql.push(`INSERT OR IGNORE INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash) SELECT '0061-correct-hasinyang-soop','hasinyang-soop',${q(prior.data)},${q(correctedData)},'사용자 요청 및 공식 방송국 user_nick·공식 캘린더에 따른 활동명 정정: 하시냥: → 꾼구마','user-authorized:2026-11-11-debut-registration' WHERE EXISTS(SELECT 1 FROM portal_profiles WHERE slug='hasinyang-soop' AND data=${q(correctedData)});`);
assert.ok(isPublicProfile(corrected));
const index = buildCalendarIndex(profiles, 'Asia/Seoul');
assert.equal(index.byMonth.get('2026-11').length, 5);
for (const p of profiles) {
  assert.ok(index.byDay.get(p.debutDate).some(item => item.slug === p.slug));
  const event = portalProfileEvent(p);
  assert.equal(event.startAtUtc, p.startAtUtc);
  assert.equal(event.links[0].url, p.channelUrl);
  assert.equal(event.creator.avatarUrl, p.avatarUrl);
}
const output = path.join(root, 'backend/migrations/0061_register_nov11_14_soop_debuts.sql');
fs.writeFileSync(output, sql.join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'approved-profiles.json'), JSON.stringify({ reviewedAt: at, profiles, corrected }, null, 2));
console.log('실제 공개 판정·채널 ID·KST/UTC 변환·11월 캘린더·링크 연동 검증: 5명 통과, 기존 1명 이름 정정.');
