import type { StatisticsStreamer } from './statisticsStreamerSearch';

// 전체 현황과 스트리머 상세에서 같은 기간·지표 정의를 사용한다.
export interface ActivityFilters {
  from: string;
  to: string;
  platform: 'ALL' | 'CHZZK' | 'SOOP';
  category: string;
  channel: string;
}

export interface ActivityBroadcast {
  platform: 'CHZZK' | 'SOOP';
  channelKey: string;
  channelName: string;
  streamId: string;
  title: string;
  categories: string;
  startedAt: string | null;
  firstObservedAt: string;
  lastObservedAt: string;
  minutes: number;
  peakViewers: number;
}

// 차트 선택은 기간 전체의 요약을 바꾸지 않고 방송 이력만 좁힌다.
export interface ActivitySelection {
  day: string;
  weekday: number | null;
  hour: number | null;
  timeMetric: 'activity' | 'starts';
}

export interface ActivityBroadcastPage {
  items: ActivityBroadcast[];
  total: number;
  nextCursor: string | null;
  asOf: string;
}

export interface BroadcastActivity {
  meta: { generatedAt: string; from: string; to: string; firstRecordedAt: string | null; lastRecordedAt: string | null; recordedDays: number; partialRuns: number };
  streamer: StatisticsStreamer | null;
  summary: { streamers: number; broadcasts: number; minutes: number; broadcastDays: number; categoryCount: number };
  heatmap: Array<{ weekday: number; hour: number; channels: number; runs: number }>;
  starts: Array<{ weekday: number; hour: number; broadcasts: number }>;
  categories: Array<{ key: string; platform: 'CHZZK' | 'SOOP'; name: string; broadcasts: number; minutes: number }>;
  categoryOptions: Array<{ key: string; platform: 'CHZZK' | 'SOOP'; name: string }>;
  daily: Array<{ date: string; broadcasts: number; minutes: number }>;
  broadcasts: ActivityBroadcast[];
}

// 날짜를 한국 시각으로 고정해 장치 시간대에 따른 기간 변경을 방지한다.
export function activityDate(now = Date.now()): string {
  return new Date(now + 9 * 3600000).toISOString().slice(0, 10);
}

// 오늘을 포함하는 연속 날짜 범위를 만든다.
export function activityPeriod(days: number, now = Date.now()): { from: string; to: string } {
  return { from: activityDate(now - (days - 1) * 86400000), to: activityDate(now) };
}

// 날짜 범위는 실제 달력 날짜이며 최대 90일까지만 허용한다.
export function validActivityRange(from: string, to: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)
    && Number.isFinite(Date.parse(from)) && Number.isFinite(Date.parse(to))
    && new Date(from).toISOString().slice(0, 10) === from && new Date(to).toISOString().slice(0, 10) === to
    && from <= to && to <= activityDate() && (Date.parse(to) - Date.parse(from)) / 86400000 < 90;
}

// 프로필의 공식 채널 주소를 상세 통계의 고유 주소로 연결한다.
export function activityChannelKey(platform: string, channelUrl: string): string | null {
  try {
    const url = new URL(channelUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    if (platform === 'CHZZK' && url.hostname === 'chzzk.naver.com') {
      const id = parts[0] === 'live' ? parts[1] : parts[0];
      return /^[a-f0-9]{32}$/i.test(id || '') ? `CHZZK:${id.toLowerCase()}` : null;
    }
    if (platform === 'SOOP' && /(^|\.)(sooplive\.(co\.kr|com)|afreecatv\.com)$/.test(url.hostname)) {
      const id = parts[0] === 'station' ? parts[1] : parts[0];
      return /^[a-z0-9_]{1,50}$/i.test(id || '') ? `SOOP:${id.toLowerCase()}` : null;
    }
    return null;
  } catch { return null; }
}
