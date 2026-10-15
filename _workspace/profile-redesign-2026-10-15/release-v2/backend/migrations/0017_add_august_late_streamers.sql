-- Migration 0017: Add 49 Virtual Debut Streamers for Late August 2026 (2026-08-17 ~ 2026-08-23)

-- ============================================================
-- PART 01: 신규 49건 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name, slug) AS (
  VALUES
  ('YOUTUBE', 'https://www.youtube.com/@Gibash1', 'Gibashi', 'gibashi'), -- [2026-08-17 09:30] Gibashi
  ('SOOP', 'https://www.sooplive.com/station/shiyo1017', '시요!', 'shiyo'), -- [2026-08-17 13:00] 시요!
  ('CHZZK', 'https://chzzk.naver.com/5376ab6f9debd90909b89e48229a838a', '유솜', 'yusom'), -- [2026-08-17 14:00] 유솜
  ('CHZZK', 'https://chzzk.naver.com/89bf1185e9cc03468ab9054fa4714989', '남궁 청아', 'namgung-cheonga'), -- [2026-08-17 17:00] 남궁 청아
  ('YOUTUBE', 'https://www.youtube.com/@neuschwarz', 'ノイシュヴァルツ', 'neuschwarz'), -- [2026-08-17 18:00] ノイシュヴァルツ
  ('SOOP', 'https://www.sooplive.com/station/baeka0321', '백아♡', 'baeka'), -- [2026-08-17 19:00] 백아♡
  ('YOUTUBE', 'https://www.youtube.com/@Heure-Harezora', '晴空ひゅーり', 'heure-harezora'), -- [2026-08-17 20:00] 晴空ひゅーり
  ('YOUTUBE', 'https://www.youtube.com/@hakusuiha089', '粋羽ハク / Suiha Haku ch.', 'hakusuiha'), -- [2026-08-17 20:00] 粋羽ハク / Suiha Haku ch.
  ('YOUTUBE', 'https://www.youtube.com/@kagarimiyasan', '篝宮桔梗', 'kagarimiya-kikyo'), -- [2026-08-17 21:00] 篝宮桔梗
  ('CHZZK', 'https://chzzk.naver.com/11e2c7f389d7edf5b238280f02237f0a', '허스키 이유', 'husky-eu'), -- [2026-08-17 22:00] 허스키 이유
  ('YOUTUBE', 'https://www.youtube.com/@amairo_yuni', '天色ゆに', 'amairo-yuni'), -- [2026-08-17 22:00] 天色ゆに
  ('YOUTUBE', 'https://www.youtube.com/@HIMARI_THUNDER', '雷ひまりｰIkazuchi Himariｰ', 'himari-thunder'), -- [2026-08-17 23:00] 雷ひまりｰIkazuchi Himariｰ
  ('YOUTUBE', 'https://www.youtube.com/@Atarestia', 'Atarestia / アタレス・ティア', 'atarestia'), -- [2026-08-18 06:30] Atarestia / アタレス・ティア
  ('CHZZK', 'https://chzzk.naver.com/2becaff30b6a7f38634802111435f82c', '베코 VEKO', 'veko'), -- [2026-08-18 10:00] 베코 VEKO
  ('SOOP', 'https://www.sooplive.com/station/usolbii11', '유솔비', 'usolbi'), -- [2026-08-18 15:00] 유솔비
  ('CHZZK', 'https://chzzk.naver.com/56b50883928cbffdd0b92c81396a4281', '떼떼 ttette', 'ttette'), -- [2026-08-18 19:00] 떼떼 ttette
  ('YOUTUBE', 'https://www.youtube.com/@MaShenlian', '麻苼濂', 'mashenlian'), -- [2026-08-18 20:00] 麻苼濂
  ('CHZZK', 'https://chzzk.naver.com/7b77c578920e6f4d92b74a00880a5e2b', '코다CODA', 'coda'), -- [2026-08-19 14:00] 코다CODA
  ('SOOP', 'https://www.sooplive.com/station/luming0', '루밍*', 'luming'), -- [2026-08-19 14:00] 루밍*
  ('YOUTUBE', 'https://www.youtube.com/@YakushijiMei', 'Mei Ch. 薬師寺メイ / ウラロジゲームカンパニー', 'yakushiji-mei'), -- [2026-08-19 20:00] Mei Ch. 薬師寺メイ / ウラロジゲームカンパニー
  ('YOUTUBE', 'https://www.youtube.com/@EikokuNema', 'Nema Ch. 映刻ネマ / ウラロジゲームカンパニー', 'eikoku-nema'), -- [2026-08-19 20:30] Nema Ch. 映刻ネマ / ウラロジゲームカンパニー
  ('YOUTUBE', 'https://www.youtube.com/@UzukiAwai', 'Awai Ch. 渦記アワイ / ウラロジゲームカンパニー', 'uzuki-awai'), -- [2026-08-19 21:00] Awai Ch. 渦記アワイ / ウラロジゲームカンパニー
  ('YOUTUBE', 'https://www.youtube.com/@AldonzaKambayashi', 'Aldonza Kambayashi', 'aldonza-kambayashi'), -- [2026-08-20 10:00] Aldonza Kambayashi
  ('YOUTUBE', 'https://www.youtube.com/@%E5%86%AC%E8%87%B3-10_G', '冬至', 'toji-10g'), -- [2026-08-20 13:00] 冬至
  ('CHZZK', 'https://chzzk.naver.com/1eac7a33c986c85b29616947fc4652d8', '시로하라 히라', 'shirohara-hira'), -- [2026-08-20 14:00] 시로하라 히라
  ('CHZZK', 'https://chzzk.naver.com/c25019682014005deccd05624c81d2c1', '금견우', 'geum-gyeonwoo'), -- [2026-08-20 17:00] 금견우
  ('CHZZK', 'https://chzzk.naver.com/56f6e0a1b44ec94ad340bb2d8a34c513', '서휘 seohwi', 'seohwi'), -- [2026-08-20 17:00] 서휘 seohwi
  ('SOOP', 'https://www.sooplive.com/station/sausevi', '소세비', 'sausevi'), -- [2026-08-20 19:00] 소세비
  ('TWITCH', 'https://www.twitch.tv/jikiivt', 'jikiivt', 'jikii-vt'), -- [2026-08-20 20:00] jikiivt
  ('CHZZK', 'https://chzzk.naver.com/18792fc66d61e2d69a53ec00577b116f', '마호야 키나', 'mahoya-kina'), -- [2026-08-20 20:00] 마호야 키나
  ('YOUTUBE', 'https://www.youtube.com/@RokujoMikoto', 'Mikoto Ch. 六条ミコト / ウラロジゲームカンパニー', 'rokujo-mikoto'), -- [2026-08-20 20:00] Mikoto Ch. 六条ミコト / ウラロジゲームカンパニー
  ('YOUTUBE', 'https://www.youtube.com/@TobaLila', 'Lila Ch. 計羽リーラ / ウラロジゲームカンパニー', 'toba-lila'), -- [2026-08-20 20:30] Lila Ch. 計羽リーラ / ウラロジゲームカンパニー
  ('CHZZK', 'https://chzzk.naver.com/5805fbad11f16bb043771e25bcd591c5', '토루미', 'torumi'), -- [2026-08-20 23:00] 토루미
  ('CHZZK', 'https://chzzk.naver.com/80e549dca8b37bab0d0a8a8ea0089608', '오 찌', 'ozzi'), -- [2026-08-21 14:00] 오 찌
  ('SOOP', 'https://www.sooplive.com/station/kaneovo', '카느', 'kaneovo'), -- [2026-08-21 19:00] 카느
  ('YOUTUBE', 'https://www.youtube.com/@DenDen-Vtuber', 'Den癲電 Ch.', 'denden-vtuber'), -- [2026-08-21 20:00] Den癲電 Ch.
  ('SOOP', 'https://www.sooplive.com/station/gyeongvly', '유경♥', 'gyeongvly'), -- [2026-08-21 20:00] 유경♥
  ('CHZZK', 'https://chzzk.naver.com/a2818ad9ce87690868c3e6b60f3e33d0', '헤도 VLUP', 'hedo'), -- [2026-08-22 13:00] 헤도 VLUP
  ('SOOP', 'https://www.sooplive.com/station/nthdud000302', '나는야소영', 'nthdud-soyoung'), -- [2026-08-22 13:00] 나는야소영
  ('CHZZK', 'https://chzzk.naver.com/057813a95807a252872ab2b4d84f7f9d', '키키모라 VLUP', 'kikimora'), -- [2026-08-22 14:00] 키키모라 VLUP
  ('CHZZK', 'https://chzzk.naver.com/cd5481267bafb98094cf7a8e492284d3', '스이무 SUIMU', 'suimu'), -- [2026-08-22 15:00] 스이무 SUIMU
  ('CHZZK', 'https://chzzk.naver.com/5009507194791cc30ba39cb16957c835', '리나 아르시엘', 'rina-arciel'), -- [2026-08-22 16:00] 리나 아르시엘
  ('CHZZK', 'https://chzzk.naver.com/a1285cef7c8d78aa3d52f58e11c7c462', '델 슈 아', 'delshua'), -- [2026-08-22 18:00] 델 슈 아
  ('CHZZK', 'https://chzzk.naver.com/03c5bd649b21fcdc2725e2b218fc3bbb', '로젤리아 로젠', 'roselia-rosen'), -- [2026-08-22 18:00] 로젤리아 로젠
  ('YOUTUBE', 'https://www.youtube.com/@PleuvoirCh', 'プルヴォワール・ヌル Pleuvoir Ch.', 'pleuvoir-ch'), -- [2026-08-22 18:00] プルヴォワール・ヌル Pleuvoir Ch.
  ('YOUTUBE', 'https://www.youtube.com/@KoiseyoOtome', '恋世代おとめ Otome Ch.', 'koiseyo-otome'), -- [2026-08-22 18:30] 恋世代おとめ Otome Ch.
  ('YOUTUBE', 'https://www.youtube.com/@MaliSLR', 'Mali_SLR', 'mali-slr'), -- [2026-08-22 22:30] Mali_SLR
  ('TWITCH', 'https://www.twitch.tv/dovemuv', 'dovemuv', 'dove-muv'), -- [2026-08-23 08:00] dovemuv
  ('SOOP', 'https://www.sooplive.com/station/beastrin', '맹수린', 'beastrin') -- [2026-08-23 14:00] 맹수린
)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT n.platform, n.channel_url, n.channel_name
FROM new_channels AS n
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel AS sc
  WHERE sc.platform = n.platform AND sc.channel_url = n.channel_url
);

