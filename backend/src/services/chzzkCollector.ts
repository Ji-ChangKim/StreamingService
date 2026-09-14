// CHZZK Live Data Collector & Aggregator (POC)
// 기획서: VDebut_Analytics_Dashboard_Plan_v0.1
import { D1Database } from '@cloudflare/workers-types';

interface ChzzkLiveItem {
  liveId: number | string;
  liveTitle: string;
  concurrentUserCount: number;
  openDate: string;
  tags?: string[];
  categoryType?: string;
  liveCategory?: string;
  liveCategoryValue?: string;
  channel: {
    channelId: string;
    channelName: string;
    channelImageUrl?: string;
  };
}

/**
 * 치지직 라이브 목록 수집 (오픈 API 연동)
 */
export async function fetchChzzkLiveList(clientId?: string, clientSecret?: string, size: number = 20): Promise<ChzzkLiveItem[]> {
  try {
    const url = `https://openapi.chzzk.naver.com/open/v1/lives?size=${size}&sortType=POPULAR`;
    const headers: Record<string, string> = {
      'User-Agent': 'VDébut-Analytics-Collector/1.0',
      'Accept': 'application/json',
    };

    if (clientId && clientSecret) {
      headers['Client-Id'] = clientId;
      headers['Client-Secret'] = clientSecret;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`[Chzzk Collector] API call returned HTTP ${res.status}`);
      return [];
    }

    const json: any = await res.json();
    return json?.content?.data || [];
  } catch (err) {
    console.error('[Chzzk Collector] Failed to fetch live list:', err);
    return [];
  }
}

/**
 * 10분 주기 스냅샷 수집 및 D1 적재
 */
export async function collectChzzkLiveSnapshot(db: D1Database, clientId?: string, clientSecret?: string): Promise<{ collectedCount: number; vtuberMatchCount: number }> {
  const startedAt = new Date().toISOString();
  const snapshotAt = new Date().toISOString().replace(/:[0-9]{2}\..+/, ':00:00+09:00'); // 정규화 시각

  // 1. 치지직 실시간 라이브 목록 호출
  const lives = await fetchChzzkLiveList(clientId, clientSecret, 50);
  if (!lives || lives.length === 0) {
    return { collectedCount: 0, vtuberMatchCount: 0 };
  }

  // 2. 검증된 버튜버 채널 목록 조회
  const verifiedChans = await db
    .prepare("SELECT id, external_channel_id FROM analytics_channels WHERE platform = 'CHZZK' AND is_vtuber = 1")
    .all();

  const channelMap = new Map<string, number>();
  for (const row of verifiedChans.results || []) {
    channelMap.set(String((row as any).external_channel_id), Number((row as any).id));
  }

  let vtuberMatchCount = 0;
  const completedAt = new Date().toISOString();

  // 3. 스냅샷 테이블 일괄 INSERT
  for (let i = 0; i < lives.length; i++) {
    const item = lives[i];
    const chanId = channelMap.get(item.channel.channelId) || null;
    if (chanId) vtuberMatchCount++;

    const tagsJson = item.tags ? JSON.stringify(item.tags) : null;
    const catId = item.liveCategory || 'etc';
    const catName = item.liveCategoryValue || '기타';

    await db
      .prepare(
        `INSERT OR REPLACE INTO analytics_live_snapshots 
         (snapshot_at, collection_started_at, collection_completed_at, platform, external_stream_id, channel_id, viewer_count, title, source_category_type, source_category_id, source_category_name, source_tags_json, page_order)
         VALUES (?, ?, ?, 'CHZZK', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        snapshotAt,
        startedAt,
        completedAt,
        String(item.liveId),
        chanId,
        item.concurrentUserCount || 0,
        item.liveTitle || '',
        item.categoryType || 'ETC',
        catId,
        catName,
        tagsJson,
        i + 1
      )
      .run();
  }

  return {
    collectedCount: lives.length,
    vtuberMatchCount,
  };
}

/**
 * 1시간 단위 사전 집계 롤업 (Hourly Aggregation Worker)
 */
export async function rollupHourlyAnalytics(db: D1Database): Promise<{ bucketAt: string; processedRows: number }> {
  const now = new Date();
  const bucketAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;

  // 스냅샷 기반 1시간 평균 및 통계 집계
  const stats = await db
    .prepare(
      `SELECT 
         platform, 
         COALESCE(normalized_category_id, 'ALL') as catId,
         COUNT(DISTINCT external_stream_id) as totalLive,
         AVG(viewer_count) as avgViewers,
         COUNT(id) as snapshotCount
       FROM analytics_live_snapshots
       WHERE collected_at >= datetime('now', '-1 hour')
       GROUP BY platform, normalized_category_id`
    )
    .all();

  let processedRows = 0;

  for (const row of stats.results || []) {
    const r: any = row;
    const liveAvg = Number(r.totalLive || 0);
    const viewerSumAvg = Number(r.avgViewers || 0) * liveAvg;
    const vpl = liveAvg > 0 ? viewerSumAvg / liveAvg : 0;

    await db
      .prepare(
        `INSERT OR REPLACE INTO analytics_market_hourly
         (bucket_at, platform, normalized_category_id, day_of_week, is_weekend, live_count_avg, viewer_sum_avg, viewer_per_live_avg, snapshot_received)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(bucketAt, r.platform, r.catId, dayOfWeek, isWeekend, liveAvg, viewerSumAvg, vpl, Number(r.snapshotCount || 1))
      .run();

    processedRows++;
  }

  return { bucketAt, processedRows };
}
