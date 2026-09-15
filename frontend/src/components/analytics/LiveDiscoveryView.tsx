import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LiveDiscoveryResponse,
  LiveDiscoveryItem,
  PlatformFilter,
  fetchLiveDiscovery,
} from '../../services/analyticsApiService';
import {
  Search,
  ExternalLink,
  Clock,
  Radio,
  Gamepad2,
  MessageCircle,
  Music,
  Palette,
  Sparkles,
  Layers,
  RotateCw,
  ChevronRight,
  User,
} from 'lucide-react';

interface LiveDiscoveryViewProps {
  initialPlatform?: PlatformFilter;
  onNavigateTab?: (tab: string) => void;
  onSelectCreator?: (creatorName: string) => void;
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
 * 2. 관측 시각 포맷터 (단일 책임)
 */
function formatObservedTime(isoString?: string): string {
  if (!isoString) return '최근 관측';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '최근 관측';
  }
}

/**
 * 3. 플랫폼 공식 배지 (타사 브랜드 무가공 원칙 준수)
 */
function PlatformBrandBadge({ platform }: { platform: 'CHZZK' | 'SOOP' }) {
  if (platform === 'CHZZK') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-[#00FFA3]/15 text-[#00A868] border border-[#00FFA3]/40">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3]" />
        CHZZK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30">
      <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
      SOOP
    </span>
  );
}

/**
 * 4. 개별 방송 카드 컴포넌트 (단일 책임: 방송 정보 렌더링)
 */
