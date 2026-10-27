import { useState } from 'react';
import { HeartIcon, ArrowUpRightIcon, CalendarDaysIcon, CalendarPlusIcon } from '@animateicons/react/lucide';
import { Sparkles, Clock } from 'lucide-react';
import { PORTAL_PLATFORMS, type PortalProfile } from '../../../shared/portal';
import { portalSchedule, downloadPortalSchedule } from './PortalUi';
import { t, getPortalLanguage } from './portalLocale';
import './wikiCardVariants.css';

const platforms = PORTAL_PLATFORMS;
const dayMs = 86_400_000;

export type CardVariant = 'A' | 'B' | 'C';

// '개인세'는 표기하지 않고, 공식 소속사나 크루명이 있는 경우에만 표기한다.
function agencyBadge(profile: PortalProfile): string {
  const agency = profile.agency?.trim();
  const groupName = profile.debutGroupName?.trim();
  if (groupName) return [agency !== '개인세' && agency, groupName].filter(Boolean).join(' · ');
  if (!agency || agency === '개인세' || agency.toLowerCase() === 'indie') return '';
  return agency;
}

function dateLabel(profile: PortalProfile): string {
  return profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc))
    ? new Date(profile.startAtUtc).toLocaleString(getPortalLanguage(), {
        timeZone: 'Asia/Seoul',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
    : portalSchedule(profile);
}

function CardAvatar({ profile, className = '' }: { profile: PortalProfile; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      className={`avatar ${className}`}
      src={!failed && profile.avatarUrl ? profile.avatarUrl : '/images/bg_profile.png'}
      alt={profile.displayName}
      onError={() => setFailed(true)}
    />
  );
}

// 타사 스트리밍 플랫폼 공식 브랜딩 로고 (치지직 공식 국문 기본형, SOOP 공식 로고, YouTube 공식 로고)
function PlatformBrandLogo({ platformId, alt = '' }: { platformId: string; alt?: string }) {
  if (platformId === 'CHZZK') {
    return <img className="platform-brand-img is-chzzk" src="/icons/chzzk/chzzklogo_kor(Black).png" alt={alt || '치지직'} />;
  }
  if (platformId === 'SOOP') {
    return <img className="platform-brand-img is-soop" src="/icons/soop/soop_logo_blue.svg" alt={alt || 'SOOP'} />;
  }
  if (platformId === 'YOUTUBE') {
    return <img className="platform-brand-img is-youtube" src="/icons/logo_youtube.png" alt={alt || 'YouTube'} />;
  }
  if (platformId === 'TWITCH') {
    return <img className="platform-brand-img is-twitch" src="/icons/logo_twitch.png" alt={alt || 'Twitch'} />;
  }
  const fallback = platforms.find((p) => p.id === platformId);
  return fallback ? <img className="platform-brand-img" src={fallback.icon} alt={alt || fallback.label} /> : null;
}

function FavoriteButton({ profile, favorites, toggle }: { profile: PortalProfile; favorites: string[]; toggle: (slug: string) => void }) {
  const saved = favorites.includes(profile.slug);
  return (
    <button
      type="button"
      className={`card-fav-btn ${saved ? 'is-saved' : ''}`}
      aria-label={t(saved ? '{0} 관심 해제' : '{0} 관심 저장', [profile.displayName])}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(profile.slug);
      }}
    >
      <HeartIcon size={16} />
    </button>
  );
}


/* ==========================================================================
   시안 1: 【데뷔 일정 & 타이밍 강조형 (Schedule & Timing First)】
   - 강조 포인트: "언제 첫 방송을 켜는가?" (D-Day 숫자, 방송 일시, 캘린더 저장 액션이 1순위)
   ========================================================================== */
