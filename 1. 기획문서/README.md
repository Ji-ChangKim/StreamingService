# 📚 V-DEBUT HUB 기획 & 기술 사양 문서 (Planning Documentation)

이 디렉터리는 **V-DEBUT HUB** 프로젝트의 제품 기획, 시스템 구조, 데이터베이스 설계, UI/UX 규격 및 브랜드 디자인 시스템 가이드 문서들을 수록하고 있습니다.

---

## 📑 문서 목차 및 안내 (Document Index)

### 1. 제품 기획 및 브랜딩 사양 (Product Specifications)
- 📄 **[PRD_v0.1_V-DEBUT.md](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/PRD_v0.1_V-DEBUT.md)**
  - **제품 정의서 (Product Requirement Document)**
  - 배경, 목적, 코어 타겟 사용자 (글로벌 버튜버/스트리머 시청자 및 크리에이터), 페르소나, 핵심 기능 명세.
- 📄 **[V-DEBUT_HUB_Planning_Package_v0.1.md](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/V-DEBUT_HUB_Planning_Package_v0.1.md)**
  - **기획 패키지 종합 요약**
  - 핵심 가치 제안, 로드맵, 서비스 마일스톤 및 런칭 전략.

---

### 2. 아키텍처 및 데이터 흐름 (Architecture & Data Flow)
- 📄 **[DFD.md](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/DFD.md)**
  - **데이터 흐름도 (Data Flow Diagram)**
  - 사용자-프론트엔드-API 서버-Cloudflare D1 DB 간 데이터 요청, 처리, 렌더링 세부 데이터 플로우.
- 📄 **[USER_FLOW.md](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/USER_FLOW.md)**
  - **사용자 시나리오 & 유저 플로우 (User Flow & Scenarios)**
  - 시청자(데뷔 일정 검색/타임존 변경/캘린더 저장) 및 크리에이터(데뷔 등록 제출) 경로.

---

### 3. 데이터베이스 및 UI/UX 설계 (Database & Interface Specs)
- 📄 **[DB_SCHEMA_SPEC.md](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/DB_SCHEMA_SPEC.md)**
  - **데이터베이스 스키마 명세서 (D1 Database Schema)**
  - `creator_profiles`, `debut_events`, `debut_event_links` 테이블 구조, 데이터 타입, ERD 및 인덱스 설계.
- 📄 **[UI_DESIGN_SPEC.md](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/UI_DESIGN_SPEC.md)**
  - **UI/UX 디자인 사양서 (User Interface Spec)**
  - 화면 레이아웃, 와이어프레임 구조, 월별 그리드, 모달 UI 및 필터 바 명세.
- 📄 **[DESIGN_SYSTEM_GUIDE.md](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/DESIGN_SYSTEM_GUIDE.md)**
  - **디자인 시스템 & 스타일 가이드 (Design System Guide)**
  - 브랜드 파스텔 & 다크/라이트 테마 컬러 팔레트, 타이포그래피(Inter, Noto Sans KR), 버튼/태그 스타일 가이드.
- 📄 **[BRANCH_AND_VERSION_GUIDE.md](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/BRANCH_AND_VERSION_GUIDE.md)**
  - **버전 및 형상 관리 가이드 (Git Branch & Versioning)**
  - 브랜치 전략(main, feature, release) 및 세만틱 버저닝(Semantic Versioning) 규칙.

---

## 📌 문서 유지보수 규칙 (Maintenance Rules)

1. 기능 추가 및 스키마 변경 시 관련 문서를 동시 업데이트합니다.
2. 모든 가이드 문서 간 링크는 상호 참조가 가능하도록 유지합니다.
