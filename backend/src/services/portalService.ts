import { readPortalProfiles, readPortalProfileBySlug, readPublicPortalProfiles, readPublicPortalProfileBySlug } from './portalProfileRepository';
import { isPublicProfile, reviewedProfile } from '../../../shared/contentReview';
import { cleanProfilePresentation } from '../../../shared/profilePresentation';
import { readProfileBroadcast } from './portalProfileDetail';
import { broadcastNewDebutToDiscord } from './discordBotService';
import { portalProfileEvent } from './unifiedEventService';
export { readPortalProfiles, readPortalProfileBySlug, readPublicPortalProfiles, readPublicPortalProfileBySlug } from './portalProfileRepository';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { verifyAdminLogin, validateAdminToken } from './adminAuthService';
import { generateCleanSlug } from '../utils/slugUtils';
import { PortalProfile, PortalRequest, RequestKind, PORTAL_PLATFORMS, PORTAL_TIMEZONES, REGISTRATION_REGIONS, portalChannelKey, portalChannelUrl, portalWebUrl, portalUtc } from '../../../shared/portal';

type PortalBindings = { DB: D1Database; PORTAL_ENABLED?: string; DISCORD_BOT_TOKEN?: string };
// 최대 12개 영상과 소식·팬 안내를 담되 요청 전체 크기는 제한한다.
const PORTAL_BODY_LIMIT = 65536;
type RequestRow = { id: string; kind: RequestKind; status: PortalRequest['status']; slug: string; payload: string; token_hash: string; note: string; created_at: string };

// 확인 키의 원문 대신 단방향 해시만 보관한다.
export async function portalTokenHash(token: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// 비공개 확인 키를 충분한 난수로 발급한다.
function newPortalToken(): string {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
}

// 요청에서 허용한 길이의 문자열만 사용한다.
function field(body: Record<string, unknown>, key: string, max = 200): string {
  return typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, max) : '';
}

// 기존 CMS에서도 새 승인 소개를 같은 목록으로 관리할 수 있도록 변환한다.
export async function portalAdminStreamers(db: D1Database) {
  return (await readPortalProfiles(db)).map((profile) => ({ info_id: profile.slug, slug: profile.slug,
    display_name: profile.displayName, profile_image_url: profile.avatarUrl, description: profile.description,
    agency_name: profile.agency, country_code: profile.countryCode, x_url: profile.xUrl, platform: profile.platform,
    channel_url: profile.channelUrl, channel_name: profile.displayName, debut_date: profile.debutDate,
    debut_time: profile.debutTime, timezone: profile.timezone, start_at_utc: profile.startAtUtc,
  }));
}

// 관리자가 삭제한 소개가 다른 공개 저장소에서 다시 나타나지 않도록 함께 삭제한다.
export async function deletePortalProfile(db: D1Database, slug: string): Promise<boolean> {
  const exists = await db.prepare('SELECT slug FROM streamerChannel_info WHERE slug=? UNION SELECT slug FROM portal_profiles WHERE slug=? LIMIT 1').bind(slug, slug).first();
  if (!exists) return false;
  await db.batch([
    db.prepare('DELETE FROM streamerChannel WHERE id IN (SELECT channel_id FROM streamerChannel_info WHERE slug=?)').bind(slug),
    db.prepare('DELETE FROM streamerChannel_info WHERE slug=?').bind(slug),
    db.prepare('DELETE FROM portal_profiles WHERE slug=?').bind(slug),
    db.prepare('DELETE FROM portal_profile_channels WHERE slug=?').bind(slug),
  ]);
  return true;
}

