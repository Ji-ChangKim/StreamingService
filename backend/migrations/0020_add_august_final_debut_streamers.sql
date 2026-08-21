-- Migration 0020: Add 18 Virtual Debut Streamers for Late August 2026 (2026-08-23 ~ 2026-08-30)

-- ============================================================
-- PART 01: 신규 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name, slug) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/beastrin', '맹수린', 'beastrin'), -- [2026-08-23 14:00] 맹수린
  ('SOOP', 'https://www.sooplive.com/station/cy930221', '율개_', 'yulgae'), -- [2026-08-24 20:00] 율개_
  ('SOOP', 'https://www.sooplive.com/station/warabimochi0', '토모♪', 'tomo'), -- [2026-08-25 13:00] 토모♪
  ('YOUTUBE', 'https://www.youtube.com/@yuyunga', '癒月沙羅🍀ゆゆんが', 'yuzuki-sara'), -- [2026-08-25 20:25] 癒月沙羅
  ('YOUTUBE', 'https://www.youtube.com/channel/UCT0D59ZmybXfae08GiMHSlQ', 'ねむくま まふゆ / Mafuyu Nemukuma', 'nemukuma-mafuyu'), -- [2026-08-25 21:00] ねむくま まふゆ
  ('YOUTUBE', 'https://www.youtube.com/channel/UCx6rTx9V_chxAkn4luzyRpQ', '請叫我披薩 Pinasalia', 'pinasalia'), -- [2026-08-25 21:00] 請叫我披薩 Pinasalia
  ('CHZZK', 'https://chzzk.naver.com/3a5cc666e57aee0eb797a10d6e710fb2', '다번님', 'dabeon'), -- [2026-08-26 14:00] 다번님
  ('CHZZK', 'https://chzzk.naver.com/90d8df90bfb9b2a2a1aaf6a3f09d1221', '0ml 제로미리', '0ml-zeromili'), -- [2026-08-28 12:00] 0ml 제로미리
  ('SOOP', 'https://www.sooplive.com/station/jjrroesem', '슷쟝、', 'seutjyang'), -- [2026-08-28 14:00] 슷쟝、
  ('CHZZK', 'https://chzzk.naver.com/dae941286535b489b5282a8910fb0363', '시노미야 카나', 'shinomiya-kana'), -- [2026-08-28 18:00] 시노미야 카나
  ('CHZZK', 'https://chzzk.naver.com/82e55f09f2235ac3d23c155bf20877de', '김레율 LEYUL', 'kim-leyul'), -- [2026-08-28 20:00] 김레율 LEYUL
  ('CHZZK', 'https://chzzk.naver.com/dac7140d8871c1eb40dfc9dbdbdc4671', '히모리 키코', 'himori-kiko'), -- [2026-08-28 20:00] 히모리 키코
  ('CHZZK', 'https://chzzk.naver.com/8292f415bf4949a508539b1332e059dd', '홍림', 'hongrim'), -- [2026-08-28 20:00] 홍림
  ('SOOP', 'https://www.sooplive.com/station/waekqm', '쿄카_', 'kyoka'), -- [2026-08-29 12:00] 쿄카_
  ('CHZZK', 'https://chzzk.naver.com/3b83140bc120a677646263b51d026fb8', '햅하리 Hepharii', 'hepharii'), -- [2026-08-29 12:00] 햅하리 Hepharii
  ('CHZZK', 'https://chzzk.naver.com/8586c48ff92c6a2c7ba24937d4c360eb', '채루나 LUNA', 'chae-luna'), -- [2026-08-29 15:00] 채루나 LUNA
  ('YOUTUBE', 'https://www.youtube.com/@yoru0310', 'yoru△03:10', 'yoru0310'), -- [2026-08-29 22:00] yoru△03:10
  ('SOOP', 'https://www.sooplive.com/station/default02', '연빛yeonvvit', 'yeonvvit') -- [2026-08-30 14:00] 연빛yeonvvit
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
  ('SOOP', 'https://www.sooplive.com/station/beastrin', 'beastrin', '맹수린', 'https://profile.img.sooplive.co.kr/LOGO/be/beastrin/beastrin.jpg', '맹수린 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-23', '14:00', 'Asia/Seoul', '2026-08-23T05:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/cy930221', 'yulgae', '율개_', 'https://profile.img.sooplive.co.kr/LOGO/cy/cy930221/cy930221.jpg', '율개_ 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-24', '20:00', 'Asia/Seoul', '2026-08-24T11:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/warabimochi0', 'tomo', '토모♪', 'https://profile.img.sooplive.co.kr/LOGO/wa/warabimochi0/warabimochi0.jpg', '토모♪ 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-25', '13:00', 'Asia/Seoul', '2026-08-25T04:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@yuyunga', 'yuzuki-sara', '癒月沙羅🍀ゆゆんが', 'https://yt3.googleusercontent.com/1DvFwUHExxqmtroIWBDegjKg7BS9Mry_XDLbWqJitmCKSjy4ZTg2ibaYhvGOoieRf-n7LGEP2A=s900-c-k-c0x00ffffff-no-rj', 'イラスト動画を制作している癒月沙羅です。モモンガの女の子「ゆゆんが」と一緒に、日常や一次創作を発信しています。', '개인세', '2026-08-25', '20:25', 'Asia/Seoul', '2026-08-25T11:25:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCT0D59ZmybXfae08GiMHSlQ', 'nemukuma-mafuyu', 'ねむくま まふゆ / Mafuyu Nemukuma', 'https://yt3.googleusercontent.com/8rEJVyB0qOUdeBJIQ1cpwgHWr5MK79CZN_OpwWjLf-W7aa952QNE2TdN5Evx4ER7VaVPr9lo=s900-c-k-c0x00ffffff-no-rj', '個人勢┊︎ くまとねこのハーフポンコツ天使Vsinger໒꒱· ﾟ 8월 25일 데뷔✨ mama : 摘星飞鱼 様', '개인세', '2026-08-25', '21:00', 'Asia/Seoul', '2026-08-25T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCx6rTx9V_chxAkn4luzyRpQ', 'pinasalia', '請叫我披薩 Pinasalia', 'https://yt3.googleusercontent.com/g1I-yjW-28oEfg171nul0cCm5_9p0XjGNbZXM5ymlIIUojs6_3IKFGdo5EaE8M5DWNRwR5-DPQ0=s900-c-k-c0x00ffffff-no-rj', '你好！請叫我披薩，希望你今天過的好！', '개인세', '2026-08-25', '21:00', 'Asia/Seoul', '2026-08-25T12:00:00.000Z', 'US'),
  ('CHZZK', 'https://chzzk.naver.com/3a5cc666e57aee0eb797a10d6e710fb2', 'dabeon', '다번님', 'https://nng-phinf.pstatic.net/MjAyNjA4MTZfMTM3/MDAxNzg2ODYyOTk2NTI2.qNOvNrmMICOLSE_CR8ONO0zpcyIAybvux8RmlK04WAAg.Bdt9zOZQkxqL_PlUdCefUyEWzMYZuKqEXDhEFFRtxz8g.PNG/image.png', '다번님 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-26', '14:00', 'Asia/Seoul', '2026-08-26T05:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/90d8df90bfb9b2a2a1aaf6a3f09d1221', '0ml-zeromili', '0ml 제로미리', 'https://nng-phinf.pstatic.net/MjAyNjA2MTRfMTI4/MDAxNzgxNDM4NzY0NDEw.1oQwHG18HvYb2YJkhvg9RbBKiVXdAN36-Lk0r-6nVkwg.csLLADplFXzAYGH7oabedr7aXelpWiAdW6f8JAIi9eUg.JPEG/image.jpg', '8월 28일 오후(낮) 12시 데뷔 예정 메일: g3s4nn@gmail.com', '개인세', '2026-08-28', '12:00', 'Asia/Seoul', '2026-08-28T03:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/jjrroesem', 'seutjyang', '슷쟝、', 'https://profile.img.sooplive.co.kr/LOGO/jj/jjrroesem/jjrroesem.jpg', '슷쟝、 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-28', '14:00', 'Asia/Seoul', '2026-08-28T05:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/dae941286535b489b5282a8910fb0363', 'shinomiya-kana', '시노미야 카나', 'https://nng-phinf.pstatic.net/MjAyNTEyMjBfMTU3/MDAxNzY2MjIzMzA3OTQ1.fGLFXPbDy222nLnwo_zpxpFFvQEWng0gpnUouzzaEd8g.ZKXkkW2fpM3Dst0msddZR6c1um53GaT89WOb0mjORXIg.JPEG/image.jpg', '❗2026년 8월 28일 오후 6시 데뷔❗', '개인세', '2026-08-28', '18:00', 'Asia/Seoul', '2026-08-28T09:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/82e55f09f2235ac3d23c155bf20877de', 'kim-leyul', '김레율 LEYUL', 'https://nng-phinf.pstatic.net/MjAyNTAzMjNfMTM2/MDAxNzQyNzEwMDY4NzEx.S2Hn6yRoBeel1j-_-6MgTRUFgU3ZjT854l96H3PLybIg.ptbUifqkw2JYaZwwg2uMdEIv7BlCNSdBeq9F_DbJ0w4g.PNG/C15DF10A-457D-46EE-A6AE-94389F9D762E-1742710068.png', '[STAR:VERSE] 스타버스 1기생 김레율입니다! ෆ(˶''ᵕ''˶マ⟆ෆ', 'STAR:VERSE', '2026-08-28', '20:00', 'Asia/Seoul', '2026-08-28T11:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/dac7140d8871c1eb40dfc9dbdbdc4671', 'himori-kiko', '히모리 키코', 'https://nng-phinf.pstatic.net/MjAyNjA4MThfNTYg/MDAxNzg2OTk1MjE0NzUw.hhUNRTUdiPXJZW-3TfubZh92HBzwhe3wezs9WxuekIkg.t_PN_pYqIMKNtqyMjdYNnTr93dgjyi3bawGYJ3cOc9cg.JPEG/image.jpg', '방구석 묘큐버스 키코, 드디어 세상과 연결되다! 8월 28일 PM 8시 데뷔! 💻✨ himorikiko@naver.com', '개인세', '2026-08-28', '20:00', 'Asia/Seoul', '2026-08-28T11:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/8292f415bf4949a508539b1332e059dd', 'hongrim', '홍림', 'https://nng-phinf.pstatic.net/MjAyNjA4MTFfMjYy/MDAxNzg2NDU2MjAxNTgz.gl_y0Nd960O3Utle81yyo4BUwDBUDnv59NkyG1irausg.TFJ5cRWHS2c63COrvCSKugJEgl8VKipE2MpWz_J9alUg.PNG/image.png', '🕯️사주 버튜버 홍림🌙 8. 28.(금) PM 08:00 첫 방송', '개인세', '2026-08-28', '20:00', 'Asia/Seoul', '2026-08-28T11:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/waekqm', 'kyoka', '쿄카_', 'https://profile.img.sooplive.co.kr/LOGO/wa/waekqm/waekqm.jpg', '쿄카_ 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-29', '12:00', 'Asia/Seoul', '2026-08-29T03:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/3b83140bc120a677646263b51d026fb8', 'hepharii', '햅하리 Hepharii', 'https://nng-phinf.pstatic.net/MjAyNjA3MDVfMTIz/MDAxNzgzMjQxNjE3ODI2.suWJBK9Rd6-xlU3fAIg3BXye6W0Pus5plZBFeconTEAg.7VM8oZjeTzcpM7ks3c3C-XnDvNIA5wignN4M8k65OVIg.PNG/image.png', '봉봉..🫧', '개인세', '2026-08-29', '12:00', 'Asia/Seoul', '2026-08-29T03:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/8586c48ff92c6a2c7ba24937d4c360eb', 'chae-luna', '채루나 LUNA', 'https://nng-phinf.pstatic.net/MjAyNjA4MjBfMjMz/MDAxNzg3MjIyNTA1ODcx.WZDTT-m7RC-Ro8wUY-qUz2bWQWgBI_kez_jgul31ahog.5iSh9stq6c9XeiNlfNKXafEOAKrzDSReBUlRREKUOgQg.PNG/image.png', '2026.08.29 03:00PM [STAR:VERSE] 스타버스 1기생 채루나입니다아아!!!!', 'STAR:VERSE', '2026-08-29', '15:00', 'Asia/Seoul', '2026-08-29T06:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@yoru0310', 'yoru0310', 'yoru△03:10', 'https://yt3.googleusercontent.com/SmC1yuSiHc7zRqlo0H2CMVWZj4NfoNhJd5fwdtKYZM9RXLITFKrdgLxaTinajfz5gWQ3npbZ=s900-c-k-c0x00ffffff-no-rj', '【yoru△03:10】(よるくん) ハスキーボイス의 크리에이터 Vtuber. きみとまったりチルタイム。お休み前にどうぞ。', '개인세', '2026-08-29', '22:00', 'Asia/Seoul', '2026-08-29T13:00:00.000Z', 'JP'),
  ('SOOP', 'https://www.sooplive.com/station/default02', 'yeonvvit', '연빛yeonvvit', 'https://profile.img.sooplive.co.kr/LOGO/de/default02/default02.jpg', '연빛yeonvvit 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-30', '14:00', 'Asia/Seoul', '2026-08-30T05:00:00.000Z', 'KR')
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
-- PART 03: 기존/신규 스트리머 상세 프로필 및 일정 최신화 UPDATE
-- ============================================================

