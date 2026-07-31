-- Migration 0008: Add 31 SOOP Welcome Virtual Debut Streamers & Clean up Soram Transfer

-- ============================================================
-- PART 00: 소람 (soram0324) 오분류 정리 (이적 일정 1건 삭제)
-- ============================================================
DELETE FROM streamerChannel_info
WHERE slug = 'soram'
  AND debut_date = '2026-07-09'
  AND channel_id IN (
    SELECT id
    FROM streamerChannel
    WHERE platform = 'SOOP'
      AND channel_url = 'https://www.sooplive.com/station/soram0324'
  );

DELETE FROM streamerChannel
WHERE platform = 'SOOP'
  AND channel_url = 'https://www.sooplive.com/station/soram0324'
  AND NOT EXISTS (
    SELECT 1
    FROM streamerChannel_info AS sci
    WHERE sci.channel_id = streamerChannel.id
  );

-- ============================================================
-- PART 01 (8명)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name, slug) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/ranche4301', '네아♥', 'nea'),
  ('SOOP', 'https://www.sooplive.com/station/aarong37', '아롱띠_', 'arongtti'),
  ('SOOP', 'https://www.sooplive.com/station/gkgkgk1004', '복순앙', 'boksunang'),
  ('SOOP', 'https://www.sooplive.com/station/zzangaji1025', '짱아지!', 'jjangaji'),
  ('SOOP', 'https://www.sooplive.com/station/acongii', '뭉찌°', 'mungjji'),
  ('SOOP', 'https://www.sooplive.com/station/ehddlscjs12', '퍼브', 'peobeu'),
  ('SOOP', 'https://www.sooplive.com/station/chaeding193', '에브', 'ebeu'),
  ('SOOP', 'https://www.sooplive.com/station/eighty', '여든♬', 'yeodeun')
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

WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc
) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/ranche4301', 'nea', '네아', 'https://profile.img.sooplive.com/LOGO/ra/ranche4301/ranche4301.jpg', '2026.07.01 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-01', '17:00', 'Asia/Seoul', '2026-07-01T08:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/aarong37', 'arongtti', '아롱띠', 'https://profile.img.sooplive.com/LOGO/aa/aarong37/aarong37.jpg', '2026.07.01 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-01', '19:00', 'Asia/Seoul', '2026-07-01T10:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/gkgkgk1004', 'boksunang', '복순앙', 'https://profile.img.sooplive.com/LOGO/gk/gkgkgk1004/gkgkgk1004.jpg', '2026.07.01 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-01', '20:00', 'Asia/Seoul', '2026-07-01T11:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/zzangaji1025', 'jjangaji', '짱아지', 'https://profile.img.sooplive.com/LOGO/zz/zzangaji1025/zzangaji1025.jpg', '2026.07.04 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-04', '19:00', 'Asia/Seoul', '2026-07-04T10:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/acongii', 'mungjji', '뭉찌', 'https://profile.img.sooplive.com/LOGO/ac/acongii/acongii.jpg', '2026.07.05 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-05', '14:00', 'Asia/Seoul', '2026-07-05T05:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/ehddlscjs12', 'peobeu', '퍼브', 'https://profile.img.sooplive.com/LOGO/eh/ehddlscjs12/ehddlscjs12.jpg', '2026.07.07 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-07', '12:00', 'Asia/Seoul', '2026-07-07T03:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/chaeding193', 'ebeu', '에브', 'https://profile.img.sooplive.com/LOGO/ch/chaeding193/chaeding193.jpg', '2026.07.10 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-10', '14:00', 'Asia/Seoul', '2026-07-10T05:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/eighty', 'yeodeun', '여든', 'https://profile.img.sooplive.com/LOGO/ei/eighty/eighty.jpg', '2026.07.10 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-10', '19:00', 'Asia/Seoul', '2026-07-10T10:00:00.000Z')
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url, description,
  agency_name, debut_date, debut_time, timezone, start_at_utc
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
  n.start_at_utc
FROM new_infos AS n
JOIN streamerChannel AS sc
  ON sc.id = (
    SELECT sc2.id
    FROM streamerChannel AS sc2
    WHERE sc2.platform = n.platform AND sc2.channel_url = n.channel_url
    ORDER BY sc2.id
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.slug = n.slug
)
AND NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.channel_id = sc.id
);

-- ============================================================
-- PART 02 (8명)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name, slug) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/cho221234', '레나설', 'renaseol'),
  ('SOOP', 'https://www.sooplive.com/station/nyanyaaa', '파냐｡', 'panya'),
  ('SOOP', 'https://www.sooplive.com/station/9hongdan', '금홍단', 'geumhongdan'),
  ('SOOP', 'https://www.sooplive.com/station/oiguu5252', '529u', '529u'),
  ('SOOP', 'https://www.sooplive.com/station/ravenlucifer', '라벤_?', 'raven'),
  ('SOOP', 'https://www.sooplive.com/station/damedesu', '다메!!', 'dame'),
  ('SOOP', 'https://www.sooplive.com/station/zuijjang', '냥미당', 'nyangmidang'),
  ('SOOP', 'https://www.sooplive.com/station/nmoohae1205', '무해_', 'muhae')
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

WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc
) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/cho221234', 'renaseol', '레나설', 'https://profile.img.sooplive.com/LOGO/ch/cho221234/cho221234.jpg', '2026.07.11 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-11', '13:00', 'Asia/Seoul', '2026-07-11T04:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/nyanyaaa', 'panya', '파냐', 'https://profile.img.sooplive.com/LOGO/ny/nyanyaaa/nyanyaaa.jpg', '2026.07.11 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-11', '14:00', 'Asia/Seoul', '2026-07-11T05:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/9hongdan', 'geumhongdan', '금홍단', 'https://profile.img.sooplive.com/LOGO/9h/9hongdan/9hongdan.jpg', '2026.07.15 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-15', '12:00', 'Asia/Seoul', '2026-07-15T03:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/oiguu5252', '529u', '529u', 'https://profile.img.sooplive.com/LOGO/oi/oiguu5252/oiguu5252.jpg', '2026.07.15 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-15', '19:00', 'Asia/Seoul', '2026-07-15T10:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/ravenlucifer', 'raven', '라벤', 'https://profile.img.sooplive.com/LOGO/ra/ravenlucifer/ravenlucifer.jpg', '2026.07.15 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-15', '21:00', 'Asia/Seoul', '2026-07-15T12:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/damedesu', 'dame', '다메', 'https://profile.img.sooplive.com/LOGO/da/damedesu/damedesu.jpg', '2026.07.16 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-16', '13:00', 'Asia/Seoul', '2026-07-16T04:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/zuijjang', 'nyangmidang', '냥미당', 'https://profile.img.sooplive.com/LOGO/zu/zuijjang/zuijjang.jpg', '2026.07.17 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-17', '17:00', 'Asia/Seoul', '2026-07-17T08:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/nmoohae1205', 'muhae', '무해', 'https://profile.img.sooplive.com/LOGO/nm/nmoohae1205/nmoohae1205.jpg', '2026.07.18 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-18', '14:00', 'Asia/Seoul', '2026-07-18T05:00:00.000Z')
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url, description,
  agency_name, debut_date, debut_time, timezone, start_at_utc
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
  n.start_at_utc
FROM new_infos AS n
JOIN streamerChannel AS sc
  ON sc.id = (
    SELECT sc2.id
    FROM streamerChannel AS sc2
    WHERE sc2.platform = n.platform AND sc2.channel_url = n.channel_url
    ORDER BY sc2.id
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.slug = n.slug
)
AND NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.channel_id = sc.id
);

-- ============================================================
-- PART 03 (8명)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name, slug) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/taco05', '땜밍', 'ttaemming'),
  ('SOOP', 'https://www.sooplive.com/station/ppippang', '뿌빵°', 'ppubbang'),
  ('SOOP', 'https://www.sooplive.com/station/usagiwooru', '우사기_우루', 'usagi-uru'),
  ('SOOP', 'https://www.sooplive.com/station/971026ck', '댕보라', 'daengbora'),
  ('SOOP', 'https://www.sooplive.com/station/keueukya', '크으캬', 'keueukya'),
  ('SOOP', 'https://www.sooplive.com/station/ddiddu4', '치즈치즈♪', 'cheese-cheese'),
  ('SOOP', 'https://www.sooplive.com/station/khoya8263', '김우엥', 'kim-ueng'),
  ('SOOP', 'https://www.sooplive.com/station/songchiro', '츄로미', 'churomi')
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

WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc
) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/taco05', 'ttaemming', '땜밍', 'https://profile.img.sooplive.com/LOGO/ta/taco05/taco05.jpg', '2026.07.18 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-18', '20:00', 'Asia/Seoul', '2026-07-18T11:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/ppippang', 'ppubbang', '뿌빵', 'https://profile.img.sooplive.com/LOGO/pp/ppippang/ppippang.jpg', '2026.07.22 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-22', '20:00', 'Asia/Seoul', '2026-07-22T11:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/usagiwooru', 'usagi-uru', '우사기 우루', 'https://profile.img.sooplive.com/LOGO/us/usagiwooru/usagiwooru.jpg', '2026.07.24 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-24', '01:00', 'Asia/Seoul', '2026-07-23T16:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/971026ck', 'daengbora', '댕보라', 'https://profile.img.sooplive.com/LOGO/97/971026ck/971026ck.jpg', '2026.07.25 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-25', '17:00', 'Asia/Seoul', '2026-07-25T08:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/keueukya', 'keueukya', '크으캬', 'https://profile.img.sooplive.com/LOGO/ke/keueukya/keueukya.jpg', '2026.07.26 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-26', '17:00', 'Asia/Seoul', '2026-07-26T08:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/ddiddu4', 'cheese-cheese', '치즈치즈', 'https://profile.img.sooplive.com/LOGO/dd/ddiddu4/ddiddu4.jpg', '2026.07.30 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-30', '14:00', 'Asia/Seoul', '2026-07-30T05:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/khoya8263', 'kim-ueng', '김우엥', 'https://profile.img.sooplive.com/LOGO/kh/khoya8263/khoya8263.jpg', '2026.07.30 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-30', '16:00', 'Asia/Seoul', '2026-07-30T07:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/songchiro', 'churomi', '츄로미', 'https://profile.img.sooplive.com/LOGO/so/songchiro/songchiro.jpg', '2026.07.31 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-31', '15:00', 'Asia/Seoul', '2026-07-31T06:00:00.000Z')
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url, description,
  agency_name, debut_date, debut_time, timezone, start_at_utc
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
  n.start_at_utc
