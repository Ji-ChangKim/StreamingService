# 데이터베이스 컬럼 및 명세서 (DB Schema Spec)

- **데이터베이스 엔진**: Cloudflare D1 (SQLite 기반)
- **테이블 수**: 총 14개
- **기본 키 정책**: `TEXT PRIMARY KEY` (UUID / ULID / Prefixed Identifier 사용 ex: `evt_...`, `cr_...`)
- **시간 데이터 정책**: ISO-8601 UTC TIMESTAMP (`YYYY-MM-DDTHH:MM:SSZ`)

---

## 1. 테이블별 컬럼 명세 (Data Dictionary)

### 1.1 `users` (계정 및 식별 정보)
| 컬럼명 | 데이터 타입 | Nullable | 제약/PK/FK | 컬럼 설명 |
|---|---|---|---|---|
| `id` | TEXT | NO | PK | 사용자 고유 ID (`usr_...`) |
| `email_hash` | TEXT | YES | - | SHA-256 개인정보 최소화 이메일 해시 |
| `locale` | TEXT | NO | DEFAULT 'ko' | 언어 기본 설정 (ko, en, ja) |
| `timezone` | TEXT | NO | DEFAULT 'Asia/Seoul' | 사용자 선호 로컬 시간대 (IANA 규격) |
| `status` | TEXT | NO | DEFAULT 'ACTIVE' | 계정 상태 (ACTIVE, SUSPENDED, DELETED) |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 계정 생성 일시 |
| `updated_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 계정 정보 수정 일시 |

### 1.2 `creator_profiles` (크리에이터 프로필)
| 컬럼명 | 데이터 타입 | Nullable | 제약/PK/FK | 컬럼 설명 |
|---|---|---|---|---|
| `id` | TEXT | NO | PK | 크리에이터 고유 ID (`cr_...`) |
| `user_id` | TEXT | YES | FK (`users.id`) | 소유자 계정 ID |
| `slug` | TEXT | NO | UNIQUE | URL 접근용 고유 슬러그 (ex: `nabiya`) |
| `display_name` | TEXT | NO | - | 버튜버 공식 활동명 |
| `bio` | TEXT | YES | - | 프로필 및 자기소개 |
| `country_code` | TEXT | YES | DEFAULT 'KR' | 주 활동 국가/지역 (ISO 3166-1 alpha-2) |
| `languages` | TEXT | NO | DEFAULT '["ko"]' | 사용 가능 언어 배열 (JSON String) |
| `agency_id` | TEXT | YES | FK (`agencies.id`) | 소속 에이전시 ID |
| `avatar_url` | TEXT | YES | - | 프로필 아바타 이미지 URL |
| `banner_url` | TEXT | YES | - | 프로필 상단 배너 이미지 URL |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |
| `updated_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 수정 일시 |

### 1.3 `creator_platform_accounts` (연동 방송 플랫폼 계정)
| 컬럼명 | 데이터 타입 | Nullable | 제약/PK/FK | 컬럼 설명 |
|---|---|---|---|---|
| `id` | TEXT | NO | PK | 연동 계정 ID (`cpa_...`) |
| `creator_id` | TEXT | NO | FK (`creator_profiles.id`) | 크리에이터 ID |
| `provider` | TEXT | NO | - | 플랫폼 구분 (`YOUTUBE`, `TWITCH`, `CHZZK`, `SOOP`) |
| `provider_user_id` | TEXT | YES | - | 해당 플랫폼의 채널/사용자 고유 ID |
| `handle` | TEXT | YES | - | 플랫폼 핸들명 (ex: `@nabiya_official`) |
| `channel_url` | TEXT | NO | - | 공식 채널 접속 URL |
| `verified_at` | TIMESTAMP | YES | - | 소유권 인증 완료 시각 |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 등록 일시 |

### 1.4 `agencies` (에이전시/MCN 조직)
| 컬럼명 | 데이터 타입 | Nullable | 제약/PK/FK | 컬럼 설명 |
|---|---|---|---|---|
| `id` | TEXT | NO | PK | 에이전시 ID (`agn_...`) |
| `slug` | TEXT | NO | UNIQUE | 식별 슬러그 |
| `name` | TEXT | NO | - | 에이전시 공식 명칭 |
| `country_code` | TEXT | YES | DEFAULT 'KR' | 소속 국가 코드 |
| `verified_at` | TIMESTAMP | YES | - | 에이전시 검증 일시 |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |

### 1.5 `debut_events` (데뷔 이벤트 정본)
| 컬럼명 | 데이터 타입 | Nullable | 제약/PK/FK | 컬럼 설명 |
|---|---|---|---|---|
| `id` | TEXT | NO | PK | 이벤트 고유 ID (`evt_...`) |
| `creator_id` | TEXT | NO | FK (`creator_profiles.id`) | 대상 크리에이터 ID |
| `type` | TEXT | NO | DEFAULT 'FIRST_DEBUT' | 데뷔 구분 (`FIRST_DEBUT`, `REDEBUT`, `GROUP_DEBUT`) |
| `title` | TEXT | NO | - | 데뷔 방송 제목 |
| `description` | TEXT | YES | - | 상세 소개 및 안내문 |
| `start_at_utc` | TIMESTAMP | NO | - | 데뷔 시작 시각 (UTC) |
| `original_timezone` | TEXT | NO | DEFAULT 'Asia/Seoul' | 스트리머가 등록한 원본 IANA 시간대 |
| `status` | TEXT | NO | DEFAULT 'PUBLISHED' | 진행 상태 (`SUBMITTED`, `PUBLISHED`, `RESCHEDULED`, `LIVE`, `ENDED`, `CANCELLED`) |
| `verification_status` | TEXT | NO | DEFAULT 'SOURCE_VERIFIED' | 검증 레벨 (`UNVERIFIED`, `SOURCE_VERIFIED`, `OWNER_VERIFIED`) |
| `last_verified_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 최종 상태 확인 시각 |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 작성 일시 |
| `updated_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | 수정 일시 |

### 1.6 `debut_event_links` (시청 URL 및 도메인 링크)
| 컬럼명 | 데이터 타입 | Nullable | 제약/PK/FK | 컬럼 설명 |
|---|---|---|---|---|
| `id` | TEXT | NO | PK | 링크 ID (`del_...`) |
| `event_id` | TEXT | NO | FK (`debut_events.id`) | 연관 이벤트 ID |
| `platform` | TEXT | NO | - | 대상 플랫폼 (`CHZZK`, `YOUTUBE`, `TWITCH`, `SOOP`) |
| `watch_url` | TEXT | NO | - | 실제 시청 URL |
| `is_primary` | BOOLEAN | YES | DEFAULT TRUE | 대표 메인 시청 링크 여부 |

---

## 2. 주요 관계도 (ERD Mapping)
- `users` (1) ─── (N) `creator_profiles`
- `creator_profiles` (1) ─── (N) `debut_events`
- `creator_profiles` (1) ─── (N) `creator_platform_accounts`
- `debut_events` (1) ─── (N) `debut_event_links`
- `debut_events` (1) ─── (N) `event_status_history`
