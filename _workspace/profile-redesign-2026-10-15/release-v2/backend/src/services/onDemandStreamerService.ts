import type { StatisticsStreamer } from '../../../shared/statisticsStreamerSearch';
import { registerExternalStreamerToD1, normalizePlatformChannelUrl } from './externalPlatformSearchService';

const DEFAULT_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
};

interface ChzzkChannelDetail {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  followerCount?: number;
  openLive?: boolean;
  channelDescription?: string;
}

interface SoopStationDetail {
  station: {
    user_id: string;
    user_nick: string;
    station_logo: string;
    broad_start?: string;
  };
  broad?: {
    broad_no: number;
    broad_title: string;
  } | null;
}

/**
 * 1. 치지직 단일 채널 상세 정보 실시간 페칭 (단일 책임)
 */
async function fetchChzzkChannelInfo(channelId: string): Promise<ChzzkChannelDetail | null> {
  const url = `https://api.chzzk.naver.com/service/v1/channels/${encodeURIComponent(channelId)}`;
  try {
    const res = await fetch(url, {
      headers: { ...DEFAULT_FETCH_HEADERS, Referer: 'https://chzzk.naver.com/' },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const data = json?.content;
    if (!data?.channelId) return null;
    return {
      channelId: data.channelId,
      channelName: data.channelName,
      channelImageUrl: data.channelImageUrl || null,
      followerCount: data.followerCount,
      openLive: Boolean(data.openLive),
      channelDescription: data.channelDescription || '',
    };
  } catch (err) {
    console.warn(`[onDemandStreamerService] Chzzk channel fetch failed for ${channelId}:`, err);
    return null;
  }
}

/**
 * 2. SOOP 단일 방송국 정보 실시간 페칭 (단일 책임)
 */
async function fetchSoopStationInfo(userId: string): Promise<SoopStationDetail | null> {
  const url = `https://chapi.sooplive.co.kr/api/${encodeURIComponent(userId)}/station`;
  try {
    const res = await fetch(url, {
      headers: { ...DEFAULT_FETCH_HEADERS, Referer: 'https://www.sooplive.co.kr/' },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    if (!json?.station?.user_id) return null;
    return json as SoopStationDetail;
  } catch (err) {
    console.warn(`[onDemandStreamerService] SOOP station fetch failed for ${userId}:`, err);
    return null;
  }
}

/**
 * 3. 미등록 스트리머 확인 및 D1 자동 인입 보장 (Smart Fallback 핵심)
 * - 이미 등록되어 있다면 해당 스트리머 정보를 즉시 반환
 * - 등록되지 않았다면 플랫폼 공개 API로 실시간 조회 후 streamerChannel & streamerChannel_info에 자동 등록
 */
export async function ensureStreamerRegistered(
  db: D1Database,
  channelKey: string
): Promise<{
  success: boolean;
  streamer: StatisticsStreamer | null;
  isNewlyRegistered: boolean;
  message?: string;
}> {
  const colonIndex = channelKey.indexOf(':');
  if (colonIndex === -1) {
    return { success: false, streamer: null, isNewlyRegistered: false, message: '올바르지 않은 채널 키입니다.' };
  }

  const rawPlatform = channelKey.slice(0, colonIndex).toUpperCase();
  const rawId = channelKey.slice(colonIndex + 1).toLowerCase();

  if (rawPlatform !== 'CHZZK' && rawPlatform !== 'SOOP') {
    return { success: false, streamer: null, isNewlyRegistered: false, message: '지원하지 않는 플랫폼입니다.' };
  }

  const platform = rawPlatform as 'CHZZK' | 'SOOP';
  const defaultChannelUrl =
    platform === 'CHZZK'
      ? `https://chzzk.naver.com/${rawId}`
      : `https://www.sooplive.com/station/${rawId}`;

  // 1. 이미 등록되어 있는지 조회
  const cleanUrl = normalizePlatformChannelUrl(platform, defaultChannelUrl);
  let altUrl = cleanUrl;
  if (platform === 'SOOP') {
    altUrl = cleanUrl.includes('.com')
      ? cleanUrl.replace('.com', '.co.kr')
      : cleanUrl.replace('.co.kr', '.com');
  }

  const existing = await db
    .prepare(`
      SELECT c.id, c.platform, c.channel_url, c.channel_name,
             i.display_name, i.profile_image_url, i.slug
      FROM streamerChannel c
      LEFT JOIN streamerChannel_info i ON i.id = (SELECT MIN(id) FROM streamerChannel_info WHERE channel_id = c.id)
      WHERE c.platform = ? AND (c.channel_url = ? OR c.channel_url = ? OR c.channel_url = ?)
      LIMIT 1
    `)
    .bind(platform, cleanUrl, altUrl, defaultChannelUrl)
    .first<{
      id: number;
      platform: 'CHZZK' | 'SOOP';
      channel_url: string;
      channel_name: string;
      display_name: string | null;
      profile_image_url: string | null;
      slug: string | null;
    }>();

  if (existing) {
    return {
      success: true,
      isNewlyRegistered: false,
      streamer: {
        id: `registered:${existing.id}`,
        platform: existing.platform,
        channelKey: `${existing.platform}:${rawId}`,
        name: existing.display_name?.trim() || existing.channel_name,
        channelUrl: existing.channel_url,
        imageUrl: existing.profile_image_url,
        profileSlug: existing.slug,
        isRegistered: true,
      },
    };
  }

  // 2. 미등록 스트리머인 경우 플랫폼 실시간 공개 API로 정보 획득
  let streamerName = rawId;
  let imageUrl: string | null = null;
  let isLive = false;

  if (platform === 'CHZZK') {
    const chzzkData = await fetchChzzkChannelInfo(rawId);
    if (chzzkData) {
      streamerName = chzzkData.channelName || rawId;
      imageUrl = chzzkData.channelImageUrl;
      isLive = Boolean(chzzkData.openLive);
    }
  } else if (platform === 'SOOP') {
    const soopData = await fetchSoopStationInfo(rawId);
    if (soopData?.station) {
      streamerName = soopData.station.user_nick || rawId;
      let logo = soopData.station.station_logo;
      if (logo && logo.startsWith('//')) logo = 'https:' + logo;
      imageUrl = logo || null;
      isLive = Boolean(soopData.broad?.broad_no);
    }
  }

  // 3. D1에 신규 등록 (Smart Fallback 등록)
  const regResult = await registerExternalStreamerToD1(db, {
    platform,
    channelKey: `${platform}:${rawId}`,
    name: streamerName,
    channelUrl: defaultChannelUrl,
    imageUrl,
  });

  if (!regResult.success || !regResult.channelId) {
    console.warn(`[onDemandStreamerService] Auto-register failed for ${channelKey}:`, regResult.message);
    // 등록 실패하더라도 최소 정보 반환
    return {
      success: false,
      isNewlyRegistered: false,
      streamer: {
        id: `external:${platform.toLowerCase()}:${rawId}`,
        platform,
        channelKey: `${platform}:${rawId}`,
        name: streamerName,
        channelUrl: defaultChannelUrl,
        imageUrl,
        profileSlug: null,
        isRegistered: false,
        isLive,
      },
      message: regResult.message,
    };
  }

  return {
    success: true,
    isNewlyRegistered: true,
    streamer: {
      id: `registered:${regResult.channelId}`,
      platform,
      channelKey: `${platform}:${rawId}`,
      name: streamerName,
      channelUrl: defaultChannelUrl,
      imageUrl,
      profileSlug: regResult.slug || null,
      isRegistered: true,
      isLive,
    },
    message: '새로운 스트리머가 VDébut 모니터링 대상으로 자동 등록되었습니다.',
  };
}
