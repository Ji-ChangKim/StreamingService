import { publisherAdsAllowed } from '../../../../shared/publisherPolicy';

interface AdBannerSlotProps {
  zone: 'ZONE1_TOP' | 'ZONE2_PINNED' | 'ZONE4_STICKY';
  enableAds?: boolean;
}

// 게시자 설정과 콘텐츠별 검토가 완료될 때까지 기존 광고 자리도 노출하지 않는다.
export function AdBannerSlot({ zone, enableAds = false }: AdBannerSlotProps) {
  return publisherAdsAllowed() && enableAds ? <aside aria-label="광고" data-ad-zone={zone} /> : null;
}
