const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');

const queries = [
  // 1. Channel insert
  `INSERT INTO streamerChannel (platform, channel_url, channel_name) SELECT 'YOUTUBE', 'https://www.youtube.com/@YakushijiMei', 'Mei Ch. 薬師寺メイ / ウラロジゲームカンパニー' WHERE NOT EXISTS (SELECT 1 FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@YakushijiMei');`,
  `INSERT INTO streamerChannel (platform, channel_url, channel_name) SELECT 'YOUTUBE', 'https://www.youtube.com/@EikokuNema', 'Nema Ch. 映刻ネマ / ウラロジゲームカンパニー' WHERE NOT EXISTS (SELECT 1 FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@EikokuNema');`,
  `INSERT INTO streamerChannel (platform, channel_url, channel_name) SELECT 'YOUTUBE', 'https://www.youtube.com/@UzukiAwai', 'Awai Ch. 卯月あわい / ウラロジゲームカンパニー' WHERE NOT EXISTS (SELECT 1 FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@UzukiAwai');`,
  `INSERT INTO streamerChannel (platform, channel_url, channel_name) SELECT 'YOUTUBE', 'https://www.youtube.com/@RokujoMikoto', 'Mikoto Ch. 六条ミコト / ウラロジゲームカンパニー' WHERE NOT EXISTS (SELECT 1 FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@RokujoMikoto');`,
  `INSERT INTO streamerChannel (platform, channel_url, channel_name) SELECT 'YOUTUBE', 'https://www.youtube.com/@TobaLila', 'Lila Ch. 計羽リーラ / ウラロジゲームカンパニー' WHERE NOT EXISTS (SELECT 1 FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@TobaLila');`,

  // 2. Channel name update
  `UPDATE streamerChannel SET channel_name = 'Awai Ch. 卯月あわい / ウラロジゲームカンパニー' WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@UzukiAwai';`,

  // 3. Info insert if not exists
  `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url) SELECT sc.id, 'yakushiji-mei', '薬師寺 メイ / Yakushiji Mei', 'https://yt3.googleusercontent.com/pGH8fspEC-N1cZK4JRcb6OMuUFbDJzEJ8whW-e61ijG3svmU-JU3fYYzxNTdtUnCNxwOhK1f=s900-c-k-c0x00ffffff-no-rj', '우라로지 게임 컴퍼니 1기생 화학·약학·생물학 연구 담당 薬師寺メイ(야쿠시지 메이)입니다.', 'Uralogic Game Company', '2026-08-19', '20:00', 'Asia/Seoul', '2026-08-19T11:00:00.000Z', 'JP', 'https://x.com/Yakushiji_Mei' FROM streamerChannel sc WHERE sc.platform = 'YOUTUBE' AND sc.channel_url = 'https://www.youtube.com/@YakushijiMei' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id);`,
  `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url) SELECT sc.id, 'eikoku-nema', '映刻 ネマ / Eikoku Nema', 'https://yt3.googleusercontent.com/chzeYXhkzakVn0blAYIsCEX9Y-DAv74dDlsm4lT2kHBW4RmOJgOJHTN0tJs7MN8HRj7vWXh4=s900-c-k-c0x00ffffff-no-rj', '우라로지 게임 컴퍼니 1기생 영상·영화 연구 담당 映刻ネマ(에이코쿠 네마)입니다.', 'Uralogic Game Company', '2026-08-19', '20:30', 'Asia/Seoul', '2026-08-19T11:30:00.000Z', 'JP', 'https://x.com/Eikoku_Nema' FROM streamerChannel sc WHERE sc.platform = 'YOUTUBE' AND sc.channel_url = 'https://www.youtube.com/@EikokuNema' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id);`,
  `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url) SELECT sc.id, 'uzuki-awai', '卯月 あわい / Uzuki Awai', 'https://yt3.googleusercontent.com/IqxzQL2FHEaRzFpmlPtIbpcYw71rH_XyWTkCYeZIcco8oYWtH341MXABpUGoWv8UbZOE56YsWw=s900-c-k-c0x00ffffff-no-rj', '우라로지 게임 컴퍼니 1기생 예술 연구·아카이브 담당 卯月あわい(우즈키 아와이)입니다.', 'Uralogic Game Company', '2026-08-19', '21:00', 'Asia/Seoul', '2026-08-19T12:00:00.000Z', 'JP', 'https://x.com/Uzuki_Awai' FROM streamerChannel sc WHERE sc.platform = 'YOUTUBE' AND sc.channel_url = 'https://www.youtube.com/@UzukiAwai' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id);`,
  `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url) SELECT sc.id, 'rokujo-mikoto', '六条 ミコト / Rokujo Mikoto', 'https://yt3.googleusercontent.com/_MO9s8YFP_LgCqnwq9_YhovPtoq8O6b1FGnWFWswJq3JJH43e7S6JhPb7BJMFsYI8zOjgbXMcA=s900-c-k-c0x00ffffff-no-rj', '우라로지 게임 컴퍼니 1기생 법무·법률 해석 담당 六条ミコト(로쿠조 미코토)입니다.', 'Uralogic Game Company', '2026-08-20', '20:00', 'Asia/Seoul', '2026-08-20T11:00:00.000Z', 'JP', 'https://x.com/Rokujo_Mikoto' FROM streamerChannel sc WHERE sc.platform = 'YOUTUBE' AND sc.channel_url = 'https://www.youtube.com/@RokujoMikoto' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id);`,
  `INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code, x_url) SELECT sc.id, 'toba-lila', '計羽 リーラ / Toba Lila', 'https://yt3.googleusercontent.com/BegIYn-A9brQoSt3Y8OnccLS0VP4E3JZREJ8Pt4FZARFOSKgCiH4J0XTQAnh86QBK1XD40zz=s900-c-k-c0x00ffffff-no-rj', '우라로지 게임 컴퍼니 1기생 CEO / 회계·경영 담당 計羽リーラ(토바 리라)입니다.', 'Uralogic Game Company', '2026-08-20', '20:30', 'Asia/Seoul', '2026-08-20T11:30:00.000Z', 'JP', 'https://x.com/Toba_Lila' FROM streamerChannel sc WHERE sc.platform = 'YOUTUBE' AND sc.channel_url = 'https://www.youtube.com/@TobaLila' AND NOT EXISTS (SELECT 1 FROM streamerChannel_info sci WHERE sci.channel_id = sc.id);`,

  // 4. Updates for all 5 streamers
  `UPDATE streamerChannel_info SET slug = 'yakushiji-mei', display_name = '薬師寺 メイ / Yakushiji Mei', agency_name = 'Uralogic Game Company', x_url = 'https://x.com/Yakushiji_Mei', country_code = 'JP', debut_date = '2026-08-19', debut_time = '20:00', timezone = 'Asia/Seoul', start_at_utc = '2026-08-19T11:00:00.000Z', updated_at = CURRENT_TIMESTAMP WHERE channel_id IN (SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@YakushijiMei');`,
  `UPDATE streamerChannel_info SET slug = 'eikoku-nema', display_name = '映刻 ネマ / Eikoku Nema', agency_name = 'Uralogic Game Company', x_url = 'https://x.com/Eikoku_Nema', country_code = 'JP', debut_date = '2026-08-19', debut_time = '20:30', timezone = 'Asia/Seoul', start_at_utc = '2026-08-19T11:30:00.000Z', updated_at = CURRENT_TIMESTAMP WHERE channel_id IN (SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@EikokuNema');`,
  `UPDATE streamerChannel_info SET slug = 'uzuki-awai', display_name = '卯月 あわい / Uzuki Awai', agency_name = 'Uralogic Game Company', x_url = 'https://x.com/Uzuki_Awai', country_code = 'JP', debut_date = '2026-08-19', debut_time = '21:00', timezone = 'Asia/Seoul', start_at_utc = '2026-08-19T12:00:00.000Z', updated_at = CURRENT_TIMESTAMP WHERE channel_id IN (SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@UzukiAwai');`,
  `UPDATE streamerChannel_info SET slug = 'rokujo-mikoto', display_name = '六条 ミコト / Rokujo Mikoto', agency_name = 'Uralogic Game Company', x_url = 'https://x.com/Rokujo_Mikoto', country_code = 'JP', debut_date = '2026-08-20', debut_time = '20:00', timezone = 'Asia/Seoul', start_at_utc = '2026-08-20T11:00:00.000Z', updated_at = CURRENT_TIMESTAMP WHERE channel_id IN (SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@RokujoMikoto');`,
  `UPDATE streamerChannel_info SET slug = 'toba-lila', display_name = '計羽 リーラ / Toba Lila', agency_name = 'Uralogic Game Company', x_url = 'https://x.com/Toba_Lila', country_code = 'JP', debut_date = '2026-08-20', debut_time = '20:30', timezone = 'Asia/Seoul', start_at_utc = '2026-08-20T11:30:00.000Z', updated_at = CURRENT_TIMESTAMP WHERE channel_id IN (SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/@TobaLila');`
];

console.log(`🚀 Executing ${queries.length} queries on remote D1 database (vdebut-db)...`);

for (let i = 0; i < queries.length; i++) {
  const q = queries[i];
  console.log(`\n[${i + 1}/${queries.length}] Executing: ${q.substring(0, 80)}...`);

  const res = spawnSync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', 'execute', 'vdebut-db', '--remote', `--command=${q}`, '--json'], {
    cwd: backendDir,
    encoding: 'utf-8'
  });

  if (res.status !== 0) {
    console.error(`❌ Query ${i + 1} failed with status ${res.status}`);
    console.error('stderr:', res.stderr);
    console.error('stdout:', res.stdout);
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(res.stdout);
    console.log(`✅ Success: ${JSON.stringify(parsed[0]?.meta?.changes ?? 0)} changes, duration: ${parsed[0]?.meta?.duration ?? 0}ms`);
  } catch {
    console.log('✅ Success (non-json output received)');
  }
}

console.log('\n🎉 All 0018 queries executed successfully on D1 database!');
