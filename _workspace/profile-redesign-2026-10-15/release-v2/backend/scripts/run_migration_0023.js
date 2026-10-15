const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

function executeD1(sql) {
  const oneLine = sql.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const escaped = oneLine.replace(/"/g, '""');
  const cmd = `npx wrangler d1 execute vdebut-db --remote --command="${escaped}"`;
  try {
    const stdout = execSync(cmd, {
      cwd: backendDir,
      encoding: 'utf8',
      shell: 'cmd.exe',
      maxBuffer: 10 * 1024 * 1024,
    });
    return { success: true, output: stdout };
  } catch (err) {
    return { success: false, error: err.stdout || err.message };
  }
}

const streamers = [
  // 9월 04일 (금)
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCW8Hb9gMstqPBFkuLZ-yxOw',
    channel_name: '蛇足乃わらじ',
    slug: 'dasokuno-waraji',
    display_name: '蛇足乃わらじ',
    debut_date: '2026-09-04',
    debut_time: '20:00',
    start_at_utc: '2026-09-04T11:00:00.000Z',
    country_code: 'JP',
    description: '蛇足乃わらじ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCL2sgsThTM9kWQZieKeAFFA',
    channel_name: '皆那之ひいろ',
    slug: 'minano-hiiro',
    display_name: '皆那之ひいろ',
    debut_date: '2026-09-04',
    debut_time: '22:00',
    start_at_utc: '2026-09-04T13:00:00.000Z',
    country_code: 'JP',
    description: '皆那之ひいろ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UC2Sj14Lm-k1vq5qukQovRig',
    channel_name: '牛羽しう',
    slug: 'ushiba-shiu',
    display_name: '牛羽しう',
    debut_date: '2026-09-04',
    debut_time: '22:00',
    start_at_utc: '2026-09-04T13:00:00.000Z',
    country_code: 'JP',
    description: '牛羽しう의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@兎丸流人',
    channel_name: '兎丸流人',
    slug: 'usamaru-ryuto',
    display_name: '兎丸流人',
    debut_date: '2026-09-04',
    debut_time: '22:00',
    start_at_utc: '2026-09-04T13:00:00.000Z',
    country_code: 'JP',
    description: '兎丸流人의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 05일 (토)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/3c24762b6c5d9824a0619353de3c759f',
    channel_name: '청 휘',
    slug: 'cheong-hwi',
    display_name: '청 휘',
    debut_date: '2026-09-05',
    debut_time: '17:00',
    start_at_utc: '2026-09-05T08:00:00.000Z',
    country_code: 'KR',
    description: '청 휘 버추얼 스트리머의 오리지널 정식 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCgGqn3ACz5mdaYsFfQkCGKQ',
    channel_name: 'もるん。',
    slug: 'morun',
    display_name: 'もるん。',
    debut_date: '2026-09-05',
    debut_time: '20:00',
    start_at_utc: '2026-09-05T11:00:00.000Z',
    country_code: 'JP',
    description: 'もるん。의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCFKZyJaUwKCunwqVgIVpHog',
    channel_name: '夜護シユウ',
    slug: 'yogomori-shiyuu',
    display_name: '夜護シユウ',
    debut_date: '2026-09-05',
    debut_time: '20:00',
    start_at_utc: '2026-09-05T11:00:00.000Z',
    country_code: 'JP',
    description: '夜護シユウ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/52479500ce35018d8e730c6feab1ca0f',
    channel_name: '에루 AERU',
    slug: 'aeru',
    display_name: '에루 AERU',
    debut_date: '2026-09-05',
    debut_time: '21:00',
    start_at_utc: '2026-09-05T12:00:00.000Z',
    country_code: 'KR',
    description: '에루 AERU 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCRiAISV9_WJlKUlYTmHn4SQ',
    channel_name: '一くぉ',
    slug: 'ninomae-kuo',
    display_name: '一くぉ',
    debut_date: '2026-09-05',
    debut_time: '21:00',
    start_at_utc: '2026-09-05T12:00:00.000Z',
    country_code: 'JP',
    description: '一くぉ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCnQx1rdKYv1o07_bUjDOcQg',
    channel_name: '反井',
    slug: 'sorii',
    display_name: '反井',
    debut_date: '2026-09-05',
    debut_time: '21:00',
    start_at_utc: '2026-09-05T12:00:00.000Z',
    country_code: 'JP',
    description: '反井의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 06일 (일)
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCKbtcOmJc0_m6Szm72WPq9A',
    channel_name: 'エルヴェ',
    slug: 'eruve',
    display_name: 'エルヴェ',
    debut_date: '2026-09-06',
    debut_time: '21:00',
    start_at_utc: '2026-09-06T12:00:00.000Z',
    country_code: 'JP',
    description: 'エルヴェ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 07일 (월)
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UC6gtJE_ZRXkagU4g_ewB2FQ',
    channel_name: '狗乃わん',
    slug: 'kuno-wan',
    display_name: '狗乃わん',
    debut_date: '2026-09-07',
    debut_time: '07:30',
    start_at_utc: '2026-09-06T22:30:00.000Z',
    country_code: 'JP',
    description: '狗乃わん의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/22sharii22',
    channel_name: '이샤리×',
    slug: '22sharii22',
    display_name: '이샤리×',
    debut_date: '2026-09-07',
    debut_time: '10:00',
    start_at_utc: '2026-09-07T01:00:00.000Z',
    country_code: 'KR',
    description: '이샤리× 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 09일 (수)
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/jeongmillyu',
    channel_name: '정밀류',
    slug: 'jeongmillyu',
    display_name: '정밀류',
    debut_date: '2026-09-09',
    debut_time: '12:00',
    start_at_utc: '2026-09-09T03:00:00.000Z',
    country_code: 'KR',
    description: '정밀류 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/viivvii',
    channel_name: '지다람',
    slug: 'viivvii',
    display_name: '지다람',
    debut_date: '2026-09-09',
    debut_time: '14:00',
    start_at_utc: '2026-09-09T05:00:00.000Z',
    country_code: 'KR',
    description: '지다람 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@Battlefly_0909',
    channel_name: '莊周 Zhou',
    slug: 'battlefly-0909',
    display_name: '莊周 Zhou',
    debut_date: '2026-09-09',
    debut_time: '22:00',
    start_at_utc: '2026-09-09T13:00:00.000Z',
    country_code: 'US',
    description: '莊周 Zhou의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 11일 (금)
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/kafu1234',
    channel_name: '카후.',
    slug: 'kafu1234',
    display_name: '카후.',
    debut_date: '2026-09-11',
    debut_time: '19:00',
    start_at_utc: '2026-09-11T10:00:00.000Z',
    country_code: 'KR',
    description: '카후. 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCsCIsvIuAAs1f4uWJcGwnRA',
    channel_name: '靛画そめる',
    slug: 'aiga-someru',
    display_name: '靛画そめる',
    debut_date: '2026-09-11',
    debut_time: '21:00',
    start_at_utc: '2026-09-11T12:00:00.000Z',
    country_code: 'JP',
    description: '靛画そめる의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 12일 (토)
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCkpur_ELo6jWiMh7wGHdmtw',
    channel_name: '愛世らびぃ',
    slug: 'manase-rabii',
    display_name: '愛世らびぃ',
    debut_date: '2026-09-12',
    debut_time: '20:00',
    start_at_utc: '2026-09-12T11:00:00.000Z',
    country_code: 'JP',
    description: '愛世らびぃ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCStddmApYaQkn0sqj9yxMoA',
    channel_name: '茶々森こまめ',
    slug: 'chachamori-komame',
    display_name: '茶々森こまめ',
    debut_date: '2026-09-12',
    debut_time: '20:00',
    start_at_utc: '2026-09-12T11:00:00.000Z',
    country_code: 'JP',
    description: '茶々森こまめ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 13일 (일)
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/bbiy0eo',
    channel_name: '비요!',
    slug: 'bbiy0eo',
    display_name: '비요!',
    debut_date: '2026-09-13',
    debut_time: '17:00',
    start_at_utc: '2026-09-13T08:00:00.000Z',
    country_code: 'KR',
    description: '비요! 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCa9175qUdA3u7petDHMYoXw',
    channel_name: '冥花',
    slug: 'meika',
    display_name: '冥花',
    debut_date: '2026-09-13',
    debut_time: '21:00',
    start_at_utc: '2026-09-13T12:00:00.000Z',
    country_code: 'JP',
    description: '冥花의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 14일 (월)
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/tirens2',
    channel_name: '티르엔',
    slug: 'tirens2',
    display_name: '티르엔',
    debut_date: '2026-09-14',
    debut_time: '17:00',
    start_at_utc: '2026-09-14T08:00:00.000Z',
    country_code: 'KR',
    description: '티르엔 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCCeSWM5OAb-ybWicrzHYJVQ',
    channel_name: '江口真好',
    slug: 'eguchi-maho',
    display_name: '江口真好',
    debut_date: '2026-09-14',
    debut_time: '20:00',
    start_at_utc: '2026-09-14T11:00:00.000Z',
    country_code: 'JP',
    description: '江口真好의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UC88QY3OaWloJ3ye-CWOObrQ',
    channel_name: '九生マクロ',
    slug: 'kokonoe-makuro',
    display_name: '九生マクロ',
    debut_date: '2026-09-14',
    debut_time: '20:00',
    start_at_utc: '2026-09-14T11:00:00.000Z',
    country_code: 'JP',
    description: '九生マクロ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 16일 (수)
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/arong0106',
    channel_name: '김깍마기',
    slug: 'arong0106',
    display_name: '김깍마기',
    debut_date: '2026-09-16',
    debut_time: '12:00',
    start_at_utc: '2026-09-16T03:00:00.000Z',
    country_code: 'KR',
    description: '김깍마기 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UC3f-97uZR79eYxafLYA_eDA',
    channel_name: '柵越ゼラツカ',
    slug: 'sakagoshi-zeratsuka',
    display_name: '柵越ゼラツカ',
    debut_date: '2026-09-16',
    debut_time: '20:00',
    start_at_utc: '2026-09-16T11:00:00.000Z',
    country_code: 'JP',
    description: '柵越ゼラツカ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 18일 (금)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/0af922bfdd9361547309041013670494',
    channel_name: '덕고미',
    slug: 'deokgomi',
    display_name: '덕고미',
    debut_date: '2026-09-18',
    debut_time: '20:00',
    start_at_utc: '2026-09-18T11:00:00.000Z',
    country_code: 'KR',
    description: '덕고미 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/glichko',
    channel_name: '글리치코',
    slug: 'glichko',
    display_name: '글리치코',
    debut_date: '2026-09-18',
    debut_time: '20:00',
    start_at_utc: '2026-09-18T11:00:00.000Z',
    country_code: 'KR',
    description: '글리치코 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 19일 (토)
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/channel/UCJdXMefwTJmAIPHdnlHhQ2w',
    channel_name: '奏咲ルリ',
    slug: 'kanadezaki-ruri',
    display_name: '奏咲ルリ',
    debut_date: '2026-09-19',
    debut_time: '16:00',
    start_at_utc: '2026-09-19T07:00:00.000Z',
    country_code: 'JP',
    description: '奏咲ルリ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/akdrhqld0530',
    channel_name: '류솔',
    slug: 'akdrhqld0530',
    display_name: '류솔',
    debut_date: '2026-09-19',
    debut_time: '21:00',
    start_at_utc: '2026-09-19T12:00:00.000Z',
    country_code: 'KR',
    description: '류솔 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 21일 (월)
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@lumicode000x',
    channel_name: '癒音ゆらむ',
    slug: 'lumicode000x',
    display_name: '癒音ゆらむ',
    debut_date: '2026-09-21',
    debut_time: '21:00',
    start_at_utc: '2026-09-21T12:00:00.000Z',
    country_code: 'JP',
    description: '癒音ゆらむ의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 26일 (토)
  {
    platform: 'YOUTUBE',
    channel_url: 'https://www.youtube.com/@manase_shuga',
    channel_name: '愛星しゅが',
    slug: 'manase-shuga',
    display_name: '愛星しゅが',
    debut_date: '2026-09-26',
    debut_time: '19:00',
    start_at_utc: '2026-09-26T10:00:00.000Z',
    country_code: 'JP',
    description: '愛星しゅが의 버추얼 스트리머 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },

  // 9월 28일 (월)
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/ziin05566',
    channel_name: '윤지아',
    slug: 'ziin05566',
    display_name: '윤지아',
    debut_date: '2026-09-28',
    debut_time: '15:00',
    start_at_utc: '2026-09-28T06:00:00.000Z',
    country_code: 'KR',
    description: '윤지아 버추얼 스트리머의 첫 데뷔 방송입니다.',
    agency_name: '개인세',
  },
];

async function run() {
  console.log(`🚀 Starting Migration 0023 execution for ${streamers.length} streamers...`);

  for (let i = 0; i < streamers.length; i++) {
    const s = streamers[i];
    console.log(`[${i + 1}/${streamers.length}] Processing ${s.display_name} (${s.platform})...`);

    // 1. Insert streamerChannel
    const channelSql = `INSERT INTO streamerChannel (platform, channel_url, channel_name) SELECT '${s.platform}', '${s.channel_url}', '${s.channel_name.replace(/'/g, "''")}' WHERE NOT EXISTS (SELECT 1 FROM streamerChannel WHERE platform = '${s.platform}' AND channel_url = '${s.channel_url}');`;
    const res1 = executeD1(channelSql);
    if (!res1.success) {
      console.error(`❌ Failed to insert channel for ${s.display_name}:`, res1.error);
      process.exit(1);
    }

    // 2. Insert streamerChannel_info
    const safeDesc = s.description.replace(/'/g, "''");
    const safeName = s.display_name.replace(/'/g, "''");
    const infoSql = `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code) SELECT sc.id, '${s.slug}', '${safeName}', '', '${safeDesc}', '${s.agency_name}', '${s.debut_date}', '${s.debut_time}', 'Asia/Seoul', '${s.start_at_utc}', '${s.country_code}' FROM streamerChannel sc WHERE sc.platform = '${s.platform}' AND sc.channel_url = '${s.channel_url}' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id OR sci.slug = '${s.slug}');`;
    const res2 = executeD1(infoSql);
    if (!res2.success) {
      console.error(`❌ Failed to insert info for ${s.display_name}:`, res2.error);
      process.exit(1);
    }

    console.log(`  ✅ Successfully registered.`);
  }

  // 3. Update 緋桜なこ
  console.log('\n🔄 Updating 緋桜なこ debut time (2026-09-01 -> 2026-09-04 21:00 KST)...');
  const updateSql = `UPDATE streamerChannel_info SET debut_date = '2026-09-04', debut_time = '21:00', start_at_utc = '2026-09-04T12:00:00.000Z', updated_at = CURRENT_TIMESTAMP WHERE display_name LIKE '%緋桜なこ%' OR slug = 'hizakura-nako';`;
  const res3 = executeD1(updateSql);
  if (!res3.success) {
    console.error('❌ Failed to update 緋桜なこ:', res3.error);
    process.exit(1);
  }
  console.log('✅ Successfully updated 緋桜なこ.');

  console.log('\n🎉 Migration 0023 completed successfully!');
}

run().catch(console.error);
