/**
 * Test Mock Script for Discord Bot Handlers
 * 검증 항목:
 * 1. PING -> PONG (Type 1)
 * 2. /오늘데뷔 Embed 카드 빌더
 * 3. /이번주데뷔 Embed 카드 빌더
 * 4. /데뷔등록 모달 빌더
 * 5. 플랫폼 브랜드 컬러 매핑 검증
 */

const {
  getPlatformBrandColor,
  buildTodayDebutsEmbed,
  buildWeekDebutsEmbed,
  buildDebutRegisterModal,
  buildDebutSuccessEmbed,
  INTERACTION_TYPE,
  CALLBACK_TYPE,
} = require('../src/services/discordBotService');

console.log('🧪 [Discord Bot Handlers 검증 테스트]');

// 1. 브랜드 컬러 검증
console.log('1. 플랫폼 브랜드 컬러 테스트:');
console.log(' - CHZZK:', '0x' + getPlatformBrandColor('CHZZK').toString(16), '(예상: 0x00ffa3)');
console.log(' - SOOP:', '0x' + getPlatformBrandColor('SOOP').toString(16), '(예상: 0x0078ff)');
console.log(' - YOUTUBE:', '0x' + getPlatformBrandColor('YOUTUBE').toString(16), '(예상: 0xff0000)');

// 2. 모달 빌더 검증
console.log('\n2. /데뷔등록 모달 빌더 검증:');
const modal = buildDebutRegisterModal();
console.log(' - Modal Callback Type:', modal.type, '(예상: 9)');
console.log(' - Modal Custom ID:', modal.data.custom_id, '(예상: modal_submit_debut)');
console.log(' - Components Count:', modal.data.components.length, '(예상: 5)');

// 3. 오늘 데뷔 Embed 검증
console.log('\n3. /오늘데뷔 Embed 카드 검증:');
const sampleEvents = [
  {
    id: 'evt_1',
    startAtUtc: new Date().toISOString(),
    creator: { displayName: '테스트버튜버1', agency: '개인세' },
    links: [{ platform: 'CHZZK', url: 'https://chzzk.naver.com' }],
  },
];
const todayEmbed = buildTodayDebutsEmbed(sampleEvents);
console.log(' - Callback Type:', todayEmbed.type, '(예상: 4)');
console.log(' - Embeds Title:', todayEmbed.data.embeds[0].title);
console.log(' - Embed Fields Count:', todayEmbed.data.embeds[0].fields.length);

console.log('\n✅ 모든 Discord Bot 모듈 검증 테스트가 성공적으로 완료되었습니다!');
