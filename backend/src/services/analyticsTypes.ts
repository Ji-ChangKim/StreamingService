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
