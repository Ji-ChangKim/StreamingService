import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { StatisticsStreamer, StatisticsStreamerSearchResponse } from '../../../../../shared/statisticsStreamerSearch';
import { activityStreamerPath } from '../../../../../shared/activitySeo';
import { PlatformIcon } from './boardParts';

// 스트리머 검색: 입력하면 검색창 바로 아래에 결과 목록을 펼친다.
export function StreamerSearch({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<StatisticsStreamer[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLFormElement>(null);
  const seq = useRef(0);

  const search = async (q: string) => {
    const id = ++seq.current;
    if (!q.trim()) { setItems([]); setState('idle'); return; }
    setState('loading');
    try {
      const response = await fetch(`/api/analytics/streamers/search?q=${encodeURIComponent(q.trim())}`);
      if (!response.ok) throw new Error(String(response.status));
      const found = await response.json() as StatisticsStreamerSearchResponse;
      if (id !== seq.current) return;
      setItems(found.streamers.slice(0, 8)); setState('done'); setActive(-1);
    } catch { if (id === seq.current) { setItems([]); setState('error'); } }
  };

  // 입력이 멈추고 0.3초 뒤에 찾는다.
  useEffect(() => { const timer = window.setTimeout(() => { void search(query); }, 300); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (box.current && !box.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // 기록이 없는 채널도 이름을 들고 가서 채널 페이지가 '아직 기록 없음' 안내를 이름과 함께 보여 준다.
  const go = (streamer: StatisticsStreamer) => {
    setOpen(false);
    const path = activityStreamerPath(streamer.channelKey || `${streamer.platform}:${streamer.id}`);
    onNavigate((streamer.recordedBroadcasts || 0) > 0 ? path : `${path}?name=${encodeURIComponent(streamer.name)}`);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); setOpen(true); if (items[active >= 0 ? active : 0] && state === 'done') go(items[active >= 0 ? active : 0]); else void search(query); };
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((i) => Math.min(items.length - 1, i + 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(-1, i - 1)); }
    else if (event.key === 'Escape') setOpen(false);
  };

  return <form ref={box} className="ab-search" role="search" onSubmit={submit}>
    <label htmlFor="ab-q" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>스트리머 검색</label>
    <input id="ab-q" type="search" value={query} autoComplete="off" role="combobox" aria-expanded={open && query.trim() !== ''} aria-controls="ab-q-list"
      onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={keys} placeholder="스트리머 이름 검색" maxLength={80} />
    <button type="submit">검색</button>
    {open && query.trim() !== '' && <div className="ab-dropdown" id="ab-q-list" role="listbox">
      {state === 'loading' && !items.length && <p className="ab-dropdown-note">찾고 있어요</p>}
      {state === 'error' && <p className="ab-dropdown-note">검색하지 못했어요. 잠시 후 다시 시도해 주세요.</p>}
      {state === 'done' && !items.length && <p className="ab-dropdown-note">‘{query.trim()}’ 스트리머를 찾지 못했어요.</p>}
      {items.map((s, i) => <button key={`${s.platform}:${s.id}`} type="button" role="option" aria-selected={i === active} className="ab-dropdown-item" onMouseEnter={() => setActive(i)} onClick={() => go(s)}>
        {s.imageUrl ? <img src={s.imageUrl} alt="" referrerPolicy="no-referrer" /> : <span className="ab-dropdown-avatar" aria-hidden="true" />}
        <span className="ab-dropdown-who">
          <span className="ab-dropdown-name">{s.name}{s.isLive && <i className="ab-dropdown-live">방송 중</i>}</span>
          <span className={(s.recordedBroadcasts || 0) > 0 ? 'ab-dropdown-rec' : 'ab-dropdown-rec off'}>{(s.recordedBroadcasts || 0) > 0 ? `최근 30일 방송 ${s.recordedBroadcasts}회 기록` : '통계 기록 없음'}{typeof s.followerCount === 'number' && s.followerCount > 0 ? ` · 팔로워 ${s.followerCount.toLocaleString('ko-KR')}명` : ''}</span>
        </span>
        <span className="ab-plat"><PlatformIcon platform={s.platform} />{s.platform === 'CHZZK' ? '치지직' : 'SOOP'}</span>
      </button>)}
    </div>}
  </form>;
}
