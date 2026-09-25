const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..');
const migrationSqlFile = path.resolve(__dirname, '..', 'migrations', '0032_add_rain_streamer.sql');

function executeD1File(filePath) {
  console.log(`Executing SQL file on D1 remote: ${filePath}`);
  const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', `--file=${filePath}`], {
    cwd: backendDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (res.error) {
    return { success: false, error: res.error.message };
  }
  const output = res.stdout || res.stderr || '';
  if (output.includes('"error"') || output.includes('Error:') || output.includes('Authentication error')) {
    return { success: false, error: output };
  }
  return { success: true, output };
}

function queryD1Sql(sql) {
  try {
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
  } catch (err) {
    console.error('queryD1Sql error:', err.message);
    return [];
  }
}

async function main() {
  console.log('=== Step 1: Execute Migration 0032 ===');
  const execResult = executeD1File(migrationSqlFile);
  if (!execResult.success) {
    console.error('Migration failed:', execResult.error);
    process.exit(1);
  }
  console.log('Migration executed successfully:\n', execResult.output);

  console.log('\n=== Step 2: Verify Rain Streamer in Database ===');
  const verifySql = `
    SELECT
      sc.id, sc.platform, sc.channel_url, sc.channel_name,
      sci.slug, sci.display_name, sci.debut_date, sci.debut_time,
      sci.start_at_utc, sci.profile_image_url, sci.x_url
    FROM streamerChannel sc
    JOIN streamerChannel_info sci ON sc.id = sci.channel_id
    WHERE sci.slug = 'rain';
  `;
  const results = queryD1Sql(verifySql);
  console.log('Verification Results:', JSON.stringify(results, null, 2));

  if (results.length > 0) {
    console.log('\n[SUCCESS] Rain (래인) debut schedule is successfully registered in Cloudflare D1!');
  } else {
    console.error('\n[ERROR] Rain (래인) record not found after migration.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
