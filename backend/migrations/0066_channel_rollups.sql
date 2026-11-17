-- 채널 요약(기획문서 38번 2·3항, 40번 랭킹). 원본 방송 기록은 90일만 두고, 요약은 계속 보관한다.
-- 매일 오전 7시(한국 시간) 전날 기록으로 만든다. 행 수가 작아(하루 수백 행) 무료 플랜에서도 오래 쌓을 수 있다.

-- 방송 1회의 하루 몫 = 1행(자정을 넘긴 방송은 날마다 1행). 읽을 때 방송 번호로 합친다.
-- 같은 날을 다시 만들어도 덮어쓰기라 숫자가 두 번 더해지지 않는다.
-- 방송별 평균 시청자의 중앙값·방송 횟수·콘텐츠별 반응·성장 곡선에 쓴다.
CREATE TABLE IF NOT EXISTS analytics_channel_streams (
  channel_key TEXT NOT NULL,          -- 'CHZZK:{채널ID}' · 'SOOP:{아이디}' (소문자)
  stream_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('CHZZK', 'SOOP')),
  day TEXT NOT NULL,                  -- 이 몫의 날(한국 시간 YYYY-MM-DD)
  minutes INTEGER NOT NULL,           -- 기록으로 잰 방송 시간(분)
  viewer_points INTEGER NOT NULL,     -- 시청자 계산에 쓴 점 수
  viewer_sum INTEGER NOT NULL,        -- 그 점들의 시청자 합(평균 = 합 ÷ 점 수)
  viewer_peak INTEGER NOT NULL,
  top_category TEXT,                  -- 이 몫에서 가장 오래 한 콘텐츠
  category_minutes TEXT,              -- 콘텐츠별 방송 분 JSON 객체
  title TEXT,
  PRIMARY KEY (channel_key, stream_id, day)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_channel_streams_day ON analytics_channel_streams(day, platform);

-- 채널 × 날 = 1행. 방송한 날·방송 시간·시간대별 분포(방송 시간표)·팔로워 수.
CREATE TABLE IF NOT EXISTS analytics_channel_daily (
  channel_key TEXT NOT NULL,
  day TEXT NOT NULL,                  -- 한국 시간 YYYY-MM-DD
  platform TEXT NOT NULL CHECK (platform IN ('CHZZK', 'SOOP')),
  minutes INTEGER NOT NULL DEFAULT 0,
  hours TEXT,                         -- 0~23시 방송 분 JSON 배열
  followers INTEGER,                  -- 그날 확인한 팔로워 수(치지직만, 없으면 NULL)
  PRIMARY KEY (channel_key, day)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_channel_daily_day ON analytics_channel_daily(day, platform);
