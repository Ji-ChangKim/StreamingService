import { useEffect, useState } from 'react';
import type { AnalyticsChannelBoard, ChannelPeriod } from '../../../../../shared/analyticsBoard';
import { ComboChart, HBars, Lede, PlatformIcon, Seg, asOfLabel, gamePath, linkProps, num, people, platformLine, tagPath, useHourlyData } from './boardParts';
import './analyticsBoard.css';

const SCALE = ['#EAF5EE', '#BFE3CB', '#7CC59A', '#2F9E63', '#13693F'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const hours = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}` : `${minutes}분`;
const shortDate = (iso: string) => { const d = new Date(Date.parse(iso) + 9 * 3600000); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][d.getUTCDay()]})`; };

function readDays(): ChannelPeriod {
  const value = Number(new URLSearchParams(window.location.search).get('days'));
  return value === 7 || value === 90 ? value : 30;
}

function Delta({ now, before, unit = '%' }: { now: number | null; before: number | null | undefined; unit?: string }) {
  if (now === null || before === null || before === undefined || before === 0) return <span className="ab-note">앞 기간 기록 없음</span>;
  const change = unit === '%' ? Math.round((now - before) / before * 100) : Math.round(now - before);
  if (change === 0) return <span className="ab-note">앞 기간과 같음</span>;
  // 앞 기간 기록이 아주 적으면 비율이 의미 없이 커지므로 말로만 적는다.
  if (unit === '%' && change >= 300) return <span className="ab-delta up">앞 기간보다 크게 늘었어요</span>;
  return <span className={`ab-delta ${change > 0 ? 'up' : 'down'}`}>앞 기간보다 {change > 0 ? '▲' : '▼'} {Math.abs(change)}{unit}</span>;
}