-- ============================================================
-- PART 02: 신규 49건 streamerChannel_info 등록 (프로필 고화질 이미지 및 세부정보)
-- ============================================================
WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
) AS (
  VALUES
  ('YOUTUBE', 'https://www.youtube.com/@Gibash1', 'gibashi', 'Gibashi', 'https://yt3.googleusercontent.com/T8xPDjpEBPrcWUhDRfyjpTlVL8Lqpyt_JXehYFpXCkDNSzC0rotVEnVdkez_JryU2y29cmSjQw=s900-c-k-c0x00ffffff-no-rj', 'かわちいかわちい家族たちを紹介するチャンネル　更新頻度←されてたら槍降るくらいに思っといて
登場する家族たち
我がアイドルフトアゴヒゲトカゲのポゴ♀
ワキコガネウロコインコのうーちゃん♀、ムーンチークのむーちゃん♂
シロハラインコのたまちゃん♂、ズグロシロハラインコのまるくん♂
たまにゲーム実況もしちゃうぜぇ
ごく稀に配信します', '개인세', '2026-08-17', '09:30', 'Asia/Seoul', '2026-08-17T00:30:00.000Z', 'US'),
  ('SOOP', 'https://www.sooplive.com/station/shiyo1017', 'shiyo', '시요!', 'https://profile.img.sooplive.co.kr/LOGO/sh/shiyo1017/shiyo1017.jpg', '시요! 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-17', '13:00', 'Asia/Seoul', '2026-08-17T04:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/5376ab6f9debd90909b89e48229a838a', 'yusom', '유솜', 'https://nng-phinf.pstatic.net/MjAyNjA3MDFfMjkg/MDAxNzgyOTA0NDMxMzc3.NqFK7CTGPt4dqeenHCeHW0ae3_HMgNS2Z9HOBCQoMawg._irLRYHFto727AsOpbMlSIrfZ7TYf2gbuuTDDVsTBqog.PNG/image.png', '(՞っ ̫ _՞) 𓈒𓏸 zZ', '개인세', '2026-08-17', '14:00', 'Asia/Seoul', '2026-08-17T05:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/89bf1185e9cc03468ab9054fa4714989', 'namgung-cheonga', '남궁 청아', 'https://nng-phinf.pstatic.net/MjAyNjA4MTdfMjY3/MDAxNzg2OTY1ODYyOTA3.ZP8xNj1IcLU4sodUKa8P6YFurm7UAq9s8A2u_DG24lkg.OQRXc-2tMbXGJCc2X5W1FN7mpo6AlgolT9alTi5HuEgg.PNG/image.png', '하늘을 노니던 청룡 남궁청아 알이 되어 다시 깨어나다.🐉💙 namgungcheonga@gmail.com', '개인세', '2026-08-17', '17:00', 'Asia/Seoul', '2026-08-17T08:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@neuschwarz', 'neuschwarz', 'ノイシュヴァルツ', 'https://yt3.googleusercontent.com/hwUxGnw3Pmx8DLxtIl7obZ3LBHkbSK8ljM4WUhP4Npx6m63JHiN-MNX_80rGd0p0NLD4XSoGPg=s900-c-k-c0x00ffffff-no-rj', 'ノイシュヴァルツ 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-17', '18:00', 'Asia/Seoul', '2026-08-17T09:00:00.000Z', 'JP'),
  ('SOOP', 'https://www.sooplive.com/station/baeka0321', 'baeka', '백아♡', 'https://profile.img.sooplive.co.kr/LOGO/ba/baeka0321/baeka0321.jpg', '백아♡ 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-17', '19:00', 'Asia/Seoul', '2026-08-17T10:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@Heure-Harezora', 'heure-harezora', '晴空ひゅーり', 'https://yt3.googleusercontent.com/l_71b3UtJHaG4VjvM1kS8iGhWqc8jLGOnYfhkZ2fZAXMPzWmFDG8NsH9IPG597nPSEcUO9j-dTA=s900-c-k-c0x00ffffff-no-rj', '晴空ひゅーり 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-17', '20:00', 'Asia/Seoul', '2026-08-17T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@hakusuiha089', 'hakusuiha', '粋羽ハク / Suiha Haku ch.', 'https://yt3.googleusercontent.com/Cmr2R9uqwK_sjUc1_MBSfkfuze-A4ahkQXOjfZNfwxrMfEy8_h_QW9oluxhSUNVp_IILDQwKNw=s900-c-k-c0x00ffffff-no-rj', 'すーい、すい
こんぱっくん！可愛ければなんでもまーる◎
粋羽ハクでーす！


個人勢 ໒꒱｜TikTok ｜タグ関連 ▷▶ Fan name#とりっP ｜Fan art #白鳥あーと ｜Live #舞鳥記録 ｜#HAKURock ｜可愛ければなんでもまーる◎ 今日もえいしょ、えいしょ！


アヒルじゃないよ、白鳥だよ。


古参になりませんか໒꒱', '개인세', '2026-08-17', '20:00', 'Asia/Seoul', '2026-08-17T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@kagarimiyasan', 'kagarimiya-kikyo', '篝宮桔梗', '', '篝宮桔梗 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-17', '21:00', 'Asia/Seoul', '2026-08-17T12:00:00.000Z', 'JP'),
  ('CHZZK', 'https://chzzk.naver.com/11e2c7f389d7edf5b238280f02237f0a', 'husky-eu', '허스키 이유', 'https://nng-phinf.pstatic.net/MjAyNjA1MjBfMjQy/MDAxNzc5MjY0NDIzMzAw.TylSgN_eTq069IVAlBzZK1BtpWVY3vhn_SqPmNj7Hfkg.sMVx6wOE2k5a7AO9S2CNSt46SlHVOQ5NEhC_qLjeiEgg.PNG/image.png', '†자유로운 소금맛 허스키 이유입니다!🧂', '개인세', '2026-08-17', '22:00', 'Asia/Seoul', '2026-08-17T13:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@amairo_yuni', 'amairo-yuni', '天色ゆに', 'https://yt3.googleusercontent.com/DpTiDdQBf3dhOZK5FYUhFsJF38-XGUKw5TgTMznsyocHFPVOUPykg6VTLx8e6BHMiw7ZCpqhTA=s900-c-k-c0x00ffffff-no-rj', 'あなたの笑顔の理由になりたい🌸‪‪

桜の木から顕現した見習い天使໒꒱.*
天色ゆにです🤍
8月17日デビュー予定⟡.·

雑談⋈ ゲーム⋈ 晩酌⋈ 歌ってみた

好きになってくれたら嬉しいな🩵', '개인세', '2026-08-17', '22:00', 'Asia/Seoul', '2026-08-17T13:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@HIMARI_THUNDER', 'himari-thunder', '雷ひまりｰIkazuchi Himariｰ', 'https://yt3.googleusercontent.com/r6C3xOG4SmBfl0yo1Ul0vqEer8Q_OSmuFnadZ-MCSOe4_NlF3jVzOmHXsGtwbgLP8G16ERKL=s900-c-k-c0x00ffffff-no-rj', 'ドキドキ！ワクワク！みんなといっぱい楽しみたいな⚡

2026年8月17日デビュー！
個人勢VTuber、雷(いかづち) ひまりだよ⚡🐉
雀魂を中心にゲーム実況を配信していくので、チャンネル登録をしてしばし待たれよ！！

↓SNSのフォローもお願いします↓', '개인세', '2026-08-17', '23:00', 'Asia/Seoul', '2026-08-17T14:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@Atarestia', 'atarestia', 'Atarestia / アタレス・ティア', 'https://yt3.googleusercontent.com/3u2mpCfFj1W7gTMhPSvD2ThO_roNwrYjgNbBrkDg7xgHXr1GR_Xmv-Mxt7B_0XrEwBZBLYokF68=s900-c-k-c0x00ffffff-no-rj', '🦢レスティって呼んでね🫧　Vtuber準備中
Ataraxia──心の平静 
Hestia───家　帰る場所 
ギリシャ神話オタクが創った、心が落ち着く「居場所」をつくるための
配信チャンネル【📚Study・♟️Board game・🎮Game】
💫3言語勉強中（英・蘭・希）💫
🦢創造主：はらわか様( @Harawaka025) 
🌙Live2D：梅桃こうめ様(@Yusura__Koume)
🩵Ευχαριστώ πολύ🫧 🦢', '개인세', '2026-08-18', '06:30', 'Asia/Seoul', '2026-08-17T21:30:00.000Z', 'US'),
  ('CHZZK', 'https://chzzk.naver.com/2becaff30b6a7f38634802111435f82c', 'veko', '베코 VEKO', 'https://nng-phinf.pstatic.net/MjAyNjA3MjlfMTI3/MDAxNzg1MzA4Mzc4MzUw.qkH3g36IrAc97AYRhiP6a86EZ8rzRd2WnnXMoIcPrGEg.S3v1rPs6ZP-47zPXD7NkC-II69Qan1Z7vFyCBRitDFog.JPEG/image.jpg', '반갑베코! {8월 18일 정식 데뷔 예정} 7월 달은 게릴라 시식 코너 방송으로 진행 ( • ᴗ - ) ✧ 📫 vekomon9@gmail.com', '개인세', '2026-08-18', '10:00', 'Asia/Seoul', '2026-08-18T01:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/usolbii11', 'usolbi', '유솔비', 'https://profile.img.sooplive.co.kr/LOGO/us/usolbii11/usolbii11.jpg', '유솔비 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-18', '15:00', 'Asia/Seoul', '2026-08-18T06:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/56b50883928cbffdd0b92c81396a4281', 'ttette', '떼떼 ttette', 'https://nng-phinf.pstatic.net/MjAyNjA4MDNfNjEg/MDAxNzg1NzUwMjQ1MjM4.t66qcUpBa8uvbBY4tDSeCg3644MhbP5JKsKdRMim7Zwg.SN--iu1gubEMhyMgqDF_xGs1YBPdEQYyKyF3_0AAALcg.PNG/image.png', '떼떼 ttette 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-18', '19:00', 'Asia/Seoul', '2026-08-18T10:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@MaShenlian', 'mashenlian', '麻苼濂', 'https://yt3.googleusercontent.com/dyCxGnJZagrTpW14vmhnfKKZVMB2NYe5tjQKY4NExn5fV1J8bM9CYOcy3cLuZWyF3dKd-vHHLMg=s900-c-k-c0x00ffffff-no-rj', 'VTuber準備中', '개인세', '2026-08-18', '20:00', 'Asia/Seoul', '2026-08-18T11:00:00.000Z', 'JP'),
  ('CHZZK', 'https://chzzk.naver.com/7b77c578920e6f4d92b74a00880a5e2b', 'coda', '코다CODA', 'https://nng-phinf.pstatic.net/MjAyNjA4MTJfMjYy/MDAxNzg2NTMwOTc5NDI5.Vz6CzUJixa0qLa24h13ckacLMjzqDuX7YEusMoTZ9wMg.AB0WW3MEGz4OSOZDPskdI2XxvSIotIek6dYXOwGsYNog.PNG/image.png', '🎻바이올린해요', '개인세', '2026-08-19', '14:00', 'Asia/Seoul', '2026-08-19T05:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/luming0', 'luming', '루밍*', 'https://profile.img.sooplive.co.kr/LOGO/lu/luming0/luming0.jpg', '루밍* 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-19', '14:00', 'Asia/Seoul', '2026-08-19T05:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@YakushijiMei', 'yakushiji-mei', 'Mei Ch. 薬師寺メイ / ウラロジゲームカンパニー', 'https://yt3.googleusercontent.com/pGH8fspEC-N1cZK4JRcb6OMuUFbDJzEJ8whW-e61ijG3svmU-JU3fYYzxNTdtUnCNxwOhK1f=s900-c-k-c0x00ffffff-no-rj', '&quot;Hello, World!&quot; 
はじめまして、ウラロジゲームカンパニー１期生の
薬師寺メイ（やくしじ　めい）と申します🧪🐍

\ 理系担当です✌🥸/ 

ゲーム世界でサイエ～ンスをしながら
新たな発見をお届けしていく系Vtuberです

得意領域は 化学／薬学／生物学 などなど', '개인세', '2026-08-19', '20:00', 'Asia/Seoul', '2026-08-19T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@EikokuNema', 'eikoku-nema', 'Nema Ch. 映刻ネマ / ウラロジゲームカンパニー', 'https://yt3.googleusercontent.com/chzeYXhkzakVn0blAYIsCEX9Y-DAv74dDlsm4lT2kHBW4RmOJgOJHTN0tJs7MN8HRj7vWXh4=s900-c-k-c0x00ffffff-no-rj', '◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢
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
🕶 𝙄𝙩&#39;𝙨 𝙨𝙝𝙤𝙬 𝙩𝙞𝙢𝙚 🕶
／／　 /　 \　 ＼＼
ㅤ', '개인세', '2026-08-19', '20:30', 'Asia/Seoul', '2026-08-19T11:30:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@UzukiAwai', 'uzuki-awai', 'Awai Ch. 渦記アワイ / ウラロジゲームカンパニー', 'https://yt3.googleusercontent.com/IqxzQL2FHEaRzFpmlPtIbpcYw71rH_XyWTkCYeZIcco8oYWtH341MXABpUGoWv8UbZOE56YsWw=s900-c-k-c0x00ffffff-no-rj', 'ウラロジゲームカンパニー1期生の芸術担当、
渦記アワイ（うずき あわい）と申します🫧

動画や配信ではゲームの世界の美しさや面白さを
美術・アーカイブの視点からつぶさに鑑賞していきます😊

とりわけ朝ごはんが好きです（🍥O🍥）

＼ ﾜ　ｰ   ｲ   ／
　　 🐶
          ＼ ﾜ　ｰ   ｲ   ／
　　　　　🐈
                    ＼ ﾜ　ｰ   ｲ   ／
　　　　　　　🐡




ひみつ🤫：元いた世界では「記録魔術師」という文化を記録し、守る仕事をしていたらしい....', '개인세', '2026-08-19', '21:00', 'Asia/Seoul', '2026-08-19T12:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@AldonzaKambayashi', 'aldonza-kambayashi', 'Aldonza Kambayashi', 'https://yt3.googleusercontent.com/zyqnJsBKpKAPt2UZM9TcEhct5baB40Mzdm8iUqlqL6J9SxVaPFnUt88e6sKS0SCePFZSji77=s900-c-k-c0x00ffffff-no-rj', 'The Gothic Dog Lolita. Aldonza welcomes you all to her show. This lovely pup is full of surprises and fun. Everyone is welcome.🐶🌹
{{{{{Debut August 19th 6pm PDT/7pmCST/9pmEST}}}}}
Twitter~~~
aldonzakambaya4
Instagram~~~
aldonza_kambayashi', '개인세', '2026-08-20', '10:00', 'Asia/Seoul', '2026-08-20T01:00:00.000Z', 'US'),
  ('YOUTUBE', 'https://www.youtube.com/@%E5%86%AC%E8%87%B3-10_G', 'toji-10g', '冬至', 'https://yt3.googleusercontent.com/MjxbwSfWTuYhyBY6uEcma4Gj7Hh0aKbbM-cLtUfkY_Dp_VeYBFeNnXLX5Rz2YYzKofXLFw5q=s900-c-k-c0x00ffffff-no-rj', 'なんちゃってイラストレーターの冬至（とうじ）です

イラスト関連の動画やゲーム配信などやっていきたいです！

【配信日】
週1日～2日・木曜日メイン
昼間の13時から15時、深夜1時から3時', '개인세', '2026-08-20', '13:00', 'Asia/Seoul', '2026-08-20T04:00:00.000Z', 'JP'),
  ('CHZZK', 'https://chzzk.naver.com/1eac7a33c986c85b29616947fc4652d8', 'shirohara-hira', '시로하라 히라', 'https://nng-phinf.pstatic.net/MjAyNjA4MTZfNjQg/MDAxNzg2ODEwNTU5MzIy.CL9_RNHV-3rxM5Ex8RBamnGqXEyHD8mab8l3I37t0h4g.VD7Chx2yC02FZxBeZuVT0swVfYDY9Dvk-MeKLRd-Zo8g.PNG/image.png', '화관의 요정 시로하라 히라입니다!', '개인세', '2026-08-20', '14:00', 'Asia/Seoul', '2026-08-20T05:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/c25019682014005deccd05624c81d2c1', 'geum-gyeonwoo', '금견우', 'https://nng-phinf.pstatic.net/MjAyNjA4MTJfMTQg/MDAxNzg2NTI1NDE5MTk4.b3TQB1IE_-1RIOarmp9sWfXBWkZhfs8K3-hq5aJdG-sg.U9DWHy8K9A2syZSU3pkf6JZzXOgIpHlW0rVO2m-pRkYg.JPEG/image.jpg', '"우리 마을에 놀러오지 않을래?🐕🐕" 시고르 마을의 수호신~!!!!
2026.08.20 데뷔예정~!', '개인세', '2026-08-20', '17:00', 'Asia/Seoul', '2026-08-20T08:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/56f6e0a1b44ec94ad340bb2d8a34c513', 'seohwi', '서휘 seohwi', 'https://nng-phinf.pstatic.net/MjAyNjA4MTdfMjEw/MDAxNzg2OTM4MTUwMjc4.ksahnhZqULwsgIxzpv2LHg8PhNSoOt4sxKJMBppw3J4g.Hlq6EVvlsXgo4PJovPHy2tbc7bW0EhkLtEh0tnTL04Mg.JPEG/image.jpg', '서휘 🐯', '개인세', '2026-08-20', '17:00', 'Asia/Seoul', '2026-08-20T08:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/sausevi', 'sausevi', '소세비', 'https://profile.img.sooplive.co.kr/LOGO/sa/sausevi/sausevi.jpg', '소세비 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-20', '19:00', 'Asia/Seoul', '2026-08-20T10:00:00.000Z', 'KR'),
  ('TWITCH', 'https://www.twitch.tv/jikiivt', 'jikii-vt', 'jikiivt', '', 'jikiivt 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-20', '20:00', 'Asia/Seoul', '2026-08-20T11:00:00.000Z', 'US'),
  ('CHZZK', 'https://chzzk.naver.com/18792fc66d61e2d69a53ec00577b116f', 'mahoya-kina', '마호야 키나', 'https://nng-phinf.pstatic.net/MjAyNjA4MDRfMTMx/MDAxNzg1NzgyNTcwMzIz.7iSW6R1nXMxlcskMOBzqSRgOAzBacM8m8JUB6GcEgUMg.yaygSrmQBOaXBUdlbQYQhFbDnwhp856cLJ3bUnCG1yIg.PNG/image.png', '마호야 키나 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-20', '20:00', 'Asia/Seoul', '2026-08-20T11:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@RokujoMikoto', 'rokujo-mikoto', 'Mikoto Ch. 六条ミコト / ウラロジゲームカンパニー', 'https://yt3.googleusercontent.com/_MO9s8YFP_LgCqnwq9_YhovPtoq8O6b1FGnWFWswJq3JJH43e7S6JhPb7BJMFsYI8zOjgbXMcA=s900-c-k-c0x00ffffff-no-rj', 'おは要役地🌞ㅤ

ウラロジゲームカンパニー所属1期生の
六条ミコト（ろくじょう みこと）⚖✨やで！

ゲームの世界に法律を持ち込んで
楽しむ系VTuberやで(?) ✧٩(ˊᗜˋ*)و✧

楽しいことも悲しいことも
六乗してプラスにしてこദ്ദി(⩌ᴗ⩌ )

末永く、よろしゅうお頼申します～～～🙇‍♂️　以上', '개인세', '2026-08-20', '20:00', 'Asia/Seoul', '2026-08-20T11:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@TobaLila', 'toba-lila', 'Lila Ch. 計羽リーラ / ウラロジゲームカンパニー', 'https://yt3.googleusercontent.com/BegIYn-A9brQoSt3Y8OnccLS0VP4E3JZREJ8Pt4FZARFOSKgCiH4J0XTQAnh86QBK1XD40zz=s900-c-k-c0x00ffffff-no-rj', 'ようこそ～💸👿
ウラロジゲームカンパニー所属VTuber 1期生
計羽リーラ(とば りーら)と申します✦
ㅤ✋😈＜雇われ社長やってます

━━━━━━ ✧ ━━━━━━
ゲーム世界のビジネスについて
ㅤ新たな発見をお届けします
━━━━━━ ✧ ━━━━━━

得意領域は会計学 / 経営学 / 税務ﾅﾄﾞ☝️', '개인세', '2026-08-20', '20:30', 'Asia/Seoul', '2026-08-20T11:30:00.000Z', 'JP'),
  ('CHZZK', 'https://chzzk.naver.com/5805fbad11f16bb043771e25bcd591c5', 'torumi', '토루미', 'https://nng-phinf.pstatic.net/MjAyNjA4MTFfMTUz/MDAxNzg2NDAxMDE3OTY1.CZDWw54lf6B1TW75FudXuSpF5RsZYGu8t8FRqIe3utUg.WhEVBGekNLxPGr8lbkArNCoG8ZfvkoGEPdDs_XYSIlwg.JPEG/image.jpg', '토루미 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-20', '23:00', 'Asia/Seoul', '2026-08-20T14:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/80e549dca8b37bab0d0a8a8ea0089608', 'ozzi', '오 찌', 'https://nng-phinf.pstatic.net/MjAyNjA2MjlfMTQ4/MDAxNzgyNzA4Njk4OTY5.EQ8nERXD9rI1l5PQRZ7pOkM7gxN003pdGsvLQ5OphUAg.hfk63XfTKtvAksyMSFMD4KlKEy7hN572hCHnOawNWdQg.PNG/image.png', '8월 21일 금요일 오후 2시 Live2D 데뷔! 많관부', '개인세', '2026-08-21', '14:00', 'Asia/Seoul', '2026-08-21T05:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/kaneovo', 'kaneovo', '카느', 'https://profile.img.sooplive.co.kr/LOGO/ka/kaneovo/kaneovo.jpg', '카느 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-21', '19:00', 'Asia/Seoul', '2026-08-21T10:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@DenDen-Vtuber', 'denden-vtuber', 'Den癲電 Ch.', 'https://yt3.googleusercontent.com/hI4w3sDzwlOtwVtRAB46qqXnnWQGGUo111DhB4Cbp300zl7rqSY-YiUC7z6VIO2y6mbzShJG=s900-c-k-c0x00ffffff-no-rj', '8月初配信，籌備中！
歡迎來和我玩。', '개인세', '2026-08-21', '20:00', 'Asia/Seoul', '2026-08-21T11:00:00.000Z', 'JP'),
  ('SOOP', 'https://www.sooplive.com/station/gyeongvly', 'gyeongvly', '유경♥', 'https://profile.img.sooplive.co.kr/LOGO/gy/gyeongvly/gyeongvly.jpg', '꒰ა🤍໒꒱', '개인세', '2026-08-21', '20:00', 'Asia/Seoul', '2026-08-21T11:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/a2818ad9ce87690868c3e6b60f3e33d0', 'hedo', '헤도 VLUP', 'https://nng-phinf.pstatic.net/MjAyNjA3MjFfMTY2/MDAxNzg0NTk3ODQ4NzQx.3DiCn3RqtaOn7aksvkzfun_UI4h5KOQJxX8fKgBO92Ag.ZN15j5tQJZEo3tPV9CkXyy0FBRCwWASTtDtmg3aOyZsg.JPEG/image.jpg', '8월 22일 오후 1시 데뷔!
캬~! 맥주가 좋아🍺탈주한 전령!🚨
VLUP에서 니트생활 시~작!!!!!!!!!!!!!!!!!!!!', '개인세', '2026-08-22', '13:00', 'Asia/Seoul', '2026-08-22T04:00:00.000Z', 'KR'),
  ('SOOP', 'https://www.sooplive.com/station/nthdud000302', 'nthdud-soyoung', '나는야소영', 'https://profile.img.sooplive.co.kr/LOGO/nt/nthdud000302/nthdud000302.jpg', '나는야소영 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-22', '13:00', 'Asia/Seoul', '2026-08-22T04:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/057813a95807a252872ab2b4d84f7f9d', 'kikimora', '키키모라 VLUP', 'https://nng-phinf.pstatic.net/MjAyNjA4MDlfMjQy/MDAxNzg2MjU5MzM4MDkx.DJpK1IyImKJESN4GtLElw6U7XfibiwYlhd8U4EZn43gg.A6J4DzQmSwwWwp2D2NBfJtinPSPNovmMAp05KGtg1z4g.PNG/image.png', '8월 22일 오후 2시 데뷔!
VLUP aka 더보기팀 소속
오카네모치가 꿈인 마법 전령🤑 🪄', '개인세', '2026-08-22', '14:00', 'Asia/Seoul', '2026-08-22T05:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/cd5481267bafb98094cf7a8e492284d3', 'suimu', '스이무 SUIMU', 'https://nng-phinf.pstatic.net/MjAyNjA3MTdfMTgg/MDAxNzg0Mjg1NTA1MDY3.jyA1_gY8DHAvzllm_mlil6s05tqDLXkFlpV2fISm0GQg.wFUHqPkL45sPkVtyZr40PoKUzrh3u18Dy4m4O-L8YVkg.PNG/image.png', '8월 22일 오후 3시 데뷔!🫧', '개인세', '2026-08-22', '15:00', 'Asia/Seoul', '2026-08-22T06:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/5009507194791cc30ba39cb16957c835', 'rina-arciel', '리나 아르시엘', 'https://nng-phinf.pstatic.net/MjAyNjA3MjlfMjU0/MDAxNzg1MzAxNTU4Nzkz.VXVLFbe4AhEQNTgGr-cxA7Xnyk832hPVENmQPOGzFfEg.J8lZ5nY7bSP1zNN9mED3GbbihTFVDquwkd7SacEjwUAg.JPEG/image.jpg', '🪄💎', '개인세', '2026-08-22', '16:00', 'Asia/Seoul', '2026-08-22T07:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/a1285cef7c8d78aa3d52f58e11c7c462', 'delshua', '델 슈 아', 'https://nng-phinf.pstatic.net/MjAyNjA3MThfMjYx/MDAxNzg0MzczNzk2MTc5.K_ueA0UYz4KXzC14G59NCRDiapiK92lR7NDGC2bd8F4g.ShN1C2ADHBlsXb4bONZTO5YQaPLLv0fDhXncumkkO0kg.PNG/image.png', '비즈니스 문의 :delsyua1@gmail.com', '개인세', '2026-08-22', '18:00', 'Asia/Seoul', '2026-08-22T09:00:00.000Z', 'KR'),
  ('CHZZK', 'https://chzzk.naver.com/03c5bd649b21fcdc2725e2b218fc3bbb', 'roselia-rosen', '로젤리아 로젠', 'https://nng-phinf.pstatic.net/MjAyNjA3MTRfMzEg/MDAxNzgzOTU1NTY5MTEw.5LfnOexcWxVKdK6hdC-z_d8_h-R4ChQ-xWuUBDObjycg.BUyi7xcIO_3v98mNnCwsn2PSzt33zBPqZnnDTj-4-ZMg.PNG/image.png', '로젤리아 로젠 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-22', '18:00', 'Asia/Seoul', '2026-08-22T09:00:00.000Z', 'KR'),
  ('YOUTUBE', 'https://www.youtube.com/@PleuvoirCh', 'pleuvoir-ch', 'プルヴォワール・ヌル Pleuvoir Ch.', 'https://yt3.googleusercontent.com/AfQCyRgvs4xJ33xoh_DaFKeGE3-vzsU0pFb4QCZxWBgwLaEnAkhqE_rzdg5dpOkn43xuY80E=s900-c-k-c0x00ffffff-no-rj', '見つけてくれてありがとう｡

歌うことが大好きなアイドル見習い🎤
プルヴォワール・ヌルです🎀📶

ここがあなたの特別な場所になりますように𓂃⋆꙳', '개인세', '2026-08-22', '18:00', 'Asia/Seoul', '2026-08-22T09:00:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@KoiseyoOtome', 'koiseyo-otome', '恋世代おとめ Otome Ch.', 'https://yt3.googleusercontent.com/M6bet_FRG2qsdwgPsHm2zhxj6Y4Br_LbYT6BuKuWahsze0jEaHjLiPwLD2l75LBMO1iSk8qkDw=s900-c-k-c0x00ffffff-no-rj', '命短し恋せよおとめ！

大正浪漫に憧れる旅作家お嬢様
恋世代おとめでございます🎴🩷

どうぞよしなに。

-------------୨୧--------------
🐰神威なつきお母様X https://x.com/n_kamui?s=21

📦️ハコネクト公式サイト https://haconect.com/ 
📦️ハコネクト公式X https://twitter.com/haconect
📦️お問い合わせ https://haconect.com/contact/', '개인세', '2026-08-22', '18:30', 'Asia/Seoul', '2026-08-22T09:30:00.000Z', 'JP'),
  ('YOUTUBE', 'https://www.youtube.com/@MaliSLR', 'mali-slr', 'Mali_SLR', 'https://yt3.googleusercontent.com/eQ8djQaYnA4qZOE2b7BPm73dDsmk3td2_yyuBSB4mwtrky3ykmfY8rvjtdWlRSdbVA-5zoma2A=s900-c-k-c0x00ffffff-no-rj', 'แฮร่~ 🐯🩵 น้องเสือขาวมะลิเองง ฝากรับพ้มไปเลี้ยงด้วยนะค้าบ 
อยากรู้จักทุกคนเยอะๆเลยย~🐾🫶🏻

🩵 MAIN TAG　#LittleMalili
🎮 LIVE　          #MaliliLive
🎨 FANART　   #MaliliArt', '개인세', '2026-08-22', '22:30', 'Asia/Seoul', '2026-08-22T13:30:00.000Z', 'US'),
  ('TWITCH', 'https://www.twitch.tv/dovemuv', 'dove-muv', 'dovemuv', '', 'dovemuv 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-23', '08:00', 'Asia/Seoul', '2026-08-22T23:00:00.000Z', 'US'),
  ('SOOP', 'https://www.sooplive.com/station/beastrin', 'beastrin', '맹수린', 'https://profile.img.sooplive.co.kr/LOGO/be/beastrin/beastrin.jpg', '맹수린 버추얼 스트리머의 첫 데뷔 방송입니다.', '개인세', '2026-08-23', '14:00', 'Asia/Seoul', '2026-08-23T05:00:00.000Z', 'KR')
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
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.channel_id = sc.id
);

-- ============================================================
-- PART 03: 기존 레코드 최신 프로필/일정 UPDATE 갱신
-- ============================================================
UPDATE streamerChannel_info
SET display_name = 'Gibashi',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/T8xPDjpEBPrcWUhDRfyjpTlVL8Lqpyt_JXehYFpXCkDNSzC0rotVEnVdkez_JryU2y29cmSjQw=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/T8xPDjpEBPrcWUhDRfyjpTlVL8Lqpyt_JXehYFpXCkDNSzC0rotVEnVdkez_JryU2y29cmSjQw=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'かわちいかわちい家族たちを紹介するチャンネル　更新頻度←されてたら槍降るくらいに思っといて
登場する家族たち
我がアイドルフトアゴヒゲトカゲのポゴ♀
ワキコガネウロコインコのうーちゃん♀、ムーンチークのむーちゃん♂
シロハラインコのたまちゃん♂、ズグロシロハラインコのまるくん♂
たまにゲーム実況もしちゃうぜぇ
ごく稀に配信します',
    debut_date = '2026-08-17',
    debut_time = '09:30',
    start_at_utc = '2026-08-17T00:30:00.000Z',
    country_code = 'US'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@Gibash1'
);

UPDATE streamerChannel_info
SET display_name = '시요!',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/sh/shiyo1017/shiyo1017.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/sh/shiyo1017/shiyo1017.jpg' ELSE profile_image_url END,
    description = '시요! 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-17',
    debut_time = '13:00',
    start_at_utc = '2026-08-17T04:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/shiyo1017'
);

UPDATE streamerChannel_info
SET display_name = '유솜',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA3MDFfMjkg/MDAxNzgyOTA0NDMxMzc3.NqFK7CTGPt4dqeenHCeHW0ae3_HMgNS2Z9HOBCQoMawg._irLRYHFto727AsOpbMlSIrfZ7TYf2gbuuTDDVsTBqog.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA3MDFfMjkg/MDAxNzgyOTA0NDMxMzc3.NqFK7CTGPt4dqeenHCeHW0ae3_HMgNS2Z9HOBCQoMawg._irLRYHFto727AsOpbMlSIrfZ7TYf2gbuuTDDVsTBqog.PNG/image.png' ELSE profile_image_url END,
    description = '(՞っ ̫ _՞) 𓈒𓏸 zZ',
    debut_date = '2026-08-17',
    debut_time = '14:00',
    start_at_utc = '2026-08-17T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/5376ab6f9debd90909b89e48229a838a'
);

UPDATE streamerChannel_info
SET display_name = '남궁 청아',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTdfMjY3/MDAxNzg2OTY1ODYyOTA3.ZP8xNj1IcLU4sodUKa8P6YFurm7UAq9s8A2u_DG24lkg.OQRXc-2tMbXGJCc2X5W1FN7mpo6AlgolT9alTi5HuEgg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTdfMjY3/MDAxNzg2OTY1ODYyOTA3.ZP8xNj1IcLU4sodUKa8P6YFurm7UAq9s8A2u_DG24lkg.OQRXc-2tMbXGJCc2X5W1FN7mpo6AlgolT9alTi5HuEgg.PNG/image.png' ELSE profile_image_url END,
    description = '하늘을 노니던 청룡 남궁청아 알이 되어 다시 깨어나다.🐉💙 namgungcheonga@gmail.com',
    debut_date = '2026-08-17',
    debut_time = '17:00',
    start_at_utc = '2026-08-17T08:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/89bf1185e9cc03468ab9054fa4714989'
);

UPDATE streamerChannel_info
SET display_name = 'ノイシュヴァルツ',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/hwUxGnw3Pmx8DLxtIl7obZ3LBHkbSK8ljM4WUhP4Npx6m63JHiN-MNX_80rGd0p0NLD4XSoGPg=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/hwUxGnw3Pmx8DLxtIl7obZ3LBHkbSK8ljM4WUhP4Npx6m63JHiN-MNX_80rGd0p0NLD4XSoGPg=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'ノイシュヴァルツ 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-17',
    debut_time = '18:00',
    start_at_utc = '2026-08-17T09:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@neuschwarz'
);

UPDATE streamerChannel_info
SET display_name = '백아♡',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/ba/baeka0321/baeka0321.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/ba/baeka0321/baeka0321.jpg' ELSE profile_image_url END,
    description = '백아♡ 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-17',
    debut_time = '19:00',
    start_at_utc = '2026-08-17T10:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/baeka0321'
);

UPDATE streamerChannel_info
SET display_name = '晴空ひゅーり',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/l_71b3UtJHaG4VjvM1kS8iGhWqc8jLGOnYfhkZ2fZAXMPzWmFDG8NsH9IPG597nPSEcUO9j-dTA=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/l_71b3UtJHaG4VjvM1kS8iGhWqc8jLGOnYfhkZ2fZAXMPzWmFDG8NsH9IPG597nPSEcUO9j-dTA=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '晴空ひゅーり 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-17',
    debut_time = '20:00',
    start_at_utc = '2026-08-17T11:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@Heure-Harezora'
);

UPDATE streamerChannel_info
SET display_name = '粋羽ハク / Suiha Haku ch.',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/Cmr2R9uqwK_sjUc1_MBSfkfuze-A4ahkQXOjfZNfwxrMfEy8_h_QW9oluxhSUNVp_IILDQwKNw=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/Cmr2R9uqwK_sjUc1_MBSfkfuze-A4ahkQXOjfZNfwxrMfEy8_h_QW9oluxhSUNVp_IILDQwKNw=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'すーい、すい
こんぱっくん！可愛ければなんでもまーる◎
粋羽ハクでーす！


個人勢 ໒꒱｜TikTok ｜タグ関連 ▷▶ Fan name#とりっP ｜Fan art #白鳥あーと ｜Live #舞鳥記録 ｜#HAKURock ｜可愛ければなんでもまーる◎ 今日もえいしょ、えいしょ！


アヒルじゃないよ、白鳥だよ。


古参になりませんか໒꒱',
    debut_date = '2026-08-17',
    debut_time = '20:00',
    start_at_utc = '2026-08-17T11:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@hakusuiha089'
);

UPDATE streamerChannel_info
SET display_name = '篝宮桔梗',
    profile_image_url = CASE WHEN '' != '' THEN '' ELSE profile_image_url END,
    description = '篝宮桔梗 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-17',
    debut_time = '21:00',
    start_at_utc = '2026-08-17T12:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@kagarimiyasan'
);

UPDATE streamerChannel_info
SET display_name = '허스키 이유',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA1MjBfMjQy/MDAxNzc5MjY0NDIzMzAw.TylSgN_eTq069IVAlBzZK1BtpWVY3vhn_SqPmNj7Hfkg.sMVx6wOE2k5a7AO9S2CNSt46SlHVOQ5NEhC_qLjeiEgg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA1MjBfMjQy/MDAxNzc5MjY0NDIzMzAw.TylSgN_eTq069IVAlBzZK1BtpWVY3vhn_SqPmNj7Hfkg.sMVx6wOE2k5a7AO9S2CNSt46SlHVOQ5NEhC_qLjeiEgg.PNG/image.png' ELSE profile_image_url END,
    description = '†자유로운 소금맛 허스키 이유입니다!🧂',
    debut_date = '2026-08-17',
    debut_time = '22:00',
    start_at_utc = '2026-08-17T13:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/11e2c7f389d7edf5b238280f02237f0a'
);

UPDATE streamerChannel_info
SET display_name = '天色ゆに',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/DpTiDdQBf3dhOZK5FYUhFsJF38-XGUKw5TgTMznsyocHFPVOUPykg6VTLx8e6BHMiw7ZCpqhTA=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/DpTiDdQBf3dhOZK5FYUhFsJF38-XGUKw5TgTMznsyocHFPVOUPykg6VTLx8e6BHMiw7ZCpqhTA=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'あなたの笑顔の理由になりたい🌸‪‪

桜の木から顕現した見習い天使໒꒱.*
天色ゆにです🤍
8月17日デビュー予定⟡.·

雑談⋈ ゲーム⋈ 晩酌⋈ 歌ってみた

好きになってくれたら嬉しいな🩵',
    debut_date = '2026-08-17',
    debut_time = '22:00',
    start_at_utc = '2026-08-17T13:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@amairo_yuni'
);

UPDATE streamerChannel_info
SET display_name = '雷ひまりｰIkazuchi Himariｰ',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/r6C3xOG4SmBfl0yo1Ul0vqEer8Q_OSmuFnadZ-MCSOe4_NlF3jVzOmHXsGtwbgLP8G16ERKL=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/r6C3xOG4SmBfl0yo1Ul0vqEer8Q_OSmuFnadZ-MCSOe4_NlF3jVzOmHXsGtwbgLP8G16ERKL=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'ドキドキ！ワクワク！みんなといっぱい楽しみたいな⚡

2026年8月17日デビュー！
個人勢VTuber、雷(いかづち) ひまりだよ⚡🐉
雀魂を中心にゲーム実況を配信していくので、チャンネル登録をしてしばし待たれよ！！

↓SNSのフォローもお願いします↓',
    debut_date = '2026-08-17',
    debut_time = '23:00',
    start_at_utc = '2026-08-17T14:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@HIMARI_THUNDER'
);

