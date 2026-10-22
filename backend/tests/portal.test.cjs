const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

// 실제 SQL과 Hono 경로를 묶어 권한과 접수 생명주기를 검증한다.
function load(file) {
  const source = path.resolve(__dirname, file);
  const bundle = esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false });
  const loaded = new Module(source, module); loaded._compile(bundle.outputFiles[0].text, source); return loaded.exports;
}
const { portalApi, portalTokenHash, cleanPortalProfile, readPortalProfiles } = load('../src/services/portalService.ts');
const { portalUtc, portalDateKey, portalChannelUrl, portalMonth } = load('../../shared/portal.ts');

// SQLite 모의 바인딩은 D1 배치의 원자성도 유지한다.
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE streamerChannel(id INTEGER PRIMARY KEY,platform TEXT,channel_url TEXT);
    CREATE TABLE streamerChannel_info(slug TEXT,display_name TEXT,description TEXT,profile_image_url TEXT,agency_name TEXT,country_code TEXT,x_url TEXT,debut_date TEXT,debut_time TEXT,timezone TEXT,start_at_utc TEXT,channel_id INTEGER);
    CREATE TABLE admin_users(id INTEGER PRIMARY KEY,username TEXT,password_hash TEXT,salt TEXT,role TEXT,last_login_at TEXT);`);
  sqlite.exec(readFileSync(path.resolve(__dirname, '../migrations/0036_portal_requests.sql'), 'utf8'));
  sqlite.exec(readFileSync(path.resolve(__dirname, '../migrations/0037_portal_submission_and_history.sql'), 'utf8'));
  const wrap = (sql, args = []) => ({ bind(...values) { return wrap(sql, values); }, async first() { return sqlite.prepare(sql).get(...args) || null; }, async all() { return { results: sqlite.prepare(sql).all(...args) }; }, async run() { const result = sqlite.prepare(sql).run(...args); return { ...result, meta: { changes: Number(result.changes) } }; } });
  return { sqlite, prepare: wrap, async batch(statements) { sqlite.exec('BEGIN'); try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec('COMMIT'); return result; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } } };
}
const profile = { countryCode: 'KR', requesterRole: 'SELF', displayName: '테스트 버튜버', description: '노래와 게임을 소개합니다.', platform: 'CHZZK', channelUrl: 'https://chzzk.naver.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', dateState: 'FIXED', debutDate: '2026-10-20', debutTime: '20:00', timezone: 'Asia/Seoul', tags: ['노래'], languages: ['한국어'] };

// 선택 홍보 자료가 실제 접수·승인·운영 수정·본인 수정 이후에도 유지되는지 확인한다.
test('대표 영상·채널·공지의 저장 흐름과 관리자 전용 데뷔 그룹을 검증한다', async () => {
  const db = database(), env = { DB: db, PORTAL_ENABLED: 'true' };
  const call = (route, method = 'GET', body, headers = {}) => portalApi.request(`https://dev.vdebut.live${route}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined }, env);
  const details = { ...profile, headline: '노래와 게임으로 만나요', bannerUrl: 'https://example.com/banner.jpg', websiteUrl: 'https://example.com/', cafeUrl: 'https://cafe.naver.com/example', noticeUrl: 'https://example.com/news?id=1', xUrl: 'https://x.com/example', videoUrl: 'https://youtu.be/tlCeLkw8Upc', videoTitle: '팀 소개', videoKind: 'GROUP_PV', additionalChannels: [{ platform: 'YOUTUBE', channelUrl: 'https://youtube.com/@example' }], debutGroupId: 'forged-group', debutGroupName: '임의 그룹' };
  details.debutVideoUrl = 'https://www.youtube.com/watch?v=abcdefghijk';
  // 새 영상 목록도 접수·승인·운영자 수정·소유자 수정 전체 경로를 통과한다.
  details.media = [
    { provider: 'YOUTUBE', kind: 'COVER', url: 'https://youtu.be/MZNKiadMo3U', title: '개인 커버곡', featured: true },
    { provider: 'YOUTUBE', kind: 'GROUP_PV', url: 'https://youtu.be/tlCeLkw8Upc', title: '팀 공통 PV' },
    { provider: 'CHZZK', kind: 'CLIP', url: 'https://chzzk.naver.com/clips/fixtureClip01', title: '클립' },
    { provider: 'SOOP', kind: 'REPLAY', url: 'https://vod.sooplive.com/player/123456', title: '첫 방송' },
  ];
  details.notices = [{ title: '공식 일정', url: 'https://example.com/news' }];
  details.fanGuide = '공식 팬 가이드';
  details.details = { species: '달의 정령', birthday: '12월 24일', zodiac: '염소자리', height: '154cm', bloodType: 'A형', mbti: 'INFP', fandomName: '테스트단', oshiMark: '🌙', fanArtTag: '#테스트아트', illustrator: '작가 A', rigger: '작가 B', contentSummary: '노래와 이야기', broadcastStyle: '편안한 소통', fanMessage: '함께 노래해요' };
  const submission = await (await call('/requests', 'POST', { ...details, kind: 'DEBUT' })).json();
  const payload = JSON.parse(db.sqlite.prepare('SELECT payload FROM portal_requests WHERE id=?').get(submission.id).payload);
  assert.equal(payload.debutGroupId, undefined); assert.equal(payload.noticeUrl, details.noticeUrl);
  const adminToken = 'c'.repeat(64), admin = { 'X-Admin-Key': adminToken };
  db.sqlite.prepare('INSERT INTO portal_sessions VALUES(?,?)').run(await portalTokenHash(adminToken), Date.now() + 60000);
  const approved = await (await call(`/admin/requests/${submission.id}/decision`, 'POST', { status: 'APPROVED', contentChecked: true }, admin)).json();
  const registered = (await readPortalProfiles(db))[0];
  for (const field of ['headline', 'bannerUrl', 'websiteUrl', 'cafeUrl', 'noticeUrl', 'xUrl', 'videoUrl', 'videoTitle', 'videoKind']) assert.equal(registered[field], details[field]);
  assert.deepEqual(registered.additionalChannels, details.additionalChannels);
  assert.deepEqual(registered.media.map((item) => item.url), details.media.map((item) => item.url));
  assert.deepEqual(registered.notices, details.notices);
  assert.deepEqual(registered.details, details.details);
  assert.equal(registered.debutVideoUrl, details.debutVideoUrl);
  const listing = await (await call('/admin/profiles', 'GET', undefined, admin)).json();
  const managed = listing.profiles[0];
  assert.equal((await call(`/admin/profiles/${approved.slug}`, 'PUT', { profile: { ...registered, debutGroupId: 'abyss-2026', debutGroupName: 'ABYSS' }, revision: managed.revision, reason: '공식 공지로 팀 확인' }, admin)).status, 200);
  const claim = await (await call('/requests', 'POST', { kind: 'CLAIM', slug: approved.slug, evidenceUrl: profile.channelUrl, message: '공식 채널에 확인 문구 게시' })).json();
  assert.equal((await call(`/admin/requests/${claim.id}/decision`, 'POST', { status: 'APPROVED', proofChecked: true }, admin)).status, 200);
  assert.equal((await call(`/profiles/${approved.slug}`, 'PUT', { ...details, headline: '수정한 한 줄 소개', debutGroupId: 'spoofed', debutGroupName: '가짜' }, { 'X-Request-Key': claim.token })).status, 200);
  const saved = (await readPortalProfiles(db))[0];
  assert.deepEqual(saved.media.map((item) => item.url), details.media.map((item) => item.url));
  assert.equal(saved.fanGuide, details.fanGuide);
  assert.deepEqual(saved.details, details.details);
  // 구형 편집 화면에서 새 필드를 보내지 않아도 저장된 스펙은 사라지지 않는다.
  const oldEditor = { ...details }; delete oldEditor.details;
  assert.equal((await call(`/profiles/${approved.slug}`, 'PUT', oldEditor, { 'X-Request-Key': claim.token })).status, 200);
  assert.deepEqual((await readPortalProfiles(db))[0].details, details.details);
  assert.equal((await call(`/profiles/${approved.slug}`, 'PUT', { ...details, details: {} }, { 'X-Request-Key': claim.token })).status, 200);
  assert.deepEqual((await readPortalProfiles(db))[0].details, {});
  assert.equal((await call(`/profiles/${approved.slug}`, 'PUT', { ...details, media: [{ ...details.media[0], provider: 'SOOP' }] }, { 'X-Request-Key': claim.token })).status, 400);
  assert.equal(saved.debutVideoUrl, details.debutVideoUrl);
  assert.equal((await call(`/profiles/${approved.slug}`, 'PUT', { ...details, debutVideoUrl: 'https://youtube.com.attacker.example/watch?v=abcdefghijk' }, { 'X-Request-Key': claim.token })).status, 400);
  assert.equal(saved.headline, '수정한 한 줄 소개'); assert.equal(saved.debutGroupId, 'abyss-2026'); assert.equal(saved.debutGroupName, 'ABYSS');
  assert.equal(saved.cafeUrl, details.cafeUrl); assert.equal(saved.noticeUrl, details.noticeUrl); assert.equal(saved.videoUrl, details.videoUrl); assert.equal(saved.ownerVerified, true);
  assert.equal((await call(`/profiles/${approved.slug}`, 'PUT', { ...details, videoUrl: 'https://youtube.com.attacker.example/watch?v=tlCeLkw8Upc' }, { 'X-Request-Key': claim.token })).status, 400);
  db.sqlite.close();
});

