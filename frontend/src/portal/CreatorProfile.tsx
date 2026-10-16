import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarPlus, Clock, Play, ShieldCheck } from 'lucide-react';
import { PortalProfile, PORTAL_PLATFORMS, portalChannelKey, portalDateKey, portalWebUrl } from '../../../shared/portal';
import { profileAgencyName, profileDebutMembers, profileDebutPhase, profileLinkKey } from '../../../shared/profilePresentation';
import { profileFirstReplay, profileMediaItems } from '../../../shared/profileMedia';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { dateTimeFormatter } from '../../../shared/dateTimeFormatter';
import { CreatorCard, CopyButton, FavoriteButton, PlatformBadge, PortalAvatar, PortalLink, downloadPortalSchedule, portalSchedule } from './PortalUi';
import { ProfileCover } from './ProfileCover';
import { getPortalLanguage, t, usePortalLocale } from './portalLocale';
import { isPublicProfile } from '../../../shared/contentReview';
import { ProfileMediaGallery } from './ProfileMediaGallery';
import './profilePresentation.css';
import './portalLearning.css';

// 확정 일정만 갱신하며 미리보기에서는 조회·저장 같은 부수 효과를 실행하지 않는다.
function useProfileClock(profile: PortalProfile, preview: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (preview || profile.dateState !== 'FIXED') return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [profile.startAtUtc, profile.dateState, preview]);
  return now;
}

// 실제 남은 분을 기준으로 읽기 쉬운 일정 안내를 만든다.
function profileCountdown(profile: PortalProfile, now: number): string {
  const minutes = Math.max(1, Math.ceil((Date.parse(profile.startAtUtc) - now) / 60000));
  return minutes >= 1440 ? t('첫 만남까지 {0}일 {1}시간', [Math.floor(minutes / 1440), Math.floor(minutes % 1440 / 60)])
    : minutes >= 60 ? t('첫 만남까지 {0}시간 {1}분', [Math.floor(minutes / 60), minutes % 60]) : t('첫 만남까지 {0}분', [minutes]);
}

// 데뷔 일정의 확정 여부와 예정 시각의 경과를 실제 방송 상태와 구분한다.
function ProfileSchedule({ profile, now, preview }: { profile: PortalProfile; now: number; preview: boolean }) {
  const phase = profileDebutPhase(profile, now);
  const replayUrl = profileFirstReplay(profile)?.url || '';
  const replay = Boolean(replayUrl);
  const platformName = PORTAL_PLATFORMS.find((p) => p.id === profile.platform)?.label || profile.platform;
  const isPast = phase === 'PAST';
  const noticeUrl = portalWebUrl(profile.noticeUrl || '');
  const isXNotice = noticeUrl.includes('x.com') || noticeUrl.includes('twitter.com');

  // 채널 방문 버튼은 스트리머 채널 유입과 팔로우를 만드는 핵심 액션이다.
  const isChannelPrimary = phase === 'UPCOMING' || !replay;
  const channelAction = profile.channelUrl && (
    <a
      className={`vd-button${isChannelPrimary ? ' vd-primary' : ''}`}
      href={portalWebUrl(profile.channelUrl)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('{0} 채널 바로가기', [platformName])}
      <ArrowUpRight size={16} />
    </a>
  );

  if (profile.dateState === 'NONE') return channelAction ? <div className="vd-profile-channel-action">{channelAction}</div> : null;

  return (
    <div className="vd-debut-callout">
      <div className="vd-debut-info">
        <div className="vd-debut-status-line">
          <span className="vd-profile-label">{isPast ? t('데뷔일') : t('데뷔 일정')}</span>
          {isPast && <span className="vd-profile-completed-badge">{t('데뷔 완료')}</span>}
        </div>
        <div className="vd-debut-date">
          <h2>{portalSchedule(profile)}</h2>
          {profile.dateState === 'FIXED' && phase !== 'UNCONFIRMED' && (
            <span className="vd-profile-timezone">{portalDateKey(profile.startAtUtc, 'Asia/Seoul').slice(0, 4)} · KST</span>
          )}
        </div>
        {phase === 'UPCOMING' && (
          <span className="vd-profile-countdown">
            <Clock size={13} /> {profileCountdown(profile, now)}
          </span>
        )}
        {noticeUrl && (
          <div className="vd-debut-notice-box">
            <a className="vd-debut-notice-link" href={noticeUrl} target="_blank" rel="noopener noreferrer">
              <span>{isXNotice ? t('X(트위터) 데뷔 공지 확인하기') : t('공식 데뷔 공지 확인하기')}</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        )}
      </div>
      <div className="vd-debut-actions">
        {replay && (
          <a className="vd-button vd-primary" href={portalWebUrl(replayUrl)} target="_blank" rel="noopener noreferrer">
            <Play size={15} />
            {t('첫 방송 다시보기')}
          </a>
        )}
        {channelAction}
        {phase === 'UPCOMING' && (
          <button type="button" className="vd-button" disabled={preview} onClick={() => downloadPortalSchedule(profile)}>
            <CalendarPlus size={16} />
            {t('내 캘린더에 저장')}
          </button>
        )}
      </div>
    </div>
  );
}

