import { useState, useId } from 'react';
import type { StatisticsPoint } from '../../../../shared/broadcastStatistics';
import { countFormat } from './statisticsModel';

interface Props {
  points: StatisticsPoint[];
}

export function LiveViewerChart({ points }: Props) {
  const [metric, setMetric] = useState<'viewers' | 'channels'>('viewers');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const filterId = useId();

  // 1. 치지직과 SOOP 포인트 분리 및 시간순 정렬
  const chzzkPoints = points.filter((p) => p.platform === 'CHZZK').sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const soopPoints = points.filter((p) => p.platform === 'SOOP').sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  // 시간 축 통일 (10분 단위 타임슬롯 생성)
  const timeMap = new Map<string, { time: string; label: string; chzzk: number; soop: number }>();
  
  [...chzzkPoints, ...soopPoints].forEach((p) => {
    const d = new Date(p.at);
    // KST 시간 기준으로 10분 단위 슬롯 키
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = Math.floor(d.getMinutes() / 10) * 10;
    const minsStr = mins.toString().padStart(2, '0');
    const slotKey = `${d.toISOString().slice(0, 10)} ${hours}:${minsStr}`;
    const label = `${hours}:${minsStr}`;
    
    if (!timeMap.has(slotKey)) {
      timeMap.set(slotKey, { time: slotKey, label, chzzk: 0, soop: 0 });
    }
    const item = timeMap.get(slotKey)!;
    const val = metric === 'viewers' ? p.viewers : p.channels;
    if (p.platform === 'CHZZK') item.chzzk = val;
    if (p.platform === 'SOOP') item.soop = val;
  });

  const timeline = Array.from(timeMap.values()).sort((a, b) => a.time.localeCompare(b.time));

  // 2. 최대값 계산 및 SVG 좌표 스케일링
  const maxVal = Math.max(1, ...timeline.map((t) => Math.max(t.chzzk, t.soop)));
  const width = 720;
  const height = 260;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const pointsCount = Math.max(timeline.length, 2);

  const getX = (index: number) => padLeft + (index / (pointsCount - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - (val / maxVal) * chartH;

  // 부드러운 곡선 경로(Path) 생성 함수
  const makePath = (dataVals: number[]) => {
    if (!dataVals.length) return '';
    return dataVals.reduce((acc, val, i) => {
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x.toFixed(1)},${y.toFixed(1)}`;
      const prevX = getX(i - 1);
      const prevY = getY(dataVals[i - 1]);
      const cp1X = prevX + (x - prevX) / 2;
      const cp2X = prevX + (x - prevX) / 2;
      return `${acc} C ${cp1X.toFixed(1)},${prevY.toFixed(1)} ${cp2X.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }, '');
  };

  const chzzkVals = timeline.map((t) => t.chzzk);
  const soopVals = timeline.map((t) => t.soop);

  const chzzkPath = makePath(chzzkVals);
  const soopPath = makePath(soopVals);

  // 영역 채우기(Area) 경로
  const chzzkArea = chzzkPath
    ? `${chzzkPath} L ${getX(timeline.length - 1)},${padTop + chartH} L ${padLeft},${padTop + chartH} Z`
    : '';

  // X축 눈금 레이블 (주요 시간대)
  const hourTicks: { index: number; label: string; x: number }[] = [];
  timeline.forEach((item, index) => {
    if (item.label.endsWith(':00') && (parseInt(item.label) % 3 === 0)) {
      hourTicks.push({ index, label: item.label, x: getX(index) });
    }
  });

  const activeItem = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < timeline.length ? timeline[hoverIndex] : null;

  return (
    <div className="sc-chart-card">
      <div className="sc-chart-header">
        <div className="sc-chart-title">
          <span className="sc-chart-icon">📈</span>
          <div>
            <h3>실시간 시청자 데이터</h3>
            <p>치지직, SOOP 한국어 전체 {metric === 'viewers' ? '시청자 수' : '채널 수'} 24시간 추이</p>
          </div>
        </div>
        <div className="sc-chart-controls">
          <div className="ad-pill-segment-small" role="group" aria-label="차트 지표 선택">
            <button
              type="button"
              className={`ad-pill-tab-small ${metric === 'viewers' ? 'is-active' : ''}`}
              onClick={() => setMetric('viewers')}
            >
              시청자
            </button>
            <button
              type="button"
              className={`ad-pill-tab-small ${metric === 'channels' ? 'is-active' : ''}`}
              onClick={() => setMetric('channels')}
            >
              채널
            </button>
          </div>
        </div>
      </div>

      <div className="sc-chart-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="sc-chart-svg"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            if (relX >= padLeft && relX <= width - padRight) {
              const idx = Math.round(((relX - padLeft) / chartW) * (pointsCount - 1));
              setHoverIndex(Math.max(0, Math.min(timeline.length - 1, idx)));
            }
          }}
        >
          <defs>
            <linearGradient id={`chzzk-gradient-${filterId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={`soop-gradient-${filterId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 수평 그리드 가이드라인 */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padTop + chartH * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={pct}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="sans-serif">
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* X축 시간 눈금 */}
          {hourTicks.map((tick) => (
            <text key={tick.label} x={tick.x} y={height - 12} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif">
              {tick.label}
            </text>
          ))}

          {/* 치지직 에어리어 채우기 */}
          {chzzkArea && <path d={chzzkArea} fill={`url(#chzzk-gradient-${filterId})`} />}

          {/* SOOP 라인 (블루) */}
          {soopPath && (
            <path
              d={soopPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 치지직 라인 (네온 그린) */}
          {chzzkPath && (
            <path
              d={chzzkPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 호버 가이드라인 및 포인트 */}
          {activeItem && hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={padTop + chartH}
                stroke="rgba(255,255,255,0.3)"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activeItem.chzzk)}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activeItem.soop)}
                r="4.5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* 인터랙티브 호버 툴팁 */}
        {activeItem && hoverIndex !== null && (
          <div
            className="sc-chart-tooltip"
            style={{
              left: `${(getX(hoverIndex) / width) * 100}%`,
              transform: getX(hoverIndex) > width * 0.75 ? 'translate(-100%, -50%)' : 'translate(10px, -50%)',
              top: '40%',
            }}
          >
            <div className="sc-tooltip-time">{activeItem.time}</div>
            <div className="sc-tooltip-row chzzk">
              <span className="sc-dot chzzk" />
              <span>치지직:</span>
              <strong>{countFormat(activeItem.chzzk)}명</strong>
            </div>
            <div className="sc-tooltip-row soop">
              <span className="sc-dot soop" />
              <span>SOOP:</span>
              <strong>{countFormat(activeItem.soop)}명</strong>
            </div>
          </div>
        )}
      </div>

      <div className="sc-chart-legend">
        <span className="sc-legend-item chzzk">
          <i /> 치지직 {metric === 'viewers' ? '시청자' : '채널'}
        </span>
        <span className="sc-legend-item soop">
          <i /> SOOP {metric === 'viewers' ? '시청자' : '채널'}
        </span>
      </div>
    </div>
  );
}
