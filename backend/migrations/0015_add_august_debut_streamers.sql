-- Migration 0015: Add and Update 33 Virtual Debut Streamers for Mid-August 2026 (2026-08-10 ~ 2026-08-16)

-- ============================================================
-- PART 01: 기존 DB 존재 3건 스트리머 일정/정보 UPDATE (아노카, 마요이 미아, 먀잉)
-- ============================================================
UPDATE streamerChannel_info
SET debut_date = '2026-08-10',
    debut_time = '20:00',
    start_at_utc = '2026-08-10T11:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel
  WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/5b19828e150f89227aba631755138bd1'
);

UPDATE streamerChannel_info
SET debut_date = '2026-08-14',
    debut_time = '20:00',
    start_at_utc = '2026-08-14T11:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel
  WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/a6fe7b9c3f982b022eba1045ceab8ff2'
);

UPDATE streamerChannel_info
SET debut_date = '2026-08-15',
    debut_time = '14:00',
    start_at_utc = '2026-08-15T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel
  WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/yaaang301'
);

-- ============================================================
-- PART 02: 신규 30건 스트리머 streamerChannel 등록
-- ============================================================
WITH new_channels(platform, channel_url, channel_name, slug) AS (
  VALUES
  -- 2026-08-10
  ('CHZZK', 'https://chzzk.naver.com/cdd4dbee6f87772770a6086966be9f7b', '이브 노스페', 'eve-nosfe'),
  ('CHZZK', 'https://chzzk.naver.com/7f7fb3505f56a686f5cfa91d8e0ea51b', '미이로즈', 'meirose'),
  ('TWITCH', 'https://www.twitch.tv/fuschiatoro', 'Fuschia Toro', 'fuschia-toro'),

  -- 2026-08-11
  ('YOUTUBE', 'https://www.youtube.com/watch?v=kHilQxtwx_M', 'Яua Ch. ルア', 'rua-ch-rua'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=vcBgjChtYWI', '音乃羽 咲妃', 'otoha-saki'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=KAmKvItdMIo', '聖嘯さぽん', 'seisho-sapon'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=kXPTGrdB34Q', '虎音ロウ', 'toraoto-row'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=bfqOaBguYbA', '夢中める', 'muchu-meru'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=hZBegru9bbY', '白黒 Vtuber', 'shirokuro-vtuber'),

  -- 2026-08-13
  ('YOUTUBE', 'https://www.youtube.com/watch?v=Pzs0BU3RWh0', '粉餅きな', 'kinamochi-kina'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=Lq_-x9OIC74', '楓糖', 'fengtang'),

  -- 2026-08-14
  ('SOOP', 'https://www.sooplive.com/station/cbjcmgp33', '달시안', 'dalsian'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=TOIhaCF6wVg', '噛々神 亜恩', 'kamikami-aon'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=9xvC0S-AhRo', '君野こじ', 'kimino-koji'),

  -- 2026-08-15
  ('CHZZK', 'https://chzzk.naver.com/874ff831f4554bd4cb9145ed413952fa', '챠네', 'chane'),
  ('CHZZK', 'https://chzzk.naver.com/b07f0d0c8ce6cd2df924fbaf826c8e8a', '쿠로냥 KURO', 'kuronyang-kuro'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=RdGVRqklvvg', '星存なのか', 'hoshiari-nanoka'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=FXXoJB2EKLU', '上向井えむ', 'kamimukai-emu'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=_Nta9WY3PNs', '甘利まりす', 'amari-marisu'),
  ('CHZZK', 'https://chzzk.naver.com/6a47250024c7d1b1f94627350edf0063', '아무나 나큐', 'amuna-nakyu'),

  -- 2026-08-16
  ('CHZZK', 'https://chzzk.naver.com/bdaffd9c48ead995e0e896e3cb279fe7', '우사아이 레테', 'usaai-rete'),
  ('SOOP', 'https://www.sooplive.com/station/lovelymao2', '진사애', 'jinsae'),
  ('CHZZK', 'https://chzzk.naver.com/4ba42df9007da2610317ea17820ad6b6', '한리오 HANRi5', 'hanrio-hanri5'),
  ('SOOP', 'https://www.sooplive.com/station/nene0722', '네네__', 'nene0722'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=4p-b6RE9te4', '三条レン', 'sanjo-ren'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=i0k1mNh67-I', 'ずん太', 'zunta'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=zgkIZDmQDCE', '氷海月ユキ', 'himi-yuki'),
  ('CHZZK', 'https://chzzk.naver.com/3e46b1cbb1271f1a5595e3b903a445b4', '쿠로 UNDAYS', 'kuro-undays'),
  ('CHZZK', 'https://chzzk.naver.com/7c966483ad8550367e0caaefa7961664', '네오 UNDAYS', 'neo-undays'),
  ('CHZZK', 'https://chzzk.naver.com/01fb5fdd1907813de9d8e52ce0b59d4a', '유노 UNDAYS', 'yuno-undays')
)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT n.platform, n.channel_url, n.channel_name
FROM new_channels AS n
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel AS sc
  WHERE sc.platform = n.platform AND sc.channel_url = n.channel_url
)
AND NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.slug = n.slug
);

-- ============================================================
-- PART 03: 신규 30건 streamerChannel_info 등록
-- ============================================================
WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
) AS (
  VALUES
  -- 2026-08-10
  ('CHZZK', 'https://chzzk.naver.com/cdd4dbee6f87772770a6086966be9f7b', 'eve-nosfe', '이브 노스페', '', '이브 노스페 버추얼 데뷔 방송입니다.', '개인세', '2026-08-10', '20:00', 'Asia/Seoul', '2026-08-10T11:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/7f7fb3505f56a686f5cfa91d8e0ea51b', 'meirose', '미이로즈', '', '미이로즈 버추얼 데뷔 방송입니다.', '개인세', '2026-08-10', '20:00', 'Asia/Seoul', '2026-08-10T11:00:00.000Z', 'KR'),
  ('TWITCH', 'https://www.twitch.tv/fuschiatoro', 'fuschia-toro', 'Fuschia Toro', '', 'Fuschia Toro 버추얼 데뷔 방송입니다.', '개인세', '2026-08-10', '00:00', 'Asia/Seoul', '2026-08-09T15:00:00.000Z', 'US'),

  -- 2026-08-11
  ('YOUTUBE', 'https://www.youtube.com/watch?v=kHilQxtwx_M', 'rua-ch-rua', 'Яua Ch. ルア', '', 'Яua Ch. ルア Virtual Debut Stream.', '개인세', '2026-08-11', '13:00', 'Asia/Tokyo', '2026-08-11T04:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=vcBgjChtYWI', 'otoha-saki', '音乃羽 咲妃', '', '音乃羽 咲妃 Virtual Debut Stream.', '개인세', '2026-08-11', '19:00', 'Asia/Tokyo', '2026-08-11T10:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=KAmKvItdMIo', 'seisho-sapon', '聖嘯さぽん', '', '聖嘯さぽん Virtual Debut Stream.', '개인세', '2026-08-11', '21:00', 'Asia/Tokyo', '2026-08-11T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=kXPTGrdB34Q', 'toraoto-row', '虎音ロウ', '', '虎音ロウ Virtual Debut Stream.', '개인세', '2026-08-11', '21:00', 'Asia/Tokyo', '2026-08-11T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=bfqOaBguYbA', 'muchu-meru', '夢中める', '', '夢中める Virtual Debut Stream.', '개인세', '2026-08-11', '21:00', 'Asia/Tokyo', '2026-08-11T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=hZBegru9bbY', 'shirokuro-vtuber', '白黒 Vtuber', '', '白黒 Vtuber Virtual Debut Stream.', '개인세', '2026-08-11', '22:00', 'Asia/Tokyo', '2026-08-11T13:00:00.000Z', 'JP'),

  -- 2026-08-13
  ('YOUTUBE', 'https://www.youtube.com/watch?v=Pzs0BU3RWh0', 'kinamochi-kina', '粉餅きな', '', '粉餅きな Virtual Debut Stream.', '개인세', '2026-08-13', '19:30', 'Asia/Tokyo', '2026-08-13T10:30:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=Lq_-x9OIC74', 'fengtang', '楓糖', '', '楓糖 Virtual Debut Stream.', '개인세', '2026-08-13', '21:00', 'Asia/Tokyo', '2026-08-13T12:00:00.000Z', 'JP'),

  -- 2026-08-14
  ('SOOP', 'https://www.sooplive.com/station/cbjcmgp33', 'dalsian', '달시안', '', '달시안 버추얼 데뷔 방송입니다.', '개인세', '2026-08-14', '18:00', 'Asia/Seoul', '2026-08-14T09:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=TOIhaCF6wVg', 'kamikami-aon', '噛々神 亜恩', '', '噛々神 亜恩 Virtual Debut Stream.', '개인세', '2026-08-14', '19:00', 'Asia/Tokyo', '2026-08-14T10:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=9xvC0S-AhRo', 'kimino-koji', '君野こじ', '', '君野こじ Virtual Debut Stream.', '개인세', '2026-08-14', '21:00', 'Asia/Tokyo', '2026-08-14T12:00:00.000Z', 'JP'),

  -- 2026-08-15
  ('CHZZK', 'https://chzzk.naver.com/874ff831f4554bd4cb9145ed413952fa', 'chane', '챠네', '', '챠네 버추얼 데뷔 방송입니다.', '개인세', '2026-08-15', '10:00', 'Asia/Seoul', '2026-08-15T01:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/b07f0d0c8ce6cd2df924fbaf826c8e8a', 'kuronyang-kuro', '쿠로냥 KURO', '', '쿠로냥 KURO 버추얼 데뷔 방송입니다.', '개인세', '2026-08-15', '14:00', 'Asia/Seoul', '2026-08-15T05:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=RdGVRqklvvg', 'hoshiari-nanoka', '星存なのか', '', '星存なのか Virtual Debut Stream.', '개인세', '2026-08-15', '18:00', 'Asia/Tokyo', '2026-08-15T09:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=FXXoJB2EKLU', 'kamimukai-emu', '上向井えむ', '', '上向井えむ Virtual Debut Stream.', '개인세', '2026-08-15', '21:00', 'Asia/Tokyo', '2026-08-15T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=_Nta9WY3PNs', 'amari-marisu', '甘利まりす', '', '甘利まりす Virtual Debut Stream.', '개인세', '2026-08-15', '21:00', 'Asia/Tokyo', '2026-08-15T12:00:00.000Z', 'JP'),
  ('CHZZK', 'https://chzzk.naver.com/6a47250024c7d1b1f94627350edf0063', 'amuna-nakyu', '아무나 나큐', '', '아무나 나큐 버추얼 데뷔 방송입니다.', '개인세', '2026-08-15', '00:00', 'Asia/Seoul', '2026-08-14T15:00:00.000Z', 'KR'),

  -- 2026-08-16
  ('CHZZK', 'https://chzzk.naver.com/bdaffd9c48ead995e0e896e3cb279fe7', 'usaai-rete', '우사아이 레테', '', '우사아이 레테 버추얼 데뷔 방송입니다.', '개인세', '2026-08-16', '10:00', 'Asia/Seoul', '2026-08-16T01:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/lovelymao2', 'jinsae', '진사애', '', '진사애 버추얼 데뷔 방송입니다.', '개인세', '2026-08-16', '14:00', 'Asia/Seoul', '2026-08-16T05:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/4ba42df9007da2610317ea17820ad6b6', 'hanrio-hanri5', '한리오 HANRi5', '', '한리오 HANRi5 버추얼 데뷔 방송입니다.', '개인세', '2026-08-16', '15:00', 'Asia/Seoul', '2026-08-16T06:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/nene0722', 'nene0722', '네네__', '', '네네__ 버추얼 데뷔 방송입니다.', '개인세', '2026-08-16', '17:00', 'Asia/Seoul', '2026-08-16T08:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=4p-b6RE9te4', 'sanjo-ren', '三条レン', '', '三条レン Virtual Debut Stream.', '개인세', '2026-08-16', '20:00', 'Asia/Tokyo', '2026-08-16T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=i0k1mNh67-I', 'zunta', 'ずん太', '', 'ずん太 Virtual Debut Stream.', '개인세', '2026-08-16', '21:00', 'Asia/Tokyo', '2026-08-16T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=zgkIZDmQDCE', 'himi-yuki', '氷海月ユキ', '', '氷海月ユキ Virtual Debut Stream.', '개인세', '2026-08-16', '22:00', 'Asia/Tokyo', '2026-08-16T13:00:00.000Z', 'JP'),
  ('CHZZK', 'https://chzzk.naver.com/3e46b1cbb1271f1a5595e3b903a445b4', 'kuro-undays', '쿠로 UNDAYS', '', '쿠로 UNDAYS 버추얼 데뷔 방송입니다.', '개인세', '2026-08-16', '00:00', 'Asia/Seoul', '2026-08-15T15:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/7c966483ad8550367e0caaefa7961664', 'neo-undays', '네오 UNDAYS', '', '네오 UNDAYS 버추얼 데뷔 방송입니다.', '개인세', '2026-08-16', '00:00', 'Asia/Seoul', '2026-08-15T15:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/01fb5fdd1907813de9d8e52ce0b59d4a', 'yuno-undays', '유노 UNDAYS', '', '유노 UNDAYS 버추얼 데뷔 방송입니다.', '개인세', '2026-08-16', '00:00', 'Asia/Seoul', '2026-08-15T15:00:00.000Z', 'KR')
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url, description,
  agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
)
SELECT
  sc.id, ni.slug, ni.display_name, ni.profile_image_url, ni.description,
  ni.agency_name, ni.debut_date, ni.debut_time, ni.timezone, ni.start_at_utc, ni.country_code
FROM new_infos AS ni
INNER JOIN streamerChannel AS sc
  ON sc.platform = ni.platform AND sc.channel_url = ni.channel_url
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.slug = ni.slug
)
AND NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.channel_id = sc.id
);
