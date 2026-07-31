-- Migration 0005: Establish 1:1 Isolated Schema (channel_management 1:1 streamer_info)

DROP TABLE IF EXISTS streamer_channels;
DROP TABLE IF EXISTS streamers;
DROP TABLE IF EXISTS channel_management;
DROP TABLE IF EXISTS streamer_info;

-- ① 방송 채널 관리 DB (channel_management)
CREATE TABLE channel_management (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,             -- CHZZK, SOOP, YOUTUBE 등
  channel_url TEXT NOT NULL,          -- 방송국 / 라이브 URL
  channel_name TEXT,                  -- API에서 수집된 채널명
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ② 스트리머 정보 & 데뷔 일정 DB (streamer_info) - channel_id와 1:1 UNIQUE 연동
CREATE TABLE streamer_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id INTEGER NOT NULL UNIQUE, -- channel_management.id와 1:1 UNIQUE 매핑
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
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channel_management(id) ON DELETE CASCADE
);

-- 원본 데이터 8건 1:1 독립 시딩
INSERT INTO channel_management (id, platform, channel_url, channel_name)
VALUES 
  (1, 'SOOP', 'https://www.sooplive.co.kr/station/memo/a0714/post/166790429', '아롱띠 SOOP'),
  (2, 'SOOP', 'https://www.sooplive.co.kr/station/memo/bps1017/post/166829897', '헤티 SOOP'),
  (3, 'SOOP', 'https://www.sooplive.co.kr/station/mate4077', '마테 SOOP'),
  (4, 'SOOP', 'https://www.sooplive.co.kr/station/memo/harobangil/post/166904326', '담하로 SOOP'),
  (5, 'CHZZK', 'https://x.com/orbitaofbehind', '바쿠 치지직'),
  (12, 'CHZZK', 'https://chzzk.naver.com/video/14105462', '김밍령 치지직'),
  (32, 'SOOP', 'https://www.sooplive.co.kr/station/memo/ruha0612/post/168012350', '루하 SOOP'),
  (33, 'SOOP', 'https://www.sooplive.co.kr/station/memo/cheesezz/post/168054144', '치즈치즈 SOOP');

INSERT INTO streamer_info (id, channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc)
VALUES 
  (1, 1, 'arongtti', '아롱띠', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '웰컴버추얼 데뷔 방송', '개인세', '2026-07-01', '21:00', 'Asia/Seoul', '2026-07-01T12:00:00.000Z'),
  (2, 2, 'heti', '헤티', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '소통 및 첫 데뷔 라이브', '개인세', '2026-07-03', '05:00', 'Asia/Seoul', '2026-07-02T20:00:00.000Z'),
  (3, 3, 'mate', '마테', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', '첫 소통 데뷔 라이브', '개인세', '2026-07-03', '23:00', 'Asia/Seoul', '2026-07-03T14:00:00.000Z'),
  (4, 4, 'damharo', '담하로', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '담하로 첫 공식 데뷔 스트림', '개인세', '2026-07-05', '02:00', 'Asia/Seoul', '2026-07-04T17:00:00.000Z'),
  (5, 5, 'baku', '바쿠', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '치지직 신입 버튜버 바쿠 데뷔', '개인세', '2026-07-05', '04:00', 'Asia/Seoul', '2026-07-04T19:00:00.000Z'),
  (12, 12, 'kimmingryung', '김밍령', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '김밍령 데뷔 방송', '개인세', '2026-07-14', '02:00', 'Asia/Seoul', '2026-07-13T17:00:00.000Z'),
  (32, 32, 'ruha', '루하', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '루하 SOOP 데뷔 생방송', '개인세', '2026-07-29', '23:00', 'Asia/Seoul', '2026-07-29T14:00:00.000Z'),
  (33, 33, 'cheesecheese', '치즈치즈', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '치즈치즈 재데뷔 방송 무대', '개인세', '2026-07-30', '23:00', 'Asia/Seoul', '2026-07-30T14:00:00.000Z');
