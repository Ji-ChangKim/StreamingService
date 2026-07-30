# 🗄️ [MVP] 04_MVP_DB_TABLE_SPEC.md - V-DEBUT MVP DB 테이블 정의서

**프로젝트명**: V-DEBUT  
**버전**: v1.0  
**DBMS**: Cloudflare D1 (SQLite)  
**작성일**: 2026-07-31  

---

## 1. DB 설계 개념 (Database Architecture)
D1(SQLite 기반 서버리스 DB) 환경에 최적화하여 3개의 정규화된 테이블로 구성되어 있습니다.
- `creator_profiles`: 크리에이터의 고유 인적사항 (활동명, 프로필 사진, 소속사 등)
- `debut_events`: 데뷔/이적 이벤트의 시각, 설명, 타임존 정보
- `debut_event_links`: 이벤트에 매핑된 4대 방송 플랫폼 링크 정보

---

## 2. 테이블 상세 정의서 (Table Specifications)

### 2.1 `creator_profiles` (크리에이터 프로필 테이블)

```sql
CREATE TABLE IF NOT EXISTS creator_profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  agency TEXT DEFAULT '개인세',
  languages TEXT DEFAULT '["KO"]',
  created_at TEXT NOT NULL
);
```

| 컬럼명 (Field) | 데이터 타입 | PK/FK | Nullable | 기본값 (Default) | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | PK | No | - | 크리에이터 고유 ID (`cr_...`) |
| `display_name` | TEXT | - | No | - | 활동명 / 닉네임 |
| `avatar_url` | TEXT | - | Yes | NULL | 프로필 이미지 또는 GIF 주소 |
| `agency` | TEXT | - | Yes | '개인세' | 소속사 이름 (예: Stella lab) |
| `languages` | TEXT | - | Yes | '["KO"]' | 사용 언어 JSON 배열 문자열 |
| `created_at` | TEXT | - | No | CURRENT_TIMESTAMP | 레코드 생성 일시 (ISO-8601) |

---

### 2.2 `debut_events` (데뷔 일정 테이블)

```sql
CREATE TABLE IF NOT EXISTS debut_events (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  start_at_utc TEXT NOT NULL,
  original_timezone TEXT DEFAULT 'Asia/Seoul',
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'APPROVED',
  created_at TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES creator_profiles(id)
);
```

| 컬럼명 (Field) | 데이터 타입 | PK/FK | Nullable | 기본값 (Default) | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | PK | No | - | 데뷔 이벤트 고유 ID (`evt_...`) |
| `creator_id` | TEXT | FK | No | - | `creator_profiles.id` 참조 |
| `event_type` | TEXT | - | No | - | `✨ 최초 데뷔` / `🔄 플랫폼 이적` |
| `start_at_utc` | TEXT | - | No | - | UTC 기준 데뷔 일시 (ISO-8601) |
| `original_timezone`| TEXT | - | Yes | 'Asia/Seoul' | 최초 입력된 타임존 이름 |
| `title` | TEXT | - | Yes | NULL | 이벤트 제목 |
| `description` | TEXT | - | Yes | NULL | 상세 설명 / 방송 정보 |
| `status` | TEXT | - | Yes | 'APPROVED' | 승인 상태 (`APPROVED`/`PENDING`) |
| `created_at` | TEXT | - | No | CURRENT_TIMESTAMP | 레코드 생성 일시 |

---

### 2.3 `debut_event_links` (방송국 및 방송 링크 테이블)

```sql
CREATE TABLE IF NOT EXISTS debut_event_links (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 1,
  FOREIGN KEY (event_id) REFERENCES debut_events(id)
);
```

| 컬럼명 (Field) | 데이터 타입 | PK/FK | Nullable | 기본값 (Default) | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | PK | No | - | 링크 고유 ID (`link_...`) |
| `event_id` | TEXT | FK | No | - | `debut_events.id` 참조 |
| `platform` | TEXT | - | No | - | `CHZZK`, `SOOP`, `YOUTUBE`, `TWITCH` |
| `url` | TEXT | - | No | - | 방송국 또는 동영상 Full URL |
| `is_primary` | INTEGER | - | Yes | 1 | 대표 링크 플래그 (1: 참, 0: 거짓) |
