# 사용자 흐름 정의서 (User Flow v0.2)

- **서비스명**: 치지직 후원 룰렛 템플릿 서비스 (가칭)
- **작성 버전**: v0.2 (Final)
- **작성일**: 2026-06-13
- **문서 상태**: Approved (최종본 승인)

---

## 1. 개정 사용자 여정 (Revised User Journeys)

v0.2 기획 요구사항 및 시청자 투명성 제고를 위해 개편된 3대 사용자 여정 정의입니다.

### 1.1. 스트리머 설정 & 방송 연동 여정
```mermaid
graph TD
    Start([1. 네이버 로그인]) --> Connect[2. 치지직 채널 자동 연동]
    Connect --> SelectService[3. 후원 서비스 선택 / 룰렛 후원]
    SelectService --> SelectTemplate[4. 5대 UI 템플릿 비주얼 스킨 선택]
    SelectTemplate --> CustomDesign[5. 프리셋 기반 메인컬러, 폰트, 사운드, 재생시간 조율]
    CustomDesign --> CreateRoulette[6. 룰렛명, 최소금액, 메시지 조건 및 가중치 기입]
    CreateRoulette --> SaveRoulette[7. 룰렛 활성화 저장]
    SaveRoulette --> CopyOBS[8. 고유 OBS URL 복사 및 연동]
    CopyOBS --> DashboardHome([9. 대시보드 상태 카드 확인 - Waiting / Running])
```

### 1.2. 시청자 룰렛 확인 및 검증 여정 (읽기 모드)
```mermaid
graph TD
    PublicStart([1. 스트리머 공유 링크 접속]) --> LoadPublic[2. 시청자 전용 읽기 모드 화면 로드]
    LoadPublic --> ProfileCheck[3. 스트리머 프로필 및 채널 정보 노출]
    
    LoadPublic --> ProbabilityTable[4. 활성화된 룰렛 확률표 조회]
    ProbabilityTable --> MappedProbability[5. 가중치 기반 정확한 수학적 확률 % 검증]
    
    LoadPublic --> LogTimeline[6. 실시간 당첨 타임라인 조회]
    LogTimeline --> HistoryLogs[7. 최근 20건의 당첨 일시, 후원자, 결과 이력 조회]
```

### 1.3. 실시간 후원 발생 및 큐(Queue) 순차 재생 흐름
```mermaid
sequenceDiagram
    autonumber
    actor Viewer as 시청자
    participant DO as CF Durable Objects
    participant D1 as D1 데이터베이스
    participant OBS as OBS 오버레이 뷰어
    participant Dash as 스트리머 대시보드

    Viewer->>DO: 치즈 후원 발송 (금액, 메시지 등)
    Note over DO: 1. 중복 트랜잭션 ID 검증<br>2. 매칭되는 최소 금액/메시지 룰렛 조회<br>3. 가중치 난수 결과 추첨
    DO->>D1: donation_events & roulette_results 저장 (pending)
    DO->>OBS: ROULETTE_TRIGGER 패킷 전송 (디자인 및 결과 정보 포함)
    
    alt 이전 애니메이션 구동 중
        OBS->>OBS: FIFO 큐 버퍼에 이벤트 푸시 후 대기
    else 오버레이 대기 상태
        OBS->>OBS: 지정된 테마 디자인 스킨 로딩<br>룰렛 회전 애니메이션 시작 (3.5초)
        Note over OBS: 효과음 재생 및 결과 팝업 노출
        OBS-->>DO: 연출 완료 응답 전송 (ANIMATION_COMPLETE)
        DO->>D1: roulette_results 상태 업데이트 (displayed)
        DO->>Dash: 대시보드 실시간 로그 상태 '성공' 업데이트
    end
```

---

## 2. 룰렛 연동 동작 상태 정의

적용 완료 후 스트리머 대시보드 및 시스템에 표시되는 핵심 상태(State) 카드 명세입니다.

| 상태 | 아이콘/색상 | 동작 상태 및 전환 시나리오 |
| :--- | :---: | :--- |
| **Draft** | 회색 | 룰렛 정보 입력 중이며 아직 저장하지 않은 설계 초안 상태 |
| **Ready** | 파란색 | 룰렛 구성 및 아이템 입력 완료. 템플릿 디자인이 연결되어 적용 대기 중 |
| **Waiting** | 주황색 | 후원 연동하기를 눌러 활성화했으나, OBS 오버레이 브라우저가 접속하지 않았거나 항목이 부족한 대기 상태 |
| **Running** | 초록색 | OBS 브라우저 소스가 연결되어 실시간 후원 유입 시 즉시 룰렛이 구동되는 실행 상태 |
| **Paused** | 노란색 | 스트리머가 수동으로 일시 중지하여 후원이 들어와도 오버레이에 룰렛을 노출시키지 않는 상태 |
| **Error / Revoked**| 빨간색 | 치지직 세션 만료, 토큰 무효화 등으로 강제 연결이 실패한 오류 상태 (해결 가이드 퀵링크 연계) |
