// 도감 제보 항목과 출처 검증을 화면과 서버에서 함께 사용한다.
export const WIKI_FIELDS = [
  ['species', '종족'], ['birthday', '생일 / 별자리'], ['height', '신장 / 혈액형'], ['mbti', 'MBTI'],
  ['fandomName', '팬덤명 / 오시마크'], ['illustrator', '일러스트 / 리깅'], ['media', '영상 / 클립'], ['contentSummary', '활동 소개 / 이력'],
] as const;

// 공식 도메인과 HTTPS를 확인하며 유사 도메인·인증 정보·홈페이지만 있는 주소를 거절한다.
export function wikiEvidenceUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 1000) return '';
  try {
    const url = new URL(value.trim());
    const hosts = ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'chzzk.naver.com', 'sooplive.com', 'www.sooplive.com', 'vod.sooplive.com', 'sooplive.co.kr', 'www.sooplive.co.kr', 'vod.sooplive.co.kr', 'afreecatv.com', 'www.afreecatv.com', 'vod.afreecatv.com', 'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'cafe.naver.com'];
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && hosts.includes(url.hostname) && url.pathname !== '/' ? url.href : '';
  } catch { return ''; }
}

// 기존 문의 검토 대기열을 재사용하되 제보와 공개 응원글의 입력을 별도로 검증한다.
export function cleanWikiParticipation(body: Record<string, unknown>): Record<string, string> {
  if (!body.requestType) return {};
  if (!['WIKI_REVISION', 'SUPPORT'].includes(String(body.requestType))) throw new Error('요청 유형을 확인해 주세요.');
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (body.requestType === 'SUPPORT') {
    if (message.length < 2 || message.length > 150) throw new Error('응원 메시지는 2자 이상 150자 이하로 입력해 주세요.');
    return { requestType: 'SUPPORT', subject: '데뷔 응원 메시지', message };
  }
  const targetField = String(body.targetField || '');
  const evidenceUrl = wikiEvidenceUrl(body.evidenceUrl);
  if (!WIKI_FIELDS.some(([key]) => key === targetField) || !message || message.length > 2000) throw new Error('수정할 항목과 내용을 확인해 주세요.');
  if (!evidenceUrl) throw new Error('내용을 확인할 수 있는 공식 채널의 게시물 주소를 입력해 주세요.');
  return { requestType: 'WIKI_REVISION', subject: '도감 정보 제보', message, targetField, evidenceUrl };
}

export interface WikiSupportMessage { id: string; message: string; createdAt: string }
