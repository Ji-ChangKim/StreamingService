import csv
import io
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

root = Path(__file__).resolve().parents[2]
work = Path(__file__).resolve().parent
manifest = json.loads((work / 'repair-manifest.json').read_text(encoding='utf-8'))
backup = json.loads((work / 'db-before-clean.json').read_text(encoding='utf-8'))
targets = {r['slug']: r for r in json.loads((work / 'repair-targets.json').read_text(encoding='utf-8'))}
verified = json.loads((work / 'db-after.json').read_text(encoding='utf-8'))
checked_at = datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')
created_at = '2026-11-06'


# 기존 바이트를 그대로 두고 신규 기록만 덧붙여 작성일과 T/F를 보존한다.
def append_rows(name, additions, keys):
    file = root / 'vtuber-list' / '2026-11' / name
    original = file.read_bytes()
    existing = list(csv.DictReader(io.StringIO(original.decode('utf-8-sig'))))
    fields = list(existing[0])
    existing_keys = {tuple(row[k] for k in keys) for row in existing}
    additions = [row for row in additions if tuple(row[k] for k in keys) not in existing_keys]
    output = io.StringIO(newline='')
    writer = csv.DictWriter(output, fields, quoting=csv.QUOTE_ALL, lineterminator='\r\n')
    writer.writerows(additions)
    assert original.endswith(b'\r\n')
    file.write_bytes(original + output.getvalue().encode('utf-8'))
    actual = list(csv.DictReader(io.StringIO(file.read_text(encoding='utf-8-sig'))))
    assert actual[:len(existing)] == existing
    assert len({tuple(row[k] for k in keys) for row in actual}) == len(actual)
    assert all(len(row) == len(fields) and row['업데이트 여부 T/F'] in ['T', 'F'] for row in actual)
    print(name, 'added', len(additions), 'total', len(actual))


updates = []
logs = []
for repair in manifest['rows']:
    slug = repair['slug']
    profile = targets[slug]
    old = next(r for r in backup[0]['results'] if r['slug'] == slug)
    actual = next(r for r in verified[0]['results'] if r['slug'] == slug)
    assert actual['profile_image_url'] == repair['avatarUrl']
    assert actual['channel_url'] == repair['channelUrl']
    for field, before, after in [('avatarUrl', repair['beforeAvatar'], repair['avatarUrl']), ('channelUrl', repair['beforeChannel'], repair['channelUrl'])]:
        if before == after:
            continue
        updates.append({'작성일': created_at, '프로필식별자': slug, '플랫폼': profile['platform'], '채널URL': repair['channelUrl'], '활동명': repair['name'], '수정항목': field, '기존값': before, '변경값': after, '출처URL': repair['source'], '공지일': '', '확인시각': checked_at, '검증상태': '공식 채널·이미지 확인·운영 DB 재조회 완료', '비고': '사용자 요청으로 0059 SQL 단독 반영. 레거시 channel_url의 수정 전 값: ' + old['channel_url'] + '. 공개 검토 상태와 기존 소개·일정 보존.', '업데이트 여부 T/F': 'T'})
    logs.append({'작성일': created_at, '후보ID': 'image-repair:' + slug, '활동명': repair['name'], '플랫폼': profile['platform'], '채널URL': repair['channelUrl'], '기존프로필식별자': slug, '등록대조': '운영 D1 원문·공개 API 대조', '행사분류': '방송국·프로필 이미지 정정', '일정확인상태': '기존 일정 보존', '대상월': profile['targetMonth'], '확인된날짜': '', '확인된시간': '', '시간대': profile['timezone'], '처리결과': '사용자 요청으로 운영 반영·재조회 완료', '출처URL': repair['source'], '채널검증URL': repair['channelUrl'], '공지일': '', '확인시각': checked_at, '근거요약': '공식 채널의 최신 이미지 및 정규 채널 주소 확인. 이미지 HTTP·시그니처·Chrome 디코딩 확인. DB 수정값 일치 확인.', '보류제외사유': '', '추가확인정보_JSON': json.dumps({'avatarUrl': repair['avatarUrl']}, ensure_ascii=False), '기존등록조회시각': checked_at, '원문SHA256': '', '업로드주의사항': '이미 반영했으므로 전체 조사 CSV를 다시 업로드하지 않음.', '조사한계': '데뷔 일정·활동명·소개는 재조사하거나 수정하지 않음. 같은 채널로 정규화한 중복 원본 행은 삭제하지 않음.', '업데이트 여부 T/F': 'T'})

reasons = {'beria': '기존 치지직 API channelId·이미지가 null이고 채널명은 알 수 없음. 공식 검색에서 대체 채널 확정 불가.', 'mahoya-kina': '기존 치지직 API channelId·이미지가 null. 공식 활동명 검색 결과 없음. 대체 채널 확정 불가.', 'jikii-vt': 'Twitch 공식 공개 API의 user가 null. 기존 계정의 현재 프로필·대체 방송국 확인 불가.'}
for slug, reason in reasons.items():
    profile = targets[slug]
    logs.append({'작성일': created_at, '후보ID': 'image-repair:' + slug, '활동명': profile['displayName'], '플랫폼': profile['platform'], '채널URL': profile['channelUrl'], '기존프로필식별자': slug, '등록대조': '운영 공개 프로필 확인', '행사분류': '방송국·프로필 이미지 정정', '일정확인상태': '기존 일정 보존', '대상월': profile['targetMonth'], '확인된날짜': '', '확인된시간': '', '시간대': profile['timezone'], '처리결과': '보류·미반영', '출처URL': profile['channelUrl'], '채널검증URL': profile['channelUrl'], '공지일': '', '확인시각': checked_at, '근거요약': reason, '보류제외사유': '본인 채널의 현재 주소를 확인할 공식 근거 필요.', '추가확인정보_JSON': '', '기존등록조회시각': checked_at, '원문SHA256': '', '업로드주의사항': '유사 활동명의 다른 채널로 임의 연결하지 않음.', '조사한계': '채널 삭제·정지·핸들 변경 중 원인 확정 불가.', '업데이트 여부 T/F': 'F'})

append_rows('profile-updates.csv', updates, ['프로필식별자', '수정항목'])
append_rows('research-log.csv', logs, ['후보ID'])
