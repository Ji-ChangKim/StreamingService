# AdSense P0 코드 반영 보고서

2026년 10월 15일 기준 P0 코드 대응을 로컬 작업공간에 반영했습니다. 콘텐츠의 공개를 운영자 검토 기록과 연결하고 등록·신고·정책 화면 및 광고 기본 설정을 정리했습니다. 운영 배포와 원격 DB 수정은 하지 않았습니다. 운영 정보와 실제 콘텐츠 재검토는 [별도 확인 목록](adsense-operational-confirmations.md)에 남겼습니다.

## 공개 콘텐츠 관리

- `shared/contentReview.ts`, `shared/portal.ts`: 콘텐츠 검토 상태와 검토 당시 공개 내용의 스냅샷을 추가했습니다. 소유권 확인은 콘텐츠 검토와 구분합니다. 내용·일정·이미지 주소 등이 바뀌면 기존 검토 기록으로 공개되지 않습니다.
- `backend/src/services/portalProfileRepository.ts`: 관리자 원문 조회를 유지하고 공개 전용 조회를 분리했습니다. 기존 자료를 삭제하거나 이름·소속을 추측해 변경하지 않았습니다.
- `backend/src/services/portalService.ts`: 공개 목록과 배너 API에 검토 조건을 적용했습니다. 승인에는 운영자의 명시적 콘텐츠 확인이 필요합니다. 소유자 수정은 재검토 대상이며, 공개·보류 변경은 기존 버전 비교와 변경 이력을 사용합니다. 공개 목록과 배너는 no-store로 응답합니다.
- `backend/src/index.ts`, `backend/src/services/unifiedEventService.ts`, `backend/src/services/portalPageService.ts`: 구형 소개 API, 데뷔 목록, 직접 소개 URL, 검색·공유 메타데이터와 사이트맵에도 같은 공개 기준을 적용했습니다. 미검토 소개의 직접 URL은 404로 처리합니다.
- `frontend/src/portal/PortalAdmin.tsx`, `PortalProfileManager.tsx`, `PortalApp.tsx`: 콘텐츠 확인란, 공개·보류 선택, 검토 대기 우선 목록, 소속·프로필 이미지 정정을 추가했습니다. 관리 경로는 `/admin?view=portal`입니다. 수정 사유와 버전을 함께 저장합니다.
- `frontend/src/portal/portalApi.ts`: 공개 목록 재진입 시 최신 상태를 확인하고 실패하면 오래된 목록을 비웁니다.

## 외부 자료와 광고

- `frontend/src/portal/CreatorProfile.tsx`: 외부 SOOP 배너·소개를 실시간으로 가져와 공개 소개를 덮는 경로를 제거했습니다. 검토된 저장 자료만 표시합니다.
- `backend/src/services/activityPageService.ts`, `backend/src/index.ts`, `frontend/src/components/analytics/ActivityDashboard.tsx`, `ActivityLiveRankings.tsx`: 통계 API, 초기 HTML 및 화면의 의심 방송 제목을 `방송 제목 확인 중`으로 표시합니다. 원본 저장 기록과 집계 숫자는 변경하지 않습니다.
- `shared/publisherPolicy.ts`, `frontend/src/components/calendar/AdBannerSlot.tsx`: 광고는 전역 비활성 상태입니다. 기존 예시 광고와 확인되지 않은 광고 문의 주소도 제거했습니다. 게시자 ID나 광고 코드를 생성하지 않았습니다.
- `frontend/index.html`, `frontend/portal.html`: 설정을 확인하지 못한 GTM 컨테이너와 noscript iframe 자동 실행을 보류했습니다. 직접 설치된 Google Analytics 태그는 유지했습니다. GTM을 통한 기존 태그 실행도 중지되므로 운영 설정 확인이 필요합니다.

## 등록과 신고 화면

