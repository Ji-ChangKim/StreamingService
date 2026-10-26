import { dateTimeFormatter } from '../../../shared/dateTimeFormatter';
import { DebutEvent } from '../types';
import { getEventDateKey, getTodayDateKey } from './calendarUtils';
import { checkIsEventLive } from './eventUtils';

export interface DebutSpotlightEntry {
  event: DebutEvent;
  isLive: boolean;
  timeStr: string;
  dateKey: string;
  dayLabel: string;
  daysDiff: number; // 0: 오늘, 1: 내일, 2+: n일 뒤
  primaryPlatform: 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH' | 'OTHER';
  channelUrl: string;
}

export const PLATFORM_OFFICIAL_ASSETS: Record<string, { label: string; logo: string }> = {
  CHZZK: { label: '치지직', logo: '/icons/chzzk_icon.png' },
  SOOP: { label: 'SOOP', logo: '/icons/soop/soop_symbol_blue.svg' },
  YOUTUBE: { label: '유튜브', logo: '/icons/youtube_icon.png' },
  TWITCH: { label: '트위치', logo: '/icons/twitch_icon.svg' },
  OTHER: { label: '기타', logo: '/icons/chzzk_icon.png' },
};

/**
 * 이벤트에서 주 플랫폼과 채널 링크 추출 (단일 기능 함수)
 */
export function extractPrimaryPlatformAndUrl(evt: DebutEvent): {
  platform: 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH' | 'OTHER';
  channelUrl: string;
} {
  const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
  const rawPlatform = (primaryLink?.platform || 'CHZZK').toUpperCase();
  const platform = (['CHZZK', 'SOOP', 'YOUTUBE', 'TWITCH'].includes(rawPlatform)
    ? rawPlatform
    : 'OTHER') as 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH' | 'OTHER';

  return {
    platform,
    channelUrl: primaryLink?.url || 'https://vdebut.live',
  };
}

/**
 * 이벤트를 스포트라이트 엔트리로 변환 (단일 기능 함수)
 */
export function formatSpotlightEntry(
  evt: DebutEvent,
  selectedTimezone: string = 'Asia/Seoul'
): DebutSpotlightEntry {
  const isLive = checkIsEventLive(evt.startAtUtc);
  const dateKey = getEventDateKey(evt.startAtUtc, selectedTimezone);
  const eventTime = new Date(evt.startAtUtc);
  const now = new Date();

  let timeStr = '00:00';
  let dayLabel = '';

  try {
    timeStr = dateTimeFormatter('ko-KR', {
      timeZone: selectedTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(eventTime);

    dayLabel = dateTimeFormatter('ko-KR', {
      timeZone: selectedTimezone,
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    }).format(eventTime);
  } catch {
    timeStr = evt.startAtUtc.slice(11, 16);
    dayLabel = dateKey;
  }

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const eventMidnight = new Date(eventTime.getFullYear(), eventTime.getMonth(), eventTime.getDate()).getTime();
  const daysDiff = Math.round((eventMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

  const { platform, channelUrl } = extractPrimaryPlatformAndUrl(evt);

  return {
    event: evt,
    isLive,
    timeStr,
    dateKey,
    dayLabel,
    daysDiff,
    primaryPlatform: platform,
    channelUrl,
  };
}

/**
 * [금일 데뷔] 오늘 데뷔하는 모든 스트리머 목록 추출 (단일 기능 함수)
 */
export function getTodayDebutList(
  allEvents: DebutEvent[],
  selectedTimezone: string = 'Asia/Seoul'
): DebutSpotlightEntry[] {
  const todayKey = getTodayDateKey(selectedTimezone);

  const list = allEvents
    .filter((evt) => {
      const dateKey = getEventDateKey(evt.startAtUtc, selectedTimezone);
      return dateKey === todayKey;
    })
    .map((evt) => formatSpotlightEntry(evt, selectedTimezone));

  // LIVE 중인 방송 우선, 그 다음 시간 오름차순
  return list.sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    return new Date(a.event.startAtUtc).getTime() - new Date(b.event.startAtUtc).getTime();
  });
}

/**
 * [금주 데뷔] 이번 주(향후 7일 이내 데뷔 예정) 스트리머 목록 추출 (단일 기능 함수)
 */
export function getThisWeekDebutList(
  allEvents: DebutEvent[],
  selectedTimezone: string = 'Asia/Seoul'
): DebutSpotlightEntry[] {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysLater = todayMidnight + 7 * 24 * 60 * 60 * 1000;

  const list = allEvents
    .filter((evt) => {
      const evtTime = new Date(evt.startAtUtc).getTime();
      return evtTime >= todayMidnight && evtTime <= sevenDaysLater;
    })
    .map((evt) => formatSpotlightEntry(evt, selectedTimezone));

  return list.sort((a, b) => new Date(a.event.startAtUtc).getTime() - new Date(b.event.startAtUtc).getTime());
}

/**
 * [가장 빠른 데뷔] 오늘 데뷔가 없을 경우 가장 가까운 다음 데뷔 스트리머 추출 (단일 기능 함수)
 */
export function getUpcomingNextDebuts(
  allEvents: DebutEvent[],
  selectedTimezone: string = 'Asia/Seoul',
  limit: number = 3
): DebutSpotlightEntry[] {
  const now = new Date();
  const futureList = allEvents
    .filter((evt) => new Date(evt.startAtUtc).getTime() >= now.getTime())
    .map((evt) => formatSpotlightEntry(evt, selectedTimezone))
    .sort((a, b) => new Date(a.event.startAtUtc).getTime() - new Date(b.event.startAtUtc).getTime());

  return futureList.slice(0, limit);
}
