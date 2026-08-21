// Single Responsibility Principle: Admin CMS API Service

const ADMIN_TOKEN_KEY = 'vdebut_admin_token';
const ADMIN_USER_KEY = 'vdebut_admin_user';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminAuth(token: string, username: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, username);
  } catch {}
}

export function clearAdminAuth(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch {}
}

export function getAdminUser(): string {
  try {
    return localStorage.getItem(ADMIN_USER_KEY) || 'Vdebut.admin';
  } catch {
    return 'Vdebut.admin';
  }
}

const getApiHost = () => (import.meta as any).env?.VITE_API_HOST || '';

/**
 * 1. 관리자 로그인
 */
export async function adminLogin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`${getApiHost()}/api/v1/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAdminAuth(data.token, username);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || '로그인 서버 연결 오류' };
  }
}

/**
 * 2. 신청서 목록 조회
 */
export async function fetchAdminSubmissions(status: string = 'PENDING'): Promise<any[]> {
  const token = getAdminToken();
  if (!token) return [];

  try {
    const res = await fetch(`${getApiHost()}/api/v1/admin/submissions?status=${status}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data.submissions || [];
  } catch {
    return [];
  }
}

/**
 * 3. 관리자 1-클릭 승인 (커스텀 URL 슬러그 지원)
 */
export async function approveSubmission(id: number, customSlug?: string): Promise<{ success: boolean; message?: string; slug?: string; error?: string }> {
  const token = getAdminToken();
  if (!token) return { success: false, error: '인증 토큰이 없습니다.' };

  try {
    const res = await fetch(`${getApiHost()}/api/v1/admin/submissions/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ customSlug }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || '승인 처리 오류' };
  }
}

/**
 * 4. 관리자 반려
 */
export async function rejectSubmission(id: number, adminNote?: string): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const res = await fetch(`${getApiHost()}/api/v1/admin/submissions/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ adminNote }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

/**
 * 5. 관리자 신청서 삭제
 */
export async function deleteSubmission(id: number): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const res = await fetch(`${getApiHost()}/api/v1/admin/submissions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

/**
 * 6. 등록된 버튜버 전체 목록 조회 (CMS 관리용)
 */
export async function fetchAdminStreamers(): Promise<any[]> {
  const token = getAdminToken();
  if (!token) return [];

  try {
    const res = await fetch(`${getApiHost()}/api/v1/admin/streamers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data.streamers || [];
  } catch {
    return [];
  }
}

/**
 * 7. 캘린더에서 버튜버 1-클릭 즉시 삭제
 */
export async function deleteAdminStreamer(slug: string): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const res = await fetch(`${getApiHost()}/api/v1/admin/streamers/${slug}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}