UPDATE streamerChannel_info
SET display_name = 'Atarestia / アタレス・ティア',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/3u2mpCfFj1W7gTMhPSvD2ThO_roNwrYjgNbBrkDg7xgHXr1GR_Xmv-Mxt7B_0XrEwBZBLYokF68=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/3u2mpCfFj1W7gTMhPSvD2ThO_roNwrYjgNbBrkDg7xgHXr1GR_Xmv-Mxt7B_0XrEwBZBLYokF68=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '🦢レスティって呼んでね🫧　Vtuber準備中
Ataraxia──心の平静 
Hestia───家　帰る場所 
ギリシャ神話オタクが創った、心が落ち着く「居場所」をつくるための
配信チャンネル【📚Study・♟️Board game・🎮Game】
💫3言語勉強中（英・蘭・希）💫
🦢創造主：はらわか様( @Harawaka025) 
🌙Live2D：梅桃こうめ様(@Yusura__Koume)
🩵Ευχαριστώ πολύ🫧 🦢',
    debut_date = '2026-08-18',
    debut_time = '06:30',
    start_at_utc = '2026-08-17T21:30:00.000Z',
    country_code = 'US'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@Atarestia'
);

UPDATE streamerChannel_info
SET display_name = '베코 VEKO',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA3MjlfMTI3/MDAxNzg1MzA4Mzc4MzUw.qkH3g36IrAc97AYRhiP6a86EZ8rzRd2WnnXMoIcPrGEg.S3v1rPs6ZP-47zPXD7NkC-II69Qan1Z7vFyCBRitDFog.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA3MjlfMTI3/MDAxNzg1MzA4Mzc4MzUw.qkH3g36IrAc97AYRhiP6a86EZ8rzRd2WnnXMoIcPrGEg.S3v1rPs6ZP-47zPXD7NkC-II69Qan1Z7vFyCBRitDFog.JPEG/image.jpg' ELSE profile_image_url END,
    description = '반갑베코! {8월 18일 정식 데뷔 예정} 7월 달은 게릴라 시식 코너 방송으로 진행 ( • ᴗ - ) ✧ 📫 vekomon9@gmail.com',
    debut_date = '2026-08-18',
    debut_time = '10:00',
    start_at_utc = '2026-08-18T01:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/2becaff30b6a7f38634802111435f82c'
);

