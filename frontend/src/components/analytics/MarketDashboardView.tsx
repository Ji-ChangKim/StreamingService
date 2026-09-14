import {
  AnalyticsOverviewData,
  TimeseriesPoint,
  HeatmapCell,
  CategoryStat,
  CurrentContentData,
} from '../../services/analyticsApiService';
import { AnalyticsDataScopeCard } from './AnalyticsDataScopeCard';
import { AnalyticsKpiCards } from './AnalyticsKpiCards';
import { CurrentContentPanel } from './CurrentContentPanel';
import { DemandSupplyChart } from './DemandSupplyChart';
import { OpportunityMiniHeatmap } from './OpportunityMiniHeatmap';
import { CategoryShareBar } from './CategoryShareBar';
import { AnalyticsRawDataTable } from './AnalyticsRawDataTable';

interface MarketDashboardViewProps {
  overview?: AnalyticsOverviewData;
  currentContent?: CurrentContentData;
  timeseries: TimeseriesPoint[];
  heatmap: HeatmapCell[];
  categories: CategoryStat[];
  isLoading: boolean;
  onNavigateTab: (tab: 'dashboard' | 'time' | 'category') => void;
  onOpenMethodology?: () => void;
}

export function MarketDashboardView({
  overview,
  currentContent,
  timeseries,
  heatmap,
  categories,
  isLoading,
  onNavigateTab,
  onOpenMethodology,
}: MarketDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* 1. 데이터 수집 범위와 상태 (VDébut 확인 채널 기준 고지) */}
      <AnalyticsDataScopeCard onOpenMethodology={onOpenMethodology} />

      {/* 2. 현재 시장 핵심 관측 KPI (4개) */}
      <AnalyticsKpiCards
        kpis={overview?.kpis}
      />

      {/* 3. [핵심 기능] 현재 콘텐츠별 동시시청 (게임 드릴다운) */}
      <CurrentContentPanel
        data={currentContent}
        isLoading={isLoading}
      />

      {/* 4. 24시간 수요·공급 관측 추이 차트 */}
      <DemandSupplyChart data={timeseries} isLoading={isLoading} />

      {/* 5. 요일 × 시간대 시장 관측 히트맵 */}
      <OpportunityMiniHeatmap
        cells={heatmap}
        onNavigateToFullTime={() => onNavigateTab('time')}
        isLoading={isLoading}
      />

      {/* 6. 콘텐츠 소비 점유율 vs 공급 점유율 비교 바 */}
      <CategoryShareBar
        categories={categories}
        onNavigateToCategory={() => onNavigateTab('category')}
        isLoading={isLoading}
      />

      {/* 7. 시간대별 관측 원본 데이터 표 */}
      <AnalyticsRawDataTable
        cells={heatmap}
        isLoading={isLoading}
      />
    </div>
  );
}

