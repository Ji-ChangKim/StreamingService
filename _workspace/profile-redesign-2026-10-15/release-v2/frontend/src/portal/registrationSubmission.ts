import { portalApi } from './portalApi';

export interface SubmissionAttempt { hash: string; key: string }

// 같은 탭에서 응답 유실·새로고침 후 재시도할 때 같은 제출 식별자를 재사용한다.
export async function registrationSubmission(body: Record<string, unknown>, fallback: { current: SubmissionAttempt | null }) {
  const serialized = JSON.stringify(body);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized)))).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const storageKey = `vd-registration-attempt:${body.kind}`;
  let saved = fallback.current;
  try { saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null') || saved; } catch { /* 저장소가 제한되면 현재 화면의 식별자를 사용한다. */ }
  const attempt = saved?.hash === hash ? saved : { hash, key: crypto.randomUUID() };
  fallback.current = attempt;
  try { sessionStorage.setItem(storageKey, JSON.stringify(attempt)); } catch { /* 폼의 원문이나 연락처는 저장하지 않는다. */ }
  await portalApi('/requests', { method: 'POST', headers: { 'X-Submission-Key': attempt.key }, body: serialized });
  try { sessionStorage.removeItem(storageKey); } catch { /* 접수 성공 화면으로 전환한다. */ }
  fallback.current = null;
}
