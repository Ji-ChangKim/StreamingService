const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const esbuild = require('esbuild');

function load(file) {
  const source = path.resolve(__dirname, file);
  const loaded = new Module(source, module);
  loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
  return loaded.exports;
}

test('새 화면의 번역 키는 일본어·영어가 있으며 동적 활동명은 원문을 보존한다', () => {
  const { PORTAL_TRANSLATIONS, translatePortalText } = load('../../shared/portalTranslations.ts');
  const folder = path.resolve(__dirname, '../src/portal');
  for (const name of fs.readdirSync(folder).filter(name => name.endsWith('.tsx'))) {
    const source = ts.createSourceFile(name, fs.readFileSync(path.join(folder, name), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = node => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text;
        assert.ok(PORTAL_TRANSLATIONS[key]?.every(Boolean), `${name}: ${key}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  for (const language of ['ko', 'ja', 'en']) {
    const title = translatePortalText('{0} · 소개와 데뷔 일정 | VDébut', language, ['신규 버튜버 데뷔 캘린더']);
    assert.ok(title.startsWith('신규 버튜버 데뷔 캘린더'));
  }
});

test('언어 변경은 경로·필터를 보존하고 새 탭 링크에도 언어를 전달한다', () => {
  let url = new URL('https://dev.vdebut.live/upload?source=calendar#form');
  const storage = new Map();
  global.window = { location: url, history: { replaceState(_state, _title, next) { url = new URL(next, url); window.location = url; } } };
  global.document = { documentElement: { lang: 'ko' } };
  global.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) };
  const { setPortalLanguage, getPortalLanguage, portalLanguagePath } = load('../src/portal/portalLocale.ts');
  try {
    setPortalLanguage('ja');
    assert.equal(getPortalLanguage(), 'ja'); assert.equal(document.documentElement.lang, 'ja');
    assert.equal(url.pathname, '/upload'); assert.equal(url.hash, '#form'); assert.equal(url.searchParams.get('source'), 'calendar');
    assert.equal(storage.get('vd-language'), 'ja'); assert.equal(portalLanguagePath('/admin?view=legacy'), '/admin?view=legacy&lang=ja');
    setPortalLanguage('en'); assert.equal(getPortalLanguage(), 'en');
  } finally { delete global.window; delete global.document; delete global.localStorage; }
});

test('언어별 검색 정보는 공개 주소를 구분하고 사용자 소개는 원문으로 유지한다', () => {
  const { portalPageSeo } = load('../../shared/portalSeo.ts');
  const ja = portalPageSeo(new URL('https://vdebut.live/?lang=ja'));
  assert.match(ja.title, /新人VTuber/); assert.equal(ja.canonical, 'https://vdebut.live/?lang=ja');
  const en = portalPageSeo(new URL('https://vdebut.live/creator/test?lang=en'), { displayName: '원래 이름', description: '원래 소개' });
  assert.match(en.title, /^원래 이름 · Profile/); assert.equal(en.description, '원래 소개');
  assert.equal(portalPageSeo(new URL('https://vdebut.live/admin?lang=en')).robots, 'noindex, nofollow');
  const personal = portalPageSeo(new URL('https://vdebut.live/creator/test'), { displayName: '원래 이름', description: '긴 소개', headline: '한 줄 소개', bannerUrl: 'https://example.com/banner.jpg' });
  assert.equal(personal.description, '한 줄 소개'); assert.equal(personal.image, 'https://example.com/banner.jpg');
  assert.equal(portalPageSeo(new URL('https://vdebut.live/creator/test'), { displayName: '원래 이름', description: '긴 소개', bannerUrl: 'javascript:alert(1)', avatarUrl: 'https://example.com/avatar.jpg' }).image, 'https://example.com/avatar.jpg');
});
