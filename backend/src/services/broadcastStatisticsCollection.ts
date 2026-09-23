import { STATISTICS_COLLECTION_MINUTES, type CollectedPlatform } from '../../../shared/statisticsCollection';
import { getChzzkStatisticsSource, getSoopStatisticsSource, type StatisticsSourceResult } from './broadcastStatisticsSources';

interface CollectionClaim { runId: string; attemptId: string; platform: CollectedPlatform }
export interface CollectionResult { platform: CollectedPlatform; state: 'skipped' | 'available' | 'partial' | 'unavailable'; channels: number }
const INTERVAL_MS = STATISTICS_COLLECTION_MINUTES * 60000;

// 정기 실행 시각의 UTC 10분 구간을 중복 방지 키로 사용한다.
export function statisticsCollectionSlot(time: number): string {
  if (!Number.isFinite(time)) throw new Error('Invalid scheduled time');
  return new Date(Math.floor(time / INTERVAL_MS) * INTERVAL_MS).toISOString();
}

// 완료 회차는 다시 쓰지 않고, 중단된 회차는 임대 시간이 지난 뒤 재시도할 수 있다.
async function claimCollection(db: D1Database, platform: CollectedPlatform, scheduledAt: string): Promise<CollectionClaim | null> {
  const startedAt = new Date().toISOString();
  const claim = { runId: `${platform}:${scheduledAt}`, attemptId: crypto.randomUUID(), platform };
  const result = await db.prepare(`INSERT INTO analytics_broadcast_runs
    (run_id, platform, scheduled_at, started_at, attempt_id, state, scope)
    VALUES (?, ?, ?, ?, ?, 'running', ?)
    ON CONFLICT(run_id) DO UPDATE SET started_at=excluded.started_at, attempt_id=excluded.attempt_id,
      state='running', completed_at=NULL, error_code=NULL
    WHERE analytics_broadcast_runs.state IN ('running', 'unavailable') AND analytics_broadcast_runs.started_at < ?`)
    .bind(claim.runId, platform, scheduledAt, startedAt, claim.attemptId,
      platform === 'CHZZK' ? '인기 방송 상위 100개' : 'VDébut 등록 채널 최대 40개',
      new Date(Date.now() - 3 * 60000).toISOString()).run();
  return result.meta.changes ? claim : null;
}

// 방송 행과 회차 합계를 하나의 트랜잭션으로 저장해 중간 결과가 공개되지 않게 한다.
async function saveCollection(db: D1Database, claim: CollectionClaim, result: StatisticsSourceResult): Promise<CollectionResult> {
  const { source, lives } = result;
  const state = source.state === 'available' ? 'available' : source.state === 'partial' ? 'partial' : 'unavailable';
  const usable = state !== 'unavailable';
  const statements = [
    db.prepare(`INSERT INTO analytics_broadcast_snapshots
      (run_id, stream_id, channel_key, channel_name, channel_url, image_url, live_url, title, category_id, category_name, viewers, started_at)
      SELECT ?, json_extract(value, '$.streamId'), json_extract(value, '$.channelKey'), json_extract(value, '$.channelName'),
        json_extract(value, '$.channelUrl'), json_extract(value, '$.imageUrl'), json_extract(value, '$.liveUrl'),
        json_extract(value, '$.title'), json_extract(value, '$.categoryId'), json_extract(value, '$.categoryName'),
        json_extract(value, '$.viewers'), json_extract(value, '$.startedAt')
      FROM json_each(?) WHERE EXISTS (SELECT 1 FROM analytics_broadcast_runs WHERE run_id=? AND attempt_id=? AND state='running')`)
      .bind(claim.runId, JSON.stringify(usable ? lives : []), claim.runId, claim.attemptId),
    db.prepare(`UPDATE analytics_broadcast_runs SET completed_at=?, observed_at=?, state=?, scope=?, checked_channels=?,
      viewer_total=?, channel_total=?, error_code=? WHERE run_id=? AND attempt_id=? AND state='running'`)
      .bind(new Date().toISOString(), source.observedAt, state, source.scope, source.checkedChannels,
        usable ? lives.reduce((sum, live) => sum + live.viewers, 0) : null, usable ? lives.length : null,
        state === 'unavailable' ? 'PLATFORM_UNAVAILABLE' : state === 'partial' ? 'PARTIAL_CHANNELS' : null,
        claim.runId, claim.attemptId),
  ];
  const saved = await db.batch(statements);
  if (!saved[1].meta.changes) return { platform: claim.platform, state: 'skipped', channels: 0 };
  return { platform: claim.platform, state, channels: lives.length };
}

// 저장 오류도 회차에 남기고 정상 수집으로 보고하지 않는다.
async function recordCollectionFailure(db: D1Database, claim: CollectionClaim): Promise<void> {
  await db.prepare(`UPDATE analytics_broadcast_runs SET state='unavailable', completed_at=?, error_code='COLLECTION_FAILED'
    WHERE run_id=? AND attempt_id=? AND state='running'`).bind(new Date().toISOString(), claim.runId, claim.attemptId).run();
}

// 한 플랫폼의 실패가 다른 플랫폼의 저장을 막지 않도록 독립적으로 처리한다.
async function collectPlatform(db: D1Database, platform: CollectedPlatform, slot: string): Promise<CollectionResult> {
  const claim = await claimCollection(db, platform, slot);
  if (!claim) return { platform, state: 'skipped', channels: 0 };
  try {
    const result = platform === 'CHZZK' ? await getChzzkStatisticsSource() : await getSoopStatisticsSource(db);
    return await saveCollection(db, claim, result);
  } catch (error) {
    await recordCollectionFailure(db, claim);
    throw error;
  }
}

// 기존 이력에는 손대지 않고 새 수집 자료만 7일 보관한다. 한 번에 최대 100회차를 정리한다.
export async function pruneStatisticsCollections(db: D1Database, now = Date.now()): Promise<void> {
  await db.prepare(`DELETE FROM analytics_broadcast_runs WHERE run_id IN
    (SELECT run_id FROM analytics_broadcast_runs WHERE scheduled_at < ? ORDER BY scheduled_at LIMIT 100)`)
    .bind(new Date(now - 7 * 24 * 3600000).toISOString()).run();
}

// 통계 전용 스케줄은 외부 알림이나 프로필 변경 작업을 실행하지 않는다.
export async function collectBroadcastStatistics(db: D1Database, scheduledTime: number): Promise<CollectionResult[]> {
  const slot = statisticsCollectionSlot(scheduledTime);
  const results = await Promise.allSettled((['CHZZK', 'SOOP'] as const).map((platform) => collectPlatform(db, platform, slot)));
  const reports = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
  console.log(JSON.stringify({ event: 'broadcast_statistics_collection', slot, results: reports, failures: results.filter((result) => result.status === 'rejected').map((result) => String(result.reason)) }));
  await pruneStatisticsCollections(db);
  if (results.some((result) => result.status === 'rejected') || reports.some((report) => report.state === 'unavailable')) throw new Error('Broadcast statistics collection incomplete');
  return reports;
}
