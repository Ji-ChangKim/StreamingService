import { useState } from 'react';
import { CategoryStat, CurrentContentData } from '../../services/analyticsApiService';
import { CurrentContentPanel } from './CurrentContentPanel';
import { RookieRadarPanel } from './RookieRadarPanel';
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
      {/* 1. 🎯 신입 스트리머 레이더 (신입들은 어디에 모여있는가?) */}
      <RookieRadarPanel
        rookieRadar={currentContent?.rookieRadar}
        isLoading={isLoading}
      />

      {/* 2. [핵심 기능] 현재 콘텐츠별 동시시청 (게임 드릴다운 & 대형 합방 원인 감지) */}
      <CurrentContentPanel
        data={currentContent}
        isLoading={isLoading}
      />

      {/* 3. 콘텐츠 수요·공급 4분면 매트릭스 (Quadrant Chart) */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A] flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <span>콘텐츠 수요·공급 4분면 매트릭스 (Category Quadrant)</span>
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
              카테고리별 수요(동시시청 점유율)와 공급(LIVE 방송 점유율)의 상대적 분포를 4개 구간으로 분류해 비교합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="flex items-center gap-1 text-[#2563EB] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 font-mono font-black">
              계산식: 수요·공급 비율 = 시청 점유율 ÷ LIVE 점유율
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* SVG 4분면 버블 차트 */}
          <div className="lg:col-span-2 relative bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-4 overflow-hidden">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto select-none">
              {/* 사분면 배경 구분 */}
              {/* 좌상단: 공급 대비 시청 우위 */}
              <rect
                x={pad}
                y={pad}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#10b981"
                fillOpacity="0.10"
              />
              <text x={pad + 12} y={pad + 22} fill="#065f46" fontSize="13" fontWeight="900">
                [공급 대비 시청 우위] 고시청 · 저공급
              </text>

              {/* 우상단: 고수요 · 고공급 */}
              <rect
                x={pad + (chartW - pad * 2) / 2}
                y={pad}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#ef4444"
                fillOpacity="0.08"
              />
              <text x={chartW - pad - 12} y={pad + 22} textAnchor="end" fill="#991b1b" fontSize="13" fontWeight="900">
                [고수요 · 고공급] 고시청 · 고경쟁
              </text>

              {/* 좌하단: 저수요 · 저공급 */}
              <rect
                x={pad}
                y={pad + (chartH - pad * 2) / 2}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#3b82f6"
                fillOpacity="0.08"
              />
              <text x={pad + 12} y={chartH - pad - 12} fill="#1e40af" fontSize="13" fontWeight="900">
                [저수요 · 저공급] 틈새 마니아
              </text>

              {/* 우하단: 공급 대비 시청 열위 */}
              <rect
                x={pad + (chartW - pad * 2) / 2}
                y={pad + (chartH - pad * 2) / 2}
                width={(chartW - pad * 2) / 2}
                height={(chartH - pad * 2) / 2}
                fill="#f59e0b"
                fillOpacity="0.07"
              />
              <text x={chartW - pad - 12} y={chartH - pad - 12} textAnchor="end" fill="#92400e" fontSize="13" fontWeight="900">
                [공급 대비 시청 열위] 저시청 · 고공급
              </text>

              {/* 중심 십자 가이드라인 */}
              <line
                x1={pad + (chartW - pad * 2) / 2}
                y1={pad}
                x2={pad + (chartW - pad * 2) / 2}
                y2={chartH - pad}
                stroke="#64748B"
                strokeOpacity="0.5"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <line
                x1={pad}
                y1={pad + (chartH - pad * 2) / 2}
                x2={chartW - pad}
                y2={pad + (chartH - pad * 2) / 2}
                stroke="#64748B"
                strokeOpacity="0.5"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />

              {/* X/Y축 라벨 */}
              <text x={chartW / 2} y={chartH - 8} textAnchor="middle" fill="#334155" fontSize="12" fontWeight="800">
                공급: LIVE 방송 수 (채널) →
              </text>
              <text x={14} y={chartH / 2} textAnchor="middle" fill="#334155" fontSize="12" fontWeight="800" transform={`rotate(-90 14 ${chartH / 2})`}>
                수요: 동시시청 합계 (명) →
              </text>

              {/* 카테고리 버블들 */}
              {categories.map((cat) => {
                const cx = pad + (cat.liveCount / maxLive) * (chartW - pad * 2);
                const cy = chartH - pad - (cat.viewersSum / maxViewers) * (chartH - pad * 2);
                const r = Math.max(14, Math.min(30, (cat.viewersPerLive / 300) * 18));
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
                      fillOpacity={isSelected ? 0.95 : 0.8}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3.5 : 2}
                      className="transition-all hover:scale-110"
                    />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="900"
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
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0F172A]">{currentCat.name}</h3>
                    <span className="text-xs text-slate-700 font-bold">대분류: {currentCat.groupId}</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-black px-3 py-1 rounded-lg border ${
                    currentCat.efficiencyIndex >= 1.1
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}
                >
                  {getQuadrantLabel(currentCat.quadrant)}
                </span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CBD5E1]">
                  <span className="text-slate-700 font-bold">동시시청 합계 (수요)</span>
                  <strong className="text-[#0F172A] font-mono font-black text-sm sm:text-base">{currentCat.viewersSum.toLocaleString()}명</strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CBD5E1]">
                  <span className="text-slate-700 font-bold">LIVE 방송 수 (공급)</span>
                  <strong className="text-[#0F172A] font-mono font-black text-sm sm:text-base">{currentCat.liveCount}개 채널</strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CBD5E1]">
                  <span className="text-slate-700 font-bold">방송당 평균 시청</span>
                  <strong className="text-emerald-700 font-black font-mono text-sm sm:text-base">{currentCat.viewersPerLive}명</strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#CBD5E1]">
                  <span className="text-slate-700 font-bold">수요·공급 비율</span>
                  <strong className="text-blue-700 font-mono font-black text-sm sm:text-base">{currentCat.efficiencyIndex.toFixed(2)}</strong>
                </div>
              </div>

              {/* 하위 인기 게임/콘텐츠 */}
              {currentCat.topGames && currentCat.topGames.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-200">
                  <div className="text-xs font-black text-slate-800 mb-2">대표 게임/세부 토픽</div>
                  <div className="space-y-2 text-xs sm:text-sm">
                    {currentCat.topGames.map((g) => (
                      <div key={g.name} className="flex items-center justify-between text-slate-800 font-bold">
                        <span>• {g.name}</span>
                        <span className="text-blue-700 font-mono font-black">{g.viewers.toLocaleString()}명</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 신입 버튜버 실전 팁 (개발자 면책 문구 완전 배제) */}
            <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
              💡 <strong>신입 버튜버 활용 팁:</strong> 수요·공급 비율이 1.0 이상인 카테고리는 방송 수 대비 시청자 풀이 넉넉하여, 신규 방송 개설 시 시청자 분산 유입 기회가 상대적으로 높습니다.
            </div>
          </div>
        </div>
      </div>

      {/* 2. 세부 카테고리 검색 & 정렬 테이블 */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A]">카테고리별 상세 비교 통계</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
              플랫폼 통합 정규화 분류 체계 기준 카테고리별 수요·공급 지표
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="카테고리 검색..."
              className="bg-slate-50 border border-[#CBD5E1] rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm font-bold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors w-48 sm:w-60 shadow-2xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b-2 border-[#CBD5E1] text-slate-900 font-black text-xs sm:text-sm">
                <th className="py-3.5 px-4">카테고리</th>
                <th className="py-3.5 px-4 text-right">시청 수요 합계</th>
                <th className="py-3.5 px-4 text-right">시청 점유율</th>
                <th className="py-3.5 px-4 text-right">LIVE 공급 수</th>
                <th className="py-3.5 px-4 text-right">방송당 평균</th>
                <th className="py-3.5 px-4 text-right">수요·공급 비율</th>
                <th className="py-3.5 px-4 text-center">분류 구간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredCategories.map((c) => (
                <tr
                  key={c.groupId}
                  onClick={() => setSelectedCategory(c)}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentCat.groupId === c.groupId ? 'bg-blue-50/70 font-black' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-black text-[#0F172A] text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span>{c.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-[#0F172A] text-sm sm:text-base">
                    {c.viewersSum.toLocaleString()}명
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-700 font-black text-sm sm:text-base">
                    {Math.round(c.viewerShare * 100)}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-purple-800 font-bold text-sm">
                    {c.liveCount}개
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-black text-sm">
                    {c.viewersPerLive}명
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-800 font-black text-sm">
                    {c.efficiencyIndex.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-md border ${
                        c.quadrant === 'BLUE_OCEAN'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : c.quadrant === 'RED_OCEAN'
                          ? 'bg-rose-50 text-rose-900 border-rose-300'
                          : 'bg-blue-50 text-blue-900 border-blue-300'
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
