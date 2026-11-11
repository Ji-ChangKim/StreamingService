# VDébut 고도화 데이터와 DB 설계

- **문서명**: 발굴·근거·자동 보강·공개·갱신·참여가 공유하는 데이터 기본 구조
- **버전**: v3.1 치지직 신규 탐색·관측·신인 근거 분리
- **최종 수정일**: 2026-11-11 KST
- **작성자/담당**: Codex 데이터 기획 · 프로젝트 담당자 검토
- **상태**: 논리 설계만 작성. 운영 DB 조회·DDL·마이그레이션·수집·반영 미실행
- **상위 기획**: [22 전체 방향](./22_SERVICE_ADVANCEMENT_MASTER_PLAN.md), [32 발굴·확보 계획](./32_DISCOVERY_AND_DATA_ACQUISITION_PLAN.md)
- **연결 문서**: [24 개발·비용](./24_ADVANCEMENT_BACKLOG_AND_COST.md), [30 첫 출시 범위](./30_FIRST_RELEASE_FINAL_PLAN.md)

## 1 설계 목적과 기존 데이터 재사용

발굴과 사용자 등록이 서로 다른 DB를 만들지 않게 한다. 모든 유입은 **출처 → 후보 → 인물/채널 → 항목별 근거 → 채택/변경 → 공개 데이터**로 연결한다. 알려진 인물의 갱신은 같은 인물에 누적하고, 데뷔 일정이 없더라도 인물 후보를 보존한다.

기존 PortalProfile·details·media·featured·tags·languages·공식 채널, 등록 접수·공개 검토·편집 이력을 재사용한다. 기존 프로필 JSON은 공개용 결과로 유지하고 근거·후보·작업 상태는 별도로 연결한다. 기존 DB 짝꿍 테이블과 공개 slug를 일괄 이관하거나 새 DB 서비스를 도입하는 것이 첫 목표가 아니다.

아래 이름은 **논리 영역/예시 필드**다. 실제 테이블·필드와 기존 관리자 이력의 재사용 범위는 D1에서 정한다. 이번에 테이블·SQL·API를 구현한 것은 아니다.

## 2 최소 데이터 계약

| 영역 | 최소 필드 | 무결성·역할 |
| --- | --- | --- |
| 인물 | personId, publicSlug, displayName, publicationState, createdAt | 기존 주소 유지. 이름 변경·복수 채널에도 같은 사람의 연결을 보존. 최초 매핑은 기존 프로필 식별자로 생성 가능 |
| 채널 연결 | channelKey, platform, canonicalChannelId, canonicalUrl, personId, verificationState | platform+canonicalChannelId UNIQUE. 공개·대기·보류·별칭·삭제 차단까지 대조. 이름으로 병합 금지 |
| 출처 설정 | sourceId, kind, officialScope, allowedFields, allowedUse, retentionPolicy, mode, parserVersion, budget, interval | 초기에는 코드/설정 목록으로 관리 가능. 미확인 출처의 자동 공개·상업 이용을 가정하지 않음 |
| 출처 항목 | sourceId, sourceItemKey, canonicalUrl, payloadHash, publishedAt, firstObservedAt, lastObservedAt, sourceState | sourceId+sourceItemKey UNIQUE. 같은 항목 재수집은 값 비교만 수행. 원문 전체·이미지 원본 대량 복제 제외 |
| 발굴 후보 | candidateId, sourceItemRef, channelKey, possiblePersonId, eventType, workflowState, missingFields, conflictReason, version | 원문 항목과 채널/행사 식별 기준으로 중복 방지. 같은 채널의 다른 행사는 별도 관계로 연결 |
| 항목별 근거 | claimId, person/candidateRef, fieldPath, typedValue, sourceItemRef, evidenceUrl, observedAt, validFrom, evidenceState | 값과 근거를 한 쌍으로 보관. 동일 값은 중복 주장 추가 대신 확인 시각 갱신. 공개일·확인일 구분 |
| 채택·보호 | personId+fieldPath, selectedClaimId, currentValueHash, lockMode, selectedBy, selectedAt, version | 잠금·신선도·공식성의 명시적 규칙으로 선택. 늦게 수집됐다는 이유만으로 우선하지 않음 |
| 동기화 상태 | source/channelKey, lastSuccessAt, nextCheckAt, cursor, etag/hash, failureState, leaseUntil | 소스·채널 작업 각각 유일 키, 제한된 재시도·잠금·다음 실행 선택 |
| 반영·복구 기록 | operationId, candidateVersion, ruleVersion, beforeHash, afterHash, diff, evidenceRefs, appliedAt, result | 작업 ID UNIQUE. 직전 상태 비교·부분 실패 복구·재실행 안전성. 기존 정정/역사 저장과 중복 구현 최소화 |
| 삭제·수집 차단 | channel/sourceItemKey, reasonCode, blockedScope, createdAt, retentionUntil | 삭제 후 자동 수집이 다시 공개하지 않게 차단. 요청자의 비공개 정보는 공개하지 않음 |

