const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

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

const streamers = [
  // 9월 23일 (수)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/203f705aba9ad477d971b53bbe13a870',
    channel_name: '송이',
    slug: 'song-yi',
    display_name: '송이',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjA4MjhfMjM2/MDAxNzg3ODk5ODQ1NDY2.cu5hM4oMYSWTiltwzblZb-m_zhRWpCBNJ9lTWSyz6Usg.sQlJiY5YxMUtIoc21gxN4hvnddaOvioshQ1zpSR7fPUg.JPEG/image.jpg',
    description: '송이 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-09-23',
    debut_time: '21:00',
    start_at_utc: '2026-09-23T12:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/toutoisongee_v',
  },

  // 9월 26일 (토)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/c9e23f9b2d858601ac5f20f46634cce2',
    channel_name: '조하구',
    slug: 'johagu',
    display_name: '조하구',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjAzMTFfNTIg/MDAxNzczMjE1NjQ2NDY4.Drclfo1yOhTRZAMsvNTDvxUHmrTM5yFT3eyjO9vwItwg.fLkkmDAHGCKtb7WtjeVHnchbHTGM2k1iPWIXWkdgOAog.PNG/image.png',
    description: '조하구 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-09-26',
    debut_time: '13:00',
    start_at_utc: '2026-09-26T04:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/johagu0506',
  },
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/6e9f55cabb8573e10641aca59badd091',
    channel_name: '아므 AMU',
    slug: 'amu-amu',
    display_name: '아므 AMU',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjA4MThfNzkg/MDAxNzg3MDE0MzgwNzk3.0C8gR281zdL_LIPMisn8J9GAds1BpWXinbu_Pe9YqiEg.1qZjUCiatkCzQ3OmMxLWbfVrTFQ0fvunWAL50C_3e9Ig.PNG/image.png',
    description: '아므 AMU 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-09-26',
    debut_time: '19:00',
    start_at_utc: '2026-09-26T10:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/amuletXpiece',
  },

  // 9월 30일 (수)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/ada13132b498d64659d649883cb46758',
    channel_name: '코모리 레이',
    slug: 'komori-rei',
    display_name: '코모리 레이',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjA5MDhfMjU4/MDAxNzg4ODQ5ODg2NjQz.T6WmQUJhg-JAQROisocuj1O-5dM03v1JWQXpsG7qBNog.I6oPDBHHpZU9-v8QYOB1JMYVXj8tFdtD-lN2DoatG5gg.PNG/image.png',
    description: '[시간 미정] 코모리 레이 버추얼 스트리머의 공식 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-09-30',
    debut_time: '00:00',
    start_at_utc: '2026-09-29T15:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/Batbats00',
  },
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/48591b9c96fa5a72f8423ee2a7bb69b2',
    channel_name: '설도담',
    slug: 'seol-dodam',
    display_name: '설도담',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjAyMTRfMTc4/MDAxNzcwOTk4ODAxNTMw.Il2vtX3N_NSW4HJfGcw7Mw01uyfQ8s1I5O8hJqslUoEg.QihyEljd0uS0ZCDu7N7oOdBppNAPHmBHir8Z_WmB5I4g.JPEG/image.jpg',
    description: '설도담 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-09-30',
    debut_time: '21:00',
    start_at_utc: '2026-09-30T12:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/Seol_dodam93',
  },

  // 10월 01일 (목)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/674f82169df928bfd9246d134ea4d9ed',
    channel_name: '유지해',
    slug: 'yujihae',
    display_name: '유지해',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjA5MTFfMTQ1/MDAxNzg5MTI4OTAzNjA0.pjJ9PtGNqNL7XC80nH2AwJqMjEN-2R2LPYx1rjvbldYg.w44Oqm81WCQLgjH8S2AjcfcKLvwageotEO8iepqWs5wg.PNG/image.png',
    description: '유지해 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-10-01',
    debut_time: '20:00',
    start_at_utc: '2026-10-01T11:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/Yo0_Jihae',
  },
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/abb3b9b073a6299fcaa068b110d17b7b',
    channel_name: '아마노미야 미유키',
    slug: 'amanomiya-miyuki',
    display_name: '아마노미야 미유키',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjA4MzBfMTA4/MDAxNzg4MDcwNTk3MjUx.-HJV111D9tqg3TAQCOuHj2o1xwSIHad-Dq_nSFr3HBMg.4TpMONWNG9xIVAmGExRo0y1q0QwfJsTLNxft5z6jEDQg.PNG/image.png',
    description: '아마노미야 미유키 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-10-01',
    debut_time: '21:00',
    start_at_utc: '2026-10-01T12:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/AmanomiyaMiyuki',
  },

  // 10월 02일 (금)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/b8f48bc302e72412c9278abeadd5892c',
    channel_name: '서라별',
    slug: 'seorabyeol',
    display_name: '서라별',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjA5MTRfNzEg/MDAxNzg5MzI2NjQwOTUz.suPnP-HxvPiJ29_nKl4Y5mBkrk2caDppRiUiZW1JonYg.uC6bZt6-fjo1yhJM-Fltuishgtfowqjqzbstl2md_1Yg.PNG/image.png',
    description: '서라별 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-10-02',
    debut_time: '19:00',
    start_at_utc: '2026-10-02T10:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/Rabyul_Seo',
  },
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/0fd395a1ee4dc720b6050fd152a44e92',
    channel_name: '해몽실',
    slug: 'haemongsil',
    display_name: '해몽실',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjA3MThfMTY4/MDAxNzg0MzAyNTk5MDkz.997pZfv9P3AEFh7wNU4ZSY1jB_Fw7lj4ltLbCichTTEg.10BFNlStDyVjMrw5_khldodJth3nSBqJ3qGMVkayeoIg.PNG/image.png',
    description: '해몽실 버추얼 스트리머의 공식 첫 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-10-02',
    debut_time: '20:00',
    start_at_utc: '2026-10-02T11:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/monsil_Hae',
  },

  // 10월 03일 (토)
  {
    platform: 'CHZZK',
    channel_url: 'https://chzzk.naver.com/991bdaa4d7beecac608b83d6fd986989',
    channel_name: '동그리아',
    slug: 'dongria',
    display_name: '동그리아',
    profile_image_url: 'https://nng-phinf.pstatic.net/MjAyNjA5MDRfMTE5/MDAxNzg4NTAwMTQxNDI1.YLipDEx4xRrIqb2WpeyiKnSuBIeL1WgUcuYN5oJwghUg.Oi5WGUXSpRY1rkEAfVF_czs1CjQWJYtc3pIK66qu9_Ag.PNG/image.png',
    description: '[시간 미정] 동그리아 버추얼 스트리머의 공식 데뷔 방송입니다.',
    agency_name: '개인세',
    debut_date: '2026-10-03',
    debut_time: '00:00',
    start_at_utc: '2026-10-02T15:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/dongria_',
  },
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/taeyang0v0',
    channel_name: '양태양',
    slug: 'yangtaeyang',
    display_name: '양태양',
    profile_image_url: 'https://profile.img.sooplive.co.kr/LOGO/ta/taeyang0v0/taeyang0v0.jpg',
    description: '프네아 소속 양태양 버추얼 스트리머의 공식 SOOP 데뷔 방송입니다.',
    agency_name: '프네아',
    debut_date: '2026-10-03',
    debut_time: '13:00',
    start_at_utc: '2026-10-03T04:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/Fnea_Taeyang',
  },

  // 10월 04일 (일)
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/doosiki0505',
    channel_name: '강두식',
    slug: 'gangdoosik',
    display_name: '강두식',
    profile_image_url: 'https://profile.img.sooplive.co.kr/LOGO/do/doosiki0505/doosiki0505.jpg',
    description: '프네아 소속 강두식 버추얼 스트리머의 공식 SOOP 데뷔 방송입니다.',
    agency_name: '프네아',
    debut_date: '2026-10-04',
    debut_time: '12:00',
    start_at_utc: '2026-10-04T03:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/Fnea_doosiki',
  },
  {
    platform: 'SOOP',
    channel_url: 'https://www.sooplive.com/station/haeunbi',
    channel_name: '하은비',
    slug: 'haeunbi',
    display_name: '하은비',
    profile_image_url: 'https://profile.img.sooplive.co.kr/LOGO/ha/haeunbi/haeunbi.jpg',
    description: '프네아 소속 하은비 버추얼 스트리머의 공식 SOOP 데뷔 방송입니다.',
    agency_name: '프네아',
    debut_date: '2026-10-04',
    debut_time: '16:00',
    start_at_utc: '2026-10-04T07:00:00.000Z',
    country_code: 'KR',
    x_url: 'https://x.com/Fnea_eunbi',
  },
];

