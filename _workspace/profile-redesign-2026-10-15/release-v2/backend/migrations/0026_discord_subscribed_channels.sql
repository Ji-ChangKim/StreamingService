-- =====================================================================================
-- Migration: 0026_discord_subscribed_channels.sql
-- Description: 디스코드 봇 실시간 데뷔 알림 수신 채널 관리 테이블 생성
-- Applied Date: 2026-09-10
-- =====================================================================================

CREATE TABLE IF NOT EXISTS discord_subscribed_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,                  -- 디스코드 서버(길드) 고유 ID
    channel_id TEXT NOT NULL UNIQUE,         -- 알림 수신 채널 ID (중복 방지)
    guild_name TEXT,                         -- 디스코드 서버명 (옵션)
    subscribed_platforms TEXT DEFAULT 'ALL', -- 구독 대상 플랫폼 ('ALL', 'CHZZK', 'SOOP', 'YOUTUBE')
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discord_channel_id ON discord_subscribed_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_discord_guild_id ON discord_subscribed_channels(guild_id);
