import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, CalendarPlus, Clock, Link2, Play, ShieldCheck } from 'lucide-react';
import { PortalChannelDetails, PortalProfile, portalChannelKey, portalDateKey, portalWebUrl } from '../../../shared/portal';
import { PROFILE_VIDEO_LABELS, profileDebutMembers, profileDebutPhase, profileLinkKey, profileVideoId } from '../../../shared/profilePresentation';
import { activityChannelKey } from '../../../shared/broadcastActivity';
import { CreatorCard, CopyButton, FavoriteButton, PlatformBadge, PortalAvatar, PortalLink, downloadPortalSchedule, portalSchedule } from './PortalUi';
import { ProfileCover } from './ProfileCover';
import { useChannelDetails } from './useChannelDetails';
import { t, usePortalLocale } from './portalLocale';
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
  const replay = phase === 'PAST' && profile.videoKind === 'REPLAY' && profileVideoId(profile.videoUrl || '');
  return <div className="vd-debut-callout">
    <div><span className="vd-eyebrow"><CalendarDays size={14} />{phase === 'UPCOMING' ? t('첫 만남의 약속') : t('데뷔 일정')}</span>
      <h2>{profile.dateState === 'NONE' ? t('데뷔 일정 등록 없음') : portalSchedule(profile)}</h2>
      {profile.dateState === 'FIXED' && phase !== 'UNCONFIRMED' && <p className="vd-muted">{t('한국 시간 (Asia/Seoul) 기준')} · {portalDateKey(profile.startAtUtc, 'Asia/Seoul').slice(0, 4)}</p>}
      {phase === 'UPCOMING' && <span className="vd-profile-countdown"><Clock size={13} /> {profileCountdown(profile, now)}</span>}
      {phase === 'PAST' && <p className="vd-muted">{t('예정된 데뷔 시각이 지났어요. 채널에서 소식을 확인해 보세요.')}</p>}
      {profile.dateState === 'DATE_TBD' && <p className="vd-muted">{t('정확한 날짜가 정해지면 다시 만나요.')}</p>}
      {profile.noticeUrl && portalWebUrl(profile.noticeUrl) && <a className="vd-text-button" href={portalWebUrl(profile.noticeUrl)} target="_blank" rel="noopener noreferrer">{t('데뷔 공지 보기')}<ArrowUpRight size={13} /></a>}
    </div>
    <div className="vd-debut-actions">
      {profile.channelUrl && <a className="vd-button vd-primary" href={portalWebUrl(profile.channelUrl)} target="_blank" rel="noopener noreferrer">{t('방송 채널로 만나기')}<ArrowUpRight size={16} /></a>}
      {phase === 'UPCOMING' && <button type="button" className="vd-button" disabled={preview} onClick={() => downloadPortalSchedule(profile)}><CalendarPlus size={16} />{t('내 캘린더에 저장')}</button>}
      {replay && <a className="vd-button" href={portalWebUrl(profile.videoUrl || '')} target="_blank" rel="noopener noreferrer"><Play size={15} />{t('첫 방송 다시보기')}</a>}
    </div>
  </div>;
}

