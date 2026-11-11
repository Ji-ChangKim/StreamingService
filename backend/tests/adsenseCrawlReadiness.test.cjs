const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

// 초기 HTML 렌더러·robots 규칙·공개 검토 기준을 실제 소스로 함께 검증한다.
function load(entry) {
  const file = path.resolve(__dirname, entry);
  const bundle = esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
  const loaded = new Module(file, module);
  loaded._compile(bundle.outputFiles[0].text, file);
  return loaded.exports;
}
const { renderPortalPage } = load('../src/services/portalPageService.ts');
const { siteRobots } = load('../../shared/siteSeo.ts');
const { isPublicProfile } = load('../../shared/contentReview.ts');
const template = fs.readFileSync(path.resolve(__dirname, '../../frontend/dist/portal.html'), 'utf8');
const profile = (slug, displayName, description) => ({ slug, displayName, description, avatarUrl: '', platform: 'CHZZK', channelUrl: 'https://chzzk.naver.com/abc', countryCode: 'KR', languages: [], tags: [], agency: '', xUrl: '', dateState: 'FIXED', debutDate: '2026-11-20', debutTime: '20:00', timezone: 'Asia/Seoul', startAtUtc: '2026-11-20T11:00:00Z', targetMonth: '', ownerVerified: false, source: 'EXISTING' });

test('개인정보처리방침 초기 HTML에 광고 쿠키 고지와 거부 방법이 들어간다', () => {
  const html = renderPortalPage(template, new URL('https://vdebut.live/privacy'));
  assert.match(html, /Google AdSense/);
  assert.match(html, /제3자 광고 사업자는 쿠키를 사용/);
  assert.match(html, /href="https:\/\/adssettings.google.com\/"/);
  assert.match(html, /href="https:\/\/www.aboutads.info\/choices\/"/);
  assert.match(html, /mailto:ru_0120@naver.com/);
  const en = renderPortalPage(template, new URL('https://vdebut.live/privacy?lang=en'));
  assert.match(en, /Third-party vendors, including Google, use cookies/);
});

test('약관·서비스 소개 초기 HTML에 본문이 들어간다', () => {
  assert.match(renderPortalPage(template, new URL('https://vdebut.live/terms')), /등록 콘텐츠의 공개 기준/);
  const about = renderPortalPage(template, new URL('https://vdebut.live/about'));
  assert.match(about, /누가 데뷔하는지, 어떤 방송을 하는지/);
  assert.match(about, /href="\/creators"/);
});

test('소개 목록 초기 HTML은 공개 소개만 링크하고 외부 문자열을 이스케이프한다', () => {
  const visible = profile('safe-one', '안전한<b>이름</b>', '노래와 게임 방송을 합니다.');
  const held = { ...profile('held-one', '보류 대상', '팬아트 태그 R-18'), };
  const html = renderPortalPage(template, new URL('https://vdebut.live/creators'), undefined, [visible, held]);
  assert.match(html, /공개된 버튜버 소개 1명/);
  assert.match(html, /href="\/creator\/safe-one"/);
  assert.match(html, /안전한&lt;b&gt;이름&lt;\/b&gt;/);
  assert.doesNotMatch(html, /held-one/);
  const ja = renderPortalPage(template, new URL('https://vdebut.live/creators?lang=ja'), undefined, [visible]);
  assert.match(ja, /href="\/creator\/safe-one\?lang=ja"/);
});

test('운영 robots는 공개 조회 API만 허용하고 관리·소유자 API는 막는다', () => {
  const robots = siteRobots('vdebut.live');
  for (const line of ['Disallow: /api/', 'Allow: /api/v1/portal/profiles', 'Allow: /api/v1/events', 'Allow: /api/analytics/', 'Disallow: /api/v1/portal/profiles/*/access', 'Disallow: /admin']) assert.ok(robots.split('\n').includes(line), line);
  assert.doesNotMatch(robots, /Allow: \/api\/v1\/portal\/admin|Allow: \/api\/v1\/admin/);
  assert.equal(siteRobots('dev.vdebut.live'), 'User-agent: *\nDisallow: /\n');
  assert.equal(fs.readFileSync(path.resolve(__dirname, '../../frontend/public/robots.txt'), 'utf8').replace(/\n\n/g, '\n'), robots);
});

test('성인용 태그 안내가 있는 소개는 검토 전 공개하지 않는다', () => {
  assert.equal(isPublicProfile(profile('a', '이름', '팬아트 태그 #R18 은 개인적으로')), false);
  assert.equal(isPublicProfile(profile('b', '이름', 'ファンアートタグ NSFW')), false);
  assert.equal(isPublicProfile(profile('c', '이름', '노래 방송 R-180 프로젝트')), true);
});
