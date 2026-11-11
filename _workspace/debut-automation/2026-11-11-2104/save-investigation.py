import csv
import datetime as dt
import hashlib
import json
from pathlib import Path

ROOT = Path('vtuber-list')
WORK = Path('_workspace/debut-automation/2026-11-11-2104')
FILES = ['new-debuts.csv', 'profile-updates.csv', 'research-log.csv']
FLAG = '업데이트 여부 T/F'
NOW = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).isoformat(timespec='seconds')
CAL_URL = 'https://welcomevirtual.sooplive.com/api/api.php?work=getScheduleList&startDate=2026-11-04&endDate=2026-12-11'


def read_json(name):
    return json.loads((WORK / name).read_text(encoding='utf-8'))


tables, headers, prior_dates = {}, {}, {}
for month in ['2026-11', '2026-12']:
    tables[month] = {}
    for name in FILES:
        path = ROOT / month / name
        if path.exists():
            with path.open(encoding='utf-8-sig', newline='') as stream:
                reader = csv.DictReader(stream)
                headers[name] = reader.fieldnames
                tables[month][name] = list(reader)
        else:
            tables[month][name] = []
        prior_dates[month, name] = [r['작성일'] for r in tables[month][name]]

nov = tables['2026-11']
calendar = read_json('soop-calendar.json')['data']
calendar_hash = hashlib.sha256((WORK / 'soop-calendar.json').read_bytes()).hexdigest()
stations = {x['id']: x for x in read_json('station-verifications.json')}
public = read_json('profiles-after.json')['profiles']
public_soop = {x['channelUrl'].rstrip('/').split('/')[-1]: x for x in public if x['platform'] == 'SOOP'}
known = {r['채널URL'].rstrip('/').split('/')[-1]: r for t in tables.values() for r in t['research-log.csv'] if r['플랫폼'] == 'SOOP'}
new_rows, name_diffs = [], []

for item in calendar:
    sid = item['strm_id']
    row = known.get(sid)
    if row is None:
        row = {k: '' for k in headers['research-log.csv']}
        row.update({'작성일': '2026-11-11', '후보ID': hashlib.sha256(('SOOP:' + sid).encode()).hexdigest()[:16],
                    '활동명': item['strm_nick'], '플랫폼': 'SOOP', '채널URL': item['strm_img_link_path'],
                    '등록대조': '공개 API·운영 DB·심사대기 조회에서 기존 채널 없음',
                    '행사분류': 'SOOP 플랫폼 데뷔(공식 분류; 최초 활동 범위 미확인)',
                    '일정확인상태': 'FIXED_PLATFORM_SCOPE_HOLD', '대상월': item['schedule_dtm'][:7],
                    '확인된날짜': item['schedule_dtm'][:10], '확인된시간': item['schedule_dtm'][11:16],
                    '시간대': 'Asia/Seoul', '처리결과': '보류·플랫폼 데뷔와 FIRST_DEBUT 구분 필요',
                    '출처URL': CAL_URL + '\n' + stations[sid]['source'], '채널검증URL': stations[sid]['source'],
                    '공지일': item['reg_dtm'][:10], '확인시각': NOW,
                    '근거요약': f"공식 일정 idx={item['idx']}, debut, {item['schedule_dtm']}. 방송국 ID·활동명 일치. 이미지 수신·디코딩 확인.",
                    '보류제외사유': '공개 일정 모델이 FIRST_DEBUT로 고정되어 플랫폼 데뷔만 확인한 후보를 정확히 표현하지 못함. 최초 활동 범위와 이미지 내용 검토 완료 전 자동 공개 보류.',
                    '원문SHA256': calendar_hash, '기존등록조회시각': NOW,
                    '업로드주의사항': '조사 보류 F. 신규 등록 CSV 제외. 실제 등록·승인 미실행. 미확인 제원·소속·국적 추정 금지.',
                    '조사한계': '공식 플랫폼 데뷔 분류이며 전 플랫폼 최초 활동·방송 완료를 입증하지 않음.', FLAG: 'F'})
        if sid == '02yeon':
            row['출처URL'] += '\nhttps://www.sooplive.com/station/02yeon/post/211606891\nhttps://www.sooplive.com/station/02yeon/post/211696241'
            row['근거요약'] += ' 본인 변경 공지에서 11/15 12:00 확인. 이전 11/8 계획을 현재 일정으로 사용하지 않음.'
        if sid == 'ham2ko':
            row['출처URL'] += '\nhttps://www.sooplive.com/station/ham2ko/post/212302551'
            row['근거요약'] += ' 11/11 본인 공지에서 12/6 18:00 확인.'
        tables[row['대상월']]['research-log.csv'].append(row)
        new_rows.append(row)
    else:
        row['확인시각'] = NOW
        if row['활동명'] != item['strm_nick'] and item['schedule_type'] == 'debut':
            row['활동명'] = item['strm_nick']
            row[FLAG] = 'F'
            row['처리결과'] = '보류·공식 활동명 변경 제안; 운영 정보 유지'
    if sid in public_soop and public_soop[sid]['displayName'] != item['strm_nick']:
        name_diffs.append((public_soop[sid], item, stations[sid]))
    info = json.loads(row['추가확인정보_JSON']) if row['추가확인정보_JSON'] else {}
    info['lastAutomationCheck'] = {'runId': '2026-11-11-2104', 'checkedAt': NOW, 'calendarIdx': item['idx'],
                                   'calendarType': item['schedule_type'], 'calendarName': item['strm_nick'],
                                   'calendarDateTime': item['schedule_dtm'], 'sourceUrl': CAL_URL,
                                   'calendarResponseSha256': calendar_hash, 'publicExists': sid in public_soop,
                                   'imageDecoded': bool(stations.get(sid, {}).get('imageSize'))}
    row['추가확인정보_JSON'] = json.dumps(info, ensure_ascii=False, separators=(',', ':'))