function LiveStreamCard({
  live,
  onSelectCreator,
}: {
  live: LiveDiscoveryItem;
  onSelectCreator?: (name: string) => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white border border-[#CBD5E1] hover:border-blue-400 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* 썸네일 영역 */}
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        {live.thumbnailUrl && !imageError ? (
          <img
            src={live.thumbnailUrl}
            alt={live.liveTitle}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-4 text-center">
            {live.channelImageUrl ? (
              <img
                src={live.channelImageUrl}
                alt={live.channelName}
                className="w-12 h-12 rounded-full border-2 border-white/20 mb-2 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 mb-2">
                <User className="w-6 h-6" />
              </div>
            )}
            <span className="text-xs font-bold text-slate-300 line-clamp-1">{live.channelName}</span>
          </div>
        )}

        {/* 상단 좌우 오버레이 배지 */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <PlatformBrandBadge platform={live.platform} />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-600/90 text-white backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            LIVE
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-xs font-mono font-black bg-black/75 text-white backdrop-blur-xs">
          {live.viewerCount.toLocaleString()}명 시청
        </div>
      </div>

      {/* 본문 정보 영역 */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* 스트리머 프로필 & 이름 */}
          <div className="flex items-center gap-2 mb-2">
            {live.channelImageUrl && (
              <img
                src={live.channelImageUrl}
                alt={live.channelName}
                className="w-6 h-6 rounded-full border border-slate-200 object-cover shrink-0"
              />
            )}
            <button
              type="button"
              onClick={() => onSelectCreator?.(live.channelName)}
              className="text-xs sm:text-sm font-black text-[#0F172A] hover:text-blue-600 transition-colors text-left truncate cursor-pointer"
            >
              {live.channelName}
            </button>
          </div>

          {/* 방송 제목 */}
          <h3
            className="text-sm sm:text-base font-bold text-[#0F172A] line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mb-2"
            title={live.liveTitle}
          >
            {live.liveTitle}
          </h3>

          {/* 카테고리 / 게임 태그 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {getCategoryIcon(live.categoryGroup)}
              <span className="truncate max-w-[150px]">{live.categoryName}</span>
            </span>
          </div>
        </div>

        {/* 하단 링크 버튼들 */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectCreator?.(live.channelName)}
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer py-1"
          >
            기록 보기
          </button>
          <a
            href={live.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition-all cursor-pointer shadow-2xs"
          >
            <span>방송 보기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. 로딩 스켈레톤 카드 그리드
 */
function LiveSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-video bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-5 bg-slate-200 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
            <div className="pt-2 border-t border-slate-100 flex justify-between">
              <div className="h-4 bg-slate-100 rounded w-16" />
              <div className="h-6 bg-slate-200 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 6. 결과 없음 컴포넌트 (단일 책임)
 */
function LiveEmptyState({
  onResetFilters,
  onNavigateHistory,
}: {
  onResetFilters: () => void;
  onNavigateHistory?: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center my-6 shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
        <Radio className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-black text-[#0F172A] mb-1.5">
        현재 조건에서 확인된 방송이 없습니다
      </h3>
      <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-md mx-auto mb-6">
        선택한 플랫폼이나 게임에 진행 중인 방송이 없거나 검색 결과가 없습니다.
        필터를 변경하거나 이전 시간대의 방송 기록을 확인해보세요.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
        >
          전체 방송 보기
        </button>
        {onNavigateHistory && (
          <button
            type="button"
            onClick={onNavigateHistory}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer"
          >
            지난 방송 확인하기
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ==========================================================================
 * 메인 LiveDiscoveryView 컴포넌트
 * ==========================================================================
 */
export function LiveDiscoveryView({
  initialPlatform = 'ALL',
  onNavigateTab,
  onSelectCreator,
}: LiveDiscoveryViewProps) {
  // 1. URL 쿼리 파라미터 초기화
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialGame = searchParams.get('game') || 'ALL';
  const initialSort = (searchParams.get('sort') || 'viewers') as 'viewers' | 'recent';
  const initialQuery = searchParams.get('q') || '';

  // 2. 상태 관리
  const [platform, setPlatform] = useState<PlatformFilter>(initialPlatform);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedGame, setSelectedGame] = useState<string>(initialGame);
  const [sortOption, setSortOption] = useState<'viewers' | 'recent'>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [searchInput, setSearchInput] = useState<string>(initialQuery);

  // 데이터 상태
  const [data, setData] = useState<LiveDiscoveryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 3. URL 쿼리 파라미터 동기화
  const syncUrlParams = useCallback(
    (newPlatform: PlatformFilter, newCategory: string, newGame: string, newSort: string, newQ: string) => {
      const sp = new URLSearchParams(window.location.search);
      sp.set('tab', 'live');
      if (newPlatform !== 'ALL') sp.set('platform', newPlatform);
      else sp.delete('platform');

      if (newCategory !== 'ALL') sp.set('category', newCategory);
      else sp.delete('category');

      if (newGame !== 'ALL') sp.set('game', newGame);
      else sp.delete('game');

      if (newSort !== 'viewers') sp.set('sort', newSort);
      else sp.delete('sort');

      if (newQ.trim()) sp.set('q', newQ.trim());
      else sp.delete('q');

      const newUrl = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', newUrl);
    },
    []
  );

  // 4. 데이터 로딩 핸들러
  const loadDiscoveryData = useCallback(
    async (isManualRefresh: boolean = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await fetchLiveDiscovery({
          platform,
          category: selectedCategory,
          game: selectedGame,
          sort: sortOption,
          query: searchQuery,
        });
        setData(res);
      } catch (err) {
        console.error('Failed to load discovery lives:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [platform, selectedCategory, selectedGame, sortOption, searchQuery]
  );

  useEffect(() => {
    loadDiscoveryData();
    syncUrlParams(platform, selectedCategory, selectedGame, sortOption, searchQuery);
  }, [platform, selectedCategory, selectedGame, sortOption, searchQuery, loadDiscoveryData, syncUrlParams]);

  // 검색 제출 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  // 플랫폼 변경
  const handlePlatformChange = (p: PlatformFilter) => {
    setPlatform(p);
  };

  // 카테고리 변경 (대분류 변경 시 세부 게임은 초기화)
  const handleCategoryChange = (catKey: string) => {
    setSelectedCategory(catKey);
    setSelectedGame('ALL');
  };

  // 세부 게임 변경
  const handleGameSelect = (gameName: string) => {
    setSelectedGame((prev) => (prev === gameName ? 'ALL' : gameName));
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setPlatform('ALL');
    setSelectedCategory('ALL');
    setSelectedGame('ALL');
    setSearchQuery('');
    setSearchInput('');
  };

  // 현재 활성화된 게임 목록 (카테고리가 GAME일 때 노출)
  const availableGames = useMemo(() => {
    if (!data?.categories) return [];
    const gameCat = data.categories.find((c) => c.key === 'GAME');
    return gameCat?.games || [];
  }, [data?.categories]);

  // 현재 선택 조건 요약 텍스트
  const conditionSummary = useMemo(() => {
    const parts: string[] = [];
    if (platform === 'CHZZK') parts.push('치지직');
    else if (platform === 'SOOP') parts.push('SOOP');
    else parts.push('치지직 · SOOP 전체');

    if (selectedGame !== 'ALL') {
      parts.push(selectedGame);
    } else if (selectedCategory !== 'ALL') {
      const cat = data?.categories.find((c) => c.key === selectedCategory);
      parts.push(cat?.name || selectedCategory);
    }

    if (searchQuery) {
      parts.push(`"${searchQuery}" 검색`);
    }

    return parts.join(' · ');
  }, [platform, selectedCategory, selectedGame, searchQuery, data?.categories]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ===================================================================
          1. 상단 헤더: "지금 방송 중인 버튜버" + 스트리머/채널 검색창
          =================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 bg-white border border-[#CBD5E1] p-4 sm:p-5 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">
              지금 방송 중인 버튜버
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            실시간으로 관측된 버튜버 방송을 찾고 바로 시청하거나 활동 기록을 확인하세요.
          </p>
        </div>

        {/* 스트리머 실시간 검색창 */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 shrink-0">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="스트리머 또는 방송 제목 검색"
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-bold text-[#0F172A] placeholder:text-slate-500 transition-all shadow-2xs"
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

      {/* ===================================================================
          2. 콘텐츠 선택: 플랫폼 선택 토글 & 카테고리 대분류 칩
          =================================================================== */}
      <div className="bg-white border border-[#CBD5E1] p-3.5 sm:p-4 rounded-2xl shadow-2xs space-y-3">
        {/* 플랫폼 토글 */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {(['ALL', 'CHZZK', 'SOOP'] as PlatformFilter[]).map((p) => {
              const isActive = platform === p;
              const label = p === 'ALL' ? '전체 플랫폼' : p === 'CHZZK' ? '치지직 (CHZZK)' : 'SOOP (숲)';
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlatformChange(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F172A] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadDiscoveryData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
              title="새로고침"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>
        </div>

        {/* 카테고리 대분류 칩 바 */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {(data?.categories || [
            { key: 'ALL', name: '전체', liveCount: 0, viewerSum: 0 },
            { key: 'GAME', name: '게임', liveCount: 0, viewerSum: 0 },
            { key: 'TALK', name: '잡담·소통', liveCount: 0, viewerSum: 0 },
            { key: 'MUSIC', name: '음악·노래', liveCount: 0, viewerSum: 0 },
            { key: 'ART', name: '그림·아트', liveCount: 0, viewerSum: 0 },
            { key: 'ASMR', name: 'ASMR', liveCount: 0, viewerSum: 0 },
            { key: 'ETC', name: '기타', liveCount: 0, viewerSum: 0 },
          ]).map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryChange(cat.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {getCategoryIcon(cat.key)}
                <span>{cat.name}</span>
                {cat.liveCount > 0 && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.liveCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ===================================================================
            3. 게임 세부 선택 (카테고리가 'GAME'이거나 'ALL'일 때 관측된 게임들 노출)
            =================================================================== */}
        {(selectedCategory === 'GAME' || selectedCategory === 'ALL') && availableGames.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
              <Gamepad2 className="w-3.5 h-3.5 text-blue-600" />
              <span>실시간 관측된 게임 선택</span>
              <span className="text-[11px] text-slate-500">클릭 시 해당 게임 방송만 모아봅니다</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedGame('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedGame === 'ALL'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                전체 게임 ({availableGames.reduce((a, b) => a + b.liveCount, 0)})
              </button>
              {availableGames.map((g) => {
                const isSelected = selectedGame.toLowerCase() === g.name.toLowerCase();
                return (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => handleGameSelect(g.name)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{g.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {g.liveCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
          4. 결과 헤더: 선택 조건 요약, 방송 수, 정렬, 기준 시각
          =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm sm:text-base font-black text-[#0F172A]">
            {conditionSummary}
          </span>
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {data?.lives?.length ?? 0}개 방송 관측
          </span>
          {data?.meta?.observedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatObservedTime(data.meta.observedAt)} 관측 기준</span>
            </span>
          )}
        </div>

        {/* 정렬 토글 */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSortOption('viewers')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortOption === 'viewers'
                ? 'bg-white text-[#0F172A] shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            시청자 많은 순
          </button>
          <button
            type="button"
            onClick={() => setSortOption('recent')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortOption === 'recent'
                ? 'bg-white text-[#0F172A] shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            최근 시작 순
          </button>
        </div>
      </div>

      {/* ===================================================================
          5. 방송 카드 목록 (주 콘텐츠)
          =================================================================== */}
      {isLoading ? (
        <LiveSkeletonGrid />
      ) : !data || data.lives.length === 0 ? (
        <LiveEmptyState
          onResetFilters={handleResetFilters}
          onNavigateHistory={() => onNavigateTab?.('history')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {data.lives.map((live) => (
            <LiveStreamCard
              key={live.id}
              live={live}
              onSelectCreator={onSelectCreator}
            />
          ))}
        </div>
      )}

      {/* ===================================================================
          6. 추가 탐색 안내 배너 (기획서 5.1절 순서 6)
          =================================================================== */}
      {onNavigateTab && (
        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-black">
              어제 방송이나 특정 날짜의 방송 기록이 필요하신가요?
            </h4>
            <p className="text-xs text-slate-300">
              특정 날짜와 시간대에 관측된 버튜버 방송 목록과 콘텐츠 변화 기록을 확인할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-white text-slate-900 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
          >
            <span>지난 방송 둘러보기</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
