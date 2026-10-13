import { PortalPlatform, portalChannelUrl, portalWebUrl } from '../../../shared/portal';

// 기존 등록처럼 주소를 기준으로 방송 플랫폼을 자동 인식한다.
export function detectRegistrationPlatform(value: string): PortalPlatform | '' {
  return (['CHZZK', 'SOOP', 'YOUTUBE', 'TWITCH'] as PortalPlatform[]).find((platform) => Boolean(portalChannelUrl(value, platform))) || '';
}

// 기존 플랫폼 조회 API를 재사용하고 조회 실패 시 수동 입력을 안내한다.
export async function fetchRegistrationProfile(url: string, platform: PortalPlatform, signal: AbortSignal) {
  const response = await fetch(`/api/v1/platform/profile?platform=${platform}&url=${encodeURIComponent(url)}`, { signal });
  const result = await response.json();
  if (!response.ok || !result.success || !result.creatorName) throw new Error('방송국 정보를 불러오지 못했어요. 다시 시도하거나 활동명과 소개를 직접 입력해 주세요.');
  return { displayName: String(result.creatorName), description: typeof result.description === 'string' ? result.description : '', avatarUrl: portalWebUrl(result.profileImageUrl || ''), channelUrl: portalChannelUrl(result.channelUrl || '', platform) || portalChannelUrl(url, platform) };
}
