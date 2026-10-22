import type { PortalProfile } from '../../../shared/portal';
import type { ProfileBroadcast } from '../../../shared/profileDetails';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { publicBroadcastTitle } from '../../../shared/contentReview';

// 등록 채널의 플랫폼 API만 직접 조회하며 수집 DB로 대체하지 않는다.
export async function readProfileBroadcast(profile: PortalProfile, fetcher: typeof fetch = fetch): Promise<ProfileBroadcast> {
  const key = activityChannelKey(profile.platform, profile.channelUrl);
  if (!key) return { state: 'UNKNOWN' };
  const id = key.split(':')[1];
  const chzzk = profile.platform === 'CHZZK';
  const url = chzzk ? `https://api.chzzk.naver.com/polling/v2/channels/${id}/live-status` : `https://chapi.sooplive.co.kr/api/${id}/station`;
  try {
    const response = await fetcher(url, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache', 'User-Agent': 'Mozilla/5.0', Referer: chzzk ? 'https://chzzk.naver.com/' : 'https://www.sooplive.com/' },
      signal: AbortSignal.timeout(5000), redirect: 'manual', cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!response.ok) { console.warn('Profile live lookup HTTP', profile.platform, response.status); return { state: 'UNAVAILABLE' }; }
    const data = await response.json() as any;
    const observedAt = new Date().toISOString();
    let title: unknown;
    let viewers: unknown;
    let liveUrl = profile.channelUrl;
    if (chzzk) {
      if (data?.code !== 200 || !['OPEN', 'CLOSE'].includes(data.content?.status)) return { state: 'UNAVAILABLE' };
      if (data.content.status === 'CLOSE') return { state: 'OFFLINE', observedAt };
      title = data.content.liveTitle;
      viewers = data.content.concurrentUserCount;
      liveUrl = `https://chzzk.naver.com/live/${id}`;
    } else {
      // 정상 채널 응답의 명시적인 null만 방송 중이 아님으로 판단한다.
      if (typeof data?.station?.user_id !== 'string' || data.station.user_id.toLowerCase() !== id) return { state: 'UNAVAILABLE' };
      if (data.broad === null) return { state: 'OFFLINE', observedAt };
      if (!/^[1-9]\d*$/.test(String(data.broad?.broad_no ?? ''))) return { state: 'UNAVAILABLE' };
      title = data.broad.broad_title;
      viewers = data.broad.current_sum_viewer;
      liveUrl = `https://play.sooplive.co.kr/${id}/${data.broad.broad_no}`;
    }
    return { state: 'LIVE', observedAt, url: liveUrl,
      title: publicBroadcastTitle(typeof title === 'string' && title ? title : profile.displayName),
      ...(typeof viewers === 'number' && Number.isFinite(viewers) && viewers >= 0 ? { viewers } : {}) };
  } catch (error) {
    console.warn('Profile live lookup failed', profile.platform, error instanceof Error ? error.message : 'unknown');
    // 시간 초과·차단·잘못된 응답을 방송 종료로 오인하지 않는다.
    return { state: 'UNAVAILABLE' };
  }
}
