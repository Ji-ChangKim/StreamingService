import { ChevronLeft, ChevronRight, Search, Globe, Sparkles } from 'lucide-react';

interface CalendarControlBarProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlatform: string;
  onPlatformSelect: (platform: string) => void;
  showIndieOnly: boolean;
  onToggleIndieOnly: () => void;
  selectedTimezone: string;
  onChangeTimezone: () => void;
}

export function CalendarControlBar({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformSelect,
  showIndieOnly,
  onToggleIndieOnly,
  selectedTimezone,
  onChangeTimezone,
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
      {/* 1. Top Bar: Date Switcher & Search Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#CBD5E1] rounded-[8px] p-1 bg-[#F8FAFC]">
            <button
              onClick={onPrevMonth}
              className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
              aria-label="지난달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base font-extrabold text-[#0F172A] px-2 font-['Outfit']">
              {year}년 {month + 1}월
            </span>
            <button
              onClick={onNextMonth}
              className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
              aria-label="다음달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onToday}
            className="px-2.5 py-1 text-xs font-bold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] rounded-[6px] transition-colors border border-[#CBD5E1]"
          >
            오늘
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="버튜버/이벤트 검색"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] pl-8 pr-3 py-1.5 rounded-[8px] border border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 2. Filter Bar: Platform Tabs & Timezone */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {platforms.map((p) => {
            const isActive = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onPlatformSelect(p.id)}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-bold transition-all ${
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

          <button
            onClick={onToggleIndieOnly}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-extrabold transition-all border ${
              showIndieOnly
                ? 'bg-[#10B981] text-white border-[#059669]'
                : 'bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5] border-[#A7F3D0]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            🌱 개인세만 보기
          </button>
        </div>

        {/* Timezone Switcher */}
        <div className="flex items-center gap-1 text-[11px] text-[#64748B] font-mono">
          <Globe className="w-3 h-3 text-[#2563EB]" />
          <button
            onClick={onChangeTimezone}
            className="font-bold text-[#0F172A] hover:underline"
          >
            {selectedTimezone}
          </button>
        </div>
      </div>
    </div>
  );
}
