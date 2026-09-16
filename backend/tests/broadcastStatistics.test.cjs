const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const esbuild = require('../node_modules/esbuild');

// 시간대와 합계 오류가 사용자 순위를 바꾸지 않는지 실제 집계 함수를 검증한다.
async function loadModule(entry, name) {
  const outfile = path.resolve(__dirname, '../../.cache/statistics-tests', `${name}.cjs`);
  await esbuild.build({ entryPoints: [path.resolve(__dirname, entry)], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' });
  return require(outfile);
}

async function main() {
  const service = await loadModule('../src/services/broadcastStatisticsService.ts', 'service');
  const sources = await loadModule('../src/services/broadcastStatisticsSources.ts', 'sources');
  const model = await loadModule('../../frontend/src/components/analytics/statisticsModel.ts', 'model');
  const now = new Date('2026-09-15T16:00:00Z');
  const channel = 'a'.repeat(32);
  const live = { id: 'CHZZK:1', platform: 'CHZZK', streamId: '1', channelKey: `CHZZK:${channel}`, channelName: '테스트', channelUrl: `https://chzzk.naver.com/${channel}`, imageUrl: null, liveUrl: `https://chzzk.naver.com/live/${channel}`, title: '=검증용 제목', categoryId: 'game', categoryName: '게임', viewers: 90, startedAt: null };
  const source = { source: { platform: 'CHZZK', state: 'available', scope: '인기 방송 상위 100개', observedAt: now.toISOString(), checkedChannels: null }, lives: [live] };
  const row = (id, viewers, at) => ({ platform: 'CHZZK', external_stream_id: id, viewer_count: viewers, title: `방송 ${id}`, source_category_id: 'game', source_category_name: '게임', collection_started_at: at, channel_name: '테스트', channel_url: `https://chzzk.naver.com/${channel}`, profile_image_url: null });
  const rows = [
    row('old', 9999, '2026-09-14T15:59:59Z'),
    row('before18', 8000, '2026-09-14T21:59:59Z'),
    row('edge18', 150, '2026-09-14T22:00:00Z'),
    row('1', 60, '2026-09-15T15:00:00Z'), row('2', 40, '2026-09-15T15:00:00Z'),
    row('1', 30, '2026-09-15T15:30:00Z'), row('2', 80, '2026-09-15T15:30:00Z'),
    row('2', 80, '2026-09-15T15:30:00Z'),
    row('future', 10000, '2026-09-15T17:00:00Z'),
  ];
  const data = service.assembleBroadcastStatistics([source], rows, 'available', now);
  assert.equal(data.peaks.some((peak) => peak.streamId === 'before18'), false);
  assert.equal(data.peaks.some((peak) => peak.streamId === 'edge18'), true);
  assert.equal(data.peaks.some((peak) => peak.streamId === 'future'), false);
  assert.equal(data.points.find((point) => point.at === '2026-09-15T15:30:00Z').viewers, 110);
  assert.equal(data.points.find((point) => point.at === '2026-09-15T15:30:00Z').channels, 2);
  assert.equal(model.dailyPlatformPeak(data, 'CHZZK'), 110);
  assert.equal(model.dailyPlatformPeak(data, 'SOOP'), null);
  assert.equal(data.peaks.find((peak) => peak.streamId === '1').viewers, 90);
  assert.equal(model.getChannelPeaks(data.peaks).length, 1);
  assert.equal(model.getChannelPeaks(data.peaks)[0].viewers, 150);
  assert.equal(sources.deduplicateLiveChannels([live, { ...live, id: 'CHZZK:3', viewers: 120 }]).length, 1);
  assert.equal(sources.deduplicateLiveChannels([live, { ...live, id: 'CHZZK:3', viewers: 120 }])[0].viewers, 120);
  assert.equal(model.safeStatisticsUrl('javascript:alert(1)'), null);
  assert.equal(model.aggregateStatisticsCategories([live, { ...live, platform: 'SOOP' }]).length, 2);
  const unavailable = service.assembleBroadcastStatistics([{ ...source, source: { ...source.source, state: 'unavailable', observedAt: null }, lives: [] }], [], 'unavailable', now);
  assert.equal(unavailable.points.length, 0);
  assert.equal(unavailable.peaks.length, 0);
  assert.equal(unavailable.meta.historyState, 'unavailable');
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({ content: { data: [] } }), { status: 200 });
  assert.equal((await sources.getChzzkStatisticsSource()).source.state, 'available');
  global.fetch = async () => new Response('{}', { status: 200 });
  assert.equal((await sources.getChzzkStatisticsSource()).source.state, 'unavailable');
  const requestedUrls = [];
  global.fetch = async (url) => {
    requestedUrls.push(String(url));
    const offset = requestedUrls.length === 1 ? 0 : 50;
    return new Response(JSON.stringify({ content: { data: Array.from({ length: 50 }, (_, index) => ({ liveId: offset + index, liveTitle: '테스트', concurrentUserCount: 100 - offset - index, channel: { channelId: String(offset + index), channelName: '테스트' } })), page: { next: offset === 0 ? { concurrentUserCount: 51, liveId: 49 } : null } } }));
  };
  assert.equal((await sources.getChzzkStatisticsSource()).lives.length, 100);
  assert.equal(new URL(requestedUrls[1]).searchParams.get('liveId'), '49');
  assert.equal(new URL(requestedUrls[1]).searchParams.get('concurrentUserCount'), '51');
  assert.equal(new URL(requestedUrls[1]).searchParams.has('next'), false);
  global.fetch = originalFetch;
  fs.mkdirSync(path.resolve(__dirname, '../../.cache/statistics-tests'), { recursive: true });
  fs.writeFileSync(path.resolve(__dirname, '../../.cache/statistics-tests/fixture.json'), JSON.stringify(data));
  console.log('PASS: aggregation and pagination — KST midnight, 18-hour boundary, duplicate samples/channels, concurrent totals, unknown data, safe links, platform categories.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
