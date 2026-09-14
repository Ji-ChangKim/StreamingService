import { AnalyticsMeta } from '../../services/analyticsApiService';
import { Clock, ShieldCheck, Database, Info, Sparkles, RefreshCw } from 'lucide-react';

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
  const completenessPercent = meta ? Math.round(meta.completeness * 1000) / 10 : 98.5;
  const sampleDays = meta?.sampleDays || 28;

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
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-xs text-[#475569] mb-6 shadow-2xs">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* 데이터 수집 시각 & 새로고침 결합 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Clock className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span className="text-[#64748B]">데이터 수집 시각:</span>
          <span className="font-bold text-[#0F172A] font-mono">{formattedTime} KST</span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2 py-0.5 ml-1 rounded-md bg-white hover:bg-slate-100 border border-[#CBD5E1] text-[11px] font-bold text-[#475569] hover:text-[#0F172A] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="데이터 즉시 새로고침"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#2563EB]' : 'text-[#64748B]'}`} />
              <span>새로고침</span>
            </button>
          )}
        </div>

        {/* 수집 완전성 */}
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[#64748B]">데이터 완전성:</span>
          <span className="font-bold text-emerald-700 font-mono">{completenessPercent}%</span>
        </div>

        {/* 분석 대상 모수 */}
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-[#64748B]">표본:</span>
          <span className="text-[#0F172A] font-medium">최근 {sampleDays}일 · 검증된 버튜버 전수</span>
        </div>

        {meta?.isSimulation && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            <span>시뮬레이션 모드</span>
          </div>
        )}
      </div>

      {/* 데이터 기준 열기 버튼 */}
      <button
        type="button"
        onClick={onOpenMethodology}
        className="flex items-center gap-1.5 text-[#2563EB] hover:text-blue-800 font-bold transition-colors cursor-pointer ml-auto shrink-0"
      >
        <Info className="w-3.5 h-3.5" />
        <span className="underline underline-offset-2">데이터 기준 안내</span>
      </button>
    </div>
  );
}