- `frontend/src/portal/PortalRegistrationForm.tsx`: 운영자용 데뷔 그룹 입력란을 공개 신청서에서 제외했습니다. 실제 활동명과 소개 작성 안내, 콘텐츠 공개 기준과 팬 제보의 공식 출처 안내를 추가했습니다. 서버도 공개 신청의 그룹 식별자를 승인 정보로 사용하지 않습니다.
- `frontend/src/portal/InfoPages.tsx`, `CreatorProfile.tsx`: 부적절한 콘텐츠·권리 침해·사칭 신고 유형을 추가했습니다. 소개의 신고 링크에서 문의 화면의 관련 페이지 주소가 자동 입력됩니다.
- `frontend/src/components/pages/PrivacyPage.tsx`, `TermsPage.tsx`: 실제 코드로 확인되는 수집 항목·브라우저 저장·해시 사용·Google Analytics 안내와 Google 데이터 안내 링크를 제공했습니다. 비영리 표기와 확인되지 않은 보관기간은 제거하고 광고 도입 가능성·공개 기준·정정·일정 변경 안내를 반영했습니다.
- `frontend/src/portal/PortalApp.tsx`: 새 정책 화면과 중복되는 보충 블록을 제거했습니다.
- `shared/portalTranslations.ts`: 새 등록·신고·검토·정책 문구의 일본어·영어 번역을 추가했습니다.

## 검증 결과

| 검증 | 결과 |
| --- | --- |
| `node --test backend/tests/*.test.cjs frontend/tests/*.test.cjs` | 58개 통과, 실패·건너뛰기 없음 |
| 프런트엔드 TypeScript 검사 | 통과 |
| 백엔드 TypeScript 검사 | 통과 |
| `npm run build --prefix frontend` | 통과. 일반 샌드박스의 realpath EPERM은 권한 확장 실행으로 해결 |
| `git diff --check` | 통과 |
| 로컬 브라우저 등록 화면 | 공개 폼의 그룹 식별자 입력란 0개, 공개 기준 안내 표시 확인 |
| 로컬 브라우저 신고 화면 | 신고 유형 3개 추가, 관련 페이지 자동 입력과 선택 동작 확인 |
| 로컬 브라우저 정책 화면 | 일본어 개인정보처리방침과 영문 약관 표시 확인. 확인한 화면의 콘솔 오류 없음 |

`backend/tests/portal.test.cjs`는 새 승인·보류·재검토·배너 조건에 맞춰 갱신했습니다. `backend/tests/liveRelease.test.cjs`는 실제 Worker 경로와 기존 공개 데이터 사본으로 원문 보존 및 미검토 공개 차단을 확인합니다. `frontend/tests/contentReview.test.cjs`는 검토 후 수정, 소유권과 승인 분리, 위험 표현, 메타데이터·사이트맵 제외, 원본을 바꾸지 않는 제목 정리와 광고 비활성을 검증합니다.

테스트는 메모리 SQLite와 로컬 Worker를 사용했습니다. 로컬 브라우저도 개발 셸과 메모리 DB를 사용했으며 운영 계정·원격 DB를 변경하지 않았습니다. 실제 AdSense 크롤러 접근과 운영 도메인의 배포 상태는 검증한 범위에 포함되지 않습니다.

빌드에는 기존 관리자 번들의 500 kB 초과 경고가 남아 있습니다. 전체 테스트에서는 기존 통계 모의 DB의 누락 컬럼 경고와 SQLite 실험 기능 경고가 출력됐지만 모든 테스트는 통과했습니다.

보조 코드 관계 그래프는 일반 갱신과 클러스터 생략 갱신을 시도했으나 AST 추출 후 완료 응답이 없어 중단했습니다. 기존 `graphify-out/graph.json`은 갱신 완료로 간주하지 않습니다. 이 제한은 위 코드·테스트·빌드 검증과 별개입니다.

작업 중 별도로 변경된 `frontend/src/portal/profilePresentation.css`는 이 작업에서 수정하지 않았고 그대로 보존했습니다.

## 배포 영향

새 검토 기록이 없는 기존 자료는 배포 즉시 공개 대상에서 제외됩니다. 운영자가 실제 검토 후 공개해야 합니다. 이름·소속·이미지 사용 권한의 사실 확인이나 전체 콘텐츠 검토를 완료한 것으로 간주하지 않습니다. 개인정보 운영 정보, 동의 설정, 게시자 설정과 P1 콘텐츠 보강이 남아 있으므로 AdSense 신청 준비 완료 상태는 아닙니다.
