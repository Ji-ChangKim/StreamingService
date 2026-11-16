// 방송 통계 개편 화면(기준 정의서 09)의 공개 응답 형식.
export type BoardPlatform = 'ALL' | 'CHZZK' | 'SOOP';
export type Competition = '여유' | '보통' | '혼잡' | '경쟁 없음';

export interface BoardPlatformCard { platform: 'CHZZK' | 'SOOP'; viewers: number; usualDelta: number | null; peakToday: number; bigCount: number }
export interface BoardTrendPoint { label: string; chzzk: number | null; soop: number | null; usual: number | null }
export interface BoardGame { name: string; viewers: number; broadcasts: number; perBroadcast: number | null; competition: Competition; rankChange: number | null }
export interface BoardRising { name: string; growth: number; viewers: number }
export interface BoardTag { tag: string; viewers: number; broadcasts: number }
export interface BoardChannel { channelKey: string; name: string; platform: 'CHZZK' | 'SOOP'; affiliation: string; category: string; isGame: boolean; viewers: number; liveUrl: string | null; imageUrl: string | null; isVtuber: boolean }

export interface AnalyticsBoard {
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
export interface AnalyticsGameBoard {
  asOf: string | null; nextAt: string; name: string; summary: string | null;
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
}

export type ChannelPeriod = 7 | 30 | 90;
export interface ChannelBroadcastLog { streamId: string; date: string; title: string; category: string; isGame: boolean; minutes: number; avg: number | null; peak: number | null }
export interface AnalyticsChannelBoard {
  asOf: string | null; nextAt: string; days: ChannelPeriod;
  channel: { channelKey: string; platform: 'CHZZK' | 'SOOP'; name: string; affiliation: string; imageUrl: string | null; channelUrl: string; profileSlug: string | null; followers: number | null };
  live: { viewers: number; category: string; liveUrl: string | null } | null;
  summary: string | null;
  kpis: { avg: number | null; peak: number | null; minutes: number; broadcasts: number; prev: { avg: number | null; minutes: number; broadcasts: number } | null; peakDate: string | null };
  trend: Array<{ date: string; avg: number | null; peak: number | null }>;
  games: Array<{ name: string; isGame: boolean; share: number; avg: number | null }>;
  heat: number[][]; // [월..일][0..23] 방송한 비율(%)
  log: ChannelBroadcastLog[];
}

// 태그는 띄어쓰기·대소문자만 다른 값을 같은 태그로 본다(정의서 6.4).
export function normalizeBoardTag(tag: string): string {
  return tag.normalize('NFKC').replace(/^#/, '').replace(/\s+/g, '').toLowerCase().slice(0, 40);
}
