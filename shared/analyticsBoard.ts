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

// 태그는 띄어쓰기·대소문자만 다른 값을 같은 태그로 본다(정의서 6.4).
export function normalizeBoardTag(tag: string): string {
  return tag.normalize('NFKC').replace(/^#/, '').replace(/\s+/g, '').toLowerCase().slice(0, 40);
}
