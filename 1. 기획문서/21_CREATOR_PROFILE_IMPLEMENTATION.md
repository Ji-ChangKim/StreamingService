# 데뷔 버튜버 상세페이지 개편 적용 보고

- **문서명**: 데뷔 버튜버 상세페이지 개편 적용 보고
- **버전**: v1.0 운영 적용
- **최종 수정일**: 2026-10-15 KST
- **작성자/담당**: Codex 구현·검증 · 프로젝트 담당자 검토

[콘텐츠 기획안](./20_CREATOR_PROFILE_CONTENT_STRATEGY.md)에 따라 상세페이지 정보 위계를 개편하고, 시즈키 토아와 코가네 랑에 개인 커버곡과 ABYSS 공통 PV를 함께 적용했다. 영상 목록은 등록·소유자 수정·관리자 정정·검토 화면에서 사용할 수 있다.

## 운영 적용 결과

| 대상 | 개인 대표 콘텐츠 | 팀 공통 콘텐츠 | 상세페이지 |
| --- | --- | --- | --- |
| 시즈키 토아 | 제육감 (第六感 / Reol) | STELLIVE 4th Generation ABYSS PV | [상세페이지](https://vdebut.live/creator/shizuki-toa) |
| 코가네 랑 | 호랑풍류가 (나와 호랑이님 OST) | STELLIVE 4th Generation ABYSS PV | [상세페이지](https://vdebut.live/creator/cogane-rang) |

운영 Worker 버전은 `2de57744-6bb3-4901-aa9d-93bb5238159a`이다. 배포 전 버전 `94ca80e1-3b8e-42bf-9d48-1197ad5078b4`와 대상 두 프로필 원본을 작업 기록에 보존했다. 기존 작업 중이던 캘린더·카드·통계·등록 레이아웃·일반 안내 문구 변경은 배포 사본에 포함하지 않았다. 상세페이지의 기존 검토일 누락 방어 처리는 새 화면에서도 유지했다.

## 화면과 등록 기능

- 첫 화면에서 개인 이미지·활동명·소속·플랫폼을 확인한 뒤 데뷔 일정과 캘린더 저장·채널 방문을 안내한다. 긴 소개는 개인 콘텐츠 뒤로 옮겼다.
- 대표 영상, 짧은 장면, 첫 방송, 주요 소식, 팀, 채널 중 자료가 있는 영역으로 이동하는 메뉴를 제공한다.
- 개인 대표 콘텐츠, 짧은 장면, 첫 방송 다시보기, 일반 다시보기, 팀 공통 PV를 목적별로 나눠 보여준다. 자료 없는 미디어 영역과 소식·팬 가이드는 숨긴다.
- PC에서는 공통 PV와 멤버를 나란히 묶고 모바일에서는 차례로 배치한다.
- 대표 영상은 크게, 보조 영상은 카드로 배치한다. 개인 소개는 처음 3개, 나머지 미디어 영역은 처음 6개를 보여주고 추가 자료는 더 보기로 펼친다.
- 영상 선택 전에는 iframe을 만들지 않는다. 상세페이지 전체가 하나의 재생 선택을 공유하므로 다른 영상을 선택하면 이전 플레이어가 제거된다. 원본 영상 링크는 항상 제공한다.
- 영상은 최대 12개까지 등록할 수 있다. 제공 플랫폼과 콘텐츠 종류, 제목·원문·선택 썸네일·제작/출처, 대표 선택·순서 변경·삭제·원문 보기 전환을 편집한다.
- 정기 방송 안내, 팬 가이드, 최대 3개의 주요 소식 제목·원문을 선택 입력할 수 있다. 실제 확인되지 않은 팬 정보나 첫 방송 자료는 두 프로필에 추가하지 않았다.
- 데뷔 일정의 시간 경과로 LIVE나 방송 종료를 추측하지 않는다. 등록된 첫 방송 영상이 있으면 해당 원문으로 안내한다.
- 초기 HTML에도 검토된 영상 제목·원문, 소식·팬 가이드를 포함한다. 새 화면 문구는 한국어·일본어·영어 번역을 제공하며 활동명과 영상 제목은 원문을 유지한다.

## 플랫폼별 영상 처리

| 플랫폼·자료 | 등록 | 상세페이지 처리 |
| --- | --- | --- |
| YouTube 영상·Shorts·라이브/다시보기 | 지원 | 선택 시 YouTube 공식 플레이어, 썸네일·원본 링크 |
| 치지직 클립 | 지원 | 선택 시 치지직 클립 공식 플레이어, 원본 링크 |
| 치지직 다시보기 | 지원 | 원문 보기 카드·원본 링크 |
| SOOP VOD·클립·Catch·다시보기 | 지원 | 선택 시 SOOP VOD 플레이어, 원본 링크 |

SOOP의 `.com`, `.co.kr`와 기존 `vod.afreecatv.com` VOD 주소는 현재 SOOP 주소로 정규화한다. 플랫폼별 공개 영상 경로만 허용하고 채널 주소, 위장 도메인, 사용자 인증 정보가 포함된 URL, 비표준 포트, 임의 iframe/HTML 주소는 거절한다. 동일 영상의 공유 파라미터 차이와 SOOP 주소 별칭은 같은 영상으로 검증한다.

삽입이 제한되는 자료는 편집자가 원문 보기로 전환할 수 있다. 치지직 다시보기는 외부 삽입을 임의로 보장하지 않고 원문에서 시청하도록 한다. 플랫폼의 비공개·삭제·연령·지역 제한은 해당 플랫폼에서 결정되며, 원본 보기 경로를 함께 유지한다. 현재 기능은 URL 등록·검수 기반이며 플랫폼 전체 목록 자동 수집이나 만료 상태 자동 점검을 추가한 것은 아니다.

## 저장과 검토

| 파일 | 변경 내용 |
| --- | --- |
| [shared/portal.ts](../shared/portal.ts) | 영상 목록과 선택 소식·정기 방송·팬 가이드 자료형 |
| [shared/profileMedia.ts](../shared/profileMedia.ts) | 제공자별 주소 정규화·삽입 주소·중복/대표 검증·기존 영상 호환 |
| [shared/profilePresentation.ts](../shared/profilePresentation.ts) | 기존 저장 경로에 영상 목록·선택 자료 검증 연결, 여러 플랫폼의 첫 방송 주소 허용 |
| [shared/contentReview.ts](../shared/contentReview.ts) | 새 영상 제목·출처·소식·팬 안내에 기존 공개 검토 기준 적용 |
| [shared/profileContentTranslations.ts](../shared/profileContentTranslations.ts), [shared/portalTranslations.ts](../shared/portalTranslations.ts) | 새 화면·입력 문구 번역 연결 |
| [CreatorProfile.tsx](../frontend/src/portal/CreatorProfile.tsx) | 정보 순서·자료별 갤러리·선택 소개·팀 PV·원문 근거 배치 |
| [ProfileMediaGallery.tsx](../frontend/src/portal/ProfileMediaGallery.tsx), [profileMedia.css](../frontend/src/portal/profileMedia.css) | 대표/보조 영상·단일 재생·원문 보기와 반응형 레이아웃 |
| [ProfileMediaFields.tsx](../frontend/src/portal/ProfileMediaFields.tsx), [ProfilePresentationFields.tsx](../frontend/src/portal/ProfilePresentationFields.tsx) | 공통 영상 편집·소식·팬 안내 입력 |
| [PortalAdmin.tsx](../frontend/src/portal/PortalAdmin.tsx), [profileRequestSummary.ts](../frontend/src/portal/profileRequestSummary.ts) | 접수 검토에서 영상 플랫폼·종류·제목·원문·출처 표시 |
| [portalService.ts](../backend/src/services/portalService.ts) | 기존 클라이언트 수정 시 영상 목록 보존, 제한된 요청 크기 64 KiB |
| [portalEditorialBody.ts](../backend/src/services/portalEditorialBody.ts) | 초기 HTML의 영상·선택 자료 원문 연결 |
| [0044 데이터 패치](../backend/migrations/0044_add_stellive_profile_media.sql) | 두 프로필에 커버곡과 공통 PV 목록 추가 |
| [profileMedia.test.cjs](../frontend/tests/profileMedia.test.cjs), [portal.test.cjs](../backend/tests/portal.test.cjs) | 플랫폼별 주소·노출·검토와 실제 저장 경로 검증 |

기존 `videoUrl`·`videoTitle`·`videoKind`·`debutVideoUrl`은 삭제하지 않았다. 새 `media`가 없는 프로필은 기존 값을 읽는다. 새 목록을 명시적으로 비우면 이전 영상이 다시 나타나지 않는다. 새 필드도 검토 스냅샷에 포함되며, 검토 이후 내용이 달라진 프로필의 공개 기준을 우회하지 않는다.

## 검증 결과

- 영상 주소·대표 선택·중복·공개 검토·기존 자료 호환·React 실제 렌더링·일정 상태·검토일 및 접수/승인/운영자/소유자 저장 테스트 17개 통과.
- 기존 콘텐츠 정정 및 초기 HTML 관련 회귀 테스트 6개 통과.
- 프런트엔드 TypeScript·운영 빌드와 백엔드 TypeScript 검사 통과. Worker dry run 통과.
- 토아·랑 실제 원본으로 메모리 SQLite 패치를 실행해 `media` 외 모든 공개 필드, 대상 외 행, 재실행 무변경 확인.
- 운영 패치 1개 쿼리·2행 갱신. 전후 비교에서 `media` 외 모든 공개 값과 전체 행 수 유지. 프로필 저장 6행·채널 정보 378행.
- 공개 API에서 두 프로필 각각 COVER·GROUP_PV 목록 확인. 두 상세페이지 HTTP 200, 초기 HTML 제목·커버곡/PV 원문 링크 확인.
- 브라우저에서 PC·모바일의 대표 콘텐츠·팀 PV 배치 확인. 커버곡에서 PV로 전환 후 iframe 1개만 남는 것 확인. 모바일 가로 넘침 없음. 등록 화면에서 세 제공 플랫폼과 영상 종류·추가/순서/원문 보기 입력 확인.
- 코드 지식 그래프를 AST 방식으로 갱신했다. JSON 자료 등 일부 파일에서 노드가 생성되지 않는 비치명적 경고가 있었으며 코드 추출·그래프 저장은 완료했다.

원본 두 프로필, 배포 파일 목록, 배포 전 버전, 운영 전후 결과와 화면 캡처는 `_workspace/profile-redesign-2026-10-15/`에 보존했다. 검사 결과의 빌드 경고는 기존 대형 CMS 청크와 Wrangler 업데이트 안내이며 빌드·배포는 성공했다.
