const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const E = require('../scripts/debut-investigation/debut-evidence.cjs');
const S = require('../scripts/debut-investigation/debut-sources.cjs');
const R = require('../scripts/debut-investigation/debut-report.cjs');
const I = require('../scripts/investigate_debuts.cjs');
const now = new Date('2026-10-18T00:00:00Z');
const id = 'a'.repeat(32);
const channel = `https://chzzk.naver.com/${id}`;
const header = ['머리말', '머리말', '머리말', '머리말', ',날짜,시간,분,이름,방송 링크,트위터 ID,하고싶은말'].join('\n');
const fixture = `${header}\n,2026.10.24,20시,0분,검토 후보,${channel},@test,"2026.10.24 오후 8시 2.0 데뷔"\n`;

// 허용한 원본 외 요청은 테스트 중에도 실패시켜 DB·임의 호스트 접근을 막는다.
function sheetOnly(url, options) {
  return url === S.SHEET_URL && options.method === 'GET' ? Promise.resolve(new Response(fixture, { headers: { 'Content-Type': 'text/csv' } })) : Promise.reject(new Error('UNEXPECTED_NETWORK_REQUEST'));
}

// 여러 검증에서 동일한 순수 후보를 사용한다.
function sample(text = '2026.10.24 오후 8시 2.0 데뷔') {
  return R.candidate({ displayName: '검토 후보', rawChannelUrl: channel, sourceActor: '@test', text, rawDate: '2026.10.24', debutDate: '2026-10-24', debutTime: '20:00', source: { sourceId: 'fixture', authority: 'COMMUNITY_UNVERIFIED', contentHash: E.hash(text), excerpt: E.excerpt(text), url: 'https://example.invalid/evidence' } }, E.channel(channel));
}

// 행사 단어를 구분하고 모델 공개가 첫 데뷔로 바뀌지 않는지 확인한다.
for (const [text, expected] of [['10월 24일 첫 데뷔 방송', 'FIRST_DEBUT'], ['10월 24일 재데뷔', 'RE_DEBUT'], ['RE-DEBUT', 'RE_DEBUT'], ['2.0 데뷔', 'MODEL_2_0'], ['1.0 데뷔합니다 기존 버추얼로 활동하다 탈바꿈', 'MODEL_REVEAL'], ['3D 데뷔 방송', 'DEBUT_3D'], ['신의상 공개', 'NEW_OUTFIT'], ['new outfit', 'NEW_OUTFIT'], ['복귀 방송', 'RETURN'], ['새로운 밥 친구', 'VERIFY'], ['재데뷔가 아닌 일정입니다', 'VERIFY'], ['3D 신의상 공개', 'MULTIPLE'], ['기존 활동하던 버튜버의 첫 방송', 'VERIFY']]) test(`행사 분류: ${expected} / ${text}`, () => assert.deepEqual([E.classify(text).eventType, E.classify(text).firstDebutVerified], [expected, false]));

// 실제 달력과 오전·오후·미정 표기를 구분한다.
for (const [value, expected] of [['2026-02-30', false], ['2026-99-01', false], ['2026-00-01', false], ['2024-02-29', true], ['2026-10-24', true], ['', false], [null, false]]) test(`달력 날짜: ${value}`, () => assert.equal(E.validDate(value), expected));
test('KST 자정에 조사 날짜가 바뀐다', () => assert.equal(S.windowFor(new Date('2026-10-17T15:00:00Z')).today, '2026-10-18'));
test('시간 미정과 25시는 채우지 않는다', () => assert.deepEqual([E.normalizeTime('미정'), E.normalizeTime('25'), E.normalizeTime('20', '60')], [null, null, null]));
test('오전 12시와 오후 12시를 구분한다', () => assert.deepEqual(E.textTimes('오전 12시, 오후 12시, 오후 5시 30분'), ['00:00', '12:00', '17:30']));
test('연도가 없는 본문에 현재 연도를 추측하지 않는다', () => assert.deepEqual(E.textDates('10월 24일 첫 방송'), []));

