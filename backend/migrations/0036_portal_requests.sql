-- 개발 플랫폼의 접수·프로필·소유권·관리자 세션을 기존 방송 데이터와 분리한다.
CREATE TABLE IF NOT EXISTS portal_profiles (
  slug TEXT PRIMARY KEY,
  channel_url TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS portal_requests (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('DEBUT','PROFILE','CLAIM','UPDATE','CONTACT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  slug TEXT NOT NULL DEFAULT '',
  payload TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  requester_hash TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS portal_requests_status ON portal_requests(status, created_at);
CREATE INDEX IF NOT EXISTS portal_requests_owner ON portal_requests(slug, kind, status, token_hash);
CREATE INDEX IF NOT EXISTS portal_requests_rate ON portal_requests(requester_hash, created_at);
CREATE TABLE IF NOT EXISTS portal_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