UPDATE streamerChannel_info
SET display_name = '유솔비',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/us/usolbii11/usolbii11.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/us/usolbii11/usolbii11.jpg' ELSE profile_image_url END,
    description = '유솔비 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-18',
    debut_time = '15:00',
    start_at_utc = '2026-08-18T06:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/usolbii11'
);

UPDATE streamerChannel_info
SET display_name = '떼떼 ttette',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MDNfNjEg/MDAxNzg1NzUwMjQ1MjM4.t66qcUpBa8uvbBY4tDSeCg3644MhbP5JKsKdRMim7Zwg.SN--iu1gubEMhyMgqDF_xGs1YBPdEQYyKyF3_0AAALcg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MDNfNjEg/MDAxNzg1NzUwMjQ1MjM4.t66qcUpBa8uvbBY4tDSeCg3644MhbP5JKsKdRMim7Zwg.SN--iu1gubEMhyMgqDF_xGs1YBPdEQYyKyF3_0AAALcg.PNG/image.png' ELSE profile_image_url END,
    description = '떼떼 ttette 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-18',
    debut_time = '19:00',
    start_at_utc = '2026-08-18T10:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/56b50883928cbffdd0b92c81396a4281'
);

UPDATE streamerChannel_info
SET display_name = '麻苼濂',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/dyCxGnJZagrTpW14vmhnfKKZVMB2NYe5tjQKY4NExn5fV1J8bM9CYOcy3cLuZWyF3dKd-vHHLMg=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/dyCxGnJZagrTpW14vmhnfKKZVMB2NYe5tjQKY4NExn5fV1J8bM9CYOcy3cLuZWyF3dKd-vHHLMg=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'VTuber準備中',
    debut_date = '2026-08-18',
    debut_time = '20:00',
    start_at_utc = '2026-08-18T11:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@MaShenlian'
);