// 등록 정보와 현지 일정의 유효성을 한곳에서 확인한다.
export function cleanPortalProfile(body: Record<string, unknown>): PortalProfile {
  const platform = field(body, 'platform') as PortalProfile['platform'];
  const dateState = field(body, 'dateState') as PortalProfile['dateState'];
  const timezone = field(body, 'timezone') || 'Asia/Seoul';
  const debutDate = field(body, 'debutDate');
  const debutTime = field(body, 'debutTime');
  const targetMonth = field(body, 'targetMonth');
  const channelUrl = portalChannelUrl(field(body, 'channelUrl', 1000), platform);
  if (!field(body, 'displayName', 80) || !PORTAL_PLATFORMS.some((p) => p.id === platform) || !channelUrl) throw new Error('활동명과 올바른 방송 채널 주소를 입력해 주세요.');
  if (!['FIXED', 'TIME_TBD', 'DATE_TBD', 'NONE'].includes(dateState) || !PORTAL_TIMEZONES.includes(timezone)) throw new Error('일정 상태와 시간대를 확인해 주세요.');
  const startAtUtc = dateState === 'FIXED' ? portalUtc(debutDate, debutTime, timezone) : '';
  if (dateState === 'FIXED' && !startAtUtc) throw new Error('선택한 시간대에서 유효한 날짜와 시간을 입력해 주세요.');
  if (dateState === 'TIME_TBD' && !portalUtc(debutDate, '12:00', timezone)) throw new Error('데뷔 날짜를 입력해 주세요.');
  if (dateState === 'DATE_TBD' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) throw new Error('데뷔 예정 월을 입력해 주세요.');
  const list = (key: string) => Array.isArray(body[key]) ? (body[key] as unknown[]).filter((v): v is string => typeof v === 'string').map((v) => v.trim().slice(0, 40)).filter(Boolean).slice(0, 8) : [];
  const countryCode = field(body, 'countryCode');
  if (countryCode && !['KR', 'JP', 'US', 'GB', 'TW', 'OTHER'].includes(countryCode)) throw new Error('활동 국가를 확인해 주세요.');
  return { ...cleanProfilePresentation(body), slug: '', displayName: field(body, 'displayName', 80), description: field(body, 'description', 2000), avatarUrl: portalWebUrl(field(body, 'avatarUrl', 1000)),
    platform, channelUrl, countryCode, languages: list('languages'), tags: list('tags'), agency: field(body, 'agency', 100), xUrl: portalWebUrl(field(body, 'xUrl', 1000)),
    dateState, debutDate: ['FIXED', 'TIME_TBD'].includes(dateState) ? debutDate : '', debutTime: dateState === 'FIXED' ? debutTime : '', timezone, startAtUtc,
    targetMonth: dateState === 'DATE_TBD' ? targetMonth : debutDate.slice(0, 7), ownerVerified: false, source: 'REGISTERED' };
}

// 소유권은 승인된 신청의 비공개 키가 일치할 때만 인정한다.
export async function portalOwner(db: D1Database, slug: string, token: string): Promise<boolean> {
  if (!token || token.length > 128) return false;
  return Boolean(await db.prepare("SELECT id FROM portal_requests WHERE kind='CLAIM' AND status='APPROVED' AND slug=? AND token_hash=? LIMIT 1").bind(slug, await portalTokenHash(token)).first());
}

// 관리자는 비밀번호 확인 후 발급된 별도 세션으로 인증한다.
async function portalAdmin(db: D1Database, token: string): Promise<boolean> {
  if (!token || token.length > 128) return false;
  return validateAdminToken(token, db);
}

// 확인 화면에 필요한 접수 정보만 직렬화한다.
function publicRequest(row: RequestRow): PortalRequest {
  return { id: row.id, kind: row.kind, status: row.status, slug: row.slug, payload: JSON.parse(row.payload), note: row.note, createdAt: row.created_at };
}

