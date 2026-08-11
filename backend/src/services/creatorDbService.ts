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
  countryCode?: string;
  xUrl?: string;
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

    let avatarUrl = row.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
    let displayName = row.display_name || '버튜버';
    let description = row.description || `${displayName}의 데뷔 일정 페이지입니다.`;

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
      countryCode: row.country_code || 'KR',
      xUrl: row.x_url || undefined,
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
            countryCode: row.country_code || 'KR',
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

export async function fetchAllCreatorSlugs(db: D1Database | null): Promise<{ slug: string; updatedAt?: string }[]> {
  if (!db) {
    return [{ slug: 'arongtti', updatedAt: '2026-07-31T00:00:00Z' }];
  }

  try {
    const { results } = await db
      .prepare(`SELECT slug, updated_at FROM streamerChannel_info WHERE slug IS NOT NULL AND slug != ''`)
      .all();

    if (results && results.length > 0) {
      return results.map((row: any) => ({
        slug: row.slug,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
    }
    return [{ slug: 'arongtti', updatedAt: '2026-07-31' }];
  } catch (err) {
    console.error('fetchAllCreatorSlugs Error:', err);
    return [{ slug: 'arongtti', updatedAt: '2026-07-31' }];
  }
}

export interface UpdateCreatorInput {
  displayName?: string;
  description?: string;
  agencyName?: string;
  debutDate?: string; // YYYY-MM-DD
  debutTime?: string; // HH:MM
  channelUrl?: string;
  xUrl?: string;
  profileImageUrl?: string;
}

export async function updateCreatorProfileInD1(
  db: D1Database | null,
  slug: string,
  input: UpdateCreatorInput
): Promise<boolean> {
  if (!db) return true;

  try {
    const row: any = await db
      .prepare(`SELECT channel_id FROM streamerChannel_info WHERE slug = ? OR display_name = ? LIMIT 1`)
      .bind(slug.toLowerCase(), slug)
      .first();

    if (!row) return false;

    const channelId = row.channel_id;

    let startAtUtc: string | undefined = undefined;
    if (input.debutDate && input.debutTime) {
      const dateStr = `${input.debutDate}T${input.debutTime}:00+09:00`;
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        startAtUtc = dateObj.toISOString();
      }
    }

    const nowIso = new Date().toISOString();
    await db
      .prepare(`
        UPDATE streamerChannel_info
        SET
          display_name = COALESCE(?, display_name),
          description = COALESCE(?, description),
          agency_name = COALESCE(?, agency_name),
          debut_date = COALESCE(?, debut_date),
          debut_time = COALESCE(?, debut_time),
          start_at_utc = COALESCE(?, start_at_utc),
          x_url = COALESCE(?, x_url),
          profile_image_url = COALESCE(?, profile_image_url),
          updated_at = ?
        WHERE channel_id = ?
      `)
      .bind(
        input.displayName || null,
        input.description || null,
        input.agencyName || null,
        input.debutDate || null,
        input.debutTime || null,
        startAtUtc || null,
        input.xUrl || null,
        input.profileImageUrl || null,
        nowIso,
        channelId
      )
      .run();

    if (input.displayName) {
      await db
        .prepare(`
          UPDATE streamerChannel
          SET
            channel_name = COALESCE(?, channel_name)
          WHERE id = ?
        `)
        .bind(
          input.displayName || null,
          channelId
        )
        .run();
    }

    return true;
  } catch (err) {
    console.error('updateCreatorProfileInD1 Error:', err);
    return false;
  }
}

export async function deleteCreatorProfileFromD1(
  db: D1Database | null,
  slug: string
): Promise<boolean> {
  if (!db) return true;

  try {
    const row: any = await db
      .prepare(`SELECT channel_id FROM streamerChannel_info WHERE slug = ? OR display_name = ? LIMIT 1`)
      .bind(slug.toLowerCase(), slug)
      .first();

    if (!row) return false;

    const channelId = row.channel_id;

    await db.prepare(`DELETE FROM streamerChannel_info WHERE channel_id = ?`).bind(channelId).run();
    await db.prepare(`DELETE FROM streamerChannel WHERE id = ?`).bind(channelId).run();

    return true;
  } catch (err) {
    console.error('deleteCreatorProfileFromD1 Error:', err);
    return false;
  }
}


