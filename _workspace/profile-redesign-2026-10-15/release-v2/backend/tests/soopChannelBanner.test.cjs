const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

// 실제 배너 조회 모듈을 묶어 외부 응답과 안전한 URL 변환을 검증한다.
const source = path.resolve(__dirname, '../src/services/soopChannelBanner.ts');
const bundle = esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false });
const loaded = new Module(source, module);
loaded._compile(bundle.outputFiles[0].text, source);
const { soopBannerChannelId, soopBannerImageUrl, soopBannerFromStation, fetchSoopChannelBanner } = loaded.exports;
const station = { station: { userId: 'doosiki0505' }, channelArt: { pcFilename: 'SKIN/32674319/53531790001551903.jpg', mobileFilename: '' }, display: { profileText: '채널에서 직접 작성한 소개입니다.' } };

test('SOOP 채널 주소만 인식하고 위장 주소와 임의 경로는 거절한다', () => {
  for (const url of ['https://www.sooplive.com/station/doosiki0505', 'https://ch.sooplive.co.kr/doosiki0505', 'https://play.afreecatv.com/doosiki0505/123']) assert.equal(soopBannerChannelId(url), 'doosiki0505');
  for (const url of ['https://sooplive.com.attacker.test/station/abc', 'https://localhost/abc', 'http://www.sooplive.com/abc', 'https://www.sooplive.com/station/memo/abc', 'https://www.sooplive.com/station/..%2Fsecret']) assert.equal(soopBannerChannelId(url), '');
});

test('실제 배너 파일만 원본 이미지 주소로 변환하고 모바일 배너를 분리한다', () => {
  assert.equal(soopBannerImageUrl(station.channelArt.pcFilename), 'https://stimg.sooplive.com/SKIN/32674319/53531790001551903.jpg');
  for (const value of ['https://attacker.test/a.jpg', '//attacker.test/a.jpg', 'SKIN/1/../a.jpg', 'SKIN/1/a.svg', {}, null]) assert.equal(soopBannerImageUrl(value), '');
  const mobile = 'SKIN/32674319/mobile.png';
  assert.deepEqual(soopBannerFromStation({ ...station, channelArt: { mobileFilename: mobile } }, 'doosiki0505'), { bannerUrl: `https://stimg.sooplive.com/${mobile}`, mobileBannerUrl: `https://stimg.sooplive.com/${mobile}`, description: station.display.profileText });
  assert.deepEqual(soopBannerFromStation({ station: station.station }, 'doosiki0505'), { bannerUrl: '', mobileBannerUrl: '', description: '' });
  assert.throws(() => soopBannerFromStation(station, 'other'), /Invalid/);
});

test('고정된 SOOP API에만 요청하고 실제 배너 필드를 반환한다', async () => {
  const original = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api-channel.sooplive.com/v1.1/channel/doosiki0505/station');
    assert.equal(options.redirect, 'manual');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(station);
  };
  try { assert.deepEqual(await fetchSoopChannelBanner('https://www.sooplive.com/station/doosiki0505'), { bannerUrl: 'https://stimg.sooplive.com/SKIN/32674319/53531790001551903.jpg', mobileBannerUrl: '', description: station.display.profileText }); }
  finally { global.fetch = original; }
});

test('오류·과도한 응답·잘못된 JSON을 빈 배너 성공으로 캐시하지 않는다', async () => {
  const original = global.fetch;
  try {
    for (const response of [new Response('', {status: 404}), new Response('x'.repeat(128 * 1024 + 1)), new Response('not json')]) {
      global.fetch = async () => response;
      await assert.rejects(fetchSoopChannelBanner('https://www.sooplive.com/station/doosiki0505'));
    }
  } finally { global.fetch = original; }
});

test('배너 없이도 실제 소개를 반환하고 줄바꿈·빈 소개·잘못된 타입을 처리한다', () => {
  const detail = text => soopBannerFromStation({station: station.station, display: {profileText: text}}, 'doosiki0505');
  assert.deepEqual(detail('  종겜&소통 다람쥐 헤티입니다🐿️\r\n방송시간 : 저녁 8~9시쯤  '), {bannerUrl: '', mobileBannerUrl: '', description: '종겜&소통 다람쥐 헤티입니다🐿️\n방송시간 : 저녁 8~9시쯤'});
  for (const text of ['   ', null, 123, {}]) assert.equal(detail(text).description, '');
  assert.equal(detail('a'.repeat(5000)).description.length, 4000);
  assert.equal(detail('<script>alert(1)</script>').description, '<script>alert(1)</script>');
});
