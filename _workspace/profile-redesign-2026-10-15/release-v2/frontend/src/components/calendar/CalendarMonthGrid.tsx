import { CheckCircle2 } from 'lucide-react';
import { DebutEvent } from '../../types';
import { formatTimeInTimezone } from '../../utils/dateUtils';
import { CalendarCell } from '../../utils/calendarUtils';

interface CalendarMonthGridProps {
  year: number;
  month: number;
  calendarCells: CalendarCell[];
  eventsByDateMap: Map<string, DebutEvent[]>;
  selectedTimezone: string;
  selectedDateStr: string;
  todayStr: string;
  totalCreators?: number;
  onSelectDate: (dateStr: string) => void;
}

export function CalendarMonthGrid({
  year: _year,
  month: _month,
  calendarCells,
  eventsByDateMap,
  selectedTimezone,
  selectedDateStr,
  todayStr,
  totalCreators = 123,
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
            const dateKey = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.dayNumber).padStart(2, '0')}`;
            const dayEvents = eventsByDateMap.get(dateKey) || [];
            const isSelected = dateKey === selectedDateStr;
            const isToday = dateKey === todayStr;
            const isCurrentMonth = cell.isCurrentMonth;

            return (
              <div
                key={`${dateKey}-${idx}`}
                onClick={() => onSelectDate(dateKey)}
                className={`min-h-[115px] p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#F0F9FF] ring-2 ring-inset ring-[#2563EB] shadow-xs'
                    : isToday
                    ? 'bg-[#EFF6FF]/80 border-2 border-[#2563EB] shadow-xs'
                    : isCurrentMonth
                    ? 'bg-white hover:bg-[#F8FAFC]'
                    : 'bg-[#F8FAFC]/70 opacity-50 hover:opacity-90'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-extrabold flex items-center justify-center ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-[#2563EB] text-white shadow-2xs font-extrabold'
                        : !isCurrentMonth
                        ? 'text-[#94A3B8] px-1 py-0.5 font-bold'
                        : idx % 7 === 0
                        ? 'text-[#EF4444] px-1 py-0.5'
                        : idx % 7 === 6
                        ? 'text-[#2563EB] px-1 py-0.5'
                        : 'text-[#0F172A] px-1 py-0.5'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                </div>

                {/* Event Items */}
                <div className="space-y-1 flex-grow justify-start">
                  {dayEvents.slice(0, 2).map((evt) => {
                    const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                    const platform = primaryLink?.platform;
                    const startTime = formatTimeInTimezone(evt.startAtUtc, selectedTimezone);

                    return (
                      <div
                        key={evt.id}
                        className={`px-1.5 py-0.5 rounded-[4px] border flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer overflow-hidden shadow-2xs ${
                          isCurrentMonth
                            ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] hover:bg-[#E2E8F0] hover:border-[#2563EB]'
                            : 'bg-slate-100/60 border-slate-200 text-slate-500 opacity-75'
                        }`}
                      >
                        {platform === 'CHZZK' && (
                          <img src="/icons/chzzk_icon.png" alt="CHZZK" className="w-4 h-4 object-contain shrink-0" />
                        )}
                        {platform === 'YOUTUBE' && (
                          <img src="/icons/youtube_icon.png" alt="YouTube" className="w-4 h-4 object-contain shrink-0" />
                        )}
                        {platform === 'SOOP' && (
                          <img src="/icons/soop/soop_symbol_blue.svg" alt="SOOP" className="w-4 h-4 object-contain shrink-0" />
                        )}
                        {platform !== 'CHZZK' && platform !== 'YOUTUBE' && platform !== 'SOOP' && (
                          <span className="text-[9px] shrink-0">🟣</span>
                        )}
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

      {/* 달력 하단 방송 URL 확인 및 총 등록 버튜버 수 표기 */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-[#64748B]">
        <span className="flex items-center gap-2 font-bold text-slate-700">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> 방송 URL 확인 데이터
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[#0F172A] font-extrabold bg-slate-100 px-2.5 py-1 rounded-[6px] border border-slate-200">
            총 등록 버튜버 <span className="text-[#2563EB]">{totalCreators}</span>명
          </span>
        </span>
      </div>
    </div>
  );
}