// 채널 페이지(정의서 7.4): 이 채널은 언제, 무엇을, 얼마나 방송했고 얼마나 봤나.
export function ChannelBoardPage({ channelKey, onNavigate }: { channelKey: string; onNavigate: (path: string) => void }) {
  const [days, setDays] = useState<ChannelPeriod>(readDays);
  const [logCount, setLogCount] = useState(20);
  const { data, error, loading, missing } = useHourlyData<AnalyticsChannelBoard>(`/api/analytics/board/channel?key=${encodeURIComponent(channelKey)}&days=${days}`);
  useEffect(() => { if (data) document.title = `${data.channel.name} 방송 통계 · ${data.channel.platform === 'CHZZK' ? '치지직' : 'SOOP'} | VDébut`; }, [data]);
  useEffect(() => { setLogCount(20); }, [days, channelKey]);
  const pickDays = (next: ChannelPeriod) => {
    setDays(next);
    const url = new URL(window.location.href);
    if (next === 30) url.searchParams.delete('days'); else url.searchParams.set('days', String(next));
    window.history.replaceState(window.history.state, '', url.toString());
  };
  const filled = (data?.heat.flat() || []).filter((v) => v > 0).sort((a, b) => a - b);
  const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => filled[Math.min(filled.length - 1, Math.floor(filled.length * q))] ?? 0);
  const step = (v: number) => cuts.filter((cut) => v > cut).length;
  const ch = data?.channel;

  return <div className="ab">
    <main className="ab-main">
      <nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 채널</nav>
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {error && !data && <div className="ab-error">{error}</div>}
      {missing && <div className="ab-empty">이 채널의 방송 기록을 찾지 못했어요. <a {...linkProps('/analytics', onNavigate)}>방송 통계로 돌아가기</a></div>}
      {data && ch && <>
        <section className="ab-channel-head">
          {ch.imageUrl ? <img className="ab-avatar ab-avatar-lg" src={ch.imageUrl} alt="" referrerPolicy="no-referrer" /> : <span className="ab-avatar ab-avatar-lg" aria-hidden="true" />}
          <div className="ab-channel-id">
            <h1>{ch.name}</h1>
            <p className="ab-plat ab-plat-lg"><PlatformIcon platform={ch.platform} />{platformLine(ch)}</p>
            {ch.followers !== null && <p className="ab-note">팔로워 {num(ch.followers)}명</p>}
          </div>
          <div className="ab-channel-actions">
            {data.live && <span className="ab-live"><i aria-hidden="true" />방송 중 · {people(data.live.viewers)} · {data.live.category}</span>}
            <div className="ab-channel-buttons">
              {data.live?.liveUrl && <a className="ab-watch ab-btn" href={data.live.liveUrl} target="_blank" rel="noopener noreferrer">방송 보기</a>}
              {ch.platform === 'CHZZK'
                ? <a className="ab-official ab-official-chzzk" href={ch.channelUrl} target="_blank" rel="noopener noreferrer" aria-label={`${ch.name}의 치지직 공식 채널 열기 (새 창)`}><img src="/icons/chzzk/chzzklogo_kor_black.png" alt="치지직" /></a>
                : <a className="ab-official ab-official-soop" href={ch.channelUrl} target="_blank" rel="noopener noreferrer" aria-label={`${ch.name}의 SOOP 방송국 열기 (새 창)`}><img src="/icons/soop/soop_logo_blue.svg" alt="SOOP" /></a>}
              {ch.profileSlug && <a className="ab-watch ab-btn" {...linkProps(`/creator/${encodeURIComponent(ch.profileSlug)}`, onNavigate)}>소개 보기</a>}
            </div>
          </div>
        </section>

        <div className="ab-section-head" style={{ marginBottom: -24 }}>
          <span className="ab-note">{asOfLabel(data.asOf)}</span>
          <Seg label="기간" value={String(days) as '7' | '30' | '90'} onChange={(v) => pickDays(Number(v) as ChannelPeriod)} options={[['7', '7일'], ['30', '30일'], ['90', '90일']]} />
        </div>

        {data.kpis.broadcasts === 0 ? <p className="ab-empty">이 기간에는 집계 범위 안에서 기록된 방송이 없어요. <a {...linkProps('/analytics/method', onNavigate)}>집계 기준</a></p> : <>
          <dl className="ab-kv ab-kpis">
            <div><dt>평균 시청자</dt><dd className="ab-kv-large">{data.kpis.avg !== null ? people(data.kpis.avg) : '—'}</dd><Delta now={data.kpis.avg} before={data.kpis.prev?.avg} /></div>
            <div><dt>최고 시청자</dt><dd className="ab-kv-large">{data.kpis.peak !== null ? people(data.kpis.peak) : '—'}</dd>{data.kpis.peakDate && <span className="ab-note">{data.kpis.peakDate.slice(5).replace('-', '월 ')}일</span>}</div>
            <div><dt>기록된 방송 시간</dt><dd className="ab-kv-large">{hours(data.kpis.minutes)}</dd><Delta now={data.kpis.minutes} before={data.kpis.prev?.minutes} /></div>
            <div><dt>방송 횟수</dt><dd className="ab-kv-large">{num(data.kpis.broadcasts)}회</dd><Delta now={data.kpis.broadcasts} before={data.kpis.prev?.broadcasts} unit="회" /></div>
          </dl>

          <Lede text={data.summary} />

          <div className="ab-cols">
            <section className="ab-section" aria-labelledby="ab-ch-trend" style={{ flex: '3 1 560px' }}>
              <h2 id="ab-ch-trend">시청자 추이</h2>
              <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />하루 평균</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />하루 최고</span></div>
              <ComboChart height={200} maxBarWidth={days === 7 ? 32 : days === 30 ? 16 : 8} items={data.trend.map((d, i) => ({ key: d.date, bar: d.avg, line: d.peak, tip: d.avg === null ? `${d.date} 방송 기록 없음` : `${d.date} · 평균 ${people(d.avg)} · 최고 ${people(d.peak)}`, label: days === 7 || (data.trend.length - 1 - i) % (days === 30 ? 7 : 15) === 0 ? d.date.slice(5).replace('-', '/') : '' }))} />
            </section>
            <section className="ab-section" aria-labelledby="ab-ch-games" style={{ flex: '2 1 320px' }}>
              <h2 id="ab-ch-games">게임 구성</h2>
              <p className="ab-note">방송 시간 비율 · 그 콘텐츠에서의 평균 시청자</p>
              <HBars rows={data.games.map((g) => ({ key: g.name, name: g.isGame ? <a {...linkProps(gamePath(g.name), onNavigate)}>{g.name}</a> : <span>{g.name}</span>, value: g.share, text: `${g.share}%${g.avg !== null ? ` · ${people(g.avg)}` : ''}` }))} />
            </section>
          </div>

          {data.tags?.length > 0 && <section className="ab-section" aria-labelledby="ab-ch-tags">
            <h2 id="ab-ch-tags">자주 쓰는 태그</h2>
            <p className="ab-note">기간 동안 방송에 단 태그 · 그 태그를 단 방송의 평균 시청자</p>
            <ul className="ab-chips">{data.tags.map((t) => <li key={t.tag}><a {...linkProps(tagPath(t.tag), onNavigate)}>#{t.tag} <small>{t.broadcasts}회{t.avg !== null ? ` · 평균 ${people(t.avg)}` : ''}</small></a></li>)}</ul>
          </section>}

          <section className="ab-section" aria-labelledby="ab-ch-heat">
            <h2 id="ab-ch-heat">방송 시간대</h2>
            <p className="ab-note">요일·시간대별로 방송한 비율</p>
            <div className="ab-scroll"><div className="ab-heat">
              <div className="ab-heat-row" aria-hidden="true"><span />{Array.from({ length: 24 }, (_, h) => <span key={h} style={{ textAlign: 'center' }}>{h % 3 === 0 ? h : ''}</span>)}</div>
              {data.heat.map((row, d) => <div className="ab-heat-row" key={DAYS[d]}><b>{DAYS[d]}</b>{row.map((v, h) => <i key={h} title={`${DAYS[d]} ${h}시 · 방송 시간의 ${v}%`} style={{ background: v ? SCALE[step(v)] : 'var(--ab-track)' }} />)}</div>)}
            </div></div>
            <div className="ab-scale"><span>적음</span>{SCALE.map((c) => <i key={c} style={{ background: c }} />)}<span>많음</span></div>
          </section>

          <section className="ab-section" aria-labelledby="ab-ch-log">
            <h2 id="ab-ch-log">방송 기록</h2>
            <div className="ab-scroll"><table className="ab-table">
              <thead><tr><th scope="col">날짜</th><th scope="col">제목</th><th scope="col">게임</th><th scope="col" className="num">방송 시간</th><th scope="col" className="num">평균</th><th scope="col" className="num">최고</th></tr></thead>
              <tbody>{data.log.slice(0, logCount).map((row) => <tr key={row.streamId}>
                <td>{shortDate(row.date)}</td><td className="ab-title">{row.title}</td>
                <td>{row.isGame ? <a {...linkProps(gamePath(row.category), onNavigate)}>{row.category}</a> : row.category}</td>
                <td className="num">{hours(row.minutes)}</td><td className="num">{row.avg !== null ? people(row.avg) : '—'}</td><td className="num">{row.peak !== null ? people(row.peak) : '—'}</td>
              </tr>)}</tbody>
            </table></div>
            {data.log.length > logCount && <button type="button" className="ab-more" onClick={() => setLogCount((n) => n + 20)}>20개 더 보기</button>}
            <p className="ab-note">시청자는 매시 정각에 확인한 값이라, 1시간보다 짧은 방송은 '—'로 표시돼요. 방송 시간은 집계 범위 안에서 기록된 시간이에요.</p>
          </section>
        </>}
      </>}
    </main>
  </div>;
}
