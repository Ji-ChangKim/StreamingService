import { Hono, MiddlewareHandler } from 'hono';
import { portalPageSeo } from '../../../shared/portalSeo';
import { portalChannelUrl, portalWebUrl, PortalProfile } from '../../../shared/portal';
import { publicResponseCache } from './publicResponseCache';
import { portalApi } from './portalService';

type CheerBindings = { DB: D1Database; PORTAL_ENABLED?: string };
type RankingRow = { id: number; slug: string; display_name: string; profile_image_url: string | null; event_type: string; total_cheers: number; weekly_cheers: number; is_verified: number; platform: PortalProfile['platform']; channel_url: string };

export const CHEER_ALREADY_DONE_MESSAGE = '오늘의 응원을 이미 완료했습니다. 자정에 다시 투표해 주세요!';
export const WEEKLY_RESET_CRON = '0 15 * * SUN';
const RANKING_LIMIT = 10;
const DAILY_IP_CHEER_LIMIT = 60;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 응원 기록의 하루 기준은 한국 시간(KST) 자정이다.
export function kstDateKey(now: number = Date.now()): string {
  return new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
}

// 개인 식별 값의 원문을 저장하지 않도록 단방향 해시로 바꾼다.
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// 같은 기기의 하루 1회 응원을 판별하는 기준 값을 만든다.
export async function buildClientHash(ip: string, userAgent: string, fingerprint: string): Promise<string> {
  return sha256Hex(`${ip}|${userAgent.slice(0, 300)}|${fingerprint.slice(0, 100)}`);
}

// 개발 환경에서만 응원·랭킹 기능을 연다.
const devOnly: MiddlewareHandler = async (c, next) => {
  if (!portalPageSeo(new URL(c.req.url)).development) return c.json({ error: '페이지를 찾을 수 없습니다.' }, 404);
  await next();
};

// 숫자 id 또는 공개 주소(slug)로 응원 대상 프로필을 찾는다.
export async function resolveVtuberId(db: D1Database, idOrSlug: string): Promise<number | null> {
  const numericId = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : -1;
  const row = await db.prepare('SELECT id FROM streamerChannel_info WHERE id = ? OR slug = ? LIMIT 1').bind(numericId, idOrSlug).first<{ id: number }>();
  return row ? row.id : null;
}

// 같은 네트워크에서 하루에 보낼 수 있는 응원 수를 넘었는지 확인한다.
export async function isIpCheerLimitReached(db: D1Database, ipHash: string, votedDate: string): Promise<boolean> {
  const row = await db.prepare('SELECT COUNT(*) AS count FROM cheer_logs WHERE ip_hash = ? AND voted_date = ?').bind(ipHash, votedDate).first<{ count: number }>();
  return (row?.count || 0) >= DAILY_IP_CHEER_LIMIT;
}

// 고유 인덱스 위반(같은 날 중복 응원)인지 구분한다.
export function isDuplicateCheerError(error: unknown): boolean {
  return /UNIQUE/i.test(error instanceof Error ? error.message : String(error));
}

// 로그 기록과 집계 증가를 한 묶음으로 처리해 둘 중 하나만 반영되지 않게 한다.
export async function recordCheer(db: D1Database, vtuberId: number, clientHash: string, ipHash: string, votedDate: string): Promise<'RECORDED' | 'DUPLICATE'> {
  try {
    await db.batch([
      db.prepare('INSERT INTO cheer_logs(vtuber_id, client_hash, ip_hash, voted_date) VALUES(?,?,?,?)').bind(vtuberId, clientHash, ipHash, votedDate),
      db.prepare('UPDATE streamerChannel_info SET weekly_cheers = weekly_cheers + 1, total_cheers = total_cheers + 1 WHERE id = ?').bind(vtuberId),
    ]);
    return 'RECORDED';
  } catch (error) {
    if (isDuplicateCheerError(error)) return 'DUPLICATE';
    throw error;
  }
}

// 응원 직후 화면에 보여줄 최신 집계를 읽는다.
export async function readCheerTotals(db: D1Database, vtuberId: number): Promise<{ weeklyCheers: number; totalCheers: number }> {
  const row = await db.prepare('SELECT weekly_cheers, total_cheers FROM streamerChannel_info WHERE id = ?').bind(vtuberId).first<{ weekly_cheers: number; total_cheers: number }>();
  return { weeklyCheers: row?.weekly_cheers || 0, totalCheers: row?.total_cheers || 0 };
}

