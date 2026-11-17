// 등록 버튜버 직접 기록: 대상 고르기·차례 돌기·방송 중만 저장·상위 100 중복 제외·채널 통계에 합치기.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

const root = path.resolve(__dirname, '../..');
function loadTypeScript(file) {
  const bundle = esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
  const loaded = new Module(file, module);
  loaded._compile(bundle.outputFiles[0].text, file);
  return loaded.exports;
}
const tracked = loadTypeScript(path.join(root, 'backend/src/services/trackedChannelCollection.ts'));
const board = loadTypeScript(path.join(root, 'backend/src/services/analyticsBoardService.ts'));

function binding(db) {
  const statement = (sql, values) => ({
    async all() { return { results: db.prepare(sql).all(...values) }; },
    async first() { return db.prepare(sql).get(...values) || null; },
    async run() { db.prepare(sql).run(...values); return {}; },
  });
  return { prepare(sql) { return { ...statement(sql, []), bind(...values) { return statement(sql, values); } }; }, async batch(list) { for (const s of list) await s.run(); } };
}

const A = 'a'.repeat(32), B = 'b'.repeat(32), C = 'c'.repeat(32);
function fixture({ samples = true } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(root, 'backend/migrations/0030_broadcast_statistics_collection.sql'), 'utf8'));
  if (samples) db.exec(fs.readFileSync(path.join(root, 'backend/migrations/0065_channel_samples.sql'), 'utf8'));
  db.exec(`CREATE TABLE streamerChannel (id INTEGER, platform TEXT, channel_name TEXT, channel_url TEXT);
    CREATE TABLE streamerChannel_info (channel_id INTEGER, slug TEXT, display_name TEXT, description TEXT, debut_time TEXT, agency_name TEXT, profile_image_url TEXT);
    CREATE TABLE portal_profile_channels (channel_key TEXT PRIMARY KEY, slug TEXT);
    INSERT INTO streamerChannel VALUES (1,'CHZZK','에이','https://chzzk.naver.com/${A}'), (2,'CHZZK','비','https://chzzk.naver.com/${B}'), (3,'CHZZK','자동','https://chzzk.naver.com/${C}');
    INSERT INTO streamerChannel_info VALUES (1,'a','에이','노래하는 버튜버','20:00','',''), (2,'b','비','게임 버튜버','19:00','',''), (3,'c','자동','자동 스트리머의 채널입니다.','00:00','','');`);
  return db;
}
const liveDetail = (id, viewers) => ({ code: 200, content: { status: 'OPEN', liveId: 900 + id.charCodeAt(0), liveTitle: '노래 방송', concurrentUserCount: viewers, liveCategoryValue: '음악/노래', openDate: '2026-11-17 20:00:00', tags: ['노래', '버튜버'], channel: { channelName: id[0] } } });

test('대상은 공개 등록 버튜버만(자동 등록 채널 제외), 5분마다 다음 묶음으로 넘어간다', async () => {
  const db = binding(fixture());
  const targets = await tracked.readTrackTargets(db);
  assert.deepEqual(targets, [`CHZZK:${A}`, `CHZZK:${B}`]);
  const keys = Array.from({ length: 100 }, (_, i) => `CHZZK:${String(i).padStart(32, '0')}`);
  const first = tracked.trackBatch(keys, 0, 45), second = tracked.trackBatch(keys, 5 * 60000, 45);
  assert.equal(first.length, 45); assert.notEqual(first[0], second[0]);
  assert.equal(new Set([...first, ...second, ...tracked.trackBatch(keys, 10 * 60000, 45)]).size, 100); // 세 번이면 전부 돈다
});

test('방송 중인 채널만 저장하고, 이번 회차 상위 100에 있는 채널은 확인하지 않는다', async () => {
  const raw = fixture(); const db = binding(raw);
  raw.exec(`INSERT INTO analytics_broadcast_runs (run_id, platform, scheduled_at, started_at, attempt_id, state, scope) VALUES ('r1','CHZZK','2026-11-17T11:00:00.000Z','2026-11-17T11:00:00.000Z','x','available','test');
    INSERT INTO analytics_broadcast_snapshots (run_id, stream_id, channel_key, channel_name, title, category_id, category_name, viewers) VALUES ('r1','s','CHZZK:${B}','비','게임','g','게임',500);`);
  const called = [];
  const fetcher = async (url) => { called.push(url); return url.includes(A) ? liveDetail('a', 120) : { code: 200, content: { status: 'CLOSE' } }; };
  tracked.resetChannelSamplesCheck();
  const report = await tracked.collectTrackedChannels(db, Date.parse('2026-11-17T11:02:00Z'), fetcher);
  assert.equal(report.checked, 1); assert.equal(report.live, 1);
  assert.deepEqual(report.chzzkTargets, [`CHZZK:${A}`, `CHZZK:${B}`]); // 팔로워 확인 대상은 상위 100 채널도 포함
  assert.equal(called.length, 1); assert.match(called[0], new RegExp(A));
  const rows = raw.prepare('SELECT channel_key, viewers, started_at, tags FROM analytics_channel_samples').all();
  assert.equal(rows.length, 1); assert.equal(rows[0].viewers, 120); assert.equal(rows[0].started_at, '2026-11-17T11:00:00.000Z');
  assert.deepEqual(JSON.parse(rows[0].tags), ['노래', '버튜버']);
});

test('표(0065)가 없으면 외부 호출 없이 건너뛴다', async () => {
  const db = binding(fixture({ samples: false }));
  let calls = 0;
  tracked.resetChannelSamplesCheck();
  const report = await tracked.collectTrackedChannels(db, Date.now(), async () => { calls += 1; return {}; });
  assert.equal(report.skipped, 'table-missing'); assert.equal(calls, 0);
});

