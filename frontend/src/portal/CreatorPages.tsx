import { t, usePortalLocale } from './portalLocale';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { PortalProfile, PORTAL_PLATFORMS } from '../../../shared/portal';
import { CreatorCard, PortalHeading, PortalLink, PortalState } from './PortalUi';
import { readPortalStorage } from './portalApi';

// 버튜버 규모와 관계없이 실제 등록된 소개를 조건별로 탐색한다.
export function DirectoryPage({ profiles, favoritesOnly = false, loading, error, refresh, onNavigate }: { profiles: PortalProfile[]; favoritesOnly?: boolean; loading: boolean; error: string; refresh: () => void; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [query, setQuery] = useState(''); const [platform, setPlatform] = useState('ALL');
  const [tag, setTag] = useState(''); const [language, setLanguage] = useState('');
  const [limit, setLimit] = useState(24); const [favorites, setFavorites] = useState<string[]>(() => readPortalStorage('favorites', []));
  useEffect(() => { const sync = () => setFavorites(readPortalStorage('favorites', [])); window.addEventListener('vd-favorites', sync); return () => window.removeEventListener('vd-favorites', sync); }, []);
  const tags = useMemo(() => [...new Set(profiles.flatMap((p) => p.tags))].sort(), [profiles]);
  const languages = useMemo(() => [...new Set(profiles.flatMap((p) => p.languages))].sort(), [profiles]);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return profiles.filter((p) => (!favoritesOnly || favorites.includes(p.slug)) && (platform === 'ALL' || p.platform === platform) && (!tag || p.tags.includes(tag)) && (!language || p.languages.includes(language)) && (!q || `${p.displayName} ${p.description} ${p.tags.join(' ')}`.toLocaleLowerCase().includes(q))).sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'));
  }, [profiles, favoritesOnly, favorites, platform, tag, language, query]);
  const hasFilters = Boolean(query.trim() || platform !== 'ALL' || tag || language);
  const emptyFavorites = favoritesOnly && !hasFilters;
  return <><PortalHeading title={favoritesOnly ? t("관심 버튜버") : t("버튜버 둘러보기")} description={favoritesOnly ? t("이 브라우저에 저장한 관심 목록이에요. 소개와 다음 데뷔 소식을 다시 확인하세요.") : t("플랫폼과 방송 콘텐츠, 소개를 살펴보고 마음에 드는 버튜버를 찾아보세요.")}>{!favoritesOnly && <PortalLink to="/creators/register" className="vd-button" onNavigate={onNavigate}>{t("내 소개 등록")}<ArrowRight size={16} /></PortalLink>}</PortalHeading><section className="vd-directory-filters"><div className="vd-search"><Search size={18} /><input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(24); }} aria-label={t("버튜버 이름·소개 검색")} placeholder={t("이름, 소개, 콘텐츠로 검색")} /></div><label><span className="vd-sr-only">{t("방송 플랫폼")}</span><select value={platform} onChange={(e) => { setPlatform(e.target.value); setLimit(24); }}><option value="ALL">{t("전체 플랫폼")}</option>{PORTAL_PLATFORMS.map((p) => <option value={p.id} key={p.id}>{p.label}</option>)}</select></label><label><span className="vd-sr-only">{t("주요 콘텐츠")}</span><select value={tag} onChange={(e) => { setTag(e.target.value); setLimit(24); }}><option value="">{t("전체 콘텐츠")}</option>{tags.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="vd-sr-only">{t("방송 언어")}</span><select value={language} onChange={(e) => { setLanguage(e.target.value); setLimit(24); }}><option value="">{t("전체 방송 언어")}</option>{languages.map((item) => <option key={item}>{item}</option>)}</select></label></section>{loading ? <PortalState loading title={t("버튜버 소개를 불러오는 중이에요")} /> : error ? <PortalState error title={t("소개를 불러오지 못했어요")} description={t("잠시 후 다시 시도해 주세요. 문제가 계속되면 문의 화면으로 알려주세요.")} action={<button type="button" className="vd-button" onClick={refresh}>{t("다시 시도")}</button>} /> : filtered.length ? <><div className="vd-results-heading"><span>{filtered.length}{t("명의 버튜버")}</span><span>{t("이름순")}</span></div><div className="vd-cards">{filtered.slice(0, limit).map((profile) => <CreatorCard profile={profile} onNavigate={onNavigate} key={profile.slug} />)}</div>{limit < filtered.length && <button className="vd-button vd-show-more" type="button" onClick={() => setLimit(limit + 24)}>{t("더 보기")}<ArrowRight size={16} /></button>}</> : <PortalState title={emptyFavorites ? t("마음에 드는 버튜버를 저장해 보세요") : hasFilters ? t("조건에 맞는 버튜버가 없어요") : t("공개된 버튜버 소개가 아직 없어요")} description={emptyFavorites ? t("소개 카드의 하트를 눌러 관심 목록을 만들어 보세요. 공개 중인 소개만 이곳에서 볼 수 있어요.") : hasFilters ? t("검색어나 탐색 조건을 바꿔 보세요.") : t("데뷔 캘린더나 이용 가이드를 먼저 살펴보세요.")} action={emptyFavorites ? <PortalLink to="/creators" className="vd-button vd-primary" onNavigate={onNavigate}>{t("버튜버 둘러보기")}</PortalLink> : hasFilters ? <button className="vd-button" type="button" onClick={() => { setQuery(''); setPlatform('ALL'); setTag(''); setLanguage(''); setLimit(24); }}>{t("조건 초기화")}</button> : <PortalLink to="/guide" onNavigate={onNavigate} className="vd-button">{t("이용 가이드")}</PortalLink>} />}</>;
}

// 개인 소개는 등록 미리보기와 동일한 상세 화면을 사용한다.
export { ProfilePage } from './CreatorProfile';
