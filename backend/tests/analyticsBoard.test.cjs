const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

// 2026-11-16 21:30 KST로 시간을 고정한다.
const NOW = Date.parse('2026-11-16T12:30:00.000Z');
const OriginalDate = Date;
global.Date = class extends OriginalDate {
  constructor(...args) { super(...(args.length ? args : [NOW])); }
  static now() { return NOW; }
};

function loadTypeScript(file) {
  const bundle = esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
  const loaded = new Module(file, module);
  loaded._compile(bundle.outputFiles[0].text, file);
  return loaded.exports;
}
const root = path.resolve(__dirname, '../..');
const board = loadTypeScript(path.join(root, 'backend/src/services/analyticsBoardService.ts'));
const { normalizeBoardTag } = loadTypeScript(path.join(root, 'shared/analyticsBoard.ts'));

// SQLite를 D1 호출 모양(prepare → bind → all/first, prepare → all)에 맞춘다.
function binding(db) {
  const statement = (sql, values) => ({
    async all() { return { results: db.prepare(sql).all(...values) }; },
    async first() { return db.prepare(sql).get(...values) || null; },
    async run() { return db.prepare(sql).run(...values); },
  });
  return { prepare(sql) { return { ...statement(sql, []), bind(...values) { return statement(sql, values); } }; } };
}

const LOL_A = `CHZZK:${'a'.repeat(32)}`;
const LOL_B = `CHZZK:${'b'.repeat(32)}`;
const TALK_C = `CHZZK:${'c'.repeat(32)}`;
function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(root, 'backend/migrations/0030_broadcast_statistics_collection.sql'), 'utf8'));
  db.exec(`CREATE TABLE streamerChannel (id INTEGER, platform TEXT, channel_name TEXT, channel_url TEXT);
    CREATE TABLE streamerChannel_info (channel_id INTEGER, slug TEXT, agency_name TEXT, display_name TEXT, profile_image_url TEXT);
    INSERT INTO streamerChannel VALUES (1, 'CHZZK', 'A', 'https://chzzk.naver.com/${'a'.repeat(32)}'), (2, 'CHZZK', 'B', 'https://chzzk.naver.com/${'b'.repeat(32)}'), (3, 'SOOP', 'S', 'https://www.sooplive.co.kr/station/soopone');
    INSERT INTO streamerChannel_info VALUES (1, 'channel-a', '스텔라이브', '에이', 'https://img.test/a.png'), (2, NULL, '개인세', NULL, NULL), (3, 'soop-one', '', NULL, NULL);`);
  const run = db.prepare(`INSERT INTO analytics_broadcast_runs (run_id, platform, scheduled_at, started_at, attempt_id, state, scope, viewer_total, channel_total) VALUES (?, ?, ?, ?, ?, 'available', 'test', ?, ?)`);
  const snap = db.prepare(`INSERT INTO analytics_broadcast_snapshots (run_id, stream_id, channel_key, channel_name, title, category_id, category_name, viewers) VALUES (?, ?, ?, ?, '방송', ?, ?, ?)`);
  const latest = Date.parse('2026-11-16T12:00:00.000Z');
  for (let h = 0; h <= 30 * 24; h += 1) {
    const at = new Date(latest - h * 3600000).toISOString();
    const weekBoost = h === 0 ? 1.2 : 1; // 지금은 평소보다 20% 많다.
    const rows = [[LOL_A, 'A', 'League_of_Legends', '리그 오브 레전드', 3000], [LOL_B, 'B', 'League_of_Legends', '리그 오브 레전드', 1500], [TALK_C, 'C', 'talk', '토크', 800]];
    if (h <= 24 * 7) rows.push([`CHZZK:${'d'.repeat(32)}`, 'D', 'Minecraft', '마인크래프트', 500]);
    const total = Math.round(rows.reduce((sum, row) => sum + row[4], 0) * weekBoost);
    run.run(`CHZZK:${at}`, 'CHZZK', at, at, 'x', total, rows.length);
    rows.forEach((row, i) => snap.run(`CHZZK:${at}`, `s${h}-${i}`, row[0], row[1], row[2], row[3], Math.round(row[4] * weekBoost)));
    if (h < 48) {
      run.run(`SOOP:${at}`, 'SOOP', at, at, 'x', 900, 1);
      snap.run(`SOOP:${at}`, `p${h}`, 'SOOP:soopone', 'S', '00040019', 'LOL', 900);
    }
  }
  // 정각이 아닌 10분 회차는 공개 수치에 쓰지 않는다.
  const tenPast = '2026-11-16T12:10:00.000Z';
  run.run(`CHZZK:${tenPast}`, 'CHZZK', tenPast, tenPast, 'x', 999999, 1);
  snap.run(`CHZZK:${tenPast}`, 'ten', LOL_A, 'A', 'League_of_Legends', '리그 오브 레전드', 999999);
  return db;
}

