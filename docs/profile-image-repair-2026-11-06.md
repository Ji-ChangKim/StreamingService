# 운영 방송국·프로필 이미지 복구 결과

2026-11-06 KST, 사용자의 실제 데이터 갱신 요청으로 운영 `vdebut-db`에 반영했다. 코드 배포와 다른 마이그레이션 실행은 하지 않았다.

## 반영 결과

- 프로필 원본 10건의 이미지 주소를 수정하고, 그중 8건의 방송국 주소를 정규화했다. 백호양·연새늘이 각각 2개 slug로 저장되어 있어 실제 대상은 8명이다.
- `streamerChannel_info` 10건, `streamerChannel` 8건, 별도 `portal_profiles` JSON 2건, 채널 연결 신규 1건과 기존 연결 유지, 수정 이력 10건을 반영했다. 소개·활동명·일정·제원·소유권·공개 검토 상태는 보존했다.
- 같은 방송국 URL이 연결된 백호양·연새늘은 기존 공개 목록 중복 제거 로직에 따라 각각 한 번씩 표시된다. 원본 DB 행을 삭제하지 않았다. 공개 프로필 수는 420→418건이다.
- 전체 이미지 재점검: 최초 문제 13건→현재 3건. 현재 공개 프로필 418건 중 415건은 정상 이미지 응답, 2건은 원본 404, 1건은 주소 누락이다.
- 운영 상세 페이지 8곳에서 새 프로필 이미지가 실제 표시되는 것을 Chrome으로 확인했다. API 응답을 대체하지 않았다.

| 대상 | 실제 운영 프로필 | 조치·근거 |
|---|---|---|
| 篝宮桔梗 | [프로필](https://vdebut.live/creator/kagarimiya-kikyo) | 기존 YouTube 핸들은 404. [본인 TwitCasting](https://twitcasting.tv/kagarimiyasan)과 [공식 데뷔 영상](https://www.youtube.com/watch?v=P3IdtaHDLk0)이 같은 채널 ID를 가리킴을 확인해 [정규 방송국](https://www.youtube.com/channel/UCYqc4sOohUJvpq8eckXjQjQ)과 최신 이미지로 변경. |
| Aldonza Kambayashi | [프로필](https://vdebut.live/creator/aldonza-kambayashi) | [기존 공식 채널](https://www.youtube.com/@AldonzaKambayashi)의 현재 채널 ID와 og:image 확인. |
| ガチ経営者VTuber組長 | [프로필](https://vdebut.live/creator/kumicho) | [기존 채널 ID](https://www.youtube.com/channel/UCpQje3p1s3BiPEp3MVm76hQ)의 최신 이미지 사용. 채널명은 현재 `掃除屋社長の本音 (有)名阪ビル管理 取締役 梅木建治`로 변경돼 있고 이미지도 본인 실사 사진이다. [기존 데뷔 영상](https://www.youtube.com/watch?v=N0tPOHWZF5I)의 현재 소유 채널이 같음을 확인했다. 서비스 활동명은 변경하지 않았다. |
| 眠来らむね | [프로필](https://vdebut.live/creator/nemurai-ramune) | [공식 방송국](https://www.youtube.com/@nemurairamune)의 최신 이미지로, 경로가 잘렸던 `/ytc` 주소 수정. |
| 백호양 | [프로필](https://vdebut.live/creator/baekhoyang) | 기존 `chzzk.id/hoyang`이 [정규 방송국](https://chzzk.naver.com/8c14ab2e0f180f3be5f64b7b421d152f)으로 연결됨을 확인. baekhoyang·baekhoyang-2 원본 모두 갱신. |
| 연새늘 | [프로필](https://vdebut.live/creator/yeonsaeneul-2) | 기존 `http://chzzk.me/JEPlL`이 [정규 방송국](https://chzzk.naver.com/db8c2f4b478e9aaca4a42a45e5e89b7f)으로 연결됨을 확인. yeonsaeneul·yeonsaeneul-2 원본 모두 갱신. |
| 말리부 | [프로필](https://vdebut.live/creator/malribu-2) | 기존 커뮤니티 주소를 [방송국 기본 주소](https://chzzk.naver.com/e4ae5646d01063022591e26bb81106cf)로 정규화하고 공식 API 이미지 저장. |
| 마이 Mai | [프로필](https://vdebut.live/creator/mai-chzzk) | [공식 방송국](https://chzzk.naver.com/767f9cfb72885ff1c2979e5b2a1b6066)의 최신 이미지 저장. 별도 공개 JSON과 검토 스냅샷도 함께 갱신해 공개 상태를 보존. |

## 남은 3건

| 대상 | 확인 결과·보류 이유 |
|---|---|
| 베리아 (`beria`) | 기존 치지직 API의 channelId와 이미지가 null이고 채널명은 `(알 수 없음)`. 공식 검색에서 일치하는 대체 채널을 확정하지 못했다. 기존 이미지 404는 남아 있다. |
| 마호야 키나 (`mahoya-kina`) | 기존 치지직 API의 channelId·이미지가 null이며 정확한 활동명 검색 결과도 없다. 기존 이미지 404는 남아 있다. |
| jikiivt (`jikii-vt`) | Twitch 공식 공개 API에서 `user: null`. 유효한 현재 방송국·프로필 이미지 주소를 확인하지 못했다. |

이 3건은 원인을 채널 삭제·정지·핸들 변경 중 하나로 단정할 수 없다. 다른 사람의 비슷한 채널이나 임의 이미지를 넣지 않았다. 본인의 현재 방송국 주소 또는 공식 이전 공지가 확보되면 추가 반영할 수 있다. [현재 미해결 목록 CSV](profile-image-issues-2026-11-06.csv).

## 변경 파일과 검증

- `backend/migrations/0059_repair_verified_profile_images_and_channel_urls.sql`: 해당 파일만 운영에 명시 실행했다. 조회 시점과 값이 달라졌으면 쓰기 전에 중단하는 조건을 포함한다. 다른 마이그레이션을 일괄 실행하지 않는다.
- `vtuber-list/2026-11/profile-updates.csv`: 항목별 변경 18행 추가. 운영 재조회 일치 확인 후 T로 기록했다. 기존 12행의 작성일·상태·본문은 바이트 그대로 보존했다.
- `vtuber-list/2026-11/research-log.csv`: 수정 10건은 T, 미해결 3건은 F로 기록했다. 기존 45행은 그대로 보존했다. 신규 데뷔 CSV는 변경하지 않았다.
- `docs/profile-image-issues-2026-11-06.csv`: 현재 남은 3건으로 갱신했다. 최초 13건의 상세 이력은 앞선 성능 점검 보고서와 원시 산출물에 남아 있다.
- 실제 관련 스키마와 수정 전 행으로 SQLite 실행·같은 SQL 재실행·다른 편집 충돌 시 중단·공개 검토 상태 보존을 검증했다.
- 원본 이미지 8개 모두 HTTP·파일 시그니처·Chrome 디코딩과 시각 확인을 통과했다.
- 반영 후 운영 D1에서 원본 10건과 공개 JSON 2건의 값을 다시 읽어 수정안 일치를 확인했다. 실제 운영 프로필 상세 8곳의 이미지 표시도 확인했다.

수정 전 원문 백업, 공식 채널 응답, 수정안, 적용 결과, 재점검과 브라우저 결과는 `_workspace/home-performance-2026-11-06/`에 보관했다. SQL·자료 갱신 작업이므로 프런트엔드 빌드와 전체 애플리케이션 테스트는 이번 반영에서 다시 실행하지 않았다.
