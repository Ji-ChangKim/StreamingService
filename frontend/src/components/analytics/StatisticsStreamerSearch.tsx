import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { BroadcastStatistics } from '../../../../shared/broadcastStatistics';
import type { StatisticsStreamer, StatisticsStreamerSearchResponse } from '../../../../shared/statisticsStreamerSearch';
import { normalizeStreamerQuery } from '../../../../shared/statisticsStreamerSearch';
import { aggregateStatisticsCategories, platformName, safeStatisticsUrl, type StatisticsCategory } from './statisticsModel';
import { mergeStatisticsStreamers } from './statisticsSearchModel';
import { StatisticsBrand } from './StatisticsBrand';

interface SearchProps {
  data: BroadcastStatistics | null;
  onSelectStreamer: (streamer: StatisticsStreamer) => void;
  onSelectCategory: (category: StatisticsCategory) => void;
}

export interface RegisterResult {
  success: boolean;
  streamer: StatisticsStreamer;
  message?: string;
}

// 1. 외부 스트리머 VDébut 등록 API 호출 전용 함수 (단일 책임)
async function registerStreamerToVDebut(streamer: StatisticsStreamer): Promise<RegisterResult> {
  if (streamer.isRegistered || !streamer.channelUrl) {
    return { success: true, streamer };
  }
  try {
    const res = await fetch('/api/analytics/streamers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        platform: streamer.platform,
        channelKey: streamer.channelKey,
        name: streamer.name,
        channelUrl: streamer.channelUrl,
        imageUrl: streamer.imageUrl,
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return {
        success: false,
        streamer,
        message: '서버와 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.',
      };
    }
    const data = await res.json() as { success: boolean; slug?: string; message?: string };
    if (data.success && data.slug) {
      return {
        success: true,
        streamer: {
          ...streamer,
          isRegistered: true,
          profileSlug: data.slug,
        },
        message: data.message || 'VDébut에 스트리머가 등록되었습니다.',
      };
    }
    return {
      success: false,
      streamer,
      message: data.message || '스트리머 등록에 실패했습니다.',
    };
  } catch {
    return {
      success: false,
      streamer,
      message: '네트워크 연결 상태를 확인하고 다시 시도해 주세요.',
    };
  }
}

// 2. 서버 검색 훅: 입력을 잠깐 기다리고, 앞선 검색 응답이 최신 결과를 덮지 않게 한다 (단일 책임)
function useRegisteredStreamerSearch(query: string, attempt: number) {
  const [result, setResult] = useState<StatisticsStreamerSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let timeout: number | undefined;
    setResult(null);
    setError(false);
    setLoading(!!normalizeStreamerQuery(query));
    if (!normalizeStreamerQuery(query)) return () => controller.abort();
    const timer = window.setTimeout(async () => {
      timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`/api/analytics/streamers/search?q=${encodeURIComponent(query.trim())}&external=true`, { signal: controller.signal });
        if (!response.ok) throw new Error('Search unavailable');
        const next: StatisticsStreamerSearchResponse = await response.json();
        if (!Array.isArray(next.streamers)) throw new Error('Invalid search response');
        if (!disposed) setResult(next);
      } catch { if (!disposed) setError(true); }
      finally { window.clearTimeout(timeout); if (!disposed) setLoading(false); }
    }, 250);
    return () => { disposed = true; controller.abort(); window.clearTimeout(timer); window.clearTimeout(timeout); };
  }, [query, attempt]);
  return { result: result?.query === normalizeStreamerQuery(query) ? result : null, loading, error };
}

