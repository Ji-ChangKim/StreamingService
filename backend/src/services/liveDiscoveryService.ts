import { D1Database } from '@cloudflare/workers-types';
import { fetchChzzkLiveList, categorizeChzzkContent, ChzzkLiveItem } from './chzzkCollector';
import { fetchRegisteredSoopLives, categorizeSoopContent, SoopLiveItem } from './soopCollector';

export interface LiveDiscoveryItem {
  id: string;
  platform: 'CHZZK' | 'SOOP';
  channelId: string;
  channelName: string;
  channelImageUrl?: string;
  channelUrl: string;
  liveTitle: string;
  categoryGroup: string; // 'ALL' | 'GAME' | 'TALK' | 'MUSIC' | 'ART' | 'ASMR' | 'ETC'
  categoryName: string;  // 세부 게임명 또는 카테고리명
  viewerCount: number;
  thumbnailUrl?: string;
  firstSeenAt?: string;  // 관측 시각 또는 시작 시각
  liveUrl: string;
  tags?: string[];
}

export interface LiveGameStat {
  name: string;
  liveCount: number;
  viewerSum: number;
}

export interface LiveCategoryStat {
  key: string;
  name: string;
  liveCount: number;
  viewerSum: number;
  games?: LiveGameStat[];
}

export interface LiveDiscoveryFilters {
  platform?: 'ALL' | 'CHZZK' | 'SOOP';
  categoryGroup?: string;
  game?: string;
  sort?: 'viewers' | 'recent';
  query?: string;
}

export interface LiveDiscoveryResponse {
  meta: {
    scope: string;
    snapshotId: string;
    observedAt: string;
    totalLiveCount: number;
    totalViewerSum: number;
  };
  categories: LiveCategoryStat[];
  lives: LiveDiscoveryItem[];
}

/**
 * 1. 치지직 썸네일 포맷팅 (단일 책임: 썸네일 템플릿 치환)
 */
function formatChzzkThumbnail(templateUrl?: string): string | undefined {
  if (!templateUrl) return undefined;
  return templateUrl.replace('{type}', '720');
}

/**
 * 2. 치지직 라이브 항목을 표준 LiveDiscoveryItem으로 변환 (단일 책임)
 */
function normalizeChzzkItem(item: ChzzkLiveItem, observedAt: string): LiveDiscoveryItem {
  const cat = categorizeChzzkContent(item);
  const channelId = item.channel?.channelId || '';
  const channelUrl = channelId ? `https://chzzk.naver.com/${channelId}` : 'https://chzzk.naver.com';
  const liveUrl = channelId ? `https://chzzk.naver.com/live/${channelId}` : 'https://chzzk.naver.com';

  return {
    id: `chzzk-${item.liveId}`,
    platform: 'CHZZK',
    channelId,
    channelName: item.channel?.channelName || '치지직 스트리머',
    channelImageUrl: item.channel?.channelImageUrl || undefined,
    channelUrl,
    liveTitle: item.liveTitle || '라이브 방송',
    categoryGroup: cat.groupKey,
    categoryName: item.liveCategoryValue?.trim() || (cat.groupKey === 'GAME' ? '종합게임' : cat.groupName),
    viewerCount: item.concurrentUserCount || 0,
    thumbnailUrl: formatChzzkThumbnail((item as any).liveImageUrl),
    firstSeenAt: item.openDate || observedAt,
    liveUrl,
    tags: item.tags || [],
  };
}

/**
 * 3. SOOP 라이브 항목을 표준 LiveDiscoveryItem으로 변환 (단일 책임)
 */
function normalizeSoopItem(item: SoopLiveItem, observedAt: string): LiveDiscoveryItem {
  const cat = categorizeSoopContent(item);
  const channelUrl = item.channelUrl || `https://ch.sooplive.co.kr/${item.userId}`;
  const liveUrl = item.broadNo ? `https://play.sooplive.co.kr/${item.userId}/${item.broadNo}` : channelUrl;

  return {
    id: `soop-${item.broadNo}`,
    platform: 'SOOP',
    channelId: item.userId,
    channelName: item.channelName || item.userId,
    channelImageUrl: undefined,
    channelUrl,
    liveTitle: item.liveTitle || '라이브 방송',
    categoryGroup: cat.groupKey,
    categoryName: item.categoryName || (cat.groupKey === 'GAME' ? '종합게임' : cat.groupName),
    viewerCount: item.viewerCount || 0,
    thumbnailUrl: undefined,
    firstSeenAt: observedAt,
    liveUrl,
    tags: ['버튜버', 'SOOP', cat.groupName],
  };
}

/**
 * 4. 카테고리 및 세부 게임 집계 (단일 책임)
 */
