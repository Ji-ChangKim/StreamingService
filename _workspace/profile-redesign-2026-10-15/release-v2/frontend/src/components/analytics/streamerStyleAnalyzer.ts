import type { StreamerBroadcastHistoryItem } from '../../../../shared/statisticsStreamerSearch';
import { countFormat, formatKstDateKorean } from './statisticsModel';

export interface StreamerStyleReport {
  headline: string;
  narrative: string;
  tags: string[];
  topCategories: Array<{ name: string; percentage: number; count: number }>;
  avgDurationMinutes: number;
  peakBroadcast: { title: string; viewers: number; dateText: string } | null;
  totalBroadcastCount: number;
}

// 1. 방송 시작 시간대 및 평균 방송 시간 계산 (단일 책임)
function calculateBroadcastTimePattern(broadcasts: StreamerBroadcastHistoryItem[]): {
  timeLabel: string;
  startHourRange: string;
  avgDurationMinutes: number;
  isMarathon: boolean;
} {
  if (!broadcasts.length) {
    return { timeLabel: '자유로운 시간대', startHourRange: '정보 없음', avgDurationMinutes: 0, isMarathon: false };
  }

  let totalMinutes = 0;
  const startHours: number[] = [];

  for (const b of broadcasts) {
    if (b.startedAt) {
      const start = new Date(b.startedAt);
      const end = new Date(b.lastObservedAt);
      const diffMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
      totalMinutes += diffMin;

      // KST 기준 시간 (UTC + 9)
      const kstHour = (start.getUTCHours() + 9) % 24;
      startHours.push(kstHour);
    }
  }

  const avgMinutes = Math.round(totalMinutes / broadcasts.length);
  const isMarathon = avgMinutes >= 300; // 5시간 이상

  // 가장 빈번한 시작 시간대 파악
  const nightCount = startHours.filter((h) => h >= 21 || h < 4).length;
  const eveningCount = startHours.filter((h) => h >= 17 && h < 21).length;
  const afternoonCount = startHours.filter((h) => h >= 12 && h < 17).length;
  const morningCount = startHours.filter((h) => h >= 6 && h < 12).length;

  let timeLabel = '심야 올빼미형';
  let startHourRange = '밤 21:00 ~ 새벽 02:00';

  if (eveningCount >= nightCount && eveningCount >= afternoonCount && eveningCount >= morningCount) {
    timeLabel = '저녁 골든타임형';
    startHourRange = '저녁 18:00 ~ 21:00';
  } else if (afternoonCount >= nightCount && afternoonCount >= eveningCount && afternoonCount >= morningCount) {
    timeLabel = '낮방 힐링형';
    startHourRange = '오후 12:00 ~ 17:00';
  } else if (morningCount >= nightCount && morningCount >= eveningCount && morningCount >= afternoonCount) {
    timeLabel = '활기찬 모닝 루틴형';
    startHourRange = '아침 07:00 ~ 11:00';
  }

  return { timeLabel, startHourRange, avgDurationMinutes: avgMinutes, isMarathon };
}

// 2. 카테고리 분포 및 점유율 계산 (단일 책임)
function calculateCategoryDistribution(broadcasts: StreamerBroadcastHistoryItem[]): Array<{
  name: string;
  percentage: number;
  count: number;
}> {
  if (!broadcasts.length) return [];

  const counts = new Map<string, number>();
  for (const b of broadcasts) {
    const cat = b.categoryName || '기타';
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }

  const total = broadcasts.length;
  const sorted = [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, 3);
}

// 3. 방송 제목 키워드 분석 (단일 책임)
function extractContentKeywords(broadcasts: StreamerBroadcastHistoryItem[]): {
  focusKeyword: string;
  tags: string[];
} {
  const combinedTitles = broadcasts.map((b) => b.title).join(' ').toLowerCase();

  const tags: string[] = [];
  let focusKeyword = '시청자와의 소통';

  if (/합방|내전|대회|게스트|콜라보|crew/.test(combinedTitles)) {
    tags.push('#유쾌한_합방케미');
    focusKeyword = '동료들과의 활발한 콜라보 합방';
  }

  if (/노래|우타|sing|콘서트|busking/.test(combinedTitles)) {
    tags.push('#보컬_음악방송');
  }

  if (/시참|참여|팬게임|조공/.test(combinedTitles)) {
    tags.push('#팬참여_소통왕');
  }

  if (/랭크|티어|승급|챌린저|마스터|배치/.test(combinedTitles)) {
    tags.push('#승부욕_랭크도전');
  }

  if (/공포|신작|엔딩|스팀|종합게임/.test(combinedTitles)) {
    tags.push('#몰입감_종겜탐험');
  }

  if (/잡담|노가리|소통|후기|썰|qna/.test(combinedTitles)) {
    tags.push('#진솔한_소통러');
  }

  return { focusKeyword, tags };
}

