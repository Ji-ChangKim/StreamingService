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
    <div className="py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Title & Subtitle */}
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight whitespace-nowrap font-['Outfit'] overflow-hidden text-ellipsis">
            이번 달, 새롭게 시작하는 <span className="text-[#2563EB]">목소리들을 만나보세요.</span>
          </h1>
          <h3 className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
            전 세계 다양한 VTuber의 데뷔 일정을 내 시간대에 맞춰 한눈에 확인합니다.
          </h3>
        </div>

        {/* Right Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-[12px] border border-[#E2E8F0] shadow-xs shrink-0 min-w-[300px]">
          <div className="text-center border-r border-[#E2E8F0] pr-2">
            <span className="text-[11px] font-semibold text-[#64748B] block mb-0.5">이번 달 데뷔</span>
            <span className="text-lg font-extrabold text-[#2563EB] font-mono">
              {totalDebutsThisMonth}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">명</span>
            </span>
          </div>
          <div className="text-center border-r border-[#E2E8F0] px-2">
            <span className="text-[11px] font-semibold text-[#64748B] block mb-0.5">오늘의 LIVE</span>
            <span className="text-lg font-extrabold text-[#EF4444] font-mono">
              {todayLiveCount}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">건</span>
            </span>
          </div>
          <div className="text-center pl-2">
            <span className="text-[11px] font-semibold text-[#64748B] block mb-0.5">소속사 공개</span>
            <span className="text-lg font-extrabold text-[#0F172A] font-mono">
              {agencyDebutCount}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">건</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
