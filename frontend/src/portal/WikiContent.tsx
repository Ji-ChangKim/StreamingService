import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { PORTAL_PLATFORMS, type PortalProfile } from '../../../shared/portal';
import type { ProfileDetailResponse } from '../../../shared/profileDetails';
import { portalSchedule } from './PortalUi';
import { t, usePortalLocale, getPortalLanguage } from './portalLocale';
import { profileDebutPhase, profileAgencyName } from '../../../shared/profilePresentation';
import { DebutStory, OfficialLinks, ProfileInsights, profileChannelKey, useChannelBoard } from './ProfileInsights';
import { ProfileHero } from './ProfileHero';
import { ProfileMedia } from './ProfileMedia';
import { WikiGuestbook } from './WikiParticipation';
// 방송 기록 탭: 채널 통계 화면을 그대로 넣는다(누를 때만 코드를 받는다).
const EmbeddedChannelBoard = lazy(() => import('../components/analytics/board/ChannelBoardPage').then((m) => ({ default: m.ChannelBoardPage })));
import { WikiCreatorCardContent } from './WikiCardVariants';
import './wikiContent.css';
import './wikiCardVariants.css';

// 상세 본문 메뉴는 추천 영상과 방송·활동 기록으로 구성한다.
type Tab = 'intro' | 'record';
const platforms = PORTAL_PLATFORMS;

