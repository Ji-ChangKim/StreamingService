/**
 * 더미 이미지 생성 금지 ❌
 * 실제 연동된 프로필 URL이 없으면 빈 문자열("")을 반환하여 AvatarImage 컴포넌트가 ❌를 노출하도록 보장.
 */
export function getAvatarUrl(_displayName: string, existingUrl?: string): string {
  if (existingUrl && !existingUrl.includes('dicebear') && !existingUrl.includes('unsplash')) {
    return existingUrl;
  }
  return ''; // 더미 이미지 사용 금지 ❌
}
