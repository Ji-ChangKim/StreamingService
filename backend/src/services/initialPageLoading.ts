import { escapeActivityHtml } from './activityPageService';
import { translatePortalText } from '../../../shared/portalTranslations';
import '../../../shared/portalTranslationData';
// 앱 실행이 가능한 브라우저에서는 초기 본문을 숨기고 외부 CSS 없이 로딩 상태를 표시한다.
export const INITIAL_PAGE_LOADING_HEAD = `<script>document.documentElement.setAttribute('data-vd-js','')</script><style>
[data-vd-initial-loader]{display:none}
html[data-vd-js] [data-vd-initial-content]{display:none}
html[data-vd-js] [data-vd-initial-loader]{display:grid;place-items:center;min-height:100svh;background:#f7f9ff}
[data-vd-initial-loader] span{display:block;width:28px;height:28px;border:3px solid #dce5f6;border-top-color:#2563eb;border-radius:50%;animation:vd-initial-spin .8s linear infinite}
@keyframes vd-initial-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){[data-vd-initial-loader] span{animation:none}}
</style>`;

// 화면 Footer와 같은 안내 링크를 첫 HTML에도 둔다. 검색 로봇이 문의·약관·개인정보처리방침을 어느 페이지에서나 찾게 하기 위해서다.
// 화면 Footer는 그대로이며, 이 요소는 React가 마운트되면 사라진다.
const FOOTER_LINKS = [['/contact', '문의하기'], ['/about', '서비스'], ['/guide', '이용 가이드'], ['/terms', '이용약관'], ['/privacy', '개인정보처리방침']] as const;
export function initialPageFooter(language: 'ko' | 'ja' | 'en' = 'ko'): string {
  const esc = escapeActivityHtml;
  const query = language === 'ko' ? '' : `?lang=${language}`;
  const links = FOOTER_LINKS.map(([to, label]) => `<a href="${to}${query}">${esc(translatePortalText(label, language))}</a>`).join(' | ');
  return `<footer><nav aria-label="${esc(translatePortalText('서비스 안내', language))}">${links}</nav><p>© ${new Date().getUTCFullYear()} VDébut</p></footer>`;
}

// 검색·자바스크립트 미사용 본문은 유지하고 React가 마운트되면 로딩 요소와 함께 교체한다.
export function initialPageRoot(body: string, escapedLoadingLabel: string, language: 'ko' | 'ja' | 'en' = 'ko'): string {
  return `<div id="root"><div data-vd-initial-loader role="status" aria-label="${escapedLoadingLabel}"><span aria-hidden="true"></span></div><div data-vd-initial-content>${body}${initialPageFooter(language)}</div></div>`;
}
