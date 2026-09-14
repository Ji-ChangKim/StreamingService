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
      <div className="h-48 bg-[#121626]/80 border border-white/10 rounded-2xl flex items-center justify-center text-gray-500 text-xs animate-pulse">
        콘텐츠 소비 구성 데이터를 로딩 중입니다...
      </div>
    );
  }

  // 상위 5개 카테고리만 추림
  const topCategories = categories.slice(0, 5);

  return (
    <div className="bg-[#131627]/90 border border-white/10 rounded-2xl p-5 shadow-xl mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>콘텐츠 소비 점유율(시청 수요) vs 공급 점유율(LIVE 수) 비교</span>
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            시청 수요 점유율이 공급 점유율보다 높은 콘텐츠는 상대적으로 시청자 확보에 유리합니다.
          </p>
        </div>

        {onNavigateToCategory && (
          <button
            type="button"
            onClick={onNavigateToCategory}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <span>콘텐츠 4분면 분석</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {topCategories.map((cat) => {
          const viewerPercent = Math.round(cat.viewerShare * 100);
          const livePercent = Math.round(cat.liveShare * 100);
          const isDemandAdvantage = cat.efficiencyIndex > 1.0;

          return (
            <div key={cat.groupId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{cat.name}</span>
                  {isDemandAdvantage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      수요 우위 (효율 {cat.efficiencyIndex}x)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-indigo-300 font-medium">시청 수요: {viewerPercent}%</span>
                  <span className="text-emerald-300 font-medium">방송 공급: {livePercent}%</span>
                </div>
              </div>

              {/* 이중 비교 프로그레스 바 */}
              <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex flex-col justify-center gap-0.5 p-0.5">
                <div
                  className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, viewerPercent * 2)}%` }}
                  title={`시청 점유율: ${viewerPercent}%`}
                />
                <div
                  className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
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
