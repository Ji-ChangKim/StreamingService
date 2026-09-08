import { DebutEvent } from '../types';
import { detectCountryFromChannel } from './countryDetector';

/**
 * 이벤트가 현재 라이브 방송 중인지 판별하는 단일 기능 함수
 */
export function checkIsEventLive(startAtUtc: string, durationHours: number = 4): boolean {
  const start = new Date(startAtUtc).getTime();
  const now = new Date().getTime();
  return now >= start && now <= start + durationHours * 3600000;
}

/**
 * 국가 필터 조건(KR, JP, EN, ALL)에 따라 이벤트를 필터링하는 단일 기능 함수
 */
export function filterEventsByCountry(events: DebutEvent[], selectedCountry: string): DebutEvent[] {
  if (!selectedCountry || selectedCountry === 'ALL') return events;
  const targetCountry = selectedCountry.toUpperCase();

  return events.filter((evt) => {
    // 1. 이미 정식 부여된 국가 코드가 유효한 경우
    const explicitCode = evt.creator?.countryCode?.toUpperCase();
    if (explicitCode === targetCountry) return true;

    // 2. 비어있거나 부정확한 경우 채널/이름/플랫폼으로 실시간 판별
    const primaryLink = evt.links?.find((l) => l.isPrimary) || evt.links?.[0];
    const detected = detectCountryFromChannel({
      platform: primaryLink?.platform || '',
      channelUrl: primaryLink?.url || '',
      displayName: evt.creator?.displayName || evt.title || '',
      description: evt.description || '',
      existingCountryCode: explicitCode,
    });

    return detected === targetCountry;
  });
}

/**
 * 플랫폼 필터 조건에 따라 이벤트를 필터링하는 단일 기능 함수
 */
export function filterEventsByPlatform(events: DebutEvent[], platform: string): DebutEvent[] {
  if (platform === 'ALL') return events;
  return events.filter((evt) => evt.links.some((l) => l.platform === platform));
}

/**
 * 검색어 조건에 따라 이벤트를 필터링하는 단일 기능 함수
 */
export function filterEventsByQuery(events: DebutEvent[], query: string): DebutEvent[] {
  if (!query.trim()) return events;
  const q = query.toLowerCase();
  return events.filter(
    (evt) =>
      evt.title.toLowerCase().includes(q) ||
      evt.creator.displayName.toLowerCase().includes(q) ||
      evt.creator.agency.toLowerCase().includes(q)
  );
}

/**
 * 타임존 기준으로 날짜별 그룹핑하는 단일 기능 함수
 */
export function groupEventsByDate(events: DebutEvent[], timezone: string): Record<string, DebutEvent[]> {
  return events.reduce<Record<string, DebutEvent[]>>((acc, evt) => {
    try {
      const date = new Date(evt.startAtUtc);
      const dateKey = new Intl.DateTimeFormat('ko-KR', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }).format(date);

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(evt);
    } catch {
      const fallbackKey = '기타 일정';
      if (!acc[fallbackKey]) acc[fallbackKey] = [];
      acc[fallbackKey].push(evt);
    }
    return acc;
  }, {});
}
