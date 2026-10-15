const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..');
const migrationSql = fs.readFileSync(path.join(backendDir, 'migrations', '0019_create_admin_and_submissions.sql'), 'utf-8');

console.log('🚀 Applying Migration 0019 to remote D1 database...');

const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', `--file=./migrations/0019_create_admin_and_submissions.sql`], {
  cwd: backendDir,
  encoding: 'utf-8'
});

console.log('STDOUT:', res.stdout);
console.log('STDERR:', res.stderr);

if (res.status === 0) {
  console.log('✅ Migration 0019 executed successfully!');
} else {
  console.error('❌ Migration 0019 failed with status:', res.status);
}
