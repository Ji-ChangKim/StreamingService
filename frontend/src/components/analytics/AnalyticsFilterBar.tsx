import {
  AnalyticsFilterState,
} from '../../services/analyticsApiService';
import { Calendar, Clock, Layers, Users } from 'lucide-react';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  onChange: (filters: AnalyticsFilterState) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AnalyticsFilterBar({
  filters,
  onChange,
}: AnalyticsFilterBarProps) {
  const updateFilter = <K extends keyof AnalyticsFilterState>(key: K, value: AnalyticsFilterState[K]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 sm:p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        {/* 기간 선택 (오늘, 7일, 28일) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#475569] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>관측 기간:</span>
          </span>
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-[10px] border border-[#CBD5E1] text-xs font-semibold">
            <button
              type="button"
              onClick={() => updateFilter('period', 'today')}
              className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                filters.period === 'today'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              오늘 (24h)
            </button>
            <button
              type="button"
              onClick={() => updateFilter('period', '7d')}
              className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                filters.period === '7d'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              최근 7일
            </button>
            <button
              type="button"
              onClick={() => updateFilter('period', '28d')}
              className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                filters.period === '28d'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              최근 28일
            </button>
          </div>
        </div>

        <div className="text-[11px] text-[#64748B]">
          * 시간대·요일별 집계는 선택된 기간의 정기 스냅샷 중앙값으로 산출됩니다.
        </div>
      </div>

      {/* 세부 필터 그룹 (요일, 시간대, 대분류, 규모) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
        {/* 요일 필터 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#2563EB]" />
            <span>요일 기준</span>
          </label>
          <select
            value={filters.dayScope}
            onChange={(e) => updateFilter('dayScope', e.target.value as any)}
            className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0F172A] text-xs font-medium focus:outline-none focus:border-[#2563EB] shadow-2xs transition-colors"
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
          <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#2563EB]" />
            <span>시간대 구간</span>
          </label>
          <select
            value={filters.timeSlot}
            onChange={(e) => updateFilter('timeSlot', e.target.value as any)}
            className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0F172A] text-xs font-medium focus:outline-none focus:border-[#2563EB] shadow-2xs transition-colors"
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
          <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#2563EB]" />
            <span>콘텐츠 대분류</span>
          </label>
          <select
            value={filters.categoryGroup}
            onChange={(e) => updateFilter('categoryGroup', e.target.value as any)}
            className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0F172A] text-xs font-medium focus:outline-none focus:border-[#2563EB] shadow-2xs transition-colors"
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
          <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1">
            <Users className="w-3 h-3 text-[#2563EB]" />
            <span>채널 규모</span>
          </label>
          <select
            value={filters.creatorTier}
            onChange={(e) => updateFilter('creatorTier', e.target.value as any)}
            className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0F172A] text-xs font-medium focus:outline-none focus:border-[#2563EB] shadow-2xs transition-colors"
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
