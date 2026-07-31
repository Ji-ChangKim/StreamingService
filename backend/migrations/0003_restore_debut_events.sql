-- Migration 0003: Restore all debut_events, creator_profiles, and links safely

DROP TABLE IF EXISTS debut_event_links;
DROP TABLE IF EXISTS debut_events;
DROP TABLE IF EXISTS creator_channels;
DROP TABLE IF EXISTS creator_profiles;

CREATE TABLE creator_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  profile_image_url TEXT,
  avatar_url TEXT,
  agency_name TEXT,
  creator_type TEXT DEFAULT 'INDIE',
  language TEXT DEFAULT 'ko',
  is_public INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE debut_events (
  id TEXT PRIMARY KEY,
  creator_id INTEGER NOT NULL,
  type TEXT DEFAULT 'FIRST_DEBUT',
  title TEXT NOT NULL,
  description TEXT,
  start_at_utc TEXT NOT NULL,
  original_timezone TEXT DEFAULT 'Asia/Seoul',
  status TEXT DEFAULT 'PUBLISHED',
  verification_status TEXT DEFAULT 'SOURCE_VERIFIED',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
);

CREATE TABLE debut_event_links (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  watch_url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES debut_events(id) ON DELETE CASCADE
);

-- 2. Restore Creator Profiles
INSERT INTO creator_profiles (id, slug, display_name, profile_image_url, avatar_url, agency_name, creator_type, description, created_at, updated_at)
VALUES 
  (1, 'arongtti', '아롱띠', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '개인세', 'INDIE', '웰컴버추얼 데뷔 방송', DATETIME('now'), DATETIME('now')),
  (2, 'heti', '헤티', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '개인세', 'INDIE', '소통 및 첫 데뷔 라이브', DATETIME('now'), DATETIME('now')),
  (3, 'mate', '마테', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', '개인세', 'INDIE', '첫 소통 데뷔 라이브', DATETIME('now'), DATETIME('now')),
  (4, 'damharo', '담하로', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '개인세', 'INDIE', '담하로 첫 공식 데뷔 스트림', DATETIME('now'), DATETIME('now')),
  (5, 'baku', '바쿠', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '개인세', 'INDIE', '치지직 신입 버튜버 바쿠 데뷔', DATETIME('now'), DATETIME('now')),
  (32, 'ruha', '루하', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '개인세', 'INDIE', '루하 SOOP 데뷔 생방송', DATETIME('now'), DATETIME('now')),
  (33, 'cheesecheese', '치즈치즈', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '개인세', 'INDIE', '치즈치즈 재데뷔 방송 무대', DATETIME('now'), DATETIME('now'));

-- 3. Restore Debut Events
INSERT INTO debut_events (id, creator_id, type, title, description, start_at_utc, original_timezone, status, verification_status)
VALUES 
  ('evt_2026_1', 1, 'FIRST_DEBUT', '아롱띠 데뷔 방송', '웰컴버추얼 데뷔 방송', '2026-07-01T12:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'SOURCE_VERIFIED'),
  ('evt_2026_2', 2, 'FIRST_DEBUT', '헤티 데뷔 방송', '소통 및 첫 데뷔 라이브', '2026-07-02T20:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'SOURCE_VERIFIED'),
  ('evt_2026_3', 3, 'FIRST_DEBUT', '마테 데뷔 방송', '첫 소통 데뷔 라이브', '2026-07-03T14:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'SOURCE_VERIFIED'),
  ('evt_2026_4', 4, 'FIRST_DEBUT', '담하로 데뷔 방송', '담하로 첫 공식 데뷔 스트림', '2026-07-04T17:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'SOURCE_VERIFIED'),
  ('evt_2026_5', 5, 'FIRST_DEBUT', '바쿠 데뷔 방송', '치지직 신입 버튜버 바쿠 데뷔', '2026-07-04T19:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'SOURCE_VERIFIED'),
  ('evt_2026_32', 32, 'FIRST_DEBUT', '루하 데뷔 방송', '루하 SOOP 데뷔 생방송', '2026-07-29T14:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'SOURCE_VERIFIED'),
  ('evt_2026_33', 33, 'REDEBUT', '치즈치즈 데뷔 방송', '치즈치즈 재데뷔 방송 무대', '2026-07-30T14:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'SOURCE_VERIFIED');

-- 4. Restore Event Links
INSERT INTO debut_event_links (id, event_id, platform, watch_url, is_primary)
VALUES 
  ('link_2026_1', 'evt_2026_1', 'SOOP', 'https://www.sooplive.co.kr/station/memo/a0714/post/166790429', 1),
  ('link_2026_2', 'evt_2026_2', 'SOOP', 'https://www.sooplive.co.kr/station/memo/bps1017/post/166829897', 1),
  ('link_2026_3', 'evt_2026_3', 'SOOP', 'https://www.sooplive.co.kr/station/mate4077', 1),
  ('link_2026_4', 'evt_2026_4', 'SOOP', 'https://www.sooplive.co.kr/station/memo/harobangil/post/166904326', 1),
  ('link_2026_5', 'evt_2026_5', 'CHZZK', 'https://x.com/orbitaofbehind', 1),
  ('link_2026_32', 'evt_2026_32', 'SOOP', 'https://www.sooplive.co.kr/station/memo/ruha0612/post/168012350', 1),
  ('link_2026_33', 'evt_2026_33', 'SOOP', 'https://www.sooplive.co.kr/station/memo/cheesezz/post/168054144', 1);
