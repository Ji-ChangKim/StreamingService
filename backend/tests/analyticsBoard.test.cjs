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
    sql, values,
    async all() { return { results: db.prepare(sql).all(...values) }; },
    async first() { return db.prepare(sql).get(...values) || null; },
    async run() { const r = db.prepare(sql).run(...values); return { meta: { changes: r.changes } }; },
  });
  return {
    prepare(sql) { return { ...statement(sql, []), bind(...values) { return statement(sql, values); } }; },
    // 두 플랫폼이 동시에 저장하므로 테스트에서는 트랜잭션 없이 순서대로 실행한다.
    async batch(list) { const out = []; for (const s of list) out.push(await s.run()); return out; },
  };
}
const collection = loadTypeScript(path.join(root, 'backend/src/services/broadcastStatisticsCollection.ts'));

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
  // 아직 끝나지 않은(running) 10분 회차는 어떤 수치에도 쓰지 않는다.
  const tenPast = '2026-11-16T12:10:00.000Z';
  db.prepare(`INSERT INTO analytics_broadcast_runs (run_id, platform, scheduled_at, started_at, attempt_id, state, scope, viewer_total, channel_total) VALUES (?, 'CHZZK', ?, ?, 'x', 'running', 'test', 999999, 1)`).run(`CHZZK:${tenPast}`, tenPast, tenPast);
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
  assert.equal(data.nextAt, '2026-11-16T12:40:00.000Z', '다음 10분 회차');
  const card = data.platforms[0];
  assert.equal(card.platform, 'CHZZK');
  assert.equal(card.viewers, 6960); // 5800 × 1.2, 끝나지 않은 회차(999,999명)는 제외
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
  assert.equal(data.availability.coverageDays, 30);
  assert.equal(data.availability.platformReady.CHZZK, true);
  assert.equal(data.availability.platformReady.SOOP, true, 'SOOP 최근 회차에 분류(LOL)가 있으면 켠다');
  db.close();
});

test('지금 숫자는 가장 최근 10분 회차로, 기간 통계는 정각 회차로 계산한다', async () => {
  stubChzzk();
  const db = fixture();
  const at = '2026-11-16T12:20:00.000Z';
  db.prepare(`INSERT INTO analytics_broadcast_runs (run_id, platform, scheduled_at, started_at, attempt_id, state, scope, viewer_total, channel_total) VALUES (?, 'CHZZK', ?, ?, 'x', 'available', 'test', 8000, 2)`).run(`CHZZK:${at}`, at, at);
  const snap = db.prepare(`INSERT INTO analytics_broadcast_snapshots (run_id, stream_id, channel_key, channel_name, title, category_id, category_name, viewers) VALUES (?, ?, ?, ?, '방송', ?, ?, ?)`);
  snap.run(`CHZZK:${at}`, 'm1', `CHZZK:${'d'.repeat(32)}`, 'D', 'Minecraft', '마인크래프트', 6000);
  snap.run(`CHZZK:${at}`, 'm2', LOL_A, 'A', 'Minecraft', '마인크래프트', 2000);
  const data = await board.getAnalyticsBoard(binding(db), 'CHZZK', 'https://vdebut.live', () => {}, NOW);
  assert.equal(data.asOf, at);
  assert.equal(data.platforms[0].viewers, 8000);
  assert.equal(data.platforms[0].peakToday, 8000, '오늘 최고는 10분 회차까지 포함한다');
  assert.equal(data.platforms[0].bigCount, 2);
  assert.equal(data.games.now[0].name, '마인크래프트');
  assert.equal(data.games.now[0].broadcasts, 2);
  assert.equal(data.channels[0].channelKey, `CHZZK:${'d'.repeat(32)}`);
  assert.equal(data.trend.today[21].chzzk, 6960, '시간대 추이는 정각 값 그대로');
  assert.equal(data.games.today[0].name, '리그 오브 레전드', '오늘 순위는 정각 평균 그대로');
  db.close();
});

