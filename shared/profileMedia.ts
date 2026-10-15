import type { PortalMedia, PortalProfile } from './portal';
import { portalWebUrl } from './portal';

export const PROFILE_MEDIA_KINDS = ['INTRO', 'TEASER', 'COVER', 'HIGHLIGHT', 'CLIP', 'CATCH', 'SHORT', 'REPLAY', 'BROADCAST_REPLAY', 'GROUP_PV'] as const;
export const PROFILE_MEDIA_LABELS = { INTRO: '자기소개', TEASER: '데뷔 티저', COVER: '커버곡', HIGHLIGHT: '방송 하이라이트', CLIP: '클립', CATCH: 'Catch', SHORT: 'Shorts', REPLAY: '첫 방송 다시보기', BROADCAST_REPLAY: '방송 다시보기', GROUP_PV: '팀 공통 PV' };
export const PROFILE_MEDIA_PROVIDERS = ['YOUTUBE', 'CHZZK', 'SOOP'] as const;

// 유튜브의 공개 영상 주소에서만 식별자를 얻고 채널 주소는 거절한다.
export function profileVideoId(value: string): string {
  try {
    const url = new URL(portalWebUrl(value));
    const parts = url.pathname.split('/').filter(Boolean);
    const id = url.hostname === 'youtu.be' ? parts.length === 1 ? parts[0] : ''
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)
        ? url.pathname === '/watch' ? url.searchParams.get('v') || '' : ['shorts', 'embed', 'live'].includes(parts[0]) && parts.length === 2 ? parts[1] : '' : '';
    return !url.username && !url.password && !url.port && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
  } catch { return ''; }
}

// 허용한 공개 주소만 정규화하며 임의의 HTML이나 iframe 주소는 저장하지 않는다.
export function profileMediaSource(value: string) {
  try {
    const url = new URL(portalWebUrl(value));
    if (url.username || url.password || url.port) return null;
    const youtubeId = profileVideoId(value);
    if (youtubeId) return { provider: 'YOUTUBE' as const, id: youtubeId, url: `https://youtu.be/${youtubeId}`, embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1`, thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` };
    const clip = url.hostname === 'chzzk.naver.com' && url.pathname.match(/^\/clips\/([a-zA-Z0-9_-]{6,64})\/?$/);
    if (clip) return { provider: 'CHZZK' as const, id: `clip:${clip[1]}`, url: `https://chzzk.naver.com/clips/${clip[1]}`, embedUrl: `https://chzzk.naver.com/embed/clip/${clip[1]}`, thumbnailUrl: '' };
    const replay = url.hostname === 'chzzk.naver.com' && url.pathname.match(/^\/video\/(\d{1,16})\/?$/);
    if (replay) return { provider: 'CHZZK' as const, id: `video:${replay[1]}`, url: `https://chzzk.naver.com/video/${replay[1]}`, embedUrl: '', thumbnailUrl: '' };
    const soop = ['vod.sooplive.com', 'vod.sooplive.co.kr', 'vod.afreecatv.com'].includes(url.hostname) && url.pathname.match(/^\/player\/(\d{1,16})(?:\/catch)?\/?$/);
    return soop ? { provider: 'SOOP' as const, id: soop[1], url: `https://vod.sooplive.com/player/${soop[1]}${url.pathname.includes('/catch') ? '/catch' : ''}`, embedUrl: `https://vod.sooplive.com/player/${soop[1]}/embed?autoPlay=true`, thumbnailUrl: '' } : null;
  } catch { return null; }
}

// 같은 영상의 공유 파라미터 차이는 하나의 항목으로 취급한다.
export function profileMediaKey(media: Pick<PortalMedia, 'url'>): string {
  const source = profileMediaSource(media.url);
  return source ? `${source.provider}:${source.id}` : '';
}

// 주소·플랫폼·종류를 검증하고 공개할 항목만 반환한다.
function cleanMediaItem(value: unknown): PortalMedia {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('영상 정보를 확인해 주세요.');
  const item = value as Record<string, unknown>;
  const source = typeof item.url === 'string' && item.url.length <= 1000 ? profileMediaSource(item.url) : null;
  if (!source || item.provider !== source.provider) throw new Error('선택한 플랫폼의 올바른 영상 주소를 입력해 주세요.');
  if (!PROFILE_MEDIA_KINDS.includes(item.kind as PortalMedia['kind'])) throw new Error('영상 종류를 선택해 주세요.');
  const title = typeof item.title === 'string' ? item.title.trim().slice(0, 100) : '';
  if (!title) throw new Error('영상 제목을 입력해 주세요.');
  const thumbnail = typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl.trim() : '';
  if (thumbnail && (thumbnail.length > 1000 || !portalWebUrl(thumbnail))) throw new Error('썸네일은 HTTPS 이미지 주소로 입력해 주세요.');
  return { provider: source.provider, kind: item.kind as PortalMedia['kind'], url: source.url, title, thumbnailUrl: portalWebUrl(thumbnail),
    credit: typeof item.credit === 'string' ? item.credit.trim().slice(0, 80) : '', featured: item.featured === true, linkOnly: item.linkOnly === true };
}

// 전체 목록의 크기·중복·대표 영상 수를 검증해 저장한다.
export function cleanProfileMedia(value: unknown): PortalMedia[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error('영상은 최대 12개까지 등록할 수 있어요.');
  const items = value.map(cleanMediaItem);
  if (new Set(items.map(profileMediaKey)).size !== items.length) throw new Error('같은 영상은 한 번만 등록해 주세요.');
  if (items.filter((item) => item.featured).length > 1) throw new Error('대표 영상은 하나만 선택해 주세요.');
  if (items.some((item) => item.featured && item.kind === 'GROUP_PV')) throw new Error('팀 공통 PV는 팀 소개에서 함께 보여드려요. 개인 대표 영상을 선택해 주세요.');
  return items;
}

// 새 목록이 없을 때만 기존 대표 영상·첫 방송을 읽어 하위 호환한다.
function legacyMedia(profile: PortalProfile): PortalMedia[] {
  return [
    ...(profile.videoUrl ? [{ provider: 'YOUTUBE' as const, url: profile.videoUrl, title: profile.videoTitle || PROFILE_MEDIA_LABELS[profile.videoKind || 'INTRO'], kind: profile.videoKind || 'INTRO', featured: profile.videoKind !== 'GROUP_PV' }] : []),
    ...(profile.debutVideoUrl ? [{ provider: profileMediaSource(profile.debutVideoUrl)?.provider || 'YOUTUBE', url: profile.debutVideoUrl, title: PROFILE_MEDIA_LABELS.REPLAY, kind: 'REPLAY' as const }] : []),
  ];
}

// 읽기에서도 잘못된 주소를 제외하고 동일 영상의 중복 노출을 막는다.
export function profileMediaItems(profile: PortalProfile): PortalMedia[] {
  return (profile.media ?? legacyMedia(profile)).filter((item, index, items) => Boolean(profileMediaKey(item)) && profileMediaSource(item.url)?.provider === item.provider && items.findIndex((candidate) => profileMediaKey(candidate) === profileMediaKey(item)) === index).slice(0, 12);
}

// 첫 방송 공개 여부는 시간 경과 대신 등록된 영상의 역할로 확인한다.
export function profileFirstReplay(profile: PortalProfile): PortalMedia | undefined {
  return profileMediaItems(profile).find((item) => item.kind === 'REPLAY');
}
