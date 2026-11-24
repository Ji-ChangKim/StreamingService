// 버튜버 상세 '소개' 탭의 데이터 섹션(기획문서 39·40번, 시안 ⑤).
// ① 데뷔 이야기 ② 방송 기록 요약 ③ 데뷔 후 성장 ④ 방송 시간표 ⑤ 콘텐츠별 반응, 그리고 오른쪽 ⑥ 공식 링크.
// 자료는 채널 통계 API(/api/analytics/board/channel)를 그대로 쓰고, 조건이 모자라면 섹션을 통째로 숨긴다(빈 상자 없음).
import { useEffect, useState, type CSSProperties } from 'react';
import type { AnalyticsChannelBoard } from '../../../shared/analyticsBoard';
import type { PortalProfile } from '../../../shared/portal';
import { PORTAL_PLATFORMS, portalWebUrl } from '../../../shared/portal';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { contentTags, profileAgencyName, topicName } from '../../../shared/profilePresentation';
export { contentTags };
import { t, getPortalLanguage } from './portalLocale';
import './profileInsights.css';

const DAY = 86_400_000;
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const SCALE = ['#F8FAFC', '#EFF4FE', '#DBE7FB', '#93C5FD', '#3B82F6', '#1D4ED8'];
const num = (value: number) => Math.round(value).toLocaleString(getPortalLanguage());

export function profileChannelKey(profile: PortalProfile): string | null {
  return profile.platform === 'CHZZK' || profile.platform === 'SOOP' ? activityChannelKey(profile.platform, profile.channelUrl) : null;
}

// 채널 통계 API를 기간별로 한 번씩만 받는다(같은 탭에서 여러 섹션이 나눠 씀).
const cache = new Map<string, Promise<AnalyticsChannelBoard | null>>();
function loadBoard(key: string, days: 7 | 30 | 90): Promise<AnalyticsChannelBoard | null> {
  const url = `/api/analytics/board/channel?key=${encodeURIComponent(key)}&days=${days}`;
  if (!cache.has(url)) cache.set(url, fetch(url).then((response) => (response.ok ? response.json() as Promise<AnalyticsChannelBoard> : null)).catch(() => null));
  return cache.get(url)!;
}
export function useChannelBoard(key: string | null, days: 7 | 30 | 90) {
  const [data, setData] = useState<AnalyticsChannelBoard | null>(null);
  useEffect(() => {
    let alive = true; setData(null);
    if (key) void loadBoard(key, days).then((value) => { if (alive) setData(value); });
    return () => { alive = false; };
  }, [key, days]);
  return data;
}

export function debutTime(profile: PortalProfile): number | null {
  const at = profile.dateState === 'FIXED' ? Date.parse(profile.startAtUtc) : profile.dateState === 'TIME_TBD' ? Date.parse(`${profile.debutDate}T00:00:00+09:00`) : NaN;
  return Number.isFinite(at) ? at : null;
}
const platformLabel = (id: string) => t(PORTAL_PLATFORMS.find((item) => item.id === id)?.label || id);
// 섹션 머리 라벨: 작은 라벨(종류) + 회색 기간.
function Label({ name, note }: { name: string; note?: string }) { return <span className="vd-ins-eyebrow"><b>{name}</b>{note}</span>; }

// 데뷔 공지 버튼 문구: 링크 주소로 어디로 가는지 알려 준다.
export function noticeLabel(profile: PortalProfile, url: string): string {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return t('데뷔 공지 보기'); }
  if (host === 'x.com' || host === 'twitter.com') return t('X에서 데뷔 공지 보기');
  if (host.endsWith('chzzk.naver.com')) return t('치지직에서 데뷔 공지 보기');
  if (host.endsWith('sooplive.co.kr') || host.endsWith('sooplive.com') || host.endsWith('afreecatv.com')) return t('SOOP에서 데뷔 공지 보기');
  if (host.endsWith('youtube.com') || host === 'youtu.be') return t('YouTube에서 데뷔 공지 보기');
  if (host === 'cafe.naver.com') return t('공식 팬카페에서 데뷔 공지 보기');
  let site = '';
  try { site = profile.websiteUrl ? new URL(profile.websiteUrl).hostname.replace(/^www\./, '') : ''; } catch { site = ''; }
  const agency = profileAgencyName(profile.agency);
  if (site && site === host) return agency ? t('{0} 공식 홈페이지에서 데뷔 공지 보기', [agency]) : t('공식 홈페이지에서 데뷔 공지 보기');
  return t('데뷔 공지 보기');
}

