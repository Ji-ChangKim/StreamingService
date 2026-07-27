import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Globe, 
  Clock, 
  ExternalLink, 
  Download, 
  X,
  CheckCircle2
} from 'lucide-react';
import { DebutEvent } from '../types';
import { formatTimeOnly, formatLocalTime } from '../utils/dateUtils';

interface MonthlyCalendarGridProps {
  events: DebutEvent[];
  selectedTimezone: string;
  setSelectedTimezone: (tz: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (p: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onDownloadICS: (event: DebutEvent) => void;
}

export function MonthlyCalendarGrid({
  events,
  selectedTimezone,
  setSelectedTimezone,
  selectedPlatform,
  setSelectedPlatform,
  searchQuery,
  setSearchQuery,
  onDownloadICS,
}: MonthlyCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date()); // 오늘 날짜 기본값
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    events: DebutEvent[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells: { date: Date | null; dayNumber: number }[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push({ date: null, dayNumber: 0 });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({
      date: new Date(year, month, day),
      dayNumber: day,
    });
  }

  const getEventDateKey = (utcString: string): string => {
    try {
      const d = new Date(utcString);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: selectedTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d);
    } catch {
      return utcString.split('T')[0];
    }
  };

  const eventsByDateMap = new Map<string, DebutEvent[]>();
  events.forEach((evt) => {
    const key = getEventDateKey(evt.startAtUtc);
    if (!eventsByDateMap.has(key)) {
      eventsByDateMap.set(key, []);
    }
    eventsByDateMap.get(key)!.push(evt);
  });

  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: selectedTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const platforms = [
    { id: 'ALL', label: '전체 플랫폼', color: 'bg-[#0F172A]' },
    { id: 'YOUTUBE', label: 'YouTube', iconColor: 'bg-[#FF0000]', dot: '🔴' },
    { id: 'TWITCH', label: 'Twitch', iconColor: 'bg-[#9146FF]', dot: '🟣' },
    { id: 'CHZZK', label: 'CHZZK', iconColor: 'bg-[#00FFA3]', dot: '🟢' },
    { id: 'SOOP', label: 'SOOP', iconColor: 'bg-[#2979FF]', dot: '🔵' },
  ];

  const getPlatformBarColor = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'CHZZK':
        return 'border-l-4 border-l-[#00D98B] bg-[#F0FDF4]';
      case 'SOOP':
        return 'border-l-4 border-l-[#2979FF] bg-[#EFF6FF]';
      case 'YOUTUBE':
        return 'border-l-4 border-l-[#FF0000] bg-[#FEF2F2]';
      case 'TWITCH':
        return 'border-l-4 border-l-[#9146FF] bg-[#F5F3FF]';
      default:
        return 'border-l-4 border-l-slate-400 bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-6 mb-8">
      {/* 1. Top Control Bar: Date Nav & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#E2E8F0]">
        {/* Left: Year & Month Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[#CBD5E1] rounded-[8px] p-1 bg-[#F8FAFC]">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base sm:text-lg font-bold text-[#0F172A] px-3 font-[#Outfit]">
              {year}년 {month + 1}월
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] rounded-[6px] transition-colors border border-[#CBD5E1]"
          >
            오늘
          </button>
        </div>

        {/* Right: Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="버튜버 이름/언어 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] pl-9 pr-3 py-2 rounded-[8px] border border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 2. Platform Filter Tabs & Timezone Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-4">
        {/* Platform Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {platforms.map((p) => {
            const isActive = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-white text-[#475569] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                }`}
              >
                {p.dot && <span className="text-[10px]">{p.dot}</span>}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Timezone Info */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-mono self-end lg:self-auto">
          <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>현재 시간대 기준</span>
          <button
            onClick={() => {
              const tz = prompt('시간대를 입력하세요 (예: Asia/Seoul, America/Los_Angeles, UTC)', selectedTimezone);
              if (tz) setSelectedTimezone(tz);
            }}
            className="font-bold text-[#0F172A] hover:underline"
          >
            {selectedTimezone} | KST
          </button>
        </div>
      </div>

      {/* 3. Weekday Header */}
      <div className="grid grid-cols-7 border border-[#CBD5E1] rounded-t-[10px] bg-[#F8FAFC] text-center font-bold text-xs text-[#475569] divide-x divide-[#CBD5E1]">
        <div className="py-2.5 text-[#EF4444]">일</div>
        <div className="py-2.5">월</div>
        <div className="py-2.5">화</div>
        <div className="py-2.5">수</div>
        <div className="py-2.5">목</div>
        <div className="py-2.5">금</div>
        <div className="py-2.5 text-[#2563EB]">토</div>
      </div>

      {/* 4. 7x5 Calendar Grid */}
      <div className="grid grid-cols-7 border-x border-b border-[#CBD5E1] rounded-b-[10px] divide-x divide-y divide-[#CBD5E1] bg-[#F1F5F9]">
        {calendarCells.map((cell, idx) => {
          if (!cell.date) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[110px] bg-[#F8FAFC]/40"
              />
            );
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.dayNumber).padStart(2, '0')}`;
          const dayEvents = eventsByDateMap.get(dateKey) || [];
          const isToday = dateKey === todayStr;

          return (
            <div
              key={dateKey}
              onClick={() => {
                if (dayEvents.length > 0) {
                  setSelectedDayEvents({ dateStr: dateKey, events: dayEvents });
                }
              }}
              className={`min-h-[110px] p-2 bg-white transition-all flex flex-col justify-between ${
                isToday ? 'bg-[#F0F9FF] ring-2 ring-inset ring-[#2563EB]' : 'hover:bg-[#F8FAFC]'
              } ${dayEvents.length > 0 ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-[4px] ${
                    isToday
                      ? 'bg-[#2563EB] text-white'
                      : idx % 7 === 0
                      ? 'text-[#EF4444]'
                      : idx % 7 === 6
                      ? 'text-[#2563EB]'
                      : 'text-[#334155]'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-extrabold bg-[#2563EB] text-white px-1.5 py-0.2 rounded-full">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event Cards inside Cell (Matching Screenshot Card Style) */}
              <div className="space-y-1.5 flex-grow overflow-y-auto max-h-[85px] custom-scrollbar">
                {dayEvents.slice(0, 2).map((evt) => {
                  const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                  const timeFormatted = formatTimeOnly(evt.startAtUtc, selectedTimezone);

                  return (
                    <div
                      key={evt.id}
                      className={`p-1.5 rounded-[6px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-1.5 transition-all hover:scale-[1.02] ${getPlatformBarColor(
                        primaryLink?.platform || 'OTHER'
                      )}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={evt.creator.avatarUrl}
                          alt={evt.creator.displayName}
                          className="w-5 h-5 rounded-full object-cover shrink-0 border border-white shadow-xs"
                        />
                        <span className="text-[11px] font-bold text-[#0F172A] truncate">
                          {evt.creator.displayName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-[#475569] shrink-0">
                        {timeFormatted}
                      </span>
                    </div>
                  );
                })}

                {dayEvents.length > 2 && (
                  <div className="text-[10px] font-bold text-[#2563EB] text-center bg-[#EFF6FF] py-0.5 rounded-[4px] border border-[#BFDBFE]">
                    +{dayEvents.length - 2}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Bottom Info & Feedback Link (Matching Screenshot Footer) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span><strong className="text-[#0F172A]">검증된 일정:</strong> 공식 인스타그램, X(트위터) 출처만 검토후 등재합니다.</span>
        </div>
        <button
          onClick={() => alert('오정보 제보 및 피드백 문의: support@vdebut.hub')}
          className="font-semibold text-[#475569] hover:text-[#0F172A] hover:underline"
        >
          피드백 및 오정보 제보하기 ↗
        </button>
      </div>

      {/* Selected Day Event Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[16px] max-w-[600px] w-full max-h-[85vh] overflow-hidden shadow-2xl border border-[#CBD5E1] flex flex-col">
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-['Outfit']">
                  {selectedDayEvents.dateStr} 데뷔 일정
                </h3>
                <p className="text-xs text-slate-300">
                  총 {selectedDayEvents.events.length}명의 VTuber가 데뷔 라이브를 진행합니다
                </p>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {selectedDayEvents.events.map((evt) => {
                const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                const fullFormatted = formatLocalTime(evt.startAtUtc, selectedTimezone);

                return (
                  <div
                    key={evt.id}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#CBD5E1] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={evt.creator.avatarUrl}
                        alt={evt.creator.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-[#0F172A] truncate">
                            {evt.creator.displayName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-[4px] bg-[#0F172A] text-white">
                            {primaryLink?.platform}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#2563EB]" /> {fullFormatted}
                        </p>
                        <p className="text-xs text-[#334155] line-clamp-1 mt-1">
                          {evt.description || evt.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto justify-end">
                      <a
                        href={primaryLink?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-[6px] transition-colors"
                      >
                        방송 보러가기 <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => onDownloadICS(evt)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-[6px] transition-colors"
                      >
                        ICS 저장 <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-3 text-center">
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-5 py-1.5 text-xs font-semibold bg-[#CBD5E1] text-[#0F172A] hover:bg-[#94A3B8] rounded-[6px] transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
