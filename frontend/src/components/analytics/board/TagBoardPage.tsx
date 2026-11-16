import { useEffect, useState } from 'react';
import type { AnalyticsTagBoard } from '../../../../../shared/analyticsBoard';
import { activityStreamerPath } from '../../../../../shared/activitySeo';
import { ChannelRows, ComboChart, Lede, PlatformIcon, Seg, ShareBar, Sparkline, asOfLabel, gamePath, linkProps, num, people, platformLine, tagPath, useHourlyData } from './boardParts';
import './analyticsBoard.css';

// 태그 채널 목록(정의서 7.3-1): 한눈에 → 흐름·구성 → 누가 하고 있나.
export function TagBoardPage({ tag, onNavigate }: { tag: string; onNavigate: (path: string) => void }) {
  const { data, error, loading, missing } = useHourlyData<AnalyticsTagBoard>(`/api/analytics/board/tag?tag=${encodeURIComponent(tag)}`);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setShowAll(false); document.title = `#${data?.tag || tag} 태그 방송 · 지금 방송 중인 채널 | VDébut`; }, [data, tag]);
  const [trendTab, setTrendTab] = useState<'today' | 'yesterday' | 'd7' | 'd30'>('today');
  const trend = data?.trend?.[trendTab] || [];
  const hasTrend = trend.some((p) => p.viewers !== null);
  const channels = data?.channels || [];
  const topGame = data?.games[0];
  const topShare = channels.length >= 4 ? Math.round(channels.slice(0, 3).reduce((s, c) => s + c.viewers, 0) / Math.max(1, data?.now.viewers || 1) * 100) : null;
  const trendInsight = (() => {
    const points = trend.filter((p) => p.viewers !== null);
    if (!points.length) return '';
    const top = points.reduce((a, b) => ((b.viewers || 0) > (a.viewers || 0) ? b : a));
    return `${top.label}에 #${data?.tag} 방송을 가장 많이 봤어요 (${people(top.viewers)})`;
  })();
  const gameTotal = (data?.games || []).reduce((s, g) => s + g.broadcasts, 0);

  return <div className="ab">
    <main className="ab-main">
      <nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 방송 태그 순위 / #{data?.tag || tag}</nav>
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {error && !data && <div className="ab-error">{error}</div>}
      {missing && <div className="ab-empty">지금 #{tag} 태그로 방송 중인 채널이 없어요. <a {...linkProps('/analytics', onNavigate)}>방송 통계로 돌아가기</a></div>}
      {data && <>
        <section className="ab-head">
          <div><span className="ab-eyebrow">Broadcast tag</span><h1>#{data.tag}</h1><p className="ab-subtitle"><PlatformIcon platform="CHZZK" />치지직 방송 태그 · {asOfLabel(data.asOf)}</p></div>
        </section>

        {/* ① 한눈에 */}
        <section className="ab-kpis-grid" aria-label="지금 한눈에">
          <article className="ab-kpi ab-kpi-hero">
            <header>지금 #{data.tag} 시청자</header>
            <div className="ab-kpi-value"><strong>{num(data.now.viewers)}</strong><span>명</span></div>
            {data.rank && <span className="ab-chip">태그 순위 {data.rank}위</span>}
            <Sparkline values={(data.trend?.today || []).map((p) => p.viewers)} />
          </article>
          <article className="ab-kpi">
            <header>지금 방송 수</header>
            <div className="ab-kpi-value"><strong>{num(data.now.broadcasts)}</strong><span>개</span></div>
            <p>치지직 인기 방송 상위 100개 중</p>
          </article>
          <article className="ab-kpi">
            <header>방송당 시청자</header>
            <div className="ab-kpi-value"><strong>{data.now.perBroadcast ? num(data.now.perBroadcast) : '—'}</strong>{data.now.perBroadcast ? <span>명</span> : null}</div>
            {topShare !== null && <p>상위 3개 채널이 <b>{topShare}%</b></p>}
          </article>
          <article className="ab-kpi">
            <header>가장 많이 함께 한 콘텐츠</header>
            {topGame ? <a className="ab-kpi-value ab-kpi-name" {...linkProps(gamePath(topGame.name), onNavigate)}><strong>{topGame.name}</strong></a> : <div className="ab-kpi-value"><strong>—</strong></div>}
            {topGame && <p>지금 <b>{topGame.broadcasts}개</b> 방송</p>}
          </article>
        </section>

        <Lede text={data.summary} />

        {/* ② 흐름 + 구성 */}
        <div className="ab-layout">
          {hasTrend && <section className="ab-section ab-span-2" aria-labelledby="ab-tag-trend">
            <div className="ab-section-head"><div><h2 id="ab-tag-trend">#{data.tag} 추이</h2>{trendInsight && <p className="ab-insight">{trendInsight}</p>}</div><Seg label="기간" value={trendTab} onChange={setTrendTab} options={[['today', '오늘'], ['yesterday', '어제'], ['d7', '7일'], ['d30', '30일']]} /></div>
            <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />태그 시청자{trendTab === 'd7' || trendTab === 'd30' ? ' (정각 평균)' : ''}</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />태그 방송 수</span></div>
            <ComboChart height={200} maxBarWidth={trendTab === 'd30' ? 18 : 28} lineMax={Math.max(1, ...trend.map((p) => p.broadcasts ?? 0))}
              items={trend.map((p, i) => ({ key: `${trendTab}-${i}`, bar: p.viewers, line: p.broadcasts, tip: p.viewers === null ? `${p.label} 기록 없음` : `${p.label} · ${people(p.viewers)} · 방송 ${p.broadcasts}개`, label: trend.length <= 7 || (trend.length === 24 ? i % 6 === 0 || i === 23 : (trend.length - 1 - i) % 7 === 0) ? p.label : '' }))} />
          </section>}
          <section className={`ab-section ab-brief${hasTrend ? '' : ' ab-span-3'}`} aria-labelledby="ab-tag-mix">
            <div><h2 id="ab-tag-mix">#{data.tag} 방송은 무엇을 하나</h2>{topGame && <p className="ab-insight">「{topGame.name}」 방송이 가장 많아요</p>}</div>
            {data.games.length > 0 && <div className="ab-brief-block" style={{ borderTop: 0, paddingTop: 0 }}><h3>콘텐츠 구성 <small>지금 방송 수 기준</small></h3>
              <ShareBar items={data.games.slice(0, 4).map((g) => ({ key: g.name, label: g.name, value: g.broadcasts, href: gamePath(g.name) }))} other={Math.max(0, gameTotal - data.games.slice(0, 4).reduce((s, g) => s + g.broadcasts, 0))} /></div>}
            {data.withTags.length > 0 && <div className="ab-brief-block"><h3>함께 많이 쓴 태그</h3>
              <ul className="ab-chips">{data.withTags.map((t) => <li key={t.tag}><a {...linkProps(tagPath(t.tag), onNavigate)}>#{t.tag} <small>{t.broadcasts}개</small></a></li>)}</ul></div>}
          </section>
        </div>

        {/* ③ 누가 하고 있나 */}
        <section className="ab-section" aria-labelledby="ab-tag-list">
          <div><h2 id="ab-tag-list">#{data.tag} 태그로 지금 방송 중인 채널</h2>{topShare !== null && <p className="ab-insight">상위 3개 채널이 이 태그 시청자의 {topShare}%를 모으고 있어요</p>}</div>
          <ol className="ab-podium">{channels.slice(0, 3).map((c, i) => <li key={c.channelKey} className={`ab-podium-${i + 1}`}>
            <span className="ab-podium-rank">{i + 1}</span>
            {c.imageUrl ? <img className="ab-avatar ab-avatar-md" src={c.imageUrl} alt="" referrerPolicy="no-referrer" /> : <span className="ab-avatar ab-avatar-md" aria-hidden="true" />}
            <a className="ab-name" {...linkProps(activityStreamerPath(c.channelKey), onNavigate)}><b>{c.name}</b><span className="ab-plat"><PlatformIcon platform={c.platform} />{platformLine(c)}</span></a>
            <strong className="ab-podium-viewers">{people(c.viewers)}</strong>
            <span className="ab-note">{c.category}</span>
            {c.liveUrl && <a className="ab-watch" href={c.liveUrl} target="_blank" rel="noopener noreferrer">방송 보기</a>}
          </li>)}</ol>
          {channels.length > 3 && <ChannelRows channels={channels.slice(3, showAll ? undefined : 10)} onNavigate={onNavigate} startRank={4} scaleMax={channels[0].viewers} />}
          {channels.length > 10 && !showAll && <button type="button" className="ab-more" onClick={() => setShowAll(true)}>{channels.length}개 모두 보기</button>}
        </section>
      </>}
    </main>
  </div>;
}
