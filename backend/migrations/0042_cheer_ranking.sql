-- 0042: 루키 응원 랭킹 — 응원 집계 컬럼과 중복 투표 방지 로그.
-- 표준 스키마(streamerChannel_info)의 프로필 단위로 응원을 집계한다.
-- ALTER TABLE ADD COLUMN은 재실행할 수 없으므로 이 파일만 명시 실행한다(전체 마이그레이션 일괄 재실행 금지).

ALTER TABLE streamerChannel_info ADD COLUMN event_type TEXT NOT NULL DEFAULT 'DEBUT' CHECK (event_type IN ('DEBUT', 'NEW_OUTFIT', '3D_DEBUT', 'ANNIVERSARY'));
ALTER TABLE streamerChannel_info ADD COLUMN total_cheers INTEGER NOT NULL DEFAULT 0;
ALTER TABLE streamerChannel_info ADD COLUMN weekly_cheers INTEGER NOT NULL DEFAULT 0;
ALTER TABLE streamerChannel_info ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_info_weekly_cheers ON streamerChannel_info(weekly_cheers DESC, start_at_utc DESC);

-- 같은 버튜버에게 같은 기기는 하루(KST) 1회만 응원할 수 있다. 중복 방어는 DB 고유 인덱스가 담당한다.
CREATE TABLE IF NOT EXISTS cheer_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vtuber_id INTEGER NOT NULL,
  client_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  voted_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vtuber_id) REFERENCES streamerChannel_info(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cheer_logs_daily ON cheer_logs(vtuber_id, client_hash, voted_date);
CREATE INDEX IF NOT EXISTS idx_cheer_logs_ip_daily ON cheer_logs(ip_hash, voted_date);