// 3. 검색 폼, 드롭다운 옵션 선택 및 등록 연동 컴포넌트
export function StatisticsStreamerSearch({ data, onSelectStreamer, onSelectCategory }: SearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [attempt, setAttempt] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [registeredOverrides, setRegisteredOverrides] = useState<Record<string, { isRegistered: boolean; profileSlug?: string | null }>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<number | null>(null);

  const { result, loading, error } = useRegisteredStreamerSearch(query, attempt);
  const rawStreamers = useMemo(() => mergeStatisticsStreamers(query, result?.streamers || [], data), [query, result, data]);
  
  // 등록 성공한 스트리머는 실시간으로 isRegistered: true로 반영
  const streamers = useMemo(() => rawStreamers.map((s) => {
    const key = s.channelKey || s.id;
    const override = registeredOverrides[key];
    if (override) {
      return { ...s, isRegistered: override.isRegistered, profileSlug: override.profileSlug || s.profileSlug };
    }
    return s;
  }), [rawStreamers, registeredOverrides]);

  const categories = useMemo(() => normalizeStreamerQuery(query) ? aggregateStatisticsCategories(data?.lives || []).filter((category) => normalizeStreamerQuery(category.name).includes(normalizeStreamerQuery(query))).slice(0, 5) : [], [query, data]);
  const options = [...streamers.map((streamer) => ({ key: streamer.channelKey || streamer.id, streamer, category: null })), ...categories.map((category) => ({ key: category.key, streamer: null, category }))];
  const visible = open && !!normalizeStreamerQuery(query);

  const showFeedback = (message: string, type: 'success' | 'info' | 'error') => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    setFeedback({ message, type });
    feedbackTimer.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = null;
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);

  useEffect(() => { setActive(-1); }, [query]);
  useEffect(() => { if (active >= 0) document.getElementById(`bs-search-option-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active]);

  const select = async (index: number) => {
    const option = options[index];
    if (!option) return;
    setOpen(false);
    input.current?.focus();

    if (option.streamer) {
      if (!option.streamer.isRegistered) {
        setRegistering(true);
        showFeedback(`${option.streamer.name} 스트리머를 VDébut에 등록하고 있어요…`, 'info');
        try {
          const res = await registerStreamerToVDebut(option.streamer);
          if (res.success) {
            const key = option.streamer.channelKey || option.streamer.id;
            setRegisteredOverrides((prev) => ({
              ...prev,
              [key]: { isRegistered: true, profileSlug: res.streamer.profileSlug },
            }));
            showFeedback(`🎉 ${option.streamer.name} 스트리머가 VDébut에 등록되었습니다!`, 'success');
          } else {
            showFeedback(res.message || '스트리머 등록을 완료하지 못했습니다.', 'error');
          }
          onSelectStreamer(res.streamer);
        } finally {
          setRegistering(false);
        }
      } else {
        onSelectStreamer(option.streamer);
      }
    } else if (option.category) {
      onSelectCategory(option.category);
    }
  };

  return <div className="bs-streamer-search" ref={container}>
    <form className="bs-search-form" role="search" onSubmit={(event) => { event.preventDefault(); setOpen(true); if (error) setAttempt((value) => value + 1); input.current?.focus(); }}>
      <Search size={17} aria-hidden="true" />
      <label className="bs-sr-only" htmlFor="bs-streamer-search">스트리머·카테고리 검색</label>
      <input ref={input} id="bs-streamer-search" type="text" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls="bs-search-options" aria-activedescendant={visible && active >= 0 && options[active] ? `bs-search-option-${active}` : undefined} value={query} maxLength={80} placeholder="스트리머 이름으로 검색 (치지직 · SOOP)" autoComplete="off" onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive((index) => options.length ? event.key === 'ArrowDown' ? (index + 1) % options.length : (index <= 0 ? options.length - 1 : index - 1) : -1); }
        if (event.key === 'Enter' && visible && active >= 0) { event.preventDefault(); void select(active); }
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActive(-1); }
      }} />
      {query && <button type="button" className="bs-search-clear" aria-label="검색어 지우기" onClick={() => { setQuery(''); setActive(-1); input.current?.focus(); }}><X size={14} /></button>}
      <button type="submit" className="bs-search-submit">검색</button>
    </form>
    {feedback && (
      <div className={`bs-feedback-banner bs-feedback-${feedback.type}`} role="status">
        {feedback.message}
      </div>
    )}
    <p className="bs-search-hint">치지직과 SOOP의 모든 스트리머를 검색하고 방송 통계를 확인하세요.</p>
    {visible && <div className="bs-search-results bs-streamer-results">
      <p className="bs-search-summary" role="status">
        {loading ? '치지직·SOOP 스트리머를 찾고 있어요…' : `스트리머 ${streamers.length}명 · 카테고리 ${categories.length}개`}
      </p>
      {error && <p className="bs-search-error" role="alert">스트리머 검색이 지연되고 있어요. 수집된 방송 결과를 먼저 보여드려요. <button type="button" onClick={() => setAttempt((value) => value + 1)}>다시 시도</button></p>}
      {registering && <p className="bs-search-hint" style={{ color: '#4338ca', padding: '4px 8px' }}>스트리머 정보를 연결하고 있어요…</p>}
      <div id="bs-search-options" role="listbox" aria-label="검색 결과">
        {options.map((option, index) => {
          const live = option.streamer?.channelKey ? data?.lives.find((row) => row.channelKey === option.streamer?.channelKey) : null;
          const isLiveNow = option.streamer?.isLive || Boolean(live);
          const avatar = safeStatisticsUrl(option.streamer?.imageUrl || null);
          return <button type="button" role="option" aria-selected={active === index} id={`bs-search-option-${index}`} key={option.key} onClick={() => void select(index)}>
            {option.streamer ? <>
              <span className="bs-search-avatar">{avatar ? <img src={avatar} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : option.streamer.name.slice(0, 1)}</span>
              <span className="bs-search-person">
                <strong>
                  {option.streamer.name}
                  {isLiveNow && <span className="bs-live-tag">LIVE</span>}
                  {option.streamer.isRegistered ? (
                    <span className="bs-badge-tag bs-badge-registered">VDébut 등록</span>
                  ) : (
                    <span className="bs-badge-tag bs-badge-external">플랫폼 검색</span>
                  )}
                </strong>
                <span className="bs-small">
                  {platformName(option.streamer.platform)} · 스트리머
                  {option.streamer.followerCount !== undefined && ` · 팔로워 ${option.streamer.followerCount.toLocaleString()}명`}
                </span>
              </span>
              <StatisticsBrand platform={option.streamer.platform} label={false} />
            </> : <>
              <span className="bs-search-avatar"><Search size={16} /></span>
              <span className="bs-search-person">
                <strong>{option.category!.name}</strong>
                <span className="bs-small">{platformName(option.category!.platform)} · 카테고리</span>
              </span>
            </>}
          </button>;
        })}
      </div>
      {!loading && !options.length && <p>검색 결과가 없어요. 이름이나 띄어쓰기를 확인해 주세요.</p>}
      {result?.hasMore && <p>결과 중 25개를 표시했어요. 이름을 더 입력하면 좁혀 볼 수 있어요.</p>}
    </div>}
  </div>;
}

