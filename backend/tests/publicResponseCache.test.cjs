const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');
const path = require('node:path');
const esbuild = require('../../frontend/node_modules/esbuild');
const source = path.resolve(__dirname, '../src/services/publicResponseCache.ts');
const loaded = new Module(source, module);
loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
const { publicResponseCache } = loaded.exports;

// 실제 캐시와 같은 응답 복제 방식으로 공개 데이터의 적중·갱신·격리를 확인한다.
test('공개 GET 캐시는 같은 조건만 재사용하고 강제 갱신·비공개·실패를 구분한다', async () => {
  const original = global.caches;
  const stored = new Map();
  const pending = [];
  let loads = 0;
  global.caches = { default: {
    async match(key) { return stored.get(key.url)?.clone(); },
    async put(key, response) { stored.set(key.url, response.clone()); },
  } };
  const key = new URL('https://dev.vdebut.live/public?country=KR');
  const request = new Request(key);
  const waitUntil = promise => pending.push(promise);
  const load = async () => Response.json({ revision: ++loads });
  try {
    const first = await publicResponseCache(request, key, 30, load, waitUntil);
    assert.equal(first.headers.get('X-VD-Cache'), 'MISS');
    assert.equal(first.headers.get('Cache-Control'), 'public, max-age=30');
    assert.deepEqual(await first.json(), { revision: 1 });
    await Promise.all(pending);
    const hit = await publicResponseCache(request, key, 30, load, waitUntil);
    assert.equal(hit.headers.get('X-VD-Cache'), 'HIT');
    assert.match(hit.headers.get('Cache-Control'), /^public, max-age=(29|30)$/);
    assert.deepEqual(await hit.json(), { revision: 1 });
    assert.equal(loads, 1);
    const other = new URL('https://dev.vdebut.live/public?country=JP');
    assert.equal((await publicResponseCache(new Request(other), other, 30, load, waitUntil)).headers.get('X-VD-Cache'), 'MISS');
    const refreshed = await publicResponseCache(new Request(key, { headers: { 'Cache-Control': 'no-cache' } }), key, 30, load, waitUntil);
    assert.equal(refreshed.headers.get('X-VD-Cache'), 'REFRESH');
    assert.equal((await refreshed.json()).revision, 3);
    await Promise.all(pending);
    const writes = stored.size;
    const expired = new URL('https://dev.vdebut.live/expired');
    stored.set(expired.href, new Response('old', { headers: { 'X-VD-Cache-Until': String(Date.now() - 1000), 'Cache-Control': 'public, max-age=14400' } }));
    assert.equal((await publicResponseCache(new Request(expired), expired, 30, load, waitUntil)).headers.get('X-VD-Cache'), 'MISS');
    await Promise.all(pending);
    for (const response of [new Response('error', { status: 503 }), new Response('private', { headers: { 'Cache-Control': 'private' } }), new Response('private', { headers: { 'Cache-Control': 'no-store' } }), new Response('session', { headers: { 'Set-Cookie': 'session=private' } })]) {
      const unique = new URL(`https://dev.vdebut.live/private?case=${pending.length}`);
      const result = await publicResponseCache(new Request(unique), unique, 30, async () => response, waitUntil);
      assert.equal(result.headers.has('X-VD-Cache'), false);
    }
    for (const options of [{ method: 'POST' }, { headers: { Authorization: 'Bearer private' } }]) {
      const result = await publicResponseCache(new Request(key, options), key, 30, load, waitUntil);
      assert.equal(result.headers.has('X-VD-Cache'), false);
    }
    assert.equal(stored.size, writes + 1);
    global.caches.default.match = async () => { throw new Error('cache unavailable'); };
    global.caches.default.put = async () => { throw new Error('cache unavailable'); };
    assert.equal((await publicResponseCache(request, key, 30, load, waitUntil)).status, 200);
    await Promise.all(pending);
  } finally { global.caches = original; }
});
