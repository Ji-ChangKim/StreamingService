const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('../node_modules/esbuild');

// 일정 필터 테스트가 실제 시트를 조회하거나 이메일을 발송하지 않도록 로컬 자료만 제공한다.
const originalFetch = global.fetch;
const fixtureCsv = [
  'test header 1', 'test header 2', 'test header 3', 'test header 4', 'test header 5',
  `0,2026.10.08,20,00,검증용 치지직,https://chzzk.naver.com/${'a'.repeat(32)},`,
  '0,2026.10.14,21,00,검증용 SOOP,https://www.sooplive.co.kr/station/test_channel,',
  '0,2026.10.08,20,00,제외할 유튜브,https://www.youtube.com/@test_channel,',
  '0,2026.07.01,20,00,제외할 오래된 일정,https://www.sooplive.co.kr/station/old_channel,',
].join('\n');
global.fetch = async (input) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname === 'docs.google.com') return new Response(fixtureCsv, { status: 200 });
  if (url.hostname === 'api.resend.com') return new Response(JSON.stringify({ message: '테스트에서는 외부 이메일 발송을 차단합니다.' }), { status: 503 });
  throw new Error(`테스트의 외부 요청을 차단합니다: ${url.hostname}`);
};

async function loadModule(entry, name) {
  const outfile = path.resolve(__dirname, '../../.cache/statistics-tests', `${name}.cjs`);
  await esbuild.build({ entryPoints: [path.resolve(__dirname, entry)], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' });
  return require(outfile);
}

async function main() {
  const { runDebutCrawlerProcess } = await loadModule(
    '../src/services/debutCrawlerService.ts',
    'debut-crawler'
  );

  console.log('[Test] Testing runDebutCrawlerProcess with forced base date (Wednesday: 2026-10-07)...');

  // 가상의 수요일 기준 실행: 수~일 (2026-10-07 ~ 2026-10-11)
  const wednesday = new Date('2026-10-06T22:00:00Z');
  const result = await runDebutCrawlerProcess(undefined, 'test@example.com', undefined, wednesday);

  assert.equal(result.success, true);
  assert.equal(result.auditRange.dayOfWeek, 3);
  assert.equal(result.auditRange.startDate, '2026-10-07');
  assert.equal(result.auditRange.endDate, '2026-10-11');
  assert.deepEqual(result.creators.map((creator) => creator.displayName).sort(), ['검증용 SOOP', '검증용 치지직'].sort());
  assert.equal(result.emailSent, false);

  // 필터링 결과의 모든 스트리머는 CHZZK 또는 SOOP 이어야 하고, YYYY-MM-DD 형식의 유효한 날짜여야 함
  for (const c of result.creators) {
    assert.ok(c.platform === 'CHZZK' || c.platform === 'SOOP', `Platform should be CHZZK or SOOP but got ${c.platform}`);
    assert.match(c.debutDate, /^\d{4}-\d{2}-\d{2}$/, `Date ${c.debutDate} should be valid YYYY-MM-DD`);
  }

  console.log(`[Test] Wednesday filter verified! Found ${result.totalCrawledCount} targets matching criteria.`);
  console.log('Creators sample:', result.creators.slice(0, 5).map(c => ({ name: c.displayName, date: c.debutDate, platform: c.platform })));

  // 일요일 기준 테스트 (차주 전체 검사 및 향후 데뷔)
  console.log('[Test] Testing runDebutCrawlerProcess with Sunday (차주 및 향후 전체 검사)...');
  const sunday = new Date('2026-10-10T22:00:00Z');
  const sunResult = await runDebutCrawlerProcess(undefined, 'test@example.com', undefined, sunday);

  assert.equal(sunResult.success, true);
  assert.equal(sunResult.auditRange.dayOfWeek, 0);
  assert.equal(sunResult.auditRange.startDate, '2026-10-12');
  assert.equal(sunResult.auditRange.endDate, '2026-10-18');
  // 최근 45일 보완 규칙에 따라 직전 주의 치지직 일정도 유지한다.
  assert.deepEqual(sunResult.creators.map((creator) => creator.displayName).sort(), ['검증용 SOOP', '검증용 치지직'].sort());
  assert.equal(sunResult.emailSent, false);

  for (const c of sunResult.creators) {
    assert.ok(c.platform === 'CHZZK' || c.platform === 'SOOP');
    assert.match(c.debutDate, /^\d{4}-\d{2}-\d{2}$/);
  }

  console.log(`[Test] Sunday filter verified! Found ${sunResult.totalCrawledCount} targets matching criteria.`);
  console.log('✅ Debut crawler filtering tests passed successfully!');
}

main().finally(() => { global.fetch = originalFetch; }).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
