import { useState, useEffect } from 'react';
import {
  AnalyticsFilterState,
  AnalyticsOverviewData,
  TimeseriesPoint,
  HeatmapCell,
  CategoryStat,
  LiveSample,
  MethodologyInfo,
  OpportunityRecommendation,
  fetchAnalyticsOverview,
  fetchAnalyticsTimeseries,
  fetchAnalyticsHeatmap,
  fetchAnalyticsCategories,
  fetchAnalyticsOpportunities,
  fetchAnalyticsLiveSamples,
  fetchAnalyticsMethodology,
} from '../../services/analyticsApiService';
import { AnalyticsFilterBar } from './AnalyticsFilterBar';
import { AnalyticsStatusBar } from './AnalyticsStatusBar';
import { MethodologyModal } from './MethodologyModal';
import { MarketDashboardView } from './MarketDashboardView';
import { TimeAnalysisView } from './TimeAnalysisView';
import { CategoryAnalysisView } from './CategoryAnalysisView';
import { OpportunityFinderView } from './OpportunityFinderView';
import { LayoutDashboard, Clock, Layers, Compass, BarChart3 } from 'lucide-react';

interface AnalyticsLayoutProps {
  currentSubPath?: string;
  onNavigateSubPath?: (path: string) => void;
}

export function AnalyticsLayout({ currentSubPath = '/analytics', onNavigateSubPath }: AnalyticsLayoutProps) {
  // 필터 상태
  const [filters, setFilters] = useState<AnalyticsFilterState>({
    platform: 'ALL',
    period: '7d',
    dayScope: 'ALL',
    timeSlot: 'ALL',
    categoryGroup: 'ALL',
    creatorTier: 'ALL',
  });

  // 서브탭 상태 (dashboard, time, category, opportunity)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'time' | 'category' | 'opportunity'>(() => {
    if (currentSubPath.includes('/time')) return 'time';
    if (currentSubPath.includes('/category')) return 'category';
    if (currentSubPath.includes('/opportunity')) return 'opportunity';
    return 'dashboard';
  });

  // 모달 상태
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // 데이터 상태
  const [overview, setOverview] = useState<AnalyticsOverviewData | undefined>();
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [liveSamples, setLiveSamples] = useState<LiveSample[]>([]);
  const [methodology, setMethodology] = useState<MethodologyInfo | undefined>();
  const [opportunities, setOpportunities] = useState<OpportunityRecommendation[]>([]);
  const [meta, setMeta] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);

  // 탭 변경 핸들러
  const handleTabChange = (tab: 'dashboard' | 'time' | 'category' | 'opportunity') => {
    setActiveTab(tab);
    let targetPath = '/analytics';
    if (tab === 'time') targetPath = '/analytics/time';
    else if (tab === 'category') targetPath = '/analytics/category';
    else if (tab === 'opportunity') targetPath = '/analytics/opportunity';

    if (onNavigateSubPath) {
      onNavigateSubPath(targetPath);
    } else {
      window.history.pushState({}, '', targetPath);
    }
  };

  // 데이터 로드
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [ovRes, tsRes, hmRes, catRes, lsRes, methRes, oppRes] = await Promise.all([
        fetchAnalyticsOverview(filters.platform),
        fetchAnalyticsTimeseries(filters.platform, filters.dayScope),
        fetchAnalyticsHeatmap(filters.platform),
        fetchAnalyticsCategories(filters.platform),
        fetchAnalyticsLiveSamples(filters.platform),
        fetchAnalyticsMethodology(),
        fetchAnalyticsOpportunities({
          platform: filters.platform,
          category: filters.categoryGroup,
          availableDays: [5, 6, 0],
          timeStartHour: 20,
          timeEndHour: 27,
          expectedDurationHours: 3,
          creatorTier: filters.creatorTier,
        }),
      ]);

      setOverview(ovRes.data);
      setMeta(ovRes.meta);
      setTimeseries(tsRes.data);
      setHeatmap(hmRes.data);
      setCategories(catRes.data);
      setLiveSamples(lsRes.data);
      setMethodology(methRes.data);
      setOpportunities(oppRes.data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [filters.platform, filters.period, filters.dayScope, filters.categoryGroup, filters.creatorTier]);

  return (
    <div className="min-h-screen bg-[#0b0e17] text-white pt-20 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 타이틀 및 헤더 영역 */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              VDébut Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">방송 인사이트</span>
            </h1>
            <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Beta v0.1
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            치지직·SOOP 버튜버 라이브 데이터를 시간·요일·콘텐츠별로 분석하여, 신규·중소 버튜버가 언제 어떤 콘텐츠로 방송해야 가장 유리한지 판단을 지원합니다.
          </p>
        </div>
      </div>

      {/* 4대 핵심 서브 네비게이션 탭 (LNB/Tab Bar) */}
      <div className="flex items-center gap-1.5 p-1 bg-[#121626]/90 backdrop-blur-xl border border-white/10 rounded-2xl mb-5 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>시장 대시보드</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('time')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'time'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>시간대 분석</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('category')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'category'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>콘텐츠 분석</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('opportunity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'opportunity'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>방송 기회 제안기</span>
        </button>
      </div>

      {/* 공통 필터 바 */}
      <AnalyticsFilterBar
        filters={filters}
        onChange={setFilters}
        onRefresh={loadAllData}
        isLoading={isLoading}
      />

      {/* 데이터 상태 바 */}
      <AnalyticsStatusBar
        meta={meta}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* 탭별 뷰 컴포넌트 렌더링 */}
      {activeTab === 'dashboard' && (
        <MarketDashboardView
          overview={overview}
          timeseries={timeseries}
          heatmap={heatmap}
          categories={categories}
          liveSamples={liveSamples}
          isLoading={isLoading}
          onNavigateTab={handleTabChange}
        />
      )}

      {activeTab === 'time' && (
        <TimeAnalysisView
          cells={heatmap}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'category' && (
        <CategoryAnalysisView
          categories={categories}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'opportunity' && (
        <OpportunityFinderView
          initialRecommendations={opportunities}
          isLoading={isLoading}
          onCalculate={async (req) => {
            const res = await fetchAnalyticsOpportunities(req);
            return res.data;
          }}
        />
      )}

      {/* 데이터 기준 및 산식 가이드 모달 */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        methodology={methodology}
      />
    </div>
  );
}