-- 01. [2026-08-23 14:00] 맹수린 (SOOP)
UPDATE streamerChannel_info
SET display_name = '맹수린',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/be/beastrin/beastrin.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/be/beastrin/beastrin.jpg' ELSE profile_image_url END,
    description = '맹수린 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-23',
    debut_time = '14:00',
    start_at_utc = '2026-08-23T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/beastrin'
);

-- 02. [2026-08-24 20:00] 율개_ (SOOP)
UPDATE streamerChannel_info
SET display_name = '율개_',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/cy/cy930221/cy930221.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/cy/cy930221/cy930221.jpg' ELSE profile_image_url END,
    description = '율개_ 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-24',
    debut_time = '20:00',
    start_at_utc = '2026-08-24T11:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/cy930221'
);

-- 03. [2026-08-25 13:00] 토모♪ (SOOP)
UPDATE streamerChannel_info
SET display_name = '토모♪',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/wa/warabimochi0/warabimochi0.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/wa/warabimochi0/warabimochi0.jpg' ELSE profile_image_url END,
    description = '토모♪ 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-25',
    debut_time = '13:00',
    start_at_utc = '2026-08-25T04:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/warabimochi0'
);

-- 04. [2026-08-25 20:25] 癒月沙羅 (YOUTUBE)
UPDATE streamerChannel_info
SET display_name = '癒月沙羅🍀ゆゆんが',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/1DvFwUHExxqmtroIWBDegjKg7BS9Mry_XDLbWqJitmCKSjy4ZTg2ibaYhvGOoieRf-n7LGEP2A=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/1DvFwUHExxqmtroIWBDegjKg7BS9Mry_XDLbWqJitmCKSjy4ZTg2ibaYhvGOoieRf-n7LGEP2A=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'イラスト動画を制作している癒月沙羅です。モモンガの女の子「ゆゆんが」と一緒に、日常や一次創作を発信しています。',
    debut_date = '2026-08-25',
    debut_time = '20:25',
    start_at_utc = '2026-08-25T11:25:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@yuyunga'
);

