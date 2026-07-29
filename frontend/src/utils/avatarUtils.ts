/**
 * 크리에이터 명칭 기반으로 고유하고 귀여운 버추얼 캐릭터 프로필 아바타 URL을 생성하는 단일 기능 유틸
 */
export function getAvatarUrl(displayName: string, existingUrl?: string): string {
  // 이미 사용자가 입력한 특정 커스텀 URL이 있고 기본 Unsplash 샘플이 아니라면 그대로 사용
  if (existingUrl && !existingUrl.includes('unsplash.com')) {
    return existingUrl;
  }

  // 버튜버 이름(displayName)의 시드값으로 예쁜 애니메이션 버추얼 캐릭터 아바타 자동 생성
  const encodedName = encodeURIComponent(displayName);
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodedName}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
