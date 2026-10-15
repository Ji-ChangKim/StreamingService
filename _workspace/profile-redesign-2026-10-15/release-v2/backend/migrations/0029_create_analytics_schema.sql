-- Migration 0029: Create VDébut Analytics Schema & Category Mappings
-- 기획서: VDebut_Analytics_Dashboard_Plan_v0.1

-- 1. 버튜버 채널 레지스트리 (analytics_channels)
CREATE TABLE IF NOT EXISTS analytics_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,                     -- 'CHZZK', 'SOOP', 'YOUTUBE'
  external_channel_id TEXT NOT NULL,          -- 플랫폼 고유 채널 식별자/방송국 ID
  display_name TEXT NOT NULL,                 -- 채널 표시명
  profile_image_url TEXT,                     -- 프로필 이미지
  follower_count INTEGER DEFAULT 0,           -- 팔로워/애청자 수
  follower_count_updated_at TEXT,             -- 팔로워 갱신 시각
  is_verified_platform INTEGER DEFAULT 0,     -- 플랫폼 공식 인증 마크
  is_vtuber INTEGER DEFAULT 1,                -- 버튜버 여부 (1: 참)
  vtuber_status TEXT DEFAULT 'VERIFIED',      -- 'CANDIDATE', 'VERIFIED', 'REJECTED'
  vtuber_confidence REAL DEFAULT 1.0,         -- 판별 신뢰도 (0.00 ~ 1.00)
  vtuber_source TEXT DEFAULT 'MANUAL',        -- 'SELF_REGISTERED', 'MANUAL', 'OFFICIAL', 'RULE'
  debut_date TEXT,                            -- 데뷔 일자 (YYYY-MM-DD)
  first_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, external_channel_id)
);
CREATE INDEX IF NOT EXISTS idx_analytics_chan_plat ON analytics_channels(platform, vtuber_status);

-- 2. 라이브 방송 세션 단위 관리 (analytics_live_sessions)
CREATE TABLE IF NOT EXISTS analytics_live_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  external_stream_id TEXT NOT NULL,           -- 플랫폼 고유 라이브 세션 ID
  channel_id INTEGER,                         -- analytics_channels.id 참조 (외래키)
  title_first TEXT,                           -- 방송 시작 시점 제목
  started_at TEXT NOT NULL,                   -- 방송 시작 시각 (ISO KST 또는 UTC)
  ended_at TEXT,                              -- 방송 종료 시각
  duration_seconds INTEGER DEFAULT 0,         -- 방송 진행 총 시간(초)
  peak_viewers INTEGER DEFAULT 0,             -- 최고 동시 시청자 수
  avg_viewers INTEGER DEFAULT 0,              -- 평균 동시 시청자 수
  last_source_category_id TEXT,               -- 마지막 카테고리
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, external_stream_id)
);
CREATE INDEX IF NOT EXISTS idx_analytics_sess_time ON analytics_live_sessions(platform, started_at);

