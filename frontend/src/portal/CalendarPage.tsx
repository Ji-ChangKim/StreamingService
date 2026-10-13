import { t, usePortalLocale, getPortalLanguage } from './portalLocale';
import { memo, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Search, RotateCcw } from 'lucide-react';
import { PortalProfile, PORTAL_PLATFORMS, portalDateKey } from '../../../shared/portal';
import { CreatorCard, PortalLink, PortalState, PlatformBadge, PortalAvatar, PortalDialog, portalSchedule, downloadPortalSchedule, downloadPortalSchedules } from './PortalUi';
import { PortalStage } from './PortalStage';
import { buildCalendarIndex } from './calendarIndex';
import { dateTimeFormatter } from '../../../shared/dateTimeFormatter';

// 기존 LIVE와 동일한 원본 플랫폼 아이콘을 달력 일정 앞에 표시한다.
const CALENDAR_PLATFORM_ICONS = Object.fromEntries(PORTAL_PLATFORMS.map((platform) => [platform.id, platform.icon]));
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
// 현재 서비스 대상인 한·일·미만 탐색 선택지로 제공한다.
const CALENDAR_COUNTRIES = [{ id: 'KR', label: '한국' }, { id: 'JP', label: '일본' }, { id: 'US', label: '미국' }];
const CALENDAR_TIMEZONES = [{ id: 'Asia/Seoul', label: '한국 (KST)' }, { id: 'Asia/Tokyo', label: '일본 (JST)' }, { id: 'America/Los_Angeles', label: '미국 서부 (LA)' }, { id: 'America/New_York', label: '미국 동부 (뉴욕)' }];
type CalendarState = { month: string; platform: string; country: string; query: string; timezone: string; view: 'month' | 'week'; day: string };

// 달력 복귀 시 마지막 탐색 조건을 복원한다.
function initialCalendar(): CalendarState {
  const timezone = 'Asia/Seoul';
  const day = portalDateKey(new Date(), timezone);
  const fallback: CalendarState = { month: day.slice(0, 7), platform: 'ALL', country: 'ALL', query: '', timezone, view: window.innerWidth < 640 ? 'week' : 'month', day };
  try {
    const saved = { ...fallback, ...JSON.parse(sessionStorage.getItem('vd-calendar') || '{}') };
    // 이전에 저장된 제외 국가·시간대가 선택지 없는 상태로 남지 않도록 복원한다.
    return { ...saved, country: CALENDAR_COUNTRIES.some((country) => country.id === saved.country) ? saved.country : 'ALL', timezone: CALENDAR_TIMEZONES.some((zone) => zone.id === saved.timezone) ? saved.timezone : timezone };
  } catch { return fallback; }
}

// 월 이동은 UTC 달력 연산으로 일수 차이와 브라우저 시간대의 영향을 피한다.
function shiftedMonth(month: string, delta: number): string {
  return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + delta, 1)).toISOString().slice(0, 7);
}

// 공통 필터를 달력·예정자·미정 목록에 동일하게 적용한다.
export function filterPortalProfiles(profiles: PortalProfile[], platform: string, country: string, query: string): PortalProfile[] {
  const search = query.trim().toLocaleLowerCase();
  return profiles.filter((p) => (platform === 'ALL' || p.platform === platform) && (country === 'ALL' || p.countryCode === country) && (!search || p.displayName.toLocaleLowerCase().includes(search)));
}

