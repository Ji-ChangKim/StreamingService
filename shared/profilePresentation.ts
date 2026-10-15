import { PortalProfile, PORTAL_PLATFORMS, portalChannelKey, portalChannelUrl, portalUtc, portalWebUrl } from './portal';
import { cleanProfileMedia, profileMediaSource, profileVideoId } from './profileMedia';
export { profileVideoId } from './profileMedia';

export const PROFILE_VIDEO_KINDS = ['INTRO', 'TEASER', 'GROUP_PV', 'REPLAY', 'COVER', 'HIGHLIGHT'] as const;
export const PROFILE_VIDEO_LABELS = { INTRO: '자기소개', TEASER: '데뷔 티저', GROUP_PV: '팀 공통 PV', REPLAY: '첫 방송 다시보기', COVER: '커버곡', HIGHLIGHT: '방송 하이라이트' };

// 개인 활동 구분값은 숨기고 입력된 그룹·소속사 이름만 공개한다.
export function profileAgencyName(agency: string | undefined): string {
  return /^(?:(?:개인세|개인|인디|무소속|個人勢|個人|無所属|indie|independent|none|n\/a)|[\s/|·,()[\]_-])+$/i.test((agency || '').normalize('NFKC').trim()) ? '' : (agency || '').trim();
}

// 영상별 주소 처리는 플랫폼 공통 모듈에서 검증한다.

// 공개 선택 항목의 문자열 길이를 제한한다.
function presentationText(body: Record<string, unknown>, key: string, max: number): string {
  return typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, max) : '';
}

// 잘못 입력한 선택 주소는 조용히 지우지 않고 수정을 안내한다.
function presentationUrl(body: Record<string, unknown>, key: string): string {
  const value = presentationText(body, key, 1000);
  if (value && !portalWebUrl(value)) throw new Error('추가 링크와 이미지 주소는 HTTPS 주소로 입력해 주세요.');
  return portalWebUrl(value);
}

// 대표 방송 채널과 중복되는 추가 채널을 제거하고 실제 채널 주소만 받는다.
function presentationChannels(body: Record<string, unknown>): NonNullable<PortalProfile['additionalChannels']> {
  if (body.additionalChannels === undefined) return [];
  if (!Array.isArray(body.additionalChannels) || body.additionalChannels.length > 4) throw new Error('추가 방송 채널은 최대 4개까지 등록할 수 있어요.');
  const seen = new Set([portalChannelKey(String(body.channelUrl || ''), String(body.platform || ''))]);
  return body.additionalChannels.reduce<NonNullable<PortalProfile['additionalChannels']>>((channels, item) => {
    if (!item || typeof item !== 'object') throw new Error('추가 채널의 플랫폼과 채널 주소를 확인해 주세요.');
    const platform = item.platform;
    const channelUrl = typeof item.channelUrl === 'string' ? portalChannelUrl(item.channelUrl.trim(), platform) : '';
    const key = portalChannelKey(channelUrl, platform);
    if (!PORTAL_PLATFORMS.some((p) => p.id === platform) || !key) throw new Error('추가 채널의 플랫폼과 채널 주소를 확인해 주세요.');
    if (!seen.has(key)) { seen.add(key); channels.push({ platform, channelUrl }); }
    return channels;
  }, []);
}

// 접수·관리자 수정·본인 수정에서 같은 홍보 자료 검증을 사용한다.
export function cleanProfilePresentation(body: Record<string, unknown>) {
  const videoUrl = presentationUrl(body, 'videoUrl');
  const debutVideoUrl = presentationUrl(body, 'debutVideoUrl');
  const videoKind = presentationText(body, 'videoKind', 20) || 'INTRO';
  if (videoUrl && !profileVideoId(videoUrl)) throw new Error('대표 영상은 YouTube 영상 주소로 입력해 주세요.');
  if (debutVideoUrl && !profileMediaSource(debutVideoUrl)) throw new Error('데뷔 방송은 YouTube·치지직·SOOP 영상 주소로 입력해 주세요.');
  if (!PROFILE_VIDEO_KINDS.includes(videoKind as NonNullable<PortalProfile['videoKind']>)) throw new Error('대표 영상의 종류를 선택해 주세요.');
  return { headline: presentationText(body, 'headline', 100), bannerUrl: presentationUrl(body, 'bannerUrl'),
    websiteUrl: presentationUrl(body, 'websiteUrl'), noticeUrl: presentationUrl(body, 'noticeUrl'), xUrl: presentationUrl(body, 'xUrl'),
    // 공식 카페는 SNS와 별도로 저장하며 다른 선택 링크와 같은 주소 검증을 적용한다.
    cafeUrl: presentationUrl(body, 'cafeUrl'),
    additionalChannels: presentationChannels(body), videoUrl, debutVideoUrl, videoTitle: presentationText(body, 'videoTitle', 100),
    ...(body.media === undefined ? {} : { media: cleanProfileMedia(body.media) }),
    regularSchedule: presentationText(body, 'regularSchedule', 160), fanGuide: presentationText(body, 'fanGuide', 1500),
    notices: presentationNotices(body.notices),
    videoKind: videoKind as NonNullable<PortalProfile['videoKind']> };
}

// 소식은 짧은 제목과 HTTPS 원문 주소만 받아 공개한다.
function presentationNotices(value: unknown): NonNullable<PortalProfile['notices']> {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 3) throw new Error('주요 소식은 최대 3개까지 등록할 수 있어요.');
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('소식 제목과 원문 주소를 입력해 주세요.');
    const title = presentationText(entry, 'title', 100);
    const url = presentationUrl(entry, 'url');
    if (!title || !url) throw new Error('소식 제목과 원문 주소를 입력해 주세요.');
    return { title, url };
  });
}

// 시간 경과는 예정 시각의 경과만 뜻하며 실제 방송 여부를 추측하지 않는다.
export function profileDebutPhase(profile: PortalProfile, now: number): 'UPCOMING' | 'PAST' | 'UNCONFIRMED' {
  return profile.dateState !== 'FIXED' || !Number.isFinite(Date.parse(profile.startAtUtc)) ? 'UNCONFIRMED'
    : Date.parse(profile.startAtUtc) > now ? 'UPCOMING' : 'PAST';
}

// 관리자가 명시한 데뷔 그룹만 연결하고 확정 일정을 시간순으로 정렬한다.
export function profileDebutMembers(profile: PortalProfile, profiles: PortalProfile[]): PortalProfile[] {
  return profile.debutGroupId ? profiles.filter((item) => item.debutGroupId === profile.debutGroupId)
    .sort((a, b) => profileDebutOrder(a) - profileDebutOrder(b) || a.displayName.localeCompare(b.displayName, 'ko')) : [];
}

// 서로 다른 시간대도 실제 시각으로 정렬하고 날짜가 없는 멤버는 마지막에 둔다.
function profileDebutOrder(profile: PortalProfile): number {
  const date = profile.dateState === 'FIXED' ? profile.startAtUtc : profile.dateState === 'TIME_TBD' ? portalUtc(profile.debutDate, '23:59', profile.timezone) : '';
  return Number.isFinite(Date.parse(date)) ? Date.parse(date) : Infinity;
}

// 공지·SNS·홈페이지의 같은 주소는 역할이 가장 명확한 링크 하나로 표시한다.
export function profileLinkKey(value: string): string {
  try { const url = new URL(portalWebUrl(value)); [...url.searchParams.keys()].filter((key) => key.startsWith('utm_')).forEach((key) => url.searchParams.delete(key)); return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}${url.search}`; } catch { return ''; }
}
