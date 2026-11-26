# 🗄️ Cloudflare D1 Database & Migration Management Guide

본 문서는 StreamingService 프로젝트의 Cloudflare D1 데이터베이스 스키마 이력 및 마이그레이션 운영 규칙을 정리한 문서입니다.

2026-11-13: `0065_debut_csv_pipeline.sql`만 운영에 명시 적용했습니다. CSV 현재 버전·원문 이력·공개 내용 연결 영수증 테이블 3종과 인덱스를 추가했습니다. 11월·12월 CSV 최초 작성일과 T/F를 보존해 초기 저장했습니다. 공개 신규 1명은 마이그레이션이 아닌 배포된 자동화가 처리했습니다. [배포·실제 시험 기록](../../docs/debut-pipeline-release-2026-11-13.md).

2026-11-13 18시 시험 준비: `0066_tavily_test_usage.sql`만 추가로 운영에 명시 적용했습니다. 월 검색 예약·응답 크레딧·성공·실패 사용량 테이블을 만들고 기존 로컬 시험의 예약 4회·보고 3크레딧을 이관했습니다. 공개 프로필 데이터는 변경하지 않았고 과거 마이그레이션을 재실행하지 않았습니다. [시험 예약·결과 기록](../../docs/tavily-server-test-2026-11-13-1800.md).

---

## 📌 1. 현재 표준 DB 스키마 구조 (`v0.3` 기준)

프로젝트는 `streamerChannel`과 `streamerChannel_info` 1:1 짝꿍 테이블 구조를 표준으로 사용하고 있습니다.

### ① `streamerChannel` (상위 채널 테이블)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `platform`: TEXT (예: `CHZZK`, `SOOP`, `YOUTUBE`)
- `channel_url`: TEXT (방송국/라이브 주소)
- `channel_name`: TEXT
- `created_at`: TEXT DEFAULT CURRENT_TIMESTAMP

### ② `streamerChannel_info` (하위 채널 세부 정보 테이블)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `channel_id`: INTEGER UNIQUE (FOREIGN KEY -> `streamerChannel.id`)
- `slug`: TEXT UNIQUE
- `display_name`: TEXT
- `profile_image_url`: TEXT
- `description`: TEXT
- `agency_name`: TEXT DEFAULT '개인세'
- `debut_date`: TEXT
- `debut_time`: TEXT
- `timezone`: TEXT DEFAULT 'Asia/Seoul'
- `start_at_utc`: TEXT
- `country_code`: TEXT CHECK (country_code IN ('KR', 'JP', 'US') OR country_code IS NULL) *(Migration 0009에서 추가)*
- `x_url`: TEXT *(Migration 0012에서 추가, X/트위터 공식 주소)*
- `created_at`: TEXT / `updated_at`: TEXT

---

## 📜 2. 마이그레이션 이력 관리 및 히스토리

