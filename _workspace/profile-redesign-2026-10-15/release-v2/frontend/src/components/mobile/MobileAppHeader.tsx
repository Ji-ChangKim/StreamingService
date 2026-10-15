import { Menu, User, ChevronDown } from 'lucide-react';
import { Language } from '../../utils/i18n';

interface MobileAppHeaderProps {
  year: number;
  month: number;
  onOpenMonthPicker: () => void;
  onToday: () => void;
  onOpenSubmitModal: () => void;
  currentLang: Language;
}

export function MobileAppHeader({
  year,
  month,
  onOpenMonthPicker,
}: MobileAppHeaderProps) {
  return (
    <header className="h-14 bg-[#121212] border-b border-white/10 fixed top-0 left-0 right-0 z-40 px-4 flex items-center justify-between text-white shadow-md">
      {/* Left: Hamburger Menu & V-DEBUT Logo */}
      <div className="flex items-center gap-3">
        <button className="p-1 text-zinc-300 hover:text-white transition-colors cursor-pointer" aria-label="메뉴">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5 font-['Outfit'] tracking-wider font-black text-base">
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">V-DEBUT</span>
        </div>
      </div>

      {/* Center/Right: Year/Month Selector & Profile Avatar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMonthPicker}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
        >
          <span>{year}년 {month + 1}월</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-300" />
        </button>

        <button className="w-8 h-8 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

