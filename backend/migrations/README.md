# 🗄️ Cloudflare D1 Database & Migration Management Guide

본 문서는 StreamingService 프로젝트의 Cloudflare D1 데이터베이스 스키마 이력 및 마이그레이션 운영 규칙을 정리한 문서입니다.

---

## 📌 1. 현재 표준 DB 스키마 구조 (`v0.3` 기준)

프로젝트는 `streamerChannel`과 `streamerChannel_info` 1:1 짝꿍 테이블 구조를 표준으로 사용하고 있습니다.

### ① `streamerChannel` (상위 채널 테이블)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `platform`: TEXT (예: `CHZZK`, `SOOP`, `YOUTUBE`)
- `channel_url`: TEXT (방송국/라이브 주소)
- `channel_name`: TEXT
- `created_at`: TEXT DEFAULT CURRENT_TIMESTAMP

### ② `streamerChannel_info` (하위 채널 세부 정보 테이블)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `channel_id`: INTEGER UNIQUE (FOREIGN KEY -> `streamerChannel.id`)
- `slug`: TEXT UNIQUE
- `display_name`: TEXT
- `profile_image_url`: TEXT
- `description`: TEXT
- `agency_name`: TEXT DEFAULT '개인세'
- `debut_date`: TEXT
- `debut_time`: TEXT
- `timezone`: TEXT DEFAULT 'Asia/Seoul'
- `start_at_utc`: TEXT
- `country_code`: TEXT CHECK (country_code IN ('KR', 'JP', 'US') OR country_code IS NULL) *(Migration 0009에서 추가)*
- `created_at`: TEXT / `updated_at`: TEXT

---

## 📜 2. 마이그레이션 이력 관리 및 히스토리

- `0001` ~ `0005`: 구버전 스키마 (`creator_profiles`, `debut_events` 등) - **[보존 대상 / 재실행 금지]**
- `0006_streamer_channel_pair.sql`: 신규 1:1 짝꿍 테이블 스키마 적용
- `0007_insert_all_62_streamers.sql`: 62명 초기 스트리머 추가
- `0008_add_31_soop_streamers.sql`: SOOP 31명 누락 스트리머 추가
- `0009_add_country_code.sql`: `country_code` 컬럼 추가 및 KR/JP/US 국가 코드 데이터 셋 업데이트
- `0010_fix_profile_image_urls_and_index.sql`: `profile_image_url` NULL 보완 및 `start_at_utc` 쿼리 인덱스 추가 (조회 속도 초고속화)

---

## ⚠️ 3. 마이그레이션 운영 및 변경 규칙 (Crucial Operational Rules)

1. **기존 마이그레이션 파일 훼손 엄금**
   - 이미 실행되었거나 등록된 마이그레이션 스크립트(`0001`~`0008`)를 무단으로 삭제, 수정, 또는 `SELECT 1;` 등으로 덮어쓰지 않습니다.

2. **단순 데이터/컬럼 UPDATE 시 Direct SQL Execution 활용**
   - 스키마 재정의나 파괴적 마이그레이션이 아닌 단순 데이터 UPDATE / 컬럼 추가 작업은 `npx wrangler d1 execute vdebut-db --remote --file=...` 명령을 사용하여 안전하게 실행합니다.

3. **마이그레이션 적용 전 영향도 사전 점검**
   - `DROP TABLE`이나 `DELETE FROM`이 포함된 마이그레이션을 구동하기 전에는 반드시 Live 데이터베이스 백업 여부 및 대상 데이터 손실 가능성을 철저히 확인합니다.
