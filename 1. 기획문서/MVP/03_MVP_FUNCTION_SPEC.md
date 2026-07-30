# ⚙️ [MVP] 03_MVP_FUNCTION_SPEC.md - V-DEBUT MVP 기능 정의서

**프로젝트명**: V-DEBUT  
**버전**: v1.0  
**작성일**: 2026-07-31  

---

## 1. 기능 분류 체계 (Function Hierarchy)

```text
V-DEBUT MVP
├── 1. 헤더 & 글로벌 컨트롤러 (Header & Global Nav)
│   ├── 1.1 브랜딩 로고 및 '데뷔 일정' 메뉴
│   └── 1.2 '데뷔 일정 등록' 모달 호출 CTA
├── 2. 캘린더 메인 레이아웃 (Calendar Main)
│   ├── 2.1 히어로 카운트다운 배너 (최단 시간 데뷔 예정자 표시)
│   ├── 2.2 월간 그리드 뷰 (Monthly Calendar Grid)
│   ├── 2.3 타임존 선택 드롭다운 (Timezone Selector)
│   └── 2.4 플랫폼/검색어 필터링 바 (Filter Bar)
├── 3. 스케줄 상세 드로어 (Schedule Inspector Panel)
│   ├── 3.1 선택 날짜 데뷔 크리에이터 목록
│   ├── 3.2 🏢 소속사(Agency) 뱃지 (개인세 미노출)
│   ├── 3.3 ✏️ 일정 수정 버튼 및 모달 연동
│   ├── 3.4 방송 보러가기 & .ics 다운로드 버튼
│   └── 3.5 프로필 아바타 줌(Zoom) 모달
├── 4. 스튜디오 제출/수정 모달 (Studio Submit Modal)
│   ├── 4.1 방송국 URL 자동 입력 및 플랫폼 파싱
│   ├── 4.2 프로필 닉네임/아바타 자동 완성 & 수동 편집 모드
│   ├── 4.3 소속(INDIE/AGENCY) 선택 및 소속사명 입력
│   └── 4.4 폼 리셋 (Reset) & 예외 처리 (404 Fallback)
└── 5. 푸터 (Footer)
    └── 5.1 카피라이트 '© 2026 GameTPS. All rights reserved.'
```

---

## 2. 세부 기능 명세서 (Detailed Function Matrix)

| Function ID | 기능명 | 입력 값 | 동작 및 처리 로직 | 출력 / 결과 |
| :--- | :--- | :--- | :--- | :--- |
| **FN-01** | 프로필 자동 조회 | 방송국 URL | 백엔드 `fetchPlatformProfile` API 호출 ➔ CHZZK/SOOP/YouTube 파싱 | 닉네임, 프로필 이미지, 채널 URL 자동 채움 |
| **FN-02** | 타임존 변환 | Timezone String | `Intl.DateTimeFormat` / `date-fns` 기반 시각 실시간 계산 | 선택한 타임존 시각으로 UI 갱신 |
| **FN-03** | .ics 파일 생성 | Event Object | iCalendar VEVENT 텍스트 블록 생성 ➔ Blob 파일 다운로드 | `.ics` 파일 다운로드 실행 |
| **FN-04** | 일정 생성 (POST)| Form Data | `POST /api/v1/events` ➔ D1 DB Transaction 수행 | 캘린더에 신규 이벤트 카드 즉시 반영 |
| **FN-05** | 일정 수정 (PUT) | Event ID, Form Data | `PUT /api/v1/events/:id` ➔ D1 DB UPDATE 수행 | 기존 이벤트 정보 실시간 갱신 |
| **FN-06** | 폼 데이터 초기화 | 모달 Open Trigger | `editEvent === null` 일 경우 모든 state 초기화 | 깨끗한 빈 모달 폼 제공 |
