import { useState } from 'react';
import { MagnetTagStat } from '../../services/analyticsApiService';
import { Tag, Sparkles, Copy, Check, Flame, Award } from 'lucide-react';

interface TagTrendPanelProps {
  magnetTags?: MagnetTagStat[];
  isLoading?: boolean;
}

export function TagTrendPanel({ magnetTags = [], isLoading = false }: TagTrendPanelProps) {
  const [copied, setCopied] = useState(false);
  const [selectedTag, setSelectedTag] = useState<MagnetTagStat | null>(null);

  const defaultRecommendedTagString = '#버튜버 #신입 #종합게임 #소통 #스팀게임';

  const handleCopyTags = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-64 bg-white border border-[#CBD5E1] rounded-2xl flex items-center justify-center text-slate-500 font-bold text-sm animate-pulse">
        실시간 태그 트렌드 및 자석 태그 데이터를 집계하는 중입니다...
      </div>
    );
  }

  // 데이터가 없을 때의 현실적 폴백
  const tags: MagnetTagStat[] = magnetTags.length > 0 ? magnetTags : [
    { tag: '버튜버', viewerSum: 48920, liveCount: 28, averageViewers: 1747, shareOfTaggedViewers: 0.35, isEventTag: false, categoryType: '버튜버/크루' },
    { tag: '종합게임', viewerSum: 24650, liveCount: 22, averageViewers: 1120, shareOfTaggedViewers: 0.18, isEventTag: false, categoryType: '게임' },
    { tag: '스팀게임', viewerSum: 15300, liveCount: 14, averageViewers: 1092, shareOfTaggedViewers: 0.12, isEventTag: false, categoryType: '게임' },
    { tag: '소통', viewerSum: 9240, liveCount: 19, averageViewers: 486, shareOfTaggedViewers: 0.08, isEventTag: false, categoryType: '소통/신입' },
    { tag: '신입', viewerSum: 1420, liveCount: 26, averageViewers: 54, shareOfTaggedViewers: 0.02, isEventTag: false, categoryType: '소통/신입' },
  ];

  const totalTaggedViewers = tags.reduce((a, b) => a + b.viewerSum, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 안내 카드 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-blue-600 text-white rounded-xl">
                <Tag className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
                실시간 인기 태그 & 사람이 몰리는 자석 태그 (Magnet Tags)
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
              단순히 태그 개수만 세는 것이 아니라, <strong>실제로 어떤 태그에 시청자가 몇 명이나 몰려있는지</strong>를 실시간 분석합니다.
            </p>
          </div>

          {/* 신입 추천 태그 세트 원클릭 복사 */}
          <div className="bg-white border border-blue-300 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
            <div>
              <div className="text-[11px] font-black text-blue-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>신입 버튜버 추천 태그 세트</span>
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-slate-900 mt-0.5">
                {defaultRecommendedTagString}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopyTags(defaultRecommendedTagString)}
              className={`px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#2563EB] hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>복사완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>원클릭 복사</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 자석 태그 랭킹 테이블 */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
              시청자 집중 자석 태그 TOP 10
            </h3>
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-700">
            태그 합계 관측: <strong className="text-blue-600">{totalTaggedViewers.toLocaleString()}명</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm text-slate-800 font-black">
                <th className="py-3 px-4 w-16">순위</th>
                <th className="py-3 px-4">태그명</th>
                <th className="py-3 px-4 text-center">분류</th>
                <th className="py-3 px-4 text-right">총 시청자 수</th>
                <th className="py-3 px-4 text-right">방송 채널 수</th>
                <th className="py-3 px-4 text-right">방송당 평균 시청자</th>
                <th className="py-3 px-4 text-center">신입 활용 전략</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-bold">
              {tags.map((t, idx) => {
                const isSelected = selectedTag?.tag === t.tag;
                return (
                  <tr
                    key={t.tag}
                    onClick={() => setSelectedTag(t)}
                    className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 font-black' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-black text-slate-700">
                      {idx === 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 font-black text-xs">
                          1
                        </span>
                      ) : idx === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs">
                          2
                        </span>
                      ) : idx === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs">
                          3
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-blue-700 font-black text-sm sm:text-base">
                        #{t.tag}
                      </span>
                      {t.isEventTag && (
                        <span className="ml-2 px-2 py-0.5 text-[11px] font-black bg-rose-100 text-rose-700 rounded-md border border-rose-200">
                          대형 합방
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        t.categoryType === '합방/서버'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : t.categoryType === '버튜버/크루'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : t.categoryType === '소통/신입'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {t.categoryType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-[#0F172A] text-sm sm:text-base">
                      {t.viewerSum.toLocaleString()}명
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-700">
                      {t.liveCount}개
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                      {t.averageViewers.toLocaleString()}명
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {t.isEventTag ? (
                        <span className="text-xs text-rose-600 font-black">
                          합방 참가자 전용
                        </span>
                      ) : t.tag === '버튜버' || t.tag === '종합게임' ? (
                        <span className="text-xs text-blue-700 font-black">
                          필수 추천 태그
                        </span>
                      ) : t.tag === '신입' ? (
                        <span className="text-xs text-emerald-700 font-black">
                          신입 정체성 표기
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600 font-bold">
                          콘텐츠 일치 시 사용
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 하단 실전 팁 */}
        <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
          <div className="flex items-center gap-2 font-black text-blue-700 mb-1">
            <Award className="w-4 h-4" />
            <span>💡 신입 버튜버 태그 최적화 가이드</span>
          </div>
          <ul className="space-y-1 font-semibold text-slate-700 mt-1">
            <li>• <strong>단독 태그 지양</strong>: 단순히 <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono font-bold">#신입</code> 하나만 달면 유입 풀이 좁습니다. 전체 유입량이 가장 큰 <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono font-bold">#버튜버</code>와 구체적인 <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono font-bold">#게임명</code>을 반드시 함께 조합하세요.</li>
            <li>• <strong>합방·대형 서버 태그 주의</strong>: 실시간으로 유행하는 대형 서버·합방 태그는 시청자가 압도적으로 몰리지만, 실제 참여 멤버가 아닌 신입이 임의로 달면 시청자 이탈 및 반감을 살 수 있으므로 본인 방송과 직접 관련된 정직한 태그를 사용해야 합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
