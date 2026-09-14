import { useState } from 'react';
import { HeatmapCell } from '../../services/analyticsApiService';
import { Grid, ArrowRight } from 'lucide-react';

interface OpportunityMiniHeatmapProps {
  cells: HeatmapCell[];
  onSelectSlot?: (dayOfWeek: number, hour: number) => void;
  onNavigateToFullTime?: () => void;
  isLoading?: boolean;
}

type ObservationMetric = 'viewers' | 'liveCount' | 'viewersPerLive' | 'top10Share';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function OpportunityMiniHeatmap({
  cells,
  onSelectSlot,
  onNavigateToFullTime,
  isLoading,
}: OpportunityMiniHeatmapProps) {
  const [activeMetric, setActiveMetric] = useState<ObservationMetric>('viewersPerLive');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  if (isLoading || !cells || cells.length === 0) {
    return (
      <div className="h-64 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center text-[#64748B] text-xs animate-pulse">
        시간대 관측 히트맵 데이터를 로딩 중입니다...
      </div>
    );
  }

  // 지표별 색상 매핑
  const getCellBg = (cell: HeatmapCell) => {
    switch (activeMetric) {
      case 'viewersPerLive': {
        const v = cell.viewersPerLive;
        if (v >= 450) return 'bg-emerald-500 hover:bg-emerald-600';
        if (v >= 350) return 'bg-emerald-400 hover:bg-emerald-500';
        if (v >= 250) return 'bg-blue-400 hover:bg-blue-500';
        if (v >= 150) return 'bg-blue-200 hover:bg-blue-300';
        return 'bg-[#F1F5F9] hover:bg-slate-200';
      }
      case 'viewers': {
        const v = cell.viewers;
        if (v >= 40000) return 'bg-indigo-600 hover:bg-indigo-700';
        if (v >= 30000) return 'bg-blue-500 hover:bg-blue-600';
        if (v >= 20000) return 'bg-blue-300 hover:bg-blue-400';
        if (v >= 10000) return 'bg-blue-100 hover:bg-blue-200';
        return 'bg-[#F1F5F9] hover:bg-slate-200';
      }
      case 'liveCount': {
        const l = cell.liveCount;
        if (l >= 120) return 'bg-purple-600 hover:bg-purple-700';
        if (l >= 90) return 'bg-purple-400 hover:bg-purple-500';
        if (l >= 60) return 'bg-purple-200 hover:bg-purple-300';
        return 'bg-[#F1F5F9] hover:bg-slate-200';
      }
      case 'top10Share': {
        const t = cell.top10Share;
        if (t <= 0.35) return 'bg-emerald-500 hover:bg-emerald-600';
        if (t <= 0.45) return 'bg-blue-400 hover:bg-blue-500';
        if (t <= 0.55) return 'bg-amber-300 hover:bg-amber-400';
        return 'bg-rose-400 hover:bg-rose-500';
      }
    }
  };

  return (
    <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
            <Grid className="w-5 h-5 text-[#2563EB]" />
            <span>요일 × 시간대 시장 관측 히트맵 (Time Observation Heatmap)</span>
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
            지표를 선택하여 168개 요일·시간대별 실수치 패턴을 한눈에 조망합니다.
          </p>
        </div>

        {/* 4대 관측 지표 탭 */}
        <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveMetric('viewersPerLive')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeMetric === 'viewersPerLive'
                ? 'bg-white text-emerald-700 shadow-2xs border border-[#CBD5E1]'
                : 'text-slate-700 hover:text-[#0F172A]'
            }`}
          >
            방송당 평균
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('viewers')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeMetric === 'viewers'
                ? 'bg-white text-[#2563EB] shadow-2xs border border-[#CBD5E1]'
                : 'text-slate-700 hover:text-[#0F172A]'
            }`}
          >
            동시시청
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('liveCount')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeMetric === 'liveCount'
                ? 'bg-white text-purple-700 shadow-2xs border border-[#CBD5E1]'
                : 'text-slate-700 hover:text-[#0F172A]'
            }`}
          >
            LIVE 수
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('top10Share')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeMetric === 'top10Share'
                ? 'bg-white text-[#0F172A] shadow-2xs border border-[#CBD5E1]'
                : 'text-slate-700 hover:text-[#0F172A]'
            }`}
          >
            상위 집중도
          </button>
        </div>
      </div>

      {/* 7 x 24 히트맵 그리드 */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          {/* 시간대 X축 헤더 (3시간 단위 표시) */}
          <div className="grid grid-cols-[40px_repeat(24,_1fr)] gap-1 mb-1.5 text-xs text-slate-700 font-mono font-bold text-center">
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="truncate font-extrabold">
                {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
              </div>
            ))}
          </div>

          {/* 7개 요일 행 */}
          {DAY_LABELS.map((dayLabel, dayIndex) => {
            const rowCells = cells.filter((c) => c.dayOfWeek === dayIndex);
            return (
              <div
                key={dayIndex}
                className="grid grid-cols-[40px_repeat(24,_1fr)] gap-1 mb-1.5 items-center"
              >
                <div className="text-xs sm:text-sm font-black text-slate-800 text-center">
                  {dayLabel}
                </div>
                {rowCells.map((cell) => (
                  <button
                    key={`${cell.dayOfWeek}-${cell.hour}`}
                    type="button"
                    onClick={() => onSelectSlot && onSelectSlot(cell.dayOfWeek, cell.hour)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-6 sm:h-7 rounded-md transition-all cursor-pointer ${getCellBg(cell)}`}
                    title={`${cell.dayName}요일 ${cell.hour}:00`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 호버 상태 및 상세 이동 링크 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3.5 border-t border-[#CBD5E1] text-xs sm:text-sm">
        {hoveredCell ? (
          <div className="text-slate-900 font-bold flex items-center gap-2 flex-wrap">
            <span className="font-black text-[#0F172A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {hoveredCell.dayName}요일 {String(hoveredCell.hour).padStart(2, '0')}:00
            </span>
            <span>•</span>
            <span className="text-[#2563EB] font-black">동시시청: {hoveredCell.viewers.toLocaleString()}명</span>
            <span>•</span>
            <span className="text-purple-800 font-bold">LIVE: {hoveredCell.liveCount}개</span>
            <span>•</span>
            <span className="text-emerald-700 font-black">방송당: {hoveredCell.viewersPerLive}명</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">상위10: {Math.round(hoveredCell.top10Share * 100)}%</span>
          </div>
        ) : (
          <span className="text-slate-700 font-semibold">셀 위에 마우스를 올리면 해당 시간대의 관측 수치를 확인할 수 있습니다.</span>
        )}

        {onNavigateToFullTime && (
          <button
            type="button"
            onClick={onNavigateToFullTime}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#2563EB] hover:text-blue-800 transition-colors cursor-pointer ml-auto"
          >
            <span>시간대 전체 분석 보기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

