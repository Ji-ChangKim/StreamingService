const assert = require('node:assert/strict');
const { test, mock, before, afterEach } = require('node:test');
const path = require('node:path');
const { mkdtempSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { spawnSync } = require('node:child_process');
const esbuild = require('../node_modules/esbuild');
const { collectDebutReport, saveReport, REPORT_URL } = require('../scripts/collect_debut_report.cjs');
const root = path.resolve(__dirname, '../..');
const baseDate = new Date('2026-10-17T00:00:00Z');
const fixture = ['header 1', 'header 2', 'header 3', 'header 4', 'header 5', `0,2027.01.10,20,00,보고 검증,https://chzzk.naver.com/${'a'.repeat(32)},example`, `0,2027.01.11,,,시간 미정,https://chzzk.naver.com/${'b'.repeat(32)},`].join('\n');

// 실행 중 자산 조회가 있으면 실패시키며 운영 자산·스토리지에 접근하지 않는다.
const assetPlugin = { name: 'report-test-assets', setup: (build) => build.onResolve({ filter: /^(__STATIC_CONTENT_MANIFEST|@cloudflare\/kv-asset-handler)$/ }, (args) => ({ path: args.path, namespace: 'report-test-assets' })) };
const assetLoadPlugin = { name: 'report-test-asset-source', setup: (build) => build.onLoad({ filter: /.*/, namespace: 'report-test-assets' }, (args) => ({ contents: args.path === '__STATIC_CONTENT_MANIFEST' ? 'export default "{}";' : 'export function getAssetFromKV() { throw new Error("보고 요청에서 자산 접근 금지"); } export function serveSinglePageApp() { throw new Error("보고 요청에서 자산 접근 금지"); }' })) };

// 번들을 메모리에서 평가하여 원격 서버와 빌드 산출물 쓰기를 피한다.
function evaluateBundle(source) {
  return new Function('require', 'module', '__filename', '__dirname', `${source}\nreturn module.exports;`)(require, { exports: {} }, __filename, __dirname);
}

// 실제 서비스와 Worker 진입점을 동일한 로컬 의존성으로 불러온다.
function loadTs(file) {
  return esbuild.build({ entryPoints: [path.join(root, file)], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent', plugins: [assetPlugin, assetLoadPlugin] }).then((bundle) => evaluateBundle(bundle.outputFiles[0].text));
}

const modules = {};

// 비동기 번들러 플러그인을 준비한 뒤에만 테스트를 시작한다.
before(() => Promise.all([loadTs('backend/src/services/debutCrawlerService.ts'), loadTs('backend/src/index.ts'), loadTs('backend/src/reportWorker.ts'), loadTs('backend/src/services/crawlerCsv.ts')]).then(([service, worker, reportWorker, csv]) => Object.assign(modules, { service, worker: worker.default, reportWorker: reportWorker.default, csv })));

// 테스트는 고정 CSV만 제공하고 이메일·프로필·운영 서버 통신은 모두 차단한다.
function sourceFetch(url) {
  return new URL(typeof url === 'string' ? url : url.url).hostname === 'docs.google.com' ? Promise.resolve(new Response(fixture)) : Promise.reject(new Error('보고 테스트에서 외부 요청을 차단했습니다.'));
}

// DB를 읽는 순간 테스트가 실패하도록 한다.
function forbiddenDb() {
  throw new Error('보고 경로에서 DB 접근 금지');
}

// 주입된 DB 인자가 있어도 보고 모드는 DB 메서드를 읽지 않아야 한다.
const poisonedDb = new Proxy({}, { get: forbiddenDb });

// Worker에는 DB 바인딩을 꺼내는 동작 자체를 금지한다.
function reportEnv(secret) {
  return Object.defineProperty({ CRAWLER_SECRET: secret, PORTAL_ENABLED: 'true' }, 'DB', { get: forbiddenDb });
}

// 성공 응답의 필수 안전 계약과 미확인 집계를 확인한다.
function assertReport(report) {
  return assert.deepEqual({ success: report.success, mode: report.mode, schemaVersion: report.schemaVersion, dbRead: report.dbRead, dbWritten: report.dbWritten, emailSent: report.emailSent, comparisonPerformed: report.comparisonPerformed, existing: report.existingMatchedCount, discovered: report.newDiscoveredCount, count: report.totalCrawledCount, unknownTime: report.creators[1].debutTime }, { success: true, mode: 'REPORT_ONLY', schemaVersion: 1, dbRead: false, dbWritten: false, emailSent: false, comparisonPerformed: false, existing: null, discovered: null, count: 2, unknownTime: undefined });
}

// 테스트마다 모든 통신 대역을 원래대로 되돌린다.
afterEach(() => mock.restoreAll());

test('DB·메일 인자가 있어도 보고 모드는 원본 요청 한 번만 수행한다', () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => modules.service.runDebutCrawlerProcess(poisonedDb, 'no-send@example.invalid', 'must-not-use', baseDate, true)).then((report) => Promise.resolve(assertReport(report)).then(() => assert.equal(globalThis.fetch.mock.callCount(), 1))));

test('수집 전용 진입점은 같은 안전 계약을 반환한다', () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => modules.service.runDebutCrawlerReport(baseDate)).then(assertReport));

test('시간 미정 문구와 누락 채널을 임의의 시각·검색 주소로 채우지 않는다', () => Promise.resolve(mock.method(globalThis, 'fetch', () => Promise.resolve(new Response(['a', 'b', 'c', 'd', 'e', '0,2027.01.12,미정,,미확정 후보,,'].join('\n'))))).then(() => modules.service.runDebutCrawlerReport(baseDate)).then((report) => assert.deepEqual([report.creators[0].debutTime, report.creators[0].channelUrl], [undefined, ''])));

// 실제 원본처럼 머리말·데이터에 줄바꿈과 쉼표·겹따옴표가 있어도 레코드를 보존한다.
const multilineFixture = ['"머리말\n다음 줄",,,,', 'header 2', 'header 3', 'header 4', 'header 5', `0,2027.01.12,20,00,"쉼표, ""이름""",https://chzzk.naver.com/${'c'.repeat(32)},example`].join('\r\n');
test('인용된 줄바꿈·쉼표·겹따옴표가 있는 실제 시트 형식을 읽는다', () => Promise.resolve(mock.method(globalThis, 'fetch', () => Promise.resolve(new Response(multilineFixture)))).then(() => modules.service.runDebutCrawlerReport(baseDate)).then((report) => assert.deepEqual([report.success, report.totalCrawledCount, report.creators[0].displayName], [true, 1, '쉼표, "이름"'])));
test('닫히지 않은 CSV 인용 필드를 거부한다', () => assert.throws(() => modules.csv.parseCrawlerCsv('"닫히지 않은 필드'), /따옴표/));
test('닫힌 CSV 인용 필드 뒤의 임의 문자를 거부한다', () => assert.throws(() => modules.csv.parseCrawlerCsv('"닫힌 필드"오류,값'), /따옴표/));

test('별도 보고 Worker에는 정기 실행 핸들러가 없다', () => assert.deepEqual(Object.keys(modules.reportWorker), ['fetch']));
test('별도 보고 Worker가 DB 바인딩 없이 보고서를 생성한다', () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => collectDebutReport('test-secret', (url, options) => modules.reportWorker.fetch(new Request(url, options), reportEnv('test-secret'), {}))).then(assertReport));
test('별도 보고 Worker는 예전 자동 등록 주소를 제공하지 않는다', () => Promise.resolve(modules.reportWorker.fetch(new Request(REPORT_URL.replace('/report', '/run'), { method: 'POST' }), reportEnv('test-secret'), {})).then((response) => assert.equal(response.status, 404)));