// ① 데뷔 이야기: 등록 정보로 만든 문단 하나(제목·중복 칸 없음) + 데뷔 공지 버튼(링크가 있을 때만).
export function DebutStory({ profile, now }: { profile: PortalProfile; now: number }) {
  const at = debutTime(profile);
  if (at === null) return null;
  const full = new Intl.DateTimeFormat(getPortalLanguage(), { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', ...(profile.dateState === 'FIXED' ? { hour: 'numeric', minute: '2-digit' } : {}) }).format(new Date(at));
  const platform = platformLabel(profile.platform);
  const past = at <= now;
  const agency = profileAgencyName(profile.agency);
  const tags = contentTags(profile).slice(0, 3);
  const name = topicName(profile.displayName, getPortalLanguage());
  const sentences = [
    agency ? t('{0} {1} 소속 {2} 버튜버예요.', [name, agency, platform]) : t('{0} {1} 버튜버예요.', [name, platform]),
    past ? t('{0}(한국 시간)에 첫 방송을 했어요.', [full]) : t('첫 방송은 {0}(한국 시간)이에요.', [full]),
    tags.length ? t(past ? '{0} 방송을 주로 해요.' : '{0} 방송을 할 예정이에요.', [tags.join('·')]) : '',
    profile.languages?.length ? t('{0}로 방송해요.', [profile.languages.join('·')]) : '',
  ].filter(Boolean);
  const notice = portalWebUrl(profile.noticeUrl || '');
  return <section className="vd-story" aria-label={t('데뷔 이야기')}>
    <p>{sentences.join(' ')}</p>
    {notice && <a className="vd-src" href={notice} target="_blank" rel="noopener noreferrer">{noticeLabel(profile, notice)}<i aria-hidden="true">↗</i></a>}
  </section>;
}

// 가장 자주 방송한 요일 2개와 3시간 구간.
export function habitOf(heat: number[][]): { days: string; start: number } | null {
  const byHour = Array.from({ length: 24 }, (_, h) => heat.reduce((s, row) => s + (row[h] || 0), 0));
  if (!byHour.some((v) => v > 0)) return null;
  const start = byHour.reduce((best, _, h) => (byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24] > byHour[best] + byHour[(best + 1) % 24] + byHour[(best + 2) % 24] ? h : best), 0);
  const days = heat.map((row, d) => ({ d, v: row.reduce((s, v) => s + v, 0) })).sort((a, b) => b.v - a.v).slice(0, 2).filter((x) => x.v > 0).map((x) => t(DAYS[x.d])).join('·');
  return { days, start };
}

// ②~⑤: 채널 통계로 만드는 섹션들. 기록이 없거나 조건이 모자라면 아무것도 그리지 않는다.
export function ProfileInsights({ profile, openRecord, now }: { profile: PortalProfile; openRecord: () => void; now: number }) {
  const key = profileChannelKey(profile);
  const [days, setDays] = useState<7 | 30>(7);
  const short = useChannelBoard(key, days);
  const month = useChannelBoard(key, 30);
  const long = useChannelBoard(key, 90);
  if (!key) return null;
  return <>
    {short && short.kpis.broadcasts > 0 && <Summary data={short} days={days} setDays={setDays} openRecord={openRecord} />}
    {long && <Growth data={long} profile={profile} />}
    {month && <Pattern data={month} profile={profile} now={now} />}
    {month && <Reaction data={month} />}
  </>;
}

// ② 방송 요약: 숫자 4개는 위쪽에 있으므로 여기서는 무엇을·언제 했는지만.
function Summary({ data, days, setDays, openRecord }: { data: AnalyticsChannelBoard; days: 7 | 30; setDays: (d: 7 | 30) => void; openRecord: () => void }) {
  const k = data.kpis;
  const top = data.games.slice(0, 3);
  const totalWeek = data.heat.map((row) => row.reduce((s, v) => s + v, 0));
  const maxWeek = Math.max(1, ...totalWeek);
  const [a, b] = top;
  const heading = a && b && a.share >= 30 && b.share >= 30 && Math.abs(a.share - b.share) <= 10
    ? t('최근 {0}일은 {1}와 {2} 방송을 반반씩 했어요', [days, a.name, b.name])
    : a && a.share >= 50 ? t('최근 {0}일은 주로 {1} 방송을 했어요', [days, a.name])
    : t('최근 {0}일 동안 {1}번 방송했어요', [days, num(k.broadcasts)]);
  return <section className="content-panel vd-ins" aria-labelledby="ins-rec">
    <div className="vd-ins-seg" role="group" aria-label={t('기간')}>{([7, 30] as const).map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{t('{0}일', [d])}</button>)}</div>
    <Label name="BROADCAST" note={t('최근 {0}일', [days])} />
    <h2 id="ins-rec">{heading}</h2>
    <div className="vd-ins-two">
      {top.length > 0 && <div><p className="vd-ins-sub">{t('주로 한 콘텐츠')}</p>{top.map((g, i) => <div className="vd-ins-bar" key={g.name}><span>{g.isGame ? <a className="vd-ins-game" href={`/analytics/game/${encodeURIComponent(g.name)}`}>{g.name}</a> : g.name}</span><i className={`l${i + 1}`} style={{ width: `${Math.max(4, g.share / Math.max(1, top[0].share) * 100)}%` }} /><em>{g.share}%</em></div>)}</div>}
      <div><p className="vd-ins-sub">{t('요일별 방송 시간')}</p><div className="vd-ins-week">{totalWeek.map((v, d) => <div key={d}><i className={v >= maxWeek * 0.75 && v > 0 ? 'hi' : ''} style={{ height: `${Math.max(2, v / maxWeek * 80)}px` }} />{t(DAYS[d])}</div>)}</div></div>
    </div>
    <div className="vd-ins-foot"><span>{t('{0}번 방송 · {1}시간 · 공개 방송 기록 기준', [num(k.broadcasts), num(k.minutes / 60)])}</span><button type="button" onClick={openRecord}>{t('방송 기록 자세히 보기')} →</button></div>
  </section>;
}

