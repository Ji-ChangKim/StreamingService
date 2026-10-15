import { useEffect, useState } from 'react';
import type { ActivityFilters, BroadcastActivity } from '../../../../shared/broadcastActivity';

// 주소·조건이 같은 최신 서버 자료만 첫 화면에 재사용한다.
function readInitialActivity(filters: ActivityFilters): BroadcastActivity | null {
  try {
    const initial = JSON.parse(document.getElementById('activity-bootstrap')?.textContent || 'null');
    return initial && Object.keys(filters).every(key => initial.filters[key] === filters[key as keyof ActivityFilters])
      && Date.now() - Date.parse(initial.data.meta.generatedAt) < 120000 ? initial.data : null;
  } catch { return null; }
}

// 새 조회 조건에서 이전 통계를 지우고 실패와 기록 없음을 구분한다.
export function useBroadcastActivity(filters: ActivityFilters, enabled: boolean) {
  const [data, setData] = useState<BroadcastActivity | null>(() => enabled ? readInitialActivity(filters) : null);
  const [loading, setLoading] = useState(enabled && !data);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const { from, to, platform, channel, category } = filters;
  useEffect(() => {
    const controller = new AbortController();
    const initial = enabled && revision === 0 ? readInitialActivity(filters) : null;
    if (initial) { setData(initial); setError(''); setLoading(false); return () => controller.abort(); }
    setData(null); setError(''); setLoading(enabled);
    if (!enabled) return () => controller.abort();
    const timer = window.setTimeout(() => { controller.abort(); setError('조회 시간이 길어지고 있습니다. 다시 시도해 주세요.'); setLoading(false); }, 30000);
    const params = new URLSearchParams({ from, to, platform, channel, category });
    void fetch(`/api/analytics/activity?${params}`, { signal: controller.signal, cache: revision > 0 ? 'reload' : 'default' }).then(async (response) => {
      if (!response.ok) throw new Error('통계 조회 실패');
      const result: BroadcastActivity = await response.json();
      if (!result.meta || !result.summary || !Array.isArray(result.broadcasts)) throw new Error('통계 응답 오류');
      if (!controller.signal.aborted) setData(result);
    }).catch(() => {
      if (!controller.signal.aborted) setError('방송 통계를 불러오지 못했습니다. 다시 시도해 주세요.');
    }).finally(() => {
      window.clearTimeout(timer);
      // 시간 초과는 빈 기록으로 표시하지 않는다.
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [from, to, platform, channel, category, revision, enabled]);
  return { data, loading, error, refresh: () => setRevision((value) => value + 1) };
}
