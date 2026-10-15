// 공개 GET 응답만 버전별 키로 저장하며 인증·오류 응답은 저장하지 않는다.
export async function publicResponseCache(request: Request, key: URL, seconds: number, load: () => Promise<Response>, waitUntil: (promise: Promise<unknown>) => void): Promise<Response> {
  // 인증 요청과 변경 요청은 공용 캐시를 읽거나 쓰지 않는다.
  if (request.method !== 'GET' || request.headers.has('Authorization')) return load();
  const cache = typeof caches === 'undefined' ? undefined : caches.default;
  const cacheKey = new Request(key.toString());
  const bypass = /no-cache|no-store|max-age=0/i.test(request.headers.get('Cache-Control') || '');
  if (cache && !bypass) {
    const hit = await cache.match(cacheKey).catch(() => undefined);
    // 엣지 정책이 응답 헤더를 바꿔도 서버가 정한 유효 시간을 넘기지 않는다.
    if (hit && Number(hit.headers.get('X-VD-Cache-Until')) > Date.now()) {
      const response = new Response(hit.body, hit);
      const remaining = Math.max(0, Math.min(seconds, Math.floor((Number(hit.headers.get('X-VD-Cache-Until')) - Date.now()) / 1000)));
      response.headers.set('Cache-Control', `public, max-age=${remaining}`);
      response.headers.set('X-VD-Cache', 'HIT'); return response;
    }
  }
  const response = await load();
  if (response.status !== 200 || response.headers.has('Set-Cookie') || /private|no-store/i.test(response.headers.get('Cache-Control') || '')) return response;
  response.headers.set('Cache-Control', `public, max-age=${seconds}`);
  response.headers.set('X-VD-Cache', bypass ? 'REFRESH' : 'MISS');
  response.headers.set('X-VD-Cache-Until', String(Date.now() + seconds * 1000));
  if (cache) waitUntil(cache.put(cacheKey, response.clone()).catch(() => undefined));
  return response;
}
