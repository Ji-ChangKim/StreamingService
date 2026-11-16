-- 채널 페이지(/analytics/streamer/{채널})가 한 채널의 기록만 빠르게 찾도록 채널 키 색인을 만든다.
-- 읽기 성능만 바꾸며 자료는 변경하지 않는다.
CREATE INDEX IF NOT EXISTS idx_broadcast_snapshots_channel ON analytics_broadcast_snapshots(channel_key COLLATE NOCASE, run_id);
