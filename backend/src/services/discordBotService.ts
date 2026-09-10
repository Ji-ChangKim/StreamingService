/**
 * V-DEBUT HUB × Discord Bot Integration Core Service
 * Cloudflare Workers Serverless HTTP Interactions Engine (0-Cost Architecture)
 * 
 * Rules Adherence:
 * - Single Responsibility Principle (SRP): 각 기능(서명 검증, 커맨드 파싱, Embed 빌드, DB 쿼리, 브로드캐스트)을 단일 함수로 분리
 * - Brand Compliance: 치지직/SOOP/유튜브 공식 브랜드 색상 및 자산 무가공 원칙 준수
 */

import { fetchEventsFromD1, insertEventToD1 } from './eventDbService';
import { fetchPlatformProfile } from './platformApiService';

// Discord Interaction Types
export const INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

// Discord Callback Types
export const CALLBACK_TYPE = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  MODAL: 9,
} as const;

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const VDEBUT_WEB_BASE = 'https://vdebut.live';

// =====================================================================================
// 1. Ed25519 서명 검증 유틸리티 (Web Crypto API 기반 - 외부 라이브러리 미의존)
// =====================================================================================

/**
 * 16진수 문자열을 Uint8Array로 변환
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const len = cleanHex.length;
  const arr = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    arr[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return arr;
}

/**
 * Discord 웹훅 요청 서명 검증 (Ed25519)
 */
export async function verifyDiscordSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  publicKey: string
): Promise<boolean> {
  if (!signature || !timestamp || !publicKey) {
    return false;
  }

  try {
    const keyBytes = hexToUint8Array(publicKey);
    const sigBytes = hexToUint8Array(signature);
    const dataBytes = new TextEncoder().encode(timestamp + rawBody);

    // Cloudflare Workers는 표준 'Ed25519' 및 'NODE-ED25519' 둘 다 지원
    let cryptoKey: CryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'Ed25519' },
        false,
        ['verify']
      );
    } catch {
      cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' },
        false,
        ['verify']
      );
    }

    return await crypto.subtle.verify(
      cryptoKey.algorithm.name,
      cryptoKey,
      sigBytes,
      dataBytes
    );
  } catch (error) {
    console.error('[Discord Signature Verify Error]:', error);
    return false;
  }
}

// =====================================================================================
// 2. 브랜드 컬러 및 날짜 포맷 유틸리티 (규정 준수)
// =====================================================================================

/**
 * 플랫폼별 공식 브랜드 16진수 컬러 코드 (무가공 원칙)
 */
export function getPlatformBrandColor(platform: string): number {
  switch (platform?.toUpperCase()) {
    case 'CHZZK':
      return 0x00FFA3; // 치지직 네온 그린
    case 'SOOP':
      return 0x0078FF; // SOOP 공식 블루
    case 'YOUTUBE':
      return 0xFF0000; // YouTube 레드
    case 'TWITCH':
      return 0x9146FF; // 트위치 퍼플
    default:
      return 0x2563EB; // V-DEBUT 브랜드 블루
  }
}

/**
 * UTC ISO 문자열을 KST(한국 표준시) 포맷 문자열로 변환
 */
export function formatKstDateTime(utcDateStr?: string | null): string {
  if (!utcDateStr) return '일시 미정';
  const date = new Date(utcDateStr);
  if (isNaN(date.getTime())) return '일시 미정';

  // Asia/Seoul 시간대 기준 포맷팅
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

// =====================================================================================
// 3. Discord Embed 카드 빌더 (SRP 분리)
// =====================================================================================

/**
 * 오늘 데뷔하는 버튜버 목록 Embed 카드 생성
 */
export function buildTodayDebutsEmbed(events: any[]): any {
  if (!events || events.length === 0) {
    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '✨ 오늘 예정된 버튜버 데뷔가 없습니다',
            description: '오늘 예정된 데뷔 방송이 아직 등록되지 않았습니다.\n새로운 신입 버튜버 데뷔 소식이 있다면 `/데뷔등록`으로 제보해 주세요!',
            color: 0x64748B,
            footer: {
              text: 'V-DEBUT HUB • 버추얼 스트리머 데뷔 아카이브',
              icon_url: `${VDEBUT_WEB_BASE}/logo.png`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      },
    };
  }

  const fields = events.slice(0, 10).map((evt) => {
    const creator = evt.creator || {};
    const platform = evt.links?.[0]?.platform || 'CHZZK';
    const channelUrl = evt.links?.[0]?.url || VDEBUT_WEB_BASE;
    const timeStr = formatKstDateTime(evt.startAtUtc);

    return {
      name: `🎉 ${creator.displayName || '신입 버튜버'} (${platform})`,
      value: `⏰ **데뷔 일시**: ${timeStr}\n🔗 **방송국 바로가기**: [방송국 링크](${channelUrl})\n🏢 **소속**: ${creator.agency || '개인세'}`,
      inline: false,
    };
  });

  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: `🌟 오늘 데뷔하는 신입 버튜버 (${events.length}명)`,
          description: `오늘 첫 방송을 시작하는 버추얼 스트리머들을 응원해 주세요!\n상세 정보 및 D-Day 위젯은 [V-DEBUT HUB](${VDEBUT_WEB_BASE})에서 확인하실 수 있습니다.`,
          color: 0x2563EB,
          fields,
          footer: {
            text: 'V-DEBUT HUB • 실시간 데뷔 알림',
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // Link Button
              label: '🌐 V-DEBUT 캘린더 전체보기',
              url: VDEBUT_WEB_BASE,
            },
          ],
        },
      ],
    },
  };
}

