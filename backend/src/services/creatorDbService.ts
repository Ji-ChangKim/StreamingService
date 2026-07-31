// Intuitive Pair Tables Creator DB Service (streamerChannel & streamerChannel_info)
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
    const row: any = await db
      .prepare(`
        SELECT 
          i.*,
          c.platform,
          c.channel_url,
          c.channel_name
        FROM streamerChannel_info i
        INNER JOIN streamerChannel c ON i.channel_id = c.id
        WHERE i.slug = ? OR i.display_name = ?
        LIMIT 1
      `)
      .bind(normalizedSlug, slug)
      .first();

    if (!row) {
      return null;
    }

    let avatarUrl = row.profile_image_url;
    let displayName = row.display_name;
    let description = row.description;

    // 💡 관리자 DB 다이렉트 쿼리 입력 건 외부 API 자동 보완
    if (!avatarUrl && row.channel_url) {
      try {
        const apiResult = await fetchPlatformProfile(row.platform, row.channel_url);
        if (apiResult.success) {
          avatarUrl = apiResult.profileImageUrl || avatarUrl;
          displayName = displayName || apiResult.creatorName;
          description = description || apiResult.description;
        }
      } catch {
        // fallback
      }
    }

    const channelObj = {
      id: row.channel_id,
      platform: row.platform,
      channelName: row.channel_name || `${row.platform} 채널`,
      channelUrl: row.channel_url,
      isPrimary: true,
    };

    return {
      id: row.id,
      slug: row.slug,
      displayName: displayName || '버튜버',
      description: description || `${displayName}의 데뷔 일정 페이지입니다.`,
      profileImageUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      agencyName: row.agency_name || '개인세',
      creatorType: row.agency_name?.includes('기업') ? 'AGENCY' : 'INDIE',
      language: 'ko',
      isPublic: true,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      channels: [channelObj],
      events: [
        {
          id: `evt_${row.id}`,
          title: `${displayName} 데뷔 방송`,
          type: 'FIRST_DEBUT',
          startAtUtc: row.start_at_utc,
          originalTimezone: row.timezone || 'Asia/Seoul',
          status: 'PUBLISHED',
          verificationStatus: 'VERIFIED_OFFICIAL',
          description: description || `${displayName} 버튜버의 공식 데뷔 방송입니다.`,
          links: [channelObj],
          creator: {
            id: row.id,
            displayName,
            avatarUrl,
            agency: row.agency_name || '개인세',
            slug: row.slug,
          },
        },
      ],
    };
  } catch (err) {
    console.error('Pair table fetchCreatorProfileBySlug Error:', err);
    return null;
  }
}
