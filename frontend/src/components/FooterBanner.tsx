interface FooterBannerProps {
  onOpenSubmitModal: () => void;
}

export function FooterBanner({ onOpenSubmitModal }: FooterBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-[16px] p-6 sm:p-8 my-10 shadow-lg relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-[#2563EB]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="text-[10px] font-extrabold tracking-widest text-[#60A5FA] uppercase font-mono">
            FOR NEW CREATORS
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-['Outfit']">
            곧 데뷔를 준비하고 있나요?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            날짜, 방송 플랫폼, 공지 링크를 등록하면 접수 후 검토를 거쳐 소개됩니다.
          </p>
        </div>

        <button
          onClick={onOpenSubmitModal}
          className="bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-extrabold px-5 py-3 rounded-[10px] transition-all shadow-md shrink-0 flex items-center gap-1.5"
        >
          데뷔 일정 등록하기 <span className="text-sm">↗</span>
        </button>
      </div>
    </div>
  );
}
