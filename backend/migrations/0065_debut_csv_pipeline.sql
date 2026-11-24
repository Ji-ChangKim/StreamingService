-- CSV 원문은 기존 D1에 보관한다. 별도 유료 저장소나 공개 데이터 변경은 없다.
CREATE TABLE IF NOT EXISTS debut_csv_months (
 month TEXT PRIMARY KEY, revision INTEGER NOT NULL, bundle_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS debut_csv_revisions (
 month TEXT NOT NULL, revision INTEGER NOT NULL, run_id TEXT NOT NULL,
 phase TEXT NOT NULL, bundle_json TEXT NOT NULL, bundle_hash TEXT NOT NULL,
 created_at TEXT NOT NULL, PRIMARY KEY(month,revision)
);
CREATE TABLE IF NOT EXISTS debut_csv_receipts (
 candidate_id TEXT PRIMARY KEY, source_hash TEXT NOT NULL, profile_hash TEXT NOT NULL,
 month TEXT NOT NULL, revision INTEGER NOT NULL, bundle_hash TEXT NOT NULL,
 run_id TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS debut_csv_revision_date ON debut_csv_revisions(created_at);
