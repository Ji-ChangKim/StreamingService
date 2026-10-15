import { EventCard } from './EventCard';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DebutEvent } from '../types';
import { groupEventsByDate } from '../utils/eventUtils';

interface CalendarViewProps {
  events: DebutEvent[];
  selectedTimezone: string;
  onDownloadICS: (event: DebutEvent) => void;
}

export function CalendarView({
  events,
  selectedTimezone,
  onDownloadICS,
}: CalendarViewProps) {
  const groupedEvents = groupEventsByDate(events, selectedTimezone);
  const dates = Object.keys(groupedEvents);

  if (dates.length === 0) {
    return (
      <div className="bg-white rounded-[8px] p-12 text-center border border-[#D8D8D8] shadow-sm my-8">
        <CalendarIcon className="w-10 h-10 text-[#898989] mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#080808] mb-1">등록된 데뷔 일정이 없습니다</h3>
        <p className="text-xs text-[#5A5A5A]">새로운 필터 조건으로 검색하시거나 상단의 '데뷔 일정 제보' 버튼을 클릭해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 mb-12">
      {dates.map((dateTitle) => (
        <div key={dateTitle} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-[#D8D8D8] pb-3">
            <div className="w-1.5 h-6 bg-[#080808] rounded-[2px]" />
            <h2 className="text-xl sm:text-2xl font-semibold text-[#080808] tracking-[-0.4px] font-['Outfit']">
              📅 {dateTitle}
            </h2>
            <span className="eyebrow-uppercase bg-[#F8FAFC] text-[#080808] text-[11px] font-medium px-2.5 py-0.5 rounded-[4px] border border-[#D8D8D8]">
              {groupedEvents[dateTitle].length} DEBUTS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupedEvents[dateTitle].map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                selectedTimezone={selectedTimezone}
                onDownloadICS={onDownloadICS}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
