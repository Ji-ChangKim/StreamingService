-- 실제 등록된 공이연의 공식 소개에서 누락 항목을 확인하는 테스트 작업 1건.
-- 프로필·일정 값을 직접 변경하지 않고 서버의 정상 대기열 처리 경로만 사용한다.
INSERT OR IGNORE INTO debut_automation_sources(id,url,status,checked_at,last_success_at,cached,reason)
VALUES('enrichment-targets','https://vdebut.live/','OK',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),
'[{"key":"SOOP:02yeon","week":"2026-11-12"}]','ONBOARDING_VERIFICATION_TEST');
