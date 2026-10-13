const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');
const root = path.resolve(__dirname, '../..');
const { serveSinglePageApp } = require('@cloudflare/kv-asset-handler');

// 자산 읽기만 대체하고 실제 Worker·Hono 경로·SQL을 함께 검증한다.
async function loadWorker() {
  const bundle = await esbuild.build({ entryPoints: [path.join(root, 'backend/src/index.ts')], bundle: true, platform: 'node', format: 'cjs', write: false,
    plugins: [{ name: 'local-assets', setup(build) {
      build.onResolve({ filter: /^(__STATIC_CONTENT_MANIFEST|@cloudflare\/kv-asset-handler)$/ }, args => ({ path: args.path, namespace: 'local-assets' }));
      build.onLoad({ filter: /.*/, namespace: 'local-assets' }, args => ({ contents: args.path === '__STATIC_CONTENT_MANIFEST' ? 'export default "{}";' : `export const serveSinglePageApp = (...args) => globalThis.__releaseMap(...args); export async function getAssetFromKV({request}, options={}) { const mapped=options.mapRequestToAsset ? options.mapRequestToAsset(request) : request; const p=new URL(mapped.url).pathname; return new Response(globalThis.__releaseAssets[p] || globalThis.__releaseAssets['/index.html']); }` }));
    } }],
  });
  const loaded = new Module(__filename, module); loaded._compile(bundle.outputFiles[0].text, __filename);
  return loaded.exports.default;
}