async function run() {
  console.log(`🚀 Starting Migration 0031 execution for ${streamers.length} streamers...`);

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
    const infoSql = `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url) SELECT sc.id, '${s.slug}', '${safeName}', '${s.profile_image_url}', '${safeDesc}', '${s.agency_name}', '${s.debut_date}', '${s.debut_time}', 'Asia/Seoul', '${s.start_at_utc}', '${s.country_code}', '${s.x_url}' FROM streamerChannel sc WHERE sc.platform = '${s.platform}' AND sc.channel_url = '${s.channel_url}' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id OR sci.slug = '${s.slug}');`;
    const res2 = executeD1(infoSql);
    if (!res2.success) {
      console.error(`❌ Failed to insert info for ${s.display_name}:`, res2.error);
      process.exit(1);
    }

    console.log(`  ✅ Successfully registered: ${s.display_name}`);
  }

  console.log('\n🔍 Verifying registered records from remote D1...');
  const verifySql = `SELECT c.platform, i.display_name, i.debut_date, i.debut_time, i.agency_name, i.slug, i.x_url FROM streamerChannel c JOIN streamerChannel_info i ON c.id = i.channel_id WHERE i.slug IN (${streamers.map(s => `'${s.slug}'`).join(',')}) ORDER BY i.debut_date, i.debut_time;`;
  const records = queryD1Sql(verifySql);
  console.log(`Verified ${records.length} of ${streamers.length} streamers in remote DB:`);
  console.table(records);

  console.log('\n🎉 Migration 0031 completed successfully!');
}

run().catch(console.error);
