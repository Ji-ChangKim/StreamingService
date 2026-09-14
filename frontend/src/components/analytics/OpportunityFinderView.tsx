import { useState } from 'react';
import {
  OpportunityRequest,
  OpportunityRecommendation,
  PlatformFilter,
  CategoryGroup,
  CreatorTier,
} from '../../services/analyticsApiService';
import { Sparkles, Award, ShieldAlert, CheckCircle2, Sliders } from 'lucide-react';

interface OpportunityFinderViewProps {
  onCalculate: (req: OpportunityRequest) => Promise<OpportunityRecommendation[]>;
  initialRecommendations?: OpportunityRecommendation[];
  isLoading?: boolean;
}

const DAY_LABELS = [
  { id: 1, label: '월' },
  { id: 2, label: '화' },
  { id: 3, label: '수' },
  { id: 4, label: '목' },
  { id: 5, label: '금' },
  { id: 6, label: '토' },
  { id: 0, label: '일' },
];

export function OpportunityFinderView({
  onCalculate,
  initialRecommendations,
}: OpportunityFinderViewProps) {
  // 사용자 입력 상태
  const [platform, setPlatform] = useState<PlatformFilter>('CHZZK');
  const [category, setCategory] = useState<CategoryGroup>('GAME');
  const [selectedDays, setSelectedDays] = useState<number[]>([5, 6, 0]); // 금, 토, 일 기본
  const [startHour] = useState<number>(20);
  const [endHour] = useState<number>(3); // 03:00 (다음날)
  const [duration, setDuration] = useState<number>(3);
  const [creatorTier, setCreatorTier] = useState<CreatorTier>('NEW');

  const [results, setResults] = useState<OpportunityRecommendation[]>(initialRecommendations || []);
  const [isSearching, setIsSearching] = useState(false);

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleRunSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const recs = await onCalculate({
        platform,
        category,
        availableDays: selectedDays,
        timeStartHour: startHour,
        timeEndHour: endHour < startHour ? endHour + 24 : endHour,
        expectedDurationHours: duration,
        creatorTier,
        isNewCreator: creatorTier === 'NEW',
      });
      setResults(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 조건 입력 폼 */}
      <div className="bg-[#131627]/90 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              맞춤형 방송 기회 제안기 (Opportunity Finder)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              내 방송 조건(요일·시간·콘텐츠)을 입력하면, 시장 데이터 기반으로 가장 유리한 편성 후보 Top 3를 도출합니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunSearch} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 플랫폼 선택 */}
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">목표 플랫폼</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformFilter)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">CHZZK & SOOP 종합</option>
                <option value="CHZZK">CHZZK (치지직)</option>
                <option value="SOOP">SOOP (숲)</option>
              </select>
            </div>

            {/* 희망 콘텐츠 */}
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">주요 방송 콘텐츠</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryGroup)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="GAME">종합게임 (마크/롤/발로 등)</option>
                <option value="TALK">잡담 / 소통 / 라디오</option>
                <option value="MUSIC">음악 / 노래 / 버스킹</option>
                <option value="ART">그림 / 드로잉</option>
                <option value="ASMR">ASMR / 힐링</option>
              </select>
            </div>

            {/* 방송 길이 */}
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">예상 1회 방송 시간</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={2}>2시간</option>
                <option value={3}>3시간 (권장)</option>
                <option value={4}>4시간</option>
                <option value={5}>5시간 이상</option>
              </select>
            </div>

            {/* 채널 규모 */}
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-300">현재 내 채널 상태</label>
              <select
                value={creatorTier}
                onChange={(e) => setCreatorTier(e.target.value as CreatorTier)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="NEW">데뷔 예정 / 신규 (30일 이내)</option>
                <option value="SMALL">소형 채널 (팔로워 하위 50%)</option>
                <option value="MID">중형 채널 (팔로워 50~90%)</option>
                <option value="LARGE">대형 채널 (팔로워 상위 10%)</option>
              </select>
            </div>
          </div>

          {/* 방송 가능 요일 선택 */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">
              방송 가능한 요일 (복수 선택)
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((d) => {
                const isSelected = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 분석 실행 버튼 */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSearching ? '시장 데이터 매칭 분석 중...' : '최적 방송 기회 슬롯 분석하기'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. 추천 결과 Top 3 슬롯 카드 */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <span>추천 편성 시간대 Top 3</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.map((rec) => (
            <div
              key={rec.rank}
              className="relative bg-[#141829] border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    추천 {rec.rank}순위
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">기회 점수</span>
                    <span className="text-base font-black text-emerald-400">{rec.score}점</span>
                  </div>
                </div>

                <h4 className="text-base font-black text-white mb-2">{rec.slot}</h4>

                {/* 지표 수치 요약 */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] mb-3 font-mono">
                  <div>
                    <span className="text-gray-400 block text-[10px]">수요(동시시청)</span>
                    <span className="text-white font-bold">{rec.stats.avgViewers.toLocaleString()}명</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">방송당 시청</span>
                    <span className="text-emerald-400 font-bold">{rec.stats.viewersPerLive}명/방</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">경쟁 LIVE</span>
                    <span className="text-purple-300 font-bold">{rec.stats.avgLiveCount}개</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">상위 10 집중도</span>
                    <span className="text-amber-400 font-bold">{Math.round(rec.stats.top10Concentration * 100)}%</span>
                  </div>
                </div>

                {/* 추천 근거 */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[11px] font-bold text-indigo-300 block">추천 근거</span>
                  {rec.reasons.map((r, i) => (
                    <div key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* 주의 요인 */}
                {rec.cautions && rec.cautions.length > 0 && (
                  <div className="space-y-1 mb-3 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>주의 요인</span>
                    </span>
                    {rec.cautions.map((c, i) => (
                      <p key={i} className="text-[10px] text-gray-400 leading-tight">
                        • {c}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* 기본 고려 시간 대비 개선율 */}
              {rec.comparisonWithUserTime && (
                <div className="mt-3 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[10px] text-indigo-200">
                  <span className="font-bold">비교 분석: </span>
                  {rec.comparisonWithUserTime.summary}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
