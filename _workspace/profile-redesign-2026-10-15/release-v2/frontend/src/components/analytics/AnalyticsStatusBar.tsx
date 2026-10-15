import { AnalyticsMeta } from '../../services/analyticsApiService';
import { Clock, ShieldCheck, Info, RefreshCw } from 'lucide-react';

interface AnalyticsStatusBarProps {
  meta?: AnalyticsMeta;
  onOpenMethodology: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AnalyticsStatusBar({
  meta,
  onOpenMethodology,
  onRefresh,
  isLoading = false,
}: AnalyticsStatusBarProps) {

  // 시간 포맷
  let formattedTime = '최신 데이터';
  if (meta?.dataThrough) {
    try {
      const d = new Date(meta.dataThrough);
      formattedTime = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
    } catch {
      formattedTime = meta.dataThrough;
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#E2E8F0] border border-[#CBD5E1] rounded-2xl text-xs sm:text-sm text-slate-700 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
        {/* 데이터 수집 시각 & 새로고침 결합 */}
        <div className="flex items-center gap-2 flex-wrap">
          <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="font-extrabold text-[#0F172A]">데이터 수집 시각:</span>
          <span className="font-bold text-[#0F172A] font-mono text-xs sm:text-sm bg-white px-2 py-0.5 rounded-md border border-slate-300">
            {formattedTime} KST
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 ml-1 rounded-lg bg-white hover:bg-slate-100 border border-[#CBD5E1] text-xs font-black text-slate-800 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="데이터 즉시 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#2563EB]' : 'text-slate-700'}`} />
              <span>새로고침</span>
            </button>
          )}
        </div>

        {/* 실시간 자동 수집 상태 뱃지 (미검증 퍼센트 제거) */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
          <span className="text-xs font-extrabold text-emerald-800">실시간 자동 갱신 중</span>
        </div>

        {/* 분석 대상 모수 */}
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
          <span className="font-bold text-slate-700">표본:</span>
          <span className="text-[#0F172A] font-bold">확인된 버튜버 실시간 방송 전수</span>
        </div>
      </div>

      {/* 데이터 기준 열기 버튼 */}
      <button
        type="button"
        onClick={onOpenMethodology}
        className="flex items-center gap-1.5 text-[#2563EB] hover:text-blue-800 font-extrabold transition-colors cursor-pointer ml-auto shrink-0 text-xs sm:text-sm"
      >
        <Info className="w-4 h-4" />
        <span className="underline underline-offset-4">데이터 기준 안내</span>
      </button>
    </div>
  );
}
