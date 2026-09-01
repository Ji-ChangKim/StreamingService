const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,ja-JP;q=0.8,en-US;q=0.7,en;q=0.6',
};

// Helper to execute SQL on remote D1 database via wrangler
function runD1Sql(sql) {
  const tempFile = path.join(__dirname, `temp_sync_${Date.now()}.sql`);
  fs.writeFileSync(tempFile, sql, 'utf8');
  try {
    const stdout = execSync(`npx wrangler d1 execute vdebut-db --remote --file="${tempFile}"`, {
      cwd: backendDir,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    return err.stdout || err.message;
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

function queryD1Sql(sql) {
  try {
    const stdout = execSync(`npx wrangler d1 execute vdebut-db --remote --json --command="${sql.replace(/"/g, '\\"')}"`, {
      cwd: backendDir,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const jsonStart = stdout.indexOf('[');
    if (jsonStart !== -1) {
      const parsed = JSON.parse(stdout.substring(jsonStart).trim());
      for (const item of parsed) {
        if (item.results && item.results.length > 0 && (item.results[0].channel_url || item.results[0].platform || item.results[0].display_name || item.results[0].id)) {
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

// 1. Chzzk profile fetcher
async function fetchChzzk(channelUrl) {
  try {
    let channelId = channelUrl.trim();
    if (channelUrl.includes('/video/')) {
      const parts = channelUrl.split('/video/');
      const videoId = parts[1]?.split('?')[0]?.split('/')[0];
      if (videoId) {
        const res = await fetch(`https://api.chzzk.naver.com/service/v1/videos/${videoId}`, {
          headers: DEFAULT_HEADERS,
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.code === 200 && data.content?.channel) {
            return {
              imageUrl: data.content.channel.channelImageUrl || '',
              displayName: data.content.channel.channelName || '',
              description: data.content.channel.channelDescription || '',
            };
          }
        }
      }
    }

    if (channelUrl.startsWith('http://') || channelUrl.startsWith('https://')) {
      const urlObj = new URL(channelUrl);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      channelId = segments[segments.length - 1] || '';
      if (segments[0] === 'live' && segments[1]) {
        channelId = segments[1];
      }
    }

    const res = await fetch(`https://api.chzzk.naver.com/service/v1/channels/${channelId}`, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.content) {
        return {
          imageUrl: data.content.channelImageUrl || '',
          displayName: data.content.channelName || '',
          description: data.content.channelDescription || '',
        };
      }
    }
  } catch (e) {
    console.error(`Chzzk fetch error for ${channelUrl}:`, e.message);
  }
  return null;
}

// 2. SOOP profile fetcher
async function fetchSoop(channelUrl) {
  try {
    let userId = channelUrl.trim();
    if (channelUrl.startsWith('http://') || channelUrl.startsWith('https://')) {
      const urlObj = new URL(channelUrl);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      if (segments.includes('memo')) {
        const idx = segments.indexOf('memo');
        if (segments[idx + 1]) userId = segments[idx + 1];
      } else if (segments.includes('station')) {
        const idx = segments.indexOf('station');
        if (segments[idx + 1]) userId = segments[idx + 1];
      } else if (segments.length > 0) {
        userId = segments[segments.length - 1];
      }
    }

    let res = await fetch(`https://chapi.sooplive.co.kr/api/${userId}/station`, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      res = await fetch(`https://chapi.sooplive.com/api/${userId}/station`, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(5000),
      });
    }

    if (res.ok) {
      const resData = await res.json();
      const data = resData.data || resData;
      const station = data?.station;
      const broad = data?.broad;
      if (data && (station || data.user_nick || data.profile_image)) {
        let profileImg = data?.profile_image || station?.profile_image || '';
        if (profileImg.startsWith('//')) profileImg = `https:${profileImg}`;
        const nick = station?.user_nick || broad?.user_nick || station?.name || data.user_nick || userId;
        const desc = station?.joint_title || station?.station_name || `${nick}의 공식 SOOP 방송국입니다.`;
        return {
          imageUrl: profileImg,
          displayName: nick,
          description: desc,
        };
      }
    }
  } catch (e) {
    console.error(`SOOP fetch error for ${channelUrl}:`, e.message);
  }
  return null;
}

// 3. YouTube profile fetcher
async function fetchYoutube(channelUrl) {
  try {
    let targetUrl = channelUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = targetUrl.startsWith('@') ? `https://www.youtube.com/${targetUrl}` : `https://www.youtube.com/@${targetUrl}`;
    }

    const res = await fetch(targetUrl, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    let creatorName = '';
    let profileImageUrl = '';
    let description = '';

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      creatorName = titleMatch[1].replace(/ - YouTube$/, '').trim();
    }

    const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);
    if (descMatch) {
      description = descMatch[1];
    }

    const avatarMatches = html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+=[sS0-9-]+[a-zA-Z0-9_-]*/g) ||
                          html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+/g);
    if (avatarMatches && avatarMatches.length > 0) {
      profileImageUrl = avatarMatches[0].replace(/=s\d+-/, '=s900-');
    }

    if (profileImageUrl) {
      return {
        imageUrl: profileImageUrl,
        displayName: creatorName,
        description,
      };
    }
  } catch (e) {
    console.error(`YouTube fetch error for ${channelUrl}:`, e.message);
  }
  return null;
}

// 4. Twitch profile fetcher
async function fetchTwitch(channelUrl) {
  try {
    let username = channelUrl.trim();
    if (channelUrl.includes('twitch.tv/')) {
      const parts = channelUrl.split('twitch.tv/');
      username = parts[1]?.split('?')[0]?.split('/')[0] || '';
    }
    return {
      imageUrl: '',
      displayName: username,
      description: `${username}의 트위치 공식 채널입니다.`,
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('🔄 1. Fetching streamers with missing or placeholder avatars from D1...');
  const list = queryD1Sql(
    'SELECT i.id, i.display_name, i.profile_image_url, i.description, c.platform, c.channel_url FROM streamerChannel_info i INNER JOIN streamerChannel c ON i.channel_id = c.id WHERE i.profile_image_url IS NULL OR i.profile_image_url = "" OR i.profile_image_url LIKE "%unsplash%";'
  );

  console.log(`📋 Found ${list.length} streamers needing profile sync.`);

  const updateQueries = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    console.log(`[${i + 1}/${list.length}] [${item.platform}] Syncing ${item.display_name} (${item.channel_url})...`);
    let result = null;
    if (item.platform === 'CHZZK') {
      result = await fetchChzzk(item.channel_url);
    } else if (item.platform === 'SOOP') {
      result = await fetchSoop(item.channel_url);
    } else if (item.platform === 'YOUTUBE') {
      result = await fetchYoutube(item.channel_url);
    } else if (item.platform === 'TWITCH') {
      result = await fetchTwitch(item.channel_url);
    }

    if (result && result.imageUrl) {
      console.log(`  ✅ Success: ${result.displayName || item.display_name} -> ${result.imageUrl.substring(0, 55)}...`);
      const safeAvatar = result.imageUrl.replace(/'/g, "''");
      const safeDesc = (result.description || item.description || '').replace(/'/g, "''");
      const safeName = (result.displayName || item.display_name || '').replace(/'/g, "''");
      updateQueries.push(
        `UPDATE streamerChannel_info SET profile_image_url = '${safeAvatar}', description = COALESCE(NULLIF('${safeDesc}', ''), description), display_name = CASE WHEN display_name LIKE '%신입%' OR display_name = '' THEN '${safeName}' ELSE display_name END, updated_at = CURRENT_TIMESTAMP WHERE id = ${item.id};`
      );
    } else {
      console.log(`  ⚠️ Could not retrieve avatar for ${item.display_name}`);
    }

    // Small delay to prevent rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  if (updateQueries.length > 0) {
    console.log(`🚀 Executing ${updateQueries.length} UPDATE queries to D1 DB...`);
    const sqlContent = updateQueries.join('\n');
    const res = runD1Sql(sqlContent);
    console.log('✅ Remote D1 Profile Sync Result:', res);
  } else {
    console.log('ℹ️ No profiles updated.');
  }
}

main().catch(console.error);
