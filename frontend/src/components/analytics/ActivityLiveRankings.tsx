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
function LiveBroadcastRow({ row, rank, onOpen }: { row: StatisticsBroadcast; rank: number; onOpen: (streamer: StatisticsStreamer) => void }) {
  const image = safeStatisticsUrl(row.imageUrl);
  const streamer = liveStreamer(row);
  const liveUrl = safeStatisticsUrl(row.liveUrl);
  return <li className="ad-live-row"><span className={`ad-rank ${rank <= 3 ? 'ad-rank-top' : ''}`}>{rank}</span>
    <span className="ad-live-avatar">{image ? <img src={image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <Users size={18} />}</span>
    <div className="ad-live-identity">{streamer ? <a href={`${activityStreamerPath(streamer.channelKey!)}?name=${encodeURIComponent(streamer.name)}`} className="ad-channel-link" onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(streamer); }}>{streamer.name}</a> : <strong>{row.channelName || '채널 정보 없음'}</strong>}
      <p title={publicBroadcastTitle(row.title)}>{publicBroadcastTitle(row.title)}</p><div className="ad-live-tags"><StatisticsBrand platform={row.platform} label={false} /><span>{row.categoryName}</span></div></div>
    <div className="ad-live-count"><strong>{countFormat(row.viewers)}<small>명</small></strong>{liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`${row.channelName || '방송'} 방송 보기 (새 창)`}>방송 보기 <ArrowUpRight size={11} /></a>}</div>
  </li>;
}

