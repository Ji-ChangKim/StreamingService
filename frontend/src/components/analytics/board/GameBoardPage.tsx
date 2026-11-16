import { useEffect } from 'react';
import type { AnalyticsGameBoard } from '../../../../../shared/analyticsBoard';
import { activityStreamerPath } from '../../../../../shared/activitySeo';
import { ComboChart, Lede, PlatformIcon, ShareBar, Sparkline, asOfLabel, linkProps, num, people, platformLine, useHourlyData } from './boardParts';
import './analyticsBoard.css';

// 시간대 칸은 파란색 한 가지의 명도 단계만 쓴다(정의서 5.11, 도감과 같은 색).
const SCALE = ['#EEF4FF', '#C9DAFB', '#8FB1F2', '#4A7FE0', '#1D4FB8'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

// 게임 상세(정의서 7.3).
export function GameBoardPage({ name, onNavigate }: { name: string; onNavigate: (path: string) => void }) {
  const { data, error, loading, missing } = useHourlyData<AnalyticsGameBoard>(`/api/analytics/board/game?name=${encodeURIComponent(name)}`);
  useEffect(() => { document.title = `${data?.name || name} 방송 통계 · 시청자·방송 수·시간대 | VDébut`; }, [data, name]);
  // 대회 같은 한두 시간의 큰 값이 색을 독차지하지 않도록, 기록 있는 칸을 다섯 구간(분위)으로 나눠 칠한다.
  const filled = (data?.heat.flat() || []).filter((v) => v > 0).sort((a, b) => a - b);
  const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => filled[Math.min(filled.length - 1, Math.floor(filled.length * q))] ?? 0);
  const step = (v: number) => (v <= 0 ? 0 : cuts.filter((cut) => v > cut).length);
  const topMax = Math.max(1, ...(data?.top.map((t) => t.peak) || [0]));
  const days = data?.days || [];
  const known = days.filter((d) => d.viewers !== null);
  const weekAvg = known.length ? Math.round(known.reduce((s, d) => s + (d.viewers || 0), 0) / known.length) : 0;
  const weekBroadcasts = known.length ? Math.round(known.reduce((s, d) => s + (d.broadcasts || 0), 0) / known.length * 10) / 10 : 0;
  const weekday = (date: string) => ['일', '월', '화', '수', '목', '금', '토'][new Date(`${date}T00:00:00Z`).getUTCDay()];
  const best = known.length ? known.reduce((a, b) => ((b.viewers || 0) > (a.viewers || 0) ? b : a)) : null;
  const weekInsight = best ? `${weekday(best.date)}요일(${best.date.slice(5).replace('-', '/')})에 가장 많이 봤어요 · 시간당 평균 ${people(best.viewers)}` : '';
  // 요일·시간대 칸에서 가장 많이 보는 때 3곳, 가장 조용한 시간대.
  const cells = (data?.heat || []).flatMap((row, d) => row.map((v, h) => ({ d, h, v })));
  const bestTimes = [...cells].filter((c) => c.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
  const byHour = Array.from({ length: 24 }, (_, h) => cells.filter((c) => c.h === h).reduce((s, c) => s + c.v, 0));
  const quietStart = byHour.reduce((best, _, h) => { const sum = byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24]; const bestSum = byHour[best] + byHour[(best + 1) % 24] + byHour[(best + 2) % 24]; return sum < bestSum ? h : best; }, 0);
  const quietLabel = `${quietStart}~${(quietStart + 3) % 24}시`;
  const topInsight = (() => {
    const top = data?.top || [];
    if (top.length < 2) return '';
    const sum = top.reduce((s, t) => s + t.avg, 0);
    return `상위 3개 채널이 이 목록 시청자의 ${Math.round(top.slice(0, 3).reduce((s, t) => s + t.avg, 0) / Math.max(1, sum) * 100)}%를 차지해요`;
  })();

  return <div className="ab">
    <main className="ab-main">
      <nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 인기 게임 순위 / {data?.name || name}</nav>
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {error && !data && <div className="ab-error">{error}</div>}
      {missing && <div className="ab-empty">최근 4주 동안 이 게임의 방송 기록이 없어요. <a {...linkProps('/analytics', onNavigate)}>방송 통계로 돌아가기</a></div>}
      {data && <>
        <section className="ab-head">
          <div><h1>{data.name}</h1><p className="ab-subtitle">{data.now.rank ? `지금 게임 순위 ${data.now.rank}위 · ` : ''}{asOfLabel(data.asOf)}</p></div>
        </section>

        {/* ① 한눈에 */}
        <section className="ab-kpis-grid" aria-label="지금 한눈에">
          <article className="ab-kpi ab-kpi-hero">
            <header>지금 시청자</header>
            <div className="ab-kpi-value"><strong>{num(data.now.viewers)}</strong><span>명</span></div>
            {weekAvg > 0 && <span className={`ab-chip ${data.now.viewers >= weekAvg ? 'up' : 'down'}`}>7일 평균보다 {data.now.viewers >= weekAvg ? '▲' : '▼'} {Math.abs(Math.round((data.now.viewers - weekAvg) / weekAvg * 100))}%</span>}
            <Sparkline values={data.days.map((d) => d.viewers)} />
          </article>
          <article className="ab-kpi">
            <header>지금 방송 수</header>
            <div className="ab-kpi-value"><strong>{num(data.now.broadcasts)}</strong><span>개</span></div>
            {weekBroadcasts > 0 && <p>7일 평균 <b>{num(weekBroadcasts)}개</b></p>}
          </article>
          <article className="ab-kpi">
            <header>방송당 시청자</header>
            <div className="ab-kpi-value"><strong>{data.now.perBroadcast ? num(data.now.perBroadcast) : '—'}</strong>{data.now.perBroadcast ? <span>명</span> : null}</div>
            <p><em className={`ab-comp ab-comp-${data.now.competition === '경쟁 없음' ? 'none' : data.now.competition}`}>경쟁 {data.now.competition === '경쟁 없음' ? '없음' : data.now.competition}</em></p>
          </article>
          <article className="ab-kpi">
            <header>가장 많이 보는 때</header>
            <div className="ab-kpi-value ab-kpi-name"><strong>{bestTimes[0] ? `${DAYS[bestTimes[0].d]}요일 ${bestTimes[0].h}시` : '—'}</strong></div>
            {bestTimes[0] && <p>최근 4주 평균 <b>{people(bestTimes[0].v)}</b></p>}
          </article>
        </section>

        <Lede text={data.summary} />

        {/* ② 흐름 + 방송하기 좋은 때 */}
        <div className="ab-layout">
          <section className="ab-section ab-span-2" aria-labelledby="ab-g7">
            <div><h2 id="ab-g7">7일 추이</h2>{weekInsight && <p className="ab-insight">{weekInsight}</p>}</div>
            <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />시간당 평균 시청자</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />평균 방송 수</span></div>
            <ComboChart height={200} maxBarWidth={32}
              lineMax={Math.max(1, ...data.days.map((d) => d.broadcasts ?? 0))}
              items={data.days.map((d) => ({ key: d.date, bar: d.viewers, line: d.broadcasts, tip: d.viewers === null ? `${d.date} 기록 없음` : `${d.date} · 평균 ${people(d.viewers)} · 방송 ${d.broadcasts}개`, label: `${d.date.slice(5).replace('-', '/')}` }))} />
          </section>
          <section className="ab-section ab-brief" aria-labelledby="ab-gbest">
            <h2 id="ab-gbest">시청자가 몰리는 시간</h2>
            <div className="ab-brief-block" style={{ borderTop: 0, paddingTop: 0 }}><h3>많이 보는 때 TOP 3 <small>최근 4주 평균</small></h3>
              <ol className="ab-mini-list">{bestTimes.map((t) => <li key={`${t.d}-${t.h}`}><span>{DAYS[t.d]}요일 {t.h}시</span><b>{people(t.v)}</b></li>)}</ol></div>
            {data.platforms.length > 0 && <div className="ab-brief-block"><h3>플랫폼별 시청자 <small>최근 7일</small></h3>
              <ShareBar items={data.platforms.map((p) => ({ key: p.platform, label: p.platform === 'CHZZK' ? '치지직' : 'SOOP', value: p.viewers }))} other={0} /></div>}
          </section>
        </div>

        <section className="ab-section" aria-labelledby="ab-heat">
          <div><h2 id="ab-heat">요일·시간대별 시청자</h2>{bestTimes[0] && <p className="ab-insight">{DAYS[bestTimes[0].d]}요일 {bestTimes[0].h}시 전후에 가장 많이 보고, {quietLabel}은 비교적 조용해요</p>}</div>
          <p className="ab-note">최근 4주 평균 시청자 · 진할수록 많이 봐요</p>
          <div className="ab-scroll"><div className="ab-heat">
            <div className="ab-heat-row" aria-hidden="true"><span />{Array.from({ length: 24 }, (_, h) => <span key={h} style={{ textAlign: 'center' }}>{h % 3 === 0 ? h : ''}</span>)}</div>
            {data.heat.map((row, d) => <div className="ab-heat-row" key={DAYS[d]}><b>{DAYS[d]}</b>{row.map((v, h) => <i key={h} title={`${DAYS[d]} ${h}시 · 평균 ${people(v)}`} style={{ background: v ? SCALE[step(v)] : 'var(--ab-track)' }} />)}</div>)}
          </div></div>
          <div className="ab-scale"><span>적음</span>{SCALE.map((c) => <i key={c} style={{ background: c }} />)}<span>많음</span></div>
        </section>

        {data.top.length > 0 && <section className="ab-section" aria-labelledby="ab-top">
          <div><h2 id="ab-top">이 게임의 상위 채널</h2><p className="ab-insight">{topInsight}</p></div>
          <p className="ab-note">최근 7일 이 게임 방송의 평균 시청자 순</p>
          <ol className="ab-podium">{data.top.slice(0, 3).map((t, i) => <li key={t.channelKey} className={`ab-podium-${i + 1}`}>
            <span className="ab-podium-rank">{i + 1}</span>
            <span className="ab-avatar ab-avatar-md" aria-hidden="true" />
            <a className="ab-name" {...linkProps(activityStreamerPath(t.channelKey), onNavigate)}><b>{t.name}</b><span className="ab-plat"><PlatformIcon platform={t.platform} />{platformLine(t)}</span></a>
            <strong className="ab-podium-viewers">평균 {people(t.avg)}</strong>
            <span className="ab-note">최고 {people(t.peak)} · 이 게임 방송 {t.hours}시간</span>
          </li>)}</ol>
          {data.top.length > 3 && <><div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />평균 시청자</span><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar-soft)', borderRadius: 2 }} />최고 시청자</span></div>
          <ol className="ab-list">{data.top.slice(3).map((t, i) => <li key={t.channelKey} className="ab-row" style={{ gridTemplateColumns: '32px minmax(0, 240px) minmax(0, 1fr) 72px' }}>
            <span className="ab-rank">{i + 4}</span>
            <a className="ab-name" {...linkProps(activityStreamerPath(t.channelKey), onNavigate)}><b>{t.name}</b><span className="ab-plat"><PlatformIcon platform={t.platform} />{platformLine(t)}</span></a>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }} title={`평균 ${people(t.avg)} · 최고 ${people(t.peak)}`}>
              <span className="ab-track" style={{ height: 8 }} aria-hidden="true"><i style={{ width: `${t.peak / topMax * 100}%`, background: 'var(--ab-bar-soft)' }} /><i style={{ width: `${t.avg / topMax * 100}%` }} /></span>
              <span style={{ display: 'flex', gap: 12, fontSize: 13 }}><strong>평균 {people(t.avg)}</strong><span className="ab-note">최고 {people(t.peak)}</span></span>
            </span>
            <span className="ab-note" style={{ textAlign: 'right' }}>{t.hours}시간</span>
          </li>)}</ol></>}
        </section>}
      </>}
    </main>
  </div>;
}
