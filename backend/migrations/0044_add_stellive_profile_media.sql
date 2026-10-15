-- 사용자 승인에 따라 두 개인 커버곡과 ABYSS 공통 PV를 동시에 보관한다.
-- 기존 영상·일정·배너·채널은 유지하고 아직 편집되지 않은 대상 목록에만 추가한다.
UPDATE portal_profiles
SET data=json_set(data,'$.media',json(CASE slug
  WHEN 'shizuki-toa' THEN '[{"provider":"YOUTUBE","kind":"COVER","url":"https://youtu.be/MZNKiadMo3U","title":"제육감 (第六感 / Reol)","credit":"시즈키 토아 공식 채널","featured":true},{"provider":"YOUTUBE","kind":"GROUP_PV","url":"https://youtu.be/tlCeLkw8Upc","title":"STELLIVE 4th Generation ABYSS PV","credit":"스텔라이브 공식 채널"}]'
  WHEN 'cogane-rang' THEN '[{"provider":"YOUTUBE","kind":"COVER","url":"https://youtu.be/iAoU1UGPoXc","title":"호랑풍류가 (나와 호랑이님 OST)","credit":"코가네 랑 공식 채널","featured":true},{"provider":"YOUTUBE","kind":"GROUP_PV","url":"https://youtu.be/tlCeLkw8Upc","title":"STELLIVE 4th Generation ABYSS PV","credit":"스텔라이브 공식 채널"}]' END)),
  updated_at=CURRENT_TIMESTAMP
WHERE slug IN ('shizuki-toa','cogane-rang')
  AND json_extract(data,'$.debutGroupId')='stellive-abyss-2026'
  AND json_extract(data,'$.agency')='스텔라이브'
  AND json_type(data,'$.contentReview') IS NULL
  AND json_type(data,'$.media') IS NULL
  AND json_extract(data,'$.videoUrl')=CASE slug
    WHEN 'shizuki-toa' THEN 'https://youtu.be/MZNKiadMo3U'
    WHEN 'cogane-rang' THEN 'https://youtu.be/iAoU1UGPoXc' END;
