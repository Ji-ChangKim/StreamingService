import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { PORTAL_PLATFORMS, portalWebUrl, type PortalMedia, type PortalProfile } from '../../../shared/portal';
import type { ProfileDetailResponse } from '../../../shared/profileDetails';
import { profileMediaSource } from '../../../shared/profileMedia';
import { PortalLink, portalSchedule, downloadPortalSchedule } from './PortalUi';
import { t, usePortalLocale, portalLanguagePath, getPortalLanguage } from './portalLocale';
import { profileDebutPhase } from '../../../shared/profilePresentation';
import { WikiGuestbook } from './WikiParticipation';
import { WikiActivity } from './WikiActivity';
import './wikiContent.css';

type Tab = 'videos' | 'profile' | 'history';
const platforms = PORTAL_PLATFORMS;
const dayMs = 86_400_000;

// 등록된 공식 일정만 표시하고 날짜 미정과 시간 미정을 구분한다.
function dateLabel(profile: PortalProfile): string { return profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc)) ? new Date(profile.startAtUtc).toLocaleString(getPortalLanguage(), { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : portalSchedule(profile); }

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

// 관심 목록 버튼은 기존 브라우저 저장 기능에 연결한다.
function Favorite({ profile, favorites, toggle }: { profile: PortalProfile; favorites: string[]; toggle: (slug: string) => void }) {
  const saved = favorites.includes(profile.slug);
  return <button className={`favorite ${saved ? 'saved' : ''}`} aria-label={t(saved ? '{0} 관심 해제' : '{0} 관심 저장', [profile.displayName])} aria-pressed={saved} onClick={() => toggle(profile.slug)}><Heart size={18} fill={saved ? 'currentColor' : 'none'} /></button>;
}

// 목록 카드에서는 원본 소개문·이메일·날짜 나열을 사용하지 않는다.
export function WikiCreatorCard({ profile, open, favorites, toggle, now }: { profile: PortalProfile; open: (slug: string) => void; favorites: string[]; toggle: (slug: string) => void; now: number }) {
  const start = profile.dateState === 'FIXED' ? Date.parse(profile.startAtUtc) : NaN;
  const days = Number.isFinite(start) ? Math.round((Date.parse(new Date(start + 9 * 3600000).toISOString().slice(0, 10)) - Date.parse(new Date(now + 9 * 3600000).toISOString().slice(0, 10))) / dayMs) : null;
  const badge = group(profile) || (days === null ? t('데뷔 일정 미정') : days > 0 ? `D-${days}` : days === 0 ? t('오늘 데뷔') : t('데뷔 +{0}일', [-days]));
  const chips = [profile.details?.species, profile.details?.mbti, profile.tags[0]].filter(Boolean).slice(0, 3);
  return <article className="creator-card">
    <div className="card-stage"><span className={`card-badge ${group(profile) ? 'group' : ''}`}>{badge}</span><Favorite profile={profile} favorites={favorites} toggle={toggle} /></div>
    <div className="card-identity"><div className="card-avatar"><Avatar profile={profile} /><span className="avatar-platform"><img src={platforms.find(item => item.id === profile.platform)?.icon} alt={platforms.find(item => item.id === profile.platform)?.label || profile.platform} /></span></div><h3>{profile.displayName}</h3></div>
    <div className="card-chips">{chips.length ? chips.map(chip => <span key={chip}>{t("#")}{chip}</span>) : <span>{t("#")}{profile.dateState !== 'NONE' && profile.debutDate ? t('{0}월 데뷔', [Number(profile.debutDate.slice(5, 7))]) : t('새로운 발견')}</span>}</div>
    <PortalLink className="card-open" to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={() => open(profile.slug)}>{t("도감 보러가기")}</PortalLink>
  </article>;
}

// 썸네일은 잘라내지 않으며 카드 전체를 원본 영상 링크로 사용한다.
function MediaCard({ item, clip = false }: { item: PortalMedia; clip?: boolean }) {
  const source = profileMediaSource(item.url);
  const [failed, setFailed] = useState(false);
  if (!source) return null;
  return <a className={`media-card ${clip ? 'portrait' : ''}`} href={source.url} target="_blank" rel="noopener noreferrer"><div className="media-art">{!failed && (item.thumbnailUrl || source.thumbnailUrl) ? <img src={item.thumbnailUrl || source.thumbnailUrl} alt="" loading="lazy" onError={() => setFailed(true)} /> : null}</div><h3>{item.title}</h3></a>;
}

// 채널 행은 공식 치지직 원본과 보호 공간을 유지한다.
function Channels({ profile }: { profile: PortalProfile }) {
  const channels = [{ platform: profile.platform, channelUrl: profile.channelUrl }, ...(profile.additionalChannels || [])].filter((item, index, all) => portalWebUrl(item.channelUrl) && all.findIndex(other => other.channelUrl === item.channelUrl) === index);
  const links = [{ label: 'X / SNS', url: profile.xUrl }, { label: '공식 카페', url: profile.cafeUrl }, { label: '공식 홈페이지', url: profile.websiteUrl }].filter(item => item.url);
  return <div className="channel-row">{channels.map(item => <a className={item.platform === 'CHZZK' ? 'chzzk-link' : ''} href={item.channelUrl} target="_blank" rel="noopener noreferrer" key={item.channelUrl}>{item.platform === 'CHZZK' ? <img className="chzzk-wordmark" src="/icons/chzzk/chzzklogo_kor(Black).png" alt="치지직" /> : <Platform id={item.platform} />}</a>)}{links.map(item => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer">{t(item.label)}</a>)}</div>;
}

// 상세 도감은 등록 정보와 이번 진입의 실제 플랫폼 응답으로만 채운다.
export function WikiProfileContent({ profile, detail, loading, report, now, favorites, toggle, back, toast }: { profile: PortalProfile; detail?: ProfileDetailResponse; loading: boolean; report: () => void; now: number; favorites: string[]; toggle: (slug: string) => void; back: () => void; toast: (text: string) => void }) {
  const [tab, setTab] = useState<Tab>('videos');
  useEffect(() => { setTab('videos'); }, [profile.slug]);
  const start = Date.parse(profile.startAtUtc);
  const upcoming = profileDebutPhase(profile, now) === 'UPCOMING' && detail?.broadcast.state !== 'LIVE';
  const remaining = Number.isFinite(start) ? Math.max(0, start - now) : 0;
  const timeParts = [Math.floor(remaining / 3_600_000) % 24, Math.floor(remaining / 60_000) % 60, Math.floor(remaining / 1000) % 60].map(n => String(n).padStart(2, '0')).join(':');
  const broadcast = detail?.broadcast;
  const live = !upcoming && broadcast?.state === 'LIVE';
  const videos = detail?.channelMedia.videos.items || [];
  const clips = detail?.channelMedia.clips.items || [];
  const details = profile.details;
  const facts = [['데뷔일', dateLabel(profile)], ['공식 그룹', group(profile)], ['종족', details?.species], ['생일 / 별자리', [details?.birthday, details?.zodiac].filter(Boolean).join(' / ')], ['신장 / 혈액형', [details?.height, details?.bloodType].filter(Boolean).join(' / ')], ['MBTI', details?.mbti]];
  const sources = [...new Set([profile.noticeUrl, profile.websiteUrl].map(value => portalWebUrl(value || '')).filter(Boolean))];
  return <>
    <div className="breadcrumb"><button onClick={back}>{t("전체 버튜버")}</button><span>{t("/")}</span><span>{profile.displayName}</span></div>
    <article className="wiki-header"><div className="wiki-cover" style={{ backgroundImage: `url("${profile.bannerUrl || '/images/spotlight_stage_bg.png'}")` }}><span className="cover-label">{t("버튜버 도감")}</span><div className="cover-actions"><Favorite profile={profile} favorites={favorites} toggle={toggle} /><button onClick={async () => { try { await navigator.clipboard.writeText(`https://vdebut.live${portalLanguagePath(`/creator/${profile.slug}`)}`); toast(t('공유할 주소를 복사했어요.')); } catch { toast(t('주소를 복사하지 못했어요.')); } }}>{t("주소 공유")}</button></div></div>
      <div className="wiki-identity"><div className={`wiki-avatar ${live ? 'is-live' : ''}`}><Avatar profile={profile} />{live && <b>{t("● LIVE")}</b>}</div><div className="identity-copy"><div className="name-row"><h1>{profile.displayName}</h1>{group(profile) && <span className="group-pill">{group(profile)}</span>}</div>{(details?.contentSummary || (profile.headline && !group(profile))) && <p>{details?.contentSummary || profile.headline}</p>}<div className="credit-row">{details?.illustrator && <span>{t("일러스트")}<b>{details.illustrator}</b></span>}{details?.rigger && <span>{t("리깅")}<b>{details.rigger}</b></span>}{!details?.illustrator && !details?.rigger && <span className="debut-meta">{dateLabel(profile)}{t("데뷔")}</span>}</div></div></div>
      <Channels profile={profile} />
    </article>
    <div className="wiki-columns"><div className="wiki-main"><nav className="wiki-tabs" aria-label={t("도감 메뉴")}>{([{ id: 'videos', label: '추천 영상' }, { id: 'profile', label: '프로필' }, { id: 'history', label: '방송 · 활동 기록' }] as const).map(item => <button key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{t(item.label)}</button>)}</nav>
      {tab === 'videos' && <>
        {upcoming ? <section className="countdown"><div><span className="eyebrow">{t("FIRST HELLO")}</span><h2>{t("첫 만남까지, 조금만 기다려요")}</h2><div className="timer">{Number.isFinite(start) ? <>{t("D-")}{Math.floor(remaining / dayMs)} <span>{timeParts}</span></> : t('데뷔 일정을 기다리고 있어요')}</div><p>{dateLabel(profile)}{profile.dateState === 'FIXED' && t("· KST")}</p></div><button onClick={() => { if (profile.dateState === 'FIXED') downloadPortalSchedule(profile); else { if (!favorites.includes(profile.slug)) toggle(profile.slug); toast(t('관심 목록에서 데뷔 일정을 다시 볼 수 있어요.')); } }}>{t("데뷔 일정 저장")}</button></section> : live && <a className="live-banner" href={broadcast.url || profile.channelUrl} target="_blank" rel="noopener noreferrer"><img src={broadcast.thumbnailUrl || profile.avatarUrl} alt="" /><div><span className="live-tag">{t("LIVE")}</span><h2>{broadcast.title}</h2>{broadcast.viewers !== undefined && <p>{t("시청자 {0}명", [broadcast.viewers.toLocaleString()])}</p>}</div><span className="live-action">{t("방송 보기")}</span></a>}
        <section className="content-panel"><div className="section-title"><div><h2>{t(upcoming ? '첫 만남을 미리 만나보세요' : '추천 영상')}</h2></div><span>{t(upcoming ? '티저 · 데뷔 영상' : '채널의 최근 영상')}</span></div>{loading ? <div className="skeleton-media"><span /><span /></div> : videos.length && !upcoming ? <div className="video-grid">{videos.map(item => <MediaCard key={item.url} item={item} />)}</div> : upcoming && profile.media?.length ? <div className="video-grid">{profile.media.slice(0, 2).map(item => <MediaCard key={item.url} item={item} />)}</div> : <div className="soft-empty"><p>{t(detail?.channelMedia.videos.state === 'UNAVAILABLE' ? '지금은 영상을 불러오지 못했어요.' : '새로운 영상이 올라오면 이곳에서 만나요.')}</p></div>}</section>
        {upcoming ? <WikiGuestbook profile={profile} /> : <><section className="content-panel"><div className="section-title"><div><h2>{t("최신 클립")}</h2></div><span>{t("새로운 순간부터")}</span></div>{loading ? <div className="skeleton-media"><span /><span /></div> : clips.length ? <div className="clip-grid">{clips.map(item => <MediaCard key={item.url} item={item} clip />)}</div> : <div className="soft-empty"><p>{t(detail?.channelMedia.clips.state === 'UNAVAILABLE' ? '지금은 클립을 불러오지 못했어요.' : '아직 공개된 클립이 없어요.')}</p></div>}</section><section className="content-panel"><div className="section-title"><div><h2>{t("조금 더 알아가기")}</h2></div></div><div className="charm-grid">{[{ title: '이런 콘텐츠를 만나요', text: details?.contentSummary }, { title: '함께하는 방송', text: details?.broadcastStyle || profile.regularSchedule }, { title: '팬과 함께 쓰는 이야기', text: details?.fanMessage || profile.fanGuide }].map(item => <article key={item.title}><h3>{t(item.title)}</h3><p>{item.text || t('아직 알려진 이야기가 없어요.')}</p></article>)}</div></section></>}
      </>}
      {tab === 'profile' && <><section className="content-panel"><div className="section-title"><div><h2>{t('{0}의 프로필', [profile.displayName])}</h2></div></div>{details?.contentSummary || profile.headline ? <p className="long-copy">{details?.contentSummary || profile.headline}</p> : <div className="soft-empty"><p>{t("공식 소개를 함께 채워주세요.")}</p></div>}<div className="source-links">{sources.map(url => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{new URL(url!).hostname}</a>)}</div></section>{[{ title: '세계관 · 캐릭터 이야기', value: details?.species }, { title: '방송 스타일 · 정기 일정', value: [details?.broadcastStyle, profile.regularSchedule].filter(Boolean).join('\n') }, { title: '의상 · 유행어 · 팬 문화', value: profile.fanGuide }].map(item => <section key={item.title} className="content-panel"><div className="section-title"><div><h2>{t(item.title)}</h2></div></div><p className={item.value ? 'long-copy' : 'muted'}>{item.value || t('공식 출처로 확인된 정보가 아직 없어요.')}</p><button className="text-button" onClick={report}>{t("알고 있는 정보 제보하기")}</button></section>)}</>}
      {tab === 'history' && <><section className="content-panel"><div className="section-title"><div><h2>{t("지금까지의 발자취")}</h2></div></div><div className="timeline"><div><span /><time>{dateLabel(profile)}</time><h3>{t("첫 방송, 이야기의 시작")}</h3><p>{t('{0} 데뷔', [profile.displayName])}</p>{profile.noticeUrl && <a href={profile.noticeUrl} target="_blank" rel="noopener noreferrer">{t("공식 데뷔 공지")}</a>}</div>{profile.notices?.map(item => <div key={item.url}><span /><h3>{item.title}</h3><a href={item.url} target="_blank" rel="noopener noreferrer">{t("공식 소식")}</a></div>)}</div></section><WikiActivity profile={profile} /></>}
    </div><aside className="wiki-aside"><section className="spec-panel"><div className="section-title"><div><h2>{t("프로필 정보")}</h2></div><span>{t("PROFILE")}</span></div><dl>{facts.map(([label, value]) => <div key={label}><dt>{t(label || '')}</dt><dd className={!value ? 'unknown' : ''}>{value || t('미공개')}</dd></div>)}</dl><div className="fan-facts"><div><span>{t("팬덤명")}</span><strong>{details?.fandomName || t('미공개')}</strong></div><div><span>{t("오시마크")}</span><strong>{details?.oshiMark || t('미공개')}</strong></div></div>{details?.fanArtTag && <div className="fan-tag">{details.fanArtTag}</div>}{profile.cafeUrl && <a className="community-link" href={profile.cafeUrl} target="_blank" rel="noopener noreferrer">{t("공식 팬카페")}</a>}</section><section className="contribute-panel"><h2>{t("한 페이지씩,")}<br />{t("함께 채우는 이야기")}</h2><p>{t('{0}의 새로운 이야기를 알고 있나요?', [profile.displayName])}</p><button onClick={report}>{t("정보 제보 및 수정하기")}</button><small>{t("공식 출처를 확인하고 담아요.")}</small></section></aside></div>
  </>;
}

// 목록은 실제 공개 프로필을 검색·필터링하고 카드 구조만 새 시안으로 보여준다.
export function WikiDirectoryContent({ profiles, open, favorites, toggle, now, favoritesOnly = false }: { favoritesOnly?: boolean; profiles: PortalProfile[]; open: (slug: string) => void; favorites: string[]; toggle: (slug: string) => void; now: number }) {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('ALL');
  usePortalLocale();
  const [onlyFavorites, setOnlyFavorites] = useState(favoritesOnly);
  useEffect(() => { setOnlyFavorites(favoritesOnly); if (favoritesOnly) setCountry('ALL'); }, [favoritesOnly]);
  const [country, setCountry] = useState(favoritesOnly ? 'ALL' : 'KR');
  const [tag, setTag] = useState('');
  const [language, setLanguage] = useState('');
  const tags = [...new Set(profiles.flatMap(profile => profile.tags))].sort();
  const languages = [...new Set(profiles.flatMap(profile => profile.languages))].sort();
  const [visible, setVisible] = useState(12);
  useEffect(() => setVisible(12), [country, tag, language, onlyFavorites]);
  const matches = profiles.filter(p => (platform === 'ALL' || p.platform === platform) && (!(favoritesOnly || onlyFavorites) || favorites.includes(p.slug)) && (country === 'ALL' || p.countryCode === country) && (!tag || p.tags.includes(tag)) && (!language || p.languages.includes(language)) && `${p.displayName} ${p.debutGroupName || ''} ${p.details?.species || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <><section className="directory-intro"><span className="eyebrow">{t("새로운 취향을 발견하는 곳")}</span><h1>{t("당신의 다음 이야기를 만나보세요")}<span>{t(".")}</span></h1><p>{t("첫 인사부터 오래 함께할 순간까지, 버튜버의 이야기를 한곳에.")}</p><div className="directory-search"><input aria-label={t("버튜버 검색")} value={query} onChange={event => { setQuery(event.target.value); setVisible(12); }} placeholder={t("활동명, 공식 그룹, 종족으로 찾아보세요")} /></div></section><div className="directory-toolbar"><div className="platform-filters">{[{ id: 'ALL', label: '전체' }, ...platforms].map(item => <button key={item.id} aria-pressed={platform === item.id} onClick={() => { setPlatform(item.id); setVisible(12); }}>{t(item.label)}</button>)}</div><button className={`favorites-filter ${onlyFavorites ? 'selected' : ''}`} aria-pressed={favoritesOnly || onlyFavorites} onClick={() => favoritesOnly ? open('') : setOnlyFavorites(!onlyFavorites)}>{t("관심 버튜버")}</button></div><details className="wiki-browse-options"><summary>{t('탐색 조건')}</summary><div><label>{t('활동 국가')}<select value={country} onChange={event => setCountry(event.target.value)}><option value="ALL">{t('전체 국가')}</option><option value="KR">{t('한국')}</option><option value="JP">{t('일본')}</option><option value="US">{t('미국')}</option></select></label><label>{t('주요 콘텐츠')}<select value={tag} onChange={event => setTag(event.target.value)}><option value="">{t('전체 콘텐츠')}</option>{tags.map(tag => <option key={tag}>{tag}</option>)}</select></label><label>{t('방송 언어')}<select value={language} onChange={event => setLanguage(event.target.value)}><option value="">{t('전체 방송 언어')}</option>{languages.map(language => <option key={language}>{language}</option>)}</select></label></div></details><div className="results-row"><h2>{t(favoritesOnly || onlyFavorites ? '저장한 이야기' : '전체 버튜버')}<span>{matches.length.toLocaleString()}</span></h2><span>{t("활동명 · 데뷔 기록 · 공식 프로필")}</span></div>{matches.length ? <div className="creator-grid">{matches.slice(0, visible).map(profile => <WikiCreatorCard key={profile.slug} profile={profile} open={open} favorites={favorites} toggle={toggle} now={now} />)}</div> : <div className="big-empty"><h2>{t(favoritesOnly || onlyFavorites ? '마음에 드는 버튜버를 저장해 보세요' : '조건에 맞는 버튜버가 없어요')}</h2><p>{t('검색어나 플랫폼을 바꿔서 찾아보세요.')}</p></div>}{matches.length > visible && <button className="load-more" onClick={() => setVisible(visible + 12)}>{t("더 많은 이야기 만나기")}</button>}</>;
}
