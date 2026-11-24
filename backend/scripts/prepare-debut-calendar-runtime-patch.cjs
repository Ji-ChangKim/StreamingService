const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');

function patchCalendarRuntime(source){
 const start=source.indexOf('function portalProfileEvent(profile) {');
 const end=source.indexOf('__name(portalProfileEvent,',start);
 if(start<0||end<start)throw new Error('LIVE_CALENDAR_FUNCTION_NOT_FOUND');
 const original=source.slice(start,end);
 if(original.split('type: "FIRST_DEBUT"').length!==2)throw new Error('LIVE_CALENDAR_STRUCTURE_CHANGED');
 const changed=original.replace('type: "FIRST_DEBUT"','type: profile.debutKind || "FIRST_DEBUT"')
  .replace('title: `${profile.displayName} \\uB370\\uBDD4 \\uBC29\\uC1A1`','title: `${profile.displayName}${profile.debutKind === "PLATFORM_DEBUT" ? ` ${profile.platform} 플랫폼` : ""} 데뷔 방송`');
 if(!changed.includes('플랫폼'))throw new Error('LIVE_CALENDAR_TITLE_CHANGED');
 let output=source.slice(0,start)+changed+source.slice(end);
 // 소유자와 관리자 편집에서도 이미 확인한 행사 범위를 잃지 않는다.
 for(const anchor of ['ownerVerified: true,\n    source: original.source,','source: original.source,\n    ownerVerified: original.ownerVerified,']){
  if(output.split(anchor).length!==2)throw new Error('LIVE_EDIT_STRUCTURE_CHANGED');
  output=output.replace(anchor,anchor+'\n    debutKind: original.debutKind,');
 }
 return output.replace('import manifestJSON from "__STATIC_CONTENT_MANIFEST";','import manifestJSON from "./__STATIC_CONTENT_MANIFEST";');
}

function prepare(directory,expectedHash){
 const entry=path.join(directory,'index.js'),source=fs.readFileSync(entry,'utf8');
 if(hash(source)!==expectedHash)throw new Error('LIVE_BASELINE_HASH_MISMATCH');
 const output=patchCalendarRuntime(source),manifest=fs.readFileSync(path.join(directory,'__STATIC_CONTENT_MANIFEST'));
 const settings=JSON.parse(fs.readFileSync(path.join(directory,'settings.json'),'utf8'));
 const db=settings.bindings.find(b=>b.name==='DB'),kv=settings.bindings.find(b=>b.name==='__STATIC_CONTENT');
 if(!db?.database_id||!kv?.namespace_id)throw new Error('LIVE_BINDINGS_MISSING');
 fs.writeFileSync(path.join(directory,'index.before-calendar-fix.js'),source);
 fs.writeFileSync(entry,output);
 const config={name:'streaming',main:'index.js',compatibility_date:settings.compatibility_date,
  compatibility_flags:settings.compatibility_flags,keep_vars:true,workers_dev:true,preview_urls:true,
  rules:[{type:'Text',globs:['**/__STATIC_CONTENT_MANIFEST'],fallthrough:true}],
  routes:[{pattern:'vdebut.live',custom_domain:true},{pattern:'dev.vdebut.live',custom_domain:true}],
  d1_databases:[{binding:'DB',database_name:'vdebut-db',database_id:db.database_id}],
  kv_namespaces:[{binding:'__STATIC_CONTENT',id:kv.namespace_id}],
  triggers:{crons:['*/10 * * * *','0 15 * * SUN']}};
 fs.writeFileSync(path.join(directory,'wrangler.calendar-fix.jsonc'),JSON.stringify(config,null,2)+'\n');
 const report={before:hash(source),after:hash(output),manifestSha256:hash(manifest),changes:['달력 행사 유형과 제목','소유자·관리자 편집 시 기존 행사 유형 보존','같은 정적 자산 색인 연결']};
 fs.writeFileSync(path.join(directory,'calendar-fix.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
if(require.main===module)prepare(path.resolve(process.argv[2]),process.argv[3]);
module.exports={patchCalendarRuntime,prepare};
