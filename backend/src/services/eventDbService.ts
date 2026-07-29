export const MOCK_EVENTS = [
  {
    id: 'evt_01',
    title: '나비야 (Nabiya) 1st Global Debut Stream',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_01',
      slug: 'nabiya',
      displayName: '나비야 (Nabiya)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      agency: 'Indie Creator',
      countryCode: 'KR',
      languages: ['ko', 'en']
    },
    startAtUtc: new Date(Date.now() + 86400000 * 2).toISOString(),
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'OWNER_VERIFIED',
    lastVerifiedAt: new Date().toISOString(),
    links: [
      { platform: 'CHZZK', url: 'https://chzzk.naver.com/live/nabiya_official', isPrimary: true }
    ],
    description: '안녕하세요! 꿈과 노래를 전달하는 버튜버 나비야의 첫 공식 데뷔 방송입니다.'
  }
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
        c.agency_id as creator_agency,
        c.country_code as creator_countryCode,
        c.languages as creator_languages,
        l.platform as link_platform,
        l.watch_url as link_url,
        l.is_primary as link_isPrimary
      FROM debut_events e
      LEFT JOIN creator_profiles c ON e.creator_id = c.id
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
            agency: row.creator_agency,
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
  const eventId = `evt_${Date.now()}`;
  const creatorId = `cr_${Date.now()}`;
  const linkId = `link_${Date.now()}`;

  const displayName = body.displayName || '신입 VTuber';
  const avatarUrl = body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const agency = body.agency || 'Indie';
  const title = body.title || `${displayName} 데뷔 방송`;
  const startAtUtc = body.startAtUtc || new Date(Date.now() + 86400000 * 3).toISOString();
  const platform = body.platform || 'CHZZK';
  const watchUrl = body.watchUrl || 'https://chzzk.naver.com';

  try {
    await db.prepare(`
      INSERT INTO creator_profiles (id, slug, display_name, country_code, languages, agency_id, avatar_url)
      VALUES (?, ?, ?, 'KR', '["ko"]', ?, ?)
    `).bind(creatorId, `slug_${Date.now()}`, displayName, agency, avatarUrl).run();

    await db.prepare(`
      INSERT INTO debut_events (id, creator_id, type, title, description, start_at_utc, original_timezone, status, verification_status)
      VALUES (?, ?, 'FIRST_DEBUT', ?, ?, ?, 'Asia/Seoul', 'PUBLISHED', 'COMMUNITY_SUBMITTED')
    `).bind(eventId, creatorId, title, body.description || '데뷔 일정입니다.', startAtUtc).run();

    await db.prepare(`
      INSERT INTO debut_event_links (id, event_id, platform, watch_url, is_primary)
      VALUES (?, ?, ?, ?, 1)
    `).bind(linkId, eventId, platform, watchUrl).run();
  } catch (err) {
    console.error('D1 Save Error:', err);
  }

  return eventId;
}
