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
import { Flame, Tag, ArrowRight } from 'lucide-react';

interface MarketDashboardViewProps {
  overview?: AnalyticsOverviewData;
  currentContent?: CurrentContentData;
  timeseries: TimeseriesPoint[];
  heatmap: HeatmapCell[];
  categories: CategoryStat[];
  isLoading: boolean;
  onNavigateTab: (tab: 'dashboard' | 'time' | 'tags' | 'category') => void;
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
  // 대형 합방 이벤트 감지된 게임 탐색
  const eventGame = currentContent?.groups
    .flatMap((g) => g.children || [])
    .find((c) => c.eventCluster && c.eventCluster.eventDetected);

  const magnetTags = currentContent?.magnetTags || [];

  return (
    <div className="space-y-6">
      {/* 1. 데이터 수집 범위와 상태 (VDébut 확인 채널 기준 고지) */}
      <AnalyticsDataScopeCard onOpenMethodology={onOpenMethodology} />

      {/* 2. 현재 시장 핵심 관측 KPI (4개) - 실시간 데이터 수치 100% 일원화 */}
      <AnalyticsKpiCards
        kpis={overview?.kpis}
        realtimeTotals={currentContent?.totals}
      />

      {/* 🔥 실시간 대형 합방/이슈 감지 요약 & 자석 태그 퀵 프리뷰 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* A. 실시간 대형 합방 이슈 감지 */}
        <div className="bg-gradient-to-br from-rose-50/90 to-orange-50/80 border border-rose-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-rose-800">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>실시간 대형 이벤트 & 시청자 집중 원인</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-black text-[11px]">
                실시간 감지
              </span>
            </div>
            {eventGame && eventGame.eventCluster ? (
              <>
                <h4 className="text-base sm:text-lg font-black text-[#0F172A] mb-1">
                  [{eventGame.name}] {eventGame.eventCluster.eventName} 진행 중
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed mb-3">
                  {eventGame.eventCluster.advice}
                </p>
                <div className="text-xs font-black text-rose-700 bg-white/80 border border-rose-200 p-2.5 rounded-xl">
                  집중도: {eventGame.name} 시청자의 {Math.round(eventGame.eventCluster.dominantTagShare * 100)}% ({eventGame.eventCluster.channelCount}개 채널 중복)
                </div>
              </>
            ) : (
              <>
                <h4 className="text-base sm:text-lg font-black text-[#0F172A] mb-1">
                  현재 특이 대형 합방 없는 평온한 시청 흐름
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                  시청자가 특정 대형 서버에 극단적으로 쏠려있지 않아, 신규 스트리머의 일반 게임 방송 진입에 유리한 시장 상태입니다.
                </p>
              </>
            )}
          </div>
        </div>

        {/* B. 자석 태그 퀵 프리뷰 */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-800">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>사람이 가장 많이 몰리는 자석 태그</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('tags')}
                className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>전체 순위</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 my-2.5">
              {(magnetTags.length > 0 ? magnetTags.slice(0, 5) : [
                { tag: '봉누도', viewerSum: 90723 },
                { tag: '스텔라이브', viewerSum: 29993 },
                { tag: '버튜버', viewerSum: 22097 },
                { tag: '종합게임', viewerSum: 8420 },
                { tag: '신입', viewerSum: 184 },
              ]).map((t) => (
                <span
                  key={t.tag}
                  onClick={() => onNavigateTab('tags')}
                  className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] hover:border-blue-500 rounded-xl text-xs sm:text-sm font-black text-slate-800 cursor-pointer transition-all hover:bg-blue-50"
                >
                  <strong className="text-blue-700">#{t.tag}</strong> ({t.viewerSum.toLocaleString()}명)
                </span>
              ))}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-slate-600 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>💡 태그 클릭 시 상세 시청자 수와 신입 추천 조합을 확인합니다.</span>
            <span className="font-black text-blue-600 cursor-pointer" onClick={() => onNavigateTab('tags')}>
              태그 랭킹 보기 →
            </span>
          </div>
        </div>
      </div>

      {/* 3. [핵심 기능] 현재 콘텐츠별 동시시청 (게임 드릴다운 & 합방 원인 감지) */}
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

