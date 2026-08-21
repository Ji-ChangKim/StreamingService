-- Migration 0019: Create Admin Users Table & Debut Submissions Queue Table

-- 1. 관리자 계정 테이블 (admin_users) - 비밀번호 단방향 암호화 해시 저장
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT DEFAULT 'ADMIN',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

-- 초기 관리자 계정 시딩 (ID: Vdebut.admin / PW: Vdebut1#)
-- Salt: vdebut_salt_2026
-- SHA-256('Vdebut1#vdebut_salt_2026') = 4a9fefb09fca9517e4bb004b341f237bf3f345479cb206d2003c2002fcf93eb5
INSERT OR IGNORE INTO admin_users (id, username, password_hash, salt, role)
VALUES (
  1,
  'Vdebut.admin',
  '4a9fefb09fca9517e4bb004b341f237bf3f345479cb206d2003c2002fcf93eb5',
  'vdebut_salt_2026',
  'ADMIN'
);

-- 2. 데뷔 일정 신청서 대기열 테이블 (debut_submissions)
CREATE TABLE IF NOT EXISTS debut_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  avatar_url TEXT,
  description TEXT,
  agency_name TEXT DEFAULT '개인세',
  country_code TEXT DEFAULT 'KR',
  debut_date TEXT NOT NULL,
  debut_time TEXT NOT NULL,
  timezone TEXT DEFAULT 'Asia/Seoul',
  start_at_utc TEXT NOT NULL,
  x_url TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON debut_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON debut_submissions(created_at);
