import type { BroadcastStatistics } from '../../../shared/broadcastStatistics';
import type { StreamerHistoryResponse } from '../../../shared/statisticsStreamerSearch';

// 새 통계 화면은 요청 실패를 예시 데이터로 대체하지 않는다 (단일 책임)
export async function fetchBroadcastStatistics(signal: AbortSignal, date?: string | null, fresh = false): Promise<BroadcastStatistics> {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (fresh) params.set('fresh', 'true');
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const url = `/api/analytics/broadcast-statistics${queryStr}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('방송 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  const data: BroadcastStatistics = await response.json();
  if (!data.meta?.generatedAt || !Array.isArray(data.sources) || !Array.isArray(data.lives) || !Array.isArray(data.points) || !Array.isArray(data.peaks)) {
    throw new Error('통계 응답을 확인하지 못했습니다. 다시 시도해 주세요.');
  }
  // 이전 캐시에 준비 중 플랫폼이 남아 있어도 화면과 다운로드에 포함하지 않는다.
  const visible = (row: { platform: string }) => row.platform === 'SOOP' || row.platform === 'CHZZK';
  return { ...data, sources: data.sources.filter(visible), lives: data.lives.filter(visible), points: data.points.filter(visible), peaks: data.peaks.filter(visible) };
}

// 특정 스트리머의 방송 이력 타임라인을 조회한다 (주간/월간 days 지원, 단일 책임)
export async function fetchStreamerBroadcastHistory(channelKey: string, days = 7, signal?: AbortSignal): Promise<StreamerHistoryResponse | null> {
  try {
    const url = `/api/analytics/streamers/${encodeURIComponent(channelKey)}/history?days=${days}`;
    const response = await fetch(url, { signal });
    if (!response.ok) return null;
    return await response.json() as StreamerHistoryResponse;
  } catch {
    return null;
  }
}