// 접수별 등록·소유권·문의 내용을 검증한다.
function cleanRequest(kind: RequestKind, body: Record<string, unknown>): Record<string, unknown> {
  if (kind === 'DEBUT' || kind === 'PROFILE') {
    const profile = cleanPortalProfile(body);
    const role = field(body, 'requesterRole');
    if (!['SELF', 'AGENCY', 'FAN'].includes(role)) throw new Error('신청자 구분을 선택해 주세요.');
    if (!profile.description.trim()) throw new Error('채널 소개를 입력해 주세요.');
    const region = REGISTRATION_REGIONS.find((item) => item.code === profile.countryCode);
    if (!region || !(region.zones as readonly string[]).includes(profile.timezone)) throw new Error('국가와 시간대를 확인해 주세요.');
    if (!portalChannelKey(profile.channelUrl, profile.platform)) throw new Error('영상 주소 대신 방송 채널 주소를 입력해 주세요.');
    if (kind === 'DEBUT' && profile.dateState === 'NONE') throw new Error('데뷔 일정 또는 예정 월을 입력해 주세요.');
    return { ...profile, requesterRole: role, contactEmail: field(body, 'contactEmail', 200) };
  }
  if (kind === 'CLAIM') {
    const evidence = portalWebUrl(field(body, 'evidenceUrl', 1000));
    if (!evidence || !field(body, 'message', 2000)) throw new Error('확인 문구를 게시한 채널 주소와 신청 내용을 입력해 주세요.');
    return { evidenceUrl: evidence, message: field(body, 'message', 2000), contactEmail: field(body, 'contactEmail', 200) };
  }
  if (kind === 'CONTACT') {
    if (!field(body, 'message', 2000)) throw new Error('문의 내용을 입력해 주세요.');
    return { subject: field(body, 'subject'), message: field(body, 'message', 2000), contactEmail: field(body, 'contactEmail', 200), pageUrl: portalWebUrl(field(body, 'pageUrl', 1000)) };
  }
  throw new Error('지원하지 않는 신청입니다.');
}

export const portalApi = new Hono<{ Bindings: PortalBindings }>();

// 새 플랫폼 API는 명시적으로 활성화한 환경에서만 제공한다.
portalApi.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  if (c.env.PORTAL_ENABLED !== 'true') return c.json({ error: '페이지를 찾을 수 없습니다.' }, 404);
  if (!c.env.DB) return c.json({ error: '잠시 후 다시 시도해 주세요.' }, 503);
  if (!['GET', 'HEAD'].includes(c.req.method)) {
    const origin = c.req.header('Origin');
    if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: '요청을 확인해 주세요.' }, 403);
    if (Number(c.req.header('Content-Length') || 0) > PORTAL_BODY_LIMIT) return c.json({ error: '입력 내용이 너무 깁니다.' }, 413);
  }
  await next();
});
portalApi.onError((error, c) => { console.error('[portal]', error.message); return c.json({ error: '요청을 처리하지 못했습니다. 다시 시도해 주세요.' }, 500); });
// Content-Length가 없는 요청도 실제 본문 크기를 제한한다.
portalApi.use('*', bodyLimit({ maxSize: PORTAL_BODY_LIMIT, onError: (c) => c.json({ error: '입력 내용이 너무 깁니다.' }, 413) }));

// 공개 프로필은 실제 DB 결과만 반환한다.
portalApi.get('/profiles', async (c) => {
  // 개인 신청과 분리한 공개 소개만 짧게 재사용한다.
  c.header('Cache-Control', 'no-store');
  try {
    return c.json({ profiles: await readPublicPortalProfiles(c.env.DB) });
  } catch {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: '소개를 불러오지 못했습니다. 다시 시도해 주세요.' }, 503);
  }
});

// 소개 상세에는 검토한 저장 배너만 제공하고 외부 원문은 가져오지 않는다.
// 상세 단건 조회는 공개 검토를 통과한 저장 정보와 최근 방송 상태를 함께 반환한다.
portalApi.get('/profiles/:slug/detail', async (c) => {
  c.header('Cache-Control', 'no-store');
  try {
    const profile = await readPublicPortalProfileBySlug(c.env.DB, c.req.param('slug'));
    if (!profile) return c.json({ error: '소개를 찾을 수 없습니다.' }, 404);
    return c.json({ profile, broadcast: await readProfileBroadcast(profile) });
  } catch {
    return c.json({ error: '소개를 불러오지 못했습니다. 다시 시도해 주세요.' }, 503);
  }
});

portalApi.get('/profiles/:slug/banner', async (c) => {
  c.header('Cache-Control', 'no-store');
  const slug = c.req.param('slug');
  try {
      const profile = await readPublicPortalProfileBySlug(c.env.DB, slug);
      if (!profile) { c.header('Cache-Control', 'no-store'); return c.json({ error: '소개를 찾을 수 없습니다.' }, 404); }
      // 외부 채널의 변경된 배너·소개를 검토 없이 다시 끌어오지 않는다.
      return c.json({ bannerUrl: profile.bannerUrl || '', mobileBannerUrl: '', description: '' });
  } catch (error) {
    // 외부 응답 본문 대신 오류 종류만 기록해 배너 장애 원인을 추적한다.
    console.warn(JSON.stringify({ event: 'soop_banner_unavailable', reason: error instanceof Error ? error.message : 'unknown' }));
    c.header('Cache-Control', 'no-store');
    return c.json({ error: '배너를 불러오지 못했습니다.' }, 503);
  }
});

