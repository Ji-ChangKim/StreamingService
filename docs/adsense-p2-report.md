# AdSense P2 반영 보고서

2026년 10월 15일 기준으로 검색 제목·설명과 canonical, 사이트맵·robots.txt, 모바일 사용성과 오류·빈 화면을 로컬 코드에 반영했습니다. 사용자가 확정한 P2 범위이며, 기존 P1 변경을 보존했습니다. 광고는 계속 비활성 상태입니다. 운영 배포, 원격 DB 수정, AdSense 신청과 실제 콘텐츠 승인은 수행하지 않았습니다.

## 검색 제목과 설명

포털의 목록·등록·문의·정책·관심 목록·접수 조회에 목적별 검색 설명을 제공합니다. 이름과 소개가 없는 페이지에 일반 소개 문구를 붙이거나, 통계 대상 전체를 버튜버로 단정하지 않습니다.

| 페이지 | 적용 내용 |
| --- | --- |
| 버튜버 목록 | “주요 콘텐츠와 방송 언어, 데뷔 일정을 살펴보세요. 관심 있는 버튜버는 하트로 저장할 수 있어요.” |
| 데뷔 등록 | 일정 미정 신청과 운영자 검토 후 공개를 설명 |
| 소개 등록 | 데뷔 일정 없이도 소개를 신청할 수 있음을 설명 |
| 문의·정책 | 접수할 내용과 각 정책 페이지의 범위를 설명 |
| 없는 소개 | “버튜버 소개를 찾을 수 없어요”와 다른 소개 탐색 안내, noindex 적용 |
| 방송 통계 | 제목을 “치지직·SOOP 방송 활동 통계”로 정리하고 실제 기록의 콘텐츠별 시간·활동 조회를 설명 |

새 포털 문구는 한국어·일본어·영어를 제공합니다. 사용자 활동명·소개·태그·언어 값은 새로 만들거나 자동 번역하지 않습니다.

서버 초기 HTML과 브라우저 이동이 같은 검색·공유 기준을 사용합니다. canonical, Open Graph, Twitter 카드와 WebPage 구조화 정보를 함께 갱신하며, 이전 소개의 공유 이미지·제목·구조화 정보나 중복 태그가 남지 않도록 정리했습니다. 초기 셸에 없는 태그도 생성합니다. 운영 주체·저자·발행일·사업자 정보 등 확인되지 않은 구조화 정보는 추가하지 않았습니다.

## canonical과 색인 기준

- 포털 한국어 대표 주소는 `?lang=ko` 없이, 일본어·영어는 각각 `?lang=ja`, `?lang=en`으로 통일합니다. 추적 값·접수 키·해시 위치는 canonical에 넣지 않습니다.
- 말미 슬래시가 붙은 HTML 주소는 308로 정리하며, 이동 시 언어·조회 조건은 유지합니다. API·자산 경로는 이 리다이렉트에서 제외합니다.
- 없는 소개·알 수 없는 페이지·개인 목록·접수 조회·관리 화면·조회 실패에는 noindex를 적용합니다. 비공개·없는 화면에는 언어별 대체 링크도 제공하지 않습니다.
- 통계는 한국어 대표 주소를 사용합니다. 전체 통계 화면이 세 언어로 완전히 번역된 것으로 표시하지 않으며, 포털에서 넘어온 hreflang을 제거합니다. 언어 선택·복귀·추적 값만 있는 주소는 대표 주소로 통합하고, 검색·기간·카테고리·시간대 필터 화면은 noindex로 둡니다.
- 잘못된 통계 주소가 전체 통계로 열리지 않도록 서버·브라우저에서 확인합니다. 개발 사이트의 잘못된 통계 주소도 404로 처리합니다.

