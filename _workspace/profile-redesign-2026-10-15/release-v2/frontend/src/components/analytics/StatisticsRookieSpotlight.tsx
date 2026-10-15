import { Sparkles, ExternalLink, Radio } from 'lucide-react';
import type { StatisticsBroadcast } from '../../../../shared/broadcastStatistics';
import { StatisticsBrand } from './StatisticsBrand';
import { countFormat, safeStatisticsUrl } from './statisticsModel';

interface RookieSpotlightProps {
  lives: StatisticsBroadcast[];
  onSelectBroadcast: (id: string) => void;
}

// 프로필 아바타 렌더링 헬퍼 (단일 책임)
function RookieAvatar({ row }: { row: StatisticsBroadcast }) {
  return (
    <span className="bs-rookie-avatar">
      {row.imageUrl ? (
        <img
          src={row.imageUrl}
          alt={row.channelName || ''}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        (row.channelName || '신인').slice(0, 1)
      )}
    </span>
  );
}

// 1. 단일 신인 버튜버 카드 렌더링 컴포넌트 (단일 책임)
function RookieCard({
  row,
  onSelect,
}: {
  row: StatisticsBroadcast;
  onSelect: (id: string) => void;
}) {
  const liveUrl = safeStatisticsUrl(row.liveUrl);

  return (
    <div className="bs-rookie-card">
      <div className="bs-rookie-card-header">
        <RookieAvatar row={row} />
        <div className="bs-rookie-info">
          <div className="bs-rookie-name-row">
            <button
              type="button"
              className="bs-rookie-name"
              onClick={() => onSelect(row.id)}
            >
              {row.channelName || '스트리머'}
            </button>
            <StatisticsBrand platform={row.platform} label={false} />
          </div>
          <span className="bs-rookie-badge">
            <Sparkles size={11} /> 신인 버튜버
          </span>
        </div>
        <div className="bs-rookie-viewers">
          <span className="bs-live-dot" />
          <strong>{countFormat(row.viewers)}</strong>명
        </div>
      </div>

      <p className="bs-rookie-title" title={row.title} onClick={() => onSelect(row.id)}>
        {row.title}
      </p>

      <div className="bs-rookie-card-footer">
        <span className="bs-rookie-category">{row.categoryName}</span>
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bs-rookie-link"
            aria-label={`${row.channelName || '스트리머'} 방송 보러 가기 (새 창)`}
          >
            방송 보러 가기 <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

// 2. 신인 버튜버 라이브 스포트라이트 메인 섹션 컴포넌트 (단일 책임)
export function StatisticsRookieSpotlight({ lives, onSelectBroadcast }: RookieSpotlightProps) {
  // 현재 라이브 중이면서 신인(isRookie) 플래그를 가진 스트리머 추출
  const rookies = lives.filter((row) => row.isRookie);

  return (
    <section className="bs-panel bs-rookie-spotlight-panel" aria-label="신인 버튜버 라이브 스포트라이트">
      <div className="bs-panel-head">
        <div>
          <h2>
            <Sparkles size={16} className="bs-sparkle-icon" />
            지금 방송 중인 신인 버튜버
          </h2>
          <p>첫 발을 내딛은 신인 버튜버들의 방송을 응원하고 함께해 주세요!</p>
        </div>
        <div className="bs-rookie-count-tag">
          <Radio size={12} />
          <span>LIVE <strong>{rookies.length}</strong>명</span>
        </div>
      </div>

      {rookies.length > 0 ? (
        <div className="bs-rookie-grid">
          {rookies.map((rookie) => (
            <RookieCard
              key={rookie.id}
              row={rookie}
              onSelect={onSelectBroadcast}
            />
          ))}
        </div>
      ) : (
        <div className="bs-rookie-empty">
          <p>지금 방송 중인 신인 버튜버가 잠시 쉬고 있어요.</p>
          <a href="/" className="bs-button bs-primary">
            데뷔 캘린더에서 데뷔 예정 버튜버 만나기
          </a>
        </div>
      )}
    </section>
  );
}
