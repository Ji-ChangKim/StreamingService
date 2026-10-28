import { applyPageSeo } from '../../utils/applyPageSeo';
import { t, usePortalLocale } from '../../portal/portalLocale';
// 외부 제목의 의심 표현을 공개 화면에서 제외한다.
import { publicBroadcastTitle } from '../../../../shared/contentReview';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock, Copy, Check, RefreshCw, Radio, Users, BarChart3, Search } from 'lucide-react';
import type { ActivityFilters, BroadcastActivity, ActivityBroadcast, ActivitySelection } from '../../../../shared/broadcastActivity';
import { activityPeriod, validActivityRange } from '../../../../shared/broadcastActivity';
import type { StatisticsStreamer, StatisticsStreamerSearchResponse } from '../../../../shared/statisticsStreamerSearch';
import { ActivityStreamerSearch, ActivityStreamerCard, findActivityStreamers } from './ActivityStreamerSearch';
import { useBroadcastActivity } from './useBroadcastActivity';
import { useActivityBroadcasts } from './useActivityBroadcasts';
import { ActivityLiveRankings } from './ActivityLiveRankings';
import { activityCategoryColor } from './activityColors';
import { activitySeo, activityNoindex, activityStreamerPath } from '../../../../shared/activitySeo';
import { StatisticsBrand } from './StatisticsBrand';
import { countFormat, safeStatisticsUrl, statisticsTime } from './statisticsModel';
import './broadcastStatistics.css';
import './activityDashboard.css';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const EMPTY_SELECTION: ActivitySelection = { day: '', weekday: null, hour: null, timeMetric: 'activity' };

// 검색 결과나 전체 통계가 다시 그려진 뒤 이전 읽던 위치를 복원한다.
function restoreActivityScroll() {
  const path = `${window.location.pathname}${window.location.search}`;
  if (sessionStorage.getItem('ad-restore') !== path) return;
  sessionStorage.removeItem('ad-restore');
  const position = Number(sessionStorage.getItem(`ad-scroll:${path}`)) || 0;
  window.requestAnimationFrame(() => window.scrollTo({ top: position, behavior: 'instant' }));
}

// 공유 주소의 채널·검색어·조회 조건을 화면 상태로 복원한다.
function readActivityLocation(): { filters: ActivityFilters; search: string; selection: ActivitySelection } {
  const params = new URLSearchParams(window.location.search);
  const defaults = activityPeriod(7);
  const from = params.get('from') || params.get('date') || defaults.from;
  const to = params.get('to') || params.get('date') || defaults.to;
  const range = validActivityRange(from, to) ? { from, to } : defaults;
  const platform = window.location.pathname === '/analytics/chzzk' ? 'CHZZK' : window.location.pathname === '/analytics/soop' ? 'SOOP' : params.get('platform');
  let channel = '';
  try { channel = decodeURIComponent(window.location.pathname.split('/analytics/streamer/')[1] || ''); } catch { /* 잘못된 주소는 전체 통계로 표시한다. */ }
  const day = params.get('day') || '';
  const weekday = params.has('weekday') ? Number(params.get('weekday')) : -1;
  const hour = params.has('hour') ? Number(params.get('hour')) : -1;
  const timeMetric = params.get('timeMetric') === 'starts' ? 'starts' : 'activity';
  const selection: ActivitySelection = day && validActivityRange(day, day) && day >= range.from && day <= range.to
    ? { ...EMPTY_SELECTION, day } : Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 && Number.isInteger(hour) && hour >= 0 && hour <= 23
      ? { day: '', weekday, hour, timeMetric } : EMPTY_SELECTION;
  return { filters: { ...range, platform: platform === 'CHZZK' || platform === 'SOOP' ? platform : 'ALL',
    category: (params.get('category') || '').slice(0, 100), channel }, search: (params.get('search') || '').slice(0, 80), selection };
}

// 숫자를 방송 시간의 단위로 표시한다.
export function activityMinutes(minutes: number): string {
  return minutes > 0 ? `${Math.floor(Math.round(minutes) / 60)}시간 ${Math.round(minutes) % 60}분` : '—';
}

