export const SITE_ORIGIN = 'https://vdebut.live';
export const PORTAL_INDEX_PATHS = ['/', '/upload', '/creators', '/creators/register', '/about', '/guide', '/contact', '/privacy', '/terms'];
export type SiteLanguage = 'ko' | 'ja' | 'en';

// 말미 슬래시가 다른 주소도 같은 대표 경로로 정리한다.
export function sitePath(path: string): string { return path.replace(/\/+$/, '') || '/'; }

// 언어 외의 검색 조건·접수 키·추적 값은 대표 주소에 넣지 않는다.
export function siteCanonical(path: string, language: SiteLanguage = 'ko'): string {
  return `${SITE_ORIGIN}${sitePath(path)}${language === 'ko' ? '' : `?lang=${language}`}`;
}

// 실제 제공하는 포털의 세 언어 주소와 기본 언어를 연결한다.
export function siteAlternates(path: string) {
  return [...(['ko', 'ja', 'en'] as const).map((language) => ({ language, href: siteCanonical(path, language) })), { language: 'x-default', href: siteCanonical(path) }];
}

// 화면 렌더링에 필요한 공개 조회 API만 허용하고 관리·접수·소유자 확인 API는 계속 막는다.
// Google은 가장 긴 경로 규칙을 적용하므로 세부 Disallow가 상위 Allow보다 우선한다.
export const PUBLIC_CRAWLABLE_API_PATHS = ['/api/v1/portal/profiles', '/api/v1/events', '/api/analytics/', '/api/discovery/'];
const PRODUCTION_ROBOTS = [
  'User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /me/', 'Disallow: /submissions/', 'Disallow: /api/',
  ...PUBLIC_CRAWLABLE_API_PATHS.map((path) => `Allow: ${path}`),
  'Disallow: /api/v1/portal/profiles/*/access',
  'Sitemap: https://vdebut.live/sitemap.xml',
].join('\n') + '\n';

// 개발 사이트는 수집을 막고 운영 사이트는 공개 본문과 정적 자산 접근을 허용한다.
export function siteRobots(hostname: string): string {
  return hostname === 'vdebut.live' ? PRODUCTION_ROBOTS : 'User-agent: *\nDisallow: /\n';
}

// 공개된 제목·설명·대표 주소만 구조화 정보에 사용한다.
export function pageStructuredData(seo: { title: string; description: string; canonical: string }) {
  return { '@context': 'https://schema.org', '@type': 'WebPage', name: seo.title, description: seo.description, url: seo.canonical };
}
