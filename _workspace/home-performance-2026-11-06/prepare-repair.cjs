const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const esbuild = require('../../frontend/node_modules/esbuild');
const dir = __dirname;
const root = path.resolve(dir, '../..');
const plan = JSON.parse(fs.readFileSync(path.join(dir, 'repair-plan.json')));
const backup = JSON.parse(fs.readFileSync(path.join(dir, 'db-before-clean.json')));
const snapshot = JSON.parse(fs.readFileSync(path.join(dir, 'profiles-before-repair.json'))).profiles;
const source = path.join(root, 'shared/contentReview.ts');
const mod = new Module(source, module);
mod._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
const { reviewedProfile, isPublicProfile } = mod.exports;
const q = value => `'${String(value).replaceAll("'", "''")}'`;
const guards = [], mutations = [];
const report = [];
const preparedAt = new Date().toISOString();

// 조사 후의 다른 편집을 덮어쓰지 않으며, 같은 값이 이미 반영된 경우만 재실행을 허용한다.
function guard(condition, slug) {
  guards.push(`SELECT CASE WHEN ${condition} THEN 1 ELSE json(${q(`profile image repair conflict: ${slug}`)}) END;`);
}

for (const repair of plan.repairs) {
  assert.equal(repair.imageCheck?.state, 'ok');
  const legacy = backup[0].results.find(r => r.slug === repair.slug);
  const stored = backup[1].results.find(r => r.slug === repair.slug);
  const before = stored ? JSON.parse(stored.data) : snapshot.find(p => p.slug === repair.slug);
  assert.ok(legacy && before && isPublicProfile(before));
  let after = { ...before, avatarUrl: repair.avatarUrl, channelUrl: repair.channelUrl };
  if (before.contentReview) after = reviewedProfile(after, before.contentReview.state, preparedAt);
  assert.equal(isPublicProfile(after), true);
  // 이미지·채널과 검토 스냅샷 외의 기존 정보가 달라지면 생성을 중단한다.
  for (const key of Object.keys(before).filter(k => !['avatarUrl', 'channelUrl', 'contentReview'].includes(k))) assert.deepEqual(after[key], before[key]);
  const newData = JSON.stringify(after);
  guard(`EXISTS(SELECT 1 FROM streamerChannel_info WHERE id=${legacy.id} AND slug=${q(repair.slug)} AND channel_id=${legacy.channel_id} AND COALESCE(profile_image_url,'') IN (${q(legacy.profile_image_url || '')},${q(repair.avatarUrl)}))`, repair.slug);
  guard(`EXISTS(SELECT 1 FROM streamerChannel WHERE id=${legacy.channel_id} AND platform=${q(legacy.platform)} AND channel_url IN (${q(legacy.channel_url)},${q(repair.channelUrl)}))`, repair.slug);
  if (stored) guard(`EXISTS(SELECT 1 FROM portal_profiles WHERE slug=${q(repair.slug)} AND data IN (${q(stored.data)},${q(newData)}))`, repair.slug);
  else guard(`NOT EXISTS(SELECT 1 FROM portal_profiles WHERE slug=${q(repair.slug)})`, repair.slug);
  mutations.push(`-- ${repair.slug}: ${repair.source}`);
  mutations.push(`UPDATE streamerChannel_info SET profile_image_url=${q(repair.avatarUrl)},updated_at=CURRENT_TIMESTAMP WHERE id=${legacy.id} AND slug=${q(repair.slug)} AND COALESCE(profile_image_url,'')=${q(legacy.profile_image_url || '')};`);
  if (legacy.channel_url !== repair.channelUrl) mutations.push(`UPDATE streamerChannel SET channel_url=${q(repair.channelUrl)} WHERE id=${legacy.channel_id} AND platform=${q(legacy.platform)} AND channel_url=${q(legacy.channel_url)};`);
  if (stored) {
    mutations.push(`UPDATE portal_profiles SET channel_url=${q(repair.channelUrl)},data=${q(newData)},updated_at=CURRENT_TIMESTAMP WHERE slug=${q(repair.slug)} AND data=${q(stored.data)};`);
    if (legacy.platform === 'CHZZK') mutations.push(`INSERT OR IGNORE INTO portal_profile_channels(channel_key,slug) VALUES(${q('CHZZK:' + repair.channelUrl.split('/').pop())},${q(repair.slug)});`);
  }
  mutations.push(`INSERT OR IGNORE INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash) VALUES(${q('0059-image-' + repair.slug)},${q(repair.slug)},${q(stored?.data || JSON.stringify(before))},${q(newData)},${q('사용자 요청: 공식 방송국·프로필 이미지 주소 복구 [출처: ' + repair.source + ']')},'maintenance:profile-image-repair-2026-11-06');`);
  report.push({ slug: repair.slug, name: before.displayName, source: repair.source, beforeAvatar: before.avatarUrl, avatarUrl: repair.avatarUrl, beforeChannel: before.channelUrl, channelUrl: repair.channelUrl, storedJson: Boolean(stored) });
}
const sql = '-- 2026-11-06 사용자 요청에 따른 공개 프로필 10건의 방송국·이미지 주소만 수정한다.\n-- 다른 마이그레이션을 일괄 실행하지 않는다. 기존 값이 달라졌으면 쓰기 전에 중단한다.\n' + guards.join('\n') + '\n\n' + mutations.join('\n') + '\n';
const file = path.join(root, 'backend/migrations/0059_repair_verified_profile_images_and_channel_urls.sql');
fs.writeFileSync(file, sql);
fs.writeFileSync(path.join(dir, 'repair-manifest.json'), JSON.stringify({ preparedAt, rows: report, unresolved: plan.unresolved }, null, 2));

