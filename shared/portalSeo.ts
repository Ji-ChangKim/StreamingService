import { sitePath, siteCanonical, siteAlternates } from './siteSeo';
import { HOME_INTRO, GUIDE_INTRO, profileExcerpt } from './portalEditorial';
import { translatePortalText } from './portalTranslations';
import { portalWebUrl } from './portal';

// 개발·비공개 화면의 검색 제한과 운영 화면의 대표 주소를 함께 판단한다.
export function portalPageSeo(url: URL, profile?: { displayName: string; description: string; headline?: string; bannerUrl?: string; avatarUrl?: string }, options: { unavailable?: boolean } = {}) {
  const path = sitePath(url.pathname);
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
  const missingProfile = /^\/creator\/[^/]+$/.test(path) && !profile;
  const privatePage = path === '/admin' || path.startsWith('/me/') || path.startsWith('/submissions/');
  const title = profile ? text('{0} · 소개와 데뷔 일정 | VDébut', [profile.displayName]) : `${text((missingProfile ? '버튜버 소개를 찾을 수 없어요' : titles[path]) || (path.startsWith('/submissions/') ? '접수 상태 확인' : '페이지를 찾을 수 없어요'))} | VDébut`;
  const descriptions: Record<string, string> = {
    '/': HOME_INTRO, '/guide': GUIDE_INTRO, '/about': '데뷔 일정과 방송 소개로 버튜버와 팬의 첫 만남을 연결합니다.',
    '/creators': '주요 콘텐츠와 방송 언어, 데뷔 일정을 살펴보세요. 관심 있는 버튜버는 하트로 저장할 수 있어요.',
    '/upload': '방송 채널과 데뷔 일정을 등록하세요. 날짜와 시간이 미정인 일정도 신청할 수 있으며, 운영자 검토 후 공개됩니다.',
    '/creators/register': '활동명, 방송 채널과 나의 소개를 등록하세요. 데뷔 일정 없이도 소개를 신청할 수 있습니다.',
    '/contact': '일정 변경, 소개 수정·삭제, 권리 침해와 부적절한 콘텐츠를 관련 페이지 주소와 함께 알려주세요.',
    '/privacy': 'VDébut의 등록·문의 정보, 브라우저 저장과 Google Analytics 이용에 관한 개인정보 안내입니다.',
    '/terms': 'VDébut의 서비스 이용, 소개 등록과 공개 기준, 정보 정정에 관한 안내입니다.',
    '/me/favorites': '이 브라우저에 저장한 관심 버튜버의 소개를 다시 살펴보세요.',
  };
  const description = profile ? profileExcerpt(profile, 160) : text(missingProfile ? '다른 버튜버의 소개와 데뷔 일정을 살펴보세요.' : descriptions[path] || (path.startsWith('/submissions/') ? '접수 번호와 비공개 확인 키로 문의 처리 상태를 확인하세요.' : known ? '등록 신청과 문의 내용을 확인하고 검토합니다.' : '주소를 확인하거나 데뷔 캘린더에서 새로운 만남을 찾아보세요.'));
  return { path, known, development, privatePage, title, description, language,
    robots: development || privatePage || !known || missingProfile || options.unavailable ? 'noindex, nofollow' : 'index, follow',
    canonical: siteCanonical(path, language),
    alternates: privatePage || !known || missingProfile || options.unavailable ? [] : siteAlternates(path),
    // 개인 배너나 프로필 사진을 공유 이미지로 사용하고 자료가 없으면 서비스 이미지를 사용한다.
    image: portalWebUrl(profile?.bannerUrl || '') || portalWebUrl(profile?.avatarUrl || '') || 'https://vdebut.live/og-image.png' };
}
