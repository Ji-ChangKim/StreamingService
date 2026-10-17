const { mkdir, writeFile, appendFile } = require('node:fs/promises');
const path = require('node:path');

// 기존 자동 등록 주소는 사용하지 않으며 리다이렉트도 허용하지 않는다.
const REPORT_URL = 'https://vdebut-debut-report.gametps.workers.dev/api/v1/admin/crawler/report';

// 원문 응답과 비밀키를 로그에 포함하지 않는 오류만 만든다.
function fail(message) {
  throw new Error(message);
}

// HTTP 오류를 인증·보안 차단·미배포·수집 실패로 구분한다.
function statusError(status) {
  return ({ 401: '수집 인증 실패: CRAWLER_SECRET 설정을 확인하세요.', 403: 'Cloudflare 또는 접근 정책이 보고 요청을 차단했습니다. 보안 이벤트를 확인하세요.', 404: '보고 전용 API가 아직 배포되지 않았습니다. 자동 등록 API로 우회하지 않습니다.', 502: '보고 API가 수집 원본을 읽지 못했습니다.', 503: '보고 API의 수집용 비밀키 또는 서비스 설정을 확인하세요.' })[status] || `보고 API 오류: HTTP ${status}`;
}

// HTTP 200이어도 부작용 차단 계약이 없는 응답을 성공으로 인정하지 않는다.
function validateReport(report) {
  return report && report.success === true && report.schemaVersion === 1 && report.mode === 'REPORT_ONLY'
    && report.dbRead === false && report.dbWritten === false && report.emailSent === false && report.comparisonPerformed === false
    && report.existingMatchedCount === null && report.newDiscoveredCount === null
    && Array.isArray(report.creators) && Number.isSafeInteger(report.totalCrawledCount) && report.totalCrawledCount >= 0 && report.totalCrawledCount === report.creators.length
    ? report : fail('보고 전용 응답 계약을 확인하지 못했습니다. 성공으로 처리하지 않습니다.');
}

// HTML 차단 화면과 잘못된 JSON을 명확한 실패로 처리한다.
function readReportResponse(response) {
  return !response.ok ? Promise.reject(new Error(statusError(response.status)))
    : !/\bapplication\/json\b/i.test(response.headers.get('Content-Type') || '') ? Promise.reject(new Error('보고 API가 JSON 대신 HTML 또는 다른 형식을 반환했습니다.'))
      : response.json().catch(() => fail('보고 API의 JSON 응답이 올바르지 않습니다.')).then(validateReport);
}

// 네트워크 요청은 보고 전용 주소로 한 번만 보내며 DB·메일 옵션은 전달하지 않는다.
function requestReport(secret, fetchImpl) {
  return fetchImpl(REPORT_URL, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60_000), headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Crawler-Secret': secret }, body: '{}' })
    .catch(() => fail('보고 API 연결 실패 또는 시간 초과입니다. 리다이렉트와 자동 등록 주소 재시도는 허용하지 않습니다.'))
    .then(readReportResponse);
}

// 비밀키가 없으면 서버 요청 전에 중단한다.
function collectDebutReport(secret, fetchImpl = fetch) {
  return typeof secret !== 'string' || !secret.trim() ? Promise.reject(new Error('GitHub Actions의 CRAWLER_SECRET이 비어 있습니다.')) : requestReport(secret, fetchImpl);
}

// 보고서에만 후보 원본을 보관하고 로그에는 후보 수와 부작용 차단 결과만 남긴다.
function saveReport(report, outputDir = 'crawler-report') {
  return mkdir(outputDir, { recursive: true }).then(() => writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')).then(() => report);
}

// 자동화 실행 요약에는 비밀키와 외부 원문을 포함하지 않는다.
function reportSummary(report) {
  return `데뷔 후보 보고서: ${report.totalCrawledCount}건\n\n운영 DB 조회·저장: 없음 / 이메일 발송: 없음\n\n기존 등록 여부와 신규 첫 데뷔 여부는 미검증입니다.\n`;
}

// 요약 파일은 GitHub가 제공한 경우에만 작성한다.
function writeSummary(report) {
  return process.env.GITHUB_STEP_SUMMARY ? appendFile(process.env.GITHUB_STEP_SUMMARY, reportSummary(report), 'utf8') : Promise.resolve();
}

// 실패 원인은 원문 응답 없이 콘솔에 표시한다.
function logFailure(error) {
  return console.error(`::error::${error.message}`);
}

// 실패를 자동화의 종료 코드에 반영한다.
function exitFailure(error) {
  return Promise.resolve(logFailure(error)).then(() => Object.assign(process, { exitCode: 1 }));
}

// 테스트에서 저장 없이 요청 검증만 호출할 수 있도록 분리한다.
module.exports = { collectDebutReport, saveReport, REPORT_URL };

// 직접 실행할 때만 보고서를 저장하며 모듈을 불러오기만 해서는 통신하지 않는다.
if (require.main === module) collectDebutReport(process.env.CRAWLER_SECRET).then((report) => saveReport(report)).then(writeSummary).catch(exitFailure);
