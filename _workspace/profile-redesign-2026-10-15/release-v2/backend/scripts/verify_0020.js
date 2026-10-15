const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

const query = "SELECT sc.platform, sci.debut_date, sci.debut_time, sci.display_name, sci.agency_name, sci.country_code, sc.channel_url FROM streamerChannel_info sci JOIN streamerChannel sc ON sci.channel_id = sc.id WHERE sci.debut_date >= '2026-08-23' AND sci.debut_date <= '2026-08-30' ORDER BY sci.debut_date ASC, sci.debut_time ASC;";

console.log('🔍 Querying 2026-08-23 ~ 2026-08-30 debut streamers from remote D1...');

const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', `--command=${query}`, '--json'], {
  cwd: backendDir,
  encoding: 'utf-8'
});

if (res.status === 0) {
  try {
    const data = JSON.parse(res.stdout);
    const rows = data[0]?.results || [];
    console.log(`\n✅ Found ${rows.length} debut events between 2026-08-23 and 2026-08-30:`);
    console.table(rows);
  } catch {
    console.log('STDOUT:', res.stdout);
  }
} else {
  console.error('❌ Query failed:', res.stderr);
}