// 원본 장애를 빈 목록 성공으로 숨기지 않는지 검증한다.
for (const [name, respond] of [
  ['HTTP 403', () => Promise.resolve(new Response('blocked', { status: 403 }))],
  ['HTML 로그인 화면', () => Promise.resolve(new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } }))],
  ['위장 HTML', () => Promise.resolve(new Response('<html>login</html>'))],
  ['JSON', () => Promise.resolve(Response.json({ error: 'denied' }))],
  ['빈 원본', () => Promise.resolve(new Response(''))],
  ['열 구조 변경', () => Promise.resolve(new Response('a\nb\nc\nd\ne\ninvalid'))],
  ['네트워크 오류', () => Promise.reject(new Error('fixture network error'))],
  ['시간 초과', () => Promise.reject(new DOMException('fixture timeout', 'TimeoutError'))],
  ['용량 초과', () => Promise.resolve(new Response('x'.repeat(2 * 1024 * 1024 + 1)))],
]) test(`보고 원본 실패: ${name}`, () => Promise.resolve(mock.method(globalThis, 'fetch', respond)).then(() => modules.service.runDebutCrawlerProcess(poisonedDb, 'no-send@example.invalid', 'must-not-use', baseDate, true)).then((report) => assert.deepEqual([report.success, report.dbRead, report.dbWritten, report.emailSent, report.totalCrawledCount, report.creators, Boolean(report.error)], [false, false, false, false, 0, [], true])));

