-- Migration 0009: Add country_code column to streamerChannel_info and update country data

-- PART 01 BEGIN (country_code 컬럼 추가: 최초 1회만 실행)
-- ============================================================
ALTER TABLE streamerChannel_info
ADD COLUMN country_code TEXT
CHECK (country_code IN ('KR', 'JP', 'US') OR country_code IS NULL);
-- PART 01 END

-- ============================================================
-- PART 02 BEGIN (대한민국 78명)
-- ============================================================
WITH target_channels(platform, channel_url) AS (
  VALUES
  ('CHZZK', 'https://chzzk.me/itVoL'),
  ('CHZZK', 'https://chzzk.me/KNHMG'),
  ('CHZZK', 'https://chzzk.naver.com/03c5bd649b21fcdc2725e2b218fc3bbb'),
  ('CHZZK', 'https://chzzk.naver.com/057813a95807a252872ab2b4d84f7f9d'),
  ('CHZZK', 'https://chzzk.naver.com/1a7f2560ab6dc3b814f86a02a17994c9'),
  ('CHZZK', 'https://chzzk.naver.com/1bacd9d540012f7cf0c77fa968b47394'),
  ('CHZZK', 'https://chzzk.naver.com/2486f2222390ebc4d6dd67edd8b6076d'),
  ('CHZZK', 'https://chzzk.naver.com/2becaff30b6a7f38634802111435f82c'),
  ('CHZZK', 'https://chzzk.naver.com/2ff1e69c13a04c76a3533387d2126c61'),
  ('CHZZK', 'https://chzzk.naver.com/332b6c3ef8b5e0bdffbf42031fa95c70'),
  ('CHZZK', 'https://chzzk.naver.com/3bc90b22f6b7925e5b92767562f44f3b'),
  ('CHZZK', 'https://chzzk.naver.com/3f9f1baae7ce2c74d63bc5efefa66ae8'),
  ('CHZZK', 'https://chzzk.naver.com/4dcbac1a87be95fdad9f981ed38f9659'),
  ('CHZZK', 'https://chzzk.naver.com/4f3e9a13356fbff9fb3a82987c85971c'),
  ('CHZZK', 'https://chzzk.naver.com/5f04c53cd57e998583424fdd5af05ed9'),
  ('CHZZK', 'https://chzzk.naver.com/735ae8c66c3c44e6b2dd52fb8b3f5fc8'),
  ('CHZZK', 'https://chzzk.naver.com/7513c1b6197bc31b40297991cc043d0f'),
  ('CHZZK', 'https://chzzk.naver.com/80c2494ca15ba21b8a4ae8d955807e2b'),
  ('CHZZK', 'https://chzzk.naver.com/8c615cb598cc8dbce78ac4c938a569b6'),
  ('CHZZK', 'https://chzzk.naver.com/adb3e4f6057d77c0547327cf076de6bf'),
  ('CHZZK', 'https://chzzk.naver.com/cc501ec4db774913db595a62ad29a5ff'),
  ('CHZZK', 'https://chzzk.naver.com/cfb55fb02bdcbf17c3eb0bd756ee7762'),
  ('CHZZK', 'https://chzzk.naver.com/cfdd7612ecdf31d058b2a7ee40b95fbb'),
  ('CHZZK', 'https://chzzk.naver.com/d470609e2e88d3cbc503c2af8e059601'),
  ('CHZZK', 'https://chzzk.naver.com/dac7140d8871c1eb40dfc9dbdbdc4671'),
  ('CHZZK', 'https://chzzk.naver.com/dd34d48439b7feee08b53cb4063cb0fd'),
  ('CHZZK', 'https://chzzk.naver.com/fc2a5737e44f64a8b0ea259d8b9d1103'),
  ('CHZZK', 'https://t.co/akr5k2o5lT'),
  ('SOOP', 'https://www.sooplive.com/station/2dohae'),
  ('SOOP', 'https://www.sooplive.com/station/971026ck'),
  ('SOOP', 'https://www.sooplive.com/station/9hongdan'),
  ('SOOP', 'https://www.sooplive.com/station/aarong37'),
  ('SOOP', 'https://www.sooplive.com/station/acongii'),
  ('SOOP', 'https://www.sooplive.com/station/baeka0321'),
  ('SOOP', 'https://www.sooplive.com/station/bboyena'),
  ('SOOP', 'https://www.sooplive.com/station/c0c0nuts'),
  ('SOOP', 'https://www.sooplive.com/station/chaeding193'),
  ('SOOP', 'https://www.sooplive.com/station/chaeeunha'),
  ('SOOP', 'https://www.sooplive.com/station/cho221234'),
  ('SOOP', 'https://www.sooplive.com/station/damedesu'),
  ('SOOP', 'https://www.sooplive.com/station/ddiddu4'),
  ('SOOP', 'https://www.sooplive.com/station/ehddlscjs12'),
  ('SOOP', 'https://www.sooplive.com/station/eighty'),
  ('SOOP', 'https://www.sooplive.com/station/fkvkdpf83'),
  ('SOOP', 'https://www.sooplive.com/station/gkgkgk1004'),
  ('SOOP', 'https://www.sooplive.com/station/haruniong'),
  ('SOOP', 'https://www.sooplive.com/station/hetty0v0'),
  ('SOOP', 'https://www.sooplive.com/station/hinitcho'),
  ('SOOP', 'https://www.sooplive.com/station/hinyacgho'),
  ('SOOP', 'https://www.sooplive.com/station/injeolmiru'),
  ('SOOP', 'https://www.sooplive.com/station/ironyan'),
  ('SOOP', 'https://www.sooplive.com/station/keueukya'),
  ('SOOP', 'https://www.sooplive.com/station/khoya8263'),
  ('SOOP', 'https://www.sooplive.com/station/krtl6798'),
  ('SOOP', 'https://www.sooplive.com/station/kururung'),
  ('SOOP', 'https://www.sooplive.com/station/maruruung'),
  ('SOOP', 'https://www.sooplive.com/station/matae6'),
  ('SOOP', 'https://www.sooplive.com/station/meowuxu'),
  ('SOOP', 'https://www.sooplive.com/station/newera404'),
  ('SOOP', 'https://www.sooplive.com/station/nmoohae1205'),
  ('SOOP', 'https://www.sooplive.com/station/nruha0207'),
  ('SOOP', 'https://www.sooplive.com/station/nyanyaaa'),
  ('SOOP', 'https://www.sooplive.com/station/oiguu5252'),
  ('SOOP', 'https://www.sooplive.com/station/ppippang'),
  ('SOOP', 'https://www.sooplive.com/station/ranche4301'),
  ('SOOP', 'https://www.sooplive.com/station/ravenlucifer'),
  ('SOOP', 'https://www.sooplive.com/station/songchiro'),
  ('SOOP', 'https://www.sooplive.com/station/taco05'),
  ('SOOP', 'https://www.sooplive.com/station/twinkle0811'),
  ('SOOP', 'https://www.sooplive.com/station/uchi5757'),
  ('SOOP', 'https://www.sooplive.com/station/usagiwooru'),
  ('SOOP', 'https://www.sooplive.com/station/usolbii11'),
  ('SOOP', 'https://www.sooplive.com/station/whitesaerin'),
  ('SOOP', 'https://www.sooplive.com/station/xxxsihyeon'),
  ('SOOP', 'https://www.sooplive.com/station/yaaang301'),
  ('SOOP', 'https://www.sooplive.com/station/yami875'),
  ('SOOP', 'https://www.sooplive.com/station/zuijjang'),
  ('SOOP', 'https://www.sooplive.com/station/zzangaji1025')
)
UPDATE streamerChannel_info
SET
  country_code = 'KR',
  updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT sc.id
  FROM streamerChannel AS sc
  JOIN target_channels AS t
    ON t.platform = sc.platform
   AND t.channel_url = sc.channel_url
);

