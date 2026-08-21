const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

function runD1Query(query) {
  const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', `--command=${query}`, '--json'], {
    cwd: backendDir,
    encoding: 'utf-8'
  });
  if (res.status !== 0) {
    console.error('Query failed:', res.stderr, res.stdout);
    return null;
  }
  try {
    return JSON.parse(res.stdout);
  } catch (e) {
    console.log('Raw output:', res.stdout);
    return null;
  }
}

console.log('🗑️ 1. Deleting dummy records from streamerChannel_info (slug LIKE "slug_17%")...');
const delInfoRes = runD1Query("DELETE FROM streamerChannel_info WHERE slug LIKE 'slug_17%';");
console.log('Info Delete Result:', JSON.stringify(delInfoRes?.[0]?.meta, null, 2));

console.log('\n🗑️ 2. Deleting orphaned records from streamerChannel (not referenced by streamerChannel_info)...');
const delChannelRes = runD1Query("DELETE FROM streamerChannel WHERE id NOT IN (SELECT channel_id FROM streamerChannel_info);");
console.log('Channel Delete Result:', JSON.stringify(delChannelRes?.[0]?.meta, null, 2));

console.log('\n📊 3. Verifying remaining counts...');
const countRes = runD1Query("SELECT count(*) as remaining_info, sum(CASE WHEN slug LIKE 'slug_17%' THEN 1 ELSE 0 END) as remaining_dummy FROM streamerChannel_info;");
console.log('Remaining Info:', JSON.stringify(countRes?.[0]?.results, null, 2));

const channelCountRes = runD1Query("SELECT count(*) as remaining_channels FROM streamerChannel;");
console.log('Remaining Channels:', JSON.stringify(channelCountRes?.[0]?.results, null, 2));

console.log('\n📋 4. Listing sample remaining valid streamers:');
const sampleRes = runD1Query("SELECT i.id, i.slug, i.display_name, i.debut_date, c.platform FROM streamerChannel_info i INNER JOIN streamerChannel c ON i.channel_id = c.id ORDER BY i.id ASC LIMIT 10;");
console.log('Sample Streamers:', JSON.stringify(sampleRes?.[0]?.results, null, 2));
