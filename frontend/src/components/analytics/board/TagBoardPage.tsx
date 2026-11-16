import { useEffect, useState } from 'react';
import type { AnalyticsTagBoard } from '../../../../../shared/analyticsBoard';
import { ChannelRows, HBars, Lede, PlatformIcon, asOfLabel, gamePath, linkProps, num, people, tagPath, useHourlyData } from './boardParts';
import './analyticsBoard.css';

// 태그 채널 목록(정의서 7.3-1). 태그 기록 저장 전이라 지금 방송 기준만 보여 준다.
export function TagBoardPage({ tag, onNavigate }: { tag: string; onNavigate: (path: string) => void }) {
  const { data, error, loading, missing } = useHourlyData<AnalyticsTagBoard>(`/api/analytics/board/tag?tag=${encodeURIComponent(tag)}`);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setShowAll(false); document.title = `#${data?.tag || tag} 태그 방송 · 지금 방송 중인 채널 | VDébut`; }, [data, tag]);
  const channels = data ? (showAll ? data.channels : data.channels.slice(0, 10)) : [];

  return <div className="ab">
    <main className="ab-main">
      <nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 방송 태그 순위 / #{data?.tag || tag}</nav>
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {error && !data && <div className="ab-error">{error}</div>}
      {missing && <div className="ab-empty">지금 #{tag} 태그로 방송 중인 채널이 없어요. <a {...linkProps('/analytics', onNavigate)}>방송 통계로 돌아가기</a></div>}
      {data && <>
        <section className="ab-head">
          <div><h1>#{data.tag}</h1><p className="ab-subtitle"><PlatformIcon platform="CHZZK" />치지직 방송 태그{data.rank ? ` · 태그 순위 ${data.rank}위` : ''} · {asOfLabel(data.asOf)}</p></div>
          <dl className="ab-kv">
            <div><dt>지금 방송 수</dt><dd className="ab-kv-large">{num(data.now.broadcasts)}개</dd></div>
            <div><dt>지금 시청자</dt><dd className="ab-kv-large">{people(data.now.viewers)}</dd></div>
            <div><dt>방송당 시청자</dt><dd className="ab-kv-large">{data.now.perBroadcast ? people(data.now.perBroadcast) : '—'}</dd></div>
          </dl>
        </section>

        <Lede text={data.summary} />

        <section className="ab-section" aria-labelledby="ab-tag-list">
          <h2 id="ab-tag-list">#{data.tag} 태그로 지금 방송 중인 채널</h2>
          <ChannelRows channels={channels} onNavigate={onNavigate} />
          {data.channels.length > 10 && !showAll && <button type="button" className="ab-more" onClick={() => setShowAll(true)}>{data.channels.length}개 모두 보기</button>}
        </section>

        <div className="ab-cols">
          {data.games.length > 0 && <section className="ab-section" aria-labelledby="ab-tag-games"><h2 id="ab-tag-games">#{data.tag} 방송이 많이 한 콘텐츠</h2>
            <HBars rows={data.games.map((g) => ({ key: g.name, name: <a {...linkProps(gamePath(g.name), onNavigate)}>{g.name}</a>, value: g.broadcasts, text: `${g.broadcasts}개`, color: 'var(--ab-text)' }))} /></section>}
          {data.withTags.length > 0 && <section className="ab-section" aria-labelledby="ab-tag-with"><h2 id="ab-tag-with">함께 많이 쓴 태그</h2>
            <ul className="ab-chips">{data.withTags.map((t) => <li key={t.tag}><a {...linkProps(tagPath(t.tag), onNavigate)}>#{t.tag} <small>{t.broadcasts}개</small></a></li>)}</ul></section>}
        </div>
      </>}
    </main>
  </div>;
}
