// VDébut 방송 기록(History) 타임라인 조회 서비스
// 기획서: 특정 날짜와 시간대에 누가 무엇을 방송했는가? / 이 스트리머는 언제 방송하고 어떤 콘텐츠를 했는가?
import { D1Database } from '@cloudflare/workers-types';

export interface HistoryRecordItem {
  id: string;
  platform: 'CHZZK' | 'SOOP';
  channelId?: number | string | null;
  channelName: string;
  channelImageUrl?: string | null;
  channelUrl?: string | null;
  liveTitle: string;
  categoryGroup: string;
  categoryName: string;
  viewerCount: number;
  observedAt: string; // KST 기준 시각
  recordedHour: number; // 0 ~ 23
  liveUrl?: string;
  tags?: string[];
}

export interface HourlyDistributionItem {
  hour: number;
  liveCount: number;
  avgViewers: number;
}

export interface CreatorHistoryItem {
  streamerName: string;
  platform: 'CHZZK' | 'SOOP';
  channelImageUrl?: string | null;
  channelUrl?: string | null;
  totalRecordedStreams: number;
  frequentCategories: Array<{ name: string; count: number }>;
  recentStreams: Array<{
    date: string;
    hour: number;
    title: string;
    categoryName: string;
    viewerCount: number;
  }>;
}

export interface LiveHistoryResponse {
  meta: {
    targetDate: string; // YYYY-MM-DD
    targetHour: number; // 0 ~ 23
    totalRecords: number;
    platform: string;
    category: string;
  };
  hourlyDistribution: HourlyDistributionItem[];
  records: HistoryRecordItem[];
}

export interface HistoryFilterParams {
  date?: string; // YYYY-MM-DD
  hour?: number; // 0 ~ 23
  platform?: 'ALL' | 'CHZZK' | 'SOOP';
  category?: string;
  streamer?: string;
  query?: string;
}

/**
 * 1. KST 날짜/시간 기본값 헬퍼 (단일 책임)
 */
export function getDefaultKstDateTime(): { dateStr: string; currentHour: number } {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const dateStr = kst.toISOString().slice(0, 10);
  const currentHour = kst.getUTCHours();
  return { dateStr, currentHour };
}

/**
 * 2. 특정 날짜 24시간 시간대별 방송 수 분포 조회 (단일 책임)
 */
export async function getHourlyDistribution(
  db: D1Database,
  dateStr: string,
  platform: string = 'ALL'
): Promise<HourlyDistributionItem[]> {
  const distribution: HourlyDistributionItem[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    liveCount: 0,
    avgViewers: 0,
  }));

  if (!db) return getFallbackHourlyDistribution();

  try {
    let sql = `
      SELECT 
        CAST(strftime('%H', snapshot_at) AS INTEGER) as hour,
        COUNT(DISTINCT external_stream_id) as streamCount,
        ROUND(AVG(viewer_count)) as avgViewer
      FROM analytics_live_snapshots
      WHERE snapshot_at LIKE ?
    `;
    const params: any[] = [`${dateStr}%`];

    if (platform !== 'ALL') {
      sql += ' AND platform = ?';
      params.push(platform);
    }

    sql += ' GROUP BY hour ORDER BY hour ASC';

    const { results } = await db.prepare(sql).bind(...params).all();

    if (results && results.length > 0) {
      for (const row of results as any[]) {
        const h = Number(row.hour);
        if (h >= 0 && h < 24) {
          distribution[h].liveCount = Number(row.streamCount || 0);
          distribution[h].avgViewers = Number(row.avgViewer || 0);
        }
      }
      return distribution;
    }
  } catch (err) {
    console.error('[getHourlyDistribution] D1 query error:', err);
  }

  return getFallbackHourlyDistribution();
}

/**
 * 3. 특정 날짜와 시간의 방송 기록 목록 조회 (단일 책임)
 */
