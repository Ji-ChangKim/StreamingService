import { useEffect, useState } from 'react';
import type { AnalyticsGameBoard, GameGuide } from '../../../../../shared/analyticsBoard';
import { activityStreamerPath } from '../../../../../shared/activitySeo';
import { GUIDE_DAYS, gameHeading, gameLede, hourLabel, slotLabel } from '../../../../../shared/gameGuideText';
import { ComboChart, PlatformIcon, asOfLabel, gamePath, linkProps, num, people, platformLine, useHourlyData } from './boardParts';
import { StreamerSearch } from './StreamerSearch';
import './analyticsBoard.css';
import './gameGuide.css';

// 게임 페이지: 신입 스트리머용 데이터 페이지(기획문서 42번, 시안 B1).
// 위쪽 결론·지금 경쟁 → 언제 켜면 좋을까 → 신입 버튜버 → 30일 흐름·같은 시간 다른 게임 → 상위 채널 → 출처.
const GREEN = ['#DCFCE7', '#86EFAC', '#4ADE80', '#16A34A', '#166534'];
const BLUE = ['#EEF4FF', '#C9DAFB', '#8FB1F2', '#4A7FE0', '#1D4FB8'];
type Mode = 'per' | 'broadcasts' | 'viewers';

function quantile(values: number[]) {
  const filled = values.filter((v) => v > 0).sort((a, b) => a - b);
  const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => filled[Math.min(filled.length - 1, Math.floor(filled.length * q))] ?? 0);
  return (v: number) => cuts.filter((cut) => v > cut).length;
}

function When({ guide }: { guide: GameGuide }) {
  const [mode, setMode] = useState<Mode>('per');
  const grid = mode === 'per' ? guide.heat.per : mode === 'broadcasts' ? guide.heat.broadcasts : guide.heat.viewers;
  const step = quantile(grid.flat().map((v) => v ?? 0));
  const scale = mode === 'per' ? GREEN : BLUE;
  const best = guide.best[0];
  const unit = mode === 'broadcasts' ? '개' : '명';
  const label = { per: '방송 1개당 시청자', broadcasts: '방송 수', viewers: '전체 시청자' }[mode];
  return <section className="ab-section gg-sec" aria-labelledby="gg-when">
    <div className="gg-shead"><div><span className="gg-label">최근 4주 · 한국 시간</span><h2 id="gg-when">{gameHeading(guide)}</h2></div>
      <div className="gg-seg" role="group" aria-label="지도 기준">{(['per', 'broadcasts', 'viewers'] as const).map((m) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>{{ per: '방송 1개당 시청자', broadcasts: '방송 수', viewers: '전체 시청자' }[m]}</button>)}</div></div>
    {guide.best.length > 0 && <><p className="gg-sub">덜 붐비는 시간 TOP {guide.best.length}</p>
      <ol className="gg-slots">{guide.best.map((b, i) => <li key={`${b.day}-${b.start}`} className={i === 0 ? 'best' : ''}><span className="n">{i + 1}</span><b>{slotLabel(b.day, b.start)}</b><span>방송 1개당 <strong>{num(b.per)}명</strong> · 방송 {b.broadcasts}개{b.note && <><br />{b.note}</>}</span></li>)}</ol></>}
    <div className="gg-scroll"><div className="gg-heat" role="img" aria-label={`요일·시간대별 ${label}`}>
      <span />{Array.from({ length: 24 }, (_, h) => <span key={h} className="h">{h % 3 === 0 ? h : ''}</span>)}
      {grid.flatMap((row, d) => [<span key={`d${d}`} className="d">{GUIDE_DAYS[d]}</span>, ...row.map((v, h) => {
        const pick = mode === 'per' && best && best.day === d && h >= best.start && h < best.start + 3;
        return <i key={`${d}-${h}`} className={pick ? 'pick' : ''} title={`${GUIDE_DAYS[d]} ${h}시 · ${v === null ? '방송 3개 미만' : `${label} ${num(v)}${unit}`}`} style={{ background: v ? scale[step(v)] : 'var(--ab-track)' }} />;
      })])}
    </div></div>
    <div className="gg-scale">적음{scale.map((c) => <i key={c} style={{ background: c }} />)}많음</div>
  </section>;
}

