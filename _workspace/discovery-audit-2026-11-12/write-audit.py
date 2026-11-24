import csv, hashlib, io, json, pathlib, re
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
AUDIT = pathlib.Path(__file__).resolve().parent
MONTH = ROOT / 'vtuber-list/2026-11'
TODAY = '2026-11-12'

def load(name):
    return json.loads((AUDIT / name).read_text(encoding='utf-8-sig'))

def read_csv(name):
    with (MONTH / name).open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        return reader.fieldnames, list(reader)

def save_csv(name, headers, rows):
    with (MONTH / name).open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers, lineterminator='\r\n')
        writer.writeheader()
        writer.writerows(rows)

def digest(name):
    return hashlib.sha256((AUDIT / name).read_bytes()).hexdigest()

before = load('public-before.json')['profiles']
profiles = {p['slug']: p for p in before}
public = load('public-verification.json')
replay = {r['slug']: r for r in load('enrichment-replay.json')}
database = load('db-final.json')
all_candidates = database[1]['results']
period_profiles = sorted((p for p in before if '2026-11-01' <= p.get('debutDate','') <= '2026-11-11'), key=lambda p:(p['debutDate'],p['displayName']))
completed = {c['profile_slug'] for c in all_candidates if json.loads(c['evidence'] or '{}').get('enrichmentCompletedWeek') == 'backfill:2026-11-01:2026-11-11'}
assert len(period_profiles) == 36 and all(p['slug'] in completed for p in period_profiles)
assert public['changedPeople'] == 8 and public['addedFields'] == 12

headers, updates = read_csv('profile-updates.csv')
old_update_flags = {(r['프로필식별자'],r['수정항목']):(r['작성일'],r['업데이트 여부 T/F']) for r in updates}
for change in public['changes']:
    p = profiles[change['slug']]
    for field in change['fields']:
        key = field['key']
        evidence = next(e['url'] for e in replay[p['slug']]['evidence'] if key in e['fields'])
        row = next((r for r in updates if r['프로필식별자'] == p['slug'] and r['수정항목'] == key), None)
        if row is None:
            row = dict.fromkeys(headers,'')
            row['작성일'] = TODAY
            updates.append(row)
        row.update({'프로필식별자':p['slug'],'플랫폼':p['platform'],'채널URL':p['channelUrl'],'활동명':p['displayName'],'수정항목':key,
                    '기존값':field['before'],'변경값':field['after'],'출처URL':evidence,'確認시각':'','확인시각':public['verifiedAt'],
                    '검증상태':'운영 반영·공개 프로필·캘린더 대조 완료','비고':'Cloudflare 과거 범위 보강. 빈 값만 추가, 기존 제원·소개·데뷔 일정 유지.','업데이트 여부 T/F':'T'})
        row.pop('確認시각',None)
save_csv('profile-updates.csv', headers, updates)

headers, research = read_csv('research-log.csv')
old_research_flags = {r['후보ID']:(r['작성일'],r['업데이트 여부 T/F']) for r in research}
charon_evidence = load('new-candidate-evidence.json')['channels']
charon_times = {'채랑':'15:00','아멜리':'16:00','나루':'17:00'}
charon_url = 'https://www.charonuniverse.com/notice/?bmode=view&idx=175425893'
for c in charon_evidence:
    row = next(r for r in research if c.get('id') and c['id'] in r['채널URL'])
    row.update({'일정확인상태':'시간 확보·최초 활동 범위 및 시간대 보류','확인된時間':'','확인된시간':charon_times[c['name']],
                '처리결과':'기존 보류 후보 재발견·공식 시작 시각 보완·미등록','확인시각':public['verifiedAt'],
                '근거요약':'11월 2일 조사했던 기존 후보. 공식 공지 목록에서 이름 없이 재발견했고, 11월 4일 공지의 11월 7일 시작 시각과 고유 방송국을 추가 확보했다.',
                '보류제외사유':'CLUEZ 신규 멤버 행사이며 전체 플랫폼 최초 활동 범위·행사 시간대 자동 확정 조건 미충족. 신규 발굴 실적에서 제외.'})
    row.pop('확인된時間',None)
    if charon_url not in row['출처URL']:
        row['출처URL'] += '\r\n' + charon_url
    row['추가확인정보_JSON'] = json.dumps({'previouslyResearchedAt':'2026-11-02','officialChannel':c.get('profile'),'automationCandidateOnly':True}, ensure_ascii=False)