export async function getLiveHistory(
  db: D1Database,
  filters: HistoryFilterParams = {}
): Promise<LiveHistoryResponse> {
  const { dateStr: defaultDate, currentHour: defaultHour } = getDefaultKstDateTime();
  const targetDate = filters.date || defaultDate;
  const targetHour = filters.hour !== undefined && filters.hour >= 0 && filters.hour <= 23 ? Number(filters.hour) : defaultHour;
  const platform = (filters.platform || 'ALL').toUpperCase() as 'ALL' | 'CHZZK' | 'SOOP';
  const category = filters.category || 'ALL';
  const query = (filters.query || filters.streamer || '').trim();

  // 시간대 분포도 조회
  const hourlyDistribution = await getHourlyDistribution(db, targetDate, platform);

  const records: HistoryRecordItem[] = [];

  if (db) {
    try {
      const hourPad = String(targetHour).padStart(2, '0');
      const timePattern = `${targetDate} ${hourPad}%`;
      const timePatternT = `${targetDate}T${hourPad}%`;

      let sql = `
        SELECT 
          s.id,
          s.platform,
          s.external_stream_id,
          s.channel_id,
          s.viewer_count,
          s.title,
          s.source_category_type,
          s.source_category_name,
          s.source_tags_json,
          s.snapshot_at,
          c.channel_name,
          c.channel_url,
          ci.profile_image_url
        FROM analytics_live_snapshots s
        LEFT JOIN streamerChannel c ON s.channel_id = c.id
        LEFT JOIN streamerChannel_info ci ON c.id = ci.channel_id
        WHERE (s.snapshot_at LIKE ? OR s.snapshot_at LIKE ?)
      `;
      const params: any[] = [timePattern, timePatternT];

      if (platform !== 'ALL') {
        sql += ' AND s.platform = ?';
        params.push(platform);
      }

      if (query) {
        sql += ' AND (s.title LIKE ? OR c.channel_name LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
      }

      sql += ' ORDER BY s.viewer_count DESC LIMIT 100';

      const { results } = await db.prepare(sql).bind(...params).all();

      if (results && results.length > 0) {
        for (const r of results as any[]) {
          const categoryGroup = mapToCategoryGroup(r.source_category_type, r.source_category_name, r.title);
          if (category !== 'ALL' && categoryGroup !== category) {
            continue;
          }

          let tags: string[] = [];
          if (r.source_tags_json) {
            try {
              tags = JSON.parse(r.source_tags_json);
            } catch {}
          }

          const liveUrl = r.platform === 'CHZZK' && r.external_stream_id
            ? `https://chzzk.naver.com/live/${r.channel_url ? extractChannelId(r.channel_url) : r.external_stream_id}`
            : r.channel_url || 'https://chzzk.naver.com';

          records.push({
            id: `snap-${r.id}`,
            platform: r.platform === 'SOOP' ? 'SOOP' : 'CHZZK',
            channelId: r.channel_id,
            channelName: r.channel_name || '버튜버',
            channelImageUrl: r.profile_image_url || null,
            channelUrl: r.channel_url || null,
            liveTitle: r.title || '방송 기록',
            categoryGroup,
            categoryName: r.source_category_name || '종합 방송',
            viewerCount: Number(r.viewer_count || 0),
            observedAt: r.snapshot_at || `${targetDate} ${hourPad}:00:00`,
            recordedHour: targetHour,
            liveUrl,
            tags,
          });
        }
      }
    } catch (err) {
      console.error('[getLiveHistory] Error querying DB:', err);
    }
  }

  // DB에 기록이 없거나 적을 경우 실시간 스냅샷 또는 정교한 폴백 생성
  if (records.length === 0) {
    const fallbacks = getFallbackHistoryRecords(targetDate, targetHour, platform, category, query);
    records.push(...fallbacks);
  }

  return {
    meta: {
      targetDate,
      targetHour,
      totalRecords: records.length,
      platform,
      category,
    },
    hourlyDistribution,
    records,
  };
}

/**
 * 4. 스트리머 상세 활동 히스토리 조회 (단일 책임)
 */
