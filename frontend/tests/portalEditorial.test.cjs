const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');
const path = require('node:path');
const esbuild = require('esbuild');

function load(file) {
  const source = path.resolve(__dirname, file);
  const loaded = new Module(source, module);
  loaded.paths = module.paths;
  loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false, loader: { '.css': 'empty' }, packages: 'external' }).outputFiles[0].text, source);
  return loaded.exports;
}

test('주간 안내는 선택 시간대의 주 경계를 지키고 날짜 없는 소개를 제외한다', () => {
  const { currentDebutWeek, profileExcerpt } = load('../../shared/portalEditorial.ts');
  const base = { slug: 'boundary', displayName: '등록 이름', dateState: 'FIXED', startAtUtc: '2026-10-18T00:30:00Z', debutDate: '2026-10-18', description: '등록된 소개' };
  const profiles = [base, { ...base, slug: 'time', dateState: 'TIME_TBD' }, { ...base, slug: 'date', dateState: 'DATE_TBD' }, { ...base, slug: 'none', dateState: 'NONE' }];
  const now = Date.parse('2026-10-15T06:00:00Z');
  assert.deepEqual(currentDebutWeek(profiles, 'Asia/Seoul', now).profiles, []);
  assert.deepEqual(currentDebutWeek(profiles, 'America/Los_Angeles', now).profiles.map((p) => p.slug), ['boundary']);
  assert.equal(profileExcerpt({ description: '원문\n소개 입니다', headline: '  입력한 한 줄  ' }), '입력한 한 줄');
  assert.equal(profileExcerpt({ description: '원문\n소개 입니다' }, 5), '원문 소개…');
  assert.equal(profileExcerpt({ description: '' }), '');
});

test('가이드와 통계 해설은 모든 지원 언어에서 번역하고 사용자 소개는 보존한다', () => {
  const { HOME_INTRO, GUIDE_INTRO, PORTAL_GUIDES, STATISTICS_GUIDE } = load('../../shared/portalEditorial.ts');
  const { PORTAL_TRANSLATIONS } = load('../../shared/portalTranslations.ts');
  for (const key of [HOME_INTRO, GUIDE_INTRO, ...PORTAL_GUIDES.flatMap((item) => [item.title, ...item.paragraphs, item.action]), ...STATISTICS_GUIDE.flatMap((item) => [item.title, item.text])]) {
    assert.ok(PORTAL_TRANSLATIONS[key]?.every(Boolean), key);
  }
});

test('초기 HTML에는 가이드 전문과 검토된 소개만 있으며 외부 입력을 이스케이프한다', () => {
  const { renderPortalPage } = load('../../backend/src/services/portalPageService.ts');
  const { reviewedProfile } = load('../../shared/contentReview.ts');
  const { PORTAL_GUIDES } = load('../../shared/portalEditorial.ts');
  const shell = '<html><head><title>VDébut</title></head><body><div id="root"></div></body></html>';
  const guide = renderPortalPage(shell, new URL('https://vdebut.live/guide'));
  for (const article of PORTAL_GUIDES) for (const paragraph of article.paragraphs) assert.ok(guide.includes(paragraph));
  const profile = { slug: 'fixture', displayName: '테스트 이름', description: '<script>소개</script>', tags: ['게임'], languages: ['한국어'], dateState: 'TIME_TBD', debutDate: '2026-11-01', timezone: 'Asia/Tokyo', noticeUrl: 'https://example.com/notice' };
  const url = new URL('https://vdebut.live/creator/fixture');
  assert.ok(!renderPortalPage(shell, url, profile).includes('테스트 이름'));
  const reviewed = reviewedProfile(profile, 'APPROVED', '2026-10-15T06:00:00Z');
  const html = renderPortalPage(shell, url, reviewed);
  assert.ok(html.includes('&lt;script&gt;소개&lt;/script&gt;'));
  assert.ok(html.includes('2026-11-01 · 시간 미정 (Asia/Tokyo)'));
  assert.ok(html.includes('소개 검토일'));
  assert.ok(!renderPortalPage(shell, url, { ...reviewed, description: '승인 후 수정된 소개' }).includes('승인 후 수정된 소개'));
});

test('통계 요약은 빈 기록의 원인을 추정하지 않고 조회 범위와 기록 수만 표시한다', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { ActivityNarrativeReport } = load('../src/components/analytics/ActivityDashboard.tsx');
  const streamer = { name: '테스트 채널', platform: 'SOOP' };
  const data = { meta: { from: '2026-10-01', to: '2026-10-15' }, summary: { broadcasts: 0, broadcastDays: 0, minutes: 0 } };
  assert.equal(renderToStaticMarkup(React.createElement(ActivityNarrativeReport, { streamer, data })), '');
  const html = renderToStaticMarkup(React.createElement(ActivityNarrativeReport, { streamer, data: { ...data, summary: { broadcasts: 2, broadcastDays: 1, minutes: 30 } } }));
  assert.match(html, /2026-10-01/);
  assert.match(html, /방송 2회/);
  assert.doesNotMatch(html, /최근 등록|모니터링|10분|활동 중인|주로/);
});
