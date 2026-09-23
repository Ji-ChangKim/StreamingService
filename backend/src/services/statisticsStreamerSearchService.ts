import type { StatisticsStreamer, StatisticsStreamerSearchResponse } from '../../../shared/statisticsStreamerSearch';
import { normalizeStreamerQuery } from '../../../shared/statisticsStreamerSearch';
import { searchExternalPlatforms } from './externalPlatformSearchService';

interface StreamerSearchRow {
  id: number;
  platform: 'CHZZK' | 'SOOP';
  channel_name: string;
  channel_url: string | null;
  display_name: string | null;
  profile_image_url: string | null;
  slug: string | null;
}

// 플랫폼 채널 주소로 현재 방송과 등록 채널을 연결한다.
function registeredChannelKey(platform: 'CHZZK' | 'SOOP', value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    if (platform === 'CHZZK' && url.hostname === 'chzzk.naver.com') {
      const id = parts[0] === 'live' ? parts[1] : parts[0];
      return id && /^[a-f0-9]{32}$/i.test(id) ? `CHZZK:${id.toLowerCase()}` : null;
    }
    if (platform === 'SOOP' && /(^|\.)(sooplive\.(co\.kr|com)|afreecatv\.com)$/.test(url.hostname)) {
      const id = parts[0] === 'station' ? parts[1] : parts[0];
      return id && /^[a-z0-9_]+$/i.test(id) ? `SOOP:${id.toLowerCase()}` : null;
    }
    return null;
  } catch { return null; }
}

// 공개 일정과 프로필에서 사용하는 채널 정보만 검색 응답으로 반환한다.
function toStreamer(row: StreamerSearchRow): StatisticsStreamer {
  return {
    id: `registered:${row.id}`,
    platform: row.platform,
    channelKey: registeredChannelKey(row.platform, row.channel_url),
    name: row.display_name?.trim() || row.channel_name,
    channelUrl: row.channel_url,
    imageUrl: row.profile_image_url,
    profileSlug: row.slug,
    isRegistered: true,
  };
}

/**
 * 등록 채널 D1 검색과 플랫폼 실시간 검색(치지직, SOOP)을 통합 조회한다.
 */
export async function searchStatisticsStreamers(
  db: D1Database,
  input: string,
  includeExternal: boolean = true
): Promise<StatisticsStreamerSearchResponse> {
  const query = normalizeStreamerQuery(input);
  if (!query) return { query: '', streamers: [], hasMore: false };

  // 1. VDébut D1 로컬 DB 등록 스트리머 검색
  const dbPromise = db.prepare(`SELECT c.id, c.platform, c.channel_name, c.channel_url,
    i.display_name, i.profile_image_url, i.slug
    FROM streamerChannel c
    LEFT JOIN streamerChannel_info i ON i.id = (SELECT MIN(id) FROM streamerChannel_info WHERE channel_id = c.id)
    WHERE c.platform IN ('CHZZK', 'SOOP') AND (
      INSTR(LOWER(REPLACE(COALESCE(c.channel_name, ''), ' ', '')), ?1) > 0 OR
      INSTR(LOWER(REPLACE(COALESCE(i.display_name, ''), ' ', '')), ?1) > 0)
    ORDER BY CASE WHEN LOWER(REPLACE(COALESCE(i.display_name, c.channel_name), ' ', '')) = ?1 THEN 0 ELSE 1 END,
      COALESCE(i.display_name, c.channel_name) COLLATE NOCASE, c.id
    LIMIT 21`).bind(query).all<StreamerSearchRow>();

  // 2. 외부 플랫폼 실시간 검색 병렬 수행
  const externalPromise = includeExternal
    ? searchExternalPlatforms(input, 5)
    : Promise.resolve([]);

  const [dbResult, externalItems] = await Promise.all([
    dbPromise.catch((err) => {
      console.error('[searchStatisticsStreamers] DB search error:', err);
      return { results: [] };
    }),
    externalPromise.catch((err) => {
      console.warn('[searchStatisticsStreamers] External search error:', err);
      return [];
    }),
  ]);

  const registeredStreamers = (dbResult.results || []).map(toStreamer);

  // 3. 중복 방지 매핑 (channelKey 또는 channelUrl 기준)
  const map = new Map<string, StatisticsStreamer>();

  for (const s of registeredStreamers) {
    const key = s.channelKey || s.channelUrl || s.id;
    map.set(key, s);
  }

  // 외부 플랫폼 검색 결과를 결합 (이미 등록된 채널은 제외)
  for (const ext of externalItems) {
    const key = ext.channelKey || ext.channelUrl || ext.id;
    if (!map.has(key)) {
      map.set(key, {
        id: ext.id,
        platform: ext.platform,
        channelKey: ext.channelKey,
        name: ext.name,
        channelUrl: ext.channelUrl,
        imageUrl: ext.imageUrl,
        profileSlug: null,
        isRegistered: false,
        isLive: ext.isLive,
        followerCount: ext.followerCount,
      });
    }
  }

  const allStreamers = Array.from(map.values());

  // 4. 지능형 정렬: 완전 일치 > VDébut 등록 채널 > 현재 LIVE > 가나다순
  allStreamers.sort((a, b) => {
    const aExact = normalizeStreamerQuery(a.name) === query;
    const bExact = normalizeStreamerQuery(b.name) === query;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // VDébut 등록 스트리머 우선
    if (a.isRegistered && !b.isRegistered) return -1;
    if (!a.isRegistered && b.isRegistered) return 1;

    // 현재 LIVE 스트리머 우선
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;

    return a.name.localeCompare(b.name, 'ko');
  });

  const limit = 25;
  return {
    query,
    streamers: allStreamers.slice(0, limit),
    hasMore: allStreamers.length > limit,
  };
}