// 등록된 공식 일정만 표시하고 날짜 미정과 시간 미정을 구분한다.
function dateLabel(profile: PortalProfile): string { return profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc)) ? new Date(profile.startAtUtc).toLocaleString(getPortalLanguage(), { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : portalSchedule(profile); }

// 공식 그룹 필드가 있는 경우에만 그룹으로 노출한다.
function group(profile: PortalProfile): string { return profile.debutGroupId ? [profile.agency, profile.debutGroupName].filter(Boolean).join(' · ') : ''; }

// 플랫폼 필터 바: 공식 가이드라인 준수 로고(밝은 배경용 원본) 렌더러
function PlatformFilterContent({ id, label }: { id: string; label: string }) {
  if (id === 'CHZZK') {
    return <img className="platform-filter-logo is-chzzk" src="/icons/chzzk/chzzklogo_kor_black.png" alt="치지직" />;
  }
  if (id === 'SOOP') {
    return <img className="platform-filter-logo is-soop" src="/icons/soop/soop_logo_blue.svg" alt="SOOP" />;
  }
  if (id === 'YOUTUBE') {
    return <img className="platform-filter-logo is-youtube" src="/icons/logo_youtube.png" alt="YouTube" />;
  }
  if (id === 'TWITCH') {
    return <img className="platform-filter-logo is-twitch" src="/icons/logo_twitch.png" alt="Twitch" />;
  }
  return <span>{t(label)}</span>;
}

// 버튜버 목록 카드는 시안 2(Full-Bleed 200px 대형 비주얼 커버형)로 단일 적용한다.
export function WikiCreatorCard(props: { profile: PortalProfile; open: (slug: string) => void; favorites: string[]; toggle: (slug: string) => void; now: number; index?: number }) {
  return <WikiCreatorCardContent {...props} />;
}

// 상세 도감은 등록 정보와 이번 진입의 실제 플랫폼 응답으로만 채운다.
export function WikiProfileContent({ profile, detail, loading, report, now, favorites, toggle, back, toast, navigate }: { navigate?: (path: string) => void; profile: PortalProfile; detail?: ProfileDetailResponse; loading: boolean; report: () => void; now: number; favorites: string[]; toggle: (slug: string) => void; back: () => void; toast: (text: string) => void }) {
  const upcoming = profileDebutPhase(profile, now) === 'UPCOMING' && detail?.broadcast.state !== 'LIVE';
  const initialTab = (): Tab => (!upcoming && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'record' ? 'record' : 'intro');
  const [tab, setTabState] = useState<Tab>(initialTab);
  useEffect(() => { setTabState(initialTab()); }, [profile.slug]);
  // 탭을 주소에 남겨 방송 통계에서 바로 '방송 기록'으로 들어오고, 공유한 주소도 같은 탭을 연다.
  const setTab = (next: Tab) => {
    setTabState(next);
    const url = new URL(window.location.href);
    if (next === 'record') url.searchParams.set('tab', 'record'); else url.searchParams.delete('tab');
    window.history.replaceState(window.history.state, '', url.toString());
  };
  const key = profileChannelKey(profile);
  const month = useChannelBoard(key, 30);
  const details = profile.details;
  // 값이 없는 줄은 '미공개' 대신 숨긴다.
  const facts = [['데뷔일', dateLabel(profile)], ['소속', profileAgencyName(profile.agency)], ['공식 그룹', group(profile)], ['플랫폼', t(PORTAL_PLATFORMS.find((p) => p.id === profile.platform)?.label || profile.platform)], ['방송 언어', profile.languages?.join(' · ')], ['주요 콘텐츠', profile.tags?.slice(0, 3).join(' · ')], ['종족', details?.species], ['생일 / 별자리', [details?.birthday, details?.zodiac].filter(Boolean).join(' / ')], ['신장 / 혈액형', [details?.height, details?.bloodType].filter(Boolean).join(' / ')], ['MBTI', details?.mbti], ['일러스트', details?.illustrator], ['리깅', details?.rigger]].filter(([, value]) => Boolean(value)) as [string, string][];
  const charms = [{ title: '이런 콘텐츠를 만나요', text: details?.contentSummary }, { title: '함께하는 방송', text: details?.broadcastStyle || profile.regularSchedule }, { title: '팬과 함께 쓰는 이야기', text: details?.fanMessage || profile.fanGuide }].filter((item) => Boolean(item.text));
  const factList = <><dl>{facts.map(([label, value]) => <div key={label}><dt>{t(label || '')}</dt><dd>{value}</dd></div>)}</dl>{(details?.fandomName || details?.oshiMark) && <div className="fan-facts">{details?.fandomName && <div><span>{t("팬덤명")}</span><strong>{details.fandomName}</strong></div>}{details?.oshiMark && <div><span>{t("오시마크")}</span><strong>{details.oshiMark}</strong></div>}</div>}{details?.fanArtTag && <div className="fan-tag">{details.fanArtTag}</div>}</>;
  return <>
    <div className="breadcrumb"><button onClick={back}>{t("버튜버 DB")}</button><span>{t("/")}</span><span>{profile.displayName}</span></div>
    <ProfileHero profile={profile} detail={detail} month={month} now={now} favorites={favorites} toggle={toggle} toast={toast} />
    <div className="vd-mobile-links"><OfficialLinks profile={profile} upcoming={upcoming} />{facts.length > 0 && <details><summary>{t('프로필 정보 펼치기')} ▾<small>{facts.slice(0, 4).map(([label]) => t(label)).join('·')}</small></summary><section className="spec-panel vd-keep">{factList}</section></details>}</div>
    <div className="wiki-columns"><div className="wiki-main"><nav className="wiki-tabs" aria-label={t("상세 보기")}>
      <button aria-pressed={tab === 'intro'} onClick={() => setTab('intro')}>{t('소개')}</button>
      <button aria-pressed={tab === 'record'} disabled={upcoming} onClick={() => setTab('record')}>{t('방송 기록')}{upcoming && <small className="vd-tab-note">{t('데뷔 후 열려요')}</small>}</button>
    </nav>
      {tab === 'intro' && <>
        <DebutStory profile={profile} now={now} />
        <ProfileMedia profile={profile} detail={detail} loading={loading} upcoming={upcoming} now={now} />
        {upcoming ? <><WikiGuestbook profile={profile} /><p className="vd-after"><span className="vd-ins-eyebrow"><b>{t('안내')}</b></span><span><b>{t('첫 방송이 끝나면 방송 기록이 쌓이기 시작해요.')}</b> {t('방송 요약, 방송 패턴, 콘텐츠별 반응이 이곳에 차례로 보여요.')}</span></p></>
          : <><ProfileInsights profile={profile} openRecord={() => setTab('record')} now={now} />{charms.length > 0 && <section className="content-panel"><div className="section-title"><div><h2>{t("조금 더 알아가기")}</h2></div></div><div className="charm-grid">{charms.map(item => <article key={item.title}><h3>{t(item.title)}</h3><p>{item.text}</p></article>)}</div></section>}</>}
      </>}
      {tab === 'record' && <><section className="content-panel"><div className="section-title"><div><h2>{t("지금까지의 발자취")}</h2></div></div><div className="timeline"><div><span /><time>{dateLabel(profile)}</time><h3>{t("첫 방송, 이야기의 시작")}</h3><p>{t('{0} 데뷔', [profile.displayName])}</p>{profile.noticeUrl && <a href={profile.noticeUrl} target="_blank" rel="noopener noreferrer">{t("공식 데뷔 공지")}</a>}</div>{profile.notices?.map(item => <div key={item.url}><span /><h3>{item.title}</h3><a href={item.url} target="_blank" rel="noopener noreferrer">{t("공식 소식")}</a></div>)}</div></section>{key ? <Suspense fallback={<div className="skeleton-media"><span /></div>}><EmbeddedChannelBoard channelKey={key} onNavigate={navigate || (() => undefined)} embedded /></Suspense> : <section className="content-panel"><p className="soft-empty">{t('이 플랫폼은 아직 방송 기록을 모으지 않아요. 치지직·SOOP 채널의 방송을 기록하고 있어요.')}</p></section>}</>}
    </div><aside className="wiki-aside">{facts.length > 0 && <section className="spec-panel"><div className="section-title"><div><h2>{t("프로필 정보")}</h2></div></div>{factList}</section>}<OfficialLinks profile={profile} upcoming={upcoming} /><section className="contribute-panel vd-report"><p>{t('일정이나 소개가 바뀌었다면 알려 주세요. 공식 채널로 확인한 뒤 고칠게요.')}</p><button onClick={report}>{t("정보 제보 및 수정하기")}</button></section></aside></div>
  </>;
}

type SortOrder = 'UPCOMING' | 'RECENT' | 'NAME';

function getKstDateInfo(now: number) {
  const kst = new Date(now + 9 * 3600000);
  const iso = kst.toISOString();
  return {
    today: iso.slice(0, 10),
    thisMonth: iso.slice(0, 7),
  };
}

// "데뷔 전인 신인들"을 최우선으로 세우는 4단계 위계 판별
function getDebutTierAndKey(profile: PortalProfile, now: number, today: string, thisMonth: string): { tier: number; key: number | string } {
  // [1순위] 데뷔 일시 확정된 미래 방송 (D-Day, D-1, D-2...)
  if (profile.dateState === 'FIXED' && profile.startAtUtc) {
    const time = Date.parse(profile.startAtUtc);
    if (Number.isFinite(time)) {
      if (time >= now) return { tier: 1, key: time };
      return { tier: 5, key: -time }; // 이미 첫 방송을 마친 데뷔 완료자 (최근순 역순)
    }
  }

  // [2순위] 데뷔 날짜 확정된 미래 일정 (시간 미정)
  if (profile.debutDate) {
    if (profile.debutDate >= today) return { tier: 2, key: profile.debutDate };
    const past = Date.parse(profile.debutDate);
    return { tier: 5, key: Number.isFinite(past) ? -past : 0 };
  }

  // [3순위] 데뷔 월 확정된 미래 신인 (11월 데뷔, 12월 데뷔 등)
  if (profile.targetMonth) {
    if (profile.targetMonth >= thisMonth) return { tier: 3, key: profile.targetMonth };
    return { tier: 5, key: 0 };
  }

  // [4순위] 데뷔 준비 중 신인 (일정 조율 중 / 곧 만나요)
  if (profile.dateState === 'NONE' || !profile.debutDate) {
    return { tier: 4, key: profile.slug };
  }

  return { tier: 5, key: 0 };
}

function sortProfiles(list: PortalProfile[], order: SortOrder, now: number): PortalProfile[] {
  const { today, thisMonth } = getKstDateInfo(now);

  return [...list].sort((a, b) => {
    if (order === 'NAME') {
      return a.displayName.localeCompare(b.displayName, 'ko');
    }

    if (order === 'RECENT') {
      const aTime = a.dateState === 'FIXED' ? Date.parse(a.startAtUtc) : Date.parse(a.debutDate);
      const bTime = b.dateState === 'FIXED' ? Date.parse(b.startAtUtc) : Date.parse(b.debutDate);
      const aValid = Number.isFinite(aTime);
      const bValid = Number.isFinite(bTime);
      if (aValid && bValid) return bTime - aTime;
      if (aValid) return -1;
      if (bValid) return 1;
      return a.displayName.localeCompare(b.displayName, 'ko');
    }

    // 기본값: 'UPCOMING' (데뷔 전 신인 최우선 정렬)
    const aInfo = getDebutTierAndKey(a, now, today, thisMonth);
    const bInfo = getDebutTierAndKey(b, now, today, thisMonth);

    if (aInfo.tier !== bInfo.tier) {
      return aInfo.tier - bInfo.tier;
    }

    if (typeof aInfo.key === 'number' && typeof bInfo.key === 'number') {
      if (aInfo.key !== bInfo.key) return aInfo.key - bInfo.key;
    } else if (typeof aInfo.key === 'string' && typeof bInfo.key === 'string') {
      const comp = aInfo.key.localeCompare(bInfo.key);
      if (comp !== 0) return comp;
    }

    return a.displayName.localeCompare(b.displayName, 'ko');
  });
}

// 목록은 실제 공개 프로필을 검색·필터링하고 시안 2 카드로 깔끔하게 렌더링한다.
export function WikiDirectoryContent({ profiles, open, favorites, toggle, now, favoritesOnly = false }: { favoritesOnly?: boolean; profiles: PortalProfile[]; open: (slug: string) => void; favorites: string[]; toggle: (slug: string) => void; now: number }) {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('ALL');
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
  useEffect(() => setVisible(12), [country, tag, language, onlyFavorites, sortOrder]);

  // 현재 컨텍스트(국가, 관심 버튜버 조건) 내에서 실제 등록된 버튜버가 1명 이상 있는 플랫폼 추출
  const availablePlatformIds = useMemo(() => {
    const candidates = profiles.filter(p =>
      (!(favoritesOnly || onlyFavorites) || favorites.includes(p.slug)) &&
      (country === 'ALL' || p.countryCode === country)
    );
    return new Set(candidates.map(p => p.platform));
  }, [profiles, favoritesOnly, onlyFavorites, favorites, country]);

  // 실제 버튜버가 존재하는 플랫폼만 노출 (0명인 플랫폼은 버튼 숨김)
  const visiblePlatforms = useMemo(() => {
    return platforms.filter(p => availablePlatformIds.has(p.id));
  }, [availablePlatformIds]);

  // 선택된 플랫폼이 필터 변경으로 가용 목록에서 사라지면 'ALL'로 안전 복귀
  useEffect(() => {
    if (platform !== 'ALL' && !availablePlatformIds.has(platform as any)) {
      setPlatform('ALL');
    }
  }, [availablePlatformIds, platform]);

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
        <h1>{t('버튜버 조회')}</h1>

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
      </section>

      <div className="directory-toolbar">
        <div className="platform-filters">
          {[{ id: 'ALL', label: '전체' }, ...visiblePlatforms].map(item => (
            <button
              key={item.id}
              type="button"
              className={`platform-filter-btn platform-btn-${item.id}`}
              aria-label={t('{0} 플랫폼 필터', [item.label])}
              aria-pressed={platform === item.id}
              onClick={() => {
                setPlatform(item.id);
                setVisible(12);
              }}
            >
              <PlatformFilterContent id={item.id} label={item.label} />
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
        <span className="directory-count-text">
          {t(favoritesOnly || onlyFavorites ? '저장한 버튜버' : query ? '검색 결과' : '전체 버튜버')}{' '}
          <strong>{sortedMatches.length.toLocaleString()}{t('명')}</strong>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="wiki-sort-select"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            aria-label={t('정렬 기준')}
          >
            <option value="UPCOMING">{t('데뷔 임박순 (신인 우선)')}</option>
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
