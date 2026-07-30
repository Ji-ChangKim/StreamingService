import { Globe, ChevronDown } from 'lucide-react';
import { Language, UI_TRANSLATIONS } from '../utils/i18n';

interface NavbarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenSubmitModal: () => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export function Navbar({
  activeNav,
  setActiveNav,
  onOpenSubmitModal,
  currentLang,
  onLanguageChange,
}: NavbarProps) {
  const t = UI_TRANSLATIONS[currentLang];

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Left-aligned Nav Links */}
        <div className="flex items-center gap-6 sm:gap-8 h-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveNav('schedule')}>
            <div className="w-8 h-8 rounded-[6px] bg-[#0F172A] text-white flex items-center justify-center font-extrabold text-sm tracking-tighter shadow-sm">
              V
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#0F172A] font-['Outfit']">
              V-DEBUT
            </span>
          </div>

          {/* 좌측 로고 옆으로 이동한 데뷔 일정 탭 (언어 변경 시 밀림 현상 방지) */}
          <nav className="flex items-center h-full">
            <button
              onClick={() => setActiveNav('schedule')}
              className={`relative h-full flex items-center text-sm font-bold transition-colors px-1 ${
                activeNav === 'schedule' ? 'text-[#2563EB]' : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              {t.scheduleTab || '데뷔 일정'}
              {activeNav === 'schedule' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2563EB] rounded-t-full" />
              )}
            </button>
          </nav>
        </div>

        {/* Right: Language Dropdown & Submit CTA Button */}
        <div className="flex items-center gap-3">
          {/* Language Dropdown Select */}
          <div className="relative flex items-center bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-[8px] px-2.5 py-1.5 transition-all shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-[#475569] shrink-0 mr-1.5" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-xs font-extrabold text-[#0F172A] cursor-pointer focus:outline-none appearance-none pr-4 uppercase"
            >
              <option value="ko">KO (한국어)</option>
              <option value="ja">JA (日本語)</option>
              <option value="en">EN (English)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#64748B] pointer-events-none absolute right-2" />
          </div>

          <button
            onClick={onOpenSubmitModal}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold px-4 py-2 rounded-[8px] transition-all shadow-sm flex items-center gap-1.5"
          >
            {t.submitButton || '데뷔 일정 등록'}
          </button>
        </div>
      </div>
    </header>
  );
}
