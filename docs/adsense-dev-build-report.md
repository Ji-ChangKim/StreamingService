# AdSense 개발 패치 빌드 보고서

2026년 10월 15일 **16:21 KST**, P0~P2와 최종 점검 수정 사항을 **dev.vdebut.live**에 배포했습니다. 실제 개발 주소와 브라우저 화면까지 검증했습니다. 광고는 비활성 상태이며, 운영 사이트 배포·운영 DB 수정·콘텐츠 승인·AdSense 신청은 수행하지 않았습니다.

**기술 패치는 완료했으나 AdSense 신청 준비 완료 상태는 아닙니다.** 운영 콘텐츠와 고지·계정 설정의 남은 항목은 [신청 전 최종 점검](adsense-final-audit.md), 세부 운영 정보는 [운영 확인 목록](adsense-operational-confirmations.md)에 정리했습니다.

## 어떻게 바꾸었는지

| 범위 | 기존 문제 | 이번 개발 빌드의 동작 |
| --- | --- | --- |
| P0 콘텐츠 공개 | 수집 자료가 검토 기록 없이 공개되거나 외부 소개가 덮어써질 수 있음 | 실제 자료와 일치하는 승인 스냅샷을 요구. 미검토·변경·보류 자료는ㅈㅈㅈ 공개 목록·상세·API·사이트맵에서 제외하고 관리자 원본은 유지 |
| P0 광고·추적 | 광고·태그 설정과 운영 고지의 확인이 필요 | 광고 전역 비활성을 유지. 새 빌드의 GTM 자동 실행을 보류하고 검증되지 않은 운영자·보관기간·게시자 ID를 만들지 않음 |
| P1 메인·소개 | 일정·채널 정보만으로 어떤 방송인지 판단하기 어려움 | 실제 등록 자료에 기반한 메인 안내와 행동 경로, 상세 소개·태그·언어·검토일·주의사항을 보강. 확인되지 않은 특징·성과는 추가하지 않음 |
| P1 이용 가이드 | 기능 사용법과 서비스 소개가 섞이고 초기 HTML에 설명이 부족 | 이용 가이드 5편을 별도 구성하고 초기 HTML에도 본문 제공. 저장·등록·일정 확인·정정 등의 실제 기능 설명 |
| P1 통계 | 기록 없음과 0의 차이, 수집 범위가 불명확 | 기록 범위·상태와 통계 읽는 법을 설명. 자료가 없는 채널을 신규 채널이나 수집 시작으로 단정하는 표현 제거 |
| P2 검색 정보 | 페이지별 제목·설명·대표 주소가 일치하지 않거나 전환 후 이전 정보가 남을 수 있음 | 경로·언어별 제목·설명·canonical·공유 정보·구조화 자료를 동기화. 오류·비공개 페이지는 noindex 처리 |
| P2 사이트맵·경로 | 승인 상태·언어·날짜와 사이트맵의 정합성 필요 | 승인 콘텐츠만 포함하고 언어 대체 주소·중복을 정리. 근거 없는 lastmod를 만들지 않음. 끝 슬래시 HTML은 308로 정규화 |
| P2 모바일·오류 | 빈 목록·실패 상태가 구분되지 않고 좁은 화면에서 조작이 어려울 수 있음 | 실제 빈 목록·검색 결과 없음·저장 없음·API 실패를 구분. 재시도와 복구 경로, 모바일 간격·터치 영역·입력 크기·접근성 보강 |
| 최종 점검 수정 | 개발 `/analytics`가 HTTP 200이지만 찾을 수 없음 제목을 제공하고 통계 초기 자료가 빠짐 | 포털 라우터가 통계 경로를 가로채지 않도록 수정. 개발에서도 통계 전용 초기 HTML·올바른 제목·초기 자료 제공, noindex 유지 |
| 최종 점검 테스트 | 크롤러 테스트가 외부 시트·메일 서비스 상태에 의존 | 로컬 시트 응답과 메일 실패 응답으로 대체. 플랫폼·기간 필터를 실제로 검증하고 외부 이메일 발송 차단 |

