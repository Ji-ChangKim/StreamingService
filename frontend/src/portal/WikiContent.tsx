import { useEffect, useState, useMemo } from 'react';
import { Heart, Search, X, RotateCcw } from 'lucide-react';
import { PORTAL_PLATFORMS, portalWebUrl, type PortalMedia, type PortalProfile } from '../../../shared/portal';
import type { ProfileDetailResponse } from '../../../shared/profileDetails';
import { profileMediaSource } from '../../../shared/profileMedia';
import { portalSchedule, downloadPortalSchedule } from './PortalUi';
import { t, usePortalLocale, portalLanguagePath, getPortalLanguage } from './portalLocale';
import { profileDebutPhase } from '../../../shared/profilePresentation';
import { WikiGuestbook } from './WikiParticipation';
import { WikiActivity } from './WikiActivity';
import { WikiCreatorCardSchedule, WikiCreatorCardContent, WikiCreatorCardLore, WikiVariantSelector, type CardVariant } from './WikiCardVariants';
import './wikiContent.css';
import './wikiCardVariants.css';

// 상세 본문 메뉴는 추천 영상과 방송·활동 기록으로 구성한다.
type Tab = 'videos' | 'history';
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

// 목록 카드는 사용자가 선택한 시안(A: 일정·타이밍 / B: 콘텐츠·취향 / C: 세계관·크레딧)에 따라 분기 렌더링한다.
export function WikiCreatorCard(props: { profile: PortalProfile; open: (slug: string) => void; favorites: string[]; toggle: (slug: string) => void; now: number; variant?: CardVariant; index?: number }) {
  const { variant = 'A' } = props;
  if (variant === 'B') return <WikiCreatorCardContent {...props} />;
  if (variant === 'C') return <WikiCreatorCardLore {...props} />;
  return <WikiCreatorCardSchedule {...props} />;
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
  return <>
    <div className="breadcrumb"><button onClick={back}>{t("전체 버튜버")}</button><span>{t("/")}</span><span>{profile.displayName}</span></div>
    <article className="wiki-header"><div className="wiki-cover" style={{ backgroundImage: `url("${profile.bannerUrl || '/images/spotlight_stage_bg.png'}")` }}><span className="cover-label">{t("버튜버 도감")}</span><div className="cover-actions"><Favorite profile={profile} favorites={favorites} toggle={toggle} /><button onClick={async () => { try { await navigator.clipboard.writeText(`https://vdebut.live${portalLanguagePath(`/creator/${profile.slug}`)}`); toast(t('공유할 주소를 복사했어요.')); } catch { toast(t('주소를 복사하지 못했어요.')); } }}>{t("주소 공유")}</button></div></div>
      <div className="wiki-identity"><div className={`wiki-avatar ${live ? 'is-live' : ''}`}><Avatar profile={profile} />{live && <b>{t("● LIVE")}</b>}</div><div className="identity-copy"><div className="name-row"><h1>{profile.displayName}</h1>{group(profile) && <span className="group-pill">{group(profile)}</span>}</div>{(details?.contentSummary || (profile.headline && !group(profile))) && <p>{details?.contentSummary || profile.headline}</p>}<div className="credit-row">{details?.illustrator && <span>{t("일러스트")}<b>{details.illustrator}</b></span>}{details?.rigger && <span>{t("리깅")}<b>{details.rigger}</b></span>}{!details?.illustrator && !details?.rigger && <span className="debut-meta">{dateLabel(profile)}{t("데뷔")}</span>}</div></div></div>
      <Channels profile={profile} />
    </article>
    <div className="wiki-columns"><div className="wiki-main"><nav className="wiki-tabs" aria-label={t("도감 메뉴")}>{([{ id: 'videos', label: '추천 영상' }, { id: 'history', label: '방송 · 활동 기록' }] as const).map(item => <button key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{t(item.label)}</button>)}</nav>
      {tab === 'videos' && <>
        {upcoming ? <section className="countdown"><div><span className="eyebrow">{t("FIRST HELLO")}</span><h2>{t("첫 만남까지, 조금만 기다려요")}</h2><div className="timer">{Number.isFinite(start) ? <>{t("D-")}{Math.floor(remaining / dayMs)} <span>{timeParts}</span></> : t('데뷔 일정을 기다리고 있어요')}</div><p>{dateLabel(profile)}{profile.dateState === 'FIXED' && t("· KST")}</p></div><button onClick={() => { if (profile.dateState === 'FIXED') downloadPortalSchedule(profile); else { if (!favorites.includes(profile.slug)) toggle(profile.slug); toast(t('관심 목록에서 데뷔 일정을 다시 볼 수 있어요.')); } }}>{t("데뷔 일정 저장")}</button></section> : live && <a className="live-banner" href={broadcast.url || profile.channelUrl} target="_blank" rel="noopener noreferrer"><img src={broadcast.thumbnailUrl || profile.avatarUrl} alt="" /><div><span className="live-tag">{t("LIVE")}</span><h2>{broadcast.title}</h2>{broadcast.viewers !== undefined && <p>{t("시청자 {0}명", [broadcast.viewers.toLocaleString()])}</p>}</div><span className="live-action">{t("방송 보기")}</span></a>}
        <section className="content-panel"><div className="section-title"><div><h2>{t(upcoming ? '첫 만남을 미리 만나보세요' : '추천 영상')}</h2></div><span>{t(upcoming ? '티저 · 데뷔 영상' : '채널의 최근 영상')}</span></div>{loading ? <div className="skeleton-media"><span /><span /></div> : videos.length && !upcoming ? <div className="video-grid">{videos.map(item => <MediaCard key={item.url} item={item} />)}</div> : upcoming && profile.media?.length ? <div className="video-grid">{profile.media.slice(0, 2).map(item => <MediaCard key={item.url} item={item} />)}</div> : <div className="soft-empty"><p>{t(detail?.channelMedia.videos.state === 'UNAVAILABLE' ? '지금은 영상을 불러오지 못했어요.' : '새로운 영상이 올라오면 이곳에서 만나요.')}</p></div>}</section>
        {upcoming ? <WikiGuestbook profile={profile} /> : <><section className="content-panel"><div className="section-title"><div><h2>{t("최신 클립")}</h2></div><span>{t("새로운 순간부터")}</span></div>{loading ? <div className="skeleton-media"><span /><span /></div> : clips.length ? <div className="clip-grid">{clips.map(item => <MediaCard key={item.url} item={item} clip />)}</div> : <div className="soft-empty"><p>{t(detail?.channelMedia.clips.state === 'UNAVAILABLE' ? '지금은 클립을 불러오지 못했어요.' : '아직 공개된 클립이 없어요.')}</p></div>}</section><section className="content-panel"><div className="section-title"><div><h2>{t("조금 더 알아가기")}</h2></div></div><div className="charm-grid">{[{ title: '이런 콘텐츠를 만나요', text: details?.contentSummary }, { title: '함께하는 방송', text: details?.broadcastStyle || profile.regularSchedule }, { title: '팬과 함께 쓰는 이야기', text: details?.fanMessage || profile.fanGuide }].map(item => <article key={item.title}><h3>{t(item.title)}</h3><p>{item.text || t('아직 알려진 이야기가 없어요.')}</p></article>)}</div></section></>}
      </>}
      {tab === 'history' && <><section className="content-panel"><div className="section-title"><div><h2>{t("지금까지의 발자취")}</h2></div></div><div className="timeline"><div><span /><time>{dateLabel(profile)}</time><h3>{t("첫 방송, 이야기의 시작")}</h3><p>{t('{0} 데뷔', [profile.displayName])}</p>{profile.noticeUrl && <a href={profile.noticeUrl} target="_blank" rel="noopener noreferrer">{t("공식 데뷔 공지")}</a>}</div>{profile.notices?.map(item => <div key={item.url}><span /><h3>{item.title}</h3><a href={item.url} target="_blank" rel="noopener noreferrer">{t("공식 소식")}</a></div>)}</div></section><WikiActivity profile={profile} /></>}
    </div><aside className="wiki-aside"><section className="spec-panel"><div className="section-title"><div><h2>{t("프로필 정보")}</h2></div><span>{t("PROFILE")}</span></div><dl>{facts.map(([label, value]) => <div key={label}><dt>{t(label || '')}</dt><dd className={!value ? 'unknown' : ''}>{value || t('미공개')}</dd></div>)}</dl><div className="fan-facts"><div><span>{t("팬덤명")}</span><strong>{details?.fandomName || t('미공개')}</strong></div><div><span>{t("오시마크")}</span><strong>{details?.oshiMark || t('미공개')}</strong></div></div>{details?.fanArtTag && <div className="fan-tag">{details.fanArtTag}</div>}{profile.cafeUrl && <a className="community-link" href={profile.cafeUrl} target="_blank" rel="noopener noreferrer">{t("공식 팬카페")}</a>}</section><section className="contribute-panel"><h2>{t("한 페이지씩,")}<br />{t("함께 채우는 이야기")}</h2><p>{t('{0}의 새로운 이야기를 알고 있나요?', [profile.displayName])}</p><button onClick={report}>{t("정보 제보 및 수정하기")}</button><small>{t("공식 출처를 확인하고 담아요.")}</small></section></aside></div>
  </>;
}