UPDATE streamerChannel_info
SET display_name = '코다CODA',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTJfMjYy/MDAxNzg2NTMwOTc5NDI5.Vz6CzUJixa0qLa24h13ckacLMjzqDuX7YEusMoTZ9wMg.AB0WW3MEGz4OSOZDPskdI2XxvSIotIek6dYXOwGsYNog.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTJfMjYy/MDAxNzg2NTMwOTc5NDI5.Vz6CzUJixa0qLa24h13ckacLMjzqDuX7YEusMoTZ9wMg.AB0WW3MEGz4OSOZDPskdI2XxvSIotIek6dYXOwGsYNog.PNG/image.png' ELSE profile_image_url END,
    description = '🎻바이올린해요',
    debut_date = '2026-08-19',
    debut_time = '14:00',
    start_at_utc = '2026-08-19T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/7b77c578920e6f4d92b74a00880a5e2b'
);

UPDATE streamerChannel_info
SET display_name = '루밍*',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/lu/luming0/luming0.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/lu/luming0/luming0.jpg' ELSE profile_image_url END,
    description = '루밍* 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-19',
    debut_time = '14:00',
    start_at_utc = '2026-08-19T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/luming0'
);

UPDATE streamerChannel_info
SET display_name = 'Mei Ch. 薬師寺メイ / ウラロジゲームカンパニー',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/pGH8fspEC-N1cZK4JRcb6OMuUFbDJzEJ8whW-e61ijG3svmU-JU3fYYzxNTdtUnCNxwOhK1f=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/pGH8fspEC-N1cZK4JRcb6OMuUFbDJzEJ8whW-e61ijG3svmU-JU3fYYzxNTdtUnCNxwOhK1f=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '&quot;Hello, World!&quot; 
はじめまして、ウラロジゲームカンパニー１期生の
薬師寺メイ（やくしじ　めい）と申します🧪🐍

