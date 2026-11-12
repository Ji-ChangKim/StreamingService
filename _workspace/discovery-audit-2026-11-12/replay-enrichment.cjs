const fs=require('node:fs'),path=require('node:path');const A=require('./automation.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const profiles=read(path.join(__dirname,'public-before.json')).profiles.filter(p=>p.debutDate>='2026-11-01'&&p.debutDate<='2026-11-11');
(async()=>{const rows=[];for(const p of profiles){
 const record=read(path.join(__dirname,'profile-sources',`${p.slug}.json`));const raw=record.raw.data||record.raw;
 const key=A.portalChannelKey(p.channelUrl,p.platform),bio=p.platform==='SOOP'?[raw.station?.display?.profile_text,raw.station?.profile_text,raw.station?.station_title].filter(Boolean).join('\n'):raw.description;
 const url=record.sourceUrl||record.url;const homeFile=path.join(__dirname,'soop-posts',`${p.slug}-home.json`);
 const net=new A.BudgetNetwork(Date.now()+10000,async input=>{const u=typeof input==='string'?input:input.url;if(u.endsWith('/home'))return Response.json(read(homeFile).raw);const id=u.split('/').pop();return Response.json(read(path.join(__dirname,'soop-posts',`${p.slug}-post-${id}.json`)).raw);});
 const facts=await A.collectProfileEnrichment(net,{channelKey:key,platform:p.platform},{bio:bio||'',apiUrl:url});
 const additions={};for(const [k,v]of Object.entries(facts.details))if(!p.details?.[k])additions[`details.${k}`]=v;
 if(!p.regularSchedule&&facts.regularSchedule)additions.regularSchedule=facts.regularSchedule;
 const conflicts=Object.entries(facts.details).filter(([k,v])=>p.details?.[k]&&p.details[k]!==v).map(([key,value])=>({key,site:p.details[key],source:value}));
 const row={slug:p.slug,name:p.displayName,platform:p.platform,date:p.debutDate,sourceUrl:url,officialName:p.platform==='SOOP'?raw.station.user_nick:raw.creatorName,nameDiff:p.displayName!==(p.platform==='SOOP'?raw.station.user_nick:raw.creatorName),additions,conflicts,sourceConflicts:facts.conflicts,evidence:facts.evidence};rows.push(row);console.log(JSON.stringify(row));
 }fs.writeFileSync(path.join(__dirname,'enrichment-replay.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify({checked:rows.length,peopleWithAdditions:rows.filter(r=>Object.keys(r.additions).length).length,fields:rows.reduce((n,r)=>n+Object.keys(r.additions).length,0)}));})().catch(e=>{console.error(e);process.exitCode=1;});