- `0001` ~ `0005`: 구버전 스키마 (`creator_profiles`, `debut_events` 등) - **[보존 대상 / 재실행 금지]**
- `0006_streamer_channel_pair.sql`: 신규 1:1 짝꿍 테이블 스키마 적용
- `0007_insert_all_62_streamers.sql`: 62명 초기 스트리머 추가
- `0008_add_31_soop_streamers.sql`: SOOP 31명 누락 스트리머 추가
- `0009_add_country_code.sql`: `country_code` 컬럼 추가 및 KR/JP/US 국가 코드 데이터 셋 업데이트
- `0010_fix_profile_image_urls_and_index.sql`: `profile_image_url` NULL 보완 및 `start_at_utc` 쿼리 인덱스 추가 (조회 속도 초고속화)
- `0011_update_diaphin_channel_info.sql`: `디아핀` 치지직 정식 채널 URL, 최신 프로필 이미지 및 방송국 소개글 업데이트
- `0012_add_x_url_column_and_data.sql`: `x_url` 컬럼 추가 및 기존 데이터 보존 상태에서 X(트위터) 링크 등록
- `0013_update_twitch_profile_and_soy_info.sql`: Soy (`astaril-soy`) 스트리머 트위치 고화질 프로필 이미지 및 소개글 업데이트
- `0014_create_crawler_update_logs_table.sql`: 자동 웹서치 수집 및 갱신 이력 기록용 `crawler_update_logs` 테이블 생성
- `0015_add_august_debut_streamers.sql`: 2026년 8월 중순(8/10~8/16) 버추얼 스트리머 데뷔 일정 33건 신규 추가 등록 (시간 미정 00:00 처리 반영)
- `0016_update_youtube_august_profiles.sql`: 8월 중순 데뷔 유튜브 스트리머 16명의 최신 프로필(이름, 900px 고화질 이미지, 소개글) 일괄 UPDATE 갱신
- `0017_add_august_late_streamers.sql`: 2026년 8월 17일~23일 신규 버추얼 스트리머 데뷔 일정 49건 등록 및 최신 프로필(치지직/SOOP/유튜브 고화질 아바타, 소개글) 반영
- `0018_update_uralogic_game_company_streamers.sql`: 일본 신규 버튜버 프로젝트 'Uralogic Game Company' 1기생 5인 스트리머 채널/정보 최신화 (소속사명, 공식 X URL, 한자 표기 정정 및 릴레이 데뷔 일정 반영)
- `0019_create_admin_and_submissions.sql`: 관리자 보안 계정(`admin_users`, SHA-256 해시 인증) 및 데뷔 일정 신청서 심사 대기열(`debut_submissions`) 테이블 생성 (스팸 차단 및 CMS 1-클릭 승인 워크플로우 지원)
- `0020_add_august_final_debut_streamers.sql`: 2026년 8월 23일~30일 신규 버추얼 스트리머 데뷔 일정 18건 추가 등록 및 최신 프로필(치지직/SOOP/유튜브 고화질 아바타, 소개글, 스타버스 소속사 등) 반영
- `0021_update_and_add_late_august_streamers.sql`: 2026년 8월 26일~31일 버추얼 스트리머 일정 패치 (토모♪ 8/26 13:00 일정 변경, 모냐?·잘님 등 신규 22건 추가 등록)
- `0022_add_september_early_debut_streamers.sql`: 2026년 8월 31일 ~ 9월 6일 신규 버추얼 스트리머 34건 등록 (신규 32인 등록 + ガチ経営者VTuber組長, 月深夜冥夜 데뷔 시각 및 프로필 최신화)
- `0023_add_september_mid_late_debut_streamers.sql`: 2026년 9월 4일 ~ 9월 28일 신규 버추얼 스트리머 34인 등록 및 緋桜なこ 데뷔 일시 UPDATE (2026-09-01 -> 2026-09-04 21:00 KST)
- `0024_add_september_second_week_streamers.sql`: 2026년 9월 7일 ~ 9월 13일 주간 신규 버추얼 스트리머 7인 추가 등록 (天井沢依留, 밀루아, 유메사키 후카, ヤドカリのドリィ, 音蓮みずの, むみつや, 眠来らむね) 및 프로필 최신화
- `0025_update_admin_credentials.sql`: 관리자 보안 계정 비밀번호 갱신(`admin1234@`, SHA-256 해시) 및 `vedebut.admin` / `vdebut.admin` 복수 계정 완벽 지원
- `0026_discord_subscribed_channels.sql`: 디스코드 봇 실시간 데뷔 알림 수신 채널(`discord_subscribed_channels`) 관리 테이블 및 채널 ID/길드 ID 인덱스 생성
- `0027_discord_streamer_verifications.sql`: 치지직/SOOP 스트리머 방송국 소개글 본인 인증 및 디스코드 계정 1:1 매핑(`discord_streamer_verifications`) 테이블 생성
- `0028_add_mid_september_debut_streamers.sql`: 2026년 9월 16일 ~ 20일 신규 버추얼 스트리머 추가 및 최신화 (이루 SOOP 활동명/프로필 UPDATE, 김멜트·Astera·순진·신예리 정규 등록, 피요냥·세르온 시간 미정 00:00 처리 및 전용 섹션 연동, 덕고미 기등록 유지 검증)
- `0029_create_analytics_schema.sql`: VDébut Analytics 대시보드 전용 스키마 생성 (`analytics_channels`, `analytics_live_sessions`, `analytics_live_snapshots`, `analytics_category_map`, `analytics_market_hourly`, `analytics_opportunity_scores`) 및 카테고리 매핑 시드, 기존 버튜버 레지스트리 연계
- `0030_broadcast_statistics_collection.sql`: 방송 통계 10분 주기 수집 회차(`analytics_broadcast_runs`) 및 원본 방송 스냅샷(`analytics_broadcast_snapshots`) 스키마 및 시간 인덱스 생성
- `0031_add_late_september_early_october_streamers.sql`: 2026년 9월 23일 ~ 10월 4일 신규 버추얼 스트리머 13인 추가 등록 (송이, 조하구, 아므 AMU, 코모리 레이, 설도담, 유지해, 아마노미야 미유키, 서라별, 해몽실, 동그리아, 양태양, 강두식, 하은비) 및 정식 채널 완전값, 고화질 아바타, 공식 X 링크, 시간 미정(00:00) 표준 처리 반영
- `0032_add_rain_streamer.sql`: 2026년 10월 1일 01:30 신규 첫 데뷔 치지직 버추얼 스트리머 래인(rain) 추가 등록 (32자리 정식 채널 완전값, 네이버 고화질 프로필 이미지, 공식 X 링크 반영)
- `0033_add_crawled_october_debut_streamers.sql`: 2026년 10월 및 최신 데뷔 스트리머 5인 추가 등록 (디니야 10/8, 말리부 12/1, 연새늘 9/26, 묘콩 9/1, 이로지 8/28) 및 치지직 32자리 고유 URL, 네이버 고화질 프로필 CDN URL, 공식 X 링크, KST/UTC 정규화 반영
- `0034_add_october_debut_streamers.sql`: 2026년 10월 금월 신규 버추얼 스트리머 35인 추가 등록 (SOOP 3인, CHZZK 17인, YouTube JP 15인) 및 단축 URL 32자리 완전값 치환, 네이버/유튜브 실측 고화질 아바타, 공식 X 링크, [시간 미정] 00:00 처리, KST/JST 및 UTC 시각 반영
- `0036_portal_requests.sql`: 공개 소개·등록/소유권/문의 신청·관리자 세션 테이블과 인덱스. 2026-10-11 개발 `vdebut-db-dev` 및 운영 `vdebut-db`에 해당 파일만 명시 실행했다. 전체 마이그레이션 일괄 실행과 구분한다.
- `0037_portal_submission_and_history.sql`: 제출 재시도 키·검토 대기 채널·공개 채널 고유 키·관리자 수정 전후 이력 테이블. 2026-10-11 개발 `vdebut-db-dev`, 2026-10-13 운영 `vdebut-db`에 해당 파일만 명시 추가 실행했다. 기존 공개 데이터 변경 없음.
- `0038_add_group_and_video_to_submissions.sql`: 대기업/기업세 및 그룹/유닛 정보(group_name, video_url, website_url) 확장을 위해 `debut_submissions` 및 `streamerChannel_info`에 컬럼 추가. 2026-10-13 운영 실제 스키마에서 해당 컬럼 6개가 없는 것을 확인한 뒤 이 파일만 명시 실행했다. ALTER TABLE은 재실행하지 않는다.
- `0039_add_stellive_abyss_debuts.sql`: 스텔라이브 4기생 'ABYSS' 4인(시즈키 토아, 코가네 랑, 하나요 히요리, 토키노 메리) 2026년 10월 17일~18일 치지직 데뷔 일정, 32자리 고유 채널, 네이버 고화질 프로필 CDN URL, 공식 X 링크, 공식 PV 영상 및 공식 사이트 URL 연동.

