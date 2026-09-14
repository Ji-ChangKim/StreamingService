import { useState } from 'react';
import { TimeseriesPoint } from '../../services/analyticsApiService';
import { Activity } from 'lucide-react';

interface DemandSupplyChartProps {
  data: TimeseriesPoint[];
  isLoading?: boolean;
}

export function DemandSupplyChart({ data, isLoading }: DemandSupplyChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeMetric, setActiveMetric] = useState<'both' | 'viewers' | 'live'>('both');

  if (isLoading || !data || data.length === 0) {
    return (
      <div className="h-72 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center text-[#64748B] text-xs animate-pulse">
        수요·공급 추이 분석 데이터를 불러오는 중입니다...
      </div>
    );
  }

  // 차트 스케일 계산
  const maxViewers = Math.max(...data.map((d) => d.viewers), 1000);
  const maxLive = Math.max(...data.map((d) => d.liveCount), 20);

  const width = 800;
  const height = 240;
  const paddingX = 45;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // 포인트 좌표 변환
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW;
    const yViewer = height - paddingY - (d.viewers / maxViewers) * chartH;
    const yLive = height - paddingY - (d.liveCount / maxLive) * chartH;
    return { ...d, x, yViewer, yLive };
  });

  // SVG 패스 생성
  const viewerLinePath = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yViewer}`,
    ''
  );
  const viewerAreaPath = `${viewerLinePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const liveLinePath = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yLive}`,
    ''
  );

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2563EB]" />
            <span>24시간 시장 수요(동시시청) vs 공급(LIVE 수) 추이</span>
          </h3>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            시청 수요의 급증 시점과 방송 경쟁(LIVE 수)의 분산 구간을 비교 분석합니다.
          </p>
        </div>

        {/* 범례 및 지표 토글 */}
        <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] text-xs">
          <button
            type="button"
            onClick={() => setActiveMetric('both')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeMetric === 'both' ? 'bg-[#0F172A] text-white shadow-2xs' : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            전체 비교
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('viewers')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeMetric === 'viewers'
                ? 'bg-white text-[#2563EB] border border-blue-300 shadow-2xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span>수요 (동시시청)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('live')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeMetric === 'live'
                ? 'bg-white text-emerald-700 border border-emerald-300 shadow-2xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>공급 (LIVE 수)</span>
          </button>
        </div>
      </div>

      {/* 인터랙티브 SVG 차트 */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="viewerAreaGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 수평 가이드선 3단 */}
          {[0, 0.5, 1].map((ratio) => {
            const y = height - paddingY - ratio * chartH;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#CBD5E1"
                  strokeOpacity="0.7"
                  strokeDasharray="4 4"
                />
                {/* 좌측 Y축 라벨 (동시시청) */}
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#2563EB"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {Math.round(ratio * maxViewers).toLocaleString()}
                </text>
                {/* 우측 Y축 라벨 (LIVE 수) */}
                <text
                  x={width - paddingX + 8}
                  y={y + 3}
                  textAnchor="start"
                  fill="#059669"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {Math.round(ratio * maxLive)}개
                </text>
              </g>
            );
          })}

          {/* 수요 (동시시청) Area & Line */}
          {(activeMetric === 'both' || activeMetric === 'viewers') && (
            <>
              <path d={viewerAreaPath} fill="url(#viewerAreaGradientLight)" />
              <path
                d={viewerLinePath}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* 공급 (LIVE 수) Line */}
          {(activeMetric === 'both' || activeMetric === 'live') && (
            <path
              d={liveLinePath}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X축 시간 라벨 (4시간 단위) */}
          {points
            .filter((_, i) => i % 4 === 0 || i === points.length - 1)
            .map((p) => (
              <text
                key={p.hour}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fill="#64748B"
                fontSize="10"
                fontWeight="600"
                fontFamily="sans-serif"
              >
                {p.label}
              </text>
            ))}

          {/* 마우스 호버 가이드 및 포인터 */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={paddingY}
                x2={activePoint.x}
                y2={height - paddingY}
                stroke="#0F172A"
                strokeOpacity="0.25"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle cx={activePoint.x} cy={activePoint.yViewer} r="5" fill="#2563EB" stroke="#ffffff" strokeWidth="2" />
              <circle cx={activePoint.x} cy={activePoint.yLive} r="5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* 투명 마우스 이벤트 감지 영역 */}
          {points.map((p, i) => {
            const stepW = chartW / data.length;
            return (
              <rect
                key={p.hour}
                x={p.x - stepW / 2}
                y={paddingY}
                width={stepW}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-crosshair"
              />
            );
          })}
        </svg>

        {/* 툴팁 오버레이 */}
        {activePoint && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 border border-[#CBD5E1] rounded-xl px-4 py-2 text-xs shadow-xl backdrop-blur-md flex items-center gap-4 pointer-events-none z-20"
          >
            <div className="font-black text-[#0F172A] border-r border-[#E2E8F0] pr-3">
              {activePoint.label}
            </div>
            <div className="flex items-center gap-1.5 text-[#2563EB] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span>수요: {activePoint.viewers.toLocaleString()}명</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>공급: {activePoint.liveCount}채널</span>
            </div>
            <div className="flex items-center gap-1 text-[#64748B] border-l border-[#E2E8F0] pl-3">
              <span>효율: </span>
              <strong className="text-[#0F172A] font-bold">{activePoint.viewersPerLive}명/방</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
