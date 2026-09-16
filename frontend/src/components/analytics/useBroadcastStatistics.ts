import { useCallback, useEffect, useState } from 'react';
import type { BroadcastStatistics } from '../../../../shared/broadcastStatistics';
import { fetchBroadcastStatistics } from '../../services/broadcastStatisticsApi';

// 화면이 보일 때만 새 데이터를 받고 이전 요청과 자동 갱신이 겹치지 않게 한다.
export function useBroadcastStatistics() {
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
        const result = await fetchBroadcastStatistics(controller.signal);
        if (!disposed) { setData(result); setError(null); }
      } catch {
        if (!disposed) setError('새 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        window.clearTimeout(timer);
        active = false;
        if (!disposed) setLoading(false);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 60000);
    const visibility = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; controller?.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', visibility); };
  }, [revision]);
  return { data, loading, error, refresh };
}
