-- 방송 통계의 10분 수집 회차와 원본 방송 정보. 기존 통계 테이블은 변경하지 않는다.
CREATE TABLE IF NOT EXISTS analytics_broadcast_runs (
  run_id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('CHZZK', 'SOOP')),
  scheduled_at TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  observed_at TEXT,
  attempt_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('running', 'available', 'partial', 'unavailable')),
  scope TEXT NOT NULL,
  checked_channels INTEGER,
  viewer_total INTEGER,
  channel_total INTEGER,
  error_code TEXT,
  UNIQUE(platform, scheduled_at)
);
CREATE INDEX IF NOT EXISTS idx_broadcast_runs_time ON analytics_broadcast_runs(scheduled_at, platform);
CREATE INDEX IF NOT EXISTS idx_broadcast_runs_observed ON analytics_broadcast_runs(observed_at, platform);

CREATE TABLE IF NOT EXISTS analytics_broadcast_snapshots (
  run_id TEXT NOT NULL REFERENCES analytics_broadcast_runs(run_id) ON DELETE CASCADE,
  stream_id TEXT NOT NULL,
  channel_key TEXT NOT NULL,
  channel_name TEXT,
  channel_url TEXT,
  image_url TEXT,
  live_url TEXT,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  viewers INTEGER NOT NULL CHECK (viewers >= 0),
  started_at TEXT,
  PRIMARY KEY (run_id, stream_id)
);