// 실제 Worker의 라우팅·인증 순서를 통과시켜 DB 접근 차단을 확인한다.
for (const [name, secret, header, status] of [['비밀키 미설정', undefined, 'test-secret', 503], ['인증 누락', 'test-secret', undefined, 401], ['인증 오류', 'test-secret', 'wrong-secret', 401], ['인증 성공', 'test-secret', 'test-secret', 200]]) test(`보고 API: ${name}`, () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => modules.worker.fetch(new Request(REPORT_URL, { method: 'POST', headers: header ? { 'X-Crawler-Secret': header } : {}, body: JSON.stringify({ mode: 'SYNC', recipientEmail: 'no-send@example.invalid' }) }), reportEnv(secret), {})).then((response) => Promise.resolve(assert.deepEqual([response.status, response.headers.get('Cache-Control'), globalThis.fetch.mock.callCount()], [status, 'no-store', status === 200 ? 1 : 0])).then(() => status === 200 ? response.json().then(assertReport) : undefined)));

test('보고 API는 잘못된 메서드에도 DB를 읽지 않는다', () => modules.worker.fetch(new Request(REPORT_URL), reportEnv('test-secret'), {}).then((response) => assert.equal(response.status, 405)));

test('원본 장애는 실제 Worker에서 HTTP 502로 전달된다', () => Promise.resolve(mock.method(globalThis, 'fetch', () => Promise.resolve(new Response('unavailable', { status: 503 })))).then(() => modules.worker.fetch(new Request(REPORT_URL, { method: 'POST', headers: { 'X-Crawler-Secret': 'test-secret' } }), reportEnv('test-secret'), {})).then((response) => assert.equal(response.status, 502)));

test('Actions 클라이언트와 실제 Worker가 보고 전용 경로로 연동된다', () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => collectDebutReport('test-secret', (url, options) => Promise.resolve(assert.deepEqual([url, options.redirect, options.body], [REPORT_URL, 'error', '{}'])).then(() => modules.worker.fetch(new Request(url, options), reportEnv('test-secret'), {})))).then(assertReport));

test('Actions 비밀키가 없으면 네트워크 요청 전에 실패한다', () => assert.rejects(collectDebutReport('', () => forbiddenDb()), /CRAWLER_SECRET/));

