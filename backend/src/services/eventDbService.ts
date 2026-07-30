export const MOCK_EVENTS = [
  {
    id: 'evt_2026_1',
    title: '아롱띠 데뷔 방송',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_2026_1',
      displayName: '아롱띠',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    startAtUtc: '2026-07-01T12:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/a0714/post/166790429', isPrimary: true }],
    description: '웰컴버추얼 데뷔 방송',
  },
  {
    id: 'evt_2026_2',
    title: '헤티 데뷔 방송',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_2026_2',
      displayName: '헤티',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    startAtUtc: '2026-07-02T20:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/bps1017/post/166829897', isPrimary: true }],
    description: '소통 및 첫 데뷔 라이브',
  },
  {
    id: 'evt_2026_3',
    title: '마테 데뷔 방송',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_2026_3',
      displayName: '마테',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    startAtUtc: '2026-07-03T14:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/mate4077', isPrimary: true }],
    description: '첫 소통 데뷔 라이브',
  },
  {
    id: 'evt_2026_4',
    title: '담하로 데뷔 방송',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_2026_4',
      displayName: '담하로',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    startAtUtc: '2026-07-04T17:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/harobangil/post/166904326', isPrimary: true }],
    description: '담하로 첫 공식 데뷔 스트림',
  },
  {
    id: 'evt_2026_5',
    title: '바쿠 데뷔 방송',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_2026_5',
      displayName: '바쿠',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    startAtUtc: '2026-07-04T19:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: 'CHZZK', url: 'https://x.com/orbitaofbehind', isPrimary: true }],
    description: '치지직 신입 버튜버 바쿠 데뷔',
  },
  {
    id: 'evt_2026_32',
    title: '루하 데뷔 방송',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_2026_32',
      displayName: '루하',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    startAtUtc: '2026-07-29T14:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/ruha0612/post/168012350', isPrimary: true }],
    description: '루하 SOOP 데뷔 생방송',
  },
  {
    id: 'evt_2026_33',
    title: '치즈치즈 데뷔 방송',
    type: 'REDEBUT',
    creator: {
      id: 'cr_2026_33',
      displayName: '치즈치즈',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    startAtUtc: '2026-07-30T14:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/cheesezz/post/168054144', isPrimary: true }],
    description: '치즈치즈 재데뷔 방송 무대',
  },
];

/**
 * Cloudflare D1 데이터베이스에서 데뷔 이벤트 목록을 조회하는 전용 서비스 함수
 */
export async function fetchEventsFromD1(db: D1Database): Promise<any[] | null> {
  try {
    const { results } = await db.prepare(`
      SELECT 
        e.id,
        e.title,
        e.type,
        e.start_at_utc as startAtUtc,
        e.original_timezone as originalTimezone,
        e.status,
        e.verification_status as verificationStatus,
        e.description,
        c.id as creator_id,
        c.display_name as creator_displayName,
        c.avatar_url as creator_avatarUrl,
        COALESCE(a.name, c.agency_id, 'Indie') as creator_agency,
        c.country_code as creator_countryCode,
        c.languages as creator_languages,
        l.platform as link_platform,
        l.watch_url as link_url,
        l.is_primary as link_isPrimary
      FROM debut_events e
      LEFT JOIN creator_profiles c ON e.creator_id = c.id
      LEFT JOIN agencies a ON c.agency_id = a.id
      LEFT JOIN debut_event_links l ON e.id = l.event_id
      WHERE e.status != 'DRAFT'
      ORDER BY e.start_at_utc ASC
    `).all();

    if (!results || results.length === 0) {
      return null;
    }

    const eventsMap = new Map();
    results.forEach((row: any) => {
      if (!eventsMap.has(row.id)) {
        eventsMap.set(row.id, {
          id: row.id,
          title: row.title,
          type: row.type,
          startAtUtc: row.startAtUtc,
          originalTimezone: row.originalTimezone,
          status: row.status,
          verificationStatus: row.verificationStatus,
          description: row.description,
          creator: {
            id: row.creator_id,
            displayName: row.creator_displayName,
            avatarUrl: row.creator_avatarUrl,
            agency: row.creator_agency || 'Indie',
            countryCode: row.creator_countryCode,
            languages: JSON.parse(row.creator_languages || '["ko"]')
          },
          links: []
        });
      }
      if (row.link_platform) {
        eventsMap.get(row.id).links.push({
          platform: row.link_platform,
          url: row.link_url,
          isPrimary: Boolean(row.link_isPrimary)
        });
      }
    });

    return Array.from(eventsMap.values());
  } catch (err) {
    console.error('D1 Database Fetch Error:', err);
    return null;
  }
}

/**
 * Cloudflare D1 데이터베이스에 신규 데뷔 이벤트를 추가하는 전용 서비스 함수
 */
