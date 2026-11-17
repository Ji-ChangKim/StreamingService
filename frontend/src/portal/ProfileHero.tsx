// 버튜버 상세 위쪽(최종 후보 시안 ⑨·⑪): 정체(사진·이름·플랫폼/소속) + 방송 상태 카드 + 핵심 숫자 4개.
// 상태 카드는 상황마다 한 장만 보인다: 방송 중 / 방송 안 함 / 데뷔 전(D-n) / 데뷔 당일 / 기록 없음.
import { useEffect, useRef, useState } from 'react';
import { Heart, Share2, Link2, X as XIcon } from 'lucide-react';
import type { AnalyticsChannelBoard } from '../../../shared/analyticsBoard';
import type { PortalProfile } from '../../../shared/portal';
import { PORTAL_PLATFORMS, portalWebUrl } from '../../../shared/portal';
import type { ProfileDetailResponse } from '../../../shared/profileDetails';
import { profileAgencyName } from '../../../shared/profilePresentation';
import { sizedImageUrl } from './imageDelivery';
import { t, getPortalLanguage, portalLanguagePath } from './portalLocale';
import { contentTags, debutTime, habitOf, profileChannelKey } from './ProfileInsights';
import { profileHeroStats, type ProfileHeroStats } from '../../../shared/profileHeroStats';
import './profileHero.css';

const DAY = 86_400_000;
const num = (value: number) => Math.round(value).toLocaleString(getPortalLanguage());
const kstDay = (ms: number) => new Date(ms + 9 * 3600000).toISOString().slice(0, 10);
export const platformLabel = (id: string) => t(PORTAL_PLATFORMS.find((item) => item.id === id)?.label || id);
const platformIcon = (id: string) => PORTAL_PLATFORMS.find((item) => item.id === id)?.icon;

// "플랫폼 / 소속(· 그룹)" — 개인·개인세는 쓰지 않는다(profileAgencyName이 걸러 냄).
export function profileAffiliation(profile: PortalProfile): string {
  const agency = profileAgencyName(profile.agency);
  return [agency, profile.debutGroupId ? profile.debutGroupName : ''].filter(Boolean).join(' · ');
}

function fmt(ms: number, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getPortalLanguage(), { timeZone: 'Asia/Seoul', ...options }).format(new Date(ms));
}

// 지난 시각을 "어제 오후 9시"·"11월 14일 오후 9시"처럼.
function pastLabel(ms: number, now: number): string {
  const time = fmt(ms, { hour: 'numeric' });
  const gap = Math.round((Date.parse(`${kstDay(now)}T00:00:00Z`) - Date.parse(`${kstDay(ms)}T00:00:00Z`)) / DAY);
  if (gap === 0) return t('오늘 {0}', [time]);
  if (gap === 1) return t('어제 {0}', [time]);
  return t('{0} {1}', [fmt(ms, { month: 'long', day: 'numeric' }), time]);
}

function Avatar({ profile }: { profile: PortalProfile }) {
  const [failed, setFailed] = useState(false);
  return <img className="vd-hero-av" src={!failed && profile.avatarUrl ? sizedImageUrl(profile.avatarUrl, 122) : '/images/bg_profile.webp'} alt={profile.displayName} width={104} height={104} loading="eager" decoding="async" onError={() => setFailed(true)} />;
}

function ChannelButton({ profile, label, primary }: { profile: PortalProfile; label: string; primary?: boolean }) {
  const url = portalWebUrl(profile.channelUrl);
  const icon = platformIcon(profile.platform);
  if (!url) return null;
  return <a className={`vd-btn ${primary ? 'primary' : ''}`} href={url} target="_blank" rel="noopener noreferrer">{icon && <img src={icon} alt="" />}{label}</a>;
}

function readInitialHeroStats(key: string | null): ProfileHeroStats | null {
  if (!key || typeof document === 'undefined') return null;
  try {
    const text = document.getElementById('vd-initial-hero')?.textContent;
    const stats = text ? JSON.parse(text) as ProfileHeroStats : null;
    return stats && stats.key.toLowerCase() === key.toLowerCase() ? stats : null;
  } catch { return null; }
}

