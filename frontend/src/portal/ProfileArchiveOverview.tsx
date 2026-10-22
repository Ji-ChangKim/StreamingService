import { ArrowUpRight, Film, Mic, Play, Radio, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { PortalMedia, PortalProfile } from '../../../shared/portal';
import type { ChannelMediaSection, ProfileBroadcast, ProfileChannelMedia } from '../../../shared/profileDetails';
import { portalWebUrl } from '../../../shared/portal';
import { profileMediaItems, profileMediaSource } from '../../../shared/profileMedia';
import { PlatformBadge, PortalAvatar } from './PortalUi';
import { t } from './portalLocale';

// 자료 유무와 관계없이 시안의 두 영상 칸을 유지한다.
function EmptyArchiveCard({ label }: { label: string }) {
  return <div className="vd-archive-empty-card"><div><Film size={28} /><span>{t('등록된 영상이 없어요')}</span></div><strong>{t(label)}</strong><p>{t('새로운 영상이 등록되면 이곳에서 볼 수 있어요.')}</p></div>;
}

// 영상은 썸네일과 제목만 표시하고 카드 전체를 하나의 원본 링크로 연결한다.
function ArchiveMediaCard({ item, portrait = false }: { item: PortalMedia; portrait?: boolean }) {
  const [failedImage, setFailedImage] = useState('');
  const source = profileMediaSource(item.url);
  if (!source) return null;
  const thumbnail = portalWebUrl(item.thumbnailUrl || source.thumbnailUrl);
  return <a className={`vd-archive-media-card${portrait ? ' is-portrait' : ''}`} href={source.url} target="_blank" rel="noopener noreferrer">
    <span className="vd-archive-media-art">{thumbnail && failedImage !== thumbnail ? <img src={thumbnail} alt="" loading="lazy" onError={() => setFailedImage(thumbnail)} /> : <Film size={28} aria-hidden="true" />}</span>
    <strong>{item.title}</strong>
  </a>;
}

// 로딩·조회 실패·빈 채널을 구분하여 오래된 자료를 최신 영상처럼 보여주지 않는다.
function ChannelMediaEmpty({ section, clips }: { section?: ChannelMediaSection; clips?: boolean }) {
  return <p className="vd-channel-media-empty" role="status">{t(!section ? '채널 영상을 불러오는 중이에요.' : section.state === 'UNAVAILABLE' ? '영상을 불러오지 못했어요. 채널에서 확인해 주세요.' : section.state === 'UNSUPPORTED' ? '영상은 공식 채널에서 확인해 주세요.' : clips ? '아직 공개된 클립이 없어요.' : '아직 공개된 영상이 없어요.')}</p>;
}

// 생방송 여부를 추측하지 않고 공식 채널로 이동하는 방송 영역을 유지한다.
function ArchiveChannel({ profile, broadcast }: { profile: PortalProfile; broadcast?: ProfileBroadcast }) {
  const [failedImage, setFailedImage] = useState('');
  const thumbnail = portalWebUrl(broadcast?.thumbnailUrl || '');
  // 실제 방송 이미지가 있을 때만 큰 미리보기를 표시하고 로드 실패 시 채널 카드로 복구한다.
  if (broadcast?.state === 'LIVE' && thumbnail && failedImage !== thumbnail) return <a className="vd-live-preview" href={portalWebUrl(broadcast.url || profile.channelUrl)} target="_blank" rel="noopener noreferrer" aria-label={`${broadcast.title || profile.displayName} · ${t('생방송 보러가기')}`}>
    <img className="vd-live-preview-image" src={thumbnail} alt="" onError={() => setFailedImage(thumbnail)} />
    <span className="vd-live-preview-status"><b>LIVE</b>{broadcast.viewers !== undefined && <span>{t('시청자 {0}명', [broadcast.viewers.toLocaleString()])}</span>}</span>
    <span className="vd-live-preview-play" aria-hidden="true"><Play size={28} fill="currentColor" /></span>
    <div className="vd-live-preview-info"><PortalAvatar profile={profile} /><div><h2>{broadcast.title || profile.displayName}</h2><div className="vd-live-preview-meta"><span>{profile.displayName}</span><PlatformBadge platform={profile.platform} />{broadcast.category && <span>{broadcast.category}</span>}</div></div><ArrowUpRight size={20} /></div>
  </a>;
  return <section className="vd-archive-channel" aria-label={t('방송 채널')}><div className="vd-archive-channel-preview"><PortalAvatar profile={profile} /><Radio size={18} /></div><div className="vd-archive-channel-copy"><PlatformBadge platform={profile.platform} />{broadcast?.state === 'LIVE' && <span className="vd-archive-live">LIVE</span>}<h2>{broadcast?.state === 'LIVE' ? broadcast.title : t('{0}의 방송 채널', [profile.displayName])}</h2><p>{broadcast?.state === 'LIVE' ? <>{broadcast.viewers !== undefined && t('시청자 {0}명', [broadcast.viewers.toLocaleString()])}{broadcast.observedAt && <> · <time dateTime={broadcast.observedAt}>{t('최근 방송 확인')}</time></>}</> : t(broadcast?.state === 'OFFLINE' ? '현재 방송 중이 아니에요.' : broadcast?.state === 'UNAVAILABLE' ? '방송 상태를 확인하지 못했어요. 채널에서 확인해 주세요.' : '방송 소식과 다시보기를 채널에서 만나보세요.')}</p></div>{portalWebUrl(profile.channelUrl) && <a href={portalWebUrl(broadcast?.state === 'LIVE' ? broadcast.url || profile.channelUrl : profile.channelUrl)} target="_blank" rel="noopener noreferrer"><Play size={15} />{t(broadcast?.state === 'LIVE' ? '생방송 보러가기' : '채널 바로가기')}<ArrowUpRight size={15} /></a>}</section>;
}

// 등록된 영상·클립을 시안의 고정 영역에 연결하고 빈 영역도 같은 크기로 남긴다.
export function ProfileArchiveOverview({ profile, broadcast, channelMedia, preview = false }: { profile: PortalProfile; broadcast?: ProfileBroadcast; channelMedia?: ProfileChannelMedia; preview?: boolean }) {
  const media = profileMediaItems(profile);
  const videos = preview ? media.filter((item) => !['CLIP', 'CATCH', 'SHORT'].includes(item.kind)).slice(0, 2) : channelMedia?.videos.items || [];
  const clips = preview ? media.filter((item) => ['CLIP', 'CATCH', 'SHORT'].includes(item.kind)).slice(0, 4) : channelMedia?.clips.items || [];
  return <>
    <ArchiveChannel profile={profile} broadcast={broadcast} />
    <section className="vd-archive-section vd-archive-videos"><h2>{t('추천 영상')}</h2>
      {videos.length > 0 ? <div className="vd-archive-video-grid">{videos.map((item) => <ArchiveMediaCard key={item.url} item={item} />)}</div> : preview ? <div className="vd-archive-empty-grid"><EmptyArchiveCard label="대표 영상" /><EmptyArchiveCard label="방송 다시보기" /></div> : <ChannelMediaEmpty section={channelMedia?.videos} />}
    </section>
    <section className="vd-archive-section vd-archive-clips"><h2>{t('최신 클립')}</h2><div className="vd-archive-clip-grid">
      {clips.length > 0 ? clips.map((item) => <ArchiveMediaCard key={item.url} item={item} portrait />) : <ChannelMediaEmpty section={channelMedia?.clips} clips />}
    </div></section>
    <section className="vd-archive-section vd-archive-charms"><h2>{t('활동 소개 및 매력 포인트')}</h2><div className="vd-archive-charm-grid">
      <article><span><Mic size={19} /></span><h3>{t('주요 콘텐츠')}</h3><p>{profile.details?.contentSummary || profile.tags.join(' · ') || t('아직 등록된 콘텐츠 소개가 없어요.')}</p></article>
      <article><span><Radio size={19} /></span><h3>{t('방송 스타일 & 일정')}</h3><p>{[profile.details?.broadcastStyle, profile.regularSchedule].filter(Boolean).join('\n') || t('아직 등록된 정기 방송 일정이 없어요.')}</p></article>
      <article><span><Sparkles size={19} /></span><h3>{t('팬과 함께하는 이야기')}</h3><p>{profile.details?.fanMessage || profile.fanGuide || t('새로운 이야기를 기다리고 있어요.')}</p></article>
    </div></section>
  </>;
}
