import type { ActivityFilters, BroadcastActivity } from './broadcastActivity';

// 채널 고유 키를 검색·공유에 사용하는 대표 통계 주소로 변환한다.
export function activityStreamerPath(channel: string): string {
  return `/analytics/streamer/${encodeURIComponent(channel)}`;
}

// 서버와 브라우저가 같은 제목·설명·대표 주소를 사용한다.
export function activitySeo(filters: ActivityFilters, data: BroadcastActivity | null, search = '') {
  const platform = filters.channel ? data?.streamer?.platform : filters.platform;
  const platformName = platform === 'CHZZK' ? '치지직' : platform === 'SOOP' ? 'SOOP' : '';
  const name = data?.streamer?.name || filters.channel.split(':')[1] || '';
  const path = filters.channel ? activityStreamerPath(filters.channel) : platformName ? `/analytics/${platform === 'CHZZK' ? 'chzzk' : 'soop'}` : '/analytics';
  return {
    title: search && !filters.channel ? `${search} 검색 결과 | VDébut` : filters.channel ? `${name} 방송 통계 · ${platformName} | VDébut` : `${platformName ? `${platformName} ` : ''}버튜버 방송 통계${platformName ? '' : ' · 치지직·SOOP'} | VDébut`,
    description: filters.channel ? `${name}의 방송 이력과 활동 시간, 카테고리별 기록을 확인하세요.` : '버튜버의 방송 시간대와 카테고리, 방송 이력을 확인하세요. 스트리머를 검색해 개인 방송 통계를 조회할 수 있습니다.',
    canonical: `https://vdebut.live${path}`,
  };
}

// 검색 결과와 임의 필터 조합은 별도 검색 문서로 색인하지 않는다.
export function activityNoindex(url: URL, data: BroadcastActivity | null): boolean {
  return url.hostname !== 'vdebut.live' || [...url.searchParams.keys()].some(key => !['name', 'back'].includes(key))
    || Boolean(url.pathname.includes('/streamer/') && !data?.summary.broadcasts);
}
