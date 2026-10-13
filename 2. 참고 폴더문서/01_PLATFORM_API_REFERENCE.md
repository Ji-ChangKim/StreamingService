# 📚 [참고] 01_PLATFORM_API_REFERENCE.md
**버전**: v1.2

**최종 수정일**: 2026-10-11

**목적**: 외부 스트리밍 플랫폼(CHZZK, SOOP, YouTube) API 규격 및 변천사 기록  

---

## 1. 치지직 (Naver CHZZK) API 규격

### 1.1 채널 정보 API
- **Endpoint**: `https://api.chzzk.naver.com/service/v1/channels/{channelId}`
- **Method**: `GET`
- **Headers**: `Accept: application/json`
- **주요 응답 필드**:
  - `content.channelId`: 채널 고유 ID
  - `content.channelName`: 방송국 이름
  - `content.channelImageUrl`: 프로필 아바타 이미지
  - `content.channelDescription`: 채널 소개글

### 1.2 다시보기 / 클립 비디오 API (Video-to-Channel 역추적)
- **Endpoint**: `https://api.chzzk.naver.com/service/v1/videos/{videoId}`
- **URL 예시**: `https://chzzk.naver.com/video/14105462`
- **특이사항**: 비디오 URL 입력 시 해당 영상 객체 내 `content.channel` 정보를 추출하여 크리에이터 프로필로 자동 연동.

---

## 2. SOOP (구 아프리카TV) API 규격 및 변천사

> [!IMPORTANT]
> **SOOP 브랜드 통합에 따른 도메인 변경 내역 (2026년 기준)**
> - ❌ 구 버전 API (폐지): `https://bjapi.afreecatv.com/api/{userId}/station` (404 Error)
> - ❌ 도메인 변경전 (폐지): `https://stapi.afreecatv.com/api/{userId}/station` (DNS Fail)
> - ✅ **최신 정식 API (사용 중)**: `https://chapi.sooplive.co.kr/api/{userId}/station` (Fallback: `https://chapi.sooplive.com/api/{userId}/station`)

### 2.1 SOOP 방송국 API
- **Endpoint**: `https://chapi.sooplive.co.kr/api/{userId}/station`
- **Method**: `GET`
- **주요 응답 필드**:
  - `data.station.user_nick`: 크리에이터 닉네임 (예: `치즈치즈♪`)
  - `data.profile_image`: 프로필 아바타 (예: `//profile.img.sooplive.co.kr/...`)
  - `data.station.station_name`: 방송국 타이틀

### 2.2 게시글 및 메모 URL 파싱 지원
- **게시글 URL 예시**: `https://www.sooplive.co.kr/station/memo/a0714/post/166790429`
- **파싱 규칙**: `memo` 세그먼트 바로 뒤에 위치한 `a0714`를 실제 `userId`로 파싱하여 API 조회.

---

### 2.3 채널 아트(프로필 배너) — 2026-10-11 실응답 확인

- 채널 웹 서비스가 사용하는 공개 GET: `https://api-channel.sooplive.com/v1.1/channel/{userId}/station`.
- 로그인·API 키 없이 확인한 응답: `station.userId`, `channelArt.pcFilename`, `channelArt.mobileFilename`. 문서화된 외부 OpenAPI 계약으로 확인한 것은 아니므로 향후 구조 변경 시 기본 배경으로 처리한다.
- 파일 경로가 `SKIN/{stationNo}/{file}.jpg` 등일 때 원본 `https://stimg.sooplive.com/{filename}`으로 표시한다. 배너 색상만 있고 파일이 없으면 자체 배너로 취급하지 않는다.
- 실례: `doosiki0505` → `SKIN/32674319/53531790001551903.jpg`, 이미지 HEAD 200 / image/jpeg. 모바일 파일은 빈 문자열이었다.
- 배너는 등록된 SOOP 채널의 소개 상세에서만 별도 조회한다. 메인·소개 목록·접수 조회에서는 SOOP 추가 요청을 하지 않는다. 등록 URL의 식별자를 검증한 뒤 고정된 API로만 요청한다.
- 응답 최대 128KiB, 제한 시간 3.5초, 공개 결과 10분 캐시. HTTP/API/이미지 오류·배너 없음에는 원본 VDébut 배경 유지. 오류 응답은 캐시하지 않는다.
- 신규 서비스 GET `/api/v1/portal/profiles/{slug}/banner?version=2`는 `{bannerUrl,mobileBannerUrl,description}`만 반환하며 외부 사용자 권한 등 나머지 응답은 전달하지 않는다. 미등록 slug는 404, 외부 장애는 503/no-store.
- 소개 상세의 “이런 방송으로 만나요”에는 `display.profileText`를 우선 표시한다. 실제 채널 소개가 공백·미등록·잘못된 타입이거나 조회가 실패하면 기존 등록 소개를 유지한다. 줄바꿈을 보존한 최대 4,000자 일반 문자열이며 HTML로 실행하지 않는다.
- 배너와 소개는 동일한 SOOP 응답에서 추출해 외부 요청을 추가하지 않는다. 배너 이미지 실패 여부는 소개 표시와 분리한다. 응답·브라우저 조회 키를 v2로 구분해 이전 배너 전용 캐시를 재사용하지 않는다.

## 3. YouTube (유튜브) OpenGraph 메타 파서

- **대상 URL**: `https://www.youtube.com/@{Handle}` 또는 `https://www.youtube.com/channel/{channelId}`
- **파싱 방식**: OpenGraph HTML Meta Tag Scraping
  - `og:title`: 채널 닉네임 및 타이틀 (`竜煌 ニズナ / Ryuko Nizuna / 新人VTuber`)
  - `og:image`: 고화질 아바타 (`https://yt3.googleusercontent.com/...=s900-c-k...`)
  - `og:description`: 채널 소개글
- **특이사항**: YouTube Bot 차단 대비 `Mozilla/5.0` User-Agent 및 `Accept-Language` 헤더 전송.
