# Lighthouse 속도 개선 (2026-11-11)

Cloudflare Observatory(Lighthouse) 결과의 빨간 항목(이미지 전달, 메인 스레드 작업)과 주황 항목(캐시 수명)을 개선했다. 서버 응답·렌더 차단·문서 지연은 이미 통과 상태였다.

## 코드로 반영한 내용

| 항목 | 변경 | 효과 |
|---|---|---|
| 이미지 전달 | `logo.png`(422KB) → `logo.webp`(24KB), `spotlight_stage_bg.png`(791KB) → `.webp`(12KB), `bg_profile.png`(154KB) → `.webp`(6KB) | 첫 화면 약 1.3MB 감소. 보이는 모습은 동일 |
| 이미지 전달 | 가이드 스크린샷 5개 PNG(합계 1.7MB) → WebP(합계 130KB) | 가이드 페이지 약 1.6MB 감소 |
| 이미지 전달 | 배너 JPG 2개 재압축(442KB·402KB → 151KB·131KB), 플랫폼 아이콘 해상도 축소 | DB에 저장된 주소는 그대로 유지 |
| 이미지 전달 | 목록 아바타 `loading="lazy"`·`decoding="async"`·크기 지정, 로고 크기 지정 | 화면 밖 이미지 요청 제거, 레이아웃 흔들림 감소 |
| 메인 스레드 | 번역 사전(약 115KB)을 `shared/portalTranslationData.ts`로 분리. 한국어 화면은 받지 않고, 일본어·영어 선택 시에만 불러옴 | 첫 화면 공통 스크립트 164KB → 43KB |
| 메인 스레드 | 공개 소개 목록 API를 60초 캐시(엣지·브라우저) | 페이지 이동마다 반복되던 전체 목록 다운로드·처리 감소 |
| 캐시 수명 | 해시 없는 이미지·아이콘 캐시 1일 → 30일(+ stale-while-revalidate 1일) | 캐시 항목 개선 |

원본 PNG(`logo.png` 등)는 디스코드 알림·외부 링크용으로 남겨 두었다. `logo.png`는 600px로 줄였다.

## 운영 시 유의사항

- **이미지를 같은 파일명으로 교체하면 최대 30일 동안 이전 이미지가 보일 수 있다.** 교체할 때는 파일명을 바꿔 배포한다(예: `logo-v2.webp`).
- 공개 소개 목록은 최대 60초 늦게 반영될 수 있다. 관리자 화면에서 승인·보류한 직후에는 화면이 캐시를 건너뛰고 최신 목록을 다시 받는다.

## Cloudflare 대시보드에서 할 일

### 1. Google Analytics를 Zaraz로 옮기기 (3rd parties·메인 스레드 개선, 무료)
1. Cloudflare 대시보드 → `vdebut.live` → **Zaraz** → **Tools configuration** → **Add new tool** → **Google Analytics 4** 선택
2. 측정 ID에 `G-LS6E68YC5K` 입력 후 저장
3. Zaraz에서 페이지뷰가 들어오는지 GA 실시간 보고서로 확인
4. 확인되면 `frontend/portal.html`과 `frontend/index.html`의 gtag 스크립트 두 줄을 삭제하고 배포 (중복 집계 방지. 코드 삭제는 Zaraz 확인 후 진행)

### 2. 외부 아바타 크기 조정 (선택, 유료 기능)
치지직·SOOP 서버의 원본 아바타를 표시 크기(80~360px)에 맞춰 받는 기능을 코드에 넣어 두었다. 기본은 꺼져 있다.
1. 대시보드 → **Images** → **Transformations**에서 `vdebut.live` 활성화
2. 원격 원본 허용 목록에 아바타 이미지 도메인 추가 (치지직·SOOP 프로필 이미지 호스트)
3. 프런트엔드 빌드 시 환경 변수 `VITE_IMAGE_RESIZE=true` 설정 후 배포
4. 아바타 주소가 `/cdn-cgi/image/width=...`로 바뀌고 정상 표시되는지 확인

### 3. 권장하지 않는 설정
- **로켓 로더**: React 모듈 스크립트의 실행 순서를 바꿔 화면이 깨질 수 있다.
- **Argo**: 서버 응답이 이미 통과 상태라 효과가 거의 없다.
- **Polish**: 우리 도메인 이미지는 이미 WebP로 바꿨고, 외부 아바타에는 적용되지 않아 효과가 작다.
