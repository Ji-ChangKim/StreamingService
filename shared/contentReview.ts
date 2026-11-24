import type { PortalProfile } from './portal';

// 자동 탐지는 검토 보조이며 최종 이미지·영상·권리 검토를 대신하지 않는다.
const REVIEW_PATTERNS = [
  /(?:야동|성인방송|벗방|섹스|자위|음란물|후방주의|19금)/i,
  /(?:porn(?:ography)?|onlyfans|sexually explicit|nude cam)/i,
  /(?:ミッドナイト叡智|エッな世界|よろシコ|アダルト配信|ポルノ|エロ配信)/i,
  // 성인용 팬아트·콘텐츠 태그 안내는 실제 노출 내용을 확인하기 전까지 공개하지 않는다.
  /(?:^|[^a-z0-9])(?:r-?18g?|nsfw)(?![a-z0-9])/i,
];

// 단순 언급과 금지 의도를 구분할 수 없으므로 신호가 있으면 공개 전 재검토한다.
export function needsContentReview(text: string): boolean {
  return REVIEW_PATTERNS.some((pattern) => pattern.test(text.normalize('NFKC')));
}

// 자동으로 붙인 영상 제목을 활동명으로 승인하지 않도록 보류 신호를 만든다.
export function looksLikeVideoTitle(name: string): boolean {
  return /【[^】]*(?:初配信|飲酒配信|新人VTuber)[^】]*】|\[(?:첫\s*방송|데뷔\s*방송|LIVE)\]/i.test(name.normalize('NFKC'));
}

// 검토 기록 자체와 소유권은 제외하고 공개되는 모든 프로필 값을 비교한다.
export function reviewSnapshot(profile: PortalProfile): string {
  return JSON.stringify(Object.fromEntries(Object.entries(profile).filter(([key]) => !['contentReview', 'ownerVerified', 'requesterRole', 'source'].includes(key)).sort(([a], [b]) => a.localeCompare(b))));
}

// 검토 후 내용이 바뀌었거나 보류된 소개는 공개 경로에서 제외한다.
// 기존 라이브 등록 데이터(source === 'EXISTING')는 기본 공개하되 부적절 표현은 차단한다.
export function isPublicProfile(profile: PortalProfile): boolean {
  if (looksLikeVideoTitle(profile.displayName)) return false;
  if (needsContentReview(Object.values(profile.details || {}).join(' '))) return false;
  // 영상 목록·팬 안내·소식에도 기존 공개 검토 기준을 동일하게 적용한다.
  if (needsContentReview([profile.displayName, profile.description, profile.headline, profile.videoTitle, profile.debutGroupName, profile.agency, profile.regularSchedule, profile.fanGuide, ...(profile.media || []).flatMap((item) => [item.title, item.credit]), ...(profile.notices || []).map((item) => item.title), ...profile.tags].join(' '))) return false;
  if (profile.contentReview) {
    return profile.contentReview.state === 'APPROVED' && profile.contentReview.snapshot === reviewSnapshot(profile);
  }
  return profile.source === 'EXISTING';
}

// 운영자 승인 시점의 내용을 저장하며 이용자가 보낸 검토 필드는 사용하지 않는다.
export function reviewedProfile(profile: PortalProfile, state: 'APPROVED' | 'HOLD', reviewedAt: string): PortalProfile {
  return { ...profile, contentReview: { state, snapshot: reviewSnapshot(profile), reviewedAt } };
}

// 외부 방송 제목의 의심 표현은 원문 대신 중립적인 안내로 표시한다.
export function publicBroadcastTitle(title: string): string {
  return needsContentReview(title) ? '방송 제목 확인 중' : title;
}

// 통계 응답과 초기 본문에서 같은 외부 제목 필드를 재귀적으로 정리한다.
export function publicBroadcastPayload<T>(value: T): T {
  return (Array.isArray(value) ? value.map(publicBroadcastPayload) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /^(?:title|broadcastTitle|streamTitle)$/i.test(key) && typeof item === 'string' ? publicBroadcastTitle(item) : publicBroadcastPayload(item)])) : value) as T;
}

// 공개 응답에는 검토 상태와 검토일만 남긴다. 검토 시점의 전체 사본(snapshot)은 서버 판정에만 쓰므로 내려보내지 않는다.
export function publicProfileView(profile: PortalProfile): PortalProfile {
  return profile.contentReview ? { ...profile, contentReview: { state: profile.contentReview.state, reviewedAt: profile.contentReview.reviewedAt, snapshot: '' } } : profile;
}

// 검색 허용 기준(기획문서 41번 A1). 사람이 직접 쓴 소개 글자 수(활동명·기호 제외)와 최근 30일 방송 수로 정한다.
// 기준에 못 미치는 소개는 목록·캘린더·링크로는 그대로 보이고, 검색 노출(noindex)과 사이트맵에서만 빠진다.
// 소개를 보강하거나 방송 기록이 쌓이면 자동으로 다시 포함된다.
export const PROFILE_INDEX_OWN_CHARS = 100;
export const PROFILE_INDEX_OWN_CHARS_WITH_RECORD = 50;
export const PROFILE_INDEX_BROADCASTS_30D = 5;
export function profileOwnTextLength(profile: PortalProfile): number {
  const details = profile.details;
  return [profile.description, profile.headline, details?.contentSummary, details?.broadcastStyle, details?.fanMessage, profile.fanGuide, profile.regularSchedule]
    .filter(Boolean).join(' ').split(profile.displayName || '\u0000').join('').replace(/[^\p{L}\p{N}]/gu, '').length;
}
export function isProfileIndexable(profile: PortalProfile, broadcasts30 = 0): boolean {
  const own = profileOwnTextLength(profile);
  return own >= PROFILE_INDEX_OWN_CHARS || (own >= PROFILE_INDEX_OWN_CHARS_WITH_RECORD && broadcasts30 >= PROFILE_INDEX_BROADCASTS_30D);
}
// 예전 이름. 방송 기록 없이 판단할 때(사이트맵 기록 조회 실패 등) 쓴다.
export function isThinProfile(profile: PortalProfile): boolean { return !isProfileIndexable(profile, 0); }