// 모든 오류에서 자동 등록 주소로 우회하거나 재시도하지 않는지 확인한다.
for (const [status, message] of [[401, /인증 실패/], [403, /Cloudflare/], [404, /아직 배포되지/], [502, /수집 원본/], [503, /서비스 설정/], [500, /HTTP 500/]]) test(`Actions 오류 분류: ${status}`, () => collectDebutReport('test-secret', mock.fn(() => Promise.resolve(new Response('<html>blocked</html>', { status })))).then(() => assert.fail('오류 응답을 성공 처리했습니다.'), (error) => assert.match(error.message, message)));

for (const [name, respond, message] of [
  ['HTTP 200 HTML', () => Promise.resolve(new Response('<html>challenge</html>')), /JSON 대신/],
  ['손상된 JSON', () => Promise.resolve(new Response('{', { headers: { 'Content-Type': 'application/json' } })), /JSON 응답/],
  ['구버전 성공 응답', () => Promise.resolve(Response.json({ success: true, result: {} })), /응답 계약/],
  ['네트워크·리다이렉트 실패', () => Promise.reject(new Error('private detail')), /연결 실패/],
]) test(`Actions 응답 검증: ${name}`, () => assert.rejects(collectDebutReport('test-secret', respond), message));

test('안전 계약이 위반된 성공 응답을 거부한다', () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => modules.service.runDebutCrawlerReport(baseDate)).then((report) => Promise.all([{ ...report, dbWritten: true }, { ...report, emailSent: true }, { ...report, dbRead: true }, { ...report, totalCrawledCount: 999 }, { ...report, success: false }].map((invalid) => assert.rejects(collectDebutReport('test-secret', () => Promise.resolve(Response.json(invalid))), /응답 계약/)))));

test('후보 보고서만 로컬 JSON으로 저장한다', () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => modules.service.runDebutCrawlerReport(baseDate)).then((report) => verifySavedReport(report, mkdtempSync(path.join(tmpdir(), 'vdebut-report-test-')))));

// 실제 저장된 JSON을 다시 읽어 보고서 보관 결과를 확인한다.
function verifySavedReport(report, directory) {
  return saveReport(report, directory).then(() => assert.deepEqual(JSON.parse(readFileSync(path.join(directory, 'report.json'), 'utf8')), JSON.parse(JSON.stringify(report))));
}

// 비밀키가 없는 직접 실행은 통신 없이 실패 종료하며 민감한 응답을 출력하지 않는다.
test('Actions 직접 실행의 실패 종료 코드를 확인한다', () => assert.equal(spawnSync(process.execPath, [path.join(root, 'backend/scripts/collect_debut_report.cjs')], { env: { ...process.env, CRAWLER_SECRET: '' }, encoding: 'utf8', timeout: 5000 }).status, 1));

// 기존 수동 실행 주소에도 승인·동기화 본문으로 DB 반영을 요청할 수 없다.
test('기존 수집 실행 주소도 DB·메일 없이 보고만 반환한다', () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => modules.worker.fetch(new Request(REPORT_URL.replace('/report', '/run'), { method: 'POST', headers: { 'X-Crawler-Secret': 'test-secret' }, body: JSON.stringify({ approved: true, mode: 'SYNC', recipientEmail: 'no-send@example.invalid' }) }), reportEnv('test-secret'), {})).then((response) => response.json()).then((body) => Promise.resolve(assert.deepEqual([body.success, body.mode, body.dbWritten], [true, 'REPORT_ONLY', false])).then(() => assertReport(body.result))));

// DB가 없는 스케줄 입력에서도 오전 7시 데뷔 작업은 수집 요청 한 번으로 보고만 생성한다.
test('오전 7시 데뷔 예약 실행은 보고 경로만 사용한다', () => Promise.resolve(mock.method(globalThis, 'fetch', sourceFetch)).then(() => ((pending) => modules.worker.scheduled({ cron: '0 22 * * *', scheduledTime: Date.parse('2026-10-17T22:00:00Z') }, { DB: null }, { waitUntil: (promise) => pending.push(promise) }).then(() => Promise.all(pending)).then(() => assert.equal(globalThis.fetch.mock.callCount(), 1)))([])));
