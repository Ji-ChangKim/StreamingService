import { Database, Radio, Clock, ShieldCheck, Calendar } from 'lucide-react';

interface AnalyticsDataScopeCardProps {
  onOpenMethodology?: () => void;
}

export function AnalyticsDataScopeCard({ onOpenMethodology }: AnalyticsDataScopeCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-emerald-800">
            <img
              src="/icons/chzzk_icon.png"
              alt="CHZZK"
              className="w-3.5 h-3.5 object-contain shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/icons/logo_chzzk.png';
              }}
            />
            <span>CHZZK (치지직) 기준</span>
          </div>
          <span className="text-xs font-bold text-[#0F172A]">
            데이터 수집 범위 및 실시간 상태
          </span>
        </div>

        {onOpenMethodology && (
          <button
            type="button"
            onClick={onOpenMethodology}
            className="text-[11px] font-bold text-[#2563EB] hover:text-blue-800 transition-colors text-left sm:text-right cursor-pointer flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>데이터 수집 기준 및 계산 정의</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
          <span className="text-[#64748B] text-[11px] flex items-center gap-1 mb-1">
            <Database className="w-3 h-3 text-[#2563EB]" />
            <span>확인된 버튜버 채널</span>
          </span>
          <div className="flex items-baseline gap-1">
            <strong className="text-base font-black text-[#0F172A]">1,284</strong>
            <span className="text-[11px] text-[#64748B]">개 채널</span>
          </div>
          <span className="text-[10px] text-[#64748B] block mt-0.5">VDébut 등록 검증 기준</span>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
          <span className="text-[#64748B] text-[11px] flex items-center gap-1 mb-1">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>현재 LIVE 확인 채널</span>
          </span>
          <div className="flex items-baseline gap-1">
            <strong className="text-base font-black text-emerald-600">78</strong>
            <span className="text-[11px] text-[#64748B]">개 채널</span>
          </div>
          <span className="text-[10px] text-[#64748B] block mt-0.5">실시간 방송 진행 중</span>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
          <span className="text-[#64748B] text-[11px] flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-[#2563EB]" />
            <span>마지막 수집 시각</span>
          </span>
          <div className="text-xs font-black text-[#0F172A] mt-0.5 font-mono">
            9. 14. 16:55 KST
          </div>
          <span className="text-[10px] text-[#64748B] block mt-0.5">10분 단위 정기 갱신</span>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
          <span className="text-[#64748B] text-[11px] flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-[#2563EB]" />
            <span>누적 분석 기간</span>
          </span>
          <div className="text-xs font-black text-[#0F172A] mt-0.5">
            최근 28일 수집
          </div>
          <span className="text-[10px] text-[#64748B] block mt-0.5">스냅샷 완전성 98.2%</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center gap-1.5 text-[11px] text-[#64748B]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
        <span>
          본 대시보드는 전체 인터넷 방송 모집단이 아닌, <strong className="text-[#0F172A]">VDébut에서 직접 확인한 버튜버 채널 기준</strong>으로 집계된 객관적 관측 데이터입니다.
        </span>
      </div>
    </div>
  );
}
