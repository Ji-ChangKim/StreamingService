import { CategoryStat } from '../../services/analyticsApiService';
import { Layers, ArrowRight } from 'lucide-react';

interface CategoryShareBarProps {
  categories: CategoryStat[];
  onNavigateToCategory?: () => void;
  isLoading?: boolean;
}

export function CategoryShareBar({ categories, onNavigateToCategory, isLoading }: CategoryShareBarProps) {
  if (isLoading || !categories || categories.length === 0) {
    return (
      <div className="h-48 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center text-slate-400 text-xs animate-pulse">
        콘텐츠 소비 구성 데이터를 로딩 중입니다...
      </div>
    );
  }

  // 상위 5개 카테고리만 추림
  const topCategories = categories.slice(0, 5);

  return (
    <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>콘텐츠 소비 점유율(시청 수요) vs 공급 점유율(LIVE 수) 비교</span>
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
            시청 수요 점유율이 공급 점유율보다 높은 콘텐츠는 상대적으로 신규 시청자 확보에 유리합니다.
          </p>
        </div>

        {onNavigateToCategory && (
          <button
            type="button"
            onClick={onNavigateToCategory}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#2563EB] hover:text-blue-800 transition-colors cursor-pointer"
          >
            <span>콘텐츠 4분면 분석</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {topCategories.map((cat) => {
          const viewerPercent = Math.round(cat.viewerShare * 100);
          const livePercent = Math.round(cat.liveShare * 100);
          const isDemandAdvantage = cat.efficiencyIndex > 1.0;

          return (
            <div key={cat.groupId} className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-[#0F172A] text-sm sm:text-base">{cat.name}</span>
                  {isDemandAdvantage && (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300">
                      공급 대비 시청 우위 (비율 {cat.efficiencyIndex.toFixed(2)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs sm:text-sm font-black">
                  <span className="text-blue-700">시청 수요: {viewerPercent}%</span>
                  <span className="text-emerald-700">방송 공급: {livePercent}%</span>
                </div>
              </div>

              {/* 이중 비교 프로그레스 바 */}
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex flex-col justify-center gap-1 p-0.5 border border-slate-200">
                <div
                  className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, viewerPercent * 2)}%` }}
                  title={`시청 점유율: ${viewerPercent}%`}
                />
                <div
                  className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, livePercent * 2)}%` }}
                  title={`LIVE 공급 점유율: ${livePercent}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
