-- Migration 0012: Add x_url Column to streamerChannel_info and Update X URLs
-- 기존 모든 스트리머 정보(이름, 데뷔일, 채널 URL 등)는 100% 보존되며 x_url 컬럼만 안전하게 추가됩니다.

ALTER TABLE streamerChannel_info ADD COLUMN x_url TEXT;

-- 구글 시트 기반 X(트위터) 공식 링크 수집 데이터 일괄 UPDATE
UPDATE streamerChannel_info SET x_url = 'https://x.com/luha__14' WHERE slug = 'ruha';
UPDATE streamerChannel_info SET x_url = 'https://x.com/myaaaaaing' WHERE slug = 'myaing';
UPDATE streamerChannel_info SET x_url = 'https://x.com/Ayakashi_Ryuko' WHERE slug = 'ayakashi-ryuko';
UPDATE streamerChannel_info SET x_url = 'https://x.com/Risongnuna' WHERE slug = 'risong';
UPDATE streamerChannel_info SET x_url = 'https://x.com/horang_lawyer' WHERE slug = 'byeon-horang';
