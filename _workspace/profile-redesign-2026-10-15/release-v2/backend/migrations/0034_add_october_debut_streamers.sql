-- Migration 0034: Add October 2026 Virtual Debut Streamers (35 Streamers)
-- 2026년 10월 금월 신규 버추얼 스트리머 35인 추가 등록
-- 1. SOOP 3인 (멍계솔, 미터 Meter, 아콩)
-- 2. CHZZK 17인 (설아, 비라랑, 아메미야 우미, 우사미 츠유하, 루치로, 레타 포스트, 하나리, 서달, 이루세, 나니망, 송레인, 시마묭, 카이, 얌세니, 아로아, 타치, 희츄기)
-- 3. YouTube JP 15인 (超渋谷計画 2기생 3인, EchoVerse 2인, UltraLMTM 6인, 幻想《ルクス》とコードの交差点 4인)
-- 4. 단축 URL ➔ 정식 32자리 고유 채널 완전값 치환, 네이버/유튜브 실측 고화질 아바타, 공식 X 링크, KST/JST 및 UTC 정규화

-- ============================================================
-- PART 01: 신규 35인 streamerChannel 상위 테이블 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name) AS (
  VALUES
  -- [SOOP 3인]
  ('SOOP', 'https://www.sooplive.com/station/shhhhy1', '멍계솔'),
  ('SOOP', 'https://www.sooplive.com/station/231meter', '미터 Meter'),
  ('SOOP', 'https://www.sooplive.com/station/akoong22', '아콩'),

  -- [CHZZK 17인]
  ('CHZZK', 'https://chzzk.naver.com/0a2bae7e4605a991a8ce7bba14f93175', '설아'),
  ('CHZZK', 'https://chzzk.naver.com/711ecca2bffb7ce172713a0185ebecd1', '비라랑'),
  ('CHZZK', 'https://chzzk.naver.com/1df8f33742ca39e2f3d9ceff93e62f2b', '아메미야 우미'),
  ('CHZZK', 'https://chzzk.naver.com/75309c13b882474563eeb21209667dae', '우사미 츠유하'),
  ('CHZZK', 'https://chzzk.naver.com/cacbb8925346372fa8698e3485610d77', '루치로'),
  ('CHZZK', 'https://chzzk.naver.com/8d34b21830132425ba82bd6fe8e4fdb0', '레타 포스트'),
  ('CHZZK', 'https://chzzk.naver.com/0fd65c4cbd02135720f0153164367c37', '하나리'),
  ('CHZZK', 'https://chzzk.naver.com/a16894b12588ce736b612649b7ad5d8e', '서달 SEODAL'),
  ('CHZZK', 'https://chzzk.naver.com/959a7053495ff478975294d94bcd2210', '이루세 IRUSE'),
  ('CHZZK', 'https://chzzk.naver.com/d04211c7446dde2e69f8e9f2bc86ca22', '나니망'),
  ('CHZZK', 'https://chzzk.naver.com/d9c1c08d8a3acec3518b373f89220bcd', '송레인'),
  ('CHZZK', 'https://chzzk.naver.com/b3038ceec20cbd1ca8d479515244a6d2', '시마묭'),
  ('CHZZK', 'https://chzzk.naver.com/93e34867d3552ea4c6613bf3bd8801c0', '카이 KAI'),
  ('CHZZK', 'https://chzzk.naver.com/ed0f16f34673a77bc1e11fc5df4b147e', '얌세니'),
  ('CHZZK', 'https://chzzk.naver.com/3c62e2d393b76fd9b76af719420a878d', '아로아 AROA'),
  ('CHZZK', 'https://chzzk.naver.com/19b3db4967fceb0c7a3cb1ddcabcfca3', '타치 Tachi'),
  ('CHZZK', 'https://chzzk.naver.com/4be09d9be04ae5dc60ac66a478d2cda3', '희츄기'),

  -- [YouTube JP 15인]
  -- 超渋谷計画 2기생
  ('YOUTUBE', 'https://www.youtube.com/channel/UC9zhtiaLVZB_rp8AXzPB9QA', '絶叫かぷぅ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCrDK8_Vhyp13Gc3vnfsX_XA', 'ハグミィ・イン・スウィートハート'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCJ7gSRb4ZlAO7gYRMAE6_oA', '導仁かなる'),
  -- EchoVerse
  ('YOUTUBE', 'https://www.youtube.com/watch?v=3eoRGmiCo0Q', '輝跡ひいろ'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=g_pxXad5wvI', 'イザ・サラバ'),
  -- UltraLMTM
  ('YOUTUBE', 'https://www.youtube.com/watch?v=4biiW7tdBcU', 'リイナ・コガ・フローライト'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=scCaHYv2DjQ', '雨莉まひる'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=6z8K22PyzFU', '結川ユイナ'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=EFsnzMnii-o', '花酒せい'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=3whmbCmaLwE', '鷲美大笑'),
  ('YOUTUBE', 'https://www.youtube.com/watch?v=qw8BlaZuUrs', '八千八ちう'),
  -- 幻想《ルクス》とコードの交差点
  ('YOUTUBE', 'https://www.youtube.com/channel/UCsZbiFHeW04L6AOqgLWRCLQ', '夜綴むにゃ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UClIxHTC_Z-ro5-pXi-apYXA', 'ひつじのめあ'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCO04CRN2riy-azjOWHQzLYg', '歌凪れい'),
  ('YOUTUBE', 'https://www.youtube.com/channel/UCOyHz1gutdlXFU4crqq13eQ', '判決にこ')
)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT n.platform, n.channel_url, n.channel_name
FROM new_channels AS n
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel AS sc
  WHERE sc.platform = n.platform AND sc.channel_url = n.channel_url
);

-- ============================================================
-- PART 02: 신규 35인 streamerChannel_info 세부 정보 등록
-- ============================================================
WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
) AS (
  VALUES
  -- ------------------------------------------------------------
  -- [SOOP 3인]
  -- ------------------------------------------------------------
  (
    'SOOP',
    'https://www.sooplive.com/station/shhhhy1',
    'myeong-gyesol',
    '멍계솔',
    'https://profile.img.sooplive.co.kr/LOGO/sh/shhhhy1/shhhhy1.jpg',
    '멍계솔 버추얼 스트리머의 공식 SOOP 데뷔 방송입니다.',
    '개인세',
    '2026-10-02',
    '18:00',
    'Asia/Seoul',
    '2026-10-02T09:00:00.000Z',
    'KR',
    'https://x.com/ganghayeon28132'
  ),
  (
    'SOOP',
    'https://www.sooplive.com/station/231meter',
    'meter',
    '미터 Meter',
    'https://profile.img.sooplive.co.kr/LOGO/23/231meter/231meter.jpg',
    '프네아 소속 미터 버추얼 스트리머의 공식 SOOP 데뷔 방송입니다.',
    '프네아',
    '2026-10-03',
    '20:00',
    'Asia/Seoul',
    '2026-10-03T11:00:00.000Z',
    'KR',
    'https://x.com/Fnea_meter'
  ),
  (
    'SOOP',
    'https://www.sooplive.com/station/akoong22',
    'akoong',
    '아콩',
    'https://profile.img.sooplive.co.kr/LOGO/ak/akoong22/akoong22.jpg',
    '말티푸 컨셉 아콩 버추얼 스트리머의 공식 SOOP 웰컴 버추얼 데뷔 방송입니다.',
    '개인세',
    '2026-10-10',
    '12:00',
    'Asia/Seoul',
    '2026-10-10T03:00:00.000Z',
    'KR',
    'https://x.com/akoong22'
  ),

  -- ------------------------------------------------------------
  -- [CHZZK 17인]
  -- ------------------------------------------------------------
  (
    'CHZZK',
    'https://chzzk.naver.com/0a2bae7e4605a991a8ce7bba14f93175',
    'seola-chzzk',
    '설아',
    'https://nng-phinf.pstatic.net/MjAyNjA5MTBfMTkz/MDAxNzg5MDI3NDk0OTYx.7CdOLYKp71MU00SJkIHje5aTVB2SJthszy2oVOiIVgUg.4hr3nLR5gQE1CGhINZ8b6MbHqnwY6h2NxKMgzXYnNu4g.PNG/image.png',
    '설아 버추얼 스트리머의 공식 치지직 첫 데뷔 방송입니다.',
    '개인세',
    '2026-10-08',
    '14:00',
    'Asia/Seoul',
    '2026-10-08T05:00:00.000Z',
    'KR',
    'https://x.com/seola47'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/711ecca2bffb7ce172713a0185ebecd1',
    'birarang',
    '비라랑',
    'https://nng-phinf.pstatic.net/MjAyNjA4MDNfMjA0/MDAxNzg1NzI5OTIwODA5.3_uwjaKRDelVTs5Ny9_oRI93gl15B0jZXVM70q0ReHQg.oUh8GHj87ZqrlIcDsTwF8Wr7R0Tn18brUlfRd6emo7Ug.PNG/image.png',
    '비라랑 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-09',
    '16:00',
    'Asia/Seoul',
    '2026-10-09T07:00:00.000Z',
    'KR',
    'https://x.com/birarang'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/1df8f33742ca39e2f3d9ceff93e62f2b',
    'amemiya-umi',
    '아메미야 우미',
    'https://nng-phinf.pstatic.net/MjAyNjA5MjFfMzEg/MDAxNzg5OTIxNDA4Nzkz.Stqp0W2CjLfhCEYfypmoyNeX0iaODtXaEDw29llV9e0g.L4nUSBTyUrje85eWvia0L0X5j-6gtY39uFxnJEWAI_Qg.PNG/image.png',
    '아메미야 우미 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-09',
    '19:00',
    'Asia/Seoul',
    '2026-10-09T10:00:00.000Z',
    'KR',
    'https://x.com/Amemiya_Umi1'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/75309c13b882474563eeb21209667dae',
    'usami-tsuyuha',
    '우사미 츠유하',
    'https://nng-phinf.pstatic.net/MjAyNjA5MTRfMjYy/MDAxNzg5MzU2MjcwMTY3.Xg7szDushWzybq02bNXvgWL4T0kD1anUeJcBJAMyfKsg.qI2iQwh2WKE4c2q-eX3dHU1qRyzt8ueiVt3fZ7a4HzYg.PNG/image.png',
    '우사미 츠유하 버추얼 스트리머의 공식 치지직 데뷔 방송입니다. (면접 보러 가겠습니다! 저 고용해주실 거죠?)',
    '개인세',
    '2026-10-10',
    '18:00',
    'Asia/Seoul',
    '2026-10-10T09:00:00.000Z',
    'KR',
    'https://x.com/usamitsuyuha'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/cacbb8925346372fa8698e3485610d77',
    'ruchiro',
    '루치로',
    'https://nng-phinf.pstatic.net/MjAyNjA5MDlfMTU3/MDAxNzg4OTM5MjYxMjgz._ICls7gcqNnb-DEG3jFv1Law-gvWX9eLc7pPijfzhzcg.y7qygTmnbRzRCFrV0LQVFGWK3Ns_N-JCQSi_Ub-vwO0g.PNG/image.png',
    '루치로 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-10',
    '23:59',
    'Asia/Seoul',
    '2026-10-10T14:59:00.000Z',
    'KR',
    'https://x.com/S_Ruchiro'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/8d34b21830132425ba82bd6fe8e4fdb0',
    'letta-post',
    '레타 포스트',
    'https://nng-phinf.pstatic.net/MjAyNjA5MTJfMjk2/MDAxNzg5MjAyMzU0MDc1.xKfjYPyc7VfoSiywfeh0VD0c2QA4m-CTAC9NwelXAi8g.LyBXd_7G_4JuEhqYx3tTEN9-fODDujJztlwEpgk1TFIg.PNG/image.png',
    '[시간 미정] 오브스타 하우스의 우편배달부 레타 포스트 버추얼 스트리머의 공식 데뷔 방송입니다.',
    '오브스타 하우스',
    '2026-10-10',
    '00:00',
    'Asia/Seoul',
    '2026-10-09T15:00:00.000Z',
    'KR',
    'https://x.com/Letta_Post'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/0fd65c4cbd02135720f0153164367c37',
    'ha-nari',
    '하나리',
    'https://nng-phinf.pstatic.net/MjAyNjA3MjdfMTE0/MDAxNzg1MTU3MTQzNjQ3.c1bvNjhNjS5kN2HcO59uMwnMTzIgHypr-379G9LPA_Mg.azS9eJ2smRUVMbcgdZOKuZsd4bzWNVJOfOIMoCBEnRYg.JPEG/image.jpg',
    '[시간 미정] 마음으로 노래하고 소통하는 하나리 영 버추얼 스트리머의 공식 데뷔 방송입니다.',
    '개인세',
    '2026-10-11',
    '00:00',
    'Asia/Seoul',
    '2026-10-10T15:00:00.000Z',
    'KR',
    'https://x.com/Ha_nari_da'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/a16894b12588ce736b612649b7ad5d8e',
    'seodal',
    '서달 SEODAL',
    'https://nng-phinf.pstatic.net/MjAyNjEwMDRfMTk3/MDAxNzkxMDgxMzYzMzky.tvoTqrEIXh-m-btv-cSckYNFBsYB_HpNkd0gup9fmPEg.wWdnAZO4frpuW_ikeGEUu8WMp482ESFDCdnhX248pfQg.PNG/image.png',
    '서달 버추얼 스트리머의 공식 치지직 첫 데뷔 방송입니다. (몽돌이들아 조금만 기다려줘!)',
    '개인세',
    '2026-10-17',
    '15:00',
    'Asia/Seoul',
    '2026-10-17T06:00:00.000Z',
    'KR',
    'https://x.com/seodaldaldol'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/959a7053495ff478975294d94bcd2210',
    'iruse',
    '이루세 IRUSE',
    'https://nng-phinf.pstatic.net/MjAyNjA5MDRfOTQg/MDAxNzg4NDgwODYwMTU2.WvYGZpOufxhQWbfgn0ulL-nrOdBmGgkKqr7__I5SDkQg.4oj-ugX3iWiujPAO6N34D70NegfZkFSx2_TSYP-b_Ckg.PNG/image.png',
    '신의 선택을 받은 별의 성녀, 이루세 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-17',
    '16:00',
    'Asia/Seoul',
    '2026-10-17T07:00:00.000Z',
    'KR',
    'https://x.com/i_ruse_'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/d04211c7446dde2e69f8e9f2bc86ca22',
    'nanimang',
    '나니망',
    'https://nng-phinf.pstatic.net/MjAyNjA4MjJfMTg4/MDAxNzg3MzU4MjkwMzcz.QtvjSssuAxcMw3HIusCqDe2Qt52kdVSIPAi3gxVDyLMg.fY7mbPlKm09YN5eHutj3fNqnz8FqGVI1iTiVtGh3poog.PNG/image.png',
    '21세기에 다시 깨어난 중세 망나니 나니망 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-17',
    '16:00',
    'Asia/Seoul',
    '2026-10-17T07:00:00.000Z',
    'KR',
    'https://x.com/nanimang_v'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/d9c1c08d8a3acec3518b373f89220bcd',
    'songrein',
    '송레인',
    'https://nng-phinf.pstatic.net/MjAyNjEwMDNfMjY1/MDAxNzkxMDE2MzA2NTUz.XSAwSd-6hjuYzs-jeySmujEkeM-3RdqlzPsmlnw0z2og.fXLagtvbi4JSkgzl9Gac_0ueJRujXfsNzG-waNiM284g.PNG/image.png',
    '아틀란티스에서 온 맥주병 인어 송레인 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-17',
    '17:00',
    'Asia/Seoul',
    '2026-10-17T08:00:00.000Z',
    'KR',
    'https://x.com/RE1N_SONG'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/b3038ceec20cbd1ca8d479515244a6d2',
    'chimamyong',
    '시마묭',
    'https://nng-phinf.pstatic.net/MjAyNjA5MjZfNiAg/MDAxNzkwMzgwOTU2NzI1.g0pqegeZXW7sbVBbyCyJc7SWOMFWp27FmrMP9abxEAUg.y1BN451A_4g98JWS3YNW7NhJ8BdSDngMfTQnOZac62Ug.JPEG/image.jpg',
    '시마묭 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-20',
    '20:00',
    'Asia/Seoul',
    '2026-10-20T11:00:00.000Z',
    'KR',
    'https://x.com/chimamyong_'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/93e34867d3552ea4c6613bf3bd8801c0',
    'kai-on',
    '카이 KAI',
    'https://nng-phinf.pstatic.net/MjAyNjA5MjdfOTAg/MDAxNzkwNDgyNjgzNzQ4.-fMnla3m-n0G7RiPSzhbumma_5x2lxClU8roe-sj9lUg.DCgTxwaXco3jzeuK1gN7X4XyRdHn8kuWJjmDRhvlfPUg.PNG/image.png',
    '카이 KAI 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-24',
    '20:00',
    'Asia/Seoul',
    '2026-10-24T11:00:00.000Z',
    'KR',
    'https://x.com/KAI_On_'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/ed0f16f34673a77bc1e11fc5df4b147e',
    'yamseni',
    '얌세니',
    'https://nng-phinf.pstatic.net/MjAyNjA5MTNfMjIy/MDAxNzg5Mjg1MDI3NjMz.FaJGAWgVFFF_qSrAg6yf4A5MjVskaJLP4lW_nQqNQIYg.QJqrtmVEBlzPx7-u8KkEY3kjQBFfB3aFxkfUxfXB2hsg.JPEG/image.jpg',
    '[시간 미정] 조폭 여중생 얌세니 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-25',
    '00:00',
    'Asia/Seoul',
    '2026-10-24T15:00:00.000Z',
    'KR',
    'https://x.com/yamseni00'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/3c62e2d393b76fd9b76af719420a878d',
    'aroa',
    '아로아 AROA',
    'https://nng-phinf.pstatic.net/MjAyNjEwMDJfMiAg/MDAxNzkwODgxNTU5NDE2.2Vs8aonn-Lt7MTmzI1VEaEfFwSoqb2bcgMSraXCgSzYg.XYZsRJnZoVOkPTMTq7g_uh6husTcPs_kUQNxIIG3O_og.PNG/image.png',
    '아로아 극단 개막! 아로아 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-30',
    '18:00',
    'Asia/Seoul',
    '2026-10-30T09:00:00.000Z',
    'KR',
    'https://x.com/aroa__vtuber'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/19b3db4967fceb0c7a3cb1ddcabcfca3',
    'tachi-3d',
    '타치 Tachi',
    'https://nng-phinf.pstatic.net/MjAyNjA4MzFfMTAz/MDAxNzg4MTQwMDgxODQz.u2c7S7JOwI5PB5pF3Pe8zH39TVMjnnPpeDKKSQYpzPwg.mW78kx-MA5315mA7lnb-DvLZoniXUuWRT0g_DpaPPMYg.PNG/image.png',
    '이로치 쇠족제비 수인 컨셉 타치 버추얼 스트리머의 공식 Original 3D 첫 데뷔 방송입니다.',
    '개인세',
    '2026-10-31',
    '16:00',
    'Asia/Seoul',
    '2026-10-31T07:00:00.000Z',
    'KR',
    'https://x.com/tachix_X'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/4be09d9be04ae5dc60ac66a478d2cda3',
    'hichugi',
    '희츄기',
    'https://nng-phinf.pstatic.net/MjAyNjEwMDRfMjEx/MDAxNzkxMTAyOTc2NzI0.GGYky4QJBMZH3brqdZVkj6hk-1c2cM-hEvSeqs1zUGYg.R9Lal5aniYk5KArJrhei_uBSsoE68JZsXNQ4Bo8G3ikg.JPEG/image.jpg',
    '희츄기 버추얼 스트리머의 공식 치지직 데뷔 방송입니다.',
    '개인세',
    '2026-10-31',
    '20:00',
    'Asia/Seoul',
    '2026-10-31T11:00:00.000Z',
    'KR',
    'https://x.com/hichugi3'
  ),

  -- ------------------------------------------------------------
  -- [YouTube JP 15인]
  -- ------------------------------------------------------------
  -- 超渋谷計画 2기생 (10/1 20:00 JST 릴레이)
  (
    'YOUTUBE',
    'https://www.youtube.com/channel/UC9zhtiaLVZB_rp8AXzPB9QA',
    'zekkyo-kapuu',
    '絶叫かぷぅ',
    'https://yt3.googleusercontent.com/f3xWlpbHC1iEgufbtwCzN86Nc__1MyTUjPyzUN-8QNVBV2QRXXJPMtHx9C1_S2CMwbNLn5UH6g=s900-c-k-c0x00ffffff-no-rj',
    '超渋谷計画 2期生 絶叫かぷぅ의 공식 데뷔 방송입니다.',
    '超渋谷計画',
    '2026-10-01',
    '20:00',
    'Asia/Tokyo',
    '2026-10-01T11:00:00.000Z',
    'JP',
    'https://x.com/KapuuZekkyo'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/channel/UCrDK8_Vhyp13Gc3vnfsX_XA',
    'hugme-in-sweetheart',
    'ハグミィ・イン・スウィートハート',
    'https://yt3.googleusercontent.com/mPEC3Rcc9HBJkntjKGCyehepmzL3QkNsmT3mC2LaTdufL5pfJvdwph4PB-OvhPtF6diR3VDXS54=s900-c-k-c0x00ffffff-no-rj',
    '超渋谷計画 2期生 ハグミィ・イン・スウィートハート의 공식 데뷔 방송입니다.',
    '超渋谷計画',
    '2026-10-01',
    '20:00',
    'Asia/Tokyo',
    '2026-10-01T11:00:00.000Z',
    'JP',
    NULL
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/channel/UCJ7gSRb4ZlAO7gYRMAE6_oA',
    'dhoni-canal',
    '導仁かなる',
    'https://yt3.googleusercontent.com/UDuHajYllj_yYX2jcbrfA1F7XAGNw7FGTjA4LugklDH8_Cik-zEl47JhG2eXDGcxfPjK7Goqxw=s900-c-k-c0x00ffffff-no-rj',
    '超渋谷計画 2期生 導仁かなる의 공식 데뷔 방송입니다.',
    '超渋谷計画',
    '2026-10-01',
    '20:00',
    'Asia/Tokyo',
    '2026-10-01T11:00:00.000Z',
    'JP',
    'https://x.com/CanalDhoni'
  ),

  -- EchoVerse (10/4, 10/17 20:00 JST)
  (
    'YOUTUBE',
    'https://www.youtube.com/watch?v=3eoRGmiCo0Q',
    'kiseki-hiiro',
    '輝跡ひいろ',
    'https://yt3.ggpht.com/lBDvYLl6306cJbLQ08PzP54yvZGQKPtldrIM0ATLaqTDeMd24H6KLBE3uG3kb8QsObPdGjqE=s900-c-k-c0x00ffffff-no-rj',
    '大丸松坂屋百貨店 EchoVerse 소속 일러스트레이터 버튜버 輝跡ひいろ의 공식 첫 데뷔 방송입니다.',
    'EchoVerse',
    '2026-10-04',
    '20:00',
    'Asia/Tokyo',
    '2026-10-04T11:00:00.000Z',
    'JP',
    'https://x.com/KisekiHiiro'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/watch?v=g_pxXad5wvI',
    'iza-saraba',
    'イザ・サラバ',
    'https://yt3.ggpht.com/H95OMN-xOevh277XTBllh17yQBfZCSh3eawtzM8WpKwmQzL-4VFfQbIKv-TSkVEqfL4h3j-4bA=s900-c-k-c0x00ffffff-no-rj',
    '大丸松坂屋百貨店 EchoVerse 소속 イザ・サラバ의 공식 첫 데뷔 방송입니다.',
    'EchoVerse',
    '2026-10-17',
    '20:00',
    'Asia/Tokyo',
    '2026-10-17T11:00:00.000Z',
    'JP',
    'https://x.com/IzaSarabat'
  ),

  -- UltraLMTM (10/5~10/6 릴레이)
  (
    'YOUTUBE',
    'https://www.youtube.com/watch?v=4biiW7tdBcU',
    'lina-koga-fluorite',
    'リイナ・コガ・フローライト',
    'https://yt3.ggpht.com/M7G8pz8LLW80wcWea0BiPiRXolOBk7HBcTglVLDKskYIF_ldxV6TpVxMZnC62ncpC9VCwG3V=s900-c-k-c0x00ffffff-no-rj',
    'UltraLMTM 소속 リイナ・コガ・フローライト의 공식 데뷔 방송입니다.',
    'UltraLMTM',
    '2026-10-05',
    '19:00',
    'Asia/Tokyo',
    '2026-10-05T10:00:00.000Z',
    'JP',
    'https://x.com/Lina_Koga_F'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/watch?v=scCaHYv2DjQ',
    'amari-mahiru',
    '雨莉まひる',
    'https://yt3.ggpht.com/kc5kJXR54rRhBOdyiYMHdM20Q64J3YY3wwNMaW66D6_99nq_N8KiCKf8ErYtaCiV2xf8oLSf=s900-c-k-c0x00ffffff-no-rj',
    'UltraLMTM 소속 雨莉まひる의 공식 데뷔 방송입니다.',
    'UltraLMTM',
    '2026-10-05',
    '19:30',
    'Asia/Tokyo',
    '2026-10-05T10:30:00.000Z',
    'JP',
    'https://x.com/Amari_Mahiru'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/watch?v=6z8K22PyzFU',
    'yuikawa-yuina',
    '結川ユイナ',
    'https://yt3.ggpht.com/9Kza0nKL1QGn1DKyu5FusYS7FnC-d0aOP7mvqngaUqkFEkdyoF640wMEyXdn0Upvk-SsxnDXEg=s900-c-k-c0x00ffffff-no-rj',
    'UltraLMTM 소속 結川ユイナ의 공식 데뷔 방송입니다.',
    'UltraLMTM',
    '2026-10-05',
    '20:00',
    'Asia/Tokyo',
    '2026-10-05T11:00:00.000Z',
    'JP',
    'https://x.com/Yuikawa_Yuina'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/watch?v=EFsnzMnii-o',
    'hanasaka-sei',
    '花酒せい',
    'https://yt3.ggpht.com/OORv-qWu8-Ja3B5gJvHUL_pbVjRSYgHJpNLxiRRcUyFlj1M3OQqzf6Wum_xooHMdZTEnpqky=s900-c-k-c0x00ffffff-no-rj',
    'UltraLMTM 소속 花酒せい의 공식 데뷔 방송입니다. (呑める花屋 bloom drop)',
    'UltraLMTM',
    '2026-10-06',
    '19:00',
    'Asia/Tokyo',
    '2026-10-06T10:00:00.000Z',
    'JP',
    'https://x.com/Hanasaka_Sei'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/watch?v=3whmbCmaLwE',
    'washimi-taisho',
    '鷲美大笑',
    'https://yt3.ggpht.com/oqcf4Km52lfwtI4MycXxgebdSzJb0at_qxaHoPzGoss7qBfk8JuagSr5C8a5UGOT7s2iBZ5jUQ=s900-c-k-c0x00ffffff-no-rj',
    'UltraLMTM 소속 鷲美大笑의 공식 데뷔 방송입니다.',
    'UltraLMTM',
    '2026-10-06',
    '19:30',
    'Asia/Tokyo',
    '2026-10-06T10:30:00.000Z',
    'JP',
    'https://x.com/Washimi_Taisho'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/watch?v=qw8BlaZuUrs',
    'pachipa-chiu',
    '八千八ちう',
    'https://yt3.ggpht.com/cyC51wWY16Dv4IFdZQUe7OmBsfh5drSas0CpCZAc6uklbExNO2eGjfDZlX0uZkpNSjRv9aWRkg=s900-c-k-c0x00ffffff-no-rj',
    'UltraLMTM 소속 八千八ちう의 공식 데뷔 방송입니다.',
    'UltraLMTM',
    '2026-10-06',
    '20:00',
    'Asia/Tokyo',
    '2026-10-06T11:00:00.000Z',
    'JP',
    'https://x.com/Pachipa_Chiu'
  ),

  -- 幻想《ルクス》とコードの交差点 (10/24 19:00~ 릴레이)
  (
    'YOUTUBE',
    'https://www.youtube.com/channel/UCsZbiFHeW04L6AOqgLWRCLQ',
    'yotsuduri-munya',
    '夜綴むにゃ',
    'https://yt3.googleusercontent.com/sZMLHIszemDfvGbNacRUGNNH8AxyrscivGyn-pHolJB1c1bjBVG-ajv2Acn6g3OagLLVbgtGgQ=s900-c-k-c0x00ffffff-no-rj',
    '幻想《ルクス》とコードの交差点 소속 夜綴むにゃ의 공식 데뷔 방송입니다.',
    '幻想《ルクス》とコードの交差点',
    '2026-10-24',
    '19:00',
    'Asia/Tokyo',
    '2026-10-24T10:00:00.000Z',
    'JP',
    'https://x.com/lxcd_Munya'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/channel/UClIxHTC_Z-ro5-pXi-apYXA',
    'hitsujino-mea',
    'ひつじのめあ',
    'https://yt3.googleusercontent.com/Bg7SMdRgi0JTKaYsr6dCQ1WM-WUN89_H_luC0QZIFwlgjYlRsCxQ31rL3z1erTZQDP_eAI2HXQ=s900-c-k-c0x00ffffff-no-rj',
    '幻想《ルクス》とコードの交差点 소속 ひつじのめあ의 공식 데뷔 방송입니다.',
    '幻想《ルクス》とコードの交差点',
    '2026-10-24',
    '19:30',
    'Asia/Tokyo',
    '2026-10-24T10:30:00.000Z',
    'JP',
    'https://x.com/lxcd_Mea'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/channel/UCO04CRN2riy-azjOWHQzLYg',
    'utanagi-rei',
    '歌凪れい',
    'https://yt3.googleusercontent.com/M3w0WpozLeQbBGM41NR0CIRXtzqQZRDMvrKEv2oAe8-iceteu0D0Ss055dq_7XhND9Y0xHm-=s900-c-k-c0x00ffffff-no-rj',
    '幻想《ルクス》とコードの交差点 소속 歌凪れい의 공식 데뷔 방송입니다.',
    '幻想《ルクス》とコードの交差点',
    '2026-10-24',
    '20:00',
    'Asia/Tokyo',
    '2026-10-24T11:00:00.000Z',
    'JP',
    'https://x.com/lxcd_Rei'
  ),
  (
    'YOUTUBE',
    'https://www.youtube.com/channel/UCOyHz1gutdlXFU4crqq13eQ',
    'judgment-nico',
    '判決にこ',
    'https://yt3.googleusercontent.com/UhYAw4eQqgW6D6BBFNnZF4ikNXtzHqKRVgGBoWh-WBBbRpcSL9dZhBvjJKbmc0goUwkxnd4o=s900-c-k-c0x00ffffff-no-rj',
    '幻想《ルクス》とコードの交差点 소속 判決にこ의 공식 데뷔 방송입니다.',
    '幻想《ルクス》とコードの交差点',
    '2026-10-24',
    '20:30',
    'Asia/Tokyo',
    '2026-10-24T11:30:00.000Z',
    'JP',
    'https://x.com/lxcd_NICO'
  )
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
)
SELECT 
  sc.id, n.slug, n.display_name, n.profile_image_url, n.description, n.agency_name, n.debut_date, n.debut_time, n.timezone, n.start_at_utc, n.country_code, n.x_url
FROM new_infos AS n
INNER JOIN streamerChannel AS sc 
  ON sc.platform = n.platform AND sc.channel_url = n.channel_url
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci
  WHERE sci.channel_id = sc.id OR sci.slug = n.slug
);
