import {
  AnalyticsOverviewData,
  TimeseriesPoint,
  HeatmapCell,
  CategoryStat,
  LiveSample,
} from '../../services/analyticsApiService';
import { DailyInsightBanner } from './DailyInsightBanner';
import { AnalyticsKpiCards } from './AnalyticsKpiCards';
import { DemandSupplyChart } from './DemandSupplyChart';
import { OpportunityMiniHeatmap } from './OpportunityMiniHeatmap';
import { CategoryShareBar } from './CategoryShareBar';
import { LiveSampleSection } from './LiveSampleSection';
import { Award, ArrowUpRight } from 'lucide-react';

interface MarketDashboardViewProps {
  overview?: AnalyticsOverviewData;
  timeseries: TimeseriesPoint[];
  heatmap: HeatmapCell[];
  categories: CategoryStat[];
  liveSamples: LiveSample[];
  isLoading: boolean;
  onNavigateTab: (tab: 'dashboard' | 'time' | 'category' | 'opportunity') => void;
}

export function MarketDashboardView({
  overview,
  timeseries,
  heatmap,
  categories,
  liveSamples,
  isLoading,
  onNavigateTab,
}: MarketDashboardViewProps) {
  const bestSlot = overview?.bestOpportunitySlot;

  return (
    <div className="space-y-6">
      {/* 1. 오늘의 해석 배너 */}
      <DailyInsightBanner
        insight={overview?.todayInsight}
        bestSlot={bestSlot}
        onNavigateToOpportunity={() => onNavigateTab('opportunity')}
      />

      {/* 2. 4대 핵심 KPI 카드 */}
      <AnalyticsKpiCards
        kpis={overview?.kpis}
      />

      {/* 3. 추천 시간 후보 카드 (Top 1 하이라이트) */}
      {bestSlot && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#141829] to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400">현재 시장 최고 추천 슬롯</span>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  점수 {bestSlot.score}점
                </span>
                <span className="text-[10px] font-bold text-gray-400">신뢰도: {bestSlot.confidence}</span>
              </div>
              <h4 className="text-base font-black text-white mt-0.5">{bestSlot.slotName}</h4>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl">{bestSlot.reason}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('opportunity')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            <span>맞춤 기회 상세 보기</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. 수요·공급 종합 추이 차트 */}
      <DemandSupplyChart data={timeseries} isLoading={isLoading} />

      {/* 5. 기회 히트맵 프리뷰 */}
      <OpportunityMiniHeatmap
        cells={heatmap}
        onNavigateToFullTime={() => onNavigateTab('time')}
        isLoading={isLoading}
      />

      {/* 6. 콘텐츠 소비 점유율 비교 바 */}
      <CategoryShareBar
        categories={categories}
        onNavigateToCategory={() => onNavigateTab('category')}
        isLoading={isLoading}
      />

      {/* 7. 현재 LIVE 참고 방송 샘플 */}
      <LiveSampleSection samples={liveSamples} isLoading={isLoading} />
    </div>
  );
}
