# 📘 [PRD] 데뷔 가이드 모듈 제품 요구사항 정의서 (Debut Guide)

- **제품명**: V-DEBUT HUB
- **문서 구분**: 기능별 PRD (5. 데뷔 가이드 모듈)
- **작성일**: 2026-07-30
- **문서 상태**: Approved

---

## 1. 개요 및 목적 (Overview & Objective)

데뷔 가이드(Debut Guide) 모듈은 **신입 버튜버 및 개인세(Indie) 스트리머가 성공적인 데뷔 방송을 기획하고 준비할 수 있도록 4단계 실전 로드맵과 가이드 아티클을 제공**하여, 데뷔 완성도를 높이고 V-DEBUT HUB 등록을 유도하는 가이드북 센터입니다.

---

## 2. 4단계 실전 데뷔 로드맵 (4-Step Roadmap)

```
+-----------------------------------------------------------------------------------+
|  Phase 1. 아바타 & 기술 세팅 ➡️  Phase 2. 티저 & 홍보  ➡️  Phase 3. HUB 일정 등록  ➡️  Phase 4. 데뷔 생방송  |
+-----------------------------------------------------------------------------------+
```

### 📌 Phase 1: 아바타 & 방송 환경 구축
- Live2D 파츠 분리 및 VTube Studio / OBS 방송 세팅 가이드.
- 마이크, 오디오 인터페이스 및 저작권 프리 폰트/BGM 수집 가이드.

### 📌 Phase 2: 티저 (PV) & SNS 홍보 전략
- X(트위터) 데뷔 해시태그 (`#버튜버_데뷔`, `#VTuber_Debut`) 작성 규칙.
- 데뷔 1주일 전 실루엣 티저 ➔ 3일 전 모델 전면 공개 ➔ D-1 타임라인 공지 전략.

### 📌 Phase 3: V-DEBUT HUB 1-Click 일정 등록
- V-DEBUT HUB에 데뷔 일정 등록 후 **`[🛡️ Owner Verified]` 소유권 인증 획득법**.
- 시청자가 한눈에 알아보는 시청 포인트(이벤트 태그: `#노래`, `#Q&A`) 작성법.

### 📌 Phase 4: 데뷔 당일 & 후속 시청자 소통
- 데뷔 생방송 시청자 유입을 유지하기 위한 1시간 방송 진행 콘티(자기소개표, 룰렛).
- 방송 종료 후 하이라이트 클립/숏폼 제작 노하우.

---

## 3. 화면 UI/UX 명세 (`/guide`)

1. **데뷔 체크리스트 인터랙티브 카드 (Interactive Progress Tracker)**:
   - 유저가 본인의 데뷔 준비 진행률을 체크박스로 클릭하면 진행률(Progress Bar: 예 `65% 완료`)이 시각적으로 표시되고 로컬 스토리지에 저장됨.
2. **카테고리별 가이드 아티클 뷰어**:
   - `[🎨 그래픽/Live2D]` | `[⚙️ 방송 프로그램]` | `[📣 홍보/SNS]` | `[📅 HUB 활용법]`
   - 마크다운 기반의 정갈한 읽기 모드 지원.
3. **템플릿 다운로드 섹션**:
   - `[📥 무료 자기소개표 템플릿 다운로드]`
   - `[📥 데뷔 방송표 이미지 가이드 PSD]`

---

## 4. 데이터 스키마 명세 (Data Schema)

```typescript
interface DebutGuideArticle {
  id: string; // 'gde_2026_01'
  phase: 1 | 2 | 3 | 4;
  category: 'GRAPHIC' | 'TECH' | 'MARKETING' | 'PLATFORM';
  title: string;
  summary: string;
  contentMarkdown: string;
  recommendedTools?: string[]; // ['VTube Studio', 'OBS', 'Canva']
  downloadableAssets?: {
    name: string;
    fileUrl: string;
  }[];
  updatedAtUtc: string;
}
```
