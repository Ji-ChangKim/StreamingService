// 버튜버 상세 위쪽(상태 카드·숫자 4개)에 필요한 숫자만 30일 채널 통계에서 뽑는다.
// 서버는 이 값을 첫 HTML에 실어 보내고, 화면도 같은 함수로 계산해 숫자가 바뀌어 보이지 않게 한다.
import type { AnalyticsChannelBoard } from './analyticsBoard';

export interface ProfileHeroStats {
  key: string;
  lastAt: string | null; // 마지막 방송(기록상 첫 시각)
  broadcasts30: number;
  avg: number | null;
  peak: number | null;
  heat: number[][];
  week: { broadcasts: number; minutes: number };
}

export function profileHeroStats(month: AnalyticsChannelBoard, now: number): ProfileHeroStats {
  const since = now - 7 * 86_400_000;
  const recent = month.log.filter((entry) => Date.parse(entry.date) >= since);
  return {
    key: month.channel.channelKey,
    lastAt: month.log[0]?.date || null,
    broadcasts30: month.kpis.broadcasts,
    avg: month.kpis.avg,
    peak: month.kpis.peak,
    heat: month.heat,
    week: { broadcasts: recent.length, minutes: recent.reduce((sum, entry) => sum + entry.minutes, 0) },
  };
}
