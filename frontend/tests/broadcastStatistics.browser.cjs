const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.STATISTICS_PLAYWRIGHT_MODULE || 'playwright');
const XLSX = require('../node_modules/xlsx');

// 이 자료는 로컬 브라우저 검증에서만 응답을 대체하며 배포 산출물에 포함하지 않는다.
function fixture() {
  const now = Date.now();
  const names = ['마인크래프트', '리그 오브 레전드', '토크', '음악', 'ASMR', '그림', '스타크래프트', '종합 게임', '버추얼', '여행', '스포츠', 'FC 온라인'];
  const lives = Array.from({ length: 28 }, (_, index) => {
    const platform = index < 18 ? 'CHZZK' : 'SOOP';
    return { id: `${platform}:${index}`, platform, streamId: String(index), channelKey: `${platform}:channel${index}`, channelName: `테스트 스트리머 ${index + 1}`, channelUrl: 'https://chzzk.naver.com/' + 'a'.repeat(32), imageUrl: null, liveUrl: 'https://chzzk.naver.com/live/' + 'a'.repeat(32), title: index === 0 ? '=HYPERLINK("https://example.com","검증")' : `함께 즐기는 테스트 방송 ${index + 1}`, categoryId: String(index % 12), categoryName: names[index % 12], viewers: 18000 - index * 500, startedAt: new Date(now - 7200000).toISOString() };
  });
  const sources = ['SOOP', 'CHZZK', 'TWITCH', 'CHZZM'].map((platform) => ({ platform, state: ['SOOP', 'CHZZK'].includes(platform) ? 'available' : 'unsupported', scope: platform === 'CHZZK' ? '인기 방송 상위 100개' : platform === 'SOOP' ? 'VDébut 등록 채널 최대 40개' : '연결 준비 중', observedAt: ['SOOP', 'CHZZK'].includes(platform) ? new Date(now).toISOString() : null, checkedChannels: platform === 'SOOP' ? 40 : null }));
  const points = ['CHZZK', 'SOOP'].flatMap((platform) => Array.from({ length: 25 }, (_, index) => ({ platform, at: new Date(now - (24 - index) * 3600000).toISOString(), viewers: lives.filter((row) => row.platform === platform).reduce((sum, row) => sum + row.viewers, 0) * (0.5 + index / 48), channels: lives.filter((row) => row.platform === platform).length, kind: index === 24 ? 'current' : 'history' })));
  const peaks = lives.map((row) => ({ ...row, peakAt: new Date(now).toISOString(), isLive: true, samples: [{ at: new Date(now).toISOString(), viewers: row.viewers }] }));
  return { meta: { generatedAt: new Date(now).toISOString(), timezone: 'Asia/Seoul', refreshSeconds: 60, historyState: 'available', lastHistoryAt: new Date(now).toISOString(), peakFrom: new Date(now - 18 * 3600000).toISOString(), historyFrom: new Date(now - 24 * 3600000).toISOString(), historyScope: '브라우저 검증 자료', unlinkedPeakChannels: 0 }, sources, lives, points, peaks };
}

