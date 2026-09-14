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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border border-blue-200/80 p-5 sm:p-6 shadow-sm mb-6">
      {/* 부드러운 라이트 데코 블러 */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/90 text-[#2563EB] border border-blue-200 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              오늘의 시장 해석 (Insight)
            </span>
            {bestSlot && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-300">
                기회 점수 {bestSlot.score}점
              </span>
            )}
          </div>

          {/* 핵심 헤드라인 */}
          <h2 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight leading-snug">
            {insight.headline}
          </h2>

          {/* 상세 설명 */}
          <p className="text-xs sm:text-sm text-[#334155] mt-1.5 leading-relaxed max-w-3xl">
            {insight.description}
          </p>

          {/* 근거 지표 토글 */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-blue-800 transition-colors cursor-pointer"
            >
              <span>분석 근거 지표 확인</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isExpanded && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/90 border border-blue-200 text-xs text-[#334155] grid grid-cols-1 sm:grid-cols-3 gap-2.5 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
                <div>
                  <span className="text-[#64748B]">비교 플랫폼:</span>
                  <span className="font-bold text-[#0F172A] ml-1.5">{insight.basis.platform}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">콘텐츠 카테고리:</span>
                  <span className="font-bold text-[#0F172A] ml-1.5">{insight.basis.category}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">효율 격차:</span>
                  <span className="font-bold text-emerald-700 ml-1.5">{insight.basis.metricDiff}</span>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
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
