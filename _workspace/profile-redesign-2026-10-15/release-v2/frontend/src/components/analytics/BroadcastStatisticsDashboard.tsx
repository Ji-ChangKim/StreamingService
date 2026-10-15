import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Info, RefreshCw, X, ExternalLink, Sparkles } from 'lucide-react';
import type { BroadcastStatistics, StatisticsBroadcast } from '../../../../shared/broadcastStatistics';
import { StatisticsBrand } from './StatisticsBrand';
import { StatisticsChart } from './StatisticsChart';
import { StatisticsOpportunityPanel, StatisticsCategoryRanking, StatisticsLiveRanking, StatisticsPeakRanking } from './StatisticsPanels';
import { StatisticsRookieSpotlight } from './StatisticsRookieSpotlight';
import { StatisticsDateTabs } from './StatisticsDateTabs';
import { useBroadcastStatistics } from './useBroadcastStatistics';
import { aggregateStatisticsCategories, categoryKey, countFormat, downloadBroadcastStatistics, inPlatform, platformName, readStatisticsFilters, safeStatisticsUrl, STATISTICS_PLATFORMS, statisticsTime, getKstDateString, type StatisticsCategory, type StatisticsFilters } from './statisticsModel';
import { StatisticsStreamerSearch } from './StatisticsStreamerSearch';
import { StatisticsStreamerRecord } from './StatisticsStreamerRecord';
import { StatisticsStreamerList } from './StatisticsStreamerList';
import type { StatisticsStreamer } from '../../../../shared/statisticsStreamerSearch';
import './broadcastStatistics.css';

// 기본 dialog의 초점 이동과 Escape 닫기 및 백그라운드 스크롤 방지를 처리한다 (단일 책임)
function StatisticsDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();

    // 팝업 오픈 시 백그라운드 스크롤 방지 및 레이아웃 시프트 방지
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="bs-dialog"
      aria-labelledby="bs-dialog-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}
    >
      <div className="bs-dialog-heading">
        <h2 id="bs-dialog-title">{title}</h2>
        <button type="button" aria-label="닫기" onClick={() => dialog.current?.close()}>
          <X size={20} />
        </button>
      </div>
      <div className="bs-dialog-content">{children}</div>
    </dialog>
  );
}