// ③ 데뷔 후 성장: 데뷔일부터 주차별 평균 시청자. 데뷔 주는 첫 방송 효과로 몰리는 때라 기준에서 빼고,
// 둘째 주(없으면 그다음 기록된 주)를 기준으로 최근 주와 비교한다. 데뷔 주 뒤로 두 주 이상 기록이 있을 때만 보인다.
// 9단계(위아래로 크게 움직인 경우까지):
// +100%↑ ○배로 / +50%↑ ○%나 / +20%↑ 크게 / +10%↑ 늘었어요 / +5%↑ 조금 / ±5% 비슷해요
// −5~−10% 거의 비슷 / −10~−50% ○% 적어요 / −50%↓ 둘째 주의 ○% 수준 — 줄어든 쪽은 숫자만 담담하게(빨간색·'줄었어요' 없음).
export function growthTone(change: number): 'up5' | 'up4' | 'up3' | 'up2' | 'up1' | 'flat' | 'down1' | 'down2' | 'down3' {
  if (change >= 100) return 'up5';
  if (change >= 50) return 'up4';
  if (change >= 20) return 'up3';
  if (change >= 10) return 'up2';
  if (change >= 5) return 'up1';
  if (change > -5) return 'flat';
  if (change > -10) return 'down1';
  if (change > -50) return 'down2';
  return 'down3';
}
function growthHeading(change: number, last: number, base: number): string {
  switch (growthTone(change)) {
    case 'up5': return t('데뷔 둘째 주보다 시청자가 {0}배로 늘었어요', [String(Math.floor(last / base * 10) / 10)]);
    case 'up4': return t('데뷔 둘째 주보다 시청자가 {0}%나 늘었어요', [change]);
    case 'up3': return t('데뷔 둘째 주보다 시청자가 {0}% 크게 늘었어요', [change]);
    case 'up2': return t('데뷔 둘째 주보다 시청자가 {0}% 늘었어요', [change]);
    case 'up1': return t('데뷔 둘째 주보다 시청자가 조금 늘었어요 ({0}%)', [change]);
    case 'flat': return t('데뷔 후 시청자가 꾸준히 비슷해요');
    case 'down1': return t('최근 주 평균 시청자는 {0}명, 둘째 주와 거의 비슷해요', [num(last)]);
    case 'down2': return t('최근 주 평균 시청자는 {0}명이에요 · 둘째 주보다 {1}% 적어요', [num(last), Math.abs(change)]);
    default: return t('최근 주 평균 시청자는 {0}명이에요 · 둘째 주의 {1}% 수준이에요', [num(last), Math.round(last / base * 100)]);
  }
}
function Growth({ data, profile }: { data: AnalyticsChannelBoard; profile: PortalProfile }) {
  const at = debutTime(profile);
  if (at === null) return null;
  const debutDay = new Date(at + 9 * 3600000).toISOString().slice(0, 10);
  const weeks: number[][] = [];
  for (const point of data.trend) {
    if (point.avg === null || point.date < debutDay) continue;
    const index = Math.floor((Date.parse(`${point.date}T00:00:00Z`) - Date.parse(`${debutDay}T00:00:00Z`)) / (7 * DAY));
    (weeks[index] = weeks[index] || []).push(point.avg);
  }
  const series = weeks.map((list) => (list && list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null));
  const known = series.map((v, i) => ({ v, i })).filter((x): x is { v: number; i: number } => x.v !== null);
  const debutWeek = known.find((p) => p.i === 0) || null;
  const after = known.filter((p) => p.i >= 1);
  if (after.length < 2 || after[0].v < 10) return null;
  const base = after[0], last = after[after.length - 1];
  const change = Math.round((last.v - base.v) / base.v * 100);
  const tone = growthTone(change);
  const max = Math.max(...known.map((x) => x.v)) * 1.15;
  const w = 640, h = 130, x = (i: number) => 34 + (i / Math.max(1, series.length - 1)) * (w - 68), y = (v: number) => h - 14 - (v / max) * (h - 34);
  const line = after.map((p) => `${x(p.i)},${y(p.v)}`).join(' ');
  const weekLabel = (i: number) => (i === 0 ? t('데뷔 주') : `${i + 1}${t('주')}`);
  return <section className="content-panel vd-ins" aria-labelledby="ins-grow">
    <Label name="GROWTH" note={t('데뷔 후 {0}주', [series.length])} />
    <h2 id="ins-grow">{growthHeading(change, last.v, base.v)}</h2>
    <div className="vd-ins-gstats">
      {debutWeek && <div>{t('데뷔 주')}<b>{t('{0}명', [num(debutWeek.v)])}</b></div>}
      <div>{base.i === 1 ? t('둘째 주') : t('{0}주', [base.i + 1])}<b>{t('{0}명', [num(base.v)])}</b></div>
      <div>{t('최근 주')}<b>{t('{0}명', [num(last.v)])}{(tone.startsWith('up') || tone === 'down2') && <em className={`vd-ins-delta ${tone}`}>{tone === 'up5' ? `×${Math.floor(last.v / base.v * 10) / 10}` : `${change > 0 ? '+' : ''}${change}%`}</em>}</b></div>
    </div>
    <svg viewBox={`0 0 ${w} ${h + 16}`} className="vd-ins-chart" role="img" aria-label={t('주차별 평균 시청자: {0}', [known.map((p) => `${weekLabel(p.i)} ${p.v}`).join(', ')])}>
      {debutWeek && <line x1={x(0)} y1={y(debutWeek.v)} x2={x(base.i)} y2={y(base.v)} stroke="#BFD3F8" strokeWidth="2" strokeDasharray="5 5" />}
      <polyline points={line} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinejoin="round" />
      {debutWeek && <circle cx={x(0)} cy={y(debutWeek.v)} r={4} fill="#fff" stroke="#93C5FD" strokeWidth="2" />}
      {after.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={p === last ? 5 : 4} fill="#2563EB" />)}
      {known.map((p) => <text key={`l${p.i}`} x={x(p.i)} y={h + 12} textAnchor="middle" fontSize="13" fill="#94A3B8">{weekLabel(p.i)}</text>)}
    </svg>
    <p className="vd-ins-note">{t('데뷔 주는 첫 방송을 보러 온 시청자가 몰리는 때라 비교 기준에서 빼고, 둘째 주부터 비교해요.')}</p>
  </section>;
}

