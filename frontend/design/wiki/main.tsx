import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heart, X } from 'lucide-react';
import type { PortalMedia, PortalProfile } from '../../../shared/portal';
import type { ProfileDetailResponse } from '../../../shared/profileDetails';
import { profileMediaSource } from '../../../shared/profileMedia';
import { ExistingPortalFrame } from './ExistingPortalFrame';
import { CalendarPage } from '../../src/portal/CalendarPage';
import './prototype.css';

type Page = 'wiki' | 'directory' | 'calendar';
type Tab = 'videos' | 'profile' | 'history';
const platforms = [{ id: 'CHZZK', label: '치지직', icon: '/icons/chzzk_icon.png' }, { id: 'SOOP', label: 'SOOP', icon: '/icons/soop/soop_symbol_blue.svg' }, { id: 'YOUTUBE', label: 'YouTube', icon: '/icons/youtube_icon.png' }];
const dayMs = 86_400_000;

// 시안도 실제 공개 응답만 읽으며 빈 본문과 실패를 정상 자료로 오인하지 않는다.
async function read<T>(path: string): Promise<T> {
  const response = await fetch(`/api/v1/portal${path}`, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
  const text = await response.text();
  if (!response.ok || !text.trim()) throw new Error('공개 자료를 불러오지 못했어요.');
  return JSON.parse(text) as T;
}

// 등록된 공식 일정만 표시하고 날짜 미정과 시간 미정을 구분한다.
function dateLabel(profile: PortalProfile): string {
  if (profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc))) return new Date(profile.startAtUtc).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  if (profile.debutDate) return `${profile.debutDate} · 시간 미정`;
  return profile.targetMonth ? `${profile.targetMonth} · 날짜 미정` : '일정 미정';
}

// 공식 그룹 필드가 있는 경우에만 그룹으로 노출한다.
function group(profile: PortalProfile): string { return profile.debutGroupId ? [profile.agency, profile.debutGroupName].filter(Boolean).join(' · ') : ''; }

// 플랫폼 원본 아이콘은 비율과 색상을 바꾸지 않고 표시한다.
function Platform({ id }: { id: string }) {
  const item = platforms.find(item => item.id === id);
  return <span className="platform">{item && <img src={item.icon} alt="" />}<span>{item?.label || id}</span></span>;
}