// 각 방송의 확인된 정보와 실제 수집 기록을 표시한다 (단일 책임)
function BroadcastRecord({ row, data }: { row: StatisticsBroadcast; data: BroadcastStatistics }) {
  const peak = data.peaks.find((item) => item.id === row.id);
  const live = data.lives.find((item) => item.id === row.id);
  const channelUrl = safeStatisticsUrl(row.channelUrl);
  const liveUrl = safeStatisticsUrl(live?.liveUrl || null);

  return (
    <>
      <div className="bs-record-top">
        <StatisticsBrand platform={row.platform} />
        {row.isRookie && <span className="bs-rookie-tag"><Sparkles size={11} /> 신인 버튜버</span>}
      </div>
      <h3 className="bs-record-title">{row.title}</h3>
      <p className="bs-small">
        {row.categoryName} · {row.startedAt ? `${statisticsTime(row.startedAt, true)} 시작` : '실시간 라이브'}
      </p>
      <div className="bs-record-stats">
        <div>
          <span>현재 시청자</span>
          <strong>{live ? `${countFormat(live.viewers)}명` : '—'}</strong>
        </div>
        <div>
          <span>오늘의 최고 시청자</span>
          <strong>{peak ? `${countFormat(peak.viewers)}명` : '—'}</strong>
        </div>
      </div>
      <div className="bs-record-actions">
        {liveUrl && (
          <a className="bs-button bs-primary" href={liveUrl} target="_blank" rel="noopener noreferrer">
            방송 보러 가기 <ExternalLink size={14} /><span className="bs-sr-only">(새 창)</span>
          </a>
        )}
        {channelUrl && (
          <a className="bs-button" href={channelUrl} target="_blank" rel="noopener noreferrer">
            채널 방문하기 <ExternalLink size={14} /><span className="bs-sr-only">(새 창)</span>
          </a>
        )}
      </div>
      {!live && <p className="bs-small">현재 방송이 종료되었거나 휴식 중인 채널이에요.</p>}
      {peak?.samples.length ? (
        <div className="bs-data-table">
          <table>
            <caption>시간대별 시청자 수 기록</caption>
            <thead>
              <tr>
                <th>시각 (KST)</th>
                <th>시청자 수</th>
              </tr>
            </thead>
            <tbody>
              {peak.samples.map((sample, index) => (
                <tr key={`${sample.at}-${index}`}>
                  <td>{statisticsTime(sample.at, true)}</td>
                  <td>{countFormat(sample.viewers)}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="bs-small">아직 이전 방송 기록이 없어요.</p>
      )}
    </>
  );
}

// 통계 안내 및 활용 가이드 (유저 친화적 안내, 단일 책임)
function StatisticsScope() {
  return (
    <div className="bs-scope-content">
      <p>
        VDébut 방송 통계는 크리에이터가 방송 일정과 카테고리를 전략적으로 선택하고,
        팬과 시청자가 새로운 유망 버튜버를 쉽게 찾을 수 있도록 돕는 실시간 인텔리전스 허브예요.
      </p>
      <h3>지표 안내 및 활용 팁</h3>
      <ul>
        <li><strong>신인 버튜버 스포트라이트:</strong> 최근 데뷔하여 열심히 성장 중인 신인 버튜버들의 방송을 집중 조명해요.</li>
        <li><strong>카테고리 기회 분석:</strong> 방송 채널 수 대비 시청자 유입률이 높아 신규 방송이 진입하기 유리한 카테고리를 안내해요.</li>
        <li><strong>실시간 방송 순위:</strong> 치지직과 SOOP에서 현재 라이브 중인 버튜버들을 실시간 시청자 순으로 한눈에 살펴볼 수 있어요.</li>
        <li><strong>오늘의 최고 기록:</strong> 오늘 하루 동안 각 방송이 기록한 최고 시청자 수치예요.</li>
        <li><strong>실시간 추이 차트:</strong> 시간대별(골든타임 등) 시청 흐름과 전체 방송 채널 수의 변화를 파악할 수 있어요.</li>
      </ul>
      <p className="bs-small">
        실시간 데이터는 1분마다 자동으로 갱신되며, 모든 시간은 한국 시각(KST)을 기준으로 합니다.
      </p>
      <a href="/contact" className="bs-text-link">
        데이터 문의 및 피드백 <ExternalLink size={13} />
      </a>
    </div>
  );
}

// 방송 통계 메인 대시보드 컴포넌트
export function BroadcastStatisticsDashboard({ currentSubPath }: { currentSubPath?: string }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const p = new URLSearchParams(window.location.search).get('date');
    return p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null;
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return new URLSearchParams(window.location.search).get('search') || '';
  });
  const { data, loading, error, refresh } = useBroadcastStatistics(selectedDate);
  const [filters, setFilters] = useState(readStatisticsFilters);
  const [selectedStreamer, setSelectedStreamer] = useState<StatisticsStreamer | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'scope' | 'download' | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const legacyScrolled = useRef(false);

  useEffect(() => {
    setFilters(readStatisticsFilters());
    const sync = () => {
      setFilters(readStatisticsFilters());
      const p = new URLSearchParams(window.location.search).get('date');
      setSelectedDate(p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null);
      setSearchQuery(new URLSearchParams(window.location.search).get('search') || '');
      setSelectedId(null);
      setSelectedStreamer(null);
      setPanel(null);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [currentSubPath]);

  useEffect(() => {
    if (data && !legacyScrolled.current && new URLSearchParams(window.location.search).get('tab') === 'history') {
      document.getElementById('bs-peak-ranking')?.scrollIntoView({ block: 'start' });
      legacyScrolled.current = true;
    }
  }, [data]);

  const changeDate = (nextDate: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (nextDate) {
      params.set('date', nextDate);
    } else {
      params.delete('date');
    }
    const queryString = params.toString();
    window.history.pushState({}, '', `/analytics${queryString ? `?${queryString}` : ''}`);
    setSelectedDate(nextDate);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(window.location.search);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    const queryString = params.toString();
    window.history.pushState({}, '', `/analytics${queryString ? `?${queryString}` : ''}`);
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('search');
    const queryString = params.toString();
    window.history.pushState({}, '', `/analytics${queryString ? `?${queryString}` : ''}`);
    setSearchQuery('');
  };

  const changeFilters = (changes: Partial<StatisticsFilters>) => {
    const next = { ...filters, ...changes };
    const params = new URLSearchParams({ tab: 'live' });
    if (next.platform !== 'ALL') params.set('platform', next.platform);
    if (next.category) params.set('category', next.category);
    if (next.hours !== 24) params.set('hours', String(next.hours));
    if (next.metric !== 'viewers') params.set('metric', next.metric);
    if (selectedDate) params.set('date', selectedDate);
    if (searchQuery) params.set('search', searchQuery);
    window.history.pushState({}, '', `/analytics?${params.toString()}`);
    setFilters(next);
  };

  const scopedLives = (data?.lives || []).filter((row) => inPlatform(row, filters.platform));
  const categories = aggregateStatisticsCategories(scopedLives);
  const allCategories = aggregateStatisticsCategories(data?.lives || []);
  const selectedCategoryName = filters.category ? allCategories.find((c) => c.key === filters.category)?.name || '선택한 카테고리' : null;
  const liveRows = scopedLives.filter((row) => !filters.category || categoryKey(row) === filters.category);
  const peakRows = (data?.peaks || []).filter((row) => inPlatform(row, filters.platform) && (!filters.category || categoryKey(row) === filters.category));
  const selected = data?.lives.find((row) => row.id === selectedId) || data?.peaks.find((row) => row.id === selectedId);

  const selectCategory = (category: StatisticsCategory) => {
    changeFilters({ platform: category.platform, category: !category.key || filters.category === category.key ? null : category.key });
    document.getElementById('bs-live-ranking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openRecord = (id: string) => {
    setSelectedStreamer(null);
    setSelectedId(id);
  };

  const handleDownload = async () => {
    if (!data || downloadBusy) return;
    setDownloadBusy(true);
    setDownloadMessage('');
    try {
      await downloadBroadcastStatistics(data, filters);
      setDownloadMessage('선택 범위의 전체 데이터를 저장했어요.');
    } catch {
      setDownloadMessage('파일을 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setDownloadBusy(false);
    }
  };

  const isPast = Boolean(data?.meta.isPastDate || (selectedDate && selectedDate !== getKstDateString(0)));

  return (
    <div className="bs-dashboard">
      {/* 1. 상단 타이틀 및 스트리머 검색 헤더 */}
      <div className="bs-heading">
        <div>
          <div className="bs-eyebrow">STREAMING INTELLIGENCE</div>
          <h1>버튜버 방송 통계 & 기회 분석</h1>
          <p>지금의 실시간 방송 흐름부터, 나에게 꼭 맞는 유입 기회 카테고리까지.</p>
        </div>
        <StatisticsStreamerSearch
          data={data}
          onSearch={handleSearch}
          onSelectCategory={selectCategory}
          initialQuery={searchQuery}
        />
      </div>

      {/* 2. 스트리머 검색 결과 뷰 (검색어가 있을 때 전용 리스트 페이지 노출) */}
      {searchQuery ? (
        <StatisticsStreamerList
          searchQuery={searchQuery}
          data={data}
          onClearSearch={handleClearSearch}
          onOpenBroadcast={openRecord}
        />
      ) : (
        <>
          {/* 3. [신규] 일자별 과거 리포트 탐색 탭 바 */}
          <StatisticsDateTabs
            selectedDate={selectedDate}
            onSelectDate={changeDate}
            isPastDate={isPast}
          />

          {/* 4. 플랫폼 탭 및 유저 가이드 바 */}
          <div className="bs-toolbar">
            <nav className="bs-platform-tabs" aria-label="통계 플랫폼">
              <button
                type="button"
                aria-pressed={filters.platform === 'ALL'}
                onClick={() => changeFilters({ platform: 'ALL', category: null })}
              >
                전체 플랫폼
              </button>
              {STATISTICS_PLATFORMS.map((platform) => (
                <button
                  type="button"
                  key={platform.id}
                  aria-pressed={filters.platform === platform.id}
                  onClick={() => changeFilters({ platform: platform.id, category: null })}
                >
                  <StatisticsBrand platform={platform.id} />
                </button>
              ))}
            </nav>
            <div className="bs-toolbar-actions">
              <button
                type="button"
                className="bs-button"
                onClick={() => setPanel('scope')}
              >
                <Info size={14} /> 통계 안내
              </button>
              <button
                type="button"
                className="bs-button"
                onClick={() => { setPanel('download'); setDownloadMessage(''); }}
                disabled={!data}
              >
                <Download size={14} /> 데이터 내보내기
              </button>
            </div>
          </div>

          {/* 5. 업데이트 인디케이터 바 */}
          <div className="bs-update-bar">
            <span>
              {isPast
                ? `📅 ${data?.meta.targetDate || selectedDate} 방송 리포트 아카이브 (수집 기록)`
                : data
                  ? `${statisticsTime(data.meta.generatedAt, true)} KST 기준 · 1분마다 자동 갱신`
                  : loading
                    ? '현재 라이브 방송을 확인하고 있어요'
                    : '새로고침으로 다시 확인해 주세요'}
            </span>
            <button type="button" onClick={refresh} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'bs-spinning' : ''} />
              {loading ? '불러오는 중' : '새로고침'}
            </button>
          </div>

          {error && <div className="bs-error" role="alert">{error}</div>}

          {/* 6. 지금 방송 중인 신인 버튜버 스포트라이트 */}
          <StatisticsRookieSpotlight
            lives={scopedLives}
            onSelectBroadcast={openRecord}
          />

          {/* 7. 상단 그리드: 실시간 시계열 추이 & 카테고리 기회 분석 */}
          <div className="bs-top-grid">
            <StatisticsChart data={data} filters={filters} onChange={changeFilters} />
            <StatisticsOpportunityPanel categories={categories} filters={filters} onChange={changeFilters} />
          </div>

          {/* 8. 중단: 실시간 카테고리 점유율 현황 */}
          <StatisticsCategoryRanking
            categories={categories}
            filters={filters}
            onSelect={selectCategory}
            loading={loading}
          />

          {/* 9. 하단 그리드: 실시간 방송 랭킹 (버튜버/신인 필터 지원) & 오늘의 최고 기록 */}
          <div className="bs-lower-grid">
            <StatisticsLiveRanking
              rows={liveRows}
              categoryName={selectedCategoryName}
              onClear={() => changeFilters({ category: null })}
              onSelect={openRecord}
              loading={loading}
            />
            <StatisticsPeakRanking
              data={data}
              rows={peakRows}
              onSelect={openRecord}
            />
          </div>
        </>
      )}

      {/* 8. 푸터 안내 */}
      <div className="bs-footer-note">
        <span>VDébut · Every debut deserves an audience.</span>
        <button type="button" onClick={() => setPanel('scope')}>
          통계 가이드 및 활용 팁 <Info size={12} />
        </button>
      </div>

      {/* 팝업 모달들 */}
      {selected && data && (
        <StatisticsDialog title={`${selected.channelName || `방송 #${selected.streamId}`} · 방송 기록`} onClose={() => setSelectedId(null)}>
          <BroadcastRecord row={selected} data={data} />
        </StatisticsDialog>
      )}

      {selectedStreamer && (
        <StatisticsDialog title={`${selectedStreamer.name} · 스트리머 정보`} onClose={() => setSelectedStreamer(null)}>
          <StatisticsStreamerRecord streamer={selectedStreamer} data={data} onOpenBroadcast={openRecord} />
        </StatisticsDialog>
      )}

      {panel === 'scope' && (
        <StatisticsDialog title="버튜버 방송 통계 가이드" onClose={() => setPanel(null)}>
          <StatisticsScope />
        </StatisticsDialog>
      )}

      {panel === 'download' && (
        <StatisticsDialog title="통계 데이터 엑셀 내보내기" onClose={() => setPanel(null)}>
          <p>화면에 보이는 상위 항목을 포함해, 선택 범위의 전체 통계 자료를 엑셀 파일(.xlsx)로 저장합니다.</p>
          <dl className="bs-download-scope">
            <dt>선택 플랫폼</dt>
            <dd>{platformName(filters.platform)}</dd>
            <dt>카테고리</dt>
            <dd>{selectedCategoryName || '전체 카테고리'}</dd>
            <dt>추이 기간</dt>
            <dd>최근 {filters.hours}시간</dd>
          </dl>
          <button type="button" className="bs-button bs-primary" disabled={downloadBusy} onClick={() => void handleDownload()}>
            <Download size={15} />
            {downloadBusy ? '파일 준비 중…' : '엑셀 파일 저장 (.xlsx)'}
          </button>
          <p role="status" className="bs-download-status">{downloadMessage}</p>
        </StatisticsDialog>
      )}
    </div>
  );
}
