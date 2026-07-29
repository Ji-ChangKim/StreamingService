import { fetchWithVersion } from '../config';
import { DebutEvent } from '../types';
import { getMockEvents } from '../data/mockEvents';

/**
 * 데뷔 일정 목록을 서버 API로부터 페치하고 데이터가 없을 경우 Mock 데이터를 반환하는 서비스 함수
 */
export async function fetchDebutEvents(): Promise<DebutEvent[]> {
  try {
    const data = await fetchWithVersion('/events');
    if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
      return data.events;
    }
    return getMockEvents();
  } catch (error) {
    console.warn('API fetch failed, falling back to mock events:', error);
    return getMockEvents();
  }
}
