-- 사용자 제공 공식 커버곡(Overdose)을 하나요 히요리의 대표 영상 및 media 목록으로 등록한다.
-- 단체 PV는 보존하고 개인 커버곡을 featured: true로 media 목록에 추가한다.
-- 검토 기록이 있는 프로필은 검토 스냅샷을 무효화하지 않도록 제외한다.
UPDATE portal_profiles
SET data=json_set(data,
  '$.videoUrl','https://youtu.be/ouKcRBeyKbk',
  '$.videoTitle','데뷔 커버곡 · Overdose (Cover)',
  '$.videoKind','COVER',
  '$.media',json('[{"provider":"YOUTUBE","kind":"COVER","url":"https://youtu.be/ouKcRBeyKbk","title":"Overdose (Cover)","featured":true},{"provider":"YOUTUBE","kind":"GROUP_PV","url":"https://youtu.be/tlCeLkw8Upc","title":"STELLIVE 4th Generation ABYSS PV"}]')),
  updated_at=CURRENT_TIMESTAMP
WHERE slug='hanayo-hiyori'
  AND json_extract(data,'$.agency')='스텔라이브'
  AND json_extract(data,'$.debutGroupId')='stellive-abyss-2026'
  AND json_type(data,'$.contentReview') IS NULL;

-- 기존 관리 화면에서도 동일한 커버곡을 표시한다.
UPDATE streamerChannel_info
SET video_url='https://youtu.be/ouKcRBeyKbk',
  updated_at=CURRENT_TIMESTAMP
WHERE slug='hanayo-hiyori'
  AND agency_name='스텔라이브';
