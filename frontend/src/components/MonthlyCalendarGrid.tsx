import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  ExternalLink, 
  Download, 
  X
} from 'lucide-react';
import { DebutEvent } from '../types';
import { formatTimeOnly, formatLocalTime } from '../utils/dateUtils';

interface MonthlyCalendarGridProps {
  events: DebutEvent[];
  selectedTimezone: string;
  onDownloadICS: (event: DebutEvent) => void;
}

export function MonthlyCalendarGrid({
  events,
  selectedTimezone,
  onDownloadICS,
}: MonthlyCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    events: DebutEvent[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // 이전 달 이동
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 다음 달 이동
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 오늘 이동
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 이번 달 1일 정보 및 전체 칸 수 계산
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 캘린더 그리드 배열 생성
  const calendarCells: { date: Date | null; isCurrentMonth: boolean; dayNumber: number }[] = [];

  // 이전 달 빈 칸
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push({ date: null, isCurrentMonth: false, dayNumber: 0 });
  }

  // 이번 달 날짜들
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
      dayNumber: day,
    });
  }

  // 이벤트 날짜 매핑 (selectedTimezone 기준 YYYY-MM-DD)
  const getEventDateKey = (utcString: string): string => {
    try {
      const d = new Date(utcString);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: selectedTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d); // "YYYY-MM-DD"
    } catch {
      return utcString.split('T')[0];
    }
  };

  // 날짜별 이벤트 인덱스 Map
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

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'CHZZK':
        return 'bg-[#00FFA3]/20 text-[#00D98B] border-[#00FFA3]/40';
      case 'SOOP':
        return 'bg-[#2979FF]/20 text-[#2979FF] border-[#2979FF]/40';
      case 'YOUTUBE':
        return 'bg-[#FF0000]/20 text-[#FF4D4D] border-[#FF0000]/40';
      case 'TWITCH':
        return 'bg-[#9146FF]/20 text-[#9146FF] border-[#9146FF]/40';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-[12px] border border-[#D8D8D8] shadow-sm p-4 sm:p-6 mb-8">
      {/* 캘린더 상단 네비게이션 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#080808] text-white flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#080808] tracking-tight font-['Outfit']">
              {year}년 {month + 1}월 데뷔 캘린더
            </h2>
            <p className="text-xs text-[#64748B]">
              현재 적용 시간대: <span className="font-mono font-medium text-[#080808]">{selectedTimezone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold bg-[#F1F5F9] text-[#080808] hover:bg-[#E2E8F0] rounded-[6px] transition-colors border border-[#CBD5E1]"
          >
            오늘
          </button>
          <div className="flex items-center bg-[#F8FAFC] rounded-[6px] border border-[#CBD5E1] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[#E2E8F0] rounded-[4px] text-[#334155] transition-colors"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#080808] px-3 font-mono">
              {year}.{String(month + 1).padStart(2, '0')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[#E2E8F0] rounded-[4px] text-[#334155] transition-colors"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-[#64748B] mb-2">
        <div className="py-2 text-[#EF4444] bg-[#FEF2F2] rounded-[4px]">일</div>
        <div className="py-2">월</div>
        <div className="py-2">화</div>
        <div className="py-2">수</div>
        <div className="py-2">목</div>
        <div className="py-2">금</div>
        <div className="py-2 text-[#2563EB] bg-[#EFF6FF] rounded-[4px]">토</div>
      </div>

      {/* 격자 달력 셀 */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth || !cell.date) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[90px] sm:min-h-[110px] bg-[#F8FAFC]/50 rounded-[8px] border border-dashed border-[#E2E8F0]"
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
              className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-[8px] border transition-all flex flex-col justify-between ${
                isToday
                  ? 'bg-[#F0F9FF] border-[#0284C7] ring-1 ring-[#0284C7]'
                  : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm'
              } ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-[#F8FAFC]' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-[4px] ${
                    isToday
                      ? 'bg-[#0284C7] text-white'
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
                  <span className="text-[10px] font-extrabold bg-[#080808] text-white px-1.5 py-0.2 rounded-full">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* 해당 날짜 이벤트 미니 칩들 */}
              <div className="space-y-1 flex-grow overflow-y-auto max-h-[70px] custom-scrollbar">
                {dayEvents.slice(0, 3).map((evt) => {
                  const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                  const timeFormatted = formatTimeOnly(evt.startAtUtc, selectedTimezone);

                  return (
                    <div
                      key={evt.id}
                      className={`text-[10px] sm:text-[11px] p-1 rounded-[4px] border flex items-center justify-between gap-1 truncate ${getPlatformBadgeColor(
                        primaryLink?.platform || 'OTHER'
                      )}`}
                      title={`${evt.creator.displayName} (${timeFormatted})`}
                    >
                      <span className="font-semibold truncate">{evt.creator.displayName}</span>
                      <span className="text-[9px] font-mono shrink-0 opacity-80">{timeFormatted}</span>
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <div className="text-[9px] font-bold text-[#64748B] text-center bg-[#F1F5F9] py-0.5 rounded-[3px]">
                    +{dayEvents.length - 3}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 특정 날짜 클릭 시 노출되는 일자별 데뷔 모달 */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[16px] max-w-[600px] w-full max-h-[85vh] overflow-hidden shadow-2xl border border-[#CBD5E1] flex flex-col">
            {/* 모달 헤더 */}
            <div className="bg-[#080808] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-white/10 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-['Outfit']">
                    {selectedDayEvents.dateStr} 데뷔 스케줄
                  </h3>
                  <p className="text-xs text-gray-300">
                    총 {selectedDayEvents.events.length}명의 버튜버가 데뷔합니다
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 데뷔 카드 리스트 */}
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
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-[#080808] truncate">
                            {evt.creator.displayName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-[4px] bg-[#080808] text-white">
                            {primaryLink?.platform}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {fullFormatted} ({selectedTimezone})
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
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#080808] text-white hover:bg-[#222222] rounded-[6px] transition-colors"
                      >
                        방송 보러가기 <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => onDownloadICS(evt)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] text-[#080808] hover:bg-[#F1F5F9] rounded-[6px] transition-colors"
                      >
                        ICS 저장 <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-3 text-center">
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-5 py-1.5 text-xs font-semibold bg-[#CBD5E1] text-[#080808] hover:bg-[#94A3B8] rounded-[6px] transition-colors"
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