// 계정·연락처를 복제하지 않고 운영 공개 스키마와 공개 프로필만 리허설에 넣는다.
function database(snapshot) {
  const sqlite = new DatabaseSync(':memory:');
  if (snapshot) {
    for (const table of snapshot.schema) sqlite.exec(table.sql);
    for (const [table, rows] of [['streamerChannel', snapshot.channels], ['streamerChannel_info', snapshot.profiles]]) {
      for (const row of rows) {
        const columns = Object.keys(row);
        sqlite.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`).run(...Object.values(row));
      }
    }
  } else {
    sqlite.exec(`CREATE TABLE streamerChannel(id INTEGER PRIMARY KEY,platform TEXT,channel_url TEXT,channel_name TEXT); CREATE TABLE streamerChannel_info(id INTEGER PRIMARY KEY,channel_id INTEGER,slug TEXT,display_name TEXT,profile_image_url TEXT,description TEXT,agency_name TEXT,country_code TEXT,x_url TEXT,debut_date TEXT,debut_time TEXT,timezone TEXT,start_at_utc TEXT);`);
  }
  sqlite.exec(`CREATE TABLE admin_users(id INTEGER PRIMARY KEY,username TEXT,password_hash TEXT,salt TEXT,role TEXT,last_login_at TEXT); CREATE TABLE debut_submissions(id INTEGER PRIMARY KEY,status TEXT);`);
  sqlite.exec(fs.readFileSync(path.join(root, 'backend/migrations/0030_broadcast_statistics_collection.sql'), 'utf8'));
  // 추가 마이그레이션은 재실행해도 기존 공개 데이터를 변경하지 않는다.
  for (let i = 0; i < 2; i++) { sqlite.exec(fs.readFileSync(path.join(root, 'backend/migrations/0036_portal_requests.sql'), 'utf8')); sqlite.exec(fs.readFileSync(path.join(root, 'backend/migrations/0037_portal_submission_and_history.sql'), 'utf8')); }
  const wrap = (sql, args = []) => ({ bind(...values) { return wrap(sql, sql.includes('?1') ? [Object.fromEntries(values.map((value, index) => [String(index + 1), value]))] : values); }, async first() { return sqlite.prepare(sql).get(...args) || null; }, async all() { return { results: sqlite.prepare(sql).all(...args) }; }, async run() { return sqlite.prepare(sql).run(...args); } });
  return { sqlite, prepare: wrap, async batch(statements) { sqlite.exec('BEGIN'); try { const rows = []; for (const statement of statements) rows.push(await statement.run()); sqlite.exec('COMMIT'); return rows; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } };
}

// 외부 발송·원격 쓰기 없이 로컬 Worker에만 요청한다.
async function setup(snapshot) {
  global.__releaseMap = serveSinglePageApp;
  global.__releaseAssets = Object.fromEntries(['index', 'dev', 'portal'].map(name => [`/${name}.html`, fs.readFileSync(path.join(root, `frontend/dist/${name}.html`), 'utf8')]));
  const worker = await loadWorker();
  const db = database(snapshot);
  const env = { DB: db, PORTAL_ENABLED: 'true' };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const call = (route, options = {}, host = 'vdebut.live') => worker.fetch(new Request(`https://${host}${route}`, options), env, ctx);
  return { db, call };
}

test('운영·개발·비공개·잘못된 URL의 셸과 검색 설정을 분리한다', async () => {
  const { db, call } = await setup();
  try {
    for (const route of ['/', '/upload', '/creators', '/creators/register', '/about', '/guide', '/contact', '/privacy', '/terms', '/analytics', '/analytics/chzzk', '/analytics/soop']) {
      const response = await call(route); const html = await response.text();
      assert.equal(response.status, 200, route); if (!route.startsWith('/analytics')) assert.match(html, /content="index, follow"/);
      assert.match(html, /GTM-KWX992HR/); assert.doesNotMatch(html, /dev\.vdebut\.live/);
      assert.match(html, /portal-main-/, route);
      if (!route.startsWith('/analytics')) assert.equal(response.headers.get('X-Robots-Tag'), null);
    }
    for (const route of ['/admin', '/admin?view=legacy', '/me/favorites', '/submissions/private']) {
      const response = await call(route); assert.equal(response.status, 200); assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
    }
    const dev = await call('/', {}, 'dev.vdebut.live'); const html = await dev.text();
    for (const [language, title] of [['ja', '新人VTuber'], ['en', 'New VTuber']]) {
      const localized = await (await call(`/?lang=${language}`)).text();
      assert.ok(localized.includes(`<html lang="${language}">`)); assert.ok(localized.includes(title));
      assert.ok(localized.includes(`rel="canonical" href="https://vdebut.live/?lang=${language}"`));
      assert.match(localized, /hreflang="ko"/); assert.match(localized, /hreflang="ja"/); assert.match(localized, /hreflang="en"/);
    }
    assert.match(dev.headers.get('X-Robots-Tag'), /noindex/); assert.doesNotMatch(html, /GTM-KWX992HR/);
    assert.equal((await call('/missing-page')).status, 404); assert.equal((await call('/creator/missing')).status, 404);
    assert.match(await (await call('/robots.txt')).text(), /Sitemap: https:\/\/vdebut.live\/sitemap.xml/);
    assert.equal(await (await call('/robots.txt', {}, 'dev.vdebut.live')).text(), 'User-agent: *\nDisallow: /\n');
  } finally { db.sqlite.close(); }
});

test('기존 관리자 경로의 인증 누락·고정 서명 위조·로그인 우회를 차단한다', async () => {
  const { db, call } = await setup();
  try {
    for (const [route, method] of [['/api/v1/admin/crawler/logs', 'GET'], ['/api/v1/admin/crawler/run', 'POST'], ['/api/v1/admin/submissions', 'GET'], ['/api/v1/admin/streamers', 'GET']]) {
      const response = await call(route, { method }); assert.equal(response.status, 401); assert.equal(response.headers.get('Cache-Control'), 'no-store');
    }
    const hash = async value => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))).toString('hex');
    const payload = btoa(JSON.stringify({ uid: 1, role: 'ADMIN', exp: Date.now() + 60000 }));
    const forged = `${payload}.${await hash(payload + 'vdebut_admin_secret_key_2026_secure')}`;
    assert.equal((await call('/api/v1/admin/streamers', { headers: { Authorization: `Bearer ${forged}` } })).status, 401);
    assert.equal((await call('/api/v1/creator/example', { method: 'DELETE' })).status, 403);
    db.sqlite.prepare('INSERT INTO admin_users VALUES(1,?,?,?,?,NULL)').run('test-admin', await hash('test-passwordsalt'), 'salt', 'ADMIN');
    const response = await call('/api/v1/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://vdebut.live' }, body: JSON.stringify({ username: 'test-admin', password: 'test-password' }) });
    assert.equal(response.status, 200); const login = await response.json(); assert.ok(login.success && login.token);
    assert.equal((await call('/api/v1/admin/streamers', { headers: { Authorization: `Bearer ${login.token}` } })).status, 200);
    await call('/api/v1/portal/admin/logout', { method: 'POST', headers: { 'X-Admin-Key': login.token } });
    assert.equal((await call('/api/v1/admin/streamers', { headers: { Authorization: `Bearer ${login.token}` } })).status, 401);
    // 두 로그인 주소를 번갈아 사용해도 실패 횟수 제한이 합산된다.
    for (let i = 0; i < 8; i++) assert.equal((await call(i % 2 ? '/api/v1/admin/login' : '/api/v1/portal/admin/login', { method: 'POST', body: '{}' })).status, 401);
    assert.equal((await call('/api/v1/admin/login', { method: 'POST', body: '{}' })).status, 429);
  } finally { db.sqlite.close(); }
});

