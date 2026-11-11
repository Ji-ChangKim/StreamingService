# AdSense 신청 준비 재점검 및 코드 보완 (2026-11-11)

2026-10-16 점검 이후 변경분을 코드 기준으로 다시 확인하고, 코드로 해결할 수 있는 항목을 수정했다. 운영 사이트(vdebut.live)는 작업 환경의 네트워크 정책으로 접속할 수 없어 실제 응답·운영 DB는 확인하지 않았다.

## 10-16 이후 이미 해결된 항목

- AdSense 소유 확인 메타 태그(`google-adsense-account`)를 `portal.html`·`index.html`에 추가했다.
- `ads.txt`에 실제 게시자 ID가 있다.
- 광고 전역 비활성(`PUBLISHER_ADS_ENABLED = false`)을 유지한다.

## 이번에 수정한 항목

| 우선 | 문제 | 수정 |
|---|---|---|
| P0 | 개인정보처리방침의 광고 항목이 "도입할 경우 안내" 수준이었음 | Google·제3자 광고 사업자의 쿠키 사용, 맞춤 광고 거부 방법(Google 광고 설정, aboutads.info)을 고지. 한·일·영 번역 추가 |
| P0 | R-18·NSFW 태그 안내가 있는 공개 소개(タダまる。, 月深夜 冥夜) | 자동 검토 신호에 `R-18`·`R18G`·`NSFW`를 추가해 내용 확인 전까지 공개·사이트맵·목록에서 제외 |
| P1 | robots.txt가 `/api/` 전체를 차단해 Google 렌더링 시 목록·상세 데이터를 못 불러옴 | 공개 조회 API(`/api/v1/portal/profiles`, `/api/v1/events`, `/api/analytics/`, `/api/discovery/`)만 허용. 관리·접수·소유자 확인(`/profiles/*/access`) API는 계속 차단 |
| P1 | `/privacy`·`/terms`·`/about`·`/creators` 초기 HTML에 본문이 없었음 | 정책·소개 문구를 `shared/portalPolicyContent.ts`로 옮겨 화면과 서버 초기 HTML이 같은 본문을 사용. `/creators`는 공개 소개 목록 링크를 초기 HTML에 포함 |
| P2 | 레거시 서비스 소개의 "비영리", 구현되지 않은 "10분 전 알림" 문구 | 사실에 맞게 수정 |

검증: 프런트·백엔드 타입 검사, 프런트 프로덕션 빌드, 백엔드 테스트 16개 파일 170개 통과(신규 `adsenseCrawlReadiness.test.cjs` 5개 포함).

## 남은 확인 항목 (코드로 확정 불가)

1. 활동명만 있는 소개 19건 등 정보가 부족한 소개를 공식 근거로 보강
2. 운영 주체·개인정보 담당 연락처, `ru_0120@naver.com` 실제 수신 확인
3. 광고 활성화 전 EEA·영국·스위스 대상 인증 CMP 설정 (AdSense 계정의 개인정보 및 메시지 메뉴)
4. 배포 후 Search Console URL 검사로 `/creators`·상세·개인정보처리방침 렌더링 확인
5. 배포 후 R-18·NSFW 규칙으로 보류된 소개 목록을 관리자 화면에서 확인하고, 오탐이면 문구를 정정
