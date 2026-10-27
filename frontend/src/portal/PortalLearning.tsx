import { useEffect } from 'react';
import { PORTAL_GUIDES, currentDebutWeek, profileExcerpt } from '../../../shared/portalEditorial';
import { PORTAL_PLATFORMS, type PortalProfile } from '../../../shared/portal';
import { PortalHeading, PortalLink, portalSchedule, PortalAvatar, PlatformBadge } from './PortalUi';
import { GUIDE_INTRO } from '../../../shared/portalEditorial';
import { t, usePortalLocale } from './portalLocale';
import { ArrowRightIcon } from '@animateicons/react/lucide';
import { Calendar, BookOpen } from 'lucide-react';
import './portalLearning.css';

// 이번 주 일정의 실제 분포와 바로 활용할 수 있는 안내 글을 연결한다.
export function PortalHomeLearning({ profiles, timezone, loading, error, onNavigate }: { profiles: PortalProfile[]; timezone: string; loading: boolean; error: string; onNavigate: (path: string) => void }) {
  usePortalLocale();
  const week = currentDebutWeek(profiles, timezone);
  return <section className="vd-learning vd-section">
    {!loading && !error && <section className="vd-weekly-board">
      <div className="vd-weekly-header">
        <div className="vd-weekly-title-wrap">
          <div className="vd-weekly-badge">
            <Calendar size={13} />
            <span>{t('위클리 스케줄')}</span>
          </div>
          <h2>{t('이번 주 등록된 데뷔 소식')}</h2>
          <p className="vd-weekly-dates">{week.from} — {week.to} · {timezone}</p>
        </div>
        {week.profiles.length > 0 && <div className="vd-weekly-platform-chips">
          {PORTAL_PLATFORMS.filter((platform) => week.profiles.some((profile) => profile.platform === platform.id)).map((platform) => {
            const count = week.profiles.filter((profile) => profile.platform === platform.id).length;
            return <div key={platform.id} className="vd-weekly-chip"><img src={platform.icon} alt="" width={14} height={14} /><span>{platform.label}</span><strong>{count}</strong></div>;
          })}
        </div>}
      </div>
      {week.profiles.length ? <>
        <div className="vd-weekly-grid">
          {week.profiles.slice(0, 6).map((profile) => (
            <article key={profile.slug} className="vd-weekly-item">
              <PortalAvatar profile={profile} />
              <div className="vd-weekly-info">
                <div className="vd-weekly-item-top">
                  <PlatformBadge platform={profile.platform} />
                  <time className="vd-weekly-time">{portalSchedule(profile, timezone)}</time>
                </div>
                <PortalLink to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={onNavigate} className="vd-weekly-name">
                  <h3>{profile.displayName}</h3>
                </PortalLink>
                {profileExcerpt(profile) && <p className="vd-weekly-desc">{profileExcerpt(profile, 80)}</p>}
              </div>
            </article>
          ))}
        </div>
        <p className="vd-weekly-note">{t('※ 방송 일정이 변경될 수 있으니 상세 소개 및 공식 공지를 확인해 주세요.')}</p>
      </> : <p className="vd-weekly-empty">{t('이번 주에 등록된 데뷔 일정이 없어요. 달력에서 다른 주를 살펴보세요.')}</p>}
    </section>}
    <div className="vd-section-heading">
      <div>
        <h2>{t('첫 방송을 만나고 준비하는 방법')}</h2>
      </div>
      <PortalLink to="/guide" onNavigate={onNavigate} className="vd-text-button">
        <span>{t('전체 가이드')}</span>
        <ArrowRightIcon size={14} />
      </PortalLink>
    </div>
    <div className="vd-learning-grid">
      {PORTAL_GUIDES.filter((guide) => ['save', 'introduction', 'announcement'].includes(guide.id)).map((guide) => (
        <article className="vd-guide-card" key={guide.id}>
          <div className="vd-guide-card-icon">
            <BookOpen size={18} />
          </div>
          <h3>{t(guide.title)}</h3>
          <p>{t(guide.paragraphs[0])}</p>
          <PortalLink to={`/guide#${guide.id}`} onNavigate={onNavigate} className="vd-guide-link">
            <span>{t('자세히 읽기')}</span>
            <ArrowRightIcon size={14} />
          </PortalLink>
        </article>
      ))}
    </div>
  </section>;
}

// 서비스 소개와 별개 주소에서 저장·작성·변경·통계 읽기의 실제 절차를 제공한다.
export function PortalGuide({ onNavigate }: { onNavigate: (path: string) => void }) {
  usePortalLocale();
  useEffect(() => { const id = window.location.hash.slice(1); if (PORTAL_GUIDES.some((guide) => guide.id === id)) document.getElementById(id)?.scrollIntoView(); }, []);
  return <div className="vd-learning"><PortalHeading title={t('VDébut 이용 가이드')} description={t(GUIDE_INTRO)} /><nav className="vd-guide-index" aria-label={t('가이드 목차')}>{PORTAL_GUIDES.map((guide) => <a href={`#${guide.id}`} key={guide.id}>{t(guide.title)}</a>)}</nav>{PORTAL_GUIDES.map((guide) => <article id={guide.id} className="vd-panel vd-guide-article" key={guide.id}><h2>{t(guide.title)}</h2>{guide.paragraphs.map((paragraph) => <p key={paragraph}>{t(paragraph)}</p>)}<PortalLink to={guide.to} onNavigate={onNavigate} className="vd-button">{t(guide.action)}</PortalLink></article>)}<p>{t('잘못된 소개나 변경된 일정을 발견하면 관련 페이지와 공식 출처를 알려주세요.')} <PortalLink to="/contact" onNavigate={onNavigate} className="vd-text-button">{t('문의하기')}</PortalLink></p></div>;
}
