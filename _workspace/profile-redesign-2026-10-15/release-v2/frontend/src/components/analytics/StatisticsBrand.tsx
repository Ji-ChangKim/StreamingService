import type { StatisticsPlatform } from '../../../../shared/broadcastStatistics';
import { STATISTICS_PLATFORMS } from './statisticsModel';

// 공식 원본을 최소 높이 20px로 표시하고 사방 6px의 보호 여백을 둔다.
export function StatisticsBrand({ platform, label = true }: { platform: StatisticsPlatform; label?: boolean }) {
  const brand = STATISTICS_PLATFORMS.find((item) => item.id === platform)!;
  return <span className="bs-brand">
    {brand.logo && <span className="bs-brand-clearspace"><img src={brand.logo} alt={label ? '' : brand.name} width={platform === 'SOOP' ? 35.2 : 20} height={20} /></span>}
    {(label || !brand.logo) && <span>{brand.name}</span>}
  </span>;
}
