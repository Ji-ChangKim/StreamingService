import { CheckCircle2 } from 'lucide-react';
import { DebutEvent } from '../../types';

interface CalendarCellData {
  dayNumber: number | null;
  date: Date | null;
}

interface CalendarMonthGridProps {
  year: number;
  month: number;
  calendarCells: CalendarCellData[];
  eventsByDateMap: Map<string, DebutEvent[]>;
  selectedDateStr: string;
  todayStr: string;
  onSelectDate: (dateStr: string) => void;
}

export function CalendarMonthGrid({
  year,
  month,
  calendarCells,
  eventsByDateMap,
  selectedDateStr,
  todayStr,
  onSelectDate,
}: CalendarMonthGridProps) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border border-[#CBD5E1] rounded-t-[8px] bg-[#F8FAFC] text-center font-bold text-xs text-[#475569] divide-x divide-[#CBD5E1]">
          <div className="py-2 text-[#EF4444]">일</div>
          <div className="py-2">월</div>
          <div className="py-2">화</div>
          <div className="py-2">수</div>
          <div className="py-2">목</div>
          <div className="py-2">금</div>
          <div className="py-2 text-[#2563EB]">토</div>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 border-x border-b border-[#CBD5E1] rounded-b-[8px] divide-x divide-y divide-[#CBD5E1] bg-[#F1F5F9]">
          {calendarCells.map((cell, idx) => {
            if (!cell.date) {
              return <div key={`empty-${idx}`} className="h-[95px] bg-[#F8FAFC]/40" />;
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.dayNumber).padStart(2, '0')}`;
            const dayEvents = eventsByDateMap.get(dateKey) || [];
            const isSelected = dateKey === selectedDateStr;
            const isToday = dateKey === todayStr;

            return (
              <div
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className={`h-[95px] p-1.5 bg-white flex flex-col justify-between overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#F0F9FF] ring-2 ring-inset ring-[#2563EB] shadow-xs'
                    : isToday
                    ? 'bg-[#F8FAFC] border-t-2 border-t-[#2563EB]'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-[11px] font-bold font-mono px-1 rounded-[3px] ${
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
                    <span className="text-[9px] font-extrabold bg-[#0F172A] text-white px-1.5 rounded-full">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Chips (Max 2) */}
                <div className="space-y-1">
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

                    return (
                      <div
                        key={evt.id}
                        className="px-1 py-0.5 rounded-[4px] bg-[#F1F5F9] border border-[#CBD5E1]/70 flex items-center gap-1 text-[10px] font-semibold text-[#0F172A] truncate"
                      >
                        <span className="text-[8px]">{platformDot}</span>
                        <span className="truncate">{evt.creator.displayName}</span>
                      </div>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <div className="text-[9px] font-bold text-[#2563EB] text-center bg-[#EFF6FF] py-0.2 rounded-[3px]">
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
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 소유권 검증 및 공공 API 자동 연동 데이터
        </span>
      </div>
    </div>
  );
}
