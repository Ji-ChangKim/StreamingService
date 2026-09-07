-- Migration 0024: Add Virtual Debut Streamers for Second Week of September 2026 (2026-09-07 ~ 2026-09-13)
-- 9월 7일 ~ 9월 13일 주간 신규 버추얼 스트리머 7인 추가 (CHZZK, YouTube)

-- ============================================================
-- PART 01: 신규 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name) AS (
  VALUES
  -- 9월 07일 (월)
  ('YOUTUBE', 'https://www.youtube.com/@Amaizawaelu', '天井沢依留'),

  -- 9월 10일 (목)
  ('CHZZK', 'https://chzzk.naver.com/6d2a388447b723033afdcd46197cb00e', '밀루아'),

  -- 9월 12일 (토)
  ('CHZZK', 'https://chzzk.naver.com/383716757f6f467cd9bdfab7b1d6c082', '유메사키 후카'),
  ('YOUTUBE', 'https://www.youtube.com/@Dolly_AMAN005', 'ヤドカリのドリィ'),
  ('YOUTUBE', 'https://www.youtube.com/@mizuno__uta', '音蓮みずの'),
  ('YOUTUBE', 'https://www.youtube.com/@2mty-Mumitsuya6328', 'むみつや'),
  ('YOUTUBE', 'https://www.youtube.com/@nemurairamune', '眠来らむね')
)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT n.platform, n.channel_url, n.channel_name
FROM new_channels AS n
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel AS sc
  WHERE sc.platform = n.platform AND sc.channel_url = n.channel_url
);

-- ============================================================
-- PART 02: 신규 streamerChannel_info 등록 (기본 메타데이터)
-- ============================================================
WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
) AS (
  VALUES
  -- 9월 07일 (월)
  ('YOUTUBE', 'https://www.youtube.com/@Amaizawaelu', 'amaizawaelu', '天井沢依留', '', '天井沢依留의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-07', '18:00', 'Asia/Seoul', '2026-09-07T09:00:00.000Z', 'JP'),

  -- 9월 10일 (목)
  ('CHZZK', 'https://chzzk.naver.com/6d2a388447b723033afdcd46197cb00e', 'milua', '밀루아', '', '밀루아 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-10', '14:00', 'Asia/Seoul', '2026-09-10T05:00:00.000Z', 'KR'),

  -- 9월 12일 (토)
  ('CHZZK', 'https://chzzk.naver.com/383716757f6f467cd9bdfab7b1d6c082', 'yumesaki-fuka', '유메사키 후카', '', '유메사키 후카 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-12', '15:00', 'Asia/Seoul', '2026-09-12T06:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@Dolly_AMAN005', 'yadokari-dolly', 'ヤドカリのドリィ', '', 'ヤドカリのドリィ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-12', '20:00', 'Asia/Seoul', '2026-09-12T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@mizuno__uta', 'mizuno-uta', '音蓮みずの', '', '音蓮みずの의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-12', '21:00', 'Asia/Seoul', '2026-09-12T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@2mty-Mumitsuya6328', 'mumitsuya', 'むみつや', '', 'むみつや의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-12', '21:00', 'Asia/Seoul', '2026-09-12T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@nemurairamune', 'nemurai-ramune', '眠来らむね', '', '眠来らむね의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-12', '23:50', 'Asia/Seoul', '2026-09-12T14:50:00.000Z', 'JP')
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
)
SELECT 
  sc.id, n.slug, n.display_name, n.profile_image_url, n.description, n.agency_name, n.debut_date, n.debut_time, n.timezone, n.start_at_utc, n.country_code
FROM new_infos AS n
INNER JOIN streamerChannel AS sc 
  ON sc.platform = n.platform AND sc.channel_url = n.channel_url
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci
  WHERE sci.channel_id = sc.id OR sci.slug = n.slug
);
