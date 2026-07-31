-- Seed initial demo VTuber debut events into D1 Database

INSERT OR IGNORE INTO agencies (id, slug, name, country_code) VALUES
('Indie', 'indie', '개인 (Indie)', 'KR'),
('SOOP Stars', 'soop-stars', 'SOOP Stars', 'KR'),
('V-PRO', 'v-pro', 'V-PRO Project', 'US');

INSERT OR IGNORE INTO creator_profiles (id, slug, display_name, country_code, languages, agency_id, avatar_url) VALUES 
('cr_101', 'nabiya', '나비야 (Nabiya)', 'KR', '["ko", "en"]', 'Indie', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('cr_102', 'moka', '모카 (Moka)', 'KR', '["ko"]', 'SOOP Stars', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'),
('cr_103', 'aria-eclipse', 'Aria Eclipse', 'US', '["en", "ja"]', 'V-PRO', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'),
('cr_104', 'luna', '루나 릴리 (Luna)', 'KR', '["ko"]', 'Indie', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80');

INSERT OR IGNORE INTO debut_events (id, creator_id, type, title, description, start_at_utc, original_timezone, status, verification_status) VALUES
('evt_101', 'cr_101', 'FIRST_DEBUT', '나비야 첫 생방송 데뷔 라이브', '안녕하세요! 신입 버튜버 나비야입니다. 첫 데뷔 방송에서 만나요!', '2026-08-05T11:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'OWNER_VERIFIED'),
('evt_102', 'cr_102', 'REDEBUT', '모카 숲(SOOP) 재데뷔 스테이지', 'SOOP 플랫폼에서 새롭게 시작하는 모카의 첫 이적 재데뷔 방송!', '2026-08-08T13:00:00.000Z', 'Asia/Seoul', 'PUBLISHED', 'SOURCE_VERIFIED'),
('evt_103', 'cr_103', 'FIRST_DEBUT', 'Aria Eclipse Global Debut Special', 'V-PRO 소속 글로벌 아티스트 Aria의 첫 영/일 동시 데뷔 라이브 스트림!', '2026-08-14T02:00:00.000Z', 'America/Los_Angeles', 'PUBLISHED', 'SOURCE_VERIFIED'),
('evt_104', 'cr_104', 'FIRST_DEBUT', '루나 릴리 트위치 첫 무대', '노래와 소통 중심으로 찾아뵙는 루나 릴리의 트위치 첫 무대.', '2026-08-20T10:00:00.000Z', 'Asia/Tokyo', 'PUBLISHED', 'SOURCE_VERIFIED');

INSERT OR IGNORE INTO debut_event_links (id, event_id, platform, watch_url, is_primary) VALUES
('link_101', 'evt_101', 'CHZZK', 'https://chzzk.naver.com/live/nabiya', 1),
('link_102', 'evt_102', 'SOOP', 'https://sooplive.co.kr/moka', 1),
('link_103', 'evt_103', 'YOUTUBE', 'https://youtube.com/live/aria_eclipse', 1),
('link_104', 'evt_104', 'TWITCH', 'https://twitch.tv/luna_lily', 1);
