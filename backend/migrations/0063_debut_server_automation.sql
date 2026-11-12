-- 기존 공개 자료는 변경하지 않는다. 정기 조사의 원문 근거·보류·실행량만 분리한다.
CREATE TABLE IF NOT EXISTS debut_automation_control (
  id TEXT PRIMARY KEY CHECK(id='discovery'), enabled INTEGER NOT NULL DEFAULT 1,
  lease_owner TEXT NOT NULL DEFAULT '', lease_until TEXT NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO debut_automation_control(id) VALUES('discovery');
CREATE TABLE IF NOT EXISTS debut_automation_months (
  month TEXT PRIMARY KEY, runs INTEGER NOT NULL DEFAULT 0,
  reserved_external INTEGER NOT NULL DEFAULT 0,
  reserved_reads INTEGER NOT NULL DEFAULT 0,
  reserved_writes INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS debut_automation_runs (
  slot TEXT PRIMARY KEY, id TEXT NOT NULL UNIQUE, month TEXT NOT NULL,
  mode TEXT NOT NULL, status TEXT NOT NULL,
  started_at TEXT NOT NULL, finished_at TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS debut_automation_runs_date ON debut_automation_runs(started_at);
CREATE TABLE IF NOT EXISTS debut_automation_candidates (
  id TEXT PRIMARY KEY, channel_key TEXT NOT NULL, source TEXT NOT NULL,
  seed TEXT NOT NULL, source_hash TEXT NOT NULL,
  first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL,
  last_checked_at TEXT NOT NULL DEFAULT '', next_check_at TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'QUEUED', reason TEXT NOT NULL DEFAULT '',
  profile_slug TEXT NOT NULL DEFAULT '', managed_json TEXT NOT NULL DEFAULT '',
  image_hash TEXT NOT NULL DEFAULT '', evidence TEXT NOT NULL DEFAULT '{}',
  publish_token TEXT NOT NULL DEFAULT '', failures INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS debut_automation_due ON debut_automation_candidates(next_check_at, last_checked_at);
CREATE INDEX IF NOT EXISTS debut_automation_channel ON debut_automation_candidates(channel_key);
CREATE TABLE IF NOT EXISTS debut_automation_notices (
  url TEXT PRIMARY KEY, source_url TEXT NOT NULL, first_seen_at TEXT NOT NULL,
  next_check_at TEXT NOT NULL DEFAULT '', checked_at TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'QUEUED', reason TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS debut_automation_notices_due ON debut_automation_notices(next_check_at,checked_at);
CREATE TABLE IF NOT EXISTS debut_automation_sources (
  id TEXT PRIMARY KEY, url TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
  checked_at TEXT NOT NULL DEFAULT '', last_success_at TEXT NOT NULL DEFAULT '',
  failures INTEGER NOT NULL DEFAULT 0, reason TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL DEFAULT '', cached TEXT NOT NULL DEFAULT '',
  etag TEXT NOT NULL DEFAULT '', last_modified TEXT NOT NULL DEFAULT ''
);
-- 매 후보마다 구형 방송국을 전수 조회하지 않도록 조회용 인덱스만 추가한다.
CREATE INDEX IF NOT EXISTS debut_automation_legacy_url ON streamerChannel(channel_url);
CREATE INDEX IF NOT EXISTS debut_automation_pending_requests ON portal_requests(status,slug);
CREATE INDEX IF NOT EXISTS debut_automation_old_submissions ON debut_submissions(status,channel_url);
CREATE INDEX IF NOT EXISTS debut_automation_actual_profiles ON streamerChannel_info(id)
WHERE NOT (COALESCE(debut_time,'')='00:00' AND COALESCE(description,'')=COALESCE(display_name,'')||' 스트리머의 채널입니다.');