P0의 공개 차단은 텍스트 자동 검사만으로 콘텐츠를 승인하는 기능이 아닙니다. 이미지·영상·권리·문맥과 자료의 사실 여부는 운영자가 확인해야 합니다. 이번 배포에서 개발 공개 소개는 전후 모두 0개였고 원본을 삭제하지 않았습니다.

## 주요 구현 위치

- 공개 기준·콘텐츠: `shared/contentReview.ts`, `shared/portalEditorial.ts`, `frontend/src/portal/CreatorProfile.tsx`, `frontend/src/portal/PortalLearning.tsx`, `backend/src/services/portalEditorialBody.ts`
- 검색 정보: `shared/siteSeo.ts`, `shared/portalSeo.ts`, `shared/activitySeo.ts`, `frontend/src/utils/applyPageSeo.ts`
- 경로·초기 HTML·복구: `backend/src/index.ts`, `backend/src/services/portalPageService.ts`, `backend/src/services/activityPageService.ts`, `backend/src/services/publicErrorPage.ts`, `backend/src/services/sitemapEntry.ts`
- 모바일·빈 상태: `frontend/src/portal/portal.css`, `frontend/src/portal/portalApi.ts`, `frontend/src/components/analytics/activityDashboard.css`
- 회귀 검증: `backend/tests/liveRelease.test.cjs`, `backend/tests/debutCrawler.test.cjs`, `frontend/tests/portalEditorial.test.cjs`, `frontend/tests/siteSeo.test.cjs`

단계별 상세 내용은 [P0 보고서](adsense-p0-report.md), [P1 보고서](adsense-p1-report.md), [P2 보고서](adsense-p2-report.md)를 참고하세요.

## 배포 내역

| 항목 | 결과 |
| --- | --- |
| 배포 대상 | Worker `streaming-dev`, `dev.vdebut.live/*` |
| 배포 시각 | 2026-10-15 16:21:34 KST / 07:21:34 UTC |
| 새 버전 | `ddf88a2c-e973-443b-8e86-db427c61bf84` |
| 배포 ID | `25425466-45a5-44df-a8c9-7e2e7c7b0e83` |
| 배포 비율 | 새 버전 100% |
| 직전 버전 | `715acf9f-aed6-436e-997b-d3530e9851a0` |
| 도구 | Wrangler 4.151.0. 저장소 의존성 변경 없이 실행 |
| 명령 | `npx --yes --package=wrangler@4 wrangler deploy --env dev` — `backend`에서 실행 |
| 정적 자산 | 신규 30개 업로드, 기존 155개 재사용, 이전 불필요 자산 31개 제거 |
| Worker 전송량 | 655.85 KiB / gzip 160.14 KiB |
| Worker 시작 시간 | 배포 CLI 측정 8 ms |
| 개발 DB | 기존 `vdebut-db-dev` 바인딩 유지. 운영 DB와 분리 확인 |
| 개발 스케줄 | 기존 `0 15 * * SUN` 유지. 한국 시간 월요일 00:00 주간 초기화 |

필요한 포털 테이블이 이미 존재해 마이그레이션을 실행하지 않았습니다. `wrangler.toml`과 의존성을 변경하지 않았습니다. Workers Sites의 이전 정적 자산도 정리되었으므로 직전 버전 번호는 추적용이며, 코드 버전만 되돌리는 것으로 자산까지 복원된다고 가정해서는 안 됩니다.

## 검증 결과

