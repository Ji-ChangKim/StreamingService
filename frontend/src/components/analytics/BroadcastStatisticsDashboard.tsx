import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Info, RefreshCw, Search, X, ExternalLink } from 'lucide-react';
import type { BroadcastStatistics, StatisticsBroadcast } from '../../../../shared/broadcastStatistics';
import { StatisticsBrand } from './StatisticsBrand';
import { StatisticsChart } from './StatisticsChart';
import { StatisticsCategoryRanking, StatisticsLiveRanking, StatisticsPeakRanking, StatisticsPlatformRanking } from './StatisticsPanels';
import { useBroadcastStatistics } from './useBroadcastStatistics';
import { aggregateStatisticsCategories, categoryKey, countFormat, downloadBroadcastStatistics, inPlatform, platformName, readStatisticsFilters, safeStatisticsUrl, STATISTICS_PLATFORMS, statisticsTime, type StatisticsCategory, type StatisticsFilters } from './statisticsModel';
import './broadcastStatistics.css';

// 기본 dialog의 초점 이동과 Escape 닫기를 사용한다.
function StatisticsDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="bs-dialog" aria-labelledby="bs-dialog-title" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="bs-dialog-heading"><h2 id="bs-dialog-title">{title}</h2><button type="button" aria-label="닫기" onClick={() => dialog.current?.close()}><X size={20} /></button></div><div className="bs-dialog-content">{children}</div>
  </dialog>;
}

// 각 방송의 확인된 정보와 실제 수집 기록을 표시한다.
function BroadcastRecord({ row, data }: { row: StatisticsBroadcast; data: BroadcastStatistics }) {
  const peak = data.peaks.find((item) => item.id === row.id);
  const live = data.lives.find((item) => item.id === row.id);
  const channelUrl = safeStatisticsUrl(row.channelUrl);
  const liveUrl = safeStatisticsUrl(live?.liveUrl || null);
  return <>
    <StatisticsBrand platform={row.platform} /><h3 className="bs-record-title">{row.title}</h3>
    <p className="bs-small">{row.categoryName} · {row.startedAt ? `${statisticsTime(row.startedAt, true)} 시작` : '시작 시각 미제공'}</p>
    <div className="bs-record-stats"><div><span>현재 시청자</span><strong>{live ? countFormat(live.viewers) : '—'}</strong></div><div><span>최근 18시간 확인 최고</span><strong>{peak ? countFormat(peak.viewers) : '—'}</strong></div></div>
    <div className="bs-record-actions">{liveUrl && <a className="bs-button bs-primary" href={liveUrl} target="_blank" rel="noopener noreferrer">방송 보러 가기 <ExternalLink size={14} /><span className="bs-sr-only">(새 창)</span></a>}{channelUrl && <a className="bs-button" href={channelUrl} target="_blank" rel="noopener noreferrer">플랫폼 채널 <ExternalLink size={14} /><span className="bs-sr-only">(새 창)</span></a>}</div>
    {!live && <p className="bs-small">현재 수집된 방송 목록에 없는 지난 기록이에요.</p>}
    {peak?.samples.length ? <div className="bs-data-table"><table><caption>최근 18시간의 수집 기록</caption><thead><tr><th>시각 (KST)</th><th>시청자 수</th></tr></thead><tbody>{peak.samples.map((sample, index) => <tr key={`${sample.at}-${index}`}><td>{statisticsTime(sample.at, true)}</td><td>{countFormat(sample.viewers)}</td></tr>)}</tbody></table></div> : <p>아직 지난 시청 기록이 없어요.</p>}
  </>;
}

// 수집 범위와 지표의 시간 기준을 한곳에서 확인할 수 있게 한다.
function StatisticsScope({ data }: { data: BroadcastStatistics | null }) {
  return <div className="bs-scope-content">
    <p>인터넷 방송의 현재 시청 흐름과 인기 콘텐츠를 살펴보는 페이지예요. 플랫폼마다 제공하는 통계 범위가 다릅니다.</p>
    <h3>플랫폼별 수집 현황</h3>
    {data?.sources.map((source) => <div className="bs-source-status" key={source.platform}><StatisticsBrand platform={source.platform} /><div><strong>{source.scope}</strong><p>{source.state === 'available' ? '조회 완료' : source.state === 'partial' ? '일부 채널 확인 · 나머지 조회 지연' : source.state === 'unsupported' ? '통계 연결 준비 중' : '현재 통계를 가져오지 못했어요'}{source.observedAt ? ` · ${statisticsTime(source.observedAt, true)} KST` : ''}</p></div></div>)}
    <h3>지표를 읽는 방법</h3><ul>
      <li>동시시청 합계는 수집된 방송의 시청자 수를 더한 값이에요. 여러 방송을 동시에 보는 사람은 중복 포함될 수 있어요.</li>
      <li>오늘 확인 최고는 한국 시각 00:00 이후, 한 번에 수집한 플랫폼 시청자 합계 중 가장 큰 값이에요.</li>
      <li>최고 순위는 최근 18시간에 저장된 치지직 방송 기록과 현재 확인된 방송을 포함해요. 방송 단위와 채널 단위를 바꿔 볼 수 있어요.</li>
      <li>카테고리는 플랫폼별로 구분해요. 카테고리를 누르면 아래 방송 순위와 최고 기록을 함께 좁혀 볼 수 있어요.</li>
      <li>차트 기간은 추이에만 적용돼요. 실시간 순위는 현재, 최고 기록은 항상 최근 18시간 기준이에요.</li>
      <li>현재 방송은 1분마다 새로 확인해요. 지난 기록은 저장된 수집 시점만 표시하고, 90분 넘게 비어 있는 구간은 선을 이어 그리지 않아요.</li>
    </ul>
    <p className="bs-small">지난 기록 마지막 수집: {statisticsTime(data?.meta.lastHistoryAt || null, true)} KST</p>
    <a href="/contact" className="bs-text-link">통계 오류 제보 및 문의 <ExternalLink size={13} /></a>
  </div>;
}

