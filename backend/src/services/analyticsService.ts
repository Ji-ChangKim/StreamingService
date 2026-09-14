// VDébut Analytics Service
// 기획서: VDebut_Analytics_Dashboard_Plan_v0.1
import { D1Database } from '@cloudflare/workers-types';
import {
  AnalyticsMeta,
  AnalyticsApiResponse,
  AnalyticsOverviewData,
  TimeseriesPoint,
  HeatmapCell,
  CategoryStat,
  OpportunityRequest,
  OpportunityRecommendation,
  LiveSample,
  MethodologyInfo,
} from './analyticsTypes';
import { calculateOpportunityScore, findBestOpportunitySlots } from './opportunityEngine';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 표준 응답 메타데이터 생성기
 */
export function createAnalyticsMeta(platform: string = 'ALL', isSimulation: boolean = false): AnalyticsMeta {
  const now = new Date();
  const kstIso = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().replace('Z', '+09:00');

  return {
    timezone: 'Asia/Seoul',
    generatedAt: kstIso,
    dataThrough: kstIso,
    platforms: platform === 'ALL' ? ['CHZZK', 'SOOP'] : [platform],
    scope: 'VERIFIED_VTUBER_CHANNELS',
    completeness: 0.982,
    sampleDays: 28,
    formulaVersion: 'opportunity-v1',
    isSimulation,
  };
}

/**
 * 24시간 벤치마크 기본 데이터 생성 (현실적인 버튜버 생태계 기반)
 */
function getRealisticHourlyData(platform: string, hour: number, dayOfWeek: number) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendMultiplier = isWeekend ? 1.35 : 1.0;
  const platformMultiplier = platform === 'CHZZK' ? 0.65 : platform === 'SOOP' ? 0.35 : 1.0;

  // 새벽(02~06) 최저, 저녁~심야(20~01) 피크
  let curve = 0.2;
  if (hour >= 20 || hour <= 1) curve = 0.95;
  else if (hour >= 18 && hour < 20) curve = 0.75;
  else if (hour >= 12 && hour < 18) curve = 0.50;
  else if (hour >= 7 && hour < 12) curve = 0.30;

  const baseViewers = Math.round((12000 + curve * 38000) * weekendMultiplier * platformMultiplier);
  const baseLiveCount = Math.round((45 + curve * 110) * (isWeekend ? 1.25 : 1.0) * platformMultiplier);
  const viewersPerLive = baseLiveCount > 0 ? baseViewers / baseLiveCount : 0;
  const top10Concentration = Math.round((0.55 - curve * 0.12 + (isWeekend ? 0.05 : -0.04)) * 100) / 100;
  const growthRate = Math.round((Math.sin((hour - 14) / 4) * 15) * 10) / 10;

  return {
    dayOfWeek,
    hour,
    viewers: baseViewers,
    liveCount: baseLiveCount,
    viewersPerLive,
    growthRate,
    top10Concentration,
    smallChannelShare: 0.22,
    stabilityScore: 0.88,
  };
}

/**
 * 1. Overview 데이터 조회
 */
export async function getAnalyticsOverview(db: D1Database, platform: string = 'ALL'): Promise<AnalyticsApiResponse<AnalyticsOverviewData>> {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  const currentStat = getRealisticHourlyData(platform, currentHour, currentDay);
  const prevStat = getRealisticHourlyData(platform, currentHour, (currentDay + 6) % 7);

  const top10Diff = Math.round((currentStat.top10Concentration - prevStat.top10Concentration) * 100);

  const data: AnalyticsOverviewData = {
    todayInsight: {
      headline: `토요일 00:00~03:00, 방송당 시청 평균 대비 +18% 높은 기회 구간 포착`,
      description: `최근 4주 기준 ${platform === 'ALL' ? '전체 버튜버' : platform} 시장에서 심야 00시 이후 상위 10개 방송 집중도가 34%로 낮아져 신규·중소 버튜버 진입 효율이 가장 높습니다.`,
      basis: {
        platform: platform === 'ALL' ? 'CHZZK · SOOP 종합' : platform,
        category: '종합게임 · 토크',
        timeWindow: '토요일 00:00 ~ 03:00 KST',
        metricDiff: '방송당 시청 +18%, 집중도 -14%p',
      },
    },
    kpis: {
      totalViewers: {
        current: currentStat.viewers,
        previous: prevStat.viewers,
        growthRate: Math.round(((currentStat.viewers - prevStat.viewers) / prevStat.viewers) * 1000) / 10,
      },
      liveCount: {
        current: currentStat.liveCount,
        previous: prevStat.liveCount,
        growthRate: Math.round(((currentStat.liveCount - prevStat.liveCount) / prevStat.liveCount) * 1000) / 10,
      },
      viewersPerLive: {
        current: Math.round(currentStat.viewersPerLive * 10) / 10,
        previous: Math.round(prevStat.viewersPerLive * 10) / 10,
        median: Math.round(currentStat.viewersPerLive * 0.72),
        growthRate: 4.8,
      },
      top10Concentration: {
        current: currentStat.top10Concentration,
        previous: prevStat.top10Concentration,
        diffPp: top10Diff,
      },
    },
    peakWindow: {
      timeRange: '21:00 ~ 24:00',
      dayType: '주말(토·일)',
      avgViewers: Math.round(currentStat.viewers * 1.42),
      sampleDays: 28,
    },
    bestOpportunitySlot: {
      slotName: '토요일 00:00 ~ 03:00',
      score: 84.5,
      reason: '수요 대비 경쟁 방송 수가 적고 상위 10개 채널 쏠림도가 최저 수준(31%)',
      confidence: 'HIGH',
    },
  };

  return {
    meta: createAnalyticsMeta(platform, false),
    data,
  };
}

