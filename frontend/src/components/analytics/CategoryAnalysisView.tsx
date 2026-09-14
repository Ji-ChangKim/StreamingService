import { useState } from 'react';
import { CategoryStat } from '../../services/analyticsApiService';
import { Layers, Compass, Search } from 'lucide-react';

interface CategoryAnalysisViewProps {
  categories: CategoryStat[];
  isLoading: boolean;
}

export function CategoryAnalysisView({ categories, isLoading }: CategoryAnalysisViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryStat | null>(() => categories[0] || null);

  if (isLoading || !categories || categories.length === 0) {
    return (
      <div className="h-96 bg-[#121626]/80 border border-white/10 rounded-2xl flex items-center justify-center text-gray-500 text-xs animate-pulse">
        콘텐츠 사분면 분석 데이터를 불러오는 중입니다...
      </div>
    );
  }

  const currentCat = selectedCategory || categories[0];

  // 사분면 차트용 스케일
  const maxLive = 100;
  const maxViewers = 30000;
  const chartW = 600;
  const chartH = 340;
  const pad = 40;

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.groupId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. 콘텐츠 수요·공급 4분면 매트릭스 (Quadrant Chart) */}
      <div className="bg-[#131627]/90 border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span>콘텐츠 수요·공급 4분면 매트릭스 (Category Quadrant)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              어떤 콘텐츠가 인기인지 단순 나열하는 것이 아니라, 수요(동시시청)와 공급(LIVE 수)이 어긋나는 블루오션 영역을 포착합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
              ★ 블루오션: 수요 높음 · 공급 적음
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* SVG 4분면 버블 차트 */}
          <div className="lg:col-span-2 relative bg-black/40 border border-white/10 rounded-2xl p-4 overflow-hidden">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto select-none">
              {/* 사분면 배경 구분 */}
              {/* 좌상단: 블루오션 (수요 높고 공급 낮음) */}
              <rect
                x={pad}
                y={pad}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#10b981"
                fillOpacity="0.06"
              />
              <text x={pad + 10} y={pad + 20} fill="#34d399" fontSize="11" fontWeight="bold">
                [블루오션] 고수요 · 저공급 (추천)
              </text>

              {/* 우상단: 레드오션 (수요 높고 공급 높음) */}
              <rect
                x={pad + (chartW - pad * 2) / 2}
                y={pad}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#ef4444"
                fillOpacity="0.04"
              />
              <text x={chartW - pad - 10} y={pad + 20} textAnchor="end" fill="#f87171" fontSize="11" fontWeight="bold">
                [레드오션] 고수요 · 치열한 경쟁
              </text>

              {/* 좌하단: 롱테일/니치 */}
              <rect
                x={pad}
                y={pad + (chartH - pad * 2) / 2}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#818cf8"
                fillOpacity="0.03"
              />
              <text x={pad + 10} y={chartH - pad - 10} fill="#818cf8" fontSize="11" fontWeight="bold">
                [틈새/니치] 안정적 마니아
              </text>

              {/* 중심 십자 가이드라인 */}
              <line
                x1={pad + (chartW - pad * 2) / 2}
                y1={pad}
                x2={pad + (chartW - pad * 2) / 2}
                y2={chartH - pad}
                stroke="#ffffff"
                strokeOpacity="0.2"
                strokeDasharray="4 4"
              />
              <line
                x1={pad}
                y1={pad + (chartH - pad * 2) / 2}
                x2={chartW - pad}
                y2={pad + (chartH - pad * 2) / 2}
                stroke="#ffffff"
                strokeOpacity="0.2"
                strokeDasharray="4 4"
              />

              {/* X/Y축 라벨 */}
              <text x={chartW / 2} y={chartH - 8} textAnchor="middle" fill="#9ca3af" fontSize="10">
                공급: LIVE 방송 수 (채널) →
              </text>
              <text x={14} y={chartH / 2} textAnchor="middle" fill="#9ca3af" fontSize="10" transform={`rotate(-90 14 ${chartH / 2})`}>
                수요: 동시시청 합계 (명) →
              </text>

              {/* 카테고리 버블들 */}
              {categories.map((cat) => {
                const cx = pad + (cat.liveCount / maxLive) * (chartW - pad * 2);
                const cy = chartH - pad - (cat.viewersSum / maxViewers) * (chartH - pad * 2);
                const r = Math.max(12, Math.min(28, (cat.viewersPerLive / 300) * 16));
                const isSelected = currentCat.groupId === cat.groupId;

                return (
                  <g
                    key={cat.groupId}
                    onClick={() => setSelectedCategory(cat)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={
                        cat.efficiencyIndex >= 1.1
                          ? '#10b981'
                          : cat.efficiencyIndex >= 0.9
                          ? '#6366f1'
                          : '#f43f5e'
                      }
                      fillOpacity={isSelected ? 0.9 : 0.6}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 1}
                      className="transition-all hover:scale-110"
                    />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {cat.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 선택 카테고리 심층 분석 패널 */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{currentCat.name}</h3>
                    <span className="text-[10px] text-gray-400">대분류: {currentCat.groupId}</span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border ${
                    currentCat.efficiencyIndex >= 1.1
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  {currentCat.quadrant}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">동시시청 합계 (수요)</span>
                  <strong className="text-white">{currentCat.viewersSum.toLocaleString()}명</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">LIVE 방송 수 (공급)</span>
                  <strong className="text-white">{currentCat.liveCount}채널</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">방송당 시청 효율</span>
                  <strong className="text-emerald-400">{currentCat.viewersPerLive}명/방</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">수요/공급 효율 지수</span>
                  <strong className="text-indigo-300 font-mono">{currentCat.efficiencyIndex}x</strong>
                </div>
              </div>

              {/* 하위 인기 게임/콘텐츠 */}
              {currentCat.topGames && currentCat.topGames.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="text-[11px] font-bold text-gray-400 mb-2">대표 게임/세부 토픽</div>
                  <div className="space-y-1.5 text-[11px]">
                    {currentCat.topGames.map((g) => (
                      <div key={g.name} className="flex items-center justify-between text-gray-300">
                        <span>• {g.name}</span>
                        <span className="text-indigo-400 font-mono">{g.viewers.toLocaleString()}명</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-gray-300">
              💡 {currentCat.efficiencyIndex >= 1.0
                ? '시청 수요 대비 방송자가 적어 신규 버튜버가 방송 시 시청자 분산 유입 효과가 큽니다.'
                : '공급 경쟁이 치열하므로 시간대를 심야/주말 낮으로 우회 편성하는 것을 권장합니다.'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 세부 카테고리 검색 & 정렬 테이블 */}
      <div className="bg-[#131627]/90 border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">카테고리별 상세 비교 통계</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              플랫폼 통합 정규화 분류 체계 기준 카테고리별 수요·공급 지표
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="카테고리 검색..."
              className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors w-44 sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-[11px]">
                <th className="py-2.5 px-3">카테고리</th>
                <th className="py-2.5 px-3 text-right">시청 수요 합계</th>
                <th className="py-2.5 px-3 text-right">시청 점유율</th>
                <th className="py-2.5 px-3 text-right">LIVE 공급 수</th>
                <th className="py-2.5 px-3 text-right">방송당 시청</th>
                <th className="py-2.5 px-3 text-center">사분면 분류</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCategories.map((c) => (
                <tr
                  key={c.groupId}
                  onClick={() => setSelectedCategory(c)}
                  className={`hover:bg-white/5 transition-colors cursor-pointer ${
                    currentCat.groupId === c.groupId ? 'bg-white/5' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>{c.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-200">
                    {c.viewersSum.toLocaleString()}명
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-300">
                    {Math.round(c.viewerShare * 100)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-purple-300">
                    {c.liveCount}채널
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                    {c.viewersPerLive}명
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.quadrant === 'BLUE_OCEAN'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : c.quadrant === 'RED_OCEAN'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {c.quadrant}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
