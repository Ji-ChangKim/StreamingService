import type { BroadcastStatistics, StatisticsBroadcast, StatisticsPeak, StatisticsPoint } from '../../../shared/broadcastStatistics';
import {
  getChzzkStatisticsSource,
  getSoopStatisticsSource,
  deduplicateLiveChannels,
  isRookieStreamer,
  type StatisticsSourceResult
} from './broadcastStatisticsSources';

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
  const peakFrom = new Date(now.getTime() - 24 * 3600000).toISOString();
  const rows = uniqueHistory(rawRows).filter((row) => Date.parse(row.collection_started_at) >= Date.parse(historyFrom) && Date.parse(row.collection_started_at) <= now.getTime());
  const peaks = buildPeaks(rows, sources, peakFrom);
  const times = [...rows.map((row) => Date.parse(row.collection_started_at)), ...runs.filter((run) => run.observed_at && ['available', 'partial'].includes(run.state)).map((run) => Date.parse(run.observed_at!))];
  return {
    meta: {
      generatedAt: now.toISOString(), timezone: 'Asia/Seoul', refreshSeconds: 60,
      historyState, lastHistoryAt: times.length ? new Date(Math.max(...times)).toISOString() : null,
      peakFrom, historyFrom, historyScope: '치지직 · SOOP 실시간 방송 수집 데이터', historyIntervalMinutes: STATISTICS_COLLECTION_MINUTES,
      unlinkedPeakChannels: peaks.filter((peak) => !peak.channelKey).length,
    },
    sources: sources.map((source) => source.source),
    lives: sources.flatMap((source) => source.lives).sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id)),
    points: buildPoints(rows, sources, runs), peaks,
  };
}

// 과거 특정 날짜(00:00 ~ 23:59 KST)의 수집 기록을 조회하여 대시보드 리포트로 조립한다 (단일 책임)
export async function getBroadcastStatisticsForDate(db: D1Database, dateStr: string): Promise<BroadcastStatistics> {
  const startKst = `${dateStr}T00:00:00+09:00`;
  const endKst = `${dateStr}T23:59:59+09:00`;
  const from = new Date(Date.parse(startKst)).toISOString();
  const to = new Date(Date.parse(endKst)).toISOString();

  const [rawRows, runs] = await Promise.all([
    readStatisticsHistory(db, from, to),
    readStatisticsRuns(db, from, to),
  ]);

  const validRuns = runs.filter((run) => run.observed_at && ['available', 'partial'].includes(run.state));
  const historyState = validRuns.length ? 'available' : 'empty';

  // 과거 일자의 소스 상태 구성
  const platforms: ('CHZZK' | 'SOOP')[] = ['CHZZK', 'SOOP'];
  const sources: StatisticsSourceResult[] = platforms.map((p) => {
    const pRuns = validRuns.filter((r) => r.platform === p);
    return {
      source: {
        platform: p,
        state: pRuns.length ? 'available' : 'unavailable',
        scope: `${p === 'CHZZK' ? '치지직' : 'SOOP'} ${dateStr} 아카이브`,
        observedAt: to,
        checkedChannels: null,
      },
      lives: [],
    };
  });

  const response = assembleBroadcastStatistics(sources, rawRows, historyState, new Date(Date.parse(endKst)), validRuns);
  response.meta.targetDate = dateStr;
  response.meta.isPastDate = true;
  response.meta.historyScope = `${dateStr} KST 방송 기록 아카이브`;
  response.meta.peakFrom = from;
  response.meta.historyFrom = from;

  return response;
}

