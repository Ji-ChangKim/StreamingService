import { D1Database } from '@cloudflare/workers-types';
import { PortalPlatform, portalChannelKey, portalChannelUrl } from '../../../shared/portal';
import { readPortalProfiles } from './portalProfileRepository';

export interface ChannelDuplicateCheckResult {
  exists: boolean;
  isPending?: boolean;
  slug?: string;
  displayName?: string;
  error?: string;
}

/**
 * 방송 채널 URL 중복 여부 확인 단일 전용 함수 (SRP)
 * - 이미 승인/등록된 프로필 (portal_profiles & streamerChannel)
 * - 현재 검토 대기 중인 신청 (portal_pending_channels & portal_requests)
 * 위 두 가지를 모두 전수 대조하여 중복 시 예외 결과를 반환합니다.
 */
export async function checkRegisteredChannel(
  db: D1Database,
  channelUrl: string,
  platform: PortalPlatform
): Promise<ChannelDuplicateCheckResult> {
  if (!channelUrl || !platform) {
    return { exists: false };
  }

  const safeUrl = portalChannelUrl(channelUrl, platform);
  const targetKey = portalChannelKey(channelUrl, platform);

  if (!targetKey) {
    return { exists: false };
  }

  // 1. 이미 등록/승인된 프로필 전수 대조
  const profiles = await readPortalProfiles(db);
  const existing = profiles.find((p) => {
    // 키 정규화 비교
    const key = portalChannelKey(p.channelUrl, p.platform);
    if (key && key === targetKey) return true;
    // URL 원문 직접 비교 (슬래시 트림 등 호환)
    if (safeUrl && p.channelUrl && portalChannelUrl(p.channelUrl, p.platform) === safeUrl) return true;
    return false;
  });

  if (existing) {
    return {
      exists: true,
      isPending: false,
      slug: existing.slug,
      displayName: existing.displayName,
      error: '이미 등록된 주소입니다.',
    };
  }

  // 2. 현재 심사/검토 대기 중인 신청 채널 대조
  const pending = await db
    .prepare('SELECT request_id FROM portal_pending_channels WHERE channel_key = ?')
    .bind(targetKey)
    .first<{ request_id: string }>();

  if (pending) {
    return {
      exists: true,
      isPending: true,
      error: '이미 검토 중인 채널입니다. 정보 변경은 문의로 알려주세요.',
    };
  }

  // 3. 레거시 대기 신청(portal_requests PENDING) JSON 페이로드 대조
  const oldPending = await db
    .prepare("SELECT payload FROM portal_requests WHERE status='PENDING' AND kind IN ('DEBUT','PROFILE')")
    .all<{ payload: string }>();

  for (const row of oldPending.results || []) {
    try {
      const p = JSON.parse(row.payload);
      if (p.channelUrl && p.platform && portalChannelKey(p.channelUrl, p.platform) === targetKey) {
        return {
          exists: true,
          isPending: true,
          error: '이미 검토 중인 채널입니다. 정보 변경은 문의로 알려주세요.',
        };
      }
    } catch {
      // JSON 파싱 실패 건은 건너뜁니다.
    }
  }

  return { exists: false };
}
