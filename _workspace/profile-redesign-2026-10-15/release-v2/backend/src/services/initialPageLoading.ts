// 앱 실행이 가능한 브라우저에서는 초기 본문을 숨기고 외부 CSS 없이 로딩 상태를 표시한다.
export const INITIAL_PAGE_LOADING_HEAD = `<script>document.documentElement.setAttribute('data-vd-js','')</script><style>
[data-vd-initial-loader]{display:none}
html[data-vd-js] [data-vd-initial-content]{display:none}
html[data-vd-js] [data-vd-initial-loader]{display:grid;place-items:center;min-height:100svh;background:#f7f9ff}
[data-vd-initial-loader] span{display:block;width:28px;height:28px;border:3px solid #dce5f6;border-top-color:#2563eb;border-radius:50%;animation:vd-initial-spin .8s linear infinite}
@keyframes vd-initial-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){[data-vd-initial-loader] span{animation:none}}
</style>`;

// 검색·자바스크립트 미사용 본문은 유지하고 React가 마운트되면 로딩 요소와 함께 교체한다.
export function initialPageRoot(body: string, escapedLoadingLabel: string): string {
  return `<div id="root"><div data-vd-initial-loader role="status" aria-label="${escapedLoadingLabel}"><span aria-hidden="true"></span></div><div data-vd-initial-content>${body}</div></div>`;
}
