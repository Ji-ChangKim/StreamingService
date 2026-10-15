-- 사용자 제공 공식 커버곡을 시즈키 토아·코가네 랑의 대표 영상으로 등록한다.
-- 기존 ABYSS 단체 PV 또는 같은 커버곡인 경우에만 갱신하며 다른 편집 내용은 보존한다.
-- 검토 기록이 있는 프로필은 검토 스냅샷을 무효화하지 않도록 이 작업에서 제외한다.
UPDATE portal_profiles
SET data=json_set(data,
  '$.videoUrl',CASE slug
    WHEN 'shizuki-toa' THEN 'https://youtu.be/MZNKiadMo3U'
    WHEN 'cogane-rang' THEN 'https://youtu.be/iAoU1UGPoXc' END,
  '$.videoTitle',CASE slug
    WHEN 'shizuki-toa' THEN '데뷔 커버곡 · 제육감 (第六感 / Reol)'
    WHEN 'cogane-rang' THEN '데뷔 커버곡 · 호랑풍류가 (나와 호랑이님 OST)' END,
  '$.videoKind','COVER'),
  updated_at=CURRENT_TIMESTAMP
WHERE slug IN ('shizuki-toa','cogane-rang')
  AND json_extract(data,'$.agency')='스텔라이브'
  AND json_extract(data,'$.debutGroupId')='stellive-abyss-2026'
  AND json_type(data,'$.contentReview') IS NULL
  AND json_extract(data,'$.videoUrl') IN ('https://youtu.be/tlCeLkw8Upc',
    CASE slug WHEN 'shizuki-toa' THEN 'https://youtu.be/MZNKiadMo3U'
      WHEN 'cogane-rang' THEN 'https://youtu.be/iAoU1UGPoXc' END);

-- 기존 관리 화면에서도 공개 프로필과 동일한 커버곡을 표시한다.
UPDATE streamerChannel_info
SET video_url=CASE slug
    WHEN 'shizuki-toa' THEN 'https://youtu.be/MZNKiadMo3U'
    WHEN 'cogane-rang' THEN 'https://youtu.be/iAoU1UGPoXc' END,
  updated_at=CURRENT_TIMESTAMP
WHERE slug IN ('shizuki-toa','cogane-rang')
  AND agency_name='스텔라이브'
  AND video_url IN ('https://youtu.be/tlCeLkw8Upc',
    CASE slug WHEN 'shizuki-toa' THEN 'https://youtu.be/MZNKiadMo3U'
      WHEN 'cogane-rang' THEN 'https://youtu.be/iAoU1UGPoXc' END)
  AND EXISTS (SELECT 1 FROM portal_profiles p WHERE p.slug=streamerChannel_info.slug
    AND json_extract(p.data,'$.videoKind')='COVER'
    AND json_extract(p.data,'$.videoUrl')=CASE streamerChannel_info.slug
      WHEN 'shizuki-toa' THEN 'https://youtu.be/MZNKiadMo3U'
      WHEN 'cogane-rang' THEN 'https://youtu.be/iAoU1UGPoXc' END);
