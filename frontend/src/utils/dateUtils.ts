import { DebutEvent } from '../types';

/**
 * UTC 시각을 사용자가 선택한 타임존의 로컬 시각 문자열로 변환하는 단일 기능 함수
 */
export function formatLocalTime(utcIso: string, timezone: string): string {
  try {
    const date = new Date(utcIso);
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone,
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return utcIso;
  }
}

/**
 * UTC 시각을 사용자가 선택한 타임존의 시:분(HH:mm) 문자열로만 변환하는 단일 기능 함수
 */
export function formatTimeOnly(utcIso: string, timezone: string): string {
  try {
    const date = new Date(utcIso);
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '00:00';
  }
}

/**
 * 이벤트 타겟 시각까지의 남은 시/분/초를 계산하는 단일 기능 함수
 */
export function calculateTimeRemaining(targetUtcIso: string): {
  hours: string;
  minutes: string;
  seconds: string;
  isPast: boolean;
} {
  const targetTime = new Date(targetUtcIso).getTime();
  const now = new Date().getTime();
  const diff = targetTime - now;

  if (diff <= 0) {
    return { hours: '00', minutes: '00', seconds: '00', isPast: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    isPast: false,
  };
}

/**
 * 이벤트 정보를 구글 캘린더 등록 템플릿 URL로 변환하는 단일 기능 함수
 */
export function generateGoogleCalendarUrl(event: DebutEvent): string {
  const startDate = new Date(event.startAtUtc).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endDate = new Date(new Date(event.startAtUtc).getTime() + 3600000)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, '');
  const details = encodeURIComponent(
    `V-DEBUT HUB 데뷔 방송\n크리에이터: ${event.creator.displayName}\n방송 URL: ${event.links[0]?.url || ''}`
  );
  const title = encodeURIComponent(`[V-DEBUT] ${event.creator.displayName} 데뷔 방송`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
}

/**
 * .ics iCalendar 포맷 텍스트를 생성하는 단일 기능 함수
 */
export function generateICSContent(event: DebutEvent): string {
  const startDate = new Date(event.startAtUtc).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endDate = new Date(new Date(event.startAtUtc).getTime() + 3600000)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//V-DEBUT HUB//KR',
    'BEGIN:VEVENT',
    `UID:vdebut-${event.id}`,
    `DTSTAMP:${startDate}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:[V-DEBUT] ${event.creator.displayName} 데뷔 방송`,
    `DESCRIPTION:${event.description.replace(/\n/g, ' ')}\\n방송 URL: ${event.links[0]?.url || ''}`,
    `URL:${event.links[0]?.url || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * 파일 다운로드를 트리거하는 단일 기능 함수
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'text/calendar;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
