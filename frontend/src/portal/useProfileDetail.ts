import { useCallback, useEffect, useState } from 'react';
import type { ProfileDetailResponse } from '../../../shared/profileDetails';
import { parseJsonSafely } from './portalApi';

// 상세 자료는 1분 동안 메모리에 두고, 카드에 손을 올린 순간 미리 받아 진입을 빠르게 한다.
const DETAIL_TTL_MS = 60_000;
type DetailEntry = { at: number; promise: Promise<ProfileDetailResponse | 'missing'> };
const detailCache = new Map<string, DetailEntry>();

async function loadDetail(slug: string): Promise<ProfileDetailResponse | 'missing'> {
  const response = await fetch(`/api/v1/portal/profiles/${encodeURIComponent(slug)}/detail`);
  if (response.status === 404) return 'missing';
  const data = await parseJsonSafely<ProfileDetailResponse | null>(response, null);
  if (!response.ok || !data || data.profile?.slug !== slug || !data.broadcast || !data.channelMedia?.videos || !data.channelMedia?.clips) throw new Error('detail unavailable');
  return data;
}

// 같은 소개를 1분 안에 다시 열거나 미리 받은 경우 진행 중인 요청을 함께 쓴다.
function detailRequest(slug: string, fresh = false): Promise<ProfileDetailResponse | 'missing'> {
  const cached = detailCache.get(slug);
  if (!fresh && cached && Date.now() - cached.at < DETAIL_TTL_MS) return cached.promise;
  const promise = loadDetail(slug);
  detailCache.set(slug, { at: Date.now(), promise });
  promise.catch(() => { if (detailCache.get(slug)?.promise === promise) detailCache.delete(slug); });
  return promise;
}

// 링크·카드에 마우스를 올리거나 손가락을 대는 순간 호출한다. 실패는 무시하고 실제 진입 때 다시 받는다.
export function prefetchProfileDetail(slug: string): void {
  if (!slug) return;
  detailRequest(slug).catch(() => undefined);
}

// 소개 페이지 진입·다른 프로필 이동·수동 재시도 때 상세 자료를 조회한다.
export function useProfileDetail(slug: string) {
  const [result, setResult] = useState<{ slug: string; data?: ProfileDetailResponse; error?: boolean; missing?: boolean }>({ slug });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    detailRequest(slug, attempt > 0)
      .then((data) => { if (active) setResult(data === 'missing' ? { slug, missing: true } : { slug, data }); })
      .catch(() => { if (active) setResult({ slug, error: true }); });
    return () => { active = false; };
  }, [slug, attempt]);
  return { ...(result.slug === slug ? result : { slug }), retry };
}