// 치지직 인기 방송 응답(태그 포함)을 흉내 낸다.
function stubChzzk() {
  global.fetch = async () => ({ ok: true, async json() { return { content: { data: [
    { liveId: 1, liveTitle: '신입 방송', concurrentUserCount: 3000, liveCategory: 'League_of_Legends', liveCategoryValue: '리그 오브 레전드', tags: ['신입', '롤', '버츄얼'], channel: { channelId: 'a'.repeat(32), channelName: 'A' } },
    { liveId: 2, liveTitle: '토크', concurrentUserCount: 800, liveCategory: 'talk', liveCategoryValue: '토크', tags: ['#신입 ', '소통'], channel: { channelId: 'c'.repeat(32), channelName: 'C' } },
    { liveId: 3, liveTitle: '롤', concurrentUserCount: 1500, liveCategory: 'League_of_Legends', liveCategoryValue: '리그 오브 레전드', tags: ['롤'], channel: { channelId: 'b'.repeat(32), channelName: 'B' } },
  ], page: {} } }; } });
}

test('태그는 띄어쓰기·대소문자·# 차이를 같은 태그로 본다', () => {
  assert.equal(normalizeBoardTag('#신입 '), normalizeBoardTag('신입'));
  assert.equal(normalizeBoardTag('Just Chatting'), 'justchatting');
});

test('게임 분류와 같은 게임 묶기', () => {
  assert.equal(board.gameName('LOL'), '리그 오브 레전드');
  assert.equal(board.isGameCategory('토크'), false);
  assert.equal(board.isGameCategory('종합 게임'), false);
  assert.equal(board.isGameCategory('마인크래프트'), true);
  assert.equal(board.categoryLabel('talk'), '토크');
});
test('통계 첫 화면은 정각 회차만 쓰고 플랫폼·게임·채널·태그를 계산한다', async () => {
  stubChzzk();
  const db = fixture();
  // 분류가 없는 방송은 게임 순위·게임 외 콘텐츠 어디에도 넣지 않는다.
  db.prepare(`INSERT INTO analytics_broadcast_snapshots (run_id, stream_id, channel_key, channel_name, title, category_id, category_name, viewers) VALUES ('CHZZK:2026-11-16T12:00:00.000Z', 'nocat', 'CHZZK:${'e'.repeat(32)}', 'E', 't', 'unknown', '카테고리 미제공', 50)`).run();
  const data = await board.getAnalyticsBoard(binding(db), 'ALL', 'https://vdebut.live', () => {}, NOW);
  assert.ok(!data.nonGame.some((g) => g.name.includes('미제공')));
  assert.ok(!data.games.now.some((g) => g.name.includes('미제공')));
  assert.equal(data.channels.find((c) => c.channelName === 'E' || c.name === 'E').category, '카테고리 없음');
  assert.equal(data.asOf, '2026-11-16T12:00:00.000Z');
  assert.equal(data.nextAt, '2026-11-16T13:00:00.000Z');
  const card = data.platforms[0];
  assert.equal(card.platform, 'CHZZK');
  assert.equal(card.viewers, 6960); // 5800 × 1.2, 10분 회차(999,999명)는 제외
  assert.equal(card.peakToday, 6960);
  assert.equal(card.usualDelta, 31); // 평소(4주 전 같은 정각) 5,300명 → 지금 6,960명
  assert.equal(card.bigCount, 2);
  assert.equal(data.platforms.length, 1, 'SOOP은 수집 범위가 달라 플랫폼 현황에 넣지 않는다');
  // SOOP 'LOL'과 치지직 '리그 오브 레전드'를 하나로 묶는다.
  assert.equal(data.games.now[0].name, '리그 오브 레전드');
  assert.equal(data.games.now[0].broadcasts, 3);
  assert.equal(data.games.now[0].viewers, 3600 + 1800 + 900);
  assert.ok(!data.games.now.some((g) => g.name === '토크'));
  assert.equal(data.nonGame[0].name, '토크');
  assert.equal(data.trend.today.length, 24);
  assert.equal(data.trend.today[21].chzzk, 6960);
  assert.equal(data.trend.today[22].chzzk, null);
  assert.equal(data.trend.d7.length, 7);
  assert.equal(data.trend.d30.length, 30);
  const a = data.channels.find((c) => c.channelKey === LOL_A);
  const b = data.channels.find((c) => c.channelKey === LOL_B);
  assert.equal(a.affiliation, '스텔라이브');
  assert.equal(a.isVtuber, true);
  assert.equal(b.affiliation, '', '개인세는 표시하지 않는다');
  assert.equal(b.isVtuber, false, '공개 소개가 없으면 버튜버로 보지 않는다');
  assert.deepEqual(data.tags.find((t) => t.tag === '신입'), { tag: '신입', viewers: 3800, broadcasts: 2 });
  assert.ok(data.summary && data.summary.includes('리그 오브 레전드'));
  db.close();
});

