import { PortalProfile } from './portal';

// 실제 확정된 일정만 내보내며 설명의 줄바꿈·구분 문자가 파일 구조를 바꾸지 못하게 한다.
export function portalCalendarFile(profiles: PortalProfile[], now = new Date()): string {
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = (value: string | Date) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = profiles.filter((profile) => profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc)))
    .flatMap((profile) => ['BEGIN:VEVENT', `UID:${escape(profile.slug)}@vdebut.live`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(profile.startAtUtc)}`, `SUMMARY:${escape(`${profile.displayName} 데뷔 방송`)}`, `DESCRIPTION:${escape(profile.description)}`, `URL:${escape(profile.channelUrl)}`, 'END:VEVENT']);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VDebut//Debut Calendar//KO', ...events, 'END:VCALENDAR', ''].join('\r\n');
}
