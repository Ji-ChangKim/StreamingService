import type { PortalProfile } from '../../../shared/portal';
import { portalWebUrl } from '../../../shared/portal';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { needsContentReview } from '../../../shared/contentReview';
import type { ChannelMediaItem, ChannelMediaSection, ProfileChannelMedia } from '../../../shared/profileDetails';

// 두 플랫폼의 현지 게시 시각은 한국 시간으로 해석한다.
function publishedAt(value: unknown): string {
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? new Date(value.replace(' ', 'T') + '+09:00') : new Date(NaN);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

// 채널 소유자·공개 여부·영상 종류를 확인한 항목만 원본 링크로 연결한다.
function normalize(row: any, id: string, chzzk: boolean, clips: boolean): ChannelMediaItem | undefined {
  if (!row || typeof row !== 'object') return;
  const title = chzzk ? (clips ? row.clipTitle : row.videoTitle) : row.titleName;
  const date = publishedAt(chzzk ? (clips ? row.createdDate : row.publishDate) : row.regDate);
  if (typeof title !== 'string' || !title.trim() || !date || needsContentReview(title)) return;
  if (chzzk) {
    if ((clips ? row.ownerChannelId : row.channel?.channelId) !== id || row.adult !== false || row.blindType || row.privateUserBlock || row.paidProductId) return;
    const videoId = String(clips ? row.clipUID : row.videoNo);
    if (!(clips ? /^[A-Za-z0-9_-]{6,64}$/ : /^[1-9]\d*$/).test(videoId)) return;
    return { provider: 'CHZZK', kind: clips ? 'CLIP' : 'BROADCAST_REPLAY', title: title.trim(), url: `https://chzzk.naver.com/${clips ? 'clips' : 'video'}/${videoId}`, thumbnailUrl: portalWebUrl(row.thumbnailImageUrl), publishedAt: date, linkOnly: true };
  }
  // 팬이 만든 클립은 업로더가 아닌 공식 채널 목록의 원 방송자 연결을 확인한다.
  if (!(row.userId === id || (clips && row.badge?.bjId === id)) || row.authNo !== 101 || row.ucc?.grade !== 0 || row.ucc?.paidPpv !== false || row.ucc?.flag !== 'SUCCEED' || row.copyright?.delFlag === 'Y' || row.ucc?.fileType !== (clips ? 'CLIP' : 'REVIEW')) return;
  if (!/^[1-9]\d*$/.test(String(row.titleNo))) return;
  return { provider: 'SOOP', kind: clips ? 'CLIP' : 'BROADCAST_REPLAY', title: title.trim(), url: `https://vod.sooplive.com/player/${row.titleNo}`, thumbnailUrl: portalWebUrl(row.ucc.thumb), publishedAt: date, linkOnly: true };
}

// 첫 페이지만 조회한다. SOOP가 지원하는 페이지 크기는 20이며 추가 페이지는 요청하지 않는다.
async function readSection(id: string, chzzk: boolean, clips: boolean, fetcher: typeof fetch): Promise<ChannelMediaSection> {
  const limit = clips ? 4 : 2;
  const url = chzzk
    ? `https://api.chzzk.naver.com/service/v1/channels/${id}/${clips ? 'clips?orderType=RECENT&filterType=ALL' : 'videos?sortType=LATEST&pagingType=PAGE'}&page=0&size=${limit}`
    : `https://api-channel.sooplive.com/v1.1/channel/${id}/vod/${clips ? 'clip' : 'review'}?orderBy=reg_date&perPage=20&page=1`;
  try {
    const response = await fetcher(url, { headers: { Accept: 'application/json', 'Cache-Control': 'no-cache', 'User-Agent': 'Mozilla/5.0', Referer: chzzk ? 'https://chzzk.naver.com/' : 'https://www.sooplive.com/' }, signal: AbortSignal.timeout(5000), redirect: 'manual', cf: { cacheTtl: 0, cacheEverything: false } });
    if (!response.ok) return { state: 'UNAVAILABLE', items: [] };
    const body = await response.json() as any;
    const rows = chzzk ? (body?.code === 200 ? body.content?.data : undefined) : body?.contents;
    if (!Array.isArray(rows)) return { state: 'UNAVAILABLE', items: [] };
    const items = rows.slice(0, chzzk ? limit : 20).map((row) => normalize(row, id, chzzk, clips)).filter((item): item is ChannelMediaItem => !!item).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return { state: 'AVAILABLE', items: items.filter((item, index) => items.findIndex((other) => other.url === item.url) === index).slice(0, limit) };
  } catch {
    // 조회 실패를 영상이 없는 채널로 처리하지 않는다.
    return { state: 'UNAVAILABLE', items: [] };
  }
}

// 프로필에 등록된 실제 채널만 조회하며 영상과 클립의 실패를 독립적으로 처리한다.
export async function readProfileChannelMedia(profile: PortalProfile, fetcher: typeof fetch = fetch): Promise<ProfileChannelMedia> {
  const key = activityChannelKey(profile.platform, profile.channelUrl);
  if (!key) return { videos: { state: 'UNSUPPORTED', items: [] }, clips: { state: 'UNSUPPORTED', items: [] } };
  const [videos, clips] = await Promise.all([readSection(key.split(':')[1], profile.platform === 'CHZZK', false, fetcher), readSection(key.split(':')[1], profile.platform === 'CHZZK', true, fetcher)]);
  return { videos, clips };
}
