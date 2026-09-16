import { useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { BroadcastStatistics, StatisticsBroadcast, StatisticsPeak } from '../../../../shared/broadcastStatistics';
import { StatisticsBrand } from './StatisticsBrand';
import { countFormat, dailyPlatformPeak, getChannelPeaks, inPlatform, platformName, STATISTICS_PLATFORMS, statisticsTime, type StatisticsCategory, type StatisticsFilters } from './statisticsModel';

// 현재 조회에 성공한 플랫폼의 합계와 각 플랫폼의 수집 범위를 함께 표시한다.
export function StatisticsPlatformRanking({ data, filters, onChange }: { data: BroadcastStatistics | null; filters: StatisticsFilters; onChange: (changes: Partial<StatisticsFilters>) => void }) {
  const sources = (data?.sources || []).filter((source) => inPlatform(source, filters.platform));
  const lives = (data?.lives || []).filter((row) => inPlatform(row, filters.platform));
  const hasCurrent = sources.some((source) => source.state === 'available' || source.state === 'partial');
  const sorted = [...sources].sort((a, b) => {
    const total = (platform: typeof a) => platform.state === 'unavailable' || platform.state === 'unsupported' ? -1 : lives.filter((row) => row.platform === platform.platform).reduce((sum, row) => sum + row.viewers, 0);
    return total(b) - total(a);
  });
  return <section className="bs-panel" aria-label="실시간 플랫폼 랭킹">
    <div className="bs-panel-head"><div><h2>실시간 플랫폼 랭킹</h2><p>수집된 방송의 현재 시청자 수 기준</p></div></div>
    <div className="bs-grand"><div><small>{filters.platform === 'ALL' ? '확인된 동시시청 합계' : `${platformName(filters.platform)} 동시시청 합계`}</small><strong>{hasCurrent ? countFormat(lives.reduce((sum, row) => sum + row.viewers, 0)) : '—'}</strong></div><small>{hasCurrent ? `${countFormat(lives.length)}개 방송 채널` : '통계 확인 중'}</small></div>
    <div className="bs-platform-list">{sorted.map((source, index) => {
      const current = lives.filter((row) => row.platform === source.platform);
      const valid = source.state === 'available' || source.state === 'partial';
      const peak = data ? dailyPlatformPeak(data, source.platform) : null;
      return <div className="bs-platform-row" key={source.platform}>
        <span className="bs-rank-number">{valid ? index + 1 : '—'}</span>
        <div><button type="button" className="bs-platform-choice" onClick={() => onChange({ platform: source.platform, category: null })}><StatisticsBrand platform={source.platform} /></button><p className="bs-small">{valid ? `${countFormat(current.length)}개 채널${source.state === 'partial' ? ' · 일부 확인' : ''}` : source.state === 'unsupported' ? '연결 준비 중' : '일시적으로 확인 불가'}</p></div>
        <div className="bs-values"><strong>{valid ? countFormat(current.reduce((sum, row) => sum + row.viewers, 0)) : '—'}</strong><p>오늘 확인 최고 {peak === null ? '—' : countFormat(peak)}</p></div>
      </div>;
    })}</div>
    {!data && <div className="bs-empty">플랫폼 통계를 불러오고 있어요.</div>}
    <p className="bs-panel-note">치지직 인기 방송 · SOOP 등록 채널 기준<br />플랫폼 전체 시청자 수와는 범위가 달라요.</p>
  </section>;
}

// 카테고리 카드는 실제 시청자 점유율과 채널 수로 정렬한다.
export function StatisticsCategoryRanking({ categories, total, filters, onSelect, loading }: { categories: StatisticsCategory[]; total: number; filters: StatisticsFilters; onSelect: (category: StatisticsCategory) => void; loading: boolean }) {
  const [sort, setSort] = useState<'viewers' | 'channels'>('viewers');
  const [expanded, setExpanded] = useState(false);
  const sorted = [...categories].sort((a, b) => b[sort] - a[sort] || b.viewers - a.viewers || a.key.localeCompare(b.key));
  const rows = expanded ? sorted : sorted.slice(0, 12);
  return <section className="bs-panel bs-category-panel" aria-label="실시간 카테고리 랭킹">
    <div className="bs-panel-head"><div><h2>실시간 카테고리 랭킹</h2><p>{platformName(filters.platform)} · {categories.length}개 카테고리 · 확인된 시청자 중 점유율</p></div><select aria-label="카테고리 정렬" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="viewers">시청자 많은 순</option><option value="channels">채널 많은 순</option></select></div>
    {rows.length ? <div className="bs-categories">{rows.map((category, index) => <button type="button" key={category.key} className="bs-category" aria-pressed={filters.category === category.key} onClick={() => onSelect(category)}>
      <span className="bs-category-meta"><span>{String(index + 1).padStart(2, '0')}</span><StatisticsBrand platform={category.platform} label={false} /></span>
      <span className="bs-category-name">{category.name}</span><strong>{countFormat(category.viewers)}</strong><span className="bs-small">{category.channels}개 채널 · {total ? (category.viewers / total * 100).toFixed(1) : '0.0'}%</span>
      <span className="bs-category-bar"><span style={{ width: `${total ? category.viewers / total * 100 : 0}%`, backgroundColor: STATISTICS_PLATFORMS.find((item) => item.id === category.platform)?.color }} /></span>
    </button>)}</div> : <div className="bs-empty">{loading ? '카테고리를 불러오고 있어요.' : '현재 선택한 플랫폼에 표시할 카테고리가 없어요.'}</div>}
    {sorted.length > 12 && <button type="button" className="bs-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? '카테고리 접기' : `카테고리 전체 ${sorted.length}개 보기`}</button>}
  </section>;
}

// 프로필 사진이 없을 때 스트리머 이름의 첫 글자를 표시한다.
function StatisticsAvatar({ row }: { row: StatisticsBroadcast }) {
  const [failed, setFailed] = useState(false);
  return <span className="bs-avatar">{row.imageUrl && !failed ? <img src={row.imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} /> : (row.channelName || '방송').slice(0, 1)}</span>;
}

// 실시간 랭킹은 현재 선택 콘텐츠의 방송만 표시한다.
export function StatisticsLiveRanking({ rows, categoryName, onClear, onSelect, loading }: { rows: StatisticsBroadcast[]; categoryName: string | null; onClear: () => void; onSelect: (id: string) => void; loading: boolean }) {
  const [limit, setLimit] = useState(6);
  const total = rows.reduce((sum, row) => sum + row.viewers, 0);
  return <section className="bs-panel" id="bs-live-ranking" aria-label="실시간 방송 랭킹">
    <div className="bs-panel-head"><div><h2><span className="bs-live-dot" />실시간 방송 랭킹</h2><p>현재 시청자 수 · {countFormat(rows.length)}개 방송</p></div></div>
    <div className="bs-filter-line"><span>{categoryName || '전체 콘텐츠'}</span>{categoryName && <button type="button" onClick={onClear}>선택 해제 <X size={12} /></button>}</div>
    <div className="bs-ranking-list">{rows.slice(0, limit).map((row, index) => <div className="bs-broadcast-row" key={row.id}>
      <span className="bs-rank-number">{index + 1}</span><StatisticsAvatar row={row} />
      <div className="bs-row-content"><button type="button" className="bs-person" onClick={() => onSelect(row.id)}>{row.channelName || '채널 정보 없음'} <span className="bs-live-tag">LIVE</span><ArrowUpRight size={13} /></button><p className="bs-stream-title" title={row.title}>{row.title}</p><p className="bs-small">{platformName(row.platform)} · {row.categoryName} · {row.startedAt ? `${statisticsTime(row.startedAt, true)} 시작` : '시작 시각 미제공'}</p></div>
      <div className="bs-values"><strong>{countFormat(row.viewers)}</strong><p>{total ? `${(row.viewers / total * 100).toFixed(1)}%` : '0.0%'}</p></div>
    </div>)}</div>
    {!rows.length && <div className="bs-empty">{loading ? '방송 목록을 불러오고 있어요.' : '현재 조건에서 확인된 방송이 없어요.'}</div>}
    {rows.length > 6 && <button type="button" className="bs-more" onClick={() => setLimit(limit >= rows.length ? 6 : Math.min(limit + 20, rows.length))}>{limit >= rows.length ? '방송 목록 접기' : `방송 더 보기 (${Math.min(limit, rows.length)}/${rows.length})`}</button>}
  </section>;
}

// 방송별 최고와 채널별 최고를 구분하고 고정된 18시간 집계 기간을 표시한다.
export function StatisticsPeakRanking({ data, rows, onSelect }: { data: BroadcastStatistics | null; rows: StatisticsPeak[]; onSelect: (id: string) => void }) {
  const [mode, setMode] = useState<'broadcast' | 'channel'>('broadcast');
  const [limit, setLimit] = useState(6);
  const displayed = mode === 'channel' ? getChannelPeaks(rows) : rows;
  return <section className="bs-panel" id="bs-peak-ranking" aria-label="최근 18시간 최고 시청자 랭킹">
    <div className="bs-panel-head"><div><h2>최근 18시간 최고</h2><p>{data ? `${statisticsTime(data.meta.peakFrom, true)} – ${statisticsTime(data.meta.generatedAt, true)}` : '기준 시각 확인 중'} KST</p></div><div className="bs-segment" aria-label="최고 기록 단위"><button type="button" aria-pressed={mode === 'broadcast'} onClick={() => { setMode('broadcast'); setLimit(6); }}>방송</button><button type="button" aria-pressed={mode === 'channel'} onClick={() => { setMode('channel'); setLimit(6); }}>채널</button></div></div>
    <p className="bs-peak-scope">저장된 치지직 기록과 현재 확인된 방송 기준</p>
    <div className="bs-ranking-list">{displayed.slice(0, limit).map((row, index) => <div className="bs-peak-row" key={row.id}><span className="bs-rank-number">{index + 1}</span><div className="bs-row-content"><button type="button" className="bs-person" onClick={() => onSelect(row.id)}>{row.channelName || `방송 #${row.streamId}`}</button><p className="bs-stream-title" title={row.title}>{mode === 'broadcast' ? row.title : `${platformName(row.platform)} · ${row.categoryName}`}</p><p className="bs-small">{platformName(row.platform)} · {row.isLive ? '현재 방송 중' : '지난 수집 기록'}</p></div><div className="bs-values"><strong>{countFormat(row.viewers)}</strong><p>{statisticsTime(row.peakAt, true)}</p></div></div>)}</div>
    {!displayed.length && <div className="bs-empty">최근 18시간에 확인된 최고 기록이 없어요.</div>}
    {displayed.length > 6 && <button type="button" className="bs-more" onClick={() => setLimit(limit >= displayed.length ? 6 : Math.min(limit + 20, displayed.length))}>{limit >= displayed.length ? '최고 기록 접기' : `기록 더 보기 (${Math.min(limit, displayed.length)}/${displayed.length})`}</button>}
    {mode === 'channel' && rows.some((row) => !row.channelKey) && <p className="bs-panel-note">채널이 확인된 방송만 채널 순위에 포함돼요.</p>}
  </section>;
}
