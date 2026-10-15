# 전체 페이지 소속 표시 통일 보고서

검증일: 2026-10-16 (KST). 공개 화면 소속 배지는 실제 그룹·소속명이 있을 때만 표시하도록 통일했다.

## 발견한 표시 경로와 수정

| 화면·파일 | 기존 문제 | 수정 |
|---|---|---|
| 모바일 일정 `MobileAgendaTimeline.tsx` | 소속이 없으면 Indie 표시, 저장된 구분값 직접 노출 | 실제 소속명이 있을 때만 소속 요소 생성 |
| 모바일 스트리머 목록 `MobileAppLayout.tsx` | 소속이 없으면 Indie 표시 | 목록과 검색에 공통 기준으로 처리한 소속명 사용 |
| 캘린더 상세 `ScheduleInspectorPanel.tsx` | 개인세·indie 일부만 제외, Indie가 포함된 실제 이름까지 숨길 가능성 | 공통 소속명 함수로 통일 |
| 미정 일정 `UndecidedDebutSection.tsx` | 개인세·None만 제외, 다른 구분값 노출 및 대체 문구 표시 | 실제 소속명만 표시하고 빈 소속 영역·대체 문구 제거 |
| 메인 플랫폼 추천 `PlatformMiniSpotlight.tsx` | 개인세·None만 제외 | 공통 기준 적용 |
| 기존 프로필 `CreatorProfilePage.tsx` | 브라우저 제목에 구분값 노출 가능, 오래된 INDIE 유형이면 실제 소속도 숨김 | 제목과 배지가 실제 입력된 소속명을 기준으로 표시 |
| 사이드바 `SidebarLeft.tsx` | Indie (개인) 및 고정 예시 소속 목록 | 전달받은 실제 소속명만 중복 제거해 표시, 없으면 영역 생략 |
| 프로필 수정 `CreatorEditModal.tsx` | 소속 입력란 기본값 개인세 | 실제 소속명으로 초기화하고 없으면 빈 입력란 |
| 등록 창 `StudioSubmitModal.tsx` | 개인세 / 인디 (Indie) 라벨 및 개별 판별식 | 개인 활동 라벨, 공통 소속명 기준으로 편집 상태 결정 |
| 이용 가이드 `GuidePage.tsx` | 개인세 선택 안내 | 개인 활동 선택 및 실제 소속명만 공개하는 기준 안내 |
| 관리 목록 `AdminCmsPage.tsx` | 저장된 구분값이 소속 배지로 표시 | 신청 목록·스트리머 목록의 배지에 공통 기준 적용 |
| 업로드 미리보기 `SubmissionUploadModal.tsx` | 구분값을 소속명으로 표시 | 실제 소속명만 표시 |
| 관리자 수정 `SubmissionEditModal.tsx` | 개별 판별식 및 개인세 라벨 | 공통 기준과 개인 활동 라벨 적용 |
| 공통 함수 `shared/profilePresentation.ts` | 단일 개인 활동 표기만 처리 | 복합·일본어·전각 표기까지 처리하며 실제 이름은 보존 |

직전 작업에서 수정한 상세 소개·팀 소개·일정 카드도 같은 공통 함수를 사용하므로 이번 기준을 함께 적용받는다. 소개 본문을 검색·치환하거나 DB의 소속값을 바꾸지는 않았다.

## 표시 기준

- 빈 값·공백·개인세·개인·인디·무소속·Indie·Independent·None·N/A·個人勢·無所属 및 이 구분값들의 복합 표기는 소속으로 표시하지 않는다.
- `개인세 / 인디 (Indie)`, `Indie (개인)`, 전각 `Ｎｏｎｅ`도 숨긴다.
- 실제 이름인 `Indie Studio`, `Independent Artists`, `NoneSuch`처럼 구분 단어가 이름의 일부인 경우에는 유지한다.
- 저장용 구분값, 기존 API 원본, 관리자 신청 원문, 다운로드 양식·파일 파서의 원자료는 유지한다. 관리자 목록의 소속 배지와 업로드 미리보기는 표시 기준을 적용한다.

## 검증

- 화면 소스 TSX 100개 전수 검색: JSX에 직접 노출하는 개인세·Indie 문구 없음. 남은 개인세 문자열은 저장용 값 3곳이며 주석은 제외했다.
- 현재 체크아웃: TypeScript·Vite 빌드 및 관련 테스트 10개 통과.
- 운영 배포용 소스: TypeScript·Vite 빌드 및 새 회귀 테스트 3개 통과.
- 새 회귀 테스트는 구분값 15종·실제 이름 6종과 공개 카드 5종의 105개 조합, 사이드바의 중복 제거·빈 영역 생략을 검증한다.
- 직전 상세 소개·팀 소개·초기 HTML 렌더링 조건 22개 재검증 통과.
- 운영 공개 API 프로필 377건을 실제 운영 상세 컴포넌트로 렌더링해 배지 전수 검증: 개인세 287건, Indie 3건, 빈 소속 26건은 배지 없음. 소속명이 있는 61건은 배지 유지.
- 주요 URL 8개 응답 확인: 메인·목록·가이드·등록·통계·두 상세는 200, 공개 보류된 eguchi-maho는 404 유지.
- 초기 메인 HTML에 연결된 JS·CSS 6개 모두 200이며 로컬 배포 파일과 바이트 일치.
- 운영 브라우저: 데스크톱·390px 모바일 메인과 목록의 카드 24개에서 개인세·Indie 구분값 없음. 코모리 레이 상세는 소속 배지가 없고, 모바일 시즈키 토아 상세는 스텔라이브 배지를 유지한다.
- 기존 대형 청크 경고는 남아 있으며 빌드를 막지 않는다.

## 운영 배포

- 대상: `vdebut.live`, Worker `streaming`
- 이전 버전: `8277a312-8ac9-4699-b935-05ec125e25c9`
- 배포 버전: `15ca60ba-bedd-4054-94ea-83dcfc94ccc0`
- 기존 운영 소스에 이번 소속 표시 수정만 적용했다. 현재 체크아웃에도 같은 수정이 반영되어 있다.
- 정적 파일 25개 갱신, 기존 160개 재사용. Worker 658.31 KiB, gzip 160.39 KiB.
- DB 수정 없음. URL·공개 보류·광고 비활성·기존 도메인·예약 실행 유지. 개발 Worker는 이번 작업에서 배포하지 않았다.

## 확인 자료

- 회귀 테스트: `frontend/tests/affiliationDisplay.test.cjs`
- 전수 검증 원자료: `backups/adsense-production-20261015/affiliation-live-audit.json`, `backups/adsense-production-20261015/affiliation-source-audit.json`
- 데스크톱 화면: `backups/adsense-production-20261015/affiliation-home-desktop.png`
- 모바일 메인: `backups/adsense-production-20261015/affiliation-home-mobile.png`
- 실제 소속 유지: `backups/adsense-production-20261015/affiliation-named-mobile.png`
