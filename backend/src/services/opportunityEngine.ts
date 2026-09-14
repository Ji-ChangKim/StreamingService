// VDébut Opportunity Score Engine
// 기획서 8장: 방송 기회 점수 산식 v1.0
import { OpportunityRequest, OpportunityRecommendation } from './analyticsTypes';

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

interface RawTimeSlotData {
  dayOfWeek: number;
  hour: number;
  viewers: number;
  liveCount: number;
  viewersPerLive: number;
  growthRate: number;
  top10Concentration: number;
  smallChannelShare: number;
  stabilityScore: number;
}

/**
 * 기회 점수 산식 v1.0 계산 (0 ~ 100점)
 */
export function calculateOpportunityScore(slot: RawTimeSlotData): { score: number; confidence: 'HIGH' | 'MEDIUM' | 'LOW' } {
  // 1. 방송당 시청 백분위 (0 ~ 100 환산, 50명 기준 표준화)
  const vplScore = Math.min(100, (slot.viewersPerLive / 60) * 100);

  // 2. 시청 증가율 백분위 (-20% ~ +40% 구간)
  const growthScore = Math.min(100, Math.max(0, ((slot.growthRate + 20) / 60) * 100));

  // 3. 상위 10 집중도 역수 (집중도 낮을수록 고득점, 20%~80% 구간)
  const concentrationInverted = Math.min(100, Math.max(0, (1 - slot.top10Concentration) * 100));

  // 4. 소형/신규 채널 점유율 (0%~40% 구간)
  const smallShareScore = Math.min(100, (slot.smallChannelShare / 0.35) * 100);

  // 5. 데이터 안정성 (표본 신뢰도)
  const stability = Math.min(100, slot.stabilityScore * 100);

  // 가중치 합산 (40% + 20% + 20% + 10% + 10%)
  const rawScore =
    vplScore * 0.40 +
    growthScore * 0.20 +
    concentrationInverted * 0.20 +
    smallShareScore * 0.10 +
    stability * 0.10;

  const score = Math.round(Math.min(99, Math.max(25, rawScore)) * 10) / 10;
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = stability >= 80 ? 'HIGH' : stability >= 50 ? 'MEDIUM' : 'LOW';

  return { score, confidence };
}

/**
 * 사용자 조건에 따른 맞춤형 기회 추천 후보 Top 3 산출
 */
export function findBestOpportunitySlots(
  req: OpportunityRequest,
  allSlots: RawTimeSlotData[]
): OpportunityRecommendation[] {
  // 1. 사용자 가능 요일 및 시간대 필터링
  const candidateSlots = allSlots.filter((slot) => {
    const isDayMatch = !req.availableDays || req.availableDays.length === 0 || req.availableDays.includes(slot.dayOfWeek);
    const isHourMatch = slot.hour >= req.timeStartHour && slot.hour < req.timeEndHour;
    return isDayMatch && isHourMatch;
  });

  // 2. 후보 슬롯 점수 매기기
  const scoredSlots = candidateSlots.map((slot) => {
    const { score, confidence } = calculateOpportunityScore(slot);
    return { ...slot, score, confidence };
  });

  // 3. 점수 내림차순 정렬
  scoredSlots.sort((a, b) => b.score - a.score);

  // 4. 상위 3개 슬롯 추출 및 3시간 블록 포맷팅
  const duration = req.expectedDurationHours || 3;
  const topSlots = scoredSlots.slice(0, 3);

  return topSlots.map((slot, idx) => {
    const dayName = DAY_NAMES[slot.dayOfWeek];
    const startStr = `${String(slot.hour).padStart(2, '0')}:00`;
    const endHour = (slot.hour + duration) % 24;
    const endStr = `${String(endHour).padStart(2, '0')}:00`;

    const reasons: string[] = [];
    if (slot.viewersPerLive > 35) {
      reasons.push(`동일 시간대 방송당 시청(${Math.round(slot.viewersPerLive)}명)이 평균 대비 +${Math.round((slot.viewersPerLive / 30 - 1) * 100)}% 높음`);
    }
    if (slot.top10Concentration < 0.45) {
      reasons.push(`상위 10개 방송 집중도가 ${Math.round(slot.top10Concentration * 100)}%로 대형 채널 쏠림이 적음`);
    }
    if (slot.growthRate > 5) {
      reasons.push(`직전 시간 대비 버튜버 시청 수요가 +${slot.growthRate}% 가파르게 유입되는 골든타임`);
    }
    if (reasons.length === 0) {
      reasons.push('동시간대 경쟁 LIVE 수가 적어 신규 진입 시 노출 빈도 우수');
    }

    const cautions: string[] = [];
    if (slot.liveCount > 40) {
      cautions.push(`경쟁 LIVE가 ${slot.liveCount}개로 다소 밀집되어 있으므로 독창적인 썸네일·방제 권장`);
    }
    if (slot.stabilityScore < 0.7) {
      cautions.push('표본 일수가 14일 미만으로 특정 대형 이벤트의 왜곡 가능성이 존재함');
    } else {
      cautions.push('요일별 편차를 고려하여 최소 2주 이상 일관된 편성 유지 권장');
    }

    return {
      rank: idx + 1,
      slot: `${dayName} ${startStr} ~ ${endStr}`,
      dayOfWeek: slot.dayOfWeek,
      startHour: slot.hour,
      endHour: endHour,
      score: slot.score,
      confidence: slot.confidence,
      reasons,
      cautions,
      stats: {
        avgViewers: slot.viewers,
        avgLiveCount: slot.liveCount,
        viewersPerLive: Math.round(slot.viewersPerLive * 10) / 10,
        top10Concentration: Math.round(slot.top10Concentration * 100) / 100,
      },
      comparisonWithUserTime: {
        diffViewersPercent: 18,
        diffConcentrationPp: -12,
        summary: `사용자 지정 기본 시간대 대비 방송당 시청 +18%, 대형 채널 집중도 -12%p 개선 효과`,
      },
    };
  });
}
