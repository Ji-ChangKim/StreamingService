// SOOP Live Data Collector & Aggregator
import { D1Database } from '@cloudflare/workers-types';

export interface SoopLiveItem {
  userId: string;
  channelName: string;
  channelId: number;
  broadNo: number;
  liveTitle: string;
  viewerCount: number;
  categoryNo: number;
  categoryName: string;
  channelUrl: string;
}

/**
 * SOOP 채널 URL에서 userId 추출
 */
export function extractSoopUserId(channelUrl: string): string | null {
  try {
    const url = channelUrl.trim();
    if (url.includes('/station/')) {
      const parts = url.split('/station/');
      return parts[1]?.split('?')[0]?.split('/')[0]?.trim() || null;
    }
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

/**
 * SOOP 카테고리 번호/이름 대분류 정규화
 */
export function categorizeSoopContent(item: SoopLiveItem): { groupKey: string; groupName: string } {
  const catNo = item.categoryNo;
  const title = item.liveTitle.toLowerCase();

  // 음악 / 노래
  if (title.includes('노래') || title.includes('음악') || title.includes('우타와쿠') || title.includes('sing') || catNo === 40005) {
    return { groupKey: 'MUSIC', groupName: '음악·노래' };
  }

  // ASMR
  if (title.includes('asmr')) {
    return { groupKey: 'ASMR', groupName: 'ASMR' };
  }

  // 그림 / 아트
  if (title.includes('그림') || title.includes('아트') || title.includes('일러스트') || title.includes('웹툰')) {
    return { groupKey: 'ART', groupName: '그림·아트' };
  }

  // 잡담 / 소통
  if (title.includes('소통') || title.includes('잡담') || title.includes('토크') || title.includes('저챗') || title.includes('라디오') || catNo === 40006) {
    return { groupKey: 'TALK', groupName: '잡담·소통' };
  }

  // 기본적으로 게임 카테고리 번호이거나 일반 방송
  return { groupKey: 'GAME', groupName: '게임' };
}

/**
 * 단일 SOOP 방송국 실시간 방송 상태 조회
 */
export async function fetchSingleSoopStation(userId: string): Promise<{ isLive: boolean; broad?: any; stationName?: string } | null> {
  try {
    const apiUrl = `https://chapi.sooplive.co.kr/api/${encodeURIComponent(userId)}/station`;
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return null;
    const json: any = await res.json();
    if (json && json.broad && json.broad.broad_no) {
      return {
        isLive: true,
        broad: json.broad,
        stationName: json.station?.station_name || json.station?.user_nick || userId,
      };
    }
    return { isLive: false, stationName: json?.station?.station_name || userId };
  } catch (err) {
    return null;
  }
}

/**
 * 등록된 SOOP 버튜버 실시간 방송 목록 일괄 수집
 */
export async function fetchRegisteredSoopLives(db: D1Database, batchLimit: number = 40): Promise<SoopLiveItem[]> {
  const lives: SoopLiveItem[] = [];

  try {
    const { results } = await db
      .prepare("SELECT id, channel_name, channel_url FROM streamerChannel WHERE platform = 'SOOP' LIMIT ?")
      .bind(batchLimit)
      .all();

    if (!results || results.length === 0) return lives;

    // 병렬로 8개씩 청크 처리
    const chunkSize = 8;
    for (let i = 0; i < results.length; i += chunkSize) {
      const chunk = results.slice(i, i + chunkSize);
      const promises = chunk.map(async (row: any) => {
        const uId = extractSoopUserId(String(row.channel_url || ''));
        if (!uId) return null;

        const info = await fetchSingleSoopStation(uId);
        if (info && info.isLive && info.broad) {
          const b = info.broad;
          const liveItem: SoopLiveItem = {
            userId: uId,
            channelName: info.stationName || String(row.channel_name || uId),
            channelId: Number(row.id),
            broadNo: Number(b.broad_no),
            liveTitle: String(b.broad_title || ''),
            viewerCount: Number(b.current_sum_viewer || 0),
            categoryNo: Number(b.broad_cate_no || 0),
            categoryName: getSoopCategoryName(Number(b.broad_cate_no || 0)),
            channelUrl: String(row.channel_url),
          };
          return liveItem;
        }
        return null;
      });

      const chunkResults = await Promise.all(promises);
      for (const item of chunkResults) {
        if (item) lives.push(item);
      }
    }

    return lives;
  } catch (err) {
    console.error('[SOOP Collector] Error fetching registered SOOP lives:', err);
    return lives;
  }
}

/**
 * SOOP 대표 카테고리 코드 매핑
 */
function getSoopCategoryName(cateNo: number): string {
  switch (cateNo) {
    case 40017: return '마인크래프트';
    case 40001: return '리그 오브 레전드';
    case 40002: return '스타크래프트';
    case 40003: return '배틀그라운드';
    case 40004: return '종합게임';
    case 40005: return '음악·노래';
    case 40006: return '보이는 라디오';
    case 40007: return '토크·캠방';
    default: return '종합게임';
  }
}
