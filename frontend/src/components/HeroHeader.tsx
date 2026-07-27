interface HeroHeaderProps {
  totalDebutsThisMonth: number;
  todayLiveCount: number;
  agencyDebutCount: number;
}

export function HeroHeader({
  totalDebutsThisMonth = 1,
  todayLiveCount = 0,
  agencyDebutCount = 1,
}: HeroHeaderProps) {
  return (
    <div className="py-8 sm:py-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        {/* Left Title & Subtitle */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#2563EB] uppercase bg-[#EFF6FF] px-2.5 py-1 rounded-[4px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            GLOBAL VTUBER DEBUT CALENDAR
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight font-['Outfit']">
            이번 달, 새롭게 시작하는<br />
            <span className="text-[#2563EB]">목소리들을 만나보세요.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
            전 세계 다양한 VTuber의 데뷔 일정을 내 시간대에 맞춰 한눈에 확인합니다.
          </p>
        </div>

        {/* Right Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 bg-white p-3.5 rounded-[12px] border border-[#E2E8F0] shadow-xs shrink-0 min-w-[320px]">
          <div className="text-center border-r border-[#E2E8F0] pr-2">
            <span className="text-[11px] font-semibold text-[#64748B] block mb-1">이번 달 데뷔</span>
            <span className="text-xl font-extrabold text-[#2563EB] font-mono">
              {totalDebutsThisMonth}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">명</span>
            </span>
          </div>
          <div className="text-center border-r border-[#E2E8F0] px-2">
            <span className="text-[11px] font-semibold text-[#64748B] block mb-1">오늘의 LIVE</span>
            <span className="text-xl font-extrabold text-[#EF4444] font-mono">
              {todayLiveCount}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">건</span>
            </span>
          </div>
          <div className="text-center pl-2">
            <span className="text-[11px] font-semibold text-[#64748B] block mb-1">소속사 공개</span>
            <span className="text-xl font-extrabold text-[#0F172A] font-mono">
              {agencyDebutCount}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">건</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
