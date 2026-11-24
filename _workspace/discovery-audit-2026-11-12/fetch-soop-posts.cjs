const fs=require('node:fs'),path=require('node:path');const A=require('./automation.cjs');
const profiles=JSON.parse(fs.readFileSync(path.join(__dirname,'public-before.json'),'utf8')).profiles.filter(p=>p.platform==='SOOP'&&p.debutDate>='2026-11-01'&&p.debutDate<='2026-11-11');
const from=Number(process.argv[2]||0),to=Number(process.argv[3]||profiles.length),dir=path.join(__dirname,'soop-posts');fs.mkdirSync(dir,{recursive:true});
const net=new A.BudgetNetwork(Date.now()+105000),headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'};
(async()=>{const rows=[];for(let i=from;i<Math.min(to,profiles.length);i++){
 const p=profiles[i],id=p.channelUrl.split('/').pop(),home=`https://chapi.sooplive.co.kr/api/${id}/home`;
 try{const raw=await net.json(home,headers);fs.writeFileSync(path.join(dir,`${p.slug}-home.json`),JSON.stringify({url:home,raw},null,2));const boards=raw.boards||raw.data?.boards||[];const selected=boards.filter(b=>b.title_no&&/프로필|profile|소개|정보/i.test(`${b.bbs_name||''} ${b.title_name||''}`)).slice(0,1);const row={slug:p.slug,boardCount:boards.length,selected:selected.map(b=>({id:b.title_no,title:b.title_name,board:b.bbs_name}))};rows.push(row);console.log(JSON.stringify(row));
 for(const b of selected){const url=`https://chapi.sooplive.co.kr/api/${id}/title/${b.title_no}`;try{const raw=await net.json(url,headers);fs.writeFileSync(path.join(dir,`${p.slug}-post-${b.title_no}.json`),JSON.stringify({url,checkedAt:new Date().toISOString(),raw},null,2));}catch(e){console.log(JSON.stringify({slug:p.slug,postError:e.message}));}}
 }catch(e){rows.push({slug:p.slug,error:e.message});console.log(JSON.stringify({slug:p.slug,error:e.message}));}
 }fs.writeFileSync(path.join(dir,`results-${from}-${to}.json`),JSON.stringify({externalRequests:net.requests,rows},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