/**
 * 이번 주 데뷔 타임라인 Embed 카드 생성
 */
export function buildWeekDebutsEmbed(events: any[]): any {
  if (!events || events.length === 0) {
    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '📅 이번 주 예정된 데뷔가 없습니다',
            description: '이번 주 예정된 데뷔 일정이 비어있습니다. 신규 일정을 `/데뷔등록`을 통해 등록해 보세요!',
            color: 0x64748B,
          },
        ],
      },
    };
  }

  const fields = events.slice(0, 10).map((evt) => {
    const creator = evt.creator || {};
    const platform = evt.links?.[0]?.platform || 'CHZZK';
    const channelUrl = evt.links?.[0]?.url || VDEBUT_WEB_BASE;
    const timeStr = formatKstDateTime(evt.startAtUtc);

    return {
      name: `📌 ${creator.displayName} [${platform}]`,
      value: `⏱️ ${timeStr}\n👉 [방송국 주소](${channelUrl})`,
      inline: true,
    };
  });

  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: `📅 이번 주 데뷔 타임라인 (${events.length}명)`,
          description: '이번 주 데뷔 예정인 버추얼 스트리머 목록입니다.',
          color: 0x3B82F6,
          fields,
          footer: {
            text: 'V-DEBUT HUB • 주간 데뷔 리포트',
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: '🌐 실시간 월간 캘린더 열기',
              url: VDEBUT_WEB_BASE,
            },
          ],
        },
      ],
    },
  };
}

/**
 * /데뷔등록 호출 시 Discord 모달 팝업 빌더
 */
export function buildDebutRegisterModal(): any {
  return {
    type: CALLBACK_TYPE.MODAL,
    data: {
      custom_id: 'modal_submit_debut',
      title: '신입 버튜버 데뷔 일정 제보',
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 4, // Text Input
              custom_id: 'input_platform',
              label: '방송 플랫폼 (CHZZK, SOOP, YOUTUBE)',
              style: 1, // Short
              min_length: 4,
              max_length: 10,
              placeholder: 'CHZZK 또는 SOOP 또는 YOUTUBE',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'input_channel_url',
              label: '방송국 / 채널 URL',
              style: 1,
              placeholder: 'https://chzzk.naver.com/... 또는 https://ch.sooplive.co.kr/...',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'input_debut_date',
              label: '데뷔 일시 (YYYY-MM-DD HH:mm, 24시간제)',
              style: 1,
              placeholder: '2026-09-15 20:00 (시간 미정 시 2026-09-15 00:00)',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'input_display_name',
              label: '스트리머 닉네임 (자동 수집 실패 시 사용)',
              style: 1,
              placeholder: '스트리머 활동명을 입력해 주세요',
              required: false,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'input_description',
              label: '한 줄 소개 / 데뷔 방송 안내',
              style: 2, // Paragraph
              placeholder: '데뷔 방송의 핵심 소개나 포부를 자유롭게 적어주세요',
              required: false,
            },
          ],
        },
      ],
    },
  };
}

/**
 * 데뷔 등록 성공 시 반환하는 카드
 */