// 원본 아바타를 사용하며 누락·로드 실패에만 보유 기본 에셋을 표시한다.
function Avatar({ profile, className = '' }: { profile: PortalProfile; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <img className={`avatar ${className}`} src={!failed && profile.avatarUrl ? profile.avatarUrl : '/images/bg_profile.png'} alt={profile.displayName} onError={() => setFailed(true)} />;
}

// 관심 목록은 시안 세션 메모리에만 두며 운영 저장소를 변경하지 않는다.
function Favorite({ profile, favorites, toggle }: { profile: PortalProfile; favorites: string[]; toggle: (slug: string) => void }) {
  const saved = favorites.includes(profile.slug);
  return <button className={`favorite ${saved ? 'saved' : ''}`} aria-label={`${profile.displayName} 관심 ${saved ? '해제' : '저장'}`} aria-pressed={saved} onClick={() => toggle(profile.slug)}><Heart size={18} fill={saved ? 'currentColor' : 'none'} /></button>;
}

// 목록 카드에서는 원본 소개문·이메일·날짜 나열을 사용하지 않는다.
function CreatorCard({ profile, open, favorites, toggle, now }: { profile: PortalProfile; open: (slug: string) => void; favorites: string[]; toggle: (slug: string) => void; now: number }) {
  const start = profile.dateState === 'FIXED' ? Date.parse(profile.startAtUtc) : NaN;
  const days = Number.isFinite(start) ? Math.ceil((start - now) / dayMs) : null;
  const badge = group(profile) || (days === null ? '데뷔 일정 미정' : days > 0 ? `D-${days}` : days === 0 ? '오늘 데뷔' : `데뷔 +${Math.floor((now - start) / dayMs)}일`);
  const chips = [profile.details?.species, profile.details?.mbti, profile.tags[0]].filter(Boolean).slice(0, 3);
  return <article className="creator-card">
    <div className="card-stage"><span className={`card-badge ${group(profile) ? 'group' : ''}`}>{badge}</span><Favorite profile={profile} favorites={favorites} toggle={toggle} /></div>
    <div className="card-identity"><div className="card-avatar"><Avatar profile={profile} /><span className="avatar-platform"><img src={platforms.find(item => item.id === profile.platform)?.icon} alt={platforms.find(item => item.id === profile.platform)?.label || profile.platform} /></span></div><h3>{profile.displayName}</h3></div>
    <div className="card-chips">{chips.length ? chips.map(chip => <span key={chip}>#{chip}</span>) : <span>#{profile.debutDate ? `${Number(profile.debutDate.slice(5, 7))}월_데뷔` : '새로운_발견'}</span>}</div>
    <button className="card-open" onClick={() => open(profile.slug)}>도감 보러가기</button>
  </article>;
}

// 썸네일은 잘라내지 않으며 카드 전체를 원본 영상 링크로 사용한다.
function MediaCard({ item, clip = false }: { item: PortalMedia; clip?: boolean }) {
  const source = profileMediaSource(item.url);
  const [failed, setFailed] = useState(false);
  if (!source) return null;
  return <a className={`media-card ${clip ? 'portrait' : ''}`} href={source.url} target="_blank" rel="noopener noreferrer"><div className="media-art">{!failed && (item.thumbnailUrl || source.thumbnailUrl) ? <img src={item.thumbnailUrl || source.thumbnailUrl} alt="" loading="lazy" onError={() => setFailed(true)} /> : null}</div><h3>{item.title}</h3></a>;
}

// 반응형 시안의 채널 행은 공식 치지직 원본과 보호 공간을 유지한다.
function Channels({ profile }: { profile: PortalProfile }) {
  const channels = [{ platform: profile.platform, channelUrl: profile.channelUrl }, ...(profile.additionalChannels || [])];
  const links = [{ label: 'X / SNS', url: profile.xUrl }, { label: '공식 카페', url: profile.cafeUrl }, { label: '공식 홈페이지', url: profile.websiteUrl }].filter(item => item.url);
  return <div className="channel-row">{channels.map(item => <a className={item.platform === 'CHZZK' ? 'chzzk-link' : ''} href={item.channelUrl} target="_blank" rel="noopener noreferrer" key={item.channelUrl}>{item.platform === 'CHZZK' ? <img className="chzzk-wordmark" src="/icons/chzzk/chzzklogo_kor(Black).png" alt="치지직" /> : <Platform id={item.platform} />}</a>)}{links.map(item => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>)}</div>;
}

// 제보 모달은 입력·출처 검증과 완료 화면만 시연하며 서버로 전송하지 않는다.
function EvidenceModal({ profile, close }: { profile: PortalProfile; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    try {
      const url = new URL(String(fields.get('evidence')));
      const allowed = ['x.com', 'twitter.com', 'chzzk.naver.com', 'sooplive.com', 'www.sooplive.com', 'sooplive.co.kr', 'www.sooplive.co.kr', 'afreecatv.com', 'youtube.com', 'www.youtube.com', 'youtu.be', 'cafe.naver.com'];
      if (url.protocol !== 'https:' || !allowed.includes(url.hostname) || url.username || url.password || url.pathname === '/') throw new Error();
      setDone(true);
    } catch { setError('내용을 확인할 수 있는 공식 채널의 게시물 주소를 입력해 주세요.'); }
  };
  return <dialog ref={dialog} className="prototype-dialog" aria-label="정보 제보 및 수정하기" onCancel={close} onClick={event => { if (event.target === event.currentTarget) close(); }}><div className="modal-head"><button className="icon-button" aria-label="닫기" onClick={close}><X size={20} /></button></div>{done ? <div className="submission-success"><h2>제보 흐름을 확인했어요</h2><p>검토용 시안이므로 실제 제보는 전송되지 않았어요.</p><button className="primary" onClick={close}>확인</button></div> : <><span className="eyebrow">함께 만드는 도감</span><h2>{profile.displayName}의 이야기를 알려주세요</h2><p className="modal-description">공식 출처에서 확인할 수 있는 정보만 함께 담아요.</p><form onSubmit={submit}><label>수정할 항목<select name="field" required><option value="">항목을 선택해 주세요</option><option>기본 프로필 · 생일 / 종족 / MBTI</option><option>일러스트 · 리깅</option><option>영상 · 클립</option><option>활동 소개 · 이력</option></select></label><label>추가하거나 수정할 내용<textarea name="value" required maxLength={500} placeholder="확인한 내용을 적어 주세요." rows={4} /></label><label>공식 출처 URL <span className="required">필수</span><input name="evidence" type="url" required placeholder="https://x.com/…/status/…" /></label><small>공식 X, YouTube, 치지직, SOOP, 네이버 카페의 게시물</small>{error && <p className="form-error" role="alert">{error}</p>}<div className="review-note">출처를 검토한 뒤 도감에 반영해요.</div><button className="primary submit">제보 내용 확인하기</button></form></>}</dialog>;
}

// 상세 도감은 등록 정보와 이번 진입의 실제 플랫폼 응답으로만 채운다.
function Wiki({ profile, detail, loading, pre, report, now, favorites, toggle, back, toast }: { profile: PortalProfile; detail?: ProfileDetailResponse; loading: boolean; pre: boolean; report: () => void; now: number; favorites: string[]; toggle: (slug: string) => void; back: () => void; toast: (text: string) => void }) {
  const [tab, setTab] = useState<Tab>('videos');
  useEffect(() => { setTab('videos'); }, [profile.slug]);
  const [note, setNote] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const start = Date.parse(profile.startAtUtc);
  const viewNow = pre && Number.isFinite(start) ? start - 3 * dayMs + (now % dayMs) : now;
  const upcoming = pre || (profile.dateState === 'FIXED' && start > now);
  const remaining = Math.max(0, start - viewNow);
  const timeParts = [Math.floor(remaining / 3_600_000) % 24, Math.floor(remaining / 60_000) % 60, Math.floor(remaining / 1000) % 60].map(n => String(n).padStart(2, '0')).join(':');
  const broadcast = detail?.broadcast;
  const live = !upcoming && broadcast?.state === 'LIVE';
  const videos = detail?.channelMedia.videos.items || [];
  const clips = detail?.channelMedia.clips.items || [];
  const details = profile.details;
  const facts = [['데뷔일', dateLabel(profile)], ['공식 그룹', group(profile)], ['종족', details?.species], ['생일 / 별자리', [details?.birthday, details?.zodiac].filter(Boolean).join(' / ')], ['신장 / 혈액형', [details?.height, details?.bloodType].filter(Boolean).join(' / ')], ['MBTI', details?.mbti]];
  const sources = [profile.noticeUrl, profile.websiteUrl].filter(Boolean);
  return <>
    <div className="breadcrumb"><button onClick={back}>전체 버튜버</button><span>/</span><span>{profile.displayName}</span></div>
    <article className="wiki-header"><div className="wiki-cover" style={{ backgroundImage: `url("${profile.bannerUrl || '/images/spotlight_stage_bg.png'}")` }}><span className="cover-label">버튜버 도감</span><div className="cover-actions"><Favorite profile={profile} favorites={favorites} toggle={toggle} /><button onClick={async () => { try { await navigator.clipboard.writeText(`https://vdebut.live/creator/${profile.slug}`); toast('공유할 주소를 복사했어요.'); } catch { toast('주소를 복사하지 못했어요.'); } }}>주소 공유</button></div></div>
      <div className="wiki-identity"><div className={`wiki-avatar ${live ? 'is-live' : ''}`}><Avatar profile={profile} />{live && <b>● LIVE</b>}</div><div className="identity-copy"><div className="name-row"><h1>{profile.displayName}</h1>{group(profile) && <span className="group-pill">{group(profile)}</span>}</div>{(details?.contentSummary || (profile.headline && !group(profile))) && <p>{details?.contentSummary || profile.headline}</p>}<div className="credit-row">{details?.illustrator && <span>일러스트 <b>{details.illustrator}</b></span>}{details?.rigger && <span>리깅 <b>{details.rigger}</b></span>}{!details?.illustrator && !details?.rigger && <span className="debut-meta">{dateLabel(profile)} 데뷔</span>}</div></div></div>
      <Channels profile={profile} />
    </article>
    <div className="wiki-columns"><div className="wiki-main"><nav className="wiki-tabs" aria-label="도감 메뉴">{([{ id: 'videos', label: '추천 영상' }, { id: 'profile', label: '프로필' }, { id: 'history', label: '방송 · 활동 기록' }] as const).map(item => <button key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
      {tab === 'videos' && <>
        {upcoming ? <section className="countdown"><div><span className="eyebrow">FIRST HELLO</span><h2>첫 만남까지, 조금만 기다려요</h2><div className="timer">D-{Math.floor(remaining / dayMs)} <span>{timeParts}</span></div><p>{dateLabel(profile)} · KST</p></div><button onClick={() => { toggle(profile.slug); toast('관심 목록에서 데뷔 일정을 다시 볼 수 있어요.'); }}>데뷔 일정 저장</button></section> : live && <a className="live-banner" href={broadcast.url || profile.channelUrl} target="_blank" rel="noopener noreferrer"><img src={broadcast.thumbnailUrl || profile.avatarUrl} alt="" /><div><span className="live-tag">LIVE</span><h2>{broadcast.title}</h2>{broadcast.viewers !== undefined && <p>시청자 {broadcast.viewers.toLocaleString()}명</p>}</div><span className="live-action">방송 보기</span></a>}
        <section className="content-panel"><div className="section-title"><div><h2>{upcoming ? '첫 만남을 미리 만나보세요' : '추천 영상'}</h2></div><span>{upcoming ? '티저 · 데뷔 영상' : '채널의 최근 영상'}</span></div>{loading ? <div className="skeleton-media"><span /><span /></div> : videos.length && !upcoming ? <div className="video-grid">{videos.map(item => <MediaCard key={item.url} item={item} />)}</div> : upcoming && profile.media?.length ? <div className="video-grid">{profile.media.slice(0, 2).map(item => <MediaCard key={item.url} item={item} />)}</div> : <div className="soft-empty"><p>{detail?.channelMedia.videos.state === 'UNAVAILABLE' ? '지금은 영상을 불러오지 못했어요.' : '새로운 영상이 올라오면 이곳에서 만나요.'}</p></div>}</section>
        {upcoming ? <section className="content-panel guestbook"><div className="section-title"><div><h2>첫 무대를 함께 응원해요</h2></div><span>응원 방명록</span></div><p className="muted">첫 인사를 앞둔 {profile.displayName}에게 따뜻한 한마디를 남겨주세요.</p><form onSubmit={event => { event.preventDefault(); if (note.trim()) { setMessages([note.trim(), ...messages]); setNote(''); } }}><input value={note} onChange={event => setNote(event.target.value)} maxLength={150} required placeholder="당신의 첫 무대를 응원해요!" /><button type="submit" className="primary">응원 남기기</button></form>{messages.length ? messages.map((message, i) => <div className="guest-message" key={i}><p>{message}</p><small>방금 전 · 시안</small></div>) : <div className="guest-empty"><span>가장 먼저 응원을 남겨보세요.</span></div>}</section> : <><section className="content-panel"><div className="section-title"><div><h2>최신 클립</h2></div><span>새로운 순간부터</span></div>{loading ? <div className="skeleton-media"><span /><span /></div> : clips.length ? <div className="clip-grid">{clips.map(item => <MediaCard key={item.url} item={item} clip />)}</div> : <div className="soft-empty"><p>{detail?.channelMedia.clips.state === 'UNAVAILABLE' ? '지금은 클립을 불러오지 못했어요.' : '아직 공개된 클립이 없어요.'}</p></div>}</section><section className="content-panel"><div className="section-title"><div><h2>조금 더 알아가기</h2></div></div><div className="charm-grid">{[{ title: '이런 콘텐츠를 만나요', text: details?.contentSummary }, { title: '함께하는 방송', text: details?.broadcastStyle || profile.regularSchedule }, { title: '팬과 함께 쓰는 이야기', text: details?.fanMessage || profile.fanGuide }].map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.text || '아직 알려진 이야기가 없어요.'}</p></article>)}</div></section></>}
      </>}
      {tab === 'profile' && <><section className="content-panel"><div className="section-title"><div><h2>{profile.displayName}의 프로필</h2></div></div>{details?.contentSummary || profile.headline ? <p className="long-copy">{details?.contentSummary || profile.headline}</p> : <div className="soft-empty"><p>공식 소개를 함께 채워주세요.</p></div>}<div className="source-links">{sources.map(url => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{new URL(url!).hostname}</a>)}</div></section>{[{ title: '세계관 · 캐릭터 이야기', value: details?.species }, { title: '방송 스타일 · 정기 일정', value: [details?.broadcastStyle, profile.regularSchedule].filter(Boolean).join('\n') }, { title: '의상 · 유행어 · 팬 문화', value: profile.fanGuide }].map(item => <section key={item.title} className="content-panel"><div className="section-title"><div><h2>{item.title}</h2></div></div><p className={item.value ? 'long-copy' : 'muted'}>{item.value || '공식 출처로 확인된 정보가 아직 없어요.'}</p><button className="text-button" onClick={report}>알고 있는 정보 제보하기</button></section>)}</>}
      {tab === 'history' && <><section className="content-panel"><div className="section-title"><div><h2>지금까지의 발자취</h2></div></div><div className="timeline"><div><span /><time>{dateLabel(profile)}</time><h3>첫 방송, 이야기의 시작</h3><p>{profile.displayName} 데뷔</p>{profile.noticeUrl && <a href={profile.noticeUrl} target="_blank" rel="noopener noreferrer">공식 데뷔 공지</a>}</div>{profile.notices?.map(item => <div key={item.url}><span /><h3>{item.title}</h3><a href={item.url} target="_blank" rel="noopener noreferrer">공식 소식</a></div>)}</div></section><section className="content-panel"><div className="section-title"><div><h2>방송 활동</h2></div><span>최근 30일</span></div><div className="empty-chart"><div><p>확인된 방송 기록을 모으고 있어요.</p><span>기록이 쌓이면 방송한 날과 콘텐츠를 볼 수 있어요.</span></div></div></section></>}
    </div><aside className="wiki-aside"><section className="spec-panel"><div className="section-title"><div><h2>프로필 정보</h2></div><span>PROFILE</span></div><dl>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={!value ? 'unknown' : ''}>{value || '미공개'}</dd></div>)}</dl><div className="fan-facts"><div><span>팬덤명</span><strong>{details?.fandomName || '미공개'}</strong></div><div><span>오시마크</span><strong>{details?.oshiMark || '미공개'}</strong></div></div>{details?.fanArtTag && <div className="fan-tag">{details.fanArtTag}</div>}{profile.cafeUrl && <a className="community-link" href={profile.cafeUrl} target="_blank" rel="noopener noreferrer">공식 팬카페</a>}</section><section className="contribute-panel"><h2>한 페이지씩,<br />함께 채우는 이야기</h2><p>{profile.displayName}의<br />새로운 이야기를 알고 있나요?</p><button onClick={report}>정보 제보 및 수정하기</button><small>공식 출처를 확인하고 담아요.</small></section></aside></div>
  </>;
}

// 목록은 실제 공개 프로필을 검색·필터링하고 카드 구조만 새 시안으로 보여준다.
function Directory({ profiles, open, favorites, toggle, now }: { profiles: PortalProfile[]; open: (slug: string) => void; favorites: string[]; toggle: (slug: string) => void; now: number }) {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [visible, setVisible] = useState(12);
  const matches = profiles.filter(p => (platform === 'ALL' || p.platform === platform) && (!onlyFavorites || favorites.includes(p.slug)) && `${p.displayName} ${p.debutGroupName || ''} ${p.details?.species || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <><section className="directory-intro"><span className="eyebrow">새로운 취향을 발견하는 곳</span><h1>당신의 다음 이야기를 만나보세요<span>.</span></h1><p>첫 인사부터 오래 함께할 순간까지, 버튜버의 이야기를 한곳에.</p><div className="directory-search"><input aria-label="버튜버 검색" value={query} onChange={event => { setQuery(event.target.value); setVisible(12); }} placeholder="활동명, 공식 그룹, 종족으로 찾아보세요" /></div></section><div className="directory-toolbar"><div className="platform-filters">{[{ id: 'ALL', label: '전체' }, ...platforms].map(item => <button key={item.id} aria-pressed={platform === item.id} onClick={() => { setPlatform(item.id); setVisible(12); }}>{item.label}</button>)}</div><button className={`favorites-filter ${onlyFavorites ? 'selected' : ''}`} onClick={() => setOnlyFavorites(!onlyFavorites)}>관심 버튜버</button></div><div className="results-row"><h2>{onlyFavorites ? '저장한 이야기' : '전체 버튜버'}<span>{matches.length.toLocaleString()}</span></h2><span>활동명 · 데뷔 기록 · 공식 프로필</span></div>{matches.length ? <div className="creator-grid">{matches.slice(0, visible).map(profile => <CreatorCard key={profile.slug} profile={profile} open={open} favorites={favorites} toggle={toggle} now={now} />)}</div> : <div className="big-empty"><h2>조건에 맞는 버튜버가 없어요</h2><p>검색어나 플랫폼을 바꿔서 찾아보세요.</p></div>}{matches.length > visible && <button className="load-more" onClick={() => setVisible(visible + 12)}>더 많은 이야기 만나기</button>}</>;
}

// 시안 제어부는 제품 화면 바깥에 두고 운영 코드·DB·저장 동작과 완전히 분리한다.
function App() {
  const [page, setPage] = useState<Page>('wiki');
  const [region, setRegion] = useState('KR');
  const [slug, setSlug] = useState('shizuki-toa');
  const [profiles, setProfiles] = useState<PortalProfile[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [detail, setDetail] = useState<ProfileDetailResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pre, setPre] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [modal, setModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { void read<{ profiles: PortalProfile[] }>('/profiles?version=3').then(data => { if (!Array.isArray(data.profiles)) throw new Error(); setProfiles([...data.profiles].sort((a, b) => Number(b.slug === 'shizuki-toa') - Number(a.slug === 'shizuki-toa') || Number(b.slug === '529u') - Number(a.slug === '529u') || (b.startAtUtc || '').localeCompare(a.startAtUtc || ''))); }).catch(() => setError('프로필 목록을 불러오지 못했어요. 새로고침 후 다시 확인해 주세요.')).finally(() => setListLoading(false)); }, []);
  useEffect(() => { let canceled = false; setDetail(undefined); setLoading(true); void read<ProfileDetailResponse>(`/profiles/${encodeURIComponent(slug)}/detail`).then(data => { if (!canceled) setDetail(data); }).catch(() => {}).finally(() => { if (!canceled) setLoading(false); }); return () => { canceled = true; }; }, [slug]);
  useEffect(() => { if (!pre) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [pre]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer); }, [toast]);
  const toggle = (id: string) => setFavorites(list => list.includes(id) ? list.filter(value => value !== id) : [...list, id]);
  const open = (id: string) => { setSlug(id); setPage('wiki'); setPre(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const navigate = (next: Page) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const profile = detail?.profile || profiles.find(p => p.slug === slug);
  return <><div className="review-bar"><div><b>VDébut</b><span className="review-divider" /><span>도감 개편 시안 <b>01</b></span><small>{page === 'calendar' ? '기존 메인 화면' : '검토용 · 실제 저장·전송 없음'}</small></div><div className="review-controls">{page === 'directory' && <select aria-label="시안 국가" value={region} onChange={event => setRegion(event.target.value)}><option value="KR">한국 · KST</option><option value="JP">일본</option><option value="US">미국</option></select>}<select aria-label="시안 페이지" value={page} onChange={event => navigate(event.target.value as Page)}><option value="wiki">03 상세 도감</option><option value="directory">02 전체 버튜버</option><option value="calendar">01 데뷔 일정</option></select>{page === 'wiki' && <><select aria-label="프로필 시안" value={slug} onChange={event => setSlug(event.target.value)}><option value="shizuki-toa">시즈키 토아</option><option value="529u">529u</option>{!['shizuki-toa', '529u'].includes(slug) && <option value={slug}>{profile?.displayName || slug}</option>}</select><button aria-pressed={pre} onClick={() => setPre(!pre)}>{pre ? '데뷔 전 · 시간 시뮬레이션' : '데뷔 후 보기'}</button></>}<button className="device-button" aria-label={mobile ? '데스크톱 시안 보기' : '모바일 시안 보기'} onClick={() => setMobile(!mobile)}>{mobile ? '데스크톱' : '모바일'}</button></div></div><div className={`page-frame ${mobile ? 'device-mobile' : ''}`}><ExistingPortalFrame path={page === 'calendar' ? '/' : page === 'directory' ? '/creators' : `/creator/${slug}`}><div className={page === 'calendar' ? undefined : 'wiki-design'}>{error && <p className="load-error" role="alert">{error}</p>}{page !== 'wiki' && listLoading ? <div className="initial-loading"><span /><p>이야기를 불러오는 중이에요.</p></div> : page !== 'wiki' && error ? null : page === 'wiki' ? profile ? <Wiki key={slug} profile={profile} detail={detail} loading={loading} pre={pre} report={() => setModal(true)} now={now} favorites={favorites} toggle={toggle} back={() => navigate('directory')} toast={setToast} /> : <div className="initial-loading"><span /><p>이야기를 불러오는 중이에요.</p></div> : page === 'directory' ? <Directory profiles={profiles.filter(profile => profile.countryCode === region)} open={open} favorites={favorites} toggle={toggle} now={now} /> : <CalendarPage profiles={profiles} loading={listLoading} error={error} refresh={() => window.location.reload()} onNavigate={path => { if (path.startsWith('/creator/')) open(decodeURIComponent(path.split('/')[2].split('?')[0])); else window.location.assign(path); }} />}</div></ExistingPortalFrame></div>{modal && profile && <EvidenceModal profile={profile} close={() => setModal(false)} />}{toast && <div className="toast" role="status">{toast}</div>}</>;
}

createRoot(document.getElementById('root')!).render(<App />);
