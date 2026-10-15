/**
 * Discord Streamer Verification & Role Assignment Service
 * 치지직 & SOOP 스트리머 방송국 소개글 본인 인증 및 역할 자동 지급 엔진
 * 
 * Rules Adherence:
 * - Single Responsibility Principle (SRP): 세부 기능별 전용 함수 분리
 * - Brand Asset Compliance: 치지직/SOOP 공식 규격 준수
 */

const DISCORD_API_BASE = 'https://discord.com/api/v10';

// =====================================================================================
// 1. 인증 토큰 생성 및 방송국 ID 파싱 유틸리티 (단일 책임 원칙)
// =====================================================================================

/**
 * 6자리 인증 코드 생성 (예: VD-4829)
 */
export function generateVerificationCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VD-${randomPart}`;
}

/**
 * 방송국 URL에서 채널/방송국 고유 ID 추출
 */
export function extractChannelIdentifier(platform: string, rawUrl: string): { success: boolean; channelId?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { success: false, error: '올바른 방송국 URL을 입력해 주세요.' };
  }

  const cleanUrl = rawUrl.trim();

  if (platform.toUpperCase() === 'CHZZK') {
    // 치지직 URL 패턴: chzzk.naver.com/{32자리해시} 또는 chzzk.naver.com/live/{32자리해시}
    const match = cleanUrl.match(/chzzk\.naver\.com\/(?:live\/)?([a-f0-9]{32})/i);
    if (match && match[1]) {
      return { success: true, channelId: match[1] };
    }
    return { success: false, error: '치지직 방송국 주소 형식이 올바르지 않습니다. (예: https://chzzk.naver.com/32자리해시)' };
  }

  if (platform.toUpperCase() === 'SOOP') {
    // SOOP URL 패턴: ch.sooplive.co.kr/{아이디} 또는 sooplive.co.kr/station/{아이디}
    const match = cleanUrl.match(/(?:ch\.)?sooplive\.co\.kr\/(?:station\/)?([a-zA-Z0-9_]+)/i);
    if (match && match[1]) {
      return { success: true, channelId: match[1] };
    }
    return { success: false, error: 'SOOP 방송국 주소 형식이 올바르지 않습니다. (예: https://ch.sooplive.co.kr/아이디)' };
  }

  return { success: false, error: '지원하지 않는 플랫폼입니다. (CHZZK 또는 SOOP 선택)' };
}

// =====================================================================================
// 2. 외부 플랫폼 API 소개글 조회 엔진 (치지직 / SOOP)
// =====================================================================================

/**
 * 치지직 공식 공개 API로 채널 소개글(Description) 조회
 */
export async function fetchChzzkChannelBio(channelId: string): Promise<{ success: boolean; bio?: string; channelName?: string; error?: string }> {
  try {
    const res = await fetch(`https://api.chzzk.naver.com/service/v1/channels/${channelId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      return { success: false, error: '치지직 채널 정보를 불러올 수 없습니다.' };
    }

    const data: any = await res.json();
    if (data.code !== 200 || !data.content) {
      return { success: false, error: '치지직 채널을 찾을 수 없습니다.' };
    }

    const bio = data.content.channelDescription || '';
    const channelName = data.content.channelName || '치지직 스트리머';

    return { success: true, bio, channelName };
  } catch (err: any) {
    console.error('[Fetch Chzzk Bio Error]:', err);
    return { success: false, error: '치지직 서버 통신 중 오류가 발생했습니다.' };
  }
}

/**
 * SOOP 공식 공개 API로 방송국 소개글 조회
 */
export async function fetchSoopChannelBio(stationId: string): Promise<{ success: boolean; bio?: string; channelName?: string; error?: string }> {
  try {
    const res = await fetch(`https://ch.sooplive.co.kr/api/${stationId}/station`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      return { success: false, error: 'SOOP 방송국 정보를 불러올 수 없습니다.' };
    }

    const data: any = await res.json();
    const station = data?.station;
    if (!station) {
      return { success: false, error: 'SOOP 방송국 정보를 찾을 수 없습니다.' };
    }

    // 방송국 소개글, 상단 텍스트, 방송국명 병합 검사
    const bioParts = [
      station.broad_description || '',
      station.station_title || '',
      station.up_text || '',
      station.station_name || '',
    ];
    const bio = bioParts.join(' ');
    const channelName = station.station_name || stationId;

    return { success: true, bio, channelName };
  } catch (err: any) {
    console.error('[Fetch SOOP Bio Error]:', err);
    return { success: false, error: 'SOOP 서버 통신 중 오류가 발생했습니다.' };
  }
}

/**
 * 소개글 텍스트에 인증 코드가 들어있는지 검사
 */
export function checkBioContainsCode(bioText: string, code: string): boolean {
  if (!bioText || !code) return false;
  const cleanBio = bioText.replace(/\s+/g, '').toUpperCase();
  const cleanCode = code.replace(/\s+/g, '').toUpperCase();
  return cleanBio.includes(cleanCode);
}

// =====================================================================================
// 3. 디스코드 REST API 역할 관리 엔진 (Manage Roles)
// =====================================================================================

/**
 * 디스코드 서버의 전체 역할 목록 조회
 */
export async function getGuildRoles(guildId: string, botToken: string): Promise<any[]> {
  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('[Discord Get Roles Error]:', err);
    return [];
  }
}

