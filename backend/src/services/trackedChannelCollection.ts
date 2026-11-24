// 등록 버튜버 직접 기록(기획문서 38번 1항·40번).
// 치지직 상위 100개 수집에 잡히지 않는 등록 버튜버 채널을 5분마다 나눠서 확인하고, 방송 중일 때만 analytics_channel_samples에 남긴다.
// - 한 번 실행에 TRACK_BATCH곳까지 확인한다(넘으면 차례로 나눠 돈다).
// - 테이블(마이그레이션 0065)이 없으면 아무것도 하지 않는다(외부 호출도 하지 않음).
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { fetchPlatformJson, parseStartTime, SOOP_MAIN_LIMIT } from './broadcastStatisticsSources';

export const TRACK_CRON = '2-57/5 * * * *';
// Workers Paid(실행당 외부 호출 1,000번): 등록 채널 전부(현재 약 250곳)를 5분마다 확인한다. 대상이 늘면 이 수만큼씩 나눠 돈다.
export const TRACK_BATCH = 400;
const SLOT_MS = 5 * 60 * 1000;
const READY_TTL_MS = 10 * 60 * 1000;

let samplesReady: { at: number; ok: boolean } | null = null;
export function resetChannelSamplesCheck(): void { samplesReady = null; }
export async function channelSamplesReady(db: D1Database, now = Date.now()): Promise<boolean> {
  if (samplesReady && now - samplesReady.at < READY_TTL_MS) return samplesReady.ok;
  let ok = false;
  try { await db.prepare('SELECT 1 FROM analytics_channel_samples LIMIT 1').first(); ok = true; } catch { ok = false; }
  samplesReady = { at: now, ok };
  return ok;
}

export interface ChannelSample {
  channelKey: string; sampledAt: string; platform: 'CHZZK' | 'SOOP'; streamId: string; channelName: string | null;
  title: string; categoryName: string; viewers: number; startedAt: string | null; tags: string[];
}

// 확인 대상: 공개 등록 버튜버의 치지직 채널 전부 + 10분 수집이 확인하지 않는 SOOP 채널(앞 SOOP_MAIN_LIMIT곳 제외).
// 통계·검색으로 자동 등록된 채널 기록(기본 소개 문구 + 00:00)은 버튜버가 아니므로 뺀다.
export async function readTrackTargets(db: D1Database): Promise<string[]> {
  const [legacy, portal] = await Promise.all([
    db.prepare(`SELECT c.id, c.platform, c.channel_url FROM streamerChannel c JOIN streamerChannel_info i ON i.channel_id = c.id
      WHERE c.platform IN ('CHZZK','SOOP') AND i.slug IS NOT NULL AND i.slug != ''
        AND NOT (i.description = i.display_name || ' 스트리머의 채널입니다.' AND i.debut_time = '00:00')
      ORDER BY c.id`).all<{ id: number; platform: string; channel_url: string }>(),
    db.prepare('SELECT channel_key FROM portal_profile_channels').all<{ channel_key: string }>().catch(() => ({ results: [] as { channel_key: string }[] })),
  ]);
  const soopMain = new Set((await db.prepare(`SELECT channel_url FROM streamerChannel WHERE platform = 'SOOP' ORDER BY id LIMIT ${SOOP_MAIN_LIMIT}`).all<{ channel_url: string }>()).results?.map((row) => activityChannelKey('SOOP', row.channel_url)) || []);
  const keys = new Set<string>();
  for (const row of legacy.results || []) {
    const key = activityChannelKey(row.platform, row.channel_url);
    if (key && !soopMain.has(key)) keys.add(key);
  }
  for (const row of portal.results || []) {
    const [platform, id] = String(row.channel_key || '').split(':');
    const key = platform && id ? `${platform.toUpperCase()}:${id.toLowerCase()}` : '';
    if (/^(CHZZK:[a-f0-9]{32}|SOOP:[a-z0-9_]{1,50})$/.test(key) && !soopMain.has(key)) keys.add(key);
  }
  return [...keys].sort();
}

// 이번 5분 슬롯에 확인할 묶음. 슬롯마다 다음 묶음으로 넘어가 전체를 차례로 돈다.
export function trackBatch(targets: string[], now = Date.now(), size = TRACK_BATCH): string[] {
  if (!targets.length) return [];
  if (targets.length <= size) return targets;
  const start = (Math.floor(now / SLOT_MS) * size) % targets.length;
  return Array.from({ length: size }, (_, index) => targets[(start + index) % targets.length]);
}

type Fetcher = <T>(url: string) => Promise<T>;