// 4. 기간 내 최고 피크 방송 도출 (단일 책임)
function findPeakHighlight(broadcasts: StreamerBroadcastHistoryItem[]): {
  title: string;
  viewers: number;
  dateText: string;
} | null {
  if (!broadcasts.length) return null;

  let peak = broadcasts[0];
  for (const b of broadcasts) {
    if (b.peakViewers > peak.peakViewers) {
      peak = b;
    }
  }

  if (peak.peakViewers <= 0) return null;

  const dateStr = peak.startedAt ? peak.startedAt.slice(0, 10) : peak.lastObservedAt.slice(0, 10);
  return {
    title: peak.title,
    viewers: peak.peakViewers,
    dateText: formatKstDateKorean(dateStr),
  };
}

// 5. 방송 데이터로부터 자연어 방송 스타일 요약 리포트 생성 (단일 책임 메인 함수)
export function generateStreamerStyleReport(
  streamerName: string,
  broadcasts: StreamerBroadcastHistoryItem[],
  period: 'weekly' | 'monthly' = 'weekly',
): StreamerStyleReport {
  const periodText = period === 'weekly' ? '최근 7일간' : '최근 30일간';
  const periodLabel = period === 'weekly' ? '주간' : '월간';

  if (!broadcasts.length) {
    return {
      headline: `${streamerName} 님의 방송 스타일 데이터를 분석 중이에요.`,
      narrative: `${periodText} 기록된 방송 세션이 아직 없어 스타일 리포트를 생성할 수 없습니다. 방송이 진행되면 자동으로 분석됩니다.`,
      tags: ['#신규_활동준비중'],
      topCategories: [],
      avgDurationMinutes: 0,
      peakBroadcast: null,
      totalBroadcastCount: 0,
    };
  }

  const timePattern = calculateBroadcastTimePattern(broadcasts);
  const topCategories = calculateCategoryDistribution(broadcasts);
  const contentAnalysis = extractContentKeywords(broadcasts);
  const peak = findPeakHighlight(broadcasts);

  // 태그 조합
  const tags: string[] = [];
  tags.push(`#${timePattern.timeLabel.replace(/\s+/g, '_')}`);
  if (timePattern.isMarathon) tags.push('#마라톤_롱런방송');
  if (topCategories[0]) tags.push(`#${topCategories[0].name.replace(/\s+/g, '_')}_진심`);
  for (const t of contentAnalysis.tags) {
    if (tags.length < 5 && !tags.includes(t)) tags.push(t);
  }
  if (peak && peak.viewers >= 100) {
    tags.push(`#피크_${countFormat(peak.viewers)}명_돌파`);
  }

  // 헤드라인 문장
  const hours = Math.floor(timePattern.avgDurationMinutes / 60);
  const minutes = timePattern.avgDurationMinutes % 60;
  const durationText = hours > 0 ? `${hours}시간 ${minutes > 0 ? `${minutes}분` : ''}` : `${minutes}분`;

  const topCategoryName = topCategories[0]?.name || '소통';
  const topCategoryPercent = topCategories[0]?.percentage || 0;

  const headline = `주로 ${timePattern.startHourRange}에 시작해 평균 ${durationText} 동안 ${timePattern.isMarathon ? '롱런하는' : '안정적으로 진행하는'} ${timePattern.timeLabel} 스트리머예요.`;

  // 내러티브 단락 구성
  let categoryNarrative = '';
  if (topCategories.length === 1) {
    categoryNarrative = `${periodText} 방송의 대부분(${topCategoryPercent}%)을 [${topCategoryName}] 콘텐츠에 집중했어요.`;
  } else if (topCategories.length >= 2) {
    categoryNarrative = `${periodText} 방송의 ${topCategoryPercent}%를 [${topCategoryName}]에 집중했으며, [${topCategories[1].name}](${topCategories[1].percentage}%) 콘텐츠도 꾸준히 함께 즐겼어요.`;
  }

  let peakNarrative = '';
  if (peak) {
    peakNarrative = ` 이번 ${periodLabel} 가장 시청자 반응이 뜨거웠던 방송은 ${peak.dateText} 진행된 "${peak.title}"(최고 ${countFormat(peak.viewers)}명)이었습니다.`;
  }

  const narrative = `${categoryNarrative} ${contentAnalysis.focusKeyword}에 대한 몰입도가 돋보이며,${peakNarrative}`;

  return {
    headline,
    narrative,
    tags: tags.slice(0, 5),
    topCategories,
    avgDurationMinutes: timePattern.avgDurationMinutes,
    peakBroadcast: peak,
    totalBroadcastCount: broadcasts.length,
  };
}