// 메인에서는 날짜 탐색을 먼저 제공하고 그다음 가까운 예정자를 소개한다.
export const CalendarPage = memo(function CalendarPage({ profiles, loading, error, refresh, onNavigate }: { profiles: PortalProfile[]; loading: boolean; error: string; refresh: () => void; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [state, setState] = useState<CalendarState>(initialCalendar);
  const [inspectedDay, setInspectedDay] = useState('');
  const [expanded, setExpanded] = useState(false);
  const update = (patch: Partial<CalendarState>) => setState((previous) => ({ ...previous, ...patch }));
  const today = portalDateKey(new Date(), state.timezone);
  useEffect(() => { try { sessionStorage.setItem('vd-calendar', JSON.stringify(state)); } catch { /* 저장 제한 시 현재 화면의 조건만 유지한다. */ } }, [state]);
  const filtered = useMemo(() => filterPortalProfiles(profiles, state.platform, state.country, state.query), [profiles, state.platform, state.country, state.query]);
  // 전체 프로필을 각 날짜 셀에서 다시 검색하지 않고 현재 조건별 색인을 재사용한다.
  const index = useMemo(() => buildCalendarIndex(filtered, state.timezone), [filtered, state.timezone]);
  const monthProfiles = index.byMonth.get(state.month) || [];
  const dateProfiles = monthProfiles.filter((p) => p.dateState !== 'DATE_TBD');
  const undecided = monthProfiles.filter((p) => p.dateState === 'DATE_TBD');
  const year = Number(state.month.slice(0, 4)), month = Number(state.month.slice(5));
  const offset = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthDays = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => new Date(Date.UTC(year, month - 1, index - offset + 1)).toISOString().slice(0, 10));
  const selected = state.day.startsWith(state.month) ? state.day : `${state.month}-01`;
  const weekStart = Date.parse(`${selected}T00:00:00Z`) - new Date(`${selected}T00:00:00Z`).getUTCDay() * 86400000;
  const weekDays = Array.from({ length: 7 }, (_, index) => new Date(weekStart + index * 86400000).toISOString().slice(0, 10));
  const ordered = [...dateProfiles].filter((p) => state.month < today.slice(0, 7) || (index.days.get(p.slug) || '') >= today).sort((a, b) => (index.days.get(a.slug) || '').localeCompare(index.days.get(b.slug) || '') || a.startAtUtc.localeCompare(b.startAtUtc) || a.slug.localeCompare(b.slug));
  const dayItems = index.byDay.get(inspectedDay) || [];
  const selectedItems = index.byDay.get(selected) || [];
  const move = (delta: number) => {
    if (state.view === 'week') { const day = new Date(Date.parse(`${selected}T00:00:00Z`) + delta * 7 * 86400000).toISOString().slice(0, 10); update({ month: day.slice(0, 7), day }); }
    else { const next = shiftedMonth(state.month, delta); update({ month: next, day: `${next}-01` }); }
  };
  return <>
    <PortalStage profiles={profiles} timezone={state.timezone} loading={loading} error={error} refresh={refresh} onNavigate={onNavigate} />
    <section className="vd-calendar-panel" aria-label={t("데뷔 일정")}>
      <div className="vd-calendar-toolbar"><div className="vd-month-control"><button type="button" className="vd-icon-button" aria-label={state.view === 'month' ? t("이전 달") : t("이전 주")} onClick={() => move(-1)}><ChevronLeft size={20} /></button><label className="vd-month-label"><span className="vd-sr-only">{t("조회 월")}</span><input type="month" value={state.month} onChange={(event) => { if (event.target.value) update({ month: event.target.value, day: `${event.target.value}-01` }); }} /></label><button type="button" className="vd-icon-button" aria-label={state.view === 'month' ? t("다음 달") : t("다음 주")} onClick={() => move(1)}><ChevronRight size={20} /></button><button type="button" className="vd-button vd-small" onClick={() => update({ month: today.slice(0, 7), day: today })}>{t("오늘")}</button></div><div className="vd-toolbar-right"><button type="button" className="vd-button vd-small" disabled={loading || Boolean(error) || !profiles.some((profile) => profile.dateState === 'FIXED')} onClick={() => downloadPortalSchedules(profiles)}><CalendarPlus size={15} />{t("전체 일정 저장")}</button><span className="vd-count">{loading ? t("불러오는 중") : error ? t("확인 필요") : t("{0}명의 데뷔 일정", [monthProfiles.length])}</span><div className="vd-segment" aria-label={t("달력 보기")}><button type="button" aria-pressed={state.view === 'month'} onClick={() => update({ view: 'month' })}>{t("월간")}</button><button type="button" aria-pressed={state.view === 'week'} onClick={() => update({ view: 'week' })}>{t("주간")}</button></div></div></div>
      <div className="vd-calendar-filters"><div className="vd-platform-filter" aria-label={t("방송 플랫폼")}><button type="button" aria-pressed={state.platform === 'ALL'} onClick={() => update({ platform: 'ALL' })}>{t("전체")}</button>{PORTAL_PLATFORMS.map((p) => <button type="button" key={p.id} aria-pressed={state.platform === p.id} onClick={() => update({ platform: p.id })}><img src={p.icon} alt="" /><span>{p.label}</span></button>)}</div><div className="vd-search"><Search size={16} /><input aria-label={t("선택한 월의 데뷔자 이름 검색")} placeholder={t("데뷔자 이름 검색")} value={state.query} onChange={(e) => update({ query: e.target.value })} /></div><label className="vd-filter-select"><span className="vd-sr-only">{t("활동 국가")}</span><select value={state.country} onChange={(e) => update({ country: e.target.value })}><option value="ALL">{t("전체 국가")}</option>{CALENDAR_COUNTRIES.map((country) => <option key={country.id} value={country.id}>{t(country.label)}</option>)}</select></label><label className="vd-filter-select"><span className="vd-sr-only">{t("일정 표시 시간대")}</span><select value={state.timezone} onChange={(e) => update({ timezone: e.target.value })}>{CALENDAR_TIMEZONES.map((zone) => <option key={zone.id} value={zone.id}>{t(zone.label)}</option>)}</select></label></div>
      {loading ? <PortalState loading title={t("데뷔 일정을 불러오는 중이에요")} /> : error ? <PortalState title={t("일정을 불러오지 못했어요")} description={t(error)} action={<button className="vd-button" type="button" onClick={refresh}>{t("다시 시도")}</button>} /> : <>
        <div className="vd-weekdays">{WEEKDAYS.map((day, index) => <span key={day}>{dateTimeFormatter(getPortalLanguage(), { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 9, 11 + index)))}</span>)}</div>
        <div className={`vd-calendar-grid ${state.view === 'week' ? 'is-week' : ''}`}>
          {(state.view === 'month' ? monthDays : weekDays).map((day) => {
            const items = index.byDay.get(day) || [];
            const outside = !day.startsWith(state.month);
            return <div className={`vd-day ${outside ? 'is-outside' : ''} ${today === day ? 'is-today' : ''} ${selected === day ? 'is-selected' : ''}`} key={day}><button type="button" className="vd-day-open" aria-label={t("{0}{1} · 데뷔 {2}명 · 전체 일정 보기", [day, today === day ? ' ' + t('오늘') : '', items.length])} onClick={() => { update({ day, month: day.slice(0, 7) }); setInspectedDay(day); }}><span className="vd-day-number">{Number(day.slice(8))}</span>{day === today && <small>{t("오늘")}</small>}<span className="vd-mobile-count">{items.length ? t("{0}명", [items.length]) : ''}</span></button><div className="vd-day-events">{items.slice(0, state.view === 'week' ? 4 : 2).map((p) => <button type="button" key={p.slug} onClick={() => { update({ day }); setInspectedDay(day); }} title={`${p.displayName} · ${portalSchedule(p, state.timezone)}`}><img className="vd-event-platform-icon" src={CALENDAR_PLATFORM_ICONS[p.platform]} alt={p.platform} width={16} height={16} /><time>{p.dateState === 'TIME_TBD' ? t("미정") : dateTimeFormatter(getPortalLanguage(), { timeZone: state.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(p.startAtUtc))}</time><span>{p.displayName}</span></button>)}</div>{items.length > (state.view === 'week' ? 4 : 2) && <button type="button" className="vd-more" onClick={() => setInspectedDay(day)}>+{items.length - (state.view === 'week' ? 4 : 2)}{t("명 더 보기")}</button>}</div>;
          })}
        </div>
        <div className="vd-calendar-caption"><span><CalendarDays size={14} /> {t("날짜를 선택하면 소개와 방송 채널을 확인할 수 있어요.")}</span><button className="vd-text-button" type="button" onClick={() => update({ platform: 'ALL', country: 'ALL', query: '' })}><RotateCcw size={13} /> {t("조건 초기화")}</button></div>
        {!monthProfiles.length && <div className="vd-empty-inline"><p>{t("선택한 조건의 데뷔 일정이 없어요.")}</p><button type="button" className="vd-text-button" onClick={() => move(1)}>{t("다음")}{state.view === 'month' ? t("달") : t("주")} {t("확인")}<ArrowRight size={15} /></button></div>}
      </>}
    </section>
    {!loading && !error && <div className="vd-mobile-agenda"><div className="vd-section-heading"><h2>{selected} {t("데뷔 일정")}</h2><button className="vd-text-button" type="button" onClick={() => setInspectedDay(selected)}>{t("전체 보기")}<ArrowRight size={16} /></button></div>{selectedItems.length ? selectedItems.map((profile) => <ScheduleRow key={profile.slug} profile={profile} timezone={state.timezone} onNavigate={onNavigate} />) : <p className="vd-muted">{t("선택한 날짜의 일정이 없어요. 다른 날짜도 살펴보세요.")}</p>}</div>}
    {!loading && !error && <section className="vd-section"><div className="vd-section-heading"><div><span className="vd-eyebrow">{t("어떤 버튜버인지 궁금하다면")}</span><h2>{state.month < today.slice(0, 7) ? t("이달 데뷔자") : t("다가오는 데뷔")}</h2></div><PortalLink to="/creators" onNavigate={onNavigate} className="vd-text-button">{t("버튜버 둘러보기")}<ArrowRight size={16} /></PortalLink></div>{ordered.length ? <><div className="vd-cards">{ordered.slice(0, expanded ? undefined : 4).map((profile) => <CreatorCard key={profile.slug} profile={profile} onNavigate={onNavigate} timezone={state.timezone} />)}</div>{ordered.length > 4 && <button type="button" className="vd-button vd-show-more" onClick={() => setExpanded(!expanded)}>{expanded ? t("접기") : t("예정자 {0}명 모두 보기", [ordered.length])}</button>}</> : <div className="vd-empty-inline"><p>{t("선택한 월·조건의 예정자가 없어요.")}</p><button type="button" className="vd-button" onClick={() => update({ month: shiftedMonth(state.month, 1), day: `${shiftedMonth(state.month, 1)}-01` })}>{t("다음 달 살펴보기")}</button></div>}</section>}
    {!loading && !error && undecided.length > 0 && <section className="vd-section"><div className="vd-section-heading"><div><span className="vd-eyebrow">{t("만남을 준비하고 있어요")}</span><h2>{t("날짜를 기다리는 데뷔")}<span className="vd-count">{undecided.length}{t("명")}</span></h2></div></div><div className="vd-cards">{undecided.map((profile) => <CreatorCard key={profile.slug} profile={profile} onNavigate={onNavigate} />)}</div></section>}
    {inspectedDay && <PortalDialog title={t("{0} 데뷔 일정", [inspectedDay])} onClose={() => setInspectedDay('')}><p className="vd-muted">{t("표시 시간대")}{state.timezone} · {dayItems.length}{t("명")}</p>{dayItems.length ? <div className="vd-schedule-list">{dayItems.map((profile) => <ScheduleRow key={profile.slug} profile={profile} timezone={state.timezone} onNavigate={(path) => { setInspectedDay(''); onNavigate(path); }} />)}</div> : <PortalState title={t("등록된 일정이 없어요")} description={t("이 날짜의 첫 데뷔 소식을 알려주세요.")} />}<PortalLink to={`/upload?date=${inspectedDay}`} onNavigate={(path) => { setInspectedDay(''); onNavigate(path); }} className="vd-button vd-primary"><CalendarPlus size={16} /> {t("이 날짜에 데뷔 등록하기")}</PortalLink></PortalDialog>}
  </>;
});

// 날짜별 상세에서는 시간과 소개·방송 이동을 함께 제공한다.
export function ScheduleRow({ profile, timezone, onNavigate }: { profile: PortalProfile; timezone: string; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return <article className="vd-schedule-row"><PortalAvatar profile={profile} /><div className="vd-schedule-info"><PlatformBadge platform={profile.platform} /><PortalLink to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={onNavigate}><h3>{profile.displayName}</h3></PortalLink><p>{profile.description || t("방송 채널에서 소개를 만나보세요.")}</p><strong>{portalSchedule(profile, timezone)}</strong></div><div className="vd-row-actions"><PortalLink to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={onNavigate} className="vd-button vd-small">{t("소개 보기")}</PortalLink>{profile.channelUrl && <a href={profile.channelUrl} target="_blank" rel="noopener noreferrer" className="vd-text-button">{t("방송 채널")}<ArrowRight size={14} /></a>}{profile.dateState === 'FIXED' && <button type="button" className="vd-text-button" onClick={() => downloadPortalSchedule(profile)}>{t("일정 저장")}</button>}</div></article>;
}
