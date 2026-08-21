// Single Responsibility Principle: Clean Semantic Slug Generation & Romanization Utility

// 기본 한글 초중종성 로마자 매핑 표 (국어의 로마자 표기법 기준)
const CHOSUNG = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'
];

const JUNGSUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'
];

const JONGSUNG = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 'h'
];

/**
 * 1. 한글 문자열을 발음 기반의 깔끔한 영문 로마자(Romanized text)로 변환
 */
export function romanizeKorean(text: string): string {
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    // 완성형 한글 유니코드 범위: 0xAC00 (44032) ~ 0xD7A3 (55203)
    if (code >= 44032 && code <= 55203) {
      const unicodeIndex = code - 44032;
      const cho = Math.floor(unicodeIndex / 588);
      const jung = Math.floor((unicodeIndex % 588) / 28);
      const jong = unicodeIndex % 28;

      result += CHOSUNG[cho] + JUNGSUNG[jung] + JONGSUNG[jong];
    } else {
      result += text[i];
    }
  }

  return result;
}

/**
 * 2. 방송국 채널 URL 또는 X(트위터) 주소에서 공식 핸들/아이디 추출
 */
export function extractHandleFromUrl(channelUrl?: string, xUrl?: string): string | null {
  // ① X (트위터) 핸들 우선 추출 (예: https://x.com/Yakushiji_Mei -> yakushiji-mei)
  if (xUrl && xUrl.trim()) {
    try {
      const parsed = new URL(xUrl.trim());
      const handle = parsed.pathname.replace(/^\/|@/g, '').split('/')[0];
      if (handle && handle.length >= 2 && !handle.toLowerCase().includes('intent')) {
        return handle.toLowerCase().replace(/_/g, '-');
      }
    } catch {}
  }

  // ② 방송국 채널 URL에서 핸들/아이디 추출
  if (channelUrl && channelUrl.trim()) {
    try {
      const parsed = new URL(channelUrl.trim());
      const pathname = parsed.pathname;

      // 유튜브 @핸들 (예: /@YakushijiMei)
      if (pathname.includes('/@')) {
        const handle = pathname.split('/@')[1].split('/')[0];
        if (handle) return handle.toLowerCase().replace(/_/g, '-');
      }

      // SOOP / 아프리카TV 방송국 ID (예: /station/ruha0612 또는 /kyeajin1227)
      if (parsed.hostname.includes('sooplive.co.kr') || parsed.hostname.includes('afreecatv.com')) {
        const parts = pathname.split('/').filter(Boolean);
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length >= 3 && !['station', 'memo', 'post'].includes(lastPart)) {
          return lastPart.toLowerCase();
        }
      }

      // 트위치 채널 ID (예: /gameundertaker9)
      if (parsed.hostname.includes('twitch.tv')) {
        const handle = pathname.replace(/^\//, '').split('/')[0];
        if (handle && handle.length >= 3) return handle.toLowerCase();
      }

      // 치지직 커스텀 아이디 (예: /live/arongtti)
      if (parsed.hostname.includes('chzzk.naver.com')) {
        if (pathname.startsWith('/live/')) {
          const handle = pathname.replace('/live/', '').split('/')[0];
          // 32자리 해시가 아닌 일반 문자열인 경우 슬러그로 활용
          if (handle && handle.length < 25 && !/^[a-f0-9]{32}$/i.test(handle)) {
            return handle.toLowerCase();
          }
        }
      }
    } catch {}
  }

  return null;
}

/**
 * 3. 스마트 슬러그 자동 생성 메인 함수 (Clean Semantic Slug Generator)
 */
export function generateCleanSlug(displayName: string, channelUrl?: string, xUrl?: string): string {
  // 1순위: 채널 URL이나 X(트위터) 핸들에서 추출
  const urlHandle = extractHandleFromUrl(channelUrl, xUrl);
  if (urlHandle) {
    const sanitized = urlHandle.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (sanitized && sanitized.length >= 2) return sanitized;
  }

  // 2순위: 스트리머 이름에서 한글 로마자 변환 및 영문/숫자 정제
  if (displayName && displayName.trim()) {
    // 특수문자나 괄호 제거 (예: '薬師寺 メイ / Yakushiji Mei' -> 'Yakushiji Mei')
    let cleanName = displayName;
    if (cleanName.includes('/')) {
      const parts = cleanName.split('/');
      // 영문이 포함된 파트를 우선 채택
      const englishPart = parts.find(p => /[a-zA-Z]/.test(p));
      cleanName = englishPart ? englishPart.trim() : parts[0].trim();
    }

    const romanized = romanizeKorean(cleanName);
    const slug = romanized
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (slug && slug.length >= 2) {
      return slug;
    }
  }

  return `creator-${Date.now().toString(36)}`;
}

/**
 * 4. DB 중복 체크 후 고유 슬러그(Unique Slug) 생성 (예: hedo -> hedo-2 -> hedo-3)
 */
export async function resolveUniqueSlug(
  db: D1Database,
  baseSlug: string,
  excludeChannelId?: number
): Promise<string> {
  const sanitizedBase = baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'creator';
  let candidateSlug = sanitizedBase;
  let counter = 1;

  while (true) {
    let query = 'SELECT channel_id FROM streamerChannel_info WHERE slug = ? LIMIT 1';
    let stmt = db.prepare(query).bind(candidateSlug);

    const existing: any = await stmt.first();

    // 중복이 없거나, 자기 자신의 채널인 경우 사용 가능
    if (!existing || (excludeChannelId && existing.channel_id === excludeChannelId)) {
      return candidateSlug;
    }

    counter++;
    candidateSlug = `${sanitizedBase}-${counter}`;
  }
}
