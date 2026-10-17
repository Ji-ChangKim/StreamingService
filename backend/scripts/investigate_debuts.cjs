const { readFile, writeFile, mkdir, appendFile } = require('node:fs/promises');
const path = require('node:path');
const E = require('./debut-investigation/debut-evidence.cjs');
const S = require('./debut-investigation/debut-sources.cjs');
const R = require('./debut-investigation/debut-report.cjs');

// 제한된 개수만 병렬 조회하여 단축 주소의 요청 폭주를 막는다.
function mapBatches(items, operation, offset = 0, results = []) {
  return offset >= items.length ? Promise.resolve(results) : Promise.all(items.slice(offset, offset + 3).map(operation)).then((batch) => mapBatches(items, operation, offset + 3, [...results, ...batch]));
}

// 최대 열 개의 단축 주소만 조회하고 나머지는 미검증으로 보고한다.
function resolveSeeds(seeds, fetcher) {
  return ((allowed) => mapBatches(seeds, (seed) => E.channel(seed.rawChannelUrl).status === 'SHORT_URL' && !allowed.has(seed.rawChannelUrl) ? Promise.resolve(R.candidate(seed, { ...E.channel(seed.rawChannelUrl), status: 'RESOLUTION_BUDGET_EXCEEDED' })) : S.resolveChannel(seed.rawChannelUrl, fetcher).then((channel) => R.candidate(seed, channel))))(new Set(seeds.filter((seed) => E.channel(seed.rawChannelUrl).status === 'SHORT_URL').slice(0, 10).map((seed) => seed.rawChannelUrl)));
}

// 수집·분류·검증은 공개 자료와 선택한 읽기 API만 사용한다.
function investigate({ now = new Date(), env = {}, fetcher = globalThis.fetch, previous = null } = {}) {
  return Promise.all([S.googleCsv(fetcher).then((text) => S.parseSheet(text, now)).catch((error) => ({ sourceId: 'community-sheet', status: 'FAILED', reason: /^SHEET_|^SOURCE_/.test(error.message) ? error.message : 'SHEET_INVALID_CSV', seeds: [] })), S.collectX(env, now, fetcher)]).then((sources) => ((seeds) => resolveSeeds(seeds.slice(0, 100), fetcher).then((items) => S.verifyChannels(items, env, fetcher).then((official) => R.report(items, sources, official, now, previous, Math.max(0, seeds.length - 100)))))(sources.flatMap((source) => source.seeds).filter((seed) => S.eligible(seed, S.windowFor(now)))));
}

// 기준 파일이 없는 첫 실행은 정상적으로 처리하되 손상된 파일은 숨기지 않는다.
function readPrevious(filename) {
  return !filename ? Promise.resolve(null) : readFile(filename, 'utf8').then((text) => text.length > 2 * 1024 * 1024 ? S.failure('PREVIOUS_REPORT_TOO_LARGE') : R.validatePrevious(JSON.parse(text))).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(new Error('PREVIOUS_REPORT_INVALID')));
}

// JSON·표·승인 검토 자료만 작업 폴더에 저장하고 DB 반영 자료를 실행하지 않는다.
function saveReport(value, directory = 'crawler-report') {
  return mkdir(directory, { recursive: true }).then(() => Promise.all([writeFile(path.join(directory, 'report.json'), JSON.stringify(value, null, 2) + '\n', 'utf8'), writeFile(path.join(directory, 'summary.md'), R.summary(value), 'utf8'), writeFile(path.join(directory, 'candidates.csv'), R.csv(value), 'utf8'), writeFile(path.join(directory, 'approval-preview.json'), JSON.stringify(R.approvalPreview(value), null, 2) + '\n', 'utf8')])).then(() => value);
}

// 성공한 파일만 다음 실행 비교 기준으로 남긴다. GitHub 캐시에는 쓰기 자격증명이 없다.
function saveBaseline(value, filename) {
  return !value.success || !filename ? Promise.resolve(value) : mkdir(path.dirname(filename), { recursive: true }).then(() => writeFile(filename, JSON.stringify(value) + '\n', 'utf8')).then(() => value);
}

// 실행 요약도 외부 텍스트가 이스케이프된 표만 추가한다.
function publishSummary(value, filename) {
  return !filename ? Promise.resolve(value) : appendFile(filename, R.summary(value), 'utf8').then(() => value);
}

// 비밀키가 포함될 수 있는 원문 오류는 출력하지 않는다.
function markFailed() {
  return Object.assign(process, { exitCode: 1 });
}

// 적용 옵션은 제공하지 않으며 명시되지 않은 인자는 실행 전에 거부한다.
function main() {
  return process.argv.length > 2 ? Promise.reject(new Error('REPORT_ONLY_NO_APPLY_ARGUMENTS')) : readPrevious(process.env.INVESTIGATION_BASELINE).then((previous) => investigate({ previous, env: { X_BEARER_TOKEN: process.env.X_BEARER_TOKEN, CHZZK_CLIENT_ID: process.env.CHZZK_CLIENT_ID, CHZZK_CLIENT_SECRET: process.env.CHZZK_CLIENT_SECRET } })).then((value) => saveReport(value).then((saved) => saveBaseline(saved, process.env.INVESTIGATION_BASELINE)).then((saved) => publishSummary(saved, process.env.GITHUB_STEP_SUMMARY)).then((saved) => saved.success ? console.log(JSON.stringify({ mode: saved.mode, candidates: saved.totalCrawledCount, eventTypes: saved.countsByEventType, coverage: saved.coverage.status, dbRead: false, dbWritten: false, applySupported: false })) : markFailed())).catch(() => Promise.resolve(console.error('::error::보고 전용 조사에 실패했습니다. 인증값·외부 원문은 출력하지 않습니다. 보고서와 소스 상태를 확인하세요.')).then(markFailed));
}

module.exports = { investigate, saveReport, readPrevious, main };
if (require.main === module) main();
