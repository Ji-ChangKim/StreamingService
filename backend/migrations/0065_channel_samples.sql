-- 등록 버튜버 직접 기록(기획문서 38번 1항, 40번).
-- 치지직 상위 100개 방송 수집(analytics_broadcast_snapshots)에 잡히지 않는 등록 버튜버 채널을
-- 5분마다 나눠서 확인하고, 방송 중일 때만 한 줄씩 남긴다. 기존 회차·통계 정의(상위 100 합)는 바꾸지 않는다.
CREATE TABLE IF NOT EXISTS analytics_channel_samples (
  channel_key TEXT NOT NULL,          -- 'CHZZK:{채널ID}' · 'SOOP:{아이디}' (소문자)
  sampled_at TEXT NOT NULL,           -- 확인 시각(ISO, UTC)
  platform TEXT NOT NULL CHECK (platform IN ('CHZZK', 'SOOP')),
  stream_id TEXT NOT NULL,            -- 플랫폼 방송 번호
  channel_name TEXT,
  title TEXT NOT NULL,
  category_name TEXT NOT NULL,
  viewers INTEGER NOT NULL,
  started_at TEXT,                    -- 방송 시작 시각(치지직만)
  tags TEXT,                          -- 치지직 태그 JSON 배열
  PRIMARY KEY (channel_key, sampled_at)
) WITHOUT ROWID;

-- 90일 정리용(시각 순 삭제)
CREATE INDEX IF NOT EXISTS idx_channel_samples_time ON analytics_channel_samples(sampled_at);