for name, sid, actor, date, time, post, published, reason in [
    ('메이 (MeiBella)', 'c70a5ee8abd3db9f79a683ab4548b5f0', 'V_Meibella', '2026-11-18', '18:00', '2111283121006194692', '2026-10-17', '본인 프로필에 해외 거주·시차 1시간 명시. 18:00이 KST인지 확인되지 않으며 최초 활동 범위도 미확인.'),
    ('리몬', 'c494032bc0a0748e474082996c939620', 'limon_lumen', '2026-11-21', '19:00', '2116903503709061572', '2026-11-01', '본인 공지의 일시·고유 채널 연결은 확인. KST 명시 및 최초 버튜버 활동 범위 검증 미완료.')]:
    matches = [r for r in nov['research-log.csv'] if sid in r['채널URL']]
    assert len(matches) <= 1
    if matches:
        row = matches[0]
    else:
        row = {k: '' for k in headers['research-log.csv']}
        row['작성일'] = '2026-11-11'
        row['후보ID'] = hashlib.sha256(('CHZZK:' + sid).encode()).hexdigest()[:16]
        nov['research-log.csv'].append(row)
        new_rows.append(row)
    row.update({'활동명': name, '플랫폼': 'CHZZK', '채널URL': 'https://chzzk.naver.com/' + sid,
                '등록대조': '공개 프로필·운영 채널 인덱스·구형 채널·심사대기 조회에서 기존 없음',
                '행사분류': '본인 첫 방송·데뷔 공지 후보(활동 범위 확인 필요)', '일정확인상태': 'TIMEZONE_SCOPE_HOLD',
                '대상월': '2026-11', '확인된날짜': date, '확인된시간': time, '시간대': '',
                '처리결과': '보류·시간대 및 최초 활동 범위 추가 확인',
                '출처URL': f'https://x.com/{actor}/status/{post}\nhttps://x.com/{actor}',
                '채널검증URL': 'https://api.chzzk.naver.com/service/v1/channels/' + sid,
                '공지일': published, '확인시각': NOW, '기존등록조회시각': NOW,
                '근거요약': f'본인 X 원문 열람. {date} {time} 공지, 본인 링크의 고유 채널과 공식 채널 존재 확인. 시간은 원문 표기이며 KST 확정값 아님.',
                '보류제외사유': reason, '업로드주의사항': '보류 F. 시간대·활동 범위 확인 전 신규 등록 CSV 제외.',
                '조사한계': '공개 검색 12회 범위의 조사. 과거 모든 활동 부재·전체 채널 전수조사를 입증하지 않음.', FLAG: 'F'})