-- 3. 10분 주기 원본 라이브 스냅샷 (analytics_live_snapshots)
CREATE TABLE IF NOT EXISTS analytics_live_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_at TEXT NOT NULL,                  -- 스냅샷 기준 시각 (예: 2026-09-14T12:00:00+09:00)
  collection_started_at TEXT,                 -- 수집 시작 시각
  collection_completed_at TEXT,               -- 수집 완료 시각
  platform TEXT NOT NULL,                     -- 'CHZZK', 'SOOP'
  external_stream_id TEXT NOT NULL,           -- 라이브 세션 ID
  channel_id INTEGER,                         -- analytics_channels.id
  viewer_count INTEGER DEFAULT 0,             -- 동시 시청 슬롯 수 (concurrentUserCount)
  title TEXT,                                 -- 방송 제목
  source_category_type TEXT,                  -- 플랫폼 원본 카테고리 타입 (GAME, SPORTS 등)
  source_category_id TEXT,                    -- 플랫폼 원본 카테고리 ID
  source_category_name TEXT,                  -- 플랫폼 원본 카테고리 표시명
  source_tags_json TEXT,                      -- 원본 태그 리스트 JSON
  normalized_category_id TEXT,                -- 정규화 공통 카테고리 (GAME, TALK 등)
  page_order INTEGER DEFAULT 0,               -- 수집 순서 (순위 왜곡 배제, 단순 트래킹)
  collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, external_stream_id, snapshot_at)
);
CREATE INDEX IF NOT EXISTS idx_snapshots_plat_snap ON analytics_live_snapshots(platform, snapshot_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_chan_snap ON analytics_live_snapshots(channel_id, snapshot_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_cat_snap ON analytics_live_snapshots(normalized_category_id, snapshot_at);

-- 4. 플랫폼 원본 카테고리 ↔ VDébut 공통 대분류 매핑 사전 (analytics_category_map)
CREATE TABLE IF NOT EXISTS analytics_category_map (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,                     -- 'CHZZK', 'SOOP'
  source_category_id TEXT NOT NULL,           -- 플랫폼 원본 카테고리 식별자
  source_category_name TEXT NOT NULL,         -- 플랫폼 원본 카테고리명
  normalized_group TEXT NOT NULL,             -- 'GAME', 'TALK', 'MUSIC', 'ART', 'ASMR', 'FOOD', 'ETC'
  normalized_name TEXT NOT NULL,              -- 표준 표기명 (한국어)
  mapping_status TEXT DEFAULT 'REVIEWED',     -- 'AUTO', 'REVIEWED', 'UNMAPPED'
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, source_category_id)
);

-- 5. 1시간 단위 사전 집계 마켓 데이터 (analytics_market_hourly)
CREATE TABLE IF NOT EXISTS analytics_market_hourly (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_at TEXT NOT NULL,                    -- 시간 버킷 (예: 2026-09-14T12:00:00+09:00)
  timezone TEXT DEFAULT 'Asia/Seoul',         -- Asia/Seoul
  platform TEXT NOT NULL,                     -- 'CHZZK', 'SOOP', 'ALL'
  normalized_category_id TEXT NOT NULL,       -- 'ALL', 'GAME', 'TALK', 'MUSIC' 등
  day_of_week INTEGER NOT NULL,               -- 0(일), 1(월), ..., 6(토)
  is_weekend INTEGER NOT NULL,                -- 0(평일), 1(주말)
  live_count_avg REAL DEFAULT 0,              -- 평균 LIVE 수 (공급)
  live_count_median REAL DEFAULT 0,           -- 중앙값 LIVE 수
  viewer_sum_avg REAL DEFAULT 0,              -- 평균 동시시청 합계 (수요)
  viewer_sum_median REAL DEFAULT 0,           -- 중앙값 동시시청 합계
  viewer_per_live_avg REAL DEFAULT 0,         -- 방송당 시청 (수요/공급 효율)
  stream_viewer_median REAL DEFAULT 0,        -- 개별 방송 중앙값 시청자
  top10_viewer_share REAL DEFAULT 0,          -- 상위 10개 방송 시청 점유율 (집중도: 0.00~1.00)
  small_channel_viewer_share REAL DEFAULT 0,  -- 소형/신규 채널 점유율
  new_channel_viewer_share REAL DEFAULT 0,    -- 신규 채널 점유율
  snapshot_expected INTEGER DEFAULT 6,        -- 기대 스냅샷 수 (1시간에 6회)
  snapshot_received INTEGER DEFAULT 6,        -- 수집된 스냅샷 수
  data_completeness REAL DEFAULT 1.0,         -- 데이터 완전성 (0.00~1.00)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bucket_at, platform, normalized_category_id)
);
CREATE INDEX IF NOT EXISTS idx_market_hourly_query ON analytics_market_hourly(platform, normalized_category_id, day_of_week);

