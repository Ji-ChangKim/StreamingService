/**
 * 4대 방송 플랫폼 (CHZZK, SOOP, YouTube, Twitch) 외부 API 연동 서비스
 * (Cloudflare Workers 금지 헤더 User-Agent 제거 버전)
 */

export interface PlatformProfileResult {
  success: boolean;
  platform: 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH';
  channelId: string;
  creatorName: string;
  profileImageUrl: string;
  channelUrl: string;
  description?: string;
  verified: boolean;
  error?: string;
}

/**
 * 1. 치지직 (Chzzk) 외부 API 호출 (비디오 URL / 채널 URL / 라이브 URL 통합 처리)
 */
export async function fetchChzzkProfile(channelUrlOrId: string): Promise<PlatformProfileResult> {
  const clean = channelUrlOrId.trim();

  try {
    // Case A: 치지직 비디오 URL (e.g. https://chzzk.naver.com/video/14105462)
    if (clean.includes('/video/')) {
      const parts = clean.split('/video/');
      const videoId = parts[1]?.split('?')[0]?.split('/')[0];
      if (videoId) {
        const videoApiUrl = `https://api.chzzk.naver.com/service/v1/videos/${videoId}`;
        const vRes = await fetch(videoApiUrl, {
          headers: { 'Accept': 'application/json' }
        });
        if (vRes.ok) {
          const vData: any = await vRes.json();
          if (vData.code === 200 && vData.content?.channel) {
            const ch = vData.content.channel;
            return {
              success: true,
              platform: 'CHZZK',
              channelId: ch.channelId,
              creatorName: ch.channelName || '치지직 스트리머',
              profileImageUrl: ch.channelImageUrl || '',
              channelUrl: `https://chzzk.naver.com/${ch.channelId}`,
              description: ch.channelDescription || `${ch.channelName || '버튜버'}의 공식 방송국입니다.`,
              verified: ch.verifiedMark || false
            };
          }
        }
      }
    }

    // Case B: 일반 채널 URL / 라이브 URL / 채널 ID (e.g. https://chzzk.naver.com/live/channelId 또는 channelId)
    let channelId = clean;
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const urlObj = new URL(clean);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(Boolean);
      channelId = segments[segments.length - 1] || '';
      if (segments[0] === 'live' && segments[1]) {
        channelId = segments[1];
      }
    }

    const apiUrl = `https://api.chzzk.naver.com/service/v1/channels/${channelId}`;
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data.code === 200 && data.content) {
        return {
          success: true,
          platform: 'CHZZK',
          channelId: data.content.channelId || channelId,
          creatorName: data.content.channelName || '치지직 스트리머',
          profileImageUrl: data.content.channelImageUrl || '',
          channelUrl: `https://chzzk.naver.com/${channelId}`,
          description: data.content.channelDescription || `${data.content.channelName || '버튜버'}의 공식 치지직 방송국입니다.`,
          verified: data.content.verifiedMark || false
        };
      }
    }

    return {
      success: false,
      platform: 'CHZZK',
      channelId,
      creatorName: '',
      profileImageUrl: '',
      channelUrl: clean,
      verified: false,
      error: '치지직 채널/비디오 정보를 찾을 수 없습니다.'
    };
  } catch (err: any) {
    return {
      success: false,
      platform: 'CHZZK',
      channelId: channelUrlOrId,
      creatorName: '',
      profileImageUrl: '',
      channelUrl: channelUrlOrId,
      verified: false,
      error: err.message || '네트워크 오류가 발생했습니다.'
    };
  }
}

/**
 * 2. SOOP (구 아프리카TV) 외부 API 호출
 */
export async function fetchSoopProfile(userIdOrUrl: string): Promise<PlatformProfileResult> {
  let userId = userIdOrUrl.trim();
  if (userId.startsWith('http://') || userId.startsWith('https://')) {
    const urlObj = new URL(userId);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    userId = segments[segments.length - 1] || '';
    if (segments[0] === 'station' && segments[1]) {
      userId = segments[1];
    }
  }

  const apiUrl = `https://bjapi.afreecatv.com/api/${userId}/station`;

  try {
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
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
          description: data.station.joint_title || data.station.station_name || `${data.station.user_nick || userId}의 공식 SOOP 방송국입니다.`,
          verified: true
        };
      }
    }

    return {
      success: false,
      platform: 'SOOP',
      channelId: userId,
      creatorName: '',
      profileImageUrl: '',
      channelUrl: userIdOrUrl,
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
      channelUrl: userIdOrUrl,
      verified: false,
      error: err.message || '네트워크 오류'
    };
  }
}

/**
 * 플랫폼 프로필 통합 파서 (더미 이미지 완전히 제거 ❌)
 */
export async function fetchPlatformProfile(platform: string, inputUrl: string): Promise<PlatformProfileResult> {
  const upper = platform.toUpperCase();
  if (upper === 'CHZZK') {
    return await fetchChzzkProfile(inputUrl);
  } else if (upper === 'SOOP' || upper === 'AFREECA') {
    return await fetchSoopProfile(inputUrl);
  }

  return {
    success: false,
    platform: upper as any,
    channelId: inputUrl,
    creatorName: '',
    profileImageUrl: '',
    channelUrl: inputUrl,
    verified: false,
    error: '지원되지 않는 플랫폼입니다.'
  };
}
