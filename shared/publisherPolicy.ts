// 게시자 ID·동의 설정·콘텐츠 검토가 확정되기 전에는 모든 화면의 광고를 중지한다.
export const PUBLISHER_ADS_ENABLED = false;

// 신청서·조회·관심 목록·오류 상태에 광고가 표시되지 않도록 기본 차단한다.
export function publisherAdsAllowed(): boolean {
  return PUBLISHER_ADS_ENABLED;
}
