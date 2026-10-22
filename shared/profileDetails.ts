import type { PortalProfile } from './portal';

// 입력 화면·서버 검증에서 같은 공개 캐릭터 정보와 길이 제한을 사용한다.
export const PROFILE_DETAIL_FIELDS = [
  { key: 'species', label: '종족', max: 80 },
  { key: 'birthday', label: '생일', max: 40 },
  { key: 'zodiac', label: '별자리', max: 40 },
  { key: 'height', label: '신장', max: 40 },
  { key: 'bloodType', label: '혈액형', max: 20 },
  { key: 'mbti', label: 'MBTI', max: 7 },
  { key: 'fandomName', label: '팬덤명', max: 60 },
  { key: 'oshiMark', label: '오시마크', max: 40 },
  { key: 'fanArtTag', label: '팬아트 태그', max: 100 },
  { key: 'illustrator', label: '일러스트', max: 100 },
  { key: 'rigger', label: '리깅', max: 100 },
  { key: 'contentSummary', label: '주요 콘텐츠 소개', max: 400 },
  { key: 'broadcastStyle', label: '방송 스타일', max: 400 },
  { key: 'fanMessage', label: '팬과 함께하는 이야기', max: 400 },
] as const;

export type ProfileDetails = Partial<Record<typeof PROFILE_DETAIL_FIELDS[number]['key'], string>>;
export interface ProfileBroadcast {
  state: 'LIVE' | 'OFFLINE' | 'UNKNOWN' | 'UNAVAILABLE';
  title?: string; url?: string; viewers?: number; observedAt?: string;
}
export interface ProfileDetailResponse {
  profile: PortalProfile;
  broadcast: ProfileBroadcast;
}

// 누락된 필드는 기존 값을 보존하고 명시적인 빈 객체는 전체 상세 정보 삭제를 뜻한다.
export function cleanProfileDetails(value: unknown): ProfileDetails | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('상세 프로필 정보를 확인해 주세요.');
  const input = value as Record<string, unknown>;
  const output: ProfileDetails = {};
  for (const { key, max } of PROFILE_DETAIL_FIELDS) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'string' || (input[key] as string).trim().length > max) throw new Error('상세 프로필의 입력 형식과 길이를 확인해 주세요.');
    const text = (input[key] as string).trim();
    if (key === 'mbti' && text && !/^[IE][NS][TF][JP](?:-[AT])?$/i.test(text)) throw new Error('MBTI를 확인해 주세요.');
    if (text) output[key] = key === 'mbti' ? text.toUpperCase() : text;
  }
  return output;
}
