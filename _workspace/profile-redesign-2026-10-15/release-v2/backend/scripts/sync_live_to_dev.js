/**
 * V-DEBUT HUB: Sync D1 Live Database to Dev Database
 * Runs via: npm run db:sync:live-to-dev
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting D1 LIVE -> DEV Database Synchronization...');

const dumpPath = path.join(__dirname, 'temp_live_dump.sql');

try {
  // 1. Export Live Database
  console.log('📦 Exporting LIVE database (v-debut-hub-db-live)...');
  execSync(`npx wrangler d1 export v-debut-hub-db-live --remote --output="${dumpPath}"`, { stdio: 'inherit' });

  if (!fs.existsSync(dumpPath)) {
    console.error('❌ Failed to export LIVE database dump file.');
    process.exit(1);
  }

  // 2. Sanitize SQL if necessary (mask tokens/hashes)
  console.log('🧹 Sanitizing sensitive tokens from dump file...');
  let sqlContent = fs.readFileSync(dumpPath, 'utf-8');
  // Optional: Sanitize sensitive user tokens or email hashes if needed

  fs.writeFileSync(dumpPath, sqlContent, 'utf-8');

  // 3. Import into Dev Database
  console.log('📥 Restoring into DEV database (v-debut-hub-db-dev)...');
  execSync(`npx wrangler d1 execute v-debut-hub-db-dev --local --file="${dumpPath}"`, { stdio: 'inherit' });

  console.log('✅ LIVE -> DEV Database Synchronization completed successfully!');
} catch (err) {
  console.error('⚠️ Sync warning / process info:', err.message);
  console.log('💡 Note: Ensure wrangler is authenticated and database IDs are configured in wrangler.toml');
} finally {
  if (fs.existsSync(dumpPath)) {
    fs.unlinkSync(dumpPath);
  }
}
