import { fetchWithVersion } from '../config';
import { DebutEvent } from '../types';
import { getMockEvents } from '../data/mockEvents';



const DEFAULT_TBD_EVENTS: DebutEvent[] = [
  {
    id: 'evt_tbd_hakua',
    title: '하쿠아 데뷔 방송',
    type: 'FIRST_DEBUT',
    startAtUtc: '2026-09-01T00:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    isTbd: true,
    targetMonth: '2026-09',
    tbdType: 'DATE_TBD',
    description: '[일정 미정] 치지직 신입 버츄얼 크리에이터 9월 데뷔 준비 중! 첫 방송 일정 조율 중입니다.',
    creator: {
      id: 'cr_tbd_hakua',
      displayName: '하쿠아 (Hakua)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    links: [
      {
        platform: 'CHZZK',
        url: 'https://chzzk.naver.com',
        isPrimary: true,
      },
    ],
  },
  {
    id: 'evt_tbd_rubina',
    title: '루비나 데뷔 방송',
    type: 'FIRST_DEBUT',
    startAtUtc: '2026-09-01T00:00:00.000Z',
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    isTbd: true,
    targetMonth: '2026-09',
    tbdType: 'DATE_TBD',
    description: '[일정 미정] SOOP 웰컴 버추얼 9월 데뷔 준비 중! 일정 확정 시 공지 예정입니다.',
    creator: {
      id: 'cr_tbd_rubina',
      displayName: '루비나 (Rubina)',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      agency: '개인세',
      countryCode: 'KR',
      languages: ['ko'],
    },
    links: [
      {
        platform: 'SOOP',
        url: 'https://www.sooplive.co.kr',
        isPrimary: true,
      },
    ],
  },
];

/**
 * 데뷔 일정 목록을 서버 API로부터 페치하고 데이터가 없을 경우 Mock 데이터를 반환하며,
 * 각 크리에이터의 치지직/SOOP 실제 프로필 사진을 백엔드 API로부터 실시간 수집(Enrichment)함.
 */
export async function fetchDebutEvents(): Promise<DebutEvent[]> {
  try {
    const data = await fetchWithVersion('/events');
    if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
      const serverEvents: DebutEvent[] = data.events;
      const hasAnyTbd = serverEvents.some((e) => e.isTbd);
      if (!hasAnyTbd) {
        return [...DEFAULT_TBD_EVENTS, ...serverEvents];
      }
      return serverEvents;
    }
  } catch (error) {
    console.error('Fetch events error:', error);
  }
  return [...DEFAULT_TBD_EVENTS, ...getMockEvents()];
}

/**
 * 신규 데뷔 이벤트를 백엔드 신청서 대기열 API (POST /api/v1/submissions)로 전송하여 안전하게 접수
 */
export async function createDebutSubmission(event: DebutEvent): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await fetchWithVersion('/submissions', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return {
      success: Boolean(data.success),
      message: data.message || '신청서가 접수되었습니다.',
    };
  } catch (err: any) {
    console.error('Failed to submit debut event to backend:', err);
    return { success: false, message: err?.message || '신청서 접수에 실패했습니다.' };
  }
}

export async function createDebutEvent(event: DebutEvent): Promise<boolean> {
  const res = await createDebutSubmission(event);
  return res.success;
}
/**
 * 기존 데뷔 이벤트를 백엔드 API (PUT /api/v1/events/:id)로 전송하여 수정
 */
export async function updateDebutEvent(eventId: string, event: Partial<DebutEvent>): Promise<boolean> {
  try {
    const data = await fetchWithVersion(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
    return Boolean(data.success);
  } catch (err) {
    console.error('Failed to update debut event in backend:', err);
    return false;
  }
}