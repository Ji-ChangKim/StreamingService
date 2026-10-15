const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..');
const migrationFilePath = path.join(backendDir, 'migrations', '0029_create_analytics_schema.sql');

function executeD1SqlFile(filePath) {
  console.log(`[Migration 0029] Applying ${filePath} to remote D1 vdebut-db...`);
  const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', `--file=${filePath}`], {
    cwd: backendDir,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  if (res.error) {
    console.error('Execution failed:', res.error);
    return false;
  }

  const output = res.stdout || res.stderr || '';
  console.log(output);

  if (output.includes('"error"') || output.includes('Error:')) {
    console.error('D1 error output detected.');
    return false;
  }

  console.log('[Migration 0029] Successfully applied schema and initial mappings to remote D1!');
  return true;
}

if (!fs.existsSync(migrationFilePath)) {
  console.error(`File not found: ${migrationFilePath}`);
  process.exit(1);
}

const success = executeD1SqlFile(migrationFilePath);
process.exit(success ? 0 : 1);
