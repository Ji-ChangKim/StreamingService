import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from 'lucide-react';

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
    { id: 'ALL', label: '전체 플랫폼' },
    { id: 'CHZZK', label: 'CHZZK', dot: '🟢' },
    { id: 'SOOP', label: 'SOOP', dot: '🔵' },
    { id: 'YOUTUBE', label: 'YouTube', dot: '🔴' },
    { id: 'TWITCH', label: 'Twitch', dot: '🟣' },
  ];

  return (
    <div className="space-y-3 mb-4">
      {/* 1. Header: Date Navigator (Clickable Year/Month) & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#CBD5E1] rounded-[8px] p-1 bg-[#F8FAFC]">
            <button
              onClick={onPrevMonth}
              className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
              aria-label="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenYearMonthPicker}
              className="text-base font-extrabold text-[#0F172A] px-3 py-0.5 hover:bg-[#E2E8F0] rounded-[6px] transition-colors font-['Outfit'] flex items-center gap-1.5"
              title="년/월 빠른 이동"
            >
              <span>{year}년 {month + 1}월</span>
              <span className="text-[10px] bg-[#E2E8F0] text-[#475569] px-1.5 py-0.5 rounded-[4px]">변경 ▾</span>
            </button>
            <button
              onClick={onNextMonth}
              className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
              aria-label="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-xs font-extrabold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] rounded-[6px] transition-colors border border-[#CBD5E1]"
          >
            오늘
          </button>
        </div>

        {/* View Mode Switcher: 월간 vs 주간 */}
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
            월간 보기
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
            주간 보기
          </button>
        </div>
      </div>

      {/* 2. Platform Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {platforms.map((p) => {
          const isActive = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPlatformSelect(p.id)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-white text-[#475569] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
              }`}
            >
              {p.dot && <span className="mr-1">{p.dot}</span>}
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
