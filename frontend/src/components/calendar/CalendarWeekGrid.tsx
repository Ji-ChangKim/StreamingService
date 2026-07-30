import { DebutEvent } from '../../types';
import { formatTimeInTimezone } from '../../utils/dateUtils';

interface CalendarWeekGridProps {
  currentDate: Date;
  eventsByDateMap: Map<string, DebutEvent[]>;
  selectedTimezone: string;
  selectedDateStr: string;
  todayStr: string;
  onSelectDate: (dateStr: string) => void;
}

export function CalendarWeekGrid({
  currentDate,
  eventsByDateMap,
  selectedTimezone,
  selectedDateStr,
  todayStr,
  onSelectDate,
}: CalendarWeekGridProps) {
  // Compute start of week (Sunday)
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return {
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      monthNumber: d.getMonth() + 1,
      dayName: ['일', '월', '화', '수', '목', '금', '토'][i],
      isSunday: i === 0,
      isSaturday: i === 6,
    };
  });

  const timeSlots = [
    '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  return (
    <div className="flex flex-col space-y-2">
      {/* Week Header */}
      <div className="grid grid-cols-8 border border-[#CBD5E1] rounded-t-[8px] bg-[#F8FAFC] text-center font-bold text-xs text-[#475569] divide-x divide-[#CBD5E1]">
        <div className="py-2.5 bg-[#F1F5F9] text-[#64748B]">시간대</div>
        {weekDays.map((wd) => {
          const isToday = wd.dateStr === todayStr;
          const isSelected = wd.dateStr === selectedDateStr;
          return (
            <div
              key={wd.dateStr}
              onClick={() => onSelectDate(wd.dateStr)}
              className={`py-2 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                  : isToday
                  ? 'bg-[#2563EB] text-white'
                  : wd.isSunday
                  ? 'text-[#EF4444]'
                  : wd.isSaturday
                  ? 'text-[#2563EB]'
                  : 'text-[#0F172A]'
              }`}
            >
              <div className="text-[11px] font-medium">{wd.monthNumber}/{wd.dayNumber} ({wd.dayName})</div>
            </div>
          );
        })}
      </div>

      {/* Week Timeline Body */}
      <div className="border-x border-b border-[#CBD5E1] rounded-b-[8px] divide-y divide-[#CBD5E1] bg-white overflow-x-auto">
        {timeSlots.map((slot) => {
          const slotHour = parseInt(slot.split(':')[0], 10);

          return (
            <div key={slot} className="grid grid-cols-8 divide-x divide-[#CBD5E1] min-h-[70px]">
              {/* Time Label Column */}
              <div className="p-2 bg-[#F8FAFC] text-[11px] font-mono font-bold text-[#64748B] flex items-center justify-center border-r border-[#CBD5E1]">
                {slot}
              </div>

              {/* 7 Days Columns for this Time Slot */}
              {weekDays.map((wd) => {
                const dayEvents = eventsByDateMap.get(wd.dateStr) || [];
                // Filter events starting around this slot hour
                const matchingEvents = dayEvents.filter((evt) => {
                  const eventTimeStr = formatTimeInTimezone(evt.startAtUtc, selectedTimezone); // e.g. "20:00"
                  const eventHour = parseInt(eventTimeStr.split(':')[0], 10);
                  return eventHour === slotHour || (slotHour === 23 && eventHour >= 23);
                });

                const isSelected = wd.dateStr === selectedDateStr;

                return (
                  <div
                    key={`${wd.dateStr}-${slot}`}
                    onClick={() => onSelectDate(wd.dateStr)}
                    className={`p-1.5 cursor-pointer transition-all hover:bg-[#F8FAFC] flex flex-col justify-start gap-1 ${
                      isSelected ? 'bg-[#F0F9FF]/70' : ''
                    }`}
                  >
                    {matchingEvents.map((evt) => {
                      const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                      const formattedTime = formatTimeInTimezone(evt.startAtUtc, selectedTimezone);
                      return (
                        <div
                          key={evt.id}
                          className="p-1.5 rounded-[6px] bg-[#0F172A] text-white shadow-xs flex flex-col gap-0.5 hover:scale-[1.02] transition-transform"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-[#38BDF8]">{formattedTime}</span>
                            {primaryLink?.platform === 'CHZZK' && (
                              <img src="/icons/chzzk_icon.png" alt="CHZZK" className="w-4 h-4 object-contain shrink-0" />
                            )}
                            {primaryLink?.platform === 'YOUTUBE' && (
                              <img src="/icons/youtube_icon.png" alt="YouTube" className="w-4 h-4 object-contain shrink-0" />
                            )}
                            {primaryLink?.platform === 'SOOP' && (
                              <span className="text-[9px] shrink-0">🔵</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <img
                              src={evt.creator.avatarUrl}
                              alt={evt.creator.displayName}
                              className="w-4 h-4 rounded-full object-cover border border-white/30"
                            />
                            <span className="text-[11px] font-extrabold truncate text-white">
                              {evt.creator.displayName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
