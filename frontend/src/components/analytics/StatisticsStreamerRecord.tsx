import { ExternalLink } from 'lucide-react';
import type { BroadcastStatistics } from '../../../../shared/broadcastStatistics';
import type { StatisticsStreamer } from '../../../../shared/statisticsStreamerSearch';
import { StatisticsBrand } from './StatisticsBrand';
import { countFormat, safeStatisticsUrl, statisticsTime } from './statisticsModel';

// 현재 수집 목록에 없는 스트리머도 채널과 등록 프로필로 이동할 수 있다.
export function StatisticsStreamerRecord({ streamer, data, onOpenBroadcast }: { streamer: StatisticsStreamer; data: BroadcastStatistics | null; onOpenBroadcast: (id: string) => void }) {
  const lives = streamer.channelKey ? (data?.lives || []).filter((row) => row.channelKey === streamer.channelKey) : [];
  const records = streamer.channelKey ? (data?.peaks || []).filter((row) => row.channelKey === streamer.channelKey) : [];
  const url = safeStatisticsUrl(streamer.channelUrl);
  const image = safeStatisticsUrl(streamer.imageUrl);
  return <>
    <div className="bs-streamer-profile">{image && <img src={image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}<div><h3>{streamer.name}</h3><StatisticsBrand platform={streamer.platform} /></div></div>
    <div className="bs-record-actions">{url && <a className="bs-button bs-primary" href={url} target="_blank" rel="noopener noreferrer">플랫폼 채널 보기 <ExternalLink size={14} /><span className="bs-sr-only">(새 창)</span></a>}{streamer.profileSlug && <a className="bs-button" href={`/creator/${encodeURIComponent(streamer.profileSlug)}`}>VDébut 프로필 보기</a>}</div>
    <h3>현재 확인된 방송</h3>
    {lives.length ? lives.map((row) => <button key={row.id} className="bs-streamer-broadcast" type="button" onClick={() => onOpenBroadcast(row.id)}><span><strong>{row.title}</strong><span className="bs-small">{row.categoryName} · 방송 기록 보기</span></span><b>{countFormat(row.viewers)}명 <span className="bs-live-tag">LIVE</span></b></button>) : <p className="bs-small">현재 수집 목록에 방송이 없어요. 방송 여부는 플랫폼 채널에서 확인해 주세요.</p>}
    <h3>최근 18시간 기록</h3>
    {records.length ? records.map((row) => <button type="button" className="bs-streamer-broadcast" key={row.id} onClick={() => onOpenBroadcast(row.id)}><span><strong>{row.title}</strong><span className="bs-small">{statisticsTime(row.peakAt, true)} KST · 최고 시청자</span></span><b>{countFormat(row.viewers)}명</b></button>) : <p className="bs-small">이 기간에 저장된 방송 기록이 없어요.</p>}
  </>;
}
