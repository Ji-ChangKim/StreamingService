import { t, usePortalLocale } from './portalLocale';
import { memo } from 'react';
import { PortalProfile, PORTAL_PLATFORMS, portalDateKey, portalDay, portalMonth } from '../../../shared/portal';
import { DebutEvent } from '../types';
import { PlatformMiniSpotlight } from '../components/preview/PlatformMiniSpotlight';
import { downloadPortalSchedule, PortalState } from './PortalUi';

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
    <div className="vd-home-intro"><h1>{t("신규 버튜버 데뷔 캘린더")}</h1><p>{t("치지직 · SOOP · 유튜브 · 트위치의 데뷔 날짜와 소개를 한눈에 확인하세요.")}</p></div>
    {loading ? <PortalState loading title={t("데뷔 일정을 불러오는 중이에요")} /> : error ? <PortalState title={t("일정을 불러오지 못했어요")} action={<button type="button" className="vd-button" onClick={refresh}>{t("다시 시도")}</button>} /> : <>
      <div className="vd-home-counts"><div><span>{Number(month.slice(5))}{t("월 데뷔")}</span><strong>{monthProfiles.length}<small>{t("명")}</small></strong></div><div><span>{t("이번 주 데뷔")}</span><strong>{weekProfiles.length}<small>{t("명")}</small></strong></div>{PORTAL_PLATFORMS.map((platform) => { const count = monthProfiles.filter((profile) => profile.platform === platform.id).length; return count ? <div key={platform.id}><span>{t("금월")}{platform.label} {t("데뷔")}</span><strong>{count}<small>{t("명")}</small></strong></div> : null; })}</div>
      <PlatformMiniSpotlight currentLang={language} allEvents={events} selectedTimezone={timezone} onNavigate={onNavigate} onDownloadICS={download} />
    </>}
  </section>;
});
