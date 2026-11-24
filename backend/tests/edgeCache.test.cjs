// 직전 결과 먼저(stale-while-revalidate)와 장애 시 사본 제공을 확인한다.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

function loadTypeScript(file) {
  const bundle = esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
  const loaded = new Module(file, module);
  loaded._compile(bundle.outputFiles[0].text, file);
  return loaded.exports;
}
const { cachedBoard, putPageCopy, matchPageCopy, BOARD_MAX_STALE_MS } = loadTypeScript(path.resolve(__dirname, '../src/services/edgeCache.ts'));

// Cache API 흉내: 만료(s-maxage)는 무시하고 저장한 응답을 그대로 돌려준다.
function fakeCache() {
  const store = new Map();
  return {
    store,
    async match(request) { const hit = store.get(typeof request === 'string' ? request : request.url); return hit ? hit.clone() : undefined; },
    async put(request, response) { store.set(typeof request === 'string' ? request : request.url, response.clone()); },
  };
}
const SLOT = 600000;
const now = Math.floor(Date.parse('2026-11-17T06:00:00Z') / SLOT) * SLOT + 60000;
const key = () => new URL('https://vdebut.live/api/analytics/board?platform=ALL');
const seconds = () => 600;

test('같은 슬롯은 저장본(HIT), 슬롯이 바뀌면 직전 결과(STALE)를 주고 뒤에서 한 번만 다시 계산한다', async () => {
  const cache = fakeCache(); const waits = []; let loads = 0;
  const load = async () => ({ asOf: `run-${++loads}` });
  const first = await cachedBoard(cache, key(), load, seconds, (p) => waits.push(p), now);
  await Promise.all(waits.splice(0));
  assert.equal(first.state, 'MISS'); assert.equal(loads, 1);
  // 저장본 만료 시각을 지금으로 맞춘 뒤 같은 슬롯 재요청 → 아직 유효하면 HIT
  const again = await cachedBoard(cache, key(), load, seconds, (p) => waits.push(p), now + 1000);
  assert.equal(again.state, 'HIT'); assert.equal(loads, 1);
  // 다음 슬롯: 직전 결과를 바로 주고, 두 요청이 동시에 와도 계산은 한 번
  const next = now + SLOT;
  const [a, b] = [await cachedBoard(cache, key(), load, seconds, (p) => waits.push(p), next), await cachedBoard(cache, key(), load, seconds, (p) => waits.push(p), next)];
  assert.equal(a.state, 'STALE'); assert.equal(a.data.asOf, 'run-1');
  assert.ok(['STALE', 'HIT'].includes(b.state)); // 뒤에서 하던 계산이 먼저 끝나면 두 번째 요청은 새 결과(HIT)를 받는다.
  await Promise.all(waits.splice(0));
  assert.equal(loads, 2);
});

test('직전 결과가 없거나 너무 오래되면 기다려서 계산하고, 계산이 실패하면 오래된 결과라도 준다', async () => {
  const cache = fakeCache(); const waits = [];
  await cachedBoard(cache, key(), async () => ({ asOf: 'old' }), seconds, (p) => waits.push(p), now);
  await Promise.all(waits.splice(0));
  const later = now + BOARD_MAX_STALE_MS + 60000; // 저장 시각 기준으로 오래됨
  const fresh = await cachedBoard(cache, key(), async () => ({ asOf: 'new' }), seconds, (p) => waits.push(p), later);
  assert.equal(fresh.state, 'MISS'); assert.equal(fresh.data.asOf, 'new');
  await Promise.all(waits.splice(0));
  const failed = await cachedBoard(cache, key(), async () => { throw new Error('D1 limit'); }, seconds, (p) => waits.push(p), later + 3 * BOARD_MAX_STALE_MS);
  assert.equal(failed.state, 'STALE'); assert.equal(failed.data.asOf, 'new');
  await assert.rejects(cachedBoard(fakeCache(), key(), async () => { throw new Error('D1 limit'); }, seconds, () => {}, now));
});

test('정상 페이지 사본을 저장해 두고 장애 때 꺼내 준다(브라우저에는 저장 안 함)', async () => {
  const cache = fakeCache(); const waits = [];
  putPageCopy(cache, 'https://vdebut.live/creator/a', new Response('<p>정상</p>', { headers: { 'Content-Type': 'text/html' } }), (p) => waits.push(p));
  await Promise.all(waits);
  const copy = await matchPageCopy(cache, 'https://vdebut.live/creator/a');
  assert.equal(await copy.text(), '<p>정상</p>');
  assert.equal(copy.headers.get('X-VD-Cache'), 'STALE');
  assert.equal(copy.headers.get('Cache-Control'), 'no-store');
  assert.equal(await matchPageCopy(cache, 'https://vdebut.live/creator/b'), undefined);
});
