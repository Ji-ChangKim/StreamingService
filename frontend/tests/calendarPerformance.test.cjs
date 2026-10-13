const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');
const path = require('node:path');
const esbuild = require('esbuild');

test('전체 일정 파일은 확정 일정만 포함하고 줄바꿈과 구분 문자를 이스케이프한다', () => {
  const { portalCalendarFile } = load('../../shared/portalCalendarFile.ts');
  const base = { slug: 'one', dateState: 'FIXED', startAtUtc: '2026-10-01T11:00:00Z', displayName: '노래, 게임', description: '소개\n다음 줄; 설명', channelUrl: 'https://example.com/channel' };
  const file = portalCalendarFile([base, { ...base, slug: 'two', startAtUtc: '2026-11-01T00:00:00Z' }, { ...base, slug: 'undecided', dateState: 'TIME_TBD' }], new Date('2026-10-11T00:00:00Z'));
  assert.equal((file.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(file, /DTSTART:20261001T110000Z/);
  assert.ok(file.includes('노래\\, 게임'));
  assert.ok(file.includes('소개\\n다음 줄\\; 설명'));
  assert.doesNotMatch(file, /undecided/);
});

function load(file) {
  const source = path.resolve(__dirname, file);
  const loaded = new Module(source, module);
  loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source);
  return loaded.exports;
}

test('시간대 경계와 미정 상태를 날짜·월 색인에 누락 없이 배치한다', () => {
  const { buildCalendarIndex } = load('../src/portal/calendarIndex.ts');
  const base = { slug: 'fixed', dateState: 'FIXED', startAtUtc: '2026-10-01T00:30:00Z', debutDate: '2026-10-01', targetMonth: '2026-10' };
  const profiles = [base, { ...base, slug: 'time', dateState: 'TIME_TBD' }, { ...base, slug: 'date', dateState: 'DATE_TBD' }, { ...base, slug: 'none', dateState: 'NONE' }];
  const korea = buildCalendarIndex(profiles, 'Asia/Seoul');
  const america = buildCalendarIndex(profiles, 'America/Los_Angeles');
  assert.deepEqual(korea.byDay.get('2026-10-01').map(p => p.slug), ['fixed', 'time']);
  assert.deepEqual(america.byDay.get('2026-09-30').map(p => p.slug), ['fixed']);
  assert.deepEqual(america.byDay.get('2026-10-01').map(p => p.slug), ['time']);
  assert.deepEqual(america.byMonth.get('2026-10').map(p => p.slug), ['time', 'date']);
  assert.equal(korea.byMonth.get('2026-10').includes(profiles[3]), false);
  assert.equal(korea.byDay.get('2026-10-01')[0], base);
  assert.equal(america.days.get('date'), '');
});

test('날짜 포맷터는 동일 조건에서 재사용하고 최대 24개만 보관한다', () => {
  const original = Intl.DateTimeFormat;
  let created = 0;
  Intl.DateTimeFormat = class extends original { constructor(...args) { super(...args); created++; } };
  try {
    const { dateTimeFormatter } = load('../../shared/dateTimeFormatter.ts');
    const options = { timeZone: 'Asia/Seoul', year: 'numeric' };
    const first = dateTimeFormatter('ko-KR', options);
    for (let index = 0; index < 1000; index++) assert.equal(dateTimeFormatter('ko-KR', options), first);
    assert.equal(created, 1);
    const locales = ['en-US', 'en-GB', 'ko-KR', 'ja-JP', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'zh-CN', 'zh-TW', 'pt-BR', 'nl-NL', 'sv-SE', 'da-DK', 'fi-FI', 'nb-NO', 'pl-PL', 'cs-CZ', 'hu-HU', 'tr-TR', 'ar-EG', 'he-IL', 'th-TH', 'vi-VN'];
    for (const locale of locales) dateTimeFormatter(locale, { timeZone: 'UTC', month: 'long' });
    assert.notEqual(dateTimeFormatter('ko-KR', options), first);
    assert.equal(created, 26);
    const recent = dateTimeFormatter('vi-VN', { timeZone: 'UTC', month: 'long' });
    assert.equal(dateTimeFormatter('vi-VN', { timeZone: 'UTC', month: 'long' }), recent);
    assert.equal(created, 26);
  } finally { Intl.DateTimeFormat = original; }
});
