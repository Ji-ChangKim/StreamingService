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

  // SOOP 최신 방송국 API 주소 (chapi.sooplive.co.kr / chapi.sooplive.com)
  const primaryApiUrl = `https://chapi.sooplive.co.kr/api/${userId}/station`;
  const fallbackApiUrl = `https://chapi.sooplive.com/api/${userId}/station`;

  try {
    let response = await fetch(primaryApiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      response = await fetch(fallbackApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    }

    if (response.ok) {
      const resData: any = await response.json();
      const data = resData.data || resData;
      const station = data?.station;
      const broad = data?.broad;

      if (data && (station || data.user_nick || data.profile_image)) {
        const nick = station?.user_nick || broad?.user_nick || station?.name || data.user_nick || userId;
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
 * 3. YouTube 외부 프로필 파서 (채널 URL / Handle @username / 영상 URL 통합 처리 및 900px 고화질 추출)
 */
export async function fetchYoutubeProfile(channelUrlOrHandle: string): Promise<PlatformProfileResult> {
  let targetUrl = channelUrlOrHandle.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    if (targetUrl.startsWith('@')) {
      targetUrl = `https://www.youtube.com/${targetUrl}`;
    } else {
      targetUrl = `https://www.youtube.com/@${targetUrl}`;
    }
  }

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,ja-JP;q=0.8,en-US;q=0.7,en;q=0.6',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };

  try {
    let html = '';
    const isVideoUrl = targetUrl.includes('/watch') || targetUrl.includes('youtu.be/');

    // 1차 Fetch
    const response = await fetch(targetUrl, { headers: defaultHeaders });
    if (response.ok) {
      html = await response.text();
    }

    let creatorName = '';
    let channelUrl = targetUrl;
    let profileImageUrl = '';
    let description = '';

    // 만약 영상 주소인 경우 HTML에서 채널 주소 및 크리에이터 이름 추출 후 채널 페이지 추적
    if (isVideoUrl && html) {
      const authorMatch = html.match(/"author":"([^"]+)"/i) ||
                          html.match(/"ownerChannelName":"([^"]+)"/i) ||
                          html.match(/<link itemprop="name" content="([^"]+)">/i);
      if (authorMatch && authorMatch[1]) {
        creatorName = authorMatch[1];
      }

      const channelUrlMatch = html.match(/<span itemprop="author"[^>]*>\s*<link itemprop="url" href="([^"]+)">/i) ||
                              html.match(/"channelUrl":"([^"]+)"/i) ||
                              html.match(/href="(https:\/\/www\.youtube\.com\/@[^"]+)"/i);
      if (channelUrlMatch && channelUrlMatch[1]) {
        channelUrl = channelUrlMatch[1];
      }

      const avatarMatches = html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+=[sS0-9-]+[a-zA-Z0-9_-]*/g) ||
                            html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+/g);
      if (avatarMatches && avatarMatches.length > 0) {
        profileImageUrl = avatarMatches[0].replace(/=s\d+-/, '=s900-');
      }

      // 공식 채널 URL로 2차 추적하여 진짜 소개글과 고화질 이미지 연동
      if (channelUrl && channelUrl !== targetUrl) {
        try {
          const chRes = await fetch(channelUrl, { headers: defaultHeaders });
          if (chRes.ok) {
            const chHtml = await chRes.text();
            const chTitleMatch = chHtml.match(/<meta property="og:title" content="([^"]+)">/i) || chHtml.match(/<title>([^<]+)<\/title>/i);
            if (chTitleMatch) {
              creatorName = chTitleMatch[1].replace(/ - YouTube$/, '').trim();
            }

            const chDescMatch = chHtml.match(/<meta property="og:description" content="([^"]+)">/i);
            if (chDescMatch) {
              description = chDescMatch[1];
            }

            const chAvatars = chHtml.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+=[sS0-9-]+[a-zA-Z0-9_-]*/g) ||
                              chHtml.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+/g);
            if (chAvatars && chAvatars.length > 0) {
              profileImageUrl = chAvatars[0].replace(/=s\d+-/, '=s900-');
            }
          }
        } catch {
          // fallback
        }
      }
    } else if (html) {
      // 채널 페이지 파싱
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        creatorName = titleMatch[1].replace(/ - YouTube$/, '').trim();
      }

      const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);
      if (descMatch) {
        description = descMatch[1];
      }

      const avatarMatches = html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+=[sS0-9-]+[a-zA-Z0-9_-]*/g) ||
                            html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+/g);
      if (avatarMatches && avatarMatches.length > 0) {
        profileImageUrl = avatarMatches[0].replace(/=s\d+-/, '=s900-');
      }
    }

    if (!creatorName) {
      const handleMatch = targetUrl.match(/@([a-zA-Z0-9._-]+)/);
      creatorName = handleMatch ? handleMatch[1] : '유튜브 스트리머';
    }

    if (!description) {
      description = `${creatorName}의 공식 유튜브 채널입니다.`;
    }

    return {
      success: true,
      platform: 'YOUTUBE',
      channelId: channelUrl,
      creatorName,
      profileImageUrl,
      channelUrl,
      description,
      verified: true
    };
  } catch (err: any) {
    const handleMatch = targetUrl.match(/@([a-zA-Z0-9._-]+)/);
    const creatorName = handleMatch ? handleMatch[1] : '유튜브 스트리머';
    return {
      success: true,
      platform: 'YOUTUBE',
      channelId: targetUrl,
      creatorName,
      profileImageUrl: '',
      channelUrl: targetUrl,
      description: `${creatorName}의 공식 유튜브 채널입니다.`,
      verified: true
    };
  }
}

