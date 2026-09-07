-- Migration 0023: Add Virtual Debut Streamers for Mid to Late September 2026 (2026-09-04 ~ 2026-09-28)
-- 1. 9월 4일 ~ 9월 28일 신규 버추얼 스트리머 34인 추가 (CHZZK, SOOP, YouTube)
-- 2. 緋桜なこ 데뷔 일시 UPDATE (2026-09-01 -> 2026-09-04 21:00 KST)

-- ============================================================
-- PART 01: 신규 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name) AS (
  VALUES
  -- 9월 04일 (금)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCW8Hb9gMstqPBFkuLZ-yxOw', '蛇足乃わらじ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCL2sgsThTM9kWQZieKeAFFA', '皆那之ひいろ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC2Sj14Lm-k1vq5qukQovRig', '牛羽しう'),
  ('YOUTUBE', 'https://www.youtube.com/@兎丸流人', '兎丸流人'),

  -- 9월 05일 (토)
  ('CHZZK', 'https://chzzk.naver.com/3c24762b6c5d9824a0619353de3c759f', '청 휘'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCgGqn3ACz5mdaYsFfQkCGKQ', 'もるん。'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCFKZyJaUwKCunwqVgIVpHog', '夜護シユウ'),
  ('CHZZK', 'https://chzzk.naver.com/52479500ce35018d8e730c6feab1ca0f', '에루 AERU'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCRiAISV9_WJlKUlYTmHn4SQ', '一くぉ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCnQx1rdKYv1o07_bUjDOcQg', '反井'),

  -- 9월 06일 (일)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCKbtcOmJc0_m6Szm72WPq9A', 'エルヴェ'),

  -- 9월 07일 (월)
  ('YOUTUBE', 'https://www.youtube.com/channel/UC6gtJE_ZRXkagU4g_ewB2FQ', '狗乃わん'),
  ('SOOP', 'https://www.sooplive.com/station/22sharii22', '이샤리×'),

  -- 9월 09일 (수)
  ('SOOP', 'https://www.sooplive.com/station/jeongmillyu', '정밀류'),
  ('SOOP', 'https://www.sooplive.com/station/viivvii', '지다람'),
  ('YOUTUBE', 'https://www.youtube.com/@Battlefly_0909', '莊周 Zhou'),

  -- 9월 11일 (금)
  ('SOOP', 'https://www.sooplive.com/station/kafu1234', '카후.'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCsCIsvIuAAs1f4uWJcGwnRA', '靛画そめる'),

  -- 9월 12일 (토)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCkpur_ELo6jWiMh7wGHdmtw', '愛世らびぃ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCStddmApYaQkn0sqj9yxMoA', '茶々森こまめ'),

  -- 9월 13일 (일)
  ('SOOP', 'https://www.sooplive.com/station/bbiy0eo', '비요!'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCa9175qUdA3u7petDHMYoXw', '冥花'),

  -- 9월 14일 (월)
  ('SOOP', 'https://www.sooplive.com/station/tirens2', '티르엔'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCCeSWM5OAb-ybWicrzHYJVQ', '江口真好'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC88QY3OaWloJ3ye-CWOObrQ', '九生マクロ'),

  -- 9월 16일 (수)
  ('SOOP', 'https://www.sooplive.com/station/arong0106', '김깍마기'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC3f-97uZR79eYxafLYA_eDA', '柵越ゼラツカ'),

  -- 9월 18일 (금)
  ('CHZZK', 'https://chzzk.naver.com/0af922bfdd9361547309041013670494', '덕고미'),
  ('SOOP', 'https://www.sooplive.com/station/glichko', '글리치코'),

  -- 9월 19일 (토)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCJdXMefwTJmAIPHdnlHhQ2w', '奏咲ルリ'),
  ('SOOP', 'https://www.sooplive.com/station/akdrhqld0530', '류솔'),

  -- 9월 21일 (월)
  ('YOUTUBE', 'https://www.youtube.com/@lumicode000x', '癒音ゆらむ'),

  -- 9월 26일 (토)
  ('YOUTUBE', 'https://www.youtube.com/@manase_shuga', '愛星しゅが'),

  -- 9월 28일 (월)
  ('SOOP', 'https://www.sooplive.com/station/ziin05566', '윤지아')
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
  -- 9월 04일 (금)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCW8Hb9gMstqPBFkuLZ-yxOw', 'dasokuno-waraji', '蛇足乃わらじ', '', '蛇足乃わらじ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-04', '20:00', 'Asia/Seoul', '2026-09-04T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCL2sgsThTM9kWQZieKeAFFA', 'minano-hiiro', '皆那之ひいろ', '', '皆那之ひいろ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-04', '22:00', 'Asia/Seoul', '2026-09-04T13:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC2Sj14Lm-k1vq5qukQovRig', 'ushiba-shiu', '牛羽しう', '', '牛羽しう의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-04', '22:00', 'Asia/Seoul', '2026-09-04T13:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@兎丸流人', 'usamaru-ryuto', '兎丸流人', '', '兎丸流人의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-04', '22:00', 'Asia/Seoul', '2026-09-04T13:00:00.000Z', 'JP'),

  -- 9월 05일 (토)
  ('CHZZK', 'https://chzzk.naver.com/3c24762b6c5d9824a0619353de3c759f', 'cheong-hwi', '청 휘', '', '청 휘 버추얼 스트리머의 오리지널 정식 데뷔 방송입니다.', '개인세', '2026-09-05', '17:00', 'Asia/Seoul', '2026-09-05T08:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCgGqn3ACz5mdaYsFfQkCGKQ', 'morun', 'もるん。', '', 'もるん。의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '20:00', 'Asia/Seoul', '2026-09-05T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCFKZyJaUwKCunwqVgIVpHog', 'yogomori-shiyuu', '夜護シユウ', '', '夜護シユウ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '20:00', 'Asia/Seoul', '2026-09-05T11:00:00.000Z', 'JP'),
  ('CHZZK', 'https://chzzk.naver.com/52479500ce35018d8e730c6feab1ca0f', 'aeru', '에루 AERU', '', '에루 AERU 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '21:00', 'Asia/Seoul', '2026-09-05T12:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCRiAISV9_WJlKUlYTmHn4SQ', 'ninomae-kuo', '一くぉ', '', '一くぉ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '21:00', 'Asia/Seoul', '2026-09-05T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCnQx1rdKYv1o07_bUjDOcQg', 'sorii', '反井', '', '反井의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '21:00', 'Asia/Seoul', '2026-09-05T12:00:00.000Z', 'JP'),

  -- 9월 06일 (일)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCKbtcOmJc0_m6Szm72WPq9A', 'eruve', 'エルヴェ', '', 'エルヴェ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-06', '21:00', 'Asia/Seoul', '2026-09-06T12:00:00.000Z', 'JP'),

  -- 9월 07일 (월)
  ('YOUTUBE', 'https://www.youtube.com/channel/UC6gtJE_ZRXkagU4g_ewB2FQ', 'kuno-wan', '狗乃わん', '', '狗乃わん의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-07', '07:30', 'Asia/Seoul', '2026-09-06T22:30:00.000Z', 'JP'),
  ('SOOP', 'https://www.sooplive.com/station/22sharii22', '22sharii22', '이샤리×', '', '이샤리× 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-07', '10:00', 'Asia/Seoul', '2026-09-07T01:00:00.000Z', 'KR'),

  -- 9월 09일 (수)
  ('SOOP', 'https://www.sooplive.com/station/jeongmillyu', 'jeongmillyu', '정밀류', '', '정밀류 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-09', '12:00', 'Asia/Seoul', '2026-09-09T03:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/viivvii', 'viivvii', '지다람', '', '지다람 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-09', '14:00', 'Asia/Seoul', '2026-09-09T05:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@Battlefly_0909', 'battlefly-0909', '莊周 Zhou', '', '莊周 Zhou의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-09', '22:00', 'Asia/Seoul', '2026-09-09T13:00:00.000Z', 'US'),

  -- 9월 11일 (금)
  ('SOOP', 'https://www.sooplive.com/station/kafu1234', 'kafu1234', '카후.', '', '카후. 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-11', '19:00', 'Asia/Seoul', '2026-09-11T10:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCsCIsvIuAAs1f4uWJcGwnRA', 'aiga-someru', '靛画そめる', '', '靛画そめる의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-11', '21:00', 'Asia/Seoul', '2026-09-11T12:00:00.000Z', 'JP'),

  -- 9월 12일 (토)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCkpur_ELo6jWiMh7wGHdmtw', 'manase-rabii', '愛世らびぃ', '', '愛世らびぃ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-12', '20:00', 'Asia/Seoul', '2026-09-12T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCStddmApYaQkn0sqj9yxMoA', 'chachamori-komame', '茶々森こまめ', '', '茶々森こまめ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-12', '20:00', 'Asia/Seoul', '2026-09-12T11:00:00.000Z', 'JP'),

  -- 9월 13일 (일)
  ('SOOP', 'https://www.sooplive.com/station/bbiy0eo', 'bbiy0eo', '비요!', '', '비요! 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-13', '17:00', 'Asia/Seoul', '2026-09-13T08:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCa9175qUdA3u7petDHMYoXw', 'meika', '冥花', '', '冥花의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-13', '21:00', 'Asia/Seoul', '2026-09-13T12:00:00.000Z', 'JP'),

  -- 9월 14일 (월)
  ('SOOP', 'https://www.sooplive.com/station/tirens2', 'tirens2', '티르엔', '', '티르엔 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-14', '17:00', 'Asia/Seoul', '2026-09-14T08:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCCeSWM5OAb-ybWicrzHYJVQ', 'eguchi-maho', '江口真好', '', '江口真好의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-14', '20:00', 'Asia/Seoul', '2026-09-14T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC88QY3OaWloJ3ye-CWOObrQ', 'kokonoe-makuro', '九生マクロ', '', '九生マクロ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-14', '20:00', 'Asia/Seoul', '2026-09-14T11:00:00.000Z', 'JP'),

  -- 9월 16일 (수)
  ('SOOP', 'https://www.sooplive.com/station/arong0106', 'arong0106', '김깍마기', '', '김깍마기 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-16', '12:00', 'Asia/Seoul', '2026-09-16T03:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC3f-97uZR79eYxafLYA_eDA', 'sakagoshi-zeratsuka', '柵越ゼラツカ', '', '柵越ゼラツカ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-16', '20:00', 'Asia/Seoul', '2026-09-16T11:00:00.000Z', 'JP'),

  -- 9월 18일 (금)
  ('CHZZK', 'https://chzzk.naver.com/0af922bfdd9361547309041013670494', 'deokgomi', '덕고미', '', '덕고미 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-18', '20:00', 'Asia/Seoul', '2026-09-18T11:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/glichko', 'glichko', '글리치코', '', '글리치코 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-18', '20:00', 'Asia/Seoul', '2026-09-18T11:00:00.000Z', 'KR'),

  -- 9월 19일 (토)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCJdXMefwTJmAIPHdnlHhQ2w', 'kanadezaki-ruri', '奏咲ルリ', '', '奏咲ルリ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-19', '16:00', 'Asia/Seoul', '2026-09-19T07:00:00.000Z', 'JP'),
  ('SOOP', 'https://www.sooplive.com/station/akdrhqld0530', 'akdrhqld0530', '류솔', '', '류솔 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-19', '21:00', 'Asia/Seoul', '2026-09-19T12:00:00.000Z', 'KR'),

  -- 9월 21일 (월)
  ('YOUTUBE', 'https://www.youtube.com/@lumicode000x', 'lumicode000x', '癒音ゆらむ', '', '癒音ゆらむ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-21', '21:00', 'Asia/Seoul', '2026-09-21T12:00:00.000Z', 'JP'),

  -- 9월 26일 (토)
  ('YOUTUBE', 'https://www.youtube.com/@manase_shuga', 'manase-shuga', '愛星しゅが', '', '愛星しゅが의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-26', '19:00', 'Asia/Seoul', '2026-09-26T10:00:00.000Z', 'JP'),

  -- 9월 28일 (월)
  ('SOOP', 'https://www.sooplive.com/station/ziin05566', 'ziin05566', '윤지아', '', '윤지아 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-28', '15:00', 'Asia/Seoul', '2026-09-28T06:00:00.000Z', 'KR')
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

-- ============================================================
-- PART 03: 기존 1인 데뷔 일시 최신화 UPDATE
-- ============================================================
-- 緋桜なこ: 기존 9/1 -> 9/4 21:00 KST (12:00 UTC)
UPDATE streamerChannel_info
SET debut_date = '2026-09-04',
    debut_time = '21:00',
    start_at_utc = '2026-09-04T12:00:00.000Z',
    updated_at = CURRENT_TIMESTAMP
WHERE display_name LIKE '%緋桜なこ%' OR slug = 'hizakura-nako';
