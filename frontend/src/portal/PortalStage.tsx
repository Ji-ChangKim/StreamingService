import { t, usePortalLocale } from './portalLocale';
import { memo, useState } from 'react';
import { PortalProfile, PORTAL_PLATFORMS, portalDateKey, portalDay, portalMonth } from '../../../shared/portal';
import { DebutEvent } from '../types';
import { PlatformMiniSpotlight } from '../components/preview/PlatformMiniSpotlight';
import { DebutSpotlightHighlight } from '../components/preview/DebutSpotlightHighlight';
import { HOME_INTRO } from '../../../shared/portalEditorial';
import { downloadPortalSchedule, PortalLink, PortalState } from './PortalUi';

// 기존 쇼케이스가 사용하는 자료 형식으로 확정 일정만 연결한다.
function spotlightEvent(profile: PortalProfile): DebutEvent {
  return { id: profile.slug, title: `${profile.displayName} 데뷔 방송`, type: 'FIRST_DEBUT', creator: { id: profile.slug, slug: profile.slug, displayName: profile.displayName, avatarUrl: profile.avatarUrl, agency: profile.agency, countryCode: profile.countryCode, languages: profile.languages } as DebutEvent['creator'], startAtUtc: profile.startAtUtc, originalTimezone: profile.timezone, status: 'PUBLISHED', verificationStatus: profile.ownerVerified ? 'VERIFIED' : 'COMMUNITY_SUBMITTED', links: [{ platform: profile.platform, url: profile.channelUrl, isPrimary: true }], description: profile.description };
}

// 기존 무대 이미지·월/주 집계·플랫폼별 쇼케이스를 원본 자산과 함께 복원한다.
export const PortalStage = memo(function PortalStage({ profiles, timezone, loading, error, refresh, onNavigate }: {
  profiles: PortalProfile[]; timezone: string; loading: boolean; error: string; refresh: () => void; onNavigate: (path: string) => void;
}) {
  const language = usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.
  const [spotlightMode, setSpotlightMode] = useState<'QUICK' | 'COVERFLOW'>('QUICK');

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
    <div className="vd-home-intro"><h1>{t("신규 버튜버 데뷔 캘린더")}</h1><p>{t(HOME_INTRO)}</p><div className="vd-home-actions"><a href="#debut-calendar" className="vd-button vd-primary">{t("데뷔 일정 보기")}</a><PortalLink to="/upload" onNavigate={onNavigate} className="vd-button">{t("데뷔 일정 등록")}</PortalLink></div></div>
    {loading ? <PortalState loading title={t("데뷔 일정을 불러오는 중이에요")} /> : error ? <PortalState error title={t("일정을 불러오지 못했어요")} description={t("잠시 후 다시 시도해 주세요. 문제가 계속되면 문의 화면으로 알려주세요.")} action={<button type="button" className="vd-button" onClick={refresh}>{t("다시 시도")}</button>} /> : <>
      {/* 집계 기간과 플랫폼 사이의 띄어쓰기는 번역 문장에서도 유지한다. */}
      <div className="vd-home-counts"><div><span>{t("{0}월 등록 일정", [Number(month.slice(5))])}</span><strong>{monthProfiles.length}<small>{t("건")}</small></strong></div><div><span>{t("이번 주 등록 일정")}</span><strong>{weekProfiles.length}<small>{t("건")}</small></strong></div>{PORTAL_PLATFORMS.map((platform) => { const count = monthProfiles.filter((profile) => profile.platform === platform.id).length; return count ? <div key={platform.id}><span>{t("이번 달 {0}", [platform.label])}</span><strong>{count}<small>{t("건")}</small></strong></div> : null; })}</div>

      {/* 하이라이트 뷰 모드 전환 토글 (신규 시안 vs 기존 커버플로우) */}
      <div className="flex items-center justify-end mb-3 px-2 max-w-7xl mx-auto">
        <div className="inline-flex items-center p-1 bg-white/70 backdrop-blur-md rounded-xl border border-white/80 shadow-2xs text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setSpotlightMode('QUICK')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              spotlightMode === 'QUICK'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⚡ 금일·금주 퀵 뷰 (신규 시안)</span>
          </button>
          <button
            type="button"
            onClick={() => setSpotlightMode('COVERFLOW')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              spotlightMode === 'COVERFLOW'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎭 커버플로우 무대 뷰</span>
          </button>
        </div>
      </div>

      {spotlightMode === 'QUICK' ? (
        <DebutSpotlightHighlight
          allEvents={events}
          selectedTimezone={timezone}
          onDownloadICS={download}
          onNavigate={onNavigate}
          currentLang={language}
        />
      ) : (
        <PlatformMiniSpotlight
          currentLang={language}
          allEvents={events}
          selectedTimezone={timezone}
          onNavigate={onNavigate}
          onDownloadICS={download}
        />
      )}
    </>}
  </section>;
});
