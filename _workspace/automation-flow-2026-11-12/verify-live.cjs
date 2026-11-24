const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=__dirname;
const cli='C:/Users/Jichang/AppData/Local/npm-cache/_npx/7f3444e3cc855b0c/node_modules/wrangler/bin/wrangler.js';
const sql=`SELECT json_object(
 'latestRun',(SELECT json_object('id',id,'slot',slot,'status',status,'finishedAt',finished_at,'summary',json(summary)) FROM debut_automation_runs ORDER BY started_at DESC LIMIT 1),
 'agencyCandidates',(SELECT json_group_array(json_object('id',id,'seed',json(seed),'status',status,'reason',reason)) FROM debut_automation_candidates WHERE source='AGENCY_NOTICE'),
 'backfillCompleted',(SELECT COUNT(DISTINCT profile_slug) FROM debut_automation_candidates WHERE json_extract(evidence,'$.enrichmentCompletedWeek')='backfill:2026-11-01:2026-11-11'),
 'pendingPublic',(SELECT COUNT(*) FROM debut_automation_candidates WHERE status='PUBLISHED_PENDING_CHECK'),
 'monthRuns',(SELECT runs FROM debut_automation_months WHERE month='2026-11'),
 'enabled',(SELECT enabled FROM debut_automation_control WHERE id='discovery')) AS audit`;
(async()=>{
 const captured=process.argv.includes('--captured');let database;
 if(captured)database=JSON.parse(fs.readFileSync(path.join(out,'database.json'),'utf8')).database;
 else{
  const result=spawnSync(process.execPath,[cli,'d1','execute','vdebut-db','--remote','--config','backend/wrangler.debut-automation.jsonc','--command',sql,'--json'],{encoding:'utf8',maxBuffer:2*1024*1024});
  if(result.status!==0)throw new Error(JSON.stringify({status:result.status,signal:result.signal,error:result.error?.message,stderr:result.stderr?.slice(-1000),stdout:result.stdout?.slice(-1200)}));
  const dbResult=JSON.parse(result.stdout)[0];database=JSON.parse(dbResult.results[0].audit);
  fs.writeFileSync(path.join(out,'database.json'),JSON.stringify({database,meta:dbResult.meta,readAt:new Date().toISOString()},null,2));
 }
 const urls=[['profiles','https://vdebut.live/api/v1/portal/profiles?version=3'],['events','https://vdebut.live/api/v1/events']];
 const payloads={};
 for(const [key,url]of urls){if(captured){payloads[key]=JSON.parse(fs.readFileSync(path.join(out,`${key}.json`),'utf8'));continue;}const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`${key}_HTTP_${response.status}`);const text=await response.text();if(Buffer.byteLength(text)>4*1024*1024)throw new Error('PUBLIC_BODY_LIMIT');payloads[key]=JSON.parse(text);fs.writeFileSync(path.join(out,`${key}.json`),text);}
 const profiles=payloads.profiles.profiles,events=payloads.events.events;
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'_workspace/discovery-audit-2026-11-12/public-verification.json'),'utf8'));
 const checks=[];const check=(name,pass,details)=>checks.push({name,pass:!!pass,details});
 check('서버 자동화 활성화',database.enabled===1);
 check('저장 후 공개 확인 대기',database.pendingPublic===0,{remaining:database.pendingPublic});
 check('기존 36명 보강 완료 기록 보존',database.backfillCompleted===36,{completed:database.backfillCompleted});
 const fresh=['9d4daff602a5e804d8b49a91671b6c16','70c680e3922bebbd90969986c82d6b7c'];
 for(const id of fresh){const c=database.agencyCandidates.find(c=>c.seed.channelKey===`CHZZK:${id}`);check(`새 후보 보존 ${c?.seed.name||id}`,c?.status==='HOLD'&&c.seed.date===''&&c.seed.time==='',{reason:c?.reason});check(`미검증 후보 공개 차단 ${c?.seed.name||id}`,!profiles.some(p=>p.channelUrl.includes(id)));}
 let matched=0;
 for(const entry of baseline.changes){const p=profiles.find(p=>p.slug===entry.slug);for(const field of entry.fields){const actual=field.key.startsWith('details.')?p?.details?.[field.key.slice(8)]:p?.[field.key];if(actual===field.after)matched++;else check(`${entry.name} ${field.key} 보강 값`,false,{expected:field.after,actual});}}
 check('8명 12항목 공개 값 보존',matched===12,{matched});
 const cohort=profiles.filter(p=>p.debutDate>='2026-11-01'&&p.debutDate<='2026-11-11');
 check('36명 프로필과 캘린더 일치',cohort.length===36&&cohort.every(p=>events.some(e=>e.creator.slug===p.slug&&e.startAtUtc===p.startAtUtc&&e.links.some(l=>l.url===p.channelUrl))),{profiles:cohort.length});
 const config=JSON.parse(fs.readFileSync(path.join(root,'backend/wrangler.debut-automation.jsonc'),'utf8'));
 check('정규 예약만 유지',JSON.stringify(config.triggers.crons)===JSON.stringify(['0 0 * * *','0 12 * * *','0 1 * * MON'])&&!config.vars.SMOKE_TEST_UNTIL&&!config.vars.BACKFILL_UNTIL);
 check('실행 비용 제한 유지',config.limits.cpu_ms===5000&&config.limits.subrequests===400&&!config.workers_dev&&database.monthRuns<=70,{monthRuns:database.monthRuns});
 const report={checkedAt:new Date().toISOString(),kind:'READ_ONLY_PRODUCTION_RECHECK',checks,passed:checks.filter(c=>c.pass).length,total:checks.length,profiles:profiles.length,calendarEvents:events.length,latestServerRun:database.latestRun};
 fs.writeFileSync(path.join(out,'live-test.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checkedAt:report.checkedAt,passed:report.passed,total:report.total,profiles:report.profiles,checks}));
 if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error.message);process.exitCode=1;});
