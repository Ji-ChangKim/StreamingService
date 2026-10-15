-- 스트리머 상세 주소에서 공개 방송 기록을 빠르게 조회한다.
CREATE INDEX IF NOT EXISTS idx_broadcast_snapshots_channel_run
ON analytics_broadcast_snapshots(channel_key COLLATE NOCASE, run_id);
