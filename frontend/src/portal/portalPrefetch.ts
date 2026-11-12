import { prefetchProfileDetail } from './useProfileDetail';

// 소개 상세로 가는 링크·카드에 마우스를 올리거나 손가락을 댄 순간 화면 코드와 상세 자료를 함께 미리 받는다.
export function warmCreator(slug: string): void {
  if (!slug) return;
  void import('./CreatorPages').catch(() => undefined);
  prefetchProfileDetail(slug);
}

// 링크 주소에서 소개 식별자를 꺼낸다. 소개 상세가 아니면 빈 값을 돌려준다.
export function creatorSlugFromPath(to: string): string {
  const match = /^\/creator\/([^/?#]+)/.exec(to);
  if (!match) return '';
  try { return decodeURIComponent(match[1]); } catch { return ''; }
}

// 첫 화면이 뜬 뒤 브라우저가 쉬는 시간에 자주 가는 화면의 코드를 미리 받는다.
export function warmPortalRoutes(): void {
  const run = () => { void import('./CreatorPages').catch(() => undefined); void import('./PortalStatistics').catch(() => undefined); };
  const idle = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(run, { timeout: 4000 }); else window.setTimeout(run, 2500);
}
