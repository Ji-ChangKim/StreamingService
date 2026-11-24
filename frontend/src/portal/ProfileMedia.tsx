// 영상 섹션(데뷔 이야기 바로 아래): 왼쪽 큰 영상 1 + 오른쪽 작은 영상 3, 아래 최신 클립 5.
// 썸네일만 먼저 보여 주고 누르면 원래 영상 페이지로 간다(플레이어를 미리 불러오지 않음 → 첫 화면 속도 유지).
import { useState } from 'react';
import type { PortalMedia, PortalProfile } from '../../../shared/portal';
import type { ProfileDetailResponse } from '../../../shared/profileDetails';
import { profileMediaSource } from '../../../shared/profileMedia';
import { t, getPortalLanguage } from './portalLocale';

const PROVIDER: Record<string, string> = { YOUTUBE: 'YouTube', CHZZK: '치지직', SOOP: 'SOOP' };
type Item = PortalMedia & { publishedAt?: string };

function when(iso: string | undefined, now: number): string {
  const at = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(at)) return '';
  const days = Math.floor((now - at) / 86_400_000);
  if (days <= 0) return t('오늘');
  if (days === 1) return t('어제');
  if (days < 7) return t('{0}일 전', [days]);
  if (days < 30) return t('{0}주 전', [Math.floor(days / 7)]);
  return new Intl.DateTimeFormat(getPortalLanguage(), { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(new Date(at));
}
function meta(item: Item, now: number): string {
  const kind = item.kind === 'BROADCAST_REPLAY' || item.kind === 'REPLAY' ? t('{0} 다시보기', [t(PROVIDER[item.provider] || item.provider)]) : t(PROVIDER[item.provider] || item.provider);
  return [kind, when(item.publishedAt, now)].filter(Boolean).join(' · ');
}

function Thumb({ item, big = false, clip = false, now }: { item: Item; big?: boolean; clip?: boolean; now: number }) {
  const source = profileMediaSource(item.url);
  const [failed, setFailed] = useState(false);
  if (!source) return null;
  const image = !failed ? (item.thumbnailUrl || source.thumbnailUrl) : '';
  return <a className={`vd-vg ${big ? 'big' : ''} ${clip ? 'clip' : ''}`} href={source.url} target="_blank" rel="noopener noreferrer">
    <span className="th">{image ? <img src={image} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : null}<i aria-hidden="true">▶</i>
      {big && <span className="cap"><b>{item.title}</b><small>{meta(item, now)}</small></span>}</span>
    {!big && <span className="tx"><b>{item.title}</b>{!clip && <small>{meta(item, now)}</small>}</span>}
  </a>;
}

export function ProfileMedia({ profile, detail, loading, upcoming, now }: { profile: PortalProfile; detail?: ProfileDetailResponse; loading: boolean; upcoming: boolean; now: number }) {
  const registered = (profile.media || []).filter((item) => item.kind !== 'CLIP' && item.kind !== 'SHORT');
  if (upcoming) {
    if (!registered.length) return null;
    return <section className="content-panel vd-ins vd-media" aria-labelledby="ins-media"><span className="vd-ins-eyebrow"><b>TEASER</b></span><h2 id="ins-media">{t('첫 만남 전에 미리 만나 보세요')}</h2>
      <div className="vd-vpair">{registered.slice(0, 2).map((item) => <Thumb key={item.url} item={item} now={now} />)}</div></section>;
  }
  const seen = new Set<string>();
  const videos = [...registered, ...(detail?.channelMedia.videos.items || [])].filter((item) => (seen.has(item.url) ? false : (seen.add(item.url), true))).slice(0, 4);
  const clips = (detail?.channelMedia.clips.items || []).slice(0, 5);
  if (loading && !videos.length) return <section className="content-panel vd-ins vd-media" aria-busy="true"><div className="skeleton-media"><span /><span /></div></section>;
  if (!videos.length && !clips.length) return null;
  const [main, ...side] = videos;
  const clipsUrl = profile.platform === 'CHZZK' ? `${profile.channelUrl.replace(/\/$/, '')}/clips` : profile.channelUrl;
  return <section className="content-panel vd-ins vd-media" aria-labelledby="ins-media">
    <span className="vd-ins-eyebrow"><b>VIDEO</b></span><h2 id="ins-media">{t('영상으로 먼저 만나 보세요')}</h2>
    {main && <div className={`vd-vgrid ${side.length ? '' : 'solo'}`}><Thumb item={main} big now={now} />{side.length > 0 && <div className="vd-vside">{side.map((item) => <Thumb key={item.url} item={item} now={now} />)}</div>}</div>}
    {clips.length > 0 && <><div className="vd-clips-h"><p className="vd-ins-sub">{t('최신 클립')}</p><a href={clipsUrl} target="_blank" rel="noopener noreferrer">{t('{0}에서 더 보기', [t(PROVIDER[profile.platform] || profile.platform)])} ↗</a></div>
      <div className="vd-clips">{clips.map((item) => <Thumb key={item.url} item={item} clip now={now} />)}</div></>}
  </section>;
}