FROM new_infos AS n
JOIN streamerChannel AS sc
  ON sc.id = (
    SELECT sc2.id
    FROM streamerChannel AS sc2
    WHERE sc2.platform = n.platform AND sc2.channel_url = n.channel_url
    ORDER BY sc2.id
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.slug = n.slug
)
AND NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.channel_id = sc.id
);

-- ============================================================
-- PART 04 (7명)
-- ============================================================
WITH new_channels(platform, channel_url, channel_name, slug) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/newera404', '뉴에라_', 'newera'),
  ('SOOP', 'https://www.sooplive.com/station/kururung', '쿠룽v', 'kurung'),
  ('SOOP', 'https://www.sooplive.com/station/c0c0nuts', '코코넛츠_', 'coconuts'),
  ('SOOP', 'https://www.sooplive.com/station/injeolmiru', '미루ℓ', 'miru'),
  ('SOOP', 'https://www.sooplive.com/station/haruniong', '루뇽', 'runyong'),
  ('SOOP', 'https://www.sooplive.com/station/baeka0321', '백아♡', 'baeka'),
  ('SOOP', 'https://www.sooplive.com/station/usolbii11', '유솔비', 'usolbi')
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

WITH new_infos(
  platform, channel_url, slug, display_name, profile_image_url,
  description, agency_name, debut_date, debut_time, timezone, start_at_utc
) AS (
  VALUES
  ('SOOP', 'https://www.sooplive.com/station/newera404', 'newera', '뉴에라', 'https://profile.img.sooplive.com/LOGO/ne/newera404/newera404.jpg', '2026.07.31 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-07-31', '18:00', 'Asia/Seoul', '2026-07-31T09:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/kururung', 'kurung', '쿠룽', 'https://profile.img.sooplive.com/LOGO/ku/kururung/kururung.jpg', '2026.08.01 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-08-01', '14:00', 'Asia/Seoul', '2026-08-01T05:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/c0c0nuts', 'coconuts', '코코넛츠', 'https://profile.img.sooplive.com/LOGO/c0/c0c0nuts/c0c0nuts.jpg', '2026.08.03 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-08-03', '20:00', 'Asia/Seoul', '2026-08-03T11:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/injeolmiru', 'miru', '미루', 'https://profile.img.sooplive.com/LOGO/in/injeolmiru/injeolmiru.jpg', '2026.08.05 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-08-05', '12:00', 'Asia/Seoul', '2026-08-05T03:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/haruniong', 'runyong', '루뇽', 'https://profile.img.sooplive.com/LOGO/ha/haruniong/haruniong.jpg', '2026.08.09 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-08-09', '10:00', 'Asia/Seoul', '2026-08-09T01:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/baeka0321', 'baeka', '백아', 'https://profile.img.sooplive.com/LOGO/ba/baeka0321/baeka0321.jpg', '2026.08.17 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-08-17', '19:00', 'Asia/Seoul', '2026-08-17T10:00:00.000Z'),
  ('SOOP', 'https://www.sooplive.com/station/usolbii11', 'usolbi', '유솔비', 'https://profile.img.sooplive.com/LOGO/us/usolbii11/usolbii11.jpg', '2026.08.18 SOOP 웰컴 버추얼 데뷔 스트리머', '개인세', '2026-08-18', '15:00', 'Asia/Seoul', '2026-08-18T06:00:00.000Z')
)
INSERT INTO streamerChannel_info (
  channel_id, slug, display_name, profile_image_url, description,
  agency_name, debut_date, debut_time, timezone, start_at_utc
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
  n.start_at_utc
FROM new_infos AS n
JOIN streamerChannel AS sc
  ON sc.id = (
    SELECT sc2.id
    FROM streamerChannel AS sc2
    WHERE sc2.platform = n.platform AND sc2.channel_url = n.channel_url
    ORDER BY sc2.id
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.slug = n.slug
)
AND NOT EXISTS (
  SELECT 1 FROM streamerChannel_info AS sci WHERE sci.channel_id = sc.id
);
