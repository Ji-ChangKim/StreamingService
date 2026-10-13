import { PortalProfile } from '../../../shared/portal';
import { fetchEventsFromD1 } from './eventDbService';
import { readPortalProfiles } from './portalProfileRepository';

// 기존 공개 API와 알림에서도 승인된 새 소개의 실제 일정 상태를 유지한다.
export function portalProfileEvent(profile: PortalProfile) {
  if (profile.dateState === 'NONE') return null;
  return { id: `portal_${profile.slug}`, title: `${profile.displayName} 데뷔 방송`, type: 'FIRST_DEBUT',
    startAtUtc: profile.startAtUtc, originalTimezone: profile.timezone, status: 'PUBLISHED', verificationStatus: 'COMMUNITY_SUBMITTED',
    creator: { id: profile.slug, slug: profile.slug, displayName: profile.displayName, avatarUrl: profile.avatarUrl,
      agency: profile.agency, description: profile.description, countryCode: profile.countryCode, languages: profile.languages },
    links: [{ platform: profile.platform, url: profile.channelUrl, isPrimary: true }], description: profile.description,
    ...(profile.dateState !== 'FIXED' ? { debutStatus: { statusType: 'UNDECIDED', label: profile.dateState === 'TIME_TBD' ? `${profile.debutDate} · 시간 미정` : `${profile.targetMonth} · 날짜 미정`, badge: '데뷔 예정', dateStr: profile.debutDate || profile.targetMonth } } : {}),
  };
}

// 공개 소개와 데뷔 목록이 서로 다른 명단을 반환하지 않도록 같은 자료에서 병합한다.
export async function readUnifiedDebutEvents(db: D1Database) {
  const [legacy, profiles] = await Promise.all([fetchEventsFromD1(db), readPortalProfiles(db)]);
  const identifiers = new Map((legacy || []).map((event) => [event.creator.slug, event.id]));
  return profiles.flatMap((profile) => {
    const event = portalProfileEvent(profile);
    return event ? [{ ...event, id: identifiers.get(profile.slug) || event.id }] : [];
  });
}