test('SOOP만 고르면 치지직 현황·추이를 숨긴다', async () => {
  stubChzzk();
  const db = fixture();
  const data = await board.getAnalyticsBoard(binding(db), 'SOOP', 'https://vdebut.live', () => {}, NOW);
  assert.equal(data.platforms.length, 0);
  assert.equal(data.trend.today.length, 0);
  assert.equal(data.tags.length, 0);
  assert.equal(data.channels.every((c) => c.platform === 'SOOP'), true);
  db.close();
});

test('게임 상세는 7일 추이·시간대·상위 채널을 계산한다', async () => {
  const db = fixture();
  const data = await board.getAnalyticsGameBoard(binding(db), 'LOL', NOW);
  assert.equal(data.name, '리그 오브 레전드');
  assert.equal(data.now.rank, 1);
  assert.equal(data.days.length, 7);
  assert.equal(data.heat.length, 7);
  assert.equal(data.heat[0].length, 24);
  assert.equal(data.top[0].channelKey, LOL_A);
  assert.equal(data.top[0].affiliation, '스텔라이브');
  assert.ok(data.platforms.some((p) => p.platform === 'SOOP'));
  assert.equal(await board.getAnalyticsGameBoard(binding(db), '없는 게임', NOW), null);
  db.close();
});

test('태그 채널 목록은 지금 그 태그로 방송 중인 채널만 보여 준다', async () => {
  stubChzzk();
  const db = fixture();
  const data = await board.getAnalyticsTagBoard(binding(db), '신입', 'https://vdebut.live', () => {}, NOW);
  assert.equal(data.now.broadcasts, 2);
  assert.equal(data.now.viewers, 3800);
  assert.deepEqual(data.channels.map((c) => c.channelKey), [LOL_A, TALK_C]);
  assert.ok(data.withTags.some((t) => t.tag === '롤'));
  assert.equal(await board.getAnalyticsTagBoard(binding(db), '없는태그', 'https://vdebut.live', () => {}, NOW), null);
  db.close();
});

test('채널 페이지는 정각 시청자·10분 단위 방송 시간·게임 구성·시간대·방송 기록을 계산한다', async () => {
  const db = fixture();
  const real = global.fetch;
  global.fetch = async () => ({ ok: true, async json() { return { content: { followerCount: 1234 } }; } });
  const data = await board.getAnalyticsChannelBoard(binding(db), LOL_A, 7, NOW);
  global.fetch = real;
  assert.equal(data.channel.name, '에이');
  assert.equal(data.channel.affiliation, '스텔라이브');
  assert.equal(data.channel.profileSlug, 'channel-a');
  assert.equal(data.channel.followers, 1234);
  assert.deepEqual(data.live, { viewers: 3600, category: '리그 오브 레전드', liveUrl: null });
  // 정각 값만 쓰므로 10분 회차의 999,999명은 최고 시청자에 들어가지 않는다.
  assert.equal(data.kpis.peak, 3600);
  assert.equal(data.kpis.avg, Math.round((3000 * 167 + 3600) / 168)); // 최근 7일 정각 168회
  assert.equal(data.trend.length, 7);
  assert.equal(data.games[0].name, '리그 오브 레전드');
  assert.equal(data.heat.length, 7);
  assert.ok(data.log.length > 0);
  assert.ok(data.kpis.prev, '7일은 앞 7일과 비교한다');
  const ninety = await board.getAnalyticsChannelBoard(binding(db), LOL_A, 90, NOW);
  assert.equal(ninety.kpis.prev, null, '90일은 보관 기간과 같아 비교하지 않는다');
  assert.equal(await board.getAnalyticsChannelBoard(binding(db), `CHZZK:${'f'.repeat(32)}`, 7, NOW), null);
  db.close();
});

test('응답은 다음 정각까지, 정각 회차가 아직 없으면 1분만 재사용한다', () => {
  assert.equal(board.boardCacheSeconds('2026-11-16T12:00:00.000Z', NOW), 35 * 60);
  assert.equal(board.boardCacheSeconds('2026-11-16T11:00:00.000Z', NOW), 60);
});
