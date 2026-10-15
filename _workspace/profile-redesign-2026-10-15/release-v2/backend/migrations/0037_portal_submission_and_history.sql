-- 재시도·검토 대기 채널·공개 채널을 각각 고유 식별자로 보호한다.
CREATE TABLE IF NOT EXISTS portal_submission_keys (
  key_hash TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS portal_pending_channels (
  channel_key TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS portal_profile_channels (
  channel_key TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE
);
-- 기존 공개 데이터를 덮어쓰지 않고 관리자 수정 전후와 변경 사유를 보관한다.
CREATE TABLE IF NOT EXISTS portal_profile_history (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  before_data TEXT NOT NULL,
  after_data TEXT NOT NULL,
  reason TEXT NOT NULL,
  admin_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS portal_profile_history_slug ON portal_profile_history(slug, created_at);
