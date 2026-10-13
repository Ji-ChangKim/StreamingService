import { useEffect, useRef, useState } from 'react';
import type { ActivityBroadcastPage, ActivityFilters, ActivitySelection, BroadcastActivity } from '../../../../shared/broadcastActivity';
import { initialActivityBroadcastPage } from '../../../../shared/activityBroadcastPage';

// 목록만 독립적으로 갱신하고 페이지 조회 중 기존 방송 이력은 유지한다.
export function useActivityBroadcasts(filters: ActivityFilters, selection: ActivitySelection, data: BroadcastActivity) {
  const asOf = data.meta.generatedAt;
  const [page, setPage] = useState<ActivityBroadcastPage | null>(() => initialActivityBroadcastPage(data, selection));
  const [loading, setLoading] = useState(!page);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState('');
  const [attempt, setAttempt] = useState(0);
  const context = JSON.stringify([filters, selection, asOf]);
  const previous = useRef('');
  useEffect(() => {
    if (previous.current !== context) {
      previous.current = context;
      setPage(null); setCursor('');
      if (cursor) return;
    }
    const initial = !cursor && attempt === 0 ? initialActivityBroadcastPage(data, selection) : null;
    if (initial) { setPage(initial); setLoading(false); setError(''); return; }
    const controller = new AbortController();
    setLoading(true); setError('');
    const params = new URLSearchParams({ ...filters, asOf, timeMetric: selection.timeMetric });
    if (selection.day) params.set('day', selection.day);
    if (selection.weekday !== null && selection.hour !== null) {
      params.set('weekday', String(selection.weekday)); params.set('hour', String(selection.hour));
    }
    if (cursor) params.set('cursor', cursor);
    const timer = window.setTimeout(() => { controller.abort(); setLoading(false); setError('조회 시간이 길어지고 있습니다. 다시 시도해 주세요.'); }, 30000);
    void fetch(`/api/analytics/activity/broadcasts?${params}`, { signal: controller.signal, cache: attempt > 0 ? 'reload' : 'default' }).then(async (response) => {
      if (!response.ok) throw new Error('방송 이력 조회 실패');
      const result: ActivityBroadcastPage = await response.json();
      if (!Array.isArray(result.items) || typeof result.total !== 'number') throw new Error('방송 이력 응답 오류');
      if (!controller.signal.aborted) setPage((value) => ({ ...result, items: cursor ? [...(value?.items || []), ...result.items] : result.items }));
    }).catch(() => {
      if (!controller.signal.aborted) setError('방송 이력을 불러오지 못했습니다. 다시 시도해 주세요.');
    }).finally(() => { window.clearTimeout(timer); if (!controller.signal.aborted) setLoading(false); });
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [context, cursor, attempt]);
  return { page, loading, error, retry: () => setAttempt((value) => value + 1), more: () => { if (page?.nextCursor) setCursor(page.nextCursor); } };
}
