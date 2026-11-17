// 버튜버 상세 '소개' 탭의 데이터 섹션(기획문서 39·40번, 시안 ⑤).
// ① 데뷔 이야기 ② 방송 기록 요약 ③ 데뷔 후 성장 ④ 방송 시간표 ⑤ 콘텐츠별 반응, 그리고 오른쪽 ⑥ 공식 링크.
// 자료는 채널 통계 API(/api/analytics/board/channel)를 그대로 쓰고, 조건이 모자라면 섹션을 통째로 숨긴다(빈 상자 없음).
import { useEffect, useState } from 'react';
import type { AnalyticsChannelBoard } from '../../../shared/analyticsBoard';
import type { PortalProfile } from '../../../shared/portal';
import { PORTAL_PLATFORMS, portalWebUrl } from '../../../shared/portal';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { profileAgencyName, topicName } from '../../../shared/profilePresentation';
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

function debutTime(profile: PortalProfile): number | null {
  const at = profile.dateState === 'FIXED' ? Date.parse(profile.startAtUtc) : profile.dateState === 'TIME_TBD' ? Date.parse(`${profile.debutDate}T00:00:00+09:00`) : NaN;
  return Number.isFinite(at) ? at : null;
}
const platformLabel = (id: string) => t(PORTAL_PLATFORMS.find((item) => item.id === id)?.label || id);

