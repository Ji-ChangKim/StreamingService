# 11월 신인 발굴·프로필 자동 보강 실증 결과

[전체 문서 안내](debut-automation-documents.md) · [당일 후속 반영까지 포함한 작업 정리](work-summary-2026-11-12.md) · [최신 기술 기준](신규버튜버자동화.md). 아래 수치는 당시 시험 시점의 결과입니다.

2026-11-12. 실행 기준 한국시간. 이번 주는 11월 9~15일이며, 프로필 보강 대상은 별도 요청한 11월 1~11일이다.

**판정: 기존 7명 등록은 신규 발굴 실적이 아니었다. 이번 서버 시험에서는 기존 자료에 없던 치지직 채널 2명을 처음 식별해 후보 DB에 보존했다. 공개 등록은 0명이다. 기존 등록자 36명의 프로필 보강 검사를 완료했고 8명·12항목만 실제 추가했다. 전체 시장의 모든 신인을 수집했다고 판단할 수는 없다.**

## 이름 없는 발굴이 실제로 되는가

- 배포 전: 신규 치지직 채널 발굴 0명. 기존 서버 X 링크 16건은 신규 등록으로 이어지지 않았다.
- 카론 유니버스 공지 목록은 이름·게시물 ID 없이 읽어 채랑·아멜리·나루를 찾았으나, 11월 2일 CSV의 기존 보류 후보여서 신규 실적에서 제외했다. 11월 7일 15·16·17시를 추가 확보했다.
- 레버니아 홈페이지는 PC HTTP 200, Cloudflare HTTP 406이었다. 실패를 기록하고 해당 정기 경로는 중지했다. 별도로 공개된 공식 X 계정으로 조사했다. 접근 제한 우회·로그인·새 API 구매는 하지 않았다.
- 실제 서버 입력: `https://x.com/revernia_kr` 한 개. 개인 이름·개인 채널 ID·개인 데뷔 게시물 ID를 설정하지 않았다.
- 서버 처리: 공식 계정의 자기 게시물 링크 선택 → 첫 방송을 앞둔 멤버 안내의 방송국 링크 추출 → 치지직 공식 채널 API의 ID·현재 이름 대조 → D1 후보 보존.
- 근거 원문: [레버니아 공식 공지](https://x.com/revernia_kr/status/2112492682186727841). 이벤트 종료 2026.11.07 23:59는 데뷔일로 사용하지 않았다.
- 실제 완료 실행: `4269e8d2-b278-465c-8165-bafba5cfebd3`, 슬롯 `discovery-test:2026-11-12:2026-11-12.4`. 외부 12회, 상태 `COMPLETED_WITH_HOLDS`. 새 고유 채널 2개를 확인하고 저장 후 DB 재조회에서 보존을 확인했다.

| 처음 식별한 채널 | 방송국 | 별도 원문 조사 | 현재 처리 |
| --- | --- | --- | --- |
| 카이리 시엔 | [치지직](https://chzzk.naver.com/9d4daff602a5e804d8b49a91671b6c16) | 본인 공지에 2026.11.08 오후 7시. 시간대·최초 활동 범위 미확정 | 후보 HOLD, 공개 0 |
| 히라네코 리에 | [치지직](https://chzzk.naver.com/70c680e3922bebbd90969986c82d6b7c) | 본인 공지에 11월 8일 오후 8시. 본문 연도·시간대 미표기 | 후보 HOLD, 공개 0 |

서버가 읽은 소속사 공지는 고유 채널 식별 근거다. 위 개인 데뷔 게시물의 일시는 대화 중 별도 조사에서 읽은 값으로, 서버가 해당 일시까지 자동 확정했다고 설명하지 않는다. 두 후보의 서버 데뷔 일시는 공란이며, 본인 공지 검증·승인·프로필·캘린더 공개까지 완료한 사례도 아니다.

## 사이트와 조사 결과가 같은가

| 비교 범위 | 실제 결과 | 판단 |
| --- | --- | --- |
| 11/1~11/11 SOOP 공식 일정 26건 | 데뷔 21건·이적 5건 | 이적을 신인 데뷔로 합산하지 않음 |
| SOOP 데뷔 21건 | 21명 모두 사이트 등록. 고유 채널·날짜·시각 21/21 일치 | 이 원천 내 신규 누락 0. 전체 버튜버 누락 0이라는 의미 아님 |
| SOOP 이적 5건 | 기존 등록 4명, 치키쨩은 제외 상태 | 기존 4명은 행사 분류 보완 필요. 이번 제원 보강에서 일정·유형을 덮어쓰지 않음 |
| 공식 채널 현재 활동명 | 샤루루→#샤루루, 에스냐→에스냐~, 혜성²→여농이오른팔; 하쿵→하쿵Hakung, 리엔→리엔 RIEN, 라임찌→라임찌Lime | 6명 차이. 기존 표기 보존, 자동 이름 변경하지 않음 |
| 카론 후보 3명 | 기존 CSV에 있고 공개 사이트에는 없음. 공식 시각 추가 확보 | 재발견·기존 후보 보완 |
| 레버니아 후보 2명 | 기존 CSV·공개 사이트·기존 서버 후보에 없음 | 이번 서버 신규 식별, 공개는 보류 |
| 이번 주 11/9~11/15 SOOP 일정 16건 | 데뷔 14건은 모두 등록·날짜/시각 일치. 이적 2건은 데뷔 대상 제외 | 공식 원천 기준 비교 완료 |

현재 사이트의 11월 1~11일 날짜를 가진 프로필은 36명(SOOP 25·치지직 11)이다. 여기에는 기존 이적 등록 4명과 시간 미정 1명이 포함되어 있어, 36명을 생애 첫 데뷔자로 단정하지 않는다.

## 빈 프로필을 어떻게 채웠는가

SOOP 실제 소개 필드 `station.display.profile_text`를 읽도록 수정했다. 공식 방송국 홈의 프로필·소개·정보 글을 회차당 채널별 최대 1개 선택하고, 글 작성자 ID가 본인 채널 ID와 일치한 경우에만 본문을 추출한다. 치지직은 공식 채널 설명을 사용한다. PC의 치지직 직접 조회는 지연되어 기존 운영 서버의 공개 조회 기능으로 대조했고, 실제 보강 Worker는 Cloudflare에서 공식 채널을 직접 읽었다.

빈 칸만 추가하고 기존 제원·소개·이름·이미지·데뷔 날짜·시각·행사 종류는 보존했다. 팬닉을 팬덤명으로 바꾸거나, 게임 직업을 종족으로 해석하거나, 생일로 별자리를 계산하지 않는다. 이미지 OCR·AI 추론·팬 댓글 수집은 사용하지 않았다.

| 실제 반영한 프로필 | 추가한 값 |
| --- | --- |
| [바유.](https://vdebut.live/creator/bayu-soop) | 주요 콘텐츠: 발로란트, 배그, 마크 / 방송시간: 오후 8시 뱅온~💛 (휴뱅은 랜덤입니다!) |
| [금연남](https://vdebut.live/creator/geumyeonnam-soop) | 주요 콘텐츠: 발로란트 , 스팀게임 |
| [시니땅](https://vdebut.live/creator/shinittan-soop) | 혈액형: O형 |
| [요루네](https://vdebut.live/creator/yorune-soop) | 생일: 1월 2일 / MBTI: ISFP / 팬덤명: 쿤단 / 방송시간: 평일 pm10:30, 주말 pm03:00 (*자세한건 스케쥴 공지로 확인) |
| [하소o](https://vdebut.live/creator/haso-soop) | 방송시간: 오후 4시~ (사실 유동적일지두) |
| [이월이](https://vdebut.live/creator/iwol-soop) | 방송시간: 오후 4시~ 오후10시 까지? 컨디션에 따라 달라용! 자세히는 캘린더에 올릴예정입니다. |
| [우디디디](https://vdebut.live/creator/di6ixx-soop) | 혈액형: O형 |
| [단온](https://vdebut.live/creator/d00328-soop) | 생일: 3월 28일 |

단온의 `INTTTP`는 유효한 MBTI가 아니어서 미입력했다. 나머지 28명은 이번 공식 텍스트 조회에서 추가 확정할 값이 없어 기존 값을 유지했다. “36명 검사 완료”와 “모든 상세 항목 채움”은 다르다.

## 36명 검사 내역

| 날짜 | 이름 | 플랫폼 | 검사 결과 | 근거 |
| --- | --- | --- | --- | --- |
| 11-01 | 도스랑 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/329c5b387269565dbd53f2976d36bb9a) |
| 11-01 | 바유. | SOOP | 2항목 추가 | [공식 1](https://chapi.sooplive.co.kr/api/ruchar0526/station) · [공식 2](https://chapi.sooplive.co.kr/api/ruchar0526/title/211189699) |
| 11-01 | 하쿵 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/df15cb831b80356e79aab8bdb49ac577) |
| 11-03 | 이리나쨩 | CHZZK | 추가 확정값 없음·기존 유지 / 시간 미정 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/dbc5906d632b15ff5f226285eb68866d) |
| 11-04 | #쁠로라 | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/alsgurdl761/station) |
| 11-04 | 금연남 | SOOP | 1항목 추가 | [공식 1](https://chapi.sooplive.co.kr/api/gusdn1870/station) · [공식 2](https://chapi.sooplive.co.kr/api/gusdn1870/title/211133833) |
| 11-04 | 스티나_ | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/nsjanjsi12/station) |
| 11-04 | 아란 아누라 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/cd3b3bc8f8fe774cfcb375b31cc51beb) |
| 11-04 | 아루_ | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/s666666/station) |
| 11-05 | 뽀소리_ | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/bbosori/station) |
| 11-06 | 까망까맹 | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/dbrlshd123/station) |
| 11-06 | 코밍˚ | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/ghdlcom753/station) |
| 11-06 | 키싱유* | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/kwonyoa/station) |
| 11-07 | 다타 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/4e6514ed6f0eb092742b82f4658acdfd) |
| 11-07 | 리엔 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/0c6c55d7e02084398dd285fced5b7d4b) |
| 11-07 | 샤루루 | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/ire1113/station) |
| 11-07 | 소다* | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/xooooooo/station) |
| 11-07 | 시니땅 | SOOP | 1항목 추가 | [공식 1](https://chapi.sooplive.co.kr/api/chouzaigal/station) · [공식 2](https://chapi.sooplive.co.kr/api/chouzaigal/title/209788125) |
| 11-07 | 아사기리 유키 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/36c40736c07e554abd8ff99d86d27914) |
| 11-07 | 요루네 | SOOP | 4항목 추가 | [공식 1](https://chapi.sooplive.co.kr/api/dbsthduda/station) · [공식 2](https://chapi.sooplive.co.kr/api/dbsthduda/title/211929531) |
| 11-07 | 하늬_ | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/hanui2o/station) |
| 11-08 | 라임찌 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/161af422f3977b3687459d58a1a52066) |
| 11-08 | 초늘 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/1ab2064f691dbdad417c0da07365a2b3) |
| 11-08 | 하나마루 메이 | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/4ef5180fb79d3cf53bcb4cb3ce0796bc) |
| 11-08 | 하소o | SOOP | 1항목 추가 | [공식 1](https://chapi.sooplive.co.kr/api/hasooo/station) · [공식 2](https://chapi.sooplive.co.kr/api/hasooo/title/210882761) |
| 11-08 | 하이타 | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/haihito/station) |
| 11-08 | 혜성² | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/hyesung0410/station) · [공식 2](https://chapi.sooplive.co.kr/api/hyesung0410/title/206985019) |
| 11-09 | 이월이 | SOOP | 1항목 추가 | [공식 1](https://chapi.sooplive.co.kr/api/kovexo0209/station) · [공식 2](https://chapi.sooplive.co.kr/api/kovexo0209/title/211266269) |
| 11-09 | 하모예0 | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/hamoye0/station) |
| 11-09 | 해나롱 | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/urmuse512/station) |
| 11-10 | 에스냐 | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/retrona/station) |
| 11-11 | 꾼구마 | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/hasinyang/station) |
| 11-11 | 단온 | SOOP | 1항목 추가 | [공식 1](https://chapi.sooplive.co.kr/api/d00328/station) · [공식 2](https://chapi.sooplive.co.kr/api/d00328/title/211722281) |
| 11-11 | 마이 Mai | CHZZK | 추가 확정값 없음·기존 유지 | [공식 1](https://api.chzzk.naver.com/service/v1/channels/767f9cfb72885ff1c2979e5b2a1b6066) |
| 11-11 | 수지AI | SOOP | 추가 확정값 없음·기존 유지 | [공식 1](https://chapi.sooplive.co.kr/api/mentos1/station) · [공식 2](https://chapi.sooplive.co.kr/api/mentos1/title/211692685) |
| 11-11 | 우디디디 | SOOP | 1항목 추가 | [공식 1](https://chapi.sooplive.co.kr/api/di6ixx/station) · [공식 2](https://chapi.sooplive.co.kr/api/di6ixx/title/211756895) |

## 실행량·비용 제한·검증

- 이번 요청의 실제 서버 작업 10회: 기간 보강 7회(반복 확인 포함), 발굴 시험 3회(실패·수정 재시험 포함). 외부 조회 합계 160회, 조사 Worker 직접 D1 읽기 15,861행·쓰기 439행. 마감 기록·사이트 내부 재검증·수동 조회는 별도다.
- 기간 보강은 회차당 40회 제한 때문에 나눠 처리했다. 직접 관측한 예약 로그의 최대 CPU는 762ms였으며, 이 수치는 로그에 잡힌 회차의 관측값이다.
- 월 70회·외부 조회 40회/회차·CPU 5초·하위 요청 400개 제한 유지. 과거 보강 시험은 추가로 월 8회 제한. 유료 API·검색·AI·브라우저 서비스·새 DB·요금제 추가 없음.
- 별도 달러 청구 차단 장치는 없다. 기존 계정 포함량에 따른 실제 청구액은 아직 확인되지 않았다. 입력 원천을 늘려도 같은 조회 상한을 유지하므로 상세 처리량이 줄면 다음 회차로 넘긴다.
- 관련 자동화·포털 테스트 70개 통과, 수집기 범위 TypeScript 통과. 전체 백엔드는 이전부터 존재한 weeklySpecResearchService의 computeWikiDiffs 가져오기 오류가 있어 전체 빌드 성공으로 보고하지 않는다.
- 공개 프로필 435→435, 8명·12항목만 추가. 대상 외 427명은 응답 값 전체 동일. 기존 제원은 삭제·변경 없음. 36명 모두 공개 캘린더의 방송국 링크·일정과 대조했다.
- 실제 PC 전원 종료 시험은 하지 않았다. Cloudflare 자체 예약이 실행됐으며 PC에서 수집기를 계속 실행한 결과가 아니다.
- 정식 배포 버전 `088bd9d7-08e6-4eb2-9a53-c9e2e1fc6eca`. 시험용 분 단위 예약·만료 변수 제거. 매일 한국시간 09시·21시, 월요일 10시만 유지. PC 예약 중지 유지.
- 메인 하이라이트·캘린더·Header·Footer 및 화면 자산 변경 없음. 이번에 브라우저에서 모든 화면을 시각 점검한 것은 아니다.

## 아직 부족한 것과 다음 작업

1. **독립 신인 발굴 범위가 부족하다.** 현재 공식 소속사 2곳·SOOP 일정·기존 시트·공개 X 계정만 읽는다. 공개 X의 로그인 전 피드는 오래된 글·일부 글만 보일 수 있다. 별도 공개 목록에서 미스틱·겜작새·햄 킹·시오네 하루카 단서를 추가 확보했으나 원문·고유 방송국 검증 전이므로 검증된 신인 수에 합산하지 않았다.
2. **치지직 후보 발견과 일정 자동 공개 사이가 아직 완성되지 않았다.** 새 채널 2명을 식별했지만 이번 서버 경로는 정확한 데뷔 일시·첫 활동 범위까지 확정하지 못했다. 개인 공지와 공식 연결을 추가 확보하고 행사 종류·시간대가 맞아야 공개할 수 있다. 현재 상태를 치지직 전 과정 자동화 완료로 설명하지 않는다.
3. **텍스트에 없는 상세 정보는 채울 수 없다.** 추가 근거 없는 칸은 그대로 두었다. 다음 보강은 공식 프로필·소개 글의 지원 형식을 늘리는 작업이 우선이며, 이미지 추정·임의 제작으로 빈칸을 채우지 않는다.
4. **기존 행사 분류 정리가 필요하다.** SOOP 이적 4건이 기존 데뷔 목록에 남아 있다. 이전 승인 정보를 임의 삭제하지 않았으며, 이적을 별도 행사로 표시할 모델·화면 정책을 정리해야 한다.

## 수정 파일

- `backend/src/debutAutomation/sources.ts`: SOOP 실제 소개 필드와 공식 소속사 발굴 원천.
- `backend/src/debutAutomation/profileEnrichment.ts`: 본인 프로필 글·명시적 제원·방송시간 추출.
- `backend/src/debutAutomation/agency.ts`, `network.ts`: 이름 없는 공식 공지·방송국 연결과 제한된 외부 조회.
- `runner.ts`, `enrichment.ts`, `store.ts`, `policy.ts`, `debutAutomationWorker.ts`: 과거 범위 보강, 시간 미정 보존, 신규 고유 채널 실적, 날짜 없는 후보 보관, 비용·중복 방지.
- `backend/wrangler.debut-automation.jsonc`, 생성된 `env.d.ts`, `backend/tests/debutServerAutomation.test.cjs`: 설정·타입·검증.
- 월별 CSV·자동화 상태·운영 문서: 실제 공개 확인한 12항목만 T, 새 후보·추가 단서는 F로 보존.

서버 원본 실행 기록·원천 응답·비교 스냅샷은 `_workspace/discovery-audit-2026-11-12/`에 보관한다. 초기 실패·수정 재시험을 삭제하거나 성공으로 바꾸지 않았다. 특히 날짜 없는 후보가 보관 정리 대상에 잘못 포함되는 문제를 통합 시험에서 수정하고, 최종 DB 보존까지 다시 확인했다.
