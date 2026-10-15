const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

// 한국 시각 자정 직후에도 당일 테스트 기록이 미래로 제외되지 않게 시간을 고정한다.
const OriginalDate = Date;
global.Date = class extends OriginalDate {
  constructor(...args) { super(...(args.length ? args : ['2026-10-06T14:59:59.999Z'])); }
  static now() { return OriginalDate.parse('2026-10-06T14:59:59.999Z'); }
};

// 테스트에서도 운영 서비스의 실제 SQL을 실행한다.
function loadTypeScript(file) {
  const bundle = esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
  const loaded = new Module(file, module);
  loaded._compile(bundle.outputFiles[0].text, file);
  return loaded.exports;
}
const root = path.resolve(__dirname, '../..');
const { getBroadcastActivity, getActivityBroadcastPage, readActivityCursor } = loadTypeScript(path.join(root, 'backend/src/services/broadcastActivityService.ts'));
const { activityPeriod, validActivityRange, activityChannelKey } = loadTypeScript(path.join(root, 'shared/broadcastActivity.ts'));
const { pruneStatisticsCollections } = loadTypeScript(path.join(root, 'backend/src/services/broadcastStatisticsCollection.ts'));
const { initialActivityBroadcastPage } = loadTypeScript(path.join(root, 'shared/activityBroadcastPage.ts'));
const key = `CHZZK:${'a'.repeat(32)}`;
const range = activityPeriod(7);

test('90일 조회 기록은 보존하고 오래된 회차만 최대 100개 정리한다', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(root, 'backend/migrations/0030_broadcast_statistics_collection.sql'), 'utf8'));
  const now = Date.parse('2026-10-05T14:00:00.000Z');
  const insert = db.prepare(`INSERT INTO analytics_broadcast_runs
    (run_id, platform, scheduled_at, started_at, attempt_id, state, scope) VALUES (?, 'CHZZK', ?, ?, ?, 'available', 'test')`);
  for (const days of [7, 30, 89, 90]) {
    const at = new Date(now - days * 86400000).toISOString();
    insert.run(`keep-${days}`, at, at, `keep-${days}`);
  }
  for (let index = 0; index < 105; index++) {
    const at = new Date(now - 91 * 86400000 - index * 600000).toISOString();
    insert.run(`old-${index}`, at, at, `old-${index}`);
  }
  await pruneStatisticsCollections({ prepare(sql) { return { bind(...values) { return { async run() { return db.prepare(sql).run(...values); } }; } }; } }, now);
  assert.equal(db.prepare("SELECT COUNT(*) count FROM analytics_broadcast_runs WHERE run_id LIKE 'keep-%'").get().count, 4);
  assert.equal(db.prepare("SELECT COUNT(*) count FROM analytics_broadcast_runs WHERE run_id LIKE 'old-%'").get().count, 5);
  db.close();
});

// SQLite를 D1의 읽기 전용 호출 모양에 맞춰 실행한다.
function binding(db) {
  return {
    prepare(sql) { return { bind(...values) { return { sql, values, async first() { return db.prepare(sql).get(...(sql.includes('?1') ? [Object.fromEntries(values.map((value, index) => [String(index + 1), value]))] : values)) || null; } }; } }; },
    async batch(statements) { return statements.map(({ sql, values }) => ({ results: db.prepare(sql).all(Object.fromEntries(values.map((value, index) => [String(index + 1), value]))) })); },
  };
}

// 수집 공백·플랫폼별 동일 방송 ID·카테고리 변경·빈 수집 회차를 포함한다.
function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(root, 'backend/migrations/0030_broadcast_statistics_collection.sql'), 'utf8'));
  db.exec(`CREATE TABLE streamerChannel (id INTEGER, platform TEXT, channel_name TEXT, channel_url TEXT);
    CREATE TABLE streamerChannel_info (channel_id INTEGER, display_name TEXT, profile_image_url TEXT, slug TEXT);`);
  const time = (clock) => new Date(`${range.to}T${clock}:00+09:00`).toISOString();
  for (const platform of ['CHZZK', 'SOOP']) {
    for (const [index, clock] of ['00:00', '00:10', '00:20', '01:00', '01:10', '02:00'].entries()) {
      const run = `${platform}-${index}`;
      db.prepare(`INSERT INTO analytics_broadcast_runs VALUES (?, ?, ?, ?, ?, ?, ?, 'available', 'test', 1, 0, 0, NULL)`)
        .run(run, platform, time(clock), time(clock), time(clock), time(clock), run);
      if (index === 5 || (platform === 'SOOP' && index > 2)) continue;
      db.prepare(`INSERT INTO analytics_broadcast_snapshots VALUES (?, '100', ?, ?, ?, NULL, NULL, ?, ?, ?, 10, ?)`)
        .run(run, platform === 'CHZZK' ? key : 'SOOP:test', platform === 'CHZZK' ? '테스트 스트리머' : 'SOOP 테스트',
          platform === 'CHZZK' ? `https://chzzk.naver.com/${'a'.repeat(32)}` : 'https://ch.sooplive.co.kr/test',
          index === 4 ? '가 마지막 제목' : '하 첫 제목', index < 2 || platform === 'SOOP' ? 'talk' : 'game',
          index < 2 || platform === 'SOOP' ? '소통' : '게임', platform === 'CHZZK' ? time('00:00') : null);
    }
  }
  return db;
}

