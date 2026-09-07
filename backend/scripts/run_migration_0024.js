const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,ja-JP;q=0.8,en-US;q=0.7,en;q=0.6',
};

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

async function fetchProfile(s) {
  try {
    if (s.platform === 'CHZZK') {
      const channelId = s.channel_url.split('/').pop().split('?')[0];
      const res = await fetch(`https://api.chzzk.naver.com/service/v1/channels/${channelId}`, {
        headers: DEFAULT_HEADERS,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 200 && data.content) {
          return {
            displayName: data.content.channelName || s.display_name,
            imageUrl: data.content.channelImageUrl || '',
            description: data.content.channelDescription || '',
          };
        }
      }
    } else if (s.platform === 'YOUTUBE') {
      const res = await fetch(s.channel_url, { headers: DEFAULT_HEADERS });
      if (res.ok) {
        const html = await res.text();
        let displayName = '';
        let imageUrl = '';
        let description = '';

        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          displayName = titleMatch[1].replace(/ - YouTube$/, '').trim();
        }
        const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);
        if (descMatch) {
          description = descMatch[1];
        }
        const avatarMatches = html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+=[sS0-9-]+[a-zA-Z0-9_-]*/g) ||
                              html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+/g);
        if (avatarMatches && avatarMatches.length > 0) {
          imageUrl = avatarMatches[0].replace(/=s\d+-/, '=s900-');
        }
        return { displayName: displayName || s.display_name, imageUrl, description };
      }
    }
  } catch (e) {
    console.error(`Profile fetch error for ${s.display_name}:`, e.message);
  }
  return null;
}

const streamers = [
  // 9월 07일 (월)
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@Amaizawaelu',
    channel_name: '天井沢依留',
    slug: 'amaizawaelu',
    display_name: '天井沢依留',
    debut_date: '2026-09-07',
    debut_time: '18:00',
    start_at_utc: '2026-09-07T09:00:00.000Z',
    country_code: 'JP',
    description: '天井沢依留의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 10일 (목)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/6d2a388447b723033afdcd46197cb00e',
    channel_name: '밀루아',
    slug: 'milua',
    display_name: '밀루아',
    debut_date: '2026-09-10',
    debut_time: '14:00',
    start_at_utc: '2026-09-10T05:00:00.000Z',
    country_code: 'KR',
    description: '밀루아 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 12일 (토)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/383716757f6f467cd9bdfab7b1d6c082',
    channel_name: '유메사키 후카',
    slug: 'yumesaki-fuka',
    display_name: '유메사키 후카',
    debut_date: '2026-09-12',
    debut_time: '15:00',
    start_at_utc: '2026-09-12T06:00:00.000Z',
    country_code: 'KR',
    description: '유메사키 후카 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@Dolly_AMAN005',
    channel_name: 'ヤドカリのドリィ',
    slug: 'yadokari-dolly',
    display_name: 'ヤドカリのドリィ',
    debut_date: '2026-09-12',
    debut_time: '20:00',
    start_at_utc: '2026-09-12T11:00:00.000Z',
    country_code: 'JP',
    description: 'ヤドカリのドリィ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@mizuno__uta',
    channel_name: '音蓮みずの',
    slug: 'mizuno-uta',
    display_name: '音蓮みずの',
    debut_date: '2026-09-12',
    debut_time: '21:00',
    start_at_utc: '2026-09-12T12:00:00.000Z',
    country_code: 'JP',
    description: '音蓮みずの의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@2mty-Mumitsuya6328',
    channel_name: 'むみつや',
    slug: 'mumitsuya',
    display_name: 'むみつや',
    debut_date: '2026-09-12',
    debut_time: '21:00',
    start_at_utc: '2026-09-12T12:00:00.000Z',
    country_code: 'JP',
    description: 'むみつや의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@nemurairamune',
    channel_name: '眠来らむね',
    slug: 'nemurai-ramune',
    display_name: '眠来らむね',
    debut_date: '2026-09-12',
    debut_time: '23:50',
    start_at_utc: '2026-09-12T14:50:00.000Z',
    country_code: 'JP',
    description: '眠来らむね의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
];

async function run() {
  console.log(`🚀 Starting Migration 0024 execution for ${streamers.length} streamers...`);

  for (let i = 0; i < streamers.length; i++) {
    const s = streamers[i];
    console.log(`\n[${i + 1}/${streamers.length}] Processing ${s.display_name} (${s.platform})...`);

    // 1. Fetch live profile info
    const profile = await fetchProfile(s);
    const avatarUrl = profile?.imageUrl || '';
    const desc = profile?.description ? profile.description.replace(/'/g, "''") : s.description.replace(/'/g, "''");

    // 2. Insert streamerChannel
    const channelSql = `INSERT INTO streamerChannel (platform, channel_url, channel_name) SELECT '${s.platform}', '${s.channel_url}', '${s.channel_name.replace(/'/g, "''")}' WHERE NOT EXISTS (SELECT 1 FROM streamerChannel WHERE platform = '${s.platform}' AND channel_url = '${s.channel_url}');`;
    const res1 = executeD1(channelSql);
    if (!res1.success) {
      console.error(`❌ Failed to insert channel for ${s.display_name}:`, res1.error);
      process.exit(1);
    }

    // 3. Insert streamerChannel_info
    const safeName = s.display_name.replace(/'/g, "''");
    const safeAvatar = avatarUrl.replace(/'/g, "''");
    const infoSql = `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code) SELECT sc.id, '${s.slug}', '${safeName}', '${safeAvatar}', '${desc}', '${s.agency_name}', '${s.debut_date}', '${s.debut_time}', 'Asia/Seoul', '${s.start_at_utc}', '${s.country_code}' FROM streamerChannel sc WHERE sc.platform = '${s.platform}' AND sc.channel_url = '${s.channel_url}' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id OR sci.slug = '${s.slug}');`;
    const res2 = executeD1(infoSql);
    if (!res2.success) {
      console.error(`❌ Failed to insert info for ${s.display_name}:`, res2.error);
      process.exit(1);
    }

    // 4. Update if profile already existed without avatar
    if (safeAvatar) {
      const updateSql = `UPDATE streamerChannel_info SET profile_image_url = '${safeAvatar}', description = COALESCE(NULLIF('${desc}', ''), description), updated_at = CURRENT_TIMESTAMP WHERE slug = '${s.slug}';`;
      executeD1(updateSql);
    }

    console.log(`  ✅ Successfully registered: ${s.display_name} (Avatar: ${avatarUrl ? 'Yes' : 'No'})`);
  }

  console.log('\n🎉 Migration 0024 completed successfully!');
}

run().catch(console.error);