-- 05. [2026-08-25 21:00] ねむくま まふゆ (YOUTUBE)
UPDATE streamerChannel_info
SET display_name = 'ねむくま まふゆ / Mafuyu Nemukuma',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/8rEJVyB0qOUdeBJIQ1cpwgHWr5MK79CZN_OpwWjLf-W7aa952QNE2TdN5Evx4ER7VaVPr9lo=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/8rEJVyB0qOUdeBJIQ1cpwgHWr5MK79CZN_OpwWjLf-W7aa952QNE2TdN5Evx4ER7VaVPr9lo=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '個人勢┊︎ くまとねこのハーフポンコツ天使Vsinger໒꒱· ﾟ 8월 25일 데뷔✨ mama : 摘星飞鱼 様',
    debut_date = '2026-08-25',
    debut_time = '21:00',
    start_at_utc = '2026-08-25T12:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/channel/UCT0D59ZmybXfae08GiMHSlQ'
);

-- 06. [2026-08-25 21:00] 請叫我披薩 Pinasalia (YOUTUBE)
UPDATE streamerChannel_info
SET display_name = '請叫我披薩 Pinasalia',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/g1I-yjW-28oEfg171nul0cCm5_9p0XjGNbZXM5ymlIIUojs6_3IKFGdo5EaE8M5DWNRwR5-DPQ0=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/g1I-yjW-28oEfg171nul0cCm5_9p0XjGNbZXM5ymlIIUojs6_3IKFGdo5EaE8M5DWNRwR5-DPQ0=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '你好！請叫我披薩，希望你今天過的好！',
    debut_date = '2026-08-25',
    debut_time = '21:00',
    start_at_utc = '2026-08-25T12:00:00.000Z',
    country_code = 'US'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/channel/UCx6rTx9V_chxAkn4luzyRpQ'
);

