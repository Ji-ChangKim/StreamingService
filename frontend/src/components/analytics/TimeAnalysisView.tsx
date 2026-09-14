import { useState } from 'react';
import { HeatmapCell } from '../../services/analyticsApiService';
import { Clock, Calendar, TrendingUp, Users, Radio, PieChart } from 'lucide-react';

interface TimeAnalysisViewProps {
  cells: HeatmapCell[];
  isLoading: boolean;
}

type HeatmapMetric = 'opportunity' | 'viewersPerLive' | 'viewers' | 'liveCount' | 'top10Share';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function TimeAnalysisView({ cells, isLoading }: TimeAnalysisViewProps) {
  const [activeMetric, setActiveMetric] = useState<HeatmapMetric>('opportunity');
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(() => {
    // 기본 선택: 토요일 심야 00시
    return cells.find((c) => c.dayOfWeek === 6 && c.hour === 0) || null;
  });

  // 셀이 아직 로드되지 않았을 때의 처리
  const currentCell = selectedCell || cells[0] || null;

  if (isLoading || !cells || cells.length === 0) {
    return (
      <div className="h-96 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center text-slate-400 text-xs animate-pulse">
        시간대 정밀 분석 매트릭스를 불러오는 중입니다...
      </div>
    );
  }

  // 지표별 색상 스케일 계산 (라이트 테마 최적화)
  const getCellColor = (cell: HeatmapCell) => {
    switch (activeMetric) {
      case 'opportunity': {
        const s = cell.opportunityScore;
        if (s >= 80) return 'bg-emerald-500 text-white font-bold';
        if (s >= 70) return 'bg-emerald-400 text-slate-900 font-semibold';
        if (s >= 60) return 'bg-blue-400 text-white font-semibold';
        if (s >= 50) return 'bg-blue-200 text-slate-800';
        return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
      case 'viewersPerLive': {
        const v = cell.viewersPerLive;
        if (v >= 450) return 'bg-emerald-500 text-white font-bold';
        if (v >= 350) return 'bg-emerald-400 text-slate-900 font-semibold';
        if (v >= 250) return 'bg-blue-400 text-white font-semibold';
        if (v >= 150) return 'bg-blue-200 text-slate-800';
        return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
      case 'viewers': {
        const v = cell.viewers;
        if (v >= 40000) return 'bg-indigo-600 text-white font-bold';
        if (v >= 30000) return 'bg-blue-500 text-white font-semibold';
        if (v >= 20000) return 'bg-blue-300 text-slate-900 font-medium';
        if (v >= 10000) return 'bg-blue-100 text-slate-800';
        return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
      case 'liveCount': {
        const l = cell.liveCount;
        if (l >= 120) return 'bg-rose-500 text-white font-bold';
        if (l >= 90) return 'bg-amber-400 text-slate-900 font-semibold';
        if (l >= 60) return 'bg-amber-200 text-slate-800';
        return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
      case 'top10Share': {
        const t = cell.top10Share;
        if (t <= 0.35) return 'bg-emerald-500 text-white font-bold'; // 분산 우수
        if (t <= 0.45) return 'bg-blue-400 text-white font-semibold';
        if (t <= 0.55) return 'bg-amber-400 text-slate-900 font-semibold';
        return 'bg-rose-500 text-white font-bold'; // 대형 쏠림 심함
      }
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getMetricDisplayValue = (cell: HeatmapCell) => {
    switch (activeMetric) {
      case 'opportunity':
        return `${Math.round(cell.opportunityScore)}`;
      case 'viewersPerLive':
        return `${Math.round(cell.viewersPerLive)}`;
      case 'viewers':
        return `${Math.round(cell.viewers / 1000)}k`;
      case 'liveCount':
        return `${cell.liveCount}`;
      case 'top10Share':
        return `${Math.round(cell.top10Share * 100)}%`;
    }
  };

  return (
    <div className="space-y-6">
      {/* 시간대 분석 헤더 및 지표 전환 탭 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>요일 × 시간대 정밀 교차 분석 (Heatmap Matrix)</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              "사람이 많은 시간(수요)"과 "신규 버튜버가 방송하기 유리한 시간(기회)"의 차이를 5개 지표로 교차 확인합니다.
            </p>
          </div>

          {/* 5개 지표 토글 */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] text-xs">
            <button
              type="button"
              onClick={() => setActiveMetric('opportunity')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeMetric === 'opportunity'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              방송 기회 점수
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('viewersPerLive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeMetric === 'viewersPerLive'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              방송당 시청
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('viewers')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeMetric === 'viewers'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              동시시청 합계
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('liveCount')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeMetric === 'liveCount'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              LIVE 방송 수
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('top10Share')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeMetric === 'top10Share'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              상위 10 집중도
            </button>
          </div>
        </div>

        {/* 7 × 24 전체 히트맵 매트릭스 그리드 */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px]">
            {/* 시간 라벨 (0~23) */}
            <div className="grid grid-cols-[40px_repeat(24,_1fr)] gap-1 mb-1.5 text-[10px] text-slate-500 font-mono text-center">
              <div />
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="font-semibold">
                  {h}
                </div>
              ))}
            </div>

            {/* 7개 요일 행 */}
            {DAY_LABELS.map((dayLabel, dayIndex) => {
              const rowCells = cells.filter((c) => c.dayOfWeek === dayIndex);
              return (
                <div
                  key={dayIndex}
                  className="grid grid-cols-[40px_repeat(24,_1fr)] gap-1 mb-1 items-center"
                >
                  <div className="text-xs font-bold text-slate-600 text-center">
                    {dayLabel}
                  </div>
                  {rowCells.map((cell) => {
                    const isSelected =
                      currentCell &&
                      currentCell.dayOfWeek === cell.dayOfWeek &&
                      currentCell.hour === cell.hour;

                    return (
                      <button
                        key={`${cell.dayOfWeek}-${cell.hour}`}
                        type="button"
                        onClick={() => setSelectedCell(cell)}
                        className={`h-7 sm:h-8 rounded-md text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${getCellColor(
                          cell
                        )} ${
                          isSelected
                            ? 'ring-2 ring-[#2563EB] scale-110 z-10 shadow-md'
                            : 'hover:scale-105 opacity-90 hover:opacity-100'
                        }`}
                        title={`${cell.dayName}요일 ${cell.hour}:00`}
                      >
                        {getMetricDisplayValue(cell)}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 2단: 선택 셀 상세 패널 & 평일/주말 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 선택 시간대 정밀 상세 패널 */}
        {currentCell && (
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                    {currentCell.dayName}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      {currentCell.dayName}요일 {String(currentCell.hour).padStart(2, '0')}:00 구간 상세
                    </h3>
                    <span className="text-[11px] text-[#64748B]">표본 일수: 28일 축적</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#64748B] block">기회 점수</span>
                  <span className="text-lg font-black text-emerald-600">
                    {currentCell.opportunityScore}점
                  </span>
                </div>
              </div>

              {/* 지표 리스트 */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>평균 동시시청 합계</span>
                  </span>
                  <strong className="text-[#0F172A] font-mono">{currentCell.viewers.toLocaleString()}명</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-purple-600" />
                    <span>평균 LIVE 방송 수</span>
                  </span>
                  <strong className="text-[#0F172A] font-mono">{currentCell.liveCount}채널</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>방송당 시청자 수 (효율)</span>
                  </span>
                  <strong className="text-emerald-600 font-mono">{currentCell.viewersPerLive}명/방</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-amber-600" />
                    <span>상위 10개 방송 점유율</span>
                  </span>
                  <strong className="text-amber-700 font-mono">{Math.round(currentCell.top10Share * 100)}%</strong>
                </div>
              </div>
            </div>

            {/* 판단 코멘트 */}
            <div className="mt-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-[#334155] leading-relaxed">
              <span className="font-bold text-[#2563EB]">💡 편성 판단: </span>
              {currentCell.opportunityScore >= 75
                ? '수요 대비 경쟁이 낮아 신규·중소 버튜버가 메인 탐색 탭에서 노출 기회를 잡기에 매우 유리한 슬롯입니다.'
                : '대형 스트리머 집중도가 높거나 방송 공급이 많아, 특색 있는 방제 및 확실한 타깃 콘텐츠 준비가 권장됩니다.'}
            </div>
          </div>
        )}

        {/* 평일 vs 주말 비교 및 변동성 분석 */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>평일(월~금) vs 주말(토·일) 시간대별 패턴 차이</span>
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              주말에는 낮(14~17시) 수요가 평일 대비 +42% 이상 급증하며, 심야(00~03시) 방송당 시청 효율이 극대화됩니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-xs font-bold text-blue-700 mb-2">평일 (월~금) 특징</div>
                <ul className="text-xs text-[#475569] space-y-1.5">
                  <li>• 골든타임: <strong className="text-[#0F172A]">21:00 ~ 24:00</strong> 집중</li>
                  <li>• 직장인/학생 퇴근 후 소통 토크 방송에 높은 체류</li>
                  <li>• 심야 01시 이후 시청자 감소 속도 빠름</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-xs font-bold text-emerald-700 mb-2">주말 (토·일) 특징</div>
                <ul className="text-xs text-[#475569] space-y-1.5">
                  <li>• 골든타임: <strong className="text-[#0F172A]">14:00 ~ 03:00</strong> 장기 유지</li>
                  <li>• 장시간 종합게임(마크/스토리) 소비율 우수</li>
                  <li>• 심야 00시 이후에도 대형 채널 쏠림 적고 분산 우수</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
            <span>기준: 28일 평균 데이터</span>
            <span className="text-[#2563EB] font-semibold">반복 편성 설계에 활용 권장</span>
          </div>
        </div>
      </div>
    </div>
  );
}
