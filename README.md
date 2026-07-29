# 🌟 V-DEBUT HUB (스트리머 & 버튜버 데뷔 일정 모아보기)

> **V-DEBUT HUB**는 치지직(CHZZK), 숲(SOOP), 유튜브(YouTube), 트위치(Twitch) 등 다양한 플랫폼에서 활동하는 버튜버 및 스트리머의 **데뷔/재데뷔/컴백/3D 데뷔 일정**을 한눈에 확인하고 글로벌 타임존으로 자동 변환해주는 통합 일정 플랫폼입니다.

---

## 🚀 주요 기능 (Key Features)

- 📅 **월별 일정 캘린더 (Monthly Calendar Grid)**: 한눈에 파악할 수 있는 그리드형 데뷔 캘린더 및 일자별 상세 모달 지원
- 🌍 **글로벌 타임존 자동 변환 (Global Timezone Conversion)**: 시청자 지역 타임존(Asia/Seoul, America/New_York, Europe/London 등)에 맞춘 실시간 시각 계산
- 🔍 **플랫폼 & 검색 필터링 (Multi-Platform Filter & Search)**: CHZZK, SOOP, YOUTUBE, TWITCH 플랫폼별 필터링 및 라이브 상태 표시
- ⏰ **구글 캘린더 & iCal (.ics) 연동**: 관심 있는 데뷔 일정을 클릭 한 번으로 개인 캘린더에 즉시 등록 및 다운로드
- 🎙️ **크리에이터/스튜디오 등록 제출 (Submit Modal)**: 신입 스트리머 및 버튜버가 본인의 데뷔 일정을 직접 제출/등록 가능

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **Core / Framework**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Vanilla CSS Design System, Lucide Icons
- **Deployment & Hosting**: Cloudflare Pages / KV

### Backend
- **Framework**: Hono (Lightweight Web Standard Framework)
- **Runtime**: Cloudflare Workers / Durable Objects
- **Database**: Cloudflare D1 (Serverless Relational SQL Database)
- **Language**: TypeScript

---

## 📂 프로젝트 구조 (Project Structure)

```
StreamingService/
├── 0. 대외비문서/            # 보안/내부 세부 참조 자료 및 DB 백업
├── 1. 기획문서/              # PRD, DFD, DB 스키마, UI 스펙, 디자인 시스템 가이드 등
├── backend/                 # Cloudflare Workers + Hono + D1 백엔드 API
│   ├── src/
│   │   ├── index.ts         # Hono 서버 진입점 및 라우팅
│   │   └── services/        # DB 쿼리 및 데이터 서비스 모듈
│   ├── migrations/          # Cloudflare D1 SQL 마이그레이션 파일
│   └── wrangler.toml        # Workers & D1 설정 파일
└── frontend/                # React + Vite + TailwindCSS 프론트엔드
    ├── src/
    │   ├── components/      # UI 컴포넌트 (Calendar, Header, Modal 등)
    │   ├── data/            # Mock 데이터 모듈
    │   ├── services/        # API 통신 클라이언트 모듈
    │   ├── utils/           # 날짜, 시간, 달력 계산 유틸리티
    │   └── App.tsx          # 애플리케이션 메인 루트 컴포넌트
    └── package.json
```

---

## 💻 로컬 개발 환경 실행 방법 (Getting Started)

### 1. 프론트엔드 (Frontend)

```bash
cd frontend
npm install
npm run dev
```
기본 접속 URL: `http://localhost:5173`

### 2. 백엔드 (Backend API)

```bash
cd backend
npm install
npx wrangler dev --local
```
기본 API URL: `http://localhost:8787/api/v1`

---

## 📡 주요 API 엔드포인트 (API Overview)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/system/version` | 시스템 및 서버 헬스 체크, 클라이언트 버전 호환성 검증 |
| `GET` | `/api/v1/events` | 등록된 데뷔 일정 목록 조회 (D1 DB 또는 Fallback) |
| `POST` | `/api/v1/events` | 새로운 데뷔 일정 및 크리에이터 프로필 제출/등록 |

---

## 📄 문서 가이드 (Documentation)

자세한 기획 및 설계 문서는 [`1. 기획문서/README.md`](file:///j:/개인 프로젝트/WEB/StreamingService/1.%20기획문서/README.md)에서 확인하실 수 있습니다.
