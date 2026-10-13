import { translatePortalText } from './portalTranslations';
import { portalWebUrl } from './portal';

// 개발·비공개 화면의 검색 제한과 운영 화면의 대표 주소를 함께 판단한다.
export function portalPageSeo(url: URL, profile?: { displayName: string; description: string; headline?: string; bannerUrl?: string; avatarUrl?: string }) {
  const path = url.pathname.replace(/\/$/, '') || '/';
  const requestedLanguage = url.searchParams.get('lang');
  const language: 'ko' | 'ja' | 'en' = requestedLanguage === 'ja' || requestedLanguage === 'en' ? requestedLanguage : 'ko';
  const text = (source: string, values: unknown[] = []) => translatePortalText(source, language, values);
  const development = url.hostname !== 'vdebut.live';
  const titles: Record<string, string> = {
    '/': '신규 버튜버 데뷔 캘린더 · 데뷔 일정과 소개', '/upload': '데뷔 일정 등록',
    '/creators': '버튜버 찾기 · 소개와 방송 콘텐츠', '/creators/register': '버튜버 소개 등록',
    '/me/favorites': '관심 버튜버', '/about': '버튜버와 팬의 소개팅', '/guide': '이용 가이드',
    '/contact': '문의·정보 정정', '/admin': '등록·문의 검토', '/privacy': '개인정보처리방침', '/terms': '이용약관',
  };
  const known = Boolean(titles[path]) || /^\/submissions\/[^/]+$/.test(path) || /^\/creator\/[^/]+$/.test(path);
  const privatePage = path === '/admin' || path.startsWith('/me/') || path.startsWith('/submissions/');
  const title = profile ? text('{0} · 소개와 데뷔 일정 | VDébut', [profile.displayName]) : `${text(titles[path] || (path.startsWith('/submissions/') ? '접수 상태 확인' : '페이지를 찾을 수 없어요'))} | VDébut`;
  const description = profile?.headline || profile?.description || text(path === '/' ? '신규 버튜버의 데뷔 날짜·시간·방송 플랫폼을 캘린더에서 확인하세요. 관심 있는 버튜버의 소개를 살펴보고, 나의 데뷔 소식도 직접 등록할 수 있습니다.' : '버튜버의 소개와 데뷔 일정, 방송 활동을 확인하고 새로운 만남을 시작하세요.');
  return { path, known, development, privatePage, title, description, language,
    robots: development || privatePage || !known ? 'noindex, nofollow' : 'index, follow',
    canonical: `https://vdebut.live${path}${language === 'ko' ? '' : `?lang=${language}`}`,
    // 개인 배너나 프로필 사진을 공유 이미지로 사용하고 자료가 없으면 서비스 이미지를 사용한다.
    image: portalWebUrl(profile?.bannerUrl || '') || portalWebUrl(profile?.avatarUrl || '') || 'https://vdebut.live/og-image.png' };
}
