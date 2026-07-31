// Clean 2-Table Creator DB Service (streamer_info & channel_management)
import { fetchPlatformProfile } from './platformApiService';

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

export async function fetchCreatorProfileBySlug(db: D1Database | null, slug: string): Promise<CreatorProfileData | null> {
  const normalizedSlug = slug.toLowerCase();

  if (!db) {
    return {
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
        { id: 1, platform: 'CHZZK', channelName: '아롱띠 치지직 방송국', channelUrl: 'https://chzzk.naver.com/live/arongtti', isPrimary: true },
      ],
      events: [
        {
          id: 'evt_1',
          title: '아롱띠 첫 데뷔 방송',
          type: 'FIRST_DEBUT',
          startAtUtc: '2026-08-01T08:00:00.000Z',
          originalTimezone: 'Asia/Seoul',
          status: 'PUBLISHED',
          verificationStatus: 'VERIFIED_OFFICIAL',
          description: '안녕하세요! 8월 1일 오후 5시 치지직에서 데뷔합니다.',
          links: [{ platform: 'CHZZK', url: 'https://chzzk.naver.com/live/arongtti', isPrimary: true }],
          creator: { id: 1, displayName: '아롱띠', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', agency: '개인세', slug: 'arongtti' },
        },
      ],
    };
  }

  try {
    const streamerRow: any = await db
      .prepare('SELECT * FROM streamer_info WHERE slug = ? OR display_name = ? LIMIT 1')
      .bind(normalizedSlug, slug)
      .first();

    if (!streamerRow) {
      return null;
    }

    const channelsRes = await db
      .prepare('SELECT * FROM channel_management WHERE streamer_id = ? ORDER BY is_primary DESC, id ASC')
      .bind(streamerRow.id)
      .all();

    const channels = (channelsRes.results || []).map((c: any) => ({
      id: c.id,
      platform: c.platform,
      channelName: c.channel_name || `${c.platform} 채널`,
      channelUrl: c.channel_url,
      isPrimary: c.is_primary === 1,
    }));

    let avatarUrl = streamerRow.profile_image_url;
    let displayName = streamerRow.display_name;
    let description = streamerRow.description;

    // 💡 관리자가 DB 다이렉트 쿼리로 입력한 프로필의 경우 실시간 외부 API 자동 보완!
    if (!avatarUrl && channels.length > 0 && channels[0].channelUrl) {
      try {
        const apiResult = await fetchPlatformProfile(channels[0].platform, channels[0].channelUrl);
        if (apiResult.success) {
          avatarUrl = apiResult.profileImageUrl || avatarUrl;
          displayName = displayName || apiResult.creatorName;
          description = description || apiResult.description;
        }
      } catch {
        // fallback
      }
    }

    return {
      id: streamerRow.id,
      slug: streamerRow.slug,
      displayName: displayName || '버튜버',
      description: description || `${displayName}의 데뷔 일정 페이지입니다.`,
      profileImageUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      agencyName: streamerRow.agency_name || '개인세',
      creatorType: streamerRow.agency_name?.includes('기업') ? 'AGENCY' : 'INDIE',
      language: 'ko',
      isPublic: true,
      createdAt: streamerRow.created_at || new Date().toISOString(),
      updatedAt: streamerRow.updated_at || new Date().toISOString(),
      channels,
      events: [
        {
          id: `evt_${streamerRow.id}`,
          title: `${displayName} 데뷔 방송`,
          type: 'FIRST_DEBUT',
          startAtUtc: streamerRow.start_at_utc,
          originalTimezone: streamerRow.timezone || 'Asia/Seoul',
          status: 'PUBLISHED',
          verificationStatus: 'VERIFIED_OFFICIAL',
          description: description || `${displayName} 버튜버의 공식 데뷔 방송입니다.`,
          links: channels.map((c: any) => ({ platform: c.platform, url: c.channelUrl, isPrimary: c.isPrimary })),
          creator: {
            id: streamerRow.id,
            displayName,
            avatarUrl,
            agency: streamerRow.agency_name || '개인세',
            slug: streamerRow.slug,
          },
        },
      ],
    };
  } catch (err) {
    console.error('fetchCreatorProfileBySlug Error:', err);
    return null;
  }
}
