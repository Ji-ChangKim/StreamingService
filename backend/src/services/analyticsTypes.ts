// Types for VDébut Analytics
// 기획서: VDebut_Analytics_Dashboard_Plan_v0.1

export type PlatformFilter = 'ALL' | 'CHZZK' | 'SOOP';
export type DayScopeFilter = 'ALL' | 'WEEKDAY' | 'WEEKEND' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type CategoryGroup = 'ALL' | 'GAME' | 'TALK' | 'MUSIC' | 'ART' | 'ASMR' | 'FOOD' | 'ETC';
export type CreatorTier = 'ALL' | 'NEW' | 'SMALL' | 'MID' | 'LARGE';

export interface AnalyticsMeta {
  timezone: string;           // 'Asia/Seoul'
  generatedAt: string;        // ISO KST
  dataThrough: string;        // ISO KST
  platforms: string[];        // ['CHZZK', 'SOOP']
  scope: string;              // 'VERIFIED_VTUBER_CHANNELS'
  completeness: number;       // 0.0 ~ 1.0 (예: 0.982)
  sampleDays: number;         // 28
  formulaVersion: string;     // 'opportunity-v1'
  isSimulation?: boolean;     // 초기 데이터 축적 전 시뮬레이션 여부 플래그
}

export interface AnalyticsApiResponse<T> {
  meta: AnalyticsMeta;
  data: T;
}

// 1. Overview
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
      growthRate: number; // %
    };
    liveCount: {
      current: number;
      previous: number;
      growthRate: number; // %
    };
    viewersPerLive: {
      current: number;
      previous: number;
      median: number;
      growthRate: number; // %
    };
    top10Concentration: {
      current: number; // 0.0 ~ 1.0 (예: 0.42 = 42%)
      previous: number;
      diffPp: number; // %p
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

// 2. Timeseries (24시간 추이)
export interface TimeseriesPoint {
  hour: number;             // 0 ~ 23
  label: string;            // '00:00' ~ '23:00'
  viewers: number;          // 동시시청 합계 (수요)
  liveCount: number;        // LIVE 수 (공급)
  viewersPerLive: number;   // 방송당 시청 (효율)
  top10Share: number;       // 상위 10 점유율 (집중도)
  opportunityScore: number; // 기회 점수
}

// 3. Heatmap (7요일 × 24시간)
export interface HeatmapCell {
  dayOfWeek: number;        // 0(일) ~ 6(토)
  dayName: string;          // '일', '월', ...
  hour: number;             // 0 ~ 23
  viewers: number;
  liveCount: number;
  viewersPerLive: number;
  top10Share: number;
  opportunityScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sampleCount: number;
}

// 4. Categories (콘텐츠 분석)
export interface CategoryStat {
  groupId: CategoryGroup;
  name: string;
  viewerShare: number;      // 0.0 ~ 1.0
  liveShare: number;        // 0.0 ~ 1.0
  viewersSum: number;
  liveCount: number;
  viewersPerLive: number;
  efficiencyIndex: number;  // viewerShare / liveShare (1.0 초과면 수요 > 공급)
  quadrant: 'BLUE_OCEAN' | 'RED_OCEAN' | 'NICHE' | 'LONG_TAIL';
  topGames?: Array<{
    name: string;
    viewers: number;
    liveCount: number;
  }>;
}

// 5. Opportunities (추천 제안기)
export interface OpportunityRequest {
  platform: PlatformFilter;
  category: string;
  availableDays: number[];  // 0~6
  timeStartHour: number;    // 0~23
  timeEndHour: number;      // 1~24
  expectedDurationHours?: number;
  creatorTier?: CreatorTier;
  isNewCreator?: boolean;
}

export interface OpportunityRecommendation {
  rank: number;
  slot: string;             // 예: '토요일 00:00 ~ 03:00'
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  score: number;            // 0~100
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

// 6. Live Samples
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

// 7. Methodology
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

// 8. Current Content & Game Drilldown
export interface EventClusterInfo {
  eventDetected: boolean;
  eventName: string; // 예: '#[태그명] 그룹·합방 이벤트'
  dominantTag: string;
  dominantTagShare: number; // 0.0 ~ 1.0 (예: 0.89 = 89%)
  channelCount: number; // 중복 태그 채널 수
  totalViewerSum: number; // 해당 태그 총 시청자 수
  advice: string; // 신입 스트리머를 위한 실전 시사점
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

// 시장 실시간 상태 자동 브리핑 (합방 있을 때 / 없을 때 100% 자동화)
export interface MarketBriefingInfo {
  statusType: 'EVENT_CONCENTRATION' | 'BALANCED_OPPORTUNITY' | 'TALK_CROWDED';
  badgeLabel: string;
  headline: string;
  factSummary: string;
  rookieActionAdvice: string;
}

// 9. 사람이 몰리는 자석 태그 (Magnet Tag)
export interface MagnetTagStat {
  tag: string;
  viewerSum: number;
  liveCount: number;
  averageViewers: number;
  shareOfTaggedViewers: number; // 0.0 ~ 1.0
  isEventTag: boolean; // 대형 합방/서버 태그 여부
  categoryType: string; // '합방/서버' | '버튜버/크루' | '게임' | '소통/신입'
}

// 10. 신입 스트리머 레이더 (Rookie Radar)
export interface RookieCategoryShare {
  categoryName: string;
  groupKey: string;
  rookieLiveCount: number;
  rookieShare: number; // 0.0 ~ 1.0 (신입 중 해당 카테고리 비율)
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

// 11. 시간대별 주요 방송 콘텐츠 순위
export interface HourlyContentItem {
  categoryName: string;
  groupKey: string;
  liveCount: number;
  shareOfHour: number; // 0.0 ~ 1.0
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
  hourlyRankings?: Record<string, HourlyContentRanking>; // key: `${dayOfWeek}-${hour}`
}

export type PeriodFilter = 'today' | 'yesterday' | '7d' | '30d' | '90d' | '180d';


