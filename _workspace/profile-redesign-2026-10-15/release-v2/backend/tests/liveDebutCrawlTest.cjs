const path = require('node:path');
const esbuild = require('../node_modules/esbuild');

async function loadModule(entry, name) {
  const outfile = path.resolve(__dirname, '../../.cache/statistics-tests', `${name}.cjs`);
  await esbuild.build({ entryPoints: [path.resolve(__dirname, entry)], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' });
  return require(outfile);
}

async function runTest() {
  const { runDebutCrawlerProcess } = await loadModule(
    '../src/services/debutCrawlerService.ts',
    'debut-crawler-live'
  );
  const { calculateWeeklyAuditDateRange } = await loadModule(
    '../src/services/weeklyAuditRangeService.ts',
    'weekly-audit-live'
  );

  console.log('====================================================');
  console.log('📡 [수집 테스트] 1. 현재 시점(오늘 금요일) 기준 데뷔 수집 실행');
  console.log('====================================================');

  const now = new Date();
  const currentRange = calculateWeeklyAuditDateRange(now);
  console.log(`현재 시각: ${now.toISOString()}`);
  console.log(`검사 규칙: ${currentRange.description}`);
  console.log(`검사 기간: ${currentRange.startDate} ~ ${currentRange.endDate}`);
  console.log(`검사 대상: 치지직(CHZZK), 숲(SOOP) - KR 기준`);

  // 현재 날짜 기준 수집 실행 (DB 없이 파싱 및 필터링 시뮬레이션)
  const currentResult = await runDebutCrawlerProcess(undefined, 'test@example.com', undefined, now);
  console.log('\n[결과 요약]');
  console.log(`- 전체 파싱 및 필터링된 건수: ${currentResult.totalCrawledCount}건`);
  console.log(`- 검사 대상 크리에이터 목록:`);
  if (currentResult.creators.length === 0) {
    console.log('  (해당 기간(금~일)에 예정된 치지직/숲 신규 데뷔 일정이 시트에 없습니다.)');
  } else {
    currentResult.creators.forEach((c, idx) => {
      console.log(`  ${idx + 1}. [${c.platform}] ${c.displayName} | 데뷔: ${c.debutDate} ${c.debutTime} | 채널: ${c.channelUrl} | X: ${c.xUrl || '없음'}`);
    });
  }

  console.log('\n====================================================');
  console.log('📡 [수집 테스트] 2. 요일별 시뮬레이션 테스트 (월요일: 이번주 전체 / 일요일: 차주 전체)');
  console.log('====================================================');

  // 가상의 월요일 (2026-10-05): 이번주 전체 (2026-10-05 ~ 2026-10-11)
  const mondayDate = new Date('2026-10-04T22:00:00Z');
  const mondayResult = await runDebutCrawlerProcess(undefined, 'test@example.com', undefined, mondayDate);
  console.log(`[월요일 시뮬레이션] ${mondayResult.auditRange.description}`);
  console.log(`- 필터링된 대상 건수: ${mondayResult.totalCrawledCount}건`);
  mondayResult.creators.forEach((c, idx) => {
    console.log(`  ${idx + 1}. [${c.platform}] ${c.displayName} | 데뷔: ${c.debutDate} ${c.debutTime} | 채널: ${c.channelUrl}`);
  });

  // 최근 실제 시트에 등록된 최신 치지직/숲 데뷔 샘플 확인
  console.log('\n====================================================');
  console.log('📡 [수집 테스트] 3. 구글 시트 내 최신 치지직/숲 데뷔 데이터 상위 5건 샘플');
  console.log('====================================================');
  
  const sheetCsvUrl = 'https://docs.google.com/spreadsheets/d/1SEcOZAhMqFLUW7bxSsBkWK0UriMD3fD82xXX2HrUf38/export?format=csv&gid=1884409648';
  const resp = await fetch(sheetCsvUrl);
  if (resp.ok) {
    const text = await resp.text();
    const lines = text.split('\n');
    const matched = [];
    for (let i = lines.length - 1; i >= 5; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
      if (parts.length > 5) {
        const dateRaw = parts[1];
        const name = parts[4];
        const url = parts[5];
        if (dateRaw && name && url) {
          const lower = url.toLowerCase();
          if (lower.includes('chzzk') || lower.includes('sooplive') || lower.includes('afreeca')) {
            matched.push({ date: dateRaw, name, url });
            if (matched.length >= 5) break;
          }
        }
      }
    }
    matched.forEach((m, idx) => {
      console.log(`  ${idx + 1}. 날짜: ${m.date} | 이름: ${m.name} | 채널: ${m.url}`);
    });
  }

  console.log('\n✅ 수집 테스트 시뮬레이션이 성공적으로 완료되었습니다.');
}

runTest().catch((err) => {
  console.error('❌ 수집 테스트 에러:', err);
  process.exit(1);
});
