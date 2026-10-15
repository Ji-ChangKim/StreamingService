import { siteCanonical } from './siteSeo';
import { sitePath } from './siteSeo';
import type { ActivityFilters, BroadcastActivity } from './broadcastActivity';

// 채널 고유 키를 검색·공유에 사용하는 대표 통계 주소로 변환한다.
export function activityStreamerPath(channel: string): string {
  return `/analytics/streamer/${encodeURIComponent(channel)}`;
}

// 알 수 없는 통계 주소를 전체 통계 화면으로 바꾸지 않는다.
export function isActivityPath(path: string): boolean {
  path = sitePath(path);
  if (['/analytics', '/analytics/chzzk', '/analytics/soop'].includes(path)) return true;
  if (!path.startsWith('/analytics/streamer/')) return false;
  try { return /^(CHZZK:[a-f0-9]{32}|SOOP:[a-z0-9_]{1,50})$/i.test(decodeURIComponent(path.slice('/analytics/streamer/'.length))); }
  catch { return false; }
}

// 서버와 브라우저가 같은 제목·설명·대표 주소를 사용한다.
export function activitySeo(filters: ActivityFilters, data: BroadcastActivity | null, search = '') {
  const platform = filters.channel ? data?.streamer?.platform : filters.platform;
  const platformName = platform === 'CHZZK' ? '치지직' : platform === 'SOOP' ? 'SOOP' : '';
  const name = data?.streamer?.name || filters.channel.split(':')[1] || '';
  const path = filters.channel ? activityStreamerPath(filters.channel) : platformName ? `/analytics/${platform === 'CHZZK' ? 'chzzk' : 'soop'}` : '/analytics';
  return {
    title: search && !filters.channel ? `${search} 검색 결과 | VDébut` : filters.channel ? `${name} 방송 통계 · ${platformName} | VDébut` : `${platformName ? `${platformName} ` : '치지직·SOOP '}방송 활동 통계 | VDébut`,
    description: filters.channel ? `${name}의 방송 이력과 활동 시간, 카테고리별 기록을 확인하세요.` : '치지직·SOOP에서 기록된 콘텐츠별 방송 시간과 활동 시간대를 살펴보세요. 스트리머를 검색해 개인 방송 기록도 확인할 수 있습니다.',
    canonical: siteCanonical(path),
    image: 'https://vdebut.live/og-image.png',
  };
}

// 검색 결과와 임의 필터 조합은 별도 검색 문서로 색인하지 않는다.
export function activityNoindex(url: URL, data: BroadcastActivity | null): boolean {
  return !data || !isActivityPath(url.pathname) || url.hostname !== 'vdebut.live' || [...url.searchParams.keys()].some(key => !['name', 'back', 'returnTo', 'lang', 'gclid', 'fbclid'].includes(key) && !key.startsWith('utm_'))
    || Boolean(url.pathname.includes('/streamer/') && !data?.summary.broadcasts);
}
