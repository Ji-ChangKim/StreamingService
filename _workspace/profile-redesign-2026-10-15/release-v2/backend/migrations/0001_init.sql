-- 1. 스트리머 계정 테이블
CREATE TABLE streamers (
    id TEXT PRIMARY KEY,
    channel_name TEXT NOT NULL,
    profile_image_url TEXT,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT NOT NULL,
    overlay_token TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_streamers_overlay_token ON streamers(overlay_token);

-- 2. 룰렛 템플릿 테이블
CREATE TABLE roulettes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_amount INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
);
CREATE INDEX idx_roulettes_streamer_amount ON roulettes(streamer_id, trigger_amount);

-- 3. 룰렛 구성 아이템 테이블
CREATE TABLE roulette_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roulette_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    weight INTEGER NOT NULL CHECK(weight > 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(roulette_id) REFERENCES roulettes(id) ON DELETE CASCADE
);
CREATE INDEX idx_roulette_items_parent ON roulette_items(roulette_id);

-- 4. 후원 및 룰렛 결과 로그 테이블
CREATE TABLE donation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamer_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    donor_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    message TEXT,
    roulette_name TEXT,
    won_item_name TEXT,
    status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED', 'PENDING')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
);
CREATE INDEX idx_donation_logs_streamer ON donation_logs(streamer_id, created_at);
