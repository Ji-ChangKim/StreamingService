# V-DEBUT HUB 디자인 시스템 명세서 (Design System Guide v4.0)

본 명세서는 **Header / SideL / Main / SideR / Footer 3열 샌드위치 레이아웃 구조**와 Webflow Visual Development Platform 디자인 시스템을 완벽하게 통합한 전체 레이아웃 목업 및 구현 가이드라인입니다.

---

## 1. 페이지 레이아웃 목업 (Layout Architecture & Wireframe)

```
+---------------------------------------------------------------------------------------------------------+
| [V] V-DEBUT HUB   [📅 캘린더] [🛡️ 검수]                           [🌐 시간대: KST ▼]  [➕ 데뷔 일정 제보] |  <-- Header
+---------------------------------------------------------------------------------------------------------+
|                |                                                           |                            |
|  [ SideL ]     |  [ Main Content ]                                         |  [ SideR ]                 |
|  좌측 사이드바 |  중앙 메인 컨텐츠 영역                                    |  우측 사이드바             |
|                |                                                           |                            |
|  • 📺 플랫폼   |  +-----------------------------------------------------+  |  🔴 LIVE NOW               |
|    - 전체      |  | 🔔 [HERO BANNER]                                    |  |  [모카 라이브 중]          |
|    - 치지직    |  | 나비야 (Nabiya) 첫 데뷔까지 02:15:30 남음           |  |  [📺 방송 보러가기]        |
|    - 유튜브    |  | [📅 Google 캘린더 추가]  [📥 .ics 알림 다운]        |  |                            |
|    - 숲(SOOP)  |  +-----------------------------------------------------+  |  🔥 HOT DEBUT PICK         |
|    - 트위치    |                                                           |  [Aria Eclipse - US]       |
|                |  📅 2026년 7월 27일 (오늘)                                |  🕒 2026.07.29 10:00       |
|  • 🏷️ 소속필터 |  +--------------------+ +--------------------+             |                            |
|    - Indie     |  | 🔴 LIVE NOW        | | 🕒 20:00 (KST)    |             |  💡 10초 간편 제보         |
|    - V-PRO     |  | [모카 Avatar]      | | [나비야 Avatar]   |             |  누구나 데뷔 일정을        |
|    - SOOP      |  | 모카 (Moka)        | | 나비야 (Nabiya)   |             |  자유롭게 공유해보세요!    |
|                |  | [📺 방송 보러가기] | | [🔔 캘린더 알림]  |             |                            |
|  • 🔔 내 알림  |  +--------------------+ +--------------------+             |                            |
|    - 등록 2건  |                                                           |                            |
|                |                                                           |                            |
+---------------------------------------------------------------------------------------------------------+
| V-DEBUT HUB © 2026 • Visual Web Development Platform for Global VTubers • Client v0.1.0 • Server v0.1.0  |  <-- Footer
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. 5대 레이아웃 영역별 명세 (Grid & Section Specs)

### 2.1 Header (상단 내비게이션 바)
- **위치**: Sticky Top (`top-0`, `z-40`)
- **디자인**: `#FFFFFF` Canvas 백그라운드 + 1px Hairline Bottom Border (`#D8D8D8`).
- **구성 요인**: 브랜드 로고, `📅 데뷔 달력` & `🛡️ 검수 관리자` 탭, `🌐 글로벌 시간대 셀렉터`, `➕ 데뷔 일정 제보` Primary CTA (`#080808` Ink Black, 4px tight radius).

### 2.2 SideL (좌측 사이드바 - Filter & Quick Navigation)
- **너비**: Desktop 기준 `240px` (반응형 모바일 환경에서는 접힘/메인 상단 바 연동).
- **디자인**: 백색 캔버스 패널, 1px Hairline 테두리 (`#D8D8D8`), `{rounded.md}` 8px radius.
- **구성 요인**:
  - 📺 **플랫폼 필터**: 전체, 치지직(CHZZK), 유튜브(YouTube), 숲(SOOP), 트위치(Twitch) 탭.
  - 🏷️ **소속/에이전시 태그 퀵 선택**: Indie, V-PRO, SOOP Stars 등.
  - 🔔 **내 캘린더 저장 요약**: 사용자가 저장한 알림 카운터.

### 2.3 Main (중앙 메인 컨텐츠 영역)
- **너비**: 3열 그리드 중 중앙 확장 (`flex-1`).
- **구성 요인**:
  - **Hero Countdown Banner**: 임박 데뷔 대형 H1 헤딩 (`Outfit 32px 800` `-0.8px` tracking), JetBrains Mono 실시간 타이머, `Google 캘린더` & `.ics` 다운로드 CTA.
  - **FilterBar (검색창)**: 버튜버 이름 및 소속 실시간 검색 인풋.
  - **CalendarView**: H2 날짜 구분 타이틀 (`📅 오늘`, `📅 7월 29일`), 2열/3열 H3 데뷔 버튜버 카드 그리드.

### 2.4 SideR (우측 사이드바 - Live Now & Trending Picks)
- **너비**: Desktop 기준 `280px` (모바일/태블릿 환경에서는 메인 하단으로 유연하게 스택).
- **디자인**: 8px Radius, Hairline `#D8D8D8` 테두리, Level 2 Layered Drop Shadow.
- **구성 요인**:
  - 🔴 **LIVE NOW 스트림**: 현재 방송 진행 중인 버튜버 퀵 렌더링 및 `📺 방송 보러가기` 직행 버튼.
  - 🔥 **HOT DEBUT PICK**: 가장 기대되는 데뷔 일정 하이라이트.
  - 💡 **오픈 10초 제보 안내 미니 카드**: 가입 없이 바로 제보할 수 있는 퀵 가이드.

### 2.5 Footer (하단 푸터)
- **디자인**: `#FFFFFF` 백그라운드 + 1px Hairline Top Border (`#D8D8D8`).
- **타이포그래피**: Body-Mid (`#5A5A5A`), Mono Code 시스템 버전 표시.

---

## 3. 웹플로우 디자인 토큰 명세 (Webflow Visual System Tokens)

```css
:root {
  /* Brand & Primary Conversion */
  --colors-primary: #080808;         /* Ink Black - Primary CTA & Headings */
  --colors-on-primary: #FFFFFF;

  /* 5-Stop Chromatic Category Palette (Card Surface Fills ONLY) */
  --colors-accent-purple: #7A3DFF;
  --colors-accent-pink: #ED52CB;
  --colors-accent-blue: #3B89FF;
  --colors-accent-orange: #FF6B00;
  --colors-accent-green: #00D722;

  /* Surface & Hairline */
  --colors-canvas: #FFFFFF;
  --colors-canvas-soft: #F8FAFC;
  --colors-hairline: #D8D8D8;

  /* Shape Geometry */
  --rounded-sm: 4px;                  /* Buttons, Inputs, Badges */
  --rounded-md: 8px;                  /* Cards Chrome & Sidebars */
}
```