// ④ 방송 패턴(최근 4주): 평일·주말 비교, 4주 방송 달력(쉬는 요일), 쉬는 날 숫자, 시간대별 방송.
const kstDate = (ms: number) => new Date(ms + 9 * 3600000).toISOString().slice(0, 10);
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const weekdayOf = (date: string) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7; // 월=0
const hoursLabel = (minutes: number) => `${Math.max(0.5, Math.round(minutes / 30) / 2)}h`;
const level = (minutes: number) => (minutes < 105 ? 'l1' : minutes < 165 ? 'l2' : minutes < 225 ? 'l3' : 'l4');
const perWeek = (value: number) => String(Math.round(value * 10) / 10);
function duration(minutes: number): string {
  const m = Math.round(minutes);
  return m >= 60 ? (m % 60 ? t('{0}시간 {1}분', [Math.floor(m / 60), m % 60]) : t('{0}시간', [m / 60])) : t('{0}분', [m]);
}
export function broadcastPattern(data: AnalyticsChannelBoard, debutDay: string | null, now: number) {
  const today = kstDate(now);
  const monday = addDays(today, -weekdayOf(today));
  const first = addDays(monday, -21);
  const minutesBy = new Map<string, number>();
  const streams: Array<{ date: string; minutes: number; avg: number | null }> = [];
  for (const entry of data.log) {
    const date = kstDate(Date.parse(entry.date));
    if (date < first || date > today) continue;
    minutesBy.set(date, (minutesBy.get(date) || 0) + entry.minutes);
    streams.push({ date, minutes: entry.minutes, avg: entry.avg });
  }
  type Cell = { date: string; state: 'on' | 'rest' | 'blank'; minutes: number };
  const rows: Cell[][] = [];
  for (let w = 0; w < 4; w += 1) {
    rows.push(Array.from({ length: 7 }, (_, d) => {
      const date = addDays(first, w * 7 + d);
      const minutes = minutesBy.get(date) || 0;
      if (minutes >= 10) return { date, state: 'on' as const, minutes };
      if (date >= today || (debutDay && date < debutDay)) return { date, state: 'blank' as const, minutes: 0 };
      return { date, state: 'rest' as const, minutes: 0 };
    }));
  }
  const cells = rows.flat().filter((cell) => cell.state !== 'blank');
  const onDays = cells.filter((cell) => cell.state === 'on');
  if (onDays.length < 5) return null;
  const group = (weekend: boolean) => {
    const list = cells.filter((cell) => (weekdayOf(cell.date) >= 5) === weekend);
    const on = list.filter((cell) => cell.state === 'on').length;
    const items = streams.filter((s) => (weekdayOf(s.date) >= 5) === weekend);
    const views = items.map((s) => s.avg).filter((v): v is number => v !== null);
    return { perWeek: list.length ? on / (list.length / (weekend ? 2 : 5)) : 0, count: items.length,
      length: items.length ? items.reduce((sum, s) => sum + s.minutes, 0) / items.length : 0,
      viewers: views.length ? views.reduce((a, b) => a + b, 0) / views.length : null };
  };
  const weekday = group(false), weekend = group(true);
  const columns = Array.from({ length: 7 }, (_, d) => {
    const list = rows.map((row) => row[d]).filter((cell) => cell.state !== 'blank');
    const on = list.filter((cell) => cell.state === 'on').length;
    return { weeks: list.length, on, tag: list.length >= 3 && on === 0 ? 'off' as const : list.length >= 3 && on === 1 ? 'often' as const : null };
  });
  // 가장 길게 쉰 기간과 마지막으로 쉰 날(오늘 제외).
  let run = 0, best = 0, bestEnd = '', lastRest = '';
  for (const cell of rows.flat()) {
    if (cell.state === 'rest') { run += 1; lastRest = cell.date; if (run > best) { best = run; bestEnd = cell.date; } } else run = 0;
  }
  return { rows, weekday, weekend, columns, restPerWeek: (cells.length - onDays.length) / cells.length * 7, longest: best, longestFrom: best ? addDays(bestEnd, -(best - 1)) : '', longestTo: bestEnd, lastRest };
}
function Pattern({ data, profile, now }: { data: AnalyticsChannelBoard; profile: PortalProfile; now: number }) {
  const at = debutTime(profile);
  const p = broadcastPattern(data, at === null ? null : kstDate(at), now);
  if (!p) return null;
  const restDays = p.columns.map((c, d) => (c.tag === 'off' ? t(DAYS[d]) : '')).filter(Boolean);
  const heading = t('평일엔 주 {0}일, 주말엔 주 {1}일 방송해요', [perWeek(p.weekday.perWeek), perWeek(p.weekend.perWeek)]) + (restDays.length ? ` · ${t('{0}요일은 보통 쉬어요', [restDays.join('·')])}` : '');
  const compare = (() => {
    if (p.weekday.count < 2 || p.weekend.count < 2) return '';
    const diff = p.weekend.length - p.weekday.length;
    const ratio = p.weekday.viewers && p.weekend.viewers ? p.weekend.viewers / p.weekday.viewers : 1;
    const longer = Math.abs(diff) >= 30 ? (diff > 0 ? 'we' : 'wd') : null;
    const more = ratio >= 1.2 ? 'we' : ratio <= 1 / 1.2 ? 'wd' : null;
    const r = (more === 'we' ? ratio : 1 / ratio).toFixed(1);
    const [L, S] = longer === 'we' ? [t('주말'), t('평일')] : [t('평일'), t('주말')];
    if (longer && more === longer) return t('{0} 방송이 {1}보다 {2} 더 길고, 시청자도 {3}배 많아요.', [L, S, duration(Math.abs(diff)), r]);
    if (longer && more) return t('{0} 방송이 {1}보다 {2} 더 길어요. 시청자는 {3}에 {4}배 많아요.', [L, S, duration(Math.abs(diff)), more === 'we' ? t('주말') : t('평일'), r]);
    if (longer) return t('{0} 방송이 {1}보다 {2} 더 길어요.', [L, S, duration(Math.abs(diff))]);
    if (more) return t('시청자는 {0}에 {1}배 많아요.', [more === 'we' ? t('주말') : t('평일'), r]);
    return t('평일과 주말의 방송 길이와 시청자가 비슷해요.');
  })();
  const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  const longDate = (date: string) => new Intl.DateTimeFormat(getPortalLanguage(), { timeZone: 'UTC', month: 'long', day: 'numeric' }).format(new Date(`${date}T00:00:00Z`));
  const card = (label: string, g: typeof p.weekday, size: number, weekend: boolean) => <div className={`vd-pat-card ${weekend ? 'we' : ''}`}>
    <div className="hd">{label}<span>{t('주 평균')}</span></div>
    <b className="big">{perWeek(g.perWeek)}<small>{t('일 방송 / {0}일', [size])}</small></b>
    <div className="dots">{Array.from({ length: size }, (_, i) => <i key={i} style={{ '--fill': `${Math.max(0, Math.min(1, g.perWeek - i)) * 100}%` } as CSSProperties} />)}</div>
    <dl><div><dt>{t('평균 방송 길이')}</dt><dd>{g.count ? duration(g.length) : '—'}</dd></div><div><dt>{t('평균 시청자')}</dt><dd>{g.viewers === null ? '—' : t('{0}명', [num(g.viewers)])}</dd></div></dl>
  </div>;
  const filled = data.heat.flat().filter((v) => v > 0).sort((a, b) => a - b);
  const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => filled[Math.min(filled.length - 1, Math.floor(filled.length * q))] ?? 0);
  const step = (v: number) => (v > 0 ? 1 + cuts.filter((cut) => v > cut).length : 0);
  return <section className="content-panel vd-ins" aria-labelledby="ins-time">
    <Label name="SCHEDULE" note={t('최근 4주')} />
    <h2 id="ins-time">{heading}</h2>
    <div className="vd-pat-wk">{card(t('평일 (월~금)'), p.weekday, 5, false)}{card(t('주말 (토·일)'), p.weekend, 2, true)}</div>
    {compare && <p className="vd-pat-cmp">{compare}</p>}
    <p className="vd-ins-sub">{t('최근 4주 방송 달력')} <span className="vd-ins-subnote">· {t('진할수록 오래 방송했어요')}</span></p>
    <div className="vd-cal" role="table" aria-label={t('최근 4주 날짜별 방송 시간')}>
      <span />{DAYS.map((d, i) => <span key={d} className={`dh ${p.columns[i].tag ? 'dim' : ''}`}>{t(d)}</span>)}
      {p.rows.flatMap((row) => [<span key={`w${row[0].date}`} className="wl">{shortDate(row[0].date)}~</span>, ...row.map((cell) => <span key={cell.date} className={`c ${cell.state === 'on' ? level(cell.minutes) : cell.state === 'rest' ? 'x' : 'b'}`} title={`${longDate(cell.date)} · ${cell.state === 'on' ? duration(cell.minutes) : cell.state === 'rest' ? t('쉰 날') : ''}`}>{cell.state === 'on' ? hoursLabel(cell.minutes) : ''}</span>)])}
      <span />{p.columns.map((c, i) => <span key={`t${i}`} className="tagc">{c.tag && <span className={`tag ${c.tag}`}><i className="lg">{t(c.tag === 'off' ? '쉬는 날' : '자주 쉼')}</i><i className="sm">{t(c.tag === 'off' ? '쉼' : '자주')}</i></span>}</span>)}
    </div>
    <div className="vd-scale"><i className="l1" />1h<i className="l2" />2h<i className="l3" />3h<i className="l4" />{t('4h 이상')}<span className="sep" /><i className="x" />{t('쉰 날')}</div>
    <div className="vd-rest">
      <div>{t('한 주에 쉬는 날')}<b>{t('{0}일', [perWeek(p.restPerWeek)])}<small>{t('주 7일 중')}</small></b></div>
      {p.longest > 0 && <div>{t('가장 길게 쉰 기간')}<b>{t('{0}일', [p.longest])}<small>{p.longest > 1 ? `${longDate(p.longestFrom)}~${Number(p.longestTo.slice(8, 10))}${t('일')}` : longDate(p.longestTo)}</small></b></div>}
      {p.lastRest && <div>{t('마지막으로 쉰 날')}<b>{longDate(p.lastRest)}<small>{t(DAYS[weekdayOf(p.lastRest)] + '요일')}</small></b></div>}
    </div>
    <p className="vd-ins-sub">{t('시간대별 방송')}</p>
    <div className="vd-ins-heat" role="img" aria-label={t('요일별 시간대 방송 빈도')}>
      <span />{Array.from({ length: 24 }, (_, h) => <span className="h" key={h}>{h % 3 === 0 ? h : ''}</span>)}
      {data.heat.flatMap((row, d) => [<span className="d" key={`d${d}`}>{t(DAYS[d])}</span>, ...row.map((v, h) => <i key={`${d}-${h}`} style={{ background: SCALE[step(v)] }} />)])}
    </div>
  </section>;
}

