import { ActivityDashboard } from './ActivityDashboard';
import { AnalyticsBoardPage } from './board/AnalyticsBoardPage';
import { GameBoardPage } from './board/GameBoardPage';
import { TagBoardPage } from './board/TagBoardPage';
import { MethodPage } from './board/MethodPage';
import { ChannelBoardPage } from './board/ChannelBoardPage';

interface AnalyticsLayoutProps {
  currentSubPath?: string;
  onNavigateSubPath?: (path: string) => void;
  onSelectCreator?: (creatorName: string) => void;
}

function decodePart(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

// 방송 통계 진입점. 판도 대시보드(첫 화면·게임·태그·집계 기준)와 기존 채널 기록 화면을 나눈다.
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
  return <ActivityDashboard currentSubPath={currentSubPath} onNavigate={onNavigateSubPath} />;
}
