import { CheckCircle2 } from 'lucide-react';
import { DebutEvent } from '../../types';
import { formatTimeInTimezone } from '../../utils/dateUtils';

interface CalendarCellData {
  dayNumber: number | null;
  date: Date | null;
}

interface CalendarMonthGridProps {
  year: number;
  month: number;
  calendarCells: CalendarCellData[];
  eventsByDateMap: Map<string, DebutEvent[]>;
  selectedTimezone: string;
  selectedDateStr: string;
  todayStr: string;
  onSelectDate: (dateStr: string) => void;
}

export function CalendarMonthGrid({
  year,
  month,
  calendarCells,
  eventsByDateMap,
  selectedTimezone,
  selectedDateStr,
  todayStr,
  onSelectDate,
}: CalendarMonthGridProps) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border border-[#CBD5E1] rounded-t-[8px] bg-[#F8FAFC] text-center font-bold text-xs text-[#475569] divide-x divide-[#CBD5E1]">
          <div className="py-2.5 text-[#EF4444]">일</div>
          <div className="py-2.5">월</div>
          <div className="py-2.5">화</div>
          <div className="py-2.5">수</div>
          <div className="py-2.5">목</div>
          <div className="py-2.5">금</div>
          <div className="py-2.5 text-[#2563EB]">토</div>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 border-x border-b border-[#CBD5E1] rounded-b-[8px] divide-x divide-y divide-[#CBD5E1] bg-[#F1F5F9]">
          {calendarCells.map((cell, idx) => {
            if (!cell.date) {
              return <div key={`empty-${idx}`} className="min-h-[120px] bg-[#F8FAFC]/40" />;
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.dayNumber).padStart(2, '0')}`;
            const dayEvents = eventsByDateMap.get(dateKey) || [];
            const isSelected = dateKey === selectedDateStr;
            const isToday = dateKey === todayStr;

            return (
              <div
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className={`min-h-[115px] p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#F0F9FF] ring-2 ring-inset ring-[#2563EB] shadow-xs'
                    : isToday
                    ? 'bg-[#EFF6FF]/80 border-2 border-[#2563EB] shadow-xs'
                    : 'bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-extrabold font-mono px-1.5 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-[#2563EB] text-white shadow-2xs font-extrabold'
                          : idx % 7 === 0
                          ? 'text-[#EF4444]'
                          : idx % 7 === 6
                          ? 'text-[#2563EB]'
                          : 'text-[#0F172A]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-[4px] bg-[#2563EB] text-white shrink-0">
                        오늘
                      </span>
                    )}
                  </div>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-extrabold bg-[#0F172A] text-white px-1.5 py-0.5 rounded-full">
                      {dayEvents.length}개
                    </span>
                  )}
                </div>

                {/* Event Items (최대 2개로 깔끔히 정돈하여 지저분함 제거) */}
                <div className="space-y-1 flex-grow justify-start">
                  {dayEvents.slice(0, 2).map((evt) => {
                    const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                    const platformDot =
                      primaryLink?.platform === 'CHZZK'
                        ? '🟢'
                        : primaryLink?.platform === 'SOOP'
                        ? '🔵'
                        : primaryLink?.platform === 'YOUTUBE'
                        ? '🔴'
                        : '🟣';
                    const startTime = formatTimeInTimezone(evt.startAtUtc, selectedTimezone);

                    return (
                      <div
                        key={evt.id}
                        className="px-1.5 py-0.5 rounded-[4px] bg-[#F8FAFC] border border-[#CBD5E1] flex items-center gap-1 text-[11px] font-bold text-[#0F172A] hover:bg-[#E2E8F0] hover:border-[#2563EB] transition-all cursor-pointer overflow-hidden shadow-2xs"
                      >
                        <span className="text-[9px] shrink-0">{platformDot}</span>
                        <span className="text-[10px] font-mono font-extrabold text-[#2563EB] shrink-0">{startTime}</span>
                        <span className="truncate text-[10px] font-bold text-[#0F172A]">{evt.creator.displayName}</span>
                      </div>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <div className="text-[9px] font-bold text-[#64748B] hover:text-[#2563EB] text-center pt-0.5">
                      + {dayEvents.length - 2}개 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] text-[#64748B]">
        <span className="flex items-center gap-1 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 방송사 소유권 확인 및 스케줄 검증 데이터
        </span>
      </div>
    </div>
  );
}
