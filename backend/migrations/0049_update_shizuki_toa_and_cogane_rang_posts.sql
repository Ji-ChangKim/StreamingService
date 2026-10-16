-- 시즈키 토아 및 코가네 랑 데뷔 소개글, 상단 배너 이미지 및 공식 커뮤니티 링크 갱신

-- 1. 시즈키 토아 (shizuki-toa)
UPDATE portal_profiles
SET data=json_set(data,
  '$.bannerUrl','https://vdebut.live/images/shizuki-toa-banner.jpg',
  '$.noticeUrl','https://chzzk.naver.com/2299fad4bebb504b0978e1ec08b2f7d3/community/detail/28963605',
  '$.description','스텔라이브 4기 ABYSS ‘시즈키 토아’ 데뷔!
2026년 10월 17일 (토) PM 5:00

드디어 내일!
스텔라이브 4기 ABYSS의 첫 번째 별,
시즈키 토아님의 데뷔가 찾아옵니다!

새로운 별이 빛나기 시작하는 순간!
시즈키 토아님의 첫걸음을 함께 응원해 주세요!'),
  updated_at=CURRENT_TIMESTAMP
WHERE slug='shizuki-toa';

UPDATE streamerChannel_info
SET description='스텔라이브 4기 ABYSS ‘시즈키 토아’ 데뷔!
2026년 10월 17일 (토) PM 5:00

드디어 내일!
스텔라이브 4기 ABYSS의 첫 번째 별,
시즈키 토아님의 데뷔가 찾아옵니다!

새로운 별이 빛나기 시작하는 순간!
시즈키 토아님의 첫걸음을 함께 응원해 주세요!',
  updated_at=CURRENT_TIMESTAMP
WHERE slug='shizuki-toa';

-- 2. 코가네 랑 (cogane-rang)
UPDATE portal_profiles
SET data=json_set(data,
  '$.bannerUrl','https://vdebut.live/images/cogane-rang-banner.jpg',
  '$.description','스텔라이브 4기 ABYSS ‘코가네 랑’ 데뷔!
2026년 10월 17일 (토) PM 6:00

드디어 내일!
스텔라이브 4기 ABYSS의 두 번째 별,
코가네 랑님의 데뷔가 찾아옵니다!

새롭게 빛날 두 번째 별은 과연 어떤 매력을 보여줄까요?

코가네 랑님과 함께할 설레는 첫 만남!
그 특별한 순간을 놓치지 마세요!'),
  updated_at=CURRENT_TIMESTAMP
WHERE slug='cogane-rang';

UPDATE streamerChannel_info
SET description='스텔라이브 4기 ABYSS ‘코가네 랑’ 데뷔!
2026년 10월 17일 (토) PM 6:00

드디어 내일!
스텔라이브 4기 ABYSS의 두 번째 별,
코가네 랑님의 데뷔가 찾아옵니다!

새롭게 빛날 두 번째 별은 과연 어떤 매력을 보여줄까요?

코가네 랑님과 함께할 설레는 첫 만남!
그 특별한 순간을 놓치지 마세요!',
  updated_at=CURRENT_TIMESTAMP
WHERE slug='cogane-rang';
