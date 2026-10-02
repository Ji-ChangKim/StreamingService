-- Migration 0033: Add Crawled October & Autumn Debut Streamers (streamerChannel & streamerChannel_info)
-- 1. 디니야 (2026-10-08 20:00 KST)
-- 2. 말리부 (2026-12-01 17:30 KST)
-- 3. 연새늘 (2026-09-26 15:00 KST)
-- 4. 묘콩 (2026-09-01 20:00 KST)
-- 5. 이로지 (2026-08-28 20:00 KST)

-- ============================================================
-- PART 01: streamerChannel 상위 테이블 등록 (중복 방지)
-- ============================================================

-- 1. 디니야 (CHZZK)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT 'CHZZK', 'https://chzzk.naver.com/0767c32a8503a0db37c77f046ec7f5da', '디니야'
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/0767c32a8503a0db37c77f046ec7f5da'
);

-- 2. 말리부 (CHZZK)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT 'CHZZK', 'https://chzzk.naver.com/e4ae5646d01063022591e26bb81106cf', 'maliboo 말리부'
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/e4ae5646d01063022591e26bb81106cf'
);

-- 3. 연새늘 (CHZZK)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT 'CHZZK', 'https://chzzk.naver.com/db8c2f4b478e9aaca4a42a45e5e89b7f', '연새늘'
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/db8c2f4b478e9aaca4a42a45e5e89b7f'
);

-- 4. 묘콩 (CHZZK)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT 'CHZZK', 'https://chzzk.naver.com/97b09e7339672765e646f60a3446d9c4', '묘콩'
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/97b09e7339672765e646f60a3446d9c4'
);

-- 5. 이로지 (CHZZK)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT 'CHZZK', 'https://chzzk.naver.com/e3e50ec6c85c2a286c32acd6da83b697', '이로지'
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/e3e50ec6c85c2a286c32acd6da83b697'
);

-- ============================================================
-- PART 02: streamerChannel_info 하위 테이블 등록 (프로필, 일정, UTC)
-- ============================================================

-- 1. 디니야
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT
  sc.id,
  'diniya',
  '디니야',
  'https://nng-phinf.pstatic.net/MjAyNjAxMjhfMjc3/MDAxNzY5NTI3NjQwNDcw.0Ms8IrD_UcHNcG5PidyZXJpN6EAjDxMxGwY1vYu6S3cg.gXK5UPkVA5gQnQ18CC4AgMMwq24tdbMYQ1fN_7GqEtUg.PNG/image.png',
  '우주에서 온 돌연변이 공룡 버추얼 스트리머 디니야의 2.0 데뷔 방송입니다.',
  '개인세',
  '2026-10-08',
  '20:00',
  'Asia/Seoul',
  '2026-10-08T11:00:00.000Z',
  'KR',
  'https://x.com/diniya_0802'
FROM streamerChannel sc
WHERE sc.platform = 'CHZZK'
  AND sc.channel_url = 'https://chzzk.naver.com/0767c32a8503a0db37c77f046ec7f5da'
  AND NOT EXISTS (
    SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id
  );

-- 2. 말리부
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT
  sc.id,
  'maliboo',
  '말리부',
  'https://nng-phinf.pstatic.net/MjAyNTExMTRfMTUg/MDAxNzYzMTE4MTIxNDEx.SLh_FEkWG1lnMDVfr891rl-hQNb94LoEimNBCkHKiUIg.LzoT_PSao5COCNlrk0yuMP6cIX7-soI8fwJJ6H-DD_Ag.JPEG/image.jpg',
  '말리부 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
  '개인세',
  '2026-12-01',
  '17:30',
  'Asia/Seoul',
  '2026-12-01T08:30:00.000Z',
  'KR',
  'https://x.com/malliboochzz'
FROM streamerChannel sc
WHERE sc.platform = 'CHZZK'
  AND sc.channel_url = 'https://chzzk.naver.com/e4ae5646d01063022591e26bb81106cf'
  AND NOT EXISTS (
    SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id
  );

-- 3. 연새늘
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT
  sc.id,
  'yeon-saeneul',
  '연새늘',
  'https://nng-phinf.pstatic.net/MjAyNjA1MjlfMjA5/MDAxNzc5OTg3MTE4MTY0.MNNDLK6R6sptMS26dEJooILZ72TvAEYWY_pewjBcGjog.AwcB1fFDzthdRd3zBQmUuuyjqS6adv4E529tBztHGqIg.PNG/image.png',
  '롭이어 토끼 버추얼 스트리머 연새늘의 1.0 데뷔 방송입니다.',
  '개인세',
  '2026-09-26',
  '15:00',
  'Asia/Seoul',
  '2026-09-26T06:00:00.000Z',
  'KR',
  'https://x.com/_Cloud_village'
FROM streamerChannel sc
WHERE sc.platform = 'CHZZK'
  AND sc.channel_url = 'https://chzzk.naver.com/db8c2f4b478e9aaca4a42a45e5e89b7f'
  AND NOT EXISTS (
    SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id
  );

-- 4. 묘콩
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT
  sc.id,
  'myokong',
  '묘콩',
  'https://nng-phinf.pstatic.net/MjAyNjA4MTFfMTgx/MDAxNzg2NDI4NTQ2NzYx.sEEKgD7MS6o6g6nnA1rFqyzHz3OPXlQ_rHcuijG6yhkg.EQFBTjcpRRaWzOC2w4MAXcqjQOYRjzzoczqNI1m8abQg.PNG/image.png',
  '그림을 좋아하는 집고양이 버추얼 스트리머 묘콩의 공식 데뷔 방송입니다.',
  '개인세',
  '2026-09-01',
  '20:00',
  'Asia/Seoul',
  '2026-09-01T11:00:00.000Z',
  'KR',
  'https://x.com/myokong_'
FROM streamerChannel sc
WHERE sc.platform = 'CHZZK'
  AND sc.channel_url = 'https://chzzk.naver.com/97b09e7339672765e646f60a3446d9c4'
  AND NOT EXISTS (
    SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id
  );

-- 5. 이로지
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT
  sc.id,
  'leerosy',
  '이로지',
  'https://nng-phinf.pstatic.net/MjAyNjA5MTNfMTI3/MDAxNzg5MjQyMjE4MDcx.iswSZaBGjYg7-a5cFOYHr8C-t48HrgxutMRpCwmvYe8g.JgnZWAqdnopnp5WWXED0sOLxj0ZF8D-XtnasqY_Wxgkg.PNG/image.png',
  '랩하는 장미 버추얼 스트리머 이로지의 공식 데뷔 방송입니다.',
  '개인세',
  '2026-08-28',
  '20:00',
  'Asia/Seoul',
  '2026-08-28T11:00:00.000Z',
  'KR',
  'https://x.com/R0S3_0325'
FROM streamerChannel sc
WHERE sc.platform = 'CHZZK'
  AND sc.channel_url = 'https://chzzk.naver.com/e3e50ec6c85c2a286c32acd6da83b697'
  AND NOT EXISTS (
    SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id
  );
