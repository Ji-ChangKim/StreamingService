// 엣지 캐시 도우미. 무료 플랜의 D1 하루 한도를 아끼고, 데이터베이스가 막혀도 사이트가 깨지지 않게 한다.
// - 통계 자료: 10분 슬롯이 바뀌면 직전 결과를 바로 돌려주고 최신 계산은 뒤에서 한 번만 한다(stale-while-revalidate).
// - 페이지: 정상 응답의 사본을 하루 보관해, 데이터베이스 조회가 실패하면 오류 화면 대신 사본을 보여 준다.

type Wait = (promise: Promise<unknown>) => void;

// 직전 결과를 대신 보여 줘도 되는 최대 나이. 이보다 오래되면 방문자가 기다리더라도 새로 계산한다(실패하면 그래도 직전 결과).
export const BOARD_MAX_STALE_MS = 2 * 3600 * 1000;
export const PAGE_STALE_COPY_SECONDS = 86400;

const marked = (key: string, mark: string) => { const url = new URL(key); url.searchParams.set('__vd', mark); return new Request(url.toString()); };

export interface CachedBoard<T> { data: T | null; state: 'HIT' | 'STALE' | 'MISS' }

// key: 슬롯 없는 기본 키(예: /api/analytics/board?platform=ALL). 슬롯 키·최신 키·계산 중 표시는 여기에서 붙인다.
export async function cachedBoard<T extends { asOf: string | null }>(cache: Cache | undefined, key: URL, load: () => Promise<T | null>, cacheSeconds: (asOf: string | null) => number, wait: Wait, now = Date.now()): Promise<CachedBoard<T>> {
  key.searchParams.set('v', '4');
  const base = key.toString();
  const slotKey = marked(base, `slot-${new Date(Math.floor(now / 600000) * 600000).toISOString()}`);
  const latestKey = marked(base, 'latest');
  const lockKey = marked(base, `lock-${Math.floor(now / 600000)}`);
  const store = async (data: T) => {
    if (!cache) return;
    const seconds = cacheSeconds(data.asOf);
    const body = JSON.stringify(data);
    const headers = (s: number, until: number) => ({ 'Content-Type': 'application/json; charset=utf-8', 'X-VD-Cache-Until': String(until), 'X-VD-Stored-At': String(now), 'Cache-Control': `public, s-maxage=${s}` });
    await Promise.all([
      cache.put(slotKey, new Response(body, { headers: headers(seconds, now + seconds * 1000) })),
      cache.put(latestKey, new Response(body, { headers: headers(PAGE_STALE_COPY_SECONDS, 0) })),
    ]).catch(() => undefined);
  };
  if (!cache) return { data: await load(), state: 'MISS' };

  const hit = await cache.match(slotKey).catch(() => undefined);
  if (hit && Number(hit.headers.get('X-VD-Cache-Until')) > now) return { data: await hit.json() as T, state: 'HIT' };

  const latest = await cache.match(latestKey).catch(() => undefined);
  const latestData = latest ? await latest.json().catch(() => null) as T | null : null;
  const latestAge = latest ? now - Number(latest.headers.get('X-VD-Stored-At') || 0) : Infinity;
  if (latestData && latestAge <= BOARD_MAX_STALE_MS) {
    // 같은 슬롯에서 계산은 한 번만 시작한다(동시에 들어온 요청이 모두 계산하지 않게).
    const locked = await cache.match(lockKey).catch(() => undefined);
    if (!locked) {
      await cache.put(lockKey, new Response('1', { headers: { 'Cache-Control': 'public, s-maxage=120' } })).catch(() => undefined);
      wait(load().then((data) => (data ? store(data) : undefined)).catch((error) => console.error('[Board] background refresh failed', String(error))));
    }
    return { data: latestData, state: 'STALE' };
  }
  try {
    const data = await load();
    if (data) wait(store(data));
    return { data, state: 'MISS' };
  } catch (error) {
    // 새로 계산하지 못하면(데이터베이스 한도·장애) 오래된 결과라도 보여 준다.
    if (latestData) { console.error('[Board] refresh failed, serving previous result', String(error)); return { data: latestData, state: 'STALE' }; }
    throw error;
  }
}

// 정상 페이지 사본을 하루 보관한다.
export function putPageCopy(cache: Cache | undefined, url: string, response: Response, wait: Wait): void {
  if (!cache) return;
  const copy = new Response(response.clone().body, response);
  copy.headers.set('Cache-Control', `public, s-maxage=${PAGE_STALE_COPY_SECONDS}`);
  wait(cache.put(marked(url, 'copy'), copy).catch(() => undefined));
}

// 데이터베이스 조회가 실패했을 때 보여 줄 사본. 브라우저에는 저장하지 않게 한다.
export async function matchPageCopy(cache: Cache | undefined, url: string): Promise<Response | undefined> {
  if (!cache) return undefined;
  const hit = await cache.match(marked(url, 'copy')).catch(() => undefined);
  if (!hit) return undefined;
  const response = new Response(hit.body, hit);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-VD-Cache', 'STALE');
  return response;
}