-- 07. [2026-08-26 14:00] 다번님 (CHZZK)
UPDATE streamerChannel_info
SET display_name = '다번님',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTZfMTM3/MDAxNzg2ODYyOTk2NTI2.qNOvNrmMICOLSE_CR8ONO0zpcyIAybvux8RmlK04WAAg.Bdt9zOZQkxqL_PlUdCefUyEWzMYZuKqEXDhEFFRtxz8g.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTZfMTM3/MDAxNzg2ODYyOTk2NTI2.qNOvNrmMICOLSE_CR8ONO0zpcyIAybvux8RmlK04WAAg.Bdt9zOZQkxqL_PlUdCefUyEWzMYZuKqEXDhEFFRtxz8g.PNG/image.png' ELSE profile_image_url END,
    description = '다번님 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-26',
    debut_time = '14:00',
    start_at_utc = '2026-08-26T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/3a5cc666e57aee0eb797a10d6e710fb2'
);

-- 08. [2026-08-28 12:00] 0ml 제로미리 (CHZZK)
UPDATE streamerChannel_info
SET display_name = '0ml 제로미리',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA2MTRfMTI4/MDAxNzgxNDM4NzY0NDEw.1oQwHG18HvYb2YJkhvg9RbBKiVXdAN36-Lk0r-6nVkwg.csLLADplFXzAYGH7oabedr7aXelpWiAdW6f8JAIi9eUg.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA2MTRfMTI4/MDAxNzgxNDM4NzY0NDEw.1oQwHG18HvYb2YJkhvg9RbBKiVXdAN36-Lk0r-6nVkwg.csLLADplFXzAYGH7oabedr7aXelpWiAdW6f8JAIi9eUg.JPEG/image.jpg' ELSE profile_image_url END,
    description = '8월 28일 오후(낮) 12시 데뷔 예정 메일: g3s4nn@gmail.com',
    debut_date = '2026-08-28',
    debut_time = '12:00',
    start_at_utc = '2026-08-28T03:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/90d8df90bfb9b2a2a1aaf6a3f09d1221'
);

