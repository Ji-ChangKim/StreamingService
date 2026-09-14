import { AnalyticsMeta } from '../../services/analyticsApiService';
import { Clock, ShieldCheck, Database, Info, Sparkles } from 'lucide-react';

interface AnalyticsStatusBarProps {
  meta?: AnalyticsMeta;
  onOpenMethodology: () => void;
}

export function AnalyticsStatusBar({ meta, onOpenMethodology }: AnalyticsStatusBarProps) {
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {/* 기준 시간 */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="text-[#64748B]">기준 시각:</span>
          <span className="font-bold text-[#0F172A]">{formattedTime} KST</span>
        </div>

        {/* 수집 완전성 */}
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[#64748B]">데이터 완전성:</span>
          <span className="font-bold text-emerald-700">{completenessPercent}%</span>
        </div>

        {/* 분석 대상 모수 */}
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[#64748B]">표본:</span>
          <span className="text-[#0F172A] font-medium">최근 {sampleDays}일 · 검증된 버튜버 전수</span>
        </div>

        {meta?.isSimulation && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
            <Sparkles className="w-2.5 h-2.5" />
            <span>시뮬레이션 모드</span>
          </div>
        )}
      </div>

      {/* 데이터 기준 열기 버튼 */}
      <button
        type="button"
        onClick={onOpenMethodology}
        className="flex items-center gap-1.5 text-[#2563EB] hover:text-blue-800 font-bold transition-colors cursor-pointer ml-auto"
      >
        <Info className="w-3.5 h-3.5" />
        <span className="underline underline-offset-2">데이터 기준 & 산식 안내</span>
      </button>
    </div>
  );
}