운영 적용 완료: 운영 실제 스키마 및 공개 프로필 346개로 0036 재실행 안전성을 로컬 검증한 뒤 이 파일만 추가 적용했다. 기존 공개 데이터·관리자·승인 신청 보존을 확인했다. 0035의 통계 채널·회차 인덱스는 운영에 이미 존재하므로 재실행하지 않았다. 상세 내역은 [LIVE 배포 보고](../../1.%20기획문서/16_LIVE_RELEASE_READINESS.md)를 참조한다.



---

## ⚠️ 3. 마이그레이션 운영 및 변경 규칙 (Crucial Operational Rules)

1. **기존 마이그레이션 파일 훼손 엄금**
   - 이미 실행되었거나 등록된 마이그레이션 스크립트(`0001`~`0008`)를 무단으로 삭제, 수정, 또는 `SELECT 1;` 등으로 덮어쓰지 않습니다.

2. **단순 데이터/컬럼 UPDATE 시 Direct SQL Execution 활용**
   - 스키마 재정의나 파괴적 마이그레이션이 아닌 단순 데이터 UPDATE / 컬럼 추가 작업은 `npx wrangler d1 execute vdebut-db --remote --file=...` 명령을 사용하여 안전하게 실행합니다.

3. **마이그레이션 적용 전 영향도 사전 점검**
   - `DROP TABLE`이나 `DELETE FROM`이 포함된 마이그레이션을 구동하기 전에는 반드시 Live 데이터베이스 백업 여부 및 대상 데이터 손실 가능성을 철저히 확인합니다.

