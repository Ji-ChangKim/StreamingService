const SITE_URL = 'https://vdebut.live/robots.txt';
const USER_AGENT = 'VDebut-Deployment-Check/1.0';

// HTML 차단 페이지나 실패 상태를 배포 성공으로 판단하지 않는다.
function requireRobotsResponse(response) {
  return response.status !== 200 || !/^text\/plain(?:;|$)/i.test(response.headers.get('Content-Type') || '')
    ? Promise.reject(new Error(`공개 주소 확인 실패: HTTP ${response.status}, Cloudflare 요청 ID ${response.headers.get('CF-Ray') || '없음'}`))
    : response.text();
}

// 운영 주소의 robots 원문을 확인하며 API·SQL·등록 요청은 보내지 않는다.
function requireProductionRobots(text) {
  return /^User-agent:\s*\*/m.test(text) && /^Sitemap:\s*https:\/\/vdebut\.live\/sitemap\.xml\s*$/m.test(text)
    ? { url: SITE_URL, status: 200, verified: true, dbWritten: false }
    : (() => { throw new Error('공개 주소가 예상한 VDébut robots.txt를 반환하지 않았습니다.'); })();
}

// 서비스명을 명시한 점검 요청을 사용하고 리다이렉트·무기한 대기를 허용하지 않는다.
function verifyDeployedSite(fetcher = globalThis.fetch) {
  return fetcher(SITE_URL, { method: 'GET', redirect: 'error', headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain' }, signal: AbortSignal.timeout(15000) })
    .then(requireRobotsResponse).then(requireProductionRobots);
}

module.exports = { verifyDeployedSite, SITE_URL, USER_AGENT };

// 실패는 처리되지 않은 거부로 종료되어 Actions가 성공으로 숨기지 않게 한다.
if (require.main === module) verifyDeployedSite().then((result) => console.log(JSON.stringify(result)));
