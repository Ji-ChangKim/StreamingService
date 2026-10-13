import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarPlus, Clock, Play, ShieldCheck } from 'lucide-react';
import { PortalChannelDetails, PortalProfile, PORTAL_PLATFORMS, portalChannelKey, portalDateKey, portalWebUrl } from '../../../shared/portal';
import { PROFILE_VIDEO_LABELS, profileDebutMembers, profileDebutPhase, profileLinkKey, profileVideoId } from '../../../shared/profilePresentation';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { dateTimeFormatter } from '../../../shared/dateTimeFormatter';
import { CreatorCard, CopyButton, FavoriteButton, PlatformBadge, PortalAvatar, PortalLink, downloadPortalSchedule, portalSchedule } from './PortalUi';
import { ProfileCover } from './ProfileCover';
import { useChannelDetails } from './useChannelDetails';
import { getPortalLanguage, t, usePortalLocale } from './portalLocale';
import './profilePresentation.css';

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
  const replayUrl = profile.debutVideoUrl || (profile.videoKind === 'REPLAY' ? profile.videoUrl : '') || '';
  const replay = phase === 'PAST' && profileVideoId(replayUrl);
  // 일정이 없는 소개에서는 빈 일정 안내 대신 채널 방문 동작만 남긴다.
  const channelAction = profile.channelUrl && <a className="vd-button vd-primary" href={portalWebUrl(profile.channelUrl)} target="_blank" rel="noopener noreferrer">{t('채널 바로가기')}<ArrowUpRight size={16} /></a>;
  if (profile.dateState === 'NONE') return channelAction ? <div className="vd-profile-channel-action">{channelAction}</div> : null;
  return <div className="vd-debut-callout">
    <div><span className="vd-profile-label">{t('데뷔 일정')}</span>
      <div className="vd-debut-date"><h2>{portalSchedule(profile)}</h2>
        {profile.dateState === 'FIXED' && phase !== 'UNCONFIRMED' && <span className="vd-profile-timezone">{portalDateKey(profile.startAtUtc, 'Asia/Seoul').slice(0, 4)} · KST</span>}
      </div>
      {phase === 'UPCOMING' && <span className="vd-profile-countdown"><Clock size={13} /> {profileCountdown(profile, now)}</span>}
      {profile.noticeUrl && portalWebUrl(profile.noticeUrl) && <a className="vd-text-button" href={portalWebUrl(profile.noticeUrl)} target="_blank" rel="noopener noreferrer">{t('데뷔 공지 보기')}<ArrowUpRight size={13} /></a>}
    </div>
    <div className="vd-debut-actions">
      {channelAction}
      {phase === 'UPCOMING' && <button type="button" className="vd-button" disabled={preview} onClick={() => downloadPortalSchedule(profile)}><CalendarPlus size={16} />{t('내 캘린더에 저장')}</button>}
      {replay && <a className="vd-button" href={portalWebUrl(replayUrl)} target="_blank" rel="noopener noreferrer"><Play size={15} />{t('첫 방송 다시보기')}</a>}
    </div>
  </div>;
}

