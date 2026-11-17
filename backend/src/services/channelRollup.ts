// 채널 요약 만들기(마이그레이션 0066). 매일 오전 7시(한국 시간) 전날 기록으로
// 방송별 몫(analytics_channel_streams)과 채널×날(analytics_channel_daily)을 만든다.
// - 대상은 등록 버튜버 채널만(버튜버 DB·랭킹·프로필용). 상위 100의 다른 채널은 원본 90일로 충분하다.
// - 같은 날을 다시 만들어도 덮어쓰기라 숫자가 두 번 더해지지 않는다.
// - D1 쿼리당 바인딩 100개 이하로 여러 행을 묶어 쓴다.
import { mergeChannelRows } from './analyticsBoardService';
import { channelSamplesReady, readTrackTargets } from './trackedChannelCollection';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { SOOP_MAIN_LIMIT } from './broadcastStatisticsSources';

const DAY_MS = 86400000;
const READY_TTL_MS = 10 * 60 * 1000;
let ready: { at: number; ok: boolean } | null = null;
export function resetRollupsCheck(): void { ready = null; }
export async function rollupsReady(db: D1Database, now = Date.now()): Promise<boolean> {
  if (ready && now - ready.at < READY_TTL_MS) return ready.ok;
  let ok = false;
  try { await db.prepare('SELECT 1 FROM analytics_channel_streams LIMIT 1').first(); await db.prepare('SELECT 1 FROM analytics_channel_daily LIMIT 1').first(); ok = true; } catch { ok = false; }
  ready = { at: now, ok };
  return ok;
}

export const kstDay = (ms: number) => new Date(ms + 9 * 3600000).toISOString().slice(0, 10);
const kstHourOf = (iso: string) => new Date(Date.parse(iso) + 9 * 3600000).getUTCHours();

// 요약 대상: 등록 버튜버 채널(직접 기록 대상 + 10분 수집의 SOOP 40곳).
export async function readRollupTargets(db: D1Database): Promise<Set<string>> {
  const keys = new Set(await readTrackTargets(db));
  const soop = await db.prepare(`SELECT channel_url FROM streamerChannel WHERE platform = 'SOOP' ORDER BY id LIMIT ${SOOP_MAIN_LIMIT}`).all<{ channel_url: string }>();
  for (const row of soop.results || []) { const key = activityChannelKey('SOOP', row.channel_url); if (key) keys.add(key); }
  return keys;
}

interface Row { scheduled_at: string; channel_key: string; stream_id: string; channel_name: string | null; image_url: string | null; live_url: string | null; title: string; category_name: string; viewers: number }

// 여러 행을 한 쿼리로 묶는다(행당 바인딩 수 × 행 수 ≤ 100).
function chunked<T>(rows: T[], perRow: number): T[][] {
  const size = Math.max(1, Math.floor(100 / perRow));
  return Array.from({ length: Math.ceil(rows.length / size) }, (_, index) => rows.slice(index * size, index * size + size));
}

