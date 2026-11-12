// 운영 코드의 좁은 두 지점만 수정한다. 로컬의 다른 화면·기능을 배포에 섞지 않는다.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function prepare(directory) {
  const entry = path.join(directory, 'src/index.js');
  const original = fs.readFileSync(entry, 'utf8');
  const start = original.indexOf('function portalProfileEvent(profile) {');
  const end = original.indexOf('__name(portalProfileEvent,', start);
  if (start < 0 || end < start) throw new Error('운영 일정 변환 함수를 찾지 못했습니다.');
  const before = original.slice(start, end);
  if (!before.includes('type: "FIRST_DEBUT"')) throw new Error('운영 일정 변환 구조가 달라졌습니다.');
  const after = before.replace('type: "FIRST_DEBUT"', 'type: profile.debutKind || "FIRST_DEBUT"')
    .replace('title: `${profile.displayName} \\uB370\\uBDD4 \\uBC29\\uC1A1`', 'title: `${profile.displayName}${profile.debutKind === "PLATFORM_DEBUT" ? ` ${profile.platform} 플랫폼` : ""} 데뷔 방송`');
  if (before === after || !after.includes('플랫폼')) throw new Error('운영 행사 구분 패치 실패');
  let output = original.slice(0, start) + after + original.slice(end);
  const handlerStart = output.indexOf('var src_default = {\n');
  const weeklyStart = output.indexOf('    if (event?.cron === WEEKLY_RESET_CRON) {', handlerStart);
  const statisticsStart = output.indexOf('    if (env.DB) {\n      ctx.waitUntil(\n        collectBroadcastStatistics', weeklyStart);
  if (weeklyStart < 0 || statisticsStart < weeklyStart) throw new Error('운영 예약 작업 구조가 달라졌습니다.');
  output = output.slice(0, weeklyStart) + `    if (event?.cron === WEEKLY_RESET_CRON) {
      if (env.DB) ctx.waitUntil(resetWeeklyCheers(env.DB).then(() => console.log('[Scheduled Cron] Weekly cheers reset')).catch((err) => console.error('[Scheduled Cron] Weekly cheers reset error:', err)));
      return;
    }
` + output.slice(statisticsStart);
  const reportStart = output.indexOf('    const isKst7Am =', handlerStart);
  const handlerEnd = output.indexOf('\n  }\n};\nexport {', reportStart);
  if (reportStart < 0 || handlerEnd < reportStart) throw new Error('기존 보고 예약 구조가 달라졌습니다.');
  output = output.slice(0, reportStart) + output.slice(handlerEnd);
  output = output.replace('import manifestJSON from "__STATIC_CONTENT_MANIFEST";', 'import manifestJSON from "./__STATIC_CONTENT_MANIFEST";');
  for (const anchor of ['ownerVerified: true,\n    source: original.source,', 'source: original.source,\n    ownerVerified: original.ownerVerified,']) {
    if (output.split(anchor).length !== 2) throw new Error('운영 편집 경로의 구조가 달라졌습니다.');
    output = output.replace(anchor, `${anchor}\n    debutKind: original.debutKind,`);
  }
  const backup = path.join(directory, 'src/index.before-debut-automation.js');
  if (fs.existsSync(backup)) throw new Error('이미 준비된 운영 패치 폴더입니다.');
  fs.writeFileSync(backup, original);
  fs.writeFileSync(entry, output);
  const config = {
    name:'streaming', main:'src/index.js', compatibility_date:'2024-01-01', workers_dev:true, preview_urls:true,
    keep_vars:true, rules:[{type:'Text',globs:['**/__STATIC_CONTENT_MANIFEST'],fallthrough:true}],
    routes:[{pattern:'vdebut.live',custom_domain:true},{pattern:'dev.vdebut.live',custom_domain:true}],
    triggers:{crons:['*/10 * * * *','0 15 * * SUN']},
    d1_databases:[{binding:'DB',database_name:'vdebut-db',database_id:'888a8c04-5657-4bff-9b50-5002a47ac7c7'}],
    kv_namespaces:[{binding:'__STATIC_CONTENT',id:'31072a94e15c4fc181966cccd35a4254'}],
  };
  fs.writeFileSync(path.join(directory,'wrangler.release.jsonc'),JSON.stringify(config,null,2)+'\n');
  const sha = text => crypto.createHash('sha256').update(text).digest('hex');
  const record={beforeSha256:sha(original),afterSha256:sha(output),assetManifestSha256:sha(fs.readFileSync(path.join(directory,'src/__STATIC_CONTENT_MANIFEST'))),
    changes:['플랫폼 데뷔 행사 유형·제목 구분','구형 주간 조사·보강 및 07시 보고 예약 제거; 주간 응원 초기화·통계·신청 심사는 보존','편집 시 기존 데뷔 유형 보존','기존 정적 자산 그대로 연결']};
  fs.writeFileSync(path.join(directory,'runtime-patch.json'),JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify(record));
}
if (require.main===module) prepare(path.resolve(process.argv[2]));
module.exports={prepare};
