import csv, json, pathlib, shutil, datetime

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
NOW = datetime.datetime.now(datetime.timezone.utc).astimezone(datetime.timezone(datetime.timedelta(hours=9))).isoformat(timespec='seconds')
load = lambda name: json.loads((HERE / name).read_text(encoding='utf-8'))
public = {p['slug']: p for p in load('public-final.json')['profiles']}
report = load('public-verification.json')
audit = load('final-db-audit.json')
candidates = {c['profile_slug']: c for c in audit[1]['results'] if c['profile_slug']}
files = {}
for month in ['2026-11', '2026-12']:
    for name in ['new-debuts.csv', 'profile-updates.csv', 'research-log.csv']:
        p = ROOT / 'vtuber-list' / month / name
        backup = HERE / 'csv-before-final-snapshot' / month / name
        backup.parent.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            shutil.copy2(p, backup)
        with p.open(encoding='utf-8-sig', newline='') as fp:
            reader = csv.DictReader(fp)
            files[(month, name)] = (reader.fieldnames, list(reader))

def write(month, name):
    header, rows = files[(month, name)]
    p = ROOT / 'vtuber-list' / month / name
    with p.open('w', encoding='utf-8-sig', newline='') as fp:
        writer = csv.DictWriter(fp, fieldnames=header, lineterminator='\r\n')
        writer.writeheader()
        writer.writerows(rows)
    raw = p.read_bytes()
    assert raw.startswith(b'\xef\xbb\xbf') and b'\n' not in raw.replace(b'\r\n', b'')
    assert all(len(row) == len(header) and row[header[-1]] in ['T', 'F'] for row in rows)

published_ids = []
for info in report['cohort']:
    p = public[info['slug']]
    c = candidates[p['slug']]
    assert c['status'] == 'PUBLIC_VERIFIED' and json.loads(c['managed_json']) == p
    month = p['debutDate'][:7]
    header, research = files[(month, 'research-log.csv')]
    matching = [r for r in research if p['channelUrl'].rstrip('/') == r['채널URL'].rstrip('/')]
    assert len(matching) == 1
    row = matching[0]
    first_written = row['작성일']
    published_ids.append(row['후보ID'])
    extra = json.loads(row['추가확인정보_JSON'] or '{}')
    if not isinstance(extra, dict):
        extra = {'previousEvidence': extra}
    extra['cloudflarePublication'] = {'candidateId': c['id'], 'scope': p['debutKind'], 'profileUrl': info['profileUrl'], 'verifiedAt': NOW, 'verification': '공개 프로필·공식 이미지 URL·방송국·달력 API 및 기본 KR 달력 색인 일치'}
    row.update({'활동명': p['displayName'], '기존프로필식별자': p['slug'], '등록대조': '신규 등록 후 운영DB·공개API 대조 완료', '행사분류': 'SOOP 플랫폼 데뷔', '일정확인상태': '공식 플랫폼 일정 확인', '확인된날짜': p['debutDate'], '확인된시간': p['debutTime'], '시간대': 'Asia/Seoul', '처리결과': 'Cloudflare 자동 등록·공개 확인', '확인시각': NOW, '보류제외사유': '', '기존등록조회시각': NOW, '추가확인정보_JSON': json.dumps(extra, ensure_ascii=False, separators=(',', ':')), '업데이트 여부 T/F': 'T'})
    assert row['작성일'] == first_written
    if '플랫폼 데뷔로 공개' not in row['근거요약']:
        row['근거요약'] += ' | Cloudflare 예약에서 공식 일정·채널·이미지 확인 후 SOOP 플랫폼 데뷔로 공개하고 실제 화면 자료 대조 완료.'
    header, new = files[(month, 'new-debuts.csv')]
    existing = next((r for r in new if r['채널URL*'].rstrip('/') == p['channelUrl'].rstrip('/')), None)
    values = {'작성일': existing['작성일'] if existing else first_written, '스트리머명*': p['displayName'], '플랫폼*': p['platform'], '채널URL*': p['channelUrl'], '데뷔날짜*': p['debutDate'] + ' (KST)', '데뷔시간*': p['debutTime'], '소속사': p['agency'], '국가코드': p['countryCode'], '소개글': p['description'], '프로필이미지URL': p['avatarUrl'], 'X(트위터)URL': p['xUrl'], '연락처이메일': '', '업데이트 여부 T/F': 'T'}
    if existing:
        existing.update(values)
    else:
        new.append(values)

before = {p['slug']: p for p in load('public-before.json')['profiles']}
for diff in report['diffs']:
    p = public[diff['slug']]
    month = p['debutDate'][:7]
    header, updates = files[(month, 'profile-updates.csv')]
    field = '데뷔 유형'
    c = candidates[p['slug']]
    seed = json.loads(c['seed'])
    value = 'SOOP 플랫폼 데뷔 (PLATFORM_DEBUT)' if p['debutKind'] == 'PLATFORM_DEBUT' else '기존 첫 데뷔 구분 유지 (FIRST_DEBUT)'
    old = next((r for r in updates if r['프로필식별자'] == p['slug'] and r['수정항목'] == field), None)
    row = {k: '' for k in header}
    row.update({'작성일': old['작성일'] if old else NOW[:10], '프로필식별자': p['slug'], '플랫폼': p['platform'], '채널URL': p['channelUrl'], '활동명': p['displayName'], '수정항목': field, '기존값': before[p['slug']].get('debutKind', '기존 이벤트 FIRST_DEBUT / 프로필 유형 미구분'), '변경값': value, '출처URL': seed['sourceUrl'], '확인시각': NOW, '검증상태': '운영 반영·공개 검증 완료', '비고': '기존 활동명·방송국·일정은 보존. Cloudflare 예약의 공식 출처 확인과 공개 이벤트 대조 완료.', '업데이트 여부 T/F': 'T'})
    if old:
        old.update(row)
    else:
        updates.append(row)

for month, name in files:
    write(month, name)
print(json.dumps({'publishedCandidateIds': published_ids, 'rows': {f'{m}/{n}': len(rows) for (m,n),(_,rows) in files.items()}}, ensure_ascii=False))
