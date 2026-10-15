import { useEffect, useRef, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import type { StatisticsStreamer, StatisticsStreamerSearchResponse } from '../../../../shared/statisticsStreamerSearch';
import { StatisticsBrand } from './StatisticsBrand';
import { safeStatisticsUrl } from './statisticsModel';
import { activityStreamerPath } from '../../../../shared/activitySeo';

// 검색은 공개 채널을 조회하며 등록 작업을 실행하지 않는다.
export async function findActivityStreamers(query: string, signal: AbortSignal, platform = 'ALL'): Promise<StatisticsStreamerSearchResponse> {
  const response = await fetch(`/api/analytics/streamers/search?q=${encodeURIComponent(query)}&external=true&platform=${platform}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
  if (!response.ok) throw new Error('검색 결과를 불러오지 못했습니다. 다시 시도해 주세요.');
  return response.json();
}

// 검색 결과에서 이름과 플랫폼을 확인하고 상세 통계로 이동한다.
export function ActivityStreamerCard({ streamer, onOpen }: { streamer: StatisticsStreamer; onOpen: (streamer: StatisticsStreamer) => void }) {
  const image = safeStatisticsUrl(streamer.imageUrl);
  return <article className="ad-search-card">
    <div className="ad-avatar">{image ? <img src={image} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} /> : streamer.name.slice(0, 1)}</div>
    <div className="ad-search-identity"><h3>{streamer.name}</h3><StatisticsBrand platform={streamer.platform} />{streamer.isLive && <span className="ad-live">방송 중</span>}</div>
    {streamer.channelKey && <a className="bs-button" href={`${activityStreamerPath(streamer.channelKey)}?name=${encodeURIComponent(streamer.name)}`} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(streamer); }}>상세 통계 <ArrowUpRight size={14} /></a>}
  </article>;
}

// 방향키·Enter로 채널을 선택하고 Enter 검색으로 전체 결과를 조회한다.
export function ActivityStreamerSearch({ initialQuery, onSearch, onOpen }: { initialQuery: string; onSearch: (query: string) => void; onOpen: (streamer: StatisticsStreamer) => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<StatisticsStreamer[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { setQuery(initialQuery); setOpen(false); }, [initialQuery]);
  useEffect(() => {
    const controller = new AbortController();
    setResults([]); setActive(-1); setError('');
    if (!query.trim()) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    const timer = window.setTimeout(() => {
      void findActivityStreamers(query.trim(), controller.signal).then((result) => {
        if (!controller.signal.aborted) setResults(result.streamers.slice(0, 5));
      }).catch(() => { if (!controller.signal.aborted) setError('검색 결과를 불러오지 못했습니다.'); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  return <div className="ad-search" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <form role="search" className="ad-search-form" onSubmit={(event) => { event.preventDefault(); setOpen(false); onSearch(query.trim()); }}>
      <Search size={19} aria-hidden="true" /><label className="bs-sr-only" htmlFor="ad-streamer-search">스트리머 검색</label>
      <input id="ad-streamer-search" placeholder="스트리머 검색" value={query} maxLength={80} autoComplete="off"
        role="combobox" aria-expanded={open && Boolean(query.trim())} aria-controls="ad-search-results" aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `ad-search-result-${active}` : undefined}
        onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Escape') { setOpen(false); setActive(-1); }
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
            event.preventDefault(); setOpen(true);
            setActive((index) => event.key === 'ArrowDown' ? (index + 1) % results.length : (index - 1 + results.length) % results.length);
          }
          if (event.key === 'Enter' && open && active >= 0 && results[active]?.channelKey) {
            event.preventDefault(); setOpen(false); onOpen(results[active]);
          }
        }} />
      <button type="submit" className="bs-button bs-primary">검색</button>
    </form>
    {open && query.trim() && <div className="ad-suggestions">
      <div role="listbox" id="ad-search-results" aria-label="스트리머 검색 결과">
        {results.map((streamer, index) => <a role="option" id={`ad-search-result-${index}`} key={streamer.channelKey || streamer.id}
          href={streamer.channelKey ? `${activityStreamerPath(streamer.channelKey)}?name=${encodeURIComponent(streamer.name)}` : undefined}
          aria-selected={active === index} aria-disabled={!streamer.channelKey} onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); if (streamer.channelKey) { setOpen(false); onOpen(streamer); } }}><span>{streamer.name}</span><StatisticsBrand platform={streamer.platform} /><ArrowUpRight size={14} /></a>)}
      </div>
      <p role="status">{loading ? '검색 중…' : error || (!results.length ? '검색 결과가 없습니다.' : '채널을 선택하면 상세 통계로 이동합니다.')}</p>
    </div>}
  </div>;
}
