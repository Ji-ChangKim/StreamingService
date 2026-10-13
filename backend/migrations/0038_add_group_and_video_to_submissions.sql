-- Migration 0038: 대기업/기업세 및 그룹/유닛 정보 확장 (그룹명, 대표 영상 PV, 공식 웹사이트)
-- debut_submissions 테이블 컬럼 추가
ALTER TABLE debut_submissions ADD COLUMN group_name TEXT;
ALTER TABLE debut_submissions ADD COLUMN video_url TEXT;
ALTER TABLE debut_submissions ADD COLUMN website_url TEXT;

-- streamerChannel_info 테이블 컬럼 추가
ALTER TABLE streamerChannel_info ADD COLUMN group_name TEXT;
ALTER TABLE streamerChannel_info ADD COLUMN video_url TEXT;
ALTER TABLE streamerChannel_info ADD COLUMN website_url TEXT;
