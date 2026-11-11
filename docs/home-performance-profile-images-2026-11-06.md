# 홈페이지 성능 개선·프로필 이미지 점검

최초 점검일: 2026-11-06 KST. 속도 개선 코드는 로컬 적용 상태다. 이후 사용자의 별도 요청으로 프로필 원본 10건의 방송국·이미지 데이터를 운영에 반영했다. [후속 실제 반영 결과](profile-image-repair-2026-11-06.md)를 참고한다. 아래 성능 측정과 13건 목록은 최초 점검 이력이다.

## 적용한 변경

- `frontend/public/images/spotlight_stage_bg.webp`, `frontend/src/portal/portal.css`: 기존 무대 배경을 무손실 WebP로 제공한다. 810,283바이트 → 379,304바이트로 430,979바이트(53.2%) 감소했다. 크기는 1024×576으로 같고 RGBA 픽셀 비교도 일치했다.
- `frontend/portal.html`, `frontend/dev.html`: `/`에서만 공개 프로필 API와 무대 배경을 먼저 요청한다. Chrome에서 API 요청이 1회만 발생하며 preload 응답을 실제 fetch가 재사용함을 확인했다. API의 `no-store`와 페이지 이동 시 최신 공개 목록을 다시 읽는 정책은 유지했다. [preload의 CORS·credentials 일치 조건](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload#cors-enabled_fetches)을 참고했다.
- `frontend/src/components/calendar/AvatarImage.tsx`, `frontend/src/portal/PortalUi.tsx`, `frontend/src/portal/WikiContent.tsx`, `frontend/src/portal/WikiCardVariants.tsx`: 실패 여부를 이미지 주소별로 관리한다. 쇼케이스의 버튜버가 바뀌거나 상세 응답에서 이미지 주소가 갱신되면 이전 실패 상태에 가려지지 않는다. 목록 카드 이미지는 지연 로딩·비동기 디코딩한다. 기존 작업 중이던 WikiContent의 다른 변경은 보존했다.
- `backend/scripts/audit_profile_images.cjs`: 공개 API와 원본 이미지만 읽는 점검 도구를 추가했다. 같은 URL은 한 번만 검사하고 오류는 한 번 재시도한다. HTTP 상태·이미지 Content-Type·파일 시그니처를 검사해 전체 JSON과 문제 CSV를 저장한다. DB 쓰기를 수행하지 않는다.

`CalendarPage.tsx`, `PortalStage.tsx`, `PlatformMiniSpotlight.tsx`, 공통 헤더·푸터 구조는 변경하지 않았다.

## 로컬 브라우저 비교

설치된 Chrome, 프로덕션 빌드, 지연 100ms·다운로드 750,000바이트/초 조건의 각 1회 측정이다. 같은 420건 공개 API 스냅샷에 800ms의 응답 지연을 주었다. 외부 분석·폰트·프로필 이미지 요청은 전후 동일하게 차단했다. 실제 운영 사용자 성능 수치나 Lighthouse 점수는 아니다. Chrome DevTools MCP가 없어 web-perf 스킬의 전용 추적 절차는 실행하지 않았다.

| 항목 | 개선 전 | 개선 후 |
|---|---:|---:|
| PC LCP (1440px) | 1.728초 | 1.512초 |
| 모바일 LCP (390px) | 3.672초 | 2.640초 |
| PC 프로필 요청 시작 | 1.473초 | 0.138초 |
| 모바일 프로필 요청 시작 | 1.411초 | 0.150초 |
| PC CLS | 0.07855 | 0.07855 |
| 모바일 CLS | 0.11044 | 0.11044 |

PC·모바일 전체 캡처는 전후 픽셀이 일치했다. 하이라이트·달력·헤더·푸터의 크기와 주요 계산 스타일도 같았다. 월간/주간 이동, 상세 페이지 진입 후 로고로 홈 복귀, 복귀 후 동일 스타일을 확인했다. 모바일 CLS는 이번 변경 후에도 남아 있는 후속 점검 항목이다.

실패한 이미지 주소에서 정상 HTTPS 이미지 주소로 바꾼 뒤 AvatarImage와 PortalAvatar가 실제 이미지를 다시 표시하는 브라우저 검증을 통과했다.

원시 결과·캡처·검증 스크립트: `_workspace/home-performance-2026-11-06/`.

## 운영 공개 프로필 이미지

2026-11-06 00:16 KST 기준 공개 프로필 420건, 이미지 URL 413개를 검사했다. 407건은 정상 이미지 응답, 13건은 문제다. 이름이 같은 백호양·연새늘이 각각 2개 slug로 존재하므로 활동명 기준으로는 11개다. 정상 응답 407건을 브라우저에서 전부 디코딩한 것은 아니다. 오류 URL 6건은 재시도 후에도 실패했으며 실제 Chrome 이미지 로딩 실패도 확인했다.

| 활동명 | 프로필 slug | 문제 |
|---|---|---|
| 베리아 | beria | 원본 404 |
| 篝宮桔梗 | kagarimiya-kikyo | 주소 없음 |
| Aldonza Kambayashi | aldonza-kambayashi | 원본 404 |
| jikiivt | jikii-vt | 주소 없음 |
| 마호야 키나 | mahoya-kina | 원본 404 |
| ガチ経営者VTuber組長 | kumicho | 원본 404 |
| 眠来らむね | nemurai-ramune | 원본 400 (`https://yt3.googleusercontent.com/ytc`만 저장됨) |
| 백호양 | baekhoyang | 주소 없음, 채널 주소도 없음 |
| 백호양 | baekhoyang-2 | 주소 없음, 채널 주소도 없음 |
| 연새늘 | yeonsaeneul | 주소 없음, 채널 주소도 없음 |
| 연새늘 | yeonsaeneul-2 | 주소 없음, 채널 주소도 없음 |
| 말리부 | malribu-2 | 주소 없음 |
| 마이 Mai | mai-chzzk | 원본 404 |

최초 점검 시에는 DB 반영과 월별 조사 CSV 상태 변경을 수행하지 않았다. 후속 갱신을 완료한 현재 [문제 목록 CSV](profile-image-issues-2026-11-06.csv)에는 남은 3건만 수록되어 있다. 수정 전 13건 원본과 변경 이력은 작업 산출물과 [후속 실제 반영 결과](profile-image-repair-2026-11-06.md)에 보존했다.

재점검 명령: `node backend/scripts/audit_profile_images.cjs <결과를 저장할 폴더>`.

## 검증 결과와 제한

- `npm run build --prefix frontend`: TypeScript와 프로덕션 빌드 통과. 샌드박스 realpath EPERM 이후 승인된 실행으로 완료했다. 기존 관리자 청크 500KB 초과 경고는 남아 있다. 해당 청크는 홈 초기 로딩 대상이 아니다.
- `node --test frontend/tests/calendarPerformance.test.cjs frontend/tests/contentReview.test.cjs`: 6/6 통과.
- 추가 `profileMedia.test.cjs`, `portalLocale.test.cjs`: 5/7 통과. `CreatorProfile.tsx`의 `데뷔 예정` 번역 누락, 상세 페이지의 `데뷔 일정`·`처음 만나는 영상` 순서 검사에서 실패했다. 수정 전 HEAD의 PortalUi를 별도로 사용한 검사에서도 같은 두 실패가 재현됐다. 이번 작업에서 해당 상세 구성·번역은 수정하지 않았다.
- 로컬 Chrome 전후 비교·상세→홈 복귀·이미지 주소 갱신 복구: 통과.
- 운영 환경에서 개선 코드가 배포된 후의 성능과 실제 사용자 INP: 미측정. 속도 개선 코드 배포는 수행하지 않았다. 프로필 DB는 이후 사용자 요청으로 별도 갱신했으며 후속 보고서에 기록했다.