/**
 * 역할 이름으로 Role ID 검색 (예: "chzzk 스트리머", "SOOP 시청자")
 */
export async function findRoleIdByName(guildId: string, roleName: string, botToken: string): Promise<string | null> {
  const roles = await getGuildRoles(guildId, botToken);
  const target = roles.find(
    (r) => r.name.toLowerCase().trim() === roleName.toLowerCase().trim()
  );
  return target ? target.id : null;
}

/**
 * 멤버에게 역할 추가
 */
export async function addRoleToMember(guildId: string, userId: string, roleId: string, botToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.error('[Discord Add Role Error]:', err);
    return false;
  }
}

/**
 * 멤버에게서 역할 제거
 */
export async function removeRoleFromMember(guildId: string, userId: string, roleId: string, botToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.error('[Discord Remove Role Error]:', err);
    return false;
  }
}

/**
 * 시청자 역할 즉시 토글 (있으면 제거, 없으면 지급)
 */
export async function toggleViewerRole(
  guildId: string,
  userId: string,
  currentMemberRoleIds: string[],
  targetRoleName: string,
  botToken: string
): Promise<{ success: boolean; added: boolean; message: string }> {
  const roleId = await findRoleIdByName(guildId, targetRoleName, botToken);
  if (!roleId) {
    return {
      success: false,
      added: false,
      message: `서버에 '${targetRoleName}' 역할이 존재하지 않습니다. 서버 관리자에게 문의해 주세요.`,
    };
  }

  const hasRole = currentMemberRoleIds.includes(roleId);

  if (hasRole) {
    const removed = await removeRoleFromMember(guildId, userId, roleId, botToken);
    if (removed) {
      return { success: true, added: false, message: `🗑️ **${targetRoleName}** 역할이 해제되었습니다.` };
    }
  } else {
    const added = await addRoleToMember(guildId, userId, roleId, botToken);
    if (added) {
      return { success: true, added: true, message: `🎉 **${targetRoleName}** 역할이 정상 지급되었습니다!` };
    }
  }

  return { success: false, added: false, message: '역할 업데이트에 실패했습니다. 봇의 역할 권한 서열을 확인해 주세요.' };
}

// =====================================================================================
// 4. D1 데이터베이스 인증 기록 관리 (중복 사칭 방지)
// =====================================================================================

export interface VerificationRecord {
  id?: number;
  guildId: string;
  discordUserId: string;
  discordUsername?: string;
  platform: string;
  channelId: string;
  channelName?: string;
  channelUrl: string;
  verificationCode: string;
}

/**
 * 스트리머 인증 신청 생성 (중복 방송국 등록 검사 포함)
 */
export async function createStreamerVerification(
  db: D1Database,
  record: VerificationRecord
): Promise<{ success: boolean; verificationId?: number; code?: string; error?: string }> {
  try {
    // 1. 이미 다른 사람이 인증 완료한 방송국인지 확인
    const existingVerified: any = await db.prepare(`
      SELECT discord_user_id FROM discord_streamer_verifications
      WHERE platform = ? AND channel_id = ? AND status = 'VERIFIED'
    `).bind(record.platform, record.channelId).first();

    if (existingVerified && existingVerified.discord_user_id !== record.discordUserId) {
      return {
        success: false,
        error: `이미 다른 디스코드 계정(<@${existingVerified.discord_user_id}>)에 의해 공식 인증된 방송국입니다. 사칭이 의심되는 경우 운영자에게 문의해 주세요.`,
      };
    }

    const code = generateVerificationCode();

    // 2. 기존 대기 레코드 갱신 또는 신규 등록
    const res: any = await db.prepare(`
      INSERT INTO discord_streamer_verifications (guild_id, discord_user_id, discord_username, platform, channel_id, channel_name, channel_url, verification_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
      ON CONFLICT(platform, channel_id) DO UPDATE SET
        guild_id = excluded.guild_id,
        discord_user_id = excluded.discord_user_id,
        discord_username = excluded.discord_username,
        channel_name = excluded.channel_name,
        channel_url = excluded.channel_url,
        verification_code = excluded.verification_code,
        status = 'PENDING',
        created_at = CURRENT_TIMESTAMP
      RETURNING id
    `).bind(
      record.guildId,
      record.discordUserId,
      record.discordUsername || 'Unknown',
      record.platform,
      record.channelId,
      record.channelName || record.channelId,
      record.channelUrl,
      code
    ).first();

    return {
      success: true,
      verificationId: res?.id,
      code,
    };
  } catch (err: any) {
    console.error('[Create Verification Error]:', err);
    return { success: false, error: err.message || '인증 정보 저장 실패' };
  }
}

/**
 * ID로 인증 레코드 조회
 */
export async function getVerificationRecord(db: D1Database, id: number): Promise<any | null> {
  try {
    return await db.prepare(`
      SELECT * FROM discord_streamer_verifications WHERE id = ?
    `).bind(id).first();
  } catch {
    return null;
  }
}

/**
 * 인증 성공 완료 처리
 */
export async function markVerificationComplete(db: D1Database, id: number): Promise<boolean> {
  try {
    await db.prepare(`
      UPDATE discord_streamer_verifications
      SET status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();
    return true;
  } catch (err) {
    console.error('[Mark Verification Error]:', err);
    return false;
  }
}
