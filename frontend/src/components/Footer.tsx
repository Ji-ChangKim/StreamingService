export function Footer() {
  return (
    <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-8 text-xs text-[#64748B]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="VDébut Symbol" className="w-6 h-6" />
          <span className="font-extrabold text-base text-[#0F172A] font-['Sora',sans-serif] tracking-tight">
            VDébut
          </span>
          <span className="text-[11px] text-[#94A3B8]">|</span>
          <p className="text-[11px]">새로운 버튜버의 첫 무대를 가장 먼저 만나보는 글로벌 캘린더 플랫폼입니다.</p>
        </div>

        <div className="text-[11px] font-medium text-[#64748B]">
          © 2026 GameTPS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
