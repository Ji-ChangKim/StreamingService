import { useEffect } from 'react';
import { PORTAL_GUIDES, currentDebutWeek, profileExcerpt } from '../../../shared/portalEditorial';
import { PORTAL_PLATFORMS, type PortalProfile } from '../../../shared/portal';
import { PortalHeading, PortalLink, portalSchedule } from './PortalUi';
import { GUIDE_INTRO } from '../../../shared/portalEditorial';
import { t, usePortalLocale } from './portalLocale';
import './portalLearning.css';

// 이번 주 일정의 실제 분포와 바로 활용할 수 있는 안내 글을 연결한다.
export function PortalHomeLearning({ profiles, timezone, loading, error, onNavigate }: { profiles: PortalProfile[]; timezone: string; loading: boolean; error: string; onNavigate: (path: string) => void }) {
  usePortalLocale();
  const week = currentDebutWeek(profiles, timezone);
  return <section className="vd-learning vd-section">
    {!loading && !error && <section className="vd-panel vd-week-note"><h2>{t('이번 주 등록된 데뷔 소식')}</h2><p>{week.from} — {week.to} · {timezone}</p>{week.profiles.length ? <><p>{t('이번 주 등록 일정 {0}건을 날짜순으로 살펴보세요.', [week.profiles.length])}</p><ul>{PORTAL_PLATFORMS.filter((platform) => week.profiles.some((profile) => profile.platform === platform.id)).map((platform) => <li key={platform.id}>{platform.label} · {t('{0}건', [week.profiles.filter((profile) => profile.platform === platform.id).length])}</li>)}</ul><ol className="vd-week-profiles">{week.profiles.slice(0, 6).map((profile) => <li key={profile.slug}><PortalLink to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={onNavigate}>{profile.displayName}</PortalLink><span>{portalSchedule(profile, timezone)}</span>{profileExcerpt(profile) && <p>{profileExcerpt(profile)}</p>}</li>)}</ol><p>{t('공지가 바뀔 수 있으니 소개의 데뷔 공지도 함께 확인해 주세요.')}</p></> : <p>{t('이번 주에 등록된 데뷔 일정이 없어요. 달력에서 다른 주를 살펴보세요.')}</p>}</section>}
    <div className="vd-section-heading"><h2>{t('첫 방송을 만나고 준비하는 방법')}</h2><PortalLink to="/guide" onNavigate={onNavigate} className="vd-text-button">{t('이용 가이드')}</PortalLink></div>
    <div className="vd-learning-grid">{PORTAL_GUIDES.filter((guide) => ['save', 'introduction', 'announcement'].includes(guide.id)).map((guide) => <article className="vd-panel" key={guide.id}><h3>{t(guide.title)}</h3><p>{t(guide.paragraphs[0])}</p><PortalLink to={`/guide#${guide.id}`} onNavigate={onNavigate} className="vd-text-button">{t('자세히 읽기')}</PortalLink></article>)}</div>
  </section>;
}

// 서비스 소개와 별개 주소에서 저장·작성·변경·통계 읽기의 실제 절차를 제공한다.
export function PortalGuide({ onNavigate }: { onNavigate: (path: string) => void }) {
  usePortalLocale();
  useEffect(() => { const id = window.location.hash.slice(1); if (PORTAL_GUIDES.some((guide) => guide.id === id)) document.getElementById(id)?.scrollIntoView(); }, []);
  return <div className="vd-learning"><PortalHeading title={t('VDébut 이용 가이드')} description={t(GUIDE_INTRO)} /><nav className="vd-guide-index" aria-label={t('가이드 목차')}>{PORTAL_GUIDES.map((guide) => <a href={`#${guide.id}`} key={guide.id}>{t(guide.title)}</a>)}</nav>{PORTAL_GUIDES.map((guide) => <article id={guide.id} className="vd-panel vd-guide-article" key={guide.id}><h2>{t(guide.title)}</h2>{guide.paragraphs.map((paragraph) => <p key={paragraph}>{t(paragraph)}</p>)}<PortalLink to={guide.to} onNavigate={onNavigate} className="vd-button">{t(guide.action)}</PortalLink></article>)}<p>{t('잘못된 소개나 변경된 일정을 발견하면 관련 페이지와 공식 출처를 알려주세요.')} <PortalLink to="/contact" onNavigate={onNavigate} className="vd-text-button">{t('문의하기')}</PortalLink></p></div>;
}