test('한 플랫폼만 먼저 끝난 회차는 지금 기준으로 쓰지 않고, 20분 넘게 멈춘 플랫폼은 기다리지 않는다', () => {
  const r = (platform, at) => ({ platform, scheduled_at: at, viewer_total: 1 });
  assert.equal(board.commonLatest([r('CHZZK', '2026-11-16T12:00:00.000Z'), r('SOOP', '2026-11-16T12:00:00.000Z'), r('SOOP', '2026-11-16T12:10:00.000Z')], [], ['CHZZK', 'SOOP']), '2026-11-16T12:00:00.000Z');
  assert.equal(board.commonLatest([r('CHZZK', '2026-11-16T12:10:00.000Z'), r('SOOP', '2026-11-16T11:00:00.000Z')], [], ['CHZZK', 'SOOP']), '2026-11-16T12:10:00.000Z');
  assert.equal(board.isUncategorized('카테고리 미제공'), true);
  assert.equal(board.isUncategorized('미분류'), true);
  assert.equal(board.isUncategorized('토크'), false);
});

test('점유율 분모(nowViewers)는 지금 회차의 모든 플랫폼 시청자 합이다', async () => {
  stubChzzk();
  const db = fixture();
  const data = await board.getAnalyticsBoard(binding(db), 'ALL', 'https://vdebut.live', () => {}, NOW);
  assert.equal(data.nowViewers, 6960 + 900);
  assert.ok(data.games.now[0].viewers <= data.nowViewers);
  db.close();
});

test('SOOP 최근 회차에 방송 분류가 절반 넘게 비어 있으면 SOOP 선택을 끈다', async () => {
  stubChzzk();
  const db = fixture();
  db.exec(`UPDATE analytics_broadcast_snapshots SET category_name = '카테고리 미제공' WHERE run_id LIKE 'SOOP:%'`);
  const data = await board.getAnalyticsBoard(binding(db), 'ALL', 'https://vdebut.live', () => {}, NOW);
  assert.equal(data.availability.platformReady.SOOP, false);
  assert.equal(data.availability.platformReady.CHZZK, true);
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
  assert.equal(data.coverageDays, 30);
  assert.equal(data.prevReady, true, '수집 30일이면 7일 비교(14일 필요)가 가능하다');
  const thirty = await board.getAnalyticsChannelBoard(binding(db), LOL_A, 30, NOW);
  assert.equal(thirty.prevReady, false, '30일 비교는 60일이 모여야 한다');
  assert.equal(thirty.kpis.prev, null, '앞 기간이 덜 모였으면 비교 수치를 내지 않는다');
  const ninety = await board.getAnalyticsChannelBoard(binding(db), LOL_A, 90, NOW);
  assert.equal(ninety.kpis.prev, null, '90일은 보관 기간과 같아 비교하지 않는다');
  assert.equal(await board.getAnalyticsChannelBoard(binding(db), `CHZZK:${'f'.repeat(32)}`, 7, NOW), null);
  db.close();
});

// 수집 테스트용: 치지직 인기 방송 1페이지(태그 포함)와 빈 SOOP 등록 채널.
function collectionDb(withTagColumn) {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(root, 'backend/migrations/0030_broadcast_statistics_collection.sql'), 'utf8'));
  if (withTagColumn) db.exec(fs.readFileSync(path.join(root, 'backend/migrations/0064_add_broadcast_snapshot_tags.sql'), 'utf8'));
  db.exec(`CREATE TABLE streamerChannel (id INTEGER, platform TEXT, channel_name TEXT, channel_url TEXT);
    CREATE TABLE streamerChannel_info (channel_id INTEGER, slug TEXT, agency_name TEXT, display_name TEXT, profile_image_url TEXT, debut_date TEXT);`);
  return db;
}