// 승인된 정보 구조에 따라 통계 탐색의 필터와 화면 상태를 관리한다.
export function BroadcastStatisticsDashboard({ currentSubPath }: { currentSubPath?: string }) {
  const { data, loading, error, refresh } = useBroadcastStatistics();
  const [filters, setFilters] = useState(readStatisticsFilters);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'scope' | 'download' | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const legacyScrolled = useRef(false);
  useEffect(() => {
    setFilters(readStatisticsFilters());
    const sync = () => { setFilters(readStatisticsFilters()); setSelectedId(null); setPanel(null); };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [currentSubPath]);
  useEffect(() => {
    if (data && !legacyScrolled.current && new URLSearchParams(window.location.search).get('tab') === 'history') {
      document.getElementById('bs-peak-ranking')?.scrollIntoView({ block: 'start' });
      legacyScrolled.current = true;
    }
  }, [data]);

  const changeFilters = (changes: Partial<StatisticsFilters>) => {
    const next = { ...filters, ...changes };
    const params = new URLSearchParams({ tab: 'live' });
    if (next.platform !== 'ALL') params.set('platform', next.platform);
    if (next.category) params.set('category', next.category);
    if (next.hours !== 24) params.set('hours', String(next.hours));
    if (next.metric !== 'viewers') params.set('metric', next.metric);
    window.history.pushState({}, '', `/analytics?${params.toString()}`);
    setFilters(next);
    setQuery('');
  };
  const scopedLives = (data?.lives || []).filter((row) => inPlatform(row, filters.platform));
  const categories = aggregateStatisticsCategories(scopedLives);
  const allCategories = aggregateStatisticsCategories(data?.lives || []);
  const selectedCategoryName = filters.category ? allCategories.find((category) => category.key === filters.category)?.name || '선택한 카테고리' : null;
  const liveRows = scopedLives.filter((row) => !filters.category || categoryKey(row) === filters.category);
  const peakRows = (data?.peaks || []).filter((row) => inPlatform(row, filters.platform) && (!filters.category || categoryKey(row) === filters.category));
  const selected = data?.lives.find((row) => row.id === selectedId) || data?.peaks.find((row) => row.id === selectedId);
  const searchTerm = query.trim().toLocaleLowerCase();
  const matchingPeople = searchTerm ? (data?.lives || []).filter((row) => row.channelName?.toLocaleLowerCase().includes(searchTerm)).slice(0, 5) : [];
  const matchingCategories = searchTerm ? allCategories.filter((category) => category.name.toLocaleLowerCase().includes(searchTerm)).slice(0, 5) : [];
  const selectCategory = (category: StatisticsCategory) => {
    changeFilters({ platform: category.platform, category: filters.category === category.key ? null : category.key });
    document.getElementById('bs-live-ranking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const openRecord = (id: string) => { setSelectedId(id); setQuery(''); };
  const handleDownload = async () => {
    if (!data || downloadBusy) return;
    setDownloadBusy(true);
    setDownloadMessage('');
    try { await downloadBroadcastStatistics(data, filters); setDownloadMessage('선택 범위의 전체 데이터를 저장했어요.'); }
    catch { setDownloadMessage('파일을 저장하지 못했어요. 다시 시도해 주세요.'); }
    finally { setDownloadBusy(false); }
  };
  const currentDelayed = !!data && Date.now() - Date.parse(data.meta.generatedAt) > 120000;
  return <div className="bs-dashboard">
    <div className="bs-heading"><div><div className="bs-eyebrow">BROADCAST INSIGHTS</div><h1>방송 통계</h1><p>지금의 방송 흐름부터, 주목받는 콘텐츠까지.</p></div>
      <div className="bs-search-wrap"><label htmlFor="bs-search" className="bs-sr-only">스트리머·카테고리 검색</label><Search size={17} aria-hidden="true" /><input id="bs-search" type="search" value={query} placeholder="스트리머·카테고리 검색" autoComplete="off" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setQuery(''); }} />
        {searchTerm && <div className="bs-search-results" aria-label="검색 결과"><p>현재 수집된 방송에서 검색</p>{matchingPeople.map((row) => <button type="button" key={row.id} onClick={() => openRecord(row.id)}><span className="bs-small">스트리머 · {platformName(row.platform)}</span><strong>{row.channelName}</strong></button>)}{matchingCategories.map((category) => <button type="button" key={category.key} onClick={() => selectCategory(category)}><span className="bs-small">카테고리 · {platformName(category.platform)}</span><strong>{category.name}</strong></button>)}{!matchingPeople.length && !matchingCategories.length && <p>검색 결과가 없어요.</p>}</div>}
      </div>
    </div>
    <div className="bs-toolbar"><nav className="bs-platform-tabs" aria-label="통계 플랫폼"><button type="button" aria-pressed={filters.platform === 'ALL'} onClick={() => changeFilters({ platform: 'ALL', category: null })}>전체</button>{STATISTICS_PLATFORMS.map((platform) => <button type="button" key={platform.id} aria-pressed={filters.platform === platform.id} onClick={() => changeFilters({ platform: platform.id, category: null })}><StatisticsBrand platform={platform.id} /></button>)}</nav><button type="button" className="bs-button" onClick={() => { setPanel('download'); setDownloadMessage(''); }} disabled={!data}><Download size={15} />데이터 다운로드</button></div>
    <div className="bs-notice"><span className="bs-notice-label">안내</span><span>치지직 인기 방송과 SOOP 등록 채널의 통계를 제공해요.</span><button type="button" onClick={() => setPanel('scope')}><Info size={14} />수집 현황·기준</button></div>
    <div className="bs-update-bar"><span>{data ? `${statisticsTime(data.meta.generatedAt, true)} KST 기준 · 1분마다 갱신` : loading ? '현재 방송을 확인하고 있어요' : '새로고침으로 다시 확인해 주세요'}{currentDelayed ? ' · 갱신 지연' : ''}</span><button type="button" onClick={refresh} disabled={loading}><RefreshCw size={13} className={loading ? 'bs-spinning' : ''} />{loading ? '불러오는 중' : '새로고침'}</button></div>
    {error && <div className="bs-error" role="alert">{error}{data ? ' 마지막으로 확인된 통계를 표시하고 있어요.' : ''}</div>}
    {data?.sources.some((source) => source.state === 'unavailable' || source.state === 'partial') && <div className="bs-source-alert" role="status">{data.sources.filter((source) => source.state === 'unavailable' || source.state === 'partial').map((source) => platformName(source.platform)).join(' · ')} 통계 조회가 지연되고 있어요. 확인된 방송만 표시합니다.</div>}
    <div className="bs-top-grid"><StatisticsChart data={data} filters={filters} onChange={changeFilters} /><StatisticsPlatformRanking data={data} filters={filters} onChange={changeFilters} /></div>
    <StatisticsCategoryRanking categories={categories} total={scopedLives.reduce((sum, row) => sum + row.viewers, 0)} filters={filters} onSelect={selectCategory} loading={loading} />
    <div className="bs-lower-grid"><StatisticsLiveRanking rows={liveRows} categoryName={selectedCategoryName} onClear={() => changeFilters({ category: null })} onSelect={openRecord} loading={loading} /><StatisticsPeakRanking data={data} rows={peakRows} onSelect={openRecord} /></div>
    <aside className="bs-ad-slot" data-ad-slot="broadcast-statistics" hidden aria-label="광고" />
    <div className="bs-footer-note"><span>VDébut · Every debut deserves an audience.</span><button type="button" onClick={() => setPanel('scope')}>통계 기준 및 수집 현황 <Info size={12} /></button></div>
    {selected && data && <StatisticsDialog title={`${selected.channelName || `방송 #${selected.streamId}`} · 방송 기록`} onClose={() => setSelectedId(null)}><BroadcastRecord row={selected} data={data} /></StatisticsDialog>}
    {panel === 'scope' && <StatisticsDialog title="방송 통계 안내" onClose={() => setPanel(null)}><StatisticsScope data={data} /></StatisticsDialog>}
    {panel === 'download' && <StatisticsDialog title="전체 데이터 다운로드" onClose={() => setPanel(null)}><p>화면에 보이는 상위 항목을 포함해, 선택 범위의 전체 자료를 엑셀 파일로 저장해요.</p><dl className="bs-download-scope"><dt>플랫폼</dt><dd>{platformName(filters.platform)}</dd><dt>방송·최고 기록</dt><dd>{selectedCategoryName || '전체 카테고리'}</dd><dt>추이</dt><dd>최근 {filters.hours}시간 · 선택 플랫폼 전체</dd><dt>최고 기록</dt><dd>최근 18시간</dd></dl><p className="bs-small">집계 기준, 플랫폼, 실시간 방송, 카테고리, 시계열, 방송 최고, 채널 최고 — 총 7개 시트에 제공돼요. 미제공 수치는 빈칸으로 저장합니다.</p><button type="button" className="bs-button bs-primary" disabled={downloadBusy} onClick={() => void handleDownload()}><Download size={15} />{downloadBusy ? '파일 준비 중' : '전체 데이터 저장 (.xlsx)'}</button><p role="status" className="bs-download-status">{downloadMessage}</p></StatisticsDialog>}
  </div>;
}