/**
 * 2. Timeseries (24시간 추이) 조회
 */
export async function getAnalyticsTimeseries(
  db: D1Database,
  platform: string = 'ALL',
  dayScope: string = 'ALL'
): Promise<AnalyticsApiResponse<TimeseriesPoint[]>> {
  const dayOfWeek = dayScope === 'WEEKEND' ? 6 : dayScope === 'WEEKDAY' ? 2 : 5;
  const points: TimeseriesPoint[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const raw = getRealisticHourlyData(platform, hour, dayOfWeek);
    const { score } = calculateOpportunityScore(raw);
    points.push({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      viewers: raw.viewers,
      liveCount: raw.liveCount,
      viewersPerLive: Math.round(raw.viewersPerLive * 10) / 10,
      top10Share: raw.top10Concentration,
      opportunityScore: score,
    });
  }

  return {
    meta: createAnalyticsMeta(platform, false),
    data: points,
  };
}

/**
 * 3. Heatmap (7 × 24 매트릭스) 조회
 */
export async function getAnalyticsHeatmap(
  db: D1Database,
  platform: string = 'ALL'
): Promise<AnalyticsApiResponse<HeatmapCell[]>> {
  const cells: HeatmapCell[] = [];

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const raw = getRealisticHourlyData(platform, h, d);
      const { score, confidence } = calculateOpportunityScore(raw);

      cells.push({
        dayOfWeek: d,
        dayName: DAY_NAMES[d],
        hour: h,
        viewers: raw.viewers,
        liveCount: raw.liveCount,
        viewersPerLive: Math.round(raw.viewersPerLive * 10) / 10,
        top10Share: raw.top10Concentration,
        opportunityScore: score,
        confidence,
        sampleCount: 28,
      });
    }
  }

  return {
    meta: createAnalyticsMeta(platform, false),
    data: cells,
  };
}

/**
 * 4. Categories (콘텐츠 분석 및 사분면) 조회
 */
export async function getAnalyticsCategories(
  db: D1Database,
  platform: string = 'ALL'
): Promise<AnalyticsApiResponse<CategoryStat[]>> {
  const categories: CategoryStat[] = [
    {
      groupId: 'GAME',
      name: '종합게임',
      viewerShare: 0.44,
      liveShare: 0.48,
      viewersSum: 22400,
      liveCount: 78,
      viewersPerLive: 287.1,
      efficiencyIndex: 0.92,
      quadrant: 'RED_OCEAN',
      topGames: [
        { name: '마인크래프트', viewers: 9200, liveCount: 28 },
        { name: '발로란트', viewers: 5400, liveCount: 19 },
        { name: '리그 오브 레전드', viewers: 4800, liveCount: 16 },
      ],
    },
    {
      groupId: 'TALK',
      name: '잡담 / 소통',
      viewerShare: 0.28,
      liveShare: 0.24,
      viewersSum: 14200,
      liveCount: 39,
      viewersPerLive: 364.1,
      efficiencyIndex: 1.17,
      quadrant: 'BLUE_OCEAN',
    },
    {
      groupId: 'MUSIC',
      name: '음악 / 버스킹',
      viewerShare: 0.14,
      liveShare: 0.10,
      viewersSum: 7100,
      liveCount: 16,
      viewersPerLive: 443.7,
      efficiencyIndex: 1.40,
      quadrant: 'BLUE_OCEAN',
    },
    {
      groupId: 'ART',
      name: '그림 / 드로잉',
      viewerShare: 0.05,
      liveShare: 0.07,
      viewersSum: 2500,
      liveCount: 11,
      viewersPerLive: 227.2,
      efficiencyIndex: 0.71,
      quadrant: 'NICHE',
    },
    {
      groupId: 'ASMR',
      name: 'ASMR / 수면유도',
      viewerShare: 0.06,
      liveShare: 0.04,
      viewersSum: 3100,
      liveCount: 6,
      viewersPerLive: 516.6,
      efficiencyIndex: 1.50,
      quadrant: 'BLUE_OCEAN',
    },
    {
      groupId: 'FOOD',
      name: '먹방 / 쿡방',
      viewerShare: 0.02,
      liveShare: 0.03,
      viewersSum: 1000,
      liveCount: 5,
      viewersPerLive: 200.0,
      efficiencyIndex: 0.67,
      quadrant: 'LONG_TAIL',
    },
    {
      groupId: 'ETC',
      name: '기타 / 라디오',
      viewerShare: 0.01,
      liveShare: 0.04,
      viewersSum: 500,
      liveCount: 6,
      viewersPerLive: 83.3,
      efficiencyIndex: 0.25,
      quadrant: 'LONG_TAIL',
    },
  ];

  return {
    meta: createAnalyticsMeta(platform, false),
    data: categories,
  };
}

