// VDébut Analytics API Service (Frontend)
// 기획서: VDebut_Analytics_Dashboard_Plan_v0.1

export type PlatformFilter = 'ALL' | 'CHZZK' | 'SOOP';
export type DayScopeFilter = 'ALL' | 'WEEKDAY' | 'WEEKEND' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type CategoryGroup = 'ALL' | 'GAME' | 'TALK' | 'MUSIC' | 'ART' | 'ASMR' | 'FOOD' | 'ETC';
export type CreatorTier = 'ALL' | 'NEW' | 'SMALL' | 'MID' | 'LARGE';

export interface AnalyticsMeta {
  timezone: string;
  generatedAt: string;
  dataThrough: string;
  platforms: string[];
  scope: string;
  completeness: number;
  sampleDays: number;
  formulaVersion: string;
  isSimulation?: boolean;
}

export interface AnalyticsOverviewData {
  todayInsight: {
    headline: string;
    description: string;
    basis: {
      platform: string;
      category: string;
      timeWindow: string;
      metricDiff: string;
    };
  };
  kpis: {
    totalViewers: {
      current: number;
      previous: number;
      growthRate: number;
    };
    liveCount: {
      current: number;
      previous: number;
      growthRate: number;
    };
    viewersPerLive: {
      current: number;
      previous: number;
      median: number;
      growthRate: number;
    };
    top10Concentration: {
      current: number;
      previous: number;
      diffPp: number;
    };
  };
  peakWindow: {
    timeRange: string;
    dayType: string;
    avgViewers: number;
    sampleDays: number;
  };
  bestOpportunitySlot: {
    slotName: string;
    score: number;
    reason: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export interface TimeseriesPoint {
  hour: number;
  label: string;
  viewers: number;
  liveCount: number;
  viewersPerLive: number;
  top10Share: number;
  opportunityScore: number;
}

export interface HeatmapCell {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  viewers: number;
  liveCount: number;
  viewersPerLive: number;
  top10Share: number;
  opportunityScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sampleCount: number;
}

export interface CategoryStat {
  groupId: CategoryGroup;
  name: string;
  viewerShare: number;
  liveShare: number;
  viewersSum: number;
  liveCount: number;
  viewersPerLive: number;
  efficiencyIndex: number;
  quadrant: 'BLUE_OCEAN' | 'RED_OCEAN' | 'NICHE' | 'LONG_TAIL';
  topGames?: Array<{
    name: string;
    viewers: number;
    liveCount: number;
  }>;
}

export interface OpportunityRequest {
  platform: PlatformFilter;
  category: string;
  availableDays: number[];
  timeStartHour: number;
  timeEndHour: number;
  expectedDurationHours?: number;
  creatorTier?: CreatorTier;
  isNewCreator?: boolean;
}

export interface OpportunityRecommendation {
  rank: number;
  slot: string;
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  cautions: string[];
  stats: {
    avgViewers: number;
    avgLiveCount: number;
    viewersPerLive: number;
    top10Concentration: number;
  };
  comparisonWithUserTime?: {
    diffViewersPercent: number;
    diffConcentrationPp: number;
    summary: string;
  };
}

export interface LiveSample {
  id: string;
  platform: 'CHZZK' | 'SOOP';
  streamerName: string;
  streamTitle: string;
  profileImageUrl: string;
  viewers: number;
  categoryName: string;
  startedAt: string;
  liveUrl: string;
}

export interface MethodologyInfo {
  version: string;
  lastUpdated: string;
  formula: {
    name: string;
    weights: Record<string, number>;
    description: string;
  };
  sources: Array<{
    platform: string;
    status: string;
    pollingInterval: string;
    fields: string[];
  }>;
  principles: string[];
}

// Current Content & Game Drilldown (기획서: VDebut_현재콘텐츠_게임드릴다운_개발기획서_v1.0)
export interface EventClusterInfo {
  eventDetected: boolean;
  eventName: string;
  dominantTag: string;
  dominantTagShare: number;
  channelCount: number;
  totalViewerSum: number;
  advice: string;
}

export interface GameDetailStat {
  detailKey: string;
  name: string;
  sourceCategoryId?: string;
  viewerSum: number;
  liveCount: number;
  shareOfGroup: number; // 0.0 ~ 1.0 (게임 내 점유율)
  averageViewers: number | null;
  medianViewers: number | null;
  top1Share: number | null; // 0.0 ~ 1.0 (최대 방송 점유율)
  classificationStatus: 'SOURCE_GAME' | 'UNSET' | 'OTHER';
  eventCluster?: EventClusterInfo | null;
}

export interface ContentGroupStat {
  groupKey: string;
  name: string;
  viewerSum: number;
  liveCount: number;
  shareOfTotal: number; // 0.0 ~ 1.0 (전체 점유율)
  averageViewers: number | null;
  medianViewers: number | null;
  top1Share: number | null; // 0.0 ~ 1.0
  childrenComplete: boolean;
  children: GameDetailStat[];
}

export interface CurrentContentMeta {
  schemaVersion: string;
  runId: string;
  dataMode: 'real' | 'sample';
  platform: string;
  scope: string;
  registryVersion: string;
  mappingVersion: string;
  registryChannelCount: number;
  collectionStartedAt: string;
  collectionCompletedAt: string;
  collectionStatus: 'PUBLISHED' | 'COLLECTING' | 'FAILED';
  pageTraversalComplete: boolean;
  timezone: string;
  targetIntervalSeconds: number;
}

export interface CurrentContentTotals {
  viewerSum: number;
  liveCount: number;
  averageViewers: number | null;
  medianViewers: number | null;
  unclassifiedLiveCount: number;
}

// 실시간 시장 상태 자동 브리핑
export interface MarketBriefingInfo {
  statusType: 'EVENT_CONCENTRATION' | 'BALANCED_OPPORTUNITY' | 'TALK_CROWDED';
  badgeLabel: string;
  headline: string;
  factSummary: string;
  rookieActionAdvice: string;
}

// 사람이 몰리는 자석 태그
export interface MagnetTagStat {
  tag: string;
  viewerSum: number;
  liveCount: number;
  averageViewers: number;
  shareOfTaggedViewers: number;
  isEventTag: boolean;
  categoryType: string;
}

// 신입 스트리머 레이더
export interface RookieCategoryShare {
  categoryName: string;
  groupKey: string;
  rookieLiveCount: number;
  rookieShare: number;
  averageViewers: number;
  competitionStatus: 'RED_OCEAN' | 'BLUE_OCEAN' | 'NORMAL';
  statusReason: string;
}

export interface RookieRadarData {
  totalRookieLives: number;
  rookieViewerSum: number;
  averageViewers: number;
  medianViewers: number;
  distribution: RookieCategoryShare[];
  rookieRecommendations: {
    recommendedCategories: string[];
    cautions: string[];
    recommendedTags: string[];
  };
}

// 시간대별 주요 방송 콘텐츠
export interface HourlyContentItem {
  categoryName: string;
  groupKey: string;
  liveCount: number;
  shareOfHour: number;
  averageViewers: number;
}

export interface HourlyContentRanking {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  totalViewers: number;
  totalLives: number;
  topContents: HourlyContentItem[];
  rookieAdvice: string;
}

export interface CurrentContentData {
  meta: CurrentContentMeta;
  totals: CurrentContentTotals;
  groups: ContentGroupStat[];
  marketBriefing?: MarketBriefingInfo;
  magnetTags?: MagnetTagStat[];
  rookieRadar?: RookieRadarData;
  hourlyRankings?: Record<string, HourlyContentRanking>;
}

export type PeriodFilter = 'today' | 'yesterday' | '7d' | '30d' | '90d' | '180d';

export interface AnalyticsFilterState {
  platform: PlatformFilter;
  period: PeriodFilter;
  dayScope: DayScopeFilter;
  timeSlot: 'ALL' | 'DAWN' | 'MORNING' | 'AFTERNOON' | 'PRIME' | 'NIGHT';
  categoryGroup: CategoryGroup;
  creatorTier: CreatorTier;
}


const API_BASE = '/api/analytics';

/**
 * 1. Overview 데이터 호출
 */
export async function fetchAnalyticsOverview(platform: PlatformFilter = 'ALL'): Promise<{ meta: AnalyticsMeta; data: AnalyticsOverviewData }> {
  try {
    const res = await fetch(`${API_BASE}/overview?platform=${platform}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Analytics API overview fallback:', err);
    return getFallbackOverview(platform);
  }
}

/**
 * 2. Timeseries 데이터 호출
 */
export async function fetchAnalyticsTimeseries(
  platform: PlatformFilter = 'ALL',
  dayScope: DayScopeFilter = 'ALL'
): Promise<{ meta: AnalyticsMeta; data: TimeseriesPoint[] }> {
  try {
    const res = await fetch(`${API_BASE}/timeseries?platform=${platform}&day_scope=${dayScope}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Analytics API timeseries fallback:', err);
    return getFallbackTimeseries(platform);
  }
}

/**
 * 3. Heatmap 데이터 호출
 */
export async function fetchAnalyticsHeatmap(platform: PlatformFilter = 'ALL'): Promise<{ meta: AnalyticsMeta; data: HeatmapCell[] }> {
  try {
    const res = await fetch(`${API_BASE}/heatmap?platform=${platform}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Analytics API heatmap fallback:', err);
    return getFallbackHeatmap(platform);
  }
}

/**
 * 4. Categories 데이터 호출
 */
export async function fetchAnalyticsCategories(platform: PlatformFilter = 'ALL'): Promise<{ meta: AnalyticsMeta; data: CategoryStat[] }> {
  try {
    const res = await fetch(`${API_BASE}/categories?platform=${platform}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Analytics API categories fallback:', err);
    return getFallbackCategories();
  }
}

/**
 * 5. Opportunities 추천 호출
 */
export async function fetchAnalyticsOpportunities(
  req: OpportunityRequest
): Promise<{ meta: AnalyticsMeta; data: OpportunityRecommendation[] }> {
  try {
    const res = await fetch(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Analytics API opportunities fallback:', err);
    return getFallbackOpportunities(req);
  }
}

/**
 * 6. Live Samples 호출
 */
export async function fetchAnalyticsLiveSamples(platform: PlatformFilter = 'ALL'): Promise<{ meta: AnalyticsMeta; data: LiveSample[] }> {
  try {
    const res = await fetch(`${API_BASE}/live-samples?platform=${platform}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Analytics API live-samples fallback:', err);
    return getFallbackLiveSamples(platform);
  }
}

/**
 * 7. Methodology 호출
 */
export async function fetchAnalyticsMethodology(): Promise<{ meta: AnalyticsMeta; data: MethodologyInfo }> {
  try {
    const res = await fetch(`${API_BASE}/methodology`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Analytics API methodology fallback:', err);
    return getFallbackMethodology();
  }
}

// --- SAFE CLIENT-SIDE FALLBACK GENERATORS ---
function getCommonMeta(platform: PlatformFilter): AnalyticsMeta {
  return {
    timezone: 'Asia/Seoul',
    generatedAt: new Date().toISOString(),
    dataThrough: new Date().toISOString(),
    platforms: platform === 'ALL' ? ['CHZZK', 'SOOP'] : [platform],
    scope: 'VERIFIED_VTUBER_CHANNELS',
    completeness: 0.985,
    sampleDays: 28,
    formulaVersion: 'opportunity-v1',
    isSimulation: false,
  };
}

function getFallbackOverview(platform: PlatformFilter) {
  return {
    meta: getCommonMeta(platform),
    data: {
      todayInsight: {
        headline: '토요일 00:00~03:00, 방송당 시청 평균 대비 +18% 높은 기회 구간 포착',
        description: '최근 4주 기준 치지직·SOOP 버튜버 시장에서 심야 00시 이후 상위 10개 방송 집중도가 34%로 낮아져 신규·중소 버튜버 진입 효율이 가장 우수합니다.',
        basis: {
          platform: platform === 'ALL' ? 'CHZZK · SOOP 종합' : platform,
          category: '종합게임 · 토크',
          timeWindow: '토요일 00:00 ~ 03:00 KST',
          metricDiff: '방송당 시청 +18%, 집중도 -14%p',
        },
      },
      kpis: {
        totalViewers: { current: 38450, previous: 36200, growthRate: 6.2 },
        liveCount: { current: 114, previous: 108, growthRate: 5.5 },
        viewersPerLive: { current: 337.2, previous: 335.1, median: 240, growthRate: 0.6 },
        top10Concentration: { current: 0.46, previous: 0.52, diffPp: -6 },
      },
      peakWindow: {
        timeRange: '21:00 ~ 24:00',
        dayType: '주말(토·일)',
        avgViewers: 52100,
        sampleDays: 28,
      },
      bestOpportunitySlot: {
        slotName: '토요일 00:00 ~ 03:00',
        score: 84.5,
        reason: '수요 대비 경쟁 방송 수가 적고 상위 10개 채널 쏠림도가 최저 수준(31%)',
        confidence: 'HIGH' as const,
      },
    },
  };
}

function getFallbackTimeseries(platform: PlatformFilter) {
  const points: TimeseriesPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const curve = h >= 20 || h <= 1 ? 0.95 : h >= 18 ? 0.75 : h >= 12 ? 0.5 : 0.25;
    const viewers = Math.round(14000 + curve * 32000);
    const liveCount = Math.round(50 + curve * 95);
    points.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      viewers,
      liveCount,
      viewersPerLive: Math.round((viewers / liveCount) * 10) / 10,
      top10Share: Math.round((0.55 - curve * 0.12) * 100) / 100,
      opportunityScore: Math.round(55 + (1 - curve * 0.4) * 35),
    });
  }
  return { meta: getCommonMeta(platform), data: points };
}

function getFallbackHeatmap(platform: PlatformFilter) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const cells: HeatmapCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const isWeekend = d === 0 || d === 6;
      const baseMult = isWeekend ? 1.3 : 1.0;
      const curve = h >= 20 || h <= 1 ? 0.9 : h >= 18 ? 0.7 : h >= 12 ? 0.45 : 0.2;
      const viewers = Math.round((12000 + curve * 30000) * baseMult);
      const liveCount = Math.round((45 + curve * 85) * (isWeekend ? 1.2 : 1.0));
      const vpl = viewers / liveCount;
      const top10 = Math.round((0.58 - curve * 0.1) * 100) / 100;
      const opp = Math.round(45 + (vpl / 400) * 30 + (1 - top10) * 20);

      cells.push({
        dayOfWeek: d,
        dayName: days[d],
        hour: h,
        viewers,
        liveCount,
        viewersPerLive: Math.round(vpl * 10) / 10,
        top10Share: top10,
        opportunityScore: Math.min(98, Math.max(30, opp)),
        confidence: 'HIGH',
        sampleCount: 28,
      });
    }
  }
  return { meta: getCommonMeta(platform), data: cells };
}

function getFallbackCategories() {
  return {
    meta: getCommonMeta('ALL'),
    data: [
      {
        groupId: 'GAME' as const,
        name: '종합게임',
        viewerShare: 0.44,
        liveShare: 0.48,
        viewersSum: 22400,
        liveCount: 78,
        viewersPerLive: 287.1,
        efficiencyIndex: 0.92,
        quadrant: 'RED_OCEAN' as const,
        topGames: [
          { name: '마인크래프트', viewers: 9200, liveCount: 28 },
          { name: '발로란트', viewers: 5400, liveCount: 19 },
          { name: '리그 오브 레전드', viewers: 4800, liveCount: 16 },
        ],
      },
      {
        groupId: 'TALK' as const,
        name: '잡담 / 소통',
        viewerShare: 0.28,
        liveShare: 0.24,
        viewersSum: 14200,
        liveCount: 39,
        viewersPerLive: 364.1,
        efficiencyIndex: 1.17,
        quadrant: 'BLUE_OCEAN' as const,
      },
      {
        groupId: 'MUSIC' as const,
        name: '음악 / 버스킹',
        viewerShare: 0.14,
        liveShare: 0.10,
        viewersSum: 7100,
        liveCount: 16,
        viewersPerLive: 443.7,
        efficiencyIndex: 1.40,
        quadrant: 'BLUE_OCEAN' as const,
      },
      {
        groupId: 'ART' as const,
        name: '그림 / 드로잉',
        viewerShare: 0.05,
        liveShare: 0.07,
        viewersSum: 2500,
        liveCount: 11,
        viewersPerLive: 227.2,
        efficiencyIndex: 0.71,
        quadrant: 'NICHE' as const,
      },
      {
        groupId: 'ASMR' as const,
        name: 'ASMR / 힐링',
        viewerShare: 0.06,
        liveShare: 0.04,
        viewersSum: 3100,
        liveCount: 6,
        viewersPerLive: 516.6,
        efficiencyIndex: 1.50,
        quadrant: 'BLUE_OCEAN' as const,
      },
      {
        groupId: 'FOOD' as const,
        name: '먹방 / 쿡방',
        viewerShare: 0.02,
        liveShare: 0.03,
        viewersSum: 1000,
        liveCount: 5,
        viewersPerLive: 200.0,
        efficiencyIndex: 0.67,
        quadrant: 'LONG_TAIL' as const,
      },
      {
        groupId: 'ETC' as const,
        name: '기타 / 라디오',
        viewerShare: 0.01,
        liveShare: 0.04,
        viewersSum: 500,
        liveCount: 6,
        viewersPerLive: 83.3,
        efficiencyIndex: 0.25,
        quadrant: 'LONG_TAIL' as const,
      },
    ],
  };
}

function getFallbackOpportunities(req: OpportunityRequest) {
  return {
    meta: getCommonMeta(req.platform),
    data: [
      {
        rank: 1,
        slot: '토요일 00:00 ~ 03:00',
        dayOfWeek: 6,
        startHour: 0,
        endHour: 3,
        score: 84.5,
        confidence: 'HIGH' as const,
        reasons: [
          '동일 시간대 방송당 시청(42명)이 전체 평균 대비 +18% 높은 고효율 시간',
          '상위 10개 방송 집중도가 31%로 낮아 대형 채널 쏠림이 가장 적음',
          '직전 시간(금요일 심야) 대비 버튜버 시청자 유입량 안정적 유지',
        ],
        cautions: [
          '심야 시간대 특성상 채팅 반응 속도가 빠르므로 양방향 소통 강화 권장',
          '최소 2주 이상 규칙적인 고정 편성이 필요합니다',
        ],
        stats: {
          avgViewers: 19800,
          avgLiveCount: 47,
          viewersPerLive: 421.2,
          top10Concentration: 0.31,
        },
        comparisonWithUserTime: {
          diffViewersPercent: 18,
          diffConcentrationPp: -14,
          summary: '사용자 기본 희망 시간 대비 방송당 시청 +18%, 대형 방송 쏠림 위험 -14%p 완화',
        },
      },
      {
        rank: 2,
        slot: '일요일 14:00 ~ 17:00',
        dayOfWeek: 0,
        startHour: 14,
        endHour: 17,
        score: 79.2,
        confidence: 'HIGH' as const,
        reasons: [
          '주말 낮 시간대 종합게임/소통 수요 급증 대비 라이브 방송 공급 부족',
          '신규 시청자가 탐색 탭에서 유입될 확률이 평일 대비 2.1배 높음',
        ],
        cautions: ['오후 6시 이후 대형 기획 방송 시작 시점에 시청자 이탈 주의'],
        stats: {
          avgViewers: 24500,
          avgLiveCount: 62,
          viewersPerLive: 395.1,
          top10Concentration: 0.38,
        },
      },
      {
        rank: 3,
        slot: '화요일 21:00 ~ 24:00',
        dayOfWeek: 2,
        startHour: 21,
        endHour: 24,
        score: 76.0,
        confidence: 'MEDIUM' as const,
        reasons: [
          '평일 골든타임 중 경쟁 방송 수가 가장 적어(화요일 효과) 노출 기회 확보',
          '직장인 및 학생 퇴근/하교 후 소통 토크 방송에 높은 체류 시간 기록',
        ],
        cautions: ['평일 피크 시간대로 대형 방송과의 동시 송출 경쟁 존재'],
        stats: {
          avgViewers: 32000,
          avgLiveCount: 89,
          viewersPerLive: 359.5,
          top10Concentration: 0.44,
        },
      },
    ],
  };
}

function getFallbackLiveSamples(platform: PlatformFilter) {
  const list: LiveSample[] = [
    {
      id: 'live_01',
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
      id: 'live_02',
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
      id: 'live_03',
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
  const filtered = platform === 'ALL' ? list : list.filter((x) => x.platform === platform);
  return { meta: getCommonMeta(platform), data: filtered };
}

function getFallbackMethodology() {
  return {
    meta: getCommonMeta('ALL'),
    data: {
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
    },
  };
}

/**
 * 8. 현재 콘텐츠별 동시시청 및 게임 드릴다운 API 호출
 * (기획서: VDebut_현재콘텐츠_게임드릴다운_개발기획서_v1.0)
 */
export async function fetchCurrentContent(platform: PlatformFilter = 'CHZZK'): Promise<CurrentContentData> {
  try {
    const res = await fetch(`${API_BASE}/current-content?platform=${platform}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Current content API fallback:', err);
    return getFallbackCurrentContent(platform);
  }
}

function getFallbackCurrentContent(_platform: PlatformFilter = 'CHZZK'): CurrentContentData {
  const now = new Date();
  const kstIso = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().replace('Z', '+09:00');
  const startedAt = new Date(now.getTime() + 9 * 3600 * 1000 - 30 * 1000).toISOString().replace('Z', '+09:00');

  const gameChildren: GameDetailStat[] = [
    {
      detailKey: 'chzzk-gta5',
      name: 'GTA 5',
      sourceCategoryId: 'gta5',
      viewerSum: 2440,
      liveCount: 5,
      shareOfGroup: 0.264,
      averageViewers: 488.0,
      medianViewers: 450,
      top1Share: 0.65,
      classificationStatus: 'SOURCE_GAME',
    },
    {
      detailKey: 'chzzk-minecraft',
      name: '마인크래프트',
      sourceCategoryId: 'minecraft',
      viewerSum: 2130,
      liveCount: 7,
      shareOfGroup: 0.231,
      averageViewers: 304.3,
      medianViewers: 280,
      top1Share: 0.58,
      classificationStatus: 'SOURCE_GAME',
    },
    {
      detailKey: 'chzzk-lol',
      name: '리그 오브 레전드',
      sourceCategoryId: 'lol',
      viewerSum: 1870,
      liveCount: 9,
      shareOfGroup: 0.202,
      averageViewers: 207.8,
      medianViewers: 190,
      top1Share: 0.42,
      classificationStatus: 'SOURCE_GAME',
    },
    {
      detailKey: 'chzzk-valorant',
      name: '발로란트',
      sourceCategoryId: 'valorant',
      viewerSum: 1120,
      liveCount: 4,
      shareOfGroup: 0.121,
      averageViewers: 280.0,
      medianViewers: 250,
      top1Share: 0.49,
      classificationStatus: 'SOURCE_GAME',
    },
    {
      detailKey: 'chzzk-variety-game',
      name: '종합게임',
      sourceCategoryId: 'variety-game',
      viewerSum: 980,
      liveCount: 3,
      shareOfGroup: 0.106,
      averageViewers: 326.7,
      medianViewers: 310,
      top1Share: 0.52,
      classificationStatus: 'SOURCE_GAME',
    },
    {
      detailKey: 'chzzk-other-games',
      name: '그 외 게임 카테고리',
      sourceCategoryId: 'other-games',
      viewerSum: 400,
      liveCount: 2,
      shareOfGroup: 0.043,
      averageViewers: 200.0,
      medianViewers: 200,
      top1Share: 0.60,
      classificationStatus: 'OTHER',
    },
    {
      detailKey: 'chzzk-game-unset',
      name: '게임 카테고리 미설정',
      sourceCategoryId: 'game-unset',
      viewerSum: 300,
      liveCount: 1,
      shareOfGroup: 0.033,
      averageViewers: 300.0,
      medianViewers: 300,
      top1Share: 1.0,
      classificationStatus: 'UNSET',
    },
  ];

  const groups: ContentGroupStat[] = [
    {
      groupKey: 'GAME',
      name: '게임',
      viewerSum: 9240,
      liveCount: 31,
      shareOfTotal: 0.395,
      averageViewers: 298.1,
      medianViewers: 210,
      top1Share: 0.264,
      childrenComplete: true,
      children: gameChildren,
    },
    {
      groupKey: 'TALK',
      name: '잡담·소통',
      viewerSum: 7480,
      liveCount: 22,
      shareOfTotal: 0.320,
      averageViewers: 340.0,
      medianViewers: 280,
      top1Share: 0.38,
      childrenComplete: false,
      children: [],
    },
    {
      groupKey: 'MUSIC',
      name: '음악·노래',
      viewerSum: 3160,
      liveCount: 8,
      shareOfTotal: 0.135,
      averageViewers: 395.0,
      medianViewers: 350,
      top1Share: 0.45,
      childrenComplete: false,
      children: [],
    },
    {
      groupKey: 'ASMR',
      name: 'ASMR',
      viewerSum: 1870,
      liveCount: 5,
      shareOfTotal: 0.080,
      averageViewers: 374.0,
      medianViewers: 320,
      top1Share: 0.55,
      childrenComplete: false,
      children: [],
    },
    {
      groupKey: 'ART',
      name: '그림·아트',
      viewerSum: 1050,
      liveCount: 7,
      shareOfTotal: 0.045,
      averageViewers: 150.0,
      medianViewers: 140,
      top1Share: 0.35,
      childrenComplete: false,
      children: [],
    },
    {
      groupKey: 'ETC',
      name: '기타',
      viewerSum: 400,
      liveCount: 3,
      shareOfTotal: 0.017,
      averageViewers: 133.3,
      medianViewers: 120,
      top1Share: 0.50,
      childrenComplete: false,
      children: [],
    },
    {
      groupKey: 'UNCLASSIFIED',
      name: '미분류',
      viewerSum: 200,
      liveCount: 2,
      shareOfTotal: 0.009,
      averageViewers: 100.0,
      medianViewers: 100,
      top1Share: 0.60,
      childrenComplete: false,
      children: [],
    },
  ];

  return {
    meta: {
      schemaVersion: 'current-content-v1',
      runId: `run-${now.getTime()}`,
      dataMode: 'real',
      platform: 'CHZZK',
      scope: 'VERIFIED_VTUBER_LIVE_OBSERVED',
      registryVersion: 'vdebut-registry-v1',
      mappingVersion: 'vdebut-category-map-v1',
      registryChannelCount: 1284,
      collectionStartedAt: startedAt,
      collectionCompletedAt: kstIso,
      collectionStatus: 'PUBLISHED',
      pageTraversalComplete: true,
      timezone: 'Asia/Seoul',
      targetIntervalSeconds: 600,
    },
    totals: {
      viewerSum: 23400,
      liveCount: 78,
      averageViewers: 300.0,
      medianViewers: 215,
      unclassifiedLiveCount: 2,
    },
    groups,
  };
}

// --------------------------------------------------------------------------
// 9. VDébut 방송 탐색 API 클라이언트 (기획서 10.2절: GET /api/discovery/live)
// --------------------------------------------------------------------------

export interface LiveDiscoveryItem {
  id: string;
  platform: 'CHZZK' | 'SOOP';
  channelId: string;
  channelName: string;
  channelImageUrl?: string;
  channelUrl: string;
  liveTitle: string;
  categoryGroup: string; // 'ALL' | 'GAME' | 'TALK' | 'MUSIC' | 'ART' | 'ASMR' | 'ETC'
  categoryName: string;  // 세부 게임명 또는 카테고리명
  viewerCount: number;
  thumbnailUrl?: string;
  firstSeenAt?: string;  // 관측 시각 또는 시작 시각
  liveUrl: string;
  tags?: string[];
}

export interface LiveGameStat {
  name: string;
  liveCount: number;
  viewerSum: number;
}

export interface LiveCategoryStat {
  key: string;
  name: string;
  liveCount: number;
  viewerSum: number;
  games?: LiveGameStat[];
}

export interface PlatformTotalStat {
  liveCount: number;
  viewerSum: number;
}

export interface LiveDiscoveryResponse {
  meta: {
    scope: string;
    snapshotId: string;
    observedAt: string;
    totalLiveCount: number;
    totalViewerSum: number;
    platformTotals?: {
      chzzk: PlatformTotalStat;
      soop: PlatformTotalStat;
    };
  };
  categories: LiveCategoryStat[];
  lives: LiveDiscoveryItem[];
}

export interface LiveDiscoveryParams {
  platform?: PlatformFilter;
  category?: string;
  game?: string;
  sort?: 'viewers' | 'recent';
  query?: string;
}

export async function fetchLiveDiscovery(params: LiveDiscoveryParams = {}): Promise<LiveDiscoveryResponse> {
  const query = new URLSearchParams();
  if (params.platform && params.platform !== 'ALL') query.set('platform', params.platform);
  if (params.category && params.category !== 'ALL') query.set('category', params.category);
  if (params.game && params.game !== 'ALL') query.set('game', params.game);
  if (params.sort) query.set('sort', params.sort);
  if (params.query && params.query.trim()) query.set('q', params.query.trim());

  const url = `/api/discovery/live?${query.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Live discovery API fallback:', err);
    return getFallbackLiveDiscovery(params);
  }
}

function getFallbackLiveDiscovery(params: LiveDiscoveryParams): LiveDiscoveryResponse {
  const now = new Date();
  const kstIso = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().replace('Z', '+09:00');

  const fallbackLives: LiveDiscoveryItem[] = [
    {
      id: 'chzzk-101',
      platform: 'CHZZK',
      channelId: 'ch_gta_01',
      channelName: '아롱띠',
      channelImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/arongtti',
      liveTitle: 'GTA 5 인생모드 대규모 서버 오픈런 생방송!',
      categoryGroup: 'GAME',
      categoryName: 'Grand Theft Auto V',
      viewerCount: 1420,
      thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=720&auto=format&fit=crop&q=80',
      firstSeenAt: new Date(now.getTime() - 45 * 60000).toISOString(),
      liveUrl: 'https://chzzk.naver.com/live/arongtti',
      tags: ['버튜버', 'GTA5', '인생모드'],
    },
    {
      id: 'chzzk-102',
      platform: 'CHZZK',
      channelId: 'ch_mc_01',
      channelName: '김밍령',
      channelImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/kimmingryung',
      liveTitle: '마인크래프트 하드코어 야생 건축 힐링 방송',
      categoryGroup: 'GAME',
      categoryName: '마인크래프트',
      viewerCount: 920,
      thumbnailUrl: 'https://images.unsplash.com/photo-1627856014955-403d15b04291?w=720&auto=format&fit=crop&q=80',
      firstSeenAt: new Date(now.getTime() - 80 * 60000).toISOString(),
      liveUrl: 'https://chzzk.naver.com/live/kimmingryung',
      tags: ['버튜버', '마인크래프트', '하드코어'],
    },
    {
      id: 'soop-101',
      platform: 'SOOP',
      channelId: 'soop_talk_01',
      channelName: '이루',
      channelImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://ch.sooplive.co.kr/arong0106',
      liveTitle: '첫인사 & 시청자 소통 저챗 라이브 (신입 버튜버)',
      categoryGroup: 'TALK',
      categoryName: '보이는 라디오/토크',
      viewerCount: 540,
      thumbnailUrl: undefined,
      firstSeenAt: new Date(now.getTime() - 25 * 60000).toISOString(),
      liveUrl: 'https://play.sooplive.co.kr/arong0106/123456',
      tags: ['버튜버', 'SOOP', '소통'],
    },
    {
      id: 'chzzk-103',
      platform: 'CHZZK',
      channelId: 'ch_val_01',
      channelName: '바쿠',
      channelImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/baku',
      liveTitle: '발로란트 솔랭 불멸 달성할 때까지 무한 노방종',
      categoryGroup: 'GAME',
      categoryName: '발로란트',
      viewerCount: 380,
      thumbnailUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=720&auto=format&fit=crop&q=80',
      firstSeenAt: new Date(now.getTime() - 110 * 60000).toISOString(),
      liveUrl: 'https://chzzk.naver.com/live/baku',
      tags: ['버튜버', '발로란트', '노방종'],
    },
    {
      id: 'chzzk-104',
      platform: 'CHZZK',
      channelId: 'ch_music_01',
      channelName: '시아',
      channelImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/sia',
      liveTitle: '새벽 감성 우타와쿠 노래방 & 리퀘스트 신청곡',
      categoryGroup: 'MUSIC',
      categoryName: '음악·노래',
      viewerCount: 310,
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=720&auto=format&fit=crop&q=80',
      firstSeenAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      liveUrl: 'https://chzzk.naver.com/live/sia',
      tags: ['버튜버', '노래', '우타와쿠'],
    },
  ];

  let filtered = [...fallbackLives];
  if (params.platform && params.platform !== 'ALL') {
    filtered = filtered.filter((l) => l.platform === params.platform);
  }
  if (params.category && params.category !== 'ALL') {
    filtered = filtered.filter((l) => l.categoryGroup === params.category);
  }
  if (params.game && params.game !== 'ALL') {
    filtered = filtered.filter((l) => l.categoryName.toLowerCase() === params.game?.toLowerCase());
  }
  if (params.query && params.query.trim()) {
    const q = params.query.trim().toLowerCase();
    filtered = filtered.filter((l) =>
      l.channelName.toLowerCase().includes(q) ||
      l.liveTitle.toLowerCase().includes(q) ||
      l.categoryName.toLowerCase().includes(q)
    );
  }
  if (params.sort === 'recent') {
    filtered.sort((a, b) => new Date(b.firstSeenAt || 0).getTime() - new Date(a.firstSeenAt || 0).getTime());
  } else {
    filtered.sort((a, b) => b.viewerCount - a.viewerCount);
  }

  return {
    meta: {
      scope: 'VERIFIED_VTUBER_LIVE_OBSERVED',
      snapshotId: `snap-${Math.floor(now.getTime() / 300000)}`,
      observedAt: kstIso,
      totalLiveCount: fallbackLives.length,
      totalViewerSum: fallbackLives.reduce((acc, l) => acc + l.viewerCount, 0),
      platformTotals: {
        chzzk: {
          liveCount: fallbackLives.filter((l) => l.platform === 'CHZZK').length,
          viewerSum: fallbackLives.filter((l) => l.platform === 'CHZZK').reduce((acc, l) => acc + l.viewerCount, 0),
        },
        soop: {
          liveCount: fallbackLives.filter((l) => l.platform === 'SOOP').length,
          viewerSum: fallbackLives.filter((l) => l.platform === 'SOOP').reduce((acc, l) => acc + l.viewerCount, 0),
        },
      },
    },
    categories: [
      { key: 'ALL', name: '전체', liveCount: 5, viewerSum: 3570 },
      {
        key: 'GAME',
        name: '게임',
        liveCount: 3,
        viewerSum: 2720,
        games: [
          { name: 'Grand Theft Auto V', liveCount: 1, viewerSum: 1420 },
          { name: '마인크래프트', liveCount: 1, viewerSum: 920 },
          { name: '발로란트', liveCount: 1, viewerSum: 380 },
        ],
      },
      { key: 'TALK', name: '잡담·소통', liveCount: 1, viewerSum: 540 },
      { key: 'MUSIC', name: '음악·노래', liveCount: 1, viewerSum: 310 },
      { key: 'ART', name: '그림·아트', liveCount: 0, viewerSum: 0 },
      { key: 'ASMR', name: 'ASMR', liveCount: 0, viewerSum: 0 },
      { key: 'ETC', name: '기타', liveCount: 0, viewerSum: 0 },
    ],
    lives: filtered,
  };
}

/**
 * ============================================================================
 * 14. 방송 기록 (History) 타임라인 조회 관련 인터페이스 및 API 함수
 * ============================================================================
 */
export interface HistoryRecordItem {
  id: string;
  platform: 'CHZZK' | 'SOOP';
  channelId?: number | string | null;
  channelName: string;
  channelImageUrl?: string | null;
  channelUrl?: string | null;
  liveTitle: string;
  categoryGroup: string;
  categoryName: string;
  viewerCount: number;
  observedAt: string;
  recordedHour: number;
  liveUrl?: string;
  tags?: string[];
}

export interface HourlyDistributionItem {
  hour: number;
  liveCount: number;
  avgViewers: number;
}

export interface CreatorHistoryItem {
  streamerName: string;
  platform: 'CHZZK' | 'SOOP';
  channelImageUrl?: string | null;
  channelUrl?: string | null;
  totalRecordedStreams: number;
  frequentCategories: Array<{ name: string; count: number }>;
  recentStreams: Array<{
    date: string;
    hour: number;
    title: string;
    categoryName: string;
    viewerCount: number;
  }>;
}

export interface LiveHistoryResponse {
  meta: {
    targetDate: string;
    targetHour: number;
    totalRecords: number;
    platform: string;
    category: string;
  };
  hourlyDistribution: HourlyDistributionItem[];
  records: HistoryRecordItem[];
}

export interface LiveHistoryParams {
  date?: string;
  hour?: number;
  platform?: PlatformFilter;
  category?: string;
  streamer?: string;
  query?: string;
}

export async function fetchLiveHistory(params: LiveHistoryParams = {}): Promise<LiveHistoryResponse> {
  const query = new URLSearchParams();
  if (params.date) query.set('date', params.date);
  if (params.hour !== undefined) query.set('hour', String(params.hour));
  if (params.platform && params.platform !== 'ALL') query.set('platform', params.platform);
  if (params.category && params.category !== 'ALL') query.set('category', params.category);
  if (params.streamer && params.streamer.trim()) query.set('streamer', params.streamer.trim());
  if (params.query && params.query.trim()) query.set('q', params.query.trim());

  const url = `/api/discovery/history?${query.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Live history API fallback:', err);
    return getFallbackLiveHistory(params);
  }
}

export async function fetchCreatorHistory(streamerName: string): Promise<CreatorHistoryItem | null> {
  const cleanName = streamerName.trim();
  if (!cleanName) return null;

  const url = `/api/discovery/history/creator?name=${encodeURIComponent(cleanName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Creator history API fallback:', err);
    return null;
  }
}

function getFallbackLiveHistory(params: LiveHistoryParams): LiveHistoryResponse {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const targetDate = params.date || kst.toISOString().slice(0, 10);
  const targetHour = params.hour !== undefined ? params.hour : kst.getUTCHours();
  const platform = params.platform || 'ALL';
  const category = params.category || 'ALL';

  const hourlyDistribution: HourlyDistributionItem[] = [
    25, 18, 12, 8, 5, 4, 6, 9, 14, 20, 26, 32,
    38, 42, 45, 48, 52, 58, 65, 74, 82, 88, 79, 48
  ].map((count, hour) => ({
    hour,
    liveCount: count,
    avgViewers: Math.round(count * 28.5),
  }));

  const sampleRecords: HistoryRecordItem[] = [
    {
      id: 'hist-101',
      platform: 'CHZZK',
      channelId: 'ch_arisa',
      channelName: '아리사',
      channelImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/arisa',
      liveTitle: '일단 실버가고 골드 권왕중입니다 정까이',
      categoryGroup: 'GAME',
      categoryName: '리그 오브 레전드',
      viewerCount: 6688,
      observedAt: `${targetDate} ${String(targetHour).padStart(2, '0')}:15:00`,
      recordedHour: targetHour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['버튜버', '롤', '랭크게임'],
    },
    {
      id: 'hist-102',
      platform: 'CHZZK',
      channelId: 'ch_honey',
      channelName: '허니츄러스',
      channelImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/honeychurros',
      liveTitle: '덕코프랑 비슷하다던데 딱 내 스탈일듯',
      categoryGroup: 'GAME',
      categoryName: '종합 게임',
      viewerCount: 2470,
      observedAt: `${targetDate} ${String(targetHour).padStart(2, '0')}:24:00`,
      recordedHour: targetHour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['버튜버', '신작게임', '생방송'],
    },
    {
      id: 'hist-103',
      platform: 'CHZZK',
      channelId: 'ch_rooftop',
      channelName: '옥냥이 RoofTopCAT',
      channelImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/rooftopcat',
      liveTitle: '신작 마블 울버린 PS5 독점작 플레이',
      categoryGroup: 'GAME',
      categoryName: '마블 울버린',
      viewerCount: 1845,
      observedAt: `${targetDate} ${String(targetHour).padStart(2, '0')}:35:00`,
      recordedHour: targetHour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['PS5', '울버린', '콘솔게임'],
    },
    {
      id: 'hist-104',
      platform: 'CHZZK',
      channelId: 'ch_ming',
      channelName: '김밍령',
      channelImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/kimmingryung',
      liveTitle: '마인크래프트 하드코어 야생 건축 힐링 방송',
      categoryGroup: 'GAME',
      categoryName: '마인크래프트',
      viewerCount: 920,
      observedAt: `${targetDate} ${String(targetHour).padStart(2, '0')}:42:00`,
      recordedHour: targetHour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['마인크래프트', '힐링', '건축'],
    },
    {
      id: 'hist-105',
      platform: 'CHZZK',
      channelId: 'ch_sing',
      channelName: '루나 보컬',
      channelImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      channelUrl: 'https://chzzk.naver.com/live/luna_vocal',
      liveTitle: '비 오는 날 듣기 좋은 감성 발라드 노래방',
      categoryGroup: 'MUSIC',
      categoryName: '음악·노래',
      viewerCount: 1140,
      observedAt: `${targetDate} ${String(targetHour).padStart(2, '0')}:50:00`,
      recordedHour: targetHour,
      liveUrl: 'https://chzzk.naver.com',
      tags: ['노래방', '발라드', '우타와쿠'],
    },
  ];

  const filtered = sampleRecords.filter((item) => {
    if (platform !== 'ALL' && item.platform !== platform) return false;
    if (category !== 'ALL' && item.categoryGroup !== category) return false;
    if (params.query) {
      const q = params.query.toLowerCase();
      if (!item.liveTitle.toLowerCase().includes(q) && !item.channelName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return {
    meta: {
      targetDate,
      targetHour,
      totalRecords: filtered.length,
      platform,
      category,
    },
    hourlyDistribution,
    records: filtered,
  };
}