// ⑤ 콘텐츠별 반응: 콘텐츠별 방송 3시간 이상만 비교. 채널 평균 대비 배수.
function Reaction({ data }: { data: AnalyticsChannelBoard }) {
  const base = data.kpis.avg;
  const rows = data.games.map((g) => ({ ...g, minutes: Math.round(g.share / 100 * data.kpis.minutes) })).filter((g) => g.minutes >= 180 && g.avg !== null);
  if (!base || rows.length < 2) return null;
  const withRatio = rows.map((g) => ({ ...g, ratio: (g.avg as number) / base }));
  const top = withRatio[0];
  const best = [...withRatio].sort((a, b) => b.ratio - a.ratio)[0];
  const heading = best.name !== top.name && best.ratio >= 1.2
    ? t('방송의 {0}%는 {1}지만, {2} 방송 때 {3}배 더 많이 봐요', [top.share, top.name, best.name, best.ratio.toFixed(1)])
    : best.ratio >= 1.2 ? t('{0} 방송 때 평소보다 {1}배 더 많이 봐요', [best.name, best.ratio.toFixed(1)])
    : t('주로 {0} 방송을 해요', [top.name]);
  return <section className="content-panel vd-ins" aria-labelledby="ins-react">
    <Label name="CONTENT" note={t('최근 30일')} />
    <h2 id="ins-react">{heading}</h2>
    <div className="vd-ins-react">
      <div className="hd"><span>{t('콘텐츠')}</span><span>{t('방송 시간 비중')}</span><span>{t('평균 시청자')}</span><span>{t('평소 대비')}</span></div>
      {withRatio.map((g) => <div className="row" key={g.name}><b>{g.name}</b><span className="bar"><i style={{ width: `${Math.max(4, g.share / Math.max(1, top.share) * 100)}%` }} /><em>{g.share}% · {t('{0}시간', [Math.round(g.minutes / 60)])}</em></span><b>{t('{0}명', [num(g.avg as number)])}</b><span className={g.ratio >= 1.2 ? 'chip up' : 'chip'}>{g.ratio >= 1.2 ? `▲ ${g.ratio.toFixed(1)}${t('배')}` : g.ratio <= 0.8 ? `▼ ${g.ratio.toFixed(1)}${t('배')}` : t('비슷')}</span></div>)}
    </div>
    <p className="vd-ins-note">{t('평소 = 이 채널의 최근 30일 평균 시청자({0}명)', [num(base)])}</p>
  </section>;
}

