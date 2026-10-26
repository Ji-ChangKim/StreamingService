import type { PortalProfile } from '../../../shared/portal';
import { portalWebUrl } from '../../../shared/portal';
import { dateTimeFormatter } from '../../../shared/dateTimeFormatter';
import { PortalAvatar, PlatformBadge, PortalDialog, PortalLink, downloadPortalSchedule } from './PortalUi';
import { getPortalLanguage, t, usePortalLocale } from './portalLocale';
import './calendarDayDialog.css';

// 팝업에서만 시간대를 이용자가 읽기 쉬운 지역 이름으로 표시한다.
function timezoneLabel(timezone: string): string {
  const labels: Record<string, string> = { 'Asia/Seoul': '한국 시간', 'Asia/Tokyo': '일본 시간', 'America/Los_Angeles': '미국 서부 시간', 'America/New_York': '미국 동부 시간' };
  return labels[timezone] ? t(labels[timezone]) : dateTimeFormatter(getPortalLanguage(), { timeZone: timezone, timeZoneName: 'long' }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value || timezone;
}

// 선택한 달력 날짜는 다시 시간대 변환하지 않고 요일을 붙여 표시한다.
function dayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  return `${dateTimeFormatter(getPortalLanguage(), { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(date)} (${dateTimeFormatter(getPortalLanguage(), { timeZone: 'UTC', weekday: 'short' }).format(date)})`;
}

// 시각이 확정된 일정을 먼저 정렬하고 시간 미정 일정은 마지막에 둔다.
function scheduleOrder(profile: PortalProfile): number { return profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc)) ? Date.parse(profile.startAtUtc) : Infinity; }

// 날짜별 팝업 전용 행이며 메인의 기존 일정 카드와 모바일 목록은 변경하지 않는다.
function DayScheduleRow({ profile, timezone, onNavigate }: { profile: PortalProfile; timezone: string; onNavigate: (path: string) => void }) {
  const fixed = profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc));
  const channel = portalWebUrl(profile.channelUrl);
  return <article className="vd-day-schedule-row">
    <div className={`vd-day-schedule-time ${fixed ? '' : 'is-undecided'}`}>{fixed ? <time dateTime={profile.startAtUtc}>{dateTimeFormatter(getPortalLanguage(), { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(profile.startAtUtc))}</time> : <><span>{t('시간 미정')}</span>{profile.timezone !== timezone && <small>{t('{0} 기준', [timezoneLabel(profile.timezone)])}</small>}</>}</div>
    <div className="vd-day-schedule-person"><PortalAvatar profile={profile} /><div><PortalLink className="vd-day-schedule-name" to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={onNavigate}><h3>{profile.displayName}</h3></PortalLink><PlatformBadge platform={profile.platform} /></div></div>
    <div className="vd-day-schedule-actions">{channel && <a className="vd-day-schedule-channel" href={channel} target="_blank" rel="noopener noreferrer">{t('방송 채널')}</a>}{fixed && <button type="button" className="vd-day-schedule-save" aria-label={t('{0} 일정 저장', [profile.displayName])} onClick={() => downloadPortalSchedule(profile)}>{t('일정 저장')}</button>}</div>
  </article>;
}

// 날짜별 데뷔 일정 팝업에만 간결한 정보·행동 순서와 독립 스크롤을 적용한다.
export function CalendarDayDialog({ day, profiles, timezone, onClose, onNavigate }: { day: string; profiles: PortalProfile[]; timezone: string; onClose: () => void; onNavigate: (path: string) => void }) {
  usePortalLocale();
  const ordered = [...profiles].sort((a, b) => scheduleOrder(a) - scheduleOrder(b) || a.displayName.localeCompare(b.displayName, getPortalLanguage()));
  return <PortalDialog className="vd-day-schedule-dialog" title={t('{0} 데뷔 일정', [dayLabel(day)])} onClose={onClose}>
    <p className="vd-day-schedule-meta">{timezoneLabel(timezone)} · {t('{0}명', [ordered.length])}</p>
    <div className="vd-day-schedule-list">{ordered.length ? ordered.map(profile => <DayScheduleRow key={profile.slug} profile={profile} timezone={timezone} onNavigate={onNavigate} />) : <p className="vd-day-schedule-empty">{t('선택한 조건의 일정이 없어요.')}</p>}</div>
    <div className="vd-day-schedule-footer"><PortalLink className="vd-day-schedule-register" to={`/upload?date=${encodeURIComponent(day)}`} onNavigate={onNavigate}>{t('이 날짜에 데뷔 등록하기')}</PortalLink></div>
  </PortalDialog>;
}