function aggregateCategoriesAndGames(allObservedLives: LiveDiscoveryItem[]): LiveCategoryStat[] {
  const categoryOrder: { key: string; name: string }[] = [
    { key: 'ALL', name: '전체' },
    { key: 'GAME', name: '게임' },
    { key: 'TALK', name: '잡담·소통' },
    { key: 'MUSIC', name: '음악·노래' },
    { key: 'ART', name: '그림·아트' },
    { key: 'ASMR', name: 'ASMR' },
    { key: 'ETC', name: '기타' },
  ];

  // 대분류별 맵 초기화
  const groupStatsMap = new Map<string, { liveCount: number; viewerSum: number; gamesMap: Map<string, { liveCount: number; viewerSum: number }> }>();
  for (const c of categoryOrder) {
    groupStatsMap.set(c.key, { liveCount: 0, viewerSum: 0, gamesMap: new Map() });
  }

  // 전체 방송 집계
  const allStat = groupStatsMap.get('ALL')!;
  allStat.liveCount = allObservedLives.length;
  allStat.viewerSum = allObservedLives.reduce((acc, l) => acc + l.viewerCount, 0);

  for (const live of allObservedLives) {
    const groupKey = live.categoryGroup || 'ETC';
    const stat = groupStatsMap.get(groupKey) || groupStatsMap.get('ETC')!;
    stat.liveCount += 1;
    stat.viewerSum += live.viewerCount;

    // 게임인 경우 세부 게임별 집계
    if (groupKey === 'GAME') {
      const gName = live.categoryName || '종합게임';
      const gStat = stat.gamesMap.get(gName) || { liveCount: 0, viewerSum: 0 };
      gStat.liveCount += 1;
      gStat.viewerSum += live.viewerCount;
      stat.gamesMap.set(gName, gStat);
    }
  }

  return categoryOrder.map((c) => {
    const stat = groupStatsMap.get(c.key)!;
    const result: LiveCategoryStat = {
      key: c.key,
      name: c.name,
      liveCount: stat.liveCount,
      viewerSum: stat.viewerSum,
    };

    if (c.key === 'GAME' && stat.gamesMap.size > 0) {
      result.games = Array.from(stat.gamesMap.entries())
        .map(([name, data]) => ({
          name,
          liveCount: data.liveCount,
          viewerSum: data.viewerSum,
        }))
        .sort((a, b) => b.viewerSum - a.viewerSum);
    }

    return result;
  });
}

/**
 * 5. 검색 및 필터링 / 정렬 수행 (단일 책임)
 */
function applyFiltersAndSort(
  lives: LiveDiscoveryItem[],
  filters: LiveDiscoveryFilters
): LiveDiscoveryItem[] {
  let result = [...lives];

  // 1. 플랫폼 필터
  if (filters.platform && filters.platform !== 'ALL') {
    result = result.filter((l) => l.platform === filters.platform);
  }

  // 2. 대분류 필터
  if (filters.categoryGroup && filters.categoryGroup !== 'ALL') {
    result = result.filter((l) => l.categoryGroup === filters.categoryGroup);
  }

  // 3. 세부 게임 필터
  if (filters.game && filters.game !== 'ALL') {
    const gameTarget = filters.game.trim().toLowerCase();
    result = result.filter((l) => l.categoryName.toLowerCase() === gameTarget);
  }

  // 4. 스트리머/채널 검색어
  if (filters.query && filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter((l) =>
      l.channelName.toLowerCase().includes(q) ||
      l.liveTitle.toLowerCase().includes(q) ||
      l.categoryName.toLowerCase().includes(q)
    );
  }

  // 5. 정렬 (기본: 시청자 많은 순, 옵션: 최근 관측 순)
  if (filters.sort === 'recent') {
    result.sort((a, b) => {
      const timeA = a.firstSeenAt ? new Date(a.firstSeenAt).getTime() : 0;
      const timeB = b.firstSeenAt ? new Date(b.firstSeenAt).getTime() : 0;
      return timeB - timeA;
    });
  } else {
    result.sort((a, b) => b.viewerCount - a.viewerCount);
  }

  return result;
}

/**
 * 6. 라이브 방송 탐색 데이터 조회 메인 함수
 */
export async function getLiveDiscovery(
  db: D1Database,
  filters: LiveDiscoveryFilters = {}
): Promise<LiveDiscoveryResponse> {
  const now = new Date();
  const kstIso = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().replace('Z', '+09:00');
  const snapshotId = `snap-${Math.floor(now.getTime() / (5 * 60 * 1000))}`;

  const allObservedLives: LiveDiscoveryItem[] = [];

  try {
    // 1. 치지직 데이터 수집 (최대 100개 순회)
    const chzzkItems = await fetchChzzkLiveList(100);
    for (const item of chzzkItems) {
      allObservedLives.push(normalizeChzzkItem(item, kstIso));
    }
  } catch (err) {
    console.error('[getLiveDiscovery] Chzzk fetch failed:', err);
  }

  try {
    // 2. SOOP 등록 버튜버 실시간 데이터 수집
    if (db) {
      const soopItems = await fetchRegisteredSoopLives(db, 40);
      for (const item of soopItems) {
        allObservedLives.push(normalizeSoopItem(item, kstIso));
      }
    }
  } catch (err) {
    console.error('[getLiveDiscovery] SOOP fetch failed:', err);
  }

  // 전체 방송 대상 카테고리 집계 (동일 스냅샷 기준)
  const categories = aggregateCategoriesAndGames(allObservedLives);

  // 필터 및 정렬 적용
  const filteredLives = applyFiltersAndSort(allObservedLives, filters);

  return {
    meta: {
      scope: 'VERIFIED_VTUBER_LIVE_OBSERVED',
      snapshotId,
      observedAt: kstIso,
      totalLiveCount: allObservedLives.length,
      totalViewerSum: allObservedLives.reduce((acc, l) => acc + l.viewerCount, 0),
    },
    categories,
    lives: filteredLives,
  };
}
