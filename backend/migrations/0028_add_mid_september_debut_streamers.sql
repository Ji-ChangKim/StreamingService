-- Migration 0028: Add and Update Mid-September 2026 Virtual Debut Streamers (2026-09-16 ~ 2026-09-20)
-- 1. 이루 (SOOP arong0106) 활동명 및 프로필 최신화 UPDATE (김깍마기 -> 이루)
-- 2. 신규 스트리머 6인 추가 등록 (김멜트, Astera, 순진, 피요냥, 세르온, 신예리)
--    - 피요냥, 세르온: 시간 미정 (00:00 및 [시간 미정] 플래그 처리)
--    - 세르온: 소속사 '노블리주' 반영
--    - Astera: 소속사 'Astera' 반영
-- 3. 덕고미: Migration 0023에 이미 등록 완료 (상태 유지)

-- ============================================================
-- PART 01: 기존 이루 (SOOP arong0106) 채널 및 프로필 정보 최신화 UPDATE
-- ============================================================
UPDATE streamerChannel
SET channel_name = '이루'
WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/arong0106';

UPDATE streamerChannel_info
SET display_name = '이루',
    slug = 'eroo-soop',
    description = '[웰컴버추얼] 이루의 공식 SOOP 데뷔 방송입니다.',
    debut_date = '2026-09-16',
    debut_time = '12:00',
    start_at_utc = '2026-09-16T03:00:00.000Z',
    country_code = 'KR',
    updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT id FROM streamerChannel
  WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/arong0106'
);

-- ============================================================
-- PART 02: 신규 6인 스트리머 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name) AS (
  VALUES
  -- 9월 18일 (금)
  ('CHZZK', 'https://chzzk.naver.com/eedbee523b1c059ce1d563ddfc095e3a', '김멜트'),
  ('CHZZK', 'https://chzzk.naver.com/bda8a35d632c749407a80c23d0012798', 'Astera'),

  -- 9월 19일 (토)
  ('CHZZK', 'https://chzzk.naver.com/2be01a76b2e74bfc2d194f5944db0414', '순진'),
  ('CHZZK', 'https://chzzk.naver.com/28b25f53d292ebaad02e18753d26c70b', '피요냥'),
  ('CHZZK', 'https://chzzk.naver.com/536bbb09bd3959aac89d5090b579394d', '세르온'),

  -- 9월 20일 (일)
  ('CHZZK', 'https://chzzk.naver.com/121b621b0ca0c57539c8dd2d582a9e17', '신예리')
)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT n.platform, n.channel_url, n.channel_name
FROM new_channels AS n
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel AS sc
  WHERE sc.platform = n.platform AND sc.channel_url = n.channel_url
);

-- ============================================================
-- PART 03: 신규 6인 스트리머 streamerChannel_info 등록 (기본 메타데이터 및 미정 플래그)
-- ============================================================
WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
) AS (
  VALUES
  -- 9월 18일 (금)
  (
    'CHZZK',
    'https://chzzk.naver.com/eedbee523b1c059ce1d563ddfc095e3a',
    'kim-melt',
    '김멜트',
    'https://nng-phinf.pstatic.net/MjAyNjAzMDlfNDEg/MDAxNzcyOTg1MDg0MDM5.lhqjiXFBDUbZwIe3FKH5rsskNjql4tie-acCMqUErNIg.xag1JIW6jnF-nALfpLPsp5zJAyK9rw2VT332-iksJiUg.PNG/image.png',
    '김멜트 버추얼 스트리머의 첫 데뷔 방송입니다.',
    '개인세',
    '2026-09-18',
    '14:00',
    'Asia/Seoul',
    '2026-09-18T05:00:00.000Z',
    'KR'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/bda8a35d632c749407a80c23d0012798',
    'astera',
    'Astera',
    'https://nng-phinf.pstatic.net/MjAyNTA4MjdfODkg/MDAxNzU2Mjc3MjQxMDY5.lZpFajq-p7poT7E3KeM0fn8_VNiCK_UmpcnXUveFUzog.-fzPrnPYD5mvP2H8WV6ikkDgxeNqTPFuPczZvDVkR20g.PNG/B97903C8-D6EA-429B-93EE-7DB1C3A6D307-1756277236.png',
    '버추얼 MCN 대표 Astera의 공식 스트리머 데뷔 방송입니다.',
    'Astera',
    '2026-09-18',
    '19:00',
    'Asia/Seoul',
    '2026-09-18T10:00:00.000Z',
    'KR'
  ),

  -- 9월 19일 (토)
  (
    'CHZZK',
    'https://chzzk.naver.com/2be01a76b2e74bfc2d194f5944db0414',
    'soonjin',
    '순진',
    'https://nng-phinf.pstatic.net/MjAyNjA5MTJfNDEg/MDAxNzg5MjE3NjQ1MjI4.kqmB0pMszBx6zLMiXc9AERH-lBpA_E33Q630UkAc64cg.MRIFUuFnUWGEaeJMCnD871Ca68M9Pkt4UN0XiubYIUAg.JPEG/image.jpg',
    '순진 버추얼 스트리머의 공식 치지직 첫 데뷔 방송입니다.',
    '개인세',
    '2026-09-19',
    '19:00',
    'Asia/Seoul',
    '2026-09-19T10:00:00.000Z',
    'KR'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/28b25f53d292ebaad02e18753d26c70b',
    'piyonyang',
    '피요냥',
    'https://nng-phinf.pstatic.net/MjAyNjA4MjZfMjg1/MDAxNzg3NzIzMjUyODI5.KBJMGvtSYZ_W0VMVxbeQdgGw9TB6JEnXd_C3e_RCRSsg.vKSVCnrCTyeQOPy1Vq7gKSqh6aLaljNhE4gnIDQ5kmsg.PNG/image.png',
    '[시간 미정] 알에서 태어난 고양이 피요냥의 공식 데뷔 방송입니다.',
    '개인세',
    '2026-09-19',
    '00:00',
    'Asia/Seoul',
    '2026-09-18T15:00:00.000Z',
    'KR'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/536bbb09bd3959aac89d5090b579394d',
    'sereon',
    '세르온',
    'https://nng-phinf.pstatic.net/MjAyNjA5MDVfMjk4/MDAxNzg4NjE2Njg5OTAz.XVrAMVv1PF8H0nDnNAVz_gH4zifpLfhJeqX0n_4xHSgg.4uUMMxkPoHpFHIft2BPjL_Z1h7xRGk6idMN_iYsX8xog.PNG/image.png',
    '[시간 미정] 노블리주 소속 세르온 버추얼 스트리머의 공식 데뷔 방송입니다.',
    '노블리주',
    '2026-09-19',
    '00:00',
    'Asia/Seoul',
    '2026-09-18T15:00:00.000Z',
    'KR'
  ),

  -- 9월 20일 (일)
  (
    'CHZZK',
    'https://chzzk.naver.com/121b621b0ca0c57539c8dd2d582a9e17',
    'shin-yeri',
    '신예리',
    'https://nng-phinf.pstatic.net/MjAyNjA5MDRfMjcz/MDAxNzg4NDg3ODY0MzI0.iR3Ibqt_BhqvvVTHaAnHG20OfaFn7QX9K6NVcnIVr8og.4JXyEKHdMBs2LXhLbZFeLvPnm98nEVR5tD1MKkXSiX0g.PNG/image.png',
    '신예리 버추얼 스트리머의 공식 데뷔 방송입니다.',
    '개인세',
    '2026-09-20',
    '20:00',
    'Asia/Seoul',
    '2026-09-20T11:00:00.000Z',
    'KR'
  )
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
