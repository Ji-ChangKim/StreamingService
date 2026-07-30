import { fetchWithVersion } from '../config';
import { DebutEvent } from '../types';
import { getMockEvents } from '../data/mockEvents';

/**
 * 개별 이벤트의 플랫폼 URL 기반으로 백엔드 외부 API를 호출해 진짜 프로필 이미지를 불러옴
 */
async function enrichEventProfile(evt: DebutEvent): Promise<DebutEvent> {
  const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
  if (!primaryLink || !primaryLink.url) return evt;

  try {
    const apiHost = (import.meta as any).env?.VITE_API_HOST || '';
    const res = await fetch(
      `${apiHost}/api/v1/platform/profile?platform=${primaryLink.platform}&url=${encodeURIComponent(primaryLink.url)}`
    );
    if (!res.ok) return evt;

    const data = await res.json();
    if (data.success && data.profileImageUrl) {
      return {
        ...evt,
        creator: {
          ...evt.creator,
          displayName: data.creatorName || evt.creator.displayName,
          avatarUrl: data.profileImageUrl, // 진짜 치지직/SOOP 프로필 이미지 획득!
        },
      };
    }
  } catch (err) {
    // API 실패 시 프로필 이미지는 빈값으로 남아 AvatarImage가 ❌를 노출
  }

  return evt;
}

/**
 * 데뷔 일정 목록을 서버 API로부터 페치하고 데이터가 없을 경우 Mock 데이터를 반환하며,
 * 각 크리에이터의 치지직/SOOP 실제 프로필 사진을 백엔드 API로부터 실시간 수집(Enrichment)함.
 */
export async function fetchDebutEvents(): Promise<DebutEvent[]> {
  let baseEvents: DebutEvent[] = [];

  try {
    const data = await fetchWithVersion('/events');
    if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
      baseEvents = data.events;
    } else {
      baseEvents = getMockEvents();
    }
  } catch (error) {
    baseEvents = getMockEvents();
  }

  // 병렬로 백엔드 외부 API를 호출하여 진짜 프로필 이미지 동기화!
  const enrichedEvents = await Promise.all(baseEvents.map(enrichEventProfile));
  return enrichedEvents;
}

/**
 * 신규 데뷔 이벤트를 백엔드 API (POST /api/v1/events)로 전송하여 DB에 저장
 */
export async function createDebutEvent(event: DebutEvent): Promise<boolean> {
  try {
    const apiHost = (import.meta as any).env?.VITE_API_HOST || '';
    const res = await fetch(`${apiHost}/api/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Failed to save debut event to backend:', err);
    return false;
  }
}

