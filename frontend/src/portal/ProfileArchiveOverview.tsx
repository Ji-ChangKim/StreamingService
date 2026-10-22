import { ArrowUpRight, Film, Mic, Play, Radio, Sparkles } from 'lucide-react';
import type { PortalMedia, PortalProfile } from '../../../shared/portal';
import type { ProfileBroadcast } from '../../../shared/profileDetails';
import { portalWebUrl } from '../../../shared/portal';
import { PROFILE_MEDIA_LABELS, profileMediaItems, profileMediaSource } from '../../../shared/profileMedia';
import { ProfileMediaGallery } from './ProfileMediaGallery';
import { PlatformBadge, PortalAvatar } from './PortalUi';
import { t } from './portalLocale';

// 자료 유무와 관계없이 시안의 두 영상 칸을 유지한다.
function EmptyArchiveCard({ label }: { label: string }) {
  return <div className="vd-archive-empty-card"><div><Film size={28} /><span>{t('등록된 영상이 없어요')}</span></div><strong>{t(label)}</strong><p>{t('새로운 영상이 등록되면 이곳에서 볼 수 있어요.')}</p></div>;
}

// 클립은 작은 가로 카드로 보여주고 검증된 원본 주소로 연결한다.
function ArchiveClip({ item }: { item: PortalMedia }) {
  return <a className="vd-archive-clip" href={profileMediaSource(item.url)?.url} target="_blank" rel="noopener noreferrer"><span className="vd-archive-clip-art"><Play size={20} /></span><span><small>{t(PROFILE_MEDIA_LABELS[item.kind])}</small><strong>{item.title}</strong></span><ArrowUpRight size={16} /></a>;
}

// 생방송 여부를 추측하지 않고 공식 채널로 이동하는 방송 영역을 유지한다.
function ArchiveChannel({ profile, broadcast }: { profile: PortalProfile; broadcast?: ProfileBroadcast }) {
  return <section className="vd-archive-channel" aria-label={t('방송 채널')}><div className="vd-archive-channel-preview"><PortalAvatar profile={profile} /><Radio size={18} /></div><div className="vd-archive-channel-copy"><PlatformBadge platform={profile.platform} />{broadcast?.state === 'LIVE' && <span className="vd-archive-live">LIVE</span>}<h2>{broadcast?.state === 'LIVE' ? broadcast.title : t('{0}의 방송 채널', [profile.displayName])}</h2><p>{broadcast?.state === 'LIVE' ? <>{broadcast.viewers !== undefined && t('시청자 {0}명', [broadcast.viewers.toLocaleString()])}{broadcast.observedAt && <> · <time dateTime={broadcast.observedAt}>{t('최근 방송 확인')}</time></>}</> : t(broadcast?.state === 'OFFLINE' ? '현재 방송 중이 아니에요.' : broadcast?.state === 'UNAVAILABLE' ? '방송 상태를 확인하지 못했어요. 채널에서 확인해 주세요.' : '방송 소식과 다시보기를 채널에서 만나보세요.')}</p></div>{portalWebUrl(profile.channelUrl) && <a href={portalWebUrl(broadcast?.state === 'LIVE' ? broadcast.url || profile.channelUrl : profile.channelUrl)} target="_blank" rel="noopener noreferrer"><Play size={15} />{t(broadcast?.state === 'LIVE' ? '생방송 보러가기' : '채널 바로가기')}<ArrowUpRight size={15} /></a>}</section>;
}

// 등록된 영상·클립을 시안의 고정 영역에 연결하고 빈 영역도 같은 크기로 남긴다.
export function ProfileArchiveOverview({ profile, active, onPlay, broadcast }: { profile: PortalProfile; active: string; onPlay: (key: string) => void; broadcast?: ProfileBroadcast }) {
  const media = profileMediaItems(profile);
  const videos = media.filter((item) => !['CLIP', 'CATCH', 'SHORT'].includes(item.kind));
  const clips = media.filter((item) => ['CLIP', 'CATCH', 'SHORT'].includes(item.kind));
  return <>
    <ArchiveChannel profile={profile} broadcast={broadcast} />
    <section className="vd-archive-section vd-archive-videos"><h2>{t('대표 영상 & 방송 콘텐츠')}</h2>
      {videos.length > 0 ? <ProfileMediaGallery title="" items={videos} active={active} onPlay={onPlay} showMetadata /> : <div className="vd-archive-empty-grid"><EmptyArchiveCard label="대표 영상" /><EmptyArchiveCard label="방송 다시보기" /></div>}
    </section>
    <section className="vd-archive-section vd-archive-clips"><h2>{t('인기 클립')}</h2><div className="vd-archive-clip-grid">
      {clips.length > 0 ? clips.map((item) => <ArchiveClip key={item.url} item={item} />) : <><div className="vd-archive-clip is-empty"><span className="vd-archive-clip-art"><Play size={20} /></span><span><strong>{t('아직 등록된 클립이 없어요')}</strong><small>{t('기억하고 싶은 방송의 한 장면')}</small></span></div><div className="vd-archive-clip is-empty"><span className="vd-archive-clip-art"><Sparkles size={20} /></span><span><strong>{t('함께 모아갈 순간들')}</strong><small>{t('새로운 클립을 기다리고 있어요')}</small></span></div></>}
    </div></section>
    <section className="vd-archive-section vd-archive-charms"><h2>{t('활동 소개 및 매력 포인트')}</h2><div className="vd-archive-charm-grid">
      <article><span><Mic size={19} /></span><h3>{t('주요 콘텐츠')}</h3><p>{profile.details?.contentSummary || profile.tags.join(' · ') || t('아직 등록된 콘텐츠 소개가 없어요.')}</p></article>
      <article><span><Radio size={19} /></span><h3>{t('방송 스타일 & 일정')}</h3><p>{[profile.details?.broadcastStyle, profile.regularSchedule].filter(Boolean).join('\n') || t('아직 등록된 정기 방송 일정이 없어요.')}</p></article>
      <article><span><Sparkles size={19} /></span><h3>{t('팬과 함께하는 이야기')}</h3><p>{profile.details?.fanMessage || profile.fanGuide || t('새로운 이야기를 기다리고 있어요.')}</p></article>
    </div></section>
  </>;
}
