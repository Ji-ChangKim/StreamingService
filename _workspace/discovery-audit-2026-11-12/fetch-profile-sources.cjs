const fs=require('node:fs'),path=require('node:path');
const A=require('./automation.cjs');
const profiles=JSON.parse(fs.readFileSync(path.join(__dirname,'public-before.json'),'utf8')).profiles.filter(p=>p.debutDate>='2026-11-01'&&p.debutDate<='2026-11-11');
const args=process.argv.slice(2),from=Number(args[0]||0),to=Number(args[1]||profiles.length);
const sourceDir=path.join(__dirname,'profile-sources');fs.mkdirSync(sourceDir,{recursive:true});
const net=new A.BudgetNetwork(Date.now()+105000);
const rows=[];
(async()=>{for(let i=from;i<Math.min(to,profiles.length);i++){
 const p=profiles[i],key=A.portalChannelKey(p.channelUrl,p.platform);let apiUrl=p.platform==='SOOP'?`https://chapi.sooplive.co.kr/api/${key.split(':')[1]}/station`:`https://api.chzzk.naver.com/service/v1/channels/${key.split(':')[1]}`;
 try{
 if(fs.existsSync(path.join(sourceDir,`${p.slug}.json`))){console.log(JSON.stringify({slug:p.slug,cached:true}));continue;}
 const headers=p.platform==='SOOP'?{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}:{};
 let raw;try{raw=await net.json(apiUrl,headers);}catch(e){if(p.platform!=='SOOP'||!/^SOURCE_HTTP_(404|502|503|504)$/.test(e.message))throw e;apiUrl=apiUrl.replace('sooplive.co.kr','sooplive.com');raw=await net.json(apiUrl,headers);}
 fs.writeFileSync(path.join(sourceDir,`${p.slug}.json`),JSON.stringify({url:apiUrl,checkedAt:new Date().toISOString(),raw},null,2));
 const value=raw.data||raw;const name=p.platform==='SOOP'?value.station?.user_nick:value.content?.channelName;
 const bio=p.platform==='SOOP'?[value.station?.display?.profile_text,value.station?.profile_text,value.station?.station_title].filter(Boolean).join('\n'):value.content?.channelDescription;
 const image=p.platform==='SOOP'?value.profile_image:value.content?.channelImageUrl;
 const details=A.extractLabelledDetails(bio||'');const row={slug:p.slug,name:p.displayName,platform:p.platform,url:apiUrl,currentName:name,imageChanged:p.avatarUrl!==((image||'').startsWith('//')?'https:'+image:image),bio,details};rows.push(row);console.log(JSON.stringify(row));
 }catch(e){const row={slug:p.slug,name:p.displayName,url:apiUrl,error:e.message};rows.push(row);console.log(JSON.stringify(row));}
 }
 fs.writeFileSync(path.join(__dirname,`profile-source-results-${from}-${to}.json`),JSON.stringify({externalRequests:net.requests,bytes:net.bytes,rows},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
