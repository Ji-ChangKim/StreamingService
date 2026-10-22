import { useEffect, useState } from 'react';
import type { PortalProfile } from '../../../shared/portal';
import { portalWebUrl } from '../../../shared/portal';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import type { StreamerHistoryResponse } from '../../../shared/statisticsStreamerSearch';
import { t, getPortalLanguage } from './portalLocale';

// 개인 기록 탭을 열었을 때만 기존 통계 API의 실제 방송 이력을 조회한다.
export function WikiActivity({ profile }: { profile: PortalProfile }) {
  const key = activityChannelKey(profile.platform, profile.channelUrl);
  const [data, setData] = useState<StreamerHistoryResponse>();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(Boolean(key));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setData(undefined); setError(false); setLoading(Boolean(key));
    if (!key) return;
    const abort = new AbortController();
    void fetch(`/api/analytics/streamers/${encodeURIComponent(key)}/history?days=30`, { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const value: StreamerHistoryResponse = await response.json();
      if (value.channelKey.toLowerCase() !== key.toLowerCase() || !Array.isArray(value.broadcasts)) throw new Error();
      if (!abort.signal.aborted) setData(value);
    }).catch(() => { if (!abort.signal.aborted) setError(true); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [key, attempt]);
  const rows = data?.broadcasts || [];
  const counts = Object.entries(rows.reduce<Record<string, number>>((value, row) => { value[row.categoryName] = (value[row.categoryName] || 0) + 1; return value; }, {})).sort((a, b) => b[1] - a[1]);
  return <section className="content-panel"><div className="section-title"><div><h2>{t('방송 활동')}</h2></div><span>{t('최근 30일 · 최대 30개 방송')}</span></div>{loading ? <p className="muted" role="status">{t('방송 기록을 불러오는 중이에요.')}</p> : error ? <div className="soft-empty"><p>{t('방송 기록을 불러오지 못했어요.')}</p><button className="text-button" onClick={() => setAttempt(attempt + 1)}>{t('다시 시도')}</button></div> : rows.length ? <><div className="activity-categories" aria-label={t('조회된 방송의 콘텐츠')}>{counts.slice(0, 5).map(([name, count]) => <div key={name}><span>{name}</span><div><i style={{ width: `${count / Math.max(...counts.map(([, total]) => total)) * 100}%` }} /></div><strong>{t('{0}회', [count])}</strong></div>)}</div><div className="activity-records">{rows.map(row => <article key={row.streamId}><time dateTime={row.startedAt || row.lastObservedAt}>{new Date(row.startedAt || row.lastObservedAt).toLocaleString(getPortalLanguage(), { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><h3>{row.title}</h3><p>{row.categoryName}</p>{portalWebUrl(row.liveUrl || '') && <a href={portalWebUrl(row.liveUrl || '')} target="_blank" rel="noopener noreferrer">{t('방송 채널')}</a>}</article>)}</div></> : <div className="empty-chart"><div><p>{t('확인된 방송 기록이 아직 없어요.')}</p></div></div>}</section>;
}