// 날짜별 차트와 달력에 누락된 날짜도 남겨 기록 없음을 구분한다.
export function activityDays(from: string, to: string): string[] {
  return Array.from({ length: Math.floor((Date.parse(to) - Date.parse(from)) / 86400000) + 1 }, (_, index) => new Date(Date.parse(from) + index * 86400000).toISOString().slice(0, 10));
}

// 같은 지표 카드로 전체 규모와 개인 활동을 요약한다.
function ActivitySummary({ data, personal }: { data: BroadcastActivity; personal: boolean }) {
  const cards = [
    { tone: personal ? 'teal' : 'blue', label: personal ? '방송일 수' : '활동 채널', value: `${countFormat(personal ? data.summary.broadcastDays : data.summary.streamers)}${personal ? '일' : '개'}`, icon: <Users size={18} /> },
    { tone: 'violet', label: '방송 횟수', value: `${countFormat(data.summary.broadcasts)}회`, icon: <Radio size={18} /> },
    { tone: 'teal', label: '총 방송 시간', value: activityMinutes(data.summary.minutes), icon: <Clock size={18} /> },
    { tone: personal ? 'teal' : 'amber', label: personal ? '평균 기록 시간' : '방송 카테고리', value: personal ? activityMinutes(data.summary.broadcasts ? data.summary.minutes / data.summary.broadcasts : 0) : `${countFormat(data.summary.categoryCount)}개`, icon: <CalendarDays size={18} /> },
  ];
  return <div className="ad-summary">{cards.map((card) => <div key={card.label} className={`ad-summary-card ad-tone-${card.tone}`}><div><span>{card.label}</span>{card.icon}</div><strong>{card.value}</strong></div>)}</div>;
}

// 조회한 기간에 실제 남아 있는 기록만 소개한다.
export function ActivityNarrativeReport({ streamer, data }: { streamer?: StatisticsStreamer | null; data?: BroadcastActivity | null }) {
  usePortalLocale();
  if (!streamer || !data || !data.summary.broadcasts) return null;
  return <div className="ad-narrative-box"><p><strong>{streamer.name}</strong> · {data.meta.from} — {data.meta.to} · KST</p><p>{t('이 기간에 방송 {0}회, 방송일 {1}일이 기록되어 있어요.', [data.summary.broadcasts, data.summary.broadcastDays])} {data.summary.minutes > 0 && t('이어진 기록으로 합산한 방송 시간은 {0}입니다.', [activityMinutes(data.summary.minutes)])}</p></div>;
}

