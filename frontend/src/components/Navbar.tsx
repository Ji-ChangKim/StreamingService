import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
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
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const langOptions: { id: Language; label: string; flag: string }[] = [
    { id: 'ko', label: 'KO (한국어)', flag: '🇰🇷' },
    { id: 'ja', label: 'JA (日本語)', flag: '🇯🇵' },
    { id: 'en', label: 'EN (English)', flag: '🇺🇸' },
  ];

  const currentOption = langOptions.find((l) => l.id === currentLang) || langOptions[0];

  // 바깥 영역 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Left-aligned Nav Links */}
        <div className="flex items-center gap-6 sm:gap-8 h-full">
          <div className="flex items-center cursor-pointer py-1" onClick={() => setActiveNav('schedule')}>
            <img src="/favicon.svg" alt="VDébut Symbol" className="w-8 h-8 mr-2 drop-shadow-xs" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center font-extrabold text-xl tracking-tight text-[#0F172A] font-['Sora',sans-serif] leading-none">
                V<span className="text-[#0F172A]">D</span>
                <span className="relative text-[#0F172A]">
                  e
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[#FF5C8A] text-xs">✦</span>
                </span>
                <span className="text-[#0F172A]">but</span>
              </div>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#64748B] font-['Sora',sans-serif] mt-0.5 uppercase">
                VTuber Debut Calendar
              </span>
            </div>
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

        {/* Right: Custom Language Dropdown & Submit CTA Button */}
        <div className="flex items-center gap-3">
          {/* Sleek Custom Language Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-[8px] px-3 py-1.5 transition-all shadow-2xs text-xs font-extrabold text-[#0F172A]"
            >
              <Globe className="w-3.5 h-3.5 text-[#475569] shrink-0" />
              <span>{currentOption.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Popover */}
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[#CBD5E1] rounded-[10px] shadow-xl py-1.5 z-50 animate-fadeIn overflow-hidden">
                {langOptions.map((option) => {
                  const isSelected = currentLang === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        onLanguageChange(option.id);
                        setIsLangOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#0F172A] text-white'
                          : 'text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{option.flag}</span>
                        <span>{option.label}</span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            )}
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
