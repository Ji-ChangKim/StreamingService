import type { AnalyticsChannelBoard, ChannelPeriod } from '../../../shared/analyticsBoard';
import type { AnalyticsBoard, AnalyticsGameBoard, AnalyticsTagBoard, BoardChannel, BoardGame, BoardPlatform, BoardTrendPoint, Competition } from '../../../shared/analyticsBoard';
import { normalizeBoardTag } from '../../../shared/analyticsBoard';
import { profileAgencyName } from '../../../shared/profilePresentation';
import { getChzzkStatisticsSource } from './broadcastStatisticsSources';
import { snapshotTagsReady } from './broadcastStatisticsCollection';
export { resetSnapshotTagsCheck } from './broadcastStatisticsCollection';
import type { TagTrendPoint } from '../../../shared/analyticsBoard';
import { extractSoopUserId } from './soopCollector';

// 방송 통계 개편 화면의 집계. '지금' 숫자는 10분 회차, 기간 통계는 매시 정각 회차를 쓴다(기준 정의서 5.10).
const HOUR = 3600000;
const DAY = 24 * HOUR;
const KST = 9 * HOUR;
const HOURLY = `r.state IN ('available','partial') AND substr(r.scheduled_at, 15, 2) = '00'`;
const LIVE = `r.state IN ('available','partial')`;
// 화면 갱신 단위: 수집 주기와 같은 10분(정의서 5.10).
const SLOT = 10 * 60000;
const NON_GAME = /토크|talk|캠방|노래|음악|music|먹방|쿡방|요리|그림|아트|art|asmr|운동|피트니스|여행|야외|일상|스포츠|교육|시사|주식|경제|댄스|라디오|chatting|버추얼|virtual|카테고리 미제공|unknown/i;
const NOT_A_GAME_TITLE = /^(종합\s*게임|기타\s*게임|게임\s*기타|게임|카테고리 미제공|카테고리 미지정|미분류|unknown|none)$/i;
// 플랫폼이 영문 분류 값만 준 경우 화면 이름으로 바꾼다.
const CATEGORY_LABELS: Record<string, string> = { talk: '토크', music: '음악/노래', art: '그림', mukbang: '먹방', asmr: 'ASMR', sports: '스포츠', cooking: '요리', travel: '여행' };
export const categoryLabel = (name: string) => CATEGORY_LABELS[name.trim().toLowerCase()] || name.trim();
const GAME_ALIASES: Record<string, string> = { lol: '리그 오브 레전드', '리그오브레전드': '리그 오브 레전드', leagueoflegends: '리그 오브 레전드', pubg: '배틀그라운드', '배그': '배틀그라운드', minecraft: '마인크래프트', valorant: '발로란트', tft: '전략적 팀 전투' };
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

type Platform = 'CHZZK' | 'SOOP';
interface RunRow { platform: Platform; scheduled_at: string; viewer_total: number | null }
interface CategoryRow { platform: Platform; category_id: string; category_name: string; v: number; n: number; period?: string }
interface SnapshotRow { platform: Platform; channel_key: string; channel_name: string | null; image_url: string | null; live_url: string | null; category_name: string; viewers: number; scheduled_at?: string }
interface LiveRow { channelKey: string; name: string; category: string; viewers: number; liveUrl: string | null; imageUrl: string | null; tags: string[] }
interface Registered { affiliation: string; isVtuber: boolean; slug: string | null; name: string | null; imageUrl: string | null }