// 채널 ID를 정규화하며 악성·잘린·타 플랫폼 주소를 거부한다.
test('community와 live 주소가 같은 채널로 정규화된다', () => assert.deepEqual([E.channel(`${channel}/community`).url, E.channel(`https://chzzk.naver.com/live/${id}`).url], [channel, channel]));
for (const url of ['https://chzzk.naver.com.evil.test/' + id, 'https://user@chzzk.naver.com/' + id, 'https://chzzk.naver.com:8080/' + id, 'file:///etc/passwd', 'https://127.0.0.1/private']) test(`허용하지 않는 주소: ${url}`, () => assert.equal(E.channel(url).channelId, null));
test('잘린 채널 ID는 형식 실패다', () => assert.equal(E.channel(channel.slice(0, -1)).status, 'INVALID_CHANNEL_ID'));
test('YouTube 주소를 치지직으로 추정하지 않는다', () => assert.equal(E.channel('https://youtube.com/@test').platform, 'OTHER'));
test('단축 주소가 사설 서버를 가리켜도 조회하지 않는다', () => Promise.resolve([]).then((calls) => S.resolveChannel('https://chzzk.me/test', (url) => Promise.resolve(calls.push(url)).then(() => new Response(null, { status: 302, headers: { Location: 'https://127.0.0.1/private' } }))).then((result) => assert.deepEqual([calls.length, result.channelId], [1, null]))));
test('단축 주소의 순환은 세 번에서 종료한다', () => Promise.resolve([]).then((calls) => S.resolveChannel('https://chzzk.me/test', (url) => Promise.resolve(calls.push(url)).then(() => new Response(null, { status: 302, headers: { Location: url } }))).then((result) => assert.deepEqual([calls.length, result.status], [3, 'REDIRECT_LIMIT']))));

// CSV 파서와 소스 계약이 원문 손상을 성공으로 숨기지 않는지 확인한다.
test('공지 본문 열의 줄바꿈·쉼표·따옴표가 보존된다', () => assert.equal(S.parseSheet(`${header}\n,2026.10.24,20,0,후보,${channel},@test,"첫 방송,\n""환영"""`, now).seeds[0].text, '첫 방송,\n"환영"'));
test('필수 머리말 변경은 실패한다', () => assert.throws(() => S.parseSheet(fixture.replace('방송 링크', '다른 열'), now), /SHEET_HEADER_CHANGED/));
test('빈 원본과 HTML은 실패한다', () => assert.throws(() => S.parseSheet('<html>login</html>', now), /SHEET_NOT_CSV/));
test('원문 크기 초과는 취소된다', () => assert.rejects(S.responseText(new Response('x'.repeat(100)), 20), /SOURCE_TOO_LARGE/));
test('Google 원본의 외부 리다이렉트는 따르지 않는다', () => assert.rejects(S.googleCsv(() => Promise.resolve(new Response(null, { status: 302, headers: { Location: 'https://evil.test/source' } }))), /SHEET_REDIRECT_HOST_BLOCKED/));

// API 키가 없을 때 실제 조회를 수행하거나 인증된 것처럼 표시하면 안 된다.
test('API 키가 없으면 소스 상태가 미설정이다', () => Promise.all([S.collectX({}, now, () => assert.fail('X 통신 금지')), S.verifyChannels([sample()], {}, () => assert.fail('채널 통신 금지'))]).then((results) => assert.deepEqual(results.map((result) => result.status), ['NOT_CONFIGURED', 'NOT_CONFIGURED'])));
test('불완전한 치지직 인증은 실패로 보고한다', () => S.verifyChannels([sample()], { CHZZK_CLIENT_ID: 'test' }, () => assert.fail('불완전한 인증 통신 금지')).then((result) => assert.equal(result.status, 'FAILED')));
test('X 인증 오류·원문·토큰을 결과에 노출하지 않는다', () => S.collectX({ X_BEARER_TOKEN: 'secret-test-value' }, now, () => Promise.resolve(new Response('secret-test-value', { status: 401 }))).then((result) => assert.deepEqual([result.status, result.reason, JSON.stringify(result).includes('secret-test-value')], ['FAILED', 'SOURCE_HTTP_401', false])));
test('X 검색은 지정한 공식 주소에만 GET을 보낸다', () => S.collectX({ X_BEARER_TOKEN: 'test-token' }, now, (url, options) => Promise.resolve(assert.deepEqual([new URL(url).origin, options.method, options.redirect], ['https://api.x.com', 'GET', 'error'])).then(() => Response.json({ meta: { result_count: 0 } }))).then((result) => assert.deepEqual([result.status, result.queryCount, result.seeds.length], ['OK', 2, 0])));
test('공식 치지직 API는 조회 결과와 채널 ID를 반환한다', () => S.verifyChannels([sample()], { CHZZK_CLIENT_ID: 'id', CHZZK_CLIENT_SECRET: 'secret' }, (url, options) => Promise.resolve(assert.deepEqual([new URL(url).origin, options.method, options.redirect], ['https://openapi.chzzk.naver.com', 'GET', 'error'])).then(() => Response.json({ code: 200, content: { data: [{ channelId: id, channelName: '검토 후보' }] } }))).then((result) => assert.equal(result.channels[0].channelId, id)));