export async function buildDailyRollup(db: D1Database, day: string, now = Date.now()): Promise<{ day: string; channels: number; streams: number; skipped?: string }> {
  if (!(await rollupsReady(db, now))) return { day, channels: 0, streams: 0, skipped: 'table-missing' };
  const from = new Date(Date.parse(`${day}T00:00:00+09:00`)).toISOString();
  const to = new Date(Date.parse(from) + DAY_MS).toISOString();
  const targets = await readRollupTargets(db);
  const [snapshots, samples] = await Promise.all([
    db.prepare(`SELECT r.scheduled_at, s.channel_key, s.stream_id, s.channel_name, NULL AS image_url, NULL AS live_url, s.title, s.category_name, s.viewers
      FROM analytics_broadcast_runs r JOIN analytics_broadcast_snapshots s ON s.run_id = r.run_id
      WHERE r.scheduled_at >= ? AND r.scheduled_at < ? AND r.state IN ('available','partial')`).bind(from, to).all<Row>(),
    (await channelSamplesReady(db, now)) ? db.prepare(`SELECT sampled_at AS scheduled_at, channel_key, stream_id, channel_name, NULL AS image_url, NULL AS live_url, title, category_name, viewers
      FROM analytics_channel_samples WHERE sampled_at >= ? AND sampled_at < ?`).bind(from, to).all<Row>() : Promise.resolve({ results: [] as Row[] }),
  ]);
  const group = (rows: Row[]) => {
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      const key = `${row.channel_key.split(':')[0].toUpperCase()}:${row.channel_key.split(':')[1]?.toLowerCase()}`;
      if (!targets.has(key)) continue;
      const list = map.get(key) || []; list.push(row); map.set(key, list);
    }
    return map;
  };
  const snapBy = group(snapshots.results || []), sampleBy = group(samples.results || []);
  const keys = [...new Set([...snapBy.keys(), ...sampleBy.keys()])];
  const dailyRows: Array<[string, string, string, number, string]> = [];
  const streamRows: Array<[string, string, string, string, number, number, number, number, string, string, string]> = [];
  for (const key of keys) {
    const platform = key.split(':')[0];
    const merged = mergeChannelRows(snapBy.get(key) || [], sampleBy.get(key) || []);
    const hours = Array(24).fill(0) as number[];
    let minutes = 0;
    const streams = new Map<string, { minutes: number; points: number; sum: number; peak: number; cats: Record<string, number>; title: string }>();
    for (const row of merged) {
      const weight = row.weight ?? 10;
      minutes += weight; hours[kstHourOf(row.scheduled_at)] += weight;
      const entry = streams.get(row.stream_id) || { minutes: 0, points: 0, sum: 0, peak: 0, cats: {}, title: row.title };
      entry.minutes += weight; entry.cats[row.category_name] = (entry.cats[row.category_name] || 0) + weight; entry.title = row.title;
      if (row.vp) { entry.points += 1; entry.sum += row.viewers; entry.peak = Math.max(entry.peak, row.viewers); }
      streams.set(row.stream_id, entry);
    }
    dailyRows.push([key, day, platform, minutes, JSON.stringify(hours)]);
    for (const [streamId, entry] of streams) {
      const top = Object.entries(entry.cats).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      streamRows.push([key, streamId, platform, day, entry.minutes, entry.points, entry.sum, entry.peak, top, JSON.stringify(entry.cats), entry.title.slice(0, 200)]);
    }
  }
  const statements = [
    ...chunked(dailyRows, 5).map((rows) => db.prepare(`INSERT INTO analytics_channel_daily (channel_key, day, platform, minutes, hours) VALUES ${rows.map(() => '(?,?,?,?,?)').join(',')}
      ON CONFLICT(channel_key, day) DO UPDATE SET minutes = excluded.minutes, hours = excluded.hours`).bind(...rows.flat())),
    ...chunked(streamRows, 11).map((rows) => db.prepare(`INSERT OR REPLACE INTO analytics_channel_streams
      (channel_key, stream_id, platform, day, minutes, viewer_points, viewer_sum, viewer_peak, top_category, category_minutes, title) VALUES ${rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')}`).bind(...rows.flat())),
  ];
  if (statements.length) await db.batch(statements);
  return { day, channels: dailyRows.length, streams: streamRows.length };
}

// 팔로워 수(치지직): 오늘 아직 확인하지 않은 등록 채널을 한 번에 몇 곳씩 확인한다(직접 기록 실행에 붙여 외부 호출 한도를 나눠 씀).
export const FOLLOWER_BATCH = 60; // 하루 1회/채널. 몇 번의 실행 안에 등록 치지직 채널 전부를 확인한다
export async function recordFollowers(db: D1Database, chzzkKeys: string[], now: number, fetcher: (url: string) => Promise<any>): Promise<number> {
  if (!chzzkKeys.length || !(await rollupsReady(db, now))) return 0;
  const day = kstDay(now);
  const done = new Set(((await db.prepare('SELECT channel_key FROM analytics_channel_daily WHERE day = ? AND followers IS NOT NULL').bind(day).all<{ channel_key: string }>()).results || []).map((row) => row.channel_key));
  const todo = chzzkKeys.filter((key) => !done.has(key)).slice(0, FOLLOWER_BATCH);
  const rows: Array<[string, string, string, number]> = [];
  for (const key of todo) {
    try {
      const data = await fetcher(`https://api.chzzk.naver.com/service/v1/channels/${key.split(':')[1]}`);
      const count = data?.content?.followerCount;
      if (typeof count === 'number' && Number.isFinite(count)) rows.push([key, day, 'CHZZK', count]);
    } catch { /* 이번엔 건너뛰고 다음 실행에서 다시 확인 */ }
  }
  if (rows.length) {
    await db.prepare(`INSERT INTO analytics_channel_daily (channel_key, day, platform, followers) VALUES ${rows.map(() => '(?,?,?,?)').join(',')}
      ON CONFLICT(channel_key, day) DO UPDATE SET followers = excluded.followers`).bind(...rows.flat()).run();
  }
  return rows.length;
}
