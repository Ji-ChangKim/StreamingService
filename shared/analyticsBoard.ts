// 방송 통계 개편 화면(기준 정의서 09)의 공개 응답 형식.
export type BoardPlatform = 'ALL' | 'CHZZK' | 'SOOP';
export type Competition = '여유' | '보통' | '혼잡' | '경쟁 없음';

export interface BoardPlatformCard { platform: 'CHZZK' | 'SOOP'; viewers: number; usualDelta: number | null; peakToday: number; bigCount: number }
export interface BoardTrendPoint { label: string; chzzk: number | null; soop: number | null; usual: number | null }
export interface BoardGame { name: string; viewers: number; broadcasts: number; perBroadcast: number | null; competition: Competition; rankChange: number | null }
export interface BoardRising { name: string; growth: number; viewers: number }
export interface BoardTag { tag: string; viewers: number; broadcasts: number }
export interface BoardChannel { channelKey: string; name: string; platform: 'CHZZK' | 'SOOP'; affiliation: string; category: string; isGame: boolean; viewers: number; liveUrl: string | null; imageUrl: string | null; isVtuber: boolean }

// 화면의 기간·플랫폼 버튼은 데이터가 있을 때만 누를 수 있다(정의서 5.12).
export interface BoardAvailability {
  coverageDays: number; // 수집이 시작된 뒤 지난 날 수
  platformReady: { CHZZK: boolean; SOOP: boolean }; // 그 플랫폼 데이터를 보여 줄 수 있는가
}

export interface AnalyticsBoard {
  availability: BoardAvailability;
  nowViewers: number; // 지금 회차에 수집된 모든 방송의 시청자 합(점유율 분모)
  asOf: string | null;
  nextAt: string;
  summary: string | null;
  platforms: BoardPlatformCard[];
  trend: { today: BoardTrendPoint[]; yesterday: BoardTrendPoint[]; d7: BoardTrendPoint[]; d30: BoardTrendPoint[] };
  games: { now: BoardGame[]; today: BoardGame[]; d7: BoardGame[] };
  rising: BoardRising[];
  nonGame: BoardGame[];
  tags: BoardTag[];
  channels: BoardChannel[];
}

export interface BoardTopChannel { channelKey: string; name: string; platform: 'CHZZK' | 'SOOP'; affiliation: string; avg: number; peak: number; hours: number }
// 게임 페이지 신입 가이드(기획문서 42번). 치지직 정각 기록, 최근 4주(28일), 한국 시간.
export interface GameGuideSlot { day: number; start: number; per: number; broadcasts: number; viewers: number; note: string } // day: 0=월
export interface GameGuide {
  heat: { viewers: number[][]; broadcasts: number[][]; per: Array<Array<number | null>> }; // [월..일][0..23], per는 방송 3개 미만이면 null
  best: GameGuideSlot[]; // 덜 붐비는 3시간 구간 TOP 3
  busiest: { day: number; hour: number } | null; // 시청자가 가장 많은 칸
  usualPer: number | null; // 지금 요일·시간의 4주 평균 방송 1개당 시청자
  trend: Array<{ date: string; viewers: number | null; broadcasts: number | null }>;
  recordDays: number; dailyChannels: number; // 검색 허용 기준(기록 일수, 하루 평균 방송 채널 수)
  newcomers: { people: number; streams: number; avgViewers: number | null; minutes: number; list: Array<{ slug: string; name: string; imageUrl: string; debutAt: string; streams: number; avgViewers: number | null }> } | null;
  alternatives: { day: number; start: number; games: Array<{ name: string; per: number; broadcasts: number; competition: Competition; self: boolean }> } | null;
}
export interface AnalyticsGameBoard {
  asOf: string | null; nextAt: string; name: string; summary: string | null;
  guide?: GameGuide;
  now: { viewers: number; broadcasts: number; perBroadcast: number | null; competition: Competition; rank: number | null };
  days: Array<{ date: string; viewers: number | null; broadcasts: number | null }>;
  platforms: Array<{ platform: 'CHZZK' | 'SOOP'; viewers: number; share: number }>;
  heat: number[][]; // [월..일][0..23] 평균 시청자
  top: BoardTopChannel[];
}

export interface AnalyticsTagBoard {
  asOf: string | null; nextAt: string; tag: string; summary: string | null; rank: number | null;
  now: { broadcasts: number; viewers: number; perBroadcast: number | null };
  channels: BoardChannel[];
  games: Array<{ name: string; broadcasts: number }>;
  withTags: Array<{ tag: string; broadcasts: number }>;
  // 저장된 태그 기록으로 그린 추이. 기록이 없으면 빈 배열.
  trend: { today: TagTrendPoint[]; yesterday: TagTrendPoint[]; d7: TagTrendPoint[]; d30: TagTrendPoint[] };
  tagCoverageDays: number; // 태그 저장이 시작된 뒤 지난 날 수
}
export interface TagTrendPoint { label: string; viewers: number | null; broadcasts: number | null }

export type ChannelPeriod = 7 | 30 | 90;
export interface ChannelBroadcastLog { streamId: string; date: string; title: string; category: string; isGame: boolean; minutes: number; avg: number | null; peak: number | null }
export interface AnalyticsChannelBoard {
  asOf: string | null; nextAt: string; days: ChannelPeriod;
  coverageDays: number; // 수집이 시작된 뒤 지난 날 수(기간 버튼·앞 기간 비교 활성화 기준)
  prevReady: boolean; // 앞 기간이 모두 수집 범위 안에 있어 비교할 수 있는가
  channel: { channelKey: string; platform: 'CHZZK' | 'SOOP'; name: string; affiliation: string; imageUrl: string | null; channelUrl: string; profileSlug: string | null; followers: number | null };
  live: { viewers: number; category: string; liveUrl: string | null } | null;
  summary: string | null;
  kpis: { avg: number | null; peak: number | null; minutes: number; broadcasts: number; prev: { avg: number | null; minutes: number; broadcasts: number } | null; peakDate: string | null };
  trend: Array<{ date: string; avg: number | null; peak: number | null }>;
  games: Array<{ name: string; isGame: boolean; share: number; avg: number | null }>;
  heat: number[][]; // [월..일][0..23] 방송한 비율(%)
  log: ChannelBroadcastLog[];
  tags: Array<{ tag: string; broadcasts: number; avg: number | null }>;
}

// 태그는 띄어쓰기·대소문자만 다른 값을 같은 태그로 본다(정의서 6.4).
export function normalizeBoardTag(tag: string): string {
  return tag.normalize('NFKC').replace(/^#/, '').replace(/\s+/g, '').toLowerCase().slice(0, 40);
}
