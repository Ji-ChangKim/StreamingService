import { siteAlternates, siteCanonical } from '../../../shared/siteSeo';

// XML 본문과 속성에 들어갈 주소를 동일하게 이스케이프한다.
function xmlText(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]!)); }

// 실제 수정 시각이 있는 경우에만 lastmod를 기록한다.
export function sitemapEntry(path: string, language: 'ko' | 'ja' | 'en' = 'ko', alternates = false, modified?: string): string {
  return `<url><loc>${xmlText(siteCanonical(path, language))}</loc>${alternates ? siteAlternates(path).map((link) => `<xhtml:link rel="alternate" hreflang="${link.language}" href="${xmlText(link.href)}" />`).join('') : ''}${modified && Number.isFinite(Date.parse(modified)) ? `<lastmod>${xmlText(modified)}</lastmod>` : ''}</url>`;
}