// 개인 접수는 원문 확인 키를 헤더로 제출해야 조회할 수 있다.
portalApi.get('/requests/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM portal_requests WHERE id=? AND token_hash=?').bind(c.req.param('id'), await portalTokenHash(c.req.header('X-Request-Key') || '')).first<RequestRow>();
  return row ? c.json({ request: publicRequest(row) }) : c.json({ error: '접수 번호와 비공개 확인 키를 확인해 주세요.' }, 404);
});

// 새 신청에는 조회용 키를 발급하고 IP별 과도한 접수를 제한한다.
portalApi.post('/requests', async (c) => {
  const raw = await c.req.text();
  if (raw.length > PORTAL_BODY_LIMIT) return c.json({ error: '입력 내용이 너무 깁니다.' }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return c.json({ error: '입력 내용을 확인해 주세요.' }, 400); }
  if (!body || typeof body !== 'object' || body.website) return c.json({ error: '입력 내용을 확인해 주세요.' }, 400);
  const kind = field(body, 'kind') as RequestKind;
  const slug = field(body, 'slug', 150);
  let payload: Record<string, unknown>;
  try { payload = cleanRequest(kind, body); } catch (error) { return c.json({ error: (error as Error).message }, 400); }
  const registration = kind === 'DEBUT' || kind === 'PROFILE';
  const submissionKey = c.req.header('X-Submission-Key') || '';
  if (registration && submissionKey && !/^[a-f0-9-]{36}$/i.test(submissionKey)) return c.json({ error: '신청 정보를 새로 확인해 주세요.' }, 400);
  const keyHash = submissionKey ? await portalTokenHash(submissionKey) : '';
  const payloadHash = await portalTokenHash(JSON.stringify({ kind, payload }));
  // 응답을 받지 못한 동일 신청은 개인정보 확인 키를 다시 노출하지 않고 성공으로 응답한다.
  if (registration && keyHash) {
    const prior = await c.env.DB.prepare('SELECT request_id,payload_hash FROM portal_submission_keys WHERE key_hash=?').bind(keyHash).first<{ request_id: string; payload_hash: string }>();
    if (prior) return prior.payload_hash === payloadHash ? c.json({ id: prior.request_id, duplicate: true }) : c.json({ error: '신청 내용이 변경됐습니다. 다시 신청해 주세요.' }, 409);
  }
  const channelKey = registration ? portalChannelKey(String(payload.channelUrl), String(payload.platform)) : '';
  if (registration) {
    const duplicate = (await readPortalProfiles(c.env.DB)).some((p) => portalChannelKey(p.channelUrl, p.platform) === channelKey);
    if (duplicate) return c.json({ error: '이미 등록된 채널입니다. 정보 변경은 문의로 알려주세요.' }, 409);
    const pending = await c.env.DB.prepare('SELECT request_id FROM portal_pending_channels WHERE channel_key=?').bind(channelKey).first();
    if (pending) return c.json({ error: '이미 검토 중인 채널입니다. 정보 변경은 문의로 알려주세요.' }, 409);
    // 이전 버전에서 받은 대기 신청도 주소 별칭을 포함해 대조한다.
    const oldPending = await c.env.DB.prepare("SELECT payload FROM portal_requests WHERE status='PENDING' AND kind IN ('DEBUT','PROFILE')").all<{ payload: string }>();
    if ((oldPending.results || []).some((row) => { const p = JSON.parse(row.payload); return portalChannelKey(p.channelUrl, p.platform) === channelKey; })) return c.json({ error: '이미 검토 중인 채널입니다. 정보 변경은 문의로 알려주세요.' }, 409);
  }
  const requester = await portalTokenHash(c.req.header('CF-Connecting-IP') || 'local');
  const count = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM portal_requests WHERE requester_hash=? AND created_at>datetime('now','-1 hour')").bind(requester).first<{ count: number }>();
  if ((count?.count || 0) >= 10) return c.json({ error: '접수가 많습니다. 잠시 후 다시 시도해 주세요.' }, 429);
  if (kind === 'CLAIM' && !(await readPortalProfileBySlug(c.env.DB, slug))) return c.json({ error: '버튜버 소개를 찾을 수 없습니다.' }, 404);
  const id = crypto.randomUUID();
  const token = newPortalToken();
  const insert = c.env.DB.prepare('INSERT INTO portal_requests(id,kind,slug,payload,token_hash,requester_hash) VALUES(?,?,?,?,?,?)').bind(id, kind, slug, JSON.stringify(payload), await portalTokenHash(token), requester);
  const statements = [insert];
  if (registration) statements.push(c.env.DB.prepare('INSERT INTO portal_pending_channels(channel_key,request_id) VALUES(?,?)').bind(channelKey, id));
  if (registration && keyHash) statements.push(c.env.DB.prepare('INSERT INTO portal_submission_keys(key_hash,payload_hash,request_id) VALUES(?,?,?)').bind(keyHash, payloadHash, id));
  try { await c.env.DB.batch(statements); }
  catch (error) {
    // 고유 키 경쟁에서 패한 요청은 배치 전체가 취소되며 같은 제출만 기존 접수로 연결한다.
    const prior = keyHash ? await c.env.DB.prepare('SELECT request_id,payload_hash FROM portal_submission_keys WHERE key_hash=?').bind(keyHash).first<{ request_id: string; payload_hash: string }>() : null;
    if (prior?.payload_hash === payloadHash) return c.json({ id: prior.request_id, duplicate: true });
    if (registration && await c.env.DB.prepare('SELECT request_id FROM portal_pending_channels WHERE channel_key=?').bind(channelKey).first()) return c.json({ error: '이미 검토 중인 채널입니다. 정보 변경은 문의로 알려주세요.' }, 409);
    throw error;
  }
  return c.json({ id, token }, 201);
});

