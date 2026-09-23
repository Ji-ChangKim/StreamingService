import type { BroadcastStatistics, StatisticsBroadcast, StatisticsPeak, StatisticsPoint } from '../../../shared/broadcastStatistics';
import { getChzzkStatisticsSource, getSoopStatisticsSource, type StatisticsSourceResult } from './broadcastStatisticsSources';

import { readStatisticsHistory, readStatisticsRuns, getStatisticsCollectionStatus, type StatisticsHistoryRow, type StatisticsHistoryRun } from './broadcastStatisticsHistory';
import { STATISTICS_COLLECTION_MINUTES } from '../../../shared/statisticsCollection';

// 확인된 채널 URL에서만 채널 식별자를 만든다.
function getHistoryChannelId(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== 'chzzk.naver.com') return null;
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[0] === 'live' ? segments[1] : segments[0];
    return id && /^[a-f0-9]{32}$/i.test(id) ? id : null;
  } catch { return null; }
}

// 종료 방송도 기록에 남기되, 확인되지 않은 채널명과 링크는 만들지 않는다.
function historyBroadcast(row: StatisticsHistoryRow, current?: StatisticsBroadcast): StatisticsBroadcast {
  const channelId = getHistoryChannelId(row.channel_url);
  return {
    id: `${row.platform}:${row.external_stream_id}`, platform: row.platform, streamId: row.external_stream_id,
    channelKey: row.channel_key || current?.channelKey || (channelId ? `CHZZK:${channelId}` : null),
    channelName: current?.channelName || row.channel_name,
    channelUrl: row.channel_url || current?.channelUrl || (channelId ? `https://chzzk.naver.com/${channelId}` : null),
    imageUrl: current?.imageUrl || row.profile_image_url,
    liveUrl: current?.liveUrl || row.live_url || null, title: row.title || '제목 없음',
    categoryId: row.source_category_id || 'unknown', categoryName: row.source_category_name || '카테고리 미제공',
    viewers: row.viewer_count, startedAt: row.started_at || current?.startedAt || null,
  };
}

// 동일 수집 시점과 방송 ID의 중복 기록을 제거한다.
function uniqueHistory(rows: StatisticsHistoryRow[]): StatisticsHistoryRow[] {
  const map = new Map<string, StatisticsHistoryRow>();
  for (const row of rows) {
    if (!Number.isFinite(Date.parse(row.collection_started_at))) continue;
    const key = `${row.platform}:${row.external_stream_id}:${row.collection_started_at}`;
    const previous = map.get(key);
    if (!previous || row.viewer_count > previous.viewer_count) map.set(key, row);
  }
  return [...map.values()];
}

// 시간대별 합계는 각 시점에 함께 수집한 방송들로만 계산한다.
function buildPoints(rows: StatisticsHistoryRow[], sources: StatisticsSourceResult[], runs: StatisticsHistoryRun[]): StatisticsPoint[] {
  const samples = new Map<string, StatisticsPoint>();
  for (const row of rows) {
    const key = `${row.platform}:${row.collection_started_at}`;
    const point = samples.get(key) || { platform: row.platform, at: row.collection_started_at, viewers: 0, channels: 0, kind: 'history' as const };
    point.viewers += row.viewer_count;
    point.channels++;
    if (row.partial) point.partial = true;
    samples.set(key, point);
  }
  if (runs.length) {
    samples.clear();
    for (const run of runs) {
      if (!run.observed_at || run.viewer_total === null || run.channel_total === null || !['available', 'partial'].includes(run.state)) continue;
      samples.set(`${run.platform}:${run.observed_at}`, { platform: run.platform, at: run.observed_at, viewers: run.viewer_total, channels: run.channel_total, kind: 'history', partial: run.state === 'partial' });
    }
  }
  for (const { source, lives } of sources) {
    if (!source.observedAt || (source.state !== 'available' && source.state !== 'partial')) continue;
    samples.set(`${source.platform}:current`, {
      platform: source.platform, at: source.observedAt,
      viewers: lives.reduce((sum, live) => sum + live.viewers, 0), channels: lives.length, kind: 'current', partial: source.state === 'partial',
    });
  }
  return [...samples.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

// 방송별 최근 18시간 최고 수치와 해당 방송의 실제 수집 기록을 계산한다.
function buildPeaks(rows: StatisticsHistoryRow[], sources: StatisticsSourceResult[], from: string): StatisticsPeak[] {
  const lives = sources.flatMap((source) => source.lives);
  const current = new Map(lives.map((live) => [live.id, live]));
  const peaks = new Map<string, StatisticsPeak>();
  for (const row of rows) {
    if (Date.parse(row.collection_started_at) < Date.parse(from)) continue;
    const id = `${row.platform}:${row.external_stream_id}`;
    const broadcast = historyBroadcast(row, current.get(id));
    const prior = peaks.get(id);
    const samples = [...(prior?.samples || []), { at: row.collection_started_at, viewers: row.viewer_count }];
    const peak = !prior || row.viewer_count > prior.viewers
      ? { ...broadcast, peakAt: row.collection_started_at, isLive: current.has(id), samples }
      : { ...prior, samples };
    peaks.set(id, peak);
  }
  for (const { source, lives: currentLives } of sources) {
    if (!source.observedAt) continue;
    for (const live of currentLives) {
      const prior = peaks.get(live.id);
      const samples = [...(prior?.samples || []), { at: source.observedAt, viewers: live.viewers }];
      peaks.set(live.id, !prior || live.viewers > prior.viewers
        ? { ...live, peakAt: source.observedAt, isLive: true, samples }
        : { ...prior, isLive: true, samples });
    }
  }
  return [...peaks.values()].sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id));
}

