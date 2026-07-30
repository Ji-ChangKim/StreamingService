# V-DEBUT HUB 통합 기획 패키지 v0.1

> **문서 상태**: 정본 (v0.1)  
> **기준일**: 2026-07-27  
> **기준 시간대**: Asia/Seoul (글로벌 확장 전제)  
> **서비스 한 줄 정의**: 다가오는 VTuber 데뷔를 등록하고, 검증하고, 발견하고, 놓치지 않게 하는 글로벌 캘린더.

---

## 0. 의사결정 요약

### 권고 결론
이 서비스는 범용 VTuber 위키나 방송 편성표가 아니라, '첫 데뷔·재데뷔·그룹 데뷔'라는 한 번의 이벤트를 스트리머가 직접 등록하고 소유권을 검증하며, 시청자가 현지 시간으로 발견·알림·시청까지 이어가는 글로벌 데뷔 허브로 만든다.

### 해결하려는 핵심 문제
- **스트리머**: X 게시물·방송 공지·이미지 일정표에 흩어진 데뷔 정보를 구조화해 노출할 곳이 없다.
- **시청자**: '이번 주 누가, 언제, 어느 플랫폼에서 데뷔하는가'를 언어와 시간대 장벽 없이 확인하기 어렵다.
- **에이전시·플랫폼**: 소속·플랫폼 경계를 넘어 신인을 발견시키는 공용 데뷔 인벤토리가 없다.

### 제품 원칙
| 원칙 | 제품 결정 | 배제하는 것 |
|---|---|---|
| **데뷔 중심** | 첫 데뷔·재데뷔·그룹 데뷔만 이벤트로 취급 | 일반 주간 방송표, 신의상 공개 |
| **등록 우선** | 스트리머·에이전시 직접 등록이 정본 | 무차별 크롤링으로 자동 생성 |
| **검증 우선** | 소유권·공식을 표시 | 출처 없는 일정의 확정 표기 |
| **현지 시간** | UTC 저장 + 원래 시간대 보존 + 사용자 로컬 표시 | KST 또는 PST 고정 |
| **공정한 발견** | 기본 캘린더는 시간순·필터 중심 | 팔로워 수 우선 랭킹 |
| **무료 기본권** | 등록·기본 노출·수정은 무료 | 결제하지 않으면 숨겨지는 일정 |

---

## 1. MVP 범위 및 핵심 스택

### 1.1 대상 범위
- **플랫폼 (P0)**: YouTube, Twitch, CHZZK, SOOP
- **언어 및 지역**: 한국어·영어 UI 우선 제공 (일본어 데이터 입력 및 날짜/이름 표시 지원)
- **주요 기능**: 프로필·플랫폼 소유권 검증, 데뷔 등록·수정, 캘린더·검색·필터, 상세 페이지, ICS 캘린더 추가, 상태 변경 알림, 운영자 검수 큐.

### 1.2 권장 기술 아키텍처
- **Web Frontend**: React / Vite, TypeScript, Vanilla CSS (Modern Fluid Design System)
- **API Backend**: Cloudflare Workers + Hono Framework
- **Database**: Cloudflare D1 (SQLite-based Relational DB)
- **Object Storage**: Cloudflare R2
- **Queue / Scheduler**: Cloudflare Queues, Cron Triggers (D-7 / D-1 / T-2h / T+15m 점검)

---

## 2. 권장 핵심 데이터 모델 (D1 Schema Summary)

1. `users`: 계정 및 식별 정보
2. `creator_profiles`: 버튜버 크리에이터 기본 프로필 (slug, display_name, bio 등)
3. `creator_platform_accounts`: 연동된 방송 플랫폼 계정 (provider, channel_url, verified_at 등)
4. `agencies`: 버튜버 MCN/에이전시 조직 정보
5. `agency_members`: 에이전시 멤버 및 담당자 권한 (role)
6. `debut_events`: 데뷔 이벤트 정본 (type, start_at_utc, original_timezone, status, verification_status)
7. `debut_event_links`: 시청 URL 및 방송 도메인 링크
8. `event_status_history`: 일정 시각 변경 및 상태 변경 추적 이력 (append-only)
9. `source_records`: 증거/출처 URL 및 수집 시각, 원문 해시
10. `verifications`: 소유권 및 공식 출처 검증 내역
11. `reminders`: 사용자 알림 및 캘린더 추가 동의 기록
12. `moderation_cases`: 사칭, 오정보, 신고 및 검수 처리 로그
13. `sync_runs`: 외부 플랫폼 API 상태 동기화 관측 기록

---

## 3. 브랜치 & 버전 관리 정책

- **Git 브랜치**:
  - `dev`: 개발 환경 및 preview 배포, 개발 DB (`v-debut-hub-db-dev`) 연동
  - `live` (or `main`): 운영 환경 배포, 운영 DB (`v-debut-hub-db-live`) 연동
- **Server**: 백엔드 API는 항상 최신 로직을 유지하되 하위 호환성 보장
- **Client**: `APP_VERSION` 헤더 기반 독립 버전 관리 (`v0.1.0` 등)
- **DB Sync**: `npm run db:sync:live-to-dev` 명령어로 LIVE DB 덤프를 DEV DB로 동기화 지원
