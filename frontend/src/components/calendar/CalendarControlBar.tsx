import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Filter, RotateCcw, ChevronDown, Check } from 'lucide-react';

interface CalendarControlBarProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  selectedPlatform: string;
  onPlatformSelect: (platform: string) => void;
  currentView: 'month' | 'week';
  onChangeView: (view: 'month' | 'week') => void;
  onOpenYearMonthPicker: () => void;
}

export function CalendarControlBar({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedPlatform,
  onPlatformSelect,
  currentView,
  onChangeView,
  onOpenYearMonthPicker,
}: CalendarControlBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const platforms = [
    { id: 'ALL', label: '전체 플랫폼', logo: null },
    { id: 'CHZZK', label: '치지직', logo: '/icons/logo_chzzk.png', height: 'h-[22px]' },
    { id: 'SOOP', label: 'SOOP', logo: null },
    { id: 'YOUTUBE', label: 'YouTube', logo: '/icons/logo_youtube.png', height: 'h-[25px]' },
    { id: 'TWITCH', label: 'Twitch', logo: '/icons/logo_twitch.png', height: 'h-[22px]' },
  ];

  const currentPlatform = platforms.find((p) => p.id === selectedPlatform) || platforms[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3 mb-4">
      {/* 1. Header Grid: Left (Platform Select), Center (Year/Month & Today), Right (View Switcher) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        
        {/* Left: Custom Platform Dropdown with Official Brand Logos */}
        <div className="flex items-center justify-start">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] focus:border-[#2563EB] focus:outline-none flex items-center gap-2 shadow-2xs transition-all min-w-[170px] h-9 justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                {currentPlatform.logo ? (
                  <img
                    src={currentPlatform.logo}
                    alt={currentPlatform.label}
                    className={`${currentPlatform.height} w-auto object-contain shrink-0`}
                  />
                ) : (
                  <span className={currentPlatform.id === 'SOOP' ? 'font-bold text-[#2563EB]' : ''}>
                    {currentPlatform.label}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-white border border-[#CBD5E1] rounded-[10px] shadow-xl py-1.5 z-50 animate-fadeIn overflow-hidden">
                {platforms.map((p) => {
                  const isSelected = selectedPlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onPlatformSelect(p.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#F1F5F9] text-[#0F172A]'
                          : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 h-6">
                        {p.logo ? (
                          <img
                            src={p.logo}
                            alt={p.label}
                            className={`${p.height} w-auto object-contain shrink-0`}
                          />
                        ) : (
                          <span className={p.id === 'SOOP' ? 'font-bold text-[#2563EB]' : ''}>
                            {p.label}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center: Year/Month Navigator (Centered) & Clean Today Button Below */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={onPrevMonth}
              className="p-1.5 hover:bg-[#F1F5F9] rounded-[6px] text-[#475569] transition-colors"
              aria-label="이전"
              title="이전달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenYearMonthPicker}
              className="text-base sm:text-lg font-extrabold text-[#0F172A] px-2 py-0.5 hover:bg-[#F1F5F9] rounded-[6px] transition-colors font-['Outfit'] flex items-center gap-1"
              title="년/월 빠른 이동"
            >
              <span>{year}년 {month + 1}월</span>
              <span className="text-[11px] text-[#64748B]">▾</span>
            </button>

            <button
              onClick={onNextMonth}
              className="p-1.5 hover:bg-[#F1F5F9] rounded-[6px] text-[#475569] transition-colors"
              aria-label="다음"
              title="다음달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 박스 영역 없이 깔끔하게 옮겨진 '오늘' 이동 텍스트 버튼 */}
          <button
            onClick={onToday}
            className="text-[11px] font-bold text-[#64748B] hover:text-[#2563EB] hover:underline transition-colors mt-0.5 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#2563EB]" /> 오늘
          </button>
        </div>

        {/* Right: View Switcher (월간 | 주간) */}
        <div className="flex items-center justify-end">
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-[8px] border border-[#CBD5E1]">
            <button
              onClick={() => onChangeView('month')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-[6px] transition-all ${
                currentView === 'month'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              월간
            </button>
            <button
              onClick={() => onChangeView('week')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-[6px] transition-all ${
                currentView === 'week'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              주간
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
