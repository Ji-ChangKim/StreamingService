-- Migration 0018: Update and Register 'Uralogic Game Company' (우라로지 게임 컴퍼니) 1st Gen Streamers
-- Target Platform: YouTube / X (Twitter)
-- Agency: Uralogic Game Company (기업세 / 일본 CARTA HOLDINGS 산하 Lighthouse Studio)
-- Country Code: JP

-- ============================================================
-- PART 01: streamerChannel 채널 등록 및 보완 (중복 방지)
-- ============================================================
WITH uralogic_channels(platform, channel_url, channel_name) AS (
  VALUES
  ('YOUTUBE', 'https://www.youtube.com/@YakushijiMei', 'Mei Ch. 薬師寺メイ / ウラロジゲームカンパニー'),
  ('YOUTUBE', 'https://www.youtube.com/@EikokuNema', 'Nema Ch. 映刻ネマ / ウラロジゲームカンパニー'),
  ('YOUTUBE', 'https://www.youtube.com/@UzukiAwai', 'Awai Ch. 卯月あわい / ウラロジゲームカンパニー'),
  ('YOUTUBE', 'https://www.youtube.com/@RokujoMikoto', 'Mikoto Ch. 六条ミコト / ウラロジゲームカンパニー'),
  ('YOUTUBE', 'https://www.youtube.com/@TobaLila', 'Lila Ch. 計羽リーラ / ウラロジゲームカンパニー')
)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT uc.platform, uc.channel_url, uc.channel_name
FROM uralogic_channels AS uc
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel AS sc
  WHERE sc.platform = uc.platform AND sc.channel_url = uc.channel_url
);

-- 채널명이 기존과 다른 경우 최신화
UPDATE streamerChannel
SET channel_name = 'Awai Ch. 卯月あわい / ウラロジゲームカンパニー'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@UzukiAwai';

