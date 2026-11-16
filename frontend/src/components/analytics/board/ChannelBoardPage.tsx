import { useEffect, useState } from 'react';
import type { AnalyticsChannelBoard, ChannelPeriod } from '../../../../../shared/analyticsBoard';
import { ComboChart, Lede, PlatformIcon, Seg, ShareBar, Sparkline, asOfLabel, needDays, gamePath, linkProps, num, people, platformLine, tagPath, useHourlyData } from './boardParts';
import './analyticsBoard.css';

const SCALE = ['#EEF4FF', '#C9DAFB', '#8FB1F2', '#4A7FE0', '#1D4FB8'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const hours = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}` : `${minutes}분`;
const shortDate = (iso: string) => { const d = new Date(Date.parse(iso) + 9 * 3600000); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][d.getUTCDay()]})`; };

function readDays(): ChannelPeriod {
  const value = Number(new URLSearchParams(window.location.search).get('days'));
  return value === 7 || value === 90 ? value : 30;
}

// 앞 기간이 모두 모이기 전에는 음영 칩으로만 보여 주고, 모이면 자동으로 비교 수치를 보여 준다(정의서 5.12).
function Delta({ now, before, unit = '%', off }: { now: number | null; before: number | null | undefined; unit?: string; off?: { wait: number } }) {
  if (off) return <span className="ab-chip off" title={`앞 기간 기록이 모두 모이면 비교해요 · ${off.wait}일 뒤부터`}>앞 기간 기록 부족</span>;
  if (now === null || before === null || before === undefined || before === 0) return <span className="ab-chip off">앞 기간에 방송 기록 없음</span>;
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
  // 아직 데이터가 모자란 기간으로 들어오면 볼 수 있는 가장 긴 기간으로 바꾼다.
  useEffect(() => {
    if (!data || data.coverageDays === undefined || data.coverageDays >= days) return;
    const fallback = ([30, 7] as const).find((d) => d < days && data.coverageDays >= d) || 7;
    // 화면 기간과 주소의 ?days 값을 함께 바꿔, 공유한 주소도 실제로 보이는 기간을 가리키게 한다.
    if (fallback !== days) pickDays(fallback);
  }, [data, days]);
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
  const prevOff = data && data.prevReady === false && days < 90 ? { wait: Math.max(1, days * 2 - (data.coverageDays ?? 0)) } : undefined;
  const knownDays = (data?.trend || []).filter((d) => d.avg !== null);
  const bestDay = knownDays.length ? knownDays.reduce((a, b) => ((b.avg || 0) > (a.avg || 0) ? b : a)) : null;
  const bestGame = (data?.games || []).some((g) => g.avg !== null);
  // 방송 습관: 가장 자주 방송한 요일들과 3시간 구간.
  const habit = (() => {
    const heat = data?.heat || [];
    if (!heat.length) return '';
    const byDay = heat.map((row) => row.reduce((s, v) => s + v, 0));
    const byHour = Array.from({ length: 24 }, (_, h) => heat.reduce((s, row) => s + row[h], 0));
    if (!byHour.some((v) => v > 0)) return '';
    const start = byHour.reduce((best, _, h) => (byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24] > byHour[best] + byHour[(best + 1) % 24] + byHour[(best + 2) % 24] ? h : best), 0);
    const topDays = byDay.map((v, d) => ({ v, d })).sort((a, b) => b.v - a.v).slice(0, 2).filter((x) => x.v > 0).map((x) => DAYS[x.d]);
    return `주로 ${topDays.join('·')}요일, ${start}~${(start + 3) % 24}시에 방송해요`;
  })();
  const habitInfo = (() => {
    const heat = data?.heat || [];
    const byHour = Array.from({ length: 24 }, (_, h) => heat.reduce((s, row) => s + (row[h] || 0), 0));
    if (!byHour.some((v) => v > 0)) return null;
    const byDay = heat.map((row) => row.reduce((s, v) => s + v, 0));
    const start = byHour.reduce((best, _, h) => (byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24] > byHour[best] + byHour[(best + 1) % 24] + byHour[(best + 2) % 24] ? h : best), 0);
    const days = byDay.map((v, d) => ({ v, d })).sort((a, b) => b.v - a.v).slice(0, 2).filter((x) => x.v > 0).map((x) => DAYS[x.d]).join('·');
    return { days: `${days}요일`, hours: `${start}~${(start + 3) % 24}시` };
  })();

  return <div className="ab">
    <main className="ab-main">
      <nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 채널</nav>
      {loading && !data && <div className="ab-empty">불러오고 있어요</div>}
      {error && !data && <div className="ab-error">{error}</div>}
      {missing && (() => {
        // 통계 기록이 아직 없는 채널: 검색에서 넘겨준 이름으로 안내하고 공식 채널로 이어 준다.
        const platform = channelKey.toUpperCase().startsWith('SOOP:') ? 'SOOP' : 'CHZZK';
        const id = channelKey.slice(channelKey.indexOf(':') + 1);
        const name = new URLSearchParams(window.location.search).get('name')?.slice(0, 60) || id;
        const url = platform === 'CHZZK' ? `https://chzzk.naver.com/${id}` : `https://www.sooplive.co.kr/station/${id}`;
        return <>
          <section className="ab-channel-head">
            <span className="ab-avatar ab-avatar-lg" aria-hidden="true" />
            <div className="ab-channel-id">
              <span className="ab-eyebrow">Channel</span>
              <h1>{name}</h1>
              <p className="ab-plat ab-plat-lg"><PlatformIcon platform={platform} />{platform === 'CHZZK' ? '치지직' : 'SOOP'}</p>
            </div>
            <div className="ab-channel-actions"><div className="ab-channel-buttons">
              {platform === 'CHZZK'
                ? <a className="ab-official ab-official-chzzk" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${name}의 치지직 공식 채널 열기 (새 창)`}><img src="/icons/chzzk/chzzklogo_kor_black.png" alt="치지직" /></a>
                : <a className="ab-official ab-official-soop" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${name}의 SOOP 방송국 열기 (새 창)`}><img src="/icons/soop/soop_logo_blue.svg" alt="SOOP" /></a>}
            </div></div>
          </section>
          <section className="ab-section ab-callout" aria-labelledby="ab-ch-none">
            <div><h2 id="ab-ch-none">방송 통계</h2><p className="ab-insight">아직 쌓인 방송 기록이 없어요</p></div>
            <p className="ab-lede">VDébut은 {platform === 'CHZZK' ? '치지직 인기 방송 상위 100개' : 'VDébut에 등록된 SOOP 채널'}를 10분마다 기록해요. 이 채널의 방송이 기록 범위에 들어오면 평균·최고 시청자, 방송 시간대, 방송 기록이 이곳에 쌓여요.</p>
            <p className="ab-note"><a {...linkProps('/analytics/method', onNavigate)}>집계 기준 보기</a> · <a {...linkProps('/analytics', onNavigate)}>방송 통계로 돌아가기</a></p>
          </section>
        </>;
      })()}
      {data && ch && <>
        <section className="ab-channel-head">
          {ch.imageUrl ? <img className="ab-avatar ab-avatar-lg" src={ch.imageUrl} alt="" referrerPolicy="no-referrer" /> : <span className="ab-avatar ab-avatar-lg" aria-hidden="true" />}
          <div className="ab-channel-id">
            <span className="ab-eyebrow">Channel</span>
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
          <Seg label="기간" value={String(days) as '7' | '30' | '90'} onChange={(v) => pickDays(Number(v) as ChannelPeriod)} options={[['7', '7일', needDays(data.coverageDays ?? 0, 7)], ['30', '30일', needDays(data.coverageDays ?? 0, 30)], ['90', '90일', needDays(data.coverageDays ?? 0, 90)]]} />
        </div>

        {data.kpis.broadcasts === 0 ? <p className="ab-empty">이 기간에는 집계 범위 안에서 기록된 방송이 없어요. <a {...linkProps('/analytics/method', onNavigate)}>집계 기준</a></p> : <>
          {/* ① 한눈에 */}
          <section className="ab-kpis-grid" aria-label="기간 요약">
            <article className="ab-kpi ab-kpi-hero">
              <header>평균 시청자</header>
              <div className="ab-kpi-value"><strong>{data.kpis.avg !== null ? num(data.kpis.avg) : '—'}</strong>{data.kpis.avg !== null && <span>명</span>}</div>
              <Delta now={data.kpis.avg} before={data.kpis.prev?.avg} off={prevOff} />
              <Sparkline values={data.trend.map((d) => d.avg)} />
            </article>
            <article className="ab-kpi">
              <header>최고 시청자</header>
              <div className="ab-kpi-value"><strong>{data.kpis.peak !== null ? num(data.kpis.peak) : '—'}</strong>{data.kpis.peak !== null && <span>명</span>}</div>
              {data.kpis.peakDate && <p>{Number(data.kpis.peakDate.slice(5, 7))}월 {Number(data.kpis.peakDate.slice(8, 10))}일 방송</p>}
            </article>
            <article className="ab-kpi">
              <header>기록된 방송 시간</header>
              <div className="ab-kpi-value"><strong>{Math.floor(data.kpis.minutes / 60)}</strong><span>시간</span></div>
              <Delta now={data.kpis.minutes} before={data.kpis.prev?.minutes} off={prevOff} />
            </article>
            <article className="ab-kpi">
              <header>방송 횟수</header>
              <div className="ab-kpi-value"><strong>{num(data.kpis.broadcasts)}</strong><span>회</span></div>
              <p>한 번에 평균 <b>{hours(Math.round(data.kpis.minutes / Math.max(1, data.kpis.broadcasts) / 10) * 10)}</b></p>
            </article>
          </section>

          <Lede text={data.summary} />

          {/* ② 흐름 + 무엇을 하나 */}
          <div className="ab-layout">
            <section className="ab-section ab-span-2" aria-labelledby="ab-ch-trend">
              <div><h2 id="ab-ch-trend">시청자 추이</h2>{bestDay && <p className="ab-insight">{Number(bestDay.date.slice(5, 7))}월 {Number(bestDay.date.slice(8, 10))}일에 가장 많이 봤어요 · 하루 평균 {people(bestDay.avg)}</p>}</div>
              <div className="ab-legend"><span><i style={{ width: 10, height: 10, background: 'var(--ab-bar)', borderRadius: 2 }} />하루 평균</span><span><i style={{ width: 14, height: 2, background: 'var(--ab-accent)' }} />하루 최고</span></div>
              <ComboChart height={200} maxBarWidth={days === 7 ? 32 : days === 30 ? 16 : 8} items={data.trend.map((d, i) => ({ key: d.date, bar: d.avg, line: d.peak, tip: d.avg === null ? `${d.date} 방송 기록 없음` : `${d.date} · 평균 ${people(d.avg)} · 최고 ${people(d.peak)}`, label: days === 7 || (data.trend.length - 1 - i) % (days === 30 ? 7 : 15) === 0 ? d.date.slice(5).replace('-', '/') : '' }))} />
            </section>
            <section className="ab-section ab-brief" aria-labelledby="ab-ch-games">
              <h2 id="ab-ch-games">무엇을 방송하나</h2>
              {data.games[0] && <p className="ab-insight" style={{ marginTop: -6 }}>방송 시간의 {data.games[0].share}%를 「{data.games[0].name}」에 썼어요</p>}
              <ShareBar items={data.games.slice(0, 4).map((g) => ({ key: g.name, label: g.name, value: g.share }))} other={Math.max(0, 100 - data.games.slice(0, 4).reduce((s, g) => s + g.share, 0))} />
              {bestGame && <div className="ab-brief-block"><h3>콘텐츠별 평균 시청자</h3>
                <ol className="ab-mini-list">{[...data.games].filter((g) => g.avg !== null).sort((a, b) => (b.avg || 0) - (a.avg || 0)).slice(0, 4).map((g) => <li key={g.name}>{g.isGame ? <a {...linkProps(gamePath(g.name), onNavigate)}>{g.name}</a> : <span>{g.name}</span>}<b>{people(g.avg)}</b></li>)}</ol></div>}
            </section>
          </div>

          <div className={data.tags?.length > 0 ? 'ab-pair' : ''}>
            {data.tags?.length > 0 && <section className="ab-section" aria-labelledby="ab-ch-tags">
              <div><h2 id="ab-ch-tags">자주 쓰는 태그</h2><p className="ab-insight">#{data.tags[0].tag} 태그를 가장 자주 달았어요</p></div>
              <p className="ab-note">기간 동안 방송에 단 태그 · 그 태그를 단 방송의 평균 시청자</p>
              <ul className="ab-chips">{data.tags.map((t) => <li key={t.tag}><a {...linkProps(tagPath(t.tag), onNavigate)}>#{t.tag} <small>{t.broadcasts}회{t.avg !== null ? ` · 평균 ${people(t.avg)}` : ''}</small></a></li>)}</ul>
            </section>}
            {habitInfo && <section className="ab-section" aria-labelledby="ab-ch-habit">
              <div><h2 id="ab-ch-habit">채널 정보</h2><p className="ab-insight">방송 습관</p></div>
              <ul className="ab-kv-list">
                <li><span>주로 방송하는 요일</span><b>{habitInfo.days}</b></li>
                <li><span>주로 방송하는 시간</span><b>{habitInfo.hours}</b></li>
                <li><span>한 번에 평균</span><b>{hours(Math.round(data.kpis.minutes / Math.max(1, data.kpis.broadcasts) / 10) * 10)}</b></li>
                {data.games[0] && <li><span>가장 많이 한 콘텐츠</span><b>{data.games[0].name}</b></li>}
              </ul>
            </section>}
          </div>

          <section className="ab-section" aria-labelledby="ab-ch-heat">
            <div><h2 id="ab-ch-heat">방송 시간대</h2>{habit && <p className="ab-insight">{habit}</p>}</div>
            <p className="ab-note">요일·시간대별로 방송한 비율 · 진할수록 자주 방송해요</p>
            <div className="ab-scroll"><div className="ab-heat">
              <div className="ab-heat-row" aria-hidden="true"><span />{Array.from({ length: 24 }, (_, h) => <span key={h} style={{ textAlign: 'center' }}>{h % 3 === 0 ? h : ''}</span>)}</div>
              {data.heat.map((row, d) => <div className="ab-heat-row" key={DAYS[d]}><b>{DAYS[d]}</b>{row.map((v, h) => <i key={h} title={`${DAYS[d]} ${h}시 · 방송 시간의 ${v}%`} style={{ background: v ? SCALE[step(v)] : 'var(--ab-track)' }} />)}</div>)}
            </div></div>
            <div className="ab-scale"><span>적음</span>{SCALE.map((c) => <i key={c} style={{ background: c }} />)}<span>많음</span></div>
          </section>

          <section className="ab-section" aria-labelledby="ab-ch-log">
            <div><h2 id="ab-ch-log">방송 기록</h2><p className="ab-insight">최근 {days}일 {num(data.kpis.broadcasts)}번 방송했어요</p></div>
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
