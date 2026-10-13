import { dateTimeFormatter } from './dateTimeFormatter';
export type PortalPlatform = 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH';
export type DateState = 'FIXED' | 'TIME_TBD' | 'DATE_TBD' | 'NONE';
export type RequestKind = 'DEBUT' | 'PROFILE' | 'CLAIM' | 'UPDATE' | 'CONTACT';
export type RequesterRole = 'SELF' | 'AGENCY' | 'FAN';
// 신청 역할은 본인 인증과 구분하며 기존 데이터에는 추측해서 채우지 않는다.
export const REGISTRATION_REGIONS = [
  { code: 'KR', label: '한국', zones: ['Asia/Seoul'] },
  { code: 'JP', label: '일본', zones: ['Asia/Tokyo'] },
  { code: 'US', label: '미국', zones: ['America/Los_Angeles', 'America/New_York'] },
] as const;
// 상세 화면에서 외부 채널의 배너와 실제 소개를 함께 사용한다.
export interface PortalChannelDetails { bannerUrl: string; mobileBannerUrl: string; description: string }
export interface PortalProfile {
  slug: string; displayName: string; description: string; avatarUrl: string;
  platform: PortalPlatform; channelUrl: string; countryCode: string; languages: string[];
  tags: string[]; agency: string; xUrl: string; dateState: DateState;
  debutDate: string; debutTime: string; timezone: string; startAtUtc: string;
  targetMonth: string; ownerVerified: boolean; source: 'EXISTING' | 'REGISTERED';
  requesterRole?: RequesterRole;
  // 선택한 홍보 자료는 기존 JSON 프로필에 저장해 이전 등록 정보도 그대로 읽는다.
  headline?: string; bannerUrl?: string; websiteUrl?: string; noticeUrl?: string; cafeUrl?: string;
  additionalChannels?: { platform: PortalPlatform; channelUrl: string }[];
  videoUrl?: string; videoTitle?: string; videoKind?: 'INTRO' | 'TEASER' | 'GROUP_PV' | 'REPLAY' | 'COVER' | 'HIGHLIGHT';
  debutVideoUrl?: string;
  // 같은 팀·기수의 데뷔 연결은 관리자만 설정한다.
  debutGroupId?: string; debutGroupName?: string;
}
export interface PortalRequest {
  id: string; kind: RequestKind; status: 'PENDING' | 'APPROVED' | 'REJECTED';
  slug: string; payload: Record<string, unknown>; note: string; createdAt: string;
}
export const PORTAL_PLATFORMS = [
  { id: 'CHZZK', label: '치지직', icon: '/icons/chzzk_icon.png' },
  { id: 'SOOP', label: 'SOOP', icon: '/icons/soop/soop_symbol_blue.svg' },
  { id: 'YOUTUBE', label: 'YouTube', icon: '/icons/youtube_icon.png' },
  { id: 'TWITCH', label: 'Twitch', icon: '/icons/twitch_icon.svg' },
] as const;
export const PORTAL_TIMEZONES = ['Asia/Seoul', 'Asia/Tokyo', 'UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London'];

// 외부 링크는 웹 주소만 허용한다.
export function portalWebUrl(value: string): string {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}

// 플랫폼별 실제 도메인을 확인해 다른 사이트를 방송 채널로 등록하지 않는다.
export function portalChannelUrl(value: string, platform: string): string {
  const safe = portalWebUrl(value);
  if (!safe) return '';
  const hosts: Record<string, string[]> = { CHZZK: ['chzzk.naver.com'], SOOP: ['sooplive.co.kr', 'sooplive.com', 'afreecatv.com'], YOUTUBE: ['youtube.com', 'youtu.be'], TWITCH: ['twitch.tv'] };
  const host = new URL(safe).hostname;
  return hosts[platform]?.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)) ? safe : '';
}

// 주소 별칭·추적 인자를 제거하되 확인되지 않은 YouTube 핸들과 채널 ID는 합치지 않는다.
export function portalChannelKey(value: string, platform: string): string {
  const safe = portalChannelUrl(value, platform);
  if (!safe) return '';
  const url = new URL(safe);
  const parts = url.pathname.split('/').filter(Boolean);
  if (platform === 'SOOP') {
    const id = ['station', 'live'].includes(parts[0]) ? parts[1] : parts[0];
    return id && /^[a-z0-9_]+$/i.test(id) ? `SOOP:${id.toLowerCase()}` : '';
  }
  if (platform === 'CHZZK') {
    const id = parts[0] === 'live' ? parts[1] : parts[0];
    return id && /^[a-f0-9]{32}$/i.test(id) ? `CHZZK:${id.toLowerCase()}` : '';
  }
  if (platform === 'TWITCH') return parts[0] && /^[a-z0-9_]+$/i.test(parts[0]) ? `TWITCH:${parts[0].toLowerCase()}` : '';
  if (platform === 'YOUTUBE' && url.hostname.endsWith('youtube.com')) {
    if (parts[0]?.startsWith('@')) return `YOUTUBE:${parts[0].toLowerCase()}`;
    if (['channel', 'c', 'user'].includes(parts[0]) && parts[1]) return `YOUTUBE:${parts[0]}/${parts[0] === 'channel' ? parts[1] : parts[1].toLowerCase()}`;
  }
  return '';
}

// 선택한 시간대의 날짜 키를 브라우저 시간대와 무관하게 계산한다.
export function portalDateKey(value: string | Date, timezone: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = dateTimeFormatter('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('-');
}

// 현지 날짜·시간을 일광 절약 시간까지 반영해 UTC로 변환하고 존재하지 않는 시각을 거절한다.
export function portalUtc(date: string, time: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !PORTAL_TIMEZONES.includes(timezone)) return '';
  const target = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(target)) return '';
  let candidate = target;
  const format = dateTimeFormatter('en-GB', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 3; i++) {
    const parts = format.formatToParts(candidate);
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    const wall = Date.parse(`${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:00Z`);
    candidate += target - wall;
  }
  const result = new Date(candidate).toISOString();
  return portalDateKey(result, timezone) === date && format.formatToParts(candidate).filter((p) => p.type === 'hour' || p.type === 'minute').map((p) => p.value).join(':') === time ? result : '';
}

// 미정 상태를 포함해 선택한 월에 속하는 일정을 판단한다.
export function portalMonth(profile: PortalProfile, timezone: string): string {
  if (profile.dateState === 'NONE') return '';
  if (profile.dateState === 'DATE_TBD') return profile.targetMonth;
  if (profile.dateState === 'TIME_TBD') return profile.debutDate.slice(0, 7);
  return portalDateKey(profile.startAtUtc, timezone).slice(0, 7);
}

// 달력 날짜를 계산할 때 시간 미정 대상은 알려진 날짜를 유지한다.
export function portalDay(profile: PortalProfile, timezone: string): string {
  return profile.dateState === 'TIME_TBD' ? profile.debutDate : profile.dateState === 'FIXED' ? portalDateKey(profile.startAtUtc, timezone) : '';
}
