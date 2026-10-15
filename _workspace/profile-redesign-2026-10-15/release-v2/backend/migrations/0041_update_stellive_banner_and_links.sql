-- 스텔라이브 4기 ABYSS 네 명의 상단 배너·공식 홈페이지·공식 카페만 갱신한다.
-- 첨부 배너 원본은 frontend/public/images/stellive-common-banner.jpg에 보존한다.
UPDATE portal_profiles
SET data=json_set(data,
  '$.bannerUrl','https://vdebut.live/images/stellive-common-banner.jpg',
  '$.websiteUrl','https://stellive.me/',
  '$.cafeUrl','https://cafe.naver.com/tteokbokk1/'),
  updated_at=CURRENT_TIMESTAMP
WHERE slug IN ('shizuki-toa','cogane-rang','hanayo-hiyori','tokino-mary')
  AND json_extract(data,'$.debutGroupId')='stellive-abyss-2026';

-- 기존 관리 화면의 공식 홈페이지 표시도 같은 메인 주소로 맞춘다.
UPDATE streamerChannel_info
SET website_url='https://stellive.me/',updated_at=CURRENT_TIMESTAMP
WHERE slug IN ('shizuki-toa','cogane-rang','hanayo-hiyori','tokino-mary')
  AND agency_name='스텔라이브';