function Newcomers({ data, onNavigate }: { data: NonNullable<GameGuide['newcomers']>; onNavigate: (path: string) => void }) {
  const days = (iso: string) => Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000) + 1);
  const max = Math.max(1, ...data.list.map((p) => p.avgViewers || 0));
  return <section className="ab-section gg-sec" aria-labelledby="gg-new">
    <span className="gg-label">데뷔 90일 이내 버튜버 · 최근 30일</span>
    <h2 id="gg-new">신입 버튜버 {data.people}명이 이 게임으로 방송했어요</h2>
    <div className="gg-ngrid">
      <div className="gg-nsum"><div><span>신입 방송</span><b>{num(data.streams)}회</b></div><div><span>방송 시청자(가운데 값)</span><b>{data.avgViewers === null ? '—' : `${num(data.avgViewers)}명`}</b></div><div><span>이 게임 방송 시간</span><b>{num(Math.round(data.minutes / 60))}시간</b></div></div>
      <div className="gg-nlist">
        <div className="gg-nhead" aria-hidden="true"><span /><span /><span>이름</span><span /><span>데뷔</span><span className="r">방송</span><span className="r">평균 ▼</span></div>
        {data.list.map((p, i) => <a key={p.slug} className="gg-nrow" {...linkProps(`/creator/${encodeURIComponent(p.slug)}`, onNavigate)}>
          <span className="rk">{i + 1}</span>
          {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" decoding="async" /> : <span className="ph" aria-hidden="true" />}
          <b>{p.name}</b>
          <span className="bar" aria-hidden="true"><em style={{ width: `${(p.avgViewers || 0) / max * 100}%` }} /></span>
          <span className="dd">{days(p.debutAt)}일째</span>
          <span className="r">{p.streams}회</span>
          <span className="r v">{p.avgViewers === null ? '—' : `${num(p.avgViewers)}명`}</span>
        </a>)}
      </div>
    </div>
  </section>;
}

function Trend({ guide }: { guide: GameGuide }) {
  const known = guide.trend.filter((d) => d.viewers !== null);
  if (known.length < 7) return null;
  const first = known.slice(0, 7), last = known.slice(-7);
  const avg = (rows: typeof known, key: 'viewers' | 'broadcasts') => rows.reduce((s, d) => s + (d[key] || 0), 0) / rows.length;
  const dv = (avg(last, 'viewers') - avg(first, 'viewers')) / Math.max(1, avg(first, 'viewers'));
  const db = (avg(last, 'broadcasts') - avg(first, 'broadcasts')) / Math.max(0.1, avg(first, 'broadcasts'));
  const word = (x: number, up: string, down: string) => (x >= 0.1 ? up : x <= -0.1 ? down : '비슷하고');
  const flat = Math.abs(dv) < 0.1 && Math.abs(db) < 0.1;
  const heading = flat ? '한 달 동안 시청자와 방송 수가 비슷하게 유지됐어요' : `한 달 동안 시청자는 ${word(dv, '늘었고', '줄었고')}, 방송 수는 ${db >= 0.1 ? '늘었어요' : db <= -0.1 ? '줄었어요' : '비슷해요'}`;
  return <section className="ab-section gg-sec" aria-labelledby="gg-trend">
    <span className="gg-label">최근 4주</span>
    <h2 id="gg-trend">{heading}</h2>
    <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />시간당 평균 시청자</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />시간당 평균 방송 수</span></div>
    <ComboChart height={230} maxBarWidth={14} lineMax={Math.max(1, ...guide.trend.map((d) => d.broadcasts ?? 0))}
      items={guide.trend.map((d, i) => ({ key: d.date, bar: d.viewers, line: d.broadcasts, tip: d.viewers === null ? `${d.date} 기록 없음` : `${d.date} · 평균 ${people(d.viewers)} · 방송 ${d.broadcasts}개`, label: i % 7 === 0 || i === guide.trend.length - 1 ? d.date.slice(5).replace('-', '/') : '' }))} />
  </section>;
}

function Alternatives({ data, onNavigate }: { data: NonNullable<GameGuide['alternatives']>; onNavigate: (path: string) => void }) {
  return <section className="ab-section gg-sec" aria-labelledby="gg-alt">
    <span className="gg-label">최근 4주 · 방송 1개당 시청자 많은 순</span>
    <h2 id="gg-alt">덜 붐비는 시간 1위, {slotLabel(data.day, data.start)}에 다른 게임은?</h2>
    <table className="gg-alt"><thead><tr><th>게임</th><th className="r">방송 1개당</th><th className="r">방송 수</th><th className="r">경쟁</th></tr></thead>
      <tbody>{data.games.map((g) => <tr key={g.name} className={g.self ? 'me' : ''}><td>{g.self ? g.name : <a {...linkProps(gamePath(g.name), onNavigate)}>{g.name}</a>}</td><td className="r">{num(g.per)}명</td><td className="r">{g.broadcasts}개</td><td className="r"><span className={`gg-comp ${g.competition === '여유' ? '' : g.competition === '혼잡' ? 'busy' : 'mid'}`}>{g.competition}</span></td></tr>)}</tbody></table>
  </section>;
}