// ① 데뷔 이야기: 등록 정보로 문장을 만든다. 없는 값은 문장에서 뺀다.
export function DebutStory({ profile, now }: { profile: PortalProfile; now: number }) {
  const at = debutTime(profile);
  if (at === null) return null;
  const date = new Intl.DateTimeFormat(getPortalLanguage(), { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(new Date(at));
  const full = new Intl.DateTimeFormat(getPortalLanguage(), { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', ...(profile.dateState === 'FIXED' ? { hour: 'numeric', minute: '2-digit' } : {}) }).format(new Date(at));
  const platform = platformLabel(profile.platform);
  const past = at <= now;
  const day = Math.floor((now - at) / DAY) + 1;
  const agency = profileAgencyName(profile.agency);
  const tags = (profile.tags || []).slice(0, 3);
  const heading = past ? t('{0} {1}에서 데뷔했어요 · 오늘로 {2}일째예요', [date, platform, day]) : t('{0} {1}에서 데뷔할 예정이에요', [date, platform]);
  const sentences = [
    tags.length ? t('{0} {1} 방송을 주로 하는 {2} 버튜버예요.', [topicName(profile.displayName, getPortalLanguage()), tags.join('·'), platform]) : t('{0} {1} 버튜버예요.', [topicName(profile.displayName, getPortalLanguage()), platform]),
    past ? t('{0}(한국 시간)에 첫 방송을 했어요.', [full]) : t('첫 방송은 {0}(한국 시간)이에요.', [full]),
    profile.languages?.length ? t('{0}로 방송해요.', [profile.languages.join('·')]) : '',
    agency ? t('{0} 소속이에요.', [agency]) : '',
  ].filter(Boolean);
  const notice = portalWebUrl(profile.noticeUrl || '');
  return <section className="content-panel vd-ins" aria-labelledby="ins-debut">
    <span className="vd-ins-eyebrow">DEBUT</span>
    <h2 id="ins-debut">{heading}</h2>
    <p className="vd-ins-lede">{sentences.join(' ')}</p>
    <div className="vd-ins-facts">
      <div><span>{t('데뷔')}</span><b>{full}</b></div>
      {profile.languages?.length ? <div><span>{t('방송 언어')}</span><b>{profile.languages.join(' · ')}</b></div> : null}
      {tags.length ? <div><span>{t('주요 콘텐츠')}</span><b>{tags.join(' · ')}</b></div> : null}
    </div>
    {notice && <a className="vd-ins-more" href={notice} target="_blank" rel="noopener noreferrer">{t('데뷔 공지 원문 보기')} →</a>}
  </section>;
}

// 가장 자주 방송한 요일 2개와 3시간 구간.
function habitOf(heat: number[][]): { days: string; start: number } | null {
  const byHour = Array.from({ length: 24 }, (_, h) => heat.reduce((s, row) => s + (row[h] || 0), 0));
  if (!byHour.some((v) => v > 0)) return null;
  const start = byHour.reduce((best, _, h) => (byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24] > byHour[best] + byHour[(best + 1) % 24] + byHour[(best + 2) % 24] ? h : best), 0);
  const days = heat.map((row, d) => ({ d, v: row.reduce((s, v) => s + v, 0) })).sort((a, b) => b.v - a.v).slice(0, 2).filter((x) => x.v > 0).map((x) => t(DAYS[x.d])).join('·');
  return { days, start };
}

// ②~⑤: 채널 통계로 만드는 섹션들. 기록이 없거나 조건이 모자라면 아무것도 그리지 않는다.
export function ProfileInsights({ profile, openRecord }: { profile: PortalProfile; openRecord: () => void }) {
  const key = profileChannelKey(profile);
  const [days, setDays] = useState<7 | 30>(7);
  const short = useChannelBoard(key, days);
  const month = useChannelBoard(key, 30);
  const long = useChannelBoard(key, 90);
  if (!key) return null;
  return <>
    {short && short.kpis.broadcasts > 0 && <Summary data={short} days={days} setDays={setDays} openRecord={openRecord} />}
    {long && <Growth data={long} profile={profile} />}
    {month && month.kpis.broadcasts >= 5 && <Schedule data={month} />}
    {month && <Reaction data={month} />}
  </>;
}

function Summary({ data, days, setDays, openRecord }: { data: AnalyticsChannelBoard; days: 7 | 30; setDays: (d: 7 | 30) => void; openRecord: () => void }) {
  const habit = habitOf(data.heat);
  const k = data.kpis;
  const top = data.games.slice(0, 3);
  const totalWeek = data.heat.map((row) => row.reduce((s, v) => s + v, 0));
  const maxWeek = Math.max(1, ...totalWeek);
  return <section className="content-panel vd-ins" aria-labelledby="ins-rec">
    <div className="vd-ins-seg" role="group" aria-label={t('기간')}>{([7, 30] as const).map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{t('{0}일', [d])}</button>)}</div>
    <span className="vd-ins-eyebrow">BROADCAST · {t('최근 {0}일', [days])}</span>
    <h2 id="ins-rec">{t('{0}일 동안 {1}번 방송했어요', [days, num(k.broadcasts)])}{habit ? ` · ${t('주로 {0}시에 켜요', [habit.start])}` : ''}</h2>
    <div className="vd-ins-stats">
      <div><span>{t('방송')}</span><b>{num(k.broadcasts)}<small>{t('회')}</small></b></div>
      <div><span>{t('방송 시간')}</span><b>{num(k.minutes / 60)}<small>{t('시간')}</small></b></div>
      <div><span>{t('평균 시청자')}</span><b>{k.avg === null ? '—' : num(k.avg)}<small>{k.avg === null ? '' : t('명')}</small></b></div>
      <div><span>{t('최고 시청자')}</span><b>{k.peak === null ? '—' : num(k.peak)}<small>{k.peak === null ? '' : t('명')}</small></b></div>
    </div>
    <div className="vd-ins-two">
      {top.length > 0 && <div><p className="vd-ins-sub">{t('주로 한 콘텐츠')}</p>{top.map((g, i) => <div className="vd-ins-bar" key={g.name}><span>{g.name}</span><i className={`l${i + 1}`} style={{ width: `${Math.max(4, g.share / Math.max(1, top[0].share) * 100)}%` }} /><em>{g.share}%</em></div>)}</div>}
      <div><p className="vd-ins-sub">{t('요일별 방송 시간')}</p><div className="vd-ins-week">{totalWeek.map((v, d) => <div key={d}><i className={v >= maxWeek * 0.75 && v > 0 ? 'hi' : ''} style={{ height: `${Math.max(2, v / maxWeek * 80)}px` }} />{t(DAYS[d])}</div>)}</div></div>
    </div>
    <div className="vd-ins-foot"><span>{t('공개 방송 기록 기준')}</span><button type="button" onClick={openRecord}>{t('방송 기록 자세히 보기')} →</button></div>
  </section>;
}

// ③ 데뷔 후 성장: 데뷔일부터 주차별 평균 시청자. 데뷔가 90일 안이고 두 주 이상 기록이 있을 때만.
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
  if (known.length < 2 || known[0].v < 10) return null;
  const first = known[0], last = known[known.length - 1];
  const change = Math.round((last.v - first.v) / first.v * 100);
  const max = Math.max(...known.map((x) => x.v)) * 1.15;
  const w = 640, h = 180, x = (i: number) => 40 + (i / Math.max(1, series.length - 1)) * (w - 70), y = (v: number) => h - 20 - (v / max) * (h - 40);
  const line = known.map((p) => `${x(p.i)},${y(p.v)}`).join(' ');
  return <section className="content-panel vd-ins" aria-labelledby="ins-grow">
    <span className="vd-ins-eyebrow">GROWTH · {t('데뷔 후 {0}주', [series.length])}</span>
    <h2 id="ins-grow">{change >= 5 ? t('첫 주보다 시청자가 {0}% 늘었어요', [change]) : change <= -5 ? t('첫 주보다 시청자가 {0}% 줄었어요', [Math.abs(change)]) : t('데뷔 후 시청자가 꾸준히 비슷해요')}</h2>
    <div className="vd-ins-stats three">
      <div><span>{t('첫 주 평균 시청자')}</span><b>{num(first.v)}<small>{t('명')}</small></b></div>
      <div><span>{t('최근 주 평균 시청자')}</span><b>{num(last.v)}<small>{t('명')}</small></b></div>
      <div><span>{t('기록된 주')}</span><b>{known.length}<small>{t('주')}</small></b></div>
    </div>
    <svg viewBox={`0 0 ${w} ${h + 10}`} className="vd-ins-chart" role="img" aria-label={t('주차별 평균 시청자: {0}', [known.map((p) => `${p.i + 1}${t('주')} ${p.v}`).join(', ')])}>
      <polyline points={line} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinejoin="round" />
      {known.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={p === last ? 5 : 4} fill="#2563EB" />)}
      {known.map((p) => <text key={`l${p.i}`} x={x(p.i)} y={h + 6} textAnchor="middle" fontSize="15" fill="#94A3B8">{p.i + 1}{t('주')}</text>)}
      <text x={x(last.i)} y={y(last.v) - 12} textAnchor="middle" fontSize="17" fontWeight="700" fill="#2563EB">{num(last.v)}</text>
    </svg>
  </section>;
}

