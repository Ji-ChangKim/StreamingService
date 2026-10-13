const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// 브라우저 UI와 같은 조회 함수를 묶어 URL 인식과 실제 API 응답 처리를 검증한다.
const source = path.resolve(__dirname, '../src/portal/registrationProfile.ts');
const bundle = esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false });
const loaded = new Module(source, module);
loaded._compile(bundle.outputFiles[0].text, source);
const { detectRegistrationPlatform, fetchRegistrationProfile } = loaded.exports;

test('방송 주소에서 네 플랫폼을 인식하고 위장 주소를 거절한다', () => {
  assert.equal(detectRegistrationPlatform('https://chzzk.naver.com/live/abc'), 'CHZZK');
  assert.equal(detectRegistrationPlatform('https://www.sooplive.co.kr/station/example'), 'SOOP');
  assert.equal(detectRegistrationPlatform('https://www.youtube.com/@example'), 'YOUTUBE');
  assert.equal(detectRegistrationPlatform('https://www.twitch.tv/example'), 'TWITCH');
  assert.equal(detectRegistrationPlatform('https://chzzk.naver.com.attacker.example/live/abc'), '');
  assert.equal(detectRegistrationPlatform('https://example.com/?url=https://chzzk.naver.com'), '');
  assert.equal(detectRegistrationPlatform('http://chzzk.naver.com/abc'), '');
});

test('불러온 공식 채널과 프로필을 사용하고 잘못된 이미지 주소를 제외한다', async () => {
  const original = global.fetch;
  const controller = new AbortController();
  const input = 'https://chzzk.naver.com/live/abc?x=1&y=2';
  global.fetch = async (url, options) => {
    assert.equal(new URL(url, 'https://dev.vdebut.live').searchParams.get('url'), input);
    assert.equal(options.signal, controller.signal);
    return Response.json({ success: true, creatorName: '실제 채널', description: '방송국의 실제 소개', profileImageUrl: 'javascript:alert(1)', channelUrl: 'https://chzzk.naver.com/abc' });
  };
  try {
    const result = await fetchRegistrationProfile(input, 'CHZZK', controller.signal);
    assert.equal(result.channelUrl, 'https://chzzk.naver.com/abc');
    assert.equal(result.displayName, '실제 채널');
    assert.equal(result.description, '방송국의 실제 소개');
    assert.equal(result.avatarUrl, '');
  } finally { global.fetch = original; }
});

test('조회 실패를 성공으로 바꾸거나 임의 프로필로 채우지 않는다', async () => {
  const original = global.fetch;
  global.fetch = async () => Response.json({ success: false, error: '채널 없음' });
  try { await assert.rejects(fetchRegistrationProfile('https://twitch.tv/example', 'TWITCH', new AbortController().signal), /직접 입력/); }
  finally { global.fetch = original; }
});

test('주소 변경으로 중단된 요청은 프로필을 반환하지 않는다', async () => {
  const original = global.fetch;
  const controller = new AbortController();
  controller.abort();
  global.fetch = async (_url, options) => { options.signal.throwIfAborted(); };
  try { await assert.rejects(fetchRegistrationProfile('https://twitch.tv/example', 'TWITCH', controller.signal), { name: 'AbortError' }); }
  finally { global.fetch = original; }
});
