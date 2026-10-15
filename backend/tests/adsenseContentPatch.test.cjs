const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');
const { corrections, correctedProfile } = require('../scripts/adsenseContentPatch.cjs');
const source = path.resolve(__dirname, '../../shared/contentReview.ts');
const loaded = new Module(source, module);
loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
const { reviewedProfile, isPublicProfile } = loaded.exports;
const original = { slug: 'original', displayName: '이름', description: '원문', platform: 'SOOP', channelUrl: 'https://www.sooplive.com/station/sample', avatarUrl: 'https://example.com/avatar.png', agency: '미확인 소속', countryCode: '', languages: [], tags: [], xUrl: '', source: 'EXISTING', ownerVerified: false, dateState: 'FIXED', debutDate: '2026-08-15', debutTime: '18:00', timezone: 'Asia/Tokyo', startAtUtc: '2026-08-15T09:00:00.000Z', targetMonth: '2026-08' };

// 대상 밖 자료와 이미지·소유권·임의 승인 상태를 바꾸지 않는지 검증한다.
test('공식 정정은 9개 고정 주소와 허용 필드에만 적용한다', () => {
  assert.equal(corrections.length, 9);
  assert.equal(new Set(corrections.map(c => c.slug)).size, 9);
  for (const correction of corrections) {
    const before = { ...original, slug: correction.slug };
    const after = correctedProfile(before, correction, reviewedProfile, '2026-10-15T00:00:00Z');
    assert.equal(after.slug, before.slug);
    for (const field of ['avatarUrl', 'ownerVerified', 'source', 'countryCode', 'languages', 'tags', 'timezone', 'debutTime']) assert.deepEqual(after[field], before[field]);
    assert.equal(correction.sources.length > 0, true);
    assert.equal(correction.pending.length > 0, true);
    if (!correction.hold) assert.equal(after.contentReview, before.contentReview);
    assert.equal(before.description, '원문');
  }
});

// 공식 날짜가 확인돼도 기존의 미확인 시간을 확정 시각으로 재사용하지 않는다.
test('星存なのか는 날짜를 정정하고 이전 시간은 시간 미정으로 분리한다', () => {
  const correction = corrections.find(c => c.slug === 'hoshiari-nanoka');
  const after = correctedProfile({ ...original, slug: correction.slug }, correction, reviewedProfile, '2026-10-15');
  assert.equal(after.debutDate, '2026-08-08');
  assert.equal(after.debutTime, '18:00');
  assert.equal(after.dateState, 'TIME_TBD');
  assert.equal(after.startAtUtc, '');
  assert.equal(after.channelUrl, 'https://www.youtube.com/@seizon_nanoka');
});

// 원문을 순화해 우회 공개하지 않고 명시적 보류 기록으로 차단한다.
test('江口真好는 승인 기록이 있더라도 보류하며 원문은 보존한다', () => {
  const correction = corrections.find(c => c.slug === 'eguchi-maho');
  const before = reviewedProfile({ ...original, slug: correction.slug }, 'APPROVED', '2026-10-14');
  const after = correctedProfile(before, correction, reviewedProfile, '2026-10-15');
  assert.equal(after.contentReview.state, 'HOLD');
  assert.equal(isPublicProfile(after), false);
  assert.equal(after.description, before.description);
  assert.equal(after.agency, 'くえにこ!');
});
