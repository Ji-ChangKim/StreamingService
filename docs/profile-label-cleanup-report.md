# 프로필 제목·소속 표시 수정 보고서

## 수정 내용

- 소개 본문 위의 `어떤 방송을 하나요?` 제목을 화면과 초기 HTML에서 제거했다. 소개 본문과 일정은 유지했다.
- 상세 소개와 팀 소개의 소속 표시를 공통 함수 `profileAgencyName`으로 처리한다. 빈 값·공백·개인세·개인·인디·무소속·Indie·Independent·None은 표시하지 않으며 입력된 실제 소속명은 유지한다.
- 일정 카드도 같은 조건을 사용하며, 소속이 없을 때 `Indie`를 대신 표시하던 동작을 제거했다.
- DB 값은 수정하지 않았다. 기존 상세 URL·canonical·광고 비활성 설정을 유지했다.

## 수정 파일

- `frontend/src/portal/CreatorProfile.tsx`
- `frontend/src/components/EventCard.tsx`
- `shared/profilePresentation.ts`
- `backend/src/services/portalEditorialBody.ts`

## 배포

- 대상: `vdebut.live`, Worker `streaming`
- 기존 운영 릴리스 소스에 위 수정만 적용해 배포했다. 현재 체크아웃에도 같은 수정을 반영했다.
- 이전 버전: `4d0d6419-05bc-4932-9892-1db53de54941`
- 배포 버전: `8277a312-8ac9-4699-b935-05ec125e25c9`
- 정적 파일 27개 갱신, 기존 158개 재사용. Worker 658.31 KiB, gzip 160.39 KiB.
- D1 바인딩·기존 도메인·예약 실행을 유지했다. 개발 Worker는 이번 작업에서 배포하지 않았다.

## 검증 결과

- 현재 체크아웃과 운영 배포용 소스의 TypeScript 검사·Vite 빌드 통과. 기존 대형 청크 경고는 남아 있다.
- 기존 관련 테스트 7개 통과.
- 두 소스의 렌더링 조건 22개 통과: 개인 활동 구분값 숨김, 실제 소속명 표시, 소개·일정 유지, 한국어·일본어·영어 초기 HTML 제목 제거.
- 운영 상세 페이지 HTTP 200, 제목 제거 및 소개 본문 유지 확인. 기본 주소와 검사 쿼리 주소에서 canonical은 기존 상세 주소를 유지한다.
- 초기 HTML에 연결된 JS·CSS 파일 6개가 모두 HTTP 200이며 로컬 배포 파일과 바이트가 일치한다.
- 실제 브라우저에서 코모리 레이의 `개인세`와 소개 제목이 사라지고 소개·데뷔 일정·채널 링크가 유지되는 것을 확인했다.

확인 화면: `backups/adsense-production-20261015/profile-labels-after.png`