// 제목과 필요한 설명만 남긴 통계 영역을 구성한다.
function ActivityPanel({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="bs-panel ad-panel"><div className="ad-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>{children}</section>;
}

// 확인된 시간대는 0도 표시하고 미수집 시간대는 별도 색상으로 구분한다.
function ActivityHeatmap({ data, personal, selection, onSelect }: { data: BroadcastActivity; personal: boolean; selection: ActivitySelection; onSelect: (selection: ActivitySelection) => void }) {
  const [metric, setMetric] = useState<'activity' | 'starts'>(personal ? 'starts' : 'activity');
  useEffect(() => { if (selection.weekday !== null) setMetric(selection.timeMetric); }, [selection.weekday, selection.timeMetric]);
  const cells = new Map(data.heatmap.map((cell) => [`${cell.weekday}:${cell.hour}`, cell]));
  const starts = new Map(data.starts.map((cell) => [`${cell.weekday}:${cell.hour}`, cell.broadcasts]));
  const maximum = Math.max(1, ...(metric === 'starts' ? data.starts.map((cell) => cell.broadcasts) : data.heatmap.map((cell) => cell.channels)));
  return <ActivityPanel title="시간대별 방송 현황" description={metric === 'starts' ? '요일·시간대별 방송 시작 횟수' : personal ? '요일·시간대별 방송 활동 비율' : '요일·시간대별 평균 방송 채널 수'}
    action={<div className="bs-segment" aria-label="시간대 지표"><button type="button" aria-pressed={metric === 'activity'} onClick={() => setMetric('activity')}>방송 활동</button><button type="button" aria-pressed={metric === 'starts'} onClick={() => setMetric('starts')}>방송 시작</button></div>}>
    <div className="ad-heat-scroll"><div className="ad-heatmap" role="table" aria-label="요일·시간대별 방송 현황">
      <div className="ad-heat-row" role="row"><span role="columnheader" />{Array.from({ length: 24 }, (_, hour) => <span role="columnheader" key={hour}>{hour % 3 === 0 ? `${hour}시` : ''}</span>)}</div>
      {[1, 2, 3, 4, 5, 6, 0].map((weekday) => <div className="ad-heat-row" role="row" key={weekday}><b role="rowheader">{WEEKDAYS[weekday]}</b>{Array.from({ length: 24 }, (_, hour) => {
        const cell = cells.get(`${weekday}:${hour}`);
        const value = metric === 'starts' ? starts.get(`${weekday}:${hour}`) || 0 : cell?.channels || 0;
        const known = metric === 'starts' ? Boolean(cell || value) : Boolean(cell);
        const label = `${WEEKDAYS[weekday]}요일 ${hour}시 · ${known ? metric === 'starts' ? `방송 시작 ${value}회` : personal ? `방송 활동 ${(value * 100).toFixed(0)}%` : `평균 ${value.toFixed(1)}개 채널` : '기록 없음'}`;
        return <span role="cell" key={hour}><button type="button" title={label} aria-label={`${label} · 방송 이력 보기`}
          aria-pressed={selection.weekday === weekday && selection.hour === hour && selection.timeMetric === metric}
          className={`ad-heat-cell ${known ? '' : 'is-missing'}`} onClick={() => onSelect({ day: '', weekday, hour, timeMetric: metric })}
          style={known ? { background: value > 0 ? `rgba(${metric === 'starts' ? '124, 58, 237' : '13, 148, 136'}, ${0.16 + 0.84 * value / maximum})` : '#eef2f7' } : undefined} /></span>;
      })}</div>)}
    </div></div>
    <div className="ad-chart-caption"><span className={`ad-heat-legend ad-heat-legend-${metric}`}>기록 없음 <i className="is-missing" /> 적음 <i /><i /><i /> 많음</span></div>
  </ActivityPanel>;
}

// 카테고리별 방송 시간과 방송 횟수를 비교하고 해당 카테고리로 조회 범위를 좁힌다.
function ActivityCategories({ data, selected, onSelect }: { data: BroadcastActivity; selected: string; onSelect: (category: string) => void }) {
  const [metric, setMetric] = useState<'minutes' | 'broadcasts'>('minutes');
  const [all, setAll] = useState(false);
  const sorted = [...data.categories].sort((a, b) => b[metric] - a[metric]);
  const total = sorted.reduce((sum, item) => sum + item[metric], 0);
  const maximum = Math.max(1, ...sorted.map((item) => item[metric]));
  return <ActivityPanel title="카테고리별 방송 통계"
    action={<div className="bs-segment" aria-label="카테고리 지표"><button type="button" aria-pressed={metric === 'minutes'} onClick={() => setMetric('minutes')}>방송 시간</button><button type="button" aria-pressed={metric === 'broadcasts'} onClick={() => setMetric('broadcasts')}>방송 횟수</button></div>}>
    <div className="ad-category-list">{sorted.slice(0, all ? undefined : 8).map((item) => <button className="ad-category" type="button" key={item.key} style={{ '--ad-category-color': item.key.endsWith(':unknown') ? '#94a3b8' : activityCategoryColor(item.key) } as CSSProperties} onClick={() => onSelect(selected === item.key ? '' : item.key)} aria-pressed={selected === item.key}>
      <div><strong>{item.name} <small>{item.platform === 'CHZZK' ? '치지직' : 'SOOP'}</small></strong><span>{metric === 'minutes' ? activityMinutes(item.minutes) : `${item.broadcasts}회`} <small>{total ? `${Math.round(item[metric] / total * 100)}%` : '—'}</small></span></div>
      <div className="ad-track"><span style={{ width: `${item[metric] / maximum * 100}%` }} /></div>
    </button>)}</div>
    {!sorted.length && <p className="ad-empty">선택한 기간의 카테고리 기록이 없습니다.</p>}
    {sorted.length > 8 && <button className="ad-clear-filter" type="button" onClick={() => setAll(!all)}>{all ? '접기' : `카테고리 전체 보기 (${sorted.length}개)`}</button>}
    {selected && <button className="ad-clear-filter" type="button" onClick={() => onSelect('')}>전체 카테고리</button>}
  </ActivityPanel>;
}

// 전체 일별 방송 흐름과 개인의 활동 달력을 같은 기록으로 표시한다.
function ActivityDaily({ data, personal, selection, onSelect }: { data: BroadcastActivity; personal: boolean; selection: ActivitySelection; onSelect: (selection: ActivitySelection) => void }) {
  const days = activityDays(data.meta.from, data.meta.to);
  const values = new Map(data.daily.map((day) => [day.date, day]));
  const maximum = Math.max(1, ...data.daily.map((day) => day.broadcasts));
  const months = [...new Set(days.map((date) => date.slice(0, 7)))];
  return <ActivityPanel title={personal ? '방송 활동' : '방송 활동 추이'} description={personal ? '날짜별 방송 횟수와 방송 시간' : '날짜별 방송 횟수'}>
    {personal ? <div className="ad-calendars">{months.map((month) => <section key={month} aria-label={`${month} 방송 활동`}><h3 className="ad-calendar-month">{Number(month.slice(0, 4))}년 {Number(month.slice(5))}월</h3><div className="ad-calendar">
      {WEEKDAYS.map((day) => <b className="ad-calendar-weekday" key={day}>{day}</b>)}
      {Array.from({ length: new Date(`${days.find((date) => date.startsWith(month))}T00:00:00Z`).getUTCDay() }, (_, index) => <div key={`blank-${index}`} />)}
      {days.filter((date) => date.startsWith(month)).map((date) => { const value = values.get(date); return <button type="button" className={`ad-calendar-day ${value?.broadcasts ? 'has-activity' : ''} ${value ? '' : 'is-missing'}`} key={date}
        aria-pressed={selection.day === date} onClick={() => onSelect({ ...EMPTY_SELECTION, day: date })}
        aria-label={`${date} · ${value ? `${value.broadcasts}회` : '기록 없음'} · 방송 이력 보기`}
        title={`${date} · ${value ? `${value.broadcasts}회 · ${activityMinutes(value.minutes)}` : '기록 없음'}`}>
        <span>{Number(date.slice(8))}</span>
        <strong>{value ? `${value.broadcasts}회` : '—'}</strong><small>{value ? activityMinutes(value.minutes) : '기록 없음'}</small>
      </button>; })}
    </div></section>)}</div> : <div className="ad-daily-scroll"><div className="ad-daily-bars" style={{ minWidth: days.length > 30 ? days.length * 16 : undefined }}>{days.map((date) => {
      const value = values.get(date); return <button type="button" key={date} className={`ad-day-column ${value ? '' : 'is-missing'}`} title={`${date} · ${value ? `방송 ${value.broadcasts}회` : '기록 없음'}`}
        aria-label={`${date} · ${value ? `방송 ${value.broadcasts}회` : '기록 없음'} · 방송 이력 보기`} aria-pressed={selection.day === date} onClick={() => onSelect({ ...EMPTY_SELECTION, day: date })}>
        <div className="ad-day-track"><span style={{ height: `${value ? Math.max(2, value.broadcasts / maximum * 100) : 0}%` }} /></div>
        <span>{days.length <= 14 || date.endsWith('01') || date === days[0] || date === days[days.length - 1] ? `${Number(date.slice(5, 7))}/${Number(date.slice(8))}` : ''}</span>
      </button>;
    })}</div></div>}
  </ActivityPanel>;
}

// 회차를 선택하면 그 방송의 확인된 기록을 목록 안에서 펼친다.
function ActivityBroadcastRow({ row, personal, onOpen }: { row: ActivityBroadcast; personal: boolean; onOpen: (row: ActivityBroadcast) => void }) {
  const [expanded, setExpanded] = useState(false);
  return <><tr>
    <td>{statisticsTime(row.startedAt, true)}</td>
    {!personal && <td><a href={activityStreamerPath(row.channelKey)} className="ad-channel-link" onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(row); }}>{row.channelName || row.channelKey.split(':')[1]}</a><StatisticsBrand platform={row.platform} label={false} /></td>}
    <td className="ad-broadcast-title"><strong>{publicBroadcastTitle(row.title)}</strong><span>{row.categories}</span></td>
    <td>{activityMinutes(row.minutes)}</td><td><button className="bs-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? '닫기' : '상세 기록'}</button></td>
  </tr>{expanded && <tr><td colSpan={personal ? 4 : 5}><dl className="ad-record-detail"><div><dt>최초 기록</dt><dd>{statisticsTime(row.firstObservedAt, true)}</dd></div><div><dt>최근 기록</dt><dd>{statisticsTime(row.lastObservedAt, true)}</dd></div><div><dt>최고 시청자 수</dt><dd>{countFormat(row.peakViewers)}명</dd></div><div><dt>방송 시간</dt><dd>{activityMinutes(row.minutes)}</dd></div></dl></td></tr>}</>;
}

