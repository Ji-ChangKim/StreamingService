import { DebutEvent } from '../types';
import { getEventDateKey, getTodayDateKey } from './calendarUtils';
import { checkIsEventLive } from './eventUtils';

export type PlatformKey = 'SOOP' | 'CHZZK' | 'YOUTUBE' | 'TWITCH';

export interface SpotlightItem {
  event: DebutEvent;
  statusType: 'LIVE' | 'TODAY' | 'UPCOMING';
  statusBadge: string;
  badgeColorClass: string;
  daysDiff: number; // 0: 오늘, 1: 내일, 2+: n일 뒤
  timeStr: string;
  channelUrl: string;
}

export interface PlatformSpotlightSummary {
  items: SpotlightItem[];
  liveCount: number;
  totalCount: number;
  nextDateLabel: string;
}

/**
 * 이벤트에서 특정 플랫폼에 속하는지 확인 (단일 기능)
 */
export function isEventMatchingPlatform(evt: DebutEvent, platform: PlatformKey): boolean {
  return evt.links.some((l) => l.platform.toUpperCase() === platform);
}

/**
 * 특정 플랫폼의 이벤트를 [LIVE ➔ 오늘 데뷔 ➔ 가장 빠른 다음 데뷔일] 순으로 추출하는 스마트 큐 함수 (SRP)
 */
export function getPlatformSpotlightSummary(
  allEvents: DebutEvent[],
  platform: PlatformKey,
  selectedTimezone: string = 'Asia/Seoul',
  maxItems: number = 5
): PlatformSpotlightSummary {
  const platformEvents = allEvents.filter((evt) => isEventMatchingPlatform(evt, platform));
  const todayKey = getTodayDateKey(selectedTimezone);
  const now = new Date();

  const liveItems: SpotlightItem[] = [];
  const todayItems: SpotlightItem[] = [];
  const futureItems: SpotlightItem[] = [];

  platformEvents.forEach((evt) => {
    const isLive = checkIsEventLive(evt.startAtUtc);
    const dateKey = getEventDateKey(evt.startAtUtc, selectedTimezone);
    const eventTime = new Date(evt.startAtUtc);
    
    // 시간 문자열 (예: "19:00")
    let timeStr = '00:00';
    try {
      timeStr = new Intl.DateTimeFormat('ko-KR', {
        timeZone: selectedTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(eventTime);
    } catch {
      timeStr = evt.startAtUtc.slice(11, 16);
    }

    // 기본 채널 URL
    const primaryLink = evt.links.find((l) => l.platform.toUpperCase() === platform && l.isPrimary) ||
      evt.links.find((l) => l.platform.toUpperCase() === platform) ||
      evt.links[0];
    const channelUrl = primaryLink?.url || 'https://vdebut.live';

    // 날짜 차이 계산 (D-Day)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const eventMidnight = new Date(eventTime.getFullYear(), eventTime.getMonth(), eventTime.getDate()).getTime();
    const diffDays = Math.round((eventMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

    if (isLive) {
      liveItems.push({
        event: evt,
        statusType: 'LIVE',
        statusBadge: 'LIVE ON-AIR',
        badgeColorClass: 'bg-red-500 text-white animate-pulse',
        daysDiff: 0,
        timeStr,
        channelUrl,
      });
    } else if (dateKey === todayKey) {
      todayItems.push({
        event: evt,
        statusType: 'TODAY',
        statusBadge: `오늘 ${timeStr}`,
        badgeColorClass: 'bg-emerald-600 text-white',
        daysDiff: 0,
        timeStr,
        channelUrl,
      });
    } else if (diffDays > 0) {
      let badge = `${diffDays}일 후 ${timeStr}`;
      if (diffDays === 1) badge = `내일 ${timeStr}`;
      else if (diffDays === 2) badge = `모레 ${timeStr}`;

      futureItems.push({
        event: evt,
        statusType: 'UPCOMING',
        statusBadge: badge,
        badgeColorClass: 'bg-blue-600 text-white',
        daysDiff: diffDays,
        timeStr,
        channelUrl,
      });
    }
  });

  // 미래 일정은 시간순 오름차순 정렬
  futureItems.sort((a, b) => new Date(a.event.startAtUtc).getTime() - new Date(b.event.startAtUtc).getTime());
  todayItems.sort((a, b) => new Date(a.event.startAtUtc).getTime() - new Date(b.event.startAtUtc).getTime());

  // 1순위 LIVE -> 2순위 TODAY -> 3순위 FUTURE 순 결합
  const combined = [...liveItems, ...todayItems, ...futureItems];
  const items = combined.slice(0, maxItems);

  // 헤더 요약 라벨 결정
  let nextDateLabel = '데뷔 일정 준비 중';
  if (liveItems.length > 0) {
    nextDateLabel = `🔴 지금 ${liveItems.length}명 생방송 중`;
  } else if (todayItems.length > 0) {
    nextDateLabel = `✨ 오늘 ${todayItems.length}명 데뷔 예정`;
  } else if (futureItems.length > 0) {
    const first = futureItems[0];
    nextDateLabel = `📅 다음 데뷔: ${first.statusBadge}`;
  }

  return {
    items,
    liveCount: liveItems.length,
    totalCount: combined.length,
    nextDateLabel,
  };
}
