import { DebutEvent } from '../types';

export interface CalendarCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  year: number;
  month: number;
}

/**
 * 특정 연도와 월에 해당하는 6주(42개 셀) 달력 그리드 셀 배열을 생성하는 순수 함수
 * (이전 달 및 다음 달 날짜 포함)
 */
export function getCalendarGridCells(year: number, month: number): CalendarCell[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells: CalendarCell[] = [];

  // 1. 이전 달 날짜 채우기
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, prevDay);
    calendarCells.push({
      date: prevDate,
      dayNumber: prevDay,
      isCurrentMonth: false,
      year: prevDate.getFullYear(),
      month: prevDate.getMonth(),
    });
  }

  // 2. 현재 달 날짜 채우기
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const currentDate = new Date(year, month, day);
    calendarCells.push({
      date: currentDate,
      dayNumber: day,
      isCurrentMonth: true,
      year,
      month,
    });
  }

  // 3. 다음 달 날짜 채우기 (총 42개 셀 유지)
  const totalCellsNeeded = 42;
  const remainingCells = totalCellsNeeded - calendarCells.length;

  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, month + 1, day);
    calendarCells.push({
      date: nextDate,
      dayNumber: day,
      isCurrentMonth: false,
      year: nextDate.getFullYear(),
      month: nextDate.getMonth(),
    });
  }

  return calendarCells;
}

// Memoized Intl.DateTimeFormat Cache Pool for Calendar Keys
const dateKeyFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateKeyFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = dateKeyFormatterCache.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dateKeyFormatterCache.set(timezone, formatter);
  }
  return formatter;
}

/**
 * UTC 시각 문자열을 지정된 타임존 기준 YYYY-MM-DD 키로 변환하는 순수 함수
 */
export function getEventDateKey(utcString: string, timezone: string): string {
  try {
    const normalizedIso = utcString.includes('T')
      ? utcString
      : utcString.trim().replace(' ', 'T') + 'Z';
    const d = new Date(normalizedIso);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid Date');
    }
    return getDateKeyFormatter(timezone).format(d);
  } catch {
    const rawDatePart = utcString.trim().split(' ')[0].split('T')[0];
    return rawDatePart;
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
    return getDateKeyFormatter(timezone).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}
