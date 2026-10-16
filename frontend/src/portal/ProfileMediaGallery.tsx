import { useState } from 'react';
import { ArrowUpRight, Play, X } from 'lucide-react';
import type { PortalMedia } from '../../../shared/portal';
import { profileMediaKey, profileMediaSource } from '../../../shared/profileMedia';
import { portalWebUrl } from '../../../shared/portal';
import { t } from './portalLocale';
import './profileMedia.css';

// 클릭한 영상 하나만 불러오고 원문 이동은 재생 상태와 무관하게 제공한다.
function ProfileMediaCard({ item, active, onPlay, featured = false }: {
  item: PortalMedia; active: string; onPlay: (key: string) => void; featured?: boolean;
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
      {active === key && <button type="button" className="vd-media-stop" aria-label={t('재생 닫기')} onClick={() => onPlay('')}><X size={16} /></button>}
    </div> : <a className="vd-media-link-preview" href={source.url} target="_blank" rel="noopener noreferrer">
      {thumbnail && !imageFailed && <img src={thumbnail} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
      <span><Play size={22} />{t('원문에서 보기')}<ArrowUpRight size={16} /></span>
    </a>}
    <div className="vd-media-card-copy">
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
export function ProfileMediaGallery({ title, items, active, onPlay, featured = false }: {
  title: string; items: PortalMedia[]; active: string; onPlay: (key: string) => void; featured?: boolean;
}) {
  if (!items.length) return null;
  const ordered = featured ? [...items].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))) : items;
  const visible = ordered.slice(0, featured ? 3 : 6);
  const remaining = ordered.slice(visible.length);
  return <section className="vd-profile-media-section" aria-label={title}>
    <header className="vd-media-section-heading"><h2>{title}</h2></header>
    <div className={`vd-media-grid${featured ? ' vd-media-intro-grid' : ''}`}>{visible.map((item, index) => <ProfileMediaCard key={profileMediaKey(item)} item={item} active={active} onPlay={onPlay} featured={featured && index === 0} />)}</div>
    {remaining.length > 0 && <details className="vd-media-more"><summary>{t('영상 더 보기')}</summary><div className="vd-media-grid">{remaining.map((item) => <ProfileMediaCard key={profileMediaKey(item)} item={item} active={active} onPlay={onPlay} />)}</div></details>}
  </section>;
}
