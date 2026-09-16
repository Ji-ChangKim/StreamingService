import type { BroadcastStatistics, StatisticsBroadcast, StatisticsPeak, StatisticsPlatform, StatisticsPlatformFilter } from '../../../../shared/broadcastStatistics';

export const STATISTICS_PLATFORMS: Array<{ id: StatisticsPlatform; name: string; color: string; logo?: string }> = [
  { id: 'SOOP', name: 'SOOP', color: '#2563eb', logo: '/icons/soop/soop_symbol_blue.svg' },
  { id: 'CHZZK', name: '치지직', color: '#009c68', logo: '/icons/chzzk/chzzk-icon-01.png' },
  { id: 'TWITCH', name: '트위치', color: '#9146ff', logo: '/icons/twitch/glitch_flat_purple.svg' },
  { id: 'CHZZM', name: '씨미', color: '#b54c9c' },
];

export interface StatisticsCategory {
  key: string;
  platform: StatisticsPlatform;
  name: string;
  viewers: number;
  channels: number;
}

export interface StatisticsFilters {
  platform: StatisticsPlatformFilter;
  category: string | null;
  hours: number;
  metric: 'viewers' | 'channels' | 'chats';
}

export const countFormat = (value: number) => value.toLocaleString('ko-KR');
export const platformName = (id: StatisticsPlatformFilter) => STATISTICS_PLATFORMS.find((platform) => platform.id === id)?.name || '전체';
export const categoryKey = (row: StatisticsBroadcast) => `${row.platform}:${row.categoryId}`;
export const inPlatform = (row: { platform: StatisticsPlatform }, platform: StatisticsPlatformFilter) => platform === 'ALL' || row.platform === platform;

// 모든 시간 표시는 사용자의 장치 시간대와 관계없이 한국 시각을 사용한다.
export function statisticsTime(value: string | null, withDate = false): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: withDate ? '2-digit' : undefined,
    day: withDate ? '2-digit' : undefined, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value));
}

// 카테고리 이름이 같아도 플랫폼별 원본 ID를 유지한다.
export function aggregateStatisticsCategories(lives: StatisticsBroadcast[]): StatisticsCategory[] {
  const categories = new Map<string, StatisticsCategory>();
  for (const live of lives) {
    const key = categoryKey(live);
    const category = categories.get(key) || { key, platform: live.platform, name: live.categoryName, viewers: 0, channels: 0 };
    category.viewers += live.viewers;
    category.channels++;
    categories.set(key, category);
  }
  return [...categories.values()].sort((a, b) => b.viewers - a.viewers || a.key.localeCompare(b.key));
}

// 채널 순위에서는 채널을 확인할 수 있는 방송 중 최고 기록 하나만 남긴다.
export function getChannelPeaks(peaks: StatisticsPeak[]): StatisticsPeak[] {
  const channels = new Map<string, StatisticsPeak>();
  for (const peak of peaks) {
    if (!peak.channelKey) continue;
    const previous = channels.get(peak.channelKey);
    if (!previous || peak.viewers > previous.viewers) channels.set(peak.channelKey, peak);
  }
  return [...channels.values()].sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id));
}

// 오늘 최고는 한국 자정 이후의 플랫폼 동시시청 합계 중 최댓값이다.
export function dailyPlatformPeak(data: BroadcastStatistics, platform: StatisticsPlatform): number | null {
  const day = new Date(Date.parse(data.meta.generatedAt) + 9 * 3600000).toISOString().slice(0, 10);
  const midnight = Date.parse(`${day}T00:00:00+09:00`);
  const values = data.points.filter((point) => point.platform === platform && !point.partial && Date.parse(point.at) >= midnight).map((point) => point.viewers);
  return values.length ? Math.max(...values) : null;
}

// 외부 링크에는 웹 주소만 허용한다.
export function safeStatisticsUrl(value: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}

// 공유하거나 뒤로 이동했을 때 동일한 플랫폼과 차트 조건을 복원한다.
export function readStatisticsFilters(): StatisticsFilters {
  const params = new URLSearchParams(window.location.search);
  const platform = params.get('platform')?.toUpperCase();
  const hours = Number(params.get('hours'));
  const metric = params.get('metric');
  return {
    platform: STATISTICS_PLATFORMS.some((item) => item.id === platform) ? platform as StatisticsPlatform : 'ALL',
    category: params.get('category'), hours: [6, 12, 24].includes(hours) ? hours : 24,
    metric: metric === 'channels' || metric === 'chats' ? metric : 'viewers',
  };
}