for live, item, meta in name_diffs:
    found = [r for r in nov['profile-updates.csv'] if r['프로필식별자'] == live['slug'] and r['수정항목'] in ['displayName', '활동명']]
    assert len(found) <= 1
    if found:
        row = found[0]
    else:
        row = {k: '' for k in headers['profile-updates.csv']}
        row['작성일'] = '2026-11-11'
        nov['profile-updates.csv'].append(row)
    row.update({'프로필식별자': live['slug'], '플랫폼': 'SOOP', '채널URL': live['channelUrl'],
                '활동명': item['strm_nick'], '수정항목': 'displayName', '기존값': live['displayName'],
                '변경값': item['strm_nick'], '출처URL': meta['source'] + '\n' + CAL_URL, '공지일': '',
                '확인시각': NOW, '검증상태': '공식 방송국·캘린더 일치 / 운영 반영 보류',
                '비고': '운영자가 정한 표시명을 자동 덮어쓰지 않음. # 등 표기 변형 포함.', FLAG: 'F'})

change = read_json('avatar-change.json')
live = change['afterProfile']
row = next(r for r in nov['new-debuts.csv'] if r['채널URL*'] == live['channelUrl'])
row['프로필이미지URL'] = live['avatarUrl']
row[FLAG] = 'T'
row = next(r for r in nov['research-log.csv'] if r['기존프로필식별자'] == 'amyang-chzzk')
row['확인시각'] = NOW
row['근거요약'] += ' 11/11 21시 정기 조사: 공식 이미지 변경을 검토하고 최근 승인 원문과 동일할 때만 갱신. 공개 프로필·캘린더 반영 확인.'
row[FLAG] = 'T'
row = {k: '' for k in headers['profile-updates.csv']}
row.update({'작성일': '2026-11-11', '프로필식별자': live['slug'], '플랫폼': 'CHZZK', '채널URL': live['channelUrl'],
            '활동명': live['displayName'], '수정항목': 'avatarUrl', '기존값': change['before'], '변경값': change['after'],
            '출처URL': 'https://api.chzzk.naver.com/service/v1/channels/037d7ba305538de29dbf2789071dbb82\nhttps://x.com/_amyangyang',
            '확인시각': NOW, '검증상태': '공식 이미지 검토·운영 반영·공개 프로필 및 캘린더 일치',
            '비고': '기존 채널·일정·활동권역·이름·기타 내용 유지. 수정 전 원문과 최근 승인 내용 동일 확인.', FLAG: 'T'})
nov['profile-updates.csv'].append(row)

assert len(new_rows) == 8
assert len(name_diffs) == 3
assert all(r[FLAG] == 'F' for r in new_rows)
for month, table in tables.items():
    (ROOT / month).mkdir(exist_ok=True)
    for name, columns in zip(FILES, [13, 14, 26]):
        assert [r['작성일'] for r in table[name]][:len(prior_dates[month, name])] == prior_dates[month, name]
        for row in table[name]:
            for key, value in row.items():
                row[key] = value.replace('\r\n', '\n').replace('\r', '\n').replace('\n', '\r\n')
        path = ROOT / month / name
        with path.open('w', encoding='utf-8-sig', newline='') as stream:
            writer = csv.DictWriter(stream, fieldnames=headers[name], lineterminator='\r\n')
            writer.writeheader()
            writer.writerows(table[name])
        raw = path.read_bytes()
        assert raw.startswith(b'\xef\xbb\xbf') and b'\n' not in raw.replace(b'\r\n', b'')
        with path.open(encoding='utf-8-sig', newline='') as stream:
            assert all(len(row) == columns for row in csv.reader(stream))
        print(month, name, len(table[name]))
all_logs = [r for t in tables.values() for r in t['research-log.csv']]
assert len({r['후보ID'] for r in all_logs}) == len(all_logs)