const POPULAR_QUICK_TAGS = ['종합게임', '노래', '소통', '라디오', 'ASMR', '그림', '저챗'];
type SortOrder = 'UPCOMING' | 'RECENT' | 'NAME';

function sortProfiles(list: PortalProfile[], order: SortOrder, now: number): PortalProfile[] {
  return [...list].sort((a, b) => {
    if (order === 'NAME') {
      return a.displayName.localeCompare(b.displayName, 'ko');
    }
    const aTime = a.dateState === 'FIXED' ? Date.parse(a.startAtUtc) : NaN;
    const bTime = b.dateState === 'FIXED' ? Date.parse(b.startAtUtc) : NaN;
    const aValid = Number.isFinite(aTime);
    const bValid = Number.isFinite(bTime);

    if (order === 'UPCOMING') {
      const aFuture = aValid && aTime >= now;
      const bFuture = bValid && bTime >= now;
      if (aFuture && bFuture) return aTime - bTime;
      if (aFuture) return -1;
      if (bFuture) return 1;
      if (aValid && bValid) return bTime - aTime;
      if (aValid) return -1;
      if (bValid) return 1;
      return a.displayName.localeCompare(b.displayName, 'ko');
    }

    if (order === 'RECENT') {
      if (aValid && bValid) return bTime - aTime;
      if (aValid) return -1;
      if (bValid) return 1;
      return a.displayName.localeCompare(b.displayName, 'ko');
    }

    return 0;
  });
}