test('전체 집계는 플랫폼을 합산하고 수집 공백을 방송 시간에서 제외한다', async () => {
  const db = fixture();
  const result = await getBroadcastActivity(binding(db), { ...range, platform: 'ALL', channel: '', category: '' });
  assert.equal(result.summary.streamers, 2);
  assert.equal(result.summary.broadcasts, 2);
  assert.ok(Math.abs(result.summary.minutes - 50) < 0.001);
  assert.equal(result.heatmap.find((cell) => cell.hour === 0).channels, 2);
  assert.equal(result.heatmap.find((cell) => cell.hour === 2).channels, 0);
  assert.equal(result.starts.reduce((sum, cell) => sum + cell.broadcasts, 0), 1);
  assert.equal(result.broadcasts.find((row) => row.channelKey === key).title, '가 마지막 제목');
  assert.ok(Math.abs(result.categories.filter((category) => category.name === '소통').reduce((sum, category) => sum + category.minutes, 0) - 40) < 0.001);
  assert.equal(result.summary.categoryCount, 3);
  db.close();
});

test('개인 및 카테고리 필터는 다른 채널과 카테고리 시간을 포함하지 않는다', async () => {
  const db = fixture();
  const personal = await getBroadcastActivity(binding(db), { ...range, platform: 'CHZZK', channel: key, category: '' });
  assert.equal(personal.summary.broadcasts, 1);
  assert.ok(Math.abs(personal.summary.minutes - 30) < 0.001);
  assert.equal(personal.streamer.name, '테스트 스트리머');
  const category = await getBroadcastActivity(binding(db), { ...range, platform: 'ALL', channel: '', category: 'CHZZK:talk' });
  assert.ok(Math.abs(category.summary.minutes - 20) < 0.001);
  assert.equal(category.categories.length, 1);
  assert.equal(category.categoryOptions.length, 3);
  db.close();
});

test('빈 기간은 실패와 구분되는 빈 통계이며 날짜 범위를 한국 시각으로 제한한다', async () => {
  const db = fixture();
  const result = await getBroadcastActivity(binding(db), { ...activityPeriod(7, Date.parse(`${range.from}T00:00:00+09:00`) - 86400000), platform: 'ALL', channel: '', category: '' });
  assert.equal(result.summary.broadcasts, 0);
  assert.equal(result.meta.firstRecordedAt, null);
  assert.deepEqual(result.broadcasts, []);
  assert.equal(validActivityRange('2026-02-30', '2026-03-01'), false);
  assert.equal(validActivityRange('2100-01-01', '2100-01-02'), false);
  assert.equal(validActivityRange(range.to, range.from), false);
  assert.equal(validActivityRange(...Object.values(activityPeriod(90))), true);
  assert.equal(validActivityRange(...Object.values(activityPeriod(91))), false);
  assert.equal(activityChannelKey('CHZZK', `https://chzzk.naver.com/live/${'a'.repeat(32)}`), key);
  assert.equal(activityChannelKey('SOOP', 'https://ch.sooplive.co.kr/test'), 'SOOP:test');
  assert.equal(activityChannelKey('CHZZK', `https://example.com/${'a'.repeat(32)}`), null);
  db.close();
});

test('표시 목록의 200개 제한은 전체 집계 수치를 줄이지 않는다', async () => {
  const db = fixture();
  for (let index = 0; index < 205; index++) {
    db.prepare(`INSERT INTO analytics_broadcast_snapshots SELECT run_id, ?, channel_key, channel_name,
      channel_url, image_url, live_url, title, category_id, category_name, viewers, started_at
      FROM analytics_broadcast_snapshots WHERE run_id = 'CHZZK-0' AND stream_id = '100'`)
      .run(`additional-${index}`);
  }
  const result = await getBroadcastActivity(binding(db), { ...range, platform: 'ALL', channel: '', category: '' });
  assert.equal(result.summary.broadcasts, 207);
  assert.equal(result.broadcasts.length, 200);
  assert.ok(Math.abs(result.summary.minutes - 50) < 0.001);
  db.close();
});

test('시간대 선택은 실제 관측 및 시작 시각으로 방송 이력을 좁힌다', async () => {
  const db = fixture();
  const filters = { ...range, platform: 'ALL', channel: '', category: '' };
  const weekday = new Date(`${range.to}T00:00:00Z`).getUTCDay();
  const activity = await getActivityBroadcastPage(binding(db), filters, { day: '', weekday, hour: 1, timeMetric: 'activity' });
  assert.equal(activity.total, 1);
  assert.equal(activity.items[0].channelKey, key);
  const starts = await getActivityBroadcastPage(binding(db), filters, { day: '', weekday, hour: 1, timeMetric: 'starts' });
  assert.equal(starts.total, 0);
  const firstStarts = await getActivityBroadcastPage(binding(db), filters, { day: '', weekday, hour: 0, timeMetric: 'starts' });
  assert.equal(firstStarts.total, 1);
  const empty = await getActivityBroadcastPage(binding(db), filters, { day: range.from, weekday: null, hour: null, timeMetric: 'activity' });
  assert.equal(empty.total, 0);
  assert.equal(readActivityCursor('{broken'), null);
  db.close();
});

