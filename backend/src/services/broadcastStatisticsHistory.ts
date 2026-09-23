import { STATISTICS_COLLECTION_MINUTES, type CollectedPlatform, type StatisticsCollectionStatus } from '../../../shared/statisticsCollection';

export interface StatisticsHistoryRow {
  platform: CollectedPlatform;
  external_stream_id: string;
  viewer_count: number;
  title: string | null;
  source_category_id: string | null;
  source_category_name: string | null;
  collection_started_at: string;
  channel_name: string | null;
  channel_url: string | null;
  profile_image_url: string | null;
  channel_key?: string;
  live_url?: string | null;
  started_at?: string | null;
  partial?: number;
}

export interface StatisticsHistoryRun {
  platform: CollectedPlatform;
  scheduled_at: string;
  started_at: string;
  observed_at: string | null;
  state: 'running' | 'available' | 'partial' | 'unavailable';
  viewer_total: number | null;
  channel_total: number | null;
}

// 완료된 회차만 읽으며 등록 여부와 관계없이 당시 채널 이름과 주소를 보존한다.
export async function readStatisticsHistory(db: D1Database, from: string, to: string): Promise<StatisticsHistoryRow[]> {
  const result = await db.prepare(`SELECT r.platform, s.stream_id AS external_stream_id, s.viewers AS viewer_count,
    s.title, s.category_id AS source_category_id, s.category_name AS source_category_name,
    r.observed_at AS collection_started_at, s.channel_key, s.channel_name, s.channel_url,
    s.image_url AS profile_image_url, s.live_url, s.started_at, r.state='partial' AS partial
    FROM analytics_broadcast_runs r JOIN analytics_broadcast_snapshots s ON s.run_id=r.run_id
    WHERE r.observed_at>=? AND r.observed_at<=? AND r.state IN ('available','partial')
    ORDER BY r.observed_at, r.platform, s.stream_id LIMIT 21001`).bind(from, to).all<StatisticsHistoryRow>();
  if (result.results.length > 21000) throw new Error('History result exceeds 10-minute collection bounds');
  return result.results;
}

// 빈 방송 목록도 정상 0개인지 수집 실패인지 회차 상태로 구분한다.
export async function readStatisticsRuns(db: D1Database, from: string, to: string): Promise<StatisticsHistoryRun[]> {
  const result = await db.prepare(`SELECT platform, scheduled_at, started_at, observed_at, state, viewer_total, channel_total
    FROM analytics_broadcast_runs WHERE scheduled_at>=? AND scheduled_at<=? ORDER BY scheduled_at, platform`)
    .bind(from, to).all<StatisticsHistoryRun>();
  return result.results;
}

// 최근 24시간 중 실제 시작한 구간의 예정 회차와 누락 회차를 비교한다.
export function summarizeStatisticsCollection(runs: StatisticsHistoryRun[], first: Array<{ platform: CollectedPlatform; first_at: string }>, now = new Date()): StatisticsCollectionStatus {
  const interval = STATISTICS_COLLECTION_MINUTES * 60000;
  // 현재 막 시작한 회차에는 2분의 실행 여유를 주어 누락으로 오인하지 않는다.
  const latestDue = Math.floor((now.getTime() - 2 * 60000) / interval) * interval;
  const windowStart = Math.ceil((now.getTime() - 24 * 3600000) / interval) * interval;
  return {
    checkedAt: now.toISOString(), intervalMinutes: STATISTICS_COLLECTION_MINUTES,
    platforms: (['CHZZK', 'SOOP'] as const).map((platform) => {
      const rows = runs.filter((run) => run.platform === platform);
      const firstAt = first.find((row) => row.platform === platform)?.first_at || null;
      const start = Math.max(windowStart, firstAt ? Date.parse(firstAt) : latestDue + interval);
      const due = rows.filter((row) => Date.parse(row.scheduled_at) >= start && Date.parse(row.scheduled_at) <= latestDue);
      const expectedRuns = Math.max(0, Math.floor((latestDue - start) / interval) + 1);
      const completeRuns = due.filter((row) => row.state === 'available').length;
      const partialRuns = due.filter((row) => row.state === 'partial').length;
      const failedRuns = due.filter((row) => row.state === 'unavailable' || row.state === 'running').length;
      const missingRuns = Math.max(0, expectedRuns - due.length);
      const availableRows = rows.filter((row) => row.state === 'available' && row.observed_at);
      const lastComplete = availableRows.length ? availableRows[availableRows.length - 1].observed_at || null : null;
      const delayed = firstAt && (!lastComplete ? now.getTime() - Date.parse(firstAt) > 20 * 60000 : now.getTime() - Date.parse(lastComplete) > 20 * 60000);
      const lastAttempt = rows.length ? rows[rows.length - 1].started_at || null : null;
      return { platform, state: !firstAt ? 'pending' : delayed ? 'delayed' : partialRuns + failedRuns + missingRuns > 0 ? 'partial' : 'healthy',
        firstCollectedAt: firstAt, lastAttemptAt: lastAttempt, lastCompleteAt: lastComplete,
        expectedRuns, completeRuns, partialRuns, failedRuns, missingRuns };
    }),
  };
}

// 운영 점검과 화면 안내가 동일한 수집 상태를 사용한다.
export async function getStatisticsCollectionStatus(db: D1Database, now = new Date(), runs?: StatisticsHistoryRun[]): Promise<StatisticsCollectionStatus> {
  const from = new Date(now.getTime() - 24 * 3600000).toISOString();
  const [history, first] = await Promise.all([
    runs ? Promise.resolve(runs) : readStatisticsRuns(db, from, now.toISOString()),
    db.prepare('SELECT platform, MIN(scheduled_at) AS first_at FROM analytics_broadcast_runs GROUP BY platform').all<{ platform: CollectedPlatform; first_at: string }>(),
  ]);
  return summarizeStatisticsCollection(history, first.results, now);
}
