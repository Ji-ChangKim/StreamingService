-- Migration 0002: Create creator_profiles and creator_channels tables, and add creator_id to debut_events

CREATE TABLE IF NOT EXISTS creator_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  profile_image_url TEXT,
  agency_name TEXT,
  creator_type TEXT DEFAULT 'INDIE',
  language TEXT DEFAULT 'ko',
  is_public INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS creator_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  platform_channel_id TEXT,
  channel_name TEXT,
  channel_url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
);

-- Add creator_id column to debut_events if not exists
ALTER TABLE debut_events ADD COLUMN creator_id INTEGER REFERENCES creator_profiles(id);

-- Seed Data: 아롱띠 (arongtti) 및 주요 샘플 크리에이터 프로필
INSERT OR IGNORE INTO creator_profiles (id, slug, display_name, description, profile_image_url, agency_name, creator_type, language, is_public, created_at, updated_at)
VALUES (
  1,
  'arongtti',
  '아롱띠',
  '치지직에서 활동하는 버튜버입니다. 주요 방송 콘텐츠와 자세한 소개를 확인해 보세요.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'Indie',
  'INDIE',
  'ko',
  1,
  DATETIME('now'),
  DATETIME('now')
);

INSERT OR IGNORE INTO creator_channels (creator_id, platform, platform_channel_id, channel_name, channel_url, is_primary, created_at, updated_at)
VALUES 
  (1, 'CHZZK', 'arongtti_chzzk', '아롱띠 치지직 방송국', 'https://chzzk.naver.com/live/arongtti', 1, DATETIME('now'), DATETIME('now')),
  (1, 'YOUTUBE', 'arongtti_yt', '아롱띠 유튜브 공식 채널', 'https://youtube.com/@arongtti', 0, DATETIME('now'), DATETIME('now'));
