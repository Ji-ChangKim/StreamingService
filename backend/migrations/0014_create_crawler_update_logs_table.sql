-- Migration 0014: Create Crawler Update Logs Table
-- 자동 웹서치 수집 및 갱신 이력 기록용 테이블

CREATE TABLE IF NOT EXISTS crawler_update_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_count INTEGER NOT NULL DEFAULT 0,
  updated_creators_json TEXT,
  email_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);
