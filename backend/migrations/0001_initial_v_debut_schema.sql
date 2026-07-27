-- Migration: Initial Schema for V-DEBUT HUB
-- Created: 2026-07-27

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email_hash TEXT,
    locale TEXT DEFAULT 'ko',
    timezone TEXT DEFAULT 'Asia/Seoul',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. creator_profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    slug TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    country_code TEXT DEFAULT 'KR',
    languages TEXT DEFAULT '["ko"]',
    agency_id TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
);

-- 3. creator_platform_accounts
CREATE TABLE IF NOT EXISTS creator_platform_accounts (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- YOUTUBE, TWITCH, CHZZK, SOOP
    provider_user_id TEXT,
    handle TEXT,
    channel_url TEXT NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id),
    FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
);

-- 4. agencies
CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    country_code TEXT DEFAULT 'KR',
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. agency_members
CREATE TABLE IF NOT EXISTS agency_members (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'MEMBER', -- OWNER, MANAGER, MEMBER
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. debut_events
CREATE TABLE IF NOT EXISTS debut_events (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'FIRST_DEBUT', -- FIRST_DEBUT, REDEBUT, GROUP_DEBUT
    title TEXT NOT NULL,
    description TEXT,
    start_at_utc TIMESTAMP NOT NULL,
    original_timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
    date_precision TEXT DEFAULT 'EXACT_TIME',
    status TEXT DEFAULT 'PUBLISHED', -- DRAFT, SUBMITTED, UNDER_REVIEW, PUBLISHED, RESCHEDULED, CANCELLED, LIVE, ENDED, NO_SHOW
    verification_status TEXT DEFAULT 'SOURCE_VERIFIED', -- UNVERIFIED, SOURCE_VERIFIED, OWNER_VERIFIED
    last_verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
);

-- 7. debut_event_links
CREATE TABLE IF NOT EXISTS debut_event_links (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    platform_account_id TEXT,
    platform TEXT NOT NULL, -- YOUTUBE, TWITCH, CHZZK, SOOP
    watch_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES debut_events(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_account_id) REFERENCES creator_platform_accounts(id) ON DELETE SET NULL
);

-- 8. event_status_history
CREATE TABLE IF NOT EXISTS event_status_history (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    old_start_at TIMESTAMP,
    new_start_at TIMESTAMP,
    changed_by TEXT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES debut_events(id) ON DELETE CASCADE
);

-- 9. source_records
CREATE TABLE IF NOT EXISTS source_records (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    source_type TEXT NOT NULL, -- OFFICIAL_POST, X_POST, PLATFORM_SCHEDULE
    source_url TEXT NOT NULL,
    content_hash TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. verifications
CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    subject_type TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    method TEXT NOT NULL, -- OAUTH, CODE_POST, OFFICIAL_URL
    result TEXT NOT NULL DEFAULT 'PASSED',
    evidence_url TEXT,
    verified_by TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. reminders
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT,
    channel TEXT DEFAULT 'ICS', -- ICS, EMAIL, WEBPUSH
    lead_time_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES debut_events(id) ON DELETE CASCADE
);

-- 12. moderation_cases
CREATE TABLE IF NOT EXISTS moderation_cases (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    assignee TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. sync_runs
CREATE TABLE IF NOT EXISTS sync_runs (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'SUCCESS',
    counts INTEGER DEFAULT 0,
    error_code TEXT
);

-- 14. client_version_policies
CREATE TABLE IF NOT EXISTS client_version_policies (
    id TEXT PRIMARY KEY,
    min_supported_version TEXT NOT NULL DEFAULT 'v0.1.0',
    latest_version TEXT NOT NULL DEFAULT 'v0.1.0',
    notice_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
