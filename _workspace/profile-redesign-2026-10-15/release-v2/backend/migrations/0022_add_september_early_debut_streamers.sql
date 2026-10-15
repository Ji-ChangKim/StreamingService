-- Migration 0022: Add Virtual Debut Streamers for Early September 2026 (2026-08-31 ~ 2026-09-06)
-- 1. 8월 31일 ~ 9월 6일 신규 버추얼 스트리머 32인 추가 (CHZZK, SOOP, YouTube)
-- 2. 8월 31일 기존 2인(ガチ経営者VTuber組長, 月深夜冥夜) 프로필 및 데뷔 시각 UPDATE

-- ============================================================
-- PART 01: 신규 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name) AS (
  VALUES
  -- 8월 31일 (월)
  ('YOUTUBE', 'https://www.youtube.com/@xxtowani_yamuxx', '永遠仁やむ'),
  ('YOUTUBE', 'https://www.youtube.com/@yoichopre', '酔澄觸°'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC6frP_s8rL-0ghgjsHA9Qtg', '銀河大帝ニャルラ'),

  -- 9월 01일 (화)
  ('SOOP', 'https://www.sooplive.com/station/tsukii0321', '하루노츠키'),
  ('YOUTUBE', 'https://www.youtube.com/@Akasaki_Akane', '朱咲あかね'),
  ('YOUTUBE', 'https://www.youtube.com/@Kuon-Teo', '久遠テオ'),
  ('YOUTUBE', 'https://www.youtube.com/@TianaVelle', 'ティアナ・ヴェル'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCz6sI0kRv-nNdf8MzBUDa3g', 'パルオ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC7NxZDevfTqX59K0GCAe_3A', '筑紫野のの'),
  ('CHZZK', 'https://chzzk.naver.com/9e9c23ac7bd79ce7944b7bc2c1b193fb', '하루야'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCN-Lb5ahNxNdajiT7aNl2XQ', 'βねおん'),
  ('YOUTUBE', 'https://www.youtube.com/@amairo-setsuna', '天色刹那'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCpXsRHvYwtvXmlgpCeOuR7w', '緋桜なこ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UClPNC7vCwP6g14CJFuDGf6A', '芥屋衣玖'),

  -- 9월 02일 (수)
  ('SOOP', 'https://www.sooplive.com/station/panggom', '키나1'),
  ('SOOP', 'https://www.sooplive.com/station/miheezzang', '미미희'),
  ('SOOP', 'https://www.sooplive.com/station/momochii', '송모찌'),

  -- 9월 03일 (목)
  ('SOOP', 'https://www.sooplive.com/station/tkfkd0691', '고르:3'),

  -- 9월 04일 (금)
  ('SOOP', 'https://www.sooplive.com/station/yunsaegyeol', '윤새결'),
  ('SOOP', 'https://www.sooplive.com/station/hiyori71', '히요리-3-'),
  ('YOUTUBE', 'https://www.youtube.com/@Nagisa_Houkiboshi', '彗凪沙'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCMJif_zPZhT6xs43-1fPhkw', '白ノ宮朔'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCye-j7puijvfVraJGCuoyFA', '羊野メェ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCraMO-SItKRN8lPrcsewV4A', '花芽ケイセイ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCNYy9grZvGzg_kxwew6S2pg', 'エテルナ・ローザ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCHqcCCojNF3c4xCm1NGLLiA', 'ルナ'),

  -- 9월 05일 (토)
  ('CHZZK', 'https://chzzk.naver.com/a046d361cebc40196408424814473562', '슈야 SHUYA'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCCKzADCmKwlEmaq6VpIxb0Q', '社畜系VTuber宮城乃やしろ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCXxqG9ZdTPn5wvfs1tmOQKQ', 'ぷーもべりふぇごる'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCyvNxZS1zNXplh_rIAPuQww', '奏ヰラゼル'),

  -- 9월 06일 (일)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCq2yPaXIrm55D3_3Krbe48w', '猫魔ちい'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCLIfc64P4ci6Q_ZEhce8Vgg', '旭遊馬')
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
  -- 8월 31일 (월)
  ('YOUTUBE', 'https://www.youtube.com/@xxtowani_yamuxx', 'towani-yamu', '永遠仁やむ', '', '永遠仁やむ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-31', '20:00', 'Asia/Seoul', '2026-08-31T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@yoichopre', 'yoichopre', '酔澄觸°', '', '酔澄觸°의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-31', '21:00', 'Asia/Seoul', '2026-08-31T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC6frP_s8rL-0ghgjsHA9Qtg', 'nyarura', '銀河大帝ニャルラ', '', '銀河大帝ニャルラ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-08-31', '21:00', 'Asia/Seoul', '2026-08-31T12:00:00.000Z', 'JP'),

  -- 9월 01일 (화)
  ('SOOP', 'https://www.sooplive.com/station/tsukii0321', 'tsukii0321', '하루노츠키', '', '하루노츠키 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-01', '18:00', 'Asia/Seoul', '2026-09-01T09:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@Akasaki_Akane', 'akasaki-akane', '朱咲あかね', '', '朱咲あかね의 버추얼 스트리머 첫 데뷔 방송입니다.', 'Falcony', '2026-09-01', '18:00', 'Asia/Seoul', '2026-09-01T09:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@Kuon-Teo', 'kuon-teo', '久遠テオ', '', '久遠テオ의 버추얼 스트리머 첫 데뷔 방송입니다.', 'Falcony', '2026-09-01', '19:00', 'Asia/Seoul', '2026-09-01T10:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@TianaVelle', 'tiana-velle', 'ティアナ・ヴェル', '', 'ティアナ・ヴェル의 버추얼 스트리머 첫 데뷔 방송입니다.', 'Falcony', '2026-09-01', '20:00', 'Asia/Seoul', '2026-09-01T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCz6sI0kRv-nNdf8MzBUDa3g', 'paruo', 'パルオ', '', 'パルオ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-01', '20:00', 'Asia/Seoul', '2026-09-01T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UC7NxZDevfTqX59K0GCAe_3A', 'chikushino-nono', '筑紫野のの', '', '筑紫野のの의 버추얼 스트리머 첫 데뷔 방송입니다.', 'ふぁんぐあくと', '2026-09-01', '20:00', 'Asia/Seoul', '2026-09-01T11:00:00.000Z', 'JP'),
  ('CHZZK', 'https://chzzk.naver.com/9e9c23ac7bd79ce7944b7bc2c1b193fb', 'haruya', '하루야', '', '하루야 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-01', '21:00', 'Asia/Seoul', '2026-09-01T12:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCN-Lb5ahNxNdajiT7aNl2XQ', 'beta-neon', 'βねおん', '', 'βねおん의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-01', '21:00', 'Asia/Seoul', '2026-09-01T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@amairo-setsuna', 'amairo-setsuna', '天色刹那', '', '天色刹那의 버추얼 스트리머 첫 데뷔 방송입니다.', 'Falcony', '2026-09-01', '21:00', 'Asia/Seoul', '2026-09-01T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCpXsRHvYwtvXmlgpCeOuR7w', 'hizakura-nako', '緋桜なこ', '', '緋桜なこ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-01', '21:00', 'Asia/Seoul', '2026-09-01T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UClPNC7vCwP6g14CJFuDGf6A', 'keya-iku', '芥屋衣玖', '', '芥屋衣玖의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-01', '21:00', 'Asia/Seoul', '2026-09-01T12:00:00.000Z', 'JP'),

  -- 9월 02일 (수)
  ('SOOP', 'https://www.sooplive.com/station/panggom', 'panggom', '키나1', '', '키나1 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-02', '12:00', 'Asia/Seoul', '2026-09-02T03:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/miheezzang', 'miheezzang', '미미희', '', '미미희 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-02', '14:00', 'Asia/Seoul', '2026-09-02T05:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/momochii', 'momochii', '송모찌', '', '송모찌 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-02', '22:00', 'Asia/Seoul', '2026-09-02T13:00:00.000Z', 'KR'),

  -- 9월 03일 (목)
  ('SOOP', 'https://www.sooplive.com/station/tkfkd0691', 'tkfkd0691', '고르:3', '', '고르:3 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-03', '22:00', 'Asia/Seoul', '2026-09-03T13:00:00.000Z', 'KR'),

  -- 9월 04일 (금)
  ('SOOP', 'https://www.sooplive.com/station/yunsaegyeol', 'yunsaegyeol', '윤새결', '', '윤새결 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-04', '14:00', 'Asia/Seoul', '2026-09-04T05:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/hiyori71', 'hiyori71', '히요리-3-', '', '히요리-3- 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-04', '20:00', 'Asia/Seoul', '2026-09-04T11:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@Nagisa_Houkiboshi', 'nagisa-houkiboshi', '彗凪沙', '', '彗凪沙의 버추얼 스트리머 첫 데뷔 방송입니다.', 'Zebula', '2026-09-04', '21:00', 'Asia/Seoul', '2026-09-04T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCMJif_zPZhT6xs43-1fPhkw', 'shiranomiya-saku', '白ノ宮朔', '', '白ノ宮朔의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-04', '21:00', 'Asia/Seoul', '2026-09-04T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCye-j7puijvfVraJGCuoyFA', 'hitsujino-mee', '羊野メェ', '', '羊野メェ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-04', '21:00', 'Asia/Seoul', '2026-09-04T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCraMO-SItKRN8lPrcsewV4A', 'kaga-keisei', '花芽ケイセイ', '', '花芽ケイセイ의 버추얼 스트리머 첫 데뷔 방송입니다.', 'Zebula', '2026-09-04', '21:30', 'Asia/Seoul', '2026-09-04T12:30:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCNYy9grZvGzg_kxwew6S2pg', 'eterna-rosa', 'エテルナ・ローザ', '', 'エテルナ・ローザ의 버추얼 스트리머 첫 데뷔 방송입니다.', 'Zebula', '2026-09-04', '22:00', 'Asia/Seoul', '2026-09-04T13:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCHqcCCojNF3c4xCm1NGLLiA', 'zebula-luna', 'ルナ', '', 'ルナ의 버추얼 스트리머 첫 데뷔 방송입니다.', 'Zebula', '2026-09-04', '22:30', 'Asia/Seoul', '2026-09-04T13:30:00.000Z', 'JP'),

  -- 9월 05일 (토)
  ('CHZZK', 'https://chzzk.naver.com/a046d361cebc40196408424814473562', 'shuya', '슈야 SHUYA', '', '슈야 SHUYA 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '14:00', 'Asia/Seoul', '2026-09-05T05:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCCKzADCmKwlEmaq6VpIxb0Q', 'miyagino-yashiro', '社畜系VTuber宮城乃やしろ', '', '社畜系VTuber宮城乃やしろ의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '15:00', 'Asia/Seoul', '2026-09-05T06:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCXxqG9ZdTPn5wvfs1tmOQKQ', 'puumo-belphegor', 'ぷーもべりふぇごる', '', 'ぷーもべりふぇごる의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '19:00', 'Asia/Seoul', '2026-09-05T10:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCyvNxZS1zNXplh_rIAPuQww', 'kanai-razel', '奏ヰラゼル', '', '奏ヰラゼル의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-05', '22:00', 'Asia/Seoul', '2026-09-05T13:00:00.000Z', 'JP'),

  -- 9월 06일 (일)
  ('YOUTUBE', 'https://www.youtube.com/channel/UCq2yPaXIrm55D3_3Krbe48w', 'nekoma-chii', '猫魔ちい', '', '猫魔ちい의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-06', '21:00', 'Asia/Seoul', '2026-09-06T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCLIfc64P4ci6Q_ZEhce8Vgg', 'asahi-yuma', '旭遊馬', '', '旭遊馬의 버추얼 스트리머 첫 데뷔 방송입니다.', '개인세', '2026-09-06', '21:00', 'Asia/Seoul', '2026-09-06T12:00:00.000Z', 'JP')
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
-- PART 03: 기존 8/31 2인 프로필/시간 최신화 UPDATE
-- ============================================================
-- ガチ経営者VTuber組長: 8/31 20:00 KST (11:00 UTC)
UPDATE streamerChannel_info
SET debut_time = '20:00',
    start_at_utc = '2026-08-31T11:00:00.000Z',
    updated_at = CURRENT_TIMESTAMP
WHERE display_name LIKE '%組長%' OR slug = 'kumicho';

-- 月深夜冥夜: 8/31 23:00 KST (14:00 UTC)
UPDATE streamerChannel_info
SET debut_time = '23:00',
    start_at_utc = '2026-08-31T14:00:00.000Z',
    updated_at = CURRENT_TIMESTAMP
WHERE display_name LIKE '%月深夜%' OR slug = 'tsukimi-meiya';
