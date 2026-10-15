-- Migration 0039: Add Stellive 4th Generation 'ABYSS' Virtual Streamers (4 Streamers)
-- 2026년 10월 스텔라이브 4기생 'ABYSS' 치지직 데뷔 스트리머 4인 추가 등록
-- 1. 시즈키 토아 (2026-10-17 17:00 KST)
-- 2. 코가네 랑 (2026-10-17 18:00 KST)
-- 3. 하나요 히요리 (2026-10-18 17:00 KST)
-- 4. 토키노 메리 (2026-10-18 18:00 KST)
-- 치지직 실측 채널 고유 ID, 고화질 프로필 이미지, 공식 X 링크, 공식 PV 영상 및 공식 사이트 URL 연동

-- ============================================================
-- PART 01: 신규 4인 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name) AS (
  VALUES
  ('CHZZK', 'https://chzzk.naver.com/2299fad4bebb504b0978e1ec08b2f7d3', '시즈키 토아'),
  ('CHZZK', 'https://chzzk.naver.com/c657aa3592260a2b59669a72ec151936', '코가네 랑'),
  ('CHZZK', 'https://chzzk.naver.com/49d2c3cf8f0b2843d934ec15e82bb54c', '하나요 히요리'),
  ('CHZZK', 'https://chzzk.naver.com/792acf9ca28b42918710327e14b06b68', '토키노 메리')
)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT n.platform, n.channel_url, n.channel_name
FROM new_channels AS n
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel AS sc
  WHERE sc.platform = n.platform AND sc.channel_url = n.channel_url
);

-- ============================================================
-- PART 02: 신규 4인 streamerChannel_info 세부 정보 등록
-- ============================================================
WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, group_name, video_url, website_url,
  debut_date, debut_time, timezone, start_at_utc, country_code, x_url
) AS (
  VALUES
  (
    'CHZZK',
    'https://chzzk.naver.com/2299fad4bebb504b0978e1ec08b2f7d3',
    'shizuki-toa',
    '시즈키 토아',
    'https://nng-phinf.pstatic.net/MjAyNjEwMTFfMTEg/MDAxNzkxNzA1ODc5NTk1.uOBSzqpGxdfZMkp-lCQTzKJFJq5MvMvemHb9X-tkf6Mg.wI-aCm7PU6GvSDa9i0Dw8-noAlXD4ZiKHHLrQo75Iwog.PNG/image.png',
    '스텔라이브 4기생 ''ABYSS'' 소속 시즈키 토아의 치지직 공식 첫 데뷔 방송입니다.',
    '스텔라이브',
    'ABYSS (4기생)',
    'https://youtu.be/tlCeLkw8Upc',
    'https://stellive.me/news',
    '2026-10-17',
    '17:00',
    'Asia/Seoul',
    '2026-10-17T08:00:00.000Z',
    'KR',
    'https://x.com/ShizukiToa'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/c657aa3592260a2b59669a72ec151936',
    'cogane-rang',
    '코가네 랑',
    'https://nng-phinf.pstatic.net/MjAyNjEwMTFfMjM3/MDAxNzkxNzA1ODY5MjA5.Hugj_v0YBjAf_-tjXp8J4EnY9NesLqrs03AD_uwEDCwg.1OC540ofeGkRMblzh4tKz9J02KIO04Cjp_DjKZIKAUwg.PNG/image.png',
    '스텔라이브 4기생 ''ABYSS'' 소속 코가네 랑의 치지직 공식 첫 데뷔 방송입니다.',
    '스텔라이브',
    'ABYSS (4기생)',
    'https://youtu.be/tlCeLkw8Upc',
    'https://stellive.me/news',
    '2026-10-17',
    '18:00',
    'Asia/Seoul',
    '2026-10-17T09:00:00.000Z',
    'KR',
    'https://x.com/CoganeRang'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/49d2c3cf8f0b2843d934ec15e82bb54c',
    'hanayo-hiyori',
    '하나요 히요리',
    'https://nng-phinf.pstatic.net/MjAyNjEwMTFfNzkg/MDAxNzkxNzA1ODc0MjIx.hDdPLiY5o5Jsikmwc2GcIq5V6zGAT9BKPenPqIR3_7gg.BOPBBvxHuF1OkR54Su1XmlL1D43iZzGXzB5RR3sxYE4g.PNG/image.png',
    '스텔라이브 4기생 ''ABYSS'' 소속 하나요 히요리의 치지직 공식 첫 데뷔 방송입니다.',
    '스텔라이브',
    'ABYSS (4기생)',
    'https://youtu.be/tlCeLkw8Upc',
    'https://stellive.me/news',
    '2026-10-18',
    '17:00',
    'Asia/Seoul',
    '2026-10-18T08:00:00.000Z',
    'KR',
    'https://x.com/HanayoHiyori'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/792acf9ca28b42918710327e14b06b68',
    'tokino-mary',
    '토키노 메리',
    'https://nng-phinf.pstatic.net/MjAyNjEwMTFfMjQw/MDAxNzkxNzA1ODk2NzQy.vIGi1zeV6DS_Hi42aPF6vuo3Y_zBY_rI0lOZgyDsOQwg.FlwYR_ZKhObFk5ikA74tU2vlx_PKGR1Eeo30r8EuXg0g.PNG/image.png',
    '스텔라이브 4기생 ''ABYSS'' 소속 토키노 메리의 치지직 공식 첫 데뷔 방송입니다.',
    '스텔라이브',
    'ABYSS (4기생)',
    'https://youtu.be/tlCeLkw8Upc',
    'https://stellive.me/news',
    '2026-10-18',
    '18:00',
    'Asia/Seoul',
    '2026-10-18T09:00:00.000Z',
    'KR',
    'https://x.com/TokinoMary'
  )
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, group_name, video_url, website_url,
  debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT
  sc.id,
  n.slug,
  n.display_name,
  n.profile_image_url,
  n.description,
  n.agency_name,
  n.group_name,
  n.video_url,
  n.website_url,
  n.debut_date,
  n.debut_time,
  n.timezone,
  n.start_at_utc,
  n.country_code,
  n.x_url
FROM new_infos AS n
JOIN streamerChannel AS sc
  ON sc.platform = n.platform AND sc.channel_url = n.channel_url
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci
  WHERE sci.channel_id = sc.id
);
