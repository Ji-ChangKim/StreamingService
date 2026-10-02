import { useEffect, useState } from 'react';
import { ExternalLink, Calendar, Clock, Flame, Loader2 } from 'lucide-react';
import type { BroadcastStatistics } from '../../../../shared/broadcastStatistics';
import type { StatisticsStreamer, StreamerBroadcastHistoryItem } from '../../../../shared/statisticsStreamerSearch';
import { StatisticsBrand } from './StatisticsBrand';
import { countFormat, safeStatisticsUrl, statisticsTime } from './statisticsModel';
import { fetchStreamerBroadcastHistory } from '../../services/broadcastStatisticsApi';

// 방송 진행 시간(시작~마지막 관측) 포맷터 (단일 책임)
function formatBroadcastDuration(startedAt: string | null, endedAt: string): string {
  if (!startedAt) return statisticsTime(endedAt, true);
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const diffMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const durationText = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  return `${statisticsTime(startedAt, true)} ~ ${statisticsTime(endedAt, false)} (${durationText})`;
}

// 개별 방송 이력 타임라인 아이템 컴포넌트 (단일 책임)
function StreamerTimelineItem({
  item,
  onOpenBroadcast,
}: {
  item: StreamerBroadcastHistoryItem;
  onOpenBroadcast: (id: string) => void;
}) {
  const liveUrl = safeStatisticsUrl(item.liveUrl);

  return (
    <div className="bs-timeline-card">
      <div className="bs-timeline-node" aria-hidden="true" />
      <div className="bs-timeline-content">
        <div className="bs-timeline-header">
          <span className="bs-timeline-time">
            <Clock size={12} />
            {formatBroadcastDuration(item.startedAt, item.lastObservedAt)}
          </span>
          <span className="bs-timeline-peak">
            <Flame size={13} />
            최고 {countFormat(item.peakViewers)}명
          </span>
        </div>
        <div className="bs-timeline-body">
          <strong className="bs-timeline-title">{item.title}</strong>
          <div className="bs-timeline-meta">
            <span className="bs-category-tag">{item.categoryName}</span>
          </div>
        </div>
        <div className="bs-timeline-actions">
          <button
            type="button"
            className="bs-button bs-small"
            onClick={() => onOpenBroadcast(item.streamId)}
          >
            상세 기록 보기
          </button>
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bs-button bs-small"
            >
              방송 보러 가기 <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// 스트리머 프로필 및 지난 방송 타임라인 팝업 컴포넌트 (단일 책임)
export function StatisticsStreamerRecord({
  streamer,
  data,
  onOpenBroadcast,
}: {
  streamer: StatisticsStreamer;
  data: BroadcastStatistics | null;
  onOpenBroadcast: (id: string) => void;
}) {
  const [history, setHistory] = useState<StreamerBroadcastHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const lives = streamer.channelKey ? (data?.lives || []).filter((row) => row.channelKey === streamer.channelKey) : [];
  const url = safeStatisticsUrl(streamer.channelUrl);
  const image = safeStatisticsUrl(streamer.imageUrl);

  useEffect(() => {
    let active = true;
    if (!streamer.channelKey) return;

    setLoadingHistory(true);
    fetchStreamerBroadcastHistory(streamer.channelKey)
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
  }, [streamer.channelKey]);

  return (
    <div className="bs-streamer-record-wrapper">
      {/* 1. 스트리머 프로필 헤더 */}
      <div className="bs-streamer-profile">
        {image && (
          <img
            src={image}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div>
          <h3>{streamer.name}</h3>
          <StatisticsBrand platform={streamer.platform} />
        </div>
      </div>

      {/* 2. 채널 바로가기 액션 */}
      <div className="bs-record-actions">
        {url && (
          <a className="bs-button bs-primary" href={url} target="_blank" rel="noopener noreferrer">
            플랫폼 채널 바로가기 <ExternalLink size={14} />
            <span className="bs-sr-only">(새 창)</span>
          </a>
        )}
        {streamer.profileSlug && (
          <a className="bs-button" href={`/creator/${encodeURIComponent(streamer.profileSlug)}`}>
            VDébut 프로필 보기
          </a>
        )}
      </div>

      {/* 3. 현재 라이브 상태 */}
      <div className="bs-streamer-section">
        <h4 className="bs-streamer-section-title">현재 진행 중인 방송</h4>
        {lives.length ? (
          lives.map((row) => (
            <button
              key={row.id}
              className="bs-streamer-broadcast"
              type="button"
              onClick={() => onOpenBroadcast(row.id)}
            >
              <span>
                <strong>{row.title}</strong>
                <span className="bs-small">{row.categoryName} · 방송 기록 보기</span>
              </span>
              <b>
                {countFormat(row.viewers)}명 <span className="bs-live-tag">LIVE</span>
              </b>
            </button>
          ))
        ) : (
          <p className="bs-small bs-empty-notice">
            현재 진행 중인 라이브 방송이 없어요.
          </p>
        )}
      </div>

      {/* 4. [신규] 최근 7일간 방송 타임라인 */}
      <div className="bs-streamer-section">
        <h4 className="bs-streamer-section-title">
          <Calendar size={15} /> 최근 7일 방송 이력 타임라인
        </h4>

        {loadingHistory ? (
          <div className="bs-history-loading">
            <Loader2 size={18} className="bs-spinning" />
            <span>지난 방송 기록을 불러오고 있어요...</span>
          </div>
        ) : history.length > 0 ? (
          <div className="bs-streamer-timeline">
            {history.map((item) => (
              <StreamerTimelineItem
                key={item.streamId}
                item={item}
                onOpenBroadcast={onOpenBroadcast}
              />
            ))}
          </div>
        ) : (
          <p className="bs-small bs-empty-notice">
            최근 7일간 수집된 방송 기록이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
