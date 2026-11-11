const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'shared/contentReview.ts');
const loaded = new Module(source, module);
loaded._compile(require(path.join(root, 'frontend/node_modules/esbuild')).buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
const { reviewedProfile, isPublicProfile } = loaded.exports;
const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'chzzk-region-before.json'), 'utf8'))[0].results;
const q = value => "'" + String(value).replaceAll("'", "''") + "'";
const sql = ['-- 0062: 기존 11/14 치지직 데뷔 3명의 한국 활동권역을 정리해 기본 한국 캘린더에서 노출한다.', '-- KR은 한국어 본인 공지·KST 일정에 따른 활동권역이며 국적 정보가 아니다. 기존 일정·채널·이미지는 유지한다.'];
const after = [];
for (const row of before) {
  const old = JSON.parse(row.data);
  assert.equal(old.countryCode, '');
  const next = reviewedProfile({ ...old, countryCode: 'KR' }, 'APPROVED', new Date().toISOString());
  assert.ok(isPublicProfile(next));
  for (const key of Object.keys(old).filter(k => !['countryCode', 'contentReview'].includes(k))) assert.deepEqual(next[key], old[key]);
  const data = JSON.stringify(next);
  sql.push(`UPDATE portal_profiles SET data=${q(data)},updated_at=CURRENT_TIMESTAMP WHERE slug=${q(row.slug)} AND channel_url=${q(row.channel_url)} AND data=${q(row.data)};`);
  sql.push(`INSERT OR IGNORE INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash) SELECT ${q('0062-region-' + row.slug)},${q(row.slug)},${q(row.data)},${q(data)},'사용자 요청: 방송국·프로필·캘린더 노출 확인 중 기본 한국 필터 누락 해소. 한국어 본인 공지·KST 데뷔 일정에 따른 활동권역 KR 지정. 국적 정보 아님.','user-authorized:2026-11-11-debut-registration' WHERE EXISTS(SELECT 1 FROM portal_profiles WHERE slug=${q(row.slug)} AND data=${q(data)});`);
  after.push(next);
}
fs.writeFileSync(path.join(root, 'backend/migrations/0062_align_nov14_calendar_activity_regions.sql'), sql.join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'chzzk-region-after-proposed.json'), JSON.stringify(after, null, 2));
console.log('기존 3명: 활동권역·검토 스냅샷만 변경. 나머지 필드 동일 검증 통과.');
