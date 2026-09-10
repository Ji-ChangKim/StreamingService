-- =====================================================================================
-- Migration: 0027_discord_streamer_verifications.sql
-- Description: 치지직/SOOP 스트리머 방송국 소개글 본인 인증 및 매핑 테이블
-- Applied Date: 2026-09-10
-- =====================================================================================

CREATE TABLE IF NOT EXISTS discord_streamer_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,                         -- 디스코드 서버 ID
    discord_user_id TEXT NOT NULL,                  -- 디스코드 유저 ID
    discord_username TEXT,                          -- 디스코드 유저명 (옵션)
    platform TEXT NOT NULL,                         -- CHZZK 또는 SOOP
    channel_id TEXT NOT NULL,                       -- 방송국 고유 ID (치지직 해시 또는 SOOP 아이디)
    channel_name TEXT,                              -- 방송국 채널명
    channel_url TEXT NOT NULL,                      -- 방송국 전체 URL
    verification_code TEXT NOT NULL,                -- 발급된 6자리 인증 코드 (예: VD-4829)
    status TEXT DEFAULT 'PENDING',                  -- 'PENDING' | 'VERIFIED'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 요청 시각
    verified_at DATETIME,                           -- 인증 완료 시각
    UNIQUE (platform, channel_id)                   -- 동일 방송국의 중복 사칭 등록 원천 차단
);

CREATE INDEX IF NOT EXISTS idx_streamer_verify_user ON discord_streamer_verifications(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_streamer_verify_channel ON discord_streamer_verifications(platform, channel_id);