| 검사 | 결과와 범위 |
| --- | --- |
| 전체 자동 테스트 | `node --test backend/tests/*.test.cjs frontend/tests/*.test.cjs` — 69개 통과, 실패·건너뜀 0 |
| 최종 라우팅 수정 후 회귀 | `liveRelease`, `debutCrawler`, `activityPage` — 10개 통과 |
| 타입·빌드 | 프런트 타입 검사 포함 프로덕션 빌드, 최종 백엔드 타입 검사 통과 |
| Worker 모의 배포 | 개발 환경 dry run 통과 후 실제 배포 |
| 변경 형식 | `git diff --check` 통과 |
| 실제 개발 HTTP | 2026-10-15 16:22 KST, 기대 상태·본문·메타 기준 21개 검사 모두 통과 |
| 실제 배포 JS | 주요 JS 4개 모두 HTTP 200. 다운로드한 바이트와 로컬 빌드 SHA-256 일치 |
| 개발 DB | 배포 전후 `streamerChannel_info` 380행, `portal_profiles` 6행 동일. 원격 점검은 SELECT만 수행, 모든 응답 쓰기 0행 |
| 운영 배포 여부 | 운영 홈페이지의 이전 JS 진입점이 배포 전후 동일. 운영 Worker 배포 없음 |
| 광고 상태 | 확인한 개발 HTML·브라우저에서 AdSense 실행 태그·광고 DOM 없음, GTM 실행 없음 |

HTTP 검증에는 메인·가이드(한국어/영어)·소개 목록·등록·정보·정책·문의·통계·관리자 화면과 공개 API를 포함했습니다. 비로그인 관리자 API의 401, 없는 상세·통계 경로의 404, 끝 슬래시의 308도 기대값으로 확인했습니다. 개발 `robots.txt`의 전체 차단, `sitemap.xml`의 404, 페이지 noindex는 개발 도메인 제외를 위한 정상 결과입니다.

실제 브라우저에서는 데스크톱 가이드 5편, 통계 실시간 목록과 해설 열기, 폭 390px 모바일의 빈 소개 목록을 확인했습니다. 확인 화면에서 가로 넘침이 없었고 제목·canonical·광고 비활성 상태도 확인했습니다. 실제 기기의 키보드·OS별 동작은 운영자 후속 확인 항목입니다.

![배포된 개발 이용 가이드](../.cache/adsense-final-dev-guide.jpg)

[모바일 빈 목록 검증 화면](../.cache/adsense-final-dev-mobile.jpg)

검증 원자료는 로컬 `.cache/adsense-final-before.json`, `adsense-final-after.json`, `adsense-final-statistics.json`, `adsense-dev-build-manifest.json`에 보관했습니다. `.cache` 자료는 저장소 배포물에 포함하지 않습니다.

## 남은 경고·운영 한계

- 기존 관리자 번들 약 500.25 kB에 대한 Vite 크기 경고가 남습니다. 빌드는 성공했으며 이번 공개 화면 검증의 실패는 아닙니다.
- 일부 테스트의 기존 축약 SQLite 스키마·실험 API 경고가 남습니다. 전체 테스트는 통과했습니다. 크롤러 테스트의 모의 메일 503은 외부 발송 차단을 확인하는 의도된 응답입니다.
- 개발 통계는 16:26 KST 실제 응답에서 실시간 치지직·SOOP 모두 사용 가능했지만 과거 이력은 없었습니다. 최근 24시간 정기 수집은 플랫폼별 기대 144회 중 완료 0회·누락 144회였습니다. 개발 설정이 주간 초기화만 실행하므로 정기 수집을 임의 활성화하거나 과거 데이터를 만들지 않았습니다. 운영의 실제 기간 수집은 별도 확인이 필요합니다.
- 운영 공개 응답 378개 중 새 검토 스냅샷 기준 통과 자료는 0개였습니다. 운영에 새 코드를 배포할 때 공개 소개가 대거 제외될 수 있어 운영자 검토·공개 순서 결정이 필요합니다. 활동명 이상 신호 2건, 소개 재검토 신호 1건, 본문 없음 6건부터 확인해야 합니다.
- 운영 주체·보관기간·실제 문의 수신·GA/GTM 설정·게시자 ID·소유 확인·이미지와 영상 권리는 코드 검사로 확정하지 않았습니다. 실제 문의 발송·관리자 승인·원격 자료 수정도 이번 범위에서 수행하지 않았습니다.

운영자 확인과 운영 배포 후 신청할 실제 도메인에서 다시 점검해야 합니다. 개발 배포 성공이나 자동 검사 통과가 AdSense 승인을 보장하지는 않습니다.
