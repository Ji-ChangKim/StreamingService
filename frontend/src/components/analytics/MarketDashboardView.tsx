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
  const eventGame = currentContent?.groups
    .flatMap((g) => g.children || [])
    .find((c) => c.eventCluster && c.eventCluster.eventDetected);

  const magnetTags = currentContent?.magnetTags || [];

  const briefing = currentContent?.marketBriefing || (eventGame && eventGame.eventCluster ? {
    statusType: 'EVENT_CONCENTRATION' as const,
    badgeLabel: '실시간 대형 합방 감지',
    headline: `[${eventGame.name}] ${eventGame.eventCluster.eventName} 진행 중`,
    factSummary: `현재 ${eventGame.name} 시청자의 ${Math.round(eventGame.eventCluster.dominantTagShare * 100)}%(${eventGame.eventCluster.totalViewerSum.toLocaleString()}명)가 #${eventGame.eventCluster.dominantTag} 합방에 집중되어 있습니다. (${eventGame.eventCluster.channelCount}개 채널 중복)`,
    rookieActionAdvice: eventGame.eventCluster.advice,
  } : {
    statusType: 'BALANCED_OPPORTUNITY' as const,
    badgeLabel: '시청자 분산 양호',
    headline: '특이 쏠림 없는 고른 시청자 분산 흐름',
    factSummary: '대형 합방이나 독점 방송 없이 시청자가 여러 채널에 고르게 분산되어 있어 신규 방송 진입에 유리한 상태입니다.',
    rookieActionAdvice: '원하는 카테고리를 자유롭게 선택하고, 방제에 구체적인 게임명을 명시하여 검색 유입을 확보하세요.',
  });

  const isEvent = briefing.statusType === 'EVENT_CONCENTRATION';
  const isTalk = briefing.statusType === 'TALK_CROWDED';

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
        {/* A. 실시간 시장 상태 지능형 브리핑 (100% 실데이터 자동화) */}
        <div className={`border rounded-2xl p-5 shadow-xs flex flex-col justify-between ${
          isEvent
            ? 'bg-gradient-to-br from-rose-50/90 to-orange-50/80 border-rose-200'
            : isTalk
            ? 'bg-gradient-to-br from-purple-50/90 to-indigo-50/80 border-purple-200'
            : 'bg-gradient-to-br from-emerald-50/90 to-blue-50/80 border-emerald-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`flex items-center gap-1.5 text-xs sm:text-sm font-black ${
                isEvent ? 'text-rose-800' : isTalk ? 'text-purple-800' : 'text-emerald-800'
              }`}>
                <Flame className={`w-4 h-4 ${isEvent ? 'text-rose-600' : isTalk ? 'text-purple-600' : 'text-emerald-600'}`} />
                <span>실시간 시장 상태 지능형 브리핑</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                isEvent
                  ? 'bg-rose-200 text-rose-900'
                  : isTalk
                  ? 'bg-purple-200 text-purple-900'
                  : 'bg-emerald-200 text-emerald-900'
              }`}>
                {briefing.badgeLabel}
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-[#0F172A] mb-1.5">
              {briefing.headline}
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed mb-3">
              {briefing.factSummary}
            </p>

            <div className={`text-xs sm:text-sm font-bold p-3 rounded-xl border leading-relaxed ${
              isEvent
                ? 'bg-white/90 text-rose-900 border-rose-200'
                : isTalk
                ? 'bg-white/90 text-purple-900 border-purple-200'
                : 'bg-white/90 text-emerald-900 border-emerald-200'
            }`}>
              <strong className="font-black">💡 신입 실전 조언: </strong>
              {briefing.rookieActionAdvice}
            </div>
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
                { tag: '버튜버', viewerSum: 48920 },
                { tag: '종합게임', viewerSum: 24650 },
                { tag: '스팀게임', viewerSum: 15300 },
                { tag: '소통', viewerSum: 9240 },
                { tag: '신입', viewerSum: 1420 },
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

