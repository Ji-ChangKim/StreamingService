import { AnalyticsOverviewData } from '../../services/analyticsApiService';
import { Users, Radio, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AnalyticsKpiCardsProps {
  kpis?: AnalyticsOverviewData['kpis'];
}

export function AnalyticsKpiCards({ kpis }: AnalyticsKpiCardsProps) {
  if (!kpis) return null;

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* 1. 현재 동시시청 합계 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-bold text-[#0F172A] block">동시시청 합계</span>
            <span className="text-[10px] text-[#64748B]">현재 확인된 방송의 동시시청 합계</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0F172A] tracking-tight">
              {formatNumber(kpis.totalViewers.current)}
            </span>
            <span className="text-xs font-bold text-[#64748B]">슬롯</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            {kpis.totalViewers.growthRate >= 0 ? (
              <span className="flex items-center text-emerald-600 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{kpis.totalViewers.growthRate}%
              </span>
            ) : (
              <span className="flex items-center text-rose-600 font-bold">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {kpis.totalViewers.growthRate}%
              </span>
            )}
            <span className="text-[#64748B]">직전 동일 시각 대비</span>
          </div>
        </div>
      </div>

      {/* 2. 현재 LIVE 방송 수 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-bold text-[#0F172A] block">LIVE 방송 수</span>
            <span className="text-[10px] text-[#64748B]">현재 방송 중인 확인 채널</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0F172A] tracking-tight">
              {formatNumber(kpis.liveCount.current)}
            </span>
            <span className="text-xs font-bold text-[#64748B]">개 채널</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            {kpis.liveCount.growthRate >= 0 ? (
              <span className="flex items-center text-emerald-600 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{kpis.liveCount.growthRate}%
              </span>
            ) : (
              <span className="flex items-center text-rose-600 font-bold">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {kpis.liveCount.growthRate}%
              </span>
            )}
            <span className="text-[#64748B]">직전 동일 시각 대비</span>
          </div>
        </div>
      </div>

      {/* 3. 방송당 시청 (평균과 중앙값 동시 제공) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-bold text-[#0F172A] block">방송당 시청</span>
            <span className="text-[10px] text-[#64748B]">평균과 중앙값 동시 제공</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {kpis.viewersPerLive.current}
            </span>
            <span className="text-xs font-bold text-[#64748B]">명/방 (평균)</span>
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-[#64748B]">중앙값: <strong className="text-[#0F172A] font-mono">{kpis.viewersPerLive.median}명</strong></span>
            <span className="text-[10px] text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded">상위 왜곡 보정</span>
          </div>
        </div>
      </div>

      {/* 4. 상위 10 집중도 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-bold text-[#0F172A] block">상위 10 집중도</span>
            <span className="text-[10px] text-[#64748B]">상위 10개 방송 시청 점유율</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              {Math.round(kpis.top10Concentration.current * 100)}%
            </span>
            <span className="text-xs font-bold text-[#64748B]">점유</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className={`font-bold font-mono ${kpis.top10Concentration.diffPp <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {kpis.top10Concentration.diffPp > 0 ? `+${kpis.top10Concentration.diffPp}%p` : `${kpis.top10Concentration.diffPp}%p`}
            </span>
            <span className="text-[#64748B]">
              최근 4주 같은 요일·시각 중앙값 대비
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
