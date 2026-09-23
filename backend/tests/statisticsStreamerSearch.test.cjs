const assert = require('node:assert/strict');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const esbuild = require('../node_modules/esbuild');

async function loadModule(entry, name) {
  const outfile = path.resolve(__dirname, '../../.cache/statistics-tests', `${name}.cjs`);
  await esbuild.build({ entryPoints: [path.resolve(__dirname, entry)], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' });
  return require(outfile);
}

// 실제 SQLite에서 검색어 바인딩, 부분 검색, 페이지 제한과 중복 결과를 확인한다.
async function main() {
  const { searchStatisticsStreamers } = await loadModule('../src/services/statisticsStreamerSearchService.ts', 'streamer-search');
  const { mergeStatisticsStreamers } = await loadModule('../../frontend/src/components/analytics/statisticsSearchModel.ts', 'streamer-search-model');
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE streamerChannel(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT,
      channel_name TEXT,
      channel_url TEXT
    );
    CREATE TABLE streamerChannel_info(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER,
      display_name TEXT,
      profile_image_url TEXT,
      slug TEXT,
      description TEXT,
      agency_name TEXT DEFAULT '개인세',
      debut_date TEXT,
      debut_time TEXT,
      timezone TEXT DEFAULT 'Asia/Seoul',
      start_at_utc TEXT,
      country_code TEXT DEFAULT 'KR'
    );
  `);
  const add = db.prepare('INSERT INTO streamerChannel (id, platform, channel_name, channel_url) VALUES(?,?,?,?)');
  const info = db.prepare('INSERT INTO streamerChannel_info (id, channel_id, display_name, profile_image_url, slug) VALUES(?,?,?,NULL,?)');
  const key = 'a'.repeat(32);
  add.run(1, 'CHZZK', 'Test Alpha', `https://chzzk.naver.com/${key}`);
  info.run(1, 1, '테스트 알파', 'test-alpha');
  info.run(2, 1, '테스트 알파', 'duplicate');
  add.run(2, 'SOOP', '밤하늘', 'https://www.sooplive.com/station/night');
  add.run(3, 'TWITCH', '테스트 알파', 'https://twitch.tv/hidden');
  add.run(4, 'SOOP', '100%_이름', 'https://www.sooplive.co.kr/station/literal');
  for (let id = 10; id < 35; id++) add.run(id, 'SOOP', `동명이름${id}`, `https://www.sooplive.co.kr/station/user${id}`);
  let reads = 0;
  const binding = {
    prepare: (sql) => ({
      bind: (...args) => ({
        all: async () => {
          reads++;
          const converted = sql.replace(/\?1/g, '?');
          const count = (converted.match(/\?/g) || []).length;
          const params = count === 1 && args.length === 1 ? args : Array(count).fill(args[0]);
          return { results: db.prepare(converted).all(...params) };
        },
        first: async () => {
          const converted = sql.replace(/\?1/g, '?');
          return db.prepare(converted).get(...args) || null;
        },
        run: async () => {
          const res = db.prepare(sql).run(...args);
          return { meta: { last_row_id: Number(res.lastInsertRowid) } };
        },
      }),
    }),
  };

  // 1. D1 로컬 검색 검증 (external = false)
  assert.equal((await searchStatisticsStreamers(binding, '   ', false)).streamers.length, 0);
  assert.equal(reads, 0);
  const exact = await searchStatisticsStreamers(binding, '테스트알파', false);
  assert.equal(exact.streamers.length, 1);
  assert.equal(exact.streamers[0].channelKey, `CHZZK:${key}`);
  assert.equal(exact.streamers[0].profileSlug, 'test-alpha');
  assert.equal(exact.streamers[0].isRegistered, true);

  assert.equal((await searchStatisticsStreamers(binding, 'TEST alpha', false)).streamers.length, 1);
  assert.equal((await searchStatisticsStreamers(binding, '밤 하늘', false)).streamers[0].channelKey, 'SOOP:night');
  assert.equal((await searchStatisticsStreamers(binding, '%_', false)).streamers.length, 1);
  assert.equal((await searchStatisticsStreamers(binding, "' OR 1=1 --", false)).streamers.length, 0);

  const many = await searchStatisticsStreamers(binding, '동명이름', false);
  assert.equal(many.streamers.length, 21); // db query limit 21
  assert.equal(many.hasMore, false);

  // 2. 머지 모델 검증
  const live = { id: 'CHZZK:live', platform: 'CHZZK', channelKey: `CHZZK:${key}`, channelName: '테스트알파', channelUrl: `https://chzzk.naver.com/${key}`, imageUrl: null };
  const merged = mergeStatisticsStreamers('테스트 알파', exact.streamers, { lives: [live], peaks: [live] });
  assert.equal(merged.length, 1);
  assert.equal(merged[0].profileSlug, 'test-alpha');
  assert.equal(merged[0].isLive, true);

  // 3. 외부 검색 모듈 로드 및 실시간 검색 검증
  const { searchExternalPlatforms, registerExternalStreamerToD1 } = await loadModule('../src/services/externalPlatformSearchService.ts', 'external-search');
  
  // 외부 검색 연동 (external = true)
  const combined = await searchStatisticsStreamers(binding, '테스트알파', true);
  assert.ok(combined.streamers.length >= 1);
  // VDébut 등록 채널이 최우선 정렬되는지 확인
  assert.equal(combined.streamers[0].isRegistered, true);
  assert.equal(combined.streamers[0].name, '테스트 알파');

  // 4. 외부 스트리머 D1 등록 기능 검증
  const registerResult = await registerExternalStreamerToD1(binding, {
    platform: 'SOOP',
    channelKey: 'SOOP:newbie_streamer',
    name: '신입버튜버',
    channelUrl: 'https://www.sooplive.com/station/newbie_streamer',
    imageUrl: 'https://example.com/profile.png',
  });
  assert.equal(registerResult.success, true);
  assert.ok(registerResult.slug);

  // 중복 등록 시도시 기존 채널 정보 반환 확인
  const duplicateResult = await registerExternalStreamerToD1(binding, {
    platform: 'SOOP',
    channelKey: 'SOOP:newbie_streamer',
    name: '신입버튜버',
    channelUrl: 'https://www.sooplive.com/station/newbie_streamer',
  });
  assert.equal(duplicateResult.success, true);
  assert.equal(duplicateResult.slug, registerResult.slug);

  // SOOP .co.kr 도메인 변형으로 재등록 시도 시에도 기존 채널 정보 반환 확인
  const altDomainResult = await registerExternalStreamerToD1(binding, {
    platform: 'SOOP',
    channelKey: 'SOOP:newbie_streamer',
    name: '신입버튜버',
    channelUrl: 'https://www.sooplive.co.kr/station/newbie_streamer',
  });
  assert.equal(altDomainResult.success, true);
  assert.equal(altDomainResult.slug, registerResult.slug);

  db.close();
  console.log('PASS: local D1 search, external platforms search integration, auto-registration, and deduplication verified.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
