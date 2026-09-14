import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Compass, ArrowUpRight } from 'lucide-react';
import { AnalyticsOverviewData } from '../../services/analyticsApiService';

interface DailyInsightBannerProps {
  insight?: AnalyticsOverviewData['todayInsight'];
  bestSlot?: AnalyticsOverviewData['bestOpportunitySlot'];
  onNavigateToOpportunity?: () => void;
}

export function DailyInsightBanner({
  insight,
  bestSlot,
  onNavigateToOpportunity,
}: DailyInsightBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!insight) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1836] via-[#151728] to-[#121422] border border-indigo-500/30 p-5 sm:p-6 shadow-xl mb-6">
      {/* 배경 장식 글로우 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              오늘의 시장 해석 (Insight)
            </span>
            {bestSlot && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                기회 점수 {bestSlot.score}점
              </span>
            )}
          </div>

          {/* 핵심 헤드라인 */}
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {insight.headline}
          </h2>

          {/* 상세 설명 */}
          <p className="text-xs sm:text-sm text-gray-300 mt-1.5 leading-relaxed max-w-3xl">
            {insight.description}
          </p>

          {/* 근거 지표 토글 */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <span>분석 근거 지표 확인</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isExpanded && (
              <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div>
                  <span className="text-gray-400">비교 플랫폼:</span>
                  <span className="font-bold text-white ml-1.5">{insight.basis.platform}</span>
                </div>
                <div>
                  <span className="text-gray-400">콘텐츠 카테고리:</span>
                  <span className="font-bold text-white ml-1.5">{insight.basis.category}</span>
                </div>
                <div>
                  <span className="text-gray-400">효율 격차:</span>
                  <span className="font-bold text-emerald-400 ml-1.5">{insight.basis.metricDiff}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        {onNavigateToOpportunity && (
          <button
            type="button"
            onClick={onNavigateToOpportunity}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            <Compass className="w-4 h-4" />
            <span>내 방송 기회 분석하기</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
