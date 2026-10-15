const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// 실제 공개 컴포넌트를 묶어 같은 소속 입력에 대한 화면 결과를 비교한다.
function load(file) {
  return (() => { const source = path.resolve(__dirname, file); const loaded = new Module(source, module); loaded.paths = Module._nodeModulePaths(path.dirname(source)); loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.css': 'empty' }, external: ['react', 'react/jsx-runtime'], write: false }).outputFiles[0].text, source); return loaded.exports; })();
}
const { profileAgencyName } = load('../../shared/profilePresentation.ts');
const { EventCard } = load('../src/components/EventCard.tsx');
const { MobileAgendaTimeline } = load('../src/components/mobile/MobileAgendaTimeline.tsx');
const { ScheduleInspectorPanel } = load('../src/components/calendar/ScheduleInspectorPanel.tsx');
const { UndecidedDebutSection } = load('../src/components/calendar/UndecidedDebutSection.tsx');
const { PlatformMiniSpotlight } = load('../src/components/preview/PlatformMiniSpotlight.tsx');
const { SidebarLeft } = load('../src/components/SidebarLeft.tsx');
const hidden = [undefined, '', '   ', '개인세', ' 개인세 ', 'Indie', 'INDIE', 'independent', 'None', '무소속', '個人勢', '개인세 / 인디 (Indie)', 'Indie (개인)', 'Ｎｏｎｅ', 'N/A'];
const named = ['스텔라이브', '그룹 이름', 'Indie Studio', 'Independent Artists', 'NoneSuch', '個人勢応援団'];
const noop = () => {};

// 복합 개인 활동 표기는 숨기되 실제 그룹명의 일부를 잘라내지 않는다.
test('개인 활동 구분값과 실제 소속명을 구별한다', () => {
  for (const value of hidden) assert.equal(profileAgencyName(value), '', String(value));
  for (const value of named) assert.equal(profileAgencyName(` ${value} `), value);
});

// 모바일·데스크톱·미정 일정·추천 카드에 같은 기준을 적용한다.
test('공개 카드 다섯 종류는 구분값을 생략하고 실제 소속명을 표시한다', () => {
  const start = new Date(Date.now() + 86400000).toISOString();
  const month = start.slice(0, 7);
  for (const agency of [...hidden, ...named]) {
    const event = { id: 'fixture', title: '검증 방송', type: 'FIRST_DEBUT', creator: { slug: 'fixture', displayName: '검증 활동명', agency, avatarUrl: '', languages: [], countryCode: 'KR' }, links: [{ platform: 'SOOP', url: 'https://www.sooplive.com/station/fixture', isPrimary: true }], startAtUtc: start, originalTimezone: 'Asia/Seoul', description: '소개 본문', isTbd: true, targetMonth: month };
    const variants = [
      [EventCard, { event, selectedTimezone: 'Asia/Seoul', onDownloadICS: noop }],
      [MobileAgendaTimeline, { events: [event], selectedDateStr: start.slice(0, 10), selectedTimezone: 'Asia/Seoul' }],
      [ScheduleInspectorPanel, { events: [event], selectedDateStr: start.slice(0, 10), selectedTimezone: 'Asia/Seoul', onDownloadICS: noop, onClosePanel: noop }],
      [UndecidedDebutSection, { events: [event], year: Number(month.slice(0, 4)), month: Number(month.slice(5)) - 1, selectedPlatform: 'ALL' }],
      [PlatformMiniSpotlight, { allEvents: [event], selectedTimezone: 'Asia/Seoul', onDownloadICS: noop }],
    ];
    for (const [Component, props] of variants) {
      const html = renderToStaticMarkup(React.createElement(Component, props));
      assert.ok(html.includes('검증 활동명'), Component.name);
      if (agency?.trim()) assert.equal(html.includes(agency.trim()), named.includes(agency), `${Component.name}: ${agency}`);
      assert.ok(!html.includes('신입 버츄얼 크리에이터'));
    }
  }
});

// 전달된 실제 소속이 없으면 사이드바 소속 영역도 만들지 않는다.
test('사이드바는 임의 소속 목록 없이 실제 이름만 중복 제거한다', () => {
  const props = { selectedPlatform: 'ALL', setSelectedPlatform: noop, savedNotificationCount: 0 };
  const empty = renderToStaticMarkup(React.createElement(SidebarLeft, props));
  assert.ok(!empty.includes('AGENCIES &amp; TAGS'));
  const html = renderToStaticMarkup(React.createElement(SidebarLeft, { ...props, agencyNames: [...hidden.filter(v => typeof v === 'string'), '그룹 이름', '그룹 이름', 'Indie Studio'] }));
  assert.equal((html.match(/그룹 이름/g) || []).length, 1);
  assert.ok(html.includes('Indie Studio'));
  assert.ok(!html.includes('개인세'));
});
