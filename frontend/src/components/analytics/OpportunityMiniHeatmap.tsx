import { useState } from 'react';
import { HeatmapCell } from '../../services/analyticsApiService';
import { Grid, ArrowRight } from 'lucide-react';

interface OpportunityMiniHeatmapProps {
  cells: HeatmapCell[];
  onSelectSlot?: (dayOfWeek: number, hour: number) => void;
  onNavigateToFullTime?: () => void;
  isLoading?: boolean;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function OpportunityMiniHeatmap({
  cells,
  onSelectSlot,
  onNavigateToFullTime,
  isLoading,
}: OpportunityMiniHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  if (isLoading || !cells || cells.length === 0) {
    return (
      <div className="h-64 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center text-[#64748B] text-xs animate-pulse">
        기회 히트맵 데이터를 로딩 중입니다...
      </div>
    );
  }

  // 밝은 테마에서의 점수별 색상 매핑
  const getCellBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500 hover:bg-emerald-600 shadow-2xs';
    if (score >= 70) return 'bg-emerald-400 hover:bg-emerald-500';
    if (score >= 60) return 'bg-blue-400 hover:bg-blue-500';
    if (score >= 50) return 'bg-slate-300 hover:bg-slate-400';
    return 'bg-[#F1F5F9] hover:bg-slate-200';
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
            <Grid className="w-4 h-4 text-emerald-600" />
            <span>요일 × 시간 방송 기회 히트맵 (Opportunity Heatmap)</span>
          </h3>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            초록색이 짙을수록 수요 대비 경쟁이 낮고 신규 진입 기회 점수가 높은 구간입니다.
          </p>
        </div>

        {onNavigateToFullTime && (
          <button
            type="button"
            onClick={onNavigateToFullTime}
            className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-blue-800 transition-colors cursor-pointer"
          >
            <span>시간대 상세 분석</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 7 x 24 히트맵 그리드 */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          {/* 시간대 X축 헤더 (3시간 단위 표시) */}
          <div className="grid grid-cols-[36px_repeat(24,_1fr)] gap-1 mb-1 text-[10px] text-[#64748B] font-mono text-center">
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="truncate font-semibold">
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
                className="grid grid-cols-[36px_repeat(24,_1fr)] gap-1 mb-1 items-center"
              >
                <div className="text-[11px] font-bold text-[#475569] text-center">
                  {dayLabel}
                </div>
                {rowCells.map((cell) => (
                  <button
                    key={`${cell.dayOfWeek}-${cell.hour}`}
                    type="button"
                    onClick={() => onSelectSlot && onSelectSlot(cell.dayOfWeek, cell.hour)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-5 sm:h-6 rounded-md transition-all cursor-pointer ${getCellBg(
                      cell.opportunityScore
                    )}`}
                    title={`${cell.dayName}요일 ${cell.hour}:00 - 기회점수 ${cell.opportunityScore}점`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 호버 상태 및 범례 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-[#E2E8F0] text-[11px]">
        {hoveredCell ? (
          <div className="text-[#334155] flex items-center gap-2">
            <span className="font-bold text-[#0F172A]">
              {hoveredCell.dayName}요일 {String(hoveredCell.hour).padStart(2, '0')}:00
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">기회 점수: {hoveredCell.opportunityScore}점</span>
            <span>•</span>
            <span className="text-[#2563EB] font-medium">방송당 시청: {hoveredCell.viewersPerLive}명</span>
            <span>•</span>
            <span className="text-[#64748B]">집중도: {Math.round(hoveredCell.top10Share * 100)}%</span>
          </div>
        ) : (
          <span className="text-[#64748B]">셀 위에 마우스를 올리면 해당 시간대의 세부 지표를 확인할 수 있습니다.</span>
        )}

        {/* 범례 */}
        <div className="flex items-center gap-2 ml-auto text-[#64748B]">
          <span>기회 점수:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#F1F5F9] border border-[#CBD5E1]" />
            <span className="text-[10px]">낮음</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-400" />
            <span className="text-[10px]">보통</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-[10px] text-emerald-700 font-bold">높음 (추천)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