\ 理系担当です✌🥸/ 

ゲーム世界でサイエ～ンスをしながら
新たな発見をお届けしていく系Vtuberです

得意領域は 化学／薬学／生物学 などなど',
    debut_date = '2026-08-19',
    debut_time = '20:00',
    start_at_utc = '2026-08-19T11:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@YakushijiMei'
);

UPDATE streamerChannel_info
SET display_name = 'Nema Ch. 映刻ネマ / ウラロジゲームカンパニー',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/chzeYXhkzakVn0blAYIsCEX9Y-DAv74dDlsm4lT2kHBW4RmOJgOJHTN0tJs7MN8HRj7vWXh4=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/chzeYXhkzakVn0blAYIsCEX9Y-DAv74dDlsm4lT2kHBW4RmOJgOJHTN0tJs7MN8HRj7vWXh4=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢
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
🕶 𝙄𝙩&#39;𝙨 𝙨𝙝𝙤𝙬 𝙩𝙞𝙢𝙚 🕶
／／　 /　 \　 ＼＼
ㅤ',
    debut_date = '2026-08-19',
    debut_time = '20:30',
    start_at_utc = '2026-08-19T11:30:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@EikokuNema'
);

UPDATE streamerChannel_info
SET display_name = 'Awai Ch. 渦記アワイ / ウラロジゲームカンパニー',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/IqxzQL2FHEaRzFpmlPtIbpcYw71rH_XyWTkCYeZIcco8oYWtH341MXABpUGoWv8UbZOE56YsWw=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/IqxzQL2FHEaRzFpmlPtIbpcYw71rH_XyWTkCYeZIcco8oYWtH341MXABpUGoWv8UbZOE56YsWw=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'ウラロジゲームカンパニー1期生の芸術担当、
渦記アワイ（うずき あわい）と申します🫧

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
    debut_date = '2026-08-19',
    debut_time = '21:00',
    start_at_utc = '2026-08-19T12:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@UzukiAwai'
);

UPDATE streamerChannel_info
SET display_name = 'Aldonza Kambayashi',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/zyqnJsBKpKAPt2UZM9TcEhct5baB40Mzdm8iUqlqL6J9SxVaPFnUt88e6sKS0SCePFZSji77=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/zyqnJsBKpKAPt2UZM9TcEhct5baB40Mzdm8iUqlqL6J9SxVaPFnUt88e6sKS0SCePFZSji77=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'The Gothic Dog Lolita. Aldonza welcomes you all to her show. This lovely pup is full of surprises and fun. Everyone is welcome.🐶🌹
{{{{{Debut August 19th 6pm PDT/7pmCST/9pmEST}}}}}
Twitter~~~
aldonzakambaya4
Instagram~~~
aldonza_kambayashi',
    debut_date = '2026-08-20',
    debut_time = '10:00',
    start_at_utc = '2026-08-20T01:00:00.000Z',
    country_code = 'US'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@AldonzaKambayashi'
);

UPDATE streamerChannel_info
SET display_name = '冬至',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/MjxbwSfWTuYhyBY6uEcma4Gj7Hh0aKbbM-cLtUfkY_Dp_VeYBFeNnXLX5Rz2YYzKofXLFw5q=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/MjxbwSfWTuYhyBY6uEcma4Gj7Hh0aKbbM-cLtUfkY_Dp_VeYBFeNnXLX5Rz2YYzKofXLFw5q=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'なんちゃってイラストレーターの冬至（とうじ）です

イラスト関連の動画やゲーム配信などやっていきたいです！

【配信日】
週1日～2日・木曜日メイン
昼間の13時から15時、深夜1時から3時',
    debut_date = '2026-08-20',
    debut_time = '13:00',
    start_at_utc = '2026-08-20T04:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@%E5%86%AC%E8%87%B3-10_G'
);

