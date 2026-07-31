// Clean 2-Table Event DB Service (streamer_info & channel_management)
import { fetchPlatformProfile } from './platformApiService';

export const MOCK_EVENTS = [
  {
    id: 'evt_1',
    title: '아롱띠 데뷔 방송',
    type: 'FIRST_DEBUT',
    creator: {
      id: 1,
      displayName: '아롱띠',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
      slug: 'arongtti',
    },
    startAtUtc: '2026-07-01T12:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/a0714/post/166790429', isPrimary: true }],
    description: '웰컴버추얼 데뷔 방송',
  },
];

/**
 * 1. D1 DB (streamer_info & channel_management)에서 이벤트 조회
 * + 관리자가 DB에 다이렉트 쿼리로 입력한 경우(Route B), 외부 API를 실시간 자동 동기화 보완!
 */
export async function fetchEventsFromD1(db: D1Database): Promise<any[] | null> {
  try {
    const { results } = await db.prepare(`
      SELECT 
        s.id as streamer_id,
        s.slug,
        s.display_name,
        s.profile_image_url,
        s.description,
        s.agency_name,
        s.debut_date,
        s.debut_time,
        s.timezone,
        s.start_at_utc,
        c.platform,
        c.channel_url,
        c.channel_name,
        c.is_primary
      FROM streamer_info s
      LEFT JOIN channel_management c ON s.id = c.streamer_id
      ORDER BY s.start_at_utc ASC
    `).all();

    if (!results || results.length === 0) {
      return null;
    }

    const eventsMap = new Map();

    for (const row of results as any[]) {
      let avatarUrl = row.profile_image_url;
      let displayName = row.display_name;
      let description = row.description;

      // 💡 [Route B 보완] 관리자가 DB로 다이렉트 입력하여 프로필 이미지가 없는 경우, 외부 API 실시간 자동 조회!
      if (!avatarUrl && row.channel_url) {
        try {
          const apiResult = await fetchPlatformProfile(row.platform || 'CHZZK', row.channel_url);
          if (apiResult.success) {
            avatarUrl = apiResult.profileImageUrl || avatarUrl;
            displayName = displayName || apiResult.creatorName;
            description = description || apiResult.description;

            // D1 DB에도 실시간 자동 보완 저장
            await db.prepare(`
              UPDATE streamer_info 
              SET profile_image_url = ?, display_name = COALESCE(?, display_name), description = COALESCE(?, description)
              WHERE id = ?
            `).bind(avatarUrl, displayName, description, row.streamer_id).run();
          }
        } catch {
          // fallback
        }
      }

      const evtId = `evt_${row.streamer_id}`;
      if (!eventsMap.has(evtId)) {
        eventsMap.set(evtId, {
          id: evtId,
          title: `${displayName || '버튜버'} 데뷔 방송`,
          type: 'FIRST_DEBUT',
          startAtUtc: row.start_at_utc,
          originalTimezone: row.timezone || 'Asia/Seoul',
          status: 'PUBLISHED',
          verificationStatus: 'SOURCE_VERIFIED',
          description: description || `${displayName || '버튜버'}의 데뷔 방송입니다.`,
          creator: {
            id: row.streamer_id,
            displayName: displayName || '신입 버튜버',
            avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            agency: row.agency_name || '개인세',
            countryCode: 'KR',
            languages: ['ko'],
            slug: row.slug || `slug_${row.streamer_id}`,
          },
          links: [],
        });
      }

      if (row.channel_url) {
        eventsMap.get(evtId).links.push({
          platform: row.platform || 'CHZZK',
          url: row.channel_url,
          isPrimary: Boolean(row.is_primary ?? 1),
        });
      }
    }

    return Array.from(eventsMap.values());
  } catch (err) {
    console.error('D1 2-Table Fetch Error:', err);
    return null;
  }
}

/**
 * 2. WEB 폼 제출 시 streamer_info 및 channel_management 단 2개 DB에 저징 (Route A)
 */
export async function insertEventToD1(db: D1Database, body: any): Promise<string> {
  const now = Date.now();
  const displayName = body.creator?.displayName || body.displayName || '신입 VTuber';
  const avatarUrl = body.creator?.avatarUrl || body.avatarUrl || '';
  const agencyName = body.creator?.agency || body.agency || '개인세';
  const description = body.description || `${displayName} 버튜버의 데뷔 방송입니다.`;
  const slug = `slug_${now}_${Math.random().toString(36).slice(2, 6)}`;

  const primaryLink = body.links?.[0] || null;
  const platform = primaryLink?.platform || body.platform || 'CHZZK';
  const watchUrl = primaryLink?.url || body.watchUrl || 'https://chzzk.naver.com';

  const startAtUtc = body.startAtUtc || new Date(now + 86400000 * 3).toISOString();
  const timezone = body.originalTimezone || 'Asia/Seoul';

  const d = new Date(startAtUtc);
  const debutDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const debutTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  // ① streamer_info 테이블에 저장
  const res: any = await db.prepare(`
    INSERT INTO streamer_info (slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(slug, displayName, avatarUrl, description, agencyName, debutDate, debutTime, timezone, startAtUtc).first();

  const streamerId = res?.id || now;

  // ② channel_management 테이블에 저장
  await db.prepare(`
    INSERT INTO channel_management (streamer_id, platform, channel_url, channel_name, is_primary)
    VALUES (?, ?, ?, ?, 1)
  `).bind(streamerId, platform, watchUrl, `${displayName} ${platform}`).run();

  return `evt_${streamerId}`;
}

/**
 * 3. 기존 이벤트 수정 시 streamer_info 및 channel_management 업데이트
 */
export async function updateDebutEventInD1(db: D1Database, eventId: string, body: any): Promise<boolean> {
  try {
    const rawId = eventId.replace('evt_', '');
    const streamerId = parseInt(rawId, 10);
    if (isNaN(streamerId)) return false;

    const displayName = body.creator?.displayName || body.displayName;
    const avatarUrl = body.creator?.avatarUrl || body.avatarUrl;
    const description = body.description;
    const startAtUtc = body.startAtUtc;

    if (displayName || avatarUrl || description || startAtUtc) {
      await db.prepare(`
        UPDATE streamer_info
        SET display_name = COALESCE(?, display_name),
            profile_image_url = COALESCE(?, profile_image_url),
            description = COALESCE(?, description),
            start_at_utc = COALESCE(?, start_at_utc),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(displayName || null, avatarUrl || null, description || null, startAtUtc || null, streamerId).run();
    }

    const primaryLink = body.links?.[0];
    if (primaryLink) {
      await db.prepare(`
        UPDATE channel_management
        SET platform = COALESCE(?, platform),
            channel_url = COALESCE(?, channel_url)
        WHERE streamer_id = ?
      `).bind(primaryLink.platform || null, primaryLink.url || null, streamerId).run();
    }

    return true;
  } catch (err) {
    console.error('D1 2-Table Update Error:', err);
    return false;
  }
}