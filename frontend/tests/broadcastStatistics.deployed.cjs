const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.STATISTICS_PLAYWRIGHT_MODULE || 'playwright');
const XLSX = require('../node_modules/xlsx');

// 배포된 개발 사이트는 응답을 가로채지 않고 실제 API와 화면을 함께 확인한다.
async function main() {
  const output = path.resolve(__dirname, '../../.cache/statistics-browser');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/analytics/broadcast-statistics'), { timeout: 40000 });
    const navigation = await page.goto('https://dev.vdebut.live/analytics?tab=live', { waitUntil: 'domcontentloaded' });
    assert.equal(navigation.status(), 200);
    const response = await responsePromise;
    assert.equal(response.status(), 200);
    const data = await response.json();
    await page.locator('.bs-broadcast-row').first().waitFor();
    assert.equal(data.sources.find((source) => source.platform === 'CHZZK').state, 'available');
    assert.ok(data.lives.filter((row) => row.platform === 'CHZZK').length >= 95);
    assert.equal(data.sources.find((source) => source.platform === 'SOOP').state, 'available');
    assert.equal(data.sources.find((source) => source.platform === 'SOOP').checkedChannels, 40);
    assert.equal(data.meta.historyState, 'available');
    const total = data.lives.reduce((sum, row) => sum + row.viewers, 0);
    assert.equal(await page.locator('.bs-grand strong').innerText(), total.toLocaleString('ko-KR'));
    assert.equal(await page.locator('.bs-chart-summary strong').innerText(), total.toLocaleString('ko-KR'));
    await page.waitForFunction(() => [...document.querySelectorAll('.bs-brand-clearspace img')].every((image) => image.complete), { timeout: 15000 });
    const logos = await page.locator('.bs-brand-clearspace img').evaluateAll((images) => images.map((image) => ({ loaded: image.complete && image.naturalWidth > 0, height: image.getBoundingClientRect().height, padding: parseFloat(getComputedStyle(image.parentElement).paddingTop), filter: getComputedStyle(image).filter })));
    for (const logo of logos) { assert.ok(logo.loaded); assert.ok(logo.height >= 20); assert.ok(logo.padding >= 5); assert.equal(logo.filter, 'none'); }
    await page.screenshot({ path: path.join(output, 'deployed-desktop.jpg'), fullPage: true, type: 'jpeg', quality: 85 });
    await page.getByRole('button', { name: '데이터 다운로드', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '전체 데이터 저장 (.xlsx)', exact: true }).click();
    const download = await downloadPromise;
    const file = path.join(output, 'deployed-statistics.xlsx');
    await download.saveAs(file);
    const book = XLSX.readFile(file);
    assert.equal(XLSX.utils.sheet_to_json(book.Sheets['실시간 방송']).length, data.lives.length);
    assert.equal(book.SheetNames.length, 7);
    await page.keyboard.press('Escape');
    await page.locator('.bs-broadcast-row .bs-person').first().click();
    await page.getByRole('dialog').waitFor();
    assert.ok(await page.getByRole('link', { name: /방송 보러 가기/ }).isVisible());
    await page.keyboard.press('Escape');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(200);
      const bounds = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(bounds.document <= bounds.viewport, `Overflow at ${width}px`);
      await page.screenshot({ path: path.join(output, `deployed-mobile-${width}.jpg`), type: 'jpeg', quality: 85 });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'deployed-data.json'), JSON.stringify(data, null, 2));
    console.log(JSON.stringify({ status: 'PASS', url: page.url(), generatedAt: data.meta.generatedAt, sources: data.sources, lives: data.lives.length, points: data.points.length, peaks: data.peaks.length, totalViewers: total, browserErrors: errors.length, downloadRows: XLSX.utils.sheet_to_json(book.Sheets['실시간 방송']).length }, null, 2));
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