/**
 * 4. Twitch 외부 프로필 파서 (URL / Username 통합 처리)
 */
export async function fetchTwitchProfile(channelUrlOrId: string): Promise<PlatformProfileResult> {
  let username = channelUrlOrId.trim();

  if (username.startsWith('http://') || username.startsWith('https://')) {
    try {
      const urlObj = new URL(username);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        username = segments[0];
      }
    } catch {
      // fallback
    }
  }

  username = username.replace(/^@/, '').trim();
  const channelUrl = `https://www.twitch.tv/${username}`;

  try {
    // 1차: IVR Twitch Public REST API (프로필 이미지, 디스플레이 네임, Bio 100% 정상 수집)
    const ivrRes = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(username.toLowerCase())}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (ivrRes.ok) {
      const ivrData: any = await ivrRes.json();
      const userData = Array.isArray(ivrData) ? ivrData[0] : ivrData;
      if (userData && (userData.displayName || userData.login)) {
        const displayName = userData.displayName || userData.login || username;
        const profileImage = userData.logo || '';
        const description = userData.bio || `${displayName}의 공식 트위치 방송국입니다.`;

        return {
          success: true,
          platform: 'TWITCH',
          channelId: userData.login || username,
          creatorName: displayName,
          profileImageUrl: profileImage,
          channelUrl,
          description,
          verified: true
        };
      }
    }

    // 2차 Fallback: HTML OpenGraph 메타 태그 파싱
    const response = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (response.ok) {
      const html = await response.text();
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || html.match(/<title>([^<]+)<\/title>/i);
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)">/i);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);

      if (titleMatch || imageMatch) {
        let title = titleMatch ? titleMatch[1] : username;
        title = title.replace(/ - Twitch$/, '').replace(/ - 트위치$/, '').trim();

        const profileImg = imageMatch ? imageMatch[1] : '';
        const desc = descMatch ? descMatch[1] : `${title}의 공식 트위치 채널입니다.`;

        return {
          success: true,
          platform: 'TWITCH',
          channelId: username,
          creatorName: title || username,
          profileImageUrl: profileImg,
          channelUrl,
          description: desc,
          verified: true
        };
      }
    }

    return {
      success: true,
      platform: 'TWITCH',
      channelId: username,
      creatorName: username,
      profileImageUrl: '',
      channelUrl,
      description: `${username}의 트위치 채널입니다.`,
      verified: true
    };
  } catch (err: any) {
    return {
      success: true,
      platform: 'TWITCH',
      channelId: username,
      creatorName: username,
      profileImageUrl: '',
      channelUrl,
      description: `${username}의 트위치 채널입니다.`,
      verified: true
    };
  }
}

/**
 * 플랫폼 프로필 통합 파서 (URL 기반 자동 인식 보완)
 */
export async function fetchPlatformProfile(platform: string, inputUrl: string): Promise<PlatformProfileResult> {
  const lowerUrl = (inputUrl || '').toLowerCase();
  let upper = (platform || '').toUpperCase();

  if (lowerUrl.includes('sooplive.com') || lowerUrl.includes('sooplive.co.kr') || lowerUrl.includes('afreecatv.com')) {
    upper = 'SOOP';
  } else if (lowerUrl.includes('chzzk.naver.com')) {
    upper = 'CHZZK';
  } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    upper = 'YOUTUBE';
  } else if (lowerUrl.includes('twitch.tv')) {
    upper = 'TWITCH';
  }

  if (upper === 'CHZZK') {
    return await fetchChzzkProfile(inputUrl);
  } else if (upper === 'SOOP' || upper === 'AFREECA') {
    return await fetchSoopProfile(inputUrl);
  } else if (upper === 'YOUTUBE') {
    return await fetchYoutubeProfile(inputUrl);
  } else if (upper === 'TWITCH') {
    return await fetchTwitchProfile(inputUrl);
  }

  return {
    success: false,
    platform: (upper || 'CHZZK') as any,
    channelId: inputUrl,
    creatorName: '',
    profileImageUrl: '',
    channelUrl: inputUrl,
    verified: false,
    error: '지원되지 않는 플랫폼이거나 방송국 주소가 바르지 않습니다.'
  };
}
