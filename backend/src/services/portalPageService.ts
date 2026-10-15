import { PortalProfile } from '../../../shared/portal';
import { portalPageSeo } from '../../../shared/portalSeo';
import { translatePortalText } from '../../../shared/portalTranslations';
import { escapeActivityHtml, activityJson } from './activityPageService';
import { INITIAL_PAGE_LOADING_HEAD, initialPageRoot } from './initialPageLoading';
import { isPublicProfile } from '../../../shared/contentReview';

// 운영 셸의 메타데이터와 최초 본문을 공개 주소에 맞추고 외부 문자열을 이스케이프한다.
export function renderPortalPage(html: string, url: URL, profile?: PortalProfile): string {
  profile = profile && isPublicProfile(profile) ? profile : undefined;
  const seo = portalPageSeo(url, profile);
  const esc = escapeActivityHtml;
  const text = (source: string) => esc(translatePortalText(source, seo.language));
  html = html.replace(/<html\b[^>]*>/, `<html lang="${seo.language}">`);
  const alternates = ['ko', 'ja', 'en'].map((language) => `<link rel="alternate" hreflang="${language}" href="https://vdebut.live${esc(seo.path)}${language === 'ko' ? '' : `?lang=${language}`}">`).join('');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`)
    .replace(/<meta\b[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '')
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/g, '');
  html = html.replace('</head>', `<meta name="description" content="${esc(seo.description)}"><meta name="robots" content="${seo.robots}"><link rel="canonical" href="${esc(seo.canonical)}"><meta property="og:title" content="${esc(seo.title)}"><meta property="og:description" content="${esc(seo.description)}"><meta property="og:url" content="${esc(seo.canonical)}"><meta property="og:image" content="${esc(seo.image)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(seo.title)}"><meta name="twitter:description" content="${esc(seo.description)}"><meta name="twitter:image" content="${esc(seo.image)}"><script type="application/ld+json">${activityJson({ '@context': 'https://schema.org', '@type': 'WebPage', name: seo.title, url: seo.canonical, description: seo.description })}</script></head>`);
  html = html.replace('</head>', `${alternates}${INITIAL_PAGE_LOADING_HEAD}</head>`);
  const languageQuery = seo.language === 'ko' ? '' : `?lang=${seo.language}`;
  const body = `<main><h1>${esc(profile?.displayName || seo.title.split(' | ')[0])}</h1><p>${esc(seo.description)}</p><nav><a href="/${languageQuery}">${text('데뷔 캘린더')}</a> · <a href="/creators${languageQuery}">${text('버튜버 찾기')}</a> · <a href="/analytics${languageQuery}">${text('방송 통계')}</a></nav>${profile?.channelUrl ? `<p><a href="${esc(profile.channelUrl)}" rel="noopener noreferrer">${text('공식 방송 채널')}</a></p>` : ''}</main>`;
  return html.replace(/<div id="root">[\s\S]*?<\/div>/, initialPageRoot(body, text('화면을 불러오고 있어요')));
}

// 운영 공개 목록에 승인된 신규 소개도 포함하고 비공개 주소는 제외한다.
export function portalSitemap(profiles: PortalProfile[]): string {
  const paths = ['/', '/upload', '/creators', '/creators/register', '/about', '/guide', '/contact', '/privacy', '/terms'];
  return [...paths, ...profiles.filter(isPublicProfile).map((profile) => `/creator/${encodeURIComponent(profile.slug)}`)]
    .map((path) => `<url><loc>https://vdebut.live${path}</loc></url>`).join('');
}