// 실제 수집 결과를 대시보드 응답으로 조립한다.
export function assembleBroadcastStatistics(
  sources: StatisticsSourceResult[], rawRows: StatisticsHistoryRow[],
  historyState: BroadcastStatistics['meta']['historyState'], now = new Date(), runs: StatisticsHistoryRun[] = [],
): BroadcastStatistics {
  const historyFrom = new Date(now.getTime() - 24 * 3600000).toISOString();
  const peakFrom = new Date(now.getTime() - 18 * 3600000).toISOString();
  const rows = uniqueHistory(rawRows).filter((row) => Date.parse(row.collection_started_at) >= Date.parse(historyFrom) && Date.parse(row.collection_started_at) <= now.getTime());
  const peaks = buildPeaks(rows, sources, peakFrom);
  const times = [...rows.map((row) => Date.parse(row.collection_started_at)), ...runs.filter((run) => run.observed_at && ['available', 'partial'].includes(run.state)).map((run) => Date.parse(run.observed_at!))];
  return {
    meta: {
      generatedAt: now.toISOString(), timezone: 'Asia/Seoul', refreshSeconds: 60,
      historyState, lastHistoryAt: times.length ? new Date(Math.max(...times)).toISOString() : null,
      peakFrom, historyFrom, historyScope: '치지직 인기 방송 상위 100개 · SOOP 등록 채널 최대 40개 · 10분 간격', historyIntervalMinutes: STATISTICS_COLLECTION_MINUTES,
      unlinkedPeakChannels: peaks.filter((peak) => !peak.channelKey).length,
    },
    sources: sources.map((source) => source.source),
    lives: sources.flatMap((source) => source.lives).sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id)),
    points: buildPoints(rows, sources, runs), peaks,
  };
}

// 현재 방송과 완료된 10분 수집 기록을 읽는다.
export async function getBroadcastStatistics(db: D1Database): Promise<BroadcastStatistics> {
  const startedAt = new Date();
  const from = new Date(startedAt.getTime() - 24 * 3600000).toISOString();
  const results = await Promise.allSettled([
    getChzzkStatisticsSource(), getSoopStatisticsSource(db), readStatisticsHistory(db, from, startedAt.toISOString()), readStatisticsRuns(db, from, startedAt.toISOString()),
  ] as const);
  const chzzk = results[0].status === 'fulfilled' ? results[0].value : { source: { platform: 'CHZZK' as const, state: 'unavailable' as const, scope: '인기 방송 상위 100개', observedAt: null, checkedChannels: null }, lives: [] };
  const soop = results[1].status === 'fulfilled' ? results[1].value : { source: { platform: 'SOOP' as const, state: 'unavailable' as const, scope: 'VDébut 등록 채널 최대 40개', observedAt: null, checkedChannels: null }, lives: [] };
  const rows = results[2].status === 'fulfilled' ? results[2].value : [];
  if (results[2].status === 'rejected') console.warn('[Statistics] History unavailable', String(results[2].reason));
  const runs = results[3].status === 'fulfilled' ? results[3].value : [];
  const validRuns = runs.filter((run) => run.observed_at && Date.parse(run.observed_at) >= Date.parse(from) && Date.parse(run.observed_at) <= Date.now());
  const failed = results[2].status === 'rejected' || results[3].status === 'rejected';
  const historyState = failed ? 'unavailable' : validRuns.some((run) => run.state === 'available' || run.state === 'partial') ? 'available' : 'empty';
  const response = assembleBroadcastStatistics([chzzk, soop], rows, historyState, new Date(), validRuns);
  try { response.meta.collection = await getStatisticsCollectionStatus(db, new Date(), runs); }
  catch (error) { console.warn('[Statistics] Collection status unavailable', String(error)); }
  return response;
}
