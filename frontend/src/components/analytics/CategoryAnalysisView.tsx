import { useState } from 'react';
import { CategoryStat, CurrentContentData } from '../../services/analyticsApiService';
import { CurrentContentPanel } from './CurrentContentPanel';
import { Layers, Compass, Search } from 'lucide-react';

interface CategoryAnalysisViewProps {
  categories: CategoryStat[];
  currentContent?: CurrentContentData;
  isLoading: boolean;
}

export function CategoryAnalysisView({ categories, currentContent, isLoading }: CategoryAnalysisViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryStat | null>(() => categories[0] || null);

  if (isLoading || !categories || categories.length === 0) {
    return (
      <div className="h-96 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center text-slate-400 text-xs animate-pulse">
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

  const getQuadrantLabel = (q: string) => {
    switch (q) {
      case 'BLUE_OCEAN':
        return '공급 대비 시청 우위';
      case 'RED_OCEAN':
        return '고수요 · 고공급';
      case 'NICHE':
        return '저수요 · 저공급';
      default:
        return '공급 대비 시청 열위';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. [핵심 기능] 현재 콘텐츠별 동시시청 (게임 드릴다운) */}
      <CurrentContentPanel
        data={currentContent}
        isLoading={isLoading}
      />

      {/* 2. 콘텐츠 수요·공급 4분면 매트릭스 (Quadrant Chart) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <span>콘텐츠 수요·공급 4분면 매트릭스 (Category Quadrant)</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              카테고리별 수요(동시시청 점유율)와 공급(LIVE 방송 점유율)의 상대적 분포를 4개 구간으로 분류해 비교합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono font-bold">
              계산식: 수요·공급 비율 = 시청 점유율 ÷ LIVE 점유율
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* SVG 4분면 버블 차트 */}
          <div className="lg:col-span-2 relative bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 overflow-hidden">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto select-none">
              {/* 사분면 배경 구분 */}
              {/* 좌상단: 공급 대비 시청 우위 */}
              <rect
                x={pad}
                y={pad}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#10b981"
                fillOpacity="0.09"
              />
              <text x={pad + 10} y={pad + 20} fill="#059669" fontSize="11" fontWeight="bold">
                [공급 대비 시청 우위] 고시청 · 저공급
              </text>

              {/* 우상단: 고수요 · 고공급 */}
              <rect
                x={pad + (chartW - pad * 2) / 2}
                y={pad}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#ef4444"
                fillOpacity="0.06"
              />
              <text x={chartW - pad - 10} y={pad + 20} textAnchor="end" fill="#dc2626" fontSize="11" fontWeight="bold">
                [고수요 · 고공급] 고시청 · 고경쟁
              </text>

              {/* 좌하단: 저수요 · 저공급 */}
              <rect
                x={pad}
                y={pad + (chartH - pad * 2) / 2}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#3b82f6"
                fillOpacity="0.05"
              />
              <text x={pad + 10} y={chartH - pad - 10} fill="#2563eb" fontSize="11" fontWeight="bold">
                [저수요 · 저공급] 틈새 마니아
              </text>

              {/* 우하단: 공급 대비 시청 열위 */}
              <rect
                x={pad + (chartW - pad * 2) / 2}
                y={pad + (chartH - pad * 2) / 2}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#f59e0b"
                fillOpacity="0.04"
              />
              <text x={chartW - pad - 10} y={chartH - pad - 10} textAnchor="end" fill="#d97706" fontSize="11" fontWeight="bold">
                [공급 대비 시청 열위] 저시청 · 고공급
              </text>

              {/* 중심 십자 가이드라인 */}
              <line
                x1={pad + (chartW - pad * 2) / 2}
                y1={pad}
                x2={pad + (chartW - pad * 2) / 2}
                y2={chartH - pad}
                stroke="#94A3B8"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
              />
              <line
                x1={pad}
                y1={pad + (chartH - pad * 2) / 2}
                x2={chartW - pad}
                y2={pad + (chartH - pad * 2) / 2}
                stroke="#94A3B8"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
              />

              {/* X/Y축 라벨 */}
              <text x={chartW / 2} y={chartH - 8} textAnchor="middle" fill="#64748B" fontSize="10" fontWeight="600">
                공급: LIVE 방송 수 (채널) →
              </text>
              <text x={14} y={chartH / 2} textAnchor="middle" fill="#64748B" fontSize="10" fontWeight="600" transform={`rotate(-90 14 ${chartH / 2})`}>
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
                          ? '#2563eb'
                          : '#f43f5e'
                      }
                      fillOpacity={isSelected ? 0.95 : 0.75}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 1.5}
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
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">{currentCat.name}</h3>
                    <span className="text-[10px] text-[#64748B]">대분류: {currentCat.groupId}</span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border ${
                    currentCat.efficiencyIndex >= 1.1
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {getQuadrantLabel(currentCat.quadrant)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B]">동시시청 합계 (수요)</span>
                  <strong className="text-[#0F172A] font-mono">{currentCat.viewersSum.toLocaleString()}명</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B]">LIVE 방송 수 (공급)</span>
                  <strong className="text-[#0F172A] font-mono">{currentCat.liveCount}채널</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B]">방송당 시청 수치</span>
                  <strong className="text-emerald-600 font-bold font-mono">{currentCat.viewersPerLive}명/방</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[#64748B]">수요·공급 비율</span>
                  <strong className="text-blue-600 font-mono font-bold">{currentCat.efficiencyIndex.toFixed(2)}</strong>
                </div>
              </div>

              {/* 하위 인기 게임/콘텐츠 */}
              {currentCat.topGames && currentCat.topGames.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-[#64748B] mb-2">대표 게임/세부 토픽</div>
                  <div className="space-y-1.5 text-[11px]">
                    {currentCat.topGames.map((g) => (
                      <div key={g.name} className="flex items-center justify-between text-[#334155]">
                        <span>• {g.name}</span>
                        <span className="text-blue-600 font-mono font-semibold">{g.viewers.toLocaleString()}명</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-[#334155]">
              💡 <strong>지표 해석:</strong> 공급 점유율(LIVE 수) 대비 시청 수요 점유율의 상대적 비율({currentCat.efficiencyIndex.toFixed(2)})을 나타내며, 특정 채널의 시청자 유입이나 성공을 단정하지 않습니다.
            </div>
          </div>
        </div>
      </div>

      {/* 2. 세부 카테고리 검색 & 정렬 테이블 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">카테고리별 상세 비교 통계</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              플랫폼 통합 정규화 분류 체계 기준 카테고리별 수요·공급 지표
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="카테고리 검색..."
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] transition-colors w-44 sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-slate-500 text-[11px]">
                <th className="py-2.5 px-3">카테고리</th>
                <th className="py-2.5 px-3 text-right">시청 수요 합계</th>
                <th className="py-2.5 px-3 text-right">시청 점유율</th>
                <th className="py-2.5 px-3 text-right">LIVE 공급 수</th>
                <th className="py-2.5 px-3 text-right">방송당 시청</th>
                <th className="py-2.5 px-3 text-right">수요·공급 비율</th>
                <th className="py-2.5 px-3 text-center">분류 구간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredCategories.map((c) => (
                <tr
                  key={c.groupId}
                  onClick={() => setSelectedCategory(c)}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentCat.groupId === c.groupId ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-[#0F172A] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{c.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#334155]">
                    {c.viewersSum.toLocaleString()}명
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-semibold">
                    {Math.round(c.viewerShare * 100)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-purple-700 font-semibold">
                    {c.liveCount}채널
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">
                    {c.viewersPerLive}명
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-bold">
                    {c.efficiencyIndex.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        c.quadrant === 'BLUE_OCEAN'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : c.quadrant === 'RED_OCEAN'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {getQuadrantLabel(c.quadrant)}
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
