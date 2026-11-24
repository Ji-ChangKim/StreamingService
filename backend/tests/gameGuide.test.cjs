// 게임 페이지 신입 가이드(기획문서 42번): 방송 1개당 시청자, 덜 붐비는 시간, 검색 허용 기준, 결론 문장.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');
const root = path.resolve(__dirname, '../..');
function load(file) {
  const bundle = esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
  const loaded = new Module(file, module); loaded._compile(bundle.outputFiles[0].text, file); return loaded.exports;
}
const board = load(path.join(root, 'backend/src/services/analyticsBoardService.ts'));
const text = load(path.join(root, 'shared/gameGuideText.ts'));

// 2026-11-02(월)부터 4주, 매시 정각 회차. 평일 14~16시는 시청자 많고 방송 적음, 21~23시는 둘 다 많음.
function fixture() {
  const start = Date.parse('2026-11-01T15:00:00Z'); // 한국 시간 11/2(월) 0시
  const slots = [], rows = [];
  for (let i = 0; i < 28 * 24; i += 1) {
    const at = new Date(start + i * 3600000).toISOString(); slots.push(at);
    const kst = new Date(Date.parse(at) + 9 * 3600000); const h = kst.getUTCHours(); const weekday = (kst.getUTCDay() + 6) % 7;
    const n = h >= 2 && h <= 9 ? 1 : h >= 14 && h <= 16 && weekday < 5 ? 4 : h >= 21 ? 12 : 6;
    const per = h >= 14 && h <= 16 && weekday < 5 ? 1800 : h >= 21 ? 900 : 700;
    for (let k = 0; k < n; k += 1) rows.push({ platform: 'CHZZK', channel_key: `CHZZK:${String(k).padStart(32, '0')}`, channel_name: 'c', image_url: null, live_url: null, category_name: '리그 오브 레전드', viewers: per, scheduled_at: at });
  }
  return { slots, rows, now: start + 28 * 24 * 3600000 - 1 };
}

test('방송 1개당 시청자: 방송 3개 미만 칸은 비우고, 덜 붐비는 3시간 구간을 겹치지 않게 고른다', () => {
  const { slots, rows, now } = fixture();
  const g = board.gameGuideFrom(rows, slots, now);
  assert.equal(g.heat.per[0][4], null); // 월 4시: 방송 1개 → 비움
  assert.equal(g.heat.per[1][14], 1800); // 화 14시
  assert.equal(g.best.length, 3);
  assert.ok(g.best.every((b) => b.day < 5 && b.start === 14 && b.per === 1800));
  assert.equal(new Set(g.best.map((b) => b.day)).size, 3); // 같은 요일 겹침 없음
  assert.equal(g.busiest.hour >= 21, true); // 시청자 합이 가장 큰 때는 밤
  assert.equal(g.trend.length, 28);
  assert.equal(g.recordDays, 28);
  assert.ok(board.isGameIndexable(g));
  assert.equal(board.isGameIndexable({ recordDays: 19, dailyChannels: 10 }), false);
  assert.equal(board.isGameIndexable({ recordDays: 28, dailyChannels: 2.9 }), false);
});

test('결론 문장: 평일 같은 시간이면 "평일 오후 2~5시"로 묶고, 가장 붐비는 때와 대비한다', () => {
  const { slots, rows, now } = fixture();
  const g = board.gameGuideFrom(rows, slots, now);
  assert.equal(text.bestPhrase(g), '평일 오후 2~5시');
  assert.equal(text.gameHeading(g), '신입이라면 평일 오후 2~5시를 노려 보세요');
  assert.match(text.gameLede(g), /^시청자가 가장 많이 몰리는 때는 .요일 밤 \d+시지만 방송도 그만큼 많아요\. 방송 1개당 시청자가 가장 많은 때는 평일 오후 2~5시예요\.$/);
  assert.equal(text.hourRange(21), '밤 9~12시');
  assert.equal(text.slotLabel(1, 14), '화 오후 2~5시');
});

test('큰 방송 하나가 덜 붐비는 시간을 차지하지 않는다(가운데 값)', () => {
  const { slots, rows, now } = fixture();
  // 월 오전 8~10시에 대회 방송 하나(시청자 9만) + 작은 방송 3개(시청자 50)
  const extra = [];
  for (const at of slots) {
    const k = new Date(Date.parse(at) + 9 * 3600000); const h = k.getUTCHours(); const wd = (k.getUTCDay() + 6) % 7;
    if (wd === 0 && h >= 8 && h <= 10) {
      extra.push({ platform: 'CHZZK', channel_key: 'CHZZK:' + 'e'.repeat(32), channel_name: 'e', category_name: '리그 오브 레전드', viewers: 90000, scheduled_at: at });
      for (let j = 0; j < 3; j += 1) extra.push({ platform: 'CHZZK', channel_key: 'CHZZK:' + String(90 + j).padStart(32, '0'), channel_name: 's', category_name: '리그 오브 레전드', viewers: 50, scheduled_at: at });
    }
  }
  const g = board.gameGuideFrom([...rows.filter((r) => { const k = new Date(Date.parse(r.scheduled_at) + 9 * 3600000); return !((k.getUTCDay() + 6) % 7 === 0 && k.getUTCHours() >= 8 && k.getUTCHours() <= 10); }), ...extra], slots, now);
  assert.ok(g.heat.per[0][9] <= 100); // 평균이면 2만 명이 넘지만 가운데 값은 50
  assert.ok(!g.best.some((b) => b.day === 0 && b.start >= 6 && b.start <= 10));
});
