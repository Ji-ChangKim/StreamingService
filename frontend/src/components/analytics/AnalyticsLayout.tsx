import { lazy, Suspense } from 'react';
import { AnalyticsBoardPage } from './board/AnalyticsBoardPage';
import { GameBoardPage } from './board/GameBoardPage';
import { TagBoardPage } from './board/TagBoardPage';
import { MethodPage } from './board/MethodPage';
import { ChannelBoardPage } from './board/ChannelBoardPage';

// 예전 활동 대시보드는 새 화면이 처리하지 않는 주소에서만 쓰므로 따로 내려받는다(통계 첫 화면 용량 절감).
const ActivityDashboard = lazy(() => import('./ActivityDashboard').then((m) => ({ default: m.ActivityDashboard })));

interface AnalyticsLayoutProps {
  currentSubPath?: string;
  onNavigateSubPath?: (path: string) => void;
  onSelectCreator?: (creatorName: string) => void;
}

function decodePart(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

// 방송 통계 진입점. 판도 대시보드(첫 화면·게임·태그·채널·집계 기준)와 그 밖의 예전 주소를 나눈다.
export function AnalyticsLayout({ currentSubPath, onNavigateSubPath }: AnalyticsLayoutProps) {
  const path = (currentSubPath || window.location.pathname).split('?')[0].replace(/\/+$/, '') || '/analytics';
  const navigate = (next: string) => { if (onNavigateSubPath) onNavigateSubPath(next); else { window.history.pushState({}, '', next); window.dispatchEvent(new PopStateEvent('popstate')); } window.scrollTo({ top: 0 }); };
  if (path.startsWith('/analytics/game/')) return <GameBoardPage name={decodePart(path.slice('/analytics/game/'.length))} onNavigate={navigate} />;
  if (path.startsWith('/analytics/tag/')) return <TagBoardPage tag={decodePart(path.slice('/analytics/tag/'.length))} onNavigate={navigate} />;
  if (path === '/analytics/method') return <MethodPage onNavigate={navigate} />;
  if (path.startsWith('/analytics/streamer/')) {
    const key = decodePart(path.slice('/analytics/streamer/'.length));
    if (/^(CHZZK:[a-f0-9]{32}|SOOP:[a-z0-9_]{1,50})$/i.test(key)) return <ChannelBoardPage key={key} channelKey={key} onNavigate={navigate} />;
  }
  if (path === '/analytics' || path === '/analytics/chzzk' || path === '/analytics/soop') return <AnalyticsBoardPage path={path} onNavigate={navigate} />;
  return <Suspense fallback={null}><ActivityDashboard currentSubPath={currentSubPath} onNavigate={onNavigateSubPath} /></Suspense>;
}
