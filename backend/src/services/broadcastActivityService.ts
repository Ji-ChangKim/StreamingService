import type { ActivityFilters, BroadcastActivity, ActivitySelection, ActivityBroadcastPage, ActivityBroadcast } from '../../../shared/broadcastActivity';
import type { StatisticsStreamer } from '../../../shared/statisticsStreamerSearch';
import { STATISTICS_COLLECTION_MINUTES } from '../../../shared/statisticsCollection';
import { ensureStreamerRegistered } from './onDemandStreamerService';

// 같은 오름차순 창을 공유하고 이미지·URL을 중간 집계에서 제외해 정렬과 메모리를 줄인다.
// 연속으로 확인한 구간만 방송 시간에 포함하며 수집 중단 구간을 이어 붙이지 않는다.
export const ACTIVITY_CTE = `WITH runs AS (
  SELECT run_id, platform, observed_at, scheduled_at, state FROM analytics_broadcast_runs
  WHERE observed_at >= ?1 AND observed_at < ?2 AND observed_at <= ?6 AND state IN ('available', 'partial')
    AND (?3 = 'ALL' OR platform = ?3)
), sequence AS (
  SELECT s.run_id, s.channel_key, s.stream_id, s.channel_name, s.category_name, s.started_at, s.viewers, r.platform, r.observed_at,
    r.platform || ':' || COALESCE(
      CASE WHEN LOWER(COALESCE(s.category_id, '')) NOT IN ('', 'unknown', 'unclassified') THEN s.category_id END,
      CASE WHEN COALESCE(s.category_name, '') NOT IN ('', '미분류', '카테고리 미제공') THEN s.category_name END, 'unknown') AS category_key,
    CASE WHEN COALESCE(s.category_name, '') IN ('', '미분류', '카테고리 미제공') THEN '미분류' ELSE s.category_name END AS category_label,
    LAST_VALUE(s.title) OVER (PARTITION BY r.platform, s.channel_key, s.stream_id ORDER BY r.observed_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest_title,
    LEAD(r.observed_at) OVER (PARTITION BY r.platform, s.channel_key, s.stream_id ORDER BY r.observed_at) AS next_at
  FROM analytics_broadcast_snapshots s JOIN runs r ON r.run_id = s.run_id
  WHERE (?4 = '' OR s.channel_key = ?4 COLLATE NOCASE)
), entries AS (
  SELECT *, CASE WHEN next_at IS NOT NULL
    AND (julianday(next_at) - julianday(observed_at)) * 1440 BETWEEN 0 AND ${STATISTICS_COLLECTION_MINUTES * 1.5}
    THEN (julianday(next_at) - julianday(observed_at)) * 1440 ELSE 0 END AS minutes
  FROM sequence WHERE (?5 = '' OR category_key = ?5 OR category_name = ?5)
), sessions AS (
  SELECT platform, channel_key AS channelKey, MAX(channel_name) AS channelName, stream_id AS streamId,
    MAX(latest_title) AS title, GROUP_CONCAT(DISTINCT category_label) AS categories, MIN(started_at) AS startedAt,
    MIN(observed_at) AS firstObservedAt, MAX(observed_at) AS lastObservedAt,
    SUM(minutes) AS minutes, MAX(viewers) AS peakViewers
  FROM entries GROUP BY platform, channel_key, stream_id
), daily_segments AS (
  SELECT date(observed_at, '+9 hours') AS date, platform, channel_key, stream_id,
    MIN(minutes, (julianday(date(observed_at, '+9 hours'), '+1 day', '-9 hours') - julianday(observed_at)) * 1440) AS minutes
  FROM entries
  UNION ALL
  SELECT date(next_at, '+9 hours'), platform, channel_key, stream_id,
    (julianday(next_at) - julianday(date(next_at, '+9 hours'), '-9 hours')) * 1440
  FROM entries WHERE minutes > 0 AND date(observed_at, '+9 hours') != date(next_at, '+9 hours')
)`;