-- ============================================================
-- PART 02: streamerChannel_info 신규 삽입 (미등록 시)
-- ============================================================
WITH uralogic_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
) AS (
  VALUES
  (
    'YOUTUBE',
    'https://www.youtube.com/@YakushijiMei',
    'yakushiji-mei',
    '薬師寺 メイ / Yakushiji Mei',
    'https://yt3.googleusercontent.com/pGH8fspEC-N1cZK4JRcb6OMuUFbDJzEJ8whW-e61ijG3svmU-JU3fYYzxNTdtUnCNxwOhK1f=s900-c-k-c0x00ffffff-no-rj',
    '"Hello, World!" 
はじめまして、ウラロジゲームカンパニー１期生の
薬師寺メイ（やくしじ　めい）と申します🧪🐍

\ 理系担当です✌🥸/ 

ゲーム世界でサイエ～ンスをしながら
新たな発見をお届けしていく系Vtuberです

得意領域は 化学／薬学／生物学 などなど',
    'Uralogic Game Company',
    '2026-08-19',
    '20:00',
    'Asia/Seoul',
    '2026-08-19T11:00:00.000Z',
    'JP',
    'https://x.com/Yakushiji_Mei'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/@EikokuNema',
    'eikoku-nema',
    '映刻 ネマ / Eikoku Nema',
    'https://yt3.googleusercontent.com/chzeYXhkzakVn0blAYIsCEX9Y-DAv74dDlsm4lT2kHBW4RmOJgOJHTN0tJs7MN8HRj7vWXh4=s900-c-k-c0x00ffffff-no-rj',
    '◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢
ㅤ
🍿IQ無限大てんちゃい映画監督🍿
ㅤㅤ　　　 ✨降☆臨✨
ㅤ
◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢
ㅤㅤ
ウラロジのくりえいてぃぶ担当.ᐟ.ᐟ
映刻ネマ（えいこく ねま）だぞッ
ゲームの世界に隠された…
映像演出の秘密を徹底解剖🔍

＼＼　 \ 　/ 　／／
🕶 𝙄𝙩''𝙨 𝙨𝙝𝙤𝙬 𝙩𝙞𝙢𝙚 🕶
／／　 /　 \　 ＼＼
ㅤ',
    'Uralogic Game Company',
    '2026-08-19',
    '20:30',
    'Asia/Seoul',
    '2026-08-19T11:30:00.000Z',
    'JP',
    'https://x.com/Eikoku_Nema'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/@UzukiAwai',
    'uzuki-awai',
    '卯月 あわい / Uzuki Awai',
    'https://yt3.googleusercontent.com/IqxzQL2FHEaRzFpmlPtIbpcYw71rH_XyWTkCYeZIcco8oYWtH341MXABpUGoWv8UbZOE56YsWw=s900-c-k-c0x00ffffff-no-rj',
    'ウラロジゲームカンパニー1期生の芸術担当、
卯月あわい（うずき あわい）と申します🫧

動画や配信ではゲームの世界の美しさや面白さを
美術・アーカイブの視点からつぶさに鑑賞していきます😊

とりわけ朝ごはんが好きです（🍥O🍥）

＼ ﾜ　ｰ   ｲ   ／
　　 🐶
          ＼ ﾜ　ｰ   ｲ   ／
　　　　　🐈
                    ＼ ﾜ　ｰ   ｲ   ／
　　　　　　　🐡

ひみつ🤫：元いた世界では「記録魔術師」という文化を記録し、守る仕事をしていたらしい....',
    'Uralogic Game Company',
    '2026-08-19',
    '21:00',
    'Asia/Seoul',
    '2026-08-19T12:00:00.000Z',
    'JP',
    'https://x.com/Uzuki_Awai'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/@RokujoMikoto',
    'rokujo-mikoto',
    '六条 ミコト / Rokujo Mikoto',
    'https://yt3.googleusercontent.com/_MO9s8YFP_LgCqnwq9_YhovPtoq8O6b1FGnWFWswJq3JJH43e7S6JhPb7BJMFsYI8zOjgbXMcA=s900-c-k-c0x00ffffff-no-rj',
    'おは要役地🌞ㅤ

ウラロジゲームカンパニー所属1期生の
六条ミコト（ろくじょう みこと）⚖✨やで！

ゲームの世界に法律を持ち込んで
楽しむ系VTuberやで(?) ✧٩(ˊᗜˋ*)و✧

楽しいことも悲しいことも
六乗してプラスにしてこദ്ദി(⩌ᴗ⩌ )

末永く、よろしゅうお頼申します～～～🙇‍♂️　以上',
    'Uralogic Game Company',
    '2026-08-20',
    '20:00',
    'Asia/Seoul',
    '2026-08-20T11:00:00.000Z',
    'JP',
    'https://x.com/Rokujo_Mikoto'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/@TobaLila',
    'toba-lila',
    '計羽 リーラ / Toba Lila',
    'https://yt3.googleusercontent.com/BegIYn-A9brQoSt3Y8OnccLS0VP4E3JZREJ8Pt4FZARFOSKgCiH4J0XTQAnh86QBK1XD40zz=s900-c-k-c0x00ffffff-no-rj',
    'ようこそ～💸👿
ウラロジゲームカンパニー所属VTuber 1期生
計羽リーラ(とば りーら)と申します✦
ㅤ✋😈＜雇われ社長やってます

━━━━━━ ✧ ━━━━━━
ゲーム世界のビジネスについて
ㅤ新たな発見をお届けします
━━━━━━ ✧ ━━━━━━

得意領域は会計学 / 経営学 / 税務ﾅﾄﾞ☝️',
    'Uralogic Game Company',
    '2026-08-20',
    '20:30',
    'Asia/Seoul',
    '2026-08-20T11:30:00.000Z',
    'JP',
    'https://x.com/Toba_Lila'
  )
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT 
  sc.id, ni.slug, ni.display_name, ni.profile_image_url,
  ni.description, ni.agency_name, ni.debut_date, ni.debut_time, ni.timezone, ni.start_at_utc, ni.country_code, ni.x_url
FROM uralogic_infos ni
JOIN streamerChannel sc ON sc.platform = ni.platform AND sc.channel_url = ni.channel_url
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id
);

