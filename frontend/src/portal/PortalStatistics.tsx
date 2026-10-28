import { AnalyticsLayout } from '../components/analytics/AnalyticsLayout';

// 치지직·SOOP 스트리밍 시장 통합 분석 대시보드 뷰
export function PortalStatistics({ path, onNavigate }: { path: string; onNavigate: (path: string) => void }) {
  return (
    <div className="vd-statistics">
      <AnalyticsLayout currentSubPath={path} onNavigateSubPath={onNavigate} />
    </div>
  );
}

