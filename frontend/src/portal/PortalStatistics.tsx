import { t, usePortalLocale } from './portalLocale';
import { useState } from 'react';
import { AnalyticsLayout } from '../components/analytics/AnalyticsLayout';

// 같은 실제 통계에서 전체·콘텐츠·시간대의 읽기 목적을 선택한다.
export function PortalStatistics({ path, onNavigate }: { path: string; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [view, setView] = useState('all');
  const personal = path.startsWith('/analytics/streamer/');
  return <div className={`vd-statistics vd-stat-${view}`}><div className="vd-stat-intro"><p>{personal ? t("방송 활동과 지난 기록을 살펴보세요.") : t("치지직·SOOP의 방송 통계에서 인기 콘텐츠와 활동 시간대를 살펴보세요.")}</p>{!personal && <div className="vd-segment" aria-label={t("통계 분석 목적")}>{[['all', t("종합")], ['category', t("콘텐츠 탐색")], ['time', t("방송 시간대")]].map(([value, label]) => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>}</div><AnalyticsLayout currentSubPath={path} onNavigateSubPath={onNavigate} /></div>;
}