-- ============================================================
-- PART 03: streamerChannel_info 최신 메타데이터 갱신 (UPDATE)
-- ============================================================

-- 1. 야쿠시지 메이 (薬師寺 メイ / Yakushiji Mei)
UPDATE streamerChannel_info
SET slug = 'yakushiji-mei',
    display_name = '薬師寺 メイ / Yakushiji Mei',
    agency_name = 'Uralogic Game Company',
    x_url = 'https://x.com/Yakushiji_Mei',
    country_code = 'JP',
    debut_date = '2026-08-19',
    debut_time = '20:00',
    timezone = 'Asia/Seoul',
    start_at_utc = '2026-08-19T11:00:00.000Z',
    updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@YakushijiMei'
);

-- 2. 에이코쿠 네마 (映刻 ネマ / Eikoku Nema)
UPDATE streamerChannel_info
SET slug = 'eikoku-nema',
    display_name = '映刻 ネマ / Eikoku Nema',
    agency_name = 'Uralogic Game Company',
    x_url = 'https://x.com/Eikoku_Nema',
    country_code = 'JP',
    debut_date = '2026-08-19',
    debut_time = '20:30',
    timezone = 'Asia/Seoul',
    start_at_utc = '2026-08-19T11:30:00.000Z',
    updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@EikokuNema'
);

-- 3. 우즈키 아와이 (卯月 あわい / Uzuki Awai)
UPDATE streamerChannel_info
SET slug = 'uzuki-awai',
    display_name = '卯月 あわい / Uzuki Awai',
    agency_name = 'Uralogic Game Company',
    x_url = 'https://x.com/Uzuki_Awai',
    country_code = 'JP',
    debut_date = '2026-08-19',
    debut_time = '21:00',
    timezone = 'Asia/Seoul',
    start_at_utc = '2026-08-19T12:00:00.000Z',
    description = 'ウラロジゲームカンパニー1期生の芸術担当、
卯月あわい（うずき あわい）と申します🫧

動画や配信ではゲームの世界の美しさや面白さを
美術・アーカイブの視点からつぶさに鑑賞していきます😊

とりわけ朝ごはんが好きです（🍥O🍥）

＼ ﾜ　ｰ   ｲ   ／
　　 🐶
          ＼ ﾜ　ｰ   ｲ   ／
　　　　　🐈
                    ＼ ﾜ　ｰ   ｲ   ／
　　　　　　　🐡

ひみつ🤫：元いた世界では「記録魔術師」という文化を記録し、守る仕事をしていたらしい....',
    updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@UzukiAwai'
);

-- 4. 로쿠조 미코토 (六条 ミコト / Rokujo Mikoto)
UPDATE streamerChannel_info
SET slug = 'rokujo-mikoto',
    display_name = '六条 ミコト / Rokujo Mikoto',
    agency_name = 'Uralogic Game Company',
    x_url = 'https://x.com/Rokujo_Mikoto',
    country_code = 'JP',
    debut_date = '2026-08-20',
    debut_time = '20:00',
    timezone = 'Asia/Seoul',
    start_at_utc = '2026-08-20T11:00:00.000Z',
    updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@RokujoMikoto'
);

-- 5. 토바 리라 (計羽 リーラ / Toba Lila)
UPDATE streamerChannel_info
SET slug = 'toba-lila',
    display_name = '計羽 リーラ / Toba Lila',
    agency_name = 'Uralogic Game Company',
    x_url = 'https://x.com/Toba_Lila',
    country_code = 'JP',
    debut_date = '2026-08-20',
    debut_time = '20:30',
    timezone = 'Asia/Seoul',
    start_at_utc = '2026-08-20T11:30:00.000Z',
    updated_at = CURRENT_TIMESTAMP
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@TobaLila'
);
