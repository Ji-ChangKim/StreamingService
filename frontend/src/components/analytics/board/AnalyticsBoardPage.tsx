import { useEffect, useMemo, useState } from 'react';
import type { AnalyticsBoard, BoardPlatform } from '../../../../../shared/analyticsBoard';
import { activityStreamerPath } from '../../../../../shared/activitySeo';
import { StreamerSearch } from './StreamerSearch';
import { ChannelRows, ComboChart, Lede, Move, PlatformIcon, Seg, ShareBar, Sparkline, asOfLabel, needDays, gamePath, linkProps, num, people, platformLine, tagPath, useHourlyData } from './boardParts';
import './analyticsBoard.css';

type TrendTab = 'today' | 'yesterday' | 'd7' | 'd30';
type GameTab = 'now' | 'today' | 'd7';
const COMPETITION_NOTE: Record<string, string> = { 여유: '여유', 보통: '보통', 혼잡: '혼잡', '경쟁 없음': '방송 1개' };

function readPlatform(path: string): BoardPlatform {
  if (path === '/analytics/chzzk') return 'CHZZK';
  if (path === '/analytics/soop') return 'SOOP';
  const value = new URLSearchParams(window.location.search).get('platform')?.toUpperCase();
  return value === 'CHZZK' || value === 'SOOP' ? value : 'ALL';
}

