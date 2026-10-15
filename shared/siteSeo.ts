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

// 개발 사이트는 수집을 막고 운영 사이트는 공개 본문과 정적 자산 접근을 허용한다.
export function siteRobots(hostname: string): string {
  return hostname === 'vdebut.live' ? 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /me/\nDisallow: /submissions/\nDisallow: /api/\nSitemap: https://vdebut.live/sitemap.xml\n' : 'User-agent: *\nDisallow: /\n';
}

// 공개된 제목·설명·대표 주소만 구조화 정보에 사용한다.
export function pageStructuredData(seo: { title: string; description: string; canonical: string }) {
  return { '@context': 'https://schema.org', '@type': 'WebPage', name: seo.title, description: seo.description, url: seo.canonical };
}
