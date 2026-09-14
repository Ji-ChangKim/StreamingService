import { useState, useEffect } from 'react';
import {
  AnalyticsFilterState,
  AnalyticsOverviewData,
  TimeseriesPoint,
  HeatmapCell,
  CategoryStat,
  MethodologyInfo,
  PlatformFilter,
  fetchAnalyticsOverview,
  fetchAnalyticsTimeseries,
  fetchAnalyticsHeatmap,
  fetchAnalyticsCategories,
  fetchAnalyticsMethodology,
} from '../../services/analyticsApiService';
import { AnalyticsFilterBar } from './AnalyticsFilterBar';
import { AnalyticsStatusBar } from './AnalyticsStatusBar';
import { MethodologyModal } from './MethodologyModal';
import { MarketDashboardView } from './MarketDashboardView';
import { TimeAnalysisView } from './TimeAnalysisView';
import { CategoryAnalysisView } from './CategoryAnalysisView';
import { LayoutDashboard, Clock, Layers, BarChart3 } from 'lucide-react';

interface AnalyticsLayoutProps {
  currentSubPath?: string;
  onNavigateSubPath?: (path: string) => void;
}

export function AnalyticsLayout({ currentSubPath = '/analytics', onNavigateSubPath }: AnalyticsLayoutProps) {
  // 최상위 플랫폼 상태 ('CHZZK' | 'SOOP')
  const [currentPlatform, setCurrentPlatform] = useState<PlatformFilter>('CHZZK');
  const [showSoopNotice, setShowSoopNotice] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState<AnalyticsFilterState>({
    platform: 'CHZZK',
    period: '28d',
    dayScope: 'ALL',
    timeSlot: 'ALL',
    categoryGroup: 'ALL',
    creatorTier: 'ALL',
  });

  // 서브탭 상태 (dashboard, time, category)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'time' | 'category'>(() => {
    if (currentSubPath.includes('/time')) return 'time';
    if (currentSubPath.includes('/category')) return 'category';
    return 'dashboard';
  });

  // 모달 상태
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // 데이터 상태
  const [overview, setOverview] = useState<AnalyticsOverviewData | undefined>();
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [methodology, setMethodology] = useState<MethodologyInfo | undefined>();
  const [meta, setMeta] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);

  // 플랫폼 전환 핸들러
  const handlePlatformChange = (p: PlatformFilter) => {
    if (p === 'SOOP') {
      setShowSoopNotice(true);
      // 안내 후 4초 뒤 알림 숨김
      setTimeout(() => setShowSoopNotice(false), 4000);
      return;
    }
    setShowSoopNotice(false);
    setCurrentPlatform(p);
    setFilters((prev) => ({ ...prev, platform: p }));
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: 'dashboard' | 'time' | 'category') => {
    setActiveTab(tab);
    let targetPath = '/analytics';
    if (tab === 'time') targetPath = '/analytics/time';
    else if (tab === 'category') targetPath = '/analytics/category';

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
      const [ovRes, tsRes, hmRes, catRes, methRes] = await Promise.all([
        fetchAnalyticsOverview(filters.platform),
        fetchAnalyticsTimeseries(filters.platform, filters.dayScope),
        fetchAnalyticsHeatmap(filters.platform),
        fetchAnalyticsCategories(filters.platform),
        fetchAnalyticsMethodology(),
      ]);

      setOverview(ovRes.data);
      setMeta(ovRes.meta);
      setTimeseries(tsRes.data);
      setHeatmap(hmRes.data);
      setCategories(catRes.data);
      setMethodology(methRes.data);
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pt-4 sm:pt-6 pb-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 타이틀 및 헤더 영역 */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              VDébut Analytics <span className="text-[#2563EB]">시장 현황 관측소</span>
            </h1>
            <span className="text-[10px] font-extrabold bg-blue-50 text-[#2563EB] border border-blue-200 px-2 py-0.5 rounded-full">
              Beta v0.2
            </span>
          </div>
          <p className="text-xs text-[#475569] max-w-2xl leading-relaxed">
            VDébut에서 확인한 버튜버 채널의 방송 시장 현황을 시간·요일·콘텐츠별로 객관적으로 관측·비교합니다.
          </p>
        </div>
      </div>

      {/* 1계층: 최상위 플랫폼 선택 탭 (치지직 / SOOP) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 p-1 bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl shadow-2xs">
          {/* 치지직 */}
          <button
            type="button"
            onClick={() => handlePlatformChange('CHZZK')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentPlatform === 'CHZZK'
                ? 'bg-white text-[#0F172A] shadow-xs border border-emerald-500/30'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <img
              src="/icons/chzzk_icon.png"
              alt="치지직"
              className="w-4 h-4 object-contain shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/icons/logo_chzzk.png';
              }}
            />
            <span>치지직</span>
          </button>

          {/* SOOP (준비중) */}
          <button
            type="button"
            onClick={() => handlePlatformChange('SOOP')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentPlatform === 'SOOP'
                ? 'bg-white text-[#0F172A] shadow-xs border border-blue-500/30'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <img
              src="/icons/soop/soop_symbol_blue.svg"
              alt="SOOP"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span>SOOP</span>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-md">
              준비중
            </span>
          </button>
        </div>

        {/* SOOP 선택 시 연동 준비 안내 메시지 */}
        {showSoopNotice && (
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in duration-200">
            <span>ℹ️ SOOP 버튜버 방송 데이터는 현재 수집 및 정제 연동 준비 중입니다.</span>
          </div>
        )}
      </div>

      {/* 2계층: 3대 핵심 서브 네비게이션 탭 (시장 현황 | 시간대 분석 | 콘텐츠 분석) */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl mb-4 overflow-x-auto shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#0F172A] text-white shadow-sm font-bold'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/80 font-semibold'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>시장 현황</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('time')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'time'
              ? 'bg-[#0F172A] text-white shadow-sm font-bold'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/80 font-semibold'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>시간대 분석</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('category')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'category'
              ? 'bg-[#0F172A] text-white shadow-sm font-bold'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/80 font-semibold'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>콘텐츠 분석</span>
        </button>
      </div>

      {/* 3계층: 데이터 상태 바 (데이터 수집 시각 + 새로고침 버튼 결합) */}
      <AnalyticsStatusBar
        meta={meta}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onRefresh={loadAllData}
        isLoading={isLoading}
      />

      {/* 4계층: 공통 세부 필터 바 (기간, 요일, 시간대, 대분류, 규모) */}
      <AnalyticsFilterBar
        filters={filters}
        onChange={setFilters}
      />

      {/* 5계층: 탭별 뷰 컴포넌트 렌더링 */}
      {activeTab === 'dashboard' && (
        <MarketDashboardView
          overview={overview}
          timeseries={timeseries}
          heatmap={heatmap}
          categories={categories}
          isLoading={isLoading}
          onNavigateTab={handleTabChange}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
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

      {/* 데이터 기준 가이드 모달 */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        methodology={methodology}
      />
    </div>
  );
}
