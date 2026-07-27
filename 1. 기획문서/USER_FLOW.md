# 사용자 흐름 정의서 (User Flow v0.1)

- **서비스명**: V-DEBUT HUB (가칭)
- **작성 버전**: v0.1 (Final)
- **작성일**: 2026-07-27
- **문서 상태**: Approved

---

## 1. 주요 사용자 여정 (User Journeys)

### 1.1. 스트리머/에이전시 데뷔 등록 & 소유권 인증 여정
```mermaid
graph TD
    Start([1. 서비스 접속 및 회원가입/로그인]) --> CreateProfile[2. Creator 프로필 생성 - 활동명, 언어, 아바타]
    CreateProfile --> LinkPlatform[3. 방송 플랫폼 채널 URL 연동 - YouTube, CHZZK, SOOP 등]
    LinkPlatform --> Verification{4. 소유권 인증 방식 선택}
    
    Verification -->|OAuth 연결| OAuthDone[5.1. 즉시 인증 완료 - Owner Verified]
    Verification -->|공지 코드 게시| CodeCheck[5.2. 프로필/공지 일회용 코드 확인 - Source Verified]
    
    OAuthDone --> InputEvent[6. 데뷔 이벤트 정보 입력 - 날짜, 시간, 원래 시간대, 소개]
    CodeCheck --> InputEvent
    
    InputEvent --> PreviewTZ[7. 글로벌 시간대 변환 미리보기 - KST / PST / UTC 동시 확인]
    PreviewTZ --> Submit[8. 데뷔 제출 및 검수 큐 전송]
    Submit --> ReviewResult{9. 운영자 검수 결과}
    
    ReviewResult -->|승인| Published([10. 공개 캘린더 등재 - 카운트다운 & 공유 카드 발급])
    ReviewResult -->|보완 요청| EditDraft[11. 정보 수정 후 재제출]
```

---

### 1.2. 시청자 탐색, 시간대 변환 & ICS 알림 저장 여정
```mermaid
graph TD
    UserStart([1. 메인 캘린더 접속]) --> AutoTZ[2. 브라우저/접속 지역 시간대 자동 인식 및 설정]
    AutoTZ --> FilterBar[3. 취향 필터링 - 플랫폼, 언어, 소속, 데뷔 유형]
    FilterBar --> ViewCards[4. 현지 시간순 데뷔 카드 리스트 탐색]
    
    ViewCards --> SelectEvent[5. 관심 데뷔 카드 클릭]
    SelectEvent --> DetailModal[6. 데뷔 상세 모달 조회 - 카운트다운, 검증 배지, 상세 소개]
    
    DetailModal --> ActionChoice{7. 액션 선택}
    
    ActionChoice -->|캘린더 추가| DownloadICS[8.1. .ics 파일 다운로드 / Google 캘린더 등록]
    ActionChoice -->|공유| ShareCard[8.2. 현지 시간 포함 공유 카드 생성 및 URL 복사]
    ActionChoice -->|알림 신청| SetPush[8.3. D-1 / T-1h 웹푸시 및 이메일 알림 등록]
```

---

### 1.3. 데뷔 라이브 직전/진행 중 시청자 전환 여정
```mermaid
graph TD
    LiveStart([1. D-1 / T-1h 알림 수신 또는 캘린더 재방문]) --> CheckStatus{2. 데뷔 이벤트 상태 확인}
    
    CheckStatus -->|LIVE 진행 중| ClickWatch[3. '🔴 LIVE 방송 보러 가기' CTA 클릭]
    CheckStatus -->|카운트다운 중| WaitPage[4. 카운트다운 페이지에서 대기]
    
    ClickWatch --> ExternalRedirect([5. 원본 방송 플랫폼 - CHZZK / YouTube / SOOP 라이브 채널 이동])
```

---

### 1.4. 운영자 검수 & 사칭/오정보 트리아지 여정
```mermaid
graph TD
    AdminStart([1. Admin Review Queue 진입]) --> FetchPending[2. 제출된 미검수 이벤트 목록 조회]
    FetchPending --> InspectEvidence[3. 방송 URL, 공식 공지 출처, 소유권 코드 검증]
    
    InspectEvidence --> DecisionTree{4. 검수 판단}
    
    DecisionTree -->|정상 출처| Approve[5.1. 승인 - PUBLISHED 전환 및 배지 부여]
    DecisionTree -->|시간/링크 오류| RequestChange[5.2. 보완 요청 - 사유 입력 후 스트리머 전달]
    DecisionTree -->|사칭 / 악성 링크| Reject[5.3. 거절 및 영구 차단 - REJECTED 및 계정 조치]
```
