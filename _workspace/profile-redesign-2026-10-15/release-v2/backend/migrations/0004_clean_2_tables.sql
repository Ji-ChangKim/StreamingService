-- Migration 0004: Drop all dummy tables and establish 2 clean tables: streamer_info & channel_management

DROP TABLE IF EXISTS sync_runs;
DROP TABLE IF EXISTS client_version_policies;
DROP TABLE IF EXISTS agency_members;
DROP TABLE IF EXISTS agencies;
DROP TABLE IF EXISTS creator_platform_accounts;
DROP TABLE IF EXISTS debut_event_links;
DROP TABLE IF EXISTS debut_events;
DROP TABLE IF EXISTS creator_channels;
DROP TABLE IF EXISTS creator_profiles;
DROP TABLE IF EXISTS creator_channel_snapshots;
DROP TABLE IF EXISTS channel_management;
DROP TABLE IF EXISTS streamer_info;

-- 1. 스트리머 정보 및 데뷔 일정 통합 DB (streamer_info)
CREATE TABLE streamer_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  description TEXT,
  agency_name TEXT DEFAULT '개인세',
  debut_date TEXT NOT NULL,           -- 데뷔 날짜 (YYYY-MM-DD)
  debut_time TEXT NOT NULL,           -- 데뷔 시간 (HH:MM)
  timezone TEXT DEFAULT 'Asia/Seoul',  -- 기준 타임존
  start_at_utc TEXT NOT NULL,         -- 표준 UTC 일시 (ISO)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. 방송 채널 관리 DB (channel_management)
CREATE TABLE channel_management (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streamer_id INTEGER NOT NULL,
  platform TEXT NOT NULL,             -- CHZZK, SOOP, YOUTUBE 등
  channel_url TEXT NOT NULL,          -- 방송국 / 라이브 URL
  channel_name TEXT,                  -- API에서 조회된 채널명
  is_primary INTEGER DEFAULT 1,       -- 대표 방송 채널 여부
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (streamer_id) REFERENCES streamer_info(id) ON DELETE CASCADE
);

-- 3. 원본 데뷔 일정 데이터 8건 시딩
INSERT INTO streamer_info (id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc)
VALUES 
  (1, 'arongtti', '아롱띠', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '웰컴버추얼 데뷔 방송', '개인세', '2026-07-01', '21:00', 'Asia/Seoul', '2026-07-01T12:00:00.000Z'),
  (2, 'heti', '헤티', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '소통 및 첫 데뷔 라이브', '개인세', '2026-07-03', '05:00', 'Asia/Seoul', '2026-07-02T20:00:00.000Z'),
  (3, 'mate', '마테', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', '첫 소통 데뷔 라이브', '개인세', '2026-07-03', '23:00', 'Asia/Seoul', '2026-07-03T14:00:00.000Z'),
  (4, 'damharo', '담하로', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '담하로 첫 공식 데뷔 스트림', '개인세', '2026-07-05', '02:00', 'Asia/Seoul', '2026-07-04T17:00:00.000Z'),
  (5, 'baku', '바쿠', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '치지직 신입 버튜버 바쿠 데뷔', '개인세', '2026-07-05', '04:00', 'Asia/Seoul', '2026-07-04T19:00:00.000Z'),
  (12, 'kimmingryung', '김밍령', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '김밍령 데뷔 방송', '개인세', '2026-07-14', '02:00', 'Asia/Seoul', '2026-07-13T17:00:00.000Z'),
  (32, 'ruha', '루하', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '루하 SOOP 데뷔 생방송', '개인세', '2026-07-29', '23:00', 'Asia/Seoul', '2026-07-29T14:00:00.000Z'),
  (33, 'cheesecheese', '치즈치즈', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '치즈치즈 재데뷔 방송 무대', '개인세', '2026-07-30', '23:00', 'Asia/Seoul', '2026-07-30T14:00:00.000Z');

INSERT INTO channel_management (streamer_id, platform, channel_url, channel_name, is_primary)
VALUES 
  (1, 'SOOP', 'https://www.sooplive.co.kr/station/memo/a0714/post/166790429', '아롱띠 SOOP', 1),
  (2, 'SOOP', 'https://www.sooplive.co.kr/station/memo/bps1017/post/166829897', '헤티 SOOP', 1),
  (3, 'SOOP', 'https://www.sooplive.co.kr/station/mate4077', '마테 SOOP', 1),
  (4, 'SOOP', 'https://www.sooplive.co.kr/station/memo/harobangil/post/166904326', '담하로 SOOP', 1),
  (5, 'CHZZK', 'https://x.com/orbitaofbehind', '바쿠 치지직', 1),
  (12, 'CHZZK', 'https://chzzk.naver.com/video/14105462', '김밍령 치지직', 1),
  (32, 'SOOP', 'https://www.sooplive.co.kr/station/memo/ruha0612/post/168012350', '루하 SOOP', 1),
  (33, 'SOOP', 'https://www.sooplive.co.kr/station/memo/cheesezz/post/168054144', '치즈치즈 SOOP', 1);
