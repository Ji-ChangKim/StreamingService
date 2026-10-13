import { useState } from 'react';
import { PortalChannelDetails } from '../../../shared/portal';

// 공유 조회 결과의 배너를 표시하고 이미지 실패는 채널 소개에 영향을 주지 않는다.
export function ProfileCover({ banner }: { banner: PortalChannelDetails }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div className={`vd-profile-cover${loaded ? ' has-channel-banner' : ''}`}>
    {banner.bannerUrl && !failed && <picture>
      {banner.mobileBannerUrl && <source media="(max-width:639px)" srcSet={banner.mobileBannerUrl} />}
      <img className="vd-profile-banner" src={banner.bannerUrl} alt="" decoding="async"
        onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setFailed(true); }} />
    </picture>}
  </div>;
}
