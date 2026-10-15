import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlatformFilter,
  HistoryRecordItem,
  HourlyDistributionItem,
  CreatorHistoryItem,
  fetchLiveHistory,
  fetchCreatorHistory,
} from '../../services/analyticsApiService';
import {
  Search,
  Calendar,
  Clock,
  Radio,
  Gamepad2,
  MessageCircle,
  Music,
  Palette,
  Sparkles,
  Layers,
  RotateCw,
  X,
  ExternalLink,
  User,
  TrendingUp,
} from 'lucide-react';

interface HistoryDiscoveryViewProps {
  initialPlatform?: PlatformFilter;
  initialCreator?: string | null;
  onNavigateTab?: (tab: string) => void;
}

/**
 * 1. 카테고리별 아이콘 매퍼 (단일 책임)
 */
function getCategoryIcon(key: string) {
  switch (key) {
    case 'GAME':
      return <Gamepad2 className="w-3.5 h-3.5" />;
    case 'TALK':
      return <MessageCircle className="w-3.5 h-3.5" />;
    case 'MUSIC':
      return <Music className="w-3.5 h-3.5" />;
    case 'ART':
      return <Palette className="w-3.5 h-3.5" />;
    case 'ASMR':
      return <Sparkles className="w-3.5 h-3.5" />;
    default:
      return <Layers className="w-3.5 h-3.5" />;
  }
}

/**
 * 2. KST 기준 최근 7일 날짜 목록 생성 (단일 책임)
 */
function getRecent7Days(): Array<{ dateStr: string; label: string; isToday: boolean }> {
  const days: Array<{ dateStr: string; label: string; isToday: boolean }> = [];
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(kstNow.getTime() - i * 24 * 3600 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const m = d.getUTCMonth() + 1;
    const dateNum = d.getUTCDate();
    const dayOfWeek = dayNames[d.getUTCDay()];

    let label = `${m}/${dateNum}(${dayOfWeek})`;
    if (i === 0) label = `오늘 · ${m}/${dateNum}`;
    else if (i === 1) label = `어제 · ${m}/${dateNum}`;

    days.push({
      dateStr,
      label,
      isToday: i === 0,
    });
  }

  return days;
}

/**
 * 3. 플랫폼 공식 배지 (타사 브랜드 무가공 원칙 준수)
 */
function PlatformBrandBadge({ platform }: { platform: 'CHZZK' | 'SOOP' }) {
  if (platform === 'CHZZK') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/75 text-white backdrop-blur-xs border border-white/10">
        <img
          src="/icons/chzzk_icon.png"
          alt="치지직"
          className="w-3.5 h-3.5 object-contain shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/icons/logo_chzzk.png';
          }}
        />
        <span>치지직</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/75 text-white backdrop-blur-xs border border-white/10">
      <img
        src="/icons/soop/soop_symbol_white.svg"
        alt="SOOP"
        className="w-3.5 h-3.5 object-contain shrink-0"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/icons/soop/soop_symbol_blue.svg';
        }}
      />
      <span>SOOP</span>
    </span>
  );
}

/**
 * 4. 과거 방송 기록 카드 컴포넌트 (단일 책임: 기록 렌더링)
 */
