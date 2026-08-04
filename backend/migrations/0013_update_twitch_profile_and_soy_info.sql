-- Migration 0013: Update Twitch Streamer Soy (astaril-soy) Profile Image & Description
-- 트위치 프로필 이미지(600x600 고화질) 및 공식 소개글(Bio) 반영

UPDATE streamerChannel_info
SET
  profile_image_url = 'https://static-cdn.jtvnw.net/jtv_user_pictures/64fb4cd6-5b30-4b96-bd5f-926fdd901aaf-profile_image-600x600.png',
  description = 'perhaps a cosmic fairy | duo streamer w/ 🧸 Teddy Bear Prince "Cassis Valerix"',
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'astaril-soy';