UPDATE streamerChannel_info
SET display_name = '시로하라 히라',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTZfNjQg/MDAxNzg2ODEwNTU5MzIy.CL9_RNHV-3rxM5Ex8RBamnGqXEyHD8mab8l3I37t0h4g.VD7Chx2yC02FZxBeZuVT0swVfYDY9Dvk-MeKLRd-Zo8g.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTZfNjQg/MDAxNzg2ODEwNTU5MzIy.CL9_RNHV-3rxM5Ex8RBamnGqXEyHD8mab8l3I37t0h4g.VD7Chx2yC02FZxBeZuVT0swVfYDY9Dvk-MeKLRd-Zo8g.PNG/image.png' ELSE profile_image_url END,
    description = '화관의 요정 시로하라 히라입니다!',
    debut_date = '2026-08-20',
    debut_time = '14:00',
    start_at_utc = '2026-08-20T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/1eac7a33c986c85b29616947fc4652d8'
);

UPDATE streamerChannel_info
SET display_name = '금견우',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTJfMTQg/MDAxNzg2NTI1NDE5MTk4.b3TQB1IE_-1RIOarmp9sWfXBWkZhfs8K3-hq5aJdG-sg.U9DWHy8K9A2syZSU3pkf6JZzXOgIpHlW0rVO2m-pRkYg.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTJfMTQg/MDAxNzg2NTI1NDE5MTk4.b3TQB1IE_-1RIOarmp9sWfXBWkZhfs8K3-hq5aJdG-sg.U9DWHy8K9A2syZSU3pkf6JZzXOgIpHlW0rVO2m-pRkYg.JPEG/image.jpg' ELSE profile_image_url END,
    description = '"우리 마을에 놀러오지 않을래?🐕🐕" 시고르 마을의 수호신~!!!!
2026.08.20 데뷔예정~!',
    debut_date = '2026-08-20',
    debut_time = '17:00',
    start_at_utc = '2026-08-20T08:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/c25019682014005deccd05624c81d2c1'
);

UPDATE streamerChannel_info
SET display_name = '서휘 seohwi',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTdfMjEw/MDAxNzg2OTM4MTUwMjc4.ksahnhZqULwsgIxzpv2LHg8PhNSoOt4sxKJMBppw3J4g.Hlq6EVvlsXgo4PJovPHy2tbc7bW0EhkLtEh0tnTL04Mg.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTdfMjEw/MDAxNzg2OTM4MTUwMjc4.ksahnhZqULwsgIxzpv2LHg8PhNSoOt4sxKJMBppw3J4g.Hlq6EVvlsXgo4PJovPHy2tbc7bW0EhkLtEh0tnTL04Mg.JPEG/image.jpg' ELSE profile_image_url END,
    description = '서휘 🐯',
    debut_date = '2026-08-20',
    debut_time = '17:00',
    start_at_utc = '2026-08-20T08:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/56f6e0a1b44ec94ad340bb2d8a34c513'
);

UPDATE streamerChannel_info
SET display_name = '소세비',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/sa/sausevi/sausevi.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/sa/sausevi/sausevi.jpg' ELSE profile_image_url END,
    description = '소세비 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-20',
    debut_time = '19:00',
    start_at_utc = '2026-08-20T10:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/sausevi'
);

UPDATE streamerChannel_info
SET display_name = 'jikiivt',
    profile_image_url = CASE WHEN '' != '' THEN '' ELSE profile_image_url END,
    description = 'jikiivt 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-20',
    debut_time = '20:00',
    start_at_utc = '2026-08-20T11:00:00.000Z',
    country_code = 'US'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'TWITCH' AND channel_url = 'https://www.twitch.tv/jikiivt'
);

UPDATE streamerChannel_info
SET display_name = '마호야 키나',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MDRfMTMx/MDAxNzg1NzgyNTcwMzIz.7iSW6R1nXMxlcskMOBzqSRgOAzBacM8m8JUB6GcEgUMg.yaygSrmQBOaXBUdlbQYQhFbDnwhp856cLJ3bUnCG1yIg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MDRfMTMx/MDAxNzg1NzgyNTcwMzIz.7iSW6R1nXMxlcskMOBzqSRgOAzBacM8m8JUB6GcEgUMg.yaygSrmQBOaXBUdlbQYQhFbDnwhp856cLJ3bUnCG1yIg.PNG/image.png' ELSE profile_image_url END,
    description = '마호야 키나 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-20',
    debut_time = '20:00',
    start_at_utc = '2026-08-20T11:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/18792fc66d61e2d69a53ec00577b116f'
);

UPDATE streamerChannel_info
SET display_name = 'Mikoto Ch. 六条ミコト / ウラロジゲームカンパニー',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/_MO9s8YFP_LgCqnwq9_YhovPtoq8O6b1FGnWFWswJq3JJH43e7S6JhPb7BJMFsYI8zOjgbXMcA=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/_MO9s8YFP_LgCqnwq9_YhovPtoq8O6b1FGnWFWswJq3JJH43e7S6JhPb7BJMFsYI8zOjgbXMcA=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'おは要役地🌞ㅤ

ウラロジゲームカンパニー所属1期生の
六条ミコト（ろくじょう みこと）⚖✨やで！

ゲームの世界に法律を持ち込んで
楽しむ系VTuberやで(?) ✧٩(ˊᗜˋ*)و✧

楽しいことも悲しいことも
六乗してプラスにしてこദ്ദി(⩌ᴗ⩌ )

末永く、よろしゅうお頼申します～～～🙇‍♂️　以上',
    debut_date = '2026-08-20',
    debut_time = '20:00',
    start_at_utc = '2026-08-20T11:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@RokujoMikoto'
);

UPDATE streamerChannel_info
SET display_name = 'Lila Ch. 計羽リーラ / ウラロジゲームカンパニー',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/BegIYn-A9brQoSt3Y8OnccLS0VP4E3JZREJ8Pt4FZARFOSKgCiH4J0XTQAnh86QBK1XD40zz=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/BegIYn-A9brQoSt3Y8OnccLS0VP4E3JZREJ8Pt4FZARFOSKgCiH4J0XTQAnh86QBK1XD40zz=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'ようこそ～💸👿
ウラロジゲームカンパニー所属VTuber 1期生
計羽リーラ(とば りーら)と申します✦
ㅤ✋😈＜雇われ社長やってます

━━━━━━ ✧ ━━━━━━
ゲーム世界のビジネスについて
ㅤ新たな発見をお届けします
━━━━━━ ✧ ━━━━━━

得意領域は会計学 / 経営学 / 税務ﾅﾄﾞ☝️',
    debut_date = '2026-08-20',
    debut_time = '20:30',
    start_at_utc = '2026-08-20T11:30:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@TobaLila'
);

UPDATE streamerChannel_info
SET display_name = '토루미',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTFfMTUz/MDAxNzg2NDAxMDE3OTY1.CZDWw54lf6B1TW75FudXuSpF5RsZYGu8t8FRqIe3utUg.WhEVBGekNLxPGr8lbkArNCoG8ZfvkoGEPdDs_XYSIlwg.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MTFfMTUz/MDAxNzg2NDAxMDE3OTY1.CZDWw54lf6B1TW75FudXuSpF5RsZYGu8t8FRqIe3utUg.WhEVBGekNLxPGr8lbkArNCoG8ZfvkoGEPdDs_XYSIlwg.JPEG/image.jpg' ELSE profile_image_url END,
    description = '토루미 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-20',
    debut_time = '23:00',
    start_at_utc = '2026-08-20T14:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/5805fbad11f16bb043771e25bcd591c5'
);

UPDATE streamerChannel_info
SET display_name = '오 찌',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA2MjlfMTQ4/MDAxNzgyNzA4Njk4OTY5.EQ8nERXD9rI1l5PQRZ7pOkM7gxN003pdGsvLQ5OphUAg.hfk63XfTKtvAksyMSFMD4KlKEy7hN572hCHnOawNWdQg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA2MjlfMTQ4/MDAxNzgyNzA4Njk4OTY5.EQ8nERXD9rI1l5PQRZ7pOkM7gxN003pdGsvLQ5OphUAg.hfk63XfTKtvAksyMSFMD4KlKEy7hN572hCHnOawNWdQg.PNG/image.png' ELSE profile_image_url END,
    description = '8월 21일 금요일 오후 2시 Live2D 데뷔! 많관부',
    debut_date = '2026-08-21',
    debut_time = '14:00',
    start_at_utc = '2026-08-21T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/80e549dca8b37bab0d0a8a8ea0089608'
);

UPDATE streamerChannel_info
SET display_name = '카느',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/ka/kaneovo/kaneovo.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/ka/kaneovo/kaneovo.jpg' ELSE profile_image_url END,
    description = '카느 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-21',
    debut_time = '19:00',
    start_at_utc = '2026-08-21T10:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/kaneovo'
);

UPDATE streamerChannel_info
SET display_name = 'Den癲電 Ch.',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/hI4w3sDzwlOtwVtRAB46qqXnnWQGGUo111DhB4Cbp300zl7rqSY-YiUC7z6VIO2y6mbzShJG=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/hI4w3sDzwlOtwVtRAB46qqXnnWQGGUo111DhB4Cbp300zl7rqSY-YiUC7z6VIO2y6mbzShJG=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '8月初配信，籌備中！
歡迎來和我玩。',
    debut_date = '2026-08-21',
    debut_time = '20:00',
    start_at_utc = '2026-08-21T11:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@DenDen-Vtuber'
);

UPDATE streamerChannel_info
SET display_name = '유경♥',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/gy/gyeongvly/gyeongvly.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/gy/gyeongvly/gyeongvly.jpg' ELSE profile_image_url END,
    description = '꒰ა🤍໒꒱',
    debut_date = '2026-08-21',
    debut_time = '20:00',
    start_at_utc = '2026-08-21T11:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/gyeongvly'
);

