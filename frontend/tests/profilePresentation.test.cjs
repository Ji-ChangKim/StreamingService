const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// 공개 화면과 서버가 함께 사용하는 상태·주소 검증을 실행한다.
const source = path.resolve(__dirname, '../../shared/profilePresentation.ts');
const loaded = new Module(source, module);
loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
const { profileVideoId, cleanProfilePresentation, profileDebutPhase, profileDebutMembers, profileLinkKey } = loaded.exports;
const profile = { slug: 'toa', displayName: '토아', platform: 'CHZZK', channelUrl: 'https://chzzk.naver.com/2299fad4bebb504b0978e1ec08b2f7d3', dateState: 'FIXED', startAtUtc: '2026-10-17T08:00:00.000Z', agency: '스텔라이브' };

// 대표 영상의 종류와 무관하게 실행 가능한 외부 주소나 위장 채널은 차단한다.
test('유튜브 영상만 재생하고 추가 채널의 영상 주소·위장 도메인을 거절한다', () => {
  for (const url of ['https://youtu.be/tlCeLkw8Upc', 'https://www.youtube.com/watch?v=tlCeLkw8Upc', 'https://youtube.com/shorts/tlCeLkw8Upc']) assert.equal(profileVideoId(url), 'tlCeLkw8Upc');
  for (const url of ['https://youtube.com/@ShizukiToa', 'https://youtube.com.attacker.example/watch?v=tlCeLkw8Upc', 'javascript:alert(1)', 'https://youtu.be/not-an-id']) assert.equal(profileVideoId(url), '');
  assert.throws(() => cleanProfilePresentation({ ...profile, videoUrl: 'https://example.com/video' }));
  assert.throws(() => cleanProfilePresentation({ ...profile, additionalChannels: [{ platform: 'YOUTUBE', channelUrl: 'https://www.youtube.com/watch?v=tlCeLkw8Upc' }] }));
  assert.throws(() => cleanProfilePresentation({ ...profile, bannerUrl: 'javascript:alert(1)' }));
  const cleaned = cleanProfilePresentation({ ...profile, additionalChannels: [{ platform: 'CHZZK', channelUrl: profile.channelUrl }, { platform: 'YOUTUBE', channelUrl: 'https://www.youtube.com/@ShizukiToa' }, { platform: 'YOUTUBE', channelUrl: 'https://youtube.com/@shizukitoa?utm_source=x' }] });
  assert.equal(cleaned.additionalChannels.length, 1);
});

// 예정 시각 이후에도 실제 방송이나 데뷔 완료를 만들어 내지 않는다.
test('미정 일정과 시각 경과를 구분하고 같은 소속사만으로 멤버를 연결하지 않는다', () => {
  assert.equal(profileDebutPhase(profile, Date.parse('2026-10-17T07:59:59Z')), 'UPCOMING');
  assert.equal(profileDebutPhase(profile, Date.parse('2026-10-17T08:00:00Z')), 'PAST');
  for (const dateState of ['NONE', 'TIME_TBD', 'DATE_TBD']) assert.equal(profileDebutPhase({ ...profile, dateState }, Date.parse('2027-01-01')), 'UNCONFIRMED');
  assert.equal(profileDebutPhase({ ...profile, startAtUtc: 'invalid' }, Date.now()), 'UNCONFIRMED');
  assert.deepEqual(profileDebutMembers(profile, [profile, { ...profile, slug: 'rang' }]), []);
  const toa = { ...profile, debutGroupId: 'abyss' };
  const rang = { ...toa, slug: 'rang', displayName: '랑', startAtUtc: '2026-10-17T09:00:00Z' };
  const other = { ...toa, slug: 'other', debutGroupId: 'other-generation' };
  assert.deepEqual(profileDebutMembers(toa, [rang, other, toa]).map((p) => p.slug), ['toa', 'rang']);
  assert.equal(profileLinkKey('https://x.com/ShizukiToa/?utm_source=calendar'), profileLinkKey('https://x.com/ShizukiToa'));
  assert.notEqual(profileLinkKey('https://example.com/news?id=1'), profileLinkKey('https://example.com/news?id=2'));
});