// 기록 조회와 스트리머 상세 진입을 같은 방송 목록에서 제공한다.
function ActivityBroadcasts({ data, filters, selection, personal, onOpen, onClear }: { data: BroadcastActivity; filters: ActivityFilters; selection: ActivitySelection; personal: boolean; onOpen: (streamer: StatisticsStreamer) => void; onClear: () => void }) {
  const { page, loading, error, more, retry } = useActivityBroadcasts(filters, selection, data);
  const selected = selection.day || (selection.weekday !== null ? `${WEEKDAYS[selection.weekday]}요일 ${selection.hour}시 · ${selection.timeMetric === 'starts' ? '방송 시작' : '방송 활동'}` : '');
  const open = (row: ActivityBroadcast) => onOpen({ id: row.channelKey, channelKey: row.channelKey, name: row.channelName, platform: row.platform, imageUrl: null, channelUrl: null, profileSlug: null });
  return <div id="ad-broadcast-history" tabIndex={-1}><ActivityPanel title="방송 이력" description={`${selected ? `${selected} · ` : ''}${page ? `방송 ${countFormat(page.total)}회 · ` : ''}최근 기록순`}
    action={selected && <button className="bs-button" type="button" onClick={onClear}>선택 해제</button>}>
    <div className="ad-table-scroll"><table className="ad-table"><thead><tr><th scope="col">방송 시작</th>{!personal && <th scope="col">스트리머</th>}<th scope="col">방송 제목 · 카테고리</th><th scope="col">방송 시간</th><th scope="col"><span className="bs-sr-only">상세 기록</span></th></tr></thead>
      <tbody>{page?.items.map((row) => <ActivityBroadcastRow key={`${row.platform}:${row.channelKey}:${row.streamId}`} row={row} personal={personal} onOpen={open} />)}</tbody></table></div>
    <div className="ad-broadcast-cards">{page?.items.map((row) => <article className="ad-broadcast-card" key={`${row.platform}:${row.channelKey}:${row.streamId}`}>
      {!personal && <div className="ad-card-channel"><a href={activityStreamerPath(row.channelKey)} className="ad-channel-link" onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); open(row); }}>{row.channelName}</a><StatisticsBrand platform={row.platform} /></div>}
      <h3>{publicBroadcastTitle(row.title)}</h3><p>{row.categories}</p><dl><div><dt>방송 시작</dt><dd>{statisticsTime(row.startedAt, true)}</dd></div><div><dt>방송 시간</dt><dd>{activityMinutes(row.minutes)}</dd></div></dl>
      <details><summary>상세 기록</summary><dl><div><dt>최초 기록</dt><dd>{statisticsTime(row.firstObservedAt, true)}</dd></div><div><dt>최근 기록</dt><dd>{statisticsTime(row.lastObservedAt, true)}</dd></div><div><dt>최고 시청자 수</dt><dd>{countFormat(row.peakViewers)}명</dd></div></dl></details>
    </article>)}</div>
    {loading && <p className="ad-empty" role="status">방송 이력을 불러오는 중…</p>}
    {error && <div className="ad-empty" role="alert"><p>{error}</p><button className="bs-button" type="button" onClick={retry}>다시 시도</button></div>}
    {!loading && !error && !page?.items.length && <p className="ad-empty">선택한 조건의 방송 기록이 없습니다.</p>}
    {page?.nextCursor && !error && <button type="button" className="ad-more" disabled={loading} onClick={more}>방송 이력 더 보기 ({page.items.length}/{countFormat(page.total)})</button>}
  </ActivityPanel></div>;
}