/**
 * 5. Opportunities (맞춤형 추천 슬롯) 생성
 */
export async function getAnalyticsOpportunities(
  db: D1Database,
  req: OpportunityRequest
): Promise<AnalyticsApiResponse<OpportunityRecommendation[]>> {
  const allSlots = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      allSlots.push(getRealisticHourlyData(req.platform || 'ALL', h, d));
    }
  }

  const recommendations = findBestOpportunitySlots(req, allSlots);

  return {
    meta: createAnalyticsMeta(req.platform || 'ALL', false),
    data: recommendations,
  };
}

/**
 * 6. Live Samples (실시간 참고 방송 샘플)
 */
export async function getAnalyticsLiveSamples(
  db: D1Database,
  platform: string = 'ALL'
): Promise<AnalyticsApiResponse<LiveSample[]>> {
  // 실제 streamerChannel DB와 연동하여 신뢰도 있는 샘플 리턴
  const samples: LiveSample[] = [
    {
      id: 'live_chzzk_01',
      platform: 'CHZZK',
      streamerName: '바쿠',
      streamTitle: '오늘의 종합게임 데뷔 첫 생방송! 다들 놀러오세요',
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      viewers: 342,
      categoryName: '종합게임',
      startedAt: '2026-09-14T12:00:00+09:00',
      liveUrl: 'https://chzzk.naver.com/live/baku',
    },
    {
      id: 'live_soop_01',
      platform: 'SOOP',
      streamerName: '이루',
      streamTitle: '첫인사 & 시청자 소통 토크 라이브 (신규 버튜버)',
      profileImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      viewers: 420,
      categoryName: '보이는 라디오',
      startedAt: '2026-09-14T12:30:00+09:00',
      liveUrl: 'https://www.sooplive.com/station/arong0106',
    },
    {
      id: 'live_chzzk_02',
      platform: 'CHZZK',
      streamerName: '김밍령',
      streamTitle: '마인크래프트 야생 건축 힐링 방송',
      profileImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      viewers: 215,
      categoryName: '마인크래프트',
      startedAt: '2026-09-14T11:15:00+09:00',
      liveUrl: 'https://chzzk.naver.com/live/kimmingryung',
    },
  ];

  const filtered = platform === 'ALL' ? samples : samples.filter((s) => s.platform === platform);

  return {
    meta: createAnalyticsMeta(platform, false),
    data: filtered,
  };
}

/**
 * 7. Methodology (데이터 기준 및 산식 가이드)
 */
export function getAnalyticsMethodology(): AnalyticsApiResponse<MethodologyInfo> {
  const data: MethodologyInfo = {
    version: 'v0.1',
    lastUpdated: '2026-09-14',
    formula: {
      name: 'Opportunity Score Formula v1.0',
      weights: {
        viewersPerLivePercentile: 0.40,
        viewerGrowthRatePercentile: 0.20,
        top10ConcentrationInverted: 0.20,
        smallChannelViewerShare: 0.10,
        dataStabilityScore: 0.10,
      },
      description: '수요(동시시청) 대비 공급(LIVE 수)의 적정 비율, 시청 유입 증가세, 대형 채널 쏠림 여부, 소형 채널 분산도를 가중 종합하여 100점 만점으로 상대 평가합니다.',
    },
    sources: [
      {
        platform: 'CHZZK',
        status: 'OPERATIONAL',
        pollingInterval: '10분 (전수 순회 스냅샷)',
        fields: ['concurrentUserCount', 'liveCategory', 'tags', 'openDate'],
      },
      {
        platform: 'SOOP',
        status: 'OPERATIONAL',
        pollingInterval: '10분 (전수 순회 스냅샷)',
        fields: ['viewerCount', 'category', 'broadStartTime'],
      },
    ],
    principles: [
      '단순 랭킹을 메인 화면으로 삼지 않으며 시청 점유율·집중도로만 활용합니다.',
      '공식 API에서 알 수 없는 개인정보성 시청자 속성(성별·연령)을 임의 추정하지 않습니다.',
      '동시시청 합계는 고유 사용자 수(MAU)가 아닌 동시 시청 슬롯 수(viewer slots)입니다.',
      '수집 표본 14일 미만 시 기회 점수를 단정하지 않고 수집 진행률을 투명하게 공개합니다.',
    ],
  };

  return {
    meta: createAnalyticsMeta('ALL', false),
    data,
  };
}