// 직접 접속한 상세 주소에서도 최근 공개 기록 또는 온디맨드 자동 등록으로 채널 프로필을 확인한다.
async function readActivityStreamer(db: D1Database, channel: string): Promise<StatisticsStreamer | null> {
  if (!channel) return null;
  const latest = await db.prepare(`SELECT s.channel_name AS name, s.channel_url AS channelUrl, s.image_url AS imageUrl
    FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
    WHERE s.channel_key = ? COLLATE NOCASE ORDER BY r.observed_at DESC LIMIT 1`).bind(channel).first<{ name: string | null; channelUrl: string | null; imageUrl: string | null }>();
  const platform = channel.toUpperCase().startsWith('SOOP:') ? 'SOOP' : 'CHZZK';
  const id = channel.slice(channel.indexOf(':') + 1);
  const channelUrl = platform === 'CHZZK' ? `https://chzzk.naver.com/${id}` : `https://www.sooplive.co.kr/station/${id}`;
  const registered = await db.prepare(`SELECT COALESCE(i.display_name, c.channel_name) AS name,
      c.channel_url AS channelUrl, i.profile_image_url AS imageUrl, i.slug AS profileSlug
    FROM streamerChannel c LEFT JOIN streamerChannel_info i ON i.channel_id = c.id
    WHERE c.platform = ? AND (c.channel_url = ? OR c.channel_url = ? OR c.channel_url = ?) LIMIT 1`)
    .bind(platform, channelUrl, `https://ch.sooplive.co.kr/${id}`, `https://bj.afreecatv.com/${id}`)
    .first<{ name: string; channelUrl: string | null; imageUrl: string | null; profileSlug: string | null }>();

  if (registered) {
    return {
      id: channel,
      channelKey: channel,
      platform,
      isRegistered: true,
      name: registered.name || latest?.name || id,
      channelUrl: registered.channelUrl || latest?.channelUrl || channelUrl,
      imageUrl: registered.imageUrl || latest?.imageUrl || null,
      profileSlug: registered.profileSlug || null,
    };
  }

  // 등록되지 않은 채널인 경우 온디맨드 자동 등록(Smart Fallback) 수행
  try {
    const fallbackResult = await ensureStreamerRegistered(db, channel);
    if (fallbackResult.streamer) {
      return fallbackResult.streamer;
    }
  } catch (err) {
    console.warn(`[readActivityStreamer] Fallback registration failed for ${channel}:`, err);
  }

  return {
    id: channel,
    channelKey: channel,
    platform,
    isRegistered: false,
    name: latest?.name || id,
    channelUrl: latest?.channelUrl || channelUrl,
    imageUrl: latest?.imageUrl || null,
    profileSlug: null,
  };
}