// 검색 결과는 채널 선택에 집중하고 오류 시 재검색할 수 있게 한다.
function ActivitySearchResults({ query, onOpen, onBack }: { query: string; onOpen: (streamer: StatisticsStreamer) => void; onBack: () => void }) {
  const [result, setResult] = useState<StatisticsStreamerSearchResponse | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [platform, setPlatform] = useState<'ALL' | 'CHZZK' | 'SOOP'>(() => {
    const value = new URLSearchParams(window.location.search).get('searchPlatform');
    return value === 'CHZZK' || value === 'SOOP' ? value : 'ALL';
  });
  const items = result?.streamers.filter((streamer) => platform === 'ALL' || streamer.platform === platform) || [];
  useEffect(() => { if (result) restoreActivityScroll(); }, [result]);
  useEffect(() => {
    const controller = new AbortController(); setResult(null); setError('');
    void findActivityStreamers(query, controller.signal, platform).then((value) => { if (!controller.signal.aborted) setResult(value); })
      .catch(() => { if (!controller.signal.aborted) setError('검색 결과를 불러오지 못했습니다. 다시 시도해 주세요.'); });
    return () => controller.abort();
  }, [query, platform, attempt]);
  return <section className="ad-results"><button className="ad-back" type="button" onClick={onBack}><ArrowLeft size={16} /> 전체 통계</button>
    <div className="ad-results-heading"><h2>“{query}” 검색 결과</h2>{result && <span>{items.length}개 채널</span>}</div>
    <div className="ad-platforms" aria-label="검색 플랫폼">{(['ALL', 'CHZZK', 'SOOP'] as const).map((value) => <button className="bs-button" type="button" key={value} aria-pressed={platform === value} onClick={() => {
      setPlatform(value); const url = new URL(window.location.href); if (value === 'ALL') url.searchParams.delete('searchPlatform'); else url.searchParams.set('searchPlatform', value);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
    }}>{value === 'ALL' ? '전체 플랫폼' : <StatisticsBrand platform={value} />}</button>)}</div>
    {error ? <div className="ad-state" role="alert"><p>{error}</p><button className="bs-button" type="button" onClick={() => setAttempt(attempt + 1)}>다시 시도</button></div>
      : !result ? <p className="ad-empty" role="status">검색 중…</p>
      : items.length ? <div className="ad-results-grid">{items.map((streamer) => <ActivityStreamerCard key={streamer.channelKey || streamer.id} streamer={streamer} onOpen={onOpen} />)}</div>
      : <div className="ad-state"><Search size={28} /><h3>검색 결과가 없습니다.</h3><p>스트리머 이름을 확인하거나 다른 검색어를 입력하세요.</p></div>}
    {result?.hasMore && <p className="ad-chart-caption">검색어를 더 입력하면 결과를 좁힐 수 있습니다.</p>}
  </section>;
}