export function WikiCreatorCardSchedule({
  profile,
  open,
  favorites,
  toggle,
  now,
}: {
  profile: PortalProfile;
  open: (slug: string) => void;
  favorites: string[];
  toggle: (slug: string) => void;
  now: number;
}) {
  const start = profile.dateState === 'FIXED' ? Date.parse(profile.startAtUtc) : NaN;
  const days = Number.isFinite(start)
    ? Math.round(
        (Date.parse(new Date(start + 9 * 3600000).toISOString().slice(0, 10)) -
          Date.parse(new Date(now + 9 * 3600000).toISOString().slice(0, 10))) /
          dayMs
      )
    : null;

  const isToday = days === 0;
  const isUrgent = days !== null && days >= 0 && days <= 3;
  const dDayText = days === null ? t('일정 확인 중') : days > 0 ? `D-${days}` : isToday ? t('오늘 첫 방송!') : t('데뷔 +{0}일', [-days]);
  const platform = platforms.find((item) => item.id === profile.platform);
  const agency = agencyBadge(profile);

  return (
    <article
      className="creator-card-focus-timing"
      onClick={() => open(profile.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(profile.slug);
        }
      }}
    >
      {/* 1순위 강조: 거대한 D-Day 타이밍 헤더 바 */}
      <div className={`timing-hero-bar ${isToday ? 'is-today' : isUrgent ? 'is-urgent' : ''}`}>
        <div className="timing-dday-badge">
          <Clock size={13} />
          <strong>{dDayText}</strong>
        </div>
        <FavoriteButton profile={profile} favorites={favorites} toggle={toggle} />
      </div>

      {/* 방송 일시를 가장 크고 선명하게 노출 */}
      <div className="timing-schedule-box">
        <span className="timing-caption">{t('첫 데뷔 방송 예정 일시')}</span>
        <div className="timing-datetime">
          <CalendarDaysIcon size={16} />
          <span>{dateLabel(profile)}</span>
        </div>
      </div>

      {/* 보조 정보: 크리에이터 프로필 정보 */}
      <div className="timing-creator-row">
        <div className="timing-avatar-wrap">
          <CardAvatar profile={profile} />
          {platform && (
            <span className="timing-platform-icon">
              <img src={platform.icon} alt={platform.label} />
            </span>
          )}
        </div>
        <div className="timing-meta-info">
          <h3 className="timing-name">{profile.displayName}</h3>
          <div className="timing-tags">
            {platform && <span className="platform-pill">{platform.label}</span>}
            {agency && <span className="agency-pill">{agency}</span>}
          </div>
        </div>
      </div>

      {/* 액션 버튼: 캘린더 등록 + 상세 보기 */}
      <div className="timing-action-row">
        {profile.dateState === 'FIXED' && (
          <button
            type="button"
            className="timing-cal-btn"
            onClick={(e) => {
              e.stopPropagation();
              downloadPortalSchedule(profile);
            }}
            title={t('캘린더 일정 저장 (.ics)')}
          >
            <CalendarPlusIcon size={14} />
            <span>{t('일정 저장')}</span>
          </button>
        )}
        <span className="timing-detail-btn">
          <span>{t('상세 보기')}</span>
          <ArrowUpRightIcon size={14} />
        </span>
      </div>
    </article>
  );
}

/* ==========================================================================
   시안 2: 【버튜버 프로필 비주얼 & 소개 강조형 (Profile Visual & Bio Focus)】
   - 강조 포인트:
     1. 버튜버 프로필 아바타(80×80)와 이름을 큼직하게 강조
     2. 불필요한 '종합게임 · 엔터테인먼트' 태그 제거
     3. 카드 전체를 원클릭으로 선택(상세 페이지 진입) 가능하도록 지원
   ========================================================================== */
export function WikiCreatorCardContent({
  profile,
  open,
  favorites,
  toggle,
}: {
  profile: PortalProfile;
  open: (slug: string) => void;
  favorites: string[];
  toggle: (slug: string) => void;
  now: number;
}) {
  const platform = platforms.find((item) => item.id === profile.platform);
  const agency = agencyBadge(profile);
  const chips = [profile.details?.species, profile.details?.mbti, ...(profile.tags || [])].filter(Boolean).slice(0, 3);
  const rawBio =
    profile.details?.contentSummary ||
    profile.headline ||
    profile.description ||
    t('신규 버튜버의 첫 만남을 응원해 주세요.');
  const contentDescription = rawBio
    .replace(/\|\s*개인세\s*\|?/g, '')
    .replace(/개인세\s*[·|,\s]*/g, '')
    .trim();

  return (
    <article
      className="creator-card-focus-profile"
      onClick={() => open(profile.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(profile.slug);
        }
      }}
    >
      {/* 1순위: 카드 가로 100%를 꽉 채우는 대형 프로필 비주얼 커버 (Full-Bleed 200px) */}
      <div className="profile-hero-cover">
        <CardAvatar profile={profile} className="profile-cover-img" />
        <div className="profile-cover-gradient" />

        {/* 상단 오버레이: 소속사/데뷔 뱃지 + 관심 하트 버튼 */}
        <div className="profile-cover-top">
          {agency ? (
            <span className="profile-agency-badge">{agency}</span>
          ) : (
            <span className="profile-debut-badge">
              {profile.debutDate ? t('{0}월 데뷔', [Number(profile.debutDate.slice(5, 7))]) : t('신규 버튜버')}
            </span>
          )}
          <FavoriteButton profile={profile} favorites={favorites} toggle={toggle} />
        </div>

        {/* 플랫폼 공식 브랜드 로고 배지 (우측 하단) */}
        {profile.platform && (
          <span className="profile-platform-badge" title={platform?.label || profile.platform}>
            <PlatformBrandLogo platformId={profile.platform} alt={platform?.label} />
          </span>
        )}
      </div>

      {/* 하단 바디: 빈 공간 없이 밀도 있는 정보 배치 */}
      <div className="profile-card-body">
        <h3 className="profile-hero-name" title={profile.displayName}>
          {profile.displayName}
        </h3>

        {/* 핵심 소개문 */}
        <p className="profile-bio-text">{contentDescription}</p>

        {/* 캐릭터 키워드 칩 (있을 때만) */}
        {chips.length > 0 && (
          <div className="profile-chip-list">
            {chips.map((chip) => (
              <span key={chip} className="profile-chip">
                #{chip}
              </span>
            ))}
          </div>
        )}

        {/* 하단: 데뷔 일시 & 상세 보기 */}
        <div className="profile-footer-row">
          <span className="profile-date-tag">{dateLabel(profile)}</span>
          <span className="profile-view-link">
            <span>{t('상세 보기')}</span>
            <ArrowUpRightIcon size={14} />
          </span>
        </div>
      </div>
    </article>
  );
}