test('태그 열이 없어도 수집은 그대로 저장되고, 열이 생기면 태그를 함께 저장한다', async () => {
  stubChzzk();
  for (const withTagColumn of [false, true]) {
    collection.resetSnapshotTagsCheck(); board.resetSnapshotTagsCheck();
    const db = collectionDb(withTagColumn);
    const results = await collection.collectBroadcastStatistics(binding(db), Date.parse('2026-11-16T12:00:00.000Z'));
    assert.equal(results.find((r) => r.platform === 'CHZZK').state, 'available');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM analytics_broadcast_snapshots').get().n, 3);
    if (withTagColumn) {
      const row = db.prepare(`SELECT tags FROM analytics_broadcast_snapshots WHERE channel_key = ?`).get(TALK_C);
      assert.deepEqual(JSON.parse(row.tags), ['신입', '소통'], '#과 앞뒤 공백을 정리해 저장한다');
    }
    db.close();
  }
  collection.resetSnapshotTagsCheck(); board.resetSnapshotTagsCheck();
});

test('저장된 태그로 태그 순위·태그 추이·채널의 자주 쓰는 태그를 계산한다', async () => {
  collection.resetSnapshotTagsCheck(); board.resetSnapshotTagsCheck();
  global.fetch = async () => { throw new Error('저장된 태그가 있으면 인기 방송 목록을 다시 읽지 않는다'); };
  const db = fixture();
  db.exec(fs.readFileSync(path.join(root, 'backend/migrations/0064_add_broadcast_snapshot_tags.sql'), 'utf8'));
  // 최근 3시간 동안 A·C 채널이 '신입' 태그를 달았다.
  db.exec(`UPDATE analytics_broadcast_snapshots SET tags = '["신입","롤"]' WHERE channel_key = '${LOL_A}' AND run_id IN (SELECT run_id FROM analytics_broadcast_runs WHERE platform = 'CHZZK' AND scheduled_at >= '2026-11-16T10:00:00.000Z')`);
  db.exec(`UPDATE analytics_broadcast_snapshots SET tags = '["신 입 "]' WHERE channel_key = '${TALK_C}' AND run_id IN (SELECT run_id FROM analytics_broadcast_runs WHERE platform = 'CHZZK' AND scheduled_at >= '2026-11-16T10:00:00.000Z')`);
  const d1 = binding(db);
  const main = await board.getAnalyticsBoard(d1, 'ALL', 'https://vdebut.live', () => {}, NOW);
  assert.deepEqual(main.tags.find((t) => t.tag === '신입'), { tag: '신입', viewers: 3600 + 960, broadcasts: 2 });
  const tag = await board.getAnalyticsTagBoard(d1, '신입', 'https://vdebut.live', () => {}, NOW);
  assert.equal(tag.now.broadcasts, 2);
  assert.equal(tag.trend.today.length, 24);
  assert.equal(tag.trend.today[19].viewers, 3000 + 800, '19시(KST) 정각: A 3,000명 + C 800명');
  assert.equal(tag.trend.today[18].viewers, null, '태그 저장 시작 전 시각은 비운다');
  assert.equal(tag.trend.d30.length, 30);
  const real = global.fetch; global.fetch = async () => ({ ok: false });
  const channel = await board.getAnalyticsChannelBoard(d1, LOL_A, 7, NOW);
  global.fetch = real;
  assert.deepEqual(channel.tags.map((t) => t.tag).sort(), ['롤', '신입']);
  assert.ok(channel.tags.every((t) => t.broadcasts >= 1));
  db.close();
  collection.resetSnapshotTagsCheck(); board.resetSnapshotTagsCheck();
});

test('응답은 다음 10분 회차(+2분)까지, 이번 회차가 아직 없으면 1분만 재사용한다', () => {
  assert.equal(board.boardCacheSeconds('2026-11-16T12:30:00.000Z', NOW), 12 * 60);
  assert.equal(board.boardCacheSeconds('2026-11-16T12:20:00.000Z', NOW), 60);
});
