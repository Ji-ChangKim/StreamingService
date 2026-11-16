-- 방송 태그(치지직)를 회차별 방송 행에 JSON 배열 문자열로 저장한다(기준 정의서 6.4, 8장 2번).
-- 기존 행은 NULL로 남고, 이 마이그레이션 이후 수집부터 쌓인다.
ALTER TABLE analytics_broadcast_snapshots ADD COLUMN tags TEXT;
