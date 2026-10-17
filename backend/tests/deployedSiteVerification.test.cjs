const assert = require('node:assert/strict');
const { test } = require('node:test');
const { verifyDeployedSite, SITE_URL, USER_AGENT } = require('../scripts/verify_deployed_site.cjs');
const robots = 'User-agent: *\nAllow: /\nSitemap: https://vdebut.live/sitemap.xml\n';

// 실제 운영 요청 없이 배포 점검의 주소·메서드·식별자를 검증한다.
function assertStaticRequest(url, options) {
  return assert.deepEqual({ url, method: options.method, redirect: options.redirect, userAgent: options.headers['User-Agent'], hasSignal: options.signal instanceof AbortSignal }, { url: SITE_URL, method: 'GET', redirect: 'error', userAgent: USER_AGENT, hasSignal: true });
}
test('배포 점검은 운영 정적 파일에 식별 가능한 GET만 보낸다', () => verifyDeployedSite((url, options) => Promise.resolve(assertStaticRequest(url, options)).then(() => new Response(robots, { headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }))).then((result) => assert.deepEqual(result, { url: SITE_URL, status: 200, verified: true, dbWritten: false })));

// Cloudflare의 403 응답과 200 차단 HTML 모두 실패해야 한다.
test('403과 요청 ID를 실패 원인으로 전달한다', () => assert.rejects(verifyDeployedSite(() => Promise.resolve(new Response('error code: 1010', { status: 403, headers: { 'CF-Ray': 'test-ray' } }))), /HTTP 403.*test-ray/));
test('200 HTML 응답도 성공으로 처리하지 않는다', () => assert.rejects(verifyDeployedSite(() => Promise.resolve(new Response('<html>challenge</html>', { headers: { 'Content-Type': 'text/html' } }))), /공개 주소 확인 실패/));
test('다른 사이트의 robots 내용은 거부한다', () => assert.rejects(verifyDeployedSite(() => Promise.resolve(new Response('User-agent: *\nSitemap: https://example.com/sitemap.xml', { headers: { 'Content-Type': 'text/plain' } }))), /예상한 VDébut/));
test('연결·인증서·시간 초과 오류는 숨기지 않는다', () => assert.rejects(verifyDeployedSite(() => Promise.reject(new Error('test-network-failure'))), /test-network-failure/));
