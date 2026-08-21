// Single Responsibility Principle: Admin Authentication & Token Verification Service

const ADMIN_JWT_SECRET = 'vdebut_admin_secret_key_2026_secure';

/**
 * 1. Web Crypto API를 활용한 SHA-256 단방향 비밀번호 해싱
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 2. 관리자 로그인 검증 및 안전한 세션 토큰 발급
 */
export async function verifyAdminLogin(
  db: D1Database,
  username: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!username || !password) {
    return { success: false, error: '아이디와 비밀번호를 모두 입력해주세요.' };
  }

  try {
    const user: any = await db
      .prepare('SELECT id, username, password_hash, salt, role FROM admin_users WHERE username = ? LIMIT 1')
      .bind(username.trim())
      .first();

    if (!user) {
      return { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }

    const computedHash = await hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      return { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }

    // 로그인 시간 업데이트
    await db
      .prepare('UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(user.id)
      .run();

    // 안전한 관리자 세션 토큰 생성 (Base64 + Signature)
    const payload = JSON.stringify({
      uid: user.id,
      name: user.username,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7일 유효
    });

    const payloadB64 = btoa(unescape(encodeURIComponent(payload)));
    const signature = await hashPassword(payloadB64, ADMIN_JWT_SECRET);
    const token = `${payloadB64}.${signature}`;

    return { success: true, token };
  } catch (err: any) {
    console.error('Admin login error:', err);
    return { success: false, error: '로그인 처리 중 서버 오류가 발생했습니다.' };
  }
}

/**
 * 3. 관리자 요청 토큰 유효성 검사 미들웨어 함수
 */
export async function validateAdminToken(token?: string): Promise<boolean> {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadB64, signature] = parts;
    const expectedSignature = await hashPassword(payloadB64, ADMIN_JWT_SECRET);
    if (signature !== expectedSignature) return false;

    const payloadStr = decodeURIComponent(escape(atob(payloadB64)));
    const payload = JSON.parse(payloadStr);

    if (!payload.exp || Date.now() > payload.exp) {
      return false; // 만료됨
    }

    return true;
  } catch {
    return false;
  }
}