// 영상 플레이어는 방문자가 재생을 선택한 뒤에만 불러온다.
function ProfileVideo({ profile, debut = false }: { profile: PortalProfile; debut?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const videoId = profileVideoId((debut ? profile.debutVideoUrl : profile.videoUrl) || '');
  const kind = PROFILE_VIDEO_LABELS[profile.videoKind || 'INTRO'] || PROFILE_VIDEO_LABELS.INTRO;
  // 팀 PV는 유형 배지 대신 영상 제목 뒤에 PV를 한 번만 표시한다.
  const title = profile.videoTitle || (profile.videoKind === 'GROUP_PV' ? profile.debutGroupName || 'PV' : t(kind));
  const heading = debut ? t('데뷔 방송') : profile.videoKind === 'GROUP_PV' && !/\bPV\s*$/i.test(title) ? `${title} PV` : title;
  if (!videoId) return null;
  return <section className="vd-panel">
    <div className="vd-video-heading"><h2>{heading}</h2></div>
    <div className="vd-profile-video">{playing ? <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} title={heading} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      : <button type="button" onClick={() => setPlaying(true)} aria-label={t('{0} 재생', [heading])}>
        {!imageFailed && <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
        <span className="vd-video-play"><Play size={20} fill="currentColor" />{t('영상 재생')}</span>
      </button>}</div>
  </section>;
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
function ProfileDebutGroup({ profile, profiles, onNavigate }: { profile: PortalProfile; profiles: PortalProfile[]; onNavigate: (path: string) => void }) {
  const members = profileDebutMembers(profile, profiles);
  if (members.length < 2) return null;
  return <section className="vd-panel vd-debut-group"><header className="vd-debut-group-heading"><div>
    {profile.agency && <p className="vd-debut-group-agency">{profile.agency}</p>}
    <h2>{profile.debutGroupName || t('함께 데뷔해요')}{profile.debutGroupName && <span>{t('멤버')}</span>}</h2>
  </div><span className="vd-debut-group-timezone">KST</span></header><ol className="vd-debut-members" aria-label={t('함께 데뷔해요')}>
    {members.map((member) => <li key={member.slug} aria-current={member.slug === profile.slug ? 'true' : undefined}>
      {member.slug === profile.slug ? <div className="vd-debut-member"><PortalAvatar profile={member} /><h3>{member.displayName}</h3><ProfileMemberSchedule profile={member} /></div>
        : <PortalLink to={`/creator/${encodeURIComponent(member.slug)}`} onNavigate={onNavigate} className="vd-debut-member"><PortalAvatar profile={member} /><h3>{member.displayName}</h3><ProfileMemberSchedule profile={member} /></PortalLink>}
    </li>)}
  </ol></section>;
}

// 공개 화면과 미리보기에서 동일한 소개·일정·미디어 배치를 사용한다.
export function ProfileExperience({ profile, profiles = [], onNavigate, details, preview = false }: {
  profile: PortalProfile; profiles?: PortalProfile[]; onNavigate: (path: string) => void; details?: PortalChannelDetails; preview?: boolean;
}) {
  usePortalLocale();
  const now = useProfileClock(profile, preview);
  const bannerUrl = portalWebUrl(profile.bannerUrl || '') || details?.bannerUrl || '';
  const banner = { bannerUrl, mobileBannerUrl: profile.bannerUrl ? '' : details?.mobileBannerUrl || '', description: '' };
  const channelKey = activityChannelKey(profile.platform, profile.channelUrl);
  // 설명이 없을 때는 빈 소개 카드와 반복 안내를 만들지 않는다.
  const introduction = profile.description || details?.description;
  const IdentityHeading = preview ? 'h2' : 'h1';
  const platformName = PORTAL_PLATFORMS.find((platform) => platform.id === profile.platform)?.label || profile.platform;
  // 추천 제목과 실제 목록의 플랫폼을 맞추고 같은 팀 멤버는 별도 영역에 남긴다.
  const related = profiles.filter((p) => p.slug !== profile.slug && p.platform === profile.platform && (!profile.debutGroupId || p.debutGroupId !== profile.debutGroupId) && (!profile.tags.length || p.tags.some((tag) => profile.tags.includes(tag)))).slice(0, 4);
  return <article className="vd-profile-experience">
    {!preview && <div className="vd-breadcrumb"><PortalLink to="/creators" onNavigate={onNavigate}>{t('버튜버 둘러보기')}</PortalLink><span>/</span><span>{profile.displayName}</span></div>}
    <section className="vd-profile-hero"><ProfileCover key={`${profile.slug}:${bannerUrl}`} banner={banner} />
      <div className="vd-profile-identity"><PortalAvatar key={`${profile.slug}:${profile.avatarUrl}`} large profile={profile} />
        <div className="vd-profile-identity-copy"><IdentityHeading>{profile.displayName}</IdentityHeading>
          {profile.headline && <p className="vd-profile-headline">{profile.headline}</p>}
          <div className="vd-profile-meta">{profile.agency && <span className="vd-profile-agency">{profile.agency}</span>}<PlatformBadge platform={profile.platform} />{profile.ownerVerified && <span><ShieldCheck size={14} />{t('채널 운영자 확인')}</span>}</div>
          {profile.tags.length > 0 && <div className="vd-tags">{profile.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        </div>
        {!preview && <div className="vd-profile-tools"><FavoriteButton slug={profile.slug} /><CopyButton value={`${window.location.origin}/creator/${encodeURIComponent(profile.slug)}`} /></div>}
      </div>
      {/* 캘린더에서 들어온 방문자는 소개를 먼저 읽고 일정과 채널을 이어서 확인한다. */}
      {(introduction || profile.languages.length > 0) && <section className="vd-profile-about" aria-label={t('소개')}>{introduction && <p className="vd-intro-text">{introduction}</p>}{profile.languages.length > 0 && <p className="vd-profile-languages"><span>{t('방송 언어')}</span>{profile.languages.join(' · ')}</p>}</section>}
      <ProfileSchedule profile={profile} now={now} preview={preview} />
    </section>
    {/* 소개와 일정에 이어 PV, 관련 채널, 같은 팀 멤버 순서로 살펴본다. */}
    <div className="vd-profile-content vd-profile-media">
      <ProfileVideo key={profile.videoUrl} profile={profile} />
      {/* 같은 영상이 두 칸에 등록되어도 플레이어는 한 번만 보여준다. */}
      {profileVideoId(profile.debutVideoUrl || '') !== profileVideoId(profile.videoUrl || '') && <ProfileVideo key={profile.debutVideoUrl} profile={profile} debut />}
    </div>
    <div className="vd-profile-destinations"><ProfileLinks profile={profile} /></div>
    <div className="vd-profile-content vd-profile-media">
      {!preview && <ProfileDebutGroup profile={profile} profiles={profiles} onNavigate={onNavigate} />}
    </div>
    {!preview && channelKey && <PortalLink to={`/analytics/streamer/${encodeURIComponent(channelKey)}?returnTo=${encodeURIComponent(`/creator/${profile.slug}`)}`} className="vd-profile-activity" onNavigate={onNavigate}>{t('방송 활동 기록')}<ArrowRight size={15} /></PortalLink>}
    {!preview && related.length > 0 && <section className="vd-section vd-profile-related"><div className="vd-section-heading"><h2>{t('{0}의 버튜버들도 만나보세요!', [platformName])}</h2></div><div className="vd-cards">{related.map((p) => <CreatorCard profile={p} key={p.slug} onNavigate={onNavigate} />)}</div></section>}
  </article>;
}

// 외부 배너 조회는 공개 상세에서만 실행해 등록 미리보기에 영향을 주지 않는다.
export function ProfilePage({ profile, profiles, onNavigate }: { profile: PortalProfile; profiles: PortalProfile[]; onNavigate: (path: string) => void }) {
  const details = useChannelDetails(profile);
  return <ProfileExperience profile={profile} profiles={profiles} onNavigate={onNavigate} details={details} />;
}