test('페이지 조회는 같은 시각의 200개 이상 기록을 누락·중복 없이 제공한다', async () => {
  const db = fixture();
  for (let index = 0; index < 205; index++) {
    db.prepare(`INSERT INTO analytics_broadcast_snapshots SELECT run_id, ?, channel_key, channel_name,
      channel_url, image_url, live_url, title, category_id, category_name, viewers, started_at
      FROM analytics_broadcast_snapshots WHERE run_id = 'CHZZK-0' AND stream_id = '100'`).run(`additional-${index}`);
  }
  const filters = { ...range, platform: 'ALL', channel: '', category: '' };
  const selection = { day: '', weekday: null, hour: null, timeMetric: 'activity' };
  // 요약에서 재사용한 첫 페이지도 같은 순서·커서로 다음 페이지와 이어진다.
  const data = await getBroadcastActivity(binding(db), filters);
  const initial = initialActivityBroadcastPage(data, selection);
  assert.deepEqual(initial, await getActivityBroadcastPage(binding(db), filters, selection, '', data.meta.generatedAt));
  assert.equal(initialActivityBroadcastPage(data, { ...selection, day: range.to }), null);
  assert.equal(initialActivityBroadcastPage(data, { ...selection, weekday: 0, hour: 0 }), null);
  const ids = initial.items.map((item) => `${item.platform}:${item.streamId}`);
  let cursor = initial.nextCursor, asOf = initial.asOf;
  do {
    const page = await getActivityBroadcastPage(binding(db), filters, selection, cursor, asOf);
    assert.equal(page.total, 207);
    ids.push(...page.items.map((item) => `${item.platform}:${item.streamId}`));
    cursor = page.nextCursor; asOf = page.asOf;
  } while (cursor);
  assert.equal(ids.length, 207);
  assert.equal(new Set(ids).size, 207);
  db.close();
});

test('한국 시각 자정을 넘는 기록 시간은 날짜별로 나눈다', async () => {
  const db = fixture();
  const before = new Date(`${range.to}T00:00:00+09:00`).getTime();
  const at = (delta) => new Date(before + delta * 60000).toISOString();
  for (const [index, delta] of [-5, 5].entries()) {
    db.prepare(`INSERT INTO analytics_broadcast_runs VALUES (?, 'CHZZK', ?, ?, ?, ?, ?, 'available', 'test', 1, 0, 0, NULL)`)
      .run(`midnight-${index}`, at(delta), at(delta), at(delta), at(delta), `midnight-${index}`);
    db.prepare(`INSERT INTO analytics_broadcast_snapshots SELECT ?, 'midnight', channel_key, channel_name,
      channel_url, image_url, live_url, title, category_id, category_name, viewers, started_at
      FROM analytics_broadcast_snapshots WHERE run_id = 'CHZZK-0' AND stream_id = '100'`).run(`midnight-${index}`);
  }
  const result = await getBroadcastActivity(binding(db), { ...range, platform: 'CHZZK', channel: key, category: '' });
  const yesterday = new Date(before - 86400000 + 9 * 3600000).toISOString().slice(0, 10);
  assert.ok(Math.abs(result.daily.find((day) => day.date === yesterday).minutes - 5) < 0.001);
  assert.ok(Math.abs(result.daily.find((day) => day.date === range.to).minutes - 35) < 0.001);
  db.close();
});

test('전체 플랫폼 평균에서 누락된 플랫폼·부분 수집을 0으로 처리하지 않는다', async () => {
  const db = fixture();
  db.prepare("DELETE FROM analytics_broadcast_runs WHERE run_id = 'SOOP-5'").run();
  db.prepare("UPDATE analytics_broadcast_runs SET state = 'partial' WHERE run_id = 'SOOP-3'").run();
  const result = await getBroadcastActivity(binding(db), { ...range, platform: 'ALL', channel: '', category: '' });
  assert.equal(result.heatmap.find((cell) => cell.hour === 2), undefined);
  assert.equal(result.heatmap.find((cell) => cell.hour === 1).runs, 1);
  assert.equal(result.meta.partialRuns, 1);
  db.close();
});

test('카테고리 미제공 기록은 방송을 보존하고 분류 수에서 제외한다', async () => {
  const db = fixture();
  db.prepare("UPDATE analytics_broadcast_snapshots SET category_id = 'unknown', category_name = '카테고리 미제공'").run();
  const result = await getBroadcastActivity(binding(db), { ...range, platform: 'ALL', channel: '', category: '' });
  assert.equal(result.summary.categoryCount, 0);
  assert.equal(result.summary.broadcasts, 2);
  assert.ok(result.categories.every((category) => category.name === '미분류'));
  db.close();
});

module.exports = { fixture, binding, getBroadcastActivity, getActivityBroadcastPage, range, key };