// 여러 플랫폼의 채널을 주소 기준으로 중복 제거해 목적별로 보여준다.
function ProfileLinks({ profile }: { profile: PortalProfile }) {
  const seen = new Set<string>();
  const channels = [{ platform: profile.platform, channelUrl: profile.channelUrl, primary: true }, ...(profile.additionalChannels || []).map((channel) => ({ ...channel, primary: false }))].filter((channel) => {
    const key = portalChannelKey(channel.channelUrl, channel.platform) || profileLinkKey(channel.channelUrl);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
  const seenLinks = new Set(channels.map((channel) => profileLinkKey(channel.channelUrl)));
  if (profile.noticeUrl) seenLinks.add(profileLinkKey(profile.noticeUrl));
  const links = [{ url: profile.xUrl, label: 'X / SNS' }, { url: profile.cafeUrl, label: '공식 카페' }, { url: profile.websiteUrl, label: '공식 홈페이지' }].filter((link) => {
    const key = profileLinkKey(link.url || '');
    if (!key || seenLinks.has(key)) return false;
    seenLinks.add(key); return true;
  });
  if (!channels.length && !links.length) return null;
  return <section className="vd-panel vd-profile-channels"><h2>{t('채널')}</h2><div className="vd-profile-links">
    {channels.map((channel) => <a href={portalWebUrl(channel.channelUrl)} key={`${channel.platform}:${channel.channelUrl}`} target="_blank" rel="noopener noreferrer"><span><PlatformBadge platform={channel.platform} />{channels.filter((item) => item.platform === channel.platform).length > 1 && <small>{channel.primary ? t('대표 방송 채널') : t('추가 방송·영상 채널')}</small>}</span><ArrowUpRight size={15} /></a>)}
    {links.map((link) => <a key={link.url} href={portalWebUrl(link.url || '')} target="_blank" rel="noopener noreferrer"><strong>{t(link.label)}</strong><ArrowUpRight size={15} /></a>)}
  </div></section>;
}

// 날짜와 시각을 분리해 활동명 다음으로 읽되 미정 상태는 그대로 유지한다.
function ProfileMemberSchedule({ profile }: { profile: PortalProfile }) {
  const fixed = profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc));
  if (!fixed) return <p className="vd-debut-member-pending">{portalSchedule(profile)}</p>;
  const date = new Date(profile.startAtUtc);
  const language = getPortalLanguage();
  return <time className="vd-debut-member-date" dateTime={profile.startAtUtc}>
    <span>{dateTimeFormatter(language, { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', weekday: 'short' }).format(date)}</span>
    <strong>{dateTimeFormatter(language, { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)}</strong>
  </time>;
}

// 팀·기수는 명시적으로 연결한 멤버만 사진과 활동명 중심으로 안내한다.
function ProfileDebutGroup({ profile, profiles, onNavigate, hideHeading = false }: {
  profile: PortalProfile; profiles: PortalProfile[]; onNavigate: (path: string) => void; hideHeading?: boolean;
}) {
  const members = profileDebutMembers(profile, profiles);
  const agency = profileAgencyName(profile.agency);
  if (members.length < 2) return null;
  const groupTitle = [agency, profile.debutGroupName].filter(Boolean).join(' ');

  return <section className="vd-panel vd-debut-group">
    {!hideHeading && (
      <header className="vd-debut-group-heading">
        <h2>{groupTitle ? `${groupTitle} ${t('멤버')}` : t('함께 데뷔해요')}</h2>
      </header>
    )}
    <ol className="vd-debut-members" aria-label={groupTitle ? `${groupTitle} ${t('멤버')}` : t('함께 데뷔해요')}>
      {members.map((member) => <li key={member.slug} aria-current={member.slug === profile.slug ? 'true' : undefined}>
        {member.slug === profile.slug ? <div className="vd-debut-member"><PortalAvatar profile={member} /><h3>{member.displayName}</h3><ProfileMemberSchedule profile={member} /></div>
          : <PortalLink to={`/creator/${encodeURIComponent(member.slug)}`} onNavigate={onNavigate} className="vd-debut-member"><PortalAvatar profile={member} /><h3>{member.displayName}</h3><ProfileMemberSchedule profile={member} /></PortalLink>}
      </li>)}
    </ol>
  </section>;
}

// 공개 화면과 미리보기에서 동일한 소개·일정·미디어 배치를 사용한다.
export function ProfileExperience({ profile, profiles = [], onNavigate, preview = false }: {
  profile: PortalProfile; profiles?: PortalProfile[]; onNavigate: (path: string) => void; preview?: boolean;
}) {
  usePortalLocale();
  const now = useProfileClock(profile, preview);
  const phase = profileDebutPhase(profile, now);
  const isPast = phase === 'PAST';

  // 상세페이지의 모든 영상 영역이 하나의 재생 선택을 공유한다.
  const [activeMedia, setActiveMedia] = useState('');
  const media = profileMediaItems(profile);
  const personal = media.filter((item) => item.featured || ['INTRO', 'TEASER', 'COVER', 'HIGHLIGHT'].includes(item.kind));
  const moments = media.filter((item) => !item.featured && ['CLIP', 'CATCH', 'SHORT'].includes(item.kind));
  const firstBroadcast = media.filter((item) => !item.featured && item.kind === 'REPLAY');
  const broadcasts = media.filter((item) => !item.featured && item.kind === 'BROADCAST_REPLAY');
  const teamVideos = media.filter((item) => item.kind === 'GROUP_PV');
  const bannerUrl = portalWebUrl(profile.bannerUrl || '');
  const banner = { bannerUrl, mobileBannerUrl: '', description: '' };
  const channelKey = activityChannelKey(profile.platform, profile.channelUrl);
  // 설명이 없을 때는 빈 소개 카드와 반복 안내를 만들지 않는다.
  const introduction = profile.description;
  // 저장된 개인 활동 구분값을 소속명처럼 표시하지 않는다.
  const agency = profileAgencyName(profile.agency);
  // 기존 소개에 검토 기록이 없으면 검토일을 만들거나 접근하지 않는다.
  const reviewedAt = isPublicProfile(profile) ? profile.contentReview?.reviewedAt : undefined;
  const IdentityHeading = preview ? 'h2' : 'h1';
  const platformName = PORTAL_PLATFORMS.find((platform) => platform.id === profile.platform)?.label || profile.platform;
  // 추천 제목과 실제 목록의 플랫폼을 맞추고 같은 팀 멤버는 별도 영역에 남긴다.
  const related = profiles.filter((p) => p.slug !== profile.slug && p.platform === profile.platform && (!profile.debutGroupId || p.debutGroupId !== profile.debutGroupId) && (!profile.tags.length || p.tags.some((tag) => profile.tags.includes(tag)))).slice(0, 4);

  // 팀·크루 정보 계산
  const teamMembers = profileDebutMembers(profile, profiles);
  const hasTeamMembers = teamMembers.length >= 2;
  const hasTeamVideos = teamVideos.length > 0;
  const groupTitle = [agency, profile.debutGroupName].filter(Boolean).join(' ');
  const teamHeadingTitle = groupTitle ? `${groupTitle} ${t('멤버')}` : t('함께 데뷔해요');

  // 섹션 바로가기 네비게이션: 데뷔 상태와 실제 보유 자료에 따라 가변 구성
  const navSections = [
    { id: 'profile-first', label: t('첫 방송 다시보기'), show: isPast && firstBroadcast.length > 0 },
    { id: 'profile-intro', label: t('대표 영상'), show: personal.length > 0 },
    { id: 'profile-moments', label: t('짧은 장면'), show: moments.length > 0 },
    { id: 'profile-first', label: t('첫 방송'), show: !isPast && firstBroadcast.length > 0 },
    { id: 'profile-news', label: t('주요 소식'), show: (profile.notices || []).length > 0 },
    { id: 'profile-team', label: t('함께 데뷔해요'), show: hasTeamVideos || Boolean(profile.debutGroupId) },
    { id: 'profile-channels', label: t('채널'), show: true },
  ].filter((item) => item.show);

  return <article className={`vd-profile-experience${media.length === 0 && !profile.debutGroupId ? ' vd-profile-compact' : ''}`}>
    {!preview && <div className="vd-breadcrumb"><PortalLink to="/creators" onNavigate={onNavigate}>{t('버튜버 둘러보기')}</PortalLink><span>/</span><span>{profile.displayName}</span></div>}
    <section className="vd-profile-hero"><ProfileCover key={`${profile.slug}:${bannerUrl}`} banner={banner} />
      <div className="vd-profile-identity"><PortalAvatar key={`${profile.slug}:${profile.avatarUrl}`} large profile={profile} />
        <div className="vd-profile-identity-copy"><IdentityHeading>{profile.displayName}</IdentityHeading>
          {profile.headline && <p className="vd-profile-headline">{profile.headline}</p>}
          <div className="vd-profile-meta">{agency && <span className="vd-profile-agency">{agency}</span>}<PlatformBadge platform={profile.platform} />{profile.ownerVerified && <span><ShieldCheck size={14} />{t('채널 운영자 확인')}</span>}</div>
        </div>
        {!preview && <div className="vd-profile-tools"><FavoriteButton slug={profile.slug} /><CopyButton value={`${window.location.origin}/creator/${encodeURIComponent(profile.slug)}`} /></div>}
      </div>
      {/* 만날 시간과 주 행동을 개인 콘텐츠보다 먼저 안내한다. */}
      <ProfileSchedule profile={profile} now={now} preview={preview} />
    </section>

    {/* 섹션 항목이 3개 이상일 때만 네비게이션 바를 표시해 단출한 개인세 신입 화면을 깔끔하게 유지한다. */}
    {navSections.length >= 3 && (
      <nav className="vd-profile-section-nav" aria-label={t('소개 바로가기')}>
        {navSections.map((sec) => (
          <a key={sec.id} href={`#${sec.id}`}>{sec.label}</a>
        ))}
      </nav>
    )}

    {/* 데뷔 후(PAST) 상태일 때는 첫 방송 다시보기를 최상단으로 승격해 역사적 첫 만남을 바로 감상하도록 한다. */}
    {isPast && firstBroadcast.length > 0 && (
      <div id="profile-first"><ProfileMediaGallery title={t('역사적인 첫 방송 다시보기')} items={firstBroadcast} active={activeMedia} onPlay={setActiveMedia} featured /></div>
    )}

    <div id="profile-intro"><ProfileMediaGallery title={t('처음 만나는 영상')} items={personal} active={activeMedia} onPlay={setActiveMedia} featured={!isPast || firstBroadcast.length === 0} /></div>
    <div id="profile-moments"><ProfileMediaGallery title={t('짧게 먼저 만나보기')} items={moments} active={activeMedia} onPlay={setActiveMedia} /></div>
    {(introduction || profile.tags.length > 0 || profile.regularSchedule) && <section className="vd-profile-editorial">
      {introduction && <p>{introduction}</p>}
      {profile.tags.length > 0 && (
        <dl className="vd-profile-facts">
          <div>
            <dt>{t('주요 콘텐츠')}</dt>
            <dd>{profile.tags.join(' · ')}</dd>
          </div>
        </dl>
      )}
      {profile.regularSchedule && <p>{profile.regularSchedule}</p>}
    </section>}

    {/* 데뷔 전이거나 아직 지나지 않은 경우의 첫 방송 다시보기 */}
    {!isPast && firstBroadcast.length > 0 && (
      <div id="profile-first"><ProfileMediaGallery title={t('첫 방송 다시보기')} items={firstBroadcast} active={activeMedia} onPlay={setActiveMedia} /></div>
    )}

    <ProfileMediaGallery title={t('방송 다시보기')} items={broadcasts} active={activeMedia} onPlay={setActiveMedia} />
    {(profile.notices || []).length > 0 && <section id="profile-news" className="vd-profile-editorial"><h2>{t('주요 소식')}</h2><ul className="vd-profile-notices">{profile.notices!.filter((notice) => portalWebUrl(notice.url)).map((notice, index) => <li key={`${notice.url}:${index}`}><a href={portalWebUrl(notice.url)} target="_blank" rel="noopener noreferrer">{notice.title}<ArrowUpRight size={16} /></a></li>)}</ul></section>}
    {profile.fanGuide && <section className="vd-profile-editorial"><h2>{t('팬으로 함께하기')}</h2><p>{profile.fanGuide}</p></section>}

    {/* 팀·기수 섹션: PV와 멤버를 {소속} {크루} 멤버 단일 타이틀 아래로 통합 */}
    {(hasTeamVideos || hasTeamMembers) && (
      <div id="profile-team" className="vd-debut-team-section">
        {hasTeamVideos && hasTeamMembers && (
          <header className="vd-team-unified-heading">
            <h2>{teamHeadingTitle}</h2>
          </header>
        )}
        <div className="vd-team-unified-grid">
          {hasTeamVideos && (
            <ProfileMediaGallery
              title={hasTeamMembers ? t('팀 공통 PV') : teamHeadingTitle}
              items={teamVideos}
              active={activeMedia}
              onPlay={setActiveMedia}
            />
          )}
          {hasTeamMembers && (
            <div className="vd-profile-content">
              {!preview && (
                <ProfileDebutGroup
                  profile={profile}
                  profiles={profiles}
                  onNavigate={onNavigate}
                  hideHeading={hasTeamVideos}
                />
              )}
            </div>
          )}
        </div>
      </div>
    )}

    <div id="profile-channels" className="vd-profile-destinations"><ProfileLinks profile={profile} /></div>
    {!preview && <section className="vd-profile-evidence"><h2>{t('소개와 일정 확인하기')}</h2>{reviewedAt && Number.isFinite(Date.parse(reviewedAt)) && <p>{t('소개 검토일')} · <time dateTime={reviewedAt}>{dateTimeFormatter(getPortalLanguage(), { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(reviewedAt))}</time> · KST</p>}{portalWebUrl(profile.noticeUrl || '') && <a className="vd-text-button" href={portalWebUrl(profile.noticeUrl || '')} target="_blank" rel="noopener noreferrer">{t('데뷔 공지 원문 보기')}<ArrowUpRight size={14} /></a>}</section>}
    {!preview && channelKey && <PortalLink to={`/analytics/streamer/${encodeURIComponent(channelKey)}?returnTo=${encodeURIComponent(`/creator/${profile.slug}`)}`} className="vd-profile-activity" onNavigate={onNavigate}>{t('방송 활동 기록')}<ArrowRight size={15} /></PortalLink>}
    {!preview && <PortalLink to={`/contact?pageUrl=${encodeURIComponent(`https://vdebut.live/creator/${profile.slug}`)}`} onNavigate={onNavigate} className="vd-text-button">{t('정보 수정·콘텐츠 신고')}</PortalLink>}
    {!preview && related.length > 0 && <section className="vd-section vd-profile-related"><div className="vd-section-heading"><h2>{t('{0}의 버튜버들도 만나보세요!', [platformName])}</h2></div><div className="vd-cards">{related.map((p) => <CreatorCard profile={p} key={p.slug} onNavigate={onNavigate} />)}</div></section>}
  </article>;
}

// 공개 상세도 운영자가 검토한 저장 자료만 표시한다.
export function ProfilePage({ profile, profiles, onNavigate }: { profile: PortalProfile; profiles: PortalProfile[]; onNavigate: (path: string) => void }) {
  return <ProfileExperience profile={profile} profiles={profiles} onNavigate={onNavigate} />;
}