SELECT
  'KR' AS country_code,
  '대한민국' AS country_name,
  78 AS expected_count,
  COUNT(*) AS applied_count
FROM streamerChannel_info
WHERE country_code = 'KR';
-- PART 02 END

-- ============================================================
-- PART 03 BEGIN (일본 101명)
-- ============================================================
WITH target_channels(platform, channel_url) AS (
  VALUES
  ('YOUTUBE', 'https://www.youtube.com/@%E3%81%90%E3%81%90%E3%81%8B'),
  ('YOUTUBE', 'https://www.youtube.com/@%E3%81%AA%E3%81%A4%E3%82%81%E3%81%AA%E3%81%8A'),
  ('YOUTUBE', 'https://www.youtube.com/@%E3%81%AA%E3%82%8AAI0727'),
  ('YOUTUBE', 'https://www.youtube.com/@%E3%81%AB%E3%81%AE%E3%81%BE%E3%81%88%E4%B8%80%E5%88%83kinTV'),
  ('YOUTUBE', 'https://www.youtube.com/@%E3%82%86%E3%81%82%E3%82%8093'),
  ('YOUTUBE', 'https://www.youtube.com/@%E3%83%B4%E3%82%A9%E3%83%AB%E3%83%95%E3%83%86%E3%82%A3%E3%82%AC%E3%83%BC'),
  ('YOUTUBE', 'https://www.youtube.com/@%E5%92%B2%E6%BA%80%E3%81%A1%E3%82%88'),
  ('YOUTUBE', 'https://www.youtube.com/@%E5%A4%9C%E9%81%93%E3%83%AC%E3%83%B3'),
  ('YOUTUBE', 'https://www.youtube.com/@%E6%97%A5%E5%90%91%E3%82%B7%E3%82%BA'),
  ('YOUTUBE', 'https://www.youtube.com/@%E6%98%9F%E5%A5%88-Vtuber'),
  ('YOUTUBE', 'https://www.youtube.com/@%E6%A0%9E%E4%B9%83%E3%82%AA%E3%83%88'),
  ('YOUTUBE', 'https://www.youtube.com/@%E6%B3%A1%E6%B2%AB%E3%81%82%E3%81%B6%E3%81%8F'),
  ('YOUTUBE', 'https://www.youtube.com/@%E7%81%B0%E3%83%8E%E5%AE%AE%E7%A7%8B%E4%BA%BA'),
  ('YOUTUBE', 'https://www.youtube.com/@%E7%81%B0%E6%A5%BD%E3%81%88%E3%82%93-syakuraen'),
  ('YOUTUBE', 'https://www.youtube.com/@%E7%8B%90%E7%A5%9E%E3%82%8A%E3%82%93%E3%81%AD'),
  ('YOUTUBE', 'https://www.youtube.com/@%E7%A2%A7%E7%A9%BA%E3%81%82%E3%81%95%E3%81%B2VTuber'),
  ('YOUTUBE', 'https://www.youtube.com/@%E7%AC%91%E9%A1%94%E7%AC%91%E7%94%B7V'),
  ('YOUTUBE', 'https://www.youtube.com/@%E8%93%AE%E6%B0%B4%E3%82%8C%E3%82%93'),
  ('YOUTUBE', 'https://www.youtube.com/@%E8%9C%82%E4%BA%95%E3%81%A1%E3%81%83%E3%81%9A'),
  ('YOUTUBE', 'https://www.youtube.com/@0hinarysan'),
  ('YOUTUBE', 'https://www.youtube.com/@4ji_kyu'),
  ('YOUTUBE', 'https://www.youtube.com/@AmanatuKinari'),
  ('YOUTUBE', 'https://www.youtube.com/@AmatogaEve'),
  ('YOUTUBE', 'https://www.youtube.com/@Baniku_chan'),
  ('YOUTUBE', 'https://www.youtube.com/@bqken0'),
  ('YOUTUBE', 'https://www.youtube.com/@chigayaofficial'),
  ('YOUTUBE', 'https://www.youtube.com/@chimaru_vt'),
  ('YOUTUBE', 'https://www.youtube.com/@Congu_Lumi'),
  ('YOUTUBE', 'https://www.youtube.com/@cosmic_mao'),
  ('YOUTUBE', 'https://www.youtube.com/@cosu_gathering'),
  ('YOUTUBE', 'https://www.youtube.com/@DearYourfool'),
  ('YOUTUBE', 'https://www.youtube.com/@dempa_now'),
  ('YOUTUBE', 'https://www.youtube.com/@FizzAwato'),
  ('YOUTUBE', 'https://www.youtube.com/@hakana-nonnon'),
  ('YOUTUBE', 'https://www.youtube.com/@HakanaOto'),
  ('YOUTUBE', 'https://www.youtube.com/@hakume__yoi'),
  ('YOUTUBE', 'https://www.youtube.com/@Hasuki_vt'),
  ('YOUTUBE', 'https://www.youtube.com/@hazuki_touka'),
  ('YOUTUBE', 'https://www.youtube.com/@hiiragirio1220'),
  ('YOUTUBE', 'https://www.youtube.com/@himori_ato'),
  ('YOUTUBE', 'https://www.youtube.com/@HitoboshiAlice'),
  ('YOUTUBE', 'https://www.youtube.com/@Honda_V_Ch'),
  ('YOUTUBE', 'https://www.youtube.com/@horarun'),
  ('YOUTUBE', 'https://www.youtube.com/@Hoshigari_Roy_PRTL'),
  ('YOUTUBE', 'https://www.youtube.com/@hukami.men731'),
  ('YOUTUBE', 'https://www.youtube.com/@ichilluishiro'),
  ('YOUTUBE', 'https://www.youtube.com/@Karakuri_Labo'),
  ('YOUTUBE', 'https://www.youtube.com/@KieraBellRose'),
  ('YOUTUBE', 'https://www.youtube.com/@Kisaki_Belle'),
  ('YOUTUBE', 'https://www.youtube.com/@kmbs821'),
  ('YOUTUBE', 'https://www.youtube.com/@Knight_Rei_Crwon'),
  ('YOUTUBE', 'https://www.youtube.com/@koinumaruhoeru'),
  ('YOUTUBE', 'https://www.youtube.com/@Kokushi_Majime'),
  ('YOUTUBE', 'https://www.youtube.com/@koumori_ensa'),
  ('YOUTUBE', 'https://www.youtube.com/@kuragerium'),
  ('YOUTUBE', 'https://www.youtube.com/@KurokiHomura'),
  ('YOUTUBE', 'https://www.youtube.com/@Kusakabe.PopWave'),
  ('YOUTUBE', 'https://www.youtube.com/@laradoll__1'),
  ('YOUTUBE', 'https://www.youtube.com/@Magara_XENORAGNA'),
  ('YOUTUBE', 'https://www.youtube.com/@Makura_Tone'),
  ('YOUTUBE', 'https://www.youtube.com/@mametapon'),
  ('YOUTUBE', 'https://www.youtube.com/@matsun_art'),
  ('YOUTUBE', 'https://www.youtube.com/@mayoichizu'),
  ('YOUTUBE', 'https://www.youtube.com/@migenbakokura'),
  ('YOUTUBE', 'https://www.youtube.com/@MinamoAlice'),
  ('YOUTUBE', 'https://www.youtube.com/@Moeru_Shoyo_PRTL'),
  ('YOUTUBE', 'https://www.youtube.com/@Namoriroma'),
  ('YOUTUBE', 'https://www.youtube.com/@natsumitsuna'),
  ('YOUTUBE', 'https://www.youtube.com/@oimo_io'),
  ('YOUTUBE', 'https://www.youtube.com/@otonoha_saki'),
  ('YOUTUBE', 'https://www.youtube.com/@otosaki-rowa'),
  ('YOUTUBE', 'https://www.youtube.com/@Oumi_Nina'),
  ('YOUTUBE', 'https://www.youtube.com/@PomeloPunch'),
  ('YOUTUBE', 'https://www.youtube.com/@PURETE_YORK'),
  ('YOUTUBE', 'https://www.youtube.com/@PurinLalaMode'),
  ('YOUTUBE', 'https://www.youtube.com/@rinseiamane'),
  ('YOUTUBE', 'https://www.youtube.com/@SenriAyumu_Y4T4'),
  ('YOUTUBE', 'https://www.youtube.com/@Shano_Yurei'),
  ('YOUTUBE', 'https://www.youtube.com/@ShikiseNull'),
  ('YOUTUBE', 'https://www.youtube.com/@shina-s47'),
  ('YOUTUBE', 'https://www.youtube.com/@shiroshitahina'),
  ('YOUTUBE', 'https://www.youtube.com/@shukura545'),
  ('YOUTUBE', 'https://www.youtube.com/@Shuto_PRTL'),
  ('YOUTUBE', 'https://www.youtube.com/@Suzumi_Rin'),
  ('YOUTUBE', 'https://www.youtube.com/@tachibana_byakuya'),
  ('YOUTUBE', 'https://www.youtube.com/@tora_tp_ch'),
  ('YOUTUBE', 'https://www.youtube.com/@Tsukishiro_Ria'),
  ('YOUTUBE', 'https://www.youtube.com/@usukawakomugi'),
  ('YOUTUBE', 'https://www.youtube.com/@Uta_Kotohime'),
  ('YOUTUBE', 'https://www.youtube.com/@vivid_dayo'),
  ('YOUTUBE', 'https://www.youtube.com/@xstas_Ch'),
  ('YOUTUBE', 'https://www.youtube.com/@xx_sia'),
  ('YOUTUBE', 'https://www.youtube.com/@Yanisuki_Kasumu'),
  ('YOUTUBE', 'https://www.youtube.com/@YoishiroCosumo'),
  ('YOUTUBE', 'https://www.youtube.com/@YokyuAkeru'),
  ('YOUTUBE', 'https://www.youtube.com/@Your_the_Aiboy'),
  ('YOUTUBE', 'https://www.youtube.com/@YugiriRay'),
  ('YOUTUBE', 'https://www.youtube.com/@YukimizuUta'),
  ('YOUTUBE', 'https://www.youtube.com/@yumemiuturo'),
  ('YOUTUBE', 'https://www.youtube.com/@yura_yoigasaki'),
  ('YOUTUBE', 'https://www.youtube.com/@yuusuzuituki')
)
UPDATE streamerChannel_info
SET
  country_code = 'JP',
  updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT sc.id
  FROM streamerChannel AS sc
  JOIN target_channels AS t
    ON t.platform = sc.platform
   AND t.channel_url = sc.channel_url
);

