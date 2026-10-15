const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = path.resolve(__dirname, '../src/portal/CreatorProfile.tsx');
const loaded = new Module(source, module);
loaded.paths = Module._nodeModulePaths(path.dirname(source));
loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.css': 'empty' }, external: ['react', 'react/jsx-runtime'], write: false }).outputFiles[0].text, source);
const { ProfileExperience } = loaded.exports;
const profile = { slug: 'legacy-review-date', displayName: '소개 검증', description: '게임과 소통을 소개합니다.', platform: 'SOOP', channelUrl: 'https://www.sooplive.com/station/example', avatarUrl: '', agency: '', countryCode: '', languages: [], tags: [], xUrl: '', source: 'EXISTING', ownerVerified: false, dateState: 'TIME_TBD', debutDate: '2026-08-08', debutTime: '18:00', timezone: 'Asia/Tokyo', startAtUtc: '', targetMonth: '2026-08' };

// 실제 상세 컴포넌트를 렌더링해 기록 없는 소개의 오류와 임의 검토일 표시를 막는다.
test('기존 소개는 검토일 기록 없이 렌더링되고 시간 미정 안내를 유지한다', () => {
  const oldWindow = global.window;
  global.window = { location: { origin: 'https://dev.vdebut.live', search: '' } };
  try {
    const html = renderToStaticMarkup(React.createElement(ProfileExperience, { profile, onNavigate() {} }));
    assert.match(html, /게임과 소통을 소개합니다/);
    assert.match(html, /2026-08-08.*시간 미정/);
    assert.doesNotMatch(html, /소개 검토일|18:00/);
    const reviewSource = path.resolve(__dirname, '../../shared/contentReview.ts');
    const policy = new Module(reviewSource, module);
    policy._compile(esbuild.buildSync({ entryPoints: [reviewSource], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, reviewSource);
    const approved = policy.exports.reviewedProfile(profile, 'APPROVED', '2026-10-15T00:00:00Z');
    const approvedHtml = renderToStaticMarkup(React.createElement(ProfileExperience, { profile: approved, onNavigate() {} }));
    assert.match(approvedHtml, /소개 검토일/);
    assert.match(approvedHtml, /datetime="2026-10-15T00:00:00Z"/i);
  } finally { global.window = oldWindow; }
});