export function buildDebutSuccessEmbed(eventData: any): any {
  const creator = eventData.creator || {};
  const platform = eventData.links?.[0]?.platform || 'CHZZK';
  const color = getPlatformBrandColor(platform);
  const eventId = eventData.id || 'new';
  const widgetUrl = `${VDEBUT_WEB_BASE}/widget/d-day/${eventId}`;

  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: `🎉 데뷔 일정이 성공적으로 등록되었습니다!`,
          description: `**${creator.displayName}** 님의 데뷔 방송 일정이 V-DEBUT HUB에 공식 등록되었습니다.\n웹 캘린더와 구독 디스코드 서버에 실시간 알림이 전파됩니다!`,
          color,
          fields: [
            {
              name: '⏰ 데뷔 일시 (KST)',
              value: formatKstDateTime(eventData.startAtUtc),
              inline: true,
            },
            {
              name: '📺 플랫폼',
              value: platform,
              inline: true,
            },
            {
              name: '🔗 방송 위젯 URL (OBS 브라우저 소스용)',
              value: `\`${widgetUrl}\`\n방송 화면에 실시간 D-Day 카운트다운을 띄울 수 있습니다.`,
              inline: false,
            },
          ],
          thumbnail: creator.avatarUrl ? { url: creator.avatarUrl } : undefined,
          footer: {
            text: 'V-DEBUT HUB • 버튜버 데뷔 허브',
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: '🌐 웹사이트에서 확인하기',
              url: VDEBUT_WEB_BASE,
            },
          ],
        },
      ],
    },
  };
}

/**
 * 신규 데뷔 등록 시 구독 채널로 보낼 실시간 브로드캐스트 Embed
 */
export function buildBroadcastNewDebutEmbed(eventData: any): any {
  const creator = eventData.creator || {};
  const platform = eventData.links?.[0]?.platform || 'CHZZK';
  const channelUrl = eventData.links?.[0]?.url || VDEBUT_WEB_BASE;
  const color = getPlatformBrandColor(platform);

  return {
    embeds: [
      {
        title: `📢 [신규 데뷔 소식] ${creator.displayName} 님의 데뷔가 등록되었습니다!`,
        description: creator.description || `${creator.displayName} 버튜버의 데뷔 방송 일정이 등록되었습니다. 많은 관심과 응원 부탁드립니다!`,
        color,
        fields: [
          {
            name: '⏰ 데뷔 일시 (KST)',
            value: formatKstDateTime(eventData.startAtUtc),
            inline: true,
          },
          {
            name: '📺 플랫폼',
            value: `**${platform}**`,
            inline: true,
          },
          {
            name: '🏢 소속',
            value: creator.agency || '개인세',
            inline: true,
          },
        ],
        thumbnail: creator.avatarUrl ? { url: creator.avatarUrl } : undefined,
        footer: {
          text: 'V-DEBUT HUB • 실시간 신규 등록 알림',
          icon_url: `${VDEBUT_WEB_BASE}/logo.png`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: '📺 방송국 바로가기',
            url: channelUrl,
          },
          {
            type: 2,
            style: 5,
            label: '📅 V-DEBUT 캘린더 보기',
            url: VDEBUT_WEB_BASE,
          },
        ],
      },
    ],
  };
}

// =====================================================================================
// 4. DB 구독 채널 관리 함수 (D1 데이터베이스 연동)
// =====================================================================================

/**
 * 알림 수신 채널 등록 (/알림채널설정)
 */
export async function registerSubscribedChannel(
  db: D1Database,
  guildId: string,
  channelId: string,
  guildName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await db.prepare(`
      INSERT INTO discord_subscribed_channels (guild_id, channel_id, guild_name, subscribed_platforms)
      VALUES (?, ?, ?, 'ALL')
      ON CONFLICT(channel_id) DO UPDATE SET
        guild_id = excluded.guild_id,
        guild_name = excluded.guild_name
    `).bind(guildId, channelId, guildName || 'Unknown Guild').run();

    return {
      success: true,
      message: `✅ 이 채널(<#${channelId}>)이 V-DEBUT HUB의 공식 데뷔 알림 수신 채널로 설정되었습니다.\n앞으로 신규 데뷔 등록 소식과 모닝 브리핑이 이곳으로 실시간 발송됩니다!`,
    };
  } catch (error: any) {
    console.error('[Discord DB Register Channel Error]:', error);
    return {
      success: false,
      message: `❌ 채널 등록 중 오류가 발생했습니다: ${error.message || 'DB 에러'}`,
    };
  }
}

/**
 * 알림 수신 채널 해제
 */
