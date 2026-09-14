// CHZZK Live Data Collector & Aggregator (POC)
// 기획서: VDebut_Analytics_Dashboard_Plan_v0.1
import { D1Database } from '@cloudflare/workers-types';

export interface ChzzkLiveItem {
  liveId: number | string;
  liveTitle: string;
  concurrentUserCount: number;
  openDate?: string;
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
 * 치지직 실시간 라이브 목록 수집 (인기순 다중 페이지)
 * api.chzzk.naver.com/service/v1/lives
 */
export async function fetchChzzkLiveList(maxCount: number = 100): Promise<ChzzkLiveItem[]> {
  const allLives: ChzzkLiveItem[] = [];
  let nextCursor: string | null = null;
  const pageSize = 50;

  try {
    while (allLives.length < maxCount) {
      let url = `https://api.chzzk.naver.com/service/v1/lives?sortType=POPULAR&size=${pageSize}`;
      if (nextCursor) {
        url += `&next=${encodeURIComponent(nextCursor)}`;
      }

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        console.warn(`[Chzzk Collector] API call returned HTTP ${res.status}`);
        break;
      }

      const json: any = await res.json();
      const items: ChzzkLiveItem[] = json?.content?.data || [];
      if (items.length === 0) break;

      allLives.push(...items);

      // 다음 페이지 커서
      const nextObj = json?.content?.page?.next;
      if (!nextObj) break;

      // 커서 파라미터 구성
      if (typeof nextObj === 'object') {
        nextCursor = JSON.stringify(nextObj);
      } else {
        nextCursor = String(nextObj);
      }

      if (items.length < pageSize) break;
    }

    return allLives;
  } catch (err) {
    console.error('[Chzzk Collector] Failed to fetch live list:', err);
    return allLives;
  }
}

/**
 * 치지직 카테고리 대분류 정규화
 */
export function categorizeChzzkContent(item: ChzzkLiveItem): { groupKey: string; groupName: string } {
  const catVal = (item.liveCategoryValue || '').trim().toLowerCase();
  const catType = (item.categoryType || '').toUpperCase();
  const title = (item.liveTitle || '').toLowerCase();

  // 1. 음악 / 노래
  if (catVal.includes('음악') || catVal.includes('노래') || catVal.includes('music') || title.includes('노래방') || title.includes('우타와쿠') || title.includes('singing')) {
    return { groupKey: 'MUSIC', groupName: '음악·노래' };
  }

  // 2. ASMR
  if (catVal.includes('asmr') || title.includes('asmr')) {
    return { groupKey: 'ASMR', groupName: 'ASMR' };
  }

  // 3. 그림 / 아트
  if (catVal.includes('그림') || catVal.includes('아트') || catVal.includes('art') || catVal.includes('일러스트') || catVal.includes('drawing')) {
    return { groupKey: 'ART', groupName: '그림·아트' };
  }

  // 4. 잡담 / 소통
  if (catVal.includes('talk') || catVal.includes('잡담') || catVal.includes('소통') || catVal.includes('일상') || catVal.includes('라디오') || catVal.includes('저챗') || catVal === '토크') {
    return { groupKey: 'TALK', groupName: '잡담·소통' };
  }

  // 5. 게임 (categoryType이 GAME이거나 명확한 게임 타이틀)
  if (catType === 'GAME' || (catVal && catVal !== '미분류' && catVal !== 'etc' && catVal !== '기타')) {
    return { groupKey: 'GAME', groupName: '게임' };
  }

  // 6. 미분류 / 기타
  if (!catVal || catVal === '미분류' || catVal === 'etc') {
    return { groupKey: 'UNCLASSIFIED', groupName: '미분류' };
  }

  return { groupKey: 'ETC', groupName: '기타' };
}


/**
 * 10분 주기 스냅샷 수집 및 D1 적재
 */
export async function collectChzzkLiveSnapshot(db: D1Database, clientId?: string, clientSecret?: string): Promise<{ collectedCount: number; vtuberMatchCount: number }> {
  const startedAt = new Date().toISOString();
  const snapshotAt = new Date().toISOString().replace(/:[0-9]{2}\..+/, ':00:00+09:00'); // 정규화 시각

  // 1. 치지직 실시간 라이브 목록 호출 (상위 100개)
  const lives = await fetchChzzkLiveList(100);
  if (!lives || lives.length === 0) {
    return { collectedCount: 0, vtuberMatchCount: 0 };
  }

  // 2. 등록된 버튜버 채널 목록 조회
  const verifiedChans = await db
    .prepare("SELECT id, channel_url, channel_name FROM streamerChannel WHERE platform = 'CHZZK'")
    .all();

  const channelMap = new Map<string, number>();
  for (const row of verifiedChans.results || []) {
    const url = String((row as any).channel_url || '');
    const segments = url.split('/').filter(Boolean);
    const cId = segments[segments.length - 1];
    if (cId) {
      channelMap.set(cId.toLowerCase(), Number((row as any).id));
    }
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
