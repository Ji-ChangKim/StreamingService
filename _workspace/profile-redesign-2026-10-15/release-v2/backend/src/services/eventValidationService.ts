// Single Responsibility Principle: Debut Event Request Validation Service

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 1. 스트리머 이름 유효성 검사 (1~30자, 금지된 더미/난수 텍스트 차단)
 */
export function validateDisplayName(name?: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, errorMessage: '스트리머 이름을 입력해주세요.' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 30) {
    return { isValid: false, errorMessage: '스트리머 이름은 1자 이상 30자 이하이어야 합니다.' };
  }

  // 금지된 더미 명칭 필터링
  const bannedKeywords = ['(알 수 없음)', '알 수 없음', 'unknown', 'null', 'undefined', 'test', '테스트', 'temp'];
  if (bannedKeywords.includes(trimmed.toLowerCase())) {
    return { isValid: false, errorMessage: '유효한 스트리머 이름을 입력해주세요.' };
  }

  // 무작위 자모/기호만으로 구성되었거나 비정상 패턴 필터링
  if (/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(trimmed)) {
    return { isValid: false, errorMessage: '자음이나 모음만으로 이루어진 이름은 등록할 수 없습니다.' };
  }

  return { isValid: true };
}

/**
 * 2. 지원 플랫폼 공식 URL 도메인 유효성 검사
 */
export function validateChannelUrl(url?: string, platform?: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, errorMessage: '채널/방송국 URL을 입력해주세요.' };
  }

  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { isValid: false, errorMessage: '올바른 http:// 또는 https:// 형식의 URL을 입력해주세요.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, errorMessage: '유효하지 않은 URL 형식입니다.' };
  }

  const host = parsed.hostname.toLowerCase();

  // 플랫폼별 허용 도메인 화이트리스트
  const allowedHosts: Record<string, string[]> = {
    CHZZK: ['chzzk.naver.com', 'm.chzzk.naver.com'],
    SOOP: ['sooplive.co.kr', 'ch.sooplive.co.kr', 'www.sooplive.co.kr', 'play.sooplive.co.kr', 'afreecatv.com'],
    YOUTUBE: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
    TWITCH: ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv'],
  };

  const currentPlatform = platform?.toUpperCase() || 'CHZZK';
  const validHostsForPlatform = allowedHosts[currentPlatform];

  if (validHostsForPlatform) {
    const isDomainAllowed = validHostsForPlatform.some(h => host === h || host.endsWith(`.${h}`));
    if (!isDomainAllowed) {
      return {
        isValid: false,
        errorMessage: `${currentPlatform} 플랫폼에 일치하지 않는 방송국 URL 도메인입니다. (${host})`
      };
    }
  } else {
    // 전체 허용 플랫폼 도메인 중 하나와 일치하는지 검사
    const allAllowed = Object.values(allowedHosts).flat();
    const isDomainAllowed = allAllowed.some(h => host === h || host.endsWith(`.${h}`));
    if (!isDomainAllowed) {
      return {
        isValid: false,
        errorMessage: '치지직, SOOP, YouTube, Twitch 공식 방송국 URL만 등록할 수 있습니다.'
      };
    }
  }

  return { isValid: true };
}

/**
 * 3. 데뷔 일시 유효성 검사 (ISO 날짜 포맷 및 유효 연도 범위 2020~2035년)
 */
export function validateDebutDateTime(startAtUtc?: string): ValidationResult {
  if (!startAtUtc || typeof startAtUtc !== 'string') {
    return { isValid: false, errorMessage: '데뷔 일시를 입력해주세요.' };
  }

  const d = new Date(startAtUtc);
  if (isNaN(d.getTime())) {
    return { isValid: false, errorMessage: '유효하지 않은 날짜/시간 형식입니다.' };
  }

  const year = d.getUTCFullYear();
  if (year < 2020 || year > 2035) {
    return { isValid: false, errorMessage: '데뷔 연도는 2020년에서 2035년 사이여야 합니다.' };
  }

  return { isValid: true };
}

/**
 * 4. 데뷔 일정 등록 요청 페이로드 종합 검증 (Facade Function)
 */
export function validateDebutEventPayload(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { isValid: false, errorMessage: '요청 본문이 올바르지 않습니다.' };
  }

  const displayName = body.creator?.displayName || body.displayName;
  const nameCheck = validateDisplayName(displayName);
  if (!nameCheck.isValid) return nameCheck;

  const primaryLink = body.links?.[0];
  const url = primaryLink?.url || body.watchUrl || body.channelUrl;
  const platform = primaryLink?.platform || body.platform;
  const urlCheck = validateChannelUrl(url, platform);
  if (!urlCheck.isValid) return urlCheck;

  const startAtUtc = body.startAtUtc;
  if (startAtUtc) {
    const dateCheck = validateDebutDateTime(startAtUtc);
    if (!dateCheck.isValid) return dateCheck;
  }

  // 소개글 길이 제한 (최대 1,000자)
  const description = body.description || body.creator?.description;
  if (description && typeof description === 'string' && description.length > 1000) {
    return { isValid: false, errorMessage: '소개글은 최대 1,000자까지 작성할 수 있습니다.' };
  }

  return { isValid: true };
}
