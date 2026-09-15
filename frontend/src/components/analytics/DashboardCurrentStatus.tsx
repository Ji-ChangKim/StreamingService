import React from 'react';
import { Radio, Users, ArrowRight, Clock } from 'lucide-react';
import { PlatformFilter, PlatformTotalStat } from '../../services/analyticsApiService';

interface DashboardCurrentStatusProps {
  platform: PlatformFilter;
  observedAt?: string;
  totalLiveCount: number;
  totalViewerSum: number;
  platformTotals?: {
    chzzk: PlatformTotalStat;
    soop: PlatformTotalStat;
  };
  onSelectPlatform: (platform: PlatformFilter) => void;
}

export const DashboardCurrentStatus: React.FC<DashboardCurrentStatusProps> = ({
  platform,
  observedAt,
  totalLiveCount,
  totalViewerSum,
  platformTotals,
  onSelectPlatform,
}) => {
  // 관측 시각 포맷팅 (예: 11:30 KST)
  const formatTime = (isoString?: string) => {
    if (!isoString) return '최근 관측 기준';
    try {
      const d = new Date(isoString);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes} KST 기준`;
    } catch {
      return '최근 관측 기준';
    }
  };

  const formattedTime = formatTime(observedAt);

  // D-01: 전체 플랫폼 모드 (6열 치지직 + 6열 SOOP)
  if (platform === 'ALL') {
    const chzzkStat = platformTotals?.chzzk || { liveCount: 0, viewerSum: 0 };
    const soopStat = platformTotals?.soop || { liveCount: 0, viewerSum: 0 };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-sm sm:text-base font-black text-[#0F172A]">지금 방송 현황</span>
            <span className="text-xs text-slate-500 font-medium">· 현재 {formattedTime}</span>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            전체 합계: <span className="text-[#0F172A] font-black">{totalLiveCount.toLocaleString()}개</span> 방송 ·{' '}
            <span className="text-blue-600 font-black">{totalViewerSum.toLocaleString()}명</span> 동시 시청
          </div>
        </div>

        {/* 6열 + 6열 플랫폼별 현재 요약 카드 (기존 사이트 표준 스타일) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 치지직 카드 */}
          <div className="bg-white border border-emerald-200 hover:border-emerald-400 rounded-2xl p-5 shadow-2xs transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/chzzk_icon.png"
                  alt="치지직"
                  className="w-5 h-5 object-contain"
                />
                <span className="font-black text-[#0F172A] text-base">치지직</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  실시간 관측
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectPlatform('CHZZK')}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-black transition-transform group-hover:translate-x-0.5 cursor-pointer"
              >
                <span>치지직 대시보드</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>현재 동시시청</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0F172A]">
                  {chzzkStat.viewerSum.toLocaleString()}<span className="text-xs font-medium text-slate-500 ml-1">명</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  <span>LIVE 방송 수</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0F172A]">
                  {chzzkStat.liveCount.toLocaleString()}<span className="text-xs font-medium text-slate-500 ml-1">개</span>
                </div>
              </div>
            </div>
          </div>

          {/* SOOP 카드 */}
          <div className="bg-white border border-blue-200 hover:border-blue-400 rounded-2xl p-5 shadow-2xs transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/soop/soop_symbol_blue.svg"
                  alt="SOOP"
                  className="w-5 h-5 object-contain"
                />
                <span className="font-black text-[#0F172A] text-base">SOOP</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  실시간 관측
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectPlatform('SOOP')}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-black transition-transform group-hover:translate-x-0.5 cursor-pointer"
              >
                <span>SOOP 대시보드</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>현재 동시시청</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0F172A]">
                  {soopStat.viewerSum.toLocaleString()}<span className="text-xs font-medium text-slate-500 ml-1">명</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-1">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span>LIVE 방송 수</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0F172A]">
                  {soopStat.liveCount.toLocaleString()}<span className="text-xs font-medium text-slate-500 ml-1">개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // D-02: 플랫폼 전용 모드 (단일 요약 - 기존 사이트 표준 스타일)
  const isChzzk = platform === 'CHZZK';
  const brandName = isChzzk ? '치지직' : 'SOOP';
  const brandIcon = isChzzk ? '/icons/chzzk_icon.png' : '/icons/soop/soop_symbol_blue.svg';

  return (
    <div className={`bg-white border ${isChzzk ? 'border-emerald-200' : 'border-blue-200'} rounded-2xl p-5 shadow-2xs`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={brandIcon} alt={brandName} className="w-7 h-7 object-contain" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-[#0F172A] text-base">{brandName} 버튜버 방송 현황</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-md ${isChzzk ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'} font-bold`}>
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>현재 · {formattedTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isChzzk ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500">현재 동시시청 합계</div>
              <div className="text-lg sm:text-xl font-black text-[#0F172A]">
                {totalViewerSum.toLocaleString()}<span className="text-xs font-normal text-slate-500 ml-1">명</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isChzzk ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500">LIVE 방송 수</div>
              <div className="text-lg sm:text-xl font-black text-[#0F172A]">
                {totalLiveCount.toLocaleString()}<span className="text-xs font-normal text-slate-500 ml-1">개</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
