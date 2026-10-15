-- Migration 0031: Add Late September and Early October 2026 Virtual Debut Streamers (2026-09-23 ~ 2026-10-04)
-- 신규 버추얼 스트리머 13인 추가 등록 (송이, 조하구, 아므 AMU, 코모리 레이, 설도담, 유지해, 아마노미야 미유키, 서라별, 해몽실, 동그리아, 양태양, 강두식, 하은비)
-- 1. CHZZK 10인, SOOP 3인 등록
-- 2. 시간 미정 2인 (코모리 레이, 동그리아): debut_time '00:00' 및 [시간 미정] 설명 플래그 처리
-- 3. 프네아(Fnea) 소속 3인 (양태양, 강두식, 하은비) 소속사명 '프네아' 반영
-- 4. 단축 URL ➔ 치지직 정식 32자리 고유 채널 URL 완전값 치환 및 공식 X(트위터) 링크, 고화질 아바타 반영

-- ============================================================
-- PART 01: 신규 13인 streamerChannel 등록 (중복 방지)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name) AS (
  VALUES
  -- 9월 23일 (수)
  ('CHZZK', 'https://chzzk.naver.com/203f705aba9ad477d971b53bbe13a870', '송이'),

  -- 9월 26일 (토)
  ('CHZZK', 'https://chzzk.naver.com/c9e23f9b2d858601ac5f20f46634cce2', '조하구'),
  ('CHZZK', 'https://chzzk.naver.com/6e9f55cabb8573e10641aca59badd091', '아므 AMU'),

  -- 9월 30일 (수)
  ('CHZZK', 'https://chzzk.naver.com/ada13132b498d64659d649883cb46758', '코모리 레이'),
  ('CHZZK', 'https://chzzk.naver.com/48591b9c96fa5a72f8423ee2a7bb69b2', '설도담'),

  -- 10월 01일 (목)
  ('CHZZK', 'https://chzzk.naver.com/674f82169df928bfd9246d134ea4d9ed', '유지해'),
  ('CHZZK', 'https://chzzk.naver.com/abb3b9b073a6299fcaa068b110d17b7b', '아마노미야 미유키'),

  -- 10월 02일 (금)
  ('CHZZK', 'https://chzzk.naver.com/b8f48bc302e72412c9278abeadd5892c', '서라별'),
  ('CHZZK', 'https://chzzk.naver.com/0fd395a1ee4dc720b6050fd152a44e92', '해몽실'),

  -- 10월 03일 (토)
  ('CHZZK', 'https://chzzk.naver.com/991bdaa4d7beecac608b83d6fd986989', '동그리아'),
  ('SOOP', 'https://www.sooplive.com/station/taeyang0v0', '양태양'),

  -- 10월 04일 (일)
  ('SOOP', 'https://www.sooplive.com/station/doosiki0505', '강두식'),
  ('SOOP', 'https://www.sooplive.com/station/haeunbi', '하은비')
)
INSERT INTO streamerChannel (platform, channel_url, channel_name)
SELECT n.platform, n.channel_url, n.channel_name
FROM new_channels AS n
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel AS sc
  WHERE sc.platform = n.platform AND sc.channel_url = n.channel_url
);