// ④ 방송 시간표: 최근 30일 요일×시간(한국 시간).
function Schedule({ data }: { data: AnalyticsChannelBoard }) {
  const habit = habitOf(data.heat);
  const filled = data.heat.flat().filter((v) => v > 0).sort((a, b) => a - b);
  const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => filled[Math.min(filled.length - 1, Math.floor(filled.length * q))] ?? 0);
  const step = (v: number) => (v > 0 ? 1 + cuts.filter((cut) => v > cut).length : 0);
  const k = data.kpis;
  const avgLen = k.broadcasts ? Math.round(k.minutes / k.broadcasts) : 0;
  const rest = data.heat.map((row, d) => ({ d, v: row.reduce((s, v) => s + v, 0) })).filter((x) => x.v === 0).map((x) => t(DAYS[x.d]));
  const recent = data.log[0]?.date;
  return <section className="content-panel vd-ins" aria-labelledby="ins-time">
    <span className="vd-ins-eyebrow">SCHEDULE · {t('최근 30일')}</span>
    <h2 id="ins-time">{habit ? t('주로 {0}요일 {1}~{2}시에 방송해요', [habit.days, habit.start, (habit.start + 3) % 24]) : t('방송 시간표')}</h2>
    <div className="vd-ins-heat" role="img" aria-label={t('요일별 시간대 방송 빈도')}>
      <span />{Array.from({ length: 24 }, (_, h) => <span className="h" key={h}>{h % 3 === 0 ? h : ''}</span>)}
      {data.heat.flatMap((row, d) => [<span className="d" key={`d${d}`}>{t(DAYS[d])}</span>, ...row.map((v, h) => <i key={`${d}-${h}`} style={{ background: SCALE[step(v)] }} />)])}
    </div>
    <div className="vd-ins-facts">
      <div><span>{t('평균 방송 길이')}</span><b>{avgLen >= 60 ? t('{0}시간 {1}분', [Math.floor(avgLen / 60), avgLen % 60]) : t('{0}분', [avgLen])}</b></div>
      {recent && <div><span>{t('최근 방송')}</span><b>{new Intl.DateTimeFormat(getPortalLanguage(), { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(recent))}</b></div>}
      {rest.length > 0 && rest.length < 7 && <div><span>{t('대체로 쉬는 날')}</span><b>{rest.join('·')}</b></div>}
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
    : t('주로 {0} 방송을 해요', [top.name]);
  return <section className="content-panel vd-ins" aria-labelledby="ins-react">
    <span className="vd-ins-eyebrow">CONTENT · {t('최근 30일')}</span>
    <h2 id="ins-react">{heading}</h2>
    <div className="vd-ins-react">
      <div className="hd"><span>{t('콘텐츠')}</span><span>{t('방송 시간 비중')}</span><span>{t('평균 시청자')}</span><span>{t('평소 대비')}</span></div>
      {withRatio.map((g) => <div className="row" key={g.name}><b>{g.name}</b><span className="bar"><i style={{ width: `${Math.max(4, g.share / Math.max(1, top.share) * 100)}%` }} /><em>{g.share}% · {t('{0}시간', [Math.round(g.minutes / 60)])}</em></span><b>{t('{0}명', [num(g.avg as number)])}</b><span className={g.ratio >= 1.2 ? 'chip up' : 'chip'}>{g.ratio >= 1.2 ? `▲ ${g.ratio.toFixed(1)}${t('배')}` : g.ratio <= 0.8 ? `▼ ${g.ratio.toFixed(1)}${t('배')}` : t('비슷')}</span></div>)}
    </div>
    <p className="vd-ins-note">{t('평소 = 이 채널의 최근 30일 평균 시청자({0}명)', [num(base)])}</p>
  </section>;
}

// ⑥ 공식 링크(오른쪽, 프로필 정보 아래). 등록된 링크만.
export function OfficialLinks({ profile }: { profile: PortalProfile }) {
  const links = [
    { label: platformLabel(profile.platform), url: portalWebUrl(profile.channelUrl), note: t('방송 보러 가기') },
    ...(profile.additionalChannels || []).map((c) => ({ label: platformLabel(c.platform), url: portalWebUrl(c.channelUrl), note: t('채널 바로가기') })),
    { label: t('공식 팬카페'), url: portalWebUrl(profile.cafeUrl || ''), note: t('공지·일정') },
    { label: 'X', url: portalWebUrl(profile.xUrl || ''), note: t('소식') },
    { label: t('공식 홈페이지'), url: portalWebUrl(profile.websiteUrl || ''), note: t('바로가기') },
  ].filter((link) => link.url);
  const seen = new Set<string>();
  const unique = links.filter((link) => (seen.has(link.url) ? false : (seen.add(link.url), true)));
  if (!unique.length) return null;
  return <section className="spec-panel vd-ins-links"><div className="section-title"><div><h2>{t('공식 링크')}</h2></div></div>
    {unique.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"><b>{link.label}</b><em>{link.note} →</em></a>)}
  </section>;
}
