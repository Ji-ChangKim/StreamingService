const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// 응답 유실 뒤 새 화면에서도 같은 제출 키를 보내고 원문을 브라우저 저장소에 남기지 않는다.
test('등록 응답 유실·새로고침 재시도에 같은 키를 사용하고 변경된 내용에는 새 키를 쓴다', async () => {
  const source = path.resolve(__dirname, '../src/portal/registrationSubmission.ts');
  const loaded = new Module(source, module);
  loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
  const { registrationSubmission } = loaded.exports;
  const original = global.fetch;
  const storage = new Map(), calls = [];
  global.sessionStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  let fail = true;
  global.fetch = async (_url, options) => { calls.push(options); if (fail) throw new Error('connection lost'); return Response.json({ id: 'submitted' }); };
  try {
    const body = { kind: 'DEBUT', description: '저장하면 안 되는 소개 원문' };
    await assert.rejects(registrationSubmission(body, { current: null }));
    assert.ok(![...storage.values()].join('').includes(body.description));
    fail = false;
    await registrationSubmission(body, { current: null });
    assert.equal(calls[0].headers['X-Submission-Key'], calls[1].headers['X-Submission-Key']);
    assert.equal(storage.size, 0);
    fail = true;
    await assert.rejects(registrationSubmission(body, { current: null }));
    await assert.rejects(registrationSubmission({ ...body, description: '변경' }, { current: null }));
    assert.notEqual(calls[2].headers['X-Submission-Key'], calls[3].headers['X-Submission-Key']);
  } finally { global.fetch = original; delete global.sessionStorage; }
});
