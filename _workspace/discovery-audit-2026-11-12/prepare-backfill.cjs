const fs=require('node:fs');
const config=JSON.parse(fs.readFileSync('backend/wrangler.debut-automation.jsonc','utf8'));
config.triggers.crons.push('* * * * *');
Object.assign(config.vars,{SMOKE_TEST_UNTIL:'',BACKFILL_FROM:'2026-11-01',BACKFILL_TO:'2026-11-11',BACKFILL_UNTIL:new Date(Date.now()+25*60000).toISOString()});
fs.writeFileSync('backend/wrangler.debut-backfill.jsonc',JSON.stringify(config,null,2));
console.log(JSON.stringify({crons:config.triggers.crons,vars:config.vars,limits:config.limits}));
