const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

function queryD1Sql(sql) {
  const oneLine = sql.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', '--json', `--command=${oneLine}`], {
    cwd: backendDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const stdout = res.stdout || '';
  const jsonStart = stdout.indexOf('[');
  if (jsonStart !== -1) {
    const parsed = JSON.parse(stdout.substring(jsonStart).trim());
    for (const item of parsed) {
      if (item.results && item.results.length > 0) {
        return item.results;
      }
    }
  }
  return [];
}

const list = queryD1Sql(`
  SELECT 
    i.debut_date,
    i.debut_time,
    c.platform,
    i.display_name,
    i.country_code,
    CASE WHEN LENGTH(i.profile_image_url) > 0 THEN 'O' ELSE 'X' END as has_avatar,
    c.channel_url
  FROM streamerChannel c
  JOIN streamerChannel_info i ON c.id = i.channel_id
  WHERE i.debut_date BETWEEN '2026-09-07' AND '2026-09-13'
  ORDER BY i.debut_date, i.debut_time;
`);

console.log(`\n📅 2026년 9월 7일 ~ 9월 13일 등록된 전체 스트리머 현황 (${list.length}명):`);
console.table(list);