-- 6. 사전 계산 방송 기회 점수 (analytics_opportunity_scores)
CREATE TABLE IF NOT EXISTS analytics_opportunity_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_at TEXT NOT NULL,                    -- 기준 일시
  platform TEXT NOT NULL,                     -- 'CHZZK', 'SOOP', 'ALL'
  normalized_category_id TEXT NOT NULL,       -- 'ALL', 'GAME', 'TALK', 'MUSIC' 등
  day_scope TEXT NOT NULL,                    -- 'ALL', 'WEEKDAY', 'WEEKEND', 'MON', 'TUE', ...
  hour_start INTEGER NOT NULL,                -- 시작 시 (0~23)
  hour_end INTEGER NOT NULL,                  -- 종료 시 (1~24)
  score REAL NOT NULL,                        -- 0.00 ~ 100.00
  confidence TEXT NOT NULL,                   -- 'HIGH', 'MEDIUM', 'LOW'
  reason_json TEXT,                           -- 추천 근거 및 주의 요인 JSON
  sample_days INTEGER DEFAULT 28,             -- 표본 일수
  data_completeness REAL DEFAULT 1.0,         -- 데이터 완전성
  formula_version TEXT DEFAULT 'opportunity-v1', -- 산식 버전
  calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bucket_at, platform, normalized_category_id, day_scope, hour_start)
);
CREATE INDEX IF NOT EXISTS idx_opp_scores_lookup ON analytics_opportunity_scores(platform, normalized_category_id, day_scope);

-- 초기 표준 카테고리 매핑 데이터 시드 (CHZZK & SOOP 주요 카테고리)
INSERT OR IGNORE INTO analytics_category_map (platform, source_category_id, source_category_name, normalized_group, normalized_name, mapping_status)
VALUES
  -- CHZZK
  ('CHZZK', 'game', '게임', 'GAME', '종합게임', 'REVIEWED'),
  ('CHZZK', 'minecraft', '마인크래프트', 'GAME', '마인크래프트', 'REVIEWED'),
  ('CHZZK', 'valorant', '발로란트', 'GAME', '발로란트', 'REVIEWED'),
  ('CHZZK', 'league_of_legends', '리그 오브 레전드', 'GAME', '리그 오브 레전드', 'REVIEWED'),
  ('CHZZK', 'talk', '토크/소통', 'TALK', '잡담/토크', 'REVIEWED'),
  ('CHZZK', 'music', '음악', 'MUSIC', '음악/노래', 'REVIEWED'),
  ('CHZZK', 'drawing', '그림/아트', 'ART', '그림/드로잉', 'REVIEWED'),
  ('CHZZK', 'asmr', 'ASMR', 'ASMR', 'ASMR', 'REVIEWED'),
  ('CHZZK', 'mukbang', '먹방', 'FOOD', '먹방', 'REVIEWED'),
  ('CHZZK', 'etc', '기타', 'ETC', '기타', 'REVIEWED'),

  -- SOOP
  ('SOOP', '100', '보이는 라디오', 'TALK', '보이는 라디오/토크', 'REVIEWED'),
  ('SOOP', '200', '게임', 'GAME', '종합게임', 'REVIEWED'),
  ('SOOP', '201', '리그오브레전드', 'GAME', '리그 오브 레전드', 'REVIEWED'),
  ('SOOP', '202', '마인크래프트', 'GAME', '마인크래프트', 'REVIEWED'),
  ('SOOP', '203', '스타크래프트', 'GAME', '스타크래프트', 'REVIEWED'),
  ('SOOP', '300', '음악', 'MUSIC', '음악/버스킹', 'REVIEWED'),
  ('SOOP', '400', 'ASMR', 'ASMR', 'ASMR', 'REVIEWED'),
  ('SOOP', '500', '미술/취미', 'ART', '그림/드로잉', 'REVIEWED'),
  ('SOOP', '600', '먹방/쿡방', 'FOOD', '먹방', 'REVIEWED'),
  ('SOOP', '999', '기타', 'ETC', '기타', 'REVIEWED');

-- 기존 streamerChannel 버튜버 데이터를 analytics_channels로 초기 연동
INSERT OR IGNORE INTO analytics_channels (platform, external_channel_id, display_name, profile_image_url, is_vtuber, vtuber_status, vtuber_source, debut_date)
SELECT 
  c.platform,
  COALESCE(c.channel_url, 'ch_' || c.id) AS external_channel_id,
  info.display_name,
  info.profile_image_url,
  1,
  'VERIFIED',
  'SELF_REGISTERED',
  info.debut_date
FROM streamerChannel c
JOIN streamerChannel_info info ON c.id = info.channel_id;
