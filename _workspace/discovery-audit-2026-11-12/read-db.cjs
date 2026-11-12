const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const cli='C:/Users/Jichang/AppData/Local/npm-cache/_npx/7f3444e3cc855b0c/node_modules/wrangler/bin/wrangler.js';
const sql=fs.readFileSync(path.join(__dirname,'audit.sql'),'utf8').split(';').map(x=>x.trim()).filter(Boolean);
const results=[];
for(const query of sql){const r=spawnSync(process.execPath,[cli,'d1','execute','vdebut-db','--remote','--config','backend/wrangler.debut-automation.jsonc','--command',query,'--json'],{encoding:'utf8',maxBuffer:20*1024*1024});if(r.status!==0)throw new Error(r.stderr.slice(-1000));let text=r.stdout;const start=text.indexOf('[\n');if(start>=0)text=text.slice(start);const parsed=JSON.parse(text);results.push(parsed[0]);console.log(JSON.stringify({rows:parsed[0].results.length,meta:parsed[0].meta}));}
fs.writeFileSync(path.join(__dirname,process.argv[2]||'db-before.json'),JSON.stringify(results,null,2));