test('새 등록은 기존 CMS 목록·삭제·소개 URL·사이트맵까지 일관되게 연결한다', async () => {
  const { db, call } = await setup();
  try {
    const token = 'local-admin';
    const hash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))).toString('hex');
    db.sqlite.prepare('INSERT INTO portal_sessions VALUES(?,?)').run(hash, Date.now() + 60000);
    const body = { countryCode: 'KR', requesterRole: 'SELF', kind: 'DEBUT', displayName: '테스트 <script>홍보</script>', description: '게임 & 노래 "소개"', platform: 'CHZZK', channelUrl: 'https://chzzk.naver.com/' + 'a'.repeat(32), dateState: 'FIXED', debutDate: '2026-10-20', debutTime: '20:00', timezone: 'Asia/Seoul', contactEmail: 'private@example.com' };
    const registered = await (await call('/api/v1/portal/requests', { method: 'POST', body: JSON.stringify(body) })).json();
    const result = await (await call(`/api/v1/portal/admin/requests/${registered.id}/decision`, { method: 'POST', headers: { 'X-Admin-Key': token }, body: JSON.stringify({ status: 'APPROVED' }) })).json();
    assert.ok(result.slug);
    const events = await (await call('/api/v1/events')).json(); assert.equal(events.total, 1); assert.equal(events.events[0].creator.slug, result.slug);
    const creator = await (await call(`/api/v1/creator/${result.slug}`)).json(); assert.equal(creator.creator.displayName, body.displayName);
    const profilePage = await call(`/creator/${result.slug}`); const html = await profilePage.text();
    assert.equal(profilePage.status, 200); assert.doesNotMatch(html, /<script>홍보<\/script>/); assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /private@example.com/);
    const sitemap = await (await call('/sitemap.xml')).text(); assert.ok(sitemap.includes(`/creator/${result.slug}`)); assert.doesNotMatch(sitemap, /\/admin|\/me\/|\/submissions\//);
    const list = await (await call('/api/v1/admin/streamers', { headers: { Authorization: `Bearer ${token}` } })).json(); assert.equal(list.total, 1); assert.equal(list.streamers[0].slug, result.slug);
    assert.equal((await call(`/api/v1/admin/streamers/${result.slug}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })).status, 200);
    assert.equal((await call(`/creator/${result.slug}`)).status, 404);
    assert.equal((await (await call('/api/v1/events')).json()).total, 0);
  } finally { db.sqlite.close(); }
});

const snapshotPath = path.join(root, '.cache/live-release/live-public.json');
test('운영 공개 데이터 346건은 추가 마이그레이션 후 전부 동일한 소개로 조회한다', { skip: !fs.existsSync(snapshotPath) }, async () => {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const { db, call } = await setup(snapshot);
  try {
    const profiles = await (await call('/api/v1/portal/profiles')).json();
    assert.equal(profiles.profiles.length, snapshot.profiles.length);
    assert.deepEqual(profiles.profiles.map(row => row.slug).sort(), snapshot.profiles.map(row => row.slug).sort());
    for (const row of snapshot.profiles) {
      const actual = profiles.profiles.find(profile => profile.slug === row.slug);
      assert.equal(actual.displayName, row.display_name); assert.equal(actual.startAtUtc, row.start_at_utc);
    }
    const response = await call('/creator/' + encodeURIComponent(snapshot.profiles[0].slug)); assert.equal(response.status, 200);
    const sitemap = await (await call('/sitemap.xml')).text();
    assert.equal((sitemap.match(/<loc>https:\/\/vdebut.live\/creator\//g) || []).length, snapshot.profiles.length);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM portal_requests').get().count, 0);
  } finally { db.sqlite.close(); }
});