new_people = [
    {'key':'CHZZK:9d4daff602a5e804d8b49a91671b6c16','name':'카이리 시엔','date':'2026-11-08','time':'19:00','notice':'https://x.com/KairiShien/status/2105583508576145912','file':'shien-notice.html'},
    {'key':'CHZZK:70c680e3922bebbd90969986c82d6b7c','name':'히라네코 리에','date':'','time':'20:00','notice':'https://x.com/HiranekoRie/status/2105855857275900277','file':'rie-notice.html'},
]
roster_url = 'https://x.com/revernia_kr/status/2112492682186727841'
for item in new_people:
    candidate = next(c for c in all_candidates if c['channel_key'] == item['key'] and c['source'] == 'AGENCY_NOTICE')
    assert candidate['status'] == 'HOLD'
    seed = json.loads(candidate['seed'])
    row = next((r for r in research if r['채널URL'] == seed['channelUrl']), None)
    if row is None:
        row = dict.fromkeys(headers,'')
        row.update({'작성일':TODAY,'후보ID':hashlib.sha256(item['key'].encode()).hexdigest()[:16],'업데이트 여부 T/F':'F'})
        research.append(row)
    row.update({'활동명':item['name'],'플랫폼':'CHZZK','채널URL':seed['channelUrl'],'등록대조':'11/12 공개 435명·기존 CSV·기존 서버 후보에 없음. 새 서버 후보 보존 확인.',
                '행사분류':'신규 데뷔 후보·최초 활동 범위 미확정','일정확인상태':'일부 일시 확인·시간대 및 범위 보류' if item['date'] else '연도·시간대·범위 보류',
                '대상월':'2026-11','확인된날짜':item['date'],'확인된시간':item['time'],'시간대':'','처리결과':'이름 없는 서버 발굴·후보 보존 완료·공개 미등록',
                '출처URL':roster_url+'\r\n'+item['notice'],'채널검증URL':f"https://api.chzzk.naver.com/service/v1/channels/{item['key'].split(':')[1]}",
                '확인시각':public['verifiedAt'],'근거요약':'공식 X 계정 → 본인 게시물에 포함된 고유 방송국 → 공식 채널 API 순으로 서버가 식별. 본인 데뷔 원문은 별도 대화 조사에서 추가 확인.',
                '보류제외사유':'서버 후보의 데뷔 일시는 공란 유지. 첫 방송 범위·시간대까지 미확정하여 프로필·캘린더 자동 공개하지 않음.',
                '추가확인정보_JSON':json.dumps({'serverCandidateId':candidate['id'],'firstSeenAt':candidate['first_seen_at'],'serverSeed':seed,'primaryNoticeMonthDay':'11-08','primaryNoticeYearExplicit':bool(item['date'])},ensure_ascii=False),
                '기존등록조회시각':public['verifiedAt'],'원문SHA256':digest(item['file']),'조사한계':'발굴과 공개 등록을 분리. 11월 7일 23:59 이벤트 종료를 데뷔일로 사용하지 않음. 전국 치지직 신인 전수 발굴 아님.'})

# 별도 공개 목록에서 나온 단서는 원문·방송국 미확인 상태로만 남긴다.
for name, claimed, url in [
    ('미스틱','2026-11-01','https://alti.work/creators/virtual:x:2082409397071089664'),
    ('겜작새','2026-11-01','https://alti.work/creators/virtual:x:2110164664705540096'),
    ('햄 킹','2026-11-02','https://alti.work/creators/virtual:x:2096152400667320320'),
    ('시오네 하루카','2026-11-08','https://alti.work/creators/virtual:x:2053205356302778368'),
]:
    ident='lead:'+hashlib.sha256(url.encode()).hexdigest()[:16]
    if any(r['후보ID']==ident for r in research):continue
    row=dict.fromkeys(headers,'')
    row.update({'작성일':TODAY,'후보ID':ident,'활동명':name,'등록대조':'방송국 고유 ID 미확인·이름만으로 동일인 판정하지 않음',
                '행사분류':'공개 목록의 데뷔 주장·원문 미확인','일정확인상태':'SOURCE_ONLY','대상월':'2026-11','처리결과':'추가 조사 단서·미등록',
                '출처URL':url,'확인시각':public['verifiedAt'],'근거요약':'알티 공개 데뷔 목록에서 발견. 해당 사이트는 방송 플랫폼을 X로만 표기하므로 치지직 채널로 단정하지 않음.',
                '보류제외사유':'원문·플랫폼·고유 채널·행사 종류·시각 검증 미완료.', '추가확인정보_JSON':json.dumps({'secondaryClaimedDate':claimed,'serverDiscovered':False},ensure_ascii=False),
                '조사한계':'검색/공개 목록 단서이며 검증된 신인 수와 서버 발굴 실적에 포함하지 않음.','업데이트 여부 T/F':'F'})
    research.append(row)
