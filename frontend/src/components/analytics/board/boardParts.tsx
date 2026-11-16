import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import type { BoardChannel } from '../../../../../shared/analyticsBoard';
import { activityStreamerPath } from '../../../../../shared/activitySeo';

const HOUR = 3600000;
export const PLATFORM_ICON = {
  // 파일 이름에 공백이 있는 원본은 운영 정적 파일 경로에서 찾지 못해, 같은 공식 원본인 chzzk_icon.png를 쓴다.
  CHZZK: { src: '/icons/chzzk_icon.png', w: 18, h: 18, name: '치지직' },
  SOOP: { src: '/icons/soop/soop_symbol_blue.svg', w: 24, h: 14, name: 'SOOP' },
} as const;

export const num = (n: number | null | undefined) => (n ?? 0).toLocaleString('ko-KR');
export const people = (n: number | null | undefined) => `${num(Math.round(n ?? 0))}명`;
export const gamePath = (name: string) => `/analytics/game/${encodeURIComponent(name)}`;
export const tagPath = (tag: string) => `/analytics/tag/${encodeURIComponent(tag.replace(/^#/, ''))}`;

// 회차 시각을 "오늘 오후 9시 30분 기준"처럼 한국 시간으로 적는다.
export function asOfLabel(asOf: string | null): string {
  if (!asOf) return '';
  const kst = new Date(Date.parse(asOf) + 9 * HOUR);
  const today = new Date(Date.now() + 9 * HOUR).toISOString().slice(0, 10);
  const hour = kst.getUTCHours();
  const minute = kst.getUTCMinutes();
  const clock = `${hour < 12 ? '오전' : '오후'} ${hour % 12 === 0 ? 12 : hour % 12}시${minute ? ` ${minute}분` : ''}`;
  const day = kst.toISOString().slice(0, 10) === today ? '오늘' : `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
  return `${day} ${clock} 기준`;
}

// 10분 회차가 바뀐 뒤 새로고침·탭 복귀·다음 확인 때 새 집계를 받아 교체한다(정의서 5.10).
const SLOT = 10 * 60000;
export function useHourlyData<T extends { asOf: string | null; nextAt: string }>(url: string | null) {
  const [state, setState] = useState<{ data: T | null; error: string; loading: boolean; missing: boolean }>({ data: null, error: '', loading: Boolean(url), missing: false });
  const urlRef = useRef(url);
  urlRef.current = url;
  const load = useCallback(async () => {
    if (!url) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (urlRef.current !== url) return;
      if (response.status === 404) { setState({ data: null, error: '', loading: false, missing: true }); return; }
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json() as T;
      setState({ data, error: '', loading: false, missing: false });
    } catch {
      if (urlRef.current === url) setState((s) => ({ ...s, loading: false, error: '방송 통계를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }));
    }
  }, [url]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const data = state.data;
    if (!data) return;
    const slot = Math.floor(Date.now() / SLOT) * SLOT;
    // 이번 회차가 아직 모이지 않았으면 1분 뒤 다시, 아니면 다음 회차 1분 뒤(수집이 끝난 뒤)에 확인한다.
    const due = data.asOf && Date.parse(data.asOf) < slot ? Date.now() + 60000 : Date.parse(data.nextAt) + 60000;
    const check = () => { if (document.visibilityState === 'visible' && Date.now() >= due) void load(); };
    const timer = window.setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', check); window.removeEventListener('focus', check); };
  }, [state.data, load]);
  return { ...state, reload: load };
}

export function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (value: T) => void }) {
  return <div className="ab-seg" role="group" aria-label={label}>{options.map(([id, text]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>)}</div>;
}

export function PlatformIcon({ platform }: { platform: 'CHZZK' | 'SOOP' }) {
  const icon = PLATFORM_ICON[platform];
  return <img src={icon.src} alt="" width={icon.w} height={icon.h} style={{ width: icon.w, height: icon.h, objectFit: 'contain' }} />;
}

// 채널 한 줄의 보조 정보: {플랫폼} 또는 {플랫폼} / {소속} (정의서 5.8)
export function platformLine(channel: Pick<BoardChannel, 'platform' | 'affiliation'>) {
  return channel.affiliation ? `${PLATFORM_ICON[channel.platform].name} / ${channel.affiliation}` : PLATFORM_ICON[channel.platform].name;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 2, 2.5, 4, 5, 8, 10]) if (m * step >= value) return m * step;
  return 10 * step;
}
const short = (n: number) => n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(Math.round(n));

export interface ComboItem { key: string; bar: number | null; line?: number | null; tip: string; label?: ReactNode }

// 막대(양) + 선(개수) 그래프. 대시보드 표 대신 쓴다(정의서 7.1 공통).
export function ComboChart({ items, height = 220, barColor = 'var(--ab-bar)', lineColor = 'var(--ab-accent)', maxBarWidth = 44, lineMax, minColWidth }: { items: ComboItem[]; height?: number; barColor?: string; lineColor?: string; maxBarWidth?: number; lineMax?: number; minColWidth?: number }) {
  const max = niceMax(Math.max(0, ...items.map((item) => item.bar ?? 0), ...(lineMax === undefined ? items.map((item) => item.line ?? 0) : [])));
  const lMax = lineMax === undefined ? max : niceMax(lineMax);
  const n = items.length || 1;
  const pts = items.map((item, i) => item.line == null ? null : { x: (i + 0.5) / n * 100, y: Math.min(100, item.line / lMax * 92) });
  const segments: string[][] = [];
  let current: string[] = [];
  pts.forEach((p) => { if (p) current.push(`${(p.x * n).toFixed(2)},${(100 - p.y).toFixed(2)}`); else if (current.length) { segments.push(current); current = []; } });
  if (current.length) segments.push(current);
  return <div className="ab-chart-wrap">
    <div className="ab-chart" style={{ minWidth: minColWidth ? 52 + items.length * minColWidth : undefined }}>
      <div className="ab-axis" style={{ height }} aria-hidden="true"><span style={{ top: 0 }}>{short(max)}</span><span style={{ top: '50%' }}>{short(max / 2)}</span><span style={{ top: '100%' }}>0</span></div>
      <div className="ab-plot" style={{ height }}>
        <i className="ab-grid" style={{ top: 0 }} /><i className="ab-grid" style={{ top: '50%' }} />
        <div className="ab-bars">{items.map((item) => <span key={item.key} title={item.tip}><i style={{ height: `${item.bar == null ? 0 : Math.max(item.bar ? 1 : 0, item.bar / max * 100)}%`, maxWidth: maxBarWidth, background: barColor }} /></span>)}</div>
        {segments.length > 0 && <svg className="ab-line" viewBox={`0 0 ${n * 100} 100`} preserveAspectRatio="none" aria-hidden="true">{segments.map((segment, index) => <polyline key={index} points={segment.join(' ')} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}</svg>}
        {items.length <= 12 && pts.map((p, i) => p && <span key={items[i].key} className="ab-dot" style={{ left: `${p.x}%`, bottom: `${p.y}%`, borderColor: lineColor }} title={items[i].tip} />)}
      </div>
      <span />
      <div className="ab-xlabels">{items.map((item) => <div key={item.key}>{item.label}</div>)}</div>
    </div>
  </div>;
}

export function HBars({ rows }: { rows: Array<{ key: string; name: ReactNode; value: number; text: string; color?: string }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <ol className="ab-hbars">{rows.map((row) => <li key={row.key}>{row.name}<span className="ab-track" aria-hidden="true"><i style={{ width: `${row.value / max * 100}%`, background: row.color }} /></span><span>{row.text}</span></li>)}</ol>;
}

export function ChannelRows({ channels, onNavigate, showWatch = true }: { channels: BoardChannel[]; onNavigate: (path: string) => void; showWatch?: boolean }) {
  const top = Math.max(1, ...channels.map((channel) => channel.viewers));
  return <ol className="ab-list">{channels.map((channel, index) => {
    const path = activityStreamerPath(channel.channelKey);
    return <li key={channel.channelKey} className="ab-row">
      <span className="ab-rank">{index + 1}</span>
      {channel.imageUrl ? <img className="ab-avatar" src={channel.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="ab-avatar" aria-hidden="true" />}
      <a className="ab-name" href={path} onClick={(e) => { e.preventDefault(); onNavigate(path); }}><b>{channel.name}</b><span className="ab-plat"><PlatformIcon platform={channel.platform} />{platformLine(channel)}</span></a>
      {channel.isGame ? <a className="ab-game" href={gamePath(channel.category)} onClick={(e) => { e.preventDefault(); onNavigate(gamePath(channel.category)); }}>{channel.category}</a> : <span className="ab-game">{channel.category}</span>}
      <span className="ab-viewbar"><span className="ab-track" aria-hidden="true"><i style={{ width: `${channel.viewers / top * 100}%` }} /></span><strong>{people(channel.viewers)}</strong></span>
      {showWatch && channel.liveUrl ? <a className="ab-watch" href={channel.liveUrl} target="_blank" rel="noopener noreferrer">방송 보기</a> : <span />}
    </li>;
  })}</ol>;
}

export function Lede({ text }: { text: string | null }) {
  if (!text) return null;
  // 숫자와 「이름」만 굵게 한다(정의서 6.7).
  const parts = text.split(/(「[^」]+」|#[^\s,.]+|[\d,.]+(?:%|명|개|배|시)?)/g);
  return <p className="ab-lede">{parts.map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part)}</p>;
}

export function Move({ value }: { value: number | null }) {
  if (value === null) return <em className="ab-move">신규</em>;
  if (value === 0) return <em className="ab-move">–</em>;
  return <em className={`ab-move ${value > 0 ? 'up' : 'down'}`}>{value > 0 ? `▲${value}` : `▼${-value}`}</em>;
}

export function linkProps(path: string, onNavigate: (path: string) => void) {
  return { href: path, onClick: (e: MouseEvent) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); onNavigate(path); } };
}