// 주간 응원 수 기준 상위 목록을 최근 데뷔 순으로 동점 정리해 읽는다.
export async function readWeeklyRanking(db: D1Database) {
  const result = await db.prepare(
    `SELECT i.id, i.slug, i.display_name, i.profile_image_url, i.event_type, i.total_cheers, i.weekly_cheers, i.is_verified, c.platform, c.channel_url
     FROM streamerChannel_info i JOIN streamerChannel c ON c.id = i.channel_id
     WHERE i.slug IS NOT NULL AND i.slug != ''
     ORDER BY i.weekly_cheers DESC, i.start_at_utc DESC, i.id DESC LIMIT ?`
  ).bind(RANKING_LIMIT).all<RankingRow>();
  return (result.results || []).map((row, index) => ({
    rank: index + 1, id: row.id, slug: row.slug, displayName: row.display_name, avatarUrl: portalWebUrl(row.profile_image_url || ''),
    platform: row.platform, channelUrl: portalChannelUrl(row.channel_url || '', row.platform), eventType: row.event_type,
    weeklyCheers: row.weekly_cheers, totalCheers: row.total_cheers, isVerified: row.is_verified === 1,
  }));
}

// 매주 월요일 00:00(KST) 주간 응원 수를 새로 시작한다.
export async function resetWeeklyCheers(db: D1Database): Promise<void> {
  await db.prepare('UPDATE streamerChannel_info SET weekly_cheers = 0 WHERE weekly_cheers != 0').run();
}

// 요청 본문이 비어 있어도 안전하게 읽는다.
async function readOptionalJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body as Record<string, unknown> : {};
  } catch { return {}; }
}

// 팬의 제보를 기존 접수 흐름(검증·중복·접수 제한)에 '검토 대기'로 전달한다.
export function buildReportRequest(source: Request, origin: string, body: Record<string, unknown>): Request {
  const role = ['SELF', 'AGENCY', 'FAN'].includes(String(body.requesterRole)) ? body.requesterRole : 'FAN';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const name of ['CF-Connecting-IP', 'Origin', 'X-Submission-Key']) { const value = source.headers.get(name); if (value) headers.set(name, value); }
  return new Request(new URL('/requests', origin), { method: 'POST', headers, body: JSON.stringify({ ...body, kind: 'DEBUT', requesterRole: role }) });
}

export const cheerApi = new Hono<{ Bindings: CheerBindings }>();

// 주간 상위 10명은 DB 부하를 줄이기 위해 60초 캐시한다.
cheerApi.get('/api/rankings/weekly', devOnly, async (c) => {
  const key = new URL('/api/rankings/weekly?cache=v1', c.req.url);
  try {
    return await publicResponseCache(c.req.raw, key, 60, async () => c.json({ rankings: await readWeeklyRanking(c.env.DB) }), (promise) => c.executionCtx.waitUntil(promise));
  } catch {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: '랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }, 503);
  }
});

// 같은 기기는 같은 버튜버에게 하루(KST) 1회만 응원할 수 있다.
cheerApi.post('/api/vtubers/:id/cheer', devOnly, async (c) => {
  c.header('Cache-Control', 'no-store');
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: '요청을 확인해 주세요.' }, 403);
  const vtuberId = await resolveVtuberId(c.env.DB, c.req.param('id'));
  if (!vtuberId) return c.json({ error: '버튜버를 찾을 수 없어요.' }, 404);
  const body = await readOptionalJson(c.req.raw);
  const ip = c.req.header('CF-Connecting-IP') || 'local';
  const votedDate = kstDateKey();
  const [clientHash, ipHash] = await Promise.all([
    buildClientHash(ip, c.req.header('User-Agent') || '', typeof body.fingerprint === 'string' ? body.fingerprint : ''),
    sha256Hex(ip),
  ]);
  if (await isIpCheerLimitReached(c.env.DB, ipHash, votedDate)) return c.json({ error: CHEER_ALREADY_DONE_MESSAGE }, 429);
  if (await recordCheer(c.env.DB, vtuberId, clientHash, ipHash, votedDate) === 'DUPLICATE') return c.json({ error: CHEER_ALREADY_DONE_MESSAGE }, 429);
  return c.json({ ok: true, ...(await readCheerTotals(c.env.DB, vtuberId)) });
});

// 로그인 없이 스트리머 본인과 팬 모두 일정을 제보할 수 있다(검토 후 공개).
cheerApi.post('/api/schedules/report', devOnly, async (c) => {
  c.header('Cache-Control', 'no-store');
  const body = await readOptionalJson(c.req.raw);
  const forwarded = await portalApi.fetch(buildReportRequest(c.req.raw, new URL(c.req.url).origin, body), c.env, c.executionCtx);
  const result = await forwarded.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  return c.json(forwarded.ok ? { ...result, status: 'PENDING' } : result, forwarded.status as 200);
});
