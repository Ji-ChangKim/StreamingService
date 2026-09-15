import { useState, useEffect } from 'react';
import {
  AnalyticsFilterState,
  AnalyticsOverviewData,
  TimeseriesPoint,
  HeatmapCell,
  CategoryStat,
  MethodologyInfo,
  CurrentContentData,
  fetchAnalyticsOverview,
  fetchAnalyticsTimeseries,
  fetchAnalyticsHeatmap,
  fetchAnalyticsCategories,
  fetchAnalyticsMethodology,
  fetchCurrentContent,
} from '../../services/analyticsApiService';
import { AnalyticsStatusBar } from './AnalyticsStatusBar';
import { MethodologyModal } from './MethodologyModal';
import { MarketDashboardView } from './MarketDashboardView';
import { LiveDiscoveryView } from './LiveDiscoveryView';
import { Radio, History, TrendingUp, Calendar, Clock } from 'lucide-react';

interface AnalyticsLayoutProps {
  currentSubPath?: string;
  onNavigateSubPath?: (path: string) => void;
  onSelectCreator?: (creatorName: string) => void;
}

type DiscoveryTab = 'live' | 'history' | 'trends';

export function AnalyticsLayout({
  currentSubPath = '/analytics',
  onNavigateSubPath,
  onSelectCreator,
}: AnalyticsLayoutProps) {
  // 1. URL 쿼리 파라미터 기반 서브탭 초기화 (기본값: 'live')
  const [activeTab, setActiveTab] = useState<DiscoveryTab>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get('tab');
      if (tabParam === 'history') return 'history';
      if (tabParam === 'trends' || tabParam === 'dashboard' || tabParam === 'time' || tabParam === 'tags' || tabParam === 'category') {
        return 'trends';
      }
      if (currentSubPath.includes('/time') || currentSubPath.includes('/tags') || currentSubPath.includes('/category')) {
        return 'trends';
      }
      return 'live';
    } catch {
      return 'live';
    }
  });

  // 필터 상태 (방송 동향용)
  const filters: AnalyticsFilterState = {
    platform: 'ALL',
    period: 'today',
    dayScope: 'ALL',
    timeSlot: 'ALL',
    categoryGroup: 'ALL',
    creatorTier: 'ALL',
  };

  // 모달 상태
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // 동향 분석용 데이터 상태
  const [overview, setOverview] = useState<AnalyticsOverviewData | undefined>();
  const [currentContent, setCurrentContent] = useState<CurrentContentData | undefined>();
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [methodology, setMethodology] = useState<MethodologyInfo | undefined>();
  const [meta, setMeta] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);

  // 탭 변경 핸들러 (기획서 4절 URL 상태 보존)
  const handleTabChange = (tab: DiscoveryTab) => {
    setActiveTab(tab);
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', tab);
    const targetUrl = `/analytics?${sp.toString()}`;

    if (onNavigateSubPath) {
      onNavigateSubPath(targetUrl);
    } else {
      window.history.pushState({}, '', targetUrl);
    }
  };

  // 동향 데이터 로드 (trends 탭 진입 시 또는 초기)
  const loadTrendsData = async () => {
    setIsLoading(true);
    try {
      const [ovRes, tsRes, hmRes, catRes, methRes, curRes] = await Promise.all([
        fetchAnalyticsOverview(filters.platform),
        fetchAnalyticsTimeseries(filters.platform, filters.dayScope),
        fetchAnalyticsHeatmap(filters.platform),
        fetchAnalyticsCategories(filters.platform),
        fetchAnalyticsMethodology(),
        fetchCurrentContent(filters.platform),
      ]);

      setOverview(ovRes.data);
      setMeta(ovRes.meta);
      setTimeseries(tsRes.data);
      setHeatmap(hmRes.data);
      setCategories(catRes.data);
      setMethodology(methRes.data);
      setCurrentContent(curRes);
    } catch (err) {
      console.error('Failed to load analytics trends data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trends') {
      loadTrendsData();
    }
  }, [activeTab, filters.platform, filters.dayScope]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pt-4 sm:pt-6 pb-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ===================================================================
          1. 타이틀 및 헤더 영역 (기획서 1절 목적 반영)
          =================================================================== */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              VDébut <span className="text-[#2563EB]">방송 탐색</span>
            </h1>
            <span className="text-[11px] font-black bg-blue-50 text-[#2563EB] border border-blue-200 px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-2xl leading-relaxed">
            시청자와 스트리머가 지금 볼 방송을 찾고, 지난 방송과 스트리머의 활동 기록을 확인하는 곳입니다.
          </p>
        </div>
      </div>

      {/* ===================================================================
          2. GNB 서브 네비게이션 탭 (지금 방송 | 지난 방송 | 방송 동향)
          (기획서 4절 GNB와 페이지 위계 반영)
          =================================================================== */}
      <div className="flex items-center gap-1 sm:gap-2 p-1.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl mb-5 overflow-x-auto shadow-2xs">
        {/* 탭 1: 지금 방송 (기본) */}
        <button
          type="button"
          onClick={() => handleTabChange('live')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'live'
              ? 'bg-[#0F172A] text-white shadow-sm font-black'
              : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80 font-bold'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-500" />
          <span>지금 방송</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono font-black">
            실시간
          </span>
        </button>

        {/* 탭 2: 지난 방송 */}
        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#0F172A] text-white shadow-sm font-black'
              : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80 font-bold'
          }`}
        >
          <History className="w-4 h-4 text-indigo-500" />
          <span>지난 방송</span>
        </button>

        {/* 탭 3: 방송 동향 (보조 탭) */}
        <button
          type="button"
          onClick={() => handleTabChange('trends')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'trends'
              ? 'bg-[#0F172A] text-white shadow-sm font-black'
              : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80 font-bold'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>방송 동향</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
            통계
          </span>
        </button>
      </div>

      {/* ===================================================================
          3. 탭별 뷰 컴포넌트 렌더링
          =================================================================== */}

      {/* A. 지금 방송 (메인 탐색 뷰) */}
      {activeTab === 'live' && (
        <LiveDiscoveryView
          initialPlatform="ALL"
          onNavigateTab={(tab) => handleTabChange(tab as DiscoveryTab)}
          onSelectCreator={onSelectCreator}
        />
      )}

      {/* B. 지난 방송 (타임라인 조회 화면) */}
      {activeTab === 'history' && (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-10 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                  특정 날짜·시간의 방송 기록 조회
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                특정 날짜와 시간대에 겹쳐 관측된 버튜버 방송 목록과 당시 콘텐츠를 확인합니다. (KST 기준)
              </p>
            </div>

            {/* 날짜 선택 간이 바 */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-[#F8FAFC] border border-[#CBD5E1] p-1.5 rounded-xl text-xs font-bold">
              <Calendar className="w-4 h-4 text-slate-500 ml-1" />
              <span>오늘 기준 최근 관측 기록</span>
            </div>
          </div>

          <div className="py-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm sm:text-base font-black text-[#0F172A]">
              지난 방송 타임라인 서비스 순차 연동 중
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              기획서 6절에 명시된 날짜·시간대별 가로 시간선 및 구간별 콘텐츠 변화 기록을 정밀 구축하고 있습니다.
              현재는 <strong>'지금 방송'</strong> 탭에서 실시간 라이브를 바로 확인하실 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => handleTabChange('live')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>지금 방송 보러가기</span>
            </button>
          </div>
        </div>
      )}

      {/* C. 방송 동향 (종합 통계 대시보드) */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* 데이터 수집 시각 및 기준 안내 바 */}
          <AnalyticsStatusBar
            meta={meta}
            onOpenMethodology={() => setIsMethodologyOpen(true)}
            onRefresh={loadTrendsData}
            isLoading={isLoading}
          />

          {/* 객관적 통계 중심의 마켓 대시보드 */}
          <MarketDashboardView
            overview={overview}
            currentContent={currentContent}
            timeseries={timeseries}
            heatmap={heatmap}
            categories={categories}
            isLoading={isLoading}
            onNavigateTab={(tab) => {
              if (tab === 'dashboard') handleTabChange('trends');
              else handleTabChange('trends');
            }}
            onOpenMethodology={() => setIsMethodologyOpen(true)}
          />
        </div>
      )}

      {/* 데이터 산출 기준 안내 모달 */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        methodology={methodology}
      />
    </div>
  );
}