// 승인된 소유자에게 현재 관리 권한을 알려준다.
portalApi.get('/profiles/:slug/access', async (c) => c.json({ owner: await portalOwner(c.env.DB, c.req.param('slug'), c.req.header('X-Request-Key') || '') }));

// 소유자만 소개·일정을 수정하며 공개 주소는 유지한다.
portalApi.put('/profiles/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (!await portalOwner(c.env.DB, slug, c.req.header('X-Request-Key') || '')) return c.json({ error: '승인된 소유권 확인 키가 필요합니다.' }, 403);
  let profile: PortalProfile;
  try { profile = cleanPortalProfile(await c.req.json()); } catch (error) { return c.json({ error: (error as Error).message }, 400); }
  const original = await readPortalProfileBySlug(c.env.DB, slug);
  if (!original) return c.json({ error: '소개를 찾을 수 없습니다.' }, 404);
  if (profile.channelUrl !== original.channelUrl || profile.platform !== original.platform) return c.json({ error: '방송 채널 변경은 문의를 통해 신청해 주세요.' }, 400);
  // 소유자 수정은 관리자만 지정할 수 있는 데뷔 그룹과 등록 출처를 보존한다.
  profile = { ...profile, slug, ownerVerified: true, source: original.source, requesterRole: original.requesterRole,
    debutGroupId: original.debutGroupId, debutGroupName: original.debutGroupName, media: profile.media ?? original.media,
    ...(profile.details === undefined && original.details !== undefined ? { details: original.details } : {}) };
  await c.env.DB.prepare('INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?) ON CONFLICT(slug) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP').bind(slug, profile.channelUrl, JSON.stringify(profile)).run();
  return c.json({ profile });
});

// 관리자 세션은 기존 계정 비밀번호 확인 후 난수로 발급한다.
portalApi.post('/admin/login', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const requester = await portalTokenHash(`login:${c.req.header('CF-Connecting-IP') || 'local'}`);
  const attempts = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM portal_requests WHERE requester_hash=? AND created_at>datetime('now','-15 minutes')").bind(requester).first<{ count: number }>();
  if ((attempts?.count || 0) >= 8) return c.json({ error: '잠시 후 다시 로그인해 주세요.' }, 429);
  const result = await verifyAdminLogin(c.env.DB, field(body, 'username'), field(body, 'password', 200));
  if (!result.success) {
    await c.env.DB.prepare("INSERT INTO portal_requests(id,kind,status,payload,token_hash,requester_hash) VALUES(?,'CONTACT','REJECTED','{}','',?)").bind(crypto.randomUUID(), requester).run();
    return c.json({ error: '아이디와 비밀번호를 확인해 주세요.' }, 401);
  }
  return c.json({ token: result.token });
});

