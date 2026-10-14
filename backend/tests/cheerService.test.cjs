const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');
const path = require('node:path');
const esbuild = require('../../frontend/node_modules/esbuild');
const source = path.resolve(__dirname, '../src/services/cheerService.ts');
const loaded = new Module(source, module);
loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
const { kstDateKey, buildClientHash, recordCheer, resolveVtuberId, buildReportRequest, isDuplicateCheerError, CHEER_ALREADY_DONE_MESSAGE } = loaded.exports;

// 응원 집계가 항상 한국 시간 기준 날짜로 나뉘는지 확인한다.
test('응원 기준 날짜는 한국 시간(KST) 자정에 바뀐다', () => {
  assert.equal(kstDateKey(Date.parse('2026-10-14T14:59:59Z')), '2026-10-14');
  assert.equal(kstDateKey(Date.parse('2026-10-14T15:00:00Z')), '2026-10-15');
});

test('기기 식별 값은 같은 입력이면 같고 다르면 달라지며 원문을 포함하지 않는다', async () => {
  const a = await buildClientHash('1.1.1.1', 'UA', 'fp');
  assert.equal(a, await buildClientHash('1.1.1.1', 'UA', 'fp'));
  assert.notEqual(a, await buildClientHash('1.1.1.2', 'UA', 'fp'));
  assert.match(a, /^[0-9a-f]{64}$/);
});

// 고유 인덱스 위반이면 응원을 반영하지 않고 중복으로만 알린다.
test('같은 날 중복 응원은 DUPLICATE로, 다른 오류는 그대로 전달한다', async () => {
  const dbWith = (error) => ({ prepare: () => ({ bind: () => ({}) }), batch: async () => { if (error) throw error; return []; } });
  assert.equal(await recordCheer(dbWith(null), 1, 'h', 'i', '2026-10-14'), 'RECORDED');
  assert.equal(await recordCheer(dbWith(new Error('D1_ERROR: UNIQUE constraint failed: cheer_logs.vtuber_id')), 1, 'h', 'i', '2026-10-14'), 'DUPLICATE');
  await assert.rejects(() => recordCheer(dbWith(new Error('network down')), 1, 'h', 'i', '2026-10-14'), /network down/);
  assert.equal(isDuplicateCheerError('UNIQUE constraint failed'), true);
  assert.equal(CHEER_ALREADY_DONE_MESSAGE, '오늘의 응원을 이미 완료했습니다. 자정에 다시 투표해 주세요!');
});

test('응원 대상은 숫자 id와 공개 주소 모두로 찾고 없으면 null이다', async () => {
  const seen = [];
  const db = { prepare: () => ({ bind: (...args) => { seen.push(args); return { first: async () => (args[1] === 'baku' || args[0] === 5 ? { id: 5 } : null) }; } }) };
  assert.equal(await resolveVtuberId(db, '5'), 5);
  assert.equal(await resolveVtuberId(db, 'baku'), 5);
  assert.equal(await resolveVtuberId(db, 'nobody'), null);
  assert.deepEqual(seen[1], [-1, 'baku']);
});

// 제보는 로그인 없이 받되 항상 검토 대기(DEBUT) 신청으로 전달한다.
test('제보 요청은 DEBUT 신청으로 변환하고 신청자 구분이 없으면 팬으로 처리한다', async () => {
  const source = new Request('https://dev.vdebut.live/api/schedules/report', { method: 'POST', headers: { 'CF-Connecting-IP': '9.9.9.9', Origin: 'https://dev.vdebut.live' } });
  const forwarded = buildReportRequest(source, 'https://dev.vdebut.live', { displayName: '신입', kind: 'PROFILE', requesterRole: 'HACK' });
  assert.equal(new URL(forwarded.url).pathname, '/requests');
  assert.equal(forwarded.headers.get('CF-Connecting-IP'), '9.9.9.9');
  const body = await forwarded.json();
  assert.equal(body.kind, 'DEBUT');
  assert.equal(body.requesterRole, 'FAN');
  assert.equal((await buildReportRequest(source, 'https://dev.vdebut.live', { requesterRole: 'SELF' }).json()).requesterRole, 'SELF');
});