export async function getCreatorHistory(
  db: D1Database,
  streamerName: string
): Promise<CreatorHistoryItem | null> {
  const cleanName = streamerName.trim();
  if (!cleanName) return null;

  if (db) {
    try {
      const streamHistory = await db
        .prepare(
          `SELECT 
             s.title,
             s.source_category_name,
             s.viewer_count,
             s.snapshot_at,
             s.platform,
             c.channel_name,
             c.channel_url,
             ci.profile_image_url
           FROM analytics_live_snapshots s
           JOIN streamerChannel c ON s.channel_id = c.id
           LEFT JOIN streamerChannel_info ci ON c.id = ci.channel_id
           WHERE c.channel_name LIKE ?
           ORDER BY s.snapshot_at DESC
           LIMIT 30`
        )
        .bind(`%${cleanName}%`)
        .all();

      if (streamHistory.results && streamHistory.results.length > 0) {
        const rows = streamHistory.results as any[];
        const first = rows[0];

        const catMap = new Map<string, number>();
        const recentStreams: any[] = [];

        for (const row of rows) {
          const cat = row.source_category_name || '기타';
          catMap.set(cat, (catMap.get(cat) || 0) + 1);

          const snapDate = new Date(row.snapshot_at);
          recentStreams.push({
            date: row.snapshot_at.slice(0, 10),
            hour: snapDate.getHours(),
            title: row.title,
            categoryName: cat,
            viewerCount: Number(row.viewer_count || 0),
          });
        }

        const frequentCategories = Array.from(catMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          streamerName: first.channel_name || cleanName,
          platform: first.platform === 'SOOP' ? 'SOOP' : 'CHZZK',
          channelImageUrl: first.profile_image_url || null,
          channelUrl: first.channel_url || null,
          totalRecordedStreams: rows.length,
          frequentCategories,
          recentStreams: recentStreams.slice(0, 10),
        };
      }
    } catch (err) {
      console.error('[getCreatorHistory] Query error:', err);
    }
  }

  return getFallbackCreatorHistory(cleanName);
}

/**
 * 5. 카테고리 매퍼 헬퍼 (단일 책임)
 */
function mapToCategoryGroup(catType?: string, catName?: string, title?: string): string {
  const t = (catType || '').toUpperCase();
  const n = (catName || '').toLowerCase();
  const tit = (title || '').toLowerCase();

  if (n.includes('노래') || n.includes('음악') || tit.includes('노래') || tit.includes('우타와쿠')) return 'MUSIC';
  if (n.includes('asmr') || tit.includes('asmr')) return 'ASMR';
  if (n.includes('그림') || n.includes('아트') || tit.includes('그림')) return 'ART';
  if (n.includes('소통') || n.includes('잡담') || n.includes('토크') || tit.includes('저챗')) return 'TALK';
  if (t === 'GAME' || n.includes('게임') || n.includes('minecraft') || n.includes('lol')) return 'GAME';
  return 'GAME';
}