## 4. 2026-10-13 주간 데뷔 정보 최신화

- `0040_sync_october_12_18_debuts.sql`: 사용자 제공 2026-10-12~18 KST 일정 38건을 운영 `vdebut-db`에 해당 파일만 명시 실행했다. 신규 32명·기존 6명 확인/갱신, 공개 프로필 및 캘린더 각각 346→378명. ABYSS 4명 공식 PV·SNS·추가 채널 및 기수 연결, IZIGENIA 2명 그룹 연결 포함. 기존 식별자·소개·사진과 대상 외 340명 정보 보존, 스키마 변경 없음. 과거 마이그레이션과 0039를 일괄 재실행하지 않았다. 로컬 재실행 및 운영 API·개인 페이지 38개를 검증했다. 상세: [주간 데이터 최신화 보고](../../1.%20기획문서/19_OCTOBER_WEEK_DATA_SYNC.md).
- `0041_update_stellive_banner_and_links.sql`: 2026-10-13 운영 명시 실행. ABYSS 4명의 `bannerUrl`, `websiteUrl`, `cafeUrl`과 기존 CMS 홈페이지 주소만 갱신(2개 쿼리, 8행 기록). 사용자 첨부 1080×288 JPEG 원본을 `frontend/public/images/stellive-common-banner.jpg`로 보존하고 기존 운영 Workers Sites KV에 같은 원본을 업로드했다. 기존 일정·개인 사진·PV·SNS·멤버 연결 보존, Worker/프런트엔드 코드 배포 없음.
- `0042_cheer_ranking.sql`: 루키 응원 랭킹용 변경. `streamerChannel_info`에 `event_type`(기본 `DEBUT`), `total_cheers`, `weekly_cheers`, `is_verified` 컬럼과 `idx_info_weekly_cheers` 인덱스를 추가하고, 중복 응원 방지용 `cheer_logs`(`UNIQUE(vtuber_id, client_hash, voted_date)`)를 신설한다. ALTER TABLE은 재실행할 수 없으므로 이 파일만 명시 실행한다(개발 `vdebut-db-dev` 우선, 운영 미적용). `weekly_cheers`는 개발 환경 크론 `0 15 * * SUN`(월요일 00:00 KST)에서 0으로 초기화한다.
- `0043_update_stellive_debut_covers.sql`: 시즈키 토아의 「제육감」과 코가네 랑의 「호랑풍류가」를 각 상세페이지 대표 영상으로 등록한다. `portal_profiles`의 `videoUrl`·`videoTitle`·`videoKind` 및 `streamerChannel_info.video_url`만 갱신하며, 기존 단체 PV를 개인 데뷔 커버곡으로 교체한다. 일정·배너·SNS·기수 연결과 대상 외 프로필은 보존한다. 검토 기록이 있는 프로필은 제외한다. 과거 마이그레이션을 재실행하지 않고 이 파일만 명시 실행한다.
  - 2026-10-15 운영 `vdebut-db` 명시 실행 완료: 2개 쿼리로 공개 프로필 2행·채널 정보 2행 갱신. 대상 두 프로필 원본을 별도 보존하고 메모리 SQLite에서 영상 외 필드 보존·대상 외 보존·재실행을 검증했다. 운영 전후 비교에서 영상 외 값과 총 행 수(공개 프로필 저장 6행·채널 정보 378행)가 동일함을 확인했다. 공개 API의 `COVER` 유형·영상 주소·제목, 두 상세페이지 HTTP 200 및 브라우저의 곡명·재생 버튼 표시를 확인했다. 코드 배포 없음.
