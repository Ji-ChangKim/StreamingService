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
  includeExternal: boolean = true,
  platform: 'ALL' | 'CHZZK' | 'SOOP' = 'ALL'
): Promise<StatisticsStreamerSearchResponse> {
  const query = normalizeStreamerQuery(input);
  if (!query) return { query: '', streamers: [], hasMore: false };

  // 1. VDébut D1 로컬 DB 등록 스트리머 검색
  const dbPromise = db.prepare(`SELECT c.id, c.platform, c.channel_name, c.channel_url,
    i.display_name, i.profile_image_url, i.slug
    FROM streamerChannel c
    LEFT JOIN streamerChannel_info i ON i.id = (SELECT MIN(id) FROM streamerChannel_info WHERE channel_id = c.id)
    WHERE c.platform IN ('CHZZK', 'SOOP') AND (?2 = 'ALL' OR c.platform = ?2) AND (
      INSTR(LOWER(REPLACE(COALESCE(c.channel_name, ''), ' ', '')), ?1) > 0 OR
      INSTR(LOWER(REPLACE(COALESCE(i.display_name, ''), ' ', '')), ?1) > 0)
    ORDER BY CASE WHEN LOWER(REPLACE(COALESCE(i.display_name, c.channel_name), ' ', '')) = ?1 THEN 0 ELSE 1 END,
      COALESCE(i.display_name, c.channel_name) COLLATE NOCASE, c.id
    LIMIT 26`).bind(query, platform).all<StreamerSearchRow>();

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
    if (platform !== 'ALL' && ext.platform !== platform) continue;
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

  // 4. 방송 통계 기록: 최근 30일 정각 회차에 잡힌 방송 수를 붙인다(검색 결과에서 '조회 내역'이 있는 채널을 앞에).
  const keys = [...new Set(allStreamers.map((s) => s.channelKey).filter((k): k is string => Boolean(k)))].slice(0, 60);
  if (keys.length) {
    try {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const rows = await db.prepare(`SELECT s.channel_key AS channelKey, COUNT(DISTINCT s.stream_id) AS broadcasts
        FROM analytics_broadcast_runs r JOIN analytics_broadcast_snapshots s ON s.run_id = r.run_id
        WHERE r.state IN ('available','partial') AND substr(r.scheduled_at, 15, 2) = '00' AND r.scheduled_at >= ?
          AND lower(s.channel_key) IN (${keys.map(() => '?').join(',')})
        GROUP BY lower(s.channel_key)`).bind(since, ...keys.map((k) => k.toLowerCase())).all<{ channelKey: string; broadcasts: number }>();
      const recorded = new Map((rows.results || []).map((row) => [row.channelKey.toLowerCase(), row.broadcasts]));
      for (const s of allStreamers) s.recordedBroadcasts = s.channelKey ? recorded.get(s.channelKey.toLowerCase()) || 0 : 0;
    } catch (err) {
      console.warn('[searchStatisticsStreamers] record lookup failed:', err);
    }
  }

  // 5. 정렬: 통계 기록 있음 > 이름 완전 일치 > VDébut 소개 등록 > 팔로워 많은 순 > 방송 중 > 가나다순.
  //    팬·사칭 계정은 보통 기록·팔로워가 없어 자연스럽게 뒤로 밀린다.
  const score = (s: StatisticsStreamer) => [
    (s.recordedBroadcasts || 0) > 0 ? 1 : 0,
    normalizeStreamerQuery(s.name) === query ? 1 : 0,
    s.isRegistered && s.profileSlug ? 1 : s.isRegistered ? 0.5 : 0,
    s.followerCount || 0,
    s.isLive ? 1 : 0,
  ];
  allStreamers.sort((a, b) => {
    const sa = score(a), sb = score(b);
    for (let i = 0; i < sa.length; i += 1) if (sa[i] !== sb[i]) return sb[i] - sa[i];
    return a.name.localeCompare(b.name, 'ko');
  });

  const limit = 25;
  return {
    query,
    streamers: allStreamers.slice(0, limit),
    hasMore: allStreamers.length > limit,
  };
}
