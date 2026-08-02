import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DebutEvent } from '../../types';

interface WeeklyCalendarStripProps {
  currentDate: Date;
  selectedDateStr: string;
  todayStr: string;
  eventsByDateMap: Map<string, DebutEvent[]>;
  onSelectDate: (dateStr: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeeklyCalendarStrip({
  currentDate,
  selectedDateStr,
  todayStr,
  eventsByDateMap,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: WeeklyCalendarStripProps) {
  // 현재 currentDate가 포함된 주의 일요일부터 토요일까지 7일 계산
  const getWeekDays = (baseDate: Date) => {
    const d = new Date(baseDate);
    const dayOfWeek = d.getDay(); // 0(일) ~ 6(토)
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const weekDays = getWeekDays(currentDate);
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white border-b border-[#E2E8F0] pt-2 pb-2.5 px-2 shadow-2xs">
      {/* 주간 이동 헤더 (이전주 / 주간 범위 / 다음주) */}
      <div className="flex items-center justify-between px-2 mb-2 text-xs font-extrabold text-[#475569]">
        <button
          onClick={onPrevWeek}
          className="p-1 hover:bg-slate-100 rounded-[6px] transition-colors active:scale-95 text-[#64748B] flex items-center gap-0.5"
          aria-label="이전 주"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[11px] hidden sm:inline">이전주</span>
        </button>

        <span className="font-mono text-[#0F172A]">
          {weekDays[0].getMonth() + 1}월 {weekDays[0].getDate()}일 ~ {weekDays[6].getMonth() + 1}월 {weekDays[6].getDate()}일
        </span>

        <button
          onClick={onNextWeek}
          className="p-1 hover:bg-slate-100 rounded-[6px] transition-colors active:scale-95 text-[#64748B] flex items-center gap-0.5"
          aria-label="다음 주"
        >
          <span className="text-[11px] hidden sm:inline">다음주</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 7일 주간 셀 스트립 (Grid 7) */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((dayDate, idx) => {
          const yyyy = dayDate.getFullYear();
          const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
          const dd = String(dayDate.getDate()).padStart(2, '0');
          const dateKey = `${yyyy}-${mm}-${dd}`;

          const isSelected = dateKey === selectedDateStr;
          const isToday = dateKey === todayStr;
          const dayEvents = eventsByDateMap.get(dateKey) || [];

          // 플랫폼 추출 및 중복 제거
          const platforms = Array.from(
            new Set(
              dayEvents.map((evt) => {
                const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                return primaryLink?.platform || 'CHZZK';
              })
            )
          );

          return (
            <div
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={`py-1.5 px-1 rounded-[12px] flex flex-col items-center justify-between min-h-[64px] cursor-pointer transition-all active:scale-95 ${
                isSelected
                  ? 'bg-blue-50/80 ring-2 ring-inset ring-[#2563EB] shadow-xs'
                  : isToday
                  ? 'bg-slate-50 border border-blue-300'
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* 요일 */}
              <span className={`text-[10px] font-bold ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-[#64748B]'}`}>
                {dayLabels[idx]}
              </span>

              {/* 날짜 숫자 (선택 시 파란 원형 Highlight) */}
              <span
                className={`text-xs font-mono font-extrabold w-6 h-6 rounded-full flex items-center justify-center my-0.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                    : isToday
                    ? 'bg-blue-100 text-[#2563EB]'
                    : 'text-[#0F172A]'
                }`}
              >
                {dayDate.getDate()}
              </span>

              {/* 💡 플랫폼이 많을 때의 스마트 요약 렌더링 알고리즘 */}
              <div className="h-4 flex items-center justify-center gap-0.5 w-full overflow-hidden">
                {dayEvents.length === 0 ? (
                  <span className="text-[9px] text-slate-300">-</span>
                ) : dayEvents.length <= 2 ? (
                  // 1~2개 일정: 공식 미니 브랜드 로고 또는 아이콘 표기
                  platforms.slice(0, 2).map((p, i) => (
                    <span key={i} className="shrink-0">
                      {p === 'CHZZK' && <img src="/icons/chzzk_icon.png" alt="CHZZK" className="w-3 h-3 object-contain" />}
                      {p === 'YOUTUBE' && <img src="/icons/youtube_icon.png" alt="YT" className="w-3 h-3 object-contain" />}
                      {p === 'SOOP' && <span className="text-[8px] font-bold text-[#2563EB]">🔵</span>}
                      {p !== 'CHZZK' && p !== 'YOUTUBE' && p !== 'SOOP' && <span className="text-[8px]">🟣</span>}
                    </span>
                  ))
                ) : (
                  // 3개 이상 많은 일정 몰림 시: [플랫폼 로고 1개 + '+N'] 카운터 뱃지 표기
                  <div className="flex items-center gap-0.5 bg-blue-100/80 text-[#2563EB] px-1 py-0.2 rounded-full text-[9px] font-black shrink-0">
                    {platforms[0] === 'CHZZK' ? (
                      <img src="/icons/chzzk_icon.png" alt="CHZZK" className="w-2.5 h-2.5 object-contain" />
                    ) : (
                      <span className="text-[7px]">🔵</span>
                    )}
                    <span>+{dayEvents.length}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