// 실제 접수 API에서 한국·일본·미국 현지 시각과 신청 출처를 검증한다.
test('등록 필수 소개·신청자·국가 시간대를 검증하고 미국 DST의 없는 시각을 거절한다', async () => {
  const db = database();
  const submit = (body) => portalApi.request('/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profile, kind: 'DEBUT', ...body }) }, { DB: db, PORTAL_ENABLED: 'true' });
  for (const body of [{ description: ' ' }, { requesterRole: '' }, { countryCode: 'GB' }, { countryCode: 'JP', timezone: 'Asia/Seoul' }, { countryCode: 'US', timezone: 'America/New_York', debutDate: '2026-03-08', debutTime: '02:30' }]) assert.equal((await submit(body)).status, 400);
  for (const [index, countryCode, timezone, requesterRole] of [[0, 'KR', 'Asia/Seoul', 'SELF'], [1, 'JP', 'Asia/Tokyo', 'AGENCY'], [2, 'US', 'America/New_York', 'FAN']]) {
    const response = await submit({ countryCode, timezone, requesterRole, channelUrl: `https://chzzk.naver.com/${String(index + 1).repeat(32)}` });
    assert.equal(response.status, 201);
    const { id } = await response.json();
    const saved = JSON.parse(db.sqlite.prepare('SELECT payload FROM portal_requests WHERE id=?').get(id).payload);
    assert.equal(saved.requesterRole, requesterRole); assert.equal(saved.ownerVerified, false);
    assert.equal(saved.startAtUtc, countryCode === 'US' ? '2026-10-21T00:00:00.000Z' : '2026-10-20T11:00:00.000Z');
  }
  db.sqlite.close();
});

// 응답 유실 재시도와 URL 별칭 접수는 다른 보호 조건으로 검증한다.
test('같은 제출 재시도는 하나의 접수이며 SOOP 주소 별칭의 대기·공개 중복을 막는다', async () => {
  const db = database(), env = { DB: db, PORTAL_ENABLED: 'true' };
  const body = { ...profile, kind: 'DEBUT', platform: 'SOOP', channelUrl: 'https://www.sooplive.com/station/test_vt' };
  const key = crypto.randomUUID();
  const submit = (data = body, submissionKey = key) => portalApi.request('/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Submission-Key': submissionKey }, body: JSON.stringify(data) }, env);
  const first = await (await submit()).json();
  const retried = await (await submit()).json();
  assert.equal(first.id, retried.id); assert.equal(retried.token, undefined);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM portal_requests').get().n, 1);
  assert.equal((await submit({ ...body, displayName: '다른 내용' })).status, 409);
  assert.equal((await submit({ ...body, channelUrl: 'https://ch.sooplive.co.kr/test_vt?from=share' }, crypto.randomUUID())).status, 409);
  const adminToken = 'b'.repeat(64); db.sqlite.prepare('INSERT INTO portal_sessions VALUES(?,?)').run(await portalTokenHash(adminToken), Date.now() + 60000);
  assert.equal((await portalApi.request(`/admin/requests/${first.id}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminToken }, body: JSON.stringify({ status: 'APPROVED', contentChecked: true }) }, env)).status, 200);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM portal_pending_channels').get().n, 0);
  assert.equal((await submit({ ...body, channelUrl: 'https://bj.afreecatv.com/test_vt' }, crypto.randomUUID())).status, 409);
  assert.equal((await submit()).status, 200);
  db.sqlite.close();
});

// 공개 정보 수정은 소유권 없이 운영 권한으로 처리하되 이력·버전·기존 출처를 보존한다.
test('관리자 정정·이전 내용 복구·동시 수정 차단과 비공개 이력 권한을 검증한다', async () => {
  const db = database(), env = { DB: db, PORTAL_ENABLED: 'true' };
  db.sqlite.prepare('INSERT INTO streamerChannel VALUES(1,?,?)').run('CHZZK', profile.channelUrl);
  db.sqlite.prepare('INSERT INTO streamerChannel_info(slug,display_name,description,country_code,debut_date,debut_time,timezone,start_at_utc,channel_id) VALUES(?,?,?,?,?,?,?,?,1)').run('original', '기존 버튜버', '원래 소개', 'KR', '2026-10-20', '20:00', 'Asia/Seoul', '2026-10-20T11:00:00.000Z');
  const token = 'c'.repeat(64); db.sqlite.prepare('INSERT INTO portal_sessions VALUES(?,?)').run(await portalTokenHash(token), Date.now() + 60000);
  const call = (route, method = 'GET', body, authenticated = true) => portalApi.request(route, { method, headers: { 'Content-Type': 'application/json', ...(authenticated ? { 'X-Admin-Key': token } : {}) }, body: body ? JSON.stringify(body) : undefined }, env);
  assert.equal((await call('/admin/profiles', 'GET', undefined, false)).status, 401);
  const { profiles: [original] } = await (await call('/admin/profiles')).json();
  const edit = { profile: { ...original.profile, description: '수정한 소개', debutTime: '21:00' }, revision: original.revision, reason: '문의 확인 후 정정' };
  assert.equal((await call('/admin/profiles/original', 'PUT', edit, false)).status, 401);
  assert.equal((await call('/admin/profiles/original', 'PUT', { ...edit, reason: '' })).status, 400);
  const updated = await (await call('/admin/profiles/original', 'PUT', edit)).json();
  assert.equal(updated.profile.slug, 'original'); assert.equal(updated.profile.source, 'EXISTING'); assert.equal(updated.profile.ownerVerified, false);
  assert.equal(updated.profile.startAtUtc, '2026-10-20T12:00:00.000Z');
  assert.equal((await call('/admin/profiles/original', 'PUT', edit)).status, 409);
  assert.equal((await call('/admin/profiles/original/history', 'GET', undefined, false)).status, 401);
  const { history } = await (await call('/admin/profiles/original/history')).json();
  assert.equal(history.length, 1); assert.equal(history[0].before.description, '원래 소개');
  assert.equal((await call('/admin/profiles/original', 'PUT', { profile: history[0].before, revision: updated.revision, reason: '이전 내용 복구' })).status, 200);
  assert.equal((await readPortalProfiles(db))[0].description, '원래 소개');
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM portal_profile_history').get().n, 2);
  assert.equal(db.sqlite.prepare('SELECT description FROM streamerChannel_info').get().description, '원래 소개');
  db.sqlite.close();
});

// 보류 직후에도 캐시된 공개 원문을 반환하지 않는다.
test('공개 목록·관리자·조회 실패는 저장하지 않는다', async () => {
  const db = database();
  const response = await portalApi.request('/profiles', {}, { DB: db, PORTAL_ENABLED: 'true' });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { profiles: [] });
  const admin = await portalApi.request('/admin/requests', {}, { DB: db, PORTAL_ENABLED: 'true' });
  assert.equal(admin.status, 401); assert.equal(admin.headers.get('Cache-Control'), 'no-store');
  const error = await portalApi.request('/profiles', {}, { DB: { prepare() { throw new Error('unavailable'); } }, PORTAL_ENABLED: 'true' });
  assert.equal(error.status, 503); assert.equal(error.headers.get('Cache-Control'), 'no-store');
  db.sqlite.close();
});

// 공개 배너는 검토된 저장 자료만 사용하고 외부 채널을 재조회하지 않는다.
test('미검토 배너는 404이며 승인된 저장 배너만 반환한다', async () => {
  const db = database(), env = { DB: db, PORTAL_ENABLED: 'true' };
  const { reviewedProfile } = load('../../shared/contentReview.ts');
  const stored = reviewedProfile({ ...cleanPortalProfile(profile), slug: 'reviewed', bannerUrl: 'https://example.com/reviewed.jpg' }, 'APPROVED', '2026-10-15');
  db.sqlite.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(stored.slug, stored.channelUrl, JSON.stringify(stored));
  const original = global.fetch;
  global.fetch = async () => { throw new Error('공개 배너가 외부 정보를 조회하면 안 됩니다.'); };
  try {
    const response = await portalApi.request('/profiles/reviewed/banner', {}, env);
    assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { bannerUrl: stored.bannerUrl, mobileBannerUrl: '', description: '' });
    assert.equal((await portalApi.request('/profiles/unknown/banner', {}, env)).status, 404);
    db.sqlite.prepare('UPDATE portal_profiles SET data=? WHERE slug=?').run(JSON.stringify({ ...stored, description: '수정 후 미검토' }), stored.slug);
    assert.equal((await portalApi.request('/profiles/reviewed/banner', {}, env)).status, 404);
  } finally { global.fetch = original; db.sqlite.close(); }
});

// 기존 자료 검토·신청 승인·보류·재검토는 관리자에게만 허용한다.
test('미검토 원문은 관리자에게만 보이며 공개는 확인란과 일치하는 검토 내용을 요구한다', async () => {
  const db = database(), env = { DB: db, PORTAL_ENABLED: 'true' };
  const token = 'd'.repeat(64), admin = { 'X-Admin-Key': token };
  db.sqlite.prepare('INSERT INTO portal_sessions VALUES(?,?)').run(await portalTokenHash(token), Date.now() + 60000);
  const call = (route, method = 'GET', body, headers = {}) => portalApi.request(route, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined }, env);
  const submission = await (await call('/requests', 'POST', { ...profile, kind: 'DEBUT', contentReview: { state: 'APPROVED' } })).json();
  assert.equal((await call(`/admin/requests/${submission.id}/decision`, 'POST', { status: 'APPROVED' }, admin)).status, 400);
  assert.equal((await call(`/admin/requests/${submission.id}/decision`, 'POST', { status: 'APPROVED', contentChecked: true }, admin)).status, 200);
  const listing = await (await call('/admin/profiles', 'GET', undefined, admin)).json();
  const item = listing.profiles[0];
  assert.equal((await (await call('/profiles')).json()).profiles.length, 1);
  const edit = { profile: item.profile, revision: item.revision, reason: '콘텐츠 재검토', publicationState: 'APPROVED' };
  assert.equal((await call(`/admin/profiles/${item.profile.slug}`, 'PUT', edit, admin)).status, 400);
  assert.equal((await call(`/admin/profiles/${item.profile.slug}`, 'PUT', { ...edit, publicationState: 'HOLD' }, {})).status, 401);
  assert.equal((await call(`/admin/profiles/${item.profile.slug}`, 'PUT', { ...edit, publicationState: 'HOLD' }, admin)).status, 200);
  assert.equal((await (await call('/profiles')).json()).profiles.length, 0);
  assert.equal((await readPortalProfiles(db)).length, 1);
  const current = (await (await call('/admin/profiles', 'GET', undefined, admin)).json()).profiles[0];
  assert.equal((await call(`/admin/profiles/${current.profile.slug}`, 'PUT', { ...edit, profile: { ...current.profile, displayName: '【初配信】新人VTuber' }, revision: current.revision, contentChecked: true }, admin)).status, 400);
  db.sqlite.close();
});

// 시간대 변환과 미정 상태는 실제 달력의 날짜를 훼손하지 않는다.
test('현지 시각·일광 절약 시간·잘못된 채널 주소를 검증한다', () => {
  assert.equal(portalUtc('2026-10-20', '20:00', 'Asia/Seoul'), '2026-10-20T11:00:00.000Z');
  assert.equal(portalUtc('2026-07-10', '20:00', 'America/New_York'), '2026-07-11T00:00:00.000Z');
  assert.equal(portalUtc('2026-03-08', '02:30', 'America/New_York'), '');
  assert.equal(portalUtc('2026-02-30', '20:00', 'Asia/Seoul'), '');
  assert.equal(portalDateKey('2026-10-31T20:00:00Z', 'Asia/Seoul'), '2026-11-01');
  assert.equal(portalChannelUrl('https://chzzk.naver.com.attacker.example/a', 'CHZZK'), '');
  assert.equal(portalChannelUrl('javascript:alert(1)', 'CHZZK'), '');
  const tbd = cleanPortalProfile({ ...profile, dateState: 'DATE_TBD', targetMonth: '2026-11' });
  assert.equal(tbd.startAtUtc, ''); assert.equal(portalMonth(tbd, 'UTC'), '2026-11');
  assert.throws(() => cleanPortalProfile({ ...profile, dateState: 'DATE_TBD', targetMonth: '' }));
});

test('채널 검색에서 저장된 등록 시각은 데뷔 일정으로 노출하지 않는다', async () => {
  const db = database();
  db.sqlite.prepare('INSERT INTO streamerChannel VALUES(1,?,?)').run('CHZZK', profile.channelUrl);
  db.sqlite.prepare('INSERT INTO streamerChannel_info VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run('streamer-1', '검색 채널', '검색 채널 스트리머의 채널입니다.', '', '', 'EN', '', '2026-10-02', '00:00', 'Asia/Seoul', '2026-10-02T02:31:00Z', 1);
  const list = await readPortalProfiles(db);
  assert.equal(list[0].dateState, 'NONE'); assert.equal(portalMonth(list[0], 'Asia/Seoul'), '');
  assert.equal(list[0].countryCode, ''); assert.deepEqual(list[0].languages, []);
  db.sqlite.close();
});

test('접수 키·관리자 승인·소유권 키로 등록과 수정 권한을 분리한다', async () => {
  const db = database();
  const env = { DB: db, PORTAL_ENABLED: 'true' };
  const call = (route, method = 'GET', body, headers = {}) => portalApi.request(`https://dev.vdebut.live${route}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined }, env);
  assert.equal((await portalApi.request('https://dev.vdebut.live/profiles', {}, { ...env, PORTAL_ENABLED: undefined })).status, 404);
  assert.deepEqual(await (await call('/profiles')).json(), { profiles: [] });
  assert.equal((await call('/requests', 'POST', { ...profile, kind: 'DEBUT' }, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await call('/requests', 'POST', { kind: 'CONTACT', message: '가'.repeat(22000) })).status, 413);
  const submission = await (await call('/requests', 'POST', { ...profile, kind: 'DEBUT' })).json();
  assert.ok(submission.id && submission.token);
  const stored = db.sqlite.prepare('SELECT token_hash FROM portal_requests WHERE id=?').get(submission.id);
  assert.notEqual(stored.token_hash, submission.token);
  assert.equal((await call(`/requests/${submission.id}`)).status, 404);
  assert.equal((await call(`/requests/${submission.id}`, 'GET', undefined, { 'X-Request-Key': submission.token })).status, 200);
  assert.equal((await call('/admin/requests')).status, 401);
  const adminToken = 'a'.repeat(64);
  db.sqlite.prepare('INSERT INTO portal_sessions VALUES(?,?)').run(await portalTokenHash(adminToken), Date.now() + 60000);
  const admin = { 'X-Admin-Key': adminToken };
  // 개인 관리 화면 없이도 접수 정보가 관리자 검토 목록에 그대로 전달되는지 확인한다.
  const queue = await (await call('/admin/requests', 'GET', undefined, admin)).json();
  const pending = queue.requests.find((request) => request.id === submission.id);
  assert.equal(pending.status, 'PENDING');
  assert.equal(pending.kind, 'DEBUT');
  assert.equal(pending.payload.displayName, profile.displayName);
  assert.equal(pending.payload.channelUrl, profile.channelUrl);
  assert.equal(pending.payload.debutDate, profile.debutDate);
  assert.equal((await call(`/admin/requests/${submission.id}/decision`, 'POST', { status: 'APPROVED', contentChecked: true }, admin)).status, 200);
  const after = await (await call('/profiles')).json(); const registered = after.profiles[0];
  assert.equal(registered.displayName, profile.displayName); assert.equal(registered.ownerVerified, false);
  assert.equal((await call(`/admin/requests/${submission.id}/decision`, 'POST', { status: 'APPROVED', contentChecked: true }, admin)).status, 409);
  assert.equal((await call(`/profiles/${registered.slug}`, 'PUT', profile)).status, 403);
  assert.equal((await call(`/profiles/${registered.slug}`, 'PUT', profile, { 'X-Request-Key': submission.token })).status, 403);
  const claim = await (await call('/requests', 'POST', { kind: 'CLAIM', slug: registered.slug, evidenceUrl: profile.channelUrl, message: '공식 채널에 확인 문구를 게시했습니다.' })).json();
  assert.equal((await call(`/admin/requests/${claim.id}/decision`, 'POST', { status: 'APPROVED', contentChecked: true }, admin)).status, 400);
  assert.equal((await call(`/admin/requests/${claim.id}/decision`, 'POST', { status: 'APPROVED', proofChecked: true }, admin)).status, 200);
  const owner = { 'X-Request-Key': claim.token };
  assert.equal((await call(`/profiles/${registered.slug}`, 'PUT', { ...profile, channelUrl: 'https://chzzk.naver.com/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }, owner)).status, 400);
  assert.equal((await call(`/profiles/${registered.slug}`, 'PUT', { ...profile, description: '소개 수정 완료' }, owner)).status, 200);
  const updated = await (await call('/profiles')).json(); assert.equal(updated.profiles.length, 0); assert.equal((await readPortalProfiles(db))[0].description, '소개 수정 완료');
  await call('/admin/logout', 'POST', {}, admin); assert.equal((await call('/admin/requests', 'GET', undefined, admin)).status, 401);
  db.sqlite.close();
});

// 선택 스펙의 잘못된 입력과 검토 우회를 차단한다.
test('상세 스펙 검증과 콘텐츠 검토를 적용한다', () => {
  const { isPublicProfile, reviewedProfile } = load('../../shared/contentReview.ts');
  for (const details of [null, [], { species: 42 }, { species: 'a'.repeat(81) }, { mbti: 'XXXX' }]) {
    assert.throws(() => cleanPortalProfile({ ...profile, details }));
  }
  const clean = { ...cleanPortalProfile({ ...profile, details: { species: '  요정  ', mbti: 'infp' } }), slug: 'spec' };
  assert.deepEqual(clean.details, { species: '요정', mbti: 'INFP' });
  const approved = reviewedProfile(clean, 'APPROVED', new Date().toISOString());
  assert.equal(isPublicProfile(approved), true);
  assert.equal(isPublicProfile({ ...approved, details: { species: '다른 종족' } }), false);
  assert.equal(isPublicProfile(reviewedProfile({ ...clean, details: { contentSummary: '성인방송' } }, 'APPROVED', new Date().toISOString())), false);
});

// 상세 API가 DB 저장값을 반환하고 최신 회차만 생방송으로 사용하는지 확인한다.
test('상세 단건 조회·공개 권한·플랫폼 직접 조회를 검증한다', async (t) => {
  let platformResponse = {};
  t.mock.method(globalThis, 'fetch', async () => Response.json(platformResponse));
  const { reviewedProfile } = load('../../shared/contentReview.ts');
  const db = database();
  const saved = reviewedProfile({ ...cleanPortalProfile({ ...profile, details: { species: '요정', fanArtTag: '#테스트' }, media: [{ provider: 'YOUTUBE', kind: 'COVER', url: 'https://youtu.be/MZNKiadMo3U', title: '커버 영상' }] }), slug: 'detail' }, 'APPROVED', new Date().toISOString());
  db.sqlite.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(saved.slug, saved.channelUrl, JSON.stringify(saved));
  const call = (slug = 'detail') => portalApi.request(`https://example.test/profiles/${slug}/detail`, {}, { DB: db, PORTAL_ENABLED: 'true' });
  const first = await call();
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  const payload = await first.json();
  assert.deepEqual(payload.profile.details, saved.details);
  assert.deepEqual(payload.profile.media, saved.media);
  assert.equal(payload.broadcast.state, 'UNAVAILABLE');
  assert.equal((await call('missing')).status, 404);
  platformResponse = { code: 200, content: { status: 'OPEN', liveTitle: '오늘의 방송', concurrentUserCount: 123, liveImageUrl: 'https://example.com/live_{type}.jpg', liveCategoryValue: '게임' } };
  const live = await (await call()).json();
  assert.equal(live.broadcast.state, 'LIVE');
  assert.equal(live.broadcast.viewers, 123);
  assert.equal(live.broadcast.thumbnailUrl, 'https://example.com/live_f720.jpg');
  assert.equal(live.broadcast.category, '게임');
  platformResponse = { code: 200, content: { status: 'CLOSE' } };
  assert.equal((await (await call()).json()).broadcast.state, 'OFFLINE');
  db.sqlite.prepare('UPDATE portal_profiles SET data=? WHERE slug=?').run(JSON.stringify({ ...saved, details: { species: '검토되지 않은 수정' } }), saved.slug);
  assert.equal((await call()).status, 404);
  db.sqlite.close();
});

// 플랫폼 실패와 응답 누락은 종료로 표시하지 않으며 외부 호스트를 임의 호출하지 않는다.
test('직접 방송 조회는 두 플랫폼과 오류 상태를 구분한다', async () => {
  const { readProfileBroadcast } = load('../src/services/portalProfileDetail.ts');
  const soop = { ...profile, platform: 'SOOP', channelUrl: 'https://www.sooplive.com/station/oiguu5252' };
  let calls = 0;
  const reply = data => async (url, options) => {
    calls++;
    assert.equal(url, 'https://chapi.sooplive.co.kr/api/oiguu5252/station');
    assert.ok(options.signal);
    assert.equal(options.redirect, 'manual');
    assert.equal(options.cf.cacheTtl, 0);
    return Response.json(data);
  };
  assert.equal((await readProfileBroadcast(soop, reply({ station: {user_id:'oiguu5252'}, broad:null }))).state, 'OFFLINE');
  const live = await readProfileBroadcast(soop, reply({ station: {user_id:'oiguu5252'}, broad:{broad_no:123,broad_title:'방송',current_sum_viewer:0} }));
  assert.equal(live.state, 'LIVE');
  assert.equal(live.viewers, 0);
  assert.equal(live.url, 'https://play.sooplive.co.kr/oiguu5252/123');
  assert.equal(live.thumbnailUrl, 'https://liveimg.sooplive.co.kr/m/123');
  for (const data of [{}, {station:{user_id:'other'},broad:null}, {station:{user_id:'oiguu5252'}}]) assert.equal((await readProfileBroadcast(soop, reply(data))).state, 'UNAVAILABLE');
  assert.equal((await readProfileBroadcast(soop, async()=>new Response('', {status:429}))).state, 'UNAVAILABLE');
  assert.equal((await readProfileBroadcast(soop, async()=>{throw new Error('timeout')})).state, 'UNAVAILABLE');
  assert.equal((await readProfileBroadcast({...soop,channelUrl:'https://example.com/a'}, reply({}))).state, 'UNKNOWN');
  assert.equal(calls, 5);
});

// 최신순 요청·첫 페이지 제한·타 채널 및 제한 영상 제외를 함께 검증한다.
test('채널 영상은 최신순의 제한된 목록만 반환한다', async () => {
  const { readProfileChannelMedia } = load('../src/services/portalChannelMedia.ts');
  const id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const calls = [];
  const chzzk = await readProfileChannelMedia(profile, async (url, options) => {
    const query = new URL(url); calls.push(query);
    assert.equal(options.redirect, 'manual'); assert.equal(options.cf.cacheTtl, 0);
    assert.equal(query.searchParams.get('page'), '0');
    if (query.pathname.endsWith('/clips')) {
      assert.equal(query.searchParams.get('orderType'), 'RECENT'); assert.equal(query.searchParams.get('size'), '4');
      return Response.json({ code: 200, content: { data: [
        { clipUID: 'clip001', clipTitle: '먼저 만든 클립', ownerChannelId: id, adult: false, createdDate: '2026-10-20 12:00:00', readCount: 9999 },
        { clipUID: 'clip002', clipTitle: '새 클립', ownerChannelId: id, adult: false, createdDate: '2026-10-21 12:00:00', readCount: 0 },
        { clipUID: 'clip003', clipTitle: '다른 채널', ownerChannelId: 'other', adult: false, createdDate: '2026-10-22 12:00:00' },
        { clipUID: 'clip004', clipTitle: '제한 클립', ownerChannelId: id, adult: true, createdDate: '2026-10-22 12:00:00' },
      ] } });
    }
    assert.equal(query.searchParams.get('sortType'), 'LATEST'); assert.equal(query.searchParams.get('size'), '2');
    return Response.json({ code: 200, content: { data: [
      { videoNo: 123, videoTitle: '최근 방송', channel: {channelId: id}, adult: false, publishDate: '2026-10-21 22:50:41', thumbnailImageUrl: 'https://example.com/video.jpg' },
      { videoNo: 124, videoTitle: '유료 방송', channel: {channelId: id}, adult: false, paidProductId: 'paid', publishDate: '2026-10-22 22:50:41' },
    ] } });
  });
  assert.equal(calls.length, 2);
  assert.equal(chzzk.videos.items.length, 1);
  assert.deepEqual(chzzk.clips.items.map(x => x.title), ['새 클립', '먼저 만든 클립']);
  assert.equal(chzzk.clips.items[0].publishedAt, '2026-10-21T03:00:00.000Z');
  assert.equal(chzzk.videos.items[0].url, 'https://chzzk.naver.com/video/123');
});

// 공식 채널 목록에 연결된 팬 클립을 허용하되 다시보기·타 채널·중복은 제외한다.
test('SOOP는 첫 페이지에서 공개 다시보기 2개와 최신 클립 4개만 선택한다', async () => {
  const { readProfileChannelMedia } = load('../src/services/portalChannelMedia.ts');
  const soop = { ...profile, platform: 'SOOP', channelUrl: 'https://www.sooplive.com/station/oiguu5252' };
  let calls = 0;
  const media = await readProfileChannelMedia(soop, async url => {
    calls++;
    const query = new URL(url), clips = query.pathname.endsWith('/clip');
    assert.equal(query.hostname, 'api-channel.sooplive.com'); assert.equal(query.searchParams.get('orderBy'), 'reg_date');
    assert.equal(query.searchParams.get('perPage'), '20'); assert.equal(query.searchParams.get('page'), '1');
    const rows = Array.from({length: 20}, (_, i) => ({ titleNo: 100 + i, titleName: `영상 ${i}`, userId: clips ? 'fan' : 'oiguu5252', badge: clips ? { bjId: 'oiguu5252' } : null, authNo: 101, regDate: `2026-10-${String(22-i).padStart(2,'0')} 12:00:00`, ucc: { grade: 0, paidPpv: false, flag: 'SUCCEED', fileType: clips ? 'CLIP' : 'REVIEW', thumb: 'https://example.com/thumbnail.jpg' } }));
    rows[0].ucc.grade = 19;
    rows[2] = {...rows[1]};
    rows[3].ucc.fileType = clips ? 'REVIEW' : 'CLIP';
    rows[4].authNo = 104;
    if (clips) rows[5].badge.bjId = 'other';
    return Response.json({ contents: rows, meta: { totalPages: 999 } });
  });
  assert.equal(calls, 2); assert.equal(media.videos.items.length, 2); assert.equal(media.clips.items.length, 4);
  assert.equal(media.clips.items[0].url, 'https://vod.sooplive.com/player/101');
  assert.equal(media.clips.items[1].url, 'https://vod.sooplive.com/player/106');
  assert.ok(media.clips.items.every(x => x.kind === 'CLIP' && x.thumbnailUrl));
});

// 일부 실패가 다른 목록을 지우지 않고, 빈 응답·오류·지원하지 않는 주소를 구분한다.
test('채널 영상 조회 실패와 빈 목록을 구분한다', async () => {
  const { readProfileChannelMedia } = load('../src/services/portalChannelMedia.ts');
  const partial = await readProfileChannelMedia(profile, async url => url.includes('/clips?') ? new Response('', { status: 429 }) : Response.json({ code: 200, content: { data: [] } }));
  assert.equal(partial.videos.state, 'AVAILABLE'); assert.equal(partial.clips.state, 'UNAVAILABLE');
  assert.equal((await readProfileChannelMedia(profile, async () => { throw new Error('timeout'); })).videos.state, 'UNAVAILABLE');
  assert.equal((await readProfileChannelMedia(profile, async () => Response.json({}))).clips.state, 'UNAVAILABLE');
  assert.equal((await readProfileChannelMedia({ ...profile, channelUrl: 'https://example.com/a' }, async () => { assert.fail('잘못된 주소는 요청하지 않는다'); })).clips.state, 'UNSUPPORTED');
});

// 제보는 원본을 바꾸지 않고 출처와 함께 비공개 검토 대기열에 남긴다.
test('도감 제보의 공식 출처·공개 프로필·기존 문의 호환성을 검증한다', async () => {
  const { reviewedProfile } = load('../../shared/contentReview.ts');
  const { wikiEvidenceUrl } = load('../../shared/wikiParticipation.ts');
  for (const url of ['http://x.com/user/status/1', 'https://x.com.attacker.example/post', 'https://x.com/', 'https://user:pass@x.com/user/status/1']) assert.equal(wikiEvidenceUrl(url), '');
  assert.equal(wikiEvidenceUrl('https://x.com/user/status/123'), 'https://x.com/user/status/123');
  const db = database(), env = { DB: db, PORTAL_ENABLED: 'true' };
  const saved = reviewedProfile({ ...cleanPortalProfile(profile), slug: 'wiki' }, 'APPROVED', new Date().toISOString());
  db.sqlite.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(saved.slug, saved.channelUrl, JSON.stringify(saved));
  const call = body => portalApi.request('/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, env);
  const revision = { kind: 'CONTACT', requestType: 'WIKI_REVISION', slug: 'wiki', targetField: 'species', message: '공식 소개의 종족', evidenceUrl: 'https://x.com/user/status/123' };
  assert.equal((await call({ ...revision, evidenceUrl: 'https://example.com/no-proof' })).status, 400);
  assert.equal((await call({ ...revision, targetField: 'ownerVerified' })).status, 400);
  assert.equal((await call({ ...revision, slug: 'missing' })).status, 404);
  const response = await call(revision); assert.equal(response.status, 201);
  const receipt = await response.json();
  const row = db.sqlite.prepare('SELECT * FROM portal_requests WHERE id=?').get(receipt.id);
  const payload = JSON.parse(row.payload);
  assert.equal(row.status, 'PENDING'); assert.equal(payload.evidenceUrl, revision.evidenceUrl); assert.equal(payload.targetField, 'species'); assert.equal(payload.displayName, profile.displayName);
  assert.deepEqual(JSON.parse(db.sqlite.prepare('SELECT data FROM portal_profiles WHERE slug=?').get('wiki').data), saved);
  assert.equal((await call({ kind: 'CONTACT', message: '일반 문의입니다.' })).status, 201);
  db.sqlite.close();
});

// 응원은 내용 확인 후 승인한 글만 공개하며 접수 키·연락처는 숨긴다.
test('응원 메시지의 승인 전 비공개·내용 확인·개인정보 제외를 검증한다', async () => {
  const { reviewedProfile } = load('../../shared/contentReview.ts');
  const db = database(), env = { DB: db, PORTAL_ENABLED: 'true' };
  const saved = reviewedProfile({ ...cleanPortalProfile(profile), slug: 'support' }, 'APPROVED', new Date().toISOString());
  db.sqlite.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?)').run(saved.slug, saved.channelUrl, JSON.stringify(saved));
  const call = (route, method = 'GET', body, headers = {}) => portalApi.request(route, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined }, env);
  const body = { kind: 'CONTACT', requestType: 'SUPPORT', slug: 'support', message: '첫 무대를 응원해요!', contactEmail: 'private@example.com' };
  assert.equal((await call('/requests', 'POST', { ...body, message: '가'.repeat(151) })).status, 400);
  const response = await call('/requests', 'POST', body); assert.equal(response.status, 201);
  const receipt = await response.json();
  assert.deepEqual(await (await call('/profiles/support/support')).json(), { messages: [] });
  const token = 'e'.repeat(64), admin = { 'X-Admin-Key': token };
  db.sqlite.prepare('INSERT INTO portal_sessions VALUES(?,?)').run(await portalTokenHash(token), Date.now() + 60000);
  assert.equal((await call(`/admin/requests/${receipt.id}/decision`, 'POST', { status: 'APPROVED' }, admin)).status, 400);
  assert.equal((await call(`/admin/requests/${receipt.id}/decision`, 'POST', { status: 'APPROVED', contentChecked: true }, admin)).status, 200);
  const data = await (await call('/profiles/support/support')).json();
  assert.equal(data.messages.length, 1); assert.equal(data.messages[0].message, body.message);
  assert.deepEqual(Object.keys(data.messages[0]).sort(), ['createdAt', 'id', 'message']);
  assert.ok(!JSON.stringify(data).includes('private@example.com')); assert.ok(!JSON.stringify(data).includes(receipt.token));
  assert.equal((await call('/profiles/missing/support')).status, 404);
  db.sqlite.prepare('UPDATE portal_profiles SET data=? WHERE slug=?').run(JSON.stringify({ ...saved, description: '미검토 변경' }), saved.slug);
  assert.equal((await call('/profiles/support/support')).status, 404);
  db.sqlite.close();
});