// URL 복사 결과를 사용자에게 알려 실패를 성공으로 표시하지 않는다.
function ActivityShare() {
  const [status, setStatus] = useState('');
  useEffect(() => { if (!status) return; const timer = window.setTimeout(() => setStatus(''), 3000); return () => window.clearTimeout(timer); }, [status]);
  return <div className="ad-share"><button className="bs-button" type="button" onClick={async () => {
    try { await navigator.clipboard.writeText(window.location.href); setStatus('주소를 복사했습니다.'); }
    catch { setStatus('주소를 복사하지 못했습니다.'); }
  }}>{status === '주소를 복사했습니다.' ? <Check size={14} /> : <Copy size={14} />} 주소 복사</button>{status && <span role="status">{status}</span>}</div>;
}

// 전체 통계·검색 결과·스트리머 상세 사이의 사용자 이동을 주소와 함께 관리한다.
export function ActivityDashboard({ currentSubPath, onNavigate }: { currentSubPath?: string; onNavigate?: (path: string) => void }) {
  const [location, setLocation] = useState(readActivityLocation);
  const [selectedStreamer, setSelectedStreamer] = useState<StatisticsStreamer | null>(null);
  const { filters, search, selection } = location;
  const personal = Boolean(filters.channel);
  const searching = Boolean(search) && !personal;
  const { data, loading, error, refresh } = useBroadcastActivity(filters, !searching);
  useEffect(() => { if (data) restoreActivityScroll(); }, [data]);
  useEffect(() => {
    const sync = () => { const value = readActivityLocation(); setLocation(value); };
    sync(); window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [currentSubPath]);
  const navigate = (next: ActivityFilters, query = search, channelName = '', back = '') => {
    const params = new URLSearchParams({ from: next.from, to: next.to });
    if (next.platform !== 'ALL') params.set('platform', next.platform);
    if (next.category) params.set('category', next.category);
    if (query) params.set('search', query);
    // 기간별 조건을 바꿔도 실시간 순위의 플랫폼·카테고리는 유지한다.
    if (!next.channel) {
      const previous = new URLSearchParams(window.location.search);
      ['livePlatform', 'liveCategory'].forEach((key) => { const value = previous.get(key); if (value) params.set(key, value); });
    }
    // 수집 이력이 없는 검색 채널도 공유·새로고침 후 이름을 유지한다.
    if (next.channel) {
      const name = channelName || (next.channel === filters.channel ? new URLSearchParams(window.location.search).get('name') : '');
      if (name) params.set('name', name.slice(0, 80));
      const returnTo = back || (next.channel === filters.channel ? new URLSearchParams(window.location.search).get('back') : '');
      if (returnTo && /^\/(analytics(?:[/?]|$)|creator\/)/.test(returnTo) && returnTo.length <= 2000) params.set('back', returnTo);
    }
    const path = `/analytics${next.channel ? `/streamer/${encodeURIComponent(next.channel)}` : ''}?${params}`;
    setLocation({ filters: next, search: query, selection: EMPTY_SELECTION });
    if (onNavigate) onNavigate(path); else window.history.pushState({}, '', path);
  };
  const openStreamer = (streamer: StatisticsStreamer) => {
    if (!streamer.channelKey) return;
    const back = `${window.location.pathname}${window.location.search}`;
    sessionStorage.setItem(`ad-scroll:${back}`, String(window.scrollY));
    setSelectedStreamer(streamer);
    // 미등록 채널인 경우 온디맨드 자동 등록 트리거 (백그라운드)
    if (!streamer.isRegistered) {
      fetch(`/api/analytics/streamers/resolve?channelKey=${encodeURIComponent(streamer.channelKey)}`, { method: 'POST' })
        .catch((err) => console.warn('[openStreamer] Auto-resolve failed', err));
    }
    navigate({ ...filters, channel: streamer.channelKey, platform: 'ALL', category: '' }, search, streamer.name, back);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const selectHistory = (value: ActivitySelection, scroll = true) => {
    const params = new URLSearchParams(window.location.search);
    ['day', 'weekday', 'hour', 'timeMetric'].forEach((key) => params.delete(key));
    if (value.day) params.set('day', value.day);
    if (value.weekday !== null && value.hour !== null) { params.set('weekday', String(value.weekday)); params.set('hour', String(value.hour)); params.set('timeMetric', value.timeMetric); }
    window.history.pushState(window.history.state, '', `${window.location.pathname}?${params}`);
    setLocation((current) => ({ ...current, selection: value }));
    if (scroll) window.requestAnimationFrame(() => { const target = document.getElementById('ad-broadcast-history'); target?.scrollIntoView({ behavior: 'smooth', block: 'start' }); target?.focus({ preventScroll: true }); });
  };
  const returnTo = new URLSearchParams(window.location.search).get('back') || '';
  const validReturn = /^\/(analytics(?:[/?]|$)|creator\/)/.test(returnTo) && returnTo.length <= 2000;
  const goBack = () => {
    if (!validReturn) { navigate({ ...filters, channel: '', category: '' }); return; }
    sessionStorage.setItem('ad-restore', returnTo);
    if (onNavigate) onNavigate(returnTo); else { window.history.pushState({}, '', returnTo); setLocation(readActivityLocation()); }
  };
  const profile = selectedStreamer?.channelKey === filters.channel ? { ...selectedStreamer, ...data?.streamer } : data?.streamer;
  const nameHint = new URLSearchParams(window.location.search).get('name')?.slice(0, 80);
  const streamer = profile && profile.name === filters.channel.split(':')[1] && nameHint ? { ...profile, name: nameHint } : profile;
  const channelUrl = safeStatisticsUrl(streamer?.channelUrl || null);
  const image = safeStatisticsUrl(streamer?.imageUrl || null);
  // 브라우저 기록과 공유된 주소에서도 조회 대상의 이름을 식별한다.
  useEffect(() => {
    const seo = activitySeo(filters, data, search);
    applyPageSeo({ ...seo, robots: loading || error || activityNoindex(new URL(window.location.href), data) ? 'noindex,follow' : 'index,follow' });
  }, [filters, data, streamer?.name, search, loading, error, selection]);
  return <div className="bs-dashboard ad-dashboard">
    <header className="ad-heading">
      <div>
        <span className="ad-eyebrow">치지직 · SOOP 스트리밍 인텔리전스</span>
        <h1>방송 현황 대시보드</h1>
      </div>
      <ActivityStreamerSearch initialQuery={search} onSearch={(query) => navigate({ ...filters, channel: '', category: '' }, query)} onOpen={openStreamer} />
    </header>
    {personal && (
      <nav className="ad-view-nav" aria-label="통계 화면">
        <button type="button" onClick={() => navigate({ ...filters, channel: '', category: '' }, '')}>
          <BarChart3 size={16} /> 전체 통계로 돌아가기
        </button>
        <span aria-current="page">{streamer?.name || '스트리머'} 방송 통계</span>
      </nav>
    )}
    {searching ? <ActivitySearchResults query={search} onOpen={openStreamer} onBack={() => navigate(filters, '')} /> : <>
      {/* 개인 스트리머 프로필 모드 */}
      {personal && (
        <>
          <section className="ad-profile">
            <button type="button" className="ad-back" onClick={goBack}>
              <ArrowLeft size={16} /> {validReturn && returnTo.startsWith('/creator/') ? '프로필' : search ? '검색 결과' : '전체 통계'}
            </button>
            <div className="ad-profile-content">
              <div className="ad-avatar ad-avatar-large">{image ? <img src={image} alt="" /> : <Users size={25} />}</div>
              <div>
                <h2>{streamer?.name || (loading ? '불러오는 중…' : filters.channel.split(':')[1])} 방송 통계</h2>
                {streamer && <StatisticsBrand platform={streamer.platform} />}
              </div>
              <div className="ad-profile-actions">
                {channelUrl && <a className="bs-button" href={channelUrl} target="_blank" rel="noopener noreferrer">채널 바로가기 <ArrowUpRight size={14} /></a>}
                {streamer?.profileSlug && <a className="bs-button" href={`/creator/${encodeURIComponent(streamer.profileSlug)}`}>VDébut 프로필</a>}
                <ActivityShare />
              </div>
            </div>
          </section>

          {loading ? (
            <div className="ad-state ad-loading" role="status"><RefreshCw size={24} className="bs-spinning" /><h2>방송 통계를 불러오는 중입니다.</h2></div>
          ) : error ? (
            <div className="ad-state" role="alert"><h2>통계를 불러오지 못했습니다.</h2><p>{error}</p><button className="bs-button bs-primary" type="button" onClick={refresh}>다시 시도</button></div>
          ) : data && (
            <>
              <ActivityNarrativeReport streamer={streamer} data={data} />
              <ActivitySummary data={data} personal={personal} />
              <div className="ad-main-grid">
                <ActivityHeatmap key={filters.channel} data={data} personal={personal} selection={selection} onSelect={selectHistory} />
                <ActivityCategories data={data} selected={filters.category} onSelect={(category) => navigate({ ...filters, category })} />
              </div>
              <ActivityDaily data={data} personal={personal} selection={selection} onSelect={selectHistory} />
              <ActivityBroadcasts data={data} filters={filters} selection={selection} personal={personal} onOpen={openStreamer} onClear={() => selectHistory(EMPTY_SELECTION, false)} />
            </>
          )}
        </>
      )}

      {/* 모드 A: 실시간 플랫폼 & 랭킹 현황판 (소프트콘 뷰어십 완벽 벤치마크) */}
      {!personal && <ActivityLiveRankings onOpen={openStreamer} />}
    </>}
    <footer className="ad-footer">VDébut · 실시간 스트리밍 인텔리전스</footer>
  </div>;
}
