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
async function getTableColumns(db: D1Database, tableName: string): Promise<Set<string>> {
  const { results } = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set((results || []).map((row: any) => String(row.name)));
}

async function insertKnownColumns(
  db: D1Database,
  tableName: string,
  columns: Set<string>,
  values: Record<string, any>
) {
  const insertColumns = Object.keys(values).filter((column) => columns.has(column));

  if (insertColumns.length === 0) {
    throw new Error(`No writable columns found for ${tableName}`);
  }

  const placeholders = insertColumns.map(() => '?').join(', ');
  const boundValues = insertColumns.map((column) => values[column]);

  return db
    .prepare(`INSERT INTO ${tableName} (${insertColumns.join(', ')}) VALUES (${placeholders})`)
    .bind(...boundValues)
    .run();
}

function parseLanguages(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || value.trim().length === 0) return ['ko'];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    return [value];
  }
}
export async function fetchEventsFromD1(db: D1Database): Promise<any[] | null> {
  try {
    const eventColumns = await getTableColumns(db, 'debut_events');
    const creatorColumns = await getTableColumns(db, 'creator_profiles');
    const linkColumns = await getTableColumns(db, 'debut_event_links');
    const agencyColumns = await getTableColumns(db, 'agencies');

    if (eventColumns.size === 0 || creatorColumns.size === 0) {
      return null;
    }

    const eventTypeExpr = eventColumns.has('type')
      ? 'e.type'
      : eventColumns.has('event_type')
        ? 'e.event_type'
        : "'FIRST_DEBUT'";
    const timezoneExpr = eventColumns.has('original_timezone') ? 'e.original_timezone' : "'Asia/Seoul'";
    const statusExpr = eventColumns.has('status') ? 'e.status' : "'PUBLISHED'";
    const verificationExpr = eventColumns.has('verification_status') ? 'e.verification_status' : "'SOURCE_VERIFIED'";
    const descriptionExpr = eventColumns.has('description') ? 'e.description' : 'NULL';
    const avatarExpr = creatorColumns.has('avatar_url')
      ? 'c.avatar_url'
      : creatorColumns.has('profile_image_url')
        ? 'c.profile_image_url'
        : 'NULL';
    const countryExpr = creatorColumns.has('country_code') ? 'c.country_code' : "'KR'";
    const languagesExpr = creatorColumns.has('languages')
      ? 'c.languages'
      : creatorColumns.has('language')
        ? 'c.language'
        : '\'["ko"]\'';
    const useAgenciesJoin = creatorColumns.has('agency_id') && agencyColumns.size > 0;
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
        COALESCE(c.avatar_url, c.profile_image_url) as creator_avatarUrl,
        COALESCE(a.name, c.agency_name, 'Indie') as creator_agency,
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

    const eventsMap = new Map();
    (results || []).forEach((row: any) => {
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
            displayName: row.creator_displayName || '버튜버',
            avatarUrl: row.creator_avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            agency: row.creator_agency || 'Indie',
            countryCode: row.creator_countryCode || 'KR',
            languages: parseLanguages(row.creator_languages)
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

    const dbEventsList = Array.from(eventsMap.values());
    const combinedMap = new Map();
    MOCK_EVENTS.forEach((e) => combinedMap.set(e.id, e));
    dbEventsList.forEach((e) => combinedMap.set(e.id, e));

    return Array.from(combinedMap.values());
  } catch (err) {
    console.error('D1 Database Fetch Error:', err);
    return null;
  }
}

/**
 * Insert a new debut event and verify that it can be read back from D1.
 */
export async function insertEventToD1(db: D1Database, body: any): Promise<string> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const eventId = body.id || `evt_${now}`;
  const requestedCreatorId = body.creator?.id || `cr_${now}`;
  const linkId = `link_${now}`;

  const displayName = body.creator?.displayName || body.displayName || '신입 VTuber';
  const avatarUrl = body.creator?.avatarUrl || body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const agencyName = body.creator?.agency || body.agency || 'Indie';
  const agencySlug = `agency_${now}_${Math.random().toString(36).slice(2, 6)}`;
  const creatorSlug = `slug_${now}_${Math.random().toString(36).slice(2, 6)}`;

  const title = body.title || `${displayName} 데뷔 방송`;
  const startAtUtc = body.startAtUtc || new Date(now + 86400000 * 3).toISOString();
  const timezone = body.originalTimezone || 'Asia/Seoul';
  const description = body.description || `${displayName} 버튜버의 공식 데뷔 방송입니다.`;

  const primaryLink = body.links?.[0] || null;
  const platform = primaryLink?.platform || body.platform || 'CHZZK';
  const watchUrl = primaryLink?.url || body.watchUrl || 'https://chzzk.naver.com';

  const creatorColumns = await getTableColumns(db, 'creator_profiles');
  const eventColumns = await getTableColumns(db, 'debut_events');
  const linkColumns = await getTableColumns(db, 'debut_event_links');
  const agencyColumns = await getTableColumns(db, 'agencies');
  const channelColumns = await getTableColumns(db, 'creator_channels');

  if (creatorColumns.size === 0 || eventColumns.size === 0) {
    throw new Error('Required D1 tables are missing.');
  }

  let finalAgencyId: string | null = null;
  if (creatorColumns.has('agency_id') && agencyColumns.size > 0) {
    const existingAgency: any = await db
      .prepare('SELECT id FROM agencies WHERE id = ? OR name = ? LIMIT 1')
      .bind(agencyName, agencyName)
      .first();

    if (existingAgency?.id) {
      finalAgencyId = String(existingAgency.id);
    } else {
      finalAgencyId = agencyName === 'Indie' ? 'Indie' : `agency_${now}`;
      await insertKnownColumns(db, 'agencies', agencyColumns, {
        id: finalAgencyId,
        slug: agencySlug,
        name: agencyName,
        country_code: 'KR',
      });
    }
  }

  const usesLegacyCreatorSchema = creatorColumns.has('country_code') || creatorColumns.has('avatar_url');
  await insertKnownColumns(db, 'creator_profiles', creatorColumns, usesLegacyCreatorSchema
    ? {
        id: requestedCreatorId,
        slug: creatorSlug,
        display_name: displayName,
        country_code: 'KR',
        languages: '["ko"]',
        agency_id: finalAgencyId,
        avatar_url: avatarUrl,
        created_at: nowIso,
        updated_at: nowIso,
      }
    : {
        slug: creatorSlug,
        display_name: displayName,
        description,
        profile_image_url: avatarUrl,
        agency_name: agencyName,
        creator_type: agencyName === 'Indie' ? 'INDIE' : 'AGENCY',
        language: 'ko',
        is_public: 1,
        created_at: nowIso,
        updated_at: nowIso,
      });

  const createdCreator: any = await db
    .prepare('SELECT id FROM creator_profiles WHERE slug = ? LIMIT 1')
    .bind(creatorSlug)
    .first();
  const creatorId = createdCreator?.id ?? requestedCreatorId;

  await insertKnownColumns(db, 'debut_events', eventColumns, {
    id: eventId,
    creator_id: creatorId,
    type: body.type || 'FIRST_DEBUT',
    event_type: body.type || 'FIRST_DEBUT',
    title,
    description,
    start_at_utc: startAtUtc,
    original_timezone: timezone,
    status: 'PUBLISHED',
    verification_status: 'COMMUNITY_SUBMITTED',
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (linkColumns.size > 0) {
    await insertKnownColumns(db, 'debut_event_links', linkColumns, {
      id: linkId,
      event_id: eventId,
      platform,
      watch_url: watchUrl,
      is_primary: 1,
      created_at: nowIso,
    });
  }

  if (channelColumns.size > 0) {
    await insertKnownColumns(db, 'creator_channels', channelColumns, {
      creator_id: creatorId,
      platform,
      channel_name: displayName,
      channel_url: watchUrl,
      is_primary: 1,
      created_at: nowIso,
      updated_at: nowIso,
    });
  }

  const savedEvent = await db.prepare('SELECT id FROM debut_events WHERE id = ? LIMIT 1').bind(eventId).first();
  if (!savedEvent) {
    throw new Error(`D1 insert verification failed for event ${eventId}`);
  }

  return eventId;
}

/**
 * Update an existing debut event in D1.
 */
export async function updateEventInD1(db: D1Database, eventId: string, body: any): Promise<boolean> {
  try {
    const displayName = body.creator?.displayName || body.displayName;
    const avatarUrl = body.creator?.avatarUrl || body.avatarUrl;
    const agencyName = body.creator?.agency || body.agency;
    const title = body.title;
    const startAtUtc = body.startAtUtc;
    const description = body.description;
    const primaryLink = body.links?.[0] || null;
    const platform = primaryLink?.platform || body.platform;
    const watchUrl = primaryLink?.url || body.watchUrl;

    const creatorColumns = await getTableColumns(db, 'creator_profiles');
    const eventColumns = await getTableColumns(db, 'debut_events');
    const linkColumns = await getTableColumns(db, 'debut_event_links');
    const existingEvent: any = await db.prepare('SELECT creator_id FROM debut_events WHERE id = ?').bind(eventId).first();
    const creatorId = existingEvent?.creator_id;

    if (!creatorId) {
      return false;
    }

    if (displayName) {
      const creatorAssignments = ['display_name = COALESCE(?, display_name)'];
      const creatorValues = [displayName];
      const avatarColumn = creatorColumns.has('avatar_url')
        ? 'avatar_url'
        : creatorColumns.has('profile_image_url')
          ? 'profile_image_url'
          : null;

      if (avatarColumn) {
        creatorAssignments.push(`${avatarColumn} = COALESCE(?, ${avatarColumn})`);
        creatorValues.push(avatarUrl || null);
      }

      if (creatorColumns.has('agency_name')) {
        creatorAssignments.push('agency_name = COALESCE(?, agency_name)');
        creatorValues.push(agencyName || null);
      }

      await db.prepare(`
        UPDATE creator_profiles
        SET ${creatorAssignments.join(', ')}
        WHERE id = ?
      `).bind(...creatorValues, creatorId).run();
    }

    const eventAssignments = [];
    const eventValues = [];
    if (title && eventColumns.has('title')) {
      eventAssignments.push('title = ?');
      eventValues.push(title);
    }
    if (description && eventColumns.has('description')) {
      eventAssignments.push('description = ?');
      eventValues.push(description);
    }
    if (startAtUtc && eventColumns.has('start_at_utc')) {
      eventAssignments.push('start_at_utc = ?');
      eventValues.push(startAtUtc);
    }
    if (eventColumns.has('updated_at')) {
      eventAssignments.push('updated_at = CURRENT_TIMESTAMP');
    }

    if (eventAssignments.length > 0) {
      await db.prepare(`
        UPDATE debut_events
        SET ${eventAssignments.join(', ')}
        WHERE id = ?
      `).bind(...eventValues, eventId).run();
    }

    if ((platform || watchUrl) && linkColumns.size > 0) {
      const linkAssignments = [];
      const linkValues = [];
      if (platform && linkColumns.has('platform')) {
        linkAssignments.push('platform = ?');
        linkValues.push(platform);
      }
      if (watchUrl && linkColumns.has('watch_url')) {
        linkAssignments.push('watch_url = ?');
        linkValues.push(watchUrl);
      }

      if (linkAssignments.length > 0) {
        await db.prepare(`
          UPDATE debut_event_links
          SET ${linkAssignments.join(', ')}
          WHERE event_id = ?
        `).bind(...linkValues, eventId).run();
      }
    }

    return true;
  } catch (err) {
    console.error('D1 Update Error:', err);
    return false;
  }
}