-- Migration 0025: Update Admin Credentials & Support vedebut.admin / vdebut.admin
-- Password: admin1234@ (SHA-256 with salt 'vdebut_salt_2026')
-- Hash: ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7

-- 1. 기존 기본 관리자(id=1, Vdebut.admin) 비밀번호 해시를 admin1234@로 업데이트
UPDATE admin_users
SET password_hash = 'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7',
    salt = 'vdebut_salt_2026'
WHERE id = 1 OR LOWER(username) = 'vdebut.admin';

-- 2. 요청된 vedebut.admin 계정 추가 등록 및 비밀번호 설정
INSERT OR IGNORE INTO admin_users (username, password_hash, salt, role)
VALUES (
  'vedebut.admin',
  'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7',
  'vdebut_salt_2026',
  'ADMIN'
);

UPDATE admin_users
SET password_hash = 'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7',
    salt = 'vdebut_salt_2026'
WHERE LOWER(username) = 'vedebut.admin';

-- 3. vdebut.admin (소문자 표준) 계정 추가 등록
INSERT OR IGNORE INTO admin_users (username, password_hash, salt, role)
VALUES (
  'vdebut.admin',
  'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7',
  'vdebut_salt_2026',
  'ADMIN'
);
