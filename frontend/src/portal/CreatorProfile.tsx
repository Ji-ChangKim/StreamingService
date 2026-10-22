import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarPlus, Clock, Play, ShieldCheck, Film, UserRound, Newspaper, PencilLine, Info } from 'lucide-react';
import { PortalProfile, PORTAL_PLATFORMS, portalChannelKey, portalDateKey, portalWebUrl } from '../../../shared/portal';
import { profileAgencyName, profileDebutMembers, profileDebutPhase, profileLinkKey } from '../../../shared/profilePresentation';
import { profileFirstReplay, profileMediaItems } from '../../../shared/profileMedia';
import { dateTimeFormatter } from '../../../shared/dateTimeFormatter';
import { CopyButton, FavoriteButton, PlatformBadge, PortalAvatar, PortalLink, PortalState, downloadPortalSchedule, portalSchedule } from './PortalUi';
import { ProfileCover } from './ProfileCover';
import { getPortalLanguage, t, usePortalLocale } from './portalLocale';
import { isPublicProfile } from '../../../shared/contentReview';
import { ProfileArchiveOverview } from './ProfileArchiveOverview';
import type { ProfileBroadcast } from '../../../shared/profileDetails';
import { useProfileDetail } from './useProfileDetail';
import './profilePresentation.css';
import './portalLearning.css';
import './creatorDetail.css';

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
function ProfileLinks({ profile, compact = false }: { profile: PortalProfile; compact?: boolean }) {
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
  return <section className={compact ? 'vd-detail-quicklinks' : 'vd-panel vd-profile-channels'} aria-label={t('채널')}>{!compact && <h2>{t('채널')}</h2>}<div className="vd-profile-links">
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
export function ProfileExperience({ profile, profiles = [], onNavigate, preview = false, broadcast }: {
  profile: PortalProfile; profiles?: PortalProfile[]; onNavigate: (path: string) => void; preview?: boolean; broadcast?: ProfileBroadcast;
}) {
  usePortalLocale();
  const now = useProfileClock(profile, preview);
  const phase = profileDebutPhase(profile, now);

  // 상세페이지의 모든 영상 영역이 하나의 재생 선택을 공유한다.
  const [activeMedia, setActiveMedia] = useState('');
  const [activeSection, setActiveSection] = useState('media');
  // 다른 프로필로 이동하거나 탐색 항목을 바꾸면 이전 영상 재생을 끝낸다.
  useEffect(() => setActiveMedia(''), [profile.slug, activeSection]);
  useEffect(() => setActiveSection('media'), [profile.slug]);
  const media = profileMediaItems(profile);
  const selectedSection = activeSection;
  const notices = (profile.notices || []).filter((notice) => portalWebUrl(notice.url));
  const bannerUrl = portalWebUrl(profile.bannerUrl || '');
  const banner = { bannerUrl, mobileBannerUrl: '', description: '' };
  // 설명이 없을 때는 빈 소개 카드와 반복 안내를 만들지 않는다.
  const introduction = profile.description;
  // 저장된 개인 활동 구분값을 소속명처럼 표시하지 않는다.
  const agency = profileAgencyName(profile.agency);
  // 기존 소개에 검토 기록이 없으면 검토일을 만들거나 접근하지 않는다.
  const reviewedAt = isPublicProfile(profile) ? profile.contentReview?.reviewedAt : undefined;
  const IdentityHeading = preview ? 'h2' : 'h1';

  // 팀·크루 정보 계산
  const teamMembers = profileDebutMembers(profile, profiles);
  const hasTeamMembers = teamMembers.length >= 2;
  const agencyTitle = agency || '';
  let subHeadingText = profile.headline ? profile.headline.replace(agency, '').trim() : '';
  if (subHeadingText) {
    subHeadingText = subHeadingText.replace(/(\d+)기(?![가-힣a-zA-Z0-9])/g, '$1기생');
  } else if (profile.debutGroupName) {
    subHeadingText = profile.debutGroupName;
  }
  if (hasTeamMembers) {
    subHeadingText = subHeadingText ? `${subHeadingText} ${t('멤버')}` : t('함께 데뷔해요');
  }

  return <article className={`vd-profile-experience vd-creator-detail${media.length === 0 && !profile.debutGroupId ? ' vd-profile-compact' : ''}`}>
    <section className="vd-profile-hero"><ProfileCover key={`${profile.slug}:${bannerUrl}`} banner={banner} />
      <div className="vd-profile-identity"><PortalAvatar key={`${profile.slug}:${profile.avatarUrl}`} large profile={profile} />
        <div className="vd-profile-identity-copy"><div className="vd-archive-name"><IdentityHeading>{profile.displayName}</IdentityHeading>{phase === 'PAST' && <span className="vd-profile-completed-badge">{t('데뷔 완료')}</span>}{phase === 'UPCOMING' && <span className="vd-profile-completed-badge">{t('데뷔 예정')}</span>}</div>
          {profile.headline && <p className="vd-profile-headline">{profile.headline}</p>}
          <div className="vd-profile-meta">{agency && <span className="vd-profile-agency">{agency}</span>}<PlatformBadge platform={profile.platform} />{profile.ownerVerified && <span><ShieldCheck size={14} />{t('채널 운영자 확인')}</span>}</div>
        </div>
        <ProfileLinks profile={profile} compact />
        {!preview && <div className="vd-profile-tools"><FavoriteButton slug={profile.slug} /><CopyButton value={`${window.location.origin}/creator/${encodeURIComponent(profile.slug)}`} /></div>}
      </div>
    </section>

    {/* 시안의 세 탐색 영역은 자료가 없어도 항상 같은 순서로 유지한다. */}
    <nav className="vd-detail-nav" aria-label={t('프로필 메뉴')}>
      <button type="button" aria-pressed={selectedSection === 'media'} aria-controls="profile-detail-content" onClick={() => setActiveSection('media')}><Film size={16} />{t('추천 영상')}{media.length > 0 && <span>{media.length}</span>}</button>
      <button type="button" aria-pressed={selectedSection === 'about'} aria-controls="profile-detail-content" onClick={() => setActiveSection('about')}><UserRound size={16} />{t('프로필')}</button>
      <button type="button" aria-pressed={selectedSection === 'news'} aria-controls="profile-detail-content" onClick={() => setActiveSection('news')}><Newspaper size={16} />{t('활동 기록 & 타임라인')}</button>
    </nav>
    <div className="vd-detail-layout">
    <div id="profile-detail-content" className="vd-detail-main">
    {selectedSection === 'media' && <ProfileArchiveOverview profile={profile} broadcast={broadcast} active={activeMedia} onPlay={setActiveMedia} />}
    {selectedSection === 'about' && <>
    <section className="vd-profile-editorial">
      <h2>{t('{0} 소개', [profile.displayName])}</h2>
      {introduction && <p>{introduction}</p>}
      {!introduction && <p className="vd-detail-muted">{t('아직 등록된 소개가 없어요.')}</p>}
      {profile.tags.length > 0 && (
        <dl className="vd-profile-facts">
          <div>
            <dt>{t('주요 콘텐츠')}</dt>
            <dd>{profile.tags.join(' · ')}</dd>
          </div>
        </dl>
      )}
    </section>
    {profile.regularSchedule && <section className="vd-profile-editorial"><h2>{t('방송 일정')}</h2><p>{profile.regularSchedule}</p></section>}
    {profile.fanGuide && <section className="vd-profile-editorial"><h2>{t('팬으로 함께하기')}</h2><p>{profile.fanGuide}</p></section>}

    {/* 팀 영상은 영상 메뉴에, 함께 데뷔한 멤버는 프로필 메뉴에 배치한다. */}
    {hasTeamMembers && !preview && (
      <div id="profile-team" className="vd-debut-team-section">
        <header className="vd-team-unified-heading">
          <h2>
            {agencyTitle && <span className="vd-team-agency">{agencyTitle}</span>}
            {subHeadingText && <span className="vd-team-sub">{subHeadingText}</span>}
          </h2>
        </header>
        <div className="vd-team-unified-grid">
          {hasTeamMembers && (
            <div className="vd-profile-content">
              {!preview && (
                <ProfileDebutGroup
                  profile={profile}
                  profiles={profiles}
                  onNavigate={onNavigate}
                  hideHeading
                />
              )}
            </div>
          )}
        </div>
      </div>
    )}
    </>}
    {selectedSection === 'news' && <section id="profile-news" className="vd-profile-editorial"><h2>{t('활동 기록 & 타임라인')}</h2><ProfileSchedule profile={profile} now={now} preview={preview} />{notices.length > 0 ? <ul className="vd-profile-notices">{notices.map((notice, index) => <li key={`${notice.url}:${index}`}><a href={portalWebUrl(notice.url)} target="_blank" rel="noopener noreferrer">{notice.title}<ArrowUpRight size={16} /></a></li>)}</ul> : <p>{t('새로운 소식이 등록되면 이곳에서 볼 수 있어요.')}</p>}</section>}
    </div>
    {/* 등록된 사실과 기존 정보 수정 경로만 제공한다. */}
    <aside className="vd-detail-sidebar" aria-label={t('프로필 정보')}>
      <section className="vd-detail-info vd-panel"><h2><Info size={17} />{t('정보')}<small>Profile</small></h2>
        <dl className="vd-detail-facts">
          <div><dt>{t('데뷔일')}</dt><dd>{profile.dateState === 'NONE' ? '—' : portalSchedule(profile)}{profile.dateState === 'FIXED' && <small>{portalDateKey(profile.startAtUtc, 'Asia/Seoul').slice(0, 4)} · KST</small>}</dd></div>
          {/* 상세 조회로 받은 공개 캐릭터 정보만 시안의 고정 항목에 표시한다. */}
          {[
            ['종족', profile.details?.species],
            ['생일 / 별자리', [profile.details?.birthday, profile.details?.zodiac].filter(Boolean).join(' / ')],
            ['신장 / 혈액형', [profile.details?.height, profile.details?.bloodType].filter(Boolean).join(' / ')],
            ['MBTI', profile.details?.mbti],
          ].map(([label, value]) => <div key={label}><dt>{t(label || '')}</dt><dd aria-label={value ? undefined : t('미등록')}>{value || '—'}</dd></div>)}
        </dl>
        <div className="vd-archive-fandom"><div><span>{t('팬덤명')}</span><strong>{profile.details?.fandomName || '—'}</strong></div><div><span>{t('오시마크')}</span><strong>{profile.details?.oshiMark || '—'}</strong></div></div>
        <div className="vd-archive-hashtag">{profile.details?.fanArtTag ? <CopyButton value={profile.details.fanArtTag} label={`${t('팬아트 태그')} ${profile.details.fanArtTag}`} /> : <>{t('팬아트 태그')}<span>{t('미등록')}</span></>}</div>
      </section>
      {!preview && <section className="vd-detail-contribute vd-panel"><span className="vd-detail-contribute-icon"><PencilLine size={21} /></span><h2>{t('함께 채우는 프로필')}</h2><p>{t('{0}의 새로운 소식이나 수정할 정보를 알려주세요.', [profile.displayName])}</p><PortalLink to={`/contact?pageUrl=${encodeURIComponent(`https://vdebut.live/creator/${profile.slug}`)}`} onNavigate={onNavigate} className="vd-button">{t('정보 수정·콘텐츠 신고')}<ArrowUpRight size={15} /></PortalLink></section>}
      {!preview && reviewedAt && Number.isFinite(Date.parse(reviewedAt)) && <p className="vd-detail-reviewed">{t('소개 검토일')} · <time dateTime={reviewedAt}>{dateTimeFormatter(getPortalLanguage(), { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(reviewedAt))}</time></p>}
    </aside>
    </div>
  </article>;
}

// 공개 상세도 운영자가 검토한 저장 자료만 표시한다.
export function ProfilePage({ profile, profiles, onNavigate }: { profile: PortalProfile; profiles: PortalProfile[]; onNavigate: (path: string) => void }) {
  const detail = useProfileDetail(profile.slug);
  if (detail.missing) return <PortalState pageHeading title={t('버튜버 소개를 찾을 수 없어요')} />;
  return <>{!detail.data && <div className="vd-detail-load-status" role="status">{detail.error ? <>{t('상세 정보를 불러오지 못했어요.')} <button type="button" className="vd-text-button" onClick={detail.retry}>{t('다시 시도')}</button></> : t('상세 정보를 불러오는 중이에요')}</div>}<ProfileExperience profile={detail.data?.profile || profile} profiles={profiles} onNavigate={onNavigate} broadcast={detail.data?.broadcast || { state: 'UNAVAILABLE' }} /></>;
}
