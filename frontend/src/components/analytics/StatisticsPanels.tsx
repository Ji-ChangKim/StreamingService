import { useState, useMemo } from 'react';
import { ArrowUpRight, TrendingUp, X, Sparkles } from 'lucide-react';
import type { BroadcastStatistics, StatisticsBroadcast, StatisticsPeak } from '../../../../shared/broadcastStatistics';
import { countFormat, getChannelPeaks, platformName, statisticsTime, type StatisticsCategory, type StatisticsFilters } from './statisticsModel';

// 1. 카테고리 기회 분석 패널 (단일 책임)
// 경쟁 방송 수(채널) 대비 시청자가 많이 모여 유입 기회가 높은 카테고리를 직관적으로 안내한다.
export function StatisticsOpportunityPanel({
  categories,
  filters,
  onChange,
}: {
  categories: StatisticsCategory[];
  filters: StatisticsFilters;
  onChange: (changes: Partial<StatisticsFilters>) => void;
}) {
  // 채널당 평균 시청자 수가 높은 순으로 정렬 (기회 지수)
  const opportunities = useMemo(() => {
    return [...categories]
      .map((cat) => ({
        ...cat,
        avgViewersPerChannel: Math.round(cat.viewers / Math.max(1, cat.channels)),
      }))
      .sort((a, b) => b.avgViewersPerChannel - a.avgViewersPerChannel || b.viewers - a.viewers)
      .slice(0, 4);
  }, [categories]);

  const totalViewers = categories.reduce((sum, c) => sum + c.viewers, 0);
  const totalChannels = categories.reduce((sum, c) => sum + c.channels, 0);

  return (
    <section className="bs-panel bs-opportunity-panel" aria-label="카테고리 기회 분석">
      <div className="bs-panel-head">
        <div>
          <h2>
            <TrendingUp size={16} className="bs-opportunity-icon" />
            카테고리 기회 분석
          </h2>
          <p>방송 채널 대비 시청자가 많이 유입되는 추천 카테고리예요</p>
        </div>
      </div>

      <div className="bs-grand">
        <div>
          <small>{filters.platform === 'ALL' ? '실시간 동시시청 합계' : `${platformName(filters.platform)} 동시시청 합계`}</small>
          <strong>{countFormat(totalViewers)}명</strong>
        </div>
        <small>{countFormat(totalChannels)}개 라이브 방송 중</small>
      </div>

      <div className="bs-opportunity-list">
        <p className="bs-opportunity-hint">💡 채널당 시청자 유입이 활발한 카테고리</p>
        {opportunities.map((item, index) => {
          const isSelected = filters.category === item.key;
          return (
            <button
              type="button"
              key={item.key}
              className={`bs-opportunity-row ${isSelected ? 'is-active' : ''}`}
              onClick={() => onChange({ category: isSelected ? null : item.key })}
              title="클릭하여 해당 카테고리 방송 모아보기"
            >
              <div className="bs-opportunity-rank">{index + 1}</div>
              <div className="bs-opportunity-name-wrap">
                <div className="bs-opportunity-name">
                  <strong>{item.name}</strong>
                </div>
                <span className="bs-small">{item.channels}개 채널 방송 중</span>
              </div>
              <div className="bs-opportunity-stats">
                <strong>채널당 ~{countFormat(item.avgViewersPerChannel)}명</strong>
                <p>총 {countFormat(item.viewers)}명</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// 2. 실시간 카테고리 랭킹 (인터랙티브 트렌드 칩 바 형태, 공간 75% 절약 및 원클릭 필터)
export function StatisticsCategoryRanking({
  categories,
  filters,
  onSelect,
  loading,
}: {
  categories: StatisticsCategory[];
  filters: StatisticsFilters;
  onSelect: (category: StatisticsCategory) => void;
  loading: boolean;
}) {
  const [sort, setSort] = useState<'viewers' | 'channels'>('viewers');
  const [expanded, setExpanded] = useState(false);
  const sorted = [...categories].sort((a, b) => b[sort] - a[sort] || b.viewers - a.viewers || a.key.localeCompare(b.key));
  const rows = expanded ? sorted : sorted.slice(0, 10);

  return (
    <section className="bs-panel bs-category-panel" aria-label="실시간 인기 카테고리">
      <div className="bs-panel-head">
        <div>
          <h2>실시간 인기 카테고리</h2>
          <p>{platformName(filters.platform)} · {categories.length}개 카테고리 · 클릭하여 방송 목록 필터링</p>
        </div>
        <div className="bs-category-controls">
          {filters.category && (
            <button
              type="button"
              className="bs-category-clear-btn"
              onClick={() => onSelect({ key: '', platform: 'CHZZK', name: '', viewers: 0, channels: 0 })}
            >
              선택 해제 <X size={12} />
            </button>
          )}
          <select aria-label="카테고리 정렬" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="viewers">시청자 많은 순</option>
            <option value="channels">채널 많은 순</option>
          </select>
        </div>
      </div>

      {rows.length ? (
        <div className="bs-category-chips">
          {rows.map((category) => {
            const isSelected = filters.category === category.key;
            return (
              <button
                type="button"
                key={category.key}
                className={`bs-category-chip ${isSelected ? 'is-selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => onSelect(category)}
              >
                <span className="bs-chip-name">{category.name}</span>
                <span className="bs-chip-viewers">{countFormat(category.viewers)}명</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bs-empty">{loading ? '카테고리를 불러오고 있어요.' : '현재 선택한 조건에 표시할 카테고리가 없어요.'}</div>
      )}

      {sorted.length > 10 && (
        <button type="button" className="bs-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? '카테고리 접기' : `카테고리 전체 ${sorted.length}개 보기`}
        </button>
      )}
    </section>
  );
}

// 프로필 사진 아바타 렌더링 헬퍼 (단일 책임)
function StatisticsAvatar({ row }: { row: StatisticsBroadcast }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="bs-avatar">
      {row.imageUrl && !failed ? (
        <img src={row.imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        (row.channelName || '방송').slice(0, 1)
      )}
    </span>
  );
}

// 3. 실시간 방송 랭킹 (버튜버 전용 및 신인 필터 지원, 단일 책임)
export function StatisticsLiveRanking({
  rows,
  categoryName,
  onClear,
  onSelect,
  loading,
}: {
  rows: StatisticsBroadcast[];
  categoryName: string | null;
  onClear: () => void;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const [limit, setLimit] = useState(6);
  const [filterMode, setFilterMode] = useState<'vtuber' | 'rookie' | 'all'>('vtuber');

  const filteredRows = useMemo(() => {
    if (filterMode === 'rookie') return rows.filter((r) => r.isRookie);
    if (filterMode === 'vtuber') return rows.filter((r) => r.isVtuber || r.platform === 'SOOP');
    return rows;
  }, [rows, filterMode]);

  const total = filteredRows.reduce((sum, row) => sum + row.viewers, 0);

  return (
    <section className="bs-panel" id="bs-live-ranking" aria-label="실시간 방송 랭킹">
      <div className="bs-panel-head">
        <div>
          <h2>
            <span className="bs-live-dot" />
            실시간 방송 랭킹
          </h2>
          <p>현재 시청자 수 · {countFormat(filteredRows.length)}개 방송</p>
        </div>
        <div className="bs-segment" aria-label="방송 필터">
          <button
            type="button"
            aria-pressed={filterMode === 'vtuber'}
            onClick={() => { setFilterMode('vtuber'); setLimit(6); }}
          >
            버튜버
          </button>
          <button
            type="button"
            aria-pressed={filterMode === 'rookie'}
            onClick={() => { setFilterMode('rookie'); setLimit(6); }}
          >
            <Sparkles size={11} style={{ display: 'inline', marginRight: 2 }} />신인
          </button>
          <button
            type="button"
            aria-pressed={filterMode === 'all'}
            onClick={() => { setFilterMode('all'); setLimit(6); }}
          >
            전체
          </button>
        </div>
      </div>

      <div className="bs-filter-line">
        <span>{categoryName || '전체 콘텐츠'}</span>
        {categoryName && (
          <button type="button" onClick={onClear}>
            선택 해제 <X size={12} />
          </button>
        )}
      </div>

      <div className="bs-ranking-list">
        {filteredRows.slice(0, limit).map((row, index) => (
          <div className="bs-broadcast-row" key={row.id}>
            <span className="bs-rank-number">{index + 1}</span>
            <StatisticsAvatar row={row} />
            <div className="bs-row-content">
              <button type="button" className="bs-person" onClick={() => onSelect(row.id)}>
                {row.channelName || '채널 정보 없음'}
                <span className="bs-live-tag">LIVE</span>
                {row.isRookie && <span className="bs-rookie-tag">신인</span>}
                <ArrowUpRight size={13} />
              </button>
              <p className="bs-stream-title" title={row.title}>{row.title}</p>
              <p className="bs-small">
                {platformName(row.platform)} · {row.categoryName}
                {row.startedAt ? ` · ${statisticsTime(row.startedAt, true)} 시작` : ''}
              </p>
            </div>
            <div className="bs-values">
              <strong>{countFormat(row.viewers)}명</strong>
              <p>{total ? `${(row.viewers / total * 100).toFixed(1)}%` : '0.0%'}</p>
            </div>
          </div>
        ))}
      </div>

      {!filteredRows.length && (
        <div className="bs-empty">
          {loading ? '방송 목록을 불러오고 있어요.' : '현재 조건에서 확인된 방송이 없어요.'}
        </div>
      )}

      {filteredRows.length > 6 && (
        <button
          type="button"
          className="bs-more"
          onClick={() => setLimit(limit >= filteredRows.length ? 6 : Math.min(limit + 20, filteredRows.length))}
        >
          {limit >= filteredRows.length ? '방송 목록 접기' : `방송 더 보기 (${Math.min(limit, filteredRows.length)}/${filteredRows.length})`}
        </button>
      )}
    </section>
  );
}

// 4. 오늘의 최고 기록 랭킹 패널 (단일 책임)
export function StatisticsPeakRanking({
  data,
  rows,
  onSelect,
}: {
  data: BroadcastStatistics | null;
  rows: StatisticsPeak[];
  onSelect: (id: string) => void;
}) {
  const [mode, setMode] = useState<'broadcast' | 'channel'>('broadcast');
  const [limit, setLimit] = useState(6);
  const displayed = mode === 'channel' ? getChannelPeaks(rows) : rows;

  return (
    <section className="bs-panel" id="bs-peak-ranking" aria-label="오늘의 최고 시청자 랭킹">
      <div className="bs-panel-head">
        <div>
          <h2>오늘의 최고 기록</h2>
          <p>{data ? `${statisticsTime(data.meta.peakFrom, true)} 이후 최고 시청자` : '기준 시각 확인 중'} KST</p>
        </div>
        <div className="bs-segment" aria-label="최고 기록 단위">
          <button type="button" aria-pressed={mode === 'broadcast'} onClick={() => { setMode('broadcast'); setLimit(6); }}>
            방송
          </button>
          <button type="button" aria-pressed={mode === 'channel'} onClick={() => { setMode('channel'); setLimit(6); }}>
            채널
          </button>
        </div>
      </div>

      <div className="bs-ranking-list">
        {displayed.slice(0, limit).map((row, index) => (
          <div className="bs-peak-row" key={row.id}>
            <span className="bs-rank-number">{index + 1}</span>
            <div className="bs-row-content">
              <button type="button" className="bs-person" onClick={() => onSelect(row.id)}>
                {row.channelName || `방송 #${row.streamId}`}
              </button>
              <p className="bs-stream-title" title={row.title}>
                {mode === 'broadcast' ? row.title : `${platformName(row.platform)} · ${row.categoryName}`}
              </p>
              <p className="bs-small">
                {platformName(row.platform)} · {row.isLive ? '현재 방송 중' : '기록 완료'}
              </p>
            </div>
            <div className="bs-values">
              <strong>{countFormat(row.viewers)}명</strong>
              <p>{statisticsTime(row.peakAt, true)}</p>
            </div>
          </div>
        ))}
      </div>

      {!displayed.length && (
        <div className="bs-empty">오늘 확인된 최고 기록이 아직 없어요.</div>
      )}

      {displayed.length > 6 && (
        <button
          type="button"
          className="bs-more"
          onClick={() => setLimit(limit >= displayed.length ? 6 : Math.min(limit + 20, displayed.length))}
        >
          {limit >= displayed.length ? '최고 기록 접기' : `기록 더 보기 (${Math.min(limit, displayed.length)}/${displayed.length})`}
        </button>
      )}
    </section>
  );
}
