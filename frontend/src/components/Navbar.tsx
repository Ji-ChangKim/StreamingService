interface NavbarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenSubmitModal: () => void;
}

export function Navbar({ activeNav, setActiveNav, onOpenSubmitModal }: NavbarProps) {
  const navItems = [
    { id: 'schedule', label: '데뷔 일정' },
  ];

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveNav('schedule')}>
            <div className="w-8 h-8 rounded-[6px] bg-[#0F172A] text-white flex items-center justify-center font-extrabold text-sm tracking-tighter shadow-sm">
              V
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#0F172A] font-['Outfit']">
              V-DEBUT
            </span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 h-full">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`relative h-full flex items-center text-sm font-semibold transition-colors px-1 ${
                  isActive ? 'text-[#2563EB]' : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {item.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2563EB] rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Submit CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSubmitModal}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold px-4 py-2.5 rounded-[8px] transition-all shadow-sm flex items-center gap-1.5"
          >
            데뷔 일정 등록
          </button>
        </div>
      </div>
    </header>
  );
}
