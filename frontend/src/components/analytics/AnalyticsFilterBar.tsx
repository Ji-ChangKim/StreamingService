import {
  AnalyticsFilterState,
} from '../../services/analyticsApiService';
import { Calendar, Clock, Layers, Users, RefreshCw } from 'lucide-react';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  onChange: (filters: AnalyticsFilterState) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AnalyticsFilterBar({
  filters,
  onChange,
  onRefresh,
  isLoading = false,
}: AnalyticsFilterBarProps) {
  const updateFilter = <K extends keyof AnalyticsFilterState>(key: K, value: AnalyticsFilterState[K]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="bg-[#121624]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        {/* 플랫폼 선택 (공식 브랜드 로고 준수) */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => updateFilter('platform', 'ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.platform === 'ALL'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            전체 플랫폼
          </button>

          <button
            type="button"
            onClick={() => updateFilter('platform', 'CHZZK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.platform === 'CHZZK'
                ? 'bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/50 shadow-md shadow-[#00FFA3]/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <img
              src="/icons/chzzk/chzzk Icon_01.png"
              alt="CHZZK"
              className="w-4 h-4 object-contain"
            />
            <span>CHZZK</span>
          </button>

          <button
            type="button"
            onClick={() => updateFilter('platform', 'SOOP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.platform === 'SOOP'
                ? 'bg-[#0075FF]/20 text-[#38B6FF] border border-[#0075FF]/50 shadow-md shadow-[#0075FF]/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <img
              src="/icons/soop/soop_symbol_blue.svg"
              alt="SOOP"
              className="w-4 h-4 object-contain"
            />
            <span>SOOP</span>
          </button>
        </div>

        {/* 기간 선택 (오늘, 7일, 28일) */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-indigo-400 ml-2" />
          <button
            type="button"
            onClick={() => updateFilter('period', 'today')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filters.period === 'today' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            오늘 (24h)
          </button>
          <button
            type="button"
            onClick={() => updateFilter('period', '7d')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filters.period === '7d' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            최근 7일
          </button>
          <button
            type="button"
            onClick={() => updateFilter('period', '28d')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filters.period === '28d' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            최근 28일
          </button>
        </div>

        {/* 새로고침 버튼 */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-all cursor-pointer disabled:opacity-50"
            title="데이터 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        )}
      </div>

      {/* 세부 필터 그룹 (요일, 시간대, 대분류, 규모) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
        {/* 요일 필터 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span>요일 기준</span>
          </label>
          <select
            value={filters.dayScope}
            onChange={(e) => updateFilter('dayScope', e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="ALL">전체 요일 (종합)</option>
            <option value="WEEKDAY">평일 (월~금)</option>
            <option value="WEEKEND">주말 (토·일)</option>
            <option value="SAT">토요일 집중</option>
            <option value="SUN">일요일 집중</option>
            <option value="FRI">금요일 심야</option>
          </select>
        </div>

        {/* 시간대 구간 필터 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>시간대 구간</span>
          </label>
          <select
            value={filters.timeSlot}
            onChange={(e) => updateFilter('timeSlot', e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="ALL">24시간 전체</option>
            <option value="PRIME">골든타임 (20:00 ~ 24:00)</option>
            <option value="NIGHT">심야 시간 (00:00 ~ 04:00)</option>
            <option value="AFTERNOON">오후 (12:00 ~ 18:00)</option>
            <option value="MORNING">오전 (08:00 ~ 12:00)</option>
            <option value="DAWN">새벽 (04:00 ~ 08:00)</option>
          </select>
        </div>

        {/* 콘텐츠 대분류 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>콘텐츠 대분류</span>
          </label>
          <select
            value={filters.categoryGroup}
            onChange={(e) => updateFilter('categoryGroup', e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="ALL">전체 콘텐츠</option>
            <option value="GAME">게임 (종합/마크/발로 등)</option>
            <option value="TALK">잡담 / 소통 / 라디오</option>
            <option value="MUSIC">음악 / 노래 / 버스킹</option>
            <option value="ART">그림 / 드로잉 / 아트</option>
            <option value="ASMR">ASMR / 힐링 / 수면</option>
            <option value="FOOD">먹방 / 쿡방</option>
            <option value="ETC">기타</option>
          </select>
        </div>

        {/* 채널 규모 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-400" />
            <span>채널 규모</span>
          </label>
          <select
            value={filters.creatorTier}
            onChange={(e) => updateFilter('creatorTier', e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="ALL">전체 규모</option>
            <option value="NEW">신규 버튜버 (데뷔 30일 이내)</option>
            <option value="SMALL">소형 채널 (하위 50%)</option>
            <option value="MID">중형 채널 (50~90%)</option>
            <option value="LARGE">대형 채널 (상위 10%)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
