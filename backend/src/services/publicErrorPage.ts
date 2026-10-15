import { siteCanonical } from '../../../shared/siteSeo';
import { translatePortalText } from '../../../shared/portalTranslations';
import { escapeActivityHtml } from './activityPageService';

// 초기 데이터 조회에 실패해도 상태 코드를 유지하며 재시도와 탐색 경로를 제공한다.
export function publicErrorPage(url: URL, title: string, status: 404 | 503): string {
  const language = url.searchParams.get('lang') === 'ja' ? 'ja' : url.searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const esc = escapeActivityHtml;
  const text = (value: string) => esc(translatePortalText(value, language));
  const query = language === 'ko' ? '' : `?lang=${language}`;
  const description = status === 503 ? '잠시 후 다시 시도해 주세요. 문제가 계속되면 문의 화면으로 알려주세요.' : '주소를 확인하거나 공개된 다른 소개를 살펴보세요.';
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text(title)} | VDébut</title><meta name="description" content="${text(description)}"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${esc(siteCanonical(url.pathname, language))}"><style>body{margin:0;background:#f7f9fc;color:#19263b;font-family:system-ui,sans-serif;line-height:1.8}main{box-sizing:border-box;max-width:680px;margin:10vh auto;padding:32px 24px;overflow-wrap:anywhere}h1{font-size:clamp(24px,6vw,32px);line-height:1.4}nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}a{display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:8px 14px;color:#2453a5;text-decoration:none}a:focus-visible{outline:3px solid #60a5fa;outline-offset:3px}</style></head><body><main><p>VDébut</p><h1>${text(title)}</h1><p>${text(description)}</p><nav>${status === 503 ? `<a href="${esc(url.pathname + url.search)}">${text('다시 시도')}</a>` : ''}<a href="/${query}">${text('데뷔 캘린더로')}</a><a href="/contact${query}">${text('문의하기')}</a></nav></main></body></html>`;
}
