export function Footer() {
  return (
    <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-8 text-xs text-[#64748B]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-[4px] bg-[#0F172A] text-white flex items-center justify-center font-extrabold text-xs">
            V
          </div>
          <span className="font-extrabold text-sm text-[#0F172A]">V-DEBUT</span>
          <span className="text-[11px] text-[#94A3B8]">|</span>
          <p className="text-[11px]">전 세계 VTuber의 첫 순간을 알리는 글로벌 캘린더 플랫폼입니다.</p>
        </div>

        <div className="text-[11px] font-medium text-[#64748B]">
          © 2026 GameTPS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
