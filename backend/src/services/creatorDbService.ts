// Creator DB Service for D1 Database & Fallbacks

export interface CreatorProfileData {
  id: number;
  slug: string;
  displayName: string;
  description: string;
  profileImageUrl: string;
  agencyName: string;
  creatorType: 'INDIE' | 'AGENCY';
  language: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  channels: {
    id: number;
    platform: string;
    channelName: string;
    channelUrl: string;
    isPrimary: boolean;
  }[];
  events: any[];
}

export const MOCK_CREATOR_PROFILES: Record<string, CreatorProfileData> = {
  arongtti: {
    id: 1,
    slug: 'arongtti',
    displayName: '아롱띠',
    description: '치지직에서 활동하는 버튜버입니다. 주요 방송 콘텐츠와 자세한 소개를 확인해 보세요.',
    profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    agencyName: '개인세 / 인디 (Indie)',
    creatorType: 'INDIE',
    language: 'ko',
    isPublic: true,
    createdAt: '2026-07-31T00:00:00Z',
    updatedAt: '2026-07-31T00:00:00Z',
    channels: [
      {
        id: 101,
        platform: 'CHZZK',
        channelName: '아롱띠 치지직 방송국',
        channelUrl: 'https://chzzk.naver.com/live/arongtti',
        isPrimary: true,
      },
      {
        id: 102,
        platform: 'YOUTUBE',
        channelName: '아롱띠 공식 유튜브',
        channelUrl: 'https://youtube.com/@arongtti',
        isPrimary: false,
      },
    ],
    events: [
      {
        id: 'evt-arongtti-debut',
        title: '아롱띠 첫 데뷔 방송',
        type: 'FIRST_DEBUT',
        startAtUtc: '2026-08-01T08:00:00.000Z',
        originalTimezone: 'Asia/Seoul',
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED_OFFICIAL',
        description: '안녕하세요! 8월 1일 오후 5시 치지직에서 데뷔합니다.',
        links: [
          { platform: 'CHZZK', url: 'https://chzzk.naver.com/live/arongtti', isPrimary: true },
        ],
        creator: {
          id: 'cr-arongtti',
          displayName: '아롱띠',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          agency: 'Indie',
          countryCode: 'KR',
          languages: ['ko'],
          slug: 'arongtti',
        },
      },
    ],
  },
};

export async function fetchCreatorProfileBySlug(db: D1Database | null, slug: string): Promise<CreatorProfileData | null> {
  const normalizedSlug = slug.toLowerCase();

  if (!db) {
    return MOCK_CREATOR_PROFILES[normalizedSlug] || null;
  }

  try {
    const profileRow = await db
      .prepare('SELECT * FROM creator_profiles WHERE slug = ? AND is_public = 1 LIMIT 1')
      .bind(normalizedSlug)
      .first();

    if (!profileRow) {
      return MOCK_CREATOR_PROFILES[normalizedSlug] || null;
    }

    const channelsRes = await db
      .prepare('SELECT * FROM creator_channels WHERE creator_id = ? ORDER BY is_primary DESC, id ASC')
      .bind(profileRow.id)
      .all();

    const channels = (channelsRes.results || []).map((c: any) => ({
      id: c.id,
      platform: c.platform,
      channelName: c.channel_name || `${c.platform} 채널`,
      channelUrl: c.channel_url,
      isPrimary: c.is_primary === 1,
    }));

    const eventsRes = await db
      .prepare('SELECT * FROM debut_events WHERE creator_id = ? OR title LIKE ? ORDER BY start_at_utc ASC')
      .bind(profileRow.id, `%${profileRow.display_name}%`)
      .all();

    const events = (eventsRes.results || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      type: e.event_type || 'FIRST_DEBUT',
      startAtUtc: e.start_at_utc,
      originalTimezone: e.original_timezone || 'Asia/Seoul',
      status: e.status || 'PUBLISHED',
      verificationStatus: e.verification_status || 'VERIFIED_OFFICIAL',
      description: e.description,
      links: [
        {
          platform: e.platform || 'CHZZK',
          url: e.channel_url || channels[0]?.channelUrl || 'https://vdebut.live',
          isPrimary: true,
        },
      ],
      creator: {
        id: `cr-${e.id}`,
        displayName: profileRow.display_name,
        avatarUrl: profileRow.profile_image_url,
        agency: profileRow.agency_name,
        slug: profileRow.slug,
      },
    }));

    return {
      id: profileRow.id as number,
      slug: profileRow.slug as string,
      displayName: profileRow.display_name as string,
      description: (profileRow.description || '') as string,
      profileImageUrl: profileRow.profile_image_url as string,
      agencyName: profileRow.agency_name as string,
      creatorType: (profileRow.creator_type || 'INDIE') as 'INDIE' | 'AGENCY',
      language: (profileRow.language || 'ko') as string,
      isPublic: profileRow.is_public === 1,
      createdAt: profileRow.created_at as string,
      updatedAt: profileRow.updated_at as string,
      channels,
      events: events.length > 0 ? events : (MOCK_CREATOR_PROFILES[normalizedSlug]?.events || []),
    };
  } catch (err) {
    console.error('fetchCreatorProfileBySlug Error:', err);
    return MOCK_CREATOR_PROFILES[normalizedSlug] || null;
  }
}
