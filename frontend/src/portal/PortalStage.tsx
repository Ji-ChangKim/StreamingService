import { t, usePortalLocale } from './portalLocale';
import { memo } from 'react';
import { PortalProfile, PORTAL_PLATFORMS, portalDateKey, portalDay, portalMonth } from '../../../shared/portal';
import { DebutEvent } from '../types';
import { PlatformMiniSpotlight } from '../components/preview/PlatformMiniSpotlight';
import { HOME_INTRO } from '../../../shared/portalEditorial';
import { downloadPortalSchedule, PortalLink, PortalState } from './PortalUi';

import { CalendarDaysIcon, ArrowRightIcon } from '@animateicons/react/lucide';
import { Sparkles } from 'lucide-react';

// 기존 쇼케이스가 사용하는 자료 형식으로 확정 일정만 연결한다.
function spotlightEvent(profile: PortalProfile): DebutEvent {
  return { id: profile.slug, title: `${profile.displayName} 데뷔 방송`, type: 'FIRST_DEBUT', creator: { id: profile.slug, slug: profile.slug, displayName: profile.displayName, avatarUrl: profile.avatarUrl, agency: profile.agency, countryCode: profile.countryCode, languages: profile.languages } as DebutEvent['creator'], startAtUtc: profile.startAtUtc, originalTimezone: profile.timezone, status: 'PUBLISHED', verificationStatus: profile.ownerVerified ? 'VERIFIED' : 'COMMUNITY_SUBMITTED', links: [{ platform: profile.platform, url: profile.channelUrl, isPrimary: true }], description: profile.description };
}

// 기존 무대 이미지·월/주 집계·플랫폼별 쇼케이스를 원본 자산과 함께 복원한다.
export const PortalStage = memo(function PortalStage({ profiles, timezone, loading, error, refresh, onNavigate }: {
  profiles: PortalProfile[]; timezone: string; loading: boolean; error: string; refresh: () => void; onNavigate: (path: string) => void;
}) {
  const language = usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const today = portalDateKey(new Date(), timezone);
  const month = today.slice(0, 7);
  const midnight = new Date(`${today}T00:00:00Z`);
  const weekStart = new Date(midnight.getTime() - midnight.getUTCDay() * 86400000).toISOString().slice(0, 10);
  const weekEnd = new Date(Date.parse(`${weekStart}T00:00:00Z`) + 6 * 86400000).toISOString().slice(0, 10);
  const monthProfiles = profiles.filter((profile) => portalMonth(profile, timezone) === month);
  const weekProfiles = profiles.filter((profile) => { const day = portalDay(profile, timezone); return day && day >= weekStart && day <= weekEnd; });
  const events = profiles.filter((profile) => profile.dateState === 'FIXED').map(spotlightEvent);
  const download = (event: DebutEvent) => { const profile = profiles.find((value) => value.slug === event.id); if (profile) downloadPortalSchedule(profile); };
  return <section className="vd-home-stage" aria-label={t("신규 버튜버 데뷔 캘린더")}>
    <div className="vd-home-intro">
      <div className="vd-home-badge">
        <Sparkles size={13} className="vd-badge-sparkle" />
        <span>{t("버튜버 첫 방송과 일정을 가장 빠르게 만나는 곳")}</span>
      </div>
      <h1>{t("신규 버튜버 데뷔 캘린더")}</h1>
      <p>{t(HOME_INTRO)}</p>
      <div className="vd-home-actions">
        <a href="#debut-calendar" className="vd-button vd-primary vd-action-main">
          <CalendarDaysIcon size={17} />
          <span>{t("데뷔 일정 보기")}</span>
        </a>
        <PortalLink to="/upload" onNavigate={onNavigate} className="vd-button vd-action-sub">
          <span>{t("데뷔 일정 등록")}</span>
          <ArrowRightIcon size={15} />
        </PortalLink>
      </div>
    </div>
    {loading ? <PortalState loading title={t("데뷔 일정을 불러오는 중이에요")} /> : error ? <PortalState error title={t("일정을 불러오지 못했어요")} description={t("잠시 후 다시 시도해 주세요. 문제가 계속되면 문의 화면으로 알려주세요.")} action={<button type="button" className="vd-button" onClick={refresh}>{t("다시 시도")}</button>} /> : <>
      <div className="vd-home-metrics-wrap">
        <div className="vd-home-metrics">
          <div className="vd-metric-card is-highlight">
            <span className="vd-metric-label">{t("이번 주 등록 데뷔")}</span>
            <div className="vd-metric-value">
              <strong>{weekProfiles.length}</strong>
              <small>{t("명")}</small>
            </div>
          </div>
          <div className="vd-metric-card">
            <span className="vd-metric-label">{t("{0}월 전체 데뷔", [Number(month.slice(5))])}</span>
            <div className="vd-metric-value">
              <strong>{monthProfiles.length}</strong>
              <small>{t("명")}</small>
            </div>
          </div>
        </div>
        <div className="vd-platform-metrics">
          {PORTAL_PLATFORMS.map((platform) => {
            const count = monthProfiles.filter((profile) => profile.platform === platform.id).length;
            if (!count) return null;
            return (
              <div key={platform.id} className="vd-platform-pill">
                <img src={platform.icon} alt="" width={15} height={15} className="vd-platform-pill-icon" />
                <span className="vd-platform-pill-name">{platform.label}</span>
                <span className="vd-platform-pill-count">{t("{0}명", [count])}</span>
              </div>
            );
          })}
        </div>
      </div>

      <PlatformMiniSpotlight
        currentLang={language}
        allEvents={events}
        selectedTimezone={timezone}
        onNavigate={onNavigate}
        onDownloadICS={download}
      />
    </>}
  </section>;
});
