import { useCallback, useEffect, useState } from 'react';
import { PortalProfile } from '../../../shared/portal';

// 응답 본문이 비었거나 JSON이 아니어도 예외 없이 기본값을 돌려준다(Unexpected end of JSON input 방지).
export async function parseJsonSafely<T>(response: Response, fallback: T): Promise<T> {
  try {
    const text = await response.text();
    return text.trim() ? JSON.parse(text) as T : fallback;
  } catch { return fallback; }
}

// 새 플랫폼 API의 오류와 응답을 같은 방식으로 처리한다.
export async function portalApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1/portal${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await parseJsonSafely<Record<string, unknown>>(response, {});
  if (!response.ok) throw new Error(typeof data.error === 'string' && data.error ? data.error : '요청을 처리하지 못했습니다.');
  return data as T;
}

// 정상 응답의 빈 목록과 JSON 손상·응답 형식 오류를 구분한다.
// 목록은 60초 캐시를 쓰고, 관리자 변경 직후의 새로고침(fresh)은 캐시를 건너뛰어 다시 저장한다.
export async function fetchPublicProfiles(signal?: AbortSignal, fresh = false): Promise<PortalProfile[]> {
  const data = await portalApi<{ profiles?: PortalProfile[] }>('/profiles?version=3', { signal, ...(fresh ? { cache: 'no-cache' as RequestCache } : {}) });
  if (!Array.isArray(data.profiles)) throw new Error('소개를 불러오지 못했어요');
  return data.profiles;
}

// 목록은 실제 결과·불러오는 상태·실패를 구분한다.
export function usePortalProfiles(enabled = true, page = '') {
  const [profiles, setProfiles] = useState<PortalProfile[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    // 화면 이동은 짧은 캐시를 재사용하고, 새로고침 요청은 서버의 최신 공개 목록을 읽는다.
    if (!enabled) { setLoading(false); return; }
    const abort = new AbortController();
    setLoading(true); setError('');
    // 새 캐시 정책의 주소를 구분해 이전 브라우저 캐시의 긴 유효 시간을 승계하지 않는다.
    fetchPublicProfiles(abort.signal, attempt > 0).then((data) => { if (!abort.signal.aborted) { setProfiles(data); } }).catch((e: Error) => { if (!abort.signal.aborted) { setProfiles([]); setError(e.message); } }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [attempt, enabled, page]);
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

// 서버가 소개 상세 첫 HTML에 넣어 준 공개 정보를 읽는다. 다른 소개로 이동하면 사용하지 않는다.
export function readInitialProfile(slug: string): PortalProfile | undefined {
  if (!slug || typeof document === 'undefined') return undefined;
  try {
    const element = document.getElementById('vd-initial-profile');
    const profile = element?.textContent ? JSON.parse(element.textContent) as PortalProfile : undefined;
    return profile?.slug === slug ? profile : undefined;
  } catch { return undefined; }
}