채널 식별자는 확인 가능한 플랫폼 고유 ID를 우선한다. 핸들·단축 주소·별칭은 별도 매핑하며 확인되지 않은 ID와 합치지 않는다. 복수 채널의 동일 인물 병합은 명시적인 공식 교차 연결이나 검토 근거가 있어야 한다. 자동 공개 최소 소개는 소유권 인증 마크를 부여하지 않는다.

### 2.1 모르는 치지직 채널을 처음 발견할 때 남길 값

발견 경로(LIVE_LIST/CHANNEL_SEARCH/EXTERNAL_POST/OFFICIAL_LINK), sourceItemRef, query 또는 조회 조건, page/cursorRef, observedAt, channelKey, evidenceTags/titleRef, coverageState를 후보 근거와 연결한다. sourceItemRef·channelKey는 정규화하고 같은 채널의 반복 응답을 매번 새 인물로 만들지 않는다.

`firstSeenAt`은 우리 서비스의 첫 발견일이다. `rookieClaim`과 `debutEvidenceRef/debutDate`를 별개로 다루며 제목의 '신입'·낮은 시청자/팔로워 수·기존 통계의 isRookie를 데뷔 확정 값으로 복사하지 않는다. 방송 시작 시각도 첫 데뷔일로 쓰지 않는다.

회차 내 중복 제거와 짧은 재확인 캐시 후 묶음 대조한다. 최소 관측 기록·다음 확인 상태만 유지하고 원시 응답 208,800개 가정을 같은 수의 DB 행으로 저장하지 않는다. 쿼리/페이지 제한·후속 보강 이월·실패를 기록해 '후보 0명'과 구분한다. 현재 코드의 100개/첫 페이지 범위와 향후 탐색 범위는 별도 설정이다.

## 3 상태 전이와 공개 기준

후보 처리 상태는 DISCOVERED → ENRICHING → READY / NEEDS_REVIEW / INSUFFICIENT / REJECTED → APPLIED로 구분한다. 인물 공개 상태는 DRAFT / PUBLIC / HOLD / WITHDRAWN으로 별도 관리한다. 후보 APPLIED가 모든 연결 정보의 공개 또는 최초 데뷔 입증을 뜻하지 않는다. 같은 후보에 새 근거·정정이 생기면 새 버전과 변경 제안으로 처리한다.

자동 반영 모드는 REPORT_ONLY / DRAFT_ONLY / AUTO_PUBLISH_SCOPED로 구분한다. 기존 보고 실행기의 기본 동작은 유지하고 새 반영기는 허용된 규칙만 실행한다. 설정에 등록되지 않은 출처·항목·변경은 기본 거부하고 초안/예외로 남긴다.

공개 상태와 정보 보유 수준도 구분한다. 실체 확인·입문 가능·지속 확인은 채택된 필드와 지원되는 갱신 경로에서 도출하며 임의 점수로 저장하지 않는다. 인물 수·입문 자료 보유율·갱신 지원율을 따로 집계한다. 이름과 채널만 있는 소개의 자동 공개를 정보 품질 확보 완료로 계산하지 않는다.

자동 공개 판정에는 출처 이용 범위, 버튜버임을 명시한 공식 근거, 공식 채널 연결, 채널 존재, 등록/대기/보류/차단 중복 대조, 최소 소개, 기존 공개 검토 통과, 고정된 후보 버전이 필요하다. 전체 조건은 [32번](./32_DISCOVERY_AND_DATA_ACQUISITION_PLAN.md)을 따른다. 자동 반영 후에도 출처·규칙·변경 전후를 추적한다.