// 집계 결과와 최근 200개 방송 이력을 함께 반환한다.
export async function getBroadcastActivity(db: D1Database, filters: ActivityFilters): Promise<BroadcastActivity> {
  const fromUtc = new Date(`${filters.from}T00:00:00+09:00`).toISOString();
  const toUtc = new Date(Date.parse(`${filters.to}T00:00:00+09:00`) + 86400000).toISOString();
  const generatedAt = new Date().toISOString();
  const values = [fromUtc, toUtc, filters.platform, filters.channel, filters.category, generatedAt];
  const queries = [
    `SELECT COUNT(DISTINCT channelKey) AS streamers, COUNT(*) AS broadcasts, COALESCE(SUM(minutes), 0) AS minutes,
      (SELECT COUNT(DISTINCT date(observed_at, '+9 hours')) FROM entries) AS broadcastDays,
      (SELECT COUNT(DISTINCT category_key) FROM entries WHERE category_key NOT IN ('CHZZK:unknown', 'SOOP:unknown')) AS categoryCount FROM sessions`,
    `SELECT CAST(strftime('%w', observed_at, '+9 hours') AS INTEGER) AS weekday,
      CAST(strftime('%H', observed_at, '+9 hours') AS INTEGER) AS hour, AVG(channels) AS channels, COUNT(*) AS runs
      FROM (SELECT MIN(r.observed_at) AS observed_at, COUNT(DISTINCT e.channel_key) AS channels FROM runs r
        LEFT JOIN entries e ON e.run_id = r.run_id GROUP BY r.scheduled_at
        HAVING COUNT(DISTINCT r.platform) = CASE WHEN ?3 = 'ALL' THEN 2 ELSE 1 END
          AND SUM(CASE WHEN r.state != 'available' THEN 1 ELSE 0 END) = 0) GROUP BY weekday, hour`,
    `SELECT CAST(strftime('%w', startedAt, '+9 hours') AS INTEGER) AS weekday,
      CAST(strftime('%H', startedAt, '+9 hours') AS INTEGER) AS hour, COUNT(*) AS broadcasts FROM sessions
      WHERE startedAt >= ?1 AND startedAt < ?2 GROUP BY weekday, hour`,
    `SELECT category_key AS key, platform, MAX(category_label) AS name, COUNT(DISTINCT platform || ':' || channel_key || ':' || stream_id) AS broadcasts,
      SUM(minutes) AS minutes FROM entries GROUP BY category_key, platform ORDER BY minutes DESC, broadcasts DESC`,
    `SELECT date,
      COUNT(DISTINCT platform || ':' || channel_key || ':' || stream_id) AS broadcasts, SUM(minutes) AS minutes
      FROM (SELECT * FROM daily_segments UNION ALL
        SELECT date(observed_at, '+9 hours'), platform, NULL, NULL, 0 FROM runs
        WHERE scheduled_at IN (SELECT scheduled_at FROM runs GROUP BY scheduled_at
          HAVING COUNT(DISTINCT platform) = CASE WHEN ?3 = 'ALL' THEN 2 ELSE 1 END
          AND SUM(CASE WHEN state != 'available' THEN 1 ELSE 0 END) = 0)) GROUP BY date ORDER BY date`,
    `SELECT * FROM sessions ORDER BY lastObservedAt DESC, platform DESC, channelKey DESC, streamId DESC LIMIT 200`,
    `SELECT MIN(observed_at) AS firstRecordedAt, MAX(observed_at) AS lastRecordedAt,
      COUNT(DISTINCT date(observed_at, '+9 hours')) AS recordedDays,
      SUM(CASE WHEN state = 'partial' THEN 1 ELSE 0 END) AS partialRuns FROM runs`,
    `SELECT category_key AS key, platform, MAX(category_label) AS name
      FROM sequence GROUP BY category_key, platform ORDER BY name, platform`,
  ];
  // 한 SQL에서 공통 기록을 재사용해 차트마다 같은 데이터를 다시 읽지 않는다.
  const sections = [
    { key: 'summary', fields: ['streamers', 'broadcasts', 'minutes', 'broadcastDays', 'categoryCount'], single: true },
    { key: 'heatmap', fields: ['weekday', 'hour', 'channels', 'runs'] },
    { key: 'starts', fields: ['weekday', 'hour', 'broadcasts'] },
    { key: 'categories', fields: ['key', 'platform', 'name', 'broadcasts', 'minutes'] },
    { key: 'daily', fields: ['date', 'broadcasts', 'minutes'] },
    { key: 'broadcasts', fields: ['platform', 'channelKey', 'channelName', 'streamId', 'title', 'categories', 'startedAt', 'firstObservedAt', 'lastObservedAt', 'minutes', 'peakViewers'] },
    { key: 'coverage', fields: ['firstRecordedAt', 'lastRecordedAt', 'recordedDays', 'partialRuns'], single: true },
    { key: 'categoryOptions', fields: ['key', 'platform', 'name'] },
  ];
  const fields = sections.map((section, index) => {
    const object = `json_object(${section.fields.map((field) => `'${field}', ${field}`).join(', ')})`;
    return `'${section.key}', json((SELECT ${section.single ? object : `json_group_array(${object})`} FROM (${queries[index]})))`;
  }).join(', ');
  const [row, streamer] = await Promise.all([
    db.prepare(`${ACTIVITY_CTE} SELECT json_object(${fields}) AS payload`).bind(...values).first<{ payload: string }>(),
    readActivityStreamer(db, filters.channel),
  ]);
  if (!row) throw new Error('방송 활동 집계 결과가 없습니다.');
  const result: Omit<BroadcastActivity, 'meta' | 'streamer'> & { coverage: Pick<BroadcastActivity['meta'], 'firstRecordedAt' | 'lastRecordedAt' | 'recordedDays' | 'partialRuns'> } = JSON.parse(row.payload);
  return {
    meta: { generatedAt, from: filters.from, to: filters.to, ...result.coverage }, streamer,
    summary: result.summary, heatmap: result.heatmap, starts: result.starts,
    categories: result.categories, categoryOptions: result.categoryOptions, daily: result.daily, broadcasts: result.broadcasts,
  };
}

