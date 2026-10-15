import type { ActivityBroadcastPage, ActivitySelection, BroadcastActivity } from './broadcastActivity';

// 전체 요약에 이미 포함된 최신 목록을 첫 페이지에 재사용한다.
export function initialActivityBroadcastPage(data: BroadcastActivity, selection: ActivitySelection): ActivityBroadcastPage | null {
  if (selection.day || selection.weekday !== null || selection.hour !== null) return null;
  const items = data.broadcasts.slice(0, 25);
  const last = items[items.length - 1];
  if (data.summary.broadcasts > items.length && !last) return null;
  return { items, total: data.summary.broadcasts, asOf: data.meta.generatedAt,
    nextCursor: last && data.summary.broadcasts > items.length ? JSON.stringify([last.lastObservedAt, last.platform, last.channelKey, last.streamId]) : null };
}
