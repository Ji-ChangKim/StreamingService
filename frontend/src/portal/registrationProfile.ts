import { PortalPlatform, portalChannelUrl, portalWebUrl } from '../../../shared/portal';
import { parseJsonSafely } from './portalApi';

// 기존 등록처럼 주소를 기준으로 방송 플랫폼을 자동 인식한다.
export function detectRegistrationPlatform(value: string): PortalPlatform | '' {
  return (['CHZZK', 'SOOP', 'YOUTUBE', 'TWITCH'] as PortalPlatform[]).find((platform) => Boolean(portalChannelUrl(value, platform))) || '';
}

export interface ChannelCheckResult {
  exists: boolean;
  isPending?: boolean;
  slug?: string;
  displayName?: string;
  error?: string;
}

// 방송 채널 주소의 중복 등록 여부를 서버에서 확인한다 (단일 기능 함수).
export async function checkChannelAlreadyRegistered(
  url: string,
  platform: PortalPlatform,
  signal?: AbortSignal
): Promise<ChannelCheckResult> {
  const response = await fetch(
    `/api/v1/portal/channels/check?platform=${platform}&url=${encodeURIComponent(url)}`,
    { signal }
  );
  return await parseJsonSafely<ChannelCheckResult>(response, { exists: false });
}

// 기존 플랫폼 조회 API를 재사용하되 기등록 주소는 즉시 예외를 발생시킨다.
export async function fetchRegistrationProfile(url: string, platform: PortalPlatform, signal: AbortSignal) {
  // 1. 이미 등록/검토 중인 방송국 주소인지 우선 검사
  const check = await checkChannelAlreadyRegistered(url, platform, signal);
  if (check.exists) {
    const error = new Error(check.error || '이미 등록된 주소입니다.');
    (error as any).alreadyExists = true;
    (error as any).existingSlug = check.slug;
    (error as any).existingName = check.displayName;
    throw error;
  }

  // 2. 외부 플랫폼 정보 조회
  const response = await fetch(`/api/v1/platform/profile?platform=${platform}&url=${encodeURIComponent(url)}`, { signal });
  const result = await parseJsonSafely<Record<string, any>>(response, {});
  if (!response.ok || !result.success || !result.creatorName) {
    throw new Error('방송국 정보를 불러오지 못했어요. 다시 시도하거나 활동명과 소개를 직접 입력해 주세요.');
  }

  return {
    displayName: String(result.creatorName),
    description: typeof result.description === 'string' ? result.description : '',
    avatarUrl: portalWebUrl(result.profileImageUrl || ''),
    channelUrl: portalChannelUrl(result.channelUrl || '', platform) || portalChannelUrl(url, platform),
  };
}
