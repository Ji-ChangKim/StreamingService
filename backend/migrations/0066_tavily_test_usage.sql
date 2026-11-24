-- 검색 한도를 예약한 뒤 호출한다. 로컬 첫 시험의 불명 응답을 포함한 4회도 보수적으로 이관한다.
CREATE TABLE IF NOT EXISTS debut_search_usage (
 month TEXT PRIMARY KEY, reserved_credits INTEGER NOT NULL DEFAULT 0,
 reported_credits INTEGER NOT NULL DEFAULT 0, completed_requests INTEGER NOT NULL DEFAULT 0,
 failed_requests INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO debut_search_usage(month,reserved_credits,reported_credits,completed_requests,failed_requests,updated_at)
VALUES('2026-11',4,3,3,1,'2026-11-13T07:52:23.248Z');
