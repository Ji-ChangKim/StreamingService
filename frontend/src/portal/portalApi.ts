import { useCallback, useEffect, useRef, useState } from 'react';
import { PortalProfile } from '../../../shared/portal';

// 새 플랫폼 API의 오류와 응답을 같은 방식으로 처리한다.
export async function portalApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1/portal${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '요청을 처리하지 못했습니다.');
  return data as T;
}

// 목록은 실제 결과·불러오는 상태·실패를 구분한다.
export function usePortalProfiles(enabled = true) {
  const [profiles, setProfiles] = useState<PortalProfile[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const snapshot = useRef<{ at: number; revision: number } | null>(null);
  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    // 한 목록만 보관하고 30초 이내 화면 왕복에는 같은 참조를 재사용한다.
    if (!enabled || (snapshot.current?.revision === attempt && Date.now() - snapshot.current.at < 30000)) { setLoading(false); return; }
    const abort = new AbortController();
    const force = attempt > 0 && snapshot.current?.revision !== attempt;
    setLoading(!snapshot.current); setError('');
    // 새 캐시 정책의 주소를 구분해 이전 브라우저 캐시의 긴 유효 시간을 승계하지 않는다.
    portalApi<{ profiles: PortalProfile[] }>('/profiles?version=2', { signal: abort.signal, cache: force ? 'reload' : 'default' }).then((data) => { if (!abort.signal.aborted) { snapshot.current = { at: Date.now(), revision: attempt }; setProfiles(data.profiles); } }).catch((e: Error) => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [attempt, enabled]);
  return { profiles, loading, error, refresh };
}

// 저장소 접근이 제한된 브라우저에서도 화면이 중단되지 않게 한다.
export function readPortalStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(`vd:${key}`) || 'null') ?? fallback; } catch { return fallback; }
}

// 개인 목록은 이 브라우저에 저장하며 저장 실패를 호출자에게 알려준다.
export function savePortalStorage(key: string, value: unknown): boolean {
  try { localStorage.setItem(`vd:${key}`, JSON.stringify(value)); return true; } catch { return false; }
}
