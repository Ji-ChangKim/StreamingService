import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Filter, RotateCcw } from 'lucide-react';

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
    { id: 'CHZZK', label: '🟢 CHZZK' },
    { id: 'SOOP', label: '🔵 SOOP' },
    { id: 'YOUTUBE', label: '🔴 YouTube' },
    { id: 'TWITCH', label: '🟣 Twitch' },
  ];

  return (
    <div className="space-y-3 mb-4">
      {/* 1. Header Grid: Left (Platform Select), Center (Year/Month & Today), Right (View Switcher) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        
        {/* Left: Platform Dropdown */}
        <div className="flex items-center justify-start">
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-[#64748B] absolute left-3 pointer-events-none" />
            <select
              value={selectedPlatform}
              onChange={(e) => onPlatformSelect(e.target.value)}
              className="bg-white border border-[#CBD5E1] rounded-[8px] pl-8 pr-8 py-1.5 text-xs font-bold text-[#0F172A] focus:border-[#2563EB] focus:outline-none cursor-pointer appearance-none shadow-2xs hover:bg-[#F8FAFC] transition-colors"
            >
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-[#64748B] absolute right-2.5 pointer-events-none">▾</span>
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
