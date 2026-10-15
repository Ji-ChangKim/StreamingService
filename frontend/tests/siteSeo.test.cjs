const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

function load(file) {
  const source = path.resolve(__dirname, file);
  const loaded = new Module(source, module);
  loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
  return loaded.exports;
}

test('대표 주소는 언어만 유지하며 없는 소개·조회 실패·개인 화면은 검색에서 제외한다', () => {
  const { portalPageSeo } = load('../../shared/portalSeo.ts');
  const { PORTAL_INDEX_PATHS } = load('../../shared/siteSeo.ts');
  const descriptions = new Set();
  for (const route of PORTAL_INDEX_PATHS) {
    const ko = portalPageSeo(new URL(`https://vdebut.live${route}`));
    descriptions.add(ko.description);
    for (const language of ['ja', 'en']) {
      const seo = portalPageSeo(new URL(`https://vdebut.live${route}?lang=${language}&utm_source=test#content`));
      assert.equal(seo.canonical, `https://vdebut.live${route}?lang=${language}`);
      assert.notEqual(seo.description, ko.description, route);
    }
  }
  assert.equal(descriptions.size, PORTAL_INDEX_PATHS.length);
  assert.equal(portalPageSeo(new URL('https://vdebut.live/creators/?lang=ko')).canonical, 'https://vdebut.live/creators');
  for (const route of ['/creator/missing', '/unknown', '/admin', '/me/favorites', '/submissions/private']) {
    const seo = portalPageSeo(new URL(`https://vdebut.live${route}?key=private`));
    assert.match(seo.robots, /noindex/); assert.deepEqual(seo.alternates, []);
    assert.equal(new URL(seo.canonical).search, '');
  }
  assert.match(portalPageSeo(new URL('https://vdebut.live/creators'), undefined, { unavailable: true }).robots, /noindex/);
});

test('사이트맵은 공개 소개와 언어별 canonical을 사용하고 임의 수정일을 만들지 않는다', () => {
  const { portalSitemap } = load('../../backend/src/services/portalPageService.ts');
  const { reviewedProfile } = load('../../shared/contentReview.ts');
  const profile = { slug: 'a&b', displayName: '테스트', description: '테스트 소개', tags: [], languages: [] };
  const approved = reviewedProfile(profile, 'APPROVED', '2026-10-15');
  const xml = portalSitemap([approved, approved, { ...profile, slug: 'hidden' }]);
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(locations).size, locations.length);
  assert.equal(locations.filter((url) => url.includes('/creator/a%26b')).length, 3);
  assert.doesNotMatch(xml, /hidden|<lastmod>|\/admin|\/me\/|\/submissions\//);
  assert.match(xml, /hreflang="x-default"/);
  const fallback = fs.readFileSync(path.resolve(__dirname, '../public/sitemap.xml'), 'utf8');
  assert.doesNotMatch(fallback, /<lastmod>|\?lang=ko/);
  for (const location of [...fallback.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])) assert.ok(locations.includes(location));
});

test('초기 HTML은 오래된 공유·구조화·언어 태그를 제거하고 한 벌만 제공한다', () => {
  const { renderPortalPage } = load('../../backend/src/services/portalPageService.ts');
  const { renderActivityPage } = load('../../backend/src/services/activityPageService.ts');
  const shell = '<html><head><title>old</title><meta name="twitter:title" content="OLD"><link rel="canonical" href="https://example.com"><link rel="alternate" hreflang="fr" href="https://example.com"><script type="application/ld+json">{"old":true}</script></head><body><div id="root"></div></body></html>';
  const portal = renderPortalPage(shell, new URL('https://vdebut.live/guide?lang=en&utm_source=test'));
  assert.equal((portal.match(/application\/ld\+json/g) || []).length, 1);
  assert.equal((portal.match(/rel="canonical"/g) || []).length, 1);
  assert.doesNotMatch(portal, /"old"|hreflang="fr"|content="OLD"/);
  const filters = { platform: 'ALL', from: '2026-10-01', to: '2026-10-15', channel: '', category: '' };
  const data = { meta: { ...filters }, streamer: null, summary: { streamers: 0, broadcasts: 0, minutes: 0 }, categories: [], broadcasts: [] };
  const activity = renderActivityPage(shell, new URL('https://vdebut.live/analytics?lang=ko'), filters, data);
  assert.match(activity, /name="robots" content="index,follow"/);
  assert.match(activity, /name="twitter:title" content="치지직·SOOP 방송 활동 통계/);
  assert.doesNotMatch(activity, /hreflang|"old"|content="OLD"/);
});

test('통계 대표 주소는 조회 조건과 추적 값을 제거하고 실제 필터 화면만 noindex로 둔다', () => {
  const { activitySeo, activityNoindex } = load('../../shared/activitySeo.ts');
  const data = { summary: { broadcasts: 1 }, streamer: null };
  const filters = { platform: 'CHZZK', channel: '' };
  assert.equal(activitySeo(filters, data).canonical, 'https://vdebut.live/analytics/chzzk');
  for (const query of ['lang=ko', 'lang=en&utm_source=site', 'back=%2Fcreators']) assert.equal(activityNoindex(new URL(`https://vdebut.live/analytics?${query}`), data), false);
  for (const query of ['search=test', 'from=2026-10-01', 'category=game', 'weekday=3&hour=10']) assert.equal(activityNoindex(new URL(`https://vdebut.live/analytics?${query}`), data), true);
  assert.equal(activityNoindex(new URL('https://vdebut.live/analytics'), null), true);
  assert.equal(activityNoindex(new URL('https://vdebut.live/analytics/missing'), data), true);
  assert.equal(activityNoindex(new URL('https://vdebut.live/analytics/streamer/bad'), data), true);
});

test('소개 API 실패나 손상된 응답은 정상 빈 목록으로 바뀌지 않는다', async () => {
  const { fetchPublicProfiles } = load('../src/portal/portalApi.ts');
  const original = global.fetch;
  try {
    global.fetch = async () => new Response('{"profiles":[]}', { status: 200 });
    assert.deepEqual(await fetchPublicProfiles(), []);
    for (const body of ['', '{broken', '{}', '{"profiles":null}']) {
      global.fetch = async () => new Response(body, { status: 200 });
      await assert.rejects(fetchPublicProfiles());
    }
    global.fetch = async () => new Response('{"error":"test error"}', { status: 503 });
    await assert.rejects(fetchPublicProfiles());
  } finally { global.fetch = original; }
});
