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

const commands = [
  {
    name: '오늘데뷔',
    description: '오늘 첫 데뷔 방송을 진행하는 버추얼 스트리머 목록을 확인합니다.',
    type: 1, // CHAT_INPUT
  },
  {
    name: '이번주데뷔',
    description: '이번 주(월~일) 데뷔 예정인 버추얼 스트리머 주간 타임라인을 확인합니다.',
    type: 1,
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