function HistoryRecordCard({
  record,
  onSelectCreator,
}: {
  record: HistoryRecordItem;
  onSelectCreator: (name: string) => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => {
        if (record.liveUrl) window.open(record.liveUrl, '_blank');
      }}
      className="bg-white border border-[#CBD5E1] hover:border-indigo-400 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col group cursor-pointer"
      title={`${record.liveTitle} - 채널 방문하기`}
    >
      {/* 썸네일 영역 */}
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        {record.channelImageUrl && !imageError ? (
          <img
            src={record.channelImageUrl}
            alt={record.channelName}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 mb-2">
              <User className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-300 line-clamp-1">{record.channelName}</span>
          </div>
        )}

        {/* 좌상단 플랫폼 & 기록 배지 */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <PlatformBrandBadge platform={record.platform} />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-indigo-600/90 text-white backdrop-blur-xs shadow-xs">
            <Clock className="w-3 h-3 text-indigo-200" />
            <span>기록</span>
          </span>
        </div>

        {/* 우하단 당시 관측 시청자 수 */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-xs font-mono font-black bg-black/75 text-white backdrop-blur-xs">
          {record.viewerCount.toLocaleString()}명 관측
        </div>
      </div>

      {/* 본문 정보 영역 */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* 스트리머 프로필 & 이름 */}
          <div className="flex items-center gap-2 mb-2">
            {record.channelImageUrl && (
              <img
                src={record.channelImageUrl}
                alt={record.channelName}
                className="w-6 h-6 rounded-full border border-slate-200 object-cover shrink-0"
              />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCreator(record.channelName);
              }}
              className="text-xs sm:text-sm font-black text-[#0F172A] hover:text-indigo-600 transition-colors text-left truncate cursor-pointer"
              title={`${record.channelName} 활동 기록 보기`}
            >
              {record.channelName}
            </button>
          </div>

          {/* 방송 제목 */}
          <h3
            className="text-sm sm:text-base font-bold text-[#0F172A] line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors mb-2.5"
            title={record.liveTitle}
          >
            {record.liveTitle}
          </h3>

          {/* 카테고리 태그 및 관측 시각 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {getCategoryIcon(record.categoryGroup)}
              <span className="truncate max-w-[150px]">{record.categoryName}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{record.observedAt.slice(11, 16)} 관측</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. 스트리머 상세 활동 히스토리 팝업 모달 (단일 책임)
 */
function CreatorHistoryModal({
  streamerName,
  onClose,
}: {
  streamerName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<CreatorHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchCreatorHistory(streamerName)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [streamerName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#CBD5E1] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* 상단 모달 헤더 */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            {data?.channelImageUrl ? (
              <img
                src={data.channelImageUrl}
                alt={streamerName}
                className="w-11 h-11 rounded-2xl border border-slate-200 object-cover shadow-2xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                {streamerName.slice(0, 1)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#0F172A]">{streamerName}</h3>
                {data && <PlatformBrandBadge platform={data.platform} />}
              </div>
              <p className="text-xs text-slate-500 font-medium">스트리머 활동 및 방송 기록</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm font-medium">
              <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              활동 기록을 불러오는 중입니다...
            </div>
          ) : !data ? (
            <div className="py-10 text-center text-slate-500 text-sm">
              관측된 스트리머 활동 기록이 없습니다.
            </div>
          ) : (
            <>
              {/* 주요 카테고리 태그 */}
              <div>
                <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>주요 방송 콘텐츠</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.frequentCategories.map((c) => (
                    <span
                      key={c.name}
                      className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                    >
                      {c.name} <span className="font-mono text-[11px] opacity-75">({c.count}회)</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* 최근 방송 기록 타임라인 */}
              <div>
                <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>최근 방송 내역 (최근 10회)</span>
                </div>
                <div className="space-y-2">
                  {data.recentStreams.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-bold text-indigo-700">
                          {s.date} {String(s.hour).padStart(2, '0')}:00대
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {s.viewerCount.toLocaleString()}명 관측
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-[#0F172A] line-clamp-1 mb-1">
                        {s.title}
                      </div>
                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {s.categoryName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 모달 하단 버튼 */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          {data?.channelUrl && (
            <a
              href={data.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>채널 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * 메인 HistoryDiscoveryView 컴포넌트
 * ============================================================================
 */
export function HistoryDiscoveryView({
  initialPlatform = 'ALL',
  initialCreator = null,
  onNavigateTab,
}: HistoryDiscoveryViewProps) {
  const recentDays = useMemo(() => getRecent7Days(), []);
  const todayStr = recentDays[0].dateStr;

  // 현재 KST 시각 기준 시간대
  const currentKstHour = useMemo(() => {
    const kst = new Date(Date.now() + 9 * 3600 * 1000);
    return kst.getUTCHours();
  }, []);

  // 상태 관리
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedHour, setSelectedHour] = useState<number>(currentKstHour);
  const [platform, setPlatform] = useState<PlatformFilter>(initialPlatform);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  // 스트리머 상세 모달 상태
  const [modalCreator, setModalCreator] = useState<string | null>(initialCreator);

  // 데이터 상태
  const [records, setRecords] = useState<HistoryRecordItem[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<HourlyDistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 데이터 로드
  const loadHistoryData = useCallback(
    async (isManualRefresh: boolean = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await fetchLiveHistory({
          date: selectedDate,
          hour: selectedHour,
          platform,
          category: selectedCategory,
          query: searchQuery,
        });

        setRecords(res.records);
        setHourlyDistribution(res.hourlyDistribution);
      } catch (err) {
        console.error('Failed to load history data:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedDate, selectedHour, platform, selectedCategory, searchQuery]
  );

  useEffect(() => {
    loadHistoryData();
  }, [selectedDate, selectedHour, platform, selectedCategory, searchQuery, loadHistoryData]);

  // 검색 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  // 최대 방송 수 기준 (타임라인 높이 비율 산출용)
  const maxLiveCount = useMemo(() => {
    const max = Math.max(...hourlyDistribution.map((h) => h.liveCount), 1);
    return max;
  }, [hourlyDistribution]);

  // 카테고리 목록
  const categories = [
    { key: 'ALL', name: '전체' },
    { key: 'GAME', name: '게임' },
    { key: 'TALK', name: '잡담·소통' },
    { key: 'MUSIC', name: '음악·노래' },
    { key: 'ART', name: '그림·아트' },
    { key: 'ASMR', name: 'ASMR' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. 상단 헤더: "방송 기록" + 검색창 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 bg-white border border-[#CBD5E1] p-4 sm:p-5 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">
              방송 기록
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            특정 날짜와 시간대에 진행된 버튜버 방송 기록과 스트리머의 활동을 확인할 수 있습니다.
          </p>
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 shrink-0">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="스트리머 또는 방송 제목 검색"
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-indigo-500 focus:bg-white focus:outline-none rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-bold text-[#0F172A] placeholder:text-slate-500 transition-all shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800 text-xs font-black cursor-pointer"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* 2. 날짜 선택 칩 & 24시간 타임라인 컨트롤 바 */}
      <div className="bg-white border border-[#CBD5E1] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-4">
        {/* 날짜 선택 칩 바 */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 mr-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>날짜 선택:</span>
            </div>
            {recentDays.map((d) => {
              const isSelected = selectedDate === d.dateStr;
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => loadHistoryData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="새로고침"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>

        {/* 24시간 가로 타임라인 바 (00:00 ~ 23:00) */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>시간대 선택 (24시간 타임라인):</span>
              <span className="text-indigo-600 font-black">
                {String(selectedHour).padStart(2, '0')}:00대 관측 기록
              </span>
            </div>
            <span className="text-[11px] text-slate-400">시간대를 클릭하여 해당 시점 기록을 조회하세요</span>
          </div>

          {/* 24개 시간대 슬롯 가로 스크롤 */}
          <div className="flex items-end gap-1.5 overflow-x-auto pb-2 pt-4 scrollbar-thin">
            {hourlyDistribution.map((item) => {
              const isSelected = selectedHour === item.hour;
              const heightPercent = Math.max(Math.round((item.liveCount / maxLiveCount) * 100), 15);

              return (
                <button
                  key={item.hour}
                  type="button"
                  onClick={() => setSelectedHour(item.hour)}
                  className={`flex flex-col items-center min-w-[48px] p-1.5 rounded-xl transition-all cursor-pointer group shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  {/* 방송 수 시각화 미니 바 */}
                  <div className="w-3 h-8 flex items-end justify-center mb-1.5">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-sm transition-all ${
                        isSelected ? 'bg-white' : 'bg-indigo-300 group-hover:bg-indigo-400'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-black font-mono">
                    {String(item.hour).padStart(2, '0')}시
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1 rounded-sm mt-0.5 ${
                      isSelected ? 'bg-white/20 text-white' : 'text-slate-500'
                    }`}
                  >
                    {item.liveCount}개
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 플랫폼 및 카테고리 필터 바 */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* 플랫폼 토글 */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={() => setPlatform('ALL')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                platform === 'ALL'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>전체 플랫폼</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform('CHZZK')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                platform === 'CHZZK'
                  ? 'bg-[#0F172A] text-white shadow-sm border border-emerald-500/40'
                  : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80'
              }`}
            >
              <img src="/icons/chzzk_icon.png" alt="치지직" className="w-3.5 h-3.5 object-contain" />
              <span>치지직</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform('SOOP')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                platform === 'SOOP'
                  ? 'bg-[#0F172A] text-white shadow-sm border border-blue-500/40'
                  : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80'
              }`}
            >
              <img
                src={platform === 'SOOP' ? '/icons/soop/soop_symbol_white.svg' : '/icons/soop/soop_symbol_blue.svg'}
                alt="SOOP"
                className="w-3.5 h-3.5 object-contain"
              />
              <span>SOOP</span>
            </button>
          </div>

          {/* 카테고리 필터 칩 */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => {
              const isCatActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    isCatActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 결과 상태 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm sm:text-base font-black text-[#0F172A]">
            {selectedDate} {String(selectedHour).padStart(2, '0')}:00대 관측 기록
          </span>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {isLoading ? '기록 확인 중...' : `${records.length}개 방송 관측`}
          </span>
        </div>
      </div>

      {/* 4. 방송 기록 카드 그리드 */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded w-5/6" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center my-6 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#0F172A] mb-1.5">
            선택한 조건에서 관측된 방송 기록이 없습니다
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-md mx-auto mb-6">
            해당 일자나 시간대에는 진행 중인 방송이 없었거나 필터 조건에 부합하는 방송이 없습니다.
            다른 시간대를 선택하거나 현재 진행 중인 LIVE 방송을 확인해보세요.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
                setSearchInput('');
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
            >
              필터 초기화
            </button>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('live')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5 text-rose-500" />
                <span>현재 LIVE 방송 보기</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {records.map((record) => (
            <HistoryRecordCard
              key={record.id}
              record={record}
              onSelectCreator={(name) => setModalCreator(name)}
            />
          ))}
        </div>
      )}

      {/* 5. 스트리머 상세 활동 모달 */}
      {modalCreator && (
        <CreatorHistoryModal
          streamerName={modalCreator}
          onClose={() => setModalCreator(null)}
        />
      )}
    </div>
  );
}