// ⑥ 공식 링크: 버튼 하나씩(로고 + 이름 + 설명 + ↗). 등록된 링크만. 첫 채널 버튼만 강조.
const LINK_ICON: Record<string, string> = { CHZZK: '/icons/chzzk_icon.png', SOOP: '/icons/soop/soop_symbol_blue.svg', YOUTUBE: '/icons/youtube_icon.png', TWITCH: '/icons/twitch_icon.svg' };
export function OfficialLinks({ profile, className = '', upcoming = false }: { profile: PortalProfile; className?: string; upcoming?: boolean }) {
  const links = [
    { label: platformLabel(profile.platform), url: portalWebUrl(profile.channelUrl), note: t(upcoming ? '채널 미리 보기' : '방송 보러 가기'), icon: LINK_ICON[profile.platform] },
    ...(profile.additionalChannels || []).map((c) => ({ label: platformLabel(c.platform), url: portalWebUrl(c.channelUrl), note: t('채널 바로가기'), icon: LINK_ICON[c.platform] })),
    { label: t('공식 팬카페'), url: portalWebUrl(profile.cafeUrl || ''), note: t('공지·일정'), icon: '' },
    { label: 'X', url: portalWebUrl(profile.xUrl || ''), note: t('소식'), icon: '' },
    { label: t('공식 홈페이지'), url: portalWebUrl(profile.websiteUrl || ''), note: t('바로가기'), icon: '' },
  ].filter((link) => link.url);
  const seen = new Set<string>();
  const unique = links.filter((link) => (seen.has(link.url) ? false : (seen.add(link.url), true)));
  if (!unique.length) return null;
  return <section className={`spec-panel vd-ins-links ${className}`}><h2 className="vd-links-h">{t('공식 링크')}</h2>
    <div className="vd-links">{unique.map((link, i) => <a key={link.url} className={i === 0 ? 'pri' : ''} href={link.url} target="_blank" rel="noopener noreferrer">
      {link.icon ? <img className="lk" src={link.icon} alt="" /> : <span className="lk txt" aria-hidden="true">{link.label === 'X' ? '𝕏' : link.label.slice(0, 1)}</span>}
      <span className="t"><b>{link.label}</b><small>{link.note}</small></span><span className="go" aria-hidden="true">↗</span>
    </a>)}</div>
  </section>;
}
