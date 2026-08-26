-- Migration 0021: Update and Add Virtual Debut Streamers for Late August 2026 (2026-08-26 ~ 2026-08-31)
-- 1. 토모♪ 데뷔 일정 시간 변경 (8/25 13:00 -> 8/26 13:00 KST)
-- 2. 모냐?(SOOP), 잘님(CHZZK) 및 일본/글로벌 유튜브 신규 스트리머 22인 추가

-- ============================================================
-- PART 01: 신규 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name, slug) AS (
  VALUES
  -- 8월 26일 (수)
  ('YOUTUBE', 'https://www.youtube.com/@nagiri_ryune', '凪璃リュネ', 'nagiri-ryune'),
  ('YOUTUBE', 'https://www.youtube.com/@kaguha_suzume', '赫羽すずめ', 'kaguha-suzume'),
  ('YOUTUBE', 'https://www.youtube.com/@yomori_hana', '宵守はな', 'yomori-hana'),
  ('YOUTUBE', 'https://www.youtube.com/@monbelma', '門ベルマ', 'monbelma'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCrGyguoym8eIa-1RYDoBwhA', '尾咲いずな', 'osaki-izuna'),
  -- 8월 27일 (목)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCPqpVes-qY123mJ-4HuMV0w', '可惜夜ろむ', 'atarayo-romu'),
  ('YOUTUBE', 'https://www.youtube.com/@SayoTsukina', '紗夜ツキナ', 'sayo-tsukina'),
  -- 8월 28일 (금)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCd06jUO_R0Ow34ivhHFurtw', '夕涼伊月', 'yusuzumi-iduki'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC4toMlO9gcVq13u2J7FwnUQ', 'ワドさん', 'wadosan'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC7KnnBYCYEkwt_iL0hRNZEg', '花埜いろは', 'hanano-iroha'),
  -- 8월 29일 (토)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCAYLF5eyxn0hxdRvkKdpWCA', '紫陽すの', 'shiyo-suno'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCuMX4dTLQ9QvIneOGQciGXQ', '乃愛ちゃん', 'noachan'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC2zS1jTYPnXzt0g3KMSDMFg', '愛妹ちこら', 'aimo-chikora'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCDjiYmrGfcZLBRhv4JdUDEw', '拝啓ノア', 'haikei-noa'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCtwpDkzB6vP2iRvXizhYbOw', '結束かなで', 'kessoku-kanade'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCmDozJqKH7vYoiyHDY3MRJw', '柴田あん', 'shibata-an'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCByrtcbQIyZuAFionmv0iTQ', 'タダまる。', 'tadamaru'),
  -- 8월 30일 (일)
  ('SOOP', 'https://www.sooplive.com/station/withsleep', '모냐?', 'withsleep'),
  ('CHZZK', 'https://chzzk.naver.com/c63f8c12f6d0178457b82413d45efd5a', '잘님', 'zalnim'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCeDid7S1B971buJqXU9frGw', '散雲ヒユメ', 'chirigumo-hiyume'),
  -- 8월 31일 (월)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCpQje3p1s3BiPEp3MVm76hQ', 'ガチ経営者VTuber組長', 'kumicho'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCpyHqDwJteNDblJ2tHtTXuA', '月深夜冥夜', 'tsukimi-meiya')
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
  -- 8월 26일 (수)
  ('YOUTUBE', 'https://www.youtube.com/@nagiri_ryune', 'nagiri-ryune', '凪璃リュネ', '', '凪璃リュネ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-26', '19:00', 'Asia/Seoul', '2026-08-26T10:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@kaguha_suzume', 'kaguha-suzume', '赫羽すずめ', '', '赫羽すずめ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-26', '19:30', 'Asia/Seoul', '2026-08-26T10:30:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@yomori_hana', 'yomori-hana', '宵守はな', '', '宵守はな의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-26', '20:00', 'Asia/Seoul', '2026-08-26T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@monbelma', 'monbelma', '門ベルマ', '', '門ベルマ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-26', '20:30', 'Asia/Seoul', '2026-08-26T11:30:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCrGyguoym8eIa-1RYDoBwhA', 'osaki-izuna', '尾咲いずな', '', '尾咲いずな의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-26', '22:00', 'Asia/Seoul', '2026-08-26T13:00:00.000Z', 'JP'),

  -- 8월 27일 (목)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCPqpVes-qY123mJ-4HuMV0w', 'atarayo-romu', '可惜夜ろむ', '', '可惜夜ろむ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-27', '19:00', 'Asia/Seoul', '2026-08-27T10:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@SayoTsukina', 'sayo-tsukina', '紗夜ツキナ', '', '紗夜ツキナ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-27', '21:00', 'Asia/Seoul', '2026-08-27T12:00:00.000Z', 'JP'),

  -- 8월 28일 (금)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCd06jUO_R0Ow34ivhHFurtw', 'yusuzumi-iduki', '夕涼伊月', '', '夕涼伊月의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-28', '21:00', 'Asia/Seoul', '2026-08-28T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC4toMlO9gcVq13u2J7FwnUQ', 'wadosan', 'ワドさん', '', 'ワドさん의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-28', '21:00', 'Asia/Seoul', '2026-08-28T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC7KnnBYCYEkwt_iL0hRNZEg', 'hanano-iroha', '花埜いろは', '', '花埜いろは의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-28', '22:00', 'Asia/Seoul', '2026-08-28T13:00:00.000Z', 'JP'),

  -- 8월 29일 (토)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCAYLF5eyxn0hxdRvkKdpWCA', 'shiyo-suno', '紫陽すの', '', '紫陽すの의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-29', '18:00', 'Asia/Seoul', '2026-08-29T09:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCuMX4dTLQ9QvIneOGQciGXQ', 'noachan', '乃愛ちゃん', '', '乃愛ちゃん의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-29', '20:00', 'Asia/Seoul', '2026-08-29T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC2zS1jTYPnXzt0g3KMSDMFg', 'aimo-chikora', '愛妹ちこら', '', '愛妹ちこら의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-29', '20:00', 'Asia/Seoul', '2026-08-29T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCDjiYmrGfcZLBRhv4JdUDEw', 'haikei-noa', '拝啓ノア', '', '拝啓ノア의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-29', '20:00', 'Asia/Seoul', '2026-08-29T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCtwpDkzB6vP2iRvXizhYbOw', 'kessoku-kanade', '結束かなで', '', '結束かなで의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-29', '21:00', 'Asia/Seoul', '2026-08-29T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCmDozJqKH7vYoiyHDY3MRJw', 'shibata-an', '柴田あん', '', '柴田あん의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-29', '22:00', 'Asia/Seoul', '2026-08-29T13:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCByrtcbQIyZuAFionmv0iTQ', 'tadamaru', 'タダまる。', '', 'タダまる。의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-29', '22:15', 'Asia/Seoul', '2026-08-29T13:15:00.000Z', 'JP'),

  -- 8월 30일 (일)
  ('SOOP', 'https://www.sooplive.com/station/withsleep', 'withsleep', '모냐?', 'https://profile.img.sooplive.co.kr/LOGO/wi/withsleep/withsleep.jpg', '모냐? 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-30', '10:00', 'Asia/Seoul', '2026-08-30T01:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/c63f8c12f6d0178457b82413d45efd5a', 'zalnim', '잘님', 'https://nng-phinf.pstatic.net/MjAyNjA3MzFfMTA1/MDAxNzg1NDk5MTc5ODg1.h9U0UH61oS6e10DviuzVGhw5YChkdkr1SRlF6JEvD60g.HzySnv3x8vCGwgo81ufux9oUBqj-rPno0CpuhpZWockg.PNG/image.png', '네 마음을 이해하고 싶은 창조의 여신. 토크, 타로, 그림, 게임! *데뷔방송- 2026년 8월30일 낮3시 문의: tokuhane@gmail.com', '개인세', '2026-08-30', '15:00', 'Asia/Seoul', '2026-08-30T06:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCeDid7S1B971buJqXU9frGw', 'chirigumo-hiyume', '散雲ヒユメ', '', '散雲ヒユメ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-30', '21:00', 'Asia/Seoul', '2026-08-30T12:00:00.000Z', 'JP'),

  -- 8월 31일 (월)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCpQje3p1s3BiPEp3MVm76hQ', 'kumicho', 'ガチ経営者VTuber組長', '', 'ガチ経営者VTuber組長의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-31', '20:00', 'Asia/Seoul', '2026-08-31T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCpyHqDwJteNDblJ2tHtTXuA', 'tsukimi-meiya', '月深夜冥夜', '', '月深夜冥夜의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-31', '23:00', 'Asia/Seoul', '2026-08-31T14:00:00.000Z', 'JP')
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
)
SELECT
  sc.id,
  n.slug,
  n.display_name,
  n.profile_image_url,
  n.description,
  n.agency_name,
  n.debut_date,
  n.debut_time,
  n.timezone,
  n.start_at_utc,
  n.country_code
FROM new_infos AS n
JOIN streamerChannel AS sc
  ON sc.platform = n.platform AND sc.channel_url = n.channel_url
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci
  WHERE sci.channel_id = sc.id
);

-- ============================================================
-- PART 03: 기존 토모♪ 일정 시간 변경 UPDATE
-- ============================================================
UPDATE streamerChannel_info
SET debut_date = '2026-08-26',
    debut_time = '13:00',
    start_at_utc = '2026-08-26T04:00:00.000Z'
WHERE channel_id IN (
  SELECT id FROM streamerChannel 
  WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/warabimochi0'
);
