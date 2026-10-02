// Single Responsibility Principle: KST Weekly Debut Audit Date Range Calculator Service

export interface AuditDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dayOfWeek: number; // 0: 일, 1: 월, ..., 6: 토
  dayName: string;   // '월요일', '화요일', ...
  description: string;
}

/**
 * 1. UTC 기준 Date 객체를 한국 표준시(KST, UTC+9) 년/월/일/요일로 변환하는 순수 함수 (SRP)
 */
export function getKstDateComponents(now: Date = new Date()): {
  year: number;
  month: number;
  date: number;
  dayOfWeek: number;
} {
  // UTC ms + 9시간 (540분) 오프셋
  const kstTime = now.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstTime);

  return {
    year: kstDate.getUTCFullYear(),
    month: kstDate.getUTCMonth() + 1, // 1~12
    date: kstDate.getUTCDate(),       // 1~31
    dayOfWeek: kstDate.getUTCDay(),   // 0 (일) ~ 6 (토)
  };
}

/**
 * 2. 특정 KST 연/월/일에 일(day) 오프셋을 더해 YYYY-MM-DD 문자열을 반환하는 순수 헬퍼 (SRP)
 */
export function addDaysToKstDate(year: number, month: number, date: number, offsetDays: number): string {
  const d = new Date(Date.UTC(year, month - 1, date + offsetDays));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/**
 * 3. 요일별 자동 검사 규칙에 따른 데뷔 시작일~종료일 범위 계산 (SRP)
 *
 * 규칙:
 * - 월(1): 이번 주 전체 검사 (월 ~ 일, 7일간)
 * - 화(2): 화 ~ 일 검사 (6일간)
 * - 수(3): 수 ~ 일 검사 (5일간)
 * - 목(4): 목 ~ 일 검사 (4일간)
 * - 금(5): 금 ~ 일 검사 (3일간)
 * - 토(6): 토 ~ 일 검사 (2일간)
 * - 일(0): 차주 데뷔 전체 검사 (다음 주 월 ~ 다음 주 일, 7일간)
 */
export function calculateWeeklyAuditDateRange(baseDate: Date = new Date()): AuditDateRange {
  const { year, month, date, dayOfWeek } = getKstDateComponents(baseDate);
  const dayName = DAY_NAMES[dayOfWeek];

  if (dayOfWeek === 0) {
    // 일요일: 차주 데뷔 전체 검사 (다음 주 월요일 ~ 다음 주 일요일)
    const startDate = addDaysToKstDate(year, month, date, 1); // 다음 주 월요일 (+1일)
    const endDate = addDaysToKstDate(year, month, date, 7);   // 다음 주 일요일 (+7일)
    return {
      startDate,
      endDate,
      dayOfWeek,
      dayName,
      description: `[일요일] 차주 데뷔 전체 검사 (${startDate} ~ ${endDate})`,
    };
  }

  // 월요일(1) ~ 토요일(6): 오늘(KST)부터 이번 주 일요일까지
  const daysUntilSunday = 7 - dayOfWeek;
  const startDate = addDaysToKstDate(year, month, date, 0); // 오늘
  const endDate = addDaysToKstDate(year, month, date, daysUntilSunday); // 이번 주 일요일

  const descLabel = dayOfWeek === 1 ? '이번주 전체 검사' : `${dayName.slice(0, 1)}~일 검사`;

  return {
    startDate,
    endDate,
    dayOfWeek,
    dayName,
    description: `[${dayName}] ${descLabel} (${startDate} ~ ${endDate})`,
  };
}

/**
 * 4. 주어진 데뷔 날짜(YYYY-MM-DD)가 검사 대상 범위에 포함되는지 검사 (SRP)
 */
export function isDebutInAuditRange(debutDate: string, range: { startDate: string; endDate: string }): boolean {
  if (!debutDate) return false;
  const cleanDate = debutDate.trim().replace(/\//g, '-').replace(/\./g, '-');
  return cleanDate >= range.startDate && cleanDate <= range.endDate;
}
