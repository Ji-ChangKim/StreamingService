# 데이터 흐름도 명세서 (Data Flow Diagram - DFD)

- **제품명**: V-DEBUT HUB
- **작성일**: 2026-07-27
- **문서 상태**: Approved

---

## 1. DFD Level 0 (Context Diagram)
최상위 레벨 시스템 개요 다이어그램입니다. 사용자 주체(Streamer/Agency, Viewer, Admin)와 외부 플랫폼(YouTube, Twitch, CHZZK, SOOP) 간의 핵심 데이터 입출력을 보여줍니다.

```mermaid
graph TD
    Streamer[스트리머 / 에이전시] -->|1. 데뷔 일정 정보, 채널 URL, 소유권 증명| System((V-DEBUT HUB System))
    System -->|2. 소유권 검증 배지, 캘린더 공유 카드, 노출 성과| Streamer

    Viewer[시청자 / 팬] -->|3. 검색/필터 조건, 로컬 시간대, 알림 신청| System
    System -->|4. 현지 시간 데뷔 캘린더, .ics 캘린더 파일, 방송 이동 링크| Viewer

    Admin[운영자 / Moderator] -->|5. 검수 승인/거절, 신고 처리| System
    System -->|6. 검수 대상 큐, 사칭/오류 신고 건| Admin

    System <-->|7. 채널 메타데이터, LIVE 상태 확인| ExternalPlatforms[외부 방송 플랫폼 - YouTube/Twitch/CHZZK/SOOP]
```

---

## 2. DFD Level 1 (Subsystem Flow)
시스템 내부 서브시스템 레벨 데이터 흐름입니다.

```mermaid
graph TD
    subgraph External Entities
        P_Streamer[Streamer / Agency]
        P_Viewer[Viewer]
        P_Admin[Admin]
    end

    subgraph System Processes
        Proc1[1.0 계정 & 소유권 검증 프로세스]
        Proc2[2.0 데뷔 일정 등록 & 수정 프로세스]
        Proc3[3.0 캘린더 탐색 & 시간대 변환 엔진]
        Proc4[4.0 운영 검수 & 트리아지 프로세스]
        Proc5[5.0 외부 API 상태 동기화 모듈]
    end

    subgraph Data Stores
        DS1[(D1: users & creator_profiles)]
        DS2[(D1: debut_events & links)]
        DS3[(D1: verifications & source_records)]
        DS4[(D1: moderation_cases)]
    end

    P_Streamer -->|프로필 & 채널 URL| Proc1
    Proc1 -->|검증 결과| DS3
    Proc1 -->|크리에이터 정보| DS1

    P_Streamer -->|데뷔 이벤트 데이터| Proc2
    Proc2 -->|이벤트 저장/수정| DS2

    DS2 -->|UTC 시간 데이터| Proc3
    P_Viewer -->|로컬 시간대 & 검색 필터| Proc3
    Proc3 -->|변환된 현지 시간 캘린더 & .ics| P_Viewer

    DS2 -->|검수 대기 이벤트| Proc4
    P_Admin -->|승인/거절 판정| Proc4
    Proc4 -->|상태 업데이트| DS2
    Proc4 -->|감사 로그| DS4

    Proc5 <-->|상태 동기화| ExternalPlatforms[External Platforms]
    Proc5 -->|LIVE 상태 갱신| DS2
```

---

## 3. DFD Level 2 (Detailed Event Processing)
데뷔 일정 등록 및 검수, 탐색의 데이터 정규화 및 변환 세부 프로세스입니다.

```mermaid
graph LR
    Input[스트리머 입력: 날짜/시간 + IANA 시간대] --> Normalizer[1. UTC 시간 표준화 엔진]
    Normalizer -->|UTC ISO-8601| Storage[(debut_events DB)]
    
    Storage --> Fetcher[2. 시청자 요청 수신]
    Fetcher --> TZ_Calculator[3. 시청자 로컬 시간대 변환기]
    TZ_Calculator --> FormatOutput[4. 현지 시간 및 D-Day 카운트다운 생성]
    FormatOutput --> UI[시청자 화면 렌더링]
```