export function GameBoardPage({ name, onNavigate }: { name: string; onNavigate: (path: string) => void }) {
  const { data, error, loading, missing } = useHourlyData<AnalyticsGameBoard>(`/api/analytics/board/game?name=${encodeURIComponent(name)}`);
  useEffect(() => { document.title = `${data?.name || name} 방송 통계 · 언제 켜면 덜 붐빌까 | VDébut`; }, [data, name]);
  const guide = data?.guide;
  const lede = guide ? gameLede(guide) : null;
  const comp = data?.now.competition;
  const daily = guide ? Math.round(guide.trend.filter((d) => d.broadcasts !== null).reduce((s, d) => s + (d.broadcasts || 0), 0) / Math.max(1, guide.trend.filter((d) => d.broadcasts !== null).length) * 10) / 10 : null;
  return <div className="ab gg">
    <main className="ab-main">
      <div className="gg-crumbrow"><nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 게임 / {data?.name || name}</nav><StreamerSearch onNavigate={onNavigate} withTags className="gg-search" /></div>
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {error && !data && <div className="ab-error">{error}</div>}
      {missing && <div className="ab-empty">최근 4주 동안 이 게임의 방송 기록이 없어요. <a {...linkProps('/analytics', onNavigate)}>방송 통계로 돌아가기</a></div>}
      {data && <>
        <section className="gg-hero" aria-labelledby="gg-name">
          <div className="gg-id"><span className="gg-label">치지직 · 최근 4주</span><h1 id="gg-name">{data.name}</h1>{lede && <p className="gg-lede">{lede}</p>}
            <div className="gg-meta">{data.now.rank && <span>지금 게임 순위 <b>{data.now.rank}위</b></span>}{data.asOf && <span>{asOfLabel(data.asOf)}</span>}</div></div>
          <div className="gg-tiles">
            <div className={`gg-now ${comp === '여유' ? 'ok' : comp === '혼잡' ? 'busy' : 'mid'}`}>
              <b className="state">{comp === '경쟁 없음' ? '기록 적음' : `경쟁 ${comp}`}</b>
              <p>{!data.now.perBroadcast ? '지금은 방송이 적어 비교하지 않아요' : !guide?.usualPer ? '같은 시간 평소 기록이 적어요' : comp === '여유' ? '평소 이 시간보다 방송 1개당 시청자가 많아요' : comp === '혼잡' ? '평소 이 시간보다 방송 1개당 시청자가 적어요' : '평소 이 시간과 비슷해요'}</p>
              {data.now.perBroadcast && guide?.usualPer ? <div className="vs"><span><em>지금</em>{num(data.now.perBroadcast)}명</span><span><em>평소</em>{num(guide.usualPer)}명</span></div> : null}
            </div>
            <div className="gg-tile"><span>지금 방송</span><b>{num(data.now.broadcasts)}<small>개</small></b><em>상위 방송 기준</em></div>
            <div className="gg-tile"><span>지금 시청자</span><b>{num(data.now.viewers)}<small>명</small></b><em>치지직·SOOP</em></div>
            <div className="gg-tile"><span>방송 1개당</span><b>{data.now.perBroadcast ? num(data.now.perBroadcast) : '—'}<small>{data.now.perBroadcast ? '명' : ''}</small></b><em>지금 기준</em></div>
            <div className="gg-tile"><span>4주 시간당 평균 방송</span><b>{daily ?? '—'}<small>{daily !== null ? '개' : ''}</small></b><em>{guide?.busiest ? `가장 붐비는 때 ${GUIDE_DAYS[guide.busiest.day]} ${hourLabel(guide.busiest.hour)}` : '치지직'}</em></div>
          </div>
        </section>

        {guide && <When guide={guide} />}
        {guide?.newcomers && <Newcomers data={guide.newcomers} onNavigate={onNavigate} />}
        {guide && (guide.alternatives ? <div className="gg-two"><Trend guide={guide} /><Alternatives data={guide.alternatives} onNavigate={onNavigate} /></div> : <Trend guide={guide} />)}

        {data.top.length > 0 && <section className="ab-section gg-sec" aria-labelledby="gg-top">
          <span className="gg-label">최근 7일 · 이 게임 방송 평균 시청자 순</span>
          <h2 id="gg-top">이 게임에서 시청자가 많은 채널</h2>
          <div className="gg-tcols">{[data.top.slice(0, 5), data.top.slice(5, 10)].filter((col) => col.length).map((col, k) => <ol key={k} className="gg-top10" start={k * 5 + 1}>{col.map((t, i) => <li key={t.channelKey}>
            <span className="n">{k * 5 + i + 1}</span>
            <a {...linkProps(activityStreamerPath(t.channelKey), onNavigate)}><b>{t.name}</b><small><PlatformIcon platform={t.platform} />{platformLine(t)} · {t.hours}시간</small></a>
            <span className="bar" aria-hidden="true"><em style={{ width: `${t.avg / Math.max(1, data.top[0].avg) * 100}%` }} /></span>
            <b className="v">{people(t.avg)}</b>
          </li>)}</ol>)}</div>
        </section>}

        <p className="gg-src">치지직 상위 100개 방송(10분마다)과 VDébut에 등록된 버튜버 방송(5분마다) 기록으로 계산해요. 작은 방송은 등록된 버튜버만 포함돼요. <a {...linkProps('/analytics/method', onNavigate)}>집계 기준 보기</a></p>
      </>}
    </main>
  </div>;
}