export async function insertEventToD1(db: D1Database, body: any): Promise<string> {
  const eventId = body.id || `evt_${Date.now()}`;
  const creatorId = body.creator?.id || `cr_${Date.now()}`;
  const linkId = `link_${Date.now()}`;

  const displayName = body.creator?.displayName || body.displayName || '신입 VTuber';
  const avatarUrl = body.creator?.avatarUrl || body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const agencyName = body.creator?.agency || body.agency || 'Indie';
  const agencySlug = `agency_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  const title = body.title || `${displayName} 데뷔 방송`;
  const startAtUtc = body.startAtUtc || new Date(Date.now() + 86400000 * 3).toISOString();
  const timezone = body.originalTimezone || 'Asia/Seoul';
  const description = body.description || `${displayName} 버튜버의 데뷔 방송입니다.`;
  
  const primaryLink = (body.links && body.links[0]) ? body.links[0] : null;
  const platform = primaryLink?.platform || body.platform || 'CHZZK';
  const watchUrl = primaryLink?.url || body.watchUrl || 'https://chzzk.naver.com';

  try {
    // 1. agencies 테이블 외래키 에러 방지: 존재하는 agency_id 확인 및 생성
    let finalAgencyId: string | null = null;
    try {
      const existingAgency: any = await db.prepare(`SELECT id FROM agencies WHERE id = ? OR name = ?`).bind(agencyName, agencyName).first();
      if (existingAgency?.id) {
        finalAgencyId = String(existingAgency.id);
      } else {
        finalAgencyId = `agency_${Date.now()}`;
        await db.prepare(`
          INSERT INTO agencies (id, slug, name, country_code)
          VALUES (?, ?, ?, 'KR')
        `).bind(finalAgencyId, agencySlug, agencyName).run();
      }
    } catch (agencyErr) {
      finalAgencyId = null; // 외래키 오류 방지용 null 처리
    }

    // 2. creator_profiles 생성
    await db.prepare(`
      INSERT INTO creator_profiles (id, slug, display_name, country_code, languages, agency_id, avatar_url)
      VALUES (?, ?, ?, 'KR', '["ko"]', ?, ?)
    `).bind(creatorId, `slug_${Date.now()}`, displayName, finalAgencyId, avatarUrl).run();

    // 3. debut_events 생성
    await db.prepare(`
      INSERT INTO debut_events (id, creator_id, type, title, description, start_at_utc, original_timezone, status, verification_status)
      VALUES (?, ?, 'FIRST_DEBUT', ?, ?, ?, ?, 'PUBLISHED', 'COMMUNITY_SUBMITTED')
    `).bind(eventId, creatorId, title, description, startAtUtc, timezone).run();

    // 4. debut_event_links 생성
    await db.prepare(`
      INSERT INTO debut_event_links (id, event_id, platform, watch_url, is_primary)
      VALUES (?, ?, ?, ?, 1)
    `).bind(linkId, eventId, platform, watchUrl).run();
  } catch (err) {
    console.error('D1 Save Error:', err);
  }

  return eventId;
}

/**
 * Cloudflare D1 데이터베이스에서 기존 데뷔 이벤트를 수정/업데이트하는 전용 서비스 함수
 */
export async function updateEventInD1(db: D1Database, eventId: string, body: any): Promise<boolean> {
  try {
    const displayName = body.creator?.displayName || body.displayName;
    const avatarUrl = body.creator?.avatarUrl || body.avatarUrl;
    const agencyName = body.creator?.agency || body.agency;
    const title = body.title;
    const startAtUtc = body.startAtUtc;
    const description = body.description;
    const primaryLink = (body.links && body.links[0]) ? body.links[0] : null;
    const platform = primaryLink?.platform || body.platform;
    const watchUrl = primaryLink?.url || body.watchUrl;

    // 1. 이벤트의 creator_id 가져오기
    const existingEvent: any = await db.prepare(`SELECT creator_id FROM debut_events WHERE id = ?`).bind(eventId).first();
    const creatorId = existingEvent?.creator_id;

    if (creatorId && displayName) {
      await db.prepare(`
        UPDATE creator_profiles
        SET display_name = COALESCE(?, display_name),
            avatar_url = COALESCE(?, avatar_url)
        WHERE id = ?
      `).bind(displayName, avatarUrl || null, creatorId).run();
    }

    // 2. debut_events 업데이트
    await db.prepare(`
      UPDATE debut_events
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          start_at_utc = COALESCE(?, start_at_utc),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(title || null, description || null, startAtUtc || null, eventId).run();

    // 3. debut_event_links 업데이트
    if (platform || watchUrl) {
      await db.prepare(`
        UPDATE debut_event_links
        SET platform = COALESCE(?, platform),
            watch_url = COALESCE(?, watch_url)
        WHERE event_id = ?
      `).bind(platform || null, watchUrl || null, eventId).run();
    }

    return true;
  } catch (err) {
    console.error('D1 Update Error:', err);
    return false;
  }
}
