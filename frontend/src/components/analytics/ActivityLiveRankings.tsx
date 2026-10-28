// 외부 제목의 의심 표현을 공개 화면에서 제외한다.
import { publicBroadcastTitle } from '../../../../shared/contentReview';
import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowUpRight, RefreshCw, Users } from 'lucide-react';
import type { StatisticsBroadcast } from '../../../../shared/broadcastStatistics';
import type { StatisticsStreamer } from '../../../../shared/statisticsStreamerSearch';
import { activityChannelKey } from '../../../../shared/broadcastActivity';
import { useBroadcastStatistics } from './useBroadcastStatistics';
import { aggregateStatisticsCategories, categoryKey, countFormat, safeStatisticsUrl, statisticsTime } from './statisticsModel';
import { StatisticsBrand } from './StatisticsBrand';
import { activityCategoryColor } from './activityColors';
import { activityStreamerPath } from '../../../../shared/activitySeo';

// 실시간 순위의 조회 조건은 기간별 통계와 독립적으로 복원한다.
function readLiveLocation() {
  const params = new URLSearchParams(window.location.search);
  const platform = params.get('livePlatform');
  return { platform: platform === 'CHZZK' || platform === 'SOOP' ? platform : 'ALL', category: params.get('liveCategory') || '' } as { platform: 'ALL' | 'CHZZK' | 'SOOP'; category: string };
}

// 방송의 공개 채널 정보로 개인 통계의 조회 대상을 만든다.
function liveStreamer(row: StatisticsBroadcast): StatisticsStreamer | null {
  const key = row.channelKey || (row.channelUrl ? activityChannelKey(row.platform, row.channelUrl) : null);
  return key && (row.platform === 'CHZZK' || row.platform === 'SOOP') ? { id: key, channelKey: key, platform: row.platform,
    name: row.channelName || key.split(':')[1], channelUrl: row.channelUrl, imageUrl: row.imageUrl, profileSlug: null } : null;
}