// 목록은 실제 공개 프로필을 검색·필터링하고 카드 구조만 새 시안으로 보여준다.
export function WikiDirectoryContent({ profiles, open, favorites, toggle, now, favoritesOnly = false }: { favoritesOnly?: boolean; profiles: PortalProfile[]; open: (slug: string) => void; favorites: string[]; toggle: (slug: string) => void; now: number }) {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [cardVariant, setCardVariant] = useState<CardVariant>('A');
  const [sortOrder, setSortOrder] = useState<SortOrder>('UPCOMING');
  usePortalLocale();
  const [onlyFavorites, setOnlyFavorites] = useState(favoritesOnly);
  useEffect(() => { setOnlyFavorites(favoritesOnly); if (favoritesOnly) setCountry('ALL'); }, [favoritesOnly]);
  const [country, setCountry] = useState(favoritesOnly ? 'ALL' : 'KR');
  const [tag, setTag] = useState('');
  const [language, setLanguage] = useState('');
  const tags = [...new Set(profiles.flatMap(profile => profile.tags))].sort();
  const languages = [...new Set(profiles.flatMap(profile => profile.languages))].sort();
  const [visible, setVisible] = useState(12);
  useEffect(() => setVisible(12), [country, tag, language, onlyFavorites, sortOrder, cardVariant]);

  const matches = useMemo(() => {
    return profiles.filter(p =>
      (platform === 'ALL' || p.platform === platform) &&
      (!(favoritesOnly || onlyFavorites) || favorites.includes(p.slug)) &&
      (country === 'ALL' || p.countryCode === country) &&
      (!tag || p.tags.includes(tag)) &&
      (!language || p.languages.includes(language)) &&
      `${p.displayName} ${p.debutGroupName || ''} ${p.details?.species || ''} ${p.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [profiles, platform, favoritesOnly, onlyFavorites, favorites, country, tag, language, query]);

  const sortedMatches = useMemo(() => {
    return sortProfiles(matches, sortOrder, now);
  }, [matches, sortOrder, now]);

  const resetFilters = () => {
    setQuery('');
    setPlatform('ALL');
    setCountry('ALL');
    setTag('');
    setLanguage('');
    setSortOrder('UPCOMING');
  };

  return (
    <>
      <section className="directory-intro">
        <span className="eyebrow">{t('새로운 취향을 발견하는 곳')}</span>
        <h1>
          {t('당신의 다음 이야기를 만나보세요')}
          <span>{t('.')}</span>
        </h1>
        <p>{t('첫 인사부터 오래 함께할 순간까지, 버튜버의 이야기를 한곳에.')}</p>

        {/* 검색창 & 지우기 버튼 */}
        <div className="directory-search-wrapper">
          <div className="directory-search">
            <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              aria-label={t('버튜버 검색')}
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setVisible(12);
              }}
              placeholder={t('활동명, 공식 그룹, 종족, 해시태그로 찾아보세요')}
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                aria-label={t('검색어 지우기')}
                onClick={() => setQuery('')}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* 퀵 태그 바 */}
        <div className="wiki-quick-tags" role="toolbar" aria-label={t('추천 태그')}>
          {POPULAR_QUICK_TAGS.map(pt => (
            <button
              key={pt}
              type="button"
              className={`wiki-quick-tag ${tag === pt ? 'is-active' : ''}`}
              onClick={() => {
                setTag(tag === pt ? '' : pt);
                setVisible(12);
              }}
            >
              #{pt}
            </button>
          ))}
        </div>
      </section>

      {/* 상단 시안 선택기 탭 (A/B/C 전환) */}
      <WikiVariantSelector variant={cardVariant} onChange={setCardVariant} />

      <div className="directory-toolbar">
        <div className="platform-filters">
          {[{ id: 'ALL', label: '전체' }, ...platforms].map(item => (
            <button
              key={item.id}
              aria-pressed={platform === item.id}
              onClick={() => {
                setPlatform(item.id);
                setVisible(12);
              }}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <button
          className={`favorites-filter ${onlyFavorites ? 'selected' : ''}`}
          aria-pressed={favoritesOnly || onlyFavorites}
          onClick={() => (favoritesOnly ? open('') : setOnlyFavorites(!onlyFavorites))}
        >
          {t('관심 버튜버')}
        </button>
      </div>

      <details className="wiki-browse-options">
        <summary>{t('상세 탐색 조건')}</summary>
        <div>
          <label>
            {t('활동 국가')}
            <select value={country} onChange={event => setCountry(event.target.value)}>
              <option value="ALL">{t('전체 국가')}</option>
              <option value="KR">{t('한국')}</option>
              <option value="JP">{t('일본')}</option>
              <option value="US">{t('미국')}</option>
            </select>
          </label>
          <label>
            {t('주요 콘텐츠')}
            <select value={tag} onChange={event => setTag(event.target.value)}>
              <option value="">{t('전체 콘텐츠')}</option>
              {tags.map(tOption => (
                <option key={tOption}>{tOption}</option>
              ))}
            </select>
          </label>
          <label>
            {t('방송 언어')}
            <select value={language} onChange={event => setLanguage(event.target.value)}>
              <option value="">{t('전체 방송 언어')}</option>
              {languages.map(lOption => (
                <option key={lOption}>{lOption}</option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <div className="results-row">
        <h2>
          {t(favoritesOnly || onlyFavorites ? '저장한 이야기' : '전체 버튜버')}
          <span>{sortedMatches.length.toLocaleString()}</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="wiki-sort-select"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            aria-label={t('정렬 기준')}
          >
            <option value="UPCOMING">{t('데뷔 임박순')}</option>
            <option value="RECENT">{t('최근 데뷔순')}</option>
            <option value="NAME">{t('이름 가나다순')}</option>
          </select>
        </div>
      </div>

      {sortedMatches.length ? (
        <div className="creator-grid">
          {sortedMatches.slice(0, visible).map((profile, index) => (
            <WikiCreatorCard
              key={profile.slug}
              profile={profile}
              open={open}
              favorites={favorites}
              toggle={toggle}
              now={now}
              variant={cardVariant}
              index={index + 1}
            />
          ))}
        </div>
      ) : (
        <div className="big-empty">
          <h2>{t(favoritesOnly || onlyFavorites ? '마음에 드는 버튜버를 저장해 보세요' : '조건에 맞는 버튜버가 없어요')}</h2>
          <p>{t('검색어나 탐색 조건을 바꿔서 다시 찾아보세요.')}</p>
          <button
            type="button"
            className="primary"
            style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={resetFilters}
          >
            <RotateCcw size={14} />
            <span>{t('모든 조건 초기화')}</span>
          </button>
          {profiles.length > 0 && !favoritesOnly && !onlyFavorites && (
            <div className="empty-recommendation-section">
              <div className="empty-recommendation-title">{t('🌟 이런 버튜버는 어떠세요?')}</div>
              <div className="creator-grid">
                {profiles.slice(0, 4).map((profile, index) => (
                  <WikiCreatorCard
                    key={profile.slug}
                    profile={profile}
                    open={open}
                    favorites={favorites}
                    toggle={toggle}
                    now={now}
                    variant={cardVariant}
                    index={index + 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sortedMatches.length > visible && (
        <button className="load-more" onClick={() => setVisible(visible + 12)}>
          {t('더 많은 이야기 만나기')}
        </button>
      )}
    </>
  );
}