type Phase = 'live' | 'upcoming' | 'today' | 'unconfirmed' | 'off' | 'none';

export function StatusCard({ profile, detail, stats, now, saved, save }: { profile: PortalProfile; detail?: ProfileDetailResponse; stats: ProfileHeroStats | null; now: number; saved: boolean; save: () => void }) {
  const at = debutTime(profile);
  const broadcast = detail?.broadcast;
  const platform = platformLabel(profile.platform);
  const last = stats?.lastAt ? Date.parse(stats.lastAt) : null;
  const fixed = profile.dateState === 'FIXED' && at !== null;
  const phase: Phase = broadcast?.state === 'LIVE' ? 'live'
    : fixed && at! > now ? (kstDay(at!) === kstDay(now) ? 'today' : 'upcoming')
    : at === null || at > now ? 'unconfirmed'
    : last ? 'off' : 'none';
  if (phase === 'live') {
    return <div className="vd-status live"><span className="lbl"><i />{t('지금 방송 중')}</span>
      {broadcast?.title && <p className="ttl">{broadcast.title}</p>}
      <p className="sub">{[broadcast?.category, broadcast?.viewers !== undefined ? t('{0}명이 보고 있어요', [num(broadcast.viewers)]) : ''].filter(Boolean).join(' · ')}</p>
      <a className="vd-btn primary" href={portalWebUrl(broadcast?.url || '') || portalWebUrl(profile.channelUrl)} target="_blank" rel="noopener noreferrer">{platformIcon(profile.platform) && <img src={platformIcon(profile.platform)} alt="" />}{t('{0}에서 방송 보기', [platform])}</a>
    </div>;
  }
  if (phase === 'upcoming') {
    const left = Math.max(0, at! - now);
    return <div className="vd-status pre"><span className="lbl"><i />{t('데뷔까지 D-{0}', [Math.ceil(left / DAY)])}</span>
      <p className="ttl">{t('{0}에 첫 방송을 해요', [fmt(at!, { month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit' })])}</p>
      <div className="vd-count" role="timer" aria-live="off">
        <div><b>{Math.floor(left / DAY)}</b>{t('일')}</div><div><b>{Math.floor(left / 3600000) % 24}</b>{t('시간')}</div><div><b>{Math.floor(left / 60000) % 60}</b>{t('분')}</div>
      </div>
      <div className="vd-two"><button type="button" className="vd-btn primary" aria-pressed={saved} onClick={save}><Heart size={16} fill={saved ? 'currentColor' : 'none'} />{t(saved ? '관심 목록에 담았어요' : '관심 목록에 담기')}</button><ChannelButton profile={profile} label={t('채널')} /></div>
    </div>;
  }
  if (phase === 'today') {
    const left = Math.max(0, at! - now);
    return <div className="vd-status pre"><span className="lbl"><i />{t('오늘 데뷔해요')}</span>
      <p className="ttl">{t('오늘 {0}에 첫 방송을 해요', [fmt(at!, { hour: 'numeric', minute: '2-digit' })])}</p>
      <p className="sub">{t('{0}시간 {1}분 남았어요. 채널을 미리 팔로우해 두면 좋아요.', [Math.floor(left / 3600000), Math.floor(left / 60000) % 60])}</p>
      <ChannelButton profile={profile} label={t('{0} 채널 미리 가기', [platform])} primary />
    </div>;
  }
  if (phase === 'unconfirmed') {
    return <div className="vd-status pre"><span className="lbl"><i />{t('데뷔 준비 중')}</span>
      <p className="ttl">{profile.debutDate ? t('{0} 데뷔 예정이에요', [fmt(Date.parse(`${profile.debutDate}T12:00:00+09:00`), { month: 'long', day: 'numeric' })]) : t('데뷔 일정을 기다리고 있어요')}</p>
      <p className="sub">{t('관심 목록에 담아 두면 일정이 정해졌을 때 다시 찾기 쉬워요.')}</p>
      <div className="vd-two"><button type="button" className="vd-btn primary" aria-pressed={saved} onClick={save}><Heart size={16} fill={saved ? 'currentColor' : 'none'} />{t(saved ? '관심 목록에 담았어요' : '관심 목록에 담기')}</button><ChannelButton profile={profile} label={t('채널')} /></div>
    </div>;
  }
  if (phase === 'off') {
    const habit = stats && stats.broadcasts30 >= 5 ? habitOf(stats.heat) : null;
    return <div className="vd-status off"><span className="lbl"><i />{t('지금은 방송하지 않아요')}</span>
      <p className="ttl">{t('마지막 방송은 {0}였어요', [pastLabel(last!, now)])}</p>
      {habit && <p className="sub">{t('보통 {0}요일 {1}시쯤 방송해요.', [habit.days, habit.start])}</p>}
      <ChannelButton profile={profile} label={t('{0} 채널 가기', [platform])} />
    </div>;
  }
  const tracked = profile.platform === 'CHZZK' || profile.platform === 'SOOP';
  return <div className="vd-status off"><span className="lbl"><i />{t(tracked ? '아직 방송 기록이 없어요' : '지금 방송 상태')}</span>
    <p className="ttl">{t(tracked ? '방송을 시작하면 이곳에 바로 보여요' : '채널에서 최신 방송을 확인해 보세요')}</p>
    <ChannelButton profile={profile} label={t('{0} 채널 가기', [platform])} />
  </div>;
}

// 핵심 숫자 4개. 데뷔 전에는 데뷔 정보, 방송 기록이 있으면 방송 숫자.
function Kpis({ profile, stats, now }: { profile: PortalProfile; stats: ProfileHeroStats | null; now: number }) {
  const at = debutTime(profile);
  const before = at === null || at > now;
  const cells: Array<[string, string, string, string]> = [];
  if (before) {
    if (at !== null) cells.push([t('데뷔'), `D-${Math.ceil((at - now) / DAY)}`, '', fmt(at, { month: 'long', day: 'numeric', weekday: 'short' })]);
    else if (profile.debutDate) cells.push([t('데뷔'), fmt(Date.parse(`${profile.debutDate}T12:00:00+09:00`), { month: 'long', day: 'numeric' }), '', t('시간 미정')]);
    if (profile.dateState === 'FIXED' && at !== null) cells.push([t('첫 방송'), fmt(at, { hour: 'numeric', minute: '2-digit' }), '', t('한국 시간')]);
    if (profile.languages?.length) cells.push([t('방송 언어'), profile.languages.join('·'), '', platformLabel(profile.platform)]);
    if (contentTags(profile).length) cells.push([t('주요 콘텐츠'), contentTags(profile).slice(0, 2).join('·'), '', t('등록 정보')]);
  } else {
    if (at !== null) cells.push([t('데뷔'), String(Math.floor((now - at) / DAY) + 1), t('일째'), fmt(at, { year: 'numeric', month: 'long', day: 'numeric' })]);
    if (stats && stats.week.broadcasts > 0) cells.push([t('최근 7일 방송'), num(stats.week.broadcasts), t('회'), t('{0}시간', [num(stats.week.minutes / 60)])]);
    if (stats && stats.avg !== null) cells.push([t('평균 시청자'), num(stats.avg), t('명'), stats.peak !== null ? t('최고 {0}명 · 30일', [num(stats.peak)]) : t('최근 30일')]);
    const habit = stats && stats.broadcasts30 >= 5 ? habitOf(stats.heat) : null;
    if (habit) cells.push([t('주로 방송하는 때'), habit.days, '', t('{0}~{1}시', [habit.start, (habit.start + 3) % 24])]);
    if (cells.length < 3) {
      if (profile.languages?.length) cells.push([t('방송 언어'), profile.languages.join('·'), '', platformLabel(profile.platform)]);
      if (contentTags(profile).length) cells.push([t('주요 콘텐츠'), contentTags(profile).slice(0, 2).join('·'), '', t('등록 정보')]);
    }
  }
  if (!cells.length) return null;
  return <div className="vd-kpis" data-count={cells.length}>{cells.slice(0, 4).map(([label, value, unit, note]) => <div key={label}><span>{label}</span><b>{value}{unit && <small>{unit}</small>}</b>{note && <em>{note}</em>}</div>)}</div>;
}

// 공유: 휴대폰은 기본 공유 창, 컴퓨터는 링크 복사·X 올리기 창.
function ShareButton({ profile, toast }: { profile: PortalProfile; toast: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const url = `https://vdebut.live${portalLanguagePath(`/creator/${profile.slug}`)}`;
  const title = t('{0} — 데뷔일·방송 기록 | VDébut', [profile.displayName]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => { if (event instanceof KeyboardEvent ? event.key === 'Escape' : !box.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast(t('링크를 복사했어요')); setOpen(false); } catch { toast(t('링크를 복사하지 못했어요. 주소창의 주소를 복사해 주세요.')); } };
  const click = async () => {
    const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (touch && typeof navigator.share === 'function') { try { await navigator.share({ title, url }); } catch { /* 사용자가 닫음 */ } return; }
    setOpen((value) => !value);
  };
  return <div className="vd-share" ref={box}>
    <button type="button" className="vd-icon-btn txt" aria-expanded={open} aria-haspopup="dialog" onClick={click}><Share2 size={15} />{t('공유')}</button>
    {open && <div className="vd-share-pop" role="dialog" aria-label={t('{0} 소개 페이지 공유하기', [profile.displayName])}>
      <p className="h">{t('{0} 소개 페이지 공유하기', [profile.displayName])}</p>
      <p className="s">{t('링크를 보내면 이름과 데뷔 정보가 담긴 카드로 보여요.')}</p>
      <div className="url"><span>{url.replace('https://', '')}</span><button type="button" className="vd-btn primary" onClick={copy}><Link2 size={15} />{t('링크 복사')}</button></div>
      <a className="vd-btn" href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer"><XIcon size={15} />{t('X에 올리기')}</a>
    </div>}
  </div>;
}

export function ProfileHero({ profile, detail, month, now, favorites, toggle, toast }: { profile: PortalProfile; detail?: ProfileDetailResponse; month: AnalyticsChannelBoard | null; now: number; favorites: string[]; toggle: (slug: string) => void; toast: (text: string) => void }) {
  const saved = favorites.includes(profile.slug);
  // 첫 HTML에 실려 온 통계가 있으면 바로 쓰고, 30일 통계를 받으면 같은 계산으로 바꾼다(숫자가 튀지 않음).
  const stats = month ? profileHeroStats(month, now) : readInitialHeroStats(profileChannelKey(profile));
  const save = () => { toggle(profile.slug); if (!saved) toast(t('관심 목록에 담았어요. 데뷔 일정은 관심 목록에서 다시 볼 수 있어요.')); };
  const affiliation = profileAffiliation(profile);
  const live = detail?.broadcast.state === 'LIVE';
  return <section className="vd-hero" aria-labelledby="vd-hero-name">
    <div className="vd-hero-top">
      <div className={`vd-hero-avwrap ${live ? 'is-live' : ''}`}><Avatar profile={profile} />{live && <b>LIVE</b>}</div>
      <div className="vd-hero-id">
        <div className="vd-hero-name"><h1 id="vd-hero-name">{profile.displayName}</h1>
          <button type="button" className={`vd-icon-btn ${saved ? 'saved' : ''}`} aria-pressed={saved} aria-label={t(saved ? '{0} 관심 해제' : '{0} 관심 저장', [profile.displayName])} onClick={() => toggle(profile.slug)}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>
          <ShareButton profile={profile} toast={toast} />
        </div>
        <p className="vd-hero-meta"><span>{platformLabel(profile.platform)}</span>{affiliation && <><span className="dot">/</span><span>{affiliation}</span></>}</p>
      </div>
      <StatusCard profile={profile} detail={detail} stats={stats} now={now} saved={saved} save={save} />
    </div>
    <Kpis profile={profile} stats={stats} now={now} />
  </section>;
}