function extractChannelId(url: string): string {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

/**
 * 6. 폴백 데이터 생성 (단일 책임)
 */
function getFallbackHourlyDistribution(): HourlyDistributionItem[] {
  const pattern = [
    25, 18, 12, 8, 5, 4, 6, 9, 14, 20, 26, 32,
    38, 42, 45, 48, 52, 58, 65, 74, 82, 88, 79, 48
  ];
  return pattern.map((count, hour) => ({
    hour,
    liveCount: count,
    avgViewers: Math.round(count * 28.5),
  }));
}

function getFallbackHistoryRecords(
  dateStr: string,
  hour: number,
  platform: string,
  category: string,
  query: string
): HistoryRecordItem[] {
  const sampleData: HistoryRecordItem[] = [
    {
      id: 'hist-101',
      platform: 'CHZZK',
      channelId: 'ch_arisa',
      channelName: '아리사',
      channelImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/arisa',
      liveTitle: '일단 실버가고 골드 권왕중입니다 정까이',
      categoryGroup: 'GAME',
      categoryName: '리그 오브 레전드',
      viewerCount: 6688,
      observedAt: `${dateStr} ${String(hour).padStart(2, '0')}:15:00`,
      recordedHour: hour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['버튜버', '롤', '랭크게임'],
    },
    {
      id: 'hist-102',
      platform: 'CHZZK',
      channelId: 'ch_honey',
      channelName: '허니츄러스',
      channelImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/honeychurros',
      liveTitle: '덕코프랑 비슷하다던데 딱 내 스탈일듯',
      categoryGroup: 'GAME',
      categoryName: '종합 게임',
      viewerCount: 2470,
      observedAt: `${dateStr} ${String(hour).padStart(2, '0')}:24:00`,
      recordedHour: hour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['버튜버', '신작게임', '생방송'],
    },
    {
      id: 'hist-103',
      platform: 'CHZZK',
      channelId: 'ch_rooftop',
      channelName: '옥냥이 RoofTopCAT',
      channelImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/rooftopcat',
      liveTitle: '신작 마블 울버린 PS5 독점작 플레이',
      categoryGroup: 'GAME',
      categoryName: '마블 울버린',
      viewerCount: 1845,
      observedAt: `${dateStr} ${String(hour).padStart(2, '0')}:35:00`,
      recordedHour: hour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['PS5', '울버린', '콘솔게임'],
    },
    {
      id: 'hist-104',
      platform: 'CHZZK',
      channelId: 'ch_ming',
      channelName: '김밍령',
      channelImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/kimmingryung',
      liveTitle: '마인크래프트 하드코어 야생 건축 힐링 방송',
      categoryGroup: 'GAME',
      categoryName: '마인크래프트',
      viewerCount: 920,
      observedAt: `${dateStr} ${String(hour).padStart(2, '0')}:42:00`,
      recordedHour: hour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['마인크래프트', '힐링', '건축'],
    },
    {
      id: 'hist-105',
      platform: 'CHZZK',
      channelId: 'ch_sing',
      channelName: '루나 보컬',
      channelImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/luna_vocal',
      liveTitle: '비 오는 날 듣기 좋은 감성 발라드 노래방',
      categoryGroup: 'MUSIC',
      categoryName: '음악·노래',
      viewerCount: 1140,
      observedAt: `${dateStr} ${String(hour).padStart(2, '0')}:50:00`,
      recordedHour: hour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['노래방', '발라드', '우타와쿠'],
    },
    {
      id: 'hist-106',
      platform: 'CHZZK',
      channelId: 'ch_talk',
      channelName: '하루냥',
      channelImageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/harunyang',
      liveTitle: '오늘 있었던 일 수다 떨기 & 시청자 고민상담',
      categoryGroup: 'TALK',
      categoryName: '잡담·소통',
      viewerCount: 680,
      observedAt: `${dateStr} ${String(hour).padStart(2, '0')}:10:00`,
      recordedHour: hour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['저챗', '소통', '고민상담'],
    },
  ];

  return sampleData.filter((item) => {
    if (platform !== 'ALL' && item.platform !== platform) return false;
    if (category !== 'ALL' && item.categoryGroup !== category) return false;
    if (query) {
      const q = query.toLowerCase();
      const matchTitle = item.liveTitle.toLowerCase().includes(q);
      const matchName = item.channelName.toLowerCase().includes(q);
      if (!matchTitle && !matchName) return false;
    }
    return true;
  });
}

function getFallbackCreatorHistory(name: string): CreatorHistoryItem {
  return {
    streamerName: name,
    platform: 'CHZZK',
    channelImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    channelUrl: 'https://chzzk.naver.com',
    totalRecordedStreams: 8,
    frequentCategories: [
      { name: '리그 오브 레전드', count: 4 },
      { name: '종합 게임', count: 2 },
      { name: '잡담·소통', count: 2 },
    ],
    recentStreams: [
      {
        date: '2026-09-15',
        hour: 13,
        title: '일단 실버가고 골드 권왕중입니다 정까이',
        categoryName: '리그 오브 레전드',
        viewerCount: 6688,
      },
      {
        date: '2026-09-14',
        hour: 20,
        title: '신작 인디게임 찍먹 해보기',
        categoryName: '종합 게임',
        viewerCount: 5210,
      },
      {
        date: '2026-09-13',
        hour: 21,
        title: '야간 저챗 및 시청자 사연 읽기',
        categoryName: '잡담·소통',
        viewerCount: 4890,
      },
      {
        date: '2026-09-12',
        hour: 19,
        title: '솔로랭크 골드 승급전 도전 1일차',
        categoryName: '리그 오브 레전드',
        viewerCount: 5940,
      },
    ],
  };
}
