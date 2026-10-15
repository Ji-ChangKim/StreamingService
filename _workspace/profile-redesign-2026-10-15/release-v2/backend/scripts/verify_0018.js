const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');
const query = `
SELECT 
  i.id,
  i.slug,
  i.display_name,
  i.agency_name,
  i.country_code,
  i.debut_date,
  i.debut_time,
  i.start_at_utc,
  i.x_url,
  c.platform,
  c.channel_url,
  c.channel_name
FROM streamerChannel_info i
JOIN streamerChannel c ON i.channel_id = c.id
WHERE i.agency_name = 'Uralogic Game Company'
ORDER BY i.start_at_utc ASC;
`;

const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', `--command=${query.replace(/\n/g, ' ')}`, '--json'], {
  cwd: backendDir,
  encoding: 'utf-8'
});

console.log('Result:');
try {
  const parsed = JSON.parse(res.stdout);
  console.log(JSON.stringify(parsed[0]?.results, null, 2));
} catch {
  console.log(res.stdout);
}
