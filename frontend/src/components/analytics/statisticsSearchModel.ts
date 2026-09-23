import type { BroadcastStatistics } from '../../../../shared/broadcastStatistics';
import type { StatisticsStreamer } from '../../../../shared/statisticsStreamerSearch';
import { normalizeStreamerQuery } from '../../../../shared/statisticsStreamerSearch';

// 등록 채널과 현재·지난 방송의 동일 채널을 한 검색 결과로 합친다.
export function mergeStatisticsStreamers(query: string, registered: StatisticsStreamer[], data: BroadcastStatistics | null): StatisticsStreamer[] {
  const needle = normalizeStreamerQuery(query);
  if (!needle) return [];
  const liveKeys = new Set(data?.lives.map((row) => row.channelKey));
  const channels = new Map<string, StatisticsStreamer>();
  for (const streamer of registered) channels.set(streamer.channelKey || streamer.id, streamer);
  for (const row of [...(data?.lives || []), ...(data?.peaks || [])]) {
    if ((row.platform !== 'CHZZK' && row.platform !== 'SOOP') || !row.channelName || !normalizeStreamerQuery(row.channelName).includes(needle)) continue;
    const key = row.channelKey || row.id;
    const previous = channels.get(key);
    channels.set(key, {
      id: previous?.id || row.id,
      platform: row.platform,
      channelKey: row.channelKey,
      name: row.channelName,
      channelUrl: row.channelUrl || previous?.channelUrl || null,
      imageUrl: row.imageUrl || previous?.imageUrl || null,
      profileSlug: previous?.profileSlug || null,
      isRegistered: previous?.isRegistered ?? false,
      isLive: previous?.isLive ?? liveKeys.has(key),
      followerCount: previous?.followerCount,
    });
  }
  return [...channels.values()].sort((a, b) => {
    const exact = Number(normalizeStreamerQuery(b.name) === needle) - Number(normalizeStreamerQuery(a.name) === needle);
    if (exact !== 0) return exact;
    // VDébut 등록 채널 우선
    const regDiff = Number(Boolean(b.isRegistered)) - Number(Boolean(a.isRegistered));
    if (regDiff !== 0) return regDiff;
    // 현재 LIVE 채널 우선
    const liveDiff = Number(!!b.channelKey && liveKeys.has(b.channelKey)) - Number(!!a.channelKey && liveKeys.has(a.channelKey));
    return liveDiff || a.name.localeCompare(b.name, 'ko');
  });
}