// 영상 플레이어는 방문자가 재생을 선택한 뒤에만 불러온다.
function ProfileVideo({ profile }: { profile: PortalProfile }) {
  const [playing, setPlaying] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const videoId = profileVideoId(profile.videoUrl || '');
  const kind = PROFILE_VIDEO_LABELS[profile.videoKind || 'INTRO'] || PROFILE_VIDEO_LABELS.INTRO;
  // 팀 PV는 유형 배지 대신 영상 제목 뒤에 PV를 한 번만 표시한다.
  const title = profile.videoTitle || t('영상으로 먼저 만나요');
  const heading = profile.videoKind === 'GROUP_PV' && !/\bPV\s*$/i.test(title) ? `${title} PV` : title;
  if (!videoId) return null;
  return <section className="vd-panel">
    <div className="vd-video-heading"><div>{profile.videoKind !== 'GROUP_PV' && <span className="vd-eyebrow">{t(kind)}</span>}<h2>{heading}</h2></div></div>
    <div className="vd-profile-video">{playing ? <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} title={heading} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      : <button type="button" onClick={() => setPlaying(true)} aria-label={t('대표 영상 재생')}>
        {!imageFailed && <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
        <span className="vd-video-play"><Play size={20} fill="currentColor" />{t('대표 영상 재생')}</span>
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
  const links = [{ url: profile.xUrl, label: '새 소식' }, { url: profile.cafeUrl, label: '공식 카페' }, { url: profile.websiteUrl, label: '공식 홈페이지' }].filter((link) => {
    const key = profileLinkKey(link.url || '');
    if (!key || seenLinks.has(key)) return false;
    seenLinks.add(key); return true;
  });
  return <section className="vd-panel"><span className="vd-eyebrow">{t('방송과 소식을 만나는 곳')}</span><h2>{t('채널 모아보기')}</h2><div className="vd-profile-links">
    {channels.map((channel) => <a href={portalWebUrl(channel.channelUrl)} key={`${channel.platform}:${channel.channelUrl}`} target="_blank" rel="noopener noreferrer"><span><PlatformBadge platform={channel.platform} /><strong>{channel.primary ? t('대표 방송 채널') : channel.platform === 'YOUTUBE' ? t('영상 채널') : t('방송 채널')}</strong></span><ArrowUpRight size={15} /></a>)}
    {links.map((link) => <a key={link.url} href={portalWebUrl(link.url || '')} target="_blank" rel="noopener noreferrer"><Link2 size={15} /><span><strong>{t(link.label)}</strong></span><ArrowUpRight size={15} /></a>)}
  </div></section>;
}

// 팀·기수는 명시적으로 연결한 멤버만 시간순으로 안내한다.
function ProfileDebutGroup({ profile, profiles, onNavigate }: { profile: PortalProfile; profiles: PortalProfile[]; onNavigate: (path: string) => void }) {
  const members = profileDebutMembers(profile, profiles);
  if (members.length < 2) return null;
  return <section className="vd-panel"><span className="vd-eyebrow">{t('함께 데뷔해요')}</span><h2>{profile.debutGroupName || t('데뷔 순서')}</h2><p className="vd-muted">{t('확정된 시각은 한국 시간 (Asia/Seoul) 기준')}</p><ol className="vd-debut-members">
    {members.map((member) => <li key={member.slug} aria-current={member.slug === profile.slug ? 'true' : undefined}>
      {member.slug === profile.slug ? <div className="vd-debut-member"><PortalAvatar profile={member} /><span><strong>{member.displayName}</strong><small>{portalSchedule(member)}</small></span><em>{t('지금 보고 있어요')}</em></div>
        : <PortalLink to={`/creator/${encodeURIComponent(member.slug)}`} onNavigate={onNavigate} className="vd-debut-member"><PortalAvatar profile={member} /><span><strong>{member.displayName}</strong><small>{portalSchedule(member)}</small></span><ArrowRight size={16} /></PortalLink>}
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
  const IdentityHeading = preview ? 'h2' : 'h1';
  const related = profiles.filter((p) => p.slug !== profile.slug && (!profile.debutGroupId || p.debutGroupId !== profile.debutGroupId) && (profile.tags.length ? p.tags.some((tag) => profile.tags.includes(tag)) : p.platform === profile.platform)).slice(0, 4);
  return <article className="vd-profile-experience">
    {!preview && <div className="vd-breadcrumb"><PortalLink to="/creators" onNavigate={onNavigate}>{t('버튜버 둘러보기')}</PortalLink><span>/</span><span>{profile.displayName}</span></div>}
    <section className="vd-profile-hero"><ProfileCover key={`${profile.slug}:${bannerUrl}`} banner={banner} />
      <div className="vd-profile-identity"><PortalAvatar key={`${profile.slug}:${profile.avatarUrl}`} large profile={profile} />
        <div className="vd-profile-identity-copy"><PlatformBadge platform={profile.platform} /><IdentityHeading>{profile.displayName}</IdentityHeading>
          {profile.headline && <p className="vd-profile-headline">{profile.headline}</p>}
          <div className="vd-profile-meta">{profile.agency && <span>{profile.agency}</span>}{profile.ownerVerified && <span><ShieldCheck size={14} />{t('채널 운영자 확인')}</span>}</div>
          {profile.tags.length > 0 && <div className="vd-tags">{profile.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        </div>
        {!preview && <div className="vd-profile-tools"><FavoriteButton slug={profile.slug} /><CopyButton value={`${window.location.origin}/creator/${encodeURIComponent(profile.slug)}`} /></div>}
      </div><ProfileSchedule profile={profile} now={now} preview={preview} />
    </section>
    <div className="vd-profile-layout"><div className="vd-profile-content">
      <section className="vd-panel vd-profile-intro"><span className="vd-eyebrow">{t('나를 소개합니다')}</span><h2>{t('이런 방송으로 만나요')}</h2><p className="vd-intro-text">{profile.description || details?.description || t('방송 채널에서 소개를 확인해 보세요.')}</p>{profile.languages.length > 0 && <><h3>{t('방송 언어')}</h3><p>{profile.languages.join(' · ')}</p></>}</section>
      <ProfileVideo key={profile.videoUrl} profile={profile} />
      {!preview && <ProfileDebutGroup profile={profile} profiles={profiles} onNavigate={onNavigate} />}
    </div><aside className="vd-profile-aside"><ProfileLinks profile={profile} />
      {!preview && channelKey && <PortalLink to={`/analytics/streamer/${encodeURIComponent(channelKey)}?returnTo=${encodeURIComponent(`/creator/${profile.slug}`)}`} className="vd-panel vd-aside-link" onNavigate={onNavigate}><span>{t('어떤 활동을 하고 있을까?')}</span><strong>{t('방송 활동 기록')}<ArrowRight size={17} /></strong></PortalLink>}
    </aside></div>
    {!preview && related.length > 0 && <section className="vd-section"><div className="vd-section-heading"><div><span className="vd-eyebrow">{profile.tags.length ? t('비슷한 콘텐츠의 만남') : t('같은 플랫폼의 새로운 만남')}</span><h2>{t('함께 만나보세요')}</h2></div></div><div className="vd-cards">{related.map((p) => <CreatorCard profile={p} key={p.slug} onNavigate={onNavigate} />)}</div></section>}
  </article>;
}

// 외부 배너 조회는 공개 상세에서만 실행해 등록 미리보기에 영향을 주지 않는다.
export function ProfilePage({ profile, profiles, onNavigate }: { profile: PortalProfile; profiles: PortalProfile[]; onNavigate: (path: string) => void }) {
  const details = useChannelDetails(profile);
  return <ProfileExperience profile={profile} profiles={profiles} onNavigate={onNavigate} details={details} />;
}
