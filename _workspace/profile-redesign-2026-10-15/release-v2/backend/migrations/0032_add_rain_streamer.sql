-- Migration 0032: Add Virtual Streamer Rain Debut Schedule (2026-10-01 01:30 KST)
-- 신규 버추얼 스트리머 래인(rain) 추가 등록
-- 1. CHZZK 플랫폼 등록
-- 2. 단축 URL(https://chzzk.me/uyuZE) ➔ 치지직 정식 32자리 고유 채널 URL(https://chzzk.naver.com/38d0d61a16ff26a21cc33e4bcc451b3c) 치환
-- 3. 고화질 프로필 아바타, 공식 X(트위터) 링크, KST/UTC 시각 반영

-- ============================================================
-- PART 01: 신규 streamerChannel 등록 (중복 방지)
-- ============================================================
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT 'CHZZK', 'https://chzzk.naver.com/38d0d61a16ff26a21cc33e4bcc451b3c', '래인 rain'
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel
  WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/38d0d61a16ff26a21cc33e4bcc451b3c'
);

-- ============================================================
-- PART 02: 신규 streamerChannel_info 등록 (프로필, X 링크, UTC 시각)
-- ============================================================
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT
  sc.id,
  'rain',
  '래인',
  'https://nng-phinf.pstatic.net/MjAyNjA5MDhfMjQ5/MDAxNzg4ODQ5NzAyNzY1.ygsF9hQly_3_3wkZsOdXOkVxGxkE8-J8KnSM8gj6S24g.Kvv8xWmx1RT-hDscnWXJIjMiZB_j1xNlKLcl-9YDJXEg.JPEG/image.jpg',
  '래인 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
  '개인세',
  '2026-10-01',
  '01:30',
  'Asia/Seoul',
  '2026-09-30T16:30:00.000Z',
  'KR',
  'https://x.com/rain0tt'
FROM streamerChannel sc
WHERE sc.platform = 'CHZZK'
  AND sc.channel_url = 'https://chzzk.naver.com/38d0d61a16ff26a21cc33e4bcc451b3c'
  AND NOT EXISTS (
    SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id
  );