// 페이지 경계는 동일 시각의 방송도 빠뜨리지 않도록 고유 채널·방송 ID를 포함한다.
export function readActivityCursor(cursor: string): string[] | null {
  if (!cursor) return ['', '', '', ''];
  try {
    const value: unknown = JSON.parse(cursor);
    return Array.isArray(value) && value.length === 4 && value.every((item) => typeof item === 'string' && item.length <= 150)
      && Number.isFinite(Date.parse(value[0])) ? value : null;
  } catch { return null; }
}

// 선택한 날짜·시간대에 실제 기록이 있는 방송만 조회하고 다음 페이지를 반환한다.
export async function getActivityBroadcastPage(db: D1Database, filters: ActivityFilters, selection: ActivitySelection, cursor = '', asOf = new Date().toISOString()): Promise<ActivityBroadcastPage> {
  const boundary = readActivityCursor(cursor);
  if (!boundary) throw new Error('방송 이력 페이지 주소가 올바르지 않습니다.');
  const fromUtc = new Date(`${filters.from}T00:00:00+09:00`).toISOString();
  const toUtc = new Date(Date.parse(`${filters.to}T00:00:00+09:00`) + 86400000).toISOString();
  const sql = `${ACTIVITY_CTE}, selected AS (
    SELECT * FROM sessions s WHERE
      (?7 = '' OR EXISTS (SELECT 1 FROM entries e WHERE e.platform = s.platform AND e.channel_key = s.channelKey AND e.stream_id = s.streamId AND date(e.observed_at, '+9 hours') = ?7))
      AND (?8 = -1 OR (?10 = 'starts' AND startedAt >= ?1 AND startedAt < ?2
        AND CAST(strftime('%w', startedAt, '+9 hours') AS INTEGER) = ?8 AND CAST(strftime('%H', startedAt, '+9 hours') AS INTEGER) = ?9)
        OR (?10 = 'activity' AND EXISTS (SELECT 1 FROM entries e WHERE e.platform = s.platform AND e.channel_key = s.channelKey AND e.stream_id = s.streamId
          AND CAST(strftime('%w', e.observed_at, '+9 hours') AS INTEGER) = ?8 AND CAST(strftime('%H', e.observed_at, '+9 hours') AS INTEGER) = ?9)))
  ), page AS (
    SELECT * FROM selected WHERE ?11 = '' OR (lastObservedAt, platform, channelKey, streamId) < (?11, ?12, ?13, ?14)
    ORDER BY lastObservedAt DESC, platform DESC, channelKey DESC, streamId DESC LIMIT 26
  ) SELECT json_object('total', (SELECT COUNT(*) FROM selected), 'items', json((SELECT json_group_array(json_object(
    'platform', platform, 'channelKey', channelKey, 'channelName', channelName, 'streamId', streamId, 'title', title, 'categories', categories,
    'startedAt', startedAt, 'firstObservedAt', firstObservedAt, 'lastObservedAt', lastObservedAt, 'minutes', minutes, 'peakViewers', peakViewers)) FROM page))) AS payload`;
  const row = await db.prepare(sql).bind(fromUtc, toUtc, filters.platform, filters.channel, filters.category, asOf,
    selection.day, selection.weekday ?? -1, selection.hour ?? -1, selection.timeMetric, ...boundary).first<{ payload: string }>();
  if (!row) throw new Error('방송 이력을 불러오지 못했습니다.');
  const result: { total: number; items: ActivityBroadcast[] } = JSON.parse(row.payload);
  const items = result.items.slice(0, 25);
  const last = items[items.length - 1];
  return { items, total: result.total, asOf, nextCursor: result.items.length > 25 ? JSON.stringify([last.lastObservedAt, last.platform, last.channelKey, last.streamId]) : null };
}
