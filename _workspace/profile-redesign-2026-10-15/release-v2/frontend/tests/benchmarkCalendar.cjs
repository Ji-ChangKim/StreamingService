// 공개 API 스냅샷 경로를 받아 같은 메인 화면의 로컬 렌더 시간과 회수 후 힙을 측정한다.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { performance } = require('node:perf_hooks');
const esbuild = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const profiles = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).profiles;
const original = Intl.DateTimeFormat;
let created = 0;
Intl.DateTimeFormat = class extends original { constructor(...args) { super(...args); created++; } };
global.window = { innerWidth: 1274 };
global.sessionStorage = { getItem: () => JSON.stringify({ month: '2026-10', day: '2026-10-11' }) };
global.localStorage = { getItem: () => null };
const source = path.resolve(__dirname, '../src/portal/CalendarPage.tsx');
const loaded = new Module(source, module);
loaded.paths = Module._nodeModulePaths(path.dirname(source));
loaded._compile(esbuild.buildSync({ entryPoints: [source], bundle: true, platform: 'node', format: 'cjs', write: false, jsx: 'automatic', external: ['react', 'react-dom', 'react/jsx-runtime'] }).outputFiles[0].text, source);
const { CalendarPage } = loaded.exports;
const props = { profiles, loading: false, error: '', refresh() {}, onNavigate() {} };
const render = () => renderToStaticMarkup(React.createElement(CalendarPage, props));
const samples = [];
for (let index = 0; index < 3; index++) {
  const before = created;
  const start = performance.now();
  const html = render();
  samples.push({ ms: Math.round(performance.now() - start), formatters: created - before, htmlChars: html.length });
}
// 워밍업 후 이전 렌더 결과·색인이 회수되는지 반복해서 확인한다.
for (let index = 0; index < 20; index++) render();
global.gc?.();
const before = process.memoryUsage().heapUsed;
for (let index = 0; index < 100; index++) render();
global.gc?.();
const after = process.memoryUsage().heapUsed;
console.log(JSON.stringify({ profiles: profiles.length, samples, heapAfterWarmupBytes: before, heapAfter100RendersBytes: after, retainedHeapDeltaBytes: after - before, formattersTotal: created, gcAvailable: Boolean(global.gc) }, null, 2));
Intl.DateTimeFormat = original;
