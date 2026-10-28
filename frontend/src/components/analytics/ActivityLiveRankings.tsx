// 외부 제목의 의심 표현을 공개 화면에서 제외한다.
import { publicBroadcastTitle } from '../../../../shared/contentReview';
import { useEffect, useState, useMemo } from 'react';
import { ArrowUpRight, Clock, RefreshCw, Users } from 'lucide-react';
import type { StatisticsBroadcast, StatisticsPlatform } from '../../../../shared/broadcastStatistics';
import type { StatisticsStreamer } from '../../../../shared/statisticsStreamerSearch';
import { activityChannelKey } from '../../../../shared/broadcastActivity';
import { useBroadcastStatistics } from './useBroadcastStatistics';
import { aggregateStatisticsCategories, categoryKey, countFormat, safeStatisticsUrl, statisticsTime } from './statisticsModel';
import { StatisticsBrand } from './StatisticsBrand';
import { activityStreamerPath } from '../../../../shared/activitySeo';
import { LiveViewerChart } from './LiveViewerChart';

// 실시간 순위의 조회 조건은 기간별 통계와 독립적으로 복원한다.
function readLiveLocation() {
  const params = new URLSearchParams(window.location.search);
  const platform = params.get('livePlatform');
  return {
    platform: platform === 'CHZZK' || platform === 'SOOP' ? platform : 'ALL',
    category: params.get('liveCategory') || '',
  } as { platform: 'ALL' | 'CHZZK' | 'SOOP'; category: string };
}

// 방송 시작 시점으로부터 경과 시간을 계산한다.
function formatUptime(startedAt: string | null): string {
  if (!startedAt) return '—';
  const diffMs = Date.now() - Date.parse(startedAt);
  if (isNaN(diffMs) || diffMs < 0) return '—';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}시간 ${remMins}분`;
}

// 방송의 공개 채널 정보로 개인 통계의 조회 대상을 만든다.
function liveStreamer(row: StatisticsBroadcast): StatisticsStreamer | null {
  const key = row.channelKey || (row.channelUrl ? activityChannelKey(row.platform, row.channelUrl) : null);
  return key && (row.platform === 'CHZZK' || row.platform === 'SOOP')
    ? {
        id: key,
        channelKey: key,
        platform: row.platform,
        name: row.channelName || key.split(':')[1],
        channelUrl: row.channelUrl,
        imageUrl: row.imageUrl,
        profileSlug: null,
      }
    : null;
}

// 1. [상단 우측] 실시간 플랫폼 종합 랭킹 카드
interface PlatformRankingData {
  platform: 'CHZZK' | 'SOOP';
  name: string;
  viewers: number;
  channels: number;
  peak: number;
}

function LivePlatformRankingCard({
  totalViewers,
  totalChannels,
  rankings,
  observedAt,
  loading,
  onRefresh,
}: {
  totalViewers: number;
  totalChannels: number;
  rankings: PlatformRankingData[];
  observedAt?: string;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="sc-platform-card">
      <div className="sc-platform-header">
        <div>
          <h3 className="sc-platform-title">실시간 플랫폼 랭킹</h3>
          {observedAt && (
            <span className="sc-platform-time">{statisticsTime(observedAt)} 기준</span>
          )}
        </div>
        <button
          type="button"
          className="ad-refresh-pill"
          disabled={loading}
          onClick={onRefresh}
          aria-label="실시간 데이터 새로고침"
        >
          <RefreshCw size={12} className={loading ? 'bs-spinning' : ''} />
          새로고침
        </button>
      </div>

      {/* 한국어 전체 시청자 수 대형 요약 배너 */}
      <div className="sc-total-banner">
        <div className="sc-total-info">
          <span className="sc-total-label">한국어 전체 시청자 수</span>
          <div className="sc-total-number">
            <strong>{countFormat(totalViewers)}</strong>
            <small>명</small>
          </div>
        </div>
        <div className="sc-total-channels">
          <span className="sc-total-sublabel">진행 중인 방송</span>
          <strong>{countFormat(totalChannels)}</strong>
          <small>개 채널</small>
        </div>
      </div>

      {/* 1위, 2위 플랫폼 순위 카드 목록 */}
      <div className="sc-rank-cards">
        {rankings.map((p, index) => {
          const rank = index + 1;
          const share = totalViewers > 0 ? Math.round((p.viewers / totalViewers) * 100) : 0;
          const isChzzk = p.platform === 'CHZZK';

          return (
            <div
              key={p.platform}
              className={`sc-rank-card ${rank === 1 ? 'is-first' : 'is-second'} ${
                isChzzk ? 'brand-chzzk' : 'brand-soop'
              }`}
            >
              <div className="sc-rank-top-row">
                <div className="sc-rank-identity">
                  <span className={`sc-rank-badge rank-${rank}`}>{rank}</span>
                  <StatisticsBrand platform={p.platform} />
                </div>
                <span className="sc-rank-share">{share}% 점유</span>
              </div>

              <div className="sc-rank-metrics">
                <div className="sc-metric-col main">
                  <span className="sc-metric-label">실시간 시청자</span>
                  <strong className="sc-metric-val">
                    {countFormat(p.viewers)}
                    <small>명</small>
                  </strong>
                </div>
                <div className="sc-metric-col">
                  <span className="sc-metric-label">라이브 채널</span>
                  <strong className="sc-metric-sub">
                    {countFormat(p.channels)}
                    <small>개</small>
                  </strong>
                </div>
                <div className="sc-metric-col">
                  <span className="sc-metric-label">최고 시청자</span>
                  <strong className="sc-metric-sub">
                    {countFormat(p.peak)}
                    <small>명</small>
                  </strong>
                </div>
              </div>

              {/* 시청자 볼륨 바 게이지 */}
              <div className="sc-rank-gauge-track">
                <div
                  className={`sc-rank-gauge-fill ${isChzzk ? 'fill-chzzk' : 'fill-soop'}`}
                  style={{ width: `${share}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. [중단] 실시간 카테고리 랭킹 8열 타일 그리드