-- 09. [2026-08-28 14:00] 슷쟝、 (SOOP)
UPDATE streamerChannel_info
SET display_name = '슷쟝、',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/jj/jjrroesem/jjrroesem.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/jj/jjrroesem/jjrroesem.jpg' ELSE profile_image_url END,
    description = '슷쟝、 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-28',
    debut_time = '14:00',
    start_at_utc = '2026-08-28T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/jjrroesem'
);

-- 10. [2026-08-28 18:00] 시노미야 카나 (CHZZK)
UPDATE streamerChannel_info
SET display_name = '시노미야 카나',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNTEyMjBfMTU3/MDAxNzY2MjIzMzA3OTQ1.fGLFXPbDy222nLnwo_zpxpFFvQEWng0gpnUouzzaEd8g.ZKXkkW2fpM3Dst0msddZR6c1um53GaT89WOb0mjORXIg.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNTEyMjBfMTU3/MDAxNzY2MjIzMzA3OTQ1.fGLFXPbDy222nLnwo_zpxpFFvQEWng0gpnUouzzaEd8g.ZKXkkW2fpM3Dst0msddZR6c1um53GaT89WOb0mjORXIg.JPEG/image.jpg' ELSE profile_image_url END,
    description = '❗2026년 8월 28일 오후 6시 데뷔❗',
    debut_date = '2026-08-28',
    debut_time = '18:00',
    start_at_utc = '2026-08-28T09:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/dae941286535b489b5282a8910fb0363'
);

