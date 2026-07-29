import { DebutEvent } from '../types';

export interface CalendarCell {
  date: Date | null;
  dayNumber: number;
}

/**
 * 특정 연도와 월에 해당하는 달력 그리드 셀 배열을 생성하는 순수 함수
 */
export function getCalendarGridCells(year: number, month: number): CalendarCell[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells: CalendarCell[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push({ date: null, dayNumber: 0 });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({
      date: new Date(year, month, day),
      dayNumber: day,
    });
  }

  return calendarCells;
}

/**
 * UTC 시각 문자열을 지정된 타임존 기준 YYYY-MM-DD 키로 변환하는 순수 함수
 */
export function getEventDateKey(utcString: string, timezone: string): string {
  try {
    const d = new Date(utcString);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  } catch {
    return utcString.split('T')[0];
  }
}

/**
 * 이벤트 목록을 타임존 기준 YYYY-MM-DD 날짜별 Map으로 그룹화하는 순수 함수
 */
export function buildEventsByDateMap(events: DebutEvent[], timezone: string): Map<string, DebutEvent[]> {
  const eventsByDateMap = new Map<string, DebutEvent[]>();
  events.forEach((evt) => {
    const key = getEventDateKey(evt.startAtUtc, timezone);
    if (!eventsByDateMap.has(key)) {
      eventsByDateMap.set(key, []);
    }
    eventsByDateMap.get(key)!.push(evt);
  });
  return eventsByDateMap;
}

/**
 * 타임존 기준 오늘 날짜의 YYYY-MM-DD 키를 생성하는 순수 함수
 */
export function getTodayDateKey(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}
