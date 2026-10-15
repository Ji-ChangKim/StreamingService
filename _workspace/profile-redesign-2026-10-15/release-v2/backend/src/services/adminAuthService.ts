// 관리자 비밀번호 확인과 서버 세션 인증을 분리한다.

// 기존 비밀번호 형식을 유지하는 SHA-256 해시를 계산한다.
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(password + salt);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// 기존 관리자 계정 확인 후 추측할 수 없는 8시간 세션을 발급한다.
export async function verifyAdminLogin(db: D1Database, username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!username || !password) return { success: false, error: '아이디와 비밀번호를 모두 입력해주세요.' };
  try {
    const user = await db.prepare('SELECT id,username,password_hash,salt,role FROM admin_users WHERE LOWER(username)=LOWER(?) LIMIT 1').bind(username.trim()).first<{ id: number; username: string; password_hash: string; salt: string; role: string }>();
    if (!user || user.role !== 'ADMIN' || await hashPassword(password, user.salt) !== user.password_hash) return { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
    await db.batch([
      db.prepare('INSERT INTO portal_sessions(token_hash,expires_at) VALUES(?,?)').bind(await hashPassword(token, ''), Date.now() + 8 * 3600000),
      db.prepare('UPDATE admin_users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?').bind(user.id),
    ]);
    return { success: true, token };
  } catch {
    return { success: false, error: '로그인 처리 중 서버 오류가 발생했습니다.' };
  }
}

// 코드에 포함된 서명 키나 오래된 토큰 대신 서버에 남은 유효한 세션만 인정한다.
export async function validateAdminToken(token: string | undefined, db: D1Database): Promise<boolean> {
  if (!token || token.length > 128) return false;
  try {
    return Boolean(await db.prepare('SELECT token_hash FROM portal_sessions WHERE token_hash=? AND expires_at>?').bind(await hashPassword(token, ''), Date.now()).first());
  } catch { return false; }
}
