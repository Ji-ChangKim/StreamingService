import type { PlatformSource, StatisticsBroadcast } from '../../../shared/broadcastStatistics';
import type { ChzzkLiveItem } from './chzzkCollector';
import { extractSoopUserId } from './soopCollector';

export interface StatisticsSourceResult {
  source: PlatformSource;
  lives: StatisticsBroadcast[];
}

interface ChzzkResponse {
  content?: { data?: ChzzkLiveItem[]; page?: { next?: unknown } };
}

interface RegisteredChannel {
  id: number;
  channel_name: string;
  channel_url: string;
  profile_image_url: string | null;
}

interface SoopResponse {
  broad?: {
    broad_no?: number;
    broad_title?: string;
    current_sum_viewer?: number;
    broad_cate_no?: string | number;
    broad_cate_name?: string;
  } | null;
  station?: { user_nick?: string };
}

// 외부 플랫폼의 응답을 제한 시간 안에 읽는다.
async function fetchPlatformJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Platform HTTP ${response.status}`);
    return await response.json() as T;
  } finally {
    clearTimeout(timer);
  }
}

// 누락된 시청자 수를 실제 0명으로 바꾸지 않는다.
function isViewerCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// 플랫폼이 제공한 한국 시각을 명시적인 시간대와 함께 정규화한다.
function parseStartTime(value?: string): string | null {
  if (!value) return null;
  const normalized = value.replace(' ', 'T');
  const time = /Z$|[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}+09:00`;
  return Number.isFinite(Date.parse(time)) ? new Date(time).toISOString() : null;
}

// 치지직 원본 방송을 화면 공통 자료형으로 변환한다.
function normalizeChzzk(item: ChzzkLiveItem): StatisticsBroadcast {
  const channelId = item.channel.channelId;
  return {
    id: `CHZZK:${item.liveId}`, platform: 'CHZZK', streamId: String(item.liveId),
    channelKey: `CHZZK:${channelId}`, channelName: item.channel.channelName,
    channelUrl: `https://chzzk.naver.com/${channelId}`,
    imageUrl: item.channel.channelImageUrl || null,
    liveUrl: `https://chzzk.naver.com/live/${channelId}`,
    title: item.liveTitle || '제목 없음', categoryId: item.liveCategory || 'unknown',
    categoryName: item.liveCategoryValue || '카테고리 미제공',
    viewers: item.concurrentUserCount, startedAt: parseStartTime(item.openDate),
  };
}

// 같은 채널이 여러 페이지에 나타날 때 시청자를 중복 합산하지 않는다.
export function deduplicateLiveChannels(lives: StatisticsBroadcast[]): StatisticsBroadcast[] {
  const channels = new Map<string, StatisticsBroadcast>();
  for (const live of lives) {
    const key = live.channelKey || live.id;
    const previous = channels.get(key);
    if (!previous || live.viewers > previous.viewers) channels.set(key, live);
  }
  return [...channels.values()].sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id));
}

// 치지직 인기 방송 상위 100개 범위만 조회한다.
export async function getChzzkStatisticsSource(): Promise<StatisticsSourceResult> {
  const lives: StatisticsBroadcast[] = [];
  let next: unknown;
  let complete = true;
  try {
    for (let page = 0; page < 2; page++) {
      // 다음 페이지 객체의 값을 개별 쿼리로 전달해야 첫 페이지가 반복되지 않는다.
      const cursorValues = new URLSearchParams();
      if (next && typeof next === 'object') {
        for (const [key, value] of Object.entries(next)) {
          if (typeof value === 'string' || typeof value === 'number') cursorValues.set(key, String(value));
        }
      } else if (typeof next === 'string') {
        cursorValues.set('next', next);
      }
      const cursor = cursorValues.size ? `&${cursorValues.toString()}` : '';
      const response = await fetchPlatformJson<ChzzkResponse>(`https://api.chzzk.naver.com/service/v1/lives?sortType=POPULAR&size=50${cursor}`);
      if (!Array.isArray(response.content?.data)) throw new Error('Invalid CHZZK response');
      for (const item of response.content.data) {
        if (!item.channel?.channelId || !isViewerCount(item.concurrentUserCount)) { complete = false; continue; }
        lives.push(normalizeChzzk(item));
      }
      next = response.content.page?.next;
      if (!next || response.content.data.length < 50) break;
    }
  } catch (error) {
    complete = false;
    console.warn('[Statistics] CHZZK collection unavailable', String(error));
  }
  return {
    source: {
      platform: 'CHZZK', state: complete ? 'available' : lives.length ? 'partial' : 'unavailable',
      scope: '인기 방송 상위 100개', observedAt: complete || lives.length ? new Date().toISOString() : null,
      checkedChannels: null,
    },
    lives: deduplicateLiveChannels(lives),
  };
}

// 등록된 SOOP 채널 한 곳의 방송 상태를 확인한다.
async function getSoopChannel(row: RegisteredChannel): Promise<StatisticsBroadcast | null> {
  const userId = extractSoopUserId(row.channel_url);
  if (!userId) throw new Error('Invalid registered channel');
  const response = await fetchPlatformJson<SoopResponse>(`https://chapi.sooplive.co.kr/api/${encodeURIComponent(userId)}/station`);
  if (!response.station) throw new Error('Invalid SOOP response');
  if (!response.broad?.broad_no) return null;
  const broad = response.broad;
  if (!isViewerCount(broad.current_sum_viewer)) throw new Error('Missing SOOP viewers');
  return {
    id: `SOOP:${broad.broad_no}`, platform: 'SOOP', streamId: String(broad.broad_no),
    channelKey: `SOOP:${userId}`, channelName: row.channel_name || response.station.user_nick || userId,
    channelUrl: `https://www.sooplive.co.kr/station/${userId}`, imageUrl: row.profile_image_url,
    liveUrl: `https://play.sooplive.co.kr/${userId}/${broad.broad_no}`,
    title: broad.broad_title || '제목 없음', categoryId: String(broad.broad_cate_no || 'unknown'),
    categoryName: broad.broad_cate_name || '카테고리 미제공',
    viewers: broad.current_sum_viewer, startedAt: null,
  };
}

// 등록 순서로 고정한 최대 40개 채널의 조회 성공 여부를 함께 반환한다.
export async function getSoopStatisticsSource(db: D1Database): Promise<StatisticsSourceResult> {
  const source: PlatformSource = {
    platform: 'SOOP', state: 'unavailable', scope: 'VDébut 등록 채널 최대 40개', observedAt: null, checkedChannels: 0,
  };
  try {
    const result = await db.prepare(`SELECT c.id, c.channel_name, c.channel_url,
      (SELECT profile_image_url FROM streamerChannel_info WHERE channel_id = c.id LIMIT 1) AS profile_image_url
      FROM streamerChannel c WHERE c.platform = 'SOOP' ORDER BY c.id LIMIT 40`).all<RegisteredChannel>();
    const responses = await Promise.allSettled(result.results.map(getSoopChannel));
    const successes = responses.filter((response) => response.status === 'fulfilled');
    const lives = responses.flatMap((response) => response.status === 'fulfilled' && response.value ? [response.value] : []);
    source.checkedChannels = successes.length;
    source.state = successes.length === responses.length && responses.length > 0 ? 'available' : successes.length ? 'partial' : 'unavailable';
    source.observedAt = successes.length ? new Date().toISOString() : null;
    return { source, lives: deduplicateLiveChannels(lives) };
  } catch (error) {
    console.warn('[Statistics] SOOP collection unavailable', String(error));
    return { source, lives: [] };
  }
}
