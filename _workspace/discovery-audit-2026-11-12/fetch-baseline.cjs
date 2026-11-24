const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const jobs=[
 ['public-before.json','https://vdebut.live/api/v1/portal/profiles?version=3'],
 ['calendar-before.json','https://vdebut.live/api/v1/events'],
 ['soop-calendar.json','https://welcomevirtual.sooplive.com/api/api.php?work=getScheduleList&startDate=2026-11-01&endDate=2026-11-30'],
 ['sheet.csv','https://docs.google.com/spreadsheets/d/1SEcOZAhMqFLUW7bxSsBkWK0UriMD3fD82xXX2HrUf38/export?format=csv&gid=1884409648'],
 ['x-debutbot.html','https://x.com/VtuberDebutBot'],
 ['x-krfollower.html','https://x.com/KRVtubefollower'],
 ['x-vvw.html','https://x.com/vvw_kr'],
];
(async()=>{const results=[];for(let offset=0;offset<jobs.length;offset+=3){await Promise.all(jobs.slice(offset,offset+3).map(async([name,url])=>{try{const response=await fetch(url,{signal:AbortSignal.timeout(25000)});const body=await response.text();fs.writeFileSync(path.join(root,name),body);const item={name,url,status:response.status,bytes:Buffer.byteLength(body),checkedAt:new Date().toISOString()};results.push(item);console.log(JSON.stringify(item));}catch(e){const item={name,url,error:e.message};results.push(item);console.log(JSON.stringify(item));}}));}fs.writeFileSync(path.join(root,'baseline-fetches.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
