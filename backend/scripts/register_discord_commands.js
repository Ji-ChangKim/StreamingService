/**
 * Discord Slash Commands Global Registration Script
 * V-DEBUT HUB 봇의 슬래시 커맨드를 Discord 전역(Global)에 일괄 등록합니다.
 * 
 * Usage:
 *   node backend/scripts/register_discord_commands.js <APPLICATION_ID> <BOT_TOKEN>
 * 또는 환경 변수:
 *   DISCORD_APPLICATION_ID=xxx DISCORD_BOT_TOKEN=yyy node backend/scripts/register_discord_commands.js
 */

const https = require('https');

const appId = process.argv[2] || process.env.DISCORD_APPLICATION_ID;
const botToken = process.argv[3] || process.env.DISCORD_BOT_TOKEN;

if (!appId || !botToken) {
  console.error('❌ 에러: DISCORD_APPLICATION_ID 와 DISCORD_BOT_TOKEN 이 필요합니다.');
  console.log('👉 사용법: node register_discord_commands.js <APPLICATION_ID> <BOT_TOKEN>');
  process.exit(1);
}

const platformOption = {
  name: '방송국',
  description: '조회할 스트리밍 방송국(플랫폼)을 선택합니다. (기본값: 전체)',
  type: 3, // STRING
  required: false,
  choices: [
    { name: '🌐 전체 방송국 (ALL)', value: 'ALL' },
    { name: '🟢 치지직 (CHZZK)', value: 'CHZZK' },
    { name: '🔵 SOOP (숲)', value: 'SOOP' },
    { name: '🔴 유튜브 (YouTube)', value: 'YOUTUBE' },
    { name: '🟣 트위치 (Twitch)', value: 'TWITCH' },
  ],
};

const commands = [
  {
    name: '오늘',
    description: '오늘 첫 데뷔 방송을 진행하는 버추얼 스트리머 목록을 확인합니다.',
    type: 1, // CHAT_INPUT
    options: [platformOption],
  },
  {
    name: '금주',
    description: '이번 주(월~일) 데뷔 예정인 버추얼 스트리머 주간 일정을 확인합니다.',
    type: 1,
    options: [platformOption],
  },
  {
    name: '오늘데뷔',
    description: '오늘 첫 데뷔 방송을 진행하는 버추얼 스트리머 목록을 확인합니다.',
    type: 1,
    options: [platformOption],
  },
  {
    name: '이번주데뷔',
    description: '이번 주(월~일) 데뷔 예정인 버추얼 스트리머 주간 일정을 확인합니다.',
    type: 1,
    options: [platformOption],
  },
  {
    name: '데뷔등록',
    description: '신입 버튜버 데뷔 일정 및 방송국 링크를 V-DEBUT HUB에 제보/등록합니다.',
    type: 1,
  },
  {
    name: '알림채널설정',
    description: '현재 채널을 V-DEBUT HUB의 실시간 데뷔 공지 및 모닝 브리핑 수신 채널로 설정합니다.',
    type: 1,
    default_member_permissions: '32', // MANAGE_GUILD (서버 관리자 전용)
    options: [
      {
        name: '플랫폼',
        description: '수신할 스트리밍 플랫폼 알림을 선택합니다. (기본값: 전체)',
        type: 3, // STRING
        required: false,
        choices: [
          { name: '🌐 전체 플랫폼 (치지직 + SOOP + 유튜브)', value: 'ALL' },
          { name: '🟢 치지직 전용 (CHZZK)', value: 'CHZZK' },
          { name: '🔵 SOOP 전용 (숲)', value: 'SOOP' },
        ],
      },
    ],
  },
  {
    name: '온보딩패널',
    description: '현재 채널에 시청자 역할 받기 및 스트리머 본인 인증 온보딩 안내 패널을 생성합니다.',
    type: 1,
    default_member_permissions: '32', // MANAGE_GUILD (서버 관리자 전용)
  },
];

const data = JSON.stringify(commands);

const options = {
  hostname: 'discord.com',
  port: 443,
  path: `/api/v10/applications/${appId}/commands`,
  method: 'PUT',
  headers: {
    Authorization: `Bot ${botToken}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

console.log(`🚀 Discord API에 ${commands.length}개의 전역 커맨드 등록을 요청합니다...`);

const req = https.request(options, (res) => {
  let resBody = '';

  res.on('data', (chunk) => {
    resBody += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ 전역 슬래시 커맨드 등록 성공! (Status:', res.statusCode, ')');
      try {
        const parsed = JSON.parse(resBody);
        console.log(`등록된 커맨드 목록 (${parsed.length}개):`);
        parsed.forEach((cmd) => {
          console.log(`  - /${cmd.name}: ${cmd.description}`);
        });
      } catch {
        console.log(resBody);
      }
    } else {
      console.error('❌ 등록 실패 (Status:', res.statusCode, ')');
      console.error(resBody);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ 네트워크 요청 에러:', e);
  process.exit(1);
});

req.write(data);
req.end();
