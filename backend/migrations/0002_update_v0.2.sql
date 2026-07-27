-- 기존 v0.1 테이블 드랍 (초기 초기화 대응)
DROP TABLE IF EXISTS donation_logs;
DROP TABLE IF EXISTS roulette_items;
DROP TABLE IF EXISTS roulettes;

-- 1. streamers 테이블은 유지하되 필드 호환성 유지

-- 2. donation_services (후원 서비스 정의 테이블)
CREATE TABLE donation_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 초기 후원 서비스 데이터 삽입
INSERT OR IGNORE INTO donation_services (type, name, description, is_active, sort_order) VALUES 
('roulette', '룰렛 후원', '후원 시 룰렛이 자동 구동되며 OBS에 당첨 결과 표시', 1, 1),
('alert', '후원 알림', '시청자 후원 정보 및 메시지 알림 (준비 중)', 0, 2),
('goal', '후원 목표치', '목표 후원 금액 달성률 그래프 표시 (준비 중)', 0, 3),
('caption', '후원 자막', '후원 메시지를 자막 형태로 방송 하단에 흐르게 표시 (준비 중)', 0, 4);

-- 3. roulette_contents (룰렛 설정 테이블)
CREATE TABLE roulette_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamer_id TEXT NOT NULL,
    service_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    min_donation_amount INTEGER NOT NULL DEFAULT 1000,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Ready', 'Waiting', 'Running', 'Paused', 'Error', 'Revoked')),
    is_active INTEGER NOT NULL DEFAULT 1,
    message_condition TEXT, -- 특정 텍스트 필터 (!룰렛 등)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(streamer_id) REFERENCES streamers(id) ON DELETE CASCADE,
    FOREIGN KEY(service_id) REFERENCES donation_services(id) ON DELETE CASCADE
);
CREATE INDEX idx_roulette_contents_streamer ON roulette_contents(streamer_id);

-- 4. roulette_items (룰렛 세부 당첨 항목 테이블)
CREATE TABLE roulette_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roulette_content_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    weight INTEGER NOT NULL CHECK(weight > 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(roulette_content_id) REFERENCES roulette_contents(id) ON DELETE CASCADE
);
CREATE INDEX idx_roulette_items_parent_v2 ON roulette_items(roulette_content_id);

-- 5. ui_templates (룰렛 디자인 UI 템플릿 마스터 테이블)
CREATE TABLE ui_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK(category IN ('basic', 'cute', 'game', 'premium', 'dark')),
    description TEXT,
    thumbnail_url TEXT,
    preview_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 초기 5대 UI 템플릿 데이터 삽입
INSERT OR IGNORE INTO ui_templates (name, category, description, sort_order) VALUES 
('Basic Minimal', 'basic', '깔끔한 플랫 스타일의 표준 룰렛 UI', 1),
('Neon Game', 'game', '네온 형광 조명과 아케이드 효과음의 게이밍 스타일', 2),
('Cute Pop', 'cute', '파스텔 톤 팝업과 통통 튀는 애니메이션의 아기자기 테마', 3),
('Premium Gold', 'premium', '화려한 골드 테두리와 고액 리액션용 황금 연출 스타일', 4),
('Dark Mission', 'dark', '벌칙과 극한 미션 룰렛에 어울리는 묵직한 다크 테마', 5);

-- 6. roulette_design_settings (룰렛 디자인 커스텀 설정 테이블)
CREATE TABLE roulette_design_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roulette_content_id INTEGER NOT NULL UNIQUE,
    ui_template_id INTEGER NOT NULL,
    background_type TEXT NOT NULL DEFAULT 'transparent',
    background_value TEXT,
    primary_color TEXT DEFAULT '#00C773',
    secondary_color TEXT DEFAULT '#1F2937',
    font_preset TEXT DEFAULT 'Outfit',
    sound_preset TEXT DEFAULT 'default',
    animation_preset TEXT DEFAULT 'default',
    layout_preset TEXT DEFAULT 'center',
    result_effect_preset TEXT DEFAULT 'confetti',
    display_duration_sec INTEGER NOT NULL DEFAULT 5,
    FOREIGN KEY(roulette_content_id) REFERENCES roulette_contents(id) ON DELETE CASCADE,
    FOREIGN KEY(ui_template_id) REFERENCES ui_templates(id) ON DELETE CASCADE
);

-- 7. donation_events (후원 수신 원본 로그 테이블)
CREATE TABLE donation_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamer_id TEXT NOT NULL,
    external_event_key TEXT NOT NULL UNIQUE, -- 중복 방지 트랜잭션 ID
    donator_nickname TEXT NOT NULL,
    pay_amount INTEGER NOT NULL,
    donation_text TEXT,
    status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received', 'ignored', 'failed')),
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
);
CREATE INDEX idx_donation_events_streamer ON donation_events(streamer_id, received_at);

-- 8. roulette_results (룰렛 산출 당첨 결과 로그 테이블)
CREATE TABLE roulette_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donation_event_id INTEGER NOT NULL,
    roulette_content_id INTEGER NOT NULL,
    roulette_item_id INTEGER NOT NULL,
    result_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'displayed', 'failed', 'replayed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    displayed_at DATETIME,
    FOREIGN KEY(donation_event_id) REFERENCES donation_events(id) ON DELETE CASCADE,
    FOREIGN KEY(roulette_content_id) REFERENCES roulette_contents(id) ON DELETE CASCADE,
    FOREIGN KEY(roulette_item_id) REFERENCES roulette_items(id) ON DELETE CASCADE
);
CREATE INDEX idx_roulette_results_parent ON roulette_results(roulette_content_id);