-- 11. [2026-08-28 20:00] 김레율 LEYUL (CHZZK)
UPDATE streamerChannel_info
SET display_name = '김레율 LEYUL',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNTAzMjNfMTM2/MDAxNzQyNzEwMDY4NzEx.S2Hn6yRoBeel1j-_-6MgTRUFgU3ZjT854l96H3PLybIg.ptbUifqkw2JYaZwwg2uMdEIv7BlCNSdBeq9F_DbJ0w4g.PNG/C15DF10A-457D-46EE-A6AE-94389F9D762E-1742710068.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNTAzMjNfMTM2/MDAxNzQyNzEwMDY4NzEx.S2Hn6yRoBeel1j-_-6MgTRUFgU3ZjT854l96H3PLybIg.ptbUifqkw2JYaZwwg2uMdEIv7BlCNSdBeq9F_DbJ0w4g.PNG/C15DF10A-457D-46EE-A6AE-94389F9D762E-1742710068.png' ELSE profile_image_url END,
    description = '[STAR:VERSE] 스타버스 1기생 김레율입니다! ෆ(˶''ᵕ''˶マ⟆ෆ',
    agency_name = 'STAR:VERSE',
    debut_date = '2026-08-28',
    debut_time = '20:00',
    start_at_utc = '2026-08-28T11:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/82e55f09f2235ac3d23c155bf20877de'
);

-- 12. [2026-08-28 20:00] 히모리 키코 (CHZZK)
UPDATE streamerChannel_info
SET display_name = '히모리 키코',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MThfNTYg/MDAxNzg2OTk1MjE0NzUw.hhUNRTUdiPXJZW-3TfubZh92HBzwhe3wezs9WxuekIkg.t_PN_pYqIMKNtqyMjdYNnTr93dgjyi3bawGYJ3cOc9cg.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MThfNTYg/MDAxNzg2OTk1MjE0NzUw.hhUNRTUdiPXJZW-3TfubZh92HBzwhe3wezs9WxuekIkg.t_PN_pYqIMKNtqyMjdYNnTr93dgjyi3bawGYJ3cOc9cg.JPEG/image.jpg' ELSE profile_image_url END,
    description = '방구석 묘큐버스 키코, 드디어 세상과 연결되다! 8월 28일 PM 8시 데뷔! 💻✨ himorikiko@naver.com',
    debut_date = '2026-08-28',
    debut_time = '20:00',
    start_at_utc = '2026-08-28T11:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/dac7140d8871c1eb40dfc9dbdbdc4671'
);

-- 13. [2026-08-28 20:00] 홍림 (CHZZK)
UPDATE streamerChannel_info
SET display_name = '홍림',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTFfMjYy/MDAxNzg2NDU2MjAxNTgz.gl_y0Nd960O3Utle81yyo4BUwDBUDnv59NkyG1irausg.TFJ5cRWHS2c63COrvCSKugJEgl8VKipE2MpWz_J9alUg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTFfMjYy/MDAxNzg2NDU2MjAxNTgz.gl_y0Nd960O3Utle81yyo4BUwDBUDnv59NkyG1irausg.TFJ5cRWHS2c63COrvCSKugJEgl8VKipE2MpWz_J9alUg.PNG/image.png' ELSE profile_image_url END,
    description = '🕯️사주 버튜버 홍림🌙 8. 28.(금) PM 08:00 첫 방송',
    debut_date = '2026-08-28',
    debut_time = '20:00',
    start_at_utc = '2026-08-28T11:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/8292f415bf4949a508539b1332e059dd'
);