// 실제 관련 테이블 스키마와 수정 전 행을 사용해 SQL 실행·재실행·충돌 차단을 검증한다.
function database() {
  const db = new DatabaseSync(':memory:');
  for (const row of backup[2].results) db.exec(row.sql);
  db.exec('CREATE TABLE portal_profiles(slug TEXT PRIMARY KEY,channel_url TEXT NOT NULL,data TEXT NOT NULL,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
  for (const row of backup[0].results) {
    const p = snapshot.find(p => p.slug === row.slug);
    db.prepare('INSERT INTO streamerChannel(id,platform,channel_url,channel_name) VALUES(?,?,?,?)').run(row.channel_id,row.platform,row.channel_url,row.channel_name);
    db.prepare('INSERT INTO streamerChannel_info(id,channel_id,slug,display_name,profile_image_url,debut_date,debut_time,timezone,start_at_utc) VALUES(?,?,?,?,?,?,?,?,?)').run(row.id,row.channel_id,row.slug,p.displayName,row.profile_image_url,p.debutDate,p.debutTime,p.timezone,p.startAtUtc);
  }
  for (const row of backup[1].results) db.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(row.slug,row.channel_url,row.data);
  return db;
}
const db = database();
db.exec(sql); db.exec(sql);
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM portal_profile_history').get().n, plan.repairs.length);
for (const repair of plan.repairs) {
  assert.equal(db.prepare('SELECT profile_image_url FROM streamerChannel_info WHERE slug=?').get(repair.slug).profile_image_url, repair.avatarUrl);
  const p = db.prepare('SELECT data FROM portal_profiles WHERE slug=?').get(repair.slug);
  if (p) assert.equal(isPublicProfile(JSON.parse(p.data)), true);
}
const conflict = database();
conflict.prepare('UPDATE streamerChannel_info SET profile_image_url=? WHERE slug=?').run('https://example.com/newer-edit.png', plan.repairs[0].slug);
assert.throws(() => conflict.exec(sql), /malformed JSON/);
assert.equal(conflict.prepare('SELECT COUNT(*) AS n FROM portal_profile_history').get().n, 0);
console.log(JSON.stringify({ file, targets: plan.repairs.length, localSql: 'passed', repeatedExecution: 'passed', concurrentEditGuard: 'passed', publicReviewPreserved: 'passed' }));