interface CategoryItem {
  key: string;
  name: string;
  platform: StatisticsPlatform | 'ALL';
  viewers: number;
  channels: number;
}

function LiveCategoryTiles({
  categories,
  selectedCategory,
  sort,
  limit,
  onSelectCategory,
  onSortChange,
  onExpand,
}: {
  categories: CategoryItem[];
  selectedCategory: string;
  sort: 'viewers' | 'channels';
  limit: number;
  onSelectCategory: (key: string) => void;
  onSortChange: (sort: 'viewers' | 'channels') => void;
  onExpand: () => void;
}) {
  const displayed = categories.slice(0, limit);

  return (
    <div className="sc-category-section">
      <div className="sc-section-heading">
        <div className="sc-heading-left">
          <h2>실시간 카테고리 랭킹</h2>
          <span className="sc-heading-badge">TOP {limit}</span>
        </div>
        <div className="sc-heading-controls">
          <div className="ad-pill-segment-small" role="group" aria-label="카테고리 정렬">
            <button
              type="button"
              className={`ad-pill-tab-small ${sort === 'viewers' ? 'is-active' : ''}`}
              onClick={() => onSortChange('viewers')}
            >
              시청자순
            </button>
            <button
              type="button"
              className={`ad-pill-tab-small ${sort === 'channels' ? 'is-active' : ''}`}
              onClick={() => onSortChange('channels')}
            >
              채널순
            </button>
          </div>
        </div>
      </div>

      {displayed.length ? (
        <div className="sc-category-tile-grid">
          {displayed.map((cat, idx) => {
            const rank = idx + 1;
            const isSelected = selectedCategory === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                className={`sc-category-tile ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectCategory(cat.key)}
                aria-pressed={isSelected}
              >
                <div className="sc-tile-top">
                  <span className={`sc-tile-rank ${rank <= 3 ? `top-${rank}` : ''}`}>{rank}</span>
                  {cat.platform !== 'ALL' && (
                    <span className="sc-tile-platform">
                      <StatisticsBrand platform={cat.platform} label={false} />
                    </span>
                  )}
                </div>

                <div className="sc-tile-body">
                  <strong className="sc-tile-name" title={cat.name}>
                    {cat.name}
                  </strong>
                </div>

                <div className="sc-tile-footer">
                  <div className="sc-tile-stat">
                    <span>시청자</span>
                    <strong>{countFormat(cat.viewers)}명</strong>
                  </div>
                  <div className="sc-tile-stat">
                    <span>채널</span>
                    <strong className="sub">{countFormat(cat.channels)}개</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="ad-empty">현재 방송 중인 카테고리가 없습니다.</p>
      )}

      {categories.length > limit && (
        <button type="button" className="ad-more-modern" onClick={onExpand}>
          카테고리 순위 더 보기 (+16)
        </button>
      )}
    </div>
  );
}

// 3. [하단] 와이드 고밀도 데이터 테이블 행 (시안 2: 전문 통계 그리드)
function LiveStreamerTableRow({
  row,
  rank,
  maxViewers,
  totalViewers,
  onOpen,
  onSelectCategory,
}: {
  row: StatisticsBroadcast;
  rank: number;
  maxViewers: number;
  totalViewers: number;
  onOpen: (streamer: StatisticsStreamer) => void;
  onSelectCategory: (categoryKey: string) => void;
}) {
  const image = safeStatisticsUrl(row.imageUrl);
  const streamer = liveStreamer(row);
  const liveUrl = safeStatisticsUrl(row.liveUrl);
  const ratio = maxViewers > 0 ? Math.min(100, Math.max(4, Math.round((row.viewers / maxViewers) * 100))) : 0;
  const share = totalViewers > 0 ? ((row.viewers / totalViewers) * 100).toFixed(1) : '0';
  const isChzzk = row.platform === 'CHZZK';
  const uptime = formatUptime(row.startedAt);

  return (
    <tr className="sc-table-row">
      {/* 1. 순위 */}
      <td className="sc-td-rank">
        <span
          className={`ad-rank ${
            rank === 1 ? 'ad-rank-1' : rank === 2 ? 'ad-rank-2' : rank === 3 ? 'ad-rank-3' : ''
          }`}
        >
          {rank}
        </span>
      </td>

      {/* 2. 스트리머 */}
      <td className="sc-td-streamer">
        <div className="sc-table-streamer">
          <span className="sc-table-avatar">
            {image ? (
              <img
                src={image}
                alt=""
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Users size={16} />
            )}
          </span>
          {streamer ? (
            <a
              href={`${activityStreamerPath(streamer.channelKey!)}?name=${encodeURIComponent(
                streamer.name,
              )}`}
              className="sc-table-streamer-name"
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onOpen(streamer);
              }}
            >
              {streamer.name}
            </a>
          ) : (
            <strong className="sc-table-streamer-name">{row.channelName || '채널 정보 없음'}</strong>
          )}
        </div>
      </td>

      {/* 3. 플랫폼 */}
      <td className="sc-td-platform">
        <StatisticsBrand platform={row.platform} />
      </td>

      {/* 4. 카테고리 */}
      <td className="sc-td-category">
        <button
          type="button"
          className="sc-table-category-badge"
          onClick={() => onSelectCategory(categoryKey(row))}
          title={`${row.categoryName} 카테고리 필터 적용`}
        >
          {row.categoryName}
        </button>
      </td>

      {/* 5. 방송 제목 */}
      <td className="sc-td-title">
        <span className="sc-table-broadcast-title" title={publicBroadcastTitle(row.title)}>
          {publicBroadcastTitle(row.title)}
        </span>
      </td>

      {/* 6. 방송 시작 시간 */}
      <td className="sc-td-uptime">
        <span className="sc-table-uptime">
          <Clock size={12} />
          {uptime}
        </span>
      </td>

      {/* 7. 시청자 점유율 게이지 */}
      <td className="sc-td-share">
        <div className="sc-table-share-cell">
          <div className="sc-table-gauge-track">
            <div
              className={`sc-table-gauge-fill ${isChzzk ? 'fill-chzzk' : 'fill-soop'}`}
              style={{ width: `${ratio}%` }}
            />
          </div>
          <span className="sc-table-share-pct">{share}%</span>
        </div>
      </td>

      {/* 8. 실시간 시청자 */}
      <td className="sc-td-viewers">
        <strong className="sc-table-viewers-count">
          {countFormat(row.viewers)}
          <small>명</small>
        </strong>
      </td>

      {/* 9. 방송 보기 */}
      <td className="sc-td-action">
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sc-table-watch-btn"
            aria-label={`${row.channelName || '방송'} 방송 보기 (새 창)`}
          >
            방송 보기 <ArrowUpRight size={12} />
          </a>
        )}
      </td>
    </tr>
  );
}

// 메인 실시간 현황 컴포넌트
export function ActivityLiveRankings({ onOpen }: { onOpen: (streamer: StatisticsStreamer) => void }) {
  const { data, loading, error, refresh } = useBroadcastStatistics();
  const [filters, setFilters] = useState(readLiveLocation);
  const [broadcastLimit, setBroadcastLimit] = useState(15);
  const [categoryLimit, setCategoryLimit] = useState(16);
  const [categorySort, setCategorySort] = useState<'viewers' | 'channels'>('viewers');

  useEffect(() => {
    const sync = () => setFilters(readLiveLocation());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigate = (next: typeof filters) => {
    const params = new URLSearchParams(window.location.search);
    params.delete('livePlatform');
    params.delete('liveCategory');
    if (next.platform !== 'ALL') params.set('livePlatform', next.platform);
    if (next.category) params.set('liveCategory', next.category);
    window.history.pushState(window.history.state, '', `${window.location.pathname}?${params}`);
    setFilters(next);
  };

  const allLives = data?.lives || [];
  const points = data?.points || [];

  // 플랫폼별 지표 및 랭킹 산출
  const platformSummary = useMemo(() => {
    const chzzkLives = allLives.filter((r) => r.platform === 'CHZZK');
    const soopLives = allLives.filter((r) => r.platform === 'SOOP');

    const chzzkViewers = chzzkLives.reduce((s, r) => s + (r.viewers || 0), 0);
    const soopViewers = soopLives.reduce((s, r) => s + (r.viewers || 0), 0);

    const chzzkChannels = chzzkLives.length;
    const soopChannels = soopLives.length;

    // 24시간 피크 시청자 계산 (points 또는 lives)
    const chzzkPeak = Math.max(
      chzzkViewers,
      ...points.filter((p) => p.platform === 'CHZZK').map((p) => p.viewers || 0),
    );
    const soopPeak = Math.max(
      soopViewers,
      ...points.filter((p) => p.platform === 'SOOP').map((p) => p.viewers || 0),
    );

    const items: PlatformRankingData[] = [
      {
        platform: 'CHZZK' as const,
        name: '치지직',
        viewers: chzzkViewers,
        channels: chzzkChannels,
        peak: chzzkPeak,
      },
      {
        platform: 'SOOP' as const,
        name: 'SOOP',
        viewers: soopViewers,
        channels: soopChannels,
        peak: soopPeak,
      },
    ].sort((a, b) => b.viewers - a.viewers);

    return {
      totalViewers: chzzkViewers + soopViewers,
      totalChannels: chzzkChannels + soopChannels,
      rankings: items,
    };
  }, [allLives, points]);

  // 카테고리 목록 집계
  const categoryItems = useMemo(() => {
    const rawCategories = aggregateStatisticsCategories(
      filters.platform === 'ALL'
        ? allLives
        : allLives.filter((r) => r.platform === filters.platform),
    );

    const list: CategoryItem[] = rawCategories.map((c) => ({
      key: c.key,
      name: c.name,
      platform: c.platform,
      viewers: c.viewers,
      channels: c.channels,
    }));

    return list.sort((a, b) => b[categorySort] - a[categorySort] || a.key.localeCompare(b.key));
  }, [allLives, filters.platform, categorySort]);

  // 스트리머 방송 목록 필터링
  const filteredBroadcasts = useMemo(() => {
    return allLives
      .filter((r) => filters.platform === 'ALL' || r.platform === filters.platform)
      .filter((r) => !filters.category || categoryKey(r) === filters.category)
      .sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id));
  }, [allLives, filters.platform, filters.category]);

  const maxBroadcastViewers = Math.max(1, ...filteredBroadcasts.map((b) => b.viewers));

  const selectedCategoryObj = categoryItems.find((c) => c.key === filters.category);
  const observedStamp =
    (data?.sources || [])
      .map((s) => s.observedAt)
      .filter((t): t is string => Boolean(t))
      .sort()
      .reverse()[0] || data?.meta?.generatedAt;

  return (
    <section className="ad-realtime" aria-label="실시간 스트리밍 현황">
      {/* ====================================================================
          1. [상단] 2열 스플릿 레이아웃: 24h 시계열 차트(좌) + 플랫폼 종합 랭킹(우)
          ==================================================================== */}
      <div className="sc-top-section">
        {/* 상단 좌측: 24시간 실시간 시청자/채널 라인 차트 */}
        <div className="sc-chart-column">
          <LiveViewerChart points={points} />
        </div>

        {/* 상단 우측: 실시간 플랫폼 종합 랭킹 */}
        <div className="sc-platform-column">
          <LivePlatformRankingCard
            totalViewers={platformSummary.totalViewers}
            totalChannels={platformSummary.totalChannels}
            rankings={platformSummary.rankings}
            observedAt={observedStamp}
            loading={loading}
            onRefresh={refresh}
          />
        </div>
      </div>

      {/* ====================================================================
          2. [중단] 실시간 카테고리 랭킹 (8열 타일 그리드)
          ==================================================================== */}
      <LiveCategoryTiles
        categories={categoryItems}
        selectedCategory={filters.category}
        sort={categorySort}
        limit={categoryLimit}
        onSelectCategory={(key) =>
          navigate({ ...filters, category: filters.category === key ? '' : key })
        }
        onSortChange={setCategorySort}
        onExpand={() => setCategoryLimit((prev) => prev + 16)}
      />

      {/* ====================================================================
          3. [하단] 실시간 스트리머 랭킹 (시안 2: 와이드 고밀도 데이터 그리드)
          ==================================================================== */}
      <div className="sc-streamer-section">
        <div className="sc-section-heading">
          <div className="sc-heading-left">
            <h2>실시간 스트리머 랭킹</h2>
            <span className="sc-heading-badge">TOP {filteredBroadcasts.length}</span>
            {selectedCategoryObj && (
              <span className="sc-filter-tag">
                {selectedCategoryObj.name} 필터링 적용 중
                <button
                  type="button"
                  onClick={() => navigate({ ...filters, category: '' })}
                  aria-label="카테고리 필터 해제"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="ad-pill-segment" role="group" aria-label="실시간 스트리머 플랫폼 필터">
            {(['ALL', 'CHZZK', 'SOOP'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`ad-pill-tab ${filters.platform === p ? 'is-active' : ''}`}
                onClick={() => navigate({ ...filters, platform: p })}
              >
                {p === 'ALL' ? '전체' : <StatisticsBrand platform={p} />}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="ad-live-state" role="alert">
            <p>실시간 순위를 불러오지 못했습니다.</p>
            <button type="button" className="bs-button" onClick={refresh}>
              다시 시도
            </button>
          </div>
        ) : !data ? (
          <p className="ad-live-state" role="status">
            실시간 순위를 불러오는 중…
          </p>
        ) : (
          <div className="sc-table-container">
            {filteredBroadcasts.length ? (
              <div className="sc-table-wrapper">
                <table className="sc-streamer-table">
                  <thead>
                    <tr>
                      <th className="sc-th-rank">순위</th>
                      <th className="sc-th-streamer">스트리머</th>
                      <th className="sc-th-platform">플랫폼</th>
                      <th className="sc-th-category">카테고리</th>
                      <th className="sc-th-title">방송 제목</th>
                      <th className="sc-th-uptime">방송 시작</th>
                      <th className="sc-th-share">시청자 점유율</th>
                      <th className="sc-th-viewers">실시간 시청자</th>
                      <th className="sc-th-action"><span className="bs-sr-only">방송 보기</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBroadcasts.slice(0, broadcastLimit).map((row, index) => (
                      <LiveStreamerTableRow
                        key={row.id}
                        row={row}
                        rank={index + 1}
                        maxViewers={maxBroadcastViewers}
                        totalViewers={platformSummary.totalViewers}
                        onOpen={onOpen}
                        onSelectCategory={(catKey) =>
                          navigate({
                            ...filters,
                            category: filters.category === catKey ? '' : catKey,
                          })
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ad-empty">
                {!allLives.length
                  ? '현재 방송 정보를 확인할 수 없습니다.'
                  : '현재 조건에 일치하는 방송이 없습니다.'}
              </p>
            )}

            {filteredBroadcasts.length > broadcastLimit && (
              <button
                className="ad-more-modern"
                type="button"
                onClick={() => setBroadcastLimit((prev) => prev + 15)}
              >
                스트리머 순위 더 보기 (+15)
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