// 현재 방송만 순위를 매기고 누락·지연·실패는 빈 방송으로 대체하지 않는다.
export function ActivityLiveRankings({ onOpen }: { onOpen: (streamer: StatisticsStreamer) => void }) {
  const { data, loading, error, refresh } = useBroadcastStatistics();
  const [filters, setFilters] = useState(readLiveLocation);
  const [broadcastLimit, setBroadcastLimit] = useState(5);
  const [categoryLimit, setCategoryLimit] = useState(5);
  const [sort, setSort] = useState<'viewers' | 'channels'>('viewers');
  useEffect(() => { const sync = () => setFilters(readLiveLocation()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  useEffect(() => { setBroadcastLimit(5); setCategoryLimit(5); }, [filters.platform, filters.category]);
  const navigate = (next: typeof filters) => {
    const params = new URLSearchParams(window.location.search);
    params.delete('livePlatform'); params.delete('liveCategory');
    if (next.platform !== 'ALL') params.set('livePlatform', next.platform);
    if (next.category) params.set('liveCategory', next.category);
    window.history.pushState(window.history.state, '', `${window.location.pathname}?${params}`);
    setFilters(next);
  };
  const sources = (data?.sources || []).filter((source) => filters.platform === 'ALL' || source.platform === filters.platform);
  const current = sources.filter((source) => (source.state === 'available' || source.state === 'partial') && source.observedAt
    && Date.now() - Date.parse(source.observedAt) >= -60000 && Date.now() - Date.parse(source.observedAt) <= 15 * 60000);
  const platforms = new Set(current.map((source) => source.platform));
  const rows = (data?.lives || []).filter((row) => platforms.has(row.platform));
  const categories = aggregateStatisticsCategories(rows).sort((a, b) => b[sort] - a[sort] || a.key.localeCompare(b.key));
  const broadcasts = rows.filter((row) => !filters.category || categoryKey(row) === filters.category).sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id));
  const selected = categories.find((category) => category.key === filters.category);
  const max = Math.max(1, ...categories.map((category) => category[sort]));
  const stamp = current.map((source) => source.observedAt!).sort()[0];

  // 실시간 플랫폼 전체 집계 (소프트콘 뷰어십 매크로 지표)
  const chzzkLives = rows.filter((r) => r.platform === 'CHZZK');
  const soopLives = rows.filter((r) => r.platform === 'SOOP');
  const chzzkViewers = chzzkLives.reduce((sum, r) => sum + (r.viewers || 0), 0);
  const soopViewers = soopLives.reduce((sum, r) => sum + (r.viewers || 0), 0);
  const totalViewers = chzzkViewers + soopViewers;
  const chzzkLiveCount = chzzkLives.length;
  const soopLiveCount = soopLives.length;
  const totalLiveCount = chzzkLiveCount + soopLiveCount;
  const chzzkShare = totalViewers > 0 ? Math.round((chzzkViewers / totalViewers) * 100) : 50;
  const soopShare = 100 - chzzkShare;

  return (
    <section className="ad-realtime" aria-label="실시간 방송 현황">
      {/* 1. 실시간 플랫폼 매크로 지표 (소프트콘형 현황 카드) */}
      <div className="ad-platform-macro-grid">
        <div className="ad-macro-card ad-macro-chzzk">
          <div className="ad-macro-header">
            <span className="ad-live-indicator" />
            <StatisticsBrand platform="CHZZK" />
            <span className="ad-macro-share">{chzzkShare}%</span>
          </div>
          <div className="ad-macro-body">
            <div>
              <span className="ad-macro-label">실시간 시청자</span>
              <strong className="ad-macro-value">{countFormat(chzzkViewers)}<small>명</small></strong>
            </div>
            <div>
              <span className="ad-macro-label">라이브 채널</span>
              <strong className="ad-macro-subvalue">{countFormat(chzzkLiveCount)}<small>개</small></strong>
            </div>
          </div>
        </div>

        <div className="ad-macro-card ad-macro-soop">
          <div className="ad-macro-header">
            <span className="ad-live-indicator" />
            <StatisticsBrand platform="SOOP" />
            <span className="ad-macro-share">{soopShare}%</span>
          </div>
          <div className="ad-macro-body">
            <div>
              <span className="ad-macro-label">실시간 시청자</span>
              <strong className="ad-macro-value">{countFormat(soopViewers)}<small>명</small></strong>
            </div>
            <div>
              <span className="ad-macro-label">라이브 채널</span>
              <strong className="ad-macro-subvalue">{countFormat(soopLiveCount)}<small>개</small></strong>
            </div>
          </div>
        </div>

        <div className="ad-macro-card ad-macro-total">
          <div className="ad-macro-header">
            <span className="ad-macro-label">양대 플랫폼 합산 점유율</span>
            {stamp && <span className="ad-macro-time">{statisticsTime(stamp)} 기준</span>}
          </div>
          <div className="ad-macro-body ad-macro-body-total">
            <div className="ad-total-stats">
              <span>총 <strong>{countFormat(totalViewers)}명</strong> 시청</span>
              <span>총 <strong>{countFormat(totalLiveCount)}개</strong> 채널</span>
            </div>
            <div className="ad-share-bar" role="progressbar" aria-label="플랫폼 시청자 점유율" aria-valuenow={chzzkShare} aria-valuemin={0} aria-valuemax={100}>
              <span className="ad-share-chzzk" style={{ width: `${chzzkShare}%` }} title={`치지직 ${chzzkShare}%`} />
              <span className="ad-share-soop" style={{ width: `${soopShare}%` }} title={`SOOP ${soopShare}%`} />
            </div>
          </div>
        </div>
      </div>

      <div className="ad-live-toolbar">
        <div className="ad-platforms" aria-label="실시간 플랫폼 필터">
          {(['ALL', 'CHZZK', 'SOOP'] as const).map((platform) => (
            <button
              className="bs-button"
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
          <button className="ad-refresh" type="button" disabled={loading} onClick={refresh} aria-label="실시간 순위 새로고침">
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
                <button className="bs-button" type="button" onClick={() => navigate({ ...filters, category: '' })}>
                  카테고리 선택 해제
                </button>
              )}
            </div>
            {broadcasts.length ? (
              <ol className="ad-live-list">
                {broadcasts.slice(0, broadcastLimit).map((row, index) => (
                  <LiveBroadcastRow key={row.id} row={row} rank={index + 1} onOpen={onOpen} />
                ))}
              </ol>
            ) : (
              <p className="ad-empty">{!current.length ? '현재 방송 정보를 확인할 수 없습니다.' : '현재 조건의 방송이 없습니다.'}</p>
            )}
            {broadcasts.length > broadcastLimit && (
              <button className="ad-more" type="button" onClick={() => setBroadcastLimit(broadcastLimit + 10)}>
                방송 랭킹 더 보기
              </button>
            )}
          </section>

          <section className="bs-panel ad-live-panel">
            <div className="ad-panel-heading">
              <div>
                <h2>실시간 인기 카테고리 순위</h2>
              </div>
              <div className="bs-segment" aria-label="실시간 카테고리 정렬">
                <button type="button" aria-pressed={sort === 'viewers'} onClick={() => setSort('viewers')}>시청자 수</button>
                <button type="button" aria-pressed={sort === 'channels'} onClick={() => setSort('channels')}>방송 채널 수</button>
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
              <p className="ad-empty">{!current.length ? '현재 카테고리 정보를 확인할 수 없습니다.' : '현재 방송 중인 카테고리가 없습니다.'}</p>
            )}
            {categories.length > categoryLimit && (
              <button className="ad-more" type="button" onClick={() => setCategoryLimit(categoryLimit + 10)}>
                카테고리 순위 더 보기
              </button>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