// 관리자 목록은 개인 접수 키를 반환하지 않는다.
portalApi.get('/admin/requests', async (c) => {
  if (!await portalAdmin(c.env.DB, c.req.header('X-Admin-Key') || '')) return c.json({ error: '관리자 로그인이 필요합니다.' }, 401);
  const rows = await c.env.DB.prepare("SELECT * FROM portal_requests WHERE token_hash != '' ORDER BY created_at DESC LIMIT 300").all<RequestRow>();
  return c.json({ requests: (rows.results || []).map(publicRequest) });
});

// 관리 목록에는 공개 정보와 동시 수정 감지용 버전만 반환한다.
portalApi.get('/admin/profiles', async (c) => {
  if (!await portalAdmin(c.env.DB, c.req.header('X-Admin-Key') || '')) return c.json({ error: '관리자 로그인이 필요합니다.' }, 401);
  const profiles = await readPortalProfiles(c.env.DB);
  return c.json({ profiles: await Promise.all(profiles.map(async (profile) => ({ profile, revision: await portalTokenHash(JSON.stringify(profile)) }))) });
});

// 변경 전후 원문은 인증된 관리자에게만 제공한다.
portalApi.get('/admin/profiles/:slug/history', async (c) => {
  if (!await portalAdmin(c.env.DB, c.req.header('X-Admin-Key') || '')) return c.json({ error: '관리자 로그인이 필요합니다.' }, 401);
  const rows = await c.env.DB.prepare('SELECT id,before_data,reason,created_at FROM portal_profile_history WHERE slug=? ORDER BY created_at DESC,rowid DESC LIMIT 30').bind(c.req.param('slug')).all<{ id: string; before_data: string; reason: string; created_at: string }>();
  return c.json({ history: (rows.results || []).map((row) => ({ id: row.id, before: JSON.parse(row.before_data), reason: row.reason, createdAt: row.created_at })) });
});

