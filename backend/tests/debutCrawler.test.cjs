const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('../node_modules/esbuild');

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

  // 필터링 결과의 모든 스트리머는 CHZZK 또는 SOOP 이어야 하고, 날짜가 2026-10-07 ~ 2026-10-11 사이여야 함
  for (const c of result.creators) {
    assert.ok(c.platform === 'CHZZK' || c.platform === 'SOOP', `Platform should be CHZZK or SOOP but got ${c.platform}`);
    assert.ok(c.debutDate >= result.auditRange.startDate && c.debutDate <= result.auditRange.endDate, `Date ${c.debutDate} out of range`);
  }

  console.log(`[Test] Wednesday filter verified! Found ${result.totalCrawledCount} targets matching criteria.`);

  // 일요일 기준 테스트 (차주 전체 검사: 2026-10-12 ~ 2026-10-18)
  console.log('[Test] Testing runDebutCrawlerProcess with Sunday (차주 전체 검사)...');
  const sunday = new Date('2026-10-10T22:00:00Z');
  const sunResult = await runDebutCrawlerProcess(undefined, 'test@example.com', undefined, sunday);

  assert.equal(sunResult.success, true);
  assert.equal(sunResult.auditRange.dayOfWeek, 0);
  assert.equal(sunResult.auditRange.startDate, '2026-10-12');
  assert.equal(sunResult.auditRange.endDate, '2026-10-18');

  for (const c of sunResult.creators) {
    assert.ok(c.platform === 'CHZZK' || c.platform === 'SOOP');
    assert.ok(c.debutDate >= sunResult.auditRange.startDate && c.debutDate <= sunResult.auditRange.endDate);
  }

  console.log(`[Test] Sunday filter verified! Found ${sunResult.totalCrawledCount} targets matching next week criteria.`);
  console.log('✅ Debut crawler filtering tests passed successfully!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
