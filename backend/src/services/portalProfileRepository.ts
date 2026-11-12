import { PortalProfile, portalWebUrl, portalChannelUrl, isAutoRegisteredChannelProfile } from '../../../shared/portal';
import { isPublicProfile } from '../../../shared/contentReview';

type LegacyRow = { slug: string; display_name: string; description: string; profile_image_url: string; agency_name: string; platform: PortalProfile['platform']; channel_url: string; country_code: string; x_url: string; debut_date: string; debut_time: string; timezone: string; start_at_utc: string };

// 외부 채널 검색·통계 조회로 자동 등록된 행은 데뷔 소개가 아니라 채널 등록 기록이다.
// 등록 시 채운 기본 소개 문구와 00:00 시각으로 구분한다.
export function isAnalyticsAutoRegisteredRow(row: { description?: string | null; display_name?: string | null; debut_time?: string | null }): boolean {
  return row.description === `${row.display_name} 스트리머의 채널입니다.` && row.debut_time === '00:00';
}

// 기존 정보는 확인되지 않은 언어나 국가를 추측하지 않고 변환한다.
function legacyProfile(row: LegacyRow): PortalProfile {
  // 외부 채널 검색 등록 시 채운 저장 시각을 실제 데뷔 일정으로 오인하지 않는다.
  const registrationOnly = isAnalyticsAutoRegisteredRow(row);
  const dateUnknown = /\[일정 미정\]|\[날짜 미정\]|\[미정\]/.test(row.description || '') || !row.start_at_utc;
  const timeUnknown = /\[시간 미정\]/.test(row.description || '');
  return { slug: row.slug, displayName: row.display_name, description: row.description || '', avatarUrl: portalWebUrl(row.profile_image_url || ''),
    agency: row.agency_name || '', platform: row.platform, channelUrl: portalChannelUrl(row.channel_url || '', row.platform),
    countryCode: row.country_code === 'EN' ? '' : row.country_code || '', languages: [], tags: [], xUrl: portalWebUrl(row.x_url || ''),
    dateState: registrationOnly ? 'NONE' : timeUnknown ? 'TIME_TBD' : dateUnknown ? 'DATE_TBD' : 'FIXED', debutDate: registrationOnly ? '' : row.debut_date || '', debutTime: registrationOnly ? '' : row.debut_time || '',
    timezone: row.timezone || 'Asia/Seoul', startAtUtc: row.start_at_utc || '', targetMonth: (row.debut_date || row.start_at_utc || '').slice(0, 7), ownerVerified: false, source: 'EXISTING' };
}

// 기존 공개 프로필과 직접 등록된 프로필을 같은 주소·채널 기준으로 통합한다.
export async function readPortalProfiles(db: D1Database): Promise<PortalProfile[]> {
  const [legacy, additions] = await Promise.all([db.prepare(`SELECT i.slug,i.display_name,i.description,i.profile_image_url,i.agency_name,i.country_code,i.x_url,i.debut_date,i.debut_time,i.timezone,i.start_at_utc,c.platform,c.channel_url FROM streamerChannel_info i JOIN streamerChannel c ON c.id=i.channel_id WHERE i.slug IS NOT NULL AND i.slug != ''`).all<LegacyRow>(), db.prepare('SELECT data FROM portal_profiles').all<{ data: string }>()]);
  const profiles = new Map((legacy.results || []).map((row) => [row.slug, legacyProfile(row)]));
  for (const row of additions.results || []) { const profile = JSON.parse(row.data) as PortalProfile; profiles.set(profile.slug, profile); }
  return [...profiles.values()];
}

// 단건 프로필 조회 시 전체 풀스캔을 방지하고 기본키(PK) 및 인덱스로 직접 조회한다 (단일 책임).
export async function readPortalProfileBySlug(db: D1Database, slug: string): Promise<PortalProfile | null> {
  if (!slug) return null;
  const addition = await db.prepare('SELECT data FROM portal_profiles WHERE slug = ?').bind(slug).first<{ data: string }>();
  if (addition?.data) {
    try {
      return JSON.parse(addition.data) as PortalProfile;
    } catch {
      // JSON 파싱 실패 시 레거시 조회를 진행한다.
    }
  }
  const legacy = await db.prepare(
    `SELECT i.slug,i.display_name,i.description,i.profile_image_url,i.agency_name,i.country_code,i.x_url,i.debut_date,i.debut_time,i.timezone,i.start_at_utc,c.platform,c.channel_url
     FROM streamerChannel_info i
     JOIN streamerChannel c ON c.id=i.channel_id
     WHERE i.slug = ? LIMIT 1`
  ).bind(slug).first<LegacyRow>();
  return legacy ? legacyProfile(legacy) : null;
}

// 관리자 원문 조회와 공개 목록을 분리해 검토 보류 자료의 우회 노출을 막는다.
export async function readPublicPortalProfiles(db: D1Database): Promise<PortalProfile[]> {
  // 자동 등록 채널 기록은 탐색 목록·사이트맵·캘린더에 넣지 않는다. 개별 주소는 상세 조회로 계속 열린다.
  return (await readPortalProfiles(db)).filter((profile) => isPublicProfile(profile) && !isAutoRegisteredChannelProfile(profile));
}

// 직접 URL·검색 메타데이터·구형 API에도 같은 공개 기준을 적용한다.
export async function readPublicPortalProfileBySlug(db: D1Database, slug: string): Promise<PortalProfile | null> {
  return Promise.resolve(await readPortalProfileBySlug(db, slug)).then((profile) => profile && isPublicProfile(profile) ? profile : null);
}
