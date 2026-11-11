const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('./browser-tools/node_modules/playwright-core');
const esbuild = require('../../frontend/node_modules/esbuild');
const root = path.resolve(__dirname, '../..');
const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'profiles-response.json')));
const dirs = { before: path.join(__dirname, 'before/dist'), after: path.join(root, 'frontend/dist') };
let mode = 'before';
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };

// 실제 컴포넌트를 같은 React 인스턴스로 묶어 오류 후 원본 주소 갱신을 검증한다.
const avatarBundle = esbuild.buildSync({ stdin: {
  contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {AvatarImage} from './frontend/src/components/calendar/AvatarImage'; import {PortalAvatar} from './frontend/src/portal/PortalUi';
    const root=createRoot(document.getElementById('root')); window.showAvatar=(src)=>root.render(<><AvatarImage src={src} alt="검증"/><PortalAvatar profile={{avatarUrl:src,displayName:'검증'}}/></>); window.showAvatar('https://images.example.test/broken.png');`,
  resolveDir: root, loader: 'tsx',
}, bundle: true, platform: 'browser', format: 'iife', write: false, jsx: 'automatic', nodePaths: [path.join(root, 'frontend/node_modules')] }).outputFiles[0].contents;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/api/v1/portal/profiles') {
    await new Promise(resolve => setTimeout(resolve, 800));
    res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(snapshot));
  }
  if (/\/api\/v1\/portal\/profiles\/[^/]+\/detail/.test(url.pathname)) {
    const slug = decodeURIComponent(url.pathname.split('/')[5]);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ profile: snapshot.profiles.find(p => p.slug === slug), broadcast: { state: 'UNAVAILABLE' }, channelMedia: { videos: { state: 'UNAVAILABLE', items: [] }, clips: { state: 'UNAVAILABLE', items: [] } } }));
  }
  if (url.pathname.startsWith('/api/')) { res.setHeader('Content-Type', 'application/json'); return res.end('{"messages":[],"items":[],"broadcasts":[]}'); }
  if (url.pathname === '/__avatar-test') { res.setHeader('Content-Type', 'text/html'); return res.end('<style>img{width:64px;height:64px}</style><div id="root"></div><script src="/__avatar.js"></script>'); }
  if (url.pathname === '/__avatar.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(avatarBundle); }
  let file = path.join(dirs[mode], decodeURIComponent(url.pathname));
  if (url.pathname === '/' || !path.extname(url.pathname)) file = path.join(dirs[mode], 'portal.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

async function appearance(page) {
  return page.evaluate(() => Object.fromEntries(['.vd-header', '.vd-footer', '.vd-home-stage', '.vd-calendar-panel'].map(selector => {
    const node = document.querySelector(selector); const s = getComputedStyle(node); const b = node.getBoundingClientRect();
    return [selector, { width: b.width, height: b.height, color: s.color, backgroundColor: s.backgroundColor, fontFamily: s.fontFamily, fontSize: s.fontSize, padding: s.padding, borderRadius: s.borderRadius }];
  })));
}

async function measure(browser, variant, width = 1440) {
  mode = variant;
  const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'ko-KR' });
  const page = await context.newPage();
  // 외부 분석·폰트·프로필 이미지는 전후 동일하게 제외하고 로컬 화면/API 경로를 비교한다.
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(u.hostname) ? route.continue() : route.abort();
  });
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR', error.message); });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 750000, uploadThroughput: 750000 });
  await page.addInitScript(() => {
    window.__metrics = { lcp: 0, cls: 0 };
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.__metrics.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__metrics.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('http://127.0.0.1:4178/');
  await page.locator('.vd-calendar-grid').waitFor();
  await page.locator('.vd-home-stage').evaluate(async el => {
    const src = getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)/)?.[1];
    if (src) { const img = new Image(); img.src = src; await img.decode(); }
  });
  await page.waitForTimeout(300);
  const timing = await page.evaluate(() => ({ ...window.__metrics, ready: performance.now(), resources: performance.getEntriesByType('resource').filter(e => e.name.includes('/profiles?') || e.name.includes('spotlight_stage_bg')).map(e => ({ name: e.name.split('/').at(-1), start: e.startTime, end: e.responseEnd, bytes: e.encodedBodySize, initiator: e.initiatorType })) }));
  assert.equal(timing.resources.filter(e => e.name.startsWith('profiles?')).length, 1, 'preload must be consumed without duplicate fetch');
  assert.equal(errors.length, 0, errors.join('\n'));
  const initial = await appearance(page);
  await page.screenshot({ path: path.join(__dirname, `${variant}-${width}.png`), fullPage: true });
  const cells = await page.locator('.vd-day').count();
  assert.ok([28, 35, 42, 7].includes(cells));
  await page.getByRole('button', { name: width < 640 ? '다음 주' : '다음 달', exact: true }).click();
  await page.getByRole('button', { name: width < 640 ? '이전 주' : '이전 달', exact: true }).click();
  const profileLink = page.locator('a[href^="/creator/"]:visible').first();
  await profileLink.click();
  await page.locator('.wiki-content-boundary').waitFor();
  await page.waitForTimeout(500);
  assert.equal(errors.length, 0, errors.join('\n'));
  await page.locator('.vd-logo').click();
  await page.locator('.vd-calendar-grid').waitFor();
  assert.deepEqual(await appearance(page), initial, 'home appearance after detail return');
  await context.close();
  return { variant, width, cells, ...timing, appearance: initial };
}

async function main() {
  await new Promise(resolve => server.listen(4178, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const results = process.argv.includes('--avatars-only') ? JSON.parse(fs.readFileSync(path.join(__dirname, 'home-browser-results.json'))).results : [];
    for (const width of process.argv.includes('--avatars-only') ? [] : [1440, 390]) {
      const before = await measure(browser, 'before', width);
      const after = await measure(browser, 'after', width);
      assert.deepEqual(after.appearance, before.appearance, 'protected home layout/styles remain identical');
      results.push(before, after);
    }
    fs.writeFileSync(path.join(__dirname, 'home-browser-results.json'), JSON.stringify({ results }, null, 2));
    const context = await browser.newContext(); const page = await context.newPage();
    await page.route('https://images.example.test/**', route => route.request().url().endsWith('broken.png')
      ? route.fulfill({ status: 404, body: '' })
      : route.fulfill({ contentType: 'image/png', body: fs.readFileSync(path.join(root, 'frontend/dist/favicon.png')) }));
    await page.goto('http://127.0.0.1:4178/__avatar-test');
    await page.waitForFunction(() => document.querySelector('#root').textContent.includes('검') && !document.querySelector('#root img')); 
    await page.evaluate(() => window.showAvatar('https://images.example.test/valid.png'));
    await page.waitForFunction(() => document.querySelectorAll('#root img').length === 2 && [...document.querySelectorAll('#root img')].every(img => img.complete && img.naturalWidth > 0));
    await context.close();
    fs.writeFileSync(path.join(__dirname, 'home-browser-results.json'), JSON.stringify({ results, avatarRecovery: 'passed' }, null, 2));
    console.log(JSON.stringify({ results: results.map(({ appearance, ...r }) => r), avatarRecovery: 'passed', layoutAndReturn: 'passed' }, null, 2));
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