canonical·사이트맵·내부 검색 정보가 일치하도록 정리했습니다. Google의 canonical 선택과 실제 색인 결과는 배포 후 확인해야 합니다. [Google canonical 안내](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

## 사이트맵과 robots

사이트맵은 공개 승인 조건을 통과한 소개만 포함합니다. 포털의 세 언어 대표 주소와 상호 대체 링크, x-default를 연결하고 중복 주소를 제거했습니다. 초기 정적 사이트맵도 같은 포털 대표 주소를 사용합니다. 실제 소개·통계 목록은 Worker의 동적 사이트맵에서 생성됩니다.

정적 페이지의 고정 수정일과 레거시 사이트맵의 요청일을 수정일로 넣던 처리를 제거했습니다. 통계는 실제 마지막 기록 시각을 사용하며, 그 밖의 페이지는 신뢰할 수정 시각이 없으면 lastmod를 생략합니다. [Google 사이트맵 안내](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

운영 robots.txt는 공개 페이지·정적 자산 접근을 허용하고 관리·개인 목록·접수 조회·API 경로를 제한합니다. 개발 Worker는 전체 수집 차단을 유지합니다. 정적 robots.txt의 운영 경로 정책도 맞췄습니다. robots는 인증이나 콘텐츠 검토를 대신하지 않으며, 실제 Google 크롤러 접근은 운영 설정과 함께 확인해야 합니다. [Google robots 메타 안내](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

## 모바일과 상태 화면

| 상태·화면 | 수정 내용 |
| --- | --- |
| 정상 빈 목록 | “공개된 버튜버 소개가 아직 없어요”와 이용 가이드 연결 |
| 검색 결과 없음 | 조건 변경 안내와 초기화 동작. 초기화 시 표시 개수도 복원 |
| 빈 관심 목록 | 브라우저 저장 방식과 공개 중인 소개만 표시됨을 설명하고 탐색 연결 |
| 소개 조회 실패 | alert 안내와 다시 시도. 기술적인 오류 원문을 이용자 안내로 노출하지 않음 |
| 손상된 API 응답 | 정상 빈 목록으로 취급하지 않고 오류로 처리 |
| 오류 후 다른 페이지 이동 | 경로가 바뀌면 공개 목록을 다시 읽어 이전 실패 상태가 남지 않도록 수정 |
| 초기 소개·통계 조회 실패 | 503 상태와 noindex를 유지하며 모바일 대응 HTML에 재시도·캘린더·문의 연결 제공 |
| 없는 소개·잘못된 페이지 | 페이지 제목과 h1, 탐색 경로 제공 |
| 모바일 배치 | 좁은 헤더·긴 문구·탐색 조건 줄바꿈, 입력 글자 16px, 목록 선택 상자·주요 버튼의 터치 영역 보강 |
| 고정 메뉴·상세 창 | 하단 안전 영역 여백, 작은 화면에서 스크롤 가능한 상세 창, 움직임 줄이기 설정 반영 |

실제 운영 정보나 빈 목록의 원인을 추측한 문장은 추가하지 않았습니다. 광고 활성화·게시자 ID·광고 슬롯·ads.txt 값도 만들지 않았습니다.

## 수정 파일

- `shared/siteSeo.ts`: 대표 주소·언어 대체 링크·robots·구조화 정보의 공통 기준.
- `shared/portalSeo.ts`: 페이지별 설명, 없는 소개·조회 실패의 색인 기준.
- `shared/activitySeo.ts`: 통계 제목·설명·대표 주소, 유효한 통계 경로와 색인 기준.
- `shared/portalTranslations.ts`: 새 검색 설명과 상태 안내 번역.
- `frontend/src/utils/applyPageSeo.ts`: 화면 이동 시 검색·공유·구조화 태그 생성과 갱신.
- `frontend/src/portal/PortalApp.tsx`: 공통 메타 갱신, 경로별 목록 조회, 오류·없는 페이지 안내.
- `frontend/src/portal/portalApi.ts`: 손상 응답 구분과 경로 변경 시 재조회.
- `frontend/src/portal/CreatorPages.tsx`: 빈 목록·검색 결과 없음·빈 관심 목록·조회 실패 구분.
- `frontend/src/portal/PortalUi.tsx`: 오류 alert, 페이지 제목과 행동 영역.
- `frontend/src/portal/PortalStage.tsx`, `CalendarPage.tsx`: 일정 조회 실패의 이용자 안내.
- `frontend/src/portal/portal.css`: 모바일 배치·입력·터치·안전 영역·상세 창·움직임 감소.
- `frontend/src/components/analytics/ActivityDashboard.tsx`: 통계의 공통 메타 갱신, 조회 중·실패의 색인 처리.
- `frontend/public/sitemap.xml`, `robots.txt`: 정적 대표 주소와 수집 경로 정책.
- `backend/src/services/sitemapEntry.ts`: XML 이스케이프와 확인 가능한 수정일 처리.
- `backend/src/services/portalPageService.ts`, `activityPageService.ts`: 초기 HTML의 중복 태그 제거·공유 정보·사이트맵.
- `backend/src/services/publicErrorPage.ts`: 초기 404·503의 복구 화면.
- `backend/src/index.ts`: 말미 슬래시, robots, 언어별 사이트맵과 오류 응답 연결.
- `frontend/tests/siteSeo.test.cjs`, `backend/tests/liveRelease.test.cjs`: 대표 주소·색인·XML·응답 손상·오류 상태 회귀 검증.
- `docs/adsense-operational-confirmations.md`: 운영 확인 항목 추가.

## 검증 결과

| 검증 | 결과 |
| --- | --- |
| 전체 자동 테스트 | 69개 통과, 실패·건너뛰기 0 |
| 마지막 변경 후 검색·번역·실제 Worker 회귀 검증 | 14개 통과 |
| 프런트엔드·백엔드 TypeScript | 통과. 최종 프런트엔드 빌드에 타입 검사 포함 |
| 프로덕션 빌드 | 통과. 기존 관리자 번들의 500KB 초과 경고 유지 |
| `git diff --check` | 통과 |
| 직접 URL·서버 상태 | 말미 슬래시 308, 없는 소개·잘못된 통계 주소 404, 초기 조회 실패 503, noindex·캐시 정책 확인 |
| 사이트맵·robots | 언어별 canonical·공개 승인 기준·중복 제거·XML·수정일 생략·개발 차단 확인. Mediapartners-Google 요청 헤더를 사용한 로컬 요청 포함 |
| 브라우저 메타 | 상세→통계→가이드 이동 후 canonical·공유 제목·이미지·구조화 정보 갱신. canonical·구조화 태그 각 1개 확인 |
| 브라우저 상태 | 실패→다시 시도 복구, 검색 초기화, 정상 빈 목록, 손상 응답 오류, 빈 관심 목록, 잘못된 통계 주소 확인 |
| 모바일 320px·390px | 확인한 목록·가이드·오류·달력·상세 창의 문서 가로 넘침 없음. 모바일 메뉴, 빈 목록의 가이드 연결, 오류 후 페이지 이동 복구 확인 |
| 언어 | 새 포털 문구의 일본어·영어 누락 검사 통과. 일본어 빈 관심 목록을 320px에서 확인 |
| 광고 | 전역 비활성 유지. 브라우저에서 확인한 메인·빈 화면의 광고 스크립트·광고 요소 0개 |

자동 검증은 로컬 Worker와 메모리 SQLite를 사용했습니다. 브라우저의 “P1 검증용 버튜버”, 빈 목록·오류·손상 응답은 로컬 검증 자료이며 제품 데이터나 운영 DB에 넣지 않았습니다. 최종 화면은 `.cache/adsense-p2-empty-desktop.jpg`, `.cache/adsense-p2-error-390.jpg`, `.cache/adsense-p2-empty-320.jpg`, `.cache/adsense-p2-missing-320.jpg`에 저장했습니다.

기존 축약 테스트 DB의 컬럼 누락 경고와 Node SQLite 실험 기능 경고가 출력됐습니다. 기존 크롤러 테스트의 외부 요청은 제한된 네트워크에서 실패 경고를 냈으므로 실제 외부 수집·메일 연동 검증으로 간주하지 않습니다. 로컬 브라우저 브리지에는 Cloudflare Cache API가 없어 실시간 순위 조회 역시 운영 검증 범위에 포함하지 않았습니다.

## 운영자 확인 사항

배포된 Worker의 활성 플래그와 도메인 연결, Search Console의 대표 주소·사이트맵 처리, Google 크롤러의 실제 접근 로그·WAF 설정, 개발 도메인 차단과 실제 기기의 터치·키보드·안전 영역을 확인해야 합니다. [별도 운영 확인 목록](adsense-operational-confirmations.md)의 P2 항목에 정리했습니다. 실제 크롤러 접근, 검색 색인과 AdSense 승인 결과를 확인한 것으로 보고하지 않습니다.