summary = {'runId': '2026-11-11-2104', 'startedAt': '2026-11-11T21:04:43+09:00', 'completedAt': NOW,
           'status': 'PARTIAL', 'dateWindow': {'start': '2026-11-04', 'end': '2026-12-11', 'timezone': 'Asia/Seoul'},
           'counts': {'webQueries': 12, 'officialSoopSchedules': 39, 'officialSoopDebutSchedules': 33,
                      'officialSoopTransfers': 6, 'newCandidates': 8, 'newSoopCandidates': 7, 'newChzzkCandidates': 1,
                      'existingMeibellaReverified': 1, 'newPublicRegistrations': 0, 'publicCorrectionsApplied': 1,
                      'publicCorrectionsProposed': 3, 'newCandidatesHeld': 8, 'imminentProfilesChecked': 13,
                      'imminentSchedulesPrimaryConfirmed': 12, 'imminentSchedulePrimaryUnconfirmed': 1,
                      'publicProfilesUnchangedExceptAvatar': 427},
           'newCandidates': [{k: r[k] for k in ['후보ID', '활동명', '플랫폼', '채널URL', '확인된날짜', '확인된시간', '시간대', '출처URL', '보류제외사유']} for r in new_rows],
           'nameDifferences': [{'slug': live['slug'], 'old': live['displayName'], 'proposed': item['strm_nick']} for live, item, meta in name_diffs],
           'sourceLimitations': ['X 웹 조회 6건 실패. 공개 브라우저에서 기존 3명·신규/보류 2명의 본인 공지 확인으로 보완. X API 검색을 실행한 것은 아님.',
                                 '마이 Mai는 공식 채널·이미지·공개 일정은 확인했으나 이번에 본인 일정 원문을 확인하지 못함.',
                                 'SOOP 플랫폼 데뷔와 FIRST_DEBUT 공개 모델 구분 미비로 신규 SOOP 7건 공개 보류. 기존 transfer 4건도 구분 필요.',
                                 '리몬·기존 메이벨라는 시간대·최초 활동 범위 확인 필요. 메이벨라는 해외 거주를 명시해 KST 추정 금지.'],
           'recoveredErrors': ['첫 운영 DB 중복 조회 실패 후 재시도 성공.'],
           'runtime': '이 채팅의 데스크톱 예약 조사. 서버 수집기 신규 배포 없음.'}
(WORK / 'run-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
state = {'automationId': 'automation', 'lastRunId': summary['runId'], 'lastRunAt': NOW, 'lastRunStatus': 'PARTIAL',
         'lastSoopSourceSuccessAt': NOW, 'lastPublicSiteSuccessAt': NOW, 'lastCommunitySheetSuccessAt': NOW,
         'lastRunSummary': '_workspace/debut-automation/2026-11-11-2104/run-summary.json',
         'nextDateSearchCursor': '2026-11-21', 'pendingCandidateIds': [r['후보ID'] for r in new_rows],
         'existingPendingCandidatesReverified': ['f7ad8e9b7ceb0dd5'],
         'pendingProfileNames': [live['slug'] for live, item, meta in name_diffs],
         'primaryScheduleRecheckNeeded': ['mai-chzzk'],
         'blockingModelGap': '플랫폼 데뷔·이적을 FIRST_DEBUT와 구분하는 공개 데이터 모델 필요',
         'deferredLeads': [
             {'name': '시라나미 우유루', 'dateHint': '2026-12-12', 'reason': '범위 밖. 재게시 단서만 확인', 'source': 'https://teapaw.org/vvw_kr'},
             {'name': '쿠로세 유우', 'monthHint': '2026-12', 'reason': '일시·본인 원문·채널 미확인', 'source': 'https://instalker.org/Gnomb_'},
             {'name': '강지은', 'monthHint': '2026-12', 'reason': '3D 공개 단서. 정확한 일시·행사 범위 원문 미확인', 'source': 'https://xitter.cf/zdmss_'},
             {'name': '옥토', 'dateHint': '11/22 14:00', 'reason': '재게시만 확인. 본인·연도·채널 미확인', 'source': 'https://mobile.twstalker.com/VtuberDebutBot'},
             {'name': None, 'dateHint': '11/25 19:00', 'reason': '재게시 단서의 주체·연도·채널 미확인', 'source': 'https://instalker.org/VtuberDebutBot'}]}
(ROOT / 'automation-state.json').write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
print('새 후보 8명 F, 기존 메이벨라 재확인, 실제 이미지 수정 1건 T, 활동명 제안 3건 F.')