// 방송 순위의 이름·제목·시청자 수를 작은 화면에서도 한 행에서 읽게 한다.
function LiveBroadcastRow({ row, rank, maxViewers, onOpen }: { row: StatisticsBroadcast; rank: number; maxViewers: number; onOpen: (streamer: StatisticsStreamer) => void }) {
  const image = safeStatisticsUrl(row.imageUrl);
  const streamer = liveStreamer(row);
  const liveUrl = safeStatisticsUrl(row.liveUrl);
  const ratio = maxViewers > 0 ? Math.min(100, Math.round((row.viewers / maxViewers) * 100)) : 0;

  return (
    <li className="ad-live-row">
      <span className={`ad-rank ${rank === 1 ? 'ad-rank-1' : rank === 2 ? 'ad-rank-2' : rank === 3 ? 'ad-rank-3' : ''}`}>
        {rank}
      </span>
      <span className="ad-live-avatar">
        {image ? (
          <img src={image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        ) : (
          <Users size={18} />
        )}
      </span>
      <div className="ad-live-identity">
        <div className="ad-live-name-line">
          {streamer ? (
            <a
              href={`${activityStreamerPath(streamer.channelKey!)}?name=${encodeURIComponent(streamer.name)}`}
              className="ad-channel-link"
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onOpen(streamer);
              }}
            >
              {streamer.name}
            </a>
          ) : (
            <strong>{row.channelName || '채널 정보 없음'}</strong>
          )}
          <span className="ad-live-category-badge">{row.categoryName}</span>
        </div>
        <p className="ad-live-stream-title" title={publicBroadcastTitle(row.title)}>
          {publicBroadcastTitle(row.title)}
        </p>
        <div className="ad-live-tags">
          <StatisticsBrand platform={row.platform} label={false} />
          <div className="ad-viewers-bar-track">
            <div className="ad-viewers-bar-fill" style={{ width: `${ratio}%` }} />
          </div>
        </div>
      </div>
      <div className="ad-live-count">
        <strong>{countFormat(row.viewers)}<small>명</small></strong>
        {liveUrl && (
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="ad-watch-link" aria-label={`${row.channelName || '방송'} 방송 보기 (새 창)`}>
            방송 보기 <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </li>
  );
}

// 현재 방송만 순위를 매기고 누락·지연·실패는 빈 방송으로 대체하지 않는다.
export function ActivityLiveRankings({ onOpen }: { onOpen: (streamer: StatisticsStreamer) => void }) {
  const { data, loading, error, refresh } = useBroadcastStatistics();
  const [filters, setFilters] = useState(readLiveLocation);
  const [broadcastLimit, setBroadcastLimit] = useState(10);
  const [categoryLimit, setCategoryLimit] = useState(10);
  const [sort, setSort] = useState<'viewers' | 'channels'>('viewers');
  useEffect(() => { const sync = () => setFilters(readLiveLocation()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  useEffect(() => { setBroadcastLimit(10); setCategoryLimit(10); }, [filters.platform, filters.category]);
  const navigate = (next: typeof filters) => {
    const params = new URLSearchParams(window.location.search);
    params.delete('livePlatform'); params.delete('liveCategory');
    if (next.platform !== 'ALL') params.set('livePlatform', next.platform);
    if (next.category) params.set('liveCategory', next.category);
    window.history.pushState(window.history.state, '', `${window.location.pathname}?${params}`);
    setFilters(next);
  };
  // 유효한 실시간 방송 목록
  const allLives = data?.lives || [];
  const rows = allLives.filter((row) => filters.platform === 'ALL' || row.platform === filters.platform);
  const categories = aggregateStatisticsCategories(rows).sort((a, b) => b[sort] - a[sort] || a.key.localeCompare(b.key));
  const broadcasts = rows.filter((row) => !filters.category || categoryKey(row) === filters.category).sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id));
  const selected = categories.find((category) => category.key === filters.category);
  const max = Math.max(1, ...categories.map((category) => category[sort]));
  const maxBroadcastViewers = Math.max(1, ...broadcasts.map((b) => b.viewers));
  const stamp = (data?.sources || []).map((s) => s.observedAt).filter((t): t is string => Boolean(t)).sort().reverse()[0] || data?.meta?.generatedAt;

  // 실시간 플랫폼 전체 집계 (치지직 / SOOP)
  const chzzkLives = allLives.filter((r) => r.platform === 'CHZZK');
  const soopLives = allLives.filter((r) => r.platform === 'SOOP');
  const chzzkViewers = chzzkLives.reduce((sum, r) => sum + (r.viewers || 0), 0);
  const soopViewers = soopLives.reduce((sum, r) => sum + (r.viewers || 0), 0);
  const chzzkLiveCount = chzzkLives.length;
  const soopLiveCount = soopLives.length;

  return (
    <section className="ad-realtime" aria-label="실시간 방송 현황">
      {/* 1. 실시간 플랫폼 매크로 지표 (2열 모던 현황 카드) */}
      <div className="ad-platform-macro-grid">
        <div className="ad-macro-card ad-macro-chzzk">
          <div className="ad-macro-header">
            <div className="ad-macro-brand">
              <span className="ad-live-indicator" />
              <StatisticsBrand platform="CHZZK" />
            </div>
            <span className="ad-macro-badge">LIVE</span>
          </div>
          <div className="ad-macro-body">
            <div className="ad-macro-stat-main">
              <span className="ad-macro-label">실시간 시청자</span>
              <strong className="ad-macro-value">{countFormat(chzzkViewers)}<small>명</small></strong>
            </div>
            <div className="ad-macro-stat-sub">
              <span className="ad-macro-label">라이브 채널</span>
              <strong className="ad-macro-subvalue">{countFormat(chzzkLiveCount)}<small>개</small></strong>
            </div>
          </div>
        </div>

        <div className="ad-macro-card ad-macro-soop">
          <div className="ad-macro-header">
            <div className="ad-macro-brand">
              <span className="ad-live-indicator" />
              <StatisticsBrand platform="SOOP" />
            </div>
            <span className="ad-macro-badge">LIVE</span>
          </div>
          <div className="ad-macro-body">
            <div className="ad-macro-stat-main">
              <span className="ad-macro-label">실시간 시청자</span>
              <strong className="ad-macro-value">{countFormat(soopViewers)}<small>명</small></strong>
            </div>
            <div className="ad-macro-stat-sub">
              <span className="ad-macro-label">라이브 채널</span>
              <strong className="ad-macro-subvalue">{countFormat(soopLiveCount)}<small>개</small></strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 세련된 알약형(Pill) 플랫폼 세그먼트 & 업데이트 상태 */}
      <div className="ad-live-toolbar">
        <div className="ad-pill-segment" role="group" aria-label="실시간 플랫폼 필터">
          {(['ALL', 'CHZZK', 'SOOP'] as const).map((platform) => (
            <button
              className={`ad-pill-tab ${filters.platform === platform ? 'is-active' : ''}`}
              type="button"
              key={platform}
              aria-pressed={filters.platform === platform}
              onClick={() => navigate({ platform, category: '' })}
            >
              {platform === 'ALL' ? '전체 플랫폼' : <StatisticsBrand platform={platform} />}
            </button>
          ))}
        </div>
        <div className="ad-live-update">
          {stamp && <span className="ad-macro-time">{statisticsTime(stamp)} 기준</span>}
          <button className="ad-refresh-pill" type="button" disabled={loading} onClick={refresh} aria-label="실시간 순위 새로고침">
            <RefreshCw size={13} className={loading ? 'bs-spinning' : ''} />
            새로고침
          </button>
        </div>
      </div>

      {error ? (
        <div className="ad-live-state" role="alert">
          <p>실시간 순위를 불러오지 못했습니다.</p>
          <button type="button" className="bs-button" onClick={refresh}>실시간 순위 다시 시도</button>
        </div>
      ) : !data ? (
        <p className="ad-live-state" role="status">실시간 순위를 불러오는 중…</p>
      ) : (
        <div className="ad-live-grid">
          <section className="bs-panel ad-live-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>실시간 방송 랭킹 (Top {broadcastLimit})</h2>
                <p>현재 시청자 수{selected ? ` · ${selected.name}` : ''}</p>
              </div>
              {filters.category && (
                <button className="ad-chip-clear" type="button" onClick={() => navigate({ ...filters, category: '' })}>
                  {selected?.name || filters.category} 필터 해제 ×
                </button>
              )}
            </div>
            {broadcasts.length ? (
              <ol className="ad-live-list">
                {broadcasts.slice(0, broadcastLimit).map((row, index) => (
                  <LiveBroadcastRow key={row.id} row={row} rank={index + 1} maxViewers={maxBroadcastViewers} onOpen={onOpen} />
                ))}
              </ol>
            ) : (
              <p className="ad-empty">{!rows.length ? '현재 방송 정보를 확인할 수 없습니다.' : '현재 조건의 방송이 없습니다.'}</p>
            )}
            {broadcasts.length > broadcastLimit && (
              <button className="ad-more-modern" type="button" onClick={() => setBroadcastLimit(broadcastLimit + 10)}>
                스트리머 순위 더 보기 (+10)
              </button>
            )}
          </section>

          <section className="bs-panel ad-live-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>실시간 인기 카테고리 순위</h2>
              </div>
              <div className="ad-pill-segment-small" aria-label="실시간 카테고리 정렬">
                <button type="button" className={`ad-pill-tab-small ${sort === 'viewers' ? 'is-active' : ''}`} aria-pressed={sort === 'viewers'} onClick={() => setSort('viewers')}>시청자 수 순</button>
                <button type="button" className={`ad-pill-tab-small ${sort === 'channels' ? 'is-active' : ''}`} aria-pressed={sort === 'channels'} onClick={() => setSort('channels')}>방송 채널 수 순</button>
              </div>
            </div>
            {categories.length ? (
              <ol className="ad-live-categories">
                {categories.slice(0, categoryLimit).map((category, index) => (
                  <li key={category.key}>
                    <button
                      type="button"
                      className="ad-live-category"
                      aria-pressed={filters.category === category.key}
                      style={{ '--ad-category-color': activityCategoryColor(category.key) } as CSSProperties}
                      onClick={() => navigate({ ...filters, category: filters.category === category.key ? '' : category.key })}
                    >
                      <span className={`ad-rank ${index < 3 ? 'ad-rank-top' : ''}`}>{index + 1}</span>
                      <span className="ad-live-category-info">
                        <strong><i />{category.name}</strong>
                        <span>{category.platform === 'CHZZK' ? '치지직' : 'SOOP'} · {sort === 'viewers' ? `${countFormat(category.channels)}개 채널` : `${countFormat(category.viewers)}명`}</span>
                        <span className="ad-track">
                          <span style={{ width: `${category[sort] / max * 100}%`, background: 'var(--ad-category-color)' }} />
                        </span>
                      </span>
                      <span className="ad-live-count">
                        <strong>{countFormat(category[sort])}<small>{sort === 'viewers' ? '명' : '개 채널'}</small></strong>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="ad-empty">{!rows.length ? '현재 카테고리 정보를 확인할 수 없습니다.' : '현재 방송 중인 카테고리가 없습니다.'}</p>
            )}
            {categories.length > categoryLimit && (
              <button className="ad-more-modern" type="button" onClick={() => setCategoryLimit(categoryLimit + 10)}>
                카테고리 순위 더 보기 (+10)
              </button>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
