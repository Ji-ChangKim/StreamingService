const path = require('node:path');
const esbuild = require('../node_modules/esbuild');

async function loadModule(entry, name) {
  const outfile = path.resolve(__dirname, '../../.cache/statistics-tests', `${name}.cjs`);
  await esbuild.build({ entryPoints: [path.resolve(__dirname, entry)], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' });
  return require(outfile);
}

async function runStatsTest() {
  console.log('====================================================');
  console.log('📊 [통계 수집 테스트] 치지직 실시간 라이브 통계 수집 검증');
  console.log('====================================================');

  const { getChzzkStatisticsSource } = await loadModule(
    '../src/services/broadcastStatisticsSources.ts',
    'stats-sources-live'
  );

  const result = await getChzzkStatisticsSource(undefined);
  console.log(`- 수집 상태: ${result.source.state}`);
  console.log(`- 수집 관측 시각: ${result.source.observedAt}`);
  console.log(`- 수집된 실시간 방송 수: ${result.lives.length}개`);

  const vtuberLives = result.lives.filter(l => l.isVtuber);
  console.log(`- 감지된 버추얼/버튜버 방송 수: ${vtuberLives.length}개`);

  console.log('\n[실시간 상위 버튜버 방송 샘플 (최대 3개)]');
  vtuberLives.slice(0, 3).forEach((l, idx) => {
    console.log(`  ${idx + 1}. [${l.platform}] ${l.channelName} | 시청자: ${l.viewers.toLocaleString()}명 | 카테고리: ${l.categoryName} | 신인여부: ${l.isRookie ? '신인' : '일반'}`);
    console.log(`     제목: ${l.title}`);
  });

  console.log('\n✅ 통계 수집 테스트 검증 완료!');
}

runStatsTest().catch((err) => {
  console.error('❌ 통계 수집 테스트 에러:', err);
  process.exit(1);
});
