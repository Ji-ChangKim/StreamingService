-- Migration 0011: Update Diaphin (디아핀) Chzzk Channel URL, Profile Image URL & Description

-- 1. streamerChannel 테이블의 단축 URL을 치지직 정식 채널 URL로 수정
UPDATE streamerChannel
SET channel_url = 'https://chzzk.naver.com/1938fb4a894580ab34d2fe18c535f283'
WHERE id = 59 OR channel_name = '디아핀';

-- 2. streamerChannel_info 테이블의 프로필 이미지 및 소개 문구를 치지직 API 최신 데이터로 업데이트
UPDATE streamerChannel_info
SET profile_image_url = 'https://nng-phinf.pstatic.net/MjAyNjA2MjJfMTQw/MDAxNzgyMTM4MTg2MDkx.ZjoyJMLVd8O8KLalez0GHsZ_0cdjsG242Nkvua67uGYg.QiwGdmEtOvKQf7Rkw6szGkiqX-VJ0xt5XefCvQ1m9AYg.PNG/image.png',
    description = '어디 가서도 쉽게 볼 수 없는 버튜버✨🌙',
    updated_at = CURRENT_TIMESTAMP
WHERE channel_id = 59 OR slug = 'diaphin';
