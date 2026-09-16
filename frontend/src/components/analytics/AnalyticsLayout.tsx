import { BroadcastStatisticsDashboard } from './BroadcastStatisticsDashboard';

interface AnalyticsLayoutProps {
  currentSubPath?: string;
  onNavigateSubPath?: (path: string) => void;
  onSelectCreator?: (creatorName: string) => void;
}

// 방송 통계 진입점을 통합하고 기존 analytics 주소를 유지한다.
export function AnalyticsLayout({ currentSubPath }: AnalyticsLayoutProps) {
  return <BroadcastStatisticsDashboard currentSubPath={currentSubPath} />;
}