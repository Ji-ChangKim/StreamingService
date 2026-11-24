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

test('번역 사전은 데이터 모듈을 불러온 뒤에만 등록된다', () => {
  const registry = load('../../shared/portalTranslations.ts');
  assert.equal(registry.hasPortalTranslations(), false);
  assert.equal(registry.translatePortalText('이용약관', 'en'), '이용약관');
  const data = load('../../shared/portalTranslationData.ts');
  assert.ok(Object.keys(data.PORTAL_TRANSLATIONS).length > 500);
  assert.equal(data.PORTAL_TRANSLATIONS['이용약관'][1], 'Terms of use');
});

test('화면 코드는 원본 대용량 이미지 대신 WebP를 사용한다', () => {
  const root = path.resolve(__dirname, '../../frontend');
  for (const file of ['src/portal/PortalApp.tsx', 'src/portal/portal.css', 'src/portal/wikiContent.css', 'src/portal/WikiContent.tsx']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /\/logo\.png|spotlight_stage_bg\.png|bg_profile\.png/, file);
  }
  for (const file of ['public/logo.webp', 'public/images/spotlight_stage_bg.webp', 'public/images/bg_profile.webp']) assert.ok(fs.statSync(path.join(root, file)).size < 40 * 1024, file);
});

test('소개 상세 첫 HTML에 공개 프로필을 넣고 검토 사본은 내려보내지 않는다', () => {
  const reviewed = { ...profile('veko', '베코', '노래 방송을 합니다.'), contentReview: { state: 'APPROVED', snapshot: '', reviewedAt: '2026-11-01T00:00:00Z' } };
  const { reviewSnapshot } = load('../../shared/contentReview.ts');
  reviewed.contentReview.snapshot = reviewSnapshot(reviewed);
  const html = renderPortalPage(template, new URL('https://vdebut.live/creator/veko'), reviewed);
  const json = html.match(/<script type="application\/json" id="vd-initial-profile">([\s\S]*?)<\/script>/);
  assert.ok(json, 'initial profile script');
  const embedded = JSON.parse(json[1]);
  assert.equal(embedded.slug, 'veko');
  assert.equal(embedded.contentReview.snapshot, '');
  assert.equal(embedded.contentReview.reviewedAt, '2026-11-01T00:00:00Z');
  assert.doesNotMatch(renderPortalPage(template, new URL('https://vdebut.live/creators')), /vd-initial-profile/);
});

test('자동 등록 채널 기록은 공개 목록에서 빠지고 상세 조회는 유지된다', async () => {
  const { readPublicPortalProfiles, readPublicPortalProfileBySlug } = load('../src/services/portalProfileRepository.ts');
  const row = (slug, name, description, time) => ({ slug, display_name: name, description, profile_image_url: '', agency_name: '', country_code: 'KR', x_url: '', debut_date: '2026-11-01', debut_time: time, timezone: 'Asia/Seoul', start_at_utc: '2026-11-01T11:00:00Z', platform: 'CHZZK', channel_url: 'https://chzzk.naver.com/' + 'a'.repeat(32) });
  const rows = [row('auto-one', '자동', '자동 스트리머의 채널입니다.', '00:00'), row('debut-one', '데뷔', '노래 방송으로 데뷔합니다.', '20:00')];
  const db = { prepare: (sql) => ({ bind: () => ({ first: async () => sql.includes('portal_profiles') ? null : rows[0] }), all: async () => ({ results: sql.includes('streamerChannel_info') ? rows : [] }) }) };
  assert.deepEqual((await readPublicPortalProfiles(db)).map((p) => p.slug), ['debut-one']);
  assert.equal((await readPublicPortalProfileBySlug(db, 'auto-one'))?.slug, 'auto-one');
});

test('검색 허용 기준: 직접 쓴 소개 100자, 또는 50자 + 최근 30일 방송 5회만 사이트맵에 들어간다(기획 41 A1)', () => {
  const { isProfileIndexable, profileOwnTextLength } = load('../../shared/contentReview.ts');
  const { portalSitemap } = load('../src/services/portalPageService.ts');
  const thin = profile('thin-one', '하티', '2026.07.02 SOOP 데뷔 버튜버');
  const long = '노래와 종합 게임을 주로 하며 매주 금요일 밤 팬들과 함께 신곡 커버를 공개합니다. '.repeat(4);
  const rich = profile('rich-one', '리치', long);
  const mid = { ...profile('mid-one', '미드', '노래와 종합 게임을 주로 하며 매주 금요일 밤 팬들과 함께 신곡 커버를 공개합니다 매주 화요일과 목요일에는 쉬고 주말에는 길게 방송해요'), platform: 'CHZZK', channelUrl: 'https://chzzk.naver.com/' + 'b'.repeat(32) };
  assert.ok(profileOwnTextLength(rich) >= 100);
  assert.ok(profileOwnTextLength(mid) >= 50 && profileOwnTextLength(mid) < 100);
  assert.equal(isProfileIndexable(thin, 99), false);
  assert.equal(isProfileIndexable({ ...thin, tags: ['노래'] }), false); // 태그만으로는 검색 허용이 되지 않는다
  assert.equal(isProfileIndexable(rich), true);
  assert.equal(isProfileIndexable(mid, 4), false);
  assert.equal(isProfileIndexable(mid, 5), true);
  const xml = portalSitemap([thin, rich, mid], new Map([['CHZZK:' + 'b'.repeat(32), 6]]));
  assert.doesNotMatch(xml, /creator\/thin-one/);
  assert.match(xml, /creator\/rich-one/);
  assert.match(xml, /creator\/mid-one/);
  assert.doesNotMatch(portalSitemap([mid]), /creator\/mid-one/); // 방송 기록이 없으면 빠진다
});

test('입력 화면은 검색 제외·사이트맵 제외(기획 41 A2)', () => {
  const { portalSitemap } = load('../src/services/portalPageService.ts');
  const xml = portalSitemap([]);
  assert.doesNotMatch(xml, /vdebut\.live\/upload/);
  assert.doesNotMatch(xml, /creators\/register/);
  assert.match(xml, /vdebut\.live\/privacy/);
  assert.match(renderPortalPage(template, new URL('https://vdebut.live/upload')), /<meta name="robots" content="noindex, follow">/);
  assert.match(renderPortalPage(template, new URL('https://vdebut.live/creators/register')), /<meta name="robots" content="noindex, follow">/);
});

test('상세 첫 HTML: 카테고리 없음 문장을 쓰지 않고, 방송 패턴 문장을 넣는다(기획 41 A3)', () => {
  const { profileStoryBody } = load('../src/services/portalEditorialBody.ts');
  const now = Date.parse('2026-11-24T03:00:00Z');
  const log = [];
  for (let i = 1; i <= 28; i += 1) {
    const d = new Date(now - i * 86400000); const wd = (d.getUTCDay() + 6) % 7;
    if (wd === 2 || wd === 4) continue; // 수·금 휴방
    log.push({ streamId: 's' + i, date: d.toISOString(), title: 't', category: '토크', isGame: false, minutes: 120, avg: 10, peak: 20 });
  }
  const board = { kpis: { broadcasts: log.length, minutes: log.length * 120, avg: 10, peak: 20 }, games: [{ name: '카테고리 없음', isGame: false, share: 70, avg: 10 }, { name: '토크', isGame: false, share: 30, avg: 10 }], log, heat: [] };
  const p = { ...profile('pat-one', '패턴', '소개'), dateState: 'FIXED', startAtUtc: '2026-08-01T11:00:00Z', tags: ['버튜버', '노래'] };
  const html = profileStoryBody(p, 'ko', board, now);
  assert.doesNotMatch(html, /카테고리 없음/);
  assert.match(html, /「토크」\(30%\)/);
  assert.match(html, /최근 4주 동안 평일엔 주 3일, 주말엔 주 2일 방송했어요\. 수·금요일은 보통 쉬었어요\./);
  assert.doesNotMatch(html, /버튜버·노래|버튜버 방송/);
});

