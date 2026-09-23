import type { StatisticsStreamer } from '../../../shared/statisticsStreamerSearch';
import { normalizeStreamerQuery } from '../../../shared/statisticsStreamerSearch';

export interface ExternalStreamerItem {
  id: string;
  platform: 'CHZZK' | 'SOOP';
  channelKey: string;
  name: string;
  channelUrl: string;
  imageUrl: string | null;
  profileSlug: string | null;
  isRegistered: boolean;
  isLive: boolean;
  followerCount?: number;
}

const DEFAULT_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
};

/**
 * 1. 네이버 치지직 공개 채널 검색 API 호출 전용 함수 (단일 책임)
 */
export async function searchChzzkChannels(query: string, limit: number = 6): Promise<ExternalStreamerItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://api.chzzk.naver.com/service/v1/search/channels?keyword=${encodeURIComponent(trimmed)}&offset=0&size=${limit}`;

  try {
    const res = await fetch(url, {
      headers: {
        ...DEFAULT_FETCH_HEADERS,
        'Referer': 'https://chzzk.naver.com/',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return [];

    const json = await res.json() as any;
    const items = json?.content?.data || [];

    return items.map((item: any) => {
      const channel = item.channel;
      const channelId = channel.channelId;
      return {
        id: `external:chzzk:${channelId}`,
        platform: 'CHZZK' as const,
        channelKey: `CHZZK:${channelId.toLowerCase()}`,
        name: channel.channelName || trimmed,
        channelUrl: `https://chzzk.naver.com/${channelId}`,
        imageUrl: channel.channelImageUrl || null,
        profileSlug: null,
        isRegistered: false,
        isLive: Boolean(channel.openLive),
        followerCount: typeof channel.followerCount === 'number' ? channel.followerCount : undefined,
      };
    });
  } catch (err) {
    // 외부 API 지연/오류 시 장애 전파 방지 (격리)
    console.warn('[searchChzzkChannels] external search failed or timed out:', err);
    return [];
  }
}

/**
 * 2. SOOP(구 아프리카TV) 공개 BJ 검색 API 호출 전용 함수 (단일 책임)
 */
export async function searchSoopChannels(query: string, limit: number = 6): Promise<ExternalStreamerItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://sch.sooplive.co.kr/api.php?m=bjSearch&szKeyword=${encodeURIComponent(trimmed)}&v=1.0&sz=${limit}&page=1`;

  try {
    const res = await fetch(url, {
      headers: {
        ...DEFAULT_FETCH_HEADERS,
        'Referer': 'https://www.sooplive.co.kr/',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return [];

    const json = await res.json() as any;
    const items = json?.DATA || [];

    return items.map((item: any) => {
      const userId = item.user_id;
      let logo = item.station_logo || null;
      if (logo && logo.startsWith('//')) {
        logo = 'https:' + logo;
      }

      return {
        id: `external:soop:${userId}`,
        platform: 'SOOP' as const,
        channelKey: `SOOP:${userId.toLowerCase()}`,
        name: item.user_nick || userId,
        channelUrl: `https://www.sooplive.com/station/${userId}`,
        imageUrl: logo,
        profileSlug: null,
        isRegistered: false,
        isLive: item.is_broad === 'Y' || Boolean(item.broad_no),
      };
    });
  } catch (err) {
    console.warn('[searchSoopChannels] external search failed or timed out:', err);
    return [];
  }
}

/**
 * 3. 외부 스트리밍 플랫폼(치지직, SOOP) 실시간 병렬 검색 및 정규화 (단일 책임)
 */
export async function searchExternalPlatforms(query: string, limitPerPlatform: number = 5): Promise<ExternalStreamerItem[]> {
  const normalized = normalizeStreamerQuery(query);
  if (!normalized) return [];

  const [chzzkResult, soopResult] = await Promise.allSettled([
    searchChzzkChannels(query, limitPerPlatform),
    searchSoopChannels(query, limitPerPlatform),
  ]);

  const chzzkItems = chzzkResult.status === 'fulfilled' ? chzzkResult.value : [];
  const soopItems = soopResult.status === 'fulfilled' ? soopResult.value : [];

  return [...chzzkItems, ...soopItems];
}

/**
 * 4. 슬러그 영문 안전 문자열 생성 헬퍼 (단일 책임)
 */
function createSafeSlug(platform: string, name: string, fallbackKey: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30);

  if (base && base.length >= 2) {
    return `${base}-${platform.toLowerCase()}`;
  }
  return `streamer-${fallbackKey.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 20)}`;
}

/**
 * 플랫폼별 채널 URL을 표준 포맷으로 정규화하는 전용 함수 (단일 책임)
 */
export function normalizePlatformChannelUrl(platform: 'CHZZK' | 'SOOP', rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (platform === 'CHZZK') {
    const match = trimmed.match(/chzzk\.naver\.com\/(?:live\/)?([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://chzzk.naver.com/${match[1]}`;
    }
    return trimmed;
  }
  if (platform === 'SOOP') {
    const match = trimmed.match(/sooplive\.(?:co\.kr|com)\/(?:station\/)?([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.sooplive.com/station/${match[1]}`;
    }
    return trimmed;
  }
  return trimmed;
}

/**
 * 5. 외부 검색 스트리머를 VDébut D1 데이터베이스에 안전하게 자동 등록하는 전용 함수 (단일 책임)
 */
export async function registerExternalStreamerToD1(
  db: D1Database,
  item: {
    platform: 'CHZZK' | 'SOOP';
    channelKey: string;
    name: string;
    channelUrl: string;
    imageUrl?: string | null;
  }
): Promise<{ success: boolean; channelId?: number; slug?: string; message?: string }> {
  try {
    const safeName = item.name.trim();
    const cleanUrl = normalizePlatformChannelUrl(item.platform, item.channelUrl);

    // SOOP의 경우 .com과 .co.kr 도메인 변형 모두 감지
    let altUrl = cleanUrl;
    if (item.platform === 'SOOP') {
      altUrl = cleanUrl.includes('.com')
        ? cleanUrl.replace('.com', '.co.kr')
        : cleanUrl.replace('.co.kr', '.com');
    }

    // 1. 이미 존재하는 채널인지 확인 (도메인 변형 및 원본 URL 포함)
    const existing = await db
      .prepare('SELECT id, platform, channel_url, channel_name FROM streamerChannel WHERE platform = ? AND (channel_url = ? OR channel_url = ? OR channel_url = ?) LIMIT 1')
      .bind(item.platform, cleanUrl, altUrl, item.channelUrl.trim())
      .first<{ id: number; platform: string; channel_url: string; channel_name: string }>();

    if (existing) {
      // 이미 등록되어 있다면 해당 채널 정보 반환
      const info = await db
        .prepare('SELECT slug FROM streamerChannel_info WHERE channel_id = ? LIMIT 1')
        .bind(existing.id)
        .first<{ slug: string }>();

      return {
        success: true,
        channelId: existing.id,
        slug: info?.slug || undefined,
        message: '이미 등록된 스트리머 채널입니다.',
      };
    }

    // 2. 신규 채널 등록 (streamerChannel)
    const channelInsert = await db
      .prepare('INSERT INTO streamerChannel (platform, channel_url, channel_name) VALUES (?, ?, ?)')
      .bind(item.platform, cleanUrl, safeName)
      .run();

    const newChannelId = channelInsert.meta.last_row_id;
    if (!newChannelId) {
      throw new Error('채널 ID 생성에 실패했습니다.');
    }

    // 3. 고유 슬러그 생성 및 중복 확인
    let slug = createSafeSlug(item.platform, safeName, String(newChannelId));
    const slugExists = await db
      .prepare('SELECT id FROM streamerChannel_info WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first();

    if (slugExists) {
      slug = `${slug}-${newChannelId}`;
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    const nowUtc = new Date().toISOString();

    // 4. 세부 정보 등록 (streamerChannel_info)
    await db
      .prepare(`
        INSERT INTO streamerChannel_info (
          channel_id, slug, display_name, profile_image_url, description,
          agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
        ) VALUES (?, ?, ?, ?, ?, '개인세', ?, '00:00', 'Asia/Seoul', ?, 'KR')
      `)
      .bind(
        newChannelId,
        slug,
        safeName,
        item.imageUrl || '',
        `${safeName} 스트리머의 채널입니다.`,
        todayDate,
        nowUtc
      )
      .run();

    return {
      success: true,
      channelId: newChannelId,
      slug,
      message: '새로운 스트리머 채널이 성공적으로 등록되었습니다.',
    };
  } catch (err: any) {
    console.error('[registerExternalStreamerToD1] error:', err);
    return {
      success: false,
      message: err?.message || '스트리머 등록 중 오류가 발생했습니다.',
    };
  }
}
