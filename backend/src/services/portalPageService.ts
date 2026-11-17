import { PORTAL_INDEX_PATHS, pageStructuredData } from '../../../shared/siteSeo';
import { sitemapEntry } from './sitemapEntry';
import { portalEditorialBody } from './portalEditorialBody';
import { PortalProfile } from '../../../shared/portal';
import { portalPageSeo } from '../../../shared/portalSeo';
import { translatePortalText } from '../../../shared/portalTranslations';
import '../../../shared/portalTranslationData'; // 서버 초기 HTML은 세 언어 사전을 항상 사용한다.
import { escapeActivityHtml, activityJson } from './activityPageService';
import { INITIAL_PAGE_LOADING_HEAD, initialPageRoot } from './initialPageLoading';
import { isPublicProfile, isThinProfile, publicProfileView } from '../../../shared/contentReview';

// 운영 셸의 메타데이터와 최초 본문을 공개 주소에 맞추고 외부 문자열을 이스케이프한다.
export function renderPortalPage(html: string, url: URL, profile?: PortalProfile, profiles: PortalProfile[] = []): string {
  profile = profile && isPublicProfile(profile) ? profile : undefined;
  const seo = portalPageSeo(url, profile);
  const esc = escapeActivityHtml;
  const text = (source: string) => esc(translatePortalText(source, seo.language));
  html = html.replace(/<html\b[^>]*>/, `<html lang="${seo.language}">`);
  const alternates = seo.alternates.map((link) => `<link rel="alternate" hreflang="${link.language}" href="${esc(link.href)}">`).join('');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`)
    .replace(/<meta\b[^>]*(?:name="(?:title|description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '')
    .replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/g, '')
    .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '');
  html = html.replace('</head>', `<meta name="description" content="${esc(seo.description)}"><meta name="robots" content="${seo.robots}"><link rel="canonical" href="${esc(seo.canonical)}"><meta property="og:title" content="${esc(seo.title)}"><meta property="og:description" content="${esc(seo.description)}"><meta property="og:url" content="${esc(seo.canonical)}"><meta property="og:image" content="${esc(seo.image)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(seo.title)}"><meta name="twitter:description" content="${esc(seo.description)}"><meta name="twitter:image" content="${esc(seo.image)}"><script type="application/ld+json">${activityJson(pageStructuredData(seo))}</script></head>`);
  // 홈·소개 목록은 화면이 전체 소개 목록을 받아야 그려진다. 자바스크립트가 뜨기를 기다리지 않고 목록 요청을 바로 시작한다.
  // 주소는 frontend/src/portal/portalApi.ts의 fetchPublicProfiles와 같아야 같은 요청으로 재사용된다.
  const preload = seo.path === '/' || seo.path === '/creators' ? '<link rel="preload" href="/api/v1/portal/profiles?version=3" as="fetch" crossorigin="anonymous">' : '';
  html = html.replace('</head>', `${alternates}${preload}${INITIAL_PAGE_LOADING_HEAD}</head>`);
  const languageQuery = seo.language === 'ko' ? '' : `?lang=${seo.language}`;
  const body = `<main><h1>${esc(profile?.displayName || seo.title.split(' | ')[0])}</h1>${profile ? '' : `<p>${esc(seo.description)}</p>`}<nav><a href="/${languageQuery}">${text('데뷔 캘린더')}</a> · <a href="/analytics${languageQuery}">${text('방송 통계')}</a> · <a href="/creators${languageQuery}">${text('버튜버 DB')}</a> · <a href="/guide${languageQuery}">${text('이용 가이드')}</a></nav>${profile?.channelUrl ? `<p><a href="${esc(profile.channelUrl)}" rel="noopener noreferrer">${text('공식 방송 채널')}</a></p>` : ''}${portalEditorialBody(seo.path, seo.language, profile, profiles.filter(isPublicProfile))}</main>`;
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, initialPageRoot(body, text('화면을 불러오고 있어요'), seo.language));
  // 소개 상세는 전체 목록을 기다리지 않도록 이 버튜버의 공개 정보를 첫 HTML에 함께 보낸다.
  return profile ? html.replace('</body>', `<script type="application/json" id="vd-initial-profile">${activityJson(publicProfileView(profile))}</script></body>`) : html;
}

// 운영 공개 목록에 승인된 신규 소개도 포함하고 비공개 주소는 제외한다.
export function portalSitemap(profiles: PortalProfile[]): string {
  // 얇은 소개는 보강 전까지 사이트맵에 넣지 않는다.
  const profilePaths = profiles.filter((profile) => isPublicProfile(profile) && !isThinProfile(profile)).map((profile) => `/creator/${encodeURIComponent(profile.slug)}`);
  // 안내 페이지는 본문까지 번역돼 있어 세 언어를 모두 싣는다. 프로필은 소개글이 원문 그대로라 한국어판만 싣는다.
  const pages = [...new Set(PORTAL_INDEX_PATHS)].flatMap((path) => (['ko', 'ja', 'en'] as const).map((language) => sitemapEntry(path, language, true)));
  const creators = [...new Set(profilePaths)].map((path) => sitemapEntry(path, 'ko'));
  return [...pages, ...creators].join('');
}
