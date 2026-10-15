import { RookieRadarData } from '../../services/analyticsApiService';
import { Compass, Users, AlertTriangle, CheckCircle, TrendingUp, Sparkles, HelpCircle } from 'lucide-react';

interface RookieRadarPanelProps {
  rookieRadar?: RookieRadarData;
  isLoading?: boolean;
}

export function RookieRadarPanel({ rookieRadar, isLoading = false }: RookieRadarPanelProps) {
  if (isLoading) {
    return (
      <div className="h-64 bg-white border border-[#CBD5E1] rounded-2xl flex items-center justify-center text-slate-500 font-bold text-sm animate-pulse">
        신입 스트리머 레이더 데이터를 분석하는 중입니다...
      </div>
    );
  }

  // 기본 데이터
  const radar: RookieRadarData = rookieRadar || {
    totalRookieLives: 38,
    rookieViewerSum: 220,
    averageViewers: 5.8,
    medianViewers: 4,
    distribution: [
      {
        categoryName: 'Just Chatting (잡담·소통)',
        groupKey: 'TALK',
        rookieLiveCount: 18,
        rookieShare: 0.46,
        averageViewers: 5.2,
        competitionStatus: 'RED_OCEAN',
        statusReason: '신입의 46%가 몰려 있어 목록 하단으로 밀리기 쉬운 과밀 구역입니다.',
      },
      {
        categoryName: '종합게임 / 스팀',
        groupKey: 'GAME',
        rookieLiveCount: 10,
        rookieShare: 0.26,
        averageViewers: 6.4,
        competitionStatus: 'NORMAL',
        statusReason: '스팀 게이머들의 유입이 고르게 일어나는 표준적인 진입 구역입니다.',
      },
      {
        categoryName: '신작 인디게임 / 공포게임',
        groupKey: 'GAME',
        rookieLiveCount: 3,
        rookieShare: 0.08,
        averageViewers: 11.2,
        competitionStatus: 'BLUE_OCEAN',
        statusReason: '신입 방송 수가 적고 시청자 유입 수요가 높아 첫 노출에 가장 유리합니다.',
      },
      {
        categoryName: '마인크래프트',
        groupKey: 'GAME',
        rookieLiveCount: 4,
        rookieShare: 0.11,
        averageViewers: 6.8,
        competitionStatus: 'NORMAL',
        statusReason: '장시간 시청자가 꾸준히 머무는 스테디셀러 구역입니다.',
      },
      {
        categoryName: '리그 오브 레전드',
        groupKey: 'GAME',
        rookieLiveCount: 3,
        rookieShare: 0.09,
        averageViewers: 2.3,
        competitionStatus: 'RED_OCEAN',
        statusReason: '대형 방송 중심으로 시청자가 쏠려 신입 채널 클릭률이 저조합니다.',
      },
    ],
    rookieRecommendations: {
      recommendedCategories: ['신작 인디게임 / 공포게임', '스팀 틈새 종합게임'],
      cautions: ['잡담·소통은 신입 46%가 몰려 있어 첫 페이지 노출이 매우 어렵습니다.'],
      recommendedTags: ['#버튜버', '#신입', '#종합게임', '#소통', '#스팀게임'],
    },
  };

  return (
    <div className="space-y-6">
      {/* 헤더 안내 배너 */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-600 text-white rounded-xl">
                <Compass className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
                신입 스트리머 레이더 (Rookie Radar)
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
              '#신입', '#뉴비', '#데뷔' 태그를 단 동료 스트리머들이 <strong>지금 주로 어디에 모여있고, 어디가 빈틈(기회)인지</strong> 실시간 분석합니다.
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            실시간 신입 방송 관측 중
          </span>
        </div>

        {/* 3대 신입 현실 지표 카드 (대기업 왜곡 제거) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
            <div className="text-xs font-black text-slate-700 mb-1 flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span>실시간 활동 중인 신입 방송</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#0F172A]">
              {radar.totalRookieLives}개 채널
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              '신입/뉴비/데뷔' 표기 방송 합계
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
            <div className="text-xs font-black text-slate-700 mb-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>신입 방송 현실 평균 시청자</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
              {radar.averageViewers}명
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              중앙값: <strong>{radar.medianViewers}명</strong> (대기업 왜곡 없는 현실 기준선)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-xs font-black text-emerald-800 mb-1 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>신입 첫 달 현실 목표</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-900">
              5 ~ 10명
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-1">
              평균 시청자 6명 확보 시 상위 25% 진입
            </div>
          </div>
        </div>

        {/* 신입 스트리머 카테고리 분포 지도 */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0F172A] mb-3 flex items-center gap-2">
            <span>📊 신입들은 지금 어디에 모여있는가? (카테고리별 분포)</span>
          </h3>

          <div className="space-y-3">
            {radar.distribution.map((item) => {
              const isRed = item.competitionStatus === 'RED_OCEAN';
              const isBlue = item.competitionStatus === 'BLUE_OCEAN';

              return (
                <div
                  key={item.categoryName}
                  className={`p-4 rounded-xl border transition-all ${
                    isBlue
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : isRed
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-[#F8FAFC] border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm sm:text-base text-[#0F172A]">
                        {item.categoryName}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-black ${
                          isBlue
                            ? 'bg-emerald-600 text-white'
                            : isRed
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isBlue ? '🟢 기회 (블루오션)' : isRed ? '🔴 과밀 (레드오션)' : '표준 구역'}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-3">
                      <span>신입 채널: <strong className="text-[#0F172A] font-mono">{item.rookieLiveCount}개</strong> ({Math.round(item.rookieShare * 100)}%)</span>
                      <span>평균: <strong className="text-emerald-700 font-mono">{item.averageViewers}명</strong></span>
                    </div>
                  </div>

                  {/* 점유율 프로그레스 바 */}
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isBlue
                          ? 'bg-emerald-500'
                          : isRed
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(item.rookieShare * 100, 4)}%` }}
                    />
                  </div>

                  <div className="text-xs font-semibold text-slate-700">
                    💡 {item.statusReason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 신입 버튜버 실전 가이드 요약 */}
        <div className="mt-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
          <div className="font-black text-xs sm:text-sm text-blue-700 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>신입 버튜버 실전 진입 전략</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-slate-800">
            <div className="p-3 bg-white rounded-lg border border-rose-200">
              <span className="font-black text-rose-700 flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> 피해야 할 전략
              </span>
              <span>신입의 46%가 Just Chatting(잡담)에 몰려 있어 첫 방송부터 소통만 진행할 경우 0명 방에 오래 갇히게 됩니다.</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-emerald-200">
              <span className="font-black text-emerald-700 flex items-center gap-1 mb-1">
                <CheckCircle className="w-3.5 h-3.5" /> 추천 전략
              </span>
              <span>신작 스팀 인디게임이나 스토리 공포게임 등 '게임을 보러 검색해 들어오는 틈새 시청자'를 먼저 모은 뒤 소통으로 전환하세요.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
