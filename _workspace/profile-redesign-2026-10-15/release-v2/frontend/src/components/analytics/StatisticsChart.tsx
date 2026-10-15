import { useEffect, useRef, useState } from 'react';
import type { BroadcastStatistics, StatisticsPoint, StatisticsPlatform } from '../../../../shared/broadcastStatistics';
import { countFormat, inPlatform, platformName, STATISTICS_PLATFORMS, statisticsTime, type StatisticsFilters } from './statisticsModel';

interface ChartProps {
  data: BroadcastStatistics | null;
  filters: StatisticsFilters;
  onChange: (changes: Partial<StatisticsFilters>) => void;
}

// 수집 간격이 90분 넘게 벌어진 구간은 선으로 이어 그리지 않는다.
export function statisticsChartPath(points: StatisticsPoint[], x: (at: string) => number, y: (value: number) => number, metric: 'viewers' | 'channels') {
  return points.map((point, index) => {
    const previous = points[index - 1];
    const command = !previous || point.partial || previous.partial || Date.parse(point.at) - Date.parse(previous.at) > 90 * 60000 ? 'M' : 'L';
    return `${command}${x(point.at).toFixed(2)},${y(point[metric]).toFixed(2)}`;
  }).join(' ');
}

// 실시간 시청자 및 방송 채널 추이를 시각화하는 차트 컴포넌트 (단일 책임)
export function StatisticsChart({ data, filters, onChange }: ChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hidden, setHidden] = useState<StatisticsPlatform[]>([]);
  const [hovered, setHovered] = useState<StatisticsPoint | null>(null);

  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(230, entry.contentRect.width)));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const end = data ? Date.parse(data.meta.generatedAt) : Date.now();
  const start = end - filters.hours * 3600000;
  const points = (data?.points || []).filter((point) => inPlatform(point, filters.platform) && Date.parse(point.at) >= start && Date.parse(point.at) <= end);
  const displayed = points.filter((point) => !hidden.includes(point.platform));
  const chartMetric = filters.metric === 'channels' ? 'channels' : 'viewers';
  const highest = Math.max(1, ...displayed.map((point) => point[chartMetric]));
  const ceiling = Math.ceil(highest / Math.pow(10, Math.floor(Math.log10(highest)))) * Math.pow(10, Math.floor(Math.log10(highest)));
  const left = width < 380 ? 42 : 54;
  const height = 238;
  const x = (at: string) => left + (Date.parse(at) - start) / (end - start) * (width - left - 16);
  const y = (value: number) => 200 - value / ceiling * 170;
  const latest = displayed.filter((point) => point.kind === 'current');
  const value = latest.length ? latest.reduce((sum, point) => sum + point[chartMetric], 0) : null;
  const togglePlatform = (id: StatisticsPlatform) => setHidden((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <section className="bs-panel bs-chart-panel" aria-label="실시간 추이">
      <div className="bs-panel-head">
        <div>
          <h2>
            <span className="bs-live-dot" />
            실시간 {chartMetric === 'channels' ? '방송 채널' : '시청자'} 추이
          </h2>
          <p>시간대별 방송 흐름과 시청자 유입 변화를 살펴보세요</p>
        </div>
        <div className="bs-segment" aria-label="차트 지표">
          {(['viewers', 'channels'] as const).map((metric) => (
            <button
              key={metric}
              type="button"
              aria-pressed={chartMetric === metric}
              onClick={() => onChange({ metric })}
            >
              {metric === 'viewers' ? '시청자' : '채널'}
            </button>
          ))}
        </div>
      </div>

      <div className="bs-chart-summary">
        <div>
          <strong>{value === null ? '—' : countFormat(value)}</strong>
          <span>{chartMetric === 'viewers' ? '현재 실시간 시청자' : '현재 라이브 채널 수'}</span>
        </div>
        <select aria-label="차트 기간" value={filters.hours} onChange={(event) => onChange({ hours: Number(event.target.value) })}>
          {[24, 12, 6].map((hours) => (
            <option value={hours} key={hours}>최근 {hours}시간</option>
          ))}
        </select>
      </div>

      <div className="bs-legend" aria-label="차트 플랫폼 선택">
        {STATISTICS_PLATFORMS.filter((item) => inPlatform({ platform: item.id }, filters.platform)).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={!hidden.includes(item.id)}
            onClick={() => togglePlatform(item.id)}
          >
            <span style={{ backgroundColor: item.color }} />
            {item.name}
          </button>
        ))}
      </div>

      <div className="bs-chart-box" ref={box}>
        {!displayed.length ? (
          <div className="bs-chart-empty">
            <strong>{data ? '선택한 기간에 표시할 기록이 없어요' : '방송 흐름을 불러오고 있어요'}</strong>
            <p>기간이나 플랫폼 조건을 변경해 보세요.</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="bs-chart-svg"
            aria-label={`최근 ${filters.hours}시간 ${chartMetric === 'viewers' ? '시청자 수' : '방송 채널 수'} 추이. 한국 시각 기준.`}
          >
            <title>실시간 시계열 추이</title>
            {[0, 1, 2, 3, 4].map((step) => (
              <g key={step}>
                <line x1={left} x2={width - 16} y1={y(ceiling * step / 4)} y2={y(ceiling * step / 4)} stroke="#e2e8f0" />
                <text x={left - 8} y={y(ceiling * step / 4) + 4} textAnchor="end">
                  {ceiling * step / 4 >= 10000 ? `${(ceiling * step / 40000).toFixed(1)}만` : countFormat(Math.round(ceiling * step / 4))}
                </text>
              </g>
            ))}
            {[0, 1, 2, 3].map((step) => (
              <text key={step} x={left + (width - left - 16) * step / 3} y={224} textAnchor={step === 0 ? 'start' : step === 3 ? 'end' : 'middle'}>
                {statisticsTime(new Date(start + (end - start) * step / 3).toISOString())}
              </text>
            ))}
            {STATISTICS_PLATFORMS.map((platform) => {
              const line = displayed.filter((point) => point.platform === platform.id);
              return (
                <g key={platform.id}>
                  <path
                    d={statisticsChartPath(line, x, y, chartMetric)}
                    fill="none"
                    stroke={platform.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {line.map((point) => (
                    <circle
                      key={`${point.at}-${point.kind}`}
                      cx={x(point.at)}
                      cy={y(point[chartMetric])}
                      r={point.kind === 'current' ? 4 : 3}
                      fill={platform.color}
                      stroke="white"
                      strokeWidth="1"
                      tabIndex={0}
                      aria-label={`${platform.name} ${statisticsTime(point.at, true)} ${countFormat(point[chartMetric])}${chartMetric === 'viewers' ? '명' : '채널'}`}
                      onFocus={() => setHovered(point)}
                      onBlur={() => setHovered(null)}
                      onMouseEnter={() => setHovered(point)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        )}
        {hovered && (
          <div className="bs-chart-tooltip" role="status">
            <b>{statisticsTime(hovered.at, true)} KST</b>
            <span>{platformName(hovered.platform)} · {countFormat(hovered[chartMetric])}{chartMetric === 'viewers' ? '명' : '개 채널'}</span>
          </div>
        )}
      </div>

      <div className="bs-chart-foot">
        <span>한국 시각(KST) 기준 실시간 집계</span>
      </div>
    </section>
  );
}
