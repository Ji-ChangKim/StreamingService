const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// 실제 공용 코드와 화면을 묶어 주소 검증·노출 순서·하위 호환을 확인한다.
function load(file) {
  const source = path.resolve(__dirname, file);
  const loaded = new Module(source, module);
  loaded.paths = Module._nodeModulePaths(path.dirname(source));
  loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.css': 'empty' }, external: ['react', 'react/jsx-runtime'], write: false }).outputFiles[0].text, source);
  return loaded.exports;
}
const { profileMediaSource, cleanProfileMedia, profileMediaItems, profileFirstReplay } = load('../../shared/profileMedia.ts');
const { cleanProfilePresentation } = load('../../shared/profilePresentation.ts');
const { reviewedProfile, isPublicProfile } = load('../../shared/contentReview.ts');
const { ProfileExperience } = load('../src/portal/CreatorProfile.tsx');
const profile = { slug: 'shizuki-toa', displayName: '시즈키 토아', description: '공식 방송 소개', avatarUrl: '', platform: 'CHZZK', channelUrl: 'https://chzzk.naver.com/2299fad4bebb504b0978e1ec08b2f7d3', countryCode: 'KR', languages: ['한국어'], tags: [], agency: '스텔라이브', xUrl: '', dateState: 'FIXED', debutDate: '2026-10-17', debutTime: '17:00', timezone: 'Asia/Seoul', startAtUtc: '2026-10-17T08:00:00Z', targetMonth: '2026-10', source: 'EXISTING', ownerVerified: false };
const cover = { provider: 'YOUTUBE', kind: 'COVER', url: 'https://youtu.be/MZNKiadMo3U', title: '제육감', featured: true };
const pv = { provider: 'YOUTUBE', kind: 'GROUP_PV', url: 'https://youtu.be/tlCeLkw8Upc', title: 'ABYSS 공통 PV' };

// 제공 플랫폼의 공개 영상만 허용하고 위장 도메인·채널·HTML 주소를 차단한다.
test('플랫폼별 영상 주소를 정규화하고 지원하지 않는 주소는 거절한다', () => {
  assert.equal(profileMediaSource(cover.url).provider, 'YOUTUBE');
  assert.equal(profileMediaSource('https://chzzk.naver.com/clips/fixtureClip01?from=share').embedUrl, 'https://chzzk.naver.com/embed/clip/fixtureClip01');
  const replay = profileMediaSource('https://chzzk.naver.com/video/123456');
  assert.equal(replay.provider, 'CHZZK');
  assert.equal(replay.embedUrl, '');
  for (const host of ['vod.sooplive.com', 'vod.sooplive.co.kr', 'vod.afreecatv.com']) {
    assert.equal(profileMediaSource(`https://${host}/player/123456`).url, 'https://vod.sooplive.com/player/123456');
    assert.match(profileMediaSource(`https://${host}/player/123456/catch`).embedUrl, /^https:\/\/vod\.sooplive\.com\/player\/123456\/embed/);
  }
  for (const url of ['javascript:alert(1)', 'https://chzzk.naver.com.attacker.example/clips/fixtureClip01', 'https://vod.sooplive.com@attacker.example/player/123', 'https://username@vod.sooplive.com/player/123', 'https://vod.sooplive.com:444/player/123', 'https://www.sooplive.com/station/example', 'https://chzzk.naver.com/2299fad4bebb504b0978e1ec08b2f7d3', 'https://youtu.be/not-an-id', 'https://example.com/embed', 'https://vod.sooplive.com/player/123/embed']) assert.equal(profileMediaSource(url), null, url);
});