SELECT
  'JP' AS country_code,
  '일본' AS country_name,
  101 AS expected_count,
  COUNT(*) AS applied_count
FROM streamerChannel_info
WHERE country_code = 'JP';
-- PART 03 END

-- ============================================================
-- PART 04 BEGIN (미국 3명)
-- ============================================================
WITH target_channels(platform, channel_url) AS (
  VALUES
  ('YOUTUBE', 'https://www.youtube.com/@_STAR_MBH'),
  ('YOUTUBE', 'https://www.youtube.com/@IsumiTanaka'),
  ('YOUTUBE', 'https://www.youtube.com/@SapphytheGreat')
)
UPDATE streamerChannel_info
SET
  country_code = 'US',
  updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT sc.id
  FROM streamerChannel AS sc
  JOIN target_channels AS t
    ON t.platform = sc.platform
   AND t.channel_url = sc.channel_url
);

SELECT
  'US' AS country_code,
  '미국' AS country_name,
  3 AS expected_count,
  COUNT(*) AS applied_count
FROM streamerChannel_info
WHERE country_code = 'US';
-- PART 04 END

-- ============================================================
-- PART 05: 최종 검증
-- ============================================================
SELECT
  country_code,
  CASE country_code
    WHEN 'KR' THEN '대한민국'
    WHEN 'JP' THEN '일본'
    WHEN 'US' THEN '미국'
  END AS country_name,
  COUNT(*) AS streamer_count,
  ROUND(
    COUNT(*) * 100.0 /
    (SELECT COUNT(*) FROM streamerChannel_info),
    1
  ) AS total_percentage
FROM streamerChannel_info
WHERE country_code IN ('KR', 'JP', 'US')
GROUP BY country_code
ORDER BY streamer_count DESC;

SELECT
  COUNT(*) AS classified_count,
  SUM(CASE WHEN country_code = 'KR' THEN 1 ELSE 0 END) AS kr_count,
  SUM(CASE WHEN country_code = 'JP' THEN 1 ELSE 0 END) AS jp_count,
  SUM(CASE WHEN country_code = 'US' THEN 1 ELSE 0 END) AS us_count
FROM streamerChannel_info
WHERE country_code IN ('KR', 'JP', 'US');
