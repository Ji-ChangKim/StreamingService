-- 유튜브 원본 영상 제목과 정확히 일치하도록 하나요 히요리 및 토키노 메리 커버곡 제목 정정
UPDATE portal_profiles
SET data=json_set(data,
  '$.videoTitle','Overdose / 하나요 히요리 COVER',
  '$.media[0].title','Overdose / 하나요 히요리 COVER'),
  updated_at=CURRENT_TIMESTAMP
WHERE slug='hanayo-hiyori';

UPDATE portal_profiles
SET data=json_set(data,
  '$.videoTitle','신인 버튜버가 부른 ⟪괴수 (Monster) - 요아소비 (YOASOBI)⟫ ┃ 토키노 메리 COVER',
  '$.media[0].title','신인 버튜버가 부른 ⟪괴수 (Monster) - 요아소비 (YOASOBI)⟫ ┃ 토키노 메리 COVER'),
  updated_at=CURRENT_TIMESTAMP
WHERE slug='tokino-mary';
