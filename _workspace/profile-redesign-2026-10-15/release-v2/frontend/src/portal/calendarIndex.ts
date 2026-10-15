import { PortalProfile, portalDay, portalMonth } from '../../../shared/portal';

// 현재 목록의 날짜를 한 번만 변환하고 날짜·월별 참조를 모은다.
export function buildCalendarIndex(profiles: PortalProfile[], timezone: string) {
  const byDay = new Map<string, PortalProfile[]>();
  const byMonth = new Map<string, PortalProfile[]>();
  const days = new Map<string, string>();
  for (const profile of profiles) {
    const day = portalDay(profile, timezone);
    const month = day ? day.slice(0, 7) : portalMonth(profile, timezone);
    days.set(profile.slug, day);
    if (day) { const group = byDay.get(day) || []; group.push(profile); byDay.set(day, group); }
    if (month) { const group = byMonth.get(month) || []; group.push(profile); byMonth.set(month, group); }
  }
  for (const group of byDay.values()) group.sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc) || a.slug.localeCompare(b.slug));
  return { byDay, byMonth, days };
}
