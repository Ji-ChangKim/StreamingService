/**
 * 버튜버 국가 판별 유틸리티 (SRP 원칙)
 * 
 * 판별 규칙:
 * 1. 기존 유효 국가 코드(KR/JP/EN)가 있다면 우선 적용
 * 2. 치지직(CHZZK), SOOP(구 아프리카TV) 플랫폼 -> 99.9% 한국(KR)
 * 3. 텍스트(이름, 소개문)에 한글 포함 -> KR
 * 4. 텍스트에 히라가나/가타카나 포함 -> JP
 * 5. 그 외 영문/글로벌 -> EN
 */

export interface CountryDetectParams {
  platform?: string;
  channelUrl?: string;
  displayName?: string;
  description?: string;
  existingCountryCode?: string;
}

export type SupportedCountry = 'KR' | 'JP' | 'EN';

export interface CountryBadgeInfo {
  code: SupportedCountry;
  label: string;
  flag: string;
}

const COUNTRY_CONFIGS: Record<SupportedCountry, { label: string; flag: string }> = {
  KR: { label: '한국', flag: '🇰🇷' },
  JP: { label: '일본', flag: '🇯🇵' },
  EN: { label: '글로벌', flag: '🌐' },
};

/**
 * 채널 및 크리에이터 정보로부터 국가 코드(KR, JP, EN) 자동 판별
 */
export function detectCountryFromChannel(params: CountryDetectParams): SupportedCountry {
  const { platform = '', channelUrl = '', displayName = '', description = '', existingCountryCode } = params;

  // 1. 기존 코드가 유효한 경우 최우선 존중
  if (existingCountryCode) {
    const upper = existingCountryCode.trim().toUpperCase();
    if (upper === 'KR' || upper === 'JP' || upper === 'EN') {
      return upper as SupportedCountry;
    }
    if (upper === 'KO') return 'KR';
    if (upper === 'JA') return 'JP';
    if (upper === 'US' || upper === 'UK' || upper === 'GLOBAL') return 'EN';
  }

  // 2. 국내 특화 플랫폼 (치지직, SOOP) -> 99.9% KR
  const p = platform.toUpperCase();
  const url = channelUrl.toLowerCase();
  if (p === 'CHZZK' || url.includes('chzzk.naver.com') || p === 'SOOP' || url.includes('sooplive.co.kr') || url.includes('afreecatv.com')) {
    return 'KR';
  }

  // 3. 텍스트 분석 (이름 + 설명)
  const text = `${displayName} ${description}`;

  // 3-1. 한글이 포함된 경우 -> KR
  const hangulRegex = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;
  if (hangulRegex.test(text)) {
    return 'KR';
  }

  // 3-2. 히라가나/가타카나가 포함된 경우 -> JP
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  if (japaneseRegex.test(text)) {
    return 'JP';
  }

  // 4. 일본 관련 도메인 체크
  if (url.includes('.jp') || url.includes('nicovideo.jp')) {
    return 'JP';
  }

  // 5. 기본값은 영문/글로벌 EN
  return 'EN';
}

/**
 * 국가 코드에 따른 국기 이모지와 한글 라벨 반환
 */
export function getCountryBadge(countryCode?: string): CountryBadgeInfo {
  if (!countryCode) {
    return { code: 'KR', ...COUNTRY_CONFIGS.KR };
  }
  const upper = countryCode.trim().toUpperCase() as SupportedCountry;
  if (COUNTRY_CONFIGS[upper]) {
    return { code: upper, ...COUNTRY_CONFIGS[upper] };
  }
  return { code: 'KR', ...COUNTRY_CONFIGS.KR };
}