/* ==========================================================================
   시안 3: 【세계관 페르소나 & 일러레 크레딧형 (Visual Lore & Creator Credits First)】
   - 강조 포인트: "누가 그렸고 어떤 세계관인가?" (세계관 인용 카피, 일러레/리거 명기, 오시마크가 1순위)
   ========================================================================== */
export function WikiCreatorCardLore({
  profile,
  open,
  favorites,
  toggle,
}: {
  profile: PortalProfile;
  open: (slug: string) => void;
  favorites: string[];
  toggle: (slug: string) => void;
  now: number;
}) {
  const platform = platforms.find((item) => item.id === profile.platform);
  const agency = agencyBadge(profile);
  const details = profile.details;
  const illustrator = details?.illustrator || t('공개 예정');
  const rigger = details?.rigger || t('공개 예정');
  const oshiMark = details?.oshiMark;
  const fandomName = details?.fandomName;
  const quote = profile.headline || details?.contentSummary || details?.fanMessage || t('새로운 이야기의 첫 페이지를 함께 써내려가요.');

  return (
    <article
      className="creator-card-focus-lore"
      onClick={() => open(profile.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(profile.slug);
        }
      }}
    >
      {/* 1순위 강조: 캐릭터 세계관 감성 인용구 (Quote) */}
      <div className="lore-quote-banner">
        <span className="lore-quote-mark">❝</span>
        <p className="lore-quote-text">{quote}</p>
        <div className="lore-fav-wrap">
          <FavoriteButton profile={profile} favorites={favorites} toggle={toggle} />
        </div>
      </div>

      {/* 아바타 & 캐릭터 아이덴티티 */}
      <div className="lore-identity-block">
        <div className="lore-avatar-container">
          <CardAvatar profile={profile} className="lore-avatar" />
          {platform && (
            <span className="lore-platform-mark">
              <img src={platform.icon} alt="" />
            </span>
          )}
        </div>
        <div className="lore-title-info">
          <h3 className="lore-name">{profile.displayName}</h3>
          <div className="lore-pills">
            {agency && <span className="lore-agency-tag">{agency}</span>}
            {details?.species && <span className="lore-species-tag">{details.species}</span>}
            {oshiMark && <span className="lore-oshi-tag">{oshiMark}</span>}
          </div>
        </div>
      </div>

      {/* 1순위 강조: 공식 크레딧 박스 (버튜버 마마/파파 및 팬덤명) */}
      <div className="lore-credits-box">
        <div className="lore-credit-item">
          <span className="credit-label">🎨 {t('일러스트')}</span>
          <strong className="credit-value">{illustrator}</strong>
        </div>
        <div className="lore-credit-item">
          <span className="credit-label">⚙️ {t('리깅')}</span>
          <strong className="credit-value">{rigger}</strong>
        </div>
        {fandomName && (
          <div className="lore-credit-item fandom">
            <span className="credit-label">👑 {t('팬덤명')}</span>
            <strong className="credit-value">{fandomName}</strong>
          </div>
        )}
      </div>

      {/* 하단 데뷔 정보 & 상세 보기 링크 */}
      <div className="lore-footer-bar">
        <span className="lore-date-note">{dateLabel(profile)}</span>
        <span className="lore-detail-link">
          <span>{t('상세 보기')}</span>
          <ArrowUpRightIcon size={13} />
        </span>
      </div>
    </article>
  );
}

/* ==========================================================================
   상단 시안 선택기 탭 (강조 포인트별 3종 전환)
   ========================================================================== */
export function WikiVariantSelector({
  variant,
  onChange,
}: {
  variant: CardVariant;
  onChange: (v: CardVariant) => void;
}) {
  return (
    <div className="wiki-variant-selector-wrap">
      <div className="wiki-variant-label">
        <Sparkles size={15} />
        <span>{t('강조 포인트별 카드 시안 비교')}</span>
      </div>
      <div className="wiki-variant-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={variant === 'A'}
          className={`wiki-variant-tab ${variant === 'A' ? 'is-active' : ''}`}
          onClick={() => onChange('A')}
        >
          {t('시안 1: 일정·타이밍 강조')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={variant === 'B'}
          className={`wiki-variant-tab ${variant === 'B' ? 'is-active' : ''}`}
          onClick={() => onChange('B')}
        >
          {t('시안 2: 프로필·소개 강조')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={variant === 'C'}
          className={`wiki-variant-tab ${variant === 'C' ? 'is-active' : ''}`}
          onClick={() => onChange('C')}
        >
          {t('시안 3: 세계관·크레딧 강조')}
        </button>
      </div>
    </div>
  );
}