// D1 DB에서 특정 플랫폼의 최근 스냅샷(기본 30분 이내)을 조회하여 외부 API 왕복 없이 즉시 반환 (단일 책임)
export async function readLatestPlatformSnapshotFromD1(
  db: D1Database,
  platform: 'CHZZK' | 'SOOP',
  maxAgeMinutes = 30
): Promise<StatisticsSourceResult | null> {
  try {
    const minObservedAt = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

    // 가장 최근 유효 회차 조회
    const run = await db.prepare(`
      SELECT run_id, platform, state, scope, observed_at, checked_channels
      FROM analytics_broadcast_runs
      WHERE platform = ? AND state IN ('available', 'partial') AND observed_at >= ?
      ORDER BY observed_at DESC
      LIMIT 1
    `).bind(platform, minObservedAt).first<{
      run_id: string;
      platform: 'CHZZK' | 'SOOP';
      state: 'available' | 'partial';
      scope: string;
      observed_at: string;
      checked_channels: number | null;
    }>();

    if (!run || !run.run_id) {
      return null;
    }

    // 해당 회차의 방송 스냅샷 목록 조회 (등록 스트리머 데뷔일 조인)
    const { results } = await db.prepare(`
      SELECT s.stream_id, s.channel_key, s.channel_name, s.channel_url, s.image_url,
             s.live_url, s.title, s.category_id, s.category_name, s.viewers, s.started_at,
             (SELECT info.debut_date FROM streamerChannel_info info
              JOIN streamerChannel c ON c.id = info.channel_id
              WHERE c.channel_url = s.channel_url LIMIT 1) AS debut_date
      FROM analytics_broadcast_snapshots s
      WHERE s.run_id = ?
      ORDER BY s.viewers DESC
    `).bind(run.run_id).all<{
      stream_id: string;
      channel_key: string;
      channel_name: string | null;
      channel_url: string | null;
      image_url: string | null;
      live_url: string | null;
      title: string;
      category_id: string;
      category_name: string;
      viewers: number;
      started_at: string | null;
      debut_date: string | null;
    }>();

    if (!results || results.length === 0) {
      return null;
    }

    const lives: StatisticsBroadcast[] = (results as any[]).map((s) => {
      const isRookie = isRookieStreamer(s.debut_date, s.title, undefined);
      return {
        id: `${platform}:${s.stream_id}`,
        platform,
        streamId: s.stream_id,
        channelKey: s.channel_key,
        channelName: s.channel_name || '제목 없음',
        channelUrl: s.channel_url || '',
        imageUrl: s.image_url,
        liveUrl: s.live_url,
        title: s.title || '제목 없음',
        categoryId: s.category_id || 'unknown',
        categoryName: s.category_name || '카테고리 미제공',
        viewers: s.viewers || 0,
        startedAt: s.started_at || null,
        isVtuber: true,
        isRookie,
        debutDate: s.debut_date || null,
      };
    });

    return {
      source: {
        platform,
        state: run.state,
        scope: run.scope || (platform === 'CHZZK' ? '치지직 실시간 방송' : 'SOOP 버추얼 스트리머'),
        observedAt: run.observed_at,
        checkedChannels: run.checked_channels,
      },
      lives: deduplicateLiveChannels(lives),
    };
  } catch (err) {
    console.warn(`[readLatestPlatformSnapshotFromD1] Failed for ${platform}:`, err);
    return null;
  }
}

