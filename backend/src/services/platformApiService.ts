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
 * 2. SOOP (구 아프리카TV) 외부 API 호출 (최신 stapi.afreecatv.com 엔드포인트 적용)
 */
export async function fetchSoopProfile(userIdOrUrl: string): Promise<PlatformProfileResult> {
  let userId = userIdOrUrl.trim();
  if (userId.startsWith('http://') || userId.startsWith('https://')) {
    try {
      const urlObj = new URL(userId);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      // e.g., /station/memo/a0714/post/166790429 -> ['station', 'memo', 'a0714', 'post', '166790429']
      // e.g., /station/bboyena -> ['station', 'bboyena']
      // e.g., /bboyena -> ['bboyena']
      if (segments.includes('memo')) {
        const memoIdx = segments.indexOf('memo');
        if (segments[memoIdx + 1]) {
          userId = segments[memoIdx + 1];
        }
      } else if (segments.includes('station')) {
        const stationIdx = segments.indexOf('station');
        if (segments[stationIdx + 1]) {
          userId = segments[stationIdx + 1];
        }
      } else if (segments.length > 0) {
        userId = segments[segments.length - 1];
      }
    } catch {
      // fallback
    }
  }

  // SOOP (afreecatv) 최신 방송국 API 주소
  const apiUrl = `https://stapi.afreecatv.com/api/${userId}/station`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.ok) {
      const resData: any = await response.json();
      const data = resData.data || resData;
      const station = data?.station;
      const broad = data?.broad;

      if (data || station) {
        const nick = station?.user_nick || broad?.user_nick || station?.name || userId;
        let profileImg = data?.profile_image || station?.profile_image || '';
        if (profileImg.startsWith('//')) {
          profileImg = `https:${profileImg}`;
        }

        return {
          success: true,
          platform: 'SOOP',
          channelId: userId,
          creatorName: nick,
          profileImageUrl: profileImg,
          channelUrl: `https://www.sooplive.com/station/${userId}`,
          description: station?.joint_title || station?.station_name || `${nick}의 공식 SOOP 방송국입니다.`,
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
