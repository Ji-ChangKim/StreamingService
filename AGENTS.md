# 유지해야 하는 화면 범위

- 메인 페이지(`/`)의 상단 하이라이트와 캘린더는 기존 구성·디자인·동작을 유지한다. 사용자가 해당 영역의 변경을 명시적으로 요청한 경우에만 수정 범위에 포함한다.
- 버튜버 상세 페이지나 목록 시안을 반영하면서 메인 화면까지 함께 개편하지 않는다.
- `frontend/src/portal/CalendarPage.tsx`의 기존 `PortalStage` 연결과 달력 기능을 보존한다. 시안용 캘린더로 교체하지 않는다.
- 하이라이트를 구성하는 `frontend/src/portal/PortalStage.tsx`와 `frontend/src/components/preview/PlatformMiniSpotlight.tsx`는 상세 페이지 개편 대상이 아니다.
- 공통 Header·Footer도 기존 구성과 스타일을 유지한다. 상세·목록 스타일은 해당 본문에만 적용한다.
- 상세 페이지에서 메인으로 돌아와도 기존 하이라이트와 캘린더의 스타일이 달라지지 않는지 확인한다.
- 시안의 메인 미리보기가 필요하면 기존 `CalendarPage`를 재사용한다. 별도의 메인 디자인을 만들지 않는다.
