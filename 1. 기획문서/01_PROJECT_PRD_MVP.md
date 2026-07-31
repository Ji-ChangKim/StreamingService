# 📋 [기획] 01_PROJECT_PRD_MVP.md
**버전**: v2.0 (Live Production Standard)  
**최종 수정일**: 2026-08-01  
**상태**: 프로덕션 라이브 서비스 운용 중 (Production Live)  

---

## 1. 프로젝트 개요 (Overview)
**V-DEBUT**는 전 세계 VTuber(버츄얼 스트리머)의 최초 데뷔 및 플랫폼 이적 일정을 수집·제공하는 **글로벌 버튜버 데뷔 캘린더 플랫폼**입니다.

### 🎯 핵심 해결 과제
1. **플랫폼 파편화 해소**: 치지직, SOOP, YouTube 등 여러 플랫폼에 흩어진 신인/이적 버튜버 데뷔 일정의 단일 집계.
2. **글로벌 국가 및 언어 대응**: 대한민국(KR), 일본(JP), 미국(US) 등 활동 국가(`country_code`) 및 다국어(한국어, 영어, 일본어) 지원.
3. **타임존 시차 혼선 방지**: 글로벌 버튜버 및 해외 팬덤을 고려한 현지 시각 자동 교정 및 `.ics` 캘린더 저장.
4. **간편한 일정 등록/수정**: URL 한 줄 입력으로 방송국 프로필(닉네임, 아바타, 소개글) 자동 파싱 및 DB 저장.

---

## 2. 핵심 기능 명세 (Core Features)

### 2.1 4대 방송 플랫폼 자동 프로필 파서 (Automated Profile Parser)
- **CHZZK (치지직)**:
  - 채널 주소 (`chzzk.naver.com/{channelId}`) 및 라이브/숏컷 주소 파싱
  - 다시보기/클립 URL (`chzzk.naver.com/video/{videoId}`) 자동 역추적 채널 프로필 획득
- **SOOP (구 아프리카TV)**:
  - 방송국 메인 (`sooplive.com/station/{userId}`) 및 메모/게재글 파싱
  - 최신 `chapi.sooplive.co.kr` API 기반 닉네임, 고화질 프로필 이미지 자동 추출
- **YouTube (유튜브)**:
  - `@Handle` (`youtube.com/@RyukoNizuna`) 및 채널 URL 지원
  - OpenGraph Meta 스크레이핑을 통한 고화질 프로필 아바타(`yt3.googleusercontent.com`) 추출

### 2.2 데뷔 캘린더 & 프로필 카드 (Calendar & Profiles)
- **월간/주간/리스트 뷰 전환**: 반응형 Grid Layout
- **글로벌 국가코드(`country_code`) 및 다국어 지원**: `KR`(대한민국), `JP`(일본), `US`(미국) 활동 스트리머 분류
- **D + N일 카운트다운 뱃지**: 데뷔완료 스트리머 대상 데뷔일 경과일(D+N일) 자동 계산 표시
- **1-Click .ics 저장**: 구글/아웃룩 캘린더 등록 파일 즉시 다운로드

### 2.3 일정 CRUD & D1 DB Pair Tables (Schedule & DB)
- **신규 일정 등록 (Create)**: URL 입력 시 프로필 자동 채우기 및 `streamerChannel` & `streamerChannel_info` 짝꿍 테이블 1:1 저장
- **일정 수정 (Update)**: REST API를 이용한 데이터 및 프로필 업데이트
- **외부 API 자동 동기화 (Route B Fallback)**: DB 다이렉트 쿼리 등록 건에 대해 외부 API로 프로필 이미지 및 정보 실시간 수집 보완

---

## 3. UI/UX 디자인 정책
- **상단 헤더**: 로고, 언어 선택, [데뷔 일정], [데뷔 일정 등록] CTA 버튼 배치
- **프로필 카드**: [채널 방문] 우측 하단 명확 배치, 기업세 소속 표기(`🏢 소속명`), 데뷔일 기준 D+N일 자동 계산 표기
- **푸터**: 카피라이트 `© 2026 GameTPS. All rights reserved.` 명시 및 불필요한 링크 정리
