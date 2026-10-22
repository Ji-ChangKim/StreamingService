import { useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import type { PortalMedia } from '../../../shared/portal';
import { PROFILE_MEDIA_LABELS, profileMediaKey, profileMediaSource } from '../../../shared/profileMedia';
import { portalWebUrl } from '../../../shared/portal';
import { t } from './portalLocale';
import { PlatformBadge } from './PortalUi';
import './profileMedia.css';

// 클릭한 영상 하나만 불러오고 원문 이동은 재생 상태와 무관하게 제공한다.
function ProfileMediaCard({ item, active, onPlay, featured = false, showMetadata = false }: {
  item: PortalMedia & { publishedAt?: string }; active: string; onPlay: (key: string) => void; featured?: boolean; showMetadata?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = profileMediaSource(item.url);
  if (!source) return null;
  const key = profileMediaKey(item);
  const embed = item.linkOnly ? '' : source.embedUrl;
  const thumbnail = portalWebUrl(item.thumbnailUrl || source.thumbnailUrl);
  return <article className={`vd-media-card${featured ? ' vd-media-featured' : ''}`}>
    {embed ? <div className="vd-media-player">{active === key
      ? <iframe src={embed} title={item.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      : <button type="button" onClick={() => onPlay(key)} aria-label={t('{0} 재생', [item.title])}>
        {thumbnail && !imageFailed && <img src={thumbnail} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
        <span className="vd-media-play"><Play size={20} fill="currentColor" />{t('영상 재생')}</span>
      </button>}
    </div> : <a className="vd-media-link-preview" href={source.url} target="_blank" rel="noopener noreferrer">
      {thumbnail && !imageFailed && <img src={thumbnail} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
      <span><Play size={22} />{t('원문에서 보기')}<ArrowUpRight size={16} /></span>
    </a>}
    <div className="vd-media-card-copy">
      {/* 아카이브 레이아웃에서는 실제 제공 플랫폼과 등록된 영상 종류만 표시한다. */}
      {showMetadata && <div className="vd-archive-media-labels"><PlatformBadge platform={source.provider} /><small>{t(PROFILE_MEDIA_LABELS[item.kind])}</small></div>}
      {/* 채널에서 받은 실제 게시 날짜가 있을 때만 표시한다. */}
      {showMetadata && item.publishedAt && <small><time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</time></small>}
      <div className="vd-media-card-header">
        <h3>{item.title}</h3>
        <a className="vd-media-origin-link" href={source.url} target="_blank" rel="noopener noreferrer">
          <span>{t('원본 영상 보기')}</span>
          <ArrowUpRight size={14} />
        </a>
      </div>
    </div>
  </article>;
}

// 자료가 있는 종류만 보여주며 대표 영상과 보조 영상의 위계를 구분한다.
export function ProfileMediaGallery({ title, items, active, onPlay, featured = false, showMetadata = false }: {
  title: string; items: (PortalMedia & { publishedAt?: string })[]; active: string; onPlay: (key: string) => void; featured?: boolean; showMetadata?: boolean;
}) {
  if (!items.length) return null;
  const ordered = featured ? [...items].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))) : items;
  const visible = ordered.slice(0, featured ? 3 : 6);
  const remaining = ordered.slice(visible.length);
  return <section className="vd-profile-media-section" aria-label={title || undefined}>
    {Boolean(title) && <header className="vd-media-section-heading"><h2>{title}</h2></header>}
    <div className={`vd-media-grid${featured ? ' vd-media-intro-grid' : ''}`}>{visible.map((item, index) => <ProfileMediaCard key={profileMediaKey(item)} item={item} active={active} onPlay={onPlay} featured={featured && index === 0} showMetadata={showMetadata} />)}</div>
    {remaining.length > 0 && <details className="vd-media-more"><summary>{t('영상 더 보기')}</summary><div className="vd-media-grid">{remaining.map((item) => <ProfileMediaCard key={profileMediaKey(item)} item={item} active={active} onPlay={onPlay} showMetadata={showMetadata} />)}</div></details>}
  </section>;
}
