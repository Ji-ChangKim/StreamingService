import { Search, Calendar, List } from 'lucide-react';

interface FilterBarProps {
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalCount: number;
  viewMode: 'GRID' | 'LIST';
  setViewMode: (mode: 'GRID' | 'LIST') => void;
}

export function FilterBar({
  selectedPlatform,
  setSelectedPlatform,
  searchQuery,
  setSearchQuery,
  totalCount,
  viewMode,
  setViewMode,
}: FilterBarProps) {
  const platforms = [
    { id: 'ALL', label: '전체 플랫폼' },
    { id: 'CHZZK', label: '치지직 (CHZZK)' },
    { id: 'YOUTUBE', label: '유튜브 (YouTube)' },
    { id: 'SOOP', label: '숲 (SOOP)' },
    { id: 'TWITCH', label: '트위치 (Twitch)' },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6 bg-white p-3.5 rounded-[8px] border border-[#D8D8D8] shadow-sm">
      {/* 플랫폼 필터 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
        {platforms.map((p) => {
          const isActive = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#080808] text-white font-semibold shadow-xs'
                  : 'bg-[#F8FAFC] text-[#5A5A5A] hover:bg-slate-200/80 hover:text-[#080808] border border-[#D8D8D8]'
              }`}
            >
              {p.id === 'CHZZK' && (
                <img src="/icons/chzzk_icon.png" alt="CHZZK" className="w-3.5 h-3.5 object-contain" />
              )}
              {p.id === 'YOUTUBE' && (
                <img src="/icons/youtube_icon.png" alt="YouTube" className="w-3.5 h-3.5 object-contain" />
              )}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* 우측 뷰 모드 토글 + 검색창 */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* 뷰 모드 선택 버튼 (월간 달력 GRID vs 리스트 LIST) */}
        <div className="flex items-center bg-[#F8FAFC] p-1 rounded-[6px] border border-[#D8D8D8]">
          <button
            onClick={() => setViewMode('GRID')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold transition-all ${
              viewMode === 'GRID'
                ? 'bg-[#080808] text-white shadow-xs'
                : 'text-[#5A5A5A] hover:text-[#080808]'
            }`}
            title="월간 격자 달력 뷰"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>월간 달력</span>
          </button>
          <button
            onClick={() => setViewMode('LIST')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold transition-all ${
              viewMode === 'LIST'
                ? 'bg-[#080808] text-white shadow-xs'
                : 'text-[#5A5A5A] hover:text-[#080808]'
            }`}
            title="일자별 리스트 뷰"
          >
            <List className="w-3.5 h-3.5" />
            <span>리스트</span>
          </button>
        </div>

        {/* 검색창 */}
        <div className="relative flex-1 sm:w-56">
          <Search className="w-4 h-4 text-[#898989] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="버튜버 또는 소속 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-[#080808] placeholder-[#ABABAB] pl-9 pr-3 py-1.5 rounded-[4px] border border-[#D8D8D8] focus:border-[#080808] focus:outline-none transition-all"
          />
        </div>

        {/* 총 일정 개수 */}
        <div className="bg-[#F8FAFC] px-3 py-1.5 rounded-[4px] border border-[#D8D8D8] text-xs font-medium text-[#5A5A5A] whitespace-nowrap hidden sm:block">
          총 <span className="text-[#080808] font-semibold">{totalCount}</span>개
        </div>
      </div>
    </div>
  );
}