// 목록을 검증하고 대표 선택·중복 영상·새 검토 항목의 우회 공개를 방지한다.
test('대표 영상과 공통 PV를 함께 저장하고 검수 스냅샷에 포함한다', () => {
  const media = cleanProfileMedia([cover, pv]);
  assert.equal(media.length, 2);
  assert.throws(() => cleanProfileMedia([cover, { ...pv, featured: true }]));
  assert.throws(() => cleanProfileMedia([{ ...pv, featured: true }]));
  assert.throws(() => cleanProfileMedia([cover, { ...cover, url: 'https://youtube.com/watch?v=MZNKiadMo3U&si=share' }]));
  assert.throws(() => cleanProfileMedia([{ ...cover, provider: 'SOOP' }]));
  assert.throws(() => cleanProfileMedia([{ ...cover, title: '' }]));
  assert.throws(() => cleanProfileMedia(Array(13).fill(cover)));
  assert.throws(() => cleanProfileMedia([{ ...cover, thumbnailUrl: 'javascript:alert(1)' }]));
  const approved = reviewedProfile({ ...profile, media }, 'APPROVED', '2026-10-15');
  assert.equal(isPublicProfile(approved), true);
  assert.equal(isPublicProfile({ ...approved, media: [pv] }), false);
  assert.equal(isPublicProfile({ ...profile, media: [{ ...cover, title: '성인방송' }] }), false);
  assert.equal(isPublicProfile({ ...profile, fanGuide: '성인방송' }), false);
  assert.equal(isPublicProfile({ ...profile, notices: [{ title: '성인방송', url: 'https://example.com/' }] }), false);
  const cleaned = cleanProfilePresentation({ ...profile, media, fanGuide: '공식 팬 가이드', notices: [{ title: '데뷔 공지', url: 'https://stellive.me/news/14262' }] });
  assert.equal(cleaned.media.length, 2);
  assert.equal(cleaned.notices[0].title, '데뷔 공지');
});

// 기존 한 개 영상은 계속 보이지만 새 목록을 지우면 예전 영상이 되살아나지 않는다.
test('기존 영상과 데뷔 방송의 호환 및 명시적 삭제를 유지한다', () => {
  const legacy = { ...profile, videoUrl: cover.url, videoKind: 'COVER', videoTitle: cover.title, debutVideoUrl: 'https://chzzk.naver.com/video/123456' };
  assert.equal(profileMediaItems(legacy).length, 2);
  assert.equal(profileFirstReplay(legacy).provider, 'CHZZK');
  assert.deepEqual(profileMediaItems({ ...legacy, media: [] }), []);
  assert.equal(profileMediaItems({ ...legacy, media: [cover, pv] }).length, 2);
});

// 실제 화면에서 일정·개인 콘텐츠·짧은 장면·팀 콘텐츠의 순서와 원문 이동을 검증한다.
test('상세페이지는 커버곡과 PV를 모두 보여주고 빈 영역·자동재생을 만들지 않는다', () => {
  global.window = { location: { origin: 'https://vdebut.live', search: '' } };
  const render = (data) => renderToStaticMarkup(React.createElement(ProfileExperience, { profile: data, preview: true, onNavigate() {} }));
  const html = render({ ...profile, media: [cover, pv], debutGroupName: 'ABYSS' });
  assert.match(html, /제육감/);
  assert.match(html, /ABYSS 공통 PV/);
  assert.ok(html.indexOf('데뷔 일정') < html.indexOf('처음 만나는 영상'));
  assert.ok(html.indexOf('제육감') < html.indexOf('ABYSS 공통 PV'));
  assert.doesNotMatch(html, /<iframe|짧게 먼저 만나보기|팬으로 함께하기|주요 소식/);
  const replay = { provider: 'CHZZK', kind: 'REPLAY', url: 'https://chzzk.naver.com/video/123456', title: '첫 방송 기록' };
  const full = render({ ...profile, media: [cover, pv, replay], fanGuide: '공식 안내', notices: [{ title: '공식 소식', url: 'https://stellive.me/news/14262' }] });
  assert.match(full, /원문에서 보기/);
  assert.match(full, /href="https:\/\/chzzk.naver.com\/video\/123456"/);
  assert.match(full, /공식 소식/);
  assert.match(full, /팬으로 함께하기/);
  delete global.window;
});
