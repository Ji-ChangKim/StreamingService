import { ChevronLeft, ChevronRight, Calendar, CalendarDays, RotateCcw } from 'lucide-react';

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
  const platforms = [
    { id: 'ALL', label: 'ALL', icon: null },
    { id: 'CHZZK', label: '치지직', icon: '/icons/chzzk_icon.png' },
    { id: 'SOOP', label: 'SOOP', icon: '/icons/soop/soop_symbol_blue.svg' },
    { id: 'TWITCH', label: '트위치', icon: '/icons/twitch_icon.svg' },
    { id: 'YOUTUBE', label: '유튜브', icon: '/icons/youtube_icon.png' },
  ];

  return (
    <div className="space-y-3 mb-4">
      {/* 1. Header Grid: Left (Platform Select Box), Center (Year/Month & Today), Right (View Switcher) */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        
        {/* Left: Platform Selection Box Bar (ALL | 치지직 | SOOP | 트위치 | 유튜브) */}
        <div className="flex items-center justify-center lg:justify-start w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex items-center bg-[#F1F5F9] p-1 rounded-[8px] border border-[#CBD5E1] gap-1 shrink-0">
            {platforms.map((p) => {
              const isSelected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onPlatformSelect(p.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-[6px] text-xs font-bold transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60'
                  }`}
                  aria-pressed={isSelected}
                  title={`${p.label} 데뷔 일정 보기`}
                >
                  {p.icon && (
                    <img
                      src={p.icon}
                      alt={p.label}
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                  )}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Year/Month Navigator & Today Button */}
        <div className="flex flex-col items-center justify-center text-center w-full py-1 sm:py-0">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={onPrevMonth}
              className="p-1.5 hover:bg-[#F1F5F9] active:bg-[#E2E8F0] rounded-[6px] text-[#475569] transition-colors"
              aria-label="이전"
              title="이전달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenYearMonthPicker}
              className="text-base sm:text-lg font-extrabold text-[#0F172A] px-2 py-0.5 hover:bg-[#F1F5F9] rounded-[6px] transition-colors font-['Outfit'] flex items-center gap-1 cursor-pointer"
              title="년/월 빠른 이동"
            >
              <span>{year}년 {month + 1}월</span>
              <span className="text-[11px] text-[#64748B]">▾</span>
            </button>

            <button
              onClick={onNextMonth}
              className="p-1.5 hover:bg-[#F1F5F9] active:bg-[#E2E8F0] rounded-[6px] text-[#475569] transition-colors"
              aria-label="다음"
              title="다음달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onToday}
            className="text-[11px] font-bold text-[#64748B] hover:text-[#2563EB] hover:underline transition-colors mt-0.5 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#2563EB]" /> 오늘
          </button>
        </div>

        {/* Right: View Switcher (월간 | 주간) */}
        <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-[8px] border border-[#CBD5E1] w-full sm:w-auto justify-center">
            <button
              onClick={() => onChangeView('month')}
              className={`flex items-center justify-center gap-1 px-3 py-1 text-xs font-bold rounded-[6px] transition-all flex-1 sm:flex-initial ${
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
              className={`flex items-center justify-center gap-1 px-3 py-1 text-xs font-bold rounded-[6px] transition-all flex-1 sm:flex-initial ${
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
