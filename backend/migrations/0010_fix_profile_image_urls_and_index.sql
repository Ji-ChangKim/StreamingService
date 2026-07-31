-- Migration 0010: Fix Profile Image URLs NULL Values & Add Index for Fast Querying

-- 1. profile_image_url 이 NULL 이거나 비어 있는 행들을 기본 프로필 아바타 이미지로 업데이트
UPDATE streamerChannel_info
SET profile_image_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
WHERE profile_image_url IS NULL OR profile_image_url = '';

-- 2. 데뷔 일정 시간 정렬(ORDER BY start_at_utc ASC) 성능 극대화를 위한 쿼리 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_streamer_info_start_at_utc ON streamerChannel_info(start_at_utc);
CREATE INDEX IF NOT EXISTS idx_streamer_info_channel_id ON streamerChannel_info(channel_id);
