import type { BroadcastStatistics, StatisticsBroadcast, StatisticsPeak, StatisticsPoint } from '../../../shared/broadcastStatistics';
import { getChzzkStatisticsSource, getSoopStatisticsSource, type StatisticsSourceResult } from './broadcastStatisticsSources';

export interface StatisticsHistoryRow {
  platform: 'CHZZK';
  external_stream_id: string;
  viewer_count: number;
  title: string | null;
  source_category_id: string | null;
  source_category_name: string | null;
  collection_started_at: string;
  channel_name: string | null;
  channel_url: string | null;
  profile_image_url: string | null;
}

// 기존 기록의 snapshot_at 시간대 오류를 피하고 실제 수집 시작 UTC 시각으로 조회한다.
async function readStatisticsHistory(db: D1Database, from: string, to: string) {
  const result = await db.prepare(`SELECT s.platform, s.external_stream_id, s.viewer_count, s.title,
    s.source_category_id, s.source_category_name, s.collection_started_at, c.channel_name, c.channel_url,
    (SELECT profile_image_url FROM streamerChannel_info WHERE channel_id = c.id LIMIT 1) AS profile_image_url
    FROM analytics_live_snapshots s LEFT JOIN streamerChannel c ON c.id = s.channel_id
    WHERE s.platform = 'CHZZK' AND s.collection_started_at >= ? AND s.collection_started_at <= ?
    AND s.viewer_count IS NOT NULL AND s.viewer_count >= 0
    ORDER BY s.collection_started_at, s.id LIMIT 10001`).bind(from, to).all<StatisticsHistoryRow>();
  if (result.results.length > 10000) throw new Error('History result exceeds safe response size');
  return result.results;
}

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
    id: `CHZZK:${row.external_stream_id}`, platform: 'CHZZK', streamId: row.external_stream_id,
    channelKey: current?.channelKey || (channelId ? `CHZZK:${channelId}` : null),
    channelName: current?.channelName || row.channel_name,
    channelUrl: current?.channelUrl || (channelId ? `https://chzzk.naver.com/${channelId}` : null),
    imageUrl: current?.imageUrl || row.profile_image_url,
    liveUrl: current?.liveUrl || null, title: row.title || '제목 없음',
    categoryId: row.source_category_id || 'unknown', categoryName: row.source_category_name || '카테고리 미제공',
    viewers: row.viewer_count, startedAt: current?.startedAt || null,
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
function buildPoints(rows: StatisticsHistoryRow[], sources: StatisticsSourceResult[]): StatisticsPoint[] {
  const samples = new Map<string, StatisticsPoint>();
  for (const row of rows) {
    const key = `${row.platform}:${row.collection_started_at}`;
    const point = samples.get(key) || { platform: row.platform, at: row.collection_started_at, viewers: 0, channels: 0, kind: 'history' as const };
    point.viewers += row.viewer_count;
    point.channels++;
    samples.set(key, point);
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
    const id = `CHZZK:${row.external_stream_id}`;
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
  historyState: BroadcastStatistics['meta']['historyState'], now = new Date(),
): BroadcastStatistics {
  const historyFrom = new Date(now.getTime() - 24 * 3600000).toISOString();
  const peakFrom = new Date(now.getTime() - 18 * 3600000).toISOString();
  const rows = uniqueHistory(rawRows).filter((row) => Date.parse(row.collection_started_at) >= Date.parse(historyFrom) && Date.parse(row.collection_started_at) <= now.getTime());
  const peaks = buildPeaks(rows, sources, peakFrom);
  const times = rows.map((row) => Date.parse(row.collection_started_at));
  return {
    meta: {
      generatedAt: now.toISOString(), timezone: 'Asia/Seoul', refreshSeconds: 60,
      historyState, lastHistoryAt: times.length ? new Date(Math.max(...times)).toISOString() : null,
      peakFrom, historyFrom, historyScope: '치지직 인기 방송 상위 100개 · 저장된 시점 기준',
      unlinkedPeakChannels: peaks.filter((peak) => !peak.channelKey).length,
    },
    sources: [...sources.map((source) => source.source),
      { platform: 'TWITCH', state: 'unsupported', scope: '통계 연결 준비 중', observedAt: null, checkedChannels: null },
      { platform: 'CHZZM', state: 'unsupported', scope: '통계 연결 준비 중', observedAt: null, checkedChannels: null },
    ],
    lives: sources.flatMap((source) => source.lives).sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id)),
    points: buildPoints(rows, sources), peaks,
  };
}

// DB 변경 없이 현재 방송과 기존 기록을 읽는다.
export async function getBroadcastStatistics(db: D1Database): Promise<BroadcastStatistics> {
  const startedAt = new Date();
  const from = new Date(startedAt.getTime() - 24 * 3600000).toISOString();
  const results = await Promise.allSettled([
    getChzzkStatisticsSource(), getSoopStatisticsSource(db), readStatisticsHistory(db, from, startedAt.toISOString()),
  ] as const);
  const chzzk = results[0].status === 'fulfilled' ? results[0].value : { source: { platform: 'CHZZK' as const, state: 'unavailable' as const, scope: '인기 방송 상위 100개', observedAt: null, checkedChannels: null }, lives: [] };
  const soop = results[1].status === 'fulfilled' ? results[1].value : { source: { platform: 'SOOP' as const, state: 'unavailable' as const, scope: 'VDébut 등록 채널 최대 40개', observedAt: null, checkedChannels: null }, lives: [] };
  const rows = results[2].status === 'fulfilled' ? results[2].value : [];
  if (results[2].status === 'rejected') console.warn('[Statistics] History unavailable', String(results[2].reason));
  return assembleBroadcastStatistics([chzzk, soop], rows, results[2].status === 'rejected' ? 'unavailable' : rows.length ? 'available' : 'empty');
}
