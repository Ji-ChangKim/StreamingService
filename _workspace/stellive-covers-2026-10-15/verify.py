import json
import sqlite3
from pathlib import Path

# 운영의 대상 두 프로필 원본으로 메모리 DB를 구성한다.
root = Path(__file__).resolve().parent
before = json.loads((root / 'before.json').read_text(encoding='utf-8-sig'))
sql = (root.parents[1] / 'backend/migrations/0043_update_stellive_debut_covers.sql').read_text(encoding='utf-8')
db = sqlite3.connect(':memory:')
db.row_factory = sqlite3.Row
for table, result in zip(['portal_profiles', 'streamerChannel_info'], before[:2]):
    columns = list(result['results'][0])
    db.execute(f'CREATE TABLE {table} ({",".join(columns)})')
    for row in result['results']:
        db.execute(f'INSERT INTO {table} VALUES ({",".join("?" for _ in columns)})', list(row.values()))

# 같은 그룹의 대상 외 프로필도 조건에서 제외되는지 확인한다.
sentinel = dict(before[0]['results'][0])
sentinel['slug'] = 'untouched-member'
sentinel['data'] = json.dumps({**json.loads(sentinel['data']), 'slug': sentinel['slug']}, ensure_ascii=False)
db.execute(f'INSERT INTO portal_profiles VALUES ({",".join("?" for _ in sentinel)})', list(sentinel.values()))
expected = {'shizuki-toa': 'https://youtu.be/MZNKiadMo3U', 'cogane-rang': 'https://youtu.be/iAoU1UGPoXc'}
db.executescript(sql)
for row in before[0]['results']:
    original = json.loads(row['data'])
    changed = json.loads(db.execute('SELECT data FROM portal_profiles WHERE slug=?', (row['slug'],)).fetchone()['data'])
    assert changed['videoUrl'] == expected[row['slug']]
    assert changed['videoKind'] == 'COVER'
    assert changed['videoTitle'].startswith('데뷔 커버곡 · ')
    assert {k: v for k, v in changed.items() if k not in ['videoUrl', 'videoTitle', 'videoKind']} == {k: v for k, v in original.items() if k not in ['videoUrl', 'videoTitle', 'videoKind']}
for row in before[1]['results']:
    changed = dict(db.execute('SELECT * FROM streamerChannel_info WHERE slug=?', (row['slug'],)).fetchone())
    assert changed['video_url'] == expected[row['slug']]
    assert {k: v for k, v in changed.items() if k not in ['video_url', 'updated_at']} == {k: v for k, v in row.items() if k not in ['video_url', 'updated_at']}
assert dict(db.execute('SELECT * FROM portal_profiles WHERE slug=?', (sentinel['slug'],)).fetchone()) == sentinel

# 재실행해도 영상 내용이 바뀌지 않는지 확인한다.
first = [tuple(row) for row in db.execute('SELECT slug,data FROM portal_profiles ORDER BY slug')]
db.executescript(sql)
assert first == [tuple(row) for row in db.execute('SELECT slug,data FROM portal_profiles ORDER BY slug')]
print('검증 통과: 두 커버곡 매칭, 영상 외 필드 보존, 대상 외 보존, 재실행 일관성')