-- 14. [2026-08-29 12:00] 쿄카_ (SOOP)
UPDATE streamerChannel_info
SET display_name = '쿄카_',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/wa/waekqm/waekqm.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/wa/waekqm/waekqm.jpg' ELSE profile_image_url END,
    description = '쿄카_ 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-29',
    debut_time = '12:00',
    start_at_utc = '2026-08-29T03:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/waekqm'
);

-- 15. [2026-08-29 12:00] 햅하리 Hepharii (CHZZK)
UPDATE streamerChannel_info
SET display_name = '햅하리 Hepharii',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA3MDVfMTIz/MDAxNzgzMjQxNjE3ODI2.suWJBK9Rd6-xlU3fAIg3BXye6W0Pus5plZBFeconTEAg.7VM8oZjeTzcpM7ks3c3C-XnDvNIA5wignN4M8k65OVIg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA3MDVfMTIz/MDAxNzgzMjQxNjE3ODI2.suWJBK9Rd6-xlU3fAIg3BXye6W0Pus5plZBFeconTEAg.7VM8oZjeTzcpM7ks3c3C-XnDvNIA5wignN4M8k65OVIg.PNG/image.png' ELSE profile_image_url END,
    description = '봉봉..🫧',
    debut_date = '2026-08-29',
    debut_time = '12:00',
    start_at_utc = '2026-08-29T03:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/3b83140bc120a677646263b51d026fb8'
);

-- 16. [2026-08-29 15:00] 채루나 LUNA (CHZZK)
UPDATE streamerChannel_info
SET display_name = '채루나 LUNA',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MjBfMjMz/MDAxNzg3MjIyNTA1ODcx.WZDTT-m7RC-Ro8wUY-qUz2bWQWgBI_kez_jgul31ahog.5iSh9stq6c9XeiNlfNKXafEOAKrzDSReBUlRREKUOgQg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MjBfMjMz/MDAxNzg3MjIyNTA1ODcx.WZDTT-m7RC-Ro8wUY-qUz2bWQWgBI_kez_jgul31ahog.5iSh9stq6c9XeiNlfNKXafEOAKrzDSReBUlRREKUOgQg.PNG/image.png' ELSE profile_image_url END,
    description = '2026.08.29 03:00PM [STAR:VERSE] 스타버스 1기생 채루나입니다아아!!!!',
    agency_name = 'STAR:VERSE',
    debut_date = '2026-08-29',
    debut_time = '15:00',
    start_at_utc = '2026-08-29T06:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/8586c48ff92c6a2c7ba24937d4c360eb'
);

-- 17. [2026-08-29 22:00] yoru△03:10 (YOUTUBE)
UPDATE streamerChannel_info
SET display_name = 'yoru△03:10',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/SmC1yuSiHc7zRqlo0H2CMVWZj4NfoNhJd5fwdtKYZM9RXLITFKrdgLxaTinajfz5gWQ3npbZ=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/SmC1yuSiHc7zRqlo0H2CMVWZj4NfoNhJd5fwdtKYZM9RXLITFKrdgLxaTinajfz5gWQ3npbZ=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '【yoru△03:10】(よるくん) ハスキーボイス의 크리에이터 Vtuber. きみとまったりチルタイム。お休み前にどうぞ。',
    debut_date = '2026-08-29',
    debut_time = '22:00',
    start_at_utc = '2026-08-29T13:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@yoru0310'
);

-- 18. [2026-08-30 14:00] 연빛yeonvvit (SOOP)
UPDATE streamerChannel_info
SET display_name = '연빛yeonvvit',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/de/default02/default02.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/de/default02/default02.jpg' ELSE profile_image_url END,
    description = '연빛yeonvvit 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-30',
    debut_time = '14:00',
    start_at_utc = '2026-08-30T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/default02'
);
