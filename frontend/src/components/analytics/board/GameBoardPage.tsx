import { useEffect } from 'react';
import type { AnalyticsGameBoard } from '../../../../../shared/analyticsBoard';
import { activityStreamerPath } from '../../../../../shared/activitySeo';
import { ComboChart, HBars, Lede, PlatformIcon, asOfLabel, linkProps, num, people, platformLine, useHourlyData } from './boardParts';
import './analyticsBoard.css';

// 시간대 칸은 녹색 한 가지의 명도 단계만 쓴다(정의서 5.11).
const SCALE = ['#EAF5EE', '#BFE3CB', '#7CC59A', '#2F9E63', '#13693F'];
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

  return <div className="ab">
    <main className="ab-main">
      <nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 인기 게임 순위 / {data?.name || name}</nav>
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {error && !data && <div className="ab-error">{error}</div>}
      {missing && <div className="ab-empty">최근 4주 동안 이 게임의 방송 기록이 없어요. <a {...linkProps('/analytics', onNavigate)}>방송 통계로 돌아가기</a></div>}
      {data && <>
        <section className="ab-head">
          <div className="ab-head-row">
            <div><h1>{data.name}</h1><p className="ab-subtitle">{data.now.rank ? `지금 게임 순위 ${data.now.rank}위 · ` : ''}{asOfLabel(data.asOf)}</p></div>
          </div>
          <dl className="ab-kv">
            <div><dt>지금 시청자</dt><dd className="ab-kv-large">{people(data.now.viewers)}</dd></div>
            <div><dt>지금 방송 수</dt><dd className="ab-kv-large">{num(data.now.broadcasts)}개</dd></div>
            <div><dt>방송당 시청자</dt><dd className="ab-kv-large">{data.now.perBroadcast ? people(data.now.perBroadcast) : '—'} <span className="ab-note" style={{ display: 'inline' }}>경쟁 {data.now.competition === '경쟁 없음' ? '없음' : data.now.competition}</span></dd></div>
          </dl>
        </section>

        <Lede text={data.summary} />

        <div className="ab-cols">
          <section className="ab-section" aria-labelledby="ab-g7" style={{ flex: '3 1 560px' }}>
            <h2 id="ab-g7">7일 추이</h2>
            <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />시간당 평균 시청자</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />평균 방송 수</span></div>
            <ComboChart height={200} maxBarWidth={32}
              lineMax={Math.max(1, ...data.days.map((d) => d.broadcasts ?? 0))}
              items={data.days.map((d) => ({ key: d.date, bar: d.viewers, line: d.broadcasts, tip: d.viewers === null ? `${d.date} 기록 없음` : `${d.date} · 평균 ${people(d.viewers)} · 방송 ${d.broadcasts}개`, label: `${d.date.slice(5).replace('-', '/')}` }))} />
          </section>
          {data.platforms.length > 0 && <section className="ab-section" aria-labelledby="ab-gp" style={{ flex: '2 1 320px' }}>
            <h2 id="ab-gp">플랫폼별 시청자</h2>
            <HBars rows={data.platforms.map((p) => ({ key: p.platform, name: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><PlatformIcon platform={p.platform} />{p.platform === 'CHZZK' ? '치지직' : 'SOOP'}</span>, value: p.share, text: `${p.share}%` }))} />
            <p className="ab-note">최근 7일 시간당 평균 기준</p>
          </section>}
        </div>

        <section className="ab-section" aria-labelledby="ab-heat">
          <h2 id="ab-heat">언제 많이 볼까?</h2>
          <p className="ab-note">요일·시간대별 평균 시청자 · 최근 4주</p>
          <div className="ab-scroll"><div className="ab-heat">
            <div className="ab-heat-row" aria-hidden="true"><span />{Array.from({ length: 24 }, (_, h) => <span key={h} style={{ textAlign: 'center' }}>{h % 3 === 0 ? h : ''}</span>)}</div>
            {data.heat.map((row, d) => <div className="ab-heat-row" key={DAYS[d]}><b>{DAYS[d]}</b>{row.map((v, h) => <i key={h} title={`${DAYS[d]} ${h}시 · 평균 ${people(v)}`} style={{ background: v ? SCALE[step(v)] : 'var(--ab-track)' }} />)}</div>)}
          </div></div>
          <div className="ab-scale"><span>적음</span>{SCALE.map((c) => <i key={c} style={{ background: c }} />)}<span>많음</span></div>
        </section>

        {data.top.length > 0 && <section className="ab-section" aria-labelledby="ab-top">
          <h2 id="ab-top">이 게임의 상위 채널</h2>
          <p className="ab-note">최근 7일 이 게임 방송의 평균 시청자 순</p>
          <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />평균 시청자</span><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar-soft)', borderRadius: 2 }} />최고 시청자</span></div>
          <ol className="ab-list">{data.top.map((t, i) => <li key={t.channelKey} className="ab-row" style={{ gridTemplateColumns: '32px minmax(0, 240px) minmax(0, 1fr) 72px' }}>
            <span className="ab-rank">{i + 1}</span>
            <a className="ab-name" {...linkProps(activityStreamerPath(t.channelKey), onNavigate)}><b>{t.name}</b><span className="ab-plat"><PlatformIcon platform={t.platform} />{platformLine(t)}</span></a>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }} title={`평균 ${people(t.avg)} · 최고 ${people(t.peak)}`}>
              <span className="ab-track" style={{ height: 8 }} aria-hidden="true"><i style={{ width: `${t.peak / topMax * 100}%`, background: 'var(--ab-bar-soft)' }} /><i style={{ width: `${t.avg / topMax * 100}%` }} /></span>
              <span style={{ display: 'flex', gap: 12, fontSize: 13 }}><strong>평균 {people(t.avg)}</strong><span className="ab-note">최고 {people(t.peak)}</span></span>
            </span>
            <span className="ab-note" style={{ textAlign: 'right' }}>{t.hours}시간</span>
          </li>)}</ol>
        </section>}
      </>}
    </main>
  </div>;
}