반영 직전에 후보 버전과 대상 값 해시를 재확인하고 충돌 시 중지한다. 인물·채널·공개 스냅샷·반영 기록은 가능한 원자적 단위로 처리한다. 외부 API 호출을 DB 트랜잭션에 포함하지 않는다. 페이지 처리 도중 실패하면 체크포인트부터 재개하며 같은 후보가 두 번 공개되지 않게 한다. 부하/페이지 제한으로 일부만 본 경우 수집 완료로 표시하지 않는다.

## 4 출처·정보 선택·잠금

| 상황 | 선택 정책 |
| --- | --- |
| 같은 공식 채널의 이름·이미지 등 낮은 위험 항목 | 허용된 갱신 항목이면 최신 정상 관측으로 변경. 수동 잠금이면 제안만 생성 |
| 공식 채널·인물 연결·데뷔일·소속·공식 관계 변경 | 직접 검토 대상으로 분류. 검색 결과/다른 사이트의 값을 바로 채택하지 않음 |
| 본인 입력 | 기존 접수 신뢰 수준과 소유권 확인 상태에 따라 적용. SELF라는 입력만으로 최상위 근거로 만들지 않음 |
| 공식 공지와 기존 확정 값 충돌 | 두 근거·발생/확인 시각·변경 제안을 유지하고 검토 |
| 제3자 시트·검색 결과·팬 제보 | 후보와 보완 단서. 공식 근거가 연결되기 전 단정적 사실로 승격하지 않음 |
| 미확인·공란·조회 실패 | unknown/no_data/fetch_failed 구분. 기존 정상 값 삭제·국가 KR·소속 개인세·시간 19:00 자동 보정 금지 |
| 원문 삭제·권리 철회 | 영향 필드·미디어·캐시를 찾아 보류/제거. 필요한 최소 철회 이력과 재수집 차단 유지 |

근거 확인은 단일 점수나 임의의 신뢰 퍼센트로 표현하지 않는다. 공식성·채널 연결·항목 지원·공개 상태가 각각 확인되는지로 판단한다. 원문의 발행 시각을 모르면 publishedAt=null로 두고 observedAt으로 대체하지 않는다.

## 5 인물·일정·콘텐츠의 분리

| 항목 | 필드·규칙 |
| --- | --- |
| 행사 | eventId, personId, kind, sourceRef, scheduledAt/date/timezone, dateState, status, previousVersion |
| 행사 종류 | FIRST_DEBUT / PLATFORM_DEBUT / REDEBUT / MODEL_REVEAL / RETURN / UNKNOWN. 공지 이상의 최초 활동을 추론하지 않음 |
| 대표/소개 자료 | 기존 PortalMedia.kind·featured·credit·url 재사용. 지정 근거·지정자와 연결하고 팀 PV/개인 작품 구분 |
| 최근 작품 | 기존 ChannelMedia의 ID·URL·제목·publishedAt·상태. 최신이라는 이유로 featured=true로 바꾸지 않음 |
| 활동 메타데이터 | 원문 키·종류·발행/발생/예정일·firstObservedAt·status·인물 연결. 날짜 없는 소식과 날짜 확인 소식 구분 |

일정이 없어도 인물 소개를 공개할 수 있다. 기존 캘린더는 정확한 날짜·시간대·시각이 있는 지원 일정을 기존 방식으로 표시한다. 인물 등록 때문에 캘린더에 가짜 시간 값을 넣지 않는다. 취소·연기·복귀·재데뷔는 최초 데뷔 날짜를 덮어쓰지 않는다.

첫 수집의 과거 영상·프로필 수정·썸네일 갱신을 모두 새 활동으로 생성하지 않는다. 같은 팀 작품은 원문 항목 하나에 여러 인물을 연결한다. 첫 출시에서는 기존 미디어 구조를 최대한 재사용하며, 새 공통 관심 피드/개인별 읽음 테이블은 후속 단계다.

## 6 논리 인덱스와 조회/쓰기 계획

- 채널: platform+canonicalChannelId UNIQUE, 별칭→정규 키 매핑, personId 조회.
- 출처 항목: sourceId+sourceItemKey UNIQUE, sourceState/lastObservedAt. 근거: 대상+fieldPath+evidenceState 조회.
- 후보: workflowState+nextCheckAt, channelKey, sourceItemRef. 채택 값: personId+fieldPath UNIQUE.
- 동기화: nextCheckAt+failureState, leaseUntil. 반영: operationId UNIQUE, 대상+appliedAt.
- 활동: source+원문 키 UNIQUE, 인물 연결+공개 시각. 차단: 정규 채널/항목 키 UNIQUE.

