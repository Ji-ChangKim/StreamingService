import { useCallback, useEffect, useState } from 'react';
import type { BroadcastStatistics } from '../../../../shared/broadcastStatistics';
import { fetchBroadcastStatistics } from '../../services/broadcastStatisticsApi';

// 화면이 보일 때만 새 데이터를 받고 과거 날짜는 불필요한 자동 갱신을 방지한다 (단일 책임)
export function useBroadcastStatistics(targetDate?: string | null) {
  const [data, setData] = useState<BroadcastStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let disposed = false;
    let active = false;
    let controller: AbortController | undefined;

    const load = async () => {
      if (active || document.hidden) return;
      active = true;
      controller = new AbortController();
      const timer = window.setTimeout(() => controller?.abort(), 25000);
      setLoading(true);
      try {
        const result = await fetchBroadcastStatistics(controller.signal, targetDate);
        if (!disposed) { setData(result); setError(null); }
      } catch {
        if (!disposed) setError('통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        window.clearTimeout(timer);
        active = false;
        if (!disposed) setLoading(false);
      }
    };

    void load();

    // 과거 날짜는 데이터가 고정되어 있으므로 1분 주기 자동 폴링을 실행하지 않는다.
    const isPast = Boolean(targetDate);
    const interval = isPast ? undefined : window.setInterval(() => void load(), 60000);
    const visibility = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', visibility);

    return () => {
      disposed = true;
      controller?.abort();
      if (interval) window.clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [revision, targetDate]);

  return { data, loading, error, refresh };
}