test('채널 통계는 직접 기록을 합쳐 방송 시간·시청자를 계산하고, 같은 방송을 10분 안에 겹쳐 세지 않는다', () => {
  const snap = [{ scheduled_at: '2026-11-17T12:00:00.000Z', stream_id: 's1', channel_name: '에이', image_url: null, live_url: null, title: 't', category_name: '음악/노래', viewers: 300 }];
  const samples = [
    { scheduled_at: '2026-11-17T12:02:00.000Z', stream_id: 's1', channel_name: '에이', image_url: null, live_url: null, title: 't', category_name: '음악/노래', viewers: 310 }, // 회차와 2분 차이 → 버림
    { scheduled_at: '2026-11-18T11:02:00.000Z', stream_id: 's2', channel_name: '에이', image_url: null, live_url: null, title: 't', category_name: '토크', viewers: 80 },
    { scheduled_at: '2026-11-18T11:32:00.000Z', stream_id: 's2', channel_name: '에이', image_url: null, live_url: null, title: 't', category_name: '토크', viewers: 100 },
  ];
  const merged = board.mergeChannelRows(snap, samples);
  assert.equal(merged.length, 3);
  assert.deepEqual(merged.map((row) => row.weight), [10, 30, 20]); // 회차 10분, 다음 확인까지 30분, 마지막은 기본 20분
  assert.ok(merged.every((row) => row.vp));
});

const rollup = loadTypeScript(path.join(root, 'backend/src/services/channelRollup.ts'));

test('하루 요약: 등록 채널만, 회차 기록과 직접 기록을 합쳐 만들고, 다시 만들어도 숫자가 두 번 더해지지 않는다', async () => {
  const raw = fixture();
  raw.exec(fs.readFileSync(path.join(root, 'backend/migrations/0066_channel_rollups.sql'), 'utf8'));
  // 11/17(한국) 20:00~21:00 상위 100 정각 회차에 에이(A), 다른 채널(Z)은 등록되지 않음
  raw.exec(`INSERT INTO analytics_broadcast_runs (run_id, platform, scheduled_at, started_at, attempt_id, state, scope) VALUES
      ('r20','CHZZK','2026-11-17T11:00:00.000Z','2026-11-17T11:00:00.000Z','x','available','t'),('r21','CHZZK','2026-11-17T12:00:00.000Z','2026-11-17T12:00:00.000Z','y','available','t');
    INSERT INTO analytics_broadcast_snapshots (run_id, stream_id, channel_key, channel_name, title, category_id, category_name, viewers) VALUES
      ('r20','s1','CHZZK:${A}','에이','노래','m','음악/노래',300),('r21','s1','CHZZK:${A}','에이','노래','m','음악/노래',500),
      ('r20','z1','CHZZK:${'f'.repeat(32)}','남','게임','g','게임',9000);
    INSERT INTO analytics_channel_samples (channel_key, sampled_at, platform, stream_id, channel_name, title, category_name, viewers) VALUES
      ('CHZZK:${B}','2026-11-17T13:02:00.000Z','CHZZK','b1','비','게임','게임',90),('CHZZK:${B}','2026-11-17T13:32:00.000Z','CHZZK','b1','비','게임','게임',110);`);
  const db = binding(raw);
  rollup.resetRollupsCheck();
  const first = await rollup.buildDailyRollup(db, '2026-11-17');
  const again = await rollup.buildDailyRollup(db, '2026-11-17');
  assert.deepEqual(first, again);
  assert.equal(first.channels, 2); // 등록 안 된 채널 Z는 빠짐
  const streams = raw.prepare('SELECT channel_key, stream_id, minutes, viewer_points, viewer_sum, viewer_peak, top_category FROM analytics_channel_streams ORDER BY channel_key').all();
  assert.equal(streams.length, 2);
  const a = streams.find((s) => s.stream_id === 's1');
  assert.equal(a.minutes, 20); assert.equal(a.viewer_points, 2); assert.equal(a.viewer_sum, 800); assert.equal(a.viewer_peak, 500); assert.equal(a.top_category, '음악/노래');
  const b = streams.find((s) => s.stream_id === 'b1');
  assert.equal(b.minutes, 50); assert.equal(b.viewer_sum, 200);
  const daily = raw.prepare(`SELECT minutes, hours FROM analytics_channel_daily WHERE channel_key = 'CHZZK:${A}'`).get();
  assert.equal(daily.minutes, 20); assert.equal(JSON.parse(daily.hours)[20], 10); // 한국 시간 20시
});

test('팔로워 수: 오늘 확인 안 한 치지직 채널만 몇 곳씩 확인하고, 요약을 다시 만들어도 지워지지 않는다', async () => {
  const raw = fixture();
  raw.exec(fs.readFileSync(path.join(root, 'backend/migrations/0066_channel_rollups.sql'), 'utf8'));
  const db = binding(raw);
  rollup.resetRollupsCheck();
  const now = Date.parse('2026-11-17T05:00:00Z');
  let calls = 0;
  const fetcher = async () => { calls += 1; return { content: { followerCount: 1234 } }; };
  assert.equal(await rollup.recordFollowers(db, [`CHZZK:${A}`, `CHZZK:${B}`], now, fetcher), 2);
  assert.equal(await rollup.recordFollowers(db, [`CHZZK:${A}`, `CHZZK:${B}`], now, fetcher), 0); // 오늘 이미 확인
  assert.equal(calls, 2);
  await rollup.buildDailyRollup(db, '2026-11-17');
  assert.equal(raw.prepare(`SELECT followers FROM analytics_channel_daily WHERE channel_key = 'CHZZK:${A}'`).get().followers, 1234);
});