// 한 채널의 지금 방송. 방송 중이 아니거나 확인할 수 없으면 null(방송 종료로 단정하지 않고 기록하지 않음).
export async function readChannelLive(key: string, sampledAt: string, fetcher: Fetcher = fetchPlatformJson): Promise<ChannelSample | null> {
  const [platform, id] = key.split(':') as ['CHZZK' | 'SOOP', string];
  try {
    if (platform === 'CHZZK') {
      const data = await fetcher<any>(`https://api.chzzk.naver.com/service/v3/channels/${id}/live-detail`);
      const live = data?.content;
      if (data?.code !== 200 || live?.status !== 'OPEN' || !Number.isFinite(live?.concurrentUserCount)) return null;
      return { channelKey: key, sampledAt, platform, streamId: String(live.liveId ?? `${id}-${live.openDate || sampledAt.slice(0, 10)}`),
        channelName: typeof live.channel?.channelName === 'string' ? live.channel.channelName : null,
        title: typeof live.liveTitle === 'string' && live.liveTitle ? live.liveTitle : '제목 없음',
        categoryName: typeof live.liveCategoryValue === 'string' && live.liveCategoryValue ? live.liveCategoryValue : '카테고리 미제공',
        viewers: live.concurrentUserCount, startedAt: parseStartTime(live.openDate), tags: Array.isArray(live.tags) ? live.tags.filter((tag: unknown) => typeof tag === 'string') : [] };
    }
    const data = await fetcher<any>(`https://chapi.sooplive.co.kr/api/${encodeURIComponent(id)}/station`);
    const broad = data?.broad;
    if (!broad?.broad_no || !Number.isFinite(broad.current_sum_viewer)) return null;
    return { channelKey: key, sampledAt, platform, streamId: String(broad.broad_no), channelName: typeof data?.station?.user_nick === 'string' ? data.station.user_nick : null,
      title: typeof broad.broad_title === 'string' && broad.broad_title ? broad.broad_title : '제목 없음',
      categoryName: typeof broad.broad_cate_name === 'string' && broad.broad_cate_name ? broad.broad_cate_name : '카테고리 미제공',
      viewers: broad.current_sum_viewer, startedAt: null, tags: [] };
  } catch {
    return null;
  }
}

// 5분 예약 실행 본체. 반환값은 로그용.
export async function collectTrackedChannels(db: D1Database, scheduledTime: number, fetcher: Fetcher = fetchPlatformJson): Promise<{ checked: number; live: number; skipped?: string; chzzkTargets?: string[] }> {
  if (!(await channelSamplesReady(db, scheduledTime))) return { checked: 0, live: 0, skipped: 'table-missing' };
  const sampledAt = new Date(Math.floor(scheduledTime / 60000) * 60000).toISOString();
  // 이번 회차 상위 100에 이미 잡힌 치지직 채널은 확인하지 않는다(같은 방송을 두 번 세지 않게, 호출 절약).
  const latestTop = await db.prepare(`SELECT s.channel_key FROM analytics_broadcast_snapshots s
    WHERE s.run_id = (SELECT run_id FROM analytics_broadcast_runs WHERE platform = 'CHZZK' AND state IN ('available','partial') ORDER BY scheduled_at DESC LIMIT 1)`).all<{ channel_key: string }>();
  const inTop = new Set((latestTop.results || []).map((row) => row.channel_key.toLowerCase()));
  const allTargets = await readTrackTargets(db);
  const targets = allTargets.filter((key) => !inTop.has(key.toLowerCase()));
  const batch = trackBatch(targets, scheduledTime);
  const samples: ChannelSample[] = [];
  for (let index = 0; index < batch.length; index += 8) {
    const results = await Promise.all(batch.slice(index, index + 8).map((key) => readChannelLive(key, sampledAt, fetcher)));
    for (const sample of results) if (sample) samples.push(sample);
  }
  // 쿼리 수 한도를 아끼려고 10행씩 한 쿼리로 저장한다(행당 바인딩 10개 × 10행 = 100개 이하).
  for (let index = 0; index < samples.length; index += 10) {
    const rows = samples.slice(index, index + 10);
    await db.prepare(`INSERT OR IGNORE INTO analytics_channel_samples
      (channel_key, sampled_at, platform, stream_id, channel_name, title, category_name, viewers, started_at, tags) VALUES ${rows.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')}`)
      .bind(...rows.flatMap((s) => [s.channelKey, s.sampledAt, s.platform, s.streamId, s.channelName, s.title.slice(0, 300), s.categoryName.slice(0, 120), Math.round(s.viewers), s.startedAt, s.tags.length ? JSON.stringify(s.tags.slice(0, 20)) : null])).run();
  }
  return { checked: batch.length, live: samples.length, chzzkTargets: allTargets.filter((key) => key.startsWith('CHZZK:')) }; // 팔로워는 상위 100에 있는 채널도 확인
}

// 90일 지난 기록 정리(한 시간에 최대 2,000행: 하루 기록량보다 넉넉히 크고 쓰기 한도에는 작게). WITHOUT ROWID라 기본키로 지운다.
export async function pruneChannelSamples(db: D1Database, now = Date.now()): Promise<void> {
  if (!(await channelSamplesReady(db, now))) return;
  await db.prepare(`DELETE FROM analytics_channel_samples WHERE (channel_key, sampled_at) IN
    (SELECT channel_key, sampled_at FROM analytics_channel_samples WHERE sampled_at < ? ORDER BY sampled_at LIMIT 2000)`)
    .bind(new Date(now - 90 * 86400000).toISOString()).run();
}
