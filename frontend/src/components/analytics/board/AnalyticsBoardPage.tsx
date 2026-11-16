import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { AnalyticsBoard, BoardGame, BoardPlatform } from '../../../../../shared/analyticsBoard';
import type { StatisticsStreamerSearchResponse } from '../../../../../shared/statisticsStreamerSearch';
import { activityStreamerPath } from '../../../../../shared/activitySeo';
import { ChannelRows, ComboChart, HBars, Lede, Move, PlatformIcon, Seg, asOfLabel, gamePath, linkProps, num, people, tagPath, useHourlyData } from './boardParts';
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ query: string; items: Array<{ key: string; label: string; sub: string; path: string }> } | null>(null);
  useEffect(() => { setPlatform(readPlatform(path)); }, [path]);
  useEffect(() => { document.title = '방송 통계 · 치지직·SOOP 실시간 판도 | VDébut'; }, []);
  const { data, error, loading, reload } = useHourlyData<AnalyticsBoard>(`/api/analytics/board?platform=${platform}`);

  const choosePlatform = (next: BoardPlatform) => {
    setPlatform(next);
    onNavigate(next === 'ALL' ? '/analytics' : `/analytics/${next === 'CHZZK' ? 'chzzk' : 'soop'}`);
  };

  const onSearch = async (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (q.startsWith('#')) { onNavigate(tagPath(q)); return; }
    const lower = q.replace(/\s+/g, '').toLowerCase();
    const local: Array<{ key: string; label: string; sub: string; path: string }> = [];
    const games = new Map<string, BoardGame>();
    for (const game of [...(data?.games.now || []), ...(data?.games.d7 || [])]) games.set(game.name, game);
    for (const game of games.values()) if (game.name.replace(/\s+/g, '').toLowerCase().includes(lower)) local.push({ key: `g:${game.name}`, label: game.name, sub: '게임', path: gamePath(game.name) });
    for (const tag of data?.tags || []) if (tag.tag.toLowerCase().includes(lower)) local.push({ key: `t:${tag.tag}`, label: `#${tag.tag}`, sub: '방송 태그', path: tagPath(tag.tag) });
    setResults({ query: q, items: local });
    try {
      const response = await fetch(`/api/analytics/streamers/search?q=${encodeURIComponent(q)}`);
      if (!response.ok) return;
      const found = await response.json() as StatisticsStreamerSearchResponse;
      const channels = found.streamers.slice(0, 10).map((s) => { const key = s.channelKey || `${s.platform}:${s.id}`; return { key: `c:${key}`, label: s.name, sub: s.platform === 'CHZZK' ? '치지직 채널' : 'SOOP 채널', path: activityStreamerPath(key) }; });
      setResults({ query: q, items: [...local, ...channels] });
    } catch { /* 채널 검색 실패 시 게임·태그 결과만 보여 준다. */ }
  };

  const trend = data?.trend[trendTab] || [];
  const games = data?.games[gameTab] || [];
  const channels = useMemo(() => (data?.channels || []).filter((c) => channelTab === 'all' || c.isVtuber).slice(0, 20), [data, channelTab]);
  const gameMaxCount = Math.max(1, ...games.map((g) => g.broadcasts));
  const tagMaxCount = Math.max(1, ...(data?.tags || []).map((t) => t.broadcasts));

  return <div className="ab">
    <main className="ab-main">
      <section className="ab-head" aria-label="제목과 조회 조건">
        <div className="ab-head-row">
          <div>
            <h1>방송 통계</h1>
            <p className="ab-subtitle">매시 정각마다 새로 집계해요{data?.asOf ? ` · ${asOfLabel(data.asOf)}` : ''}</p>
          </div>
          <form className="ab-search" role="search" onSubmit={onSearch}>
            <label htmlFor="ab-q" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>채널·게임·태그 검색</label>
            <input id="ab-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="채널, 게임, #태그 검색" maxLength={80} />
            <button type="submit">검색</button>
          </form>
        </div>
        <div className="ab-filter" role="group" aria-label="플랫폼">
          {(['ALL', 'CHZZK', 'SOOP'] as const).map((p) => <button key={p} type="button" aria-pressed={platform === p} onClick={() => choosePlatform(p)}>{p !== 'ALL' && <PlatformIcon platform={p} />}{p === 'ALL' ? '전체' : p === 'CHZZK' ? '치지직' : 'SOOP'}</button>)}
        </div>
      </section>

      {results && <section className="ab-section" aria-labelledby="ab-results">
        <div className="ab-section-head"><h2 id="ab-results">‘{results.query}’ 검색 결과</h2><button type="button" className="ab-more" onClick={() => setResults(null)}>닫기</button></div>
        {results.items.length ? <ul className="ab-results">{results.items.map((item) => <li key={item.key}><a {...linkProps(item.path, onNavigate)}>{item.label}</a><span className="ab-note">{item.sub}</span></li>)}</ul> : <p className="ab-note">찾는 결과가 없어요. 태그는 #을 붙여 검색해 보세요.</p>}
      </section>}

      {error && !data && <div className="ab-error">{error} <button type="button" className="ab-more" onClick={() => void reload()}>다시 불러오기</button></div>}
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {data && !data.asOf && <div className="ab-empty">아직 집계된 기록이 없어요.</div>}

      {data?.asOf && <>
        <Lede text={data.summary} />

        {data.platforms.length > 0 && <section className="ab-cards" aria-label="플랫폼 현황">
          {data.platforms.map((card) => <article key={card.platform} className="ab-card">
            <div className="ab-card-title"><span><PlatformIcon platform={card.platform} />{card.platform === 'CHZZK' ? '치지직' : 'SOOP'}</span>
              {card.usualDelta !== null && <span className={`ab-delta ${card.usualDelta >= 0 ? 'up' : 'down'}`}>평소보다 {card.usualDelta >= 0 ? '▲' : '▼'} {Math.abs(card.usualDelta)}%</span>}</div>
            <div className="ab-big">{num(card.viewers)}<small>명 시청 중</small></div>
            <dl className="ab-kv"><div><dt>오늘 최고</dt><dd>{people(card.peakToday)}</dd></div><div><dt>1,000명 이상 방송</dt><dd>{num(card.bigCount)}개</dd></div></dl>
          </article>)}
        </section>}

        {trend.some((p) => p.chzzk !== null) && <section className="ab-section" aria-labelledby="ab-trend">
          <div className="ab-section-head"><h2 id="ab-trend">시청자 추이</h2><Seg label="기간" value={trendTab} onChange={setTrendTab} options={[['today', '오늘'], ['yesterday', '어제'], ['d7', '7일'], ['d30', '30일']]} /></div>
          <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />치지직 시청자{trendTab === 'd7' || trendTab === 'd30' ? ' (하루 평균)' : ''}</span>{trend.some((p) => p.usual !== null) && <span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />평소</span>}</div>
          <ComboChart height={220} maxBarWidth={trendTab === 'd30' ? 18 : 32} items={trend.map((p, i) => ({ key: `${trendTab}-${i}`, bar: p.chzzk, line: p.usual, tip: p.chzzk === null ? `${p.label} 아직 집계 전` : `${p.label} ${people(p.chzzk)}${p.usual ? ` · 평소 ${people(p.usual)}` : ''}`, label: trend.length <= 7 || (trend.length === 24 ? i % 6 === 0 || i === 23 : (trend.length - 1 - i) % 7 === 0) ? p.label : '' }))} />
        </section>}

        {(data.games.now.length > 0 || data.games.d7.length > 0) && <section className="ab-section" aria-labelledby="ab-games">
          <div className="ab-section-head"><h2 id="ab-games">인기 게임 순위</h2><Seg label="기간" value={gameTab} onChange={setGameTab} options={[['now', '지금'], ['today', '오늘'], ['d7', '7일']]} /></div>
          <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />시청자{gameTab === 'now' ? '' : ' (시간당 평균)'}</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />방송 수</span></div>
          {games.length ? <ComboChart height={200} lineMax={gameMaxCount} minColWidth={92} items={games.map((g, i) => ({ key: g.name, bar: g.viewers, line: g.broadcasts, tip: `${g.name} · ${people(g.viewers)} · 방송 ${num(g.broadcasts)}개`, label: <a className="ab-col-label" {...linkProps(gamePath(g.name), onNavigate)}><b>{i + 1}. {g.name}</b><small>방송 {num(g.broadcasts)}개</small><em>{COMPETITION_NOTE[g.competition]}{gameTab !== 'today' && <> · <Move value={g.rankChange} /></>}</em></a> }))} /> : <p className="ab-note">이 기간에 집계된 게임이 없어요.</p>}
          <p className="ab-note">여유·보통·혼잡은 방송당 시청자를 같은 시각 모든 게임의 가운데 값과 비교한 결과예요.</p>
        </section>}

        {(data.rising.length > 0 || data.nonGame.length > 0) && <div className="ab-cols">
          {data.rising.length > 0 && <section className="ab-section" aria-labelledby="ab-rising"><h2 id="ab-rising">급상승 게임</h2><p className="ab-note">지난 7일 시청자가 그 전 7일보다 30% 이상 늘어난 게임</p>
            <HBars rows={data.rising.map((g) => ({ key: g.name, name: <a {...linkProps(gamePath(g.name), onNavigate)}>{g.name}</a>, value: g.growth, text: `▲ ${g.growth}%`, color: 'var(--ab-accent)' }))} /></section>}
          {data.nonGame.length > 0 && <section className="ab-section" aria-labelledby="ab-nongame"><h2 id="ab-nongame">게임 외 콘텐츠</h2><p className="ab-note">토크·노래 등 지금 시청자 순</p>
            <HBars rows={data.nonGame.map((g) => ({ key: g.name, name: <span>{g.name}</span>, value: g.viewers, text: people(g.viewers) }))} /></section>}
        </div>}

        {data.tags.length > 0 && <section className="ab-section" aria-labelledby="ab-tags">
          <div className="ab-section-head"><h2 id="ab-tags">방송 태그 순위</h2><span className="ab-note">치지직 방송 태그 · 지금</span></div>
          <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />태그 시청자</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />태그 방송 수</span></div>
          <ComboChart height={180} lineMax={tagMaxCount} minColWidth={80} items={data.tags.map((t, i) => ({ key: t.tag, bar: t.viewers, line: t.broadcasts, tip: `#${t.tag} · ${people(t.viewers)} · 방송 ${t.broadcasts}개`, label: <a className="ab-col-label" {...linkProps(tagPath(t.tag), onNavigate)}><b>{i + 1}. #{t.tag}</b><small>방송 {t.broadcasts}개</small></a> }))} />
        </section>}

        {data.channels.length > 0 && <section className="ab-section" aria-labelledby="ab-channels">
          <div className="ab-section-head"><h2 id="ab-channels">실시간 채널 순위</h2><Seg label="채널 범위" value={channelTab} onChange={setChannelTab} options={[['all', '전체'], ['vtuber', '버튜버만']]} /></div>
          {channels.length ? <ChannelRows channels={channels} onNavigate={onNavigate} /> : <p className="ab-note">지금 방송 중인 버튜버가 순위에 없어요.</p>}
        </section>}
      </>}

      <p className="ab-foot">숫자를 어떻게 셌는지 궁금하다면 <a {...linkProps('/analytics/method', onNavigate)}>집계 기준</a>을 확인하세요.</p>
    </main>
  </div>;
}
