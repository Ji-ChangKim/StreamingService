import { useCallback, useEffect, useState } from 'react';
import type { ProfileDetailResponse } from '../../../shared/profileDetails';
import { parseJsonSafely } from './portalApi';

// 소개 페이지 진입·다른 프로필 이동·수동 재시도 때만 상세 자료를 조회한다.
export function useProfileDetail(slug: string) {
  const [result, setResult] = useState<{ slug: string; data?: ProfileDetailResponse; error?: boolean; missing?: boolean }>({ slug });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    const abort = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/v1/portal/profiles/${encodeURIComponent(slug)}/detail`, { signal: abort.signal, cache: 'no-store' });
        if (response.status === 404) { if (!abort.signal.aborted) setResult({ slug, missing: true }); return; }
        const data = await parseJsonSafely<ProfileDetailResponse | null>(response, null);
        if (!response.ok || !data || data.profile?.slug !== slug || !data.broadcast) throw new Error('detail unavailable');
        if (!abort.signal.aborted) setResult({ slug, data });
      } catch {
        if (!abort.signal.aborted) setResult({ slug, error: true });
      }
    };
    void load();
    return () => { abort.abort(); };
  }, [slug, attempt]);
  return { ...(result.slug === slug ? result : { slug }), retry };
}
