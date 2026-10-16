-- 사용자 지정 정확한 커버곡 제목으로 하나요 히요리 및 토키노 메리 정보 갱신
UPDATE portal_profiles
SET data=json_set(data,
  '$.videoTitle','유령이 되고싶어 [ゆうれいになりたい / 유이카] / 하나요 히요리 (Hanayo Hiyori) Cover',
  '$.media[0].title','유령이 되고싶어 [ゆうれいになりたい / 유이카] / 하나요 히요리 (Hanayo Hiyori) Cover'),
  updated_at=CURRENT_TIMESTAMP
WHERE slug='hanayo-hiyori';

UPDATE portal_profiles
SET data=json_set(data,
  '$.videoTitle','도쿄 테디베어 [東京テディベア l Neru] / 토키노 메리 (Tokino Mary) Cover',
  '$.media[0].title','도쿄 테디베어 [東京テディベア l Neru] / 토키노 메리 (Tokino Mary) Cover'),
  updated_at=CURRENT_TIMESTAMP
WHERE slug='tokino-mary';
