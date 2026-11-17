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
  assert.deepEqual(report, { checked: 1, live: 1 });
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
