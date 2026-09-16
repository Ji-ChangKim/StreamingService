import type { BroadcastStatistics } from '../../../shared/broadcastStatistics';

// 새 통계 화면은 요청 실패를 예시 데이터로 대체하지 않는다.
export async function fetchBroadcastStatistics(signal: AbortSignal): Promise<BroadcastStatistics> {
  const response = await fetch('/api/analytics/broadcast-statistics', { signal });
  if (!response.ok) throw new Error('방송 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  const data: BroadcastStatistics = await response.json();
  if (!data.meta?.generatedAt || !Array.isArray(data.sources) || !Array.isArray(data.lives) || !Array.isArray(data.points) || !Array.isArray(data.peaks)) {
    throw new Error('통계 응답을 확인하지 못했습니다. 다시 시도해 주세요.');
  }
  return data;
}
