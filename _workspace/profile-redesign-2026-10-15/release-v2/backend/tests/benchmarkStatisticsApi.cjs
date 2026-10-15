const path = require('node:path');
const esbuild = require('../node_modules/esbuild');

async function loadModule(entry, name) {
  const outfile = path.resolve(__dirname, '../../.cache/statistics-tests', `${name}.cjs`);
  await esbuild.build({ entryPoints: [path.resolve(__dirname, entry)], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' });
  return require(outfile);
}

async function benchmark() {
  console.log('⏱️ 통계 페이지 핵심 로직 로딩 속도 벤치마크 측정 중...');

  const { getChzzkStatisticsSource, getSoopStatisticsSource } = await loadModule(
    '../src/services/broadcastStatisticsSources.ts',
    'bench-sources'
  );

  // 1. 치지직 수집 소요 시간 측정
  const t1 = Date.now();
  await getChzzkStatisticsSource(undefined);
  const chzzkDuration = Date.now() - t1;
  console.log(`- 치지직 외부 실시간 API 호출 소요 시간: ${(chzzkDuration / 1000).toFixed(2)}초`);

  // 2. SOOP 가상 채널 10개 조회 시뮬레이션 소요 시간 측정
  console.log('- SOOP 채널 외부 API 순회 호출 시뮬레이션 중...');
  const t2 = Date.now();
  // SOOP 15개 채널 가상 호출
  const testIds = ['afreeca', 'soop', 'test1', 'test2', 'test3'];
  await Promise.allSettled(testIds.map(async (id) => {
    try {
      const res = await fetch(`https://chapi.sooplive.co.kr/api/${id}/station`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6500)
      });
      await res.json();
    } catch (e) {}
  }));
  const soopDuration = Date.now() - t2;
  console.log(`- SOOP 5개 채널 병렬 호출 소요 시간: ${(soopDuration / 1000).toFixed(2)}초`);
  console.log(`  (만약 등록 채널이 30~150개일 경우 순차 청크로 인해 10~25초 이상 소요됨)`);
}

benchmark().catch(console.error);