// 근거 불일치·첫 활동 미확인·중복 충돌을 검토 대기로 유지한다.
test('본문과 표의 날짜·시간 불일치를 숨기지 않는다', () => assert.deepEqual(Object.values(R.finishCandidate(sample('2026.10.25 오후 7시 2.0 데뷔'), { status: 'NOT_CONFIGURED' }, '2026-10-18').verification.checks).filter((value) => value === 'FAIL').length, 2));
test('첫 데뷔 문구만으로 검증 완료가 되지 않는다', () => assert.deepEqual([R.finishCandidate(sample('2026.10.24 오후 8시 첫 데뷔 방송'), { status: 'NOT_CONFIGURED' }, '2026-10-18').verification.status, E.classify('첫 데뷔 방송').firstDebutVerified], ['REVIEW_REQUIRED', false]));
test('같은 행사 시간 충돌을 중복 병합 후에도 보존한다', () => assert.deepEqual(R.deduplicate([sample(), { ...sample(), debutTime: '21:00', timeClaims: ['21:00'] }])[0].timeClaims, ['20:00', '21:00']));
test('동명이인의 서로 다른 채널을 병합하지 않는다', () => assert.equal(R.deduplicate([sample(), { ...sample(), channel: E.channel('https://chzzk.naver.com/' + 'b'.repeat(32)) }]).length, 2));
test('원문 지문은 필드 순서에 영향받지 않는다', () => assert.equal(E.hash({ a: 1, b: 2 }), E.hash({ b: 2, a: 1 })));
test('검토 CSV는 수식 실행을 차단한다', () => assert.match(R.csvCell('=HYPERLINK("x")'), /^"'/));

// DB 인자와 승인 옵션을 넣어도 실행 가능한 쓰기 경로는 없다.
test('실제 파이프라인은 DB·승인 옵션을 읽지 않고 보고만 생성한다', () => I.investigate(Object.defineProperty({ now, env: {}, fetcher: sheetOnly, approved: true, apply: true }, 'DB', { get: () => assert.fail('DB 접근 금지') })).then((value) => assert.deepEqual([value.success, value.schemaVersion, value.mode, value.dbRead, value.dbWritten, value.applySupported, value.approvedCandidateIds.length, value.candidates[0].classification.eventType], [true, 2, 'REPORT_ONLY', false, false, false, 0, 'MODEL_2_0'])));
test('원본 장애는 빈 목록 성공과 다르다', () => I.investigate({ now, fetcher: () => Promise.resolve(new Response('blocked', { status: 403 })) }).then((value) => assert.deepEqual([value.success, value.totalCrawledCount, value.coverage.sources[0].status], [false, 0, 'FAILED'])));
test('동일 자료 재실행은 변경 0건이다', () => I.investigate({ now, fetcher: sheetOnly }).then((previous) => I.investigate({ now: new Date('2026-10-18T01:00:00Z'), fetcher: sheetOnly, previous })).then((value) => assert.deepEqual([value.comparison.added.length, value.comparison.changed.length, value.comparison.unchanged.length], [0, 0, 1])));
test('유일한 채널의 일정 정정은 새 인물로 취급하지 않는다', () => I.investigate({ now, fetcher: sheetOnly }).then((previous) => I.investigate({ now, previous, fetcher: () => Promise.resolve(new Response(fixture.replaceAll('10.24', '10.25'), { headers: { 'Content-Type': 'text/csv' } })) })).then((value) => assert.deepEqual([value.comparison.added.length, value.comparison.changed.length], [0, 1])));
test('쓰기 계약이 있는 이전 보고서는 비교 기준으로 거부한다', () => assert.throws(() => R.validatePrevious({ schemaVersion: 2, mode: 'REPORT_ONLY', dbWritten: true }), /PREVIOUS_REPORT_CONTRACT_INVALID/));
test('승인 검토 자료는 승인 목록과 실행 기능이 비어 있다', () => I.investigate({ now, fetcher: sheetOnly }).then((value) => R.approvalPreview(value)).then((preview) => assert.deepEqual([preview.approvedCandidateIds, preview.executionSupported, preview.reportHash.length], [[], false, 64])));
test('보고 파일을 저장해도 데이터 적용 파일은 실행하지 않는다', () => I.investigate({ now, fetcher: sheetOnly }).then((value) => mkdtemp(path.join(os.tmpdir(), 'vdebut-investigation-')).then((directory) => I.saveReport(value, directory).then(() => readFile(path.join(directory, 'approval-preview.json'), 'utf8')))).then((text) => assert.equal(JSON.parse(text).executionSupported, false)));
test('손상된 이전 보고 파일은 조용히 무시하지 않는다', () => mkdtemp(path.join(os.tmpdir(), 'vdebut-baseline-')).then((directory) => writeFile(path.join(directory, 'report.json'), '{}').then(() => assert.rejects(I.readPrevious(path.join(directory, 'report.json')), /PREVIOUS_REPORT_INVALID/))));
test('CLI는 --apply 요청을 네트워크 요청 전에 거부한다', () => assert.equal(spawnSync(process.execPath, [path.resolve(__dirname, '../scripts/investigate_debuts.cjs'), '--apply'], { encoding: 'utf8' }).status, 1));

// 세부 검증 실패가 자료 없음으로 바뀌거나 중복 분류되지 않게 한다.
test('Live2D 2.0은 일반 모델 공개와 중복 분류하지 않는다', () => assert.equal(E.classify('Live2D 2.0 데뷔').eventType, 'MODEL_2_0'));
test('X가 200으로 잘못된 JSON 구조를 반환해도 빈 검색 성공이 아니다', () => S.collectX({ X_BEARER_TOKEN: 'test' }, now, () => Promise.resolve(Response.json({ unexpected: [] }))).then((value) => assert.deepEqual([value.status, value.reason], ['FAILED', 'X_API_INVALID_RESPONSE'])));
test('잘못된 시각은 시간 미정과 다른 검증 실패다', () => I.investigate({ now, fetcher: () => Promise.resolve(new Response(fixture.replace('20시', '25시'), { headers: { 'Content-Type': 'text/csv' } })) }).then((value) => assert.equal(value.candidates[0].verification.checks.timeKnown, 'FAIL')));
test('취소 공지는 예정 상태로 남기지 않는다', () => assert.equal(R.finishCandidate(sample('2026.10.24 오후 8시 데뷔 취소'), { status: 'NOT_CONFIGURED' }, '2026-10-18').eventState, 'CANCELLED_ANNOUNCEMENT'));
test('공식 채널 일치가 최초 데뷔 검증을 대신하지 않는다', () => assert.deepEqual([R.finishCandidate(sample('첫 데뷔 방송'), { status: 'OK', channels: [{ channelId: id }] }, '2026-10-18').verification.checks.officialChannel, R.finishCandidate(sample('첫 데뷔 방송'), { status: 'OK', channels: [{ channelId: id }] }, '2026-10-18').verification.checks.firstDebutHistory], ['PASS', 'NOT_CHECKED']));
test('승인 검토 자료는 변경된 보고서와 같은 지문을 가질 수 없다', () => I.investigate({ now, fetcher: sheetOnly }).then((value) => assert.notEqual(R.approvalPreview(value).reportHash, E.hash({ ...value, approvedCandidateIds: ['tampered'] }))));