save_csv('research-log.csv', headers, research)
for row in research:
    if row['후보ID'] in old_research_flags:
        assert (row['작성일'],row['업데이트 여부 T/F']) == old_research_flags[row['후보ID']]

runs=[json.loads(r['summary']) for r in database[0]['results'] if r['slot'].startswith(('backfill:','discovery-test:'))]
successful = next(r for r in runs if r['slot'].endswith('2026-11-12.4'))
stats={'runs':len(runs),'external':sum(r['externalRequests'] for r in runs),'reads':sum(r['dbRowsRead'] for r in runs),'writes':sum(r['dbRowsWritten'] for r in runs)}
version=re.search(r'Current Version ID:\s*([^\s]+)',(AUDIT/'final-deploy.log').read_text(encoding='utf-8-sig')).group(1)

lines=[
 '# 11월 신인 발굴·프로필 자동 보강 실증 결과',
 '',
 '2026-11-12. 실행 기준 한국시간. 이번 주는 11월 9~15일이며, 프로필 보강 대상은 별도 요청한 11월 1~11일이다.',
 '',
 '**판정: 기존 7명 등록은 신규 발굴 실적이 아니었다. 이번 서버 시험에서는 기존 자료에 없던 치지직 채널 2명을 처음 식별해 후보 DB에 보존했다. 공개 등록은 0명이다. 기존 등록자 36명의 프로필 보강 검사를 완료했고 8명·12항목만 실제 추가했다. 전체 시장의 모든 신인을 수집했다고 판단할 수는 없다.**',
 '',
 '## 이름 없는 발굴이 실제로 되는가',
 '',
 '- 배포 전: 신규 치지직 채널 발굴 0명. 기존 서버 X 링크 16건은 신규 등록으로 이어지지 않았다.',
 '- 카론 유니버스 공지 목록은 이름·게시물 ID 없이 읽어 채랑·아멜리·나루를 찾았으나, 11월 2일 CSV의 기존 보류 후보여서 신규 실적에서 제외했다. 11월 7일 15·16·17시를 추가 확보했다.',
 '- 레버니아 홈페이지는 PC HTTP 200, Cloudflare HTTP 406이었다. 실패를 기록하고 해당 정기 경로는 중지했다. 별도로 공개된 공식 X 계정으로 조사했다. 접근 제한 우회·로그인·새 API 구매는 하지 않았다.',
 '- 실제 서버 입력: `https://x.com/revernia_kr` 한 개. 개인 이름·개인 채널 ID·개인 데뷔 게시물 ID를 설정하지 않았다.',
 '- 서버 처리: 공식 계정의 자기 게시물 링크 선택 → 첫 방송을 앞둔 멤버 안내의 방송국 링크 추출 → 치지직 공식 채널 API의 ID·현재 이름 대조 → D1 후보 보존.',
 f'- 근거 원문: [레버니아 공식 공지]({roster_url}). 이벤트 종료 2026.11.07 23:59는 데뷔일로 사용하지 않았다.',
 f'- 실제 완료 실행: `{successful["runId"]}`, 슬롯 `{successful["slot"]}`. 외부 {successful["externalRequests"]}회, 상태 `{successful["status"]}`. 새 고유 채널 2개를 확인하고 저장 후 DB 재조회에서 보존을 확인했다.',
 '',
 '| 처음 식별한 채널 | 방송국 | 별도 원문 조사 | 현재 처리 |',
 '| --- | --- | --- | --- |',
 '| 카이리 시엔 | [치지직](https://chzzk.naver.com/9d4daff602a5e804d8b49a91671b6c16) | 본인 공지에 2026.11.08 오후 7시. 시간대·최초 활동 범위 미확정 | 후보 HOLD, 공개 0 |',
 '| 히라네코 리에 | [치지직](https://chzzk.naver.com/70c680e3922bebbd90969986c82d6b7c) | 본인 공지에 11월 8일 오후 8시. 본문 연도·시간대 미표기 | 후보 HOLD, 공개 0 |',
 '',
 '서버가 읽은 소속사 공지는 고유 채널 식별 근거다. 위 개인 데뷔 게시물의 일시는 대화 중 별도 조사에서 읽은 값으로, 서버가 해당 일시까지 자동 확정했다고 설명하지 않는다. 두 후보의 서버 데뷔 일시는 공란이며, 본인 공지 검증·승인·프로필·캘린더 공개까지 완료한 사례도 아니다.',
 '',
 '## 사이트와 조사 결과가 같은가',
 '',
 '| 비교 범위 | 실제 결과 | 판단 |',
 '| --- | --- | --- |',
 '| 11/1~11/11 SOOP 공식 일정 26건 | 데뷔 21건·이적 5건 | 이적을 신인 데뷔로 합산하지 않음 |',
 '| SOOP 데뷔 21건 | 21명 모두 사이트 등록. 고유 채널·날짜·시각 21/21 일치 | 이 원천 내 신규 누락 0. 전체 버튜버 누락 0이라는 의미 아님 |',
 '| SOOP 이적 5건 | 기존 등록 4명, 치키쨩은 제외 상태 | 기존 4명은 행사 분류 보완 필요. 이번 제원 보강에서 일정·유형을 덮어쓰지 않음 |',
 '| 공식 채널 현재 활동명 | 샤루루→#샤루루, 에스냐→에스냐~, 혜성²→여농이오른팔; 하쿵→하쿵Hakung, 리엔→리엔 RIEN, 라임찌→라임찌Lime | 6명 차이. 기존 표기 보존, 자동 이름 변경하지 않음 |',
 '| 카론 후보 3명 | 기존 CSV에 있고 공개 사이트에는 없음. 공식 시각 추가 확보 | 재발견·기존 후보 보완 |',
 '| 레버니아 후보 2명 | 기존 CSV·공개 사이트·기존 서버 후보에 없음 | 이번 서버 신규 식별, 공개는 보류 |',
 '| 이번 주 11/9~11/15 SOOP 일정 16건 | 데뷔 14건은 모두 등록·날짜/시각 일치. 이적 2건은 데뷔 대상 제외 | 공식 원천 기준 비교 완료 |',
 '',
 '현재 사이트의 11월 1~11일 날짜를 가진 프로필은 36명(SOOP 25·치지직 11)이다. 여기에는 기존 이적 등록 4명과 시간 미정 1명이 포함되어 있어, 36명을 생애 첫 데뷔자로 단정하지 않는다.',
 '',
 '## 빈 프로필을 어떻게 채웠는가',
 '',
 'SOOP 실제 소개 필드 `station.display.profile_text`를 읽도록 수정했다. 공식 방송국 홈의 프로필·소개·정보 글을 회차당 채널별 최대 1개 선택하고, 글 작성자 ID가 본인 채널 ID와 일치한 경우에만 본문을 추출한다. 치지직은 공식 채널 설명을 사용한다. PC의 치지직 직접 조회는 지연되어 기존 운영 서버의 공개 조회 기능으로 대조했고, 실제 보강 Worker는 Cloudflare에서 공식 채널을 직접 읽었다.',
 '',
 '빈 칸만 추가하고 기존 제원·소개·이름·이미지·데뷔 날짜·시각·행사 종류는 보존했다. 팬닉을 팬덤명으로 바꾸거나, 게임 직업을 종족으로 해석하거나, 생일로 별자리를 계산하지 않는다. 이미지 OCR·AI 추론·팬 댓글 수집은 사용하지 않았다.',
 '',
 '| 실제 반영한 프로필 | 추가한 값 |',
 '| --- | --- |',
]
labels={'details.contentSummary':'주요 콘텐츠','details.bloodType':'혈액형','details.birthday':'생일','details.mbti':'MBTI','details.fandomName':'팬덤명','regularSchedule':'방송시간'}
for c in public['changes']:
    values=' / '.join(f"{labels.get(f['key'],f['key'])}: {f['after']}" for f in c['fields'])
    lines.append(f"| [{c['name']}](https://vdebut.live/creator/{c['slug']}) | {values} |")