공개 화면은 채택된 작은 프로필 스냅샷과 필요한 미디어만 읽는다. 근거 전체·후보·모든 작업 로그를 도감 API에 실어 보내지 않는다. 수집은 제한된 배치·커서·잠금을 사용하고 변경 없는 필드/근거를 매번 추가 저장하지 않는다.

관측 시각/작업 상태 갱신, 변경 필드·출처 기록, 인덱스·정정/삭제 작업도 쓰기 예산에 넣는다. 결과로 반환한 행과 실제 DB 과금 읽기/쓰기는 다르므로 개발 후 제공되는 사용량으로 계측한다. [24번](./24_ADVANCEMENT_BACKLOG_AND_COST.md)의 수치는 설계 예산이다.

## 7 보관·권리·개인정보

| 자료 | 초기 운영 계획 |
| --- | --- |
| 공개 프로필·채택 근거 | 공개 목적에 필요한 값·URL·확인 기록을 유지. 정정·권리 요청·철회 반영 |
| 원문 | 전체 본문·스크린샷·영상/이미지 원본을 기본 보관하지 않음. 허용된 최소 메타데이터·짧은 근거·지문만 보관 |
| 미해결 후보·비채택 근거 | 90일 후 재검토/정리 초안. 필요한 식별·보류 이유만 남기고 무한 증가 방지 |
| 최신 활동 메타데이터 | 기본 90일. 주요 공개 기록 장기 보관은 출처 허용 범위와 별도로 결정 |
| 상세 실행 로그 | 기본 30일, 이후 소스별 최소 집계. 에러에 토큰·원문·연락처를 복사하지 않음 |
| 철회/재수집 차단 | 재공개 방지에 필요한 최소 식별 키·사유를 유지하고 범위별 만료/정정 지원 |
| 연락처·제출자 | 외부 발견 과정에서 개인 연락처를 수집하지 않음. 기존 등록 접수의 비공개 정보는 분리 |
| 관심·채팅 | 기존 기기 관심 저장 유지. 원문 채팅·개인별 타 채널 활동·기기 지문은 수집하지 않음 |

90일·30일은 기획 초깃값이며 데이터 제공자의 저장 허가가 아니다. 제공 조건이 더 짧거나 삭제를 요구하면 우선 적용한다. 외부 이미지 주소의 접근 가능성을 재배포 허가로 간주하지 않으며 허용되지 않으면 기본 이미지·원문 링크로 처리한다.

## 8 정본 CSV·기존 데이터 연결

vtuber-list/YYYY-MM/의 3종 CSV는 조사 정본으로 유지한다. 읽어 온 행에는 파일·행 키·최초 작성일·T/F·내용 지문을 참조한다. 최초 작성일과 기존 T/F를 보존하고, 반영 완료가 확인된 경우에만 정본 관리 규칙에 맞춰 T를 기록한다. IMPORTED/VALIDATED/READY를 T로 해석하지 않는다.

기존 업로더가 미확인 시각·소속·국가를 기본값으로 채우는 경로와 새 자동 반영 경로를 혼용하지 않는다. 기존 공개 데이터·등록 대기열·정정 이력을 조회해 매핑하는 작업은 향후 D0/D1 실행 단계에서 한다. 이번에 운영 DB를 읽거나 CSV를 바꾸지 않았다.

## 9 향후 확장 시 유지할 계약

자동 수집, 본인 등록, 팬 제보는 origin만 다르고 인물 ID·채널 키·근거·보호값·반영 이력을 공유한다. 기존 등록 UI를 활용하고 별도 새 회원/소유권 관리 화면은 이번 범위에 넣지 않는다.

관심 변화 피드는 공통 활동을 읽고 기존 기기 관심·읽음 상태와 결합하는 방향으로 확장한다. 채널별 또는 이용자별 알림 행을 대량 생성하는 구조는 피한다. 복수 플랫폼·언어·공식 관계도는 확인된 연결부터 넓히며 사적 관계를 추론하지 않는다.

벡터 DB·계정 지갑·가격 정산·카드 소유권·개인별 채팅 이력 테이블은 현재 기본 구조의 필수 요소가 아니다.