- `0044_add_stellive_profile_media.sql`: 2026-10-15 운영 명시 실행 완료. 토아·랑 두 프로필에 `media` 목록을 추가해 개인 커버곡과 ABYSS 공통 PV를 동시에 보관한다. 한 쿼리·대상 2행 갱신이며 기존 단일 영상·일정·배너·SNS·기수 연결은 보존했다. 기존 검토 기록이나 영상 목록이 있는 프로필은 덮어쓰지 않는다. 메모리 SQLite에서 대상 외 보존과 재실행 무변경, 운영 전후 비교에서 `media` 외 모든 공개 필드와 전체 행 수 보존을 확인했다. 관련 화면·등록 기능은 [상세페이지 개편 적용 보고](../../1.%20기획문서/21_CREATOR_PROFILE_IMPLEMENTATION.md) 참조.
- `0045_add_hanayo_hiyori_cover.sql`: 2026-10-16 운영 명시 실행. 사용자 제공 공식 커버곡(Overdose, `https://youtu.be/ouKcRBeyKbk`)을 하나요 히요리(`hanayo-hiyori`)의 대표 영상 및 media 목록으로 등록한다. 단체 PV는 보존하고 개인 커버곡을 featured: true로 추가하여 상세페이지에 커버곡과 팀 PV가 함께 노출되도록 한다. 기존 일정·채널·SNS 등 타 정보는 완벽 보존한다.
- `0046_add_tokino_mary_cover.sql`: 2026-10-16 운영 명시 실행. 사용자 제공 공식 커버곡(괴수 Monster, `https://youtu.be/rKQptWhAvO0`)을 토키노 메리(`tokino-mary`)의 대표 영상 및 media 목록으로 등록한다. 단체 PV는 보존하고 개인 커버곡을 featured: true로 추가하여 상세페이지에 커버곡과 팀 PV가 함께 노출되도록 한다. 기존 일정·채널·SNS 등 타 정보는 완벽 보존한다.
- `0047_fix_hiyori_mary_cover_titles.sql`: 2026-10-16 운영 명시 실행. 하나요 히요리 및 토키노 메리의 커버곡 제목 정정.
- `0048_set_exact_hiyori_mary_cover_titles.sql`: 2026-10-16 운영 명시 실행. 사용자 지정 정확한 곡명(하나요 히요리: `유령이 되고싶어 [ゆうれいになりたい / 유이카] / 하나요 히요리 (Hanayo Hiyori) Cover`, 토키노 메리: `도쿄 테디베어 [東京テディベア l Neru] / 토키노 메리 (Tokino Mary) Cover`)으로 갱신 반영한다.
- `0049_update_shizuki_toa_and_cogane_rang_posts.sql`: 2026-10-16 운영 명시 실행. 시즈키 토아 및 코가네 랑의 데뷔 안내 소개글(치지직 공식 공지 본문 내용), 스트리머 고유 상단 배너 이미지(`shizuki-toa-banner.jpg`, `cogane-rang-banner.jpg`), 치지직 공식 커뮤니티 공지 링크를 갱신 반영한다.
- `0050_enrich_shizuki_toa_profile.sql`: 2026-10-22 사용자 요청으로 운영 `vdebut-db`의 시즈키 토아 한 명만 명시 실행 완료. 공식 홈페이지·본인 X·공식 카페에서 확인한 생일, 신장, 팬네임, 오시마크, 제작자, 태그, 소개·방송 방향·활동 기록과 X 주소 끝 밑줄을 보완했다. 종족 `이세계인(인간 퇴마사)`는 사용자 확정 표기이며 MBTI `INFJ`는 사용자 직접 확인 정보로 출처를 구분했다. 혈액형·별자리·정기 방송 시간은 미확인 상태를 유지했다. `portal_profiles` 1행과 짝꿍 `streamerChannel_info` 1행만 갱신하고, 항목별 출처·확인 시각·변경 전후·기존 짝꿍 정보는 `portal_profile_history` 1행에 보관했다. 원문 비교 및 고정 이력 ID로 동시 수정·재실행을 보호하며, 메모리 DB에서 적용·재실행·동시 수정 거절을 검증한 뒤 실행했다. 일정·기수·채널 식별자·기존 미디어·소유권·공개 검토 상태와 스키마는 보존했다. Wrangler의 명시 `--command` 조회/갱신 경로를 사용했으며 과거 마이그레이션 일괄 실행과 코드 배포는 하지 않았다.
- `0051_enrich_abyss_three_profiles.sql`: 2026-10-22 운영 명시 실행. 스텔라이브 4기 ABYSS 3인(코가네 랑, 하나요 히요리, 토키노 메리) 세부 프로필(생일, 신장, MBTI, 오시마크, 팬네임, 일러스트레이터/리거 등) 확충 및 이력 보관.
- `0052_set_user_confirmed_abyss_mbti.sql`: 2026-10-22 운영 명시 실행. 사용자 직접 확인 정보를 바탕으로 ABYSS 멤버들의 확정 MBTI 설정.
- `0053_sync_late_october_debut_streamers.sql`: 2026-10-26 운영 명시 실행 완료. 사용자 제공 2026년 10월 말 ~ 12월 한국 버추얼 스트리머 10건(쿠리오네 리마, 하즈, 시호연, 아란 아누라, 히유카 메리, 이리나쨩, 토맛토마쨔, 뮤디, 얌세니, 엔뮤) 동기화. 단축 URL 리다이렉트 실측 해석을 통해 치지직 32자리 고유 채널 ID 매핑, 네이버 고화질 프로필 이미지 CDN 연동, 하즈 X 계정(`_momo_HAJ`) 및 소속사(`모모플래닛`), 엔뮤 치지직 방송국 및 데뷔 시각(10/28 20:00), 히유카 메리 치지직 방송국 발굴 반영. 기존 DB 얌세니 채널·식별자 보존 및 10인 포털 프로필(`portal_profiles`, `portal_profile_channels`) 등록 완료. 과거 마이그레이션을 재실행하지 않고 본 파일만 명시 실행했다.
- `0054_enrich_october_1_28_vtuber_specs.sql`: 2026-10-29 운영 명시 실행 완료. 2026년 10월 1일 ~ 10월 28일 데뷔 버튜버 전수(80명) 조사 결과를 바탕으로 공식 채널 설명란, 치지직 커뮤니티 공지, 소속사 공식 프로필에서 검증된 52명(기존 스텔라이브 4기 3인의 별자리 보완 포함 총 52건)의 세부 제원(`species`, `birthday`, `zodiac`, `height`, `fandomName`, `oshiMark`)을 `portal_profiles`에 병합하고, 위키 역사(`portal_profile_history`)에 변경 전후 및 공식 출처 요약을 리비전으로 기록했다.
- `0055_monday_weekly_research_first_sync.sql`: 2026-11-02 매주 월요일 주간 자동 리서치 1차 테스트 실행 완료. 2026년 11월 신규 발굴 버튜버 4인(`스티나_`, `샤루루`, `에스냐`, `무아 MOOA`)을 캘린더(`streamerChannel`, `streamerChannel_info`) 및 도감(`portal_profiles`, `portal_profile_channels`, `portal_profile_history`)에 동시 등록하고, 10월 28일 이후 데뷔 버튜버 5인(`시호연`, `아로아 AROA`, `타치 Tachi`, `희츄기`, `이리나쨩`)의 공식 채널·공지 기반 제원(`종족`, `팬덤명`, `오시마크`)을 보강 및 리비전 기록 완료.
- `0056_sync_november_full_vtuber_debuts_and_specs.sql`: 2026-11-02 운영 명시 실행 완료. 2026년 11월 전체(`2026-11-01` ~ `2026-11-30`) 전수 조사 결과 발굴된 신규 11월 데뷔 버튜버 29명(하쿵, 바유., 도스랑, 금연남, #쁠로라, 아루_, 뽀소리_, 코밍˚, 키싱유*, 시니땅, 소다*, 요루네, 하늬_, 초늘, 하소o, 하이타, 혜성², 이월이, 해나롱, 하모예0, 하시냥:, 수지AI, 마이 Mai, 깅말랑, 유령마녀, 유리마 Ulima, 란비, 한이음, 하농 Hanon)을 캘린더(`streamerChannel`, `streamerChannel_info`) 및 포털 도감(`portal_profiles`, `portal_profile_channels`, `portal_profile_history` r1)에 일괄 등록하고, 기존 11월 데뷔자(`스티나_`, `에스냐`)의 방송국 프로필 게시글 원문 기반 6대 제원을 보강하여 총 35명의 2026년 11월 데뷔 일정 및 제원을 동기화 완료.
- `0057_enrich_pre_nov02_specs_mbti_and_normalize_details.sql`: 2026-11-02 운영 명시 실행 완료. 2026년 11월 2일 이전 데뷔 버튜버 전수(381명)의 공식 방송국·게시글 원문 스캔을 통해 신규 확인된 65명을 포함한 총 164개 프로필의 `종족(species)`, `생일(birthday)`, `별자리(zodiac)`, `MBTI(mbti)` 및 영·한 제원 키를 일괄 병합·정규화하고 위키 역사(`portal_profile_history`)에 출처와 함께 리비전을 기록 완료.
- `0058_register_user_provided_november_debuts.sql`: 2026-11-04 사용자 요청으로 운영 `vdebut-db`에 명시 실행 완료. 다타(11/7 18:00), 아사기리 유키(11/7 20:00), 리엔(11/7 22:00), 라임찌(11/8 14:00), 하나마루 메이(11/8 17:00)를 신규 공개 등록했다. 아란 아누라(11/4 20:00)는 기존 값과 일치하여 유지했다. `portal_profiles`·`portal_profile_channels`·`portal_profile_history` 각 5건을 저장하고 공개 프로필 및 캘린더 API에서 일정·채널 일치를 확인했다.
- `0059_repair_verified_profile_images_and_channel_urls.sql`: 2026-11-06 사용자 요청으로 운영 `vdebut-db`에 이 파일만 명시 실행 완료. 공식 채널·이미지 검증 후 프로필 원본 10건의 이미지와 방송국 주소를 갱신했다(중복 원본 포함 실제 8명). 상세 결과: `docs/profile-image-repair-2026-11-06.md`.
- `0060_sync_nov09_chzzk_debuts.sql`: 2026-11-09 사용자 요청으로 운영 `vdebut-db`에 명시 실행 완료. 2026년 11월 9일 치지직 버튜버 데뷔 조사(27명) 중 공식 API를 통해 단축 URL 리다이렉트(32자리 채널 ID), 공식 이미지, 확정 데뷔 날짜·시각 및 과거 첫 방송 기록 없음(`firstBroadcastDate: null`)이 최종 검증된 신규 첫 데뷔 5인(`아먕` 11/14 13:00, `레오 퍄코` 11/14 20:00, `코바야시 후토` 11/14 21:00, `리즐` 11/21 15:00, `나비령` 12/7 13:00)을 `portal_profiles`, `portal_profile_channels`, `portal_profile_history`에 공개 등록했다.
- `0061_register_nov11_14_soop_debuts.sql`: 2026-11-11 사용자 요청으로 운영 `vdebut-db`에 명시 실행 완료. 2026년 11월 11일~14일 SOOP 공식 캘린더 데뷔 5명(`우디디디` 11/11 11:00, `단온` 11/11 17:00, `아오이로하쿠` 11/12 20:00, `에이루나` 11/12 21:00, `휴이~` 11/14 11:00)을 공개 등록하고 기존 `하시냥:`(`hasinyang-soop`)의 공식 활동명 변경(`꾼구마`)을 정정했다.
- `0062_align_nov14_calendar_activity_regions.sql`: 2026-11-11 사용자 요청으로 운영 `vdebut-db`에 명시 실행 완료. 11월 14일 치지직 데뷔 3인(`아먕`, `코바야시 후토`, `레오 퍄코`)의 한국어 본인 공지·KST 일정에 따른 활동권역 `KR`을 지정하여 기본 한국 캘린더 필터 누락을 해소했다.

## 2026-11-12 Cloudflare 정기 발굴 자동화

- `0063_debut_server_automation.sql`: 실행 임대·월 예산·후보·원문 대기·원천 캐시 테이블 및 조회 인덱스만 명시 적용했다. 과거 마이그레이션은 실행하지 않았다. 최초 읽기 4,949행·쓰기 2,469행, 후속 실제 프로필 조회 인덱스 추가 읽기 1,596행·쓰기 421행. 기존 공개값은 변경하지 않았다. 신규 7명과 기존 22명 행사 구분 보완은 배포된 Worker의 원자적 검증·공개 경로로 처리했다. [운영·검증 기록](../../docs/debut-server-automation.md).
- `0063_index_broadcast_snapshots_channel.sql`: `analytics_broadcast_snapshots(channel_key, run_id)` 복합 인덱스 추가 (채널별 방송 통계 조회 최적화).
- `0064_sync_november_pending_debuts_and_profile_updates.sql`: 2026-11-12 사용자 승인으로 운영 `vdebut-db`에 명시 실행 완료. `vtuber-list/2026-11/new-debuts.csv` 내 미등록 신규 데뷔 3인(`메리Merry` 11/7 19:00 YOUTUBE, `삐빙이` 11/25 19:00 CHZZK, `몽냐 o3o` 11/28 14:00 CHZZK)을 `portal_profiles`, `portal_profile_channels`, `portal_profile_history`에 공개 등록하고(기존 DB에 이미 등록된 16명은 중복 등록 없이 CSV만 `T` 동기화), `vtuber-list/2026-11/profile-updates.csv` 내 공식 출처 확인 제원·링크 보강 6인(12항목: `아란 아누라`, `에스냐`, `이리나쨩`, `무아 MOOA`, `샤루루`, `스티나_`)을 운영 DB에 반영 및 이력 보관 완료.
- `0064_add_broadcast_snapshot_tags.sql`: `analytics_broadcast_snapshots` 테이블에 방송 태그(`tags`) 컬럼 추가.
- `0065_debut_csv_pipeline.sql`: 2026-11-13 운영 명시 적용. D1 내 월별 CSV 정본(`debut_csv_months`), 리비전 이력(`debut_csv_revisions`), 공개 내용 연결 영수증(`debut_csv_receipts`) 테이블 3종과 인덱스를 추가.
- `0065_channel_samples.sql`: 등록 버튜버 직접 기록(`analytics_channel_samples`) 테이블 및 인덱스 생성 (상위 100 밖 신입 버튜버 5분 주기 방송 기록).
- `0066_tavily_test_usage.sql`: 2026-11-13 운영 명시 적용. 월 검색 크레딧 선예약·응답 사용량·성공/실패 집계 테이블(`debut_search_usage`) 생성.
- `0066_channel_rollups.sql`: 채널 일별 요약(`analytics_channel_daily`) 및 개별 방송 요약(`analytics_channel_streams`) 장기 보관 테이블 생성.
- `0067_sync_nov24_dec31_2026_debuts_and_profiles.sql`: 2026-11-24 사용자 승인으로 운영 `vdebut-db`에 명시 실행 완료. 2026년 11월 24일 ~ 12월 31일 전수 조사로 발굴·검증된 신규 데뷔 버튜버 6인(`모아엘` 11/28 15:00 SOOP, `SR호안HOAN` 12/04 17:00 CHZZK, `첫눈에 Firstsight` 12/06 20:00 CHZZK, `타초왕` 12/13 21:00 CHZZK, `백로향 rohyang` 12/18 시간 미정 CHZZK, `소리베` 12/19 14:00 CHZZK)을 `portal_profiles`, `portal_profile_channels`, `portal_profile_history`에 등록하고, 기존 `89girl-soop`의 공식 활동명 변경(`노니_` → `리즈_`) 반영 및 `malribu`/`malribu-2` 중복 프로필을 정규 채널 URL 기준 1개(`malribu`)로 통합 완료.
- `0068_sync_nov27_dec31_2026_debuts_and_updates.sql`: 2026-11-26 사용자 승인으로 운영 `vdebut-db`에 명시 실행 완료. 2026년 11월 27일 ~ 12월 31일 데뷔 유저 재조사 결과로 포털 본인 신청 대기건(`fcdb2cda-cc27-4402-bbf2-d699be27c42c`) 및 공식 방송국·X가 교차 검증된 `별조각 Byeoljogak`(12/12 22:30 CHZZK, 세부 제원 8종 포함)을 승인·공개 등록하고, 일본 `Re//Nilnis` 1기생 2인(`日曜みるか` 12/05 21:00 YOUTUBE, `クルル・オルティ` 12/05 21:30 YOUTUBE)을 신규 등록하며, `히유카 메리`(`hiyuka-meri`)의 치지직 공식 채널 프로필 이미지 변경분을 반영 완료.
