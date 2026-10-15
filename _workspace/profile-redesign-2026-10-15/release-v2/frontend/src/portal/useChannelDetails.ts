import { useEffect, useState } from 'react';
import { PortalChannelDetails, PortalProfile } from '../../../shared/portal';
import { portalApi } from './portalApi';

const EMPTY_DETAILS: PortalChannelDetails = { bannerUrl: '', mobileBannerUrl: '', description: '' };

// 배너와 소개를 한 번만 조회하고 다른 프로필로 이동하면 이전 문구를 즉시 제외한다.
export function useChannelDetails(profile: PortalProfile): PortalChannelDetails {
  const [result, setResult] = useState<{ slug: string; details: PortalChannelDetails } | null>(null);
  useEffect(() => {
    if (profile.platform !== 'SOOP') return;
    const abort = new AbortController();
    portalApi<PortalChannelDetails>(`/profiles/${encodeURIComponent(profile.slug)}/banner?version=2`, { signal: abort.signal })
      .then((details) => { if (!abort.signal.aborted) setResult({ slug: profile.slug, details }); })
      .catch(() => { /* 조회 실패 시 기존 등록 소개와 VDébut 배경을 유지한다. */ });
    return () => abort.abort();
  }, [profile.slug, profile.platform]);
  return profile.platform === 'SOOP' && result?.slug === profile.slug ? result.details : EMPTY_DETAILS;
}
