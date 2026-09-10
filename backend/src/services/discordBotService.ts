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
import {
  extractChannelIdentifier,
  fetchChzzkChannelBio,
  fetchSoopChannelBio,
  checkBioContainsCode,
  findRoleIdByName,
  addRoleToMember,
  toggleViewerRole,
  createStreamerVerification,
  getVerificationRecord,
  markVerificationComplete,
} from './discordVerificationService';

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
/**
 * 오늘 데뷔하는 버튜버 목록 Embed 카드 생성
 */
export function buildTodayDebutsEmbed(events: any[], targetPlatform: string = 'ALL'): any {
  const isPlatformFiltered = targetPlatform && targetPlatform.toUpperCase() !== 'ALL';
  const platformUpper = (targetPlatform || 'ALL').toUpperCase();
  const brandColor = isPlatformFiltered ? getPlatformBrandColor(platformUpper) : 0x2563EB;

  if (!events || events.length === 0) {
    const emptyTitle = isPlatformFiltered
      ? `✨ 오늘 예정된 [${platformUpper}] 버튜버 데뷔가 없습니다`
      : '✨ 오늘 예정된 버튜버 데뷔가 없습니다';
    const emptyDesc = isPlatformFiltered
      ? `오늘 데뷔 방송을 진행하는 ${platformUpper} 스트리머가 아직 없습니다.\n새로운 신입 버튜버 데뷔 소식이 있다면 \`/데뷔등록\`으로 제보해 주세요!`
      : '오늘 예정된 데뷔 방송이 아직 등록되지 않았습니다.\n새로운 신입 버튜버 데뷔 소식이 있다면 `/데뷔등록`으로 제보해 주세요!';

    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: emptyTitle,
            description: emptyDesc,
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

    let val = `⏰ **데뷔 일시**: ${timeStr}\n🔗 **방송국 바로가기**: [방송국 링크](${channelUrl})`;
    // 소속이 있을 때만 표시
    if (creator.agency && creator.agency.trim() && creator.agency.trim() !== '개인세') {
      val += `\n🏢 **소속**: ${creator.agency.trim()}`;
    }

    return {
      name: `🎉 ${creator.displayName || '신입 버튜버'} (${platform})`,
      value: val,
      inline: false,
    };
  });

  const cardTitle = isPlatformFiltered
    ? `🌟 오늘 데뷔하는 ${platformUpper} 신입 버튜버 (${events.length}명)`
    : `🌟 오늘 데뷔하는 신입 버튜버 (${events.length}명)`;

  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: cardTitle,
          description: `오늘 첫 방송을 시작하는 버추얼 스트리머들을 응원해 주세요!\n상세 정보 및 D-Day 위젯은 [V-DEBUT HUB](${VDEBUT_WEB_BASE})에서 확인하실 수 있습니다.`,
          color: brandColor,
          fields,
          footer: {
            text: `V-DEBUT HUB • ${platformUpper} 실시간 데뷔 알림`,
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
export function buildWeekDebutsEmbed(events: any[], targetPlatform: string = 'ALL'): any {
  const isPlatformFiltered = targetPlatform && targetPlatform.toUpperCase() !== 'ALL';
  const platformUpper = (targetPlatform || 'ALL').toUpperCase();
  const brandColor = isPlatformFiltered ? getPlatformBrandColor(platformUpper) : 0x3B82F6;

  if (!events || events.length === 0) {
    const emptyTitle = isPlatformFiltered
      ? `📅 이번 주 예정된 [${platformUpper}] 데뷔가 없습니다`
      : '📅 이번 주 예정된 데뷔가 없습니다';
    const emptyDesc = isPlatformFiltered
      ? `이번 주 예정된 ${platformUpper} 데뷔 일정이 비어있습니다.\n신규 일정을 \`/데뷔등록\`을 통해 제보해 보세요!`
      : '이번 주 예정된 데뷔 일정이 비어있습니다. 신규 일정을 `/데뷔등록`을 통해 등록해 보세요!';

    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: emptyTitle,
            description: emptyDesc,
            color: 0x64748B,
            footer: {
              text: 'V-DEBUT HUB • 주간 데뷔 리포트',
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
      name: `📌 ${creator.displayName} [${platform}]`,
      value: `⏱️ ${timeStr}\n👉 [방송국 주소](${channelUrl})`,
      inline: true,
    };
  });

  const cardTitle = isPlatformFiltered
    ? `📅 이번 주 ${platformUpper} 데뷔 타임라인 (${events.length}명)`
    : `📅 이번 주 데뷔 타임라인 (${events.length}명)`;

  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: cardTitle,
          description: `이번 주 데뷔 예정인 ${isPlatformFiltered ? platformUpper + ' ' : ''}버추얼 스트리머 목록입니다.`,
          color: brandColor,
          fields,
          footer: {
            text: `V-DEBUT HUB • ${platformUpper} 주간 데뷔 리포트`,
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
 * /온보딩패널 실행 시 채널에 출력되는 고정 온보딩 패널 카드
 */
export function buildOnboardingPanelMessage(): any {
  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: '🌟 V-DEBUT HUB 공식 커뮤니티 온보딩',
          description:
            'V-DEBUT HUB 서버에 오신 것을 환영합니다!\n' +
            '원활한 소통과 맞춤 알림을 위해 본인에게 맞는 역할을 아래 버튼을 눌러 수령해 주세요.\n\n' +
            '• **👀 시청자(팬)**: 아래 버튼을 누르면 관심 플랫폼 역할이 즉시 지급/해제됩니다.\n' +
            '• **🎙️ 스트리머(버튜버)**: 본인 인증 버튼을 눌러 방송국 소개글 코드로 100% 인증 후 정식 스트리머 역할을 수령하세요!',
          color: 0x2563EB,
          fields: [
            {
              name: '🏷️ 현재 발급 가능한 역할 목록',
              value:
                '• `chzzk 시청자` (네이버 치지직 팬)\n' +
                '• `SOOP 시청자` (숲/SOOP 팬)\n' +
                '• `chzzk 스트리머` (치지직 공식 방송국 인증 완료)\n' +
                '• `SOOP 스트리머` (SOOP 공식 방송국 인증 완료)',
              inline: false,
            },
          ],
          footer: {
            text: 'V-DEBUT HUB • 공식 커뮤니티 온보딩 시스템',
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`,
          },
        },
      ],
      components: [
        {
          type: 1, // Action Row 1: 시청자 역할 즉시 지급 버튼
          components: [
            {
              type: 2, // Button
              custom_id: 'btn_role_chzzk_viewer',
              style: 3, // Success (Green)
              label: '🎮 chzzk 시청자',
            },
            {
              type: 2,
              custom_id: 'btn_role_soop_viewer',
              style: 1, // Primary (Blue)
              label: '📺 SOOP 시청자',
            },
          ],
        },
        {
          type: 1, // Action Row 2: 스트리머 본인 인증 버튼
          components: [
            {
              type: 2,
              custom_id: 'btn_start_streamer_verify',
              style: 2, // Secondary
              label: '🎙️ 스트리머 본인 인증 받기 (치지직 / SOOP)',
            },
          ],
        },
      ],
    },
  };
}

/**
 * 스트리머 본인 인증 버튼 클릭 시 호출되는 모달 팝업
 */
export function buildStreamerVerifyModal(): any {
  return {
    type: CALLBACK_TYPE.MODAL,
    data: {
      custom_id: 'modal_streamer_verify',
      title: '스트리머 본인 방송국 인증',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'input_verify_platform',
              label: '방송 플랫폼 (CHZZK 또는 SOOP)',
              style: 1,
              min_length: 4,
              max_length: 10,
              placeholder: 'CHZZK 또는 SOOP 입력',
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'input_verify_url',
              label: '내 방송국 / 채널 URL 주소',
              style: 1,
              placeholder: 'https://chzzk.naver.com/... 또는 https://ch.sooplive.co.kr/...',
              required: true,
            },
          ],
        },
      ],
    },
  };
}

/**
 * 1회용 인증 코드 발급 카드 (본인에게만 보임 - Ephemeral)
 */
export function buildVerifyCodeCard(recordId: number, platform: string, code: string, channelName: string): any {
  const brandColor = getPlatformBrandColor(platform);

  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 64, // EPHEMERAL (본인에게만 보임)
      embeds: [
        {
          title: `🎙️ [${platform}] 스트리머 본인 확인 인증 코드 발급`,
          description:
            `**${channelName}** 채널의 실제 소유자인지 확인하기 위한 절차입니다.\n\n` +
            `1. **${platform} 방송국 설정** 페이지로 이동합니다.\n` +
            `2. **방송국 소개글(또는 상태 메시지)**에 아래 코드를 임시로 적고 저장합니다:\n\n` +
            `👉 발급된 인증 코드: **\` ${code} \`**\n\n` +
            `3. 저장이 완료되면 아래 **[✅ 소개글 수정 완료 후 인증하기]** 버튼을 눌러주세요!\n` +
            `*(인증이 완료된 직후 방송국 소개글의 코드는 바로 지우셔도 됩니다.)*`,
          color: brandColor,
          footer: {
            text: 'V-DEBUT HUB • 100% 사칭 방지 본인 인증',
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`,
          },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              custom_id: `btn_confirm_verify_${recordId}`,
              style: 3, // Success
              label: '✅ 소개글 수정 완료 후 인증하기',
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
 * 데뷔 일자 변경 Notice 데이터 페이로드
 */
export interface DebutDateChangePayload {
  displayName: string;
  avatarUrl?: string;
  platform: 'CHZZK' | 'SOOP' | 'YOUTUBE' | string;
  channelUrl?: string;
  agency?: string;
  oldDebutDateStr: string;
  newDebutDateStr: string;
  reason?: string;
}

/**
 * 데뷔 일자 변경(연기/조정) 시 전송할 맞춤형 공지 Notice Embed
 */
export function buildDebutDateChangeEmbed(data: DebutDateChangePayload): any {
  const platform = (data.platform || 'CHZZK').toUpperCase();
  const color = getPlatformBrandColor(platform);
  const isChzzk = platform === 'CHZZK';
  const isSoop = platform === 'SOOP';
  const channelUrl = data.channelUrl || VDEBUT_WEB_BASE;

  const platformTitle = isChzzk
    ? '🟢 [CHZZK 데뷔 일정 변경]'
    : isSoop
    ? '🔵 [SOOP 데뷔 일정 변경]'
    : '📢 [데뷔 일정 변경 안내]';

  const fields: any[] = [
    {
      name: '⏰ 이전 데뷔 일정',
      value: `~~${data.oldDebutDateStr}~~`,
      inline: true,
    },
    {
      name: '🚀 변경된 데뷔 일정',
      value: `**${data.newDebutDateStr}**`,
      inline: true,
    },
    {
      name: '📺 플랫폼',
      value: `**${platform}**`,
      inline: true,
    },
  ];

  // [사용자 규칙]: 소속이 유효하게 존재할 때만 표시 (개인세 및 빈 값 생략)
  if (data.agency && data.agency.trim() && data.agency.trim() !== '개인세') {
    fields.push({
      name: '🏢 소속',
      value: data.agency.trim(),
      inline: true,
    });
  }

  if (data.reason && data.reason.trim()) {
    fields.push({
      name: '📝 변경 사유 / 안내',
      value: data.reason.trim(),
      inline: false,
    });
  }

  return {
    embeds: [
      {
        title: `${platformTitle} ${data.displayName} 님의 데뷔 일정이 변경되었습니다!`,
        description: `${data.displayName} 버튜버의 데뷔 방송 일정이 조정되었습니다. 팬 여러분께서는 변경된 일정을 꼭 확인해 주세요!`,
        color,
        fields,
        thumbnail: data.avatarUrl ? { url: data.avatarUrl } : undefined,
        footer: {
          text: `V-DEBUT HUB • ${platform} 데뷔 일정 변경 Notice`,
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
            label: isChzzk ? '📺 치지직 방송국 바로가기' : isSoop ? '📺 SOOP 방송국 바로가기' : '📺 방송국 바로가기',
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

/**
 * 신규 데뷔 등록 시 구독 채널로 보낼 실시간 브로드캐스트 Embed
 */
export function buildBroadcastNewDebutEmbed(eventData: any): any {
  const creator = eventData.creator || {};
  const platform = (eventData.links?.[0]?.platform || 'CHZZK').toUpperCase();
  const channelUrl = eventData.links?.[0]?.url || VDEBUT_WEB_BASE;
  const color = getPlatformBrandColor(platform);
  const isChzzk = platform === 'CHZZK';
  const isSoop = platform === 'SOOP';

  const platformTitle = isChzzk
    ? '🟢 [CHZZK 신규 데뷔 등록]'
    : isSoop
    ? '🔵 [SOOP 신규 데뷔 등록]'
    : '📢 [신규 데뷔 소식]';

  const fields: any[] = [
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
  ];

  // [사용자 규칙]: 소속이 유효하게 존재할 때만 표시
  if (creator.agency && creator.agency.trim() && creator.agency.trim() !== '개인세') {
    fields.push({
      name: '🏢 소속',
      value: creator.agency.trim(),
      inline: true,
    });
  }

  return {
    embeds: [
      {
        title: `${platformTitle} ${creator.displayName} 님의 데뷔가 등록되었습니다!`,
        description: creator.description || `${creator.displayName} 버튜버의 데뷔 방송 일정이 등록되었습니다. 많은 관심과 응원 부탁드립니다!`,
        color,
        fields,
        thumbnail: creator.avatarUrl ? { url: creator.avatarUrl } : undefined,
        footer: {
          text: `V-DEBUT HUB • ${platform} 실시간 신규 등록 알림`,
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
            label: isChzzk ? '📺 치지직 방송국 바로가기' : isSoop ? '📺 SOOP 방송국 바로가기' : '📺 방송국 바로가기',
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
  guildName?: string,
  platform: string = 'ALL'
): Promise<{ success: boolean; message: string }> {
  try {
    const validPlatform = ['CHZZK', 'SOOP'].includes(platform.toUpperCase()) ? platform.toUpperCase() : 'ALL';

    await db.prepare(`
      INSERT INTO discord_subscribed_channels (guild_id, channel_id, guild_name, subscribed_platforms)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(channel_id) DO UPDATE SET
        guild_id = excluded.guild_id,
        guild_name = excluded.guild_name,
        subscribed_platforms = excluded.subscribed_platforms
    `).bind(guildId, channelId, guildName || 'Unknown Guild', validPlatform).run();

    const platformLabel = validPlatform === 'CHZZK'
      ? '🟢 치지직(CHZZK) 전용'
      : validPlatform === 'SOOP'
      ? '🔵 SOOP(숲) 전용'
      : '🌐 전체 플랫폼(치지직+SOOP+유튜브)';

    return {
      success: true,
      message: `✅ 이 채널(<#${channelId}>)이 V-DEBUT HUB의 **${platformLabel}** 데뷔 알림 채널로 설정되었습니다.\n앞으로 해당 커뮤니티의 데뷔 등록 및 일정 변경 Notice가 이곳으로 실시간 자동 발송됩니다!`,
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
 * 플랫폼별 알림 구독 채널 목록 조회
 */
export async function listSubscribedChannels(db: D1Database, targetPlatform?: string): Promise<any[]> {
  try {
    if (targetPlatform && targetPlatform.toUpperCase() !== 'ALL') {
      const { results } = await db.prepare(`
        SELECT guild_id, channel_id, guild_name, subscribed_platforms 
        FROM discord_subscribed_channels
        WHERE subscribed_platforms = 'ALL' OR UPPER(subscribed_platforms) = ?
      `).bind(targetPlatform.toUpperCase()).all();
      return results || [];
    }
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
 * 데뷔 일정 변경(연기/조정) 시 해당 플랫폼 구독 채널로 공지 Notice 실시간 브로드캐스트 발송
 */
export async function broadcastDebutDateChangeToDiscord(
  db: D1Database,
  botToken: string,
  changeData: DebutDateChangePayload
): Promise<number> {
  if (!botToken || !db) return 0;

  const targetPlatform = (changeData.platform || 'ALL').toUpperCase();
  const channels = await listSubscribedChannels(db, targetPlatform);
  if (channels.length === 0) return 0;

  const payload = buildDebutDateChangeEmbed(changeData);
  let successCount = 0;

  for (const row of channels) {
    const ok = await sendDiscordChannelMessage(botToken, row.channel_id, payload);
    if (ok) successCount++;
  }

  return successCount;
}

/**
 * 신규 데뷔 등록 시 해당 플랫폼 구독 채널로 실시간 브로드캐스트 발송
 */
export async function broadcastNewDebutToDiscord(
  db: D1Database,
  botToken: string,
  debutData: any
): Promise<number> {
  if (!botToken || !db) return 0;

  const targetPlatform = (debutData.links?.[0]?.platform || 'ALL').toUpperCase();
  const channels = await listSubscribedChannels(db, targetPlatform);
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
 * 오늘 데뷔 이벤트 필터링 유틸 (플랫폼 필터 지원)
 */
export async function getTodayDebuts(db: D1Database, targetPlatform: string = 'ALL'): Promise<any[]> {
  const allEvents = await fetchEventsFromD1(db);
  if (!allEvents) return [];

  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayStr = kstDate.toISOString().split('T')[0];

  const isPlatformFiltered = targetPlatform && targetPlatform.toUpperCase() !== 'ALL';
  const filterUpper = (targetPlatform || '').toUpperCase();

  return allEvents.filter((evt) => {
    if (!evt.startAtUtc) return false;
    const evtKst = new Date(new Date(evt.startAtUtc).getTime() + kstOffset);
    const isToday = evtKst.toISOString().split('T')[0] === todayStr;
    if (!isToday) return false;

    if (isPlatformFiltered) {
      const evtPlatform = (evt.links?.[0]?.platform || '').toUpperCase();
      return evtPlatform === filterUpper;
    }
    return true;
  });
}

/**
 * 이번 주 데뷔 이벤트 필터링 유틸 (플랫폼 필터 지원)
 */
export async function getWeekDebuts(db: D1Database, targetPlatform: string = 'ALL'): Promise<any[]> {
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

  const isPlatformFiltered = targetPlatform && targetPlatform.toUpperCase() !== 'ALL';
  const filterUpper = (targetPlatform || '').toUpperCase();

  return allEvents.filter((evt) => {
    if (!evt.startAtUtc) return false;
    const evtDate = new Date(new Date(evt.startAtUtc).getTime() + kstOffset);
    const isInWeek = evtDate >= monday && evtDate <= sunday;
    if (!isInWeek) return false;

    if (isPlatformFiltered) {
      const evtPlatform = (evt.links?.[0]?.platform || '').toUpperCase();
      return evtPlatform === filterUpper;
    }
    return true;
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

    // 공통 방송국 옵션 파싱 (기본값: ALL)
    const platformOption = body.data?.options?.find(
      (opt: any) => opt.name === '방송국' || opt.name === '플랫폼' || opt.name === 'platform'
    )?.value || 'ALL';

    // A. /오늘 또는 /오늘데뷔
    if (commandName === '오늘' || commandName === '오늘데뷔') {
      const todayDebuts = await getTodayDebuts(env.DB, platformOption);
      return buildTodayDebutsEmbed(todayDebuts, platformOption);
    }

    // B. /금주 또는 /이번주데뷔
    if (commandName === '금주' || commandName === '이번주데뷔') {
      const weekDebuts = await getWeekDebuts(env.DB, platformOption);
      return buildWeekDebutsEmbed(weekDebuts, platformOption);
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
      const platformOption = body.data?.options?.find(
        (opt: any) => opt.name === '플랫폼' || opt.name === 'platform'
      )?.value || 'ALL';

      if (!channelId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '❌ 채널 정보를 확인할 수 없습니다. 서버 채널에서 실행해 주세요.' },
        };
      }

      const result = await registerSubscribedChannel(env.DB, guildId, channelId, guildName, platformOption);
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: result.message },
      };
    }

    // E. /온보딩패널 (관리자용 온보딩 패널 카드 출력)
    if (commandName === '온보딩패널') {
      return buildOnboardingPanelMessage();
    }

    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `알 수 없는 명령어입니다: /${commandName}` },
    };
  }

  // 3. 버튼 클릭 상호작용 (Type 3: MESSAGE_COMPONENT)
  if (interactionType === INTERACTION_TYPE.MESSAGE_COMPONENT) {
    const customId = body.data?.custom_id || '';
    const guildId = body.guild_id;
    const userId = body.member?.user?.id;
    const memberRoles = body.member?.roles || [];

    if (!guildId || !userId) {
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 64, content: '❌ 서버 내에서만 사용 가능한 기능입니다.' },
      };
    }

    // 3-1. 시청자 역할 즉시 지급/해제 (chzzk 시청자)
    if (customId === 'btn_role_chzzk_viewer') {
      const res = await toggleViewerRole(guildId, userId, memberRoles, 'chzzk 시청자', env.DISCORD_BOT_TOKEN);
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 64, content: res.message },
      };
    }

    // 3-2. 시청자 역할 즉시 지급/해제 (SOOP 시청자)
    if (customId === 'btn_role_soop_viewer') {
      const res = await toggleViewerRole(guildId, userId, memberRoles, 'SOOP 시청자', env.DISCORD_BOT_TOKEN);
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 64, content: res.message },
      };
    }

    // 3-3. 스트리머 본인 인증 버튼 클릭 ➔ 모달 팝업 호출
    if (customId === 'btn_start_streamer_verify') {
      return buildStreamerVerifyModal();
    }

    // 3-4. 스트리머 소개글 코드 확인 버튼 클릭
    if (customId.startsWith('btn_confirm_verify_')) {
      const verifyId = parseInt(customId.replace('btn_confirm_verify_', ''), 10);
      if (isNaN(verifyId)) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: '❌ 유효하지 않은 인증 요청입니다.' },
        };
      }

      const record = await getVerificationRecord(env.DB, verifyId);
      if (!record) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: '❌ 인증 기록을 찾을 수 없습니다. 다시 인증을 신청해 주세요.' },
        };
      }

      if (record.discord_user_id !== userId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: '❌ 본인이 요청한 인증만 확인할 수 있습니다.' },
        };
      }

      if (record.status === 'VERIFIED') {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: '✅ 이미 인증이 완료된 방송국입니다!' },
        };
      }

      // 플랫폼별 실제 소개글 실시간 조회
      let bio = '';
      let errorMsg = '';

      if (record.platform === 'CHZZK') {
        const fetchRes = await fetchChzzkChannelBio(record.channel_id);
        if (fetchRes.success) bio = fetchRes.bio || '';
        else errorMsg = fetchRes.error || '치지직 채널 조회 실패';
      } else if (record.platform === 'SOOP') {
        const fetchRes = await fetchSoopChannelBio(record.channel_id);
        if (fetchRes.success) bio = fetchRes.bio || '';
        else errorMsg = fetchRes.error || 'SOOP 방송국 조회 실패';
      }

      if (!bio && errorMsg) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: `⚠️ ${errorMsg}\n방송국 주소가 올바른지 확인해 주세요.` },
        };
      }

      // 소개글에 발급된 인증 코드가 포함되어 있는지 대조
      const isMatched = checkBioContainsCode(bio, record.verification_code);

      if (!isMatched) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content:
              `❌ **인증 실패**: 방송국 소개글에서 코드 \`${record.verification_code}\`를 찾을 수 없습니다.\n\n` +
              `• **확인 방법**: ${record.platform} 방송국 설정 ➔ 소개글에 \`${record.verification_code}\`를 정확히 입력하고 저장했는지 다시 한번 확인해 주세요.\n` +
              `• 수정을 완료하신 후 아래 버튼을 다시 눌러주세요!`,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    custom_id: `btn_confirm_verify_${verifyId}`,
                    style: 3,
                    label: '🔄 소개글 저장 후 다시 확인하기',
                  },
                ],
              },
            ],
          },
        };
      }

      // 일치 확인! 역할 지급
      const targetRoleName = record.platform === 'CHZZK' ? 'chzzk 스트리머' : 'SOOP 스트리머';
      const roleId = await findRoleIdByName(guildId, targetRoleName, env.DISCORD_BOT_TOKEN);

      if (!roleId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `⚠️ 본인 확인은 성공하였으나, 디스코드 서버에 '${targetRoleName}' 역할이 없습니다. 관리자에게 문의해 주세요.`,
          },
        };
      }

      const roleGranted = await addRoleToMember(guildId, userId, roleId, env.DISCORD_BOT_TOKEN);
      if (!roleGranted) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `⚠️ 역할 지급 중 오류가 발생했습니다. VDebut 봇의 역할 서열이 '${targetRoleName}'보다 높은지 서버 관리자에게 확인을 요청해 주세요.`,
          },
        };
      }

      // DB 인증 완료 갱신
      await markVerificationComplete(env.DB, verifyId);

      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: 64,
          content:
            `🎉 **축하합니다! ${record.channel_name || record.channel_id} 방송국 본인 인증이 완료되었습니다!**\n\n` +
            `• **지급된 역할**: **\`@${targetRoleName}\`**\n` +
            `• 이제 방송국 소개글에서 임시 인증 코드(\`${record.verification_code}\`)는 **삭제하셔도 좋습니다.**\n` +
            `• V-DEBUT HUB 공식 커뮤니티의 스트리머 전용 혜택을 자유롭게 이용해 보세요!`,
        },
      };
    }
  }

  // 4. 모달 제출 (Type 5: MODAL_SUBMIT)
  if (interactionType === INTERACTION_TYPE.MODAL_SUBMIT) {
    const customId = body.data?.custom_id;

    // 4-1. 스트리머 본인 인증 모달 제출 처리
    if (customId === 'modal_streamer_verify') {
      const components = body.data?.components || [];
      const getField = (id: string) => {
        for (const row of components) {
          const comp = row.components?.find((c: any) => c.custom_id === id);
          if (comp) return comp.value?.trim() || '';
        }
        return '';
      };

      const rawPlatform = getField('input_verify_platform').toUpperCase();
      const rawUrl = getField('input_verify_url');
      const guildId = body.guild_id || 'DM';
      const userId = body.member?.user?.id;
      const username = body.member?.user?.username || 'Unknown';

      // 플랫폼 표준화
      let platform = 'CHZZK';
      if (rawPlatform.includes('SOOP') || rawPlatform.includes('숲') || rawPlatform.includes('아프리카')) {
        platform = 'SOOP';
      }

      // 방송국 ID 추출
      const parsed = extractChannelIdentifier(platform, rawUrl);
      if (!parsed.success || !parsed.channelId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `❌ ${parsed.error || '방송국 URL 형식이 올바르지 않습니다.'}`,
          },
        };
      }

      const channelId = parsed.channelId;

      // 방송국 실제 존재 여부 및 채널명 조회
      let channelName = channelId;
      if (platform === 'CHZZK') {
        const info = await fetchChzzkChannelBio(channelId);
        if (info.success && info.channelName) channelName = info.channelName;
      } else if (platform === 'SOOP') {
        const info = await fetchSoopChannelBio(channelId);
        if (info.success && info.channelName) channelName = info.channelName;
      }

      // D1 DB에 인증 요청 등록 및 1회용 코드 발급
      const verifyRes = await createStreamerVerification(env.DB, {
        guildId,
        discordUserId: userId,
        discordUsername: username,
        platform,
        channelId,
        channelName,
        channelUrl: rawUrl,
        verificationCode: '',
      });

      if (!verifyRes.success || !verifyRes.verificationId || !verifyRes.code) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `❌ ${verifyRes.error || '인증 코드 생성에 실패했습니다.'}`,
          },
        };
      }

      // 인증 코드 발급 카드 반환 (본인에게만 보임)
      return buildVerifyCodeCard(verifyRes.verificationId, platform, verifyRes.code, channelName);
    }

    // 4-2. 데뷔 일정 등록 폼 제출 처리
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