// 다운로드는 표시된 상위 행 수와 관계없이 선택 범위 전체를 내보낸다.
export async function downloadBroadcastStatistics(data: BroadcastStatistics, filters: StatisticsFilters): Promise<void> {
  const XLSX = await import('xlsx');
  const scopedLives = data.lives.filter((row) => inPlatform(row, filters.platform));
  const matchCategory = (row: StatisticsBroadcast) => !filters.category || categoryKey(row) === filters.category;
  const lives = scopedLives.filter(matchCategory);
  const peaks = data.peaks.filter((row) => inPlatform(row, filters.platform) && matchCategory(row));
  const from = Date.parse(data.meta.generatedAt) - filters.hours * 3600000;
  const book = XLSX.utils.book_new();
  const sheets: Array<[string, Record<string, string | number | null>[]]> = [
    ['집계 기준', [
      { 항목: '기준 시각 UTC', 값: data.meta.generatedAt }, { 항목: '표시 시간대', 값: 'Asia/Seoul' },
      { 항목: '플랫폼', 값: platformName(filters.platform) }, { 항목: '방송 및 최고기록 카테고리', 값: filters.category || '전체' },
      { 항목: '추이 기간', 값: `최근 ${filters.hours}시간 · 플랫폼 전체` },
      { 항목: '최고 기록 시작 UTC', 값: data.meta.peakFrom }, { 항목: '과거 기록 범위', 값: data.meta.historyScope },
      { 항목: '과거 기록 상태', 값: data.meta.historyState },
      { 항목: '마지막 과거 수집 UTC', 값: data.meta.lastHistoryAt },
      { 항목: '채팅', 값: '미제공' }, { 항목: '합계 의미', 값: '수집 범위 내 동시시청 합계. 플랫폼 간 중복 시청자를 제거한 순 이용자 수가 아님.' },
    ]],
    ['플랫폼', data.sources.filter((row) => inPlatform(row, filters.platform)).map((source) => ({
      플랫폼: platformName(source.platform), 수집범위: source.scope, 상태: source.state, 기준시각UTC: source.observedAt,
      시청자: source.state === 'unavailable' || source.state === 'unsupported' ? null : scopedLives.filter((live) => live.platform === source.platform).reduce((sum, live) => sum + live.viewers, 0),
      확인채널: source.checkedChannels, 오늘확인최고: dailyPlatformPeak(data, source.platform),
    }))],
    ['실시간 방송', lives.map((row) => ({ 방송ID: row.id, 채널ID: row.channelKey, 플랫폼: platformName(row.platform), 스트리머: row.channelName, 제목: row.title, 카테고리: row.categoryName, 시청자: row.viewers, 시작시각UTC: row.startedAt, 방송주소: row.liveUrl }))],
    ['카테고리', aggregateStatisticsCategories(scopedLives).map((row) => ({ 플랫폼: platformName(row.platform), 카테고리ID: row.key, 카테고리: row.name, 시청자: row.viewers, 채널수: row.channels }))],
    ['시계열', data.points.filter((point) => inPlatform(point, filters.platform) && Date.parse(point.at) >= from).map((point) => ({ 플랫폼: platformName(point.platform), 수집시각UTC: point.at, 시청자: point.viewers, 채널수: point.channels, 구분: point.kind, 수집완료: point.partial ? '일부 확인' : '확인 완료' }))],
    ['방송 최고18시간', peaks.map((row) => ({ 방송ID: row.id, 채널ID: row.channelKey, 플랫폼: platformName(row.platform), 스트리머: row.channelName, 제목: row.title, 카테고리: row.categoryName, 최고시청자: row.viewers, 최고시각UTC: row.peakAt }))],
    ['채널 최고18시간', getChannelPeaks(peaks).map((row) => ({ 채널ID: row.channelKey, 플랫폼: platformName(row.platform), 스트리머: row.channelName, 최고시청자: row.viewers, 최고시각UTC: row.peakAt }))],
  ];
  for (const [name, rows] of sheets) {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 안내: '선택 범위의 자료가 없습니다.' }]);
    sheet['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(book, sheet, name);
  }
  XLSX.writeFile(book, `VDebut_방송통계_${filters.platform}_${data.meta.generatedAt.slice(0, 10)}.xlsx`, { compression: true });
}
