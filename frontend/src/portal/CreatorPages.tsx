import { t, usePortalLocale } from './portalLocale';
import { useEffect, useState } from 'react';
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
  const tags = [...new Set(profiles.flatMap((p) => p.tags))].sort();
  const languages = [...new Set(profiles.flatMap((p) => p.languages))].sort();
  const filtered = profiles.filter((p) => (!favoritesOnly || favorites.includes(p.slug)) && (platform === 'ALL' || p.platform === platform) && (!tag || p.tags.includes(tag)) && (!language || p.languages.includes(language)) && `${p.displayName} ${p.description} ${p.tags.join(' ')}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'));
  return <><PortalHeading title={favoritesOnly ? t("관심 버튜버") : t("버튜버 둘러보기")} description={favoritesOnly ? t("이 브라우저에 저장한 관심 목록이에요. 소개와 다음 데뷔 소식을 다시 확인하세요.") : t("플랫폼과 방송 콘텐츠, 소개를 살펴보고 나만의 버튜버를 찾아보세요.")}>{!favoritesOnly && <PortalLink to="/creators/register" className="vd-button" onNavigate={onNavigate}>{t("내 소개 등록")}<ArrowRight size={16} /></PortalLink>}</PortalHeading><section className="vd-directory-filters"><div className="vd-search"><Search size={18} /><input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(24); }} aria-label={t("버튜버 이름·소개 검색")} placeholder={t("이름, 소개, 콘텐츠로 검색")} /></div><label><span className="vd-sr-only">{t("방송 플랫폼")}</span><select value={platform} onChange={(e) => { setPlatform(e.target.value); setLimit(24); }}><option value="ALL">{t("전체 플랫폼")}</option>{PORTAL_PLATFORMS.map((p) => <option value={p.id} key={p.id}>{p.label}</option>)}</select></label><label><span className="vd-sr-only">{t("주요 콘텐츠")}</span><select value={tag} onChange={(e) => { setTag(e.target.value); setLimit(24); }}><option value="">{t("전체 콘텐츠")}</option>{tags.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="vd-sr-only">{t("방송 언어")}</span><select value={language} onChange={(e) => { setLanguage(e.target.value); setLimit(24); }}><option value="">{t("전체 방송 언어")}</option>{languages.map((item) => <option key={item}>{item}</option>)}</select></label></section>{loading ? <PortalState loading title={t("버튜버 소개를 불러오는 중이에요")} /> : error ? <PortalState title={t("소개를 불러오지 못했어요")} action={<button type="button" className="vd-button" onClick={refresh}>{t("다시 시도")}</button>} /> : filtered.length ? <><div className="vd-results-heading"><span>{filtered.length}{t("명의 버튜버")}</span><span>{t("이름순")}</span></div><div className="vd-cards">{filtered.slice(0, limit).map((profile) => <CreatorCard profile={profile} onNavigate={onNavigate} key={profile.slug} />)}</div>{limit < filtered.length && <button className="vd-button vd-show-more" type="button" onClick={() => setLimit(limit + 24)}>{t("더 보기")}<ArrowRight size={16} /></button>}</> : <PortalState title={favoritesOnly && !favorites.length ? t("마음에 드는 버튜버를 저장해 보세요") : t("조건에 맞는 버튜버가 없어요")} description={favoritesOnly && !favorites.length ? t("소개 카드의 하트를 누르면 여기서 다시 만날 수 있어요.") : t("검색어나 탐색 조건을 바꿔 보세요.")} action={favoritesOnly && !favorites.length ? <PortalLink to="/creators" className="vd-button vd-primary" onNavigate={onNavigate}>{t("버튜버 둘러보기")}</PortalLink> : <button className="vd-button" type="button" onClick={() => { setQuery(''); setPlatform('ALL'); setTag(''); setLanguage(''); }}>{t("조건 초기화")}</button>} />}</>;
}

// 개인 소개는 등록 미리보기와 동일한 상세 화면을 사용한다.
export { ProfilePage } from './CreatorProfile';