UPDATE streamerChannel_info
SET display_name = '헤도 VLUP',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA3MjFfMTY2/MDAxNzg0NTk3ODQ4NzQx.3DiCn3RqtaOn7aksvkzfun_UI4h5KOQJxX8fKgBO92Ag.ZN15j5tQJZEo3tPV9CkXyy0FBRCwWASTtDtmg3aOyZsg.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA3MjFfMTY2/MDAxNzg0NTk3ODQ4NzQx.3DiCn3RqtaOn7aksvkzfun_UI4h5KOQJxX8fKgBO92Ag.ZN15j5tQJZEo3tPV9CkXyy0FBRCwWASTtDtmg3aOyZsg.JPEG/image.jpg' ELSE profile_image_url END,
    description = '8월 22일 오후 1시 데뷔!
캬~! 맥주가 좋아🍺탈주한 전령!🚨
VLUP에서 니트생활 시~작!!!!!!!!!!!!!!!!!!!!',
    debut_date = '2026-08-22',
    debut_time = '13:00',
    start_at_utc = '2026-08-22T04:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/a2818ad9ce87690868c3e6b60f3e33d0'
);

UPDATE streamerChannel_info
SET display_name = '나는야소영',
    profile_image_url = CASE WHEN 'https://profile.img.sooplive.co.kr/LOGO/nt/nthdud000302/nthdud000302.jpg' != '' THEN 'https://profile.img.sooplive.co.kr/LOGO/nt/nthdud000302/nthdud000302.jpg' ELSE profile_image_url END,
    description = '나는야소영 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-22',
    debut_time = '13:00',
    start_at_utc = '2026-08-22T04:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/nthdud000302'
);

UPDATE streamerChannel_info
SET display_name = '키키모라 VLUP',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA4MDlfMjQy/MDAxNzg2MjU5MzM4MDkx.DJpK1IyImKJESN4GtLElw6U7XfibiwYlhd8U4EZn43gg.A6J4DzQmSwwWwp2D2NBfJtinPSPNovmMAp05KGtg1z4g.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA4MDlfMjQy/MDAxNzg2MjU5MzM4MDkx.DJpK1IyImKJESN4GtLElw6U7XfibiwYlhd8U4EZn43gg.A6J4DzQmSwwWwp2D2NBfJtinPSPNovmMAp05KGtg1z4g.PNG/image.png' ELSE profile_image_url END,
    description = '8월 22일 오후 2시 데뷔!
VLUP aka 더보기팀 소속
오카네모치가 꿈인 마법 전령🤑 🪄',
    debut_date = '2026-08-22',
    debut_time = '14:00',
    start_at_utc = '2026-08-22T05:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/057813a95807a252872ab2b4d84f7f9d'
);

UPDATE streamerChannel_info
SET display_name = '스이무 SUIMU',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA3MTdfMTgg/MDAxNzg0Mjg1NTA1MDY3.jyA1_gY8DHAvzllm_mlil6s05tqDLXkFlpV2fISm0GQg.wFUHqPkL45sPkVtyZr40PoKUzrh3u18Dy4m4O-L8YVkg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA3MTdfMTgg/MDAxNzg0Mjg1NTA1MDY3.jyA1_gY8DHAvzllm_mlil6s05tqDLXkFlpV2fISm0GQg.wFUHqPkL45sPkVtyZr40PoKUzrh3u18Dy4m4O-L8YVkg.PNG/image.png' ELSE profile_image_url END,
    description = '8월 22일 오후 3시 데뷔!🫧',
    debut_date = '2026-08-22',
    debut_time = '15:00',
    start_at_utc = '2026-08-22T06:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/cd5481267bafb98094cf7a8e492284d3'
);

UPDATE streamerChannel_info
SET display_name = '리나 아르시엘',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA3MjlfMjU0/MDAxNzg1MzAxNTU4Nzkz.VXVLFbe4AhEQNTgGr-cxA7Xnyk832hPVENmQPOGzFfEg.J8lZ5nY7bSP1zNN9mED3GbbihTFVDquwkd7SacEjwUAg.JPEG/image.jpg' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA3MjlfMjU0/MDAxNzg1MzAxNTU4Nzkz.VXVLFbe4AhEQNTgGr-cxA7Xnyk832hPVENmQPOGzFfEg.J8lZ5nY7bSP1zNN9mED3GbbihTFVDquwkd7SacEjwUAg.JPEG/image.jpg' ELSE profile_image_url END,
    description = '🪄💎',
    debut_date = '2026-08-22',
    debut_time = '16:00',
    start_at_utc = '2026-08-22T07:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/5009507194791cc30ba39cb16957c835'
);

UPDATE streamerChannel_info
SET display_name = '델 슈 아',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA3MThfMjYx/MDAxNzg0MzczNzk2MTc5.K_ueA0UYz4KXzC14G59NCRDiapiK92lR7NDGC2bd8F4g.ShN1C2ADHBlsXb4bONZTO5YQaPLLv0fDhXncumkkO0kg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA3MThfMjYx/MDAxNzg0MzczNzk2MTc5.K_ueA0UYz4KXzC14G59NCRDiapiK92lR7NDGC2bd8F4g.ShN1C2ADHBlsXb4bONZTO5YQaPLLv0fDhXncumkkO0kg.PNG/image.png' ELSE profile_image_url END,
    description = '비즈니스 문의 :delsyua1@gmail.com',
    debut_date = '2026-08-22',
    debut_time = '18:00',
    start_at_utc = '2026-08-22T09:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/a1285cef7c8d78aa3d52f58e11c7c462'
);

UPDATE streamerChannel_info
SET display_name = '로젤리아 로젠',
    profile_image_url = CASE WHEN 'https://nng-phinf.pstatic.net/MjAyNjA3MTRfMzEg/MDAxNzgzOTU1NTY5MTEw.5LfnOexcWxVKdK6hdC-z_d8_h-R4ChQ-xWuUBDObjycg.BUyi7xcIO_3v98mNnCwsn2PSzt33zBPqZnnDTj-4-ZMg.PNG/image.png' != '' THEN 'https://nng-phinf.pstatic.net/MjAyNjA3MTRfMzEg/MDAxNzgzOTU1NTY5MTEw.5LfnOexcWxVKdK6hdC-z_d8_h-R4ChQ-xWuUBDObjycg.BUyi7xcIO_3v98mNnCwsn2PSzt33zBPqZnnDTj-4-ZMg.PNG/image.png' ELSE profile_image_url END,
    description = '로젤리아 로젠 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-22',
    debut_time = '18:00',
    start_at_utc = '2026-08-22T09:00:00.000Z',
    country_code = 'KR'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'CHZZK' AND channel_url = 'https://chzzk.naver.com/03c5bd649b21fcdc2725e2b218fc3bbb'
);

UPDATE streamerChannel_info
SET display_name = 'プルヴォワール・ヌル Pleuvoir Ch.',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/AfQCyRgvs4xJ33xoh_DaFKeGE3-vzsU0pFb4QCZxWBgwLaEnAkhqE_rzdg5dpOkn43xuY80E=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/AfQCyRgvs4xJ33xoh_DaFKeGE3-vzsU0pFb4QCZxWBgwLaEnAkhqE_rzdg5dpOkn43xuY80E=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '見つけてくれてありがとう｡

歌うことが大好きなアイドル見習い🎤
プルヴォワール・ヌルです🎀📶

ここがあなたの特別な場所になりますように𓂃⋆꙳',
    debut_date = '2026-08-22',
    debut_time = '18:00',
    start_at_utc = '2026-08-22T09:00:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@PleuvoirCh'
);

UPDATE streamerChannel_info
SET display_name = '恋世代おとめ Otome Ch.',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/M6bet_FRG2qsdwgPsHm2zhxj6Y4Br_LbYT6BuKuWahsze0jEaHjLiPwLD2l75LBMO1iSk8qkDw=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/M6bet_FRG2qsdwgPsHm2zhxj6Y4Br_LbYT6BuKuWahsze0jEaHjLiPwLD2l75LBMO1iSk8qkDw=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = '命短し恋せよおとめ！

大正浪漫に憧れる旅作家お嬢様
恋世代おとめでございます🎴🩷

どうぞよしなに。

-------------୨୧--------------
🐰神威なつきお母様X https://x.com/n_kamui?s=21

📦️ハコネクト公式サイト https://haconect.com/ 
📦️ハコネクト公式X https://twitter.com/haconect
📦️お問い合わせ https://haconect.com/contact/',
    debut_date = '2026-08-22',
    debut_time = '18:30',
    start_at_utc = '2026-08-22T09:30:00.000Z',
    country_code = 'JP'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@KoiseyoOtome'
);

UPDATE streamerChannel_info
SET display_name = 'Mali_SLR',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/eQ8djQaYnA4qZOE2b7BPm73dDsmk3td2_yyuBSB4mwtrky3ykmfY8rvjtdWlRSdbVA-5zoma2A=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/eQ8djQaYnA4qZOE2b7BPm73dDsmk3td2_yyuBSB4mwtrky3ykmfY8rvjtdWlRSdbVA-5zoma2A=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = 'แฮร่~ 🐯🩵 น้องเสือขาวมะลิเองง ฝากรับพ้มไปเลี้ยงด้วยนะค้าบ 
อยากรู้จักทุกคนเยอะๆเลยย~🐾🫶🏻

🩵 MAIN TAG　#LittleMalili
🎮 LIVE　          #MaliliLive
🎨 FANART　   #MaliliArt',
    debut_date = '2026-08-22',
    debut_time = '22:30',
    start_at_utc = '2026-08-22T13:30:00.000Z',
    country_code = 'US'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@MaliSLR'
);

UPDATE streamerChannel_info
SET display_name = 'dovemuv',
    profile_image_url = CASE WHEN '' != '' THEN '' ELSE profile_image_url END,
    description = 'dovemuv 버추얼 스트리머의 첫 데뷔 방송입니다.',
    debut_date = '2026-08-23',
    debut_time = '08:00',
    start_at_utc = '2026-08-22T23:00:00.000Z',
    country_code = 'US'
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'TWITCH' AND channel_url = 'https://www.twitch.tv/dovemuv'
);

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