// 운영 정정은 채널·주소·신청 출처를 보존하며 이전 내용과 새 내용을 원자적으로 기록한다.
portalApi.put('/admin/profiles/:slug', async (c) => {
  const adminKey = c.req.header('X-Admin-Key') || '';
  if (!await portalAdmin(c.env.DB, adminKey)) return c.json({ error: '관리자 로그인이 필요합니다.' }, 401);
  const slug = c.req.param('slug');
  const body = await c.req.json<Record<string, unknown>>();
  const original = await readPortalProfileBySlug(c.env.DB, slug);
  if (!original) return c.json({ error: '소개를 찾을 수 없습니다.' }, 404);
  if (field(body, 'revision', 100) !== await portalTokenHash(JSON.stringify(original))) return c.json({ error: '다른 운영자가 수정했습니다. 목록을 새로고침해 주세요.' }, 409);
  const reason = field(body, 'reason', 1000);
  if (!reason) return c.json({ error: '변경 사유를 입력해 주세요.' }, 400);
  let profile: PortalProfile;
  try { profile = cleanPortalProfile(body.profile as Record<string, unknown>); } catch (error) { return c.json({ error: (error as Error).message || '활동명과 일정 정보를 확인해 주세요.' }, 400); }
  if (profile.channelUrl !== original.channelUrl || profile.platform !== original.platform) return c.json({ error: '기존 방송 채널 주소를 유지해 주세요.' }, 400);
  profile = { ...profile, slug, source: original.source, ownerVerified: original.ownerVerified, media: profile.media ?? original.media,
    ...(profile.details === undefined && original.details !== undefined ? { details: original.details } : {}), ...(original.requesterRole ? { requesterRole: original.requesterRole } : {}) };
  // 팀·기수 연결은 관리자 정정 경로에서만 허용하고 이름과 식별자를 함께 받는다.
  const group = body.profile as Record<string, unknown>;
  const debutGroupId = field(group, 'debutGroupId', 80);
  const debutGroupName = field(group, 'debutGroupName', 100);
  if (Boolean(debutGroupId) !== Boolean(debutGroupName) || (debutGroupId && !/^[a-z0-9_-]+$/.test(debutGroupId))) return c.json({ error: '데뷔 그룹 이름과 영문·숫자 식별자를 함께 입력해 주세요.' }, 400);
  profile = { ...profile, debutGroupId, debutGroupName };
  // 공개 결정은 인증된 운영자의 명시적인 콘텐츠 확인을 요구한다.
  if (body.publicationState === 'APPROVED' && body.contentChecked !== true) return c.json({ error: '활동명·소개·이미지·영상과 사용 권한을 확인해 주세요.' }, 400);
  profile = reviewedProfile(profile, body.publicationState === 'APPROVED' ? 'APPROVED' : 'HOLD', new Date().toISOString());
  if (profile.contentReview?.state === 'APPROVED' && !isPublicProfile(profile)) return c.json({ error: '영상 제목 형태의 활동명이나 재검토가 필요한 소개를 먼저 정정해 주세요.' }, 400);
  const existing = await c.env.DB.prepare('SELECT data FROM portal_profiles WHERE slug=?').bind(slug).first<{ data: string }>();
  // 화면에서 확인한 버전과 저장 직전 버전이 다르면 이전 정보로 덮어쓰지 않는다.
  if (existing && await portalTokenHash(existing.data) !== field(body, 'revision', 100)) return c.json({ error: '다른 운영자가 수정했습니다. 목록을 새로고침해 주세요.' }, 409);
  const oldData = existing?.data || '';
  const data = JSON.stringify(profile);
  const guard = "COALESCE((SELECT data FROM portal_profiles WHERE slug=?),'')=? AND (EXISTS(SELECT 1 FROM portal_profiles WHERE slug=?) OR EXISTS(SELECT 1 FROM streamerChannel_info WHERE slug=?))";
  const results = await c.env.DB.batch([
    c.env.DB.prepare(`INSERT INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash) SELECT ?,?,?,?,?,? WHERE ${guard}`).bind(crypto.randomUUID(), slug, JSON.stringify(original), data, reason, await portalTokenHash(adminKey), slug, oldData, slug, slug),
    c.env.DB.prepare(`INSERT INTO portal_profiles(slug,channel_url,data) SELECT ?,?,? WHERE ${guard} ON CONFLICT(slug) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP`).bind(slug, original.channelUrl, data, slug, oldData, slug, slug),
  ]);
  if (!results[0].meta.changes) return c.json({ error: '다른 운영자가 수정했습니다. 목록을 새로고침해 주세요.' }, 409);
  return c.json({ profile, revision: await portalTokenHash(data) });
});

// 로그아웃 시 서버의 관리 세션도 만료시킨다.
portalApi.post('/admin/logout', async (c) => {
  await c.env.DB.prepare('DELETE FROM portal_sessions WHERE token_hash=?').bind(await portalTokenHash(c.req.header('X-Admin-Key') || '')).run();
  return c.json({ success: true });
});

