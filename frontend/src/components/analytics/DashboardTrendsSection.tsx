import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Clock, X, BarChart3, TrendingUp, Check } from 'lucide-react';
import { LiveCategoryStat, TimeseriesPoint, PlatformFilter } from '../../services/analyticsApiService';

export type PeriodType = 'today' | 'yesterday' | '7d' | '30d';

interface DashboardTrendsSectionProps {
  platform: PlatformFilter;
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  timeseriesData: TimeseriesPoint[];
  categories: LiveCategoryStat[];
  selectedHour: number | null;
  onSelectHour: (hour: number | null) => void;
  selectedCategory: string;
  onSelectCategory: (categoryKey: string) => void;
  selectedGame: string | null;
  onSelectGame: (gameName: string | null) => void;
}

export const DashboardTrendsSection: React.FC<DashboardTrendsSectionProps> = ({
  platform,
  period,
  onPeriodChange,
  timeseriesData,
  categories,
  selectedHour,
  onSelectHour,
  selectedCategory,
  onSelectCategory,
  selectedGame,
  onSelectGame,
}) => {
  // 기준 전환: 'viewers' (시청 합계) vs 'lives' (방송 수)
  const [metricBasis, setMetricBasis] = useState<'viewers' | 'lives'>('viewers');
  // 게임 행 펼치기 상태
  const [isGameExpanded, setIsGameExpanded] = useState<boolean>(true);
  // 차트 마우스 호버 인덱스
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 기간 라벨
  const periodLabelMap: Record<PeriodType, string> = {
    today: '오늘 (2026.09.15 KST)',
    yesterday: '어제 (2026.09.14 KST)',
    '7d': '최근 7일 (2026.09.09 ~ 09.15)',
    '30d': '최근 30일 (2026.08.17 ~ 09.15)',
  };

  // 1. 차트 스케일 및 SVG 패스 계산
  const { chartPoints, maxViewers, maxLive, svgWidth, svgHeight } = useMemo(() => {
    const data = timeseriesData && timeseriesData.length > 0 ? timeseriesData : [];
    const maxV = Math.max(...data.map((d) => d.viewers), 100);
    const maxL = Math.max(...data.map((d) => d.liveCount), 10);

    const width = 760;
    const height = 260;
    const padLeft = 45;
    const padRight = 20;
    const padTop = 25;
    const padBottom = 35;
    const innerW = width - padLeft - padRight;
    const innerH = height - padTop - padBottom;

    // 시청 추이 그래프 영역 (상단 65%) 및 방송수 막대 영역 (하단 35%)
    const trendH = innerH * 0.62;
    const barH = innerH * 0.32;
    const gap = innerH * 0.06;

    const points = data.map((d, i) => {
      const x = padLeft + (i / Math.max(data.length - 1, 1)) * innerW;
      // 시청자 수 (라인)
      const yViewer = padTop + trendH - (d.viewers / maxV) * trendH;
      // 방송 수 막대 높이 및 Y
      const currentBarH = (d.liveCount / maxL) * barH;
      const yBar = padTop + trendH + gap + (barH - currentBarH);

      return {
        ...d,
        x,
        yViewer,
        yBar,
        currentBarH,
      };
    });

    return {
      chartPoints: points,
      maxViewers: maxV,
      maxLive: maxL,
      svgWidth: width,
      svgHeight: height,
    };
  }, [timeseriesData]);

  // SVG 패스 생성
  const viewerLinePath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yViewer}`, '');
  }, [chartPoints]);

  const viewerAreaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const lastX = chartPoints[chartPoints.length - 1].x;
    const firstX = chartPoints[0].x;
    const baselineY = 25 + (260 - 25 - 35) * 0.62;
    return `${viewerLinePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [viewerLinePath, chartPoints]);

  // 2. 콘텐츠 구성표 계산
  const contentStats = useMemo(() => {
    // ALL 제외 상위 카테고리
    const items = categories.filter((c) => c.key !== 'ALL');
    const totalVal = items.reduce((acc, c) => acc + (metricBasis === 'viewers' ? c.viewerSum : c.liveCount), 0) || 1;

    return items.map((c) => {
      const val = metricBasis === 'viewers' ? c.viewerSum : c.liveCount;
      const pct = Math.round((val / totalVal) * 100);
      return {
        ...c,
        val,
        pct,
      };
    });
  }, [categories, metricBasis]);

  // 게임 카테고리의 세부 게임 목록 (상위 5개)
  const topGames = useMemo(() => {
    const gameCat = categories.find((c) => c.key === 'GAME');
    if (!gameCat || !gameCat.games) return [];
    const totalGameVal = gameCat.games.reduce((acc, g) => acc + (metricBasis === 'viewers' ? g.viewerSum : g.liveCount), 0) || 1;
    return gameCat.games.slice(0, 5).map((g) => ({
      name: g.name,
      val: metricBasis === 'viewers' ? g.viewerSum : g.liveCount,
      pct: Math.round(((metricBasis === 'viewers' ? g.viewerSum : g.liveCount) / totalGameVal) * 100),
    }));
  }, [categories, metricBasis]);

  return (
    <div className="space-y-4 pt-2">
      {/* 2구역 헤더: 기간 선택 바 (기존 사이트 표준 스타일) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm sm:text-base font-black text-[#0F172A]">기간별 방송 현황</h2>
            <span className="text-xs text-slate-500 font-medium">· {periodLabelMap[period]}</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            지정 기간의 시간대별 시청·방송 규모 추이 및 카테고리별 콘텐츠 구성을 확인합니다.
          </p>
        </div>

        {/* 빠른 기간 선택 탭 */}
        <div className="inline-flex items-center gap-1 bg-[#F1F5F9] border border-[#CBD5E1] p-1 rounded-xl self-start sm:self-auto shadow-2xs">
          {(['today', 'yesterday', '7d', '30d'] as PeriodType[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === p
                  ? 'bg-blue-600 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-[#0F172A] hover:bg-white/80'
              }`}
            >
              {p === 'today' && '오늘'}
              {p === 'yesterday' && '어제'}
              {p === '7d' && '최근 7일'}
              {p === '30d' && '최근 30일'}
            </button>
          ))}
        </div>
      </div>

      {/* 8열 추이 차트 + 4열 콘텐츠 구성표 (명세서 5절 / 6절 그리드) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* 좌측 8열: 시간별 시청 합계 & 방송 수 추이 차트 (화이트 테마) */}
        <div className="lg:col-span-8 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm sm:text-base font-black text-[#0F172A]">
                    {selectedGame
                      ? `${selectedGame} 추이`
                      : platform === 'ALL'
                      ? '시간별 시청 합계 및 LIVE 방송 수'
                      : `${platform === 'CHZZK' ? '치지직' : 'SOOP'} 시간별 시청 합계 및 LIVE 방송 수`}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  상단: 동시시청 합계(선) / 하단: 방송 수(막대) · 원하는 시간대를 클릭하여 선택할 수 있습니다.
                </div>
              </div>

              {/* 선택된 시간대 표시 뱃지 */}
              {selectedHour !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedHour}:00 구간 선택됨</span>
                  <button
                    type="button"
                    onClick={() => onSelectHour(null)}
                    className="p-0.5 hover:text-blue-900 rounded"
                    title="선택 해제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* 인터랙티브 SVG 차트 */}
            <div className="relative w-full h-[270px] select-none">
              {chartPoints.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  표시할 추이 데이터가 없습니다.
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.20" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* 수평 가이드선 */}
                  <line x1="45" y1="25" x2={svgWidth - 20} y2="25" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="45" y1={25 + (svgHeight - 60) * 0.62} x2={svgWidth - 20} y2={25 + (svgHeight - 60) * 0.62} stroke="#CBD5E1" />
                  <line x1="45" y1={svgHeight - 35} x2={svgWidth - 20} y2={svgHeight - 35} stroke="#E2E8F0" />

                  {/* Y축 레이블 (시청자 수) */}
                  <text x="40" y="30" textAnchor="end" fill="#64748B" fontSize="10" fontWeight="bold">
                    {maxViewers.toLocaleString()}명
                  </text>
                  <text x="40" y={25 + (svgHeight - 60) * 0.62} textAnchor="end" fill="#94A3B8" fontSize="10">
                    0
                  </text>
                  {/* Y축 레이블 (방송 수) */}
                  <text x="40" y={svgHeight - 35} textAnchor="end" fill="#64748B" fontSize="10" fontWeight="bold">
                    {maxLive}개
                  </text>

                  {/* 시청자 수 영역 및 라인 */}
                  <path d={viewerAreaPath} fill="url(#areaGradient)" />
                  <path d={viewerLinePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

                  {/* 방송 수 막대 그래프 */}
                  {chartPoints.map((p, i) => {
                    const isSelected = selectedHour === p.hour;
                    const isHover = hoverIndex === i;
                    const barWidth = Math.max(svgWidth / chartPoints.length - 8, 4);

                    return (
                      <g key={i} className="cursor-pointer" onClick={() => onSelectHour(isSelected ? null : p.hour)}>
                        {/* 방송 수 막대 */}
                        <rect
                          x={p.x - barWidth / 2}
                          y={p.yBar}
                          width={barWidth}
                          height={p.currentBarH}
                          rx="2"
                          fill={isSelected ? '#2563eb' : isHover ? '#38bdf8' : '#CBD5E1'}
                          className="transition-colors"
                        />

                        {/* 시청자 수 포인트 점 */}
                        <circle
                          cx={p.x}
                          cy={p.yViewer}
                          r={isSelected ? 5 : isHover ? 4 : 2.5}
                          fill={isSelected ? '#2563eb' : '#3b82f6'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />

                        {/* 클릭 가능한 수직 인터랙션 영역 */}
                        <rect
                          x={p.x - svgWidth / chartPoints.length / 2}
                          y="10"
                          width={svgWidth / chartPoints.length}
                          height={svgHeight - 20}
                          fill="transparent"
                          onMouseEnter={() => setHoverIndex(i)}
                          onMouseLeave={() => setHoverIndex(null)}
                        />

                        {/* X축 시간 라벨 */}
                        {i % 3 === 0 && (
                          <text
                            x={p.x}
                            y={svgHeight - 15}
                            textAnchor="middle"
                            fill={isSelected ? '#2563eb' : '#64748B'}
                            fontSize="10"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                          >
                            {p.label}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* 선택된 시간대 수직 강조선 */}
                  {selectedHour !== null && (
                    (() => {
                      const selPoint = chartPoints.find((p) => p.hour === selectedHour);
                      if (!selPoint) return null;
                      return (
                        <line
                          x1={selPoint.x}
                          y1="15"
                          x2={selPoint.x}
                          y2={svgHeight - 30}
                          stroke="#2563eb"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                      );
                    })()
                  )}
                </svg>
              )}

              {/* 툴팁 */}
              {hoverIndex !== null && chartPoints[hoverIndex] && (
                <div
                  className="absolute pointer-events-none bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-md z-10 -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${(chartPoints[hoverIndex].x / svgWidth) * 100}%`,
                    top: `${(chartPoints[hoverIndex].yViewer / svgHeight) * 100}%`,
                  }}
                >
                  <div className="font-bold text-white mb-1">{chartPoints[hoverIndex].label} 관측 기록</div>
                  <div className="flex items-center gap-2 text-blue-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>동시시청: {chartPoints[hoverIndex].viewers.toLocaleString()}명</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>방송 수: {chartPoints[hoverIndex].liveCount}개</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">클릭 시 이 시간대 방송으로 필터링</div>
                </div>
              )}
            </div>
          </div>

          {/* 차트 하단 범례 */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
                <span>시청자 추이선</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-300 rounded-xs" />
                <span>방송 수 막대</span>
              </div>
            </div>
            <div className="text-slate-400 text-[11px]">
              * 시간대 클릭 시 하단 방송 목록이 연동됩니다
            </div>
          </div>
        </div>

        {/* 우측 4열: 콘텐츠 구성표 및 게임 행 펼치기 (화이트 테마) */}
        <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm sm:text-base font-black text-[#0F172A]">콘텐츠 구성</span>
              {/* 기준 전환 토글 버튼 */}
              <div className="inline-flex items-center p-0.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setMetricBasis('viewers')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    metricBasis === 'viewers'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  시청 합계
                </button>
                <button
                  type="button"
                  onClick={() => setMetricBasis('lives')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    metricBasis === 'lives'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  방송 수
                </button>
              </div>
            </div>

            {/* 선택된 게임 필터 안내 뱃지 */}
            {selectedGame && (
              <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span>선택된 게임: <strong>{selectedGame}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectGame(null)}
                  className="p-1 hover:text-blue-950 text-slate-500"
                  title="게임 필터 해제"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 카테고리 행 목록 */}
            <div className="space-y-3">
              {contentStats.map((cat) => {
                const isGame = cat.key === 'GAME';
                const isCatSelected = selectedCategory === cat.key && !selectedGame;

                return (
                  <div key={cat.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCategory(isCatSelected ? 'ALL' : cat.key);
                            if (selectedGame) onSelectGame(null);
                          }}
                          className={`font-black hover:underline transition-colors cursor-pointer ${
                            isCatSelected ? 'text-blue-600 underline' : 'text-[#0F172A] hover:text-blue-600'
                          }`}
                        >
                          {cat.name}
                        </button>

                        {/* 게임 행 펼치기/접기 버튼 */}
                        {isGame && topGames.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsGameExpanded(!isGameExpanded)}
                            className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-blue-600 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 transition-colors cursor-pointer font-bold"
                          >
                            <span>세부 게임 ({topGames.length})</span>
                            {isGameExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[#0F172A] font-bold">
                          {cat.val.toLocaleString()}
                          <span className="text-slate-500 font-normal ml-0.5">{metricBasis === 'viewers' ? '명' : '개'}</span>
                        </span>
                        <span className="text-slate-500 ml-1.5 text-[11px]">({cat.pct}%)</span>
                      </div>
                    </div>

                    {/* 진행 바 */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          cat.key === 'GAME'
                            ? 'bg-blue-600'
                            : cat.key === 'TALK'
                            ? 'bg-emerald-500'
                            : cat.key === 'MUSIC'
                            ? 'bg-pink-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(cat.pct, 100)}%` }}
                      />
                    </div>

                    {/* 세부 게임 행 펼쳐짐 (상위 5개 게임 목록) */}
                    {isGame && isGameExpanded && topGames.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-blue-300 space-y-1.5 py-1">
                        {topGames.map((g) => {
                          const isThisGameSelected = selectedGame === g.name;

                          return (
                            <button
                              key={g.name}
                              type="button"
                              onClick={() => {
                                onSelectCategory('GAME');
                                onSelectGame(isThisGameSelected ? null : g.name);
                              }}
                              className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                isThisGameSelected
                                  ? 'bg-blue-100 border border-blue-300 text-blue-800 font-black'
                                  : 'hover:bg-slate-50 text-slate-700 hover:text-[#0F172A]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate pr-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isThisGameSelected ? 'bg-blue-600' : 'bg-slate-400'}`} />
                                <span className="truncate">{g.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 whitespace-nowrap">
                                <span className="text-[#0F172A] font-bold">{g.val.toLocaleString()}{metricBasis === 'viewers' ? '명' : '개'}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-100 pt-2.5 mt-3">
            * 게임 항목 클릭 시 해당 게임의 방송만 하단에 노출됩니다.
          </div>
        </div>
      </div>
    </div>
  );
};
