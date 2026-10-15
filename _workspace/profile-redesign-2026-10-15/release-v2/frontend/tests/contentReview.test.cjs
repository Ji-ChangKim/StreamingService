const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// 실제 공유 정책을 번들링해 브라우저·서버가 같은 공개 조건을 적용하는지 확인한다.
function load(relative) {
  const source = path.resolve(__dirname, relative);
  const loaded = new Module(source, module);
  loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
  return loaded.exports;
}
const { isPublicProfile, reviewedProfile, publicBroadcastPayload } = load('../../shared/contentReview.ts');
const { renderPortalPage, portalSitemap } = load('../../backend/src/services/portalPageService.ts');
const { publisherAdsAllowed } = load('../../shared/publisherPolicy.ts');
const profile = { slug: 'test', displayName: '테스트', description: '게임과 노래 방송', platform: 'CHZZK', channelUrl: 'https://chzzk.naver.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', tags: [], languages: [], avatarUrl: '', agency: '', countryCode: '', xUrl: '', dateState: 'NONE', timezone: 'Asia/Seoul', startAtUtc: '', debutDate: '', debutTime: '', targetMonth: '', source: 'REGISTERED', ownerVerified: false };

// 승인 기록이 없거나 내용·미디어가 바뀌면 기존 승인으로 우회 공개할 수 없다.
test('미검토·보류·수정된 소개와 소유권 확인만 된 소개는 공개하지 않는다', () => {
  assert.equal(isPublicProfile(profile), false);
  assert.equal(isPublicProfile({ ...profile, ownerVerified: true }), false);
  const approved = reviewedProfile(profile, 'APPROVED', '2026-10-15T00:00:00Z');
  assert.equal(isPublicProfile(JSON.parse(JSON.stringify(approved))), true);
  for (const patch of [{ description: '변경' }, { avatarUrl: 'https://example.com/new.jpg' }, { bannerUrl: 'https://example.com/new.jpg' }, { noticeUrl: 'https://example.com/news' }, { agency: '변경' }, { tags: ['변경'] }]) assert.equal(isPublicProfile({ ...approved, ...patch }), false);
  assert.equal(isPublicProfile(reviewedProfile(profile, 'HOLD', '2026-10-15T00:00:00Z')), false);
});

// 확인된 일본어 위험 표현과 영상 제목 활동명은 승인 요청으로도 노출할 수 없다.
test('의심 소개와 잘못된 활동명은 메타데이터와 사이트맵에서도 제외한다', () => {
  const unsafe = reviewedProfile({ ...profile, description: 'ミッドナイト叡智VTuber エッな世界' }, 'APPROVED', '2026-10-15');
  assert.equal(isPublicProfile(unsafe), false);
  assert.equal(isPublicProfile(reviewedProfile({ ...profile, displayName: '【初配信】デビュー配信' }, 'APPROVED', '2026-10-15')), false);
  assert.doesNotMatch(portalSitemap([unsafe, profile]), /\/creator\/test/);
  const html = renderPortalPage('<html><head><title>x</title></head><body><div id="root"></div></body></html>', new URL('https://vdebut.live/creator/test'), unsafe);
  assert.doesNotMatch(html, /ミッドナイト|エッな/);
  assert.match(portalSitemap([reviewedProfile(profile, 'APPROVED', '2026-10-15')]), /\/creator\/test/);
});

// 통계의 중첩 제목을 정리해도 원본 기록이나 숫자는 바꾸지 않는다.
test('외부 제목은 중립 안내로 교체하고 광고는 모든 화면에서 기본 중지한다', () => {
  const raw = { broadcasts: [{ title: '19금 성인방송', minutes: 42 }, { title: '게임 이야기', minutes: 10 }] };
  const safe = publicBroadcastPayload(raw);
  assert.equal(safe.broadcasts[0].title, '방송 제목 확인 중');
  assert.equal(safe.broadcasts[0].minutes, 42);
  assert.equal(safe.broadcasts[1].title, '게임 이야기');
  assert.equal(raw.broadcasts[0].title, '19금 성인방송');
  assert.equal(publisherAdsAllowed(), false);
});
