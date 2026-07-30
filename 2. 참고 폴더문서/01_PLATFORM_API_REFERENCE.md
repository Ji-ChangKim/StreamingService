# 📚 [참고] 01_PLATFORM_API_REFERENCE.md
**버전**: v1.0  
**최종 수정일**: 2026-07-30  
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

## 3. YouTube (유튜브) OpenGraph 메타 파서

- **대상 URL**: `https://www.youtube.com/@{Handle}` 또는 `https://www.youtube.com/channel/{channelId}`
- **파싱 방식**: OpenGraph HTML Meta Tag Scraping
  - `og:title`: 채널 닉네임 및 타이틀 (`竜煌 ニズナ / Ryuko Nizuna / 新人VTuber`)
  - `og:image`: 고화질 아바타 (`https://yt3.googleusercontent.com/...=s900-c-k...`)
  - `og:description`: 채널 소개글
- **특이사항**: YouTube Bot 차단 대비 `Mozilla/5.0` User-Agent 및 `Accept-Language` 헤더 전송.
