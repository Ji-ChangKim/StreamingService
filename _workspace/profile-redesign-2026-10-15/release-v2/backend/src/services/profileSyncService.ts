import { fetchPlatformProfile } from './platformApiService';

export interface SyncResult {
  totalChecked: number;
  updatedCount: number;
  failedCount: number;
  details: Array<{
    displayName: string;
    platform: string;
    success: boolean;
    avatarUrl?: string;
  }>;
}

/**
 * D1 DB에서 프로필 사진이 비어있거나 플레이스홀더인 스트리머를 찾아
 * 플랫폼 공식 API/파서로 실시간 수집 후 DB에 자동 UPDATE
 */
export async function syncMissingProfilesInD1(db: D1Database): Promise<SyncResult> {
  const result: SyncResult = {
    totalChecked: 0,
    updatedCount: 0,
    failedCount: 0,
    details: [],
  };

  try {
    const { results } = await db.prepare(`
      SELECT 
        i.id as info_id,
        i.display_name,
        i.profile_image_url,
        i.description,
        c.platform,
        c.channel_url
      FROM streamerChannel_info i
      INNER JOIN streamerChannel c ON i.channel_id = c.id
      WHERE i.profile_image_url IS NULL 
         OR i.profile_image_url = '' 
         OR i.profile_image_url LIKE '%unsplash%'
      LIMIT 50
    `).all();

    if (!results || results.length === 0) {
      return result;
    }

    result.totalChecked = results.length;

    for (const row of results as any[]) {
      try {
        const profile = await fetchPlatformProfile(row.platform, row.channel_url);
        if (profile && profile.success && profile.profileImageUrl) {
          await db.prepare(`
            UPDATE streamerChannel_info
            SET profile_image_url = ?,
                description = COALESCE(NULLIF(description, ''), ?),
                display_name = CASE WHEN display_name LIKE '%신입%' OR display_name = '' THEN ? ELSE display_name END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(
            profile.profileImageUrl,
            profile.description || `${row.display_name}의 공식 데뷔 방송입니다.`,
            profile.creatorName || row.display_name,
            row.info_id
          ).run();

          result.updatedCount++;
          result.details.push({
            displayName: row.display_name,
            platform: row.platform,
            success: true,
            avatarUrl: profile.profileImageUrl,
          });
        } else {
          result.failedCount++;
          result.details.push({
            displayName: row.display_name,
            platform: row.platform,
            success: false,
          });
        }
      } catch (err) {
        result.failedCount++;
        result.details.push({
          displayName: row.display_name,
          platform: row.platform,
          success: false,
        });
      }
    }
  } catch (err) {
    console.error('syncMissingProfilesInD1 Error:', err);
  }

  return result;
}
