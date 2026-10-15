import { isActivityPath } from '../../../shared/activitySeo';
import { applyPageSeo } from '../utils/applyPageSeo';
import { t, usePortalLocale, setPortalLanguage, portalLanguagePath, PortalLanguage } from './portalLocale';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { CalendarDays, Heart, Menu, Plus, Search, X, BarChart3 } from 'lucide-react';
import { CalendarPage } from './CalendarPage';
import { PortalGuide } from './PortalLearning';
import { PortalLink, PortalState } from './PortalUi';
import { usePortalProfiles } from './portalApi';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { portalPageSeo } from '../../../shared/portalSeo';
import './portal.css';

// 메인에서 쓰지 않는 화면은 해당 경로에 진입할 때만 다운로드한다.
const DirectoryPage = lazy(() => import('./CreatorPages').then((module) => ({ default: module.DirectoryPage })));
const ProfilePage = lazy(() => import('./CreatorPages').then((module) => ({ default: module.ProfilePage })));
const RegistrationPage = lazy(() => import('./RequestPages').then((module) => ({ default: module.RegistrationPage })));
const SubmissionStatusPage = lazy(() => import('./RequestPages').then((module) => ({ default: module.SubmissionStatusPage })));
const PortalAbout = lazy(() => import('./InfoPages').then((module) => ({ default: module.PortalAbout })));
const PortalContact = lazy(() => import('./InfoPages').then((module) => ({ default: module.PortalContact })));
const PortalAdmin = lazy(() => import('./PortalAdmin').then((module) => ({ default: module.PortalAdmin })));
// 기존 신청서·일괄 등록·버튜버 관리 화면도 같은 운영자 주소에서 보존한다.
const AdminCmsPage = lazy(() => import('../components/pages/AdminCmsPage').then((module) => ({ default: module.AdminCmsPage })));
const PortalStatistics = lazy(() => import('./PortalStatistics').then((module) => ({ default: module.PortalStatistics })));
const PrivacyPage = lazy(() => import('../components/pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('../components/pages/TermsPage').then((module) => ({ default: module.TermsPage })));

const NAV = [{ to: '/', label: '데뷔 캘린더', icon: CalendarDays }, { to: '/creators', label: '버튜버 찾기', icon: Search }, { to: '/analytics', label: '방송 통계', icon: BarChart3 }];

// 개발 사이트에서 전체 화면을 같은 내비게이션과 실제 데이터로 연결한다.
export function PortalApp() {
  const language = usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [location, setLocation] = useState(() => `${window.location.pathname}${window.location.search}${window.location.hash}`);
  const [menu, setMenu] = useState(false);
  const path = location.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  const segments = path.split('/').filter(Boolean);
  const isAnalytics = isActivityPath(path);
  const isCreator = segments[0] === 'creator' && segments.length === 2;
  const development = window.location.hostname !== 'vdebut.live';
  const needsProfiles = path === '/' || path === '/creators' || path === '/me/favorites' || isCreator;
  const { profiles, loading, error, refresh } = usePortalProfiles(needsProfiles, path);
  let slug = ''; try { slug = isCreator ? decodeURIComponent(segments[1]) : ''; } catch { /* 잘못된 식별자는 찾을 수 없음으로 표시한다. */ }
  const profile = profiles.find((p) => p.slug === slug);
  const navigate = useCallback((to: string) => { window.history.pushState({}, '', portalLanguagePath(to)); setLocation(`${window.location.pathname}${window.location.search}${window.location.hash}`); setMenu(false); window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => { const sync = () => { const requested = new URLSearchParams(window.location.search).get('lang'); if (requested === 'ko' || requested === 'ja' || requested === 'en') setPortalLanguage(requested); setLocation(`${window.location.pathname}${window.location.search}${window.location.hash}`); setMenu(false); }; window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  useEffect(() => {
    // 통계는 실제 조회 자료로 계산한 전용 메타데이터를 유지한다.
    document.documentElement.lang = language;
    if (isAnalytics) return;
    const seoUrl = new URL(window.location.href); seoUrl.searchParams.set('lang', language);
    const seo = portalPageSeo(seoUrl, profile, { unavailable: needsProfiles && (Boolean(error) || loading) });
    applyPageSeo(seo);
  }, [location, path, profile, isAnalytics, language, error, loading, needsProfiles]);
  const dataProps = { profiles, loading, error, refresh, onNavigate: navigate };
  let content;
  if (path === '/') content = <CalendarPage {...dataProps} />;
  else if (path === '/upload' || path === '/creators/register') content = <RegistrationPage key={path} profileOnly={path === '/creators/register'} onNavigate={navigate} />;
  else if (path === '/creators' || path === '/me/favorites') content = <DirectoryPage key={path} {...dataProps} favoritesOnly={path === '/me/favorites'} />;
  else if (segments[0] === 'submissions' && segments.length === 2) content = <SubmissionStatusPage key={segments[1]} id={segments[1]} onNavigate={navigate} />;
  else if (isCreator) content = loading ? <PortalState loading title={t("소개를 불러오는 중이에요")} /> : error ? <PortalState pageHeading error title={t("소개를 불러오지 못했어요")} description={t("잠시 후 다시 시도해 주세요. 문제가 계속되면 문의 화면으로 알려주세요.")} action={<button type="button" onClick={refresh} className="vd-button">{t("다시 시도")}</button>} /> : !profile ? <PortalState pageHeading title={t("버튜버 소개를 찾을 수 없어요")} description={t("주소를 확인하거나 공개된 다른 소개를 살펴보세요.")} action={<PortalLink to="/creators" onNavigate={navigate} className="vd-button vd-primary">{t("다른 버튜버 만나보기")}</PortalLink>} /> : <ProfilePage profile={profile} profiles={profiles} onNavigate={navigate} />;
  else if (isAnalytics) content = <PortalStatistics path={path} onNavigate={navigate} />;
  else if (path === '/about') content = <PortalAbout onNavigate={navigate} />;
  else if (path === '/guide') content = <PortalGuide onNavigate={navigate} />;
  else if (path === '/contact') content = <PortalContact onNavigate={navigate} />;
  else if (path === '/admin') content = <><div className="vd-actions"><PortalLink to="/admin" onNavigate={navigate} className={`vd-button ${!location.includes('view=portal') ? 'is-active' : ''}`}>{t("통합 데뷔 심사 & 버튜버 관리")}</PortalLink><PortalLink to="/admin?view=portal" onNavigate={navigate} className={`vd-button ${location.includes('view=portal') ? 'is-active' : ''}`}>{t("콘텐츠 검토·문의 접수")}</PortalLink></div>{new URLSearchParams(location.split('?')[1]).get('view') === 'portal' ? <PortalAdmin onRefreshProfiles={refresh} /> : <AdminCmsPage onNavigateHome={() => navigate('/')} />}</>;
  else if (path === '/privacy') content = <PrivacyPage currentLang={language} onNavigateHome={() => navigate('/')} />;
  else if (path === '/terms') content = <TermsPage currentLang={language} secureManagement onNavigateHome={() => navigate('/')} />;
  if (!content) content = <PortalState pageHeading title={t("페이지를 찾을 수 없어요")} description={t("주소를 확인하거나 데뷔 캘린더에서 새로운 만남을 찾아보세요.")} action={<PortalLink to="/" onNavigate={navigate} className="vd-button vd-primary">{t("데뷔 캘린더로")}</PortalLink>} />;
  const active = (to: string) => to === '/' ? path === '/' : path.startsWith(to);
  return <ErrorBoundary currentLang={language}><div className="vd"><a className="vd-skip" href="#vd-main">{t("본문으로 바로가기")}</a><header className="vd-header"><div className="vd-header-inner"><PortalLink to="/" onNavigate={navigate} className="vd-logo"><img src="/logo.png" alt={t("VDébut · 버튜버와 팬의 소개팅")} /></PortalLink><nav className="vd-desktop-nav" aria-label={t("주요 메뉴")}>{NAV.map((item) => <PortalLink key={item.to} to={item.to} onNavigate={navigate} className={active(item.to) ? 'is-active' : ''}><item.icon size={16} />{t(item.label)}</PortalLink>)}</nav><div className="vd-header-actions"><select className="vd-language" aria-label={t('언어 선택')} value={language} onChange={(event) => { setPortalLanguage(event.target.value as PortalLanguage); setLocation(`${window.location.pathname}${window.location.search}${window.location.hash}`); }}><option value="ko">한국어</option><option value="ja">日本語</option><option value="en">English</option></select><PortalLink to="/me/favorites" onNavigate={navigate} className="vd-icon-button vd-desktop-only"><Heart size={19} /><span className="vd-sr-only">{t("관심 버튜버")}</span></PortalLink><PortalLink to="/upload" onNavigate={navigate} className="vd-button vd-primary vd-small"><Plus size={16} /> {t("데뷔 등록")}</PortalLink><button type="button" className="vd-icon-button vd-menu-toggle" aria-label={menu ? t("메뉴 닫기") : t("메뉴 열기")} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={21} /> : <Menu size={21} />}</button></div></div>{menu && <nav className="vd-mobile-menu" aria-label={t("전체 메뉴")}>{[...NAV, { to: '/me/favorites', label: t("관심 버튜버"), icon: Heart }].map((item) => <PortalLink key={item.to} to={item.to} onNavigate={navigate}><item.icon size={17} />{t(item.label)}</PortalLink>)}</nav>}</header>{development && <div className="vd-dev-strip"><span>{t("개발 페이지")}</span> {t("새로운 VDébut 화면을 확인하고 있어요.")}</div>}<main id="vd-main" className={isAnalytics ? 'vd-main vd-analytics' : 'vd-main'}><Suspense fallback={<PortalState loading title={t("화면을 불러오고 있어요")} />}>{content}</Suspense></main><footer className="vd-footer"><div className="vd-footer-inner"><PortalLink to="/" onNavigate={navigate} className="vd-footer-brand-wrap"><img className="vd-footer-brand" src="/logo.png" alt="VDébut" /></PortalLink><span className="vd-footer-copyright">© {new Date().getFullYear()} VDébut</span><nav className="vd-footer-nav" aria-label={t("서비스 안내")}><PortalLink to="/contact" onNavigate={navigate}>{t("문의하기")}</PortalLink><span className="vd-footer-divider">|</span><PortalLink to="/about" onNavigate={navigate}>{t("서비스")}</PortalLink><span className="vd-footer-divider">|</span><PortalLink to="/guide" onNavigate={navigate}>{t("이용 가이드")}</PortalLink><span className="vd-footer-divider">|</span><PortalLink to="/terms" onNavigate={navigate}>{t("이용약관")}</PortalLink><span className="vd-footer-divider">|</span><PortalLink to="/privacy" onNavigate={navigate}>{t("개인정보처리방침")}</PortalLink></nav></div></footer><nav className="vd-bottom-nav" aria-label={t("빠른 메뉴")}>{[...NAV.slice(0, 2), { to: '/me/favorites', label: t("관심 목록"), icon: Heart }].map((item) => <PortalLink key={item.to} to={item.to} onNavigate={navigate} className={active(item.to) ? 'is-active' : ''}><item.icon size={19} />{t(item.label)}</PortalLink>)}</nav></div></ErrorBoundary>;
}
