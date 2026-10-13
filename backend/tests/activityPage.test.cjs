const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

// 운영 템플릿과 실제 페이지 렌더러를 함께 검증한다.
const file = path.resolve(__dirname, '../src/services/activityPageService.ts');
const bundle = esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
const loaded = new Module(file, module);
loaded._compile(bundle.outputFiles[0].text, file);
const { renderActivityPage, activitySitemapEntries } = loaded.exports;
const template = fs.readFileSync(path.resolve(__dirname, '../../frontend/dist/index.html'), 'utf8');
const filters = { from: '2026-10-01', to: '2026-10-06', platform: 'ALL', channel: '', category: '' };
const channel = 'CHZZK:' + 'a'.repeat(32);
const data = { meta: { ...filters, generatedAt: new Date().toISOString() }, streamer: null,
  summary: { streamers: 1, broadcasts: 1, minutes: 30, broadcastDays: 1, categoryCount: 1 },
  heatmap: [], starts: [], daily: [], categoryOptions: [], categories: [{ name: '소통', broadcasts: 1, minutes: 30 }],
  broadcasts: [{ channelKey: channel, channelName: '검증 스트리머', title: '</script><img src=x onerror=alert(1)>', categories: '소통', minutes: 30 }] };

test('초기 HTML은 실제 방송과 링크를 표시하고 안전한 JSON으로 같은 자료를 전달한다', () => {
  const html = renderActivityPage(template, new URL('https://vdebut.live/analytics'), filters, data);
  assert.match(html, /<h1>방송 통계<\/h1>/);
  assert.match(html, /검증 스트리머/);
  assert.match(html, /href="\/analytics\/streamer\/CHZZK%3A/);
  assert.match(html, /&lt;\/script&gt;&lt;img/);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('class="preloader"'));
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.match(html, /canonical" href="https:\/\/vdebut.live\/analytics"/);
  const bootstrap = html.match(/id="activity-bootstrap" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(bootstrap).data, data);
});

test('개인·플랫폼 대표 주소와 개발·검색·빈 기록의 색인 정책을 적용한다', () => {
  const personal = { ...data, streamer: { name: '검증 & 스트리머', platform: 'CHZZK' } };
  const html = renderActivityPage(template, new URL('https://vdebut.live/analytics/streamer/' + encodeURIComponent(channel)), { ...filters, channel }, personal);
  assert.match(html, /검증 &amp; 스트리머 방송 통계 · 치지직/);
  assert.match(html, /name="robots" content="index,follow"/);
  for (const url of ['https://dev.vdebut.live/analytics', 'https://vdebut.live/analytics?search=test', 'https://vdebut.live/analytics?from=2026-10-01']) {
    assert.match(renderActivityPage(template, new URL(url), filters, data), /name="robots" content="noindex,follow"/);
  }
  assert.match(renderActivityPage(template, new URL('https://vdebut.live/analytics/streamer/' + encodeURIComponent(channel)), { ...filters, channel }, { ...personal, summary: { ...data.summary, broadcasts: 0 } }), /noindex,follow/);
  assert.match(renderActivityPage(template, new URL('https://vdebut.live/analytics/chzzk'), { ...filters, platform: 'CHZZK' }, data), /canonical" href="https:\/\/vdebut.live\/analytics\/chzzk"/);
});

test('통계 사이트맵에는 실제 기록이 있는 채널과 실제 변경 시각을 사용한다', async () => {
  const xml = await activitySitemapEntries({ prepare() { return { async all() { return { results: [{ channel, modified: '2026-10-06T00:00:00.000Z' }] }; } }; } });
  assert.match(xml, /analytics\/chzzk/);
  assert.match(xml, /analytics\/streamer\/CHZZK%3A/);
  assert.match(xml, /<lastmod>2026-10-06T00:00:00.000Z<\/lastmod>/);
});