export const kstDate = (iso: string | number) => new Date((typeof iso === 'number' ? iso : Date.parse(iso)) + KST).toISOString().slice(0, 10);
const kstHour = (iso: string) => new Date(Date.parse(iso) + KST).getUTCHours();
const kstWeekday = (iso: string) => new Date(Date.parse(iso) + KST).getUTCDay();
export const boardNextAt = (now = Date.now()) => new Date(Math.floor(now / SLOT) * SLOT + SLOT).toISOString();
const median = (values: number[]) => { if (!values.length) return null; const s = [...values].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const platformsOf = (platform: BoardPlatform): Platform[] => platform === 'ALL' ? ['CHZZK', 'SOOP'] : [platform];
const inList = (values: string[]) => values.map(() => '?').join(',');
const won = (n: number) => Math.round(n).toLocaleString('ko-KR');
const last = <T,>(rows: T[]): T | undefined => rows[rows.length - 1];

// 플랫폼마다 이름이 다른 같은 게임을 하나로 묶는다.
export function gameName(name: string): string {
  const key = name.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  return GAME_ALIASES[key] || name.trim();
}
export function isGameCategory(name: string): boolean { return !NON_GAME.test(name) && !NOT_A_GAME_TITLE.test(name.trim()); }

// 방송당 시청자를 같은 시각 모든 게임의 가운데 값과 비교한다(정의서 G4).
export function rankGames(rows: Array<{ name: string; viewers: number; broadcasts: number }>, previous?: Map<string, number>): BoardGame[] {
  const per = rows.filter((row) => row.broadcasts >= 2).map((row) => row.viewers / row.broadcasts);
  const mid = median(per);
  return rows.sort((a, b) => b.viewers - a.viewers || b.broadcasts - a.broadcasts).map((row, index) => {
    const perBroadcast = row.broadcasts >= 2 ? Math.round(row.viewers / row.broadcasts) : null;
    const ratio = perBroadcast !== null && mid ? perBroadcast / mid : null;
    const competition: Competition = ratio === null ? '경쟁 없음' : ratio >= 1.5 ? '여유' : ratio <= 0.67 ? '혼잡' : '보통';
    const before = previous?.get(row.name);
    return { name: row.name, viewers: Math.round(row.viewers), broadcasts: Math.round(row.broadcasts * 10) / 10, perBroadcast, competition, rankChange: before === undefined ? null : before - (index + 1) };
  });
}

// 회차별 카테고리 합계를 게임 단위 '시간당 평균'으로 바꾼다.
function mergeCategories(rows: CategoryRow[], runCount: Record<Platform, number>, games: boolean) {
  const merged = new Map<string, { name: string; viewers: number; broadcasts: number }>();
  for (const row of rows) {
    // '종합 게임'처럼 특정 게임이 아닌 분류는 게임 순위와 게임 외 콘텐츠 어디에도 넣지 않는다.
    if (NOT_A_GAME_TITLE.test(row.category_name.trim()) || isGameCategory(row.category_name) !== games || !runCount[row.platform]) continue;
    const name = games ? gameName(row.category_name) : categoryLabel(row.category_name);
    const entry = merged.get(name) || { name, viewers: 0, broadcasts: 0 };
    entry.viewers += row.v / runCount[row.platform];
    entry.broadcasts += row.n / runCount[row.platform];
    merged.set(name, entry);
  }
  return [...merged.values()];
}

async function readRuns(db: D1Database, since: string): Promise<RunRow[]> {
  const result = await db.prepare(`SELECT r.platform, r.scheduled_at, r.viewer_total FROM analytics_broadcast_runs r WHERE ${HOURLY} AND r.scheduled_at >= ? ORDER BY r.scheduled_at`).bind(since).all<RunRow>();
  return result.results || [];
}

// '지금' 기준 회차: 요청한 플랫폼이 모두 끝낸 가장 최근 회차. 같은 회차에서 한 플랫폼만 먼저 끝나
// 다른 플랫폼이 빠진 화면이 캐시되지 않게 한다. 20분 넘게 멈춘 플랫폼은 기다리지 않는다.
export function commonLatest(recent: RunRow[], runs: RunRow[], platforms: Platform[]): string | null {
  const per = platforms.map((p) => last(recent.filter((run) => run.platform === p))?.scheduled_at).filter((v): v is string => Boolean(v));
  if (!per.length) return last(runs.filter((run) => platforms.includes(run.platform)))?.scheduled_at || null;
  const newest = per.reduce((a, b) => (a > b ? a : b));
  const alive = per.filter((at) => Date.parse(newest) - Date.parse(at) <= 20 * 60000);
  return alive.reduce((a, b) => (a < b ? a : b));
}

// '카테고리 미제공'처럼 분류가 없는 방송인가(순위·채널 줄·플랫폼 준비 판정에서 같은 기준을 쓴다).
export const UNCATEGORIZED_NAMES = ['카테고리 미제공', '카테고리 미지정', '미분류', 'unknown', 'none', ''];
export const isUncategorized = (name: string) => UNCATEGORIZED_NAMES.includes(name.trim().toLowerCase()) || UNCATEGORIZED_NAMES.includes(name.trim());

// 수집이 시작된 뒤 지난 날 수. 기간 버튼과 앞 기간 비교를 켤지 정한다(정의서 5.12).
async function readCoverageDays(db: D1Database, now: number): Promise<number> {
  const row = await db.prepare(`SELECT MIN(r.scheduled_at) AS first FROM analytics_broadcast_runs r WHERE ${LIVE}`).first<{ first: string | null }>();
  return row?.first ? Math.max(0, Math.floor((now - Date.parse(row.first)) / DAY)) : 0;
}

// 플랫폼을 보여 줄 수 있는가: 최근 하루 안에 수집됐고, 방송 분류가 절반 이상 들어 있어야 한다.
async function readPlatformReady(db: D1Database, platform: Platform, now: number): Promise<boolean> {
  const row = await db.prepare(`SELECT COUNT(*) AS n,
      SUM(CASE WHEN lower(trim(s.category_name)) IN (${inList(UNCATEGORIZED_NAMES)}) THEN 0 ELSE 1 END) AS named
    FROM analytics_broadcast_snapshots s
    WHERE s.run_id = (SELECT r.run_id FROM analytics_broadcast_runs r WHERE ${LIVE} AND r.platform = ? AND r.scheduled_at >= ? ORDER BY r.scheduled_at DESC LIMIT 1)`)
    .bind(...UNCATEGORIZED_NAMES.map((n) => n.toLowerCase()), platform, new Date(now - DAY).toISOString()).first<{ n: number; named: number | null }>();
  return Boolean(row && row.n > 0 && (row.named || 0) / row.n >= 0.5);
}

export async function readBoardAvailability(db: D1Database, now: number) {
  const [coverageDays, chzzk, soop] = await Promise.all([readCoverageDays(db, now), readPlatformReady(db, 'CHZZK', now), readPlatformReady(db, 'SOOP', now)]);
  return { coverageDays, platformReady: { CHZZK: chzzk, SOOP: soop } };
}

// 최근 10분 회차 목록('지금' 숫자용).
async function readRecentRuns(db: D1Database, since: string): Promise<RunRow[]> {
  const result = await db.prepare(`SELECT r.platform, r.scheduled_at, r.viewer_total FROM analytics_broadcast_runs r WHERE ${LIVE} AND r.scheduled_at >= ? ORDER BY r.scheduled_at`).bind(since).all<RunRow>();
  return result.results || [];
}

// 한 회차(10분 단위)의 카테고리 합계.
async function readCategoriesAt(db: D1Database, platforms: Platform[], slot: string): Promise<CategoryRow[]> {
  const result = await db.prepare(`SELECT r.platform, s.category_id, s.category_name, SUM(s.viewers) AS v, COUNT(*) AS n
    FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
    WHERE ${LIVE} AND r.scheduled_at = ? AND r.platform IN (${inList(platforms)})
    GROUP BY r.platform, s.category_id, s.category_name`).bind(slot, ...platforms).all<CategoryRow>();
  return result.results || [];
}

async function readCategories(db: D1Database, platforms: Platform[], from: string, to: string): Promise<CategoryRow[]> {
  const result = await db.prepare(`SELECT r.platform, s.category_id, s.category_name, SUM(s.viewers) AS v, COUNT(*) AS n
    FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
    WHERE ${HOURLY} AND r.scheduled_at >= ? AND r.scheduled_at <= ? AND r.platform IN (${inList(platforms)})
    GROUP BY r.platform, s.category_id, s.category_name`).bind(from, to, ...platforms).all<CategoryRow>();
  return result.results || [];
}

function countRuns(runs: RunRow[], from: string, to: string): Record<Platform, number> {
  const count: Record<Platform, number> = { CHZZK: 0, SOOP: 0 };
  for (const run of runs) if (run.scheduled_at >= from && run.scheduled_at <= to) count[run.platform] += 1;
  return count;
}

// VDébut 공개 소개가 있는 채널만 버튜버로 보고, 공식 소속이 있을 때만 소속을 붙인다(정의서 5.3·5.8).
async function readRegistered(db: D1Database): Promise<Map<string, Registered>> {
  const map = new Map<string, Registered>();
  const result = await db.prepare(`SELECT c.platform, c.channel_url, i.slug, i.agency_name, i.display_name, i.profile_image_url FROM streamerChannel c LEFT JOIN streamerChannel_info i ON i.channel_id = c.id`).all<{ platform: string; channel_url: string | null; slug: string | null; agency_name: string | null; display_name: string | null; profile_image_url: string | null }>();
  for (const row of result.results || []) {
    const url = row.channel_url || '';
    const id = row.platform === 'SOOP' ? extractSoopUserId(url) : url.split('/').filter(Boolean).pop();
    if (!id || (row.platform !== 'CHZZK' && row.platform !== 'SOOP')) continue;
    map.set(`${row.platform}:${id}`.toLowerCase(), { affiliation: profileAgencyName(row.agency_name || ''), isVtuber: Boolean(row.slug), slug: row.slug || null, name: row.display_name || null, imageUrl: row.profile_image_url || null });
  }
  return map;
}

// 채널 페이지용: 한 채널의 등록 정보만 읽는다(전체 목록을 읽지 않는다).
async function readRegisteredOne(db: D1Database, platform: Platform, id: string): Promise<Registered | null> {
  const urls = platform === 'CHZZK' ? [`https://chzzk.naver.com/${id}`, `https://chzzk.naver.com/live/${id}`]
    : [`https://www.sooplive.co.kr/station/${id}`, `https://ch.sooplive.co.kr/${id}`, `https://bj.afreecatv.com/${id}`, `https://play.sooplive.co.kr/${id}`];
  const row = await db.prepare(`SELECT i.slug, i.agency_name, i.display_name, i.profile_image_url FROM streamerChannel c LEFT JOIN streamerChannel_info i ON i.channel_id = c.id
    WHERE c.platform = ? AND lower(c.channel_url) IN (${inList(urls)}) LIMIT 1`).bind(platform, ...urls.map((u) => u.toLowerCase()))
    .first<{ slug: string | null; agency_name: string | null; display_name: string | null; profile_image_url: string | null }>();
  return row ? { affiliation: profileAgencyName(row.agency_name || ''), isVtuber: Boolean(row.slug), slug: row.slug || null, name: row.display_name || null, imageUrl: row.profile_image_url || null } : null;
}

function toChannel(row: { platform: Platform; channelKey: string; name: string; category: string; viewers: number; liveUrl: string | null; imageUrl: string | null }, registered: Map<string, Registered>): BoardChannel {
  const info = registered.get(row.channelKey.toLowerCase());
  return { channelKey: row.channelKey, name: row.name, platform: row.platform, affiliation: info?.affiliation || '', category: isUncategorized(row.category) ? '카테고리 없음' : categoryLabel(row.category), isGame: isGameCategory(row.category), viewers: row.viewers, liveUrl: row.liveUrl, imageUrl: row.imageUrl, isVtuber: Boolean(info?.isVtuber) };
}

// 태그는 아직 저장하지 않아 정각마다 치지직 인기 방송을 한 번 읽어 쓴다(치지직만, 정의서 6.4).
async function readLiveTags(origin: string, wait: (p: Promise<unknown>) => void): Promise<{ asOf: string; rows: LiveRow[] }> {
  const slot = new Date(Math.floor(Date.now() / SLOT) * SLOT).toISOString();
  const key = new Request(`${origin}/__board/live-tags?slot=${slot}`);
  const cache = typeof caches === 'undefined' ? undefined : (caches as any).default as Cache;
  const hit = cache ? await cache.match(key).catch(() => undefined) : undefined;
  if (hit) return hit.json();
  const source = await getChzzkStatisticsSource();
  const rows = source.lives.map((live) => ({ channelKey: live.channelKey || live.id, name: live.channelName || '', category: live.categoryName, viewers: live.viewers, liveUrl: live.liveUrl || null, imageUrl: live.imageUrl || null, tags: (live.tags || []).slice(0, 10) }));
  const body = { asOf: slot, rows };
  if (cache && rows.length) wait(cache.put(key, new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${Math.max(60, Math.round((Date.parse(boardNextAt()) - Date.now()) / 1000))}` } })).catch(() => undefined));
  return body;
}

// 가장 최근 정각 회차에 저장된 치지직 태그를 읽고, 아직 저장 기록이 없으면 인기 방송 목록을 직접 읽는다.
async function readTagSource(db: D1Database, origin: string, wait: (p: Promise<unknown>) => void): Promise<{ asOf: string; rows: LiveRow[] }> {
  if (await snapshotTagsReady(db)) {
    const run = await db.prepare(`SELECT r.scheduled_at FROM analytics_broadcast_runs r WHERE ${LIVE} AND r.platform = 'CHZZK' ORDER BY r.scheduled_at DESC LIMIT 1`).first<{ scheduled_at: string }>();
    if (run) {
      const result = await db.prepare(`SELECT s.channel_key, s.channel_name, s.category_name, s.viewers, s.live_url, s.image_url, s.tags
        FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
        WHERE r.scheduled_at = ? AND r.platform = 'CHZZK' AND s.tags IS NOT NULL`).bind(run.scheduled_at)
        .all<{ channel_key: string; channel_name: string | null; category_name: string; viewers: number; live_url: string | null; image_url: string | null; tags: string }>();
      const rows = (result.results || []).map((row) => {
        let tags: string[] = [];
        try { const parsed = JSON.parse(row.tags); if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === 'string'); } catch { /* 깨진 값은 태그 없음으로 본다. */ }
        return { channelKey: row.channel_key, name: row.channel_name || '', category: row.category_name, viewers: row.viewers, liveUrl: row.live_url, imageUrl: row.image_url, tags };
      }).filter((row) => row.tags.length);
      if (rows.length) return { asOf: run.scheduled_at, rows };
    }
  }
  return readLiveTags(origin, wait);
}

function tagRanking(rows: LiveRow[]) {
  const tags = new Map<string, { tag: string; viewers: number; broadcasts: number; channels: Set<string> }>();
  for (const row of rows) for (const raw of new Set(row.tags.map((tag) => tag.trim()).filter(Boolean))) {
    const key = normalizeBoardTag(raw);
    if (!key) continue;
    const entry = tags.get(key) || { tag: raw.replace(/^#/, ''), viewers: 0, broadcasts: 0, channels: new Set<string>() };
    if (entry.channels.has(row.channelKey)) continue;
    entry.channels.add(row.channelKey); entry.viewers += row.viewers; entry.broadcasts += 1;
    tags.set(key, entry);
  }
  return [...tags.values()].sort((a, b) => b.viewers - a.viewers || b.broadcasts - a.broadcasts).map(({ tag, viewers, broadcasts }) => ({ tag, viewers, broadcasts }));
}

function dayTrend(runs: RunRow[], date: string, usualRuns: RunRow[]): BoardTrendPoint[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const at = (platform: Platform) => runs.find((run) => run.platform === platform && kstDate(run.scheduled_at) === date && kstHour(run.scheduled_at) === hour)?.viewer_total ?? null;
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const usual = usualRuns.filter((run) => run.platform === 'CHZZK' && kstDate(run.scheduled_at) < date && kstWeekday(run.scheduled_at) === weekday && kstHour(run.scheduled_at) === hour && run.viewer_total !== null).slice(-4).map((run) => run.viewer_total as number);
    return { label: `${hour}시`, chzzk: at('CHZZK'), soop: null, usual: usual.length >= 3 ? Math.round(median(usual) as number) : null };
  });
}

function periodTrend(runs: RunRow[], days: number, today: string): BoardTrendPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const date = kstDate(Date.parse(`${today}T00:00:00Z`) - (days - 1 - index) * DAY);
    const values = runs.filter((run) => run.platform === 'CHZZK' && run.viewer_total !== null && kstDate(run.scheduled_at) === date).map((run) => run.viewer_total as number);
    return { label: date.slice(5).replace('-', '/'), chzzk: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null, soop: null, usual: null };
  });
}

// 통계 첫 화면 전체를 한 번에 계산한다. 응답은 다음 10분 회차까지 재사용한다.
export async function getAnalyticsBoard(db: D1Database, platform: BoardPlatform, origin: string, wait: (p: Promise<unknown>) => void, now = Date.now()): Promise<AnalyticsBoard> {
  const platforms = platformsOf(platform);
  // 기간 통계는 정각 회차(runs), '지금' 숫자는 가장 최근 10분 회차(recent)로 계산한다(정의서 5.10).
  const [runs, recent, availability] = await Promise.all([readRuns(db, new Date(now - 36 * DAY).toISOString()), readRecentRuns(db, new Date(now - 3 * HOUR).toISOString()), readBoardAvailability(db, now)]);
  const latest = commonLatest(recent, runs, platforms);
  const empty: AnalyticsBoard = { availability, nowViewers: 0, asOf: latest, nextAt: boardNextAt(now), summary: null, platforms: [], trend: { today: [], yesterday: [], d7: [], d30: [] }, games: { now: [], today: [], d7: [] }, rising: [], nonGame: [], tags: [], channels: [] };
  if (!latest) return empty;
  const nowRuns = recent.some((run) => run.scheduled_at === latest) ? recent : runs;
  const today = kstDate(latest);
  const todayStart = new Date(Date.parse(`${today}T00:00:00Z`) - KST).toISOString();
  const previousSlot = last(nowRuns.filter((run) => run.scheduled_at < latest && platforms.includes(run.platform)))?.scheduled_at || latest;
  const weekStart = new Date(Date.parse(latest) - 7 * DAY + HOUR).toISOString();
  const priorStart = new Date(Date.parse(latest) - 14 * DAY + HOUR).toISOString();
  const [nowRows, prevRows, todayRows, twoWeekRows, snapshots, registered, cardExtra] = await Promise.all([
    readCategoriesAt(db, platforms, latest),
    readCategoriesAt(db, platforms, previousSlot),
    readCategories(db, platforms, todayStart, latest),
    db.prepare(`SELECT r.platform, s.category_id, s.category_name, SUM(s.viewers) AS v, COUNT(*) AS n, CASE WHEN r.scheduled_at >= ? THEN 'cur' ELSE 'prev' END AS period
      FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
      WHERE ${HOURLY} AND r.scheduled_at >= ? AND r.scheduled_at <= ? AND r.platform IN (${inList(platforms)})
      GROUP BY r.platform, s.category_id, s.category_name, period`).bind(weekStart, priorStart, latest, ...platforms).all<CategoryRow>().then((r) => r.results || []),
    db.prepare(`SELECT r.platform, s.channel_key, s.channel_name, s.image_url, s.live_url, s.category_name, s.viewers
      FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
      WHERE ${LIVE} AND r.scheduled_at = ? AND r.platform IN (${inList(platforms)})`).bind(latest, ...platforms).all<SnapshotRow>().then((r) => r.results || []),
    readRegistered(db),
    // 오늘 최고(10분 회차 전체)와 4주 전 같은 요일·같은 시각 값.
    db.prepare(`SELECT
        (SELECT MAX(viewer_total) FROM analytics_broadcast_runs r WHERE ${LIVE} AND r.platform = 'CHZZK' AND r.scheduled_at >= ? AND r.scheduled_at <= ?) AS peak,
        (SELECT json_group_array(viewer_total) FROM analytics_broadcast_runs r WHERE ${LIVE} AND r.platform = 'CHZZK' AND r.viewer_total IS NOT NULL AND r.scheduled_at IN (?, ?, ?, ?)) AS usual`)
      .bind(todayStart, latest, ...[1, 2, 3, 4].map((week) => new Date(Date.parse(latest) - week * 7 * DAY).toISOString())).first<{ peak: number | null; usual: string | null }>(),
  ]);

  // 플랫폼 현황: 공통 수집 범위가 맞는 치지직만 공개한다(정의서 P1).
  const platformCards = platforms.includes('CHZZK') ? nowRuns.filter((run) => run.platform === 'CHZZK' && run.scheduled_at === latest && run.viewer_total !== null).map((run) => {
    const viewers = run.viewer_total as number;
    let usual: number[] = [];
    try { usual = (JSON.parse(cardExtra?.usual || '[]') as unknown[]).filter((v): v is number => typeof v === 'number'); } catch { usual = []; }
    const base = usual.length >= 3 ? median(usual) : null;
    return { platform: 'CHZZK' as const, viewers, usualDelta: base ? Math.round((viewers - base) / base * 100) : null, peakToday: Math.max(viewers, cardExtra?.peak || 0), bigCount: snapshots.filter((row) => row.platform === 'CHZZK' && row.viewers >= 1000).length };
  }) : [];

  const nowCount = countRuns(nowRuns, latest, latest);
  const previousRank = new Map(rankGames(mergeCategories(prevRows, countRuns(nowRuns, previousSlot, previousSlot), true)).map((game, index) => [game.name, index + 1]));
  const gamesNow = rankGames(mergeCategories(nowRows, nowCount, true), previousRank);
  const gamesToday = rankGames(mergeCategories(todayRows, countRuns(runs, todayStart, latest), true));
  const curRuns = countRuns(runs, weekStart, latest);
  const prevRuns = countRuns(runs, priorStart, new Date(Date.parse(weekStart) - 1).toISOString());
  const prev7 = mergeCategories(twoWeekRows.filter((row) => row.period === 'prev'), prevRuns, true);
  const prev7Rank = new Map(rankGames(prev7.map((g) => ({ ...g }))).map((game, index) => [game.name, index + 1]));
  const games7 = rankGames(mergeCategories(twoWeekRows.filter((row) => row.period === 'cur'), curRuns, true), prev7Rank);
  // 급상승: 앞 7일 수집이 80% 이상 모였을 때만 계산한다(정의서 R4).
  const priorReady = platforms.every((p) => prevRuns[p] >= 168 * 0.8 || !curRuns[p]);
  const prevByName = new Map(prev7.map((game) => [game.name, game.viewers]));
  const rising = priorReady ? games7.flatMap((game) => { const before = prevByName.get(game.name); if (!before || game.viewers < 1000) return []; const growth = Math.round((game.viewers - before) / before * 100); return growth >= 30 ? [{ name: game.name, growth, viewers: game.viewers }] : []; }).sort((a, b) => b.growth - a.growth).slice(0, 5) : [];

  const channels = snapshots.sort((a, b) => b.viewers - a.viewers).slice(0, 50).map((row) => toChannel({ platform: row.platform, channelKey: row.channel_key, name: row.channel_name || row.channel_key.split(':')[1], category: row.category_name, viewers: row.viewers, liveUrl: row.live_url, imageUrl: row.image_url }, registered));

  let tags: AnalyticsBoard['tags'] = [];
  if (platforms.includes('CHZZK')) {
    try { tags = tagRanking((await readTagSource(db, origin, wait)).rows).slice(0, 8); } catch (error) { console.warn('[Board] tags unavailable', String(error)); }
  }

  const card = platformCards[0];
  const top = gamesNow[0];
  const summaryParts: string[] = [];
  if (top) summaryParts.push(`지금 가장 많이 보는 게임은 「${top.name}」로, 방송 ${won(top.broadcasts)}개에 ${won(top.viewers)}명이 보고 있어요.`);
  if (card?.usualDelta !== null && card?.usualDelta !== undefined && Math.abs(card.usualDelta) >= 5) summaryParts.push(`치지직 시청자는 평소 이 시간보다 ${Math.abs(card.usualDelta)}% ${card.usualDelta > 0 ? '많아요' : '적어요'}.`);
  const roomy = gamesNow.slice(1, 10).find((game) => game.competition === '여유');
  if (roomy) summaryParts.push(`상위 10개 게임 중 방송당 시청자가 가장 여유로운 곳은 「${roomy.name}」예요.`);

  return {
    availability,
    // 점유율 분모: 지금 회차에 수집된 모든 플랫폼 방송의 시청자 합(게임 시청자와 같은 범위).
    nowViewers: snapshots.reduce((sum, row) => sum + row.viewers, 0),
    asOf: latest, nextAt: boardNextAt(now), summary: summaryParts.length >= 2 ? summaryParts.join(' ') : null,
    platforms: platformCards,
    trend: platforms.includes('CHZZK') ? { today: dayTrend(runs, today, runs), yesterday: dayTrend(runs, kstDate(Date.parse(latest) - DAY), runs), d7: periodTrend(runs, 7, today), d30: periodTrend(runs, 30, today) } : empty.trend,
    games: { now: gamesNow.slice(0, 10), today: gamesToday.slice(0, 10), d7: games7.slice(0, 10) },
    rising,
    nonGame: rankGames(mergeCategories(nowRows, nowCount, false)).slice(0, 5),
    tags, channels,
  };
}

// 한 게임의 지금 상태·7일 추이·시간대·상위 채널(정의서 7.3).
export async function getAnalyticsGameBoard(db: D1Database, name: string, now = Date.now()): Promise<AnalyticsGameBoard | null> {
  const target = gameName(name);
  const runs = await readRuns(db, new Date(now - 29 * DAY).toISOString());
  const recent = await readRecentRuns(db, new Date(now - 3 * HOUR).toISOString());
  const latest = commonLatest(recent, runs, ['CHZZK', 'SOOP']);
  if (!latest) return null;
  const nowRuns = recent.some((run) => run.scheduled_at === latest) ? recent : runs;
  const variants = [target, ...Object.entries(GAME_ALIASES).filter(([, value]) => value === target).map(([key]) => key)];
  const [nowRows, rows, registered] = await Promise.all([
    readCategoriesAt(db, ['CHZZK', 'SOOP'], latest),
    db.prepare(`SELECT r.platform, r.scheduled_at, s.channel_key, s.channel_name, s.category_name, s.viewers
      FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
      WHERE ${HOURLY} AND r.scheduled_at >= ? AND (s.category_name IN (${inList(variants)}) OR lower(replace(s.category_name, ' ', '')) IN (${inList(variants)}))`)
      .bind(new Date(now - 28 * DAY).toISOString(), ...variants, ...variants.map((v) => v.replace(/\s+/g, '').toLowerCase())).all<SnapshotRow>().then((r) => (r.results || []).filter((row) => gameName(row.category_name) === target)),
    readRegistered(db),
  ]);
  if (!rows.length) return null;
  const ranked = rankGames(mergeCategories(nowRows, countRuns(nowRuns, latest, latest), true));
  const rank = ranked.findIndex((game) => game.name === target);
  const current = ranked[rank];

  const slotTotals = new Map<string, number>();
  for (const row of rows) slotTotals.set(row.scheduled_at as string, (slotTotals.get(row.scheduled_at as string) || 0) + row.viewers);
  const slots = [...new Set(runs.map((run) => run.scheduled_at))];
  const today = kstDate(latest);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = kstDate(Date.parse(`${today}T00:00:00Z`) - (6 - index) * DAY);
    const daySlots = slots.filter((slot) => kstDate(slot) === date);
    const counts = rows.filter((row) => kstDate(row.scheduled_at as string) === date).length;
    return { date, viewers: daySlots.length ? Math.round(daySlots.reduce((sum, slot) => sum + (slotTotals.get(slot) || 0), 0) / daySlots.length) : null, broadcasts: daySlots.length ? Math.round(counts / daySlots.length * 10) / 10 : null };
  });
  const heat = Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, hour) => {
    const weekday = (d + 1) % 7;
    const matching = slots.filter((slot) => kstWeekday(slot) === weekday && kstHour(slot) === hour);
    return matching.length ? Math.round(matching.reduce((sum, slot) => sum + (slotTotals.get(slot) || 0), 0) / matching.length) : 0;
  }));
  const weekStart = new Date(Date.parse(latest) - 7 * DAY + HOUR).toISOString();
  const week = rows.filter((row) => (row.scheduled_at as string) >= weekStart);
  const byPlatform = { CHZZK: 0, SOOP: 0 } as Record<Platform, number>;
  for (const row of week) byPlatform[row.platform] += row.viewers;
  const total = byPlatform.CHZZK + byPlatform.SOOP;
  const channels = new Map<string, { row: SnapshotRow; sum: number; count: number; peak: number }>();
  for (const row of week) { const entry = channels.get(row.channel_key) || { row, sum: 0, count: 0, peak: 0 }; entry.sum += row.viewers; entry.count += 1; entry.peak = Math.max(entry.peak, row.viewers); channels.set(row.channel_key, entry); }
  const top = [...channels.values()].map(({ row, sum, count, peak }) => ({ channelKey: row.channel_key, name: row.channel_name || row.channel_key.split(':')[1], platform: row.platform, affiliation: registered.get(row.channel_key.toLowerCase())?.affiliation || '', avg: Math.round(sum / count), peak, hours: count })).sort((a, b) => b.avg - a.avg).slice(0, 10);

  const busiest = heat.flatMap((row, d) => row.map((v, h) => ({ v, d, h }))).sort((a, b) => b.v - a.v)[0];
  const parts: string[] = [];
  if (current) parts.push(`「${target}」은 지금 방송 ${won(current.broadcasts)}개에 ${won(current.viewers)}명이 보고 있어요.`);
  if (current?.perBroadcast) parts.push(`방송당 시청자는 ${won(current.perBroadcast)}명으로 경쟁은 ${current.competition}이에요.`);
  if (busiest?.v) parts.push(`최근 4주 중 가장 많이 본 시간은 ${WEEKDAY[(busiest.d + 1) % 7]}요일 ${busiest.h}시예요.`);
  return {
    asOf: latest, nextAt: boardNextAt(now), name: target, summary: parts.length >= 2 ? parts.join(' ') : null,
    now: { viewers: current?.viewers || 0, broadcasts: current?.broadcasts || 0, perBroadcast: current?.perBroadcast ?? null, competition: current?.competition || '경쟁 없음', rank: rank >= 0 ? rank + 1 : null },
    days, heat, top,
    platforms: total ? (['CHZZK', 'SOOP'] as const).filter((p) => byPlatform[p]).map((p) => ({ platform: p, viewers: Math.round(byPlatform[p] / Math.max(1, new Set(week.map((row) => row.scheduled_at)).size)), share: Math.round(byPlatform[p] / total * 100) })) : [],
  };
}

// 한 태그로 지금 방송 중인 채널과 함께 쓰인 게임·태그(정의서 7.3-1).
export async function getAnalyticsTagBoard(db: D1Database, tag: string, origin: string, wait: (p: Promise<unknown>) => void, now = Date.now()): Promise<AnalyticsTagBoard | null> {
  const key = normalizeBoardTag(tag);
  if (!key) return null;
  const [live, registered] = await Promise.all([readTagSource(db, origin, wait), readRegistered(db)]);
  const ranking = tagRanking(live.rows);
  const rank = ranking.findIndex((row) => normalizeBoardTag(row.tag) === key);
  const rows = live.rows.filter((row) => row.tags.some((t) => normalizeBoardTag(t) === key)).sort((a, b) => b.viewers - a.viewers);
  if (!rows.length) return null;
  const viewers = rows.reduce((sum, row) => sum + row.viewers, 0);
  const games = new Map<string, number>();
  const withTags = new Map<string, { tag: string; broadcasts: number }>();
  for (const row of rows) {
    const game = isGameCategory(row.category) ? gameName(row.category) : categoryLabel(row.category);
    games.set(game, (games.get(game) || 0) + 1);
    for (const other of new Set(row.tags.map(normalizeBoardTag))) {
      if (!other || other === key) continue;
      const entry = withTags.get(other) || { tag: row.tags.find((t) => normalizeBoardTag(t) === other)!.replace(/^#/, ''), broadcasts: 0 };
      entry.broadcasts += 1; withTags.set(other, entry);
    }
  }
  const display = ranking[rank]?.tag || tag;
  const topShare = Math.round(rows.slice(0, 3).reduce((sum, row) => sum + row.viewers, 0) / viewers * 100);
  const parts = [`#${display} 태그를 단 방송은 지금 ${rows.length}개, 시청자는 ${won(viewers)}명이에요.`];
  if (rows.length >= 4) parts.push(`상위 3개 채널이 시청자의 ${topShare}%를 모으고 있어요.`);
  const topGame = [...games.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topGame && topGame[1] >= 2) parts.push(`가장 많이 함께 한 콘텐츠는 「${topGame[0]}」(${topGame[1]}개)예요.`);
  return {
    asOf: live.asOf, nextAt: boardNextAt(now), tag: display, summary: parts.length >= 2 ? parts.join(' ') : null, rank: rank >= 0 ? rank + 1 : null,
    now: { broadcasts: rows.length, viewers, perBroadcast: rows.length >= 2 ? Math.round(viewers / rows.length) : null },
    channels: rows.map((row) => toChannel({ platform: 'CHZZK', channelKey: row.channelKey, name: row.name, category: row.category, viewers: row.viewers, liveUrl: row.liveUrl, imageUrl: row.imageUrl }, registered)),
    games: [...games.entries()].map(([name, broadcasts]) => ({ name, broadcasts })).sort((a, b) => b.broadcasts - a.broadcasts).slice(0, 5),
    withTags: [...withTags.values()].sort((a, b) => b.broadcasts - a.broadcasts).slice(0, 8),
    ...(await readTagTrend(db, key, live.asOf)),
  };
}

// 저장된 태그 기록으로 오늘·어제(정각별)·7일·30일(하루 평균) 추이를 만든다. 저장 시작 전 시각은 비워 둔다.
async function readTagTrend(db: D1Database, key: string, asOf: string): Promise<{ trend: AnalyticsTagBoard['trend']; tagCoverageDays: number }> {
  const empty = { trend: { today: [], yesterday: [], d7: [], d30: [] }, tagCoverageDays: 0 };
  if (!(await snapshotTagsReady(db))) return empty;
  const since = new Date(Date.parse(asOf) - 31 * DAY).toISOString();
  const [start, hits, runs] = await Promise.all([
    db.prepare(`SELECT MIN(r.scheduled_at) AS first FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id WHERE ${HOURLY} AND r.platform = 'CHZZK' AND s.tags IS NOT NULL AND r.scheduled_at >= ?`).bind(since).first<{ first: string | null }>(),
    db.prepare(`SELECT r.scheduled_at AS at, SUM(s.viewers) AS v, COUNT(DISTINCT s.channel_key) AS n
      FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id, json_each(s.tags) t
      WHERE ${HOURLY} AND r.platform = 'CHZZK' AND r.scheduled_at >= ? AND s.tags IS NOT NULL
        AND lower(replace(replace(t.value, ' ', ''), '#', '')) = ?
      GROUP BY r.scheduled_at`).bind(since, key).all<{ at: string; v: number; n: number }>().then((r) => r.results || []),
    readRuns(db, since),
  ]);
  if (!start?.first) return empty;
  const byAt = new Map(hits.map((hit) => [hit.at, hit]));
  const slots = runs.filter((run) => run.platform === 'CHZZK' && run.scheduled_at >= (start.first as string) && run.scheduled_at <= asOf).map((run) => run.scheduled_at);
  const point = (label: string, list: string[]): TagTrendPoint => list.length
    ? { label, viewers: Math.round(list.reduce((sum, at) => sum + (byAt.get(at)?.v || 0), 0) / list.length), broadcasts: Math.round(list.reduce((sum, at) => sum + (byAt.get(at)?.n || 0), 0) / list.length * 10) / 10 }
    : { label, viewers: null, broadcasts: null };
  const today = kstDate(asOf);
  const hoursOf = (date: string) => Array.from({ length: 24 }, (_, hour) => point(`${hour}시`, slots.filter((at) => kstDate(at) === date && kstHour(at) === hour)));
  const daysBack = (n: number) => Array.from({ length: n }, (_, index) => { const date = kstDate(Date.parse(`${today}T00:00:00Z`) - (n - 1 - index) * DAY); return point(date.slice(5).replace('-', '/'), slots.filter((at) => kstDate(at) === date)); });
  return { trend: { today: hoursOf(today), yesterday: hoursOf(kstDate(Date.parse(`${today}T00:00:00Z`) - DAY)), d7: daysBack(7), d30: daysBack(30) }, tagCoverageDays: Math.max(0, Math.floor((Date.parse(asOf) - Date.parse(start.first as string)) / DAY)) };
}

interface ChannelRow { scheduled_at: string; stream_id: string; channel_name: string | null; image_url: string | null; live_url: string | null; title: string; category_name: string; viewers: number; tags?: string | null }

// 치지직 팔로워 수(공개 정보). 실패하면 표시하지 않는다.
async function readChzzkFollowers(id: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.chzzk.naver.com/service/v1/channels/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const json = await response.json() as { content?: { followerCount?: unknown } };
    return typeof json.content?.followerCount === 'number' ? json.content.followerCount : null;
  } catch { return null; }
}

// 한 채널의 기간별 기록(정의서 7.4). 방송 시간은 10분 간격 기록으로, 시청자는 정각 값으로 계산한다.
export async function getAnalyticsChannelBoard(db: D1Database, channelKey: string, days: ChannelPeriod, now = Date.now()): Promise<AnalyticsChannelBoard | null> {
  const platform: Platform = channelKey.toUpperCase().startsWith('SOOP:') ? 'SOOP' : 'CHZZK';
  const id = channelKey.slice(channelKey.indexOf(':') + 1);
  const key = `${platform}:${id.toLowerCase()}`;
  const from = new Date(now - days * DAY).toISOString();
  const prevFrom = new Date(now - 2 * days * DAY).toISOString();
  const withTags = await snapshotTagsReady(db);
  const [rowsResult, latestRun, registered, followers, coverageDays] = await Promise.all([
    db.prepare(`SELECT r.scheduled_at, s.stream_id, s.channel_name, s.image_url, s.live_url, s.title, s.category_name, s.viewers${withTags ? ', s.tags' : ''}
      FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
      WHERE s.channel_key = ? COLLATE NOCASE AND r.state IN ('available','partial') AND r.scheduled_at >= ? ORDER BY r.scheduled_at`).bind(key, prevFrom).all<ChannelRow>(),
    db.prepare(`SELECT r.run_id, r.scheduled_at FROM analytics_broadcast_runs r WHERE ${LIVE} AND r.platform = ? ORDER BY r.scheduled_at DESC LIMIT 1`).bind(platform).first<{ run_id: string; scheduled_at: string }>(),
    readRegisteredOne(db, platform, id.toLowerCase()),
    platform === 'CHZZK' ? readChzzkFollowers(id) : Promise.resolve(null),
    readCoverageDays(db, now),
  ]);
  const all = rowsResult.results || [];
  const info = registered;
  if (!all.length && !info) return null;
  const isHourlyAt = (iso: string) => iso.slice(14, 16) === '00';
  const latestRow = all[all.length - 1];

  const summarize = (rows: ChannelRow[]) => {
    const hourly = rows.filter((row) => isHourlyAt(row.scheduled_at)).map((row) => row.viewers);
    return { avg: hourly.length ? Math.round(hourly.reduce((a, b) => a + b, 0) / hourly.length) : null, peak: hourly.length ? Math.max(...hourly) : null, minutes: rows.length * 10, broadcasts: new Set(rows.map((row) => row.stream_id)).size };
  };
  const rows = all.filter((row) => row.scheduled_at >= from);
  const prevRows = all.filter((row) => row.scheduled_at < from);
  const current = summarize(rows);
  // 앞 기간 전체가 수집 범위 안에 있을 때만 비교한다(정의서 5.12). 90일은 보관 기간과 같아 비교하지 않는다.
  const prevReady = days < 90 && coverageDays >= days * 2;
  const prev = prevReady && prevRows.length ? summarize(prevRows) : null;
  const peakRow = rows.filter((row) => isHourlyAt(row.scheduled_at)).sort((a, b) => b.viewers - a.viewers)[0];

  const today = kstDate(now);
  const trend = Array.from({ length: days }, (_, index) => {
    const date = kstDate(Date.parse(`${today}T00:00:00Z`) - (days - 1 - index) * DAY);
    const values = rows.filter((row) => isHourlyAt(row.scheduled_at) && kstDate(row.scheduled_at) === date).map((row) => row.viewers);
    return { date, avg: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null, peak: values.length ? Math.max(...values) : null };
  });

  const byCategory = new Map<string, { name: string; isGame: boolean; samples: number; hourly: number[] }>();
  for (const row of rows) {
    const game = isGameCategory(row.category_name);
    const name = isUncategorized(row.category_name) ? '카테고리 없음' : game ? gameName(row.category_name) : categoryLabel(row.category_name);
    const entry = byCategory.get(name) || { name, isGame: game, samples: 0, hourly: [] };
    entry.samples += 1;
    if (isHourlyAt(row.scheduled_at)) entry.hourly.push(row.viewers);
    byCategory.set(name, entry);
  }
  const games = [...byCategory.values()].sort((a, b) => b.samples - a.samples).slice(0, 6).map((entry) => ({ name: entry.name, isGame: entry.isGame, share: Math.round(entry.samples / Math.max(1, rows.length) * 100), avg: entry.hourly.length ? Math.round(entry.hourly.reduce((a, b) => a + b, 0) / entry.hourly.length) : null }));

  const counts = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const row of rows) counts[(kstWeekday(row.scheduled_at) + 6) % 7][kstHour(row.scheduled_at)] += 1;
  const heat = counts.map((line) => line.map((count) => Math.round(count / Math.max(1, rows.length) * 1000) / 10));

  const streams = new Map<string, ChannelRow[]>();
  for (const row of rows) { const list = streams.get(row.stream_id) || []; list.push(row); streams.set(row.stream_id, list); }
  const log = [...streams.entries()].map(([streamId, list]) => {
    const hourly = list.filter((row) => isHourlyAt(row.scheduled_at)).map((row) => row.viewers);
    const minutesBy = new Map<string, number>();
    for (const row of list) minutesBy.set(row.category_name, (minutesBy.get(row.category_name) || 0) + 1);
    const category = [...minutesBy.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return { streamId, date: list[0].scheduled_at, title: list[list.length - 1].title, category: isGameCategory(category) ? gameName(category) : categoryLabel(category), isGame: isGameCategory(category), minutes: list.length * 10, avg: hourly.length ? Math.round(hourly.reduce((a, b) => a + b, 0) / hourly.length) : null, peak: hourly.length ? Math.max(...hourly) : null };
  }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);

  // 자주 쓰는 태그: 그 태그를 단 방송 수와 그 방송들의 평균 시청자(정의서 T6).
  const tagStats = new Map<string, { tag: string; streams: Set<string> }>();
  for (const row of rows) {
    if (!row.tags) continue;
    let list: unknown = [];
    try { list = JSON.parse(row.tags); } catch { continue; }
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (typeof raw !== 'string') continue;
      const norm = normalizeBoardTag(raw);
      if (!norm) continue;
      const entry = tagStats.get(norm) || { tag: raw.replace(/^#/, ''), streams: new Set<string>() };
      entry.streams.add(row.stream_id); tagStats.set(norm, entry);
    }
  }
  const streamAvg = new Map(log.map((entry) => [entry.streamId, entry.avg]));
  const tags = [...tagStats.values()].sort((a, b) => b.streams.size - a.streams.size).slice(0, 10).map((entry) => {
    const avgs = [...entry.streams].map((s) => streamAvg.get(s)).filter((v): v is number => typeof v === 'number');
    return { tag: entry.tag, broadcasts: entry.streams.size, avg: avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null };
  });

  const liveRow = latestRun ? all.find((row) => row.scheduled_at === latestRun.scheduled_at) : undefined;
  const name = info?.name || latestRow?.channel_name || id;
  const parts: string[] = [];
  if (current.broadcasts) parts.push(`최근 ${days}일 동안 ${current.broadcasts}번 방송했고, 기록된 방송 시간은 ${Math.floor(current.minutes / 60)}시간이에요.`);
  if (current.avg !== null && prev?.avg) { const change = Math.round((current.avg - prev.avg) / prev.avg * 100); if (Math.abs(change) >= 5) parts.push(`평균 시청자는 앞 ${days}일보다 ${Math.abs(change)}% ${change > 0 ? '늘었어요' : '줄었어요'}.`); }
  if (games[0] && games[0].share >= 20) parts.push(`방송 시간의 ${games[0].share}%를 「${games[0].name}」에 썼어요.`);
  return {
    asOf: latestRun?.scheduled_at || null, nextAt: boardNextAt(now), days, coverageDays, prevReady,
    channel: { channelKey: key, platform, name, affiliation: info?.affiliation || '', imageUrl: info?.imageUrl || latestRow?.image_url || null, channelUrl: platform === 'CHZZK' ? `https://chzzk.naver.com/${id}` : `https://www.sooplive.co.kr/station/${id}`, profileSlug: info?.slug || null, followers },
    live: liveRow ? { viewers: liveRow.viewers, category: isGameCategory(liveRow.category_name) ? gameName(liveRow.category_name) : categoryLabel(liveRow.category_name), liveUrl: liveRow.live_url } : null,
    summary: parts.length >= 2 ? parts.join(' ') : null,
    kpis: { ...current, prev: prev ? { avg: prev.avg, minutes: prev.minutes, broadcasts: prev.broadcasts } : null, peakDate: peakRow ? kstDate(peakRow.scheduled_at) : null },
    trend, games, heat, log, tags,
  };
}

// 다음 10분 회차(수집 완료 여유 2분 포함)까지 응답을 재사용한다. 이번 회차가 아직 없으면 1분만 둔다.
export function boardCacheSeconds(asOf: string | null, now = Date.now()): number {
  const currentSlot = Math.floor(now / SLOT) * SLOT;
  if (!asOf || Date.parse(asOf) < currentSlot) return 60;
  return Math.max(60, Math.round((currentSlot + SLOT + 2 * 60000 - now) / 1000));
}
