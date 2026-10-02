import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Calendar, Clock, Flame, Share2, Copy, Check, ChevronDown, ChevronUp, Loader2, Radio } from 'lucide-react';
import type { BroadcastStatistics, StatisticsPlatformFilter } from '../../../../shared/broadcastStatistics';
import type { StatisticsStreamer, StreamerBroadcastHistoryItem } from '../../../../shared/statisticsStreamerSearch';
import { StatisticsBrand } from './StatisticsBrand';
import { countFormat, platformName, safeStatisticsUrl, statisticsTime } from './statisticsModel';
import { fetchStreamerBroadcastHistory } from '../../services/broadcastStatisticsApi';
import { generateStreamerStyleReport, type StreamerStyleReport } from './streamerStyleAnalyzer';

import { normalizeStreamerQuery, type StatisticsStreamerSearchResponse } from '../../../../shared/statisticsStreamerSearch';
import { mergeStatisticsStreamers } from './statisticsSearchModel';

interface StreamerListProps {
  searchQuery: string;
  data: BroadcastStatistics | null;
  onClearSearch: () => void;
  onOpenBroadcast: (id: string) => void;
}

// 개별 스트리머 카드 컴포넌트 (단일 책임: 스트리머 요약, 방송 스타일 분석, 타임라인 토글 렌더링)
function StatisticsStreamerCard({
  streamer,
  data,
  onOpenBroadcast,
  onRegisterStreamer,
}: {
  streamer: StatisticsStreamer;
  data: BroadcastStatistics | null;
  onOpenBroadcast: (id: string) => void;
  onRegisterStreamer?: (streamer: StatisticsStreamer) => Promise<void>;
}) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [history, setHistory] = useState<StreamerBroadcastHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [copied, setCopied] = useState(false);
  const [registering, setRegistering] = useState(false);

  const channelKey = streamer.channelKey;
  const days = period === 'weekly' ? 7 : 30;

  // 현재 라이브 방송 정보 확인
  const live = channelKey ? data?.lives.find((row) => row.channelKey === channelKey) : null;
  const isLive = streamer.isLive || Boolean(live);
  const liveViewers = live?.viewers || 0;
  const channelUrl = safeStatisticsUrl(streamer.channelUrl);
  const avatar = safeStatisticsUrl(streamer.imageUrl);

  // 방송 이력 조회 (주간/월간 변경 시 재호출)
  useEffect(() => {
    let active = true;
    if (!channelKey) return;

    setLoadingHistory(true);
    fetchStreamerBroadcastHistory(channelKey, days)
      .then((res) => {
        if (active && res) {
          setHistory(res.broadcasts);
        }
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [channelKey, days]);

  // 방송 스타일 요약 리포트 도출
  const styleReport: StreamerStyleReport = generateStreamerStyleReport(streamer.name, history, period);

  // 리포트 클립보드 복사
  const handleCopyReport = async () => {
    const shareUrl = `${window.location.origin}/analytics?search=${encodeURIComponent(streamer.name)}`;
    const copyText = `[VDébut] ${streamer.name} 님의 ${period === 'weekly' ? '주간' : '월간'} 방송 스타일 분석 리포트\n\n"${styleReport.headline}"\n\n${styleReport.narrative}\n\n${styleReport.tags.join(' ')}\n\n👉 리포트 보기: ${shareUrl}`;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // 트위터(X) 공유
  const handleShareTwitter = () => {
    const shareUrl = `${window.location.origin}/analytics?search=${encodeURIComponent(streamer.name)}`;
    const tweetText = `[VDébut] ${streamer.name} 님의 방송 스타일 분석 리포트 ✨\n"${styleReport.headline}"\n\n${styleReport.tags.slice(0, 3).join(' ')}\n`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRegister = async () => {
    if (!onRegisterStreamer || registering) return;
    setRegistering(true);
    try {
      await onRegisterStreamer(streamer);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <article className={`bs-streamer-card ${isLive ? 'is-live-card' : ''}`}>
      {/* 1. 상단 프로필 헤더 */}
      <div className="bs-card-header">
        <div className="bs-card-avatar-wrap">
          <div className="bs-card-avatar">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              streamer.name.slice(0, 1)
            )}
          </div>
          <div className="bs-card-title-group">
            <div className="bs-card-title-row">
              <h3 className="bs-card-name">{streamer.name}</h3>
              <StatisticsBrand platform={streamer.platform} label={false} />
              {streamer.isRegistered ? (
                <span className="bs-badge-tag bs-badge-registered">VDébut 등록</span>
              ) : (
                <span className="bs-badge-tag bs-badge-external">플랫폼 스트리머</span>
              )}
            </div>
            <div className="bs-card-meta-row">
              <span className="bs-small">
                {platformName(streamer.platform)}
                {streamer.followerCount !== undefined && ` · 팔로워 ${countFormat(streamer.followerCount)}명`}
              </span>
            </div>
          </div>
        </div>

        {/* 라이브 상태 뱃지 */}
        <div className="bs-card-live-status">
          {isLive ? (
            <span className="bs-live-status-badge is-live">
              <span className="bs-live-dot" aria-hidden="true" />
              <Radio size={13} />
              <b>LIVE {countFormat(liveViewers)}명</b>
            </span>
          ) : (
            <span className="bs-live-status-badge is-offline">오프라인</span>
          )}
        </div>
      </div>

      {/* 2. 현재 라이브 중인 경우 진행 중인 방송 배너 */}
      {isLive && live && (
        <div className="bs-card-current-live">
          <div className="bs-current-live-body">
            <strong className="bs-current-live-title">{live.title}</strong>
            <span className="bs-category-tag">{live.categoryName}</span>
          </div>
          {live.liveUrl && (
            <a
              href={live.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bs-button bs-primary bs-small"
            >
              방송 보러 가기 <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* 3. [핵심] 주간 / 월간 방송 스타일 요약 분석 영역 */}
      <div className="bs-card-style-section">
        <div className="bs-style-header">
          <div className="bs-style-title">
            <Flame size={14} className="bs-flame-icon" />
            <span>방송 스타일 분석 리포트</span>
          </div>
          <div className="bs-segment bs-style-period-toggle">
            <button
              type="button"
              aria-pressed={period === 'weekly'}
              onClick={() => setPeriod('weekly')}
            >
              최근 7일 (주간)
            </button>
            <button
              type="button"
              aria-pressed={period === 'monthly'}
              onClick={() => setPeriod('monthly')}
            >
              최근 30일 (월간)
            </button>
          </div>
        </div>

        {loadingHistory ? (
          <div className="bs-style-loading">
            <Loader2 size={16} className="bs-spinning" />
            <span>방송 스타일과 시청 흐름을 분석하고 있어요…</span>
          </div>
        ) : (
          <div className="bs-style-content">
            {/* 한 줄 헤드라인 */}
            <p className="bs-style-headline">
              <strong>"{styleReport.headline}"</strong>
            </p>

            {/* 상세 내러티브 */}
            <p className="bs-style-narrative">{styleReport.narrative}</p>

            {/* 해시태그 칩 */}
            <div className="bs-style-tags">
              {styleReport.tags.map((tag) => (
                <span key={tag} className="bs-style-tag">
                  {tag}
                </span>
              ))}
            </div>

            {/* 주력 카테고리 분포 및 피크 수치 */}
            {styleReport.topCategories.length > 0 && (
              <div className="bs-style-metrics">
                <div className="bs-style-metric-row">
                  <span className="bs-metric-label">주력 카테고리:</span>
                  <div className="bs-category-dist-list">
                    {styleReport.topCategories.map((c) => (
                      <span key={c.name} className="bs-dist-chip">
                        {c.name} <b>{c.percentage}%</b>
                      </span>
                    ))}
                  </div>
                </div>

                {styleReport.peakBroadcast && (
                  <div className="bs-style-metric-row">
                    <span className="bs-metric-label">기간 최고 피크:</span>
                    <span className="bs-peak-chip">
                      🔥 최고 {countFormat(styleReport.peakBroadcast.viewers)}명 ({styleReport.peakBroadcast.dateText})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. 공유 액션 바 (복사 & 트위터) */}
        <div className="bs-card-share-bar">
          <button
            type="button"
            className="bs-button bs-small"
            onClick={() => void handleCopyReport()}
          >
            {copied ? <Check size={12} className="bs-success-icon" /> : <Copy size={12} />}
            {copied ? '분석 요약 복사됨!' : '리포트 요약 복사'}
          </button>
          <button
            type="button"
            className="bs-button bs-small"
            onClick={handleShareTwitter}
          >
            <Share2 size={12} />
            X(트위터) 공유
          </button>
          <button
            type="button"
            className="bs-timeline-toggle-btn"
            onClick={() => setShowTimeline((prev) => !prev)}
          >
            <Calendar size={12} />
            <span>지난 방송 이력 ({history.length}회)</span>
            {showTimeline ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* 5. 지난 방송 세션 타임라인 (아코디언 토글) */}
      {showTimeline && (
        <div className="bs-card-timeline-accordion">
          {history.length > 0 ? (
            <div className="bs-streamer-timeline">
              {history.map((item) => (
                <div key={item.streamId} className="bs-timeline-card">
                  <div className="bs-timeline-node" aria-hidden="true" />
                  <div className="bs-timeline-content">
                    <div className="bs-timeline-header">
                      <span className="bs-timeline-time">
                        <Clock size={11} />
                        {statisticsTime(item.startedAt, true)} ~ {statisticsTime(item.lastObservedAt, false)}
                      </span>
                      <span className="bs-timeline-peak">
                        <Flame size={12} />
                        피크 {countFormat(item.peakViewers)}명
                      </span>
                    </div>
                    <strong className="bs-timeline-title">{item.title}</strong>
                    <div className="bs-timeline-actions">
                      <span className="bs-category-tag">{item.categoryName}</span>
                      <button
                        type="button"
                        className="bs-button bs-small"
                        onClick={() => onOpenBroadcast(item.streamId)}
                      >
                        상세 기록
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="bs-small bs-empty-notice">기록된 지난 방송 세션이 없습니다.</p>
          )}
        </div>
      )}

      {/* 6. 카드 하단 채널 바로가기 및 VDébut 프로필 링크 */}
      <div className="bs-card-footer">
        <div className="bs-footer-links">
          {channelUrl && (
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="bs-text-link">
              플랫폼 채널 바로가기 <ExternalLink size={12} />
            </a>
          )}
          {streamer.profileSlug && (
            <a href={`/creator/${encodeURIComponent(streamer.profileSlug)}`} className="bs-text-link">
              VDébut 프로필 보기 <ExternalLink size={12} />
            </a>
          )}
        </div>

        {!streamer.isRegistered && onRegisterStreamer && (
          <button
            type="button"
            className="bs-button bs-small"
            disabled={registering}
            onClick={() => void handleRegister()}
          >
            {registering ? '등록 중…' : 'VDébut 프로필 등록'}
          </button>
        )}
      </div>
    </article>
  );
}

// 메인 스트리머 검색 결과 리스트 컴포넌트 (단일 책임)
export function StatisticsStreamerList({
  searchQuery,
  data,
  onClearSearch,
  onOpenBroadcast,
}: StreamerListProps) {
  const [streamers, setStreamers] = useState<StatisticsStreamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<StatisticsPlatformFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'REGISTERED'>('ALL');
  const [sortBy, setSortBy] = useState<'viewers' | 'followers' | 'name'>('viewers');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    if (!normalizeStreamerQuery(searchQuery)) {
      setStreamers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/analytics/streamers/search?q=${encodeURIComponent(searchQuery.trim())}&external=true`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Search failed');
        const next: StatisticsStreamerSearchResponse = await res.json();
        if (active) {
          const merged = mergeStatisticsStreamers(searchQuery, next.streamers || [], data);
          setStreamers(merged);
        }
      })
      .catch(() => {
        if (active) {
          const fallback = mergeStatisticsStreamers(searchQuery, [], data);
          setStreamers(fallback);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [searchQuery, data]);

  const handleRegisterStreamer = async (target: StatisticsStreamer) => {
    try {
      const res = await fetch('/api/analytics/streamers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          platform: target.platform,
          channelKey: target.channelKey,
          name: target.name,
          channelUrl: target.channelUrl,
          imageUrl: target.imageUrl,
        }),
      });
      const resData = await res.json() as { success: boolean; slug?: string };
      if (resData.success) {
        setStreamers((prev) =>
          prev.map((s) => (s.channelKey === target.channelKey ? { ...s, isRegistered: true, profileSlug: resData.slug || s.profileSlug } : s))
        );
      }
    } catch {
      // ignore
    }
  };

  // 필터링 적용
  const filtered = streamers.filter((s) => {
    if (platformFilter !== 'ALL' && s.platform !== platformFilter) return false;
    const isLive = s.isLive || Boolean(s.channelKey && data?.lives.some((l) => l.channelKey === s.channelKey));
    if (statusFilter === 'LIVE' && !isLive) return false;
    if (statusFilter === 'REGISTERED' && !s.isRegistered) return false;
    return true;
  });

  // 정렬 적용
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'viewers') {
      const liveA = a.channelKey ? data?.lives.find((l) => l.channelKey === a.channelKey)?.viewers || 0 : 0;
      const liveB = b.channelKey ? data?.lives.find((l) => l.channelKey === b.channelKey)?.viewers || 0 : 0;
      return liveB - liveA || a.name.localeCompare(b.name);
    }
    if (sortBy === 'followers') {
      return (b.followerCount || 0) - (a.followerCount || 0) || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="bs-streamer-list-section" aria-label="스트리머 검색 결과">
      {/* 1. 상단 내비게이션 & 타이틀 헤더 */}
      <div className="bs-search-view-header">
        <button
          type="button"
          className="bs-return-dashboard-btn"
          onClick={onClearSearch}
        >
          <ArrowLeft size={16} />
          전체 실시간 통계로 돌아가기
        </button>

        <div className="bs-search-view-title">
          <h2>
            <strong>"{searchQuery}"</strong> 검색 결과
          </h2>
          <span className="bs-search-count-tag">
            {loading ? '검색 중…' : `스트리머 ${filtered.length}명`}
          </span>
        </div>
      </div>

      {/* 2. 필터 및 정렬 컨트롤 툴바 */}
      <div className="bs-streamer-toolbar">
        {/* 플랫폼 필터 */}
        <div className="bs-segment" role="group" aria-label="플랫폼 선택">
          <button
            type="button"
            aria-pressed={platformFilter === 'ALL'}
            onClick={() => setPlatformFilter('ALL')}
          >
            전체
          </button>
          <button
            type="button"
            aria-pressed={platformFilter === 'CHZZK'}
            onClick={() => setPlatformFilter('CHZZK')}
          >
            치지직
          </button>
          <button
            type="button"
            aria-pressed={platformFilter === 'SOOP'}
            onClick={() => setPlatformFilter('SOOP')}
          >
            SOOP
          </button>
        </div>

        {/* 활동 상태 필터 */}
        <div className="bs-segment" role="group" aria-label="방송 상태 선택">
          <button
            type="button"
            aria-pressed={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
          >
            전체 상태
          </button>
          <button
            type="button"
            aria-pressed={statusFilter === 'LIVE'}
            onClick={() => setStatusFilter('LIVE')}
          >
            🔴 지금 방송 중
          </button>
          <button
            type="button"
            aria-pressed={statusFilter === 'REGISTERED'}
            onClick={() => setStatusFilter('REGISTERED')}
          >
            VDébut 등록
          </button>
        </div>

        {/* 정렬 셀렉트 */}
        <div className="bs-sort-control">
          <label htmlFor="bs-streamer-sort" className="bs-sr-only">정렬 기준</label>
          <select
            id="bs-streamer-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="viewers">실시간 시청자순</option>
            <option value="followers">팔로워순</option>
            <option value="name">이름순</option>
          </select>
        </div>
      </div>

      {/* 3. 스트리머 카드 리스트 */}
      {loading ? (
        <div className="bs-list-loading">
          <Loader2 size={24} className="bs-spinning" />
          <p>치지직과 SOOP에서 스트리머 정보를 찾고 있어요…</p>
        </div>
      ) : sorted.length > 0 ? (
        <div className="bs-streamer-cards-grid">
          {sorted.map((streamer) => (
            <StatisticsStreamerCard
              key={streamer.channelKey || streamer.id}
              streamer={streamer}
              data={data}
              onOpenBroadcast={onOpenBroadcast}
              onRegisterStreamer={handleRegisterStreamer}
            />
          ))}
        </div>
      ) : (
        <div className="bs-empty-state-box">
          <h3>검색된 스트리머가 없습니다</h3>
          <p>
            "{searchQuery}"에 해당하는 스트리머를 찾지 못했어요.<br />
            이름의 띄어쓰기를 확인하거나 다른 키워드로 검색해 보세요.
          </p>
          <button
            type="button"
            className="bs-button bs-primary"
            onClick={onClearSearch}
          >
            전체 실시간 통계로 돌아가기
          </button>
        </div>
      )}
    </section>
  );
}
