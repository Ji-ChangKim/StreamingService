import { AnalyticsOverviewData, CurrentContentData } from '../../services/analyticsApiService';
import { Users, Radio, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AnalyticsKpiCardsProps {
  kpis?: AnalyticsOverviewData['kpis'];
  realtimeTotals?: CurrentContentData['totals'];
}

export function AnalyticsKpiCards({ kpis, realtimeTotals }: AnalyticsKpiCardsProps) {
  if (!kpis && !realtimeTotals) return null;

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');

  // 실시간 수집 데이터가 있으면 최우선 반영 (수치 100% 일원화)
  const displayTotalViewers = realtimeTotals?.viewerSum ?? kpis?.totalViewers.current ?? 0;
  const displayLiveCount = realtimeTotals?.liveCount ?? kpis?.liveCount.current ?? 0;
  const displayAverageViewers = realtimeTotals?.averageViewers ?? kpis?.viewersPerLive.current ?? 0;
  const displayMedianViewers = realtimeTotals?.medianViewers ?? kpis?.viewersPerLive.median ?? 0;
  const displayGrowthViewers = kpis?.totalViewers.growthRate ?? 0;
  const displayGrowthLive = kpis?.liveCount.growthRate ?? 0;
  const displayConcentration = kpis?.top10Concentration.current ?? 0.45;
  const displayDiffPp = kpis?.top10Concentration.diffPp ?? -9;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. 현재 동시시청 합계 */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-blue-500 transition-all">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-base font-black text-[#0F172A] block">동시시청 합계</span>
            <span className="text-xs sm:text-sm text-slate-700 font-bold">현재 방송 중인 전체 시청자 수</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight font-mono">
              {formatNumber(displayTotalViewers)}
            </span>
            <span className="text-base font-black text-slate-800">명</span>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs sm:text-sm font-bold">
            {displayGrowthViewers >= 0 ? (
              <span className="flex items-center text-emerald-700 font-black">
                <ArrowUpRight className="w-4 h-4" />
                +{displayGrowthViewers}%
              </span>
            ) : (
              <span className="flex items-center text-rose-700 font-black">
                <ArrowDownRight className="w-4 h-4" />
                {displayGrowthViewers}%
              </span>
            )}
            <span className="text-slate-700 font-medium">직전 동일 시각 대비</span>
          </div>
        </div>
      </div>

      {/* 2. 현재 LIVE 방송 수 */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-purple-500 transition-all">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-base font-black text-[#0F172A] block">LIVE 방송 수</span>
            <span className="text-xs sm:text-sm text-slate-700 font-bold">현재 실시간 방송 진행 채널</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight font-mono">
              {formatNumber(displayLiveCount)}
            </span>
            <span className="text-base font-black text-slate-800">개 채널</span>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs sm:text-sm font-bold">
            {displayGrowthLive >= 0 ? (
              <span className="flex items-center text-emerald-700 font-black">
                <ArrowUpRight className="w-4 h-4" />
                +{displayGrowthLive}%
              </span>
            ) : (
              <span className="flex items-center text-rose-700 font-black">
                <ArrowDownRight className="w-4 h-4" />
                {displayGrowthLive}%
              </span>
            )}
            <span className="text-slate-700 font-medium">직전 동일 시각 대비</span>
          </div>
        </div>
      </div>

      {/* 3. 방송당 시청 (평균과 중앙값) */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-all">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-base font-black text-[#0F172A] block">방송당 평균 시청</span>
            <span className="text-xs sm:text-sm text-slate-700 font-bold">평균 및 중앙값 비교</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight font-mono">
              {typeof displayAverageViewers === 'number' ? displayAverageViewers.toFixed(1) : displayAverageViewers}
            </span>
            <span className="text-base font-black text-slate-800">명 (평균)</span>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs sm:text-sm">
            <span className="text-slate-800 font-bold">
              중앙값: <strong className="text-[#0F172A] font-black font-mono">{formatNumber(displayMedianViewers)}명</strong>
            </span>
            <span className="text-xs font-black text-slate-800 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-md">
              실체감 지표
            </span>
          </div>
        </div>
      </div>

      {/* 4. 상위 10 집중도 */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-amber-500 transition-all">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-base font-black text-[#0F172A] block">상위 10 집중도</span>
            <span className="text-xs sm:text-sm text-slate-700 font-bold">상위 10개 방송 시청 점유율</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-700 tracking-tight font-mono">
              {Math.round(displayConcentration * 100)}%
            </span>
            <span className="text-base font-black text-slate-800">점유</span>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs sm:text-sm font-bold">
            <span className={`font-black font-mono ${displayDiffPp <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {displayDiffPp > 0 ? `+${displayDiffPp}%p` : `${displayDiffPp}%p`}
            </span>
            <span className="text-slate-700 font-medium">최근 4주 동시간 대비</span>
          </div>
        </div>
      </div>
    </div>
  );
}
