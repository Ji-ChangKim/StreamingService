const fs=require('node:fs'),path=require('node:path');const A=require('./automation.cjs');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8'));
(async()=>{for(const [name,url]of [['public-after.json','https://vdebut.live/api/v1/portal/profiles?version=3'],['calendar-after.json','https://vdebut.live/api/v1/events']]){const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`HTTP_${r.status}`);const body=await r.text();fs.writeFileSync(path.join(__dirname,name),body);}
 const before=read('public-before.json').profiles,after=read('public-after.json').profiles,map=new Map(after.map(p=>[p.slug,p]));const changes=[];
 for(const p of before){const q=map.get(p.slug);if(!q)throw new Error(`REMOVED_${p.slug}`);if(JSON.stringify(p)===JSON.stringify(q))continue;const changed=Object.keys({...p,...q}).filter(k=>JSON.stringify(p[k])!==JSON.stringify(q[k]));const fields=[];for(const k of changed){if(k==='contentReview')continue;if(k==='details')for(const [key,value]of Object.entries(q.details||{})){if(value!==p.details?.[key])fields.push({key:`details.${key}`,before:p.details?.[key]||'',after:value});}else fields.push({key:k,before:p[k]||'',after:q[k]});}
 if(changed.some(k=>!['details','regularSchedule','contentReview'].includes(k)))throw new Error(`UNEXPECTED_FIELDS_${p.slug}_${changed}`);
 for(const [key,value]of Object.entries(p.details||{}))if(q.details?.[key]!==value)throw new Error(`EXISTING_DETAIL_CHANGED_${p.slug}_${key}`);
 if(!A.isPublicProfile(q))throw new Error(`NO_LONGER_PUBLIC_${p.slug}`);
 changes.push({slug:p.slug,name:p.displayName,fields});
 }
 const events=read('calendar-after.json').events;for(const p of after.filter(p=>p.debutDate>='2026-11-01'&&p.debutDate<='2026-11-11')){const e=events.find(e=>e.creator.slug===p.slug);if(!e||e.startAtUtc!==p.startAtUtc||!e.links.some(l=>l.url===p.channelUrl))throw new Error(`EVENT_MISMATCH_${p.slug}`);}
 const result={before:before.length,after:after.length,changedPeople:changes.length,addedFields:changes.reduce((n,c)=>n+c.fields.length,0),unchanged:before.length-changes.length,changes,verifiedAt:new Date().toISOString()};fs.writeFileSync(path.join(__dirname,'public-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
