const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json',
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

async function fetchChzzkChannel(channelId) {
  try {
    const res = await fetch(`https://api.chzzk.naver.com/service/v1/channels/${channelId}`, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.content) {
        return {
          displayName: data.content.channelName,
          imageUrl: data.content.channelImageUrl || '',
          description: data.content.channelDescription || '',
        };
      }
    }
  } catch (e) {
    console.error(`Chzzk fetch error for ${channelId}:`, e.message);
  }
  return null;
}

async function fetchSoopStation(userId) {
  try {
    const res = await fetch(`https://chapi.sooplive.co.kr/api/${userId}/station`, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const resData = await res.json();
      const data = resData.data || resData;
      let img = data?.profile_image || data?.station?.profile_image || '';
      if (img.startsWith('//')) img = `https:${img}`;
      return {
        nick: data?.station?.user_nick || data?.user_nick || '이루',
        imageUrl: img,
        title: data?.station?.station_name || data?.station?.joint_title || '',
      };
    }
  } catch (e) {
    console.error(`SOOP fetch error for ${userId}:`, e.message);
  }
  return null;
}

const newStreamers = [
  {
    platform: 'CHZZK',
    channelId: 'eedbee523b1c059ce1d563ddfc095e3a',
    channel_url: 'https://chzzk.naver.com/eedbee523b1c059ce1d563ddfc095e3a',
    channel_name: '김멜트',
    slug: 'kim-melt',
    display_name: '김멜트',
    debut_date: '2026-09-18',
    debut_time: '14:00',
    start_at_utc: '2026-09-18T05:00:00.000Z',
    agency_name: '개인세',
    country_code: 'KR',
    fallback_image: 'https://nng-phinf.pstatic.net/MjAyNjAzMDlfNDEg/MDAxNzcyOTg1MDg0MDM5.lhqjiXFBDUbZwIe3FKH5rsskNjql4tie-acCMqUErNIg.xag1JIW6jnF-nALfpLPsp5zJAyK9rw2VT332-iksJiUg.PNG/image.png',
    description: '김멜트 버추얼 스트리머의 첫 데뷔 방송입니다.',
  },
  {
    platform: 'CHZZK',
    channelId: 'bda8a35d632c749407a80c23d0012798',
    channel_url: 'https://chzzk.naver.com/bda8a35d632c749407a80c23d0012798',
    channel_name: 'Astera',
    slug: 'astera',
    display_name: 'Astera',
    debut_date: '2026-09-18',
    debut_time: '19:00',
    start_at_utc: '2026-09-18T10:00:00.000Z',
    agency_name: 'Astera',
    country_code: 'KR',
    fallback_image: 'https://nng-phinf.pstatic.net/MjAyNTA4MjdfODkg/MDAxNzU2Mjc3MjQxMDY5.lZpFajq-p7poT7E3KeM0fn8_VNiCK_UmpcnXUveFUzog.-fzPrnPYD5mvP2H8WV6ikkDgxeNqTPFuPczZvDVkR20g.PNG/B97903C8-D6EA-429B-93EE-7DB1C3A6D307-1756277236.png',
    description: '버추얼 MCN 대표 Astera의 공식 스트리머 데뷔 방송입니다.',
  },
  {
    platform: 'CHZZK',
    channelId: '2be01a76b2e74bfc2d194f5944db0414',
    channel_url: 'https://chzzk.naver.com/2be01a76b2e74bfc2d194f5944db0414',
    channel_name: '순진',
    slug: 'soonjin',
    display_name: '순진',
    debut_date: '2026-09-19',
    debut_time: '19:00',
    start_at_utc: '2026-09-19T10:00:00.000Z',
    agency_name: '개인세',
    country_code: 'KR',
    fallback_image: 'https://nng-phinf.pstatic.net/MjAyNjA5MTJfNDEg/MDAxNzg5MjE3NjQ1MjI4.kqmB0pMszBx6zLMiXc9AERH-lBpA_E33Q630UkAc64cg.MRIFUuFnUWGEaeJMCnD871Ca68M9Pkt4UN0XiubYIUAg.JPEG/image.jpg',
    description: '순진 버추얼 스트리머의 공식 치지직 첫 데뷔 방송입니다.',
  },
  {
    platform: 'CHZZK',
    channelId: '28b25f53d292ebaad02e18753d26c70b',
    channel_url: 'https://chzzk.naver.com/28b25f53d292ebaad02e18753d26c70b',
    channel_name: '피요냥',
    slug: 'piyonyang',
    display_name: '피요냥',
    debut_date: '2026-09-19',
    debut_time: '00:00',
    start_at_utc: '2026-09-18T15:00:00.000Z',
    agency_name: '개인세',
    country_code: 'KR',
    fallback_image: 'https://nng-phinf.pstatic.net/MjAyNjA4MjZfMjg1/MDAxNzg3NzIzMjUyODI5.KBJMGvtSYZ_W0VMVxbeQdgGw9TB6JEnXd_C3e_RCRSsg.vKSVCnrCTyeQOPy1Vq7gKSqh6aLaljNhE4gnIDQ5kmsg.PNG/image.png',
    description: '[시간 미정] 알에서 태어난 고양이 피요냥의 공식 데뷔 방송입니다.',
  },
  {
    platform: 'CHZZK',
    channelId: '536bbb09bd3959aac89d5090b579394d',
    channel_url: 'https://chzzk.naver.com/536bbb09bd3959aac89d5090b579394d',
    channel_name: '세르온',
    slug: 'sereon',
    display_name: '세르온',
    debut_date: '2026-09-19',
    debut_time: '00:00',
    start_at_utc: '2026-09-18T15:00:00.000Z',
    agency_name: '노블리주',
    country_code: 'KR',
    fallback_image: 'https://nng-phinf.pstatic.net/MjAyNjA5MDVfMjk4/MDAxNzg4NjE2Njg5OTAz.XVrAMVv1PF8H0nDnNAVz_gH4zifpLfhJeqX0n_4xHSgg.4uUMMxkPoHpFHIft2BPjL_Z1h7xRGk6idMN_iYsX8xog.PNG/image.png',
    description: '[시간 미정] 노블리주 소속 세르온 버추얼 스트리머의 공식 데뷔 방송입니다.',
  },
  {
    platform: 'CHZZK',
    channelId: '121b621b0ca0c57539c8dd2d582a9e17',
    channel_url: 'https://chzzk.naver.com/121b621b0ca0c57539c8dd2d582a9e17',
    channel_name: '신예리',
    slug: 'shin-yeri',
    display_name: '신예리',
    debut_date: '2026-09-20',
    debut_time: '20:00',
    start_at_utc: '2026-09-20T11:00:00.000Z',
    agency_name: '개인세',
    country_code: 'KR',
    fallback_image: 'https://nng-phinf.pstatic.net/MjAyNjA5MDRfMjcz/MDAxNzg4NDg3ODY0MzI0.iR3Ibqt_BhqvvVTHaAnHG20OfaFn7QX9K6NVcnIVr8og.4JXyEKHdMBs2LXhLbZFeLvPnm98nEVR5tD1MKkXSiX0g.PNG/image.png',
    description: '신예리 버추얼 스트리머의 공식 데뷔 방송입니다.',
  },
];

