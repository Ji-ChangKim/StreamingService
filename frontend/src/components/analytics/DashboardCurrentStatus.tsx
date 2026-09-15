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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-white">지금 방송 현황</span>
            <span className="text-xs text-gray-400">· 현재 {formattedTime}</span>
          </div>
          <div className="text-xs text-gray-400">
            전체 합계: <span className="text-white font-semibold">{totalLiveCount.toLocaleString()}개</span> 방송 ·{' '}
            <span className="text-indigo-300 font-semibold">{totalViewerSum.toLocaleString()}명</span> 동시 시청
          </div>
        </div>

        {/* 6열 + 6열 플랫폼별 현재 요약 카드 (명세서 D1-02) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 치지직 카드 */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#00ffa3]/10 via-white/[0.03] to-transparent border border-[#00ffa3]/30 rounded-2xl p-5 hover:border-[#00ffa3]/60 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/chzzk_icon.png"
                  alt="치지직"
                  className="w-5 h-5 object-contain"
                />
                <span className="font-bold text-white text-base">치지직</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#00ffa3]/20 text-[#00ffa3] font-medium">
                  실시간 관측
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectPlatform('CHZZK')}
                className="flex items-center gap-1 text-xs text-[#00ffa3] hover:underline font-semibold transition-transform group-hover:translate-x-0.5"
              >
                <span>치지직 대시보드</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#00ffa3]" />
                  <span>현재 동시시청</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {chzzkStat.viewerSum.toLocaleString()}<span className="text-xs font-normal text-gray-400 ml-1">명</span>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <Radio className="w-3.5 h-3.5 text-[#00ffa3]" />
                  <span>LIVE 방송 수</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {chzzkStat.liveCount.toLocaleString()}<span className="text-xs font-normal text-gray-400 ml-1">개</span>
                </div>
              </div>
            </div>
          </div>

          {/* SOOP 카드 */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1b63ff]/10 via-white/[0.03] to-transparent border border-[#1b63ff]/30 rounded-2xl p-5 hover:border-[#1b63ff]/60 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/soop/soop_symbol_blue.svg"
                  alt="SOOP"
                  className="w-5 h-5 object-contain"
                />
                <span className="font-bold text-white text-base">SOOP</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1b63ff]/20 text-[#60a5fa] font-medium">
                  실시간 관측
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectPlatform('SOOP')}
                className="flex items-center gap-1 text-xs text-[#60a5fa] hover:underline font-semibold transition-transform group-hover:translate-x-0.5"
              >
                <span>SOOP 대시보드</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#60a5fa]" />
                  <span>현재 동시시청</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {soopStat.viewerSum.toLocaleString()}<span className="text-xs font-normal text-gray-400 ml-1">명</span>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <Radio className="w-3.5 h-3.5 text-[#60a5fa]" />
                  <span>LIVE 방송 수</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {soopStat.liveCount.toLocaleString()}<span className="text-xs font-normal text-gray-400 ml-1">개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // D-02: 플랫폼 전용 모드 (치지직 또는 SOOP 단일 요약 - 명세서 D2-02)
  const isChzzk = platform === 'CHZZK';
  const brandColorBorder = isChzzk ? 'border-[#00ffa3]/40' : 'border-[#1b63ff]/40';
  const brandColorBg = isChzzk ? 'from-[#00ffa3]/10' : 'from-[#1b63ff]/10';
  const brandColorText = isChzzk ? 'text-[#00ffa3]' : 'text-[#60a5fa]';
  const brandName = isChzzk ? '치지직' : 'SOOP';
  const brandIcon = isChzzk ? '/icons/chzzk_icon.png' : '/icons/soop/soop_symbol_blue.svg';

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${brandColorBg} via-white/[0.02] to-transparent border ${brandColorBorder} rounded-2xl p-5 transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={brandIcon} alt={brandName} className="w-6 h-6 object-contain" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">{brandName} 버튜버 방송 현황</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${isChzzk ? 'bg-[#00ffa3]/20 text-[#00ffa3]' : 'bg-[#1b63ff]/20 text-[#60a5fa]'} font-semibold`}>
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>현재 · {formattedTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-white/[0.04] border border-white/5 ${brandColorText}`}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">현재 동시시청 합계</div>
              <div className="text-lg font-bold text-white">
                {totalViewerSum.toLocaleString()}<span className="text-xs font-normal text-gray-400 ml-1">명</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-white/[0.04] border border-white/5 ${brandColorText}`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">LIVE 방송 수</div>
              <div className="text-lg font-bold text-white">
                {totalLiveCount.toLocaleString()}<span className="text-xs font-normal text-gray-400 ml-1">개</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