export async function unregisterSubscribedChannel(
  db: D1Database,
  channelId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await db.prepare(`
      DELETE FROM discord_subscribed_channels WHERE channel_id = ?
    `).bind(channelId).run();

    return {
      success: true,
      message: `알림 채널 등록이 해제되었습니다.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `해제 실패: ${error.message}`,
    };
  }
}

/**
 * 전체 알림 구독 채널 목록 조회
 */
export async function listSubscribedChannels(db: D1Database): Promise<any[]> {
  try {
    const { results } = await db.prepare(`
      SELECT guild_id, channel_id, guild_name, subscribed_platforms FROM discord_subscribed_channels
    `).all();
    return results || [];
  } catch (error) {
    console.error('[Discord List Channels Error]:', error);
    return [];
  }
}

// =====================================================================================
// 5. Discord REST API Outbound 발송 엔진 (브로드캐스트 & 모닝 브리핑)
// =====================================================================================

/**
 * 특정 디스코드 채널로 메시지/임베드 발송
 */
export async function sendDiscordChannelMessage(
  botToken: string,
  channelId: string,
  payload: any
): Promise<boolean> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Discord Send Message Failed: ${channelId}]:`, response.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Discord Send Message Error: ${channelId}]:`, err);
    return false;
  }
}

/**
 * 신규 데뷔 등록 시 모든 구독 채널로 실시간 브로드캐스트 발송
 */
export async function broadcastNewDebutToDiscord(
  db: D1Database,
  botToken: string,
  debutData: any
): Promise<number> {
  if (!botToken || !db) return 0;

  const channels = await listSubscribedChannels(db);
  if (channels.length === 0) return 0;

  const payload = buildBroadcastNewDebutEmbed(debutData);
  let successCount = 0;

  for (const row of channels) {
    const ok = await sendDiscordChannelMessage(botToken, row.channel_id, payload);
    if (ok) successCount++;
  }

  return successCount;
}

/**
 * 매일 오전 9시 모닝 데뷔 브리핑 자동 발송
 */
export async function broadcastMorningBriefingToDiscord(
  db: D1Database,
  botToken: string
): Promise<number> {
  if (!botToken || !db) return 0;

  const allEvents = await fetchEventsFromD1(db);
  if (!allEvents) return 0;

  // 오늘(KST 기준) 날짜 구하기
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayStr = kstDate.toISOString().split('T')[0];

  const todayEvents = allEvents.filter((evt) => {
    if (!evt.startAtUtc) return false;
    const evtKst = new Date(new Date(evt.startAtUtc).getTime() + kstOffset);
    return evtKst.toISOString().split('T')[0] === todayStr;
  });

  if (todayEvents.length === 0) return 0;

  const channels = await listSubscribedChannels(db);
  if (channels.length === 0) return 0;

  const payload = buildTodayDebutsEmbed(todayEvents);
  let successCount = 0;

  for (const row of channels) {
    const ok = await sendDiscordChannelMessage(botToken, row.channel_id, payload.data);
    if (ok) successCount++;
  }

  return successCount;
}

// =====================================================================================
// 6. Interaction 요청 메인 핸들러
// =====================================================================================

/**
 * 오늘 데뷔 이벤트 필터링 유틸
 */
export async function getTodayDebuts(db: D1Database): Promise<any[]> {
  const allEvents = await fetchEventsFromD1(db);
  if (!allEvents) return [];

  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayStr = kstDate.toISOString().split('T')[0];

  return allEvents.filter((evt) => {
    if (!evt.startAtUtc) return false;
    const evtKst = new Date(new Date(evt.startAtUtc).getTime() + kstOffset);
    return evtKst.toISOString().split('T')[0] === todayStr;
  });
}

/**
 * 이번 주 데뷔 이벤트 필터링 유틸
 */
export async function getWeekDebuts(db: D1Database): Promise<any[]> {
  const allEvents = await fetchEventsFromD1(db);
  if (!allEvents) return [];

  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const todayKst = new Date(now.getTime() + kstOffset);
  
  // 이번 주 월요일 ~ 일요일 범위 계산
  const dayOfWeek = todayKst.getUTCDay(); // 0: 일요일, 1: 월요일, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(todayKst);
  monday.setUTCDate(todayKst.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return allEvents.filter((evt) => {
    if (!evt.startAtUtc) return false;
    const evtDate = new Date(new Date(evt.startAtUtc).getTime() + kstOffset);
    return evtDate >= monday && evtDate <= sunday;
  });
}

/**
 * Discord Interactions 통합 디스패처
 */
export async function handleDiscordInteraction(body: any, env: any): Promise<any> {
  const interactionType = body.type;

  // 1. PING (Type 1) 핸드셰이크: PONG (Type 1) 반환
  if (interactionType === INTERACTION_TYPE.PING) {
    return { type: CALLBACK_TYPE.PONG };
  }

  // 2. 슬래시 커맨드 (Type 2)
  if (interactionType === INTERACTION_TYPE.APPLICATION_COMMAND) {
    const commandName = body.data?.name;

    // A. /오늘데뷔
    if (commandName === '오늘데뷔') {
      const todayDebuts = await getTodayDebuts(env.DB);
      return buildTodayDebutsEmbed(todayDebuts);
    }

    // B. /이번주데뷔
    if (commandName === '이번주데뷔') {
      const weekDebuts = await getWeekDebuts(env.DB);
      return buildWeekDebutsEmbed(weekDebuts);
    }

    // C. /데뷔등록 ➔ 모달 팝업 띄우기
    if (commandName === '데뷔등록') {
      return buildDebutRegisterModal();
    }

    // D. /알림채널설정
    if (commandName === '알림채널설정') {
      const guildId = body.guild_id || 'DM';
      const channelId = body.channel_id;
      const guildName = body.guild?.name || 'Discord Server';

      if (!channelId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '❌ 채널 정보를 확인할 수 없습니다. 서버 채널에서 실행해 주세요.' },
        };
      }

      const result = await registerSubscribedChannel(env.DB, guildId, channelId, guildName);
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: result.message },
      };
    }

    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `알 수 없는 명령어입니다: /${commandName}` },
    };
  }

  // 3. 모달 제출 (Type 5) - 데뷔 등록 폼 제출 처리
  if (interactionType === INTERACTION_TYPE.MODAL_SUBMIT) {
    const customId = body.data?.custom_id;

    if (customId === 'modal_submit_debut') {
      const components = body.data?.components || [];
      const getField = (id: string) => {
        for (const row of components) {
          const comp = row.components?.find((c: any) => c.custom_id === id);
          if (comp) return comp.value?.trim() || '';
        }
        return '';
      };

      const rawPlatform = getField('input_platform');
      const channelUrl = getField('input_channel_url');
      const debutDateStr = getField('input_debut_date');
      const customName = getField('input_display_name');
      const description = getField('input_description');

      // 플랫폼 표준화
      let platform = 'CHZZK';
      const upperPlat = rawPlatform.toUpperCase();
      if (upperPlat.includes('SOOP') || upperPlat.includes('숲') || upperPlat.includes('아프리카')) {
        platform = 'SOOP';
      } else if (upperPlat.includes('YOU') || upperPlat.includes('유튜브')) {
        platform = 'YOUTUBE';
      }

      // 프로필 자동 수집 시도
      let displayName = customName;
      let avatarUrl = '';
      let autoDesc = description;

      if (channelUrl) {
        try {
          const profile = await fetchPlatformProfile(platform, channelUrl);
          if (profile.success) {
            displayName = displayName || profile.creatorName;
            avatarUrl = profile.profileImageUrl || '';
            autoDesc = autoDesc || profile.description;
          }
        } catch (e) {
          console.error('[Discord Profile Crawl Error]:', e);
        }
      }

      displayName = displayName || '신입 버튜버';

      // 데뷔 일시 파싱 (KST ➔ UTC 변환)
      let startAtUtc: string;
      try {
        const parsedDate = new Date(`${debutDateStr.replace(' ', 'T')}:00+09:00`);
        if (!isNaN(parsedDate.getTime())) {
          startAtUtc = parsedDate.toISOString();
        } else {
          startAtUtc = new Date(Date.now() + 86400000 * 3).toISOString();
        }
      } catch {
        startAtUtc = new Date(Date.now() + 86400000 * 3).toISOString();
      }

      // DB 저장 (streamerChannel & streamerChannel_info 짝꿍 테이블)
      const eventPayload: any = {
        id: '',
        displayName,
        avatarUrl,
        platform,
        watchUrl: channelUrl,
        description: autoDesc,
        startAtUtc,
        originalTimezone: 'Asia/Seoul',
        creator: {
          displayName,
          avatarUrl,
          agency: '개인세',
          countryCode: 'KR',
        },
        links: [{ platform, url: channelUrl, isPrimary: true }],
      };

      const eventId = await insertEventToD1(env.DB, eventPayload);
      eventPayload.id = eventId;

      // 브로드캐스트 비동기 발송 (구독된 다른 서버들에 새 일정 공지)
      if (env.DISCORD_BOT_TOKEN) {
        broadcastNewDebutToDiscord(env.DB, env.DISCORD_BOT_TOKEN, eventPayload).catch((e) =>
          console.error('[Broadcast on submit error]:', e)
        );
      }

      return buildDebutSuccessEmbed(eventPayload);
    }
  }

  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: '지원하지 않는 요청입니다.' },
  };
}
