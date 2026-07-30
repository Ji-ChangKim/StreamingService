# 📋 [기획] 01_PROJECT_PRD_MVP.md
**버전**: v1.0 (MVP Complete)  
**최종 수정일**: 2026-07-30  
**상태**: MVP 개발 완료 & 배포 수용 (Production Live)  

---

## 1. 프로젝트 개요 (Overview)
**V-DEBUT**는 전 세계 VTuber(버츄얼 스트리머)의 최초 데뷔 및 플랫폼 이적 일정을 수집·제공하는 **글로벌 버튜버 데뷔 캘린더 플랫폼**입니다.

### 🎯 핵심 해결 과제
1. **플랫폼 파편화 해소**: 치지직, SOOP, YouTube 등 여러 플랫폼에 흩어진 신인/이적 버튜버 데뷔 일정의 단일 집계.
2. **타임존 시차 혼선 방지**: 글로벌 버튜버 및 해외 팬덤을 고려한 현지 시각 자동 교정 및 `.ics` 캘린더 저장.
3. **간편한 일정 등록/수정**: URL 한 줄 입력으로 방송국 프로필(닉네임, 아바타, 소개글) 자동 파싱.

---

## 2. MVP 핵심 기능 명세 (Core Features)

### 2.1 4대 방송 플랫폼 자동 프로필 파서 (Automated Profile Parser)
- **CHZZK (치지직)**:
  - 채널 주소 (`chzzk.naver.com/{channelId}`) 및 라이브 주소 파싱
  - **다시보기/클립 URL (`chzzk.naver.com/video/{videoId}`)** 자동 역추적 채널 프로필 획득
- **SOOP (구 아프리카TV)**:
  - 방송국 메인 (`sooplive.com/station/{userId}`) 및 게재글 (`/station/memo/{userId}/post/...`) 파싱
  - 최신 `chapi.sooplive.co.kr` API 기반 닉네임, 고화질 프로필 이미지 자동 추출
- **YouTube (유튜브)**:
  - `@Handle` (`youtube.com/@RyukoNizuna`) 및 채널 URL 지원
  - OpenGraph Meta 스크레이핑을 통한 고화질 프로필 아바타(`yt3.googleusercontent.com`) 추출

### 2.2 데뷔 캘린더 & 인터랙션 (Calendar & Interactions)
- **월간/주간/리스트 뷰 전환**: Intuitive 반응형 Grid Layout
- **글로벌 타임존 설정**: KST/JST/PST/EST 등 사용자 로컬 타임존 자동 감지 및 시각 표시
- **1-Click .ics 저장**: 구글/아웃룩 캘린더 등록 파일 즉시 다운로드
- **GIF(움짤) 아바타 지원**: 생동감 있는 버튜버 프로필 애니메이션 재생

### 2.3 일정 CRUD 관리 (Schedule Management)
- **신규 일정 등록 (Create)**: URL 입력 시 프로필 자동 채우기 및 소속(기업/개인세) 지정
- **일정 수정 (Update)**: `PUT /api/v1/events/:id` REST API를 이용한 기존 일정 업데이트
- **폼 리셋 및 예외 처리 (UX Safety)**: 404 URL 입력 시 수동 입력 자동 전환 및 모달 상태 초기화

---

## 3. UI/UX 디자인 정책
- **상단 헤더**: 로고 및 [데뷔 일정], [데뷔 일정 등록] CTA 버튼만 최소화하여 배치
- **푸터**: 카피라이트 `© 2026 GameTPS. All rights reserved.` 명시 및 불필요한 링크 정리
- **기업 소속 태그**: `🏢 AgencyName` 전용 뱃지 표기 (`🌱 개인세` 뱃지는 제거)