-- ============================================================
-- PART 02: 신규 13인 streamerChannel_info 등록 (프로필, X 링크, UTC 시각)
-- ============================================================
WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url
) AS (
  VALUES
  -- 9월 23일 (수)
  (
    'CHZZK',
    'https://chzzk.naver.com/203f705aba9ad477d971b53bbe13a870',
    'song-yi',
    '송이',
    'https://nng-phinf.pstatic.net/MjAyNjA4MjhfMjM2/MDAxNzg3ODk5ODQ1NDY2.cu5hM4oMYSWTiltwzblZb-m_zhRWpCBNJ9lTWSyz6Usg.sQlJiY5YxMUtIoc21gxN4hvnddaOvioshQ1zpSR7fPUg.JPEG/image.jpg',
    '송이 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    '개인세',
    '2026-09-23',
    '21:00',
    'Asia/Seoul',
    '2026-09-23T12:00:00.000Z',
    'KR',
    'https://x.com/toutoisongee_v'
  ),

  -- 9월 26일 (토)
  (
    'CHZZK',
    'https://chzzk.naver.com/c9e23f9b2d858601ac5f20f46634cce2',
    'johagu',
    '조하구',
    'https://nng-phinf.pstatic.net/MjAyNjAzMTFfNTIg/MDAxNzczMjE1NjQ2NDY4.Drclfo1yOhTRZAMsvNTDvxUHmrTM5yFT3eyjO9vwItwg.fLkkmDAHGCKtb7WtjeVHnchbHTGM2k1iPWIXWkdgOAog.PNG/image.png',
    '조하구 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    '개인세',
    '2026-09-26',
    '13:00',
    'Asia/Seoul',
    '2026-09-26T04:00:00.000Z',
    'KR',
    'https://x.com/johagu0506'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/6e9f55cabb8573e10641aca59badd091',
    'amu-amu',
    '아므 AMU',
    'https://nng-phinf.pstatic.net/MjAyNjA4MThfNzkg/MDAxNzg3MDE0MzgwNzk3.0C8gR281zdL_LIPMisn8J9GAds1BpWXinbu_Pe9YqiEg.1qZjUCiatkCzQ3OmMxLWbfVrTFQ0fvunWAL50C_3e9Ig.PNG/image.png',
    '아므 AMU 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    '개인세',
    '2026-09-26',
    '19:00',
    'Asia/Seoul',
    '2026-09-26T10:00:00.000Z',
    'KR',
    'https://x.com/amuletXpiece'
  ),

  -- 9월 30일 (수)
  (
    'CHZZK',
    'https://chzzk.naver.com/ada13132b498d64659d649883cb46758',
    'komori-rei',
    '코모리 레이',
    'https://nng-phinf.pstatic.net/MjAyNjA5MDhfMjU4/MDAxNzg4ODQ5ODg2NjQz.T6WmQUJhg-JAQROisocuj1O-5dM03v1JWQXpsG7qBNog.I6oPDBHHpZU9-v8QYOB1JMYVXj8tFdtD-lN2DoatG5gg.PNG/image.png',
    '[시간 미정] 코모리 레이 버추얼 스트리머의 공식 데뷔 방송입니다.',
    '개인세',
    '2026-09-30',
    '00:00',
    'Asia/Seoul',
    '2026-09-29T15:00:00.000Z',
    'KR',
    'https://x.com/Batbats00'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/48591b9c96fa5a72f8423ee2a7bb69b2',
    'seol-dodam',
    '설도담',
    'https://nng-phinf.pstatic.net/MjAyNjAyMTRfMTc4/MDAxNzcwOTk4ODAxNTMw.Il2vtX3N_NSW4HJfGcw7Mw01uyfQ8s1I5O8hJqslUoEg.QihyEljd0uS0ZCDu7N7oOdBppNAPHmBHir8Z_WmB5I4g.JPEG/image.jpg',
    '설도담 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    '개인세',
    '2026-09-30',
    '21:00',
    'Asia/Seoul',
    '2026-09-30T12:00:00.000Z',
    'KR',
    'https://x.com/Seol_dodam93'
  ),

  -- 10월 01일 (목)
  (
    'CHZZK',
    'https://chzzk.naver.com/674f82169df928bfd9246d134ea4d9ed',
    'yujihae',
    '유지해',
    'https://nng-phinf.pstatic.net/MjAyNjA5MTFfMTQ1/MDAxNzg5MTI4OTAzNjA0.pjJ9PtGNqNL7XC80nH2AwJqMjEN-2R2LPYx1rjvbldYg.w44Oqm81WCQLgjH8S2AjcfcKLvwageotEO8iepqWs5wg.PNG/image.png',
    '유지해 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    '개인세',
    '2026-10-01',
    '20:00',
    'Asia/Seoul',
    '2026-10-01T11:00:00.000Z',
    'KR',
    'https://x.com/Yo0_Jihae'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/abb3b9b073a6299fcaa068b110d17b7b',
    'amanomiya-miyuki',
    '아마노미야 미유키',
    'https://nng-phinf.pstatic.net/MjAyNjA4MzBfMTA4/MDAxNzg4MDcwNTk3MjUx.-HJV111D9tqg3TAQCOuHj2o1xwSIHad-Dq_nSFr3HBMg.4TpMONWNG9xIVAmGExRo0y1q0QwfJsTLNxft5z6jEDQg.PNG/image.png',
    '아마노미야 미유키 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    '개인세',
    '2026-10-01',
    '21:00',
    'Asia/Seoul',
    '2026-10-01T12:00:00.000Z',
    'KR',
    'https://x.com/AmanomiyaMiyuki'
  ),

  -- 10월 02일 (금)
  (
    'CHZZK',
    'https://chzzk.naver.com/b8f48bc302e72412c9278abeadd5892c',
    'seorabyeol',
    '서라별',
    'https://nng-phinf.pstatic.net/MjAyNjA5MTRfNzEg/MDAxNzg5MzI2NjQwOTUz.suPnP-HxvPiJ29_nKl4Y5mBkrk2caDppRiUiZW1JonYg.uC6bZt6-fjo1yhJM-Fltuishgtfowqjqzbstl2md_1Yg.PNG/image.png',
    '서라별 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    '개인세',
    '2026-10-02',
    '19:00',
    'Asia/Seoul',
    '2026-10-02T10:00:00.000Z',
    'KR',
    'https://x.com/Rabyul_Seo'
  ),
  (
    'CHZZK',
    'https://chzzk.naver.com/0fd395a1ee4dc720b6050fd152a44e92',
    'haemongsil',
    '해몽실',
    'https://nng-phinf.pstatic.net/MjAyNjA3MThfMTY4/MDAxNzg4NDAyNTk5MDkz.997pZfv9P3AEFh7wNU4ZSY1jB_Fw7lj4ltLbCichTTEg.10BFNlStDyVjMrw5_khldodJth3nSBqJ3qGMVkayeoIg.PNG/image.png',
    '해몽실 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    '개인세',
    '2026-10-02',
    '20:00',
    'Asia/Seoul',
    '2026-10-02T11:00:00.000Z',
    'KR',
    'https://x.com/monsil_Hae'
  ),

  -- 10월 03일 (토)
  (
    'CHZZK',
    'https://chzzk.naver.com/991bdaa4d7beecac608b83d6fd986989',
    'dongria',
    '동그리아',
    'https://nng-phinf.pstatic.net/MjAyNjA5MDRfMTE5/MDAxNzg4NTAwMTQxNDI1.YLipDEx4xRrIqb2WpeyiKnSuBIeL1WgUcuYN5oJwghUg.Oi5WGUXSpRY1rkEAfVF_czs1CjQWJYtc3pIK66qu9_Ag.PNG/image.png',
    '[시간 미정] 동그리아 버추얼 스트리머의 공식 데뷔 방송입니다.',
    '개인세',
    '2026-10-03',
    '00:00',
    'Asia/Seoul',
    '2026-10-02T15:00:00.000Z',
    'KR',
    'https://x.com/dongria_'
  ),
  (
    'SOOP',
    'https://www.sooplive.com/station/taeyang0v0',
    'yangtaeyang',
    '양태양',
    'https://profile.img.sooplive.co.kr/LOGO/ta/taeyang0v0/taeyang0v0.jpg',
    '프네아 소속 양태양 버추얼 스트리머의 공식 SOOP 데뷔 방송입니다.',
    '프네아',
    '2026-10-03',
    '13:00',
    'Asia/Seoul',
    '2026-10-03T04:00:00.000Z',
    'KR',
    'https://x.com/Fnea_Taeyang'
  ),

  -- 10월 04일 (일)
  (
    'SOOP',
    'https://www.sooplive.com/station/doosiki0505',
    'gangdoosik',
    '강두식',
    'https://profile.img.sooplive.co.kr/LOGO/do/doosiki0505/doosiki0505.jpg',
    '프네아 소속 강두식 버추얼 스트리머의 공식 SOOP 데뷔 방송입니다.',
    '프네아',
    '2026-10-04',
    '12:00',
    'Asia/Seoul',
    '2026-10-04T03:00:00.000Z',
    'KR',
    'https://x.com/Fnea_doosiki'
  ),
  (
    'SOOP',
    'https://www.sooplive.com/station/haeunbi',
    'haeunbi',
    '하은비',
    'https://profile.img.sooplive.co.kr/LOGO/ha/haeunbi/haeunbi.jpg',
    '프네아 소속 하은비 버추얼 스트리머의 공식 SOOP 데뷔 방송입니다.',
    '프네아',
    '2026-10-04',
    '16:00',
    'Asia/Seoul',
    '2026-10-04T07:00:00.000Z',
    'KR',
    'https://x.com/Fnea_eunbi'
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
