const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('../node_modules/esbuild');

async function loadModule(entry, name) {
  const outfile = path.resolve(__dirname, '../../.cache/statistics-tests', `${name}.cjs`);
  await esbuild.build({ entryPoints: [path.resolve(__dirname, entry)], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' });
  return require(outfile);
}

async function main() {
  const { calculateWeeklyAuditDateRange, isDebutInAuditRange } = await loadModule(
    '../src/services/weeklyAuditRangeService.ts',
    'weekly-audit'
  );

  // 1. 월요일 (2026-10-05 KST 07:00 -> 2026-10-04T22:00:00Z)
  // 검사 범위: 이번 주 전체 (월 ~ 일, 2026-10-05 ~ 2026-10-11)
  const mondayUtc = new Date('2026-10-04T22:00:00Z');
  const mondayRange = calculateWeeklyAuditDateRange(mondayUtc);
  assert.equal(mondayRange.dayOfWeek, 1);
  assert.equal(mondayRange.startDate, '2026-10-05');
  assert.equal(mondayRange.endDate, '2026-10-11');
  assert.equal(mondayRange.dayName, '월요일');

  // 2. 화요일 (2026-10-06 KST 07:00 -> 2026-10-05T22:00:00Z)
  // 검사 범위: 화 ~ 일 (2026-10-06 ~ 2026-10-11)
  const tuesdayUtc = new Date('2026-10-05T22:00:00Z');
  const tuesdayRange = calculateWeeklyAuditDateRange(tuesdayUtc);
  assert.equal(tuesdayRange.dayOfWeek, 2);
  assert.equal(tuesdayRange.startDate, '2026-10-06');
  assert.equal(tuesdayRange.endDate, '2026-10-11');

  // 3. 수요일 (2026-10-07 KST 07:00 -> 2026-10-06T22:00:00Z)
  // 검사 범위: 수 ~ 일 (2026-10-07 ~ 2026-10-11)
  const wednesdayUtc = new Date('2026-10-06T22:00:00Z');
  const wednesdayRange = calculateWeeklyAuditDateRange(wednesdayUtc);
  assert.equal(wednesdayRange.dayOfWeek, 3);
  assert.equal(wednesdayRange.startDate, '2026-10-07');
  assert.equal(wednesdayRange.endDate, '2026-10-11');

  // 4. 목요일 (2026-10-08 KST 07:00 -> 2026-10-07T22:00:00Z)
  // 검사 범위: 목 ~ 일 (2026-10-08 ~ 2026-10-11)
  const thursdayUtc = new Date('2026-10-07T22:00:00Z');
  const thursdayRange = calculateWeeklyAuditDateRange(thursdayUtc);
  assert.equal(thursdayRange.dayOfWeek, 4);
  assert.equal(thursdayRange.startDate, '2026-10-08');
  assert.equal(thursdayRange.endDate, '2026-10-11');

  // 5. 금요일 (2026-10-09 KST 07:00 -> 2026-10-08T22:00:00Z)
  // 검사 범위: 금 ~ 일 (2026-10-09 ~ 2026-10-11)
  const fridayUtc = new Date('2026-10-08T22:00:00Z');
  const fridayRange = calculateWeeklyAuditDateRange(fridayUtc);
  assert.equal(fridayRange.dayOfWeek, 5);
  assert.equal(fridayRange.startDate, '2026-10-09');
  assert.equal(fridayRange.endDate, '2026-10-11');

  // 6. 토요일 (2026-10-10 KST 07:00 -> 2026-10-09T22:00:00Z)
  // 검사 범위: 토 ~ 일 (2026-10-10 ~ 2026-10-11)
  const saturdayUtc = new Date('2026-10-09T22:00:00Z');
  const saturdayRange = calculateWeeklyAuditDateRange(saturdayUtc);
  assert.equal(saturdayRange.dayOfWeek, 6);
  assert.equal(saturdayRange.startDate, '2026-10-10');
  assert.equal(saturdayRange.endDate, '2026-10-11');

  // 7. 일요일 (2026-10-11 KST 07:00 -> 2026-10-10T22:00:00Z)
  // 검사 범위: 차주 데뷔 전체 검사 (다음 주 월 ~ 다음 주 일, 2026-10-12 ~ 2026-10-18)
  const sundayUtc = new Date('2026-10-10T22:00:00Z');
  const sundayRange = calculateWeeklyAuditDateRange(sundayUtc);
  assert.equal(sundayRange.dayOfWeek, 0);
  assert.equal(sundayRange.startDate, '2026-10-12');
  assert.equal(sundayRange.endDate, '2026-10-18');
  assert.equal(sundayRange.dayName, '일요일');

  // 8. 날짜 범위 포함 여부 검증 (isDebutInAuditRange)
  assert.equal(isDebutInAuditRange('2026-10-05', mondayRange), true);
  assert.equal(isDebutInAuditRange('2026-10-11', mondayRange), true);
  assert.equal(isDebutInAuditRange('2026-10-12', mondayRange), false);
  assert.equal(isDebutInAuditRange('2026-10-04', mondayRange), false);

  assert.equal(isDebutInAuditRange('2026-10-11', sundayRange), false);
  assert.equal(isDebutInAuditRange('2026-10-12', sundayRange), true);
  assert.equal(isDebutInAuditRange('2026-10-18', sundayRange), true);
  assert.equal(isDebutInAuditRange('2026-10-19', sundayRange), false);

  console.log('✅ All weeklyAuditRangeService tests passed successfully!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