test('개인정보처리방침에 운영 주체·보호책임자·시행일이 세 언어로 들어간다', () => {
  const ko = renderPortalPage(template, new URL('https://vdebut.live/privacy'));
  assert.match(ko, /운영 주체 및 개인정보 보호책임자/);
  assert.match(ko, /개인정보 보호책임자: VDébut 운영자 \(이메일 ru_0120@naver.com\)/);
  assert.match(ko, /2026년 11월 17일부터 시행/);
  assert.match(ko, /개인정보침해신고센터/);
  assert.match(ko, /Cloudflare, Inc\. \(미국\)/);
  assert.doesNotMatch(ko, /비영리|비상업/);
  assert.match(renderPortalPage(template, new URL('https://vdebut.live/privacy?lang=en')), /Privacy officer: VDébut operator/);
  assert.match(renderPortalPage(template, new URL('https://vdebut.live/privacy?lang=ja')), /個人情報保護責任者：VDébut運営者/);
});

test('프로필 일본어·영어판은 한국어판을 canonical로 가리키고 사이트맵에는 한국어판만 싣는다', () => {
  const { portalSitemap } = load('../src/services/portalPageService.ts');
  const rich = profile('rich-one', '리치', '노래와 종합 게임을 주로 하며 매주 금요일 밤 팬들과 함께 신곡 커버를 공개합니다. '.repeat(4));
  const ja = renderPortalPage(template, new URL('https://vdebut.live/creator/rich-one?lang=ja'), rich);
  assert.match(ja, /<link rel="canonical" href="https:\/\/vdebut.live\/creator\/rich-one">/);
  assert.doesNotMatch(ja, /hreflang/);
  assert.match(ja, /<html lang="ja">/); // 방문자 화면 언어는 그대로
  const ko = renderPortalPage(template, new URL('https://vdebut.live/creator/rich-one'), rich);
  assert.doesNotMatch(ko, /hreflang/);
  // 안내 페이지는 그대로 세 언어 연결을 유지한다.
  const guideJa = renderPortalPage(template, new URL('https://vdebut.live/guide?lang=ja'));
  assert.match(guideJa, /<link rel="canonical" href="https:\/\/vdebut.live\/guide\?lang=ja">/);
  assert.match(guideJa, /hreflang="en"/);
  const xml = portalSitemap([rich]);
  assert.match(xml, /<loc>https:\/\/vdebut.live\/creator\/rich-one<\/loc>/);
  assert.doesNotMatch(xml, /creator\/rich-one\?lang=/);
  assert.match(xml, /<loc>https:\/\/vdebut.live\/guide\?lang=ja<\/loc>/);
  assert.equal((xml.match(/<url>/g) || []).length, 7 * 3 + 1); // 안내 9쪽 중 입력 화면 2쪽은 제외(기획 41 A2)
});

test('홈·소개 목록 첫 HTML은 목록 요청을 미리 시작하고, 홈에는 실제 데뷔 일정이 들어간다', () => {
  const preload = /<link rel="preload" href="\/api\/v1\/portal\/profiles\?version=3" as="fetch" crossorigin="anonymous">/;
  assert.match(renderPortalPage(template, new URL('https://vdebut.live/creators')), preload);
  assert.doesNotMatch(renderPortalPage(template, new URL('https://vdebut.live/guide')), preload);
  const soon = new Date(Date.now() + 2 * 86400000).toISOString();
  const debut = { ...profile('soon-one', '곧데뷔', '노래와 게임을 주로 하는 버튜버예요.'), startAtUtc: soon, debutDate: soon.slice(0, 10), agency: '개인세' };
  const home = renderPortalPage(template, new URL('https://vdebut.live/'), undefined, [debut]);
  assert.match(home, preload);
  assert.match(home, /href="\/creator\/soon-one">곧데뷔<\/a>/);
  assert.doesNotMatch(home, /개인세/);
});

test('요약을 자를 때 이모지를 반으로 가르지 않는다(깨진 문자 방지)', () => {
  const text = `${'가'.repeat(89)}🩵뒤에 더 있어요`;
  const html = renderPortalPage(template, new URL('https://vdebut.live/creators'), undefined, [profile('emoji-one', '이모지', text)]);
  assert.doesNotMatch(html, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/);
  assert.match(html, /🩵…/);
});
