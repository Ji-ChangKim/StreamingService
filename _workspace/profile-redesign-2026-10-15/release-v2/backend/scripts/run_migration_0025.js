const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..');
const migrationSqlFile = path.resolve(backendDir, 'migrations', '0025_update_admin_credentials.sql');

function executeD1(sql) {
  const oneLine = sql.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', `--command=${oneLine}`], {
    cwd: backendDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (res.error) {
    return { success: false, error: res.error.message };
  }
  const output = res.stdout || res.stderr || '';
  if (output.includes('"error"') || output.includes('Error:')) {
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

async function run() {
  console.log('🚀 Starting Migration 0025 (Admin Credentials Update)...');

  const statements = [
    // 1. 기존 id=1 또는 Vdebut.admin 비밀번호 업데이트
    `UPDATE admin_users SET password_hash = 'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7', salt = 'vdebut_salt_2026' WHERE id = 1 OR LOWER(username) = 'vdebut.admin';`,
    
    // 2. vedebut.admin 등록
    `INSERT OR IGNORE INTO admin_users (username, password_hash, salt, role) VALUES ('vedebut.admin', 'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7', 'vdebut_salt_2026', 'ADMIN');`,
    `UPDATE admin_users SET password_hash = 'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7', salt = 'vdebut_salt_2026' WHERE LOWER(username) = 'vedebut.admin';`,

    // 3. vdebut.admin 소문자 등록
    `INSERT OR IGNORE INTO admin_users (username, password_hash, salt, role) VALUES ('vdebut.admin', 'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7', 'vdebut_salt_2026', 'ADMIN');`,
    `UPDATE admin_users SET password_hash = 'ee5dedc3e671b78267bb2efe9bd74e03199411a9227009f5cf432882d06eb7c7', salt = 'vdebut_salt_2026' WHERE LOWER(username) = 'vdebut.admin';`
  ];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[Step ${i + 1}/${statements.length}] Executing...`);
    const res = executeD1(stmt);
    if (!res.success) {
      console.error(`❌ Step ${i + 1} Failed:`, res.error);
      process.exit(1);
    }
  }

  console.log('\n🔍 Verifying updated admin_users table:');
  const users = queryD1Sql('SELECT id, username, salt, role, created_at, last_login_at FROM admin_users;');
  console.table(users);

  console.log('\n🎉 Migration 0025 successfully executed and verified!');
}

run().catch(console.error);