// 관리자가 증빙을 검토한 요청만 공개 또는 소유권 승인 처리한다.
portalApi.post('/admin/requests/:id/decision', async (c) => {
  if (!await portalAdmin(c.env.DB, c.req.header('X-Admin-Key') || '')) return c.json({ error: '관리자 로그인이 필요합니다.' }, 401);
  const body = await c.req.json<Record<string, unknown>>();
  const status = body.status === 'APPROVED' ? 'APPROVED' : body.status === 'REJECTED' ? 'REJECTED' : '';
  if (!status) return c.json({ error: '처리 상태를 확인해 주세요.' }, 400);
  const row = await c.env.DB.prepare('SELECT * FROM portal_requests WHERE id=?').bind(c.req.param('id')).first<RequestRow>();
  if (!row) return c.json({ error: '신청을 찾을 수 없습니다.' }, 404);
  if (row.status !== 'PENDING') return c.json({ error: '이미 처리된 신청입니다.' }, 409);
  const statements: D1PreparedStatement[] = [];
  let slug = row.slug;
  let published: PortalProfile | undefined;
  if (status === 'APPROVED' && ['DEBUT', 'PROFILE', 'CLAIM'].includes(row.kind)) {
    const profiles = await readPortalProfiles(c.env.DB);
    let profile: PortalProfile;
    if (row.kind === 'CLAIM') {
      const original = profiles.find((p) => p.slug === slug);
      if (!original || body.proofChecked !== true) return c.json({ error: '공식 채널 증빙을 확인하고 확인란을 선택해 주세요.' }, 400);
      profile = { ...original, ownerVerified: true };
    } else {
      if (body.contentChecked !== true) return c.json({ error: '활동명·소개·이미지·영상과 사용 권한을 확인해 주세요.' }, 400);
      profile = cleanPortalProfile(JSON.parse(row.payload));
      const duplicate = profiles.find((p) => portalChannelKey(p.channelUrl, p.platform) === portalChannelKey(profile.channelUrl, profile.platform));
      if (duplicate) return c.json({ error: '이미 등록된 채널입니다. 기존 소개의 정보 정정 문의를 안내해 주세요.' }, 409);
      const base = generateCleanSlug(profile.displayName, profile.channelUrl, profile.xUrl).replace(/[^a-z0-9_-]/gi, '').slice(0, 70) || 'vtuber';
      slug = profiles.some((p) => p.slug === base) ? `${base}-${crypto.randomUUID().slice(0, 8)}` : base;
      const role = JSON.parse(row.payload).requesterRole;
      profile = { ...profile, slug, ...(['SELF', 'AGENCY', 'FAN'].includes(role) ? { requesterRole: role } : {}) };
      profile = reviewedProfile(profile, 'APPROVED', new Date().toISOString());
      if (!isPublicProfile(profile)) return c.json({ error: '영상 제목 형태의 활동명이나 재검토가 필요한 소개를 먼저 정정해 주세요.' }, 400);
      statements.push(c.env.DB.prepare("INSERT INTO portal_profile_channels(channel_key,slug) SELECT ?,? WHERE EXISTS(SELECT 1 FROM portal_requests WHERE id=? AND status='PENDING')").bind(portalChannelKey(profile.channelUrl, profile.platform), slug, row.id));
    }
    statements.push(c.env.DB.prepare('INSERT INTO portal_profiles(slug,channel_url,data) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM portal_requests WHERE id=? AND status=\'PENDING\') ON CONFLICT(slug) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP').bind(slug, profile.channelUrl, JSON.stringify(profile), row.id));
    published = profile;
  }
  const note = field(body, 'note', 1000);
  if (status === 'REJECTED' && !note) return c.json({ error: '보완이 필요한 내용을 입력해 주세요.' }, 400);
  statements.push(c.env.DB.prepare('DELETE FROM portal_pending_channels WHERE request_id=?').bind(row.id));
  statements.push(c.env.DB.prepare("UPDATE portal_requests SET status=?,slug=?,note=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='PENDING'").bind(status, slug, note, row.id));
  let decisions: D1Result[];
  try { decisions = await c.env.DB.batch(statements); }
  catch (error) {
    if (published && await c.env.DB.prepare('SELECT slug FROM portal_profile_channels WHERE channel_key=?').bind(portalChannelKey(published.channelUrl, published.platform)).first()) return c.json({ error: '이미 공개된 채널입니다. 기존 소개를 확인해 주세요.' }, 409);
    throw error;
  }
  // 동시에 같은 신청을 처리한 경우 실제 상태를 바꾼 요청만 후속 알림을 실행한다.
  if (decisions[decisions.length - 1]?.meta?.changes === 0) return c.json({ error: '이미 처리된 신청입니다.' }, 409);
  // 기존 데뷔 승인 알림을 새 접수에도 연결하며 소개 등록·문의는 발송하지 않는다.
  if (published && row.kind === 'DEBUT' && c.env.DISCORD_BOT_TOKEN && new URL(c.req.url).hostname === 'vdebut.live') {
    const event = portalProfileEvent(published);
    if (event) c.executionCtx.waitUntil(broadcastNewDebutToDiscord(c.env.DB, c.env.DISCORD_BOT_TOKEN, event).catch((error) => console.error('[Portal approval notification]', String(error))));
  }
  return c.json({ success: true, slug });
});