async function main() {
  const output = path.resolve(__dirname, '../../.cache/statistics-browser');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  const data = fixture();
  await page.route('**/api/analytics/broadcast-statistics', (route) => route.fulfill({ json: data }));
  await page.route('**/api/analytics/streamers/search?*', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('q').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
    if (query === '실패검색') return route.fulfill({ status: 503, json: { error: 'test' } });
    const streamer = { id: 'registered:500', platform: 'SOOP', channelKey: 'SOOP:night', name: '밤하늘', channelUrl: 'https://www.sooplive.co.kr/station/night', imageUrl: null, profileSlug: 'night' };
    await route.fulfill({ json: { query, streamers: query === '밤하늘' ? [streamer] : [], hasMore: false } });
  });
  await page.goto('http://127.0.0.1:4173/analytics?tab=live');
  await page.locator('.bs-broadcast-row').first().waitFor();
  assert.equal(await page.locator('.bs-broadcast-row').count(), 6);
  const logoRules = await page.locator('.bs-brand-clearspace img').evaluateAll((images) => images.map((image) => ({ loaded: image.complete && image.naturalWidth > 0, height: image.getBoundingClientRect().height, width: image.getBoundingClientRect().width, ratio: image.naturalWidth / image.naturalHeight, padding: parseFloat(getComputedStyle(image.parentElement).paddingTop), filter: getComputedStyle(image).filter })));
  for (const logo of logoRules) { assert.equal(logo.loaded, true); assert.ok(logo.height >= 20); assert.ok(logo.padding >= 5); assert.equal(logo.filter, 'none'); assert.ok(Math.abs(logo.width / logo.height - logo.ratio) < 0.02); }
  await page.screenshot({ path: path.join(output, 'desktop.jpg'), fullPage: true, type: 'jpeg', quality: 80 });
  await page.getByRole('button', { name: '데이터 다운로드', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '전체 데이터 저장 (.xlsx)', exact: true }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(output, 'statistics.xlsx');
  await download.saveAs(downloadPath);
  const book = XLSX.readFile(downloadPath);
  assert.equal(book.SheetNames.length, 7);
  assert.equal(XLSX.utils.sheet_to_json(book.Sheets['실시간 방송']).length, 28);
  assert.equal(book.Sheets['실시간 방송'].E2.t, 's');
  assert.equal(book.Sheets['실시간 방송'].E2.f, undefined);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '채팅', exact: true }).click();
  await page.getByText('채팅 통계를 준비하고 있어요', { exact: true }).waitFor();
  await page.getByRole('button', { name: '시청자', exact: true }).click();
  await page.getByLabel('스트리머·카테고리 검색', { exact: true }).fill('마인크래프트');
  await page.locator('.bs-search-results button').first().click();
  assert.ok(page.url().includes('category='));
  assert.equal(await page.locator('.bs-category[aria-pressed="true"]').count(), 1);
  assert.ok((await page.locator('.bs-filter-line').innerText()).includes('마인크래프트'));
  await page.goBack();
  await page.waitForFunction(() => !document.querySelector('.bs-category[aria-pressed="true"]'));
  await page.locator('.bs-platform-tabs').getByRole('button', { name: '치지직', exact: true }).click();
  assert.equal(await page.locator('.bs-platform-tabs button[aria-pressed="true"] img').isVisible(), true);
  await page.locator('.bs-broadcast-row .bs-person').first().click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.getByRole('link', { name: /방송 보러 가기/ }).getAttribute('rel'), 'noopener noreferrer');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.bs-platform-tabs button').count(), 3);
  assert.ok(!/트위치|씨미|Twitch/.test(await page.locator('body').innerText()));
  assert.equal(XLSX.utils.sheet_to_json(book.Sheets['플랫폼']).length, 2);
  await page.getByRole('button', { name: '수집 현황·기준', exact: true }).click();
  assert.ok(!/트위치|씨미/.test(await page.getByRole('dialog').innerText()));
  await page.keyboard.press('Escape');
  const search = page.getByRole('combobox', { name: '스트리머·카테고리 검색' });
  await search.fill('밤 하늘');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await page.getByRole('option', { name: /밤하늘/ }).waitFor();
  await page.screenshot({ path: path.join(output, 'search-desktop.jpg'), fullPage: false, type: 'jpeg', quality: 80 });
  await search.press('ArrowDown');
  await search.press('Enter');
  await page.getByRole('dialog').waitFor();
  assert.ok(await page.getByRole('link', { name: /플랫폼 채널 보기/ }).isVisible());
  assert.equal(await page.getByRole('link', { name: 'VDébut 프로필 보기' }).getAttribute('href'), '/creator/night');
  assert.ok((await page.getByRole('dialog').innerText()).includes('현재 수집 목록에 방송이 없어요'));
  await page.keyboard.press('Escape');
  await search.fill('테스트 스트리머 1');
  await search.press('Enter');
  await page.getByRole('option', { name: /테스트 스트리머 1\s*LIVE/ }).first().click();
  await page.getByRole('dialog').waitFor();
  await page.locator('.bs-streamer-broadcast').first().click();
  await page.getByRole('dialog').waitFor();
  assert.ok(await page.getByRole('link', { name: /방송 보러 가기/ }).isVisible());
  await page.keyboard.press('Escape');
  await search.fill('없는이름검증');
  await page.getByText('검색 결과가 없어요. 이름이나 띄어쓰기를 확인해 주세요.', { exact: true }).waitFor();
  await search.fill('실패검색');
  await page.locator('.bs-search-error').waitFor();
  await page.getByRole('button', { name: '검색어 지우기', exact: true }).click();
  await page.locator('.bs-platform-tabs').getByRole('button', { name: '전체', exact: true }).click();
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    const overflow = await page.locator('body').evaluate((element) => [...element.querySelectorAll('*')].filter((child) => { const r = child.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(child).position !== 'absolute'; }).map((element) => element.className));
    assert.deepEqual(overflow, [], `Overflow at ${width}px`);
    await page.screenshot({ path: path.join(output, `mobile-${width}.jpg`), fullPage: true, type: 'jpeg', quality: 80 });
  }
  await page.unroute('**/api/analytics/broadcast-statistics');
  await page.route('**/api/analytics/broadcast-statistics', (route) => route.fulfill({ status: 503, json: { error: 'test failure' } }));
  await page.reload();
  await page.getByRole('alert').waitFor();
  assert.equal(await page.locator('.bs-broadcast-row').count(), 0);
  assert.deepEqual(errors, []);
  } finally { await browser.close(); }
  console.log('PASS: desktop / 768 / 390 / 320, original logos and clearspace, filters/back, search/detail, unsupported data, chat state, complete XLSX export, request failure without example data.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