lines += ['', '단온의 `INTTTP`는 유효한 MBTI가 아니어서 미입력했다. 나머지 28명은 이번 공식 텍스트 조회에서 추가 확정할 값이 없어 기존 값을 유지했다. “36명 검사 완료”와 “모든 상세 항목 채움”은 다르다.', '', '## 36명 검사 내역', '', '| 날짜 | 이름 | 플랫폼 | 검사 결과 | 근거 |', '| --- | --- | --- | --- | --- |']
changed={c['slug']:c for c in public['changes']}
for p in period_profiles:
    evidence=replay[p['slug']]['evidence']
    links=' · '.join(f'[공식 {i+1}]({e["url"]})' for i,e in enumerate(evidence))
    state=f"{len(changed[p['slug']]['fields'])}항목 추가" if p['slug'] in changed else '추가 확정값 없음·기존 유지'
    if p['dateState']=='TIME_TBD':state+=' / 시간 미정 유지'
    lines.append(f"| {p['debutDate'][5:]} | {p['displayName']} | {p['platform']} | {state} | {links} |")
lines += [
 '', '## 실행량·비용 제한·검증', '',
 f'- 이번 요청의 실제 서버 작업 {stats["runs"]}회: 기간 보강 7회(반복 확인 포함), 발굴 시험 3회(실패·수정 재시험 포함). 외부 조회 합계 {stats["external"]}회, 조사 Worker 직접 D1 읽기 {stats["reads"]:,}행·쓰기 {stats["writes"]:,}행. 마감 기록·사이트 내부 재검증·수동 조회는 별도다.',
 '- 기간 보강은 회차당 40회 제한 때문에 나눠 처리했다. 직접 관측한 예약 로그의 최대 CPU는 762ms였으며, 이 수치는 로그에 잡힌 회차의 관측값이다.',
 '- 월 70회·외부 조회 40회/회차·CPU 5초·하위 요청 400개 제한 유지. 과거 보강 시험은 추가로 월 8회 제한. 유료 API·검색·AI·브라우저 서비스·새 DB·요금제 추가 없음.',
 '- 별도 달러 청구 차단 장치는 없다. 기존 계정 포함량에 따른 실제 청구액은 아직 확인되지 않았다. 입력 원천을 늘려도 같은 조회 상한을 유지하므로 상세 처리량이 줄면 다음 회차로 넘긴다.',
 '- 관련 자동화·포털 테스트 70개 통과, 수집기 범위 TypeScript 통과. 전체 백엔드는 이전부터 존재한 weeklySpecResearchService의 computeWikiDiffs 가져오기 오류가 있어 전체 빌드 성공으로 보고하지 않는다.',
 '- 공개 프로필 435→435, 8명·12항목만 추가. 대상 외 427명은 응답 값 전체 동일. 기존 제원은 삭제·변경 없음. 36명 모두 공개 캘린더의 방송국 링크·일정과 대조했다.',
 '- 실제 PC 전원 종료 시험은 하지 않았다. Cloudflare 자체 예약이 실행됐으며 PC에서 수집기를 계속 실행한 결과가 아니다.',
 f'- 정식 배포 버전 `{version}`. 시험용 분 단위 예약·만료 변수 제거. 매일 한국시간 09시·21시, 월요일 10시만 유지. PC 예약 중지 유지.',
 '- 메인 하이라이트·캘린더·Header·Footer 및 화면 자산 변경 없음. 이번에 브라우저에서 모든 화면을 시각 점검한 것은 아니다.',
 '', '## 아직 부족한 것과 다음 작업', '',
 '1. **독립 신인 발굴 범위가 부족하다.** 현재 공식 소속사 2곳·SOOP 일정·기존 시트·공개 X 계정만 읽는다. 공개 X의 로그인 전 피드는 오래된 글·일부 글만 보일 수 있다. 별도 공개 목록에서 미스틱·겜작새·햄 킹·시오네 하루카 단서를 추가 확보했으나 원문·고유 방송국 검증 전이므로 검증된 신인 수에 합산하지 않았다.',
 '2. **치지직 후보 발견과 일정 자동 공개 사이가 아직 완성되지 않았다.** 새 채널 2명을 식별했지만 이번 서버 경로는 정확한 데뷔 일시·첫 활동 범위까지 확정하지 못했다. 개인 공지와 공식 연결을 추가 확보하고 행사 종류·시간대가 맞아야 공개할 수 있다. 현재 상태를 치지직 전 과정 자동화 완료로 설명하지 않는다.',
 '3. **텍스트에 없는 상세 정보는 채울 수 없다.** 추가 근거 없는 칸은 그대로 두었다. 다음 보강은 공식 프로필·소개 글의 지원 형식을 늘리는 작업이 우선이며, 이미지 추정·임의 제작으로 빈칸을 채우지 않는다.',
 '4. **기존 행사 분류 정리가 필요하다.** SOOP 이적 4건이 기존 데뷔 목록에 남아 있다. 이전 승인 정보를 임의 삭제하지 않았으며, 이적을 별도 행사로 표시할 모델·화면 정책을 정리해야 한다.',
 '', '## 수정 파일', '',
 '- `backend/src/debutAutomation/sources.ts`: SOOP 실제 소개 필드와 공식 소속사 발굴 원천.',
 '- `backend/src/debutAutomation/profileEnrichment.ts`: 본인 프로필 글·명시적 제원·방송시간 추출.',
 '- `backend/src/debutAutomation/agency.ts`, `network.ts`: 이름 없는 공식 공지·방송국 연결과 제한된 외부 조회.',
 '- `runner.ts`, `enrichment.ts`, `store.ts`, `policy.ts`, `debutAutomationWorker.ts`: 과거 범위 보강, 시간 미정 보존, 신규 고유 채널 실적, 날짜 없는 후보 보관, 비용·중복 방지.',
 '- `backend/wrangler.debut-automation.jsonc`, 생성된 `env.d.ts`, `backend/tests/debutServerAutomation.test.cjs`: 설정·타입·검증.',
 '- 월별 CSV·자동화 상태·운영 문서: 실제 공개 확인한 12항목만 T, 새 후보·추가 단서는 F로 보존.',
 '', '서버 원본 실행 기록·원천 응답·비교 스냅샷은 `_workspace/discovery-audit-2026-11-12/`에 보관한다. 초기 실패·수정 재시험을 삭제하거나 성공으로 바꾸지 않았다. 특히 날짜 없는 후보가 보관 정리 대상에 잘못 포함되는 문제를 통합 시험에서 수정하고, 최종 DB 보존까지 다시 확인했다.',
]
(ROOT/'docs/debut-discovery-audit-2026-11-12.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')