// 현재 방송 또는 과거 특정 날짜의 수집 기록을 읽는다.
export async function getBroadcastStatistics(db: D1Database, targetDate?: string, forceFresh = false): Promise<BroadcastStatistics> {
  const todayKst = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) && targetDate !== todayKst) {
    return getBroadcastStatisticsForDate(db, targetDate);
  }

  const startedAt = new Date();
  const from = new Date(startedAt.getTime() - 24 * 3600000).toISOString();

  // 1. 💡 빠른 DB 스냅샷 우선 조회 (Read-from-DB: 외부 API 150회 순회 대기 제거)
  let chzzkSource: StatisticsSourceResult | null = null;
  let soopSource: StatisticsSourceResult | null = null;

  if (!forceFresh) {
    const [cachedChzzk, cachedSoop] = await Promise.all([
      readLatestPlatformSnapshotFromD1(db, 'CHZZK', 30),
      readLatestPlatformSnapshotFromD1(db, 'SOOP', 30),
    ]);
    chzzkSource = cachedChzzk;
    soopSource = cachedSoop;
  }

  // 2. 만약 최근 30분 이내 DB 스냅샷이 없다면 Fallback으로 외부 API 실시간 호출
  const fallbackTasks: Promise<any>[] = [];
  if (!chzzkSource) fallbackTasks.push(getChzzkStatisticsSource(db));
  if (!soopSource) fallbackTasks.push(getSoopStatisticsSource(db));

  const [rowsResult, runsResult, ...fallbackResults] = await Promise.allSettled([
    readStatisticsHistory(db, from, startedAt.toISOString()),
    readStatisticsRuns(db, from, startedAt.toISOString()),
    ...fallbackTasks,
  ]);

  let fallbackIdx = 0;
  if (!chzzkSource) {
    const r = fallbackResults[fallbackIdx++];
    chzzkSource = r && r.status === 'fulfilled' ? r.value : null;
  }
  if (!soopSource) {
    const r = fallbackResults[fallbackIdx++];
    soopSource = r && r.status === 'fulfilled' ? r.value : null;
  }

  const chzzk = chzzkSource || { source: { platform: 'CHZZK' as const, state: 'unavailable' as const, scope: '치지직 실시간 방송', observedAt: null, checkedChannels: null }, lives: [] };
  const soop = soopSource || { source: { platform: 'SOOP' as const, state: 'unavailable' as const, scope: 'SOOP 버추얼 스트리머', observedAt: null, checkedChannels: null }, lives: [] };

  const rows = rowsResult.status === 'fulfilled' ? rowsResult.value : [];
  if (rowsResult.status === 'rejected') console.warn('[Statistics] History unavailable', String(rowsResult.reason));
  const runs = runsResult.status === 'fulfilled' ? runsResult.value : [];
  const validRuns = runs.filter((run) => run.observed_at && Date.parse(run.observed_at) >= Date.parse(from) && Date.parse(run.observed_at) <= Date.now());
  const failed = rowsResult.status === 'rejected' || runsResult.status === 'rejected';
  const historyState = failed ? 'unavailable' : validRuns.some((run) => run.state === 'available' || run.state === 'partial') ? 'available' : 'empty';
  const response = assembleBroadcastStatistics([chzzk, soop], rows, historyState, new Date(), validRuns);
  try { response.meta.collection = await getStatisticsCollectionStatus(db, new Date(), runs); }
  catch (error) { console.warn('[Statistics] Collection status unavailable', String(error)); }
  return response;
}

// 특정 스트리머의 방송 이력 타임라인을 조회한다 (기본 7일, 최대 30일, 단일 책임)
export async function getStreamerBroadcastHistory(db: D1Database, channelKey: string, days = 7): Promise<{
  channelKey: string;
  name: string;
  platform: 'CHZZK' | 'SOOP';
  broadcasts: Array<{
    streamId: string;
    title: string;
    categoryName: string;
    peakViewers: number;
    startedAt: string | null;
    lastObservedAt: string;
    liveUrl: string | null;
  }>;
}> {
  const safeDays = Math.min(Math.max(Number(days) || 7, 1), 30);
  const fromUtc = new Date(Date.now() - safeDays * 24 * 3600000).toISOString();
  const platform = channelKey.startsWith('SOOP:') ? 'SOOP' : 'CHZZK';

  const rows = await db.prepare(`
    SELECT s.stream_id, s.title, s.category_name, MAX(s.viewers) AS peak_viewers,
           MIN(s.started_at) AS started_at, MAX(r.observed_at) AS last_observed_at,
           s.live_url, s.channel_name
    FROM analytics_broadcast_snapshots s
    JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
    WHERE (s.channel_key = ? OR s.channel_key = ?) AND r.observed_at >= ?
    GROUP BY s.stream_id
    ORDER BY MAX(r.observed_at) DESC
    LIMIT 30
  `).bind(channelKey, channelKey.toLowerCase(), fromUtc).all<{
    stream_id: string;
    title: string | null;
    category_name: string | null;
    peak_viewers: number;
    started_at: string | null;
    last_observed_at: string;
    live_url: string | null;
    channel_name: string | null;
  }>();

  const channelName = rows.results[0]?.channel_name || channelKey;

  return {
    channelKey,
    name: channelName,
    platform,
    broadcasts: rows.results.map((r) => ({
      streamId: r.stream_id,
      title: r.title || '제목 없음',
      categoryName: r.category_name || '카테고리 미제공',
      peakViewers: r.peak_viewers || 0,
      startedAt: r.started_at || null,
      lastObservedAt: r.last_observed_at,
      liveUrl: r.live_url || null,
    })),
  };
}