async function run() {
  console.log('🚀 Starting Migration 0028: Mid-September Streamers Update...\n');

  // STEP 1: 이루 (SOOP arong0106) 최신화
  console.log('📦 [1/3] Updating 이루 (SOOP arong0106)...');
  const soopProfile = await fetchSoopStation('arong0106');
  const erooAvatar = soopProfile?.imageUrl || '';
  const erooDesc = '[웰컴버추얼] 이루의 공식 SOOP 데뷔 방송입니다.';

  const updateErooChannel = `UPDATE streamerChannel SET channel_name = '이루' WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/arong0106';`;
  executeD1(updateErooChannel);

  const updateErooInfo = `UPDATE streamerChannel_info SET display_name = '이루', slug = 'eroo-soop', description = '${erooDesc}', debut_date = '2026-09-16', debut_time = '12:00', start_at_utc = '2026-09-16T03:00:00.000Z', country_code = 'KR'${erooAvatar ? `, profile_image_url = '${erooAvatar}'` : ''}, updated_at = CURRENT_TIMESTAMP WHERE channel_id IN (SELECT id FROM streamerChannel WHERE platform = 'SOOP' AND channel_url = 'https://www.sooplive.com/station/arong0106');`;
  const erooRes = executeD1(updateErooInfo);
  if (erooRes.success) {
    console.log('  ✅ Successfully updated 이루 profile.');
  } else {
    console.error('  ❌ Failed to update 이루:', erooRes.error);
  }

  // STEP 2: 신규 6인 스트리머 등록
  console.log('\n📦 [2/3] Registering 6 new virtual streamers...');
  for (const s of newStreamers) {
    console.log(`\n  Processing ${s.display_name} (${s.platform})...`);

    let avatar = s.fallback_image;
    let liveDesc = s.description;

    const profile = await fetchChzzkChannel(s.channelId);
    if (profile?.imageUrl) {
      avatar = profile.imageUrl;
    }

    // Insert streamerChannel
    const channelSql = `INSERT INTO streamerChannel (platform, channel_url, channel_name) SELECT '${s.platform}', '${s.channel_url}', '${s.channel_name.replace(/'/g, "''")}' WHERE NOT EXISTS (SELECT 1 FROM streamerChannel WHERE platform = '${s.platform}' AND channel_url = '${s.channel_url}');`;
    executeD1(channelSql);

    // Insert streamerChannel_info
    const safeAvatar = avatar.replace(/'/g, "''");
    const safeDesc = liveDesc.replace(/'/g, "''");
    const infoSql = `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code) SELECT sc.id, '${s.slug}', '${s.display_name}', '${safeAvatar}', '${safeDesc}', '${s.agency_name}', '${s.debut_date}', '${s.debut_time}', 'Asia/Seoul', '${s.start_at_utc}', '${s.country_code}' FROM streamerChannel sc WHERE sc.platform = '${s.platform}' AND sc.channel_url = '${s.channel_url}' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id OR sci.slug = '${s.slug}');`;
    const resInfo = executeD1(infoSql);
    if (resInfo.success) {
      console.log(`    ✅ Registered info: ${s.display_name} (Avatar: ${avatar ? 'Yes' : 'No'})`);
    } else {
      console.error(`    ❌ Failed info insert: ${s.display_name}`, resInfo.error);
    }
  }

  // STEP 3: 검증 쿼리
  console.log('\n🔍 [3/3] Verifying registered & updated streamers in D1...');
  const verifyList = queryD1Sql(`
    SELECT 
      i.id, i.display_name, i.agency_name, i.debut_date, i.debut_time, i.start_at_utc,
      c.platform, c.channel_url,
      CASE WHEN i.profile_image_url != '' THEN 'O' ELSE 'X' END as has_avatar
    FROM streamerChannel_info i
    JOIN streamerChannel c ON i.channel_id = c.id
    WHERE i.debut_date BETWEEN '2026-09-16' AND '2026-09-20'
    ORDER BY i.debut_date, i.debut_time;
  `);

  console.log('\n=== [D1 Active Database: 2026-09-16 ~ 2026-09-20 Streamers] ===');
  console.table(verifyList);

  console.log('\n🎉 Migration 0028 completed successfully!');
}

run().catch(console.error);