state_path=ROOT/'vtuber-list/automation-state.json'
state=json.loads(state_path.read_text(encoding='utf-8-sig'))
state['lastRunId']=successful['runId']
last=next(r for r in database[0]['results'] if r['id']==successful['runId'])
state['lastRunAt']=last['finished_at']
state['lastRunStatus']=successful['status']
state['lastRunSummary']={'audit':'2026-11-01~2026-11-11','checkedRegisteredProfiles':36,'updatedProfiles':8,'addedFields':12,'netNewChannels':2,'previouslyResearchedCandidates':3,'newPublicProfiles':0,'candidateHolds':5,'report':'docs/debut-discovery-audit-2026-11-12.md'}
state['cloudflare']['deploymentVersion']=version
state['cloudflare']['lastAudit']={'runId':successful['runId'],'stats':stats,'nativeNewChannelKeys':[x['key'] for x in new_people],'knownLimit':'치지직 후보 일시·최초 활동 범위 미확정, 공개 보류'}
state_path.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for name,count in [('new-debuts.csv',13),('profile-updates.csv',14),('research-log.csv',26)]:
    p=MONTH/name;raw=p.read_bytes();assert raw.startswith(b'\xef\xbb\xbf')
    rows=list(csv.reader(io.StringIO(raw.decode('utf-8-sig'),newline='')))
    assert all(len(r)==count for r in rows),name
    assert b'\n' not in raw.replace(b'\r\n',b''),name
print(json.dumps({'profileUpdates':len(updates),'researchRows':len(research),'publicFieldsAdded':12,'newCandidates':2,'registeredProfilesChecked':36,'stats':stats,'deployment':version},ensure_ascii=False))