// 통계 첫 화면: 플랫폼 → 게임 → 채널 순서로 지금 판도를 보여 준다(정의서 7.2).
export function AnalyticsBoardPage({ path, onNavigate }: { path: string; onNavigate: (path: string) => void }) {
  const [platform, setPlatform] = useState<BoardPlatform>(() => readPlatform(path));
  const [trendTab, setTrendTab] = useState<TrendTab>('today');
  const [gameTab, setGameTab] = useState<GameTab>('now');
  const [channelTab, setChannelTab] = useState<'all' | 'vtuber'>('all');
  useEffect(() => { setPlatform(readPlatform(path)); }, [path]);
  useEffect(() => { document.title = '방송 통계 · 치지직·SOOP 실시간 판도 | VDébut'; }, []);
  const { data, error, loading, reload } = useHourlyData<AnalyticsBoard>(`/api/analytics/board?platform=${platform}`);

  const choosePlatform = (next: BoardPlatform) => {
    setPlatform(next);
    onNavigate(next === 'ALL' ? '/analytics' : `/analytics/${next === 'CHZZK' ? 'chzzk' : 'soop'}`);
  };

  const trend = data?.trend[trendTab] || [];
  const games = data?.games[gameTab] || [];
  const channels = useMemo(() => (data?.channels || []).filter((c) => channelTab === 'all' || c.isVtuber).slice(0, 20), [data, channelTab]);
  const gameMaxCount = Math.max(1, ...games.map((g) => g.broadcasts));
  const tagMaxCount = Math.max(1, ...(data?.tags || []).map((t) => t.broadcasts));
  const [showAllChannels, setShowAllChannels] = useState(false);
  const card = data?.platforms[0];
  const coverage = data?.availability?.coverageDays ?? 0;
  const topGame = data?.games.now[0];
  const topChannel = data?.channels[0];
  // 점유율: 지금 수집된 방송 시청자 전체(게임+게임 외) 중 몫.
  const nowTotal = data?.nowViewers || [...(data?.games.now || []), ...(data?.nonGame || [])].reduce((sum, g) => sum + g.viewers, 0);
  const share = (v: number) => Math.round(v / Math.max(1, nowTotal) * 100);
  const gameShare = (v: number) => Math.round(v / Math.max(1, games.reduce((sum, g) => sum + g.viewers, 0)) * 100);
  const today = data?.trend.today || [];
  const peakIndex = today.reduce((best, p, i) => (p.chzzk !== null && (best < 0 || p.chzzk > (today[best].chzzk || 0)) ? i : best), -1);
  const peakHour = peakIndex >= 0 ? peakIndex : null;
  // 각 섹션의 '그래서 무엇이냐'를 한 줄로.
  const trendInsight = (() => {
    const points = trend.filter((p) => p.chzzk !== null);
    if (!points.length) return '';
    const top = points.reduce((a, b) => ((b.chzzk || 0) > (a.chzzk || 0) ? b : a));
    if (trendTab === 'today' || trendTab === 'yesterday') return `${trendTab === 'today' ? '오늘은' : '어제는'} ${top.label}에 가장 많이 봤어요 (${people(top.chzzk)})`;
    const low = points.reduce((a, b) => ((b.chzzk || 0) < (a.chzzk || 0) ? b : a));
    return `${top.label}에 가장 많고 ${low.label}에 가장 적었어요 (하루 평균 ${people(top.chzzk)} · ${people(low.chzzk)})`;
  })();
  const channelInsight = (() => {
    if (channels.length < 4) return '';
    const sum = channels.reduce((s, c) => s + c.viewers, 0);
    return `상위 3개 채널이 순위 안 시청자의 ${Math.round(channels.slice(0, 3).reduce((s, c) => s + c.viewers, 0) / Math.max(1, sum) * 100)}%를 모으고 있어요`;
  })();

  return <div className="ab">
    <main className="ab-main">
      <section className="ab-head" aria-label="제목과 조회 조건">
        <div className="ab-head-row">
          <div>
            <span className="ab-eyebrow">Live statistics</span>
            <h1>방송 통계</h1>
            <p className="ab-subtitle">10분마다 새로 집계해요{data?.asOf ? ` · ${asOfLabel(data.asOf)}` : ''}</p>
          </div>
          <StreamerSearch onNavigate={onNavigate} />
        </div>
        <div className="ab-filter" role="group" aria-label="플랫폼">
          {(['ALL', 'CHZZK', 'SOOP'] as const).map((p) => {
            const off = p !== 'ALL' && data?.availability ? !data.availability.platformReady[p] : false;
            return <button key={p} type="button" aria-pressed={platform === p} disabled={off && platform !== p} title={off ? `${p === 'CHZZK' ? '치지직' : 'SOOP'} 데이터를 준비하고 있어요. 데이터가 들어오면 선택할 수 있어요.` : undefined} onClick={() => choosePlatform(p)}>{p !== 'ALL' && <PlatformIcon platform={p} />}{p === 'ALL' ? '전체' : p === 'CHZZK' ? '치지직' : 'SOOP'}{off && <small className="ab-soon">준비 중</small>}</button>;
          })}
        </div>
      </section>

      {error && !data && <div className="ab-error">{error} <button type="button" className="ab-more" onClick={() => void reload()}>다시 불러오기</button></div>}
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {data && !data.asOf && <div className="ab-empty">아직 집계된 기록이 없어요.</div>}

      {data?.asOf && <>
        {/* ① 한눈에: 지금 상태를 숫자 네 개로 */}
        <section className="ab-kpis-grid" aria-label="지금 한눈에">
          {card && <article className="ab-kpi ab-kpi-hero">
            <header><PlatformIcon platform={card.platform} />치지직 지금 시청자</header>
            <div className="ab-kpi-value"><strong>{num(card.viewers)}</strong><span>명</span></div>
            {card.usualDelta !== null && <span className={`ab-chip ${card.usualDelta >= 0 ? 'up' : 'down'}`}>평소 이 시간보다 {card.usualDelta >= 0 ? '▲' : '▼'} {Math.abs(card.usualDelta)}%</span>}
            <Sparkline values={data.trend.today.map((p) => p.chzzk)} />
          </article>}
          {card && <article className="ab-kpi">
            <header>오늘 최고 시청자</header>
            <div className="ab-kpi-value"><strong>{num(card.peakToday)}</strong><span>명</span></div>
            <p>지금은 오늘 최고의 <b>{Math.round(card.viewers / Math.max(1, card.peakToday) * 100)}%</b>{peakHour !== null ? ` · 가장 많던 때 ${peakHour}시` : ''}</p>
          </article>}
          {card && <article className="ab-kpi">
            <header>1,000명 이상 방송</header>
            <div className="ab-kpi-value"><strong>{num(card.bigCount)}</strong><span>개</span></div>
            <p>인기 방송 상위 100개 중</p>
          </article>}
          {topGame && <article className="ab-kpi">
            <header>지금 1위 게임</header>
            <a className="ab-kpi-value ab-kpi-name" {...linkProps(gamePath(topGame.name), onNavigate)}><strong>{topGame.name}</strong></a>
            <p>전체 시청자의 <b>{share(topGame.viewers)}%</b> · 방송 {num(topGame.broadcasts)}개</p>
          </article>}
          {!card && topChannel && <article className="ab-kpi">
            <header>지금 1위 채널</header>
            <a className="ab-kpi-value ab-kpi-name" {...linkProps(activityStreamerPath(topChannel.channelKey), onNavigate)}><strong>{topChannel.name}</strong></a>
            <p>{people(topChannel.viewers)} · {topChannel.category}</p>
          </article>}
          {!card && <article className="ab-kpi">
            <header>순위에 오른 방송 중 채널</header>
            <div className="ab-kpi-value"><strong>{num(data.channels.length)}</strong><span>개</span></div>
            <p>VDébut에 등록된 채널 기준</p>
          </article>}
        </section>
        {platform === 'SOOP' && data.games.now.length === 0 && <p className="ab-note">SOOP은 지금 방송 분류 정보를 받지 못하고 있어 게임 순위를 보여 드리지 못해요. 방송 중인 채널 순위는 아래에서 볼 수 있어요.</p>}

        {/* ② 흐름과 해석 */}
        <div className="ab-layout">
          {trend.some((p) => p.chzzk !== null) && <section className="ab-section ab-span-2" aria-labelledby="ab-trend">
            <div className="ab-section-head"><div><h2 id="ab-trend">시청자 추이</h2>{trendInsight && <p className="ab-insight">{trendInsight}</p>}</div><Seg label="기간" value={trendTab} onChange={setTrendTab} options={[['today', '오늘'], ['yesterday', '어제', needDays(coverage, 1)], ['d7', '7일', needDays(coverage, 7)], ['d30', '30일', needDays(coverage, 30)]]} /></div>
            <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />치지직 시청자{trendTab === 'd7' || trendTab === 'd30' ? ' (하루 평균)' : ''}</span>{trend.some((p) => p.usual !== null) && <span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />평소</span>}</div>
            <ComboChart height={200} maxBarWidth={trendTab === 'd30' ? 18 : 28} items={trend.map((p, i) => ({ key: `${trendTab}-${i}`, bar: p.chzzk, line: p.usual, tip: p.chzzk === null ? `${p.label} 아직 집계 전` : `${p.label} ${people(p.chzzk)}${p.usual ? ` · 평소 ${people(p.usual)}` : ''}`, label: trend.length <= 7 || (trend.length === 24 ? i % 6 === 0 || i === 23 : (trend.length - 1 - i) % 7 === 0) ? p.label : '' }))} />
          </section>}
          <section className="ab-section ab-brief" aria-labelledby="ab-brief">
            <div><h2 id="ab-brief">지금 판도</h2>{topGame && <p className="ab-insight">「{topGame.name}」가 이끌고 있어요</p>}</div>
            {data.summary && <div className="ab-brief-text"><Lede text={data.summary} /></div>}
            {data.rising.length > 0 && <div className="ab-brief-block"><h3>급상승 게임 <small>지난 7일, 그 전 7일 대비</small></h3>
              <ol className="ab-mini-list">{data.rising.slice(0, 3).map((g) => <li key={g.name}><a {...linkProps(gamePath(g.name), onNavigate)}>{g.name}</a><b className="ab-up">▲ {g.growth}%</b></li>)}</ol></div>}
            {data.nonGame.length > 0 && <div className="ab-brief-block"><h3>게임 외 콘텐츠 <small>지금</small></h3>
              <ol className="ab-mini-list">{data.nonGame.slice(0, 3).map((g) => <li key={g.name}><span>{g.name}</span><b>{people(g.viewers)}</b></li>)}</ol></div>}
          </section>
        </div>

        {/* ③ 어디에 몰리나: 게임 점유와 순위 */}
        {(data.games.now.length > 0 || data.games.d7.length > 0) && <section className="ab-section" aria-labelledby="ab-games">
          <div className="ab-section-head"><div><h2 id="ab-games">인기 게임 순위</h2>{games[0] && <p className="ab-insight">「{games[0].name}」{gameTab === 'now' ? '이 지금' : gameTab === 'today' ? '이 오늘' : '이 최근 7일'} 게임 시청자의 {gameShare(games[0].viewers)}%를 모으고 있어요</p>}</div><Seg label="기간" value={gameTab} onChange={setGameTab} options={[['now', '지금'], ['today', '오늘'], ['d7', '7일', needDays(coverage, 7)]]} /></div>
          {games.length > 0 && <ShareBar items={games.slice(0, 5).map((g) => ({ key: g.name, label: g.name, value: g.viewers }))} other={games.slice(5).reduce((sum, g) => sum + g.viewers, 0)} />}
          <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />시청자{gameTab === 'now' ? '' : ' (시간당 평균)'}</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />방송 수</span></div>
          {games.length ? <ComboChart height={170} lineMax={gameMaxCount} minColWidth={92} items={games.map((g, i) => ({ key: g.name, bar: g.viewers, line: g.broadcasts, tip: `${g.name} · ${people(g.viewers)} · 방송 ${num(g.broadcasts)}개`, label: <a className="ab-col-label" {...linkProps(gamePath(g.name), onNavigate)}><b>{i + 1}. {g.name}</b><small>방송 {num(g.broadcasts)}개</small><em className={`ab-comp ab-comp-${g.competition === '경쟁 없음' ? 'none' : g.competition}`}>{COMPETITION_NOTE[g.competition]}</em>{gameTab !== 'today' && <Move value={g.rankChange} />}</a> }))} /> : <p className="ab-note">이 기간에 집계된 게임이 없어요.</p>}
          <p className="ab-note">여유·보통·혼잡: 방송당 시청자를 같은 시각 모든 게임의 가운데 값과 비교했어요. 여유일수록 새 방송이 시청자를 모으기 쉬워요.</p>
        </section>}

        {/* ④ 누가 모으나: 채널 TOP */}
        {data.channels.length > 0 && <section className="ab-section" aria-labelledby="ab-channels">
          <div className="ab-section-head"><div><h2 id="ab-channels">실시간 채널 순위</h2>{channelInsight && <p className="ab-insight">{channelInsight}</p>}</div><Seg label="채널 범위" value={channelTab} onChange={setChannelTab} options={[['all', '전체'], ['vtuber', '버튜버만']]} /></div>
          {channels.length ? <>
            <ol className="ab-podium">{channels.slice(0, 3).map((c, i) => <li key={c.channelKey} className={`ab-podium-${i + 1}`}>
              <span className="ab-podium-rank">{i + 1}</span>
              {c.imageUrl ? <img className="ab-avatar ab-avatar-md" src={c.imageUrl} alt="" referrerPolicy="no-referrer" /> : <span className="ab-avatar ab-avatar-md" aria-hidden="true" />}
              <a className="ab-name" {...linkProps(activityStreamerPath(c.channelKey), onNavigate)}><b>{c.name}</b><span className="ab-plat"><PlatformIcon platform={c.platform} />{platformLine(c)}</span></a>
              <strong className="ab-podium-viewers">{people(c.viewers)}</strong>
              <span className="ab-note">{c.category}</span>
              {c.liveUrl && <a className="ab-watch" href={c.liveUrl} target="_blank" rel="noopener noreferrer">방송 보기</a>}
            </li>)}</ol>
            {channels.length > 3 && <ChannelRows channels={channels.slice(3, showAllChannels ? 20 : 10)} onNavigate={onNavigate} startRank={4} scaleMax={channels[0].viewers} />}
            {channels.length > 10 && !showAllChannels && <button type="button" className="ab-more" onClick={() => setShowAllChannels(true)}>20위까지 보기</button>}
          </> : <p className="ab-note">지금 방송 중인 버튜버가 순위에 없어요.</p>}
        </section>}

        {/* ⑤ 어떤 방송인가: 태그 */}
        {data.tags.length > 0 && <section className="ab-section" aria-labelledby="ab-tags">
          <div className="ab-section-head"><div><h2 id="ab-tags">방송 태그 순위</h2><p className="ab-insight">#{data.tags[0].tag} 태그 방송에 시청자가 가장 많고, 가장 흔한 태그는 #{[...data.tags].sort((a, b) => b.broadcasts - a.broadcasts)[0].tag}예요</p></div><span className="ab-note">치지직 방송 태그 · 지금</span></div>
          <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />태그 시청자</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />태그 방송 수</span></div>
          <ComboChart height={150} lineMax={tagMaxCount} minColWidth={80} items={data.tags.map((t, i) => ({ key: t.tag, bar: t.viewers, line: t.broadcasts, tip: `#${t.tag} · ${people(t.viewers)} · 방송 ${t.broadcasts}개`, label: <a className="ab-col-label" {...linkProps(tagPath(t.tag), onNavigate)}><b>{i + 1}. #{t.tag}</b><small>방송 {t.broadcasts}개</small></a> }))} />
        </section>}
      </>}

      <p className="ab-foot">숫자를 어떻게 셌는지 궁금하다면 <a {...linkProps('/analytics/method', onNavigate)}>집계 기준</a>을 확인하세요.</p>
    </main>
  </div>;
}
