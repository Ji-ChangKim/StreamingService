/**
 * 4대 방송 플랫폼 (CHZZK, SOOP, YouTube, Twitch) 외부 API 연동 서비스
 */

export interface PlatformProfileResult {
  success: boolean;
  platform: 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH';
  channelId: string;
  creatorName: string;
  profileImageUrl: string;
  channelUrl: string;
  verified: boolean;
  error?: string;
}

/**
 * URL 또는 아이디로부터 치지직 Channel ID 추출
 */
function extractChzzkChannelId(urlOrId: string): string {
  const clean = urlOrId.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    const parts = clean.split('/');
    const last = parts[parts.length - 1] || parts[parts.length - 2];
    return last.split('?')[0];
  }
  return clean;
}

/**
 * URL 또는 아이디로부터 SOOP User ID 추출
 */
function extractSoopUserId(urlOrId: string): string {
  const clean = urlOrId.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    const parts = clean.split('/');
    const last = parts[parts.length - 1] || parts[parts.length - 2];
    return last.split('?')[0];
  }
  return clean;
}

/**
 * 1. 치지직 (Chzzk) 외부 API 호출
 */
export async function fetchChzzkProfile(channelUrlOrId: string): Promise<PlatformProfileResult> {
  const channelId = extractChzzkChannelId(channelUrlOrId);
  const apiUrl = `https://api.chzzk.naver.com/service/v1/channels/${channelId}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        platform: 'CHZZK',
        channelId,
        creatorName: '',
        profileImageUrl: '',
        channelUrl: `https://chzzk.naver.com/${channelId}`,
        verified: false,
        error: `치지직 API 호출 실패 (${response.status})`
      };
    }

    const data: any = await response.json();
    if (data.code === 200 && data.content) {
      return {
        success: true,
        platform: 'CHZZK',
        channelId: data.content.channelId || channelId,
        creatorName: data.content.channelName || '치지직 스트리머',
        profileImageUrl: data.content.channelImageUrl || '',
        channelUrl: `https://chzzk.naver.com/${channelId}`,
        verified: data.content.verifiedMark || false
      };
    }

    return {
      success: false,
      platform: 'CHZZK',
      channelId,
      creatorName: '',
      profileImageUrl: '',
      channelUrl: `https://chzzk.naver.com/${channelId}`,
      verified: false,
      error: '채널 정보를 찾을 수 없습니다.'
    };
  } catch (err: any) {
    return {
      success: false,
      platform: 'CHZZK',
      channelId,
      creatorName: '',
      profileImageUrl: '',
      channelUrl: `https://chzzk.naver.com/${channelId}`,
      verified: false,
      error: err.message || '네트워크 오류가 발생했습니다.'
    };
  }
}

/**
 * 2. SOOP (구 아프리카TV) 외부 API 호출
 */
export async function fetchSoopProfile(userIdOrUrl: string): Promise<PlatformProfileResult> {
  const userId = extractSoopUserId(userIdOrUrl);
  const apiUrl = `https://bjapi.afreecatv.com/api/${userId}/station`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        platform: 'SOOP',
        channelId: userId,
        creatorName: '',
        profileImageUrl: '',
        channelUrl: `https://sooplive.co.kr/station/${userId}`,
        verified: false,
        error: `SOOP API 호출 실패 (${response.status})`
      };
    }

    const data: any = await response.json();
    if (data.station) {
      let profileImg = data.station.profile_image || '';
      if (profileImg.startsWith('//')) {
        profileImg = `https:${profileImg}`;
      }
      return {
        success: true,
        platform: 'SOOP',
        channelId: userId,
        creatorName: data.station.user_nick || userId,
        profileImageUrl: profileImg,
        channelUrl: `https://sooplive.co.kr/station/${userId}`,
        verified: true
      };
    }

    return {
      success: false,
      platform: 'SOOP',
      channelId: userId,
      creatorName: '',
      profileImageUrl: '',
      channelUrl: `https://sooplive.co.kr/station/${userId}`,
      verified: false,
      error: 'SOOP 방송국 정보를 찾을 수 없습니다.'
    };
  } catch (err: any) {
    return {
      success: false,
      platform: 'SOOP',
      channelId: userId,
      creatorName: '',
      profileImageUrl: '',
      channelUrl: `https://sooplive.co.kr/station/${userId}`,
      verified: false,
      error: err.message || '네트워크 오류'
    };
  }
}

/**
 * 플랫폼 프로필 통합 파서
 */
export async function fetchPlatformProfile(platform: string, inputUrl: string): Promise<PlatformProfileResult> {
  const upper = platform.toUpperCase();
  if (upper === 'CHZZK') {
    return await fetchChzzkProfile(inputUrl);
  } else if (upper === 'SOOP' || upper === 'AFREECA') {
    return await fetchSoopProfile(inputUrl);
  }

  return {
    success: true,
    platform: upper as any,
    channelId: inputUrl,
    creatorName: '신입 스트리머',
    profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    channelUrl: inputUrl,
    verified: false
  };
}
