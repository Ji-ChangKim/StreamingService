import { t, usePortalLocale, getPortalLanguage, portalLanguagePath } from './portalLocale';
import { portalCalendarFile } from '../../../shared/portalCalendarFile';
import { dateTimeFormatter } from '../../../shared/dateTimeFormatter';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarPlus, Heart, Search, X, Check, Copy } from 'lucide-react';
import { PortalProfile, PORTAL_PLATFORMS, portalWebUrl } from '../../../shared/portal';
import { readPortalStorage, savePortalStorage } from './portalApi';

// 같은 화면 이동을 링크로 제공해 새 탭과 키보드 탐색도 지원한다.
export function PortalLink({ to, children, className = '', onNavigate }: { to: string; children: ReactNode; className?: string; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return <a href={portalLanguagePath(to)} className={className} onClick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onNavigate(portalLanguagePath(to)); } }}>{children}</a>;
}

// 화면별 핵심 제목과 설명의 위계를 통일한다.
export function PortalHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return <header className="vd-heading"><div><h1>{title}</h1><p>{description}</p></div>{children}</header>;
}

// 로딩·오류·빈 결과를 서로 다른 안내로 표현한다.
export function PortalState({ title, description, action, loading = false }: { title: string; description?: string; action?: ReactNode; loading?: boolean }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return <div className={`vd-state ${loading ? 'is-loading' : ''}`} role={loading ? 'status' : undefined}>{loading ? <span className="vd-spinner" /> : <Search size={28} />}<h2>{title}</h2>{description && <p>{description}</p>}{action}</div>;
}

// 플랫폼 로고는 원본 비율과 색상으로 표시한다.
export function PlatformBadge({ platform }: { platform: string }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const item = PORTAL_PLATFORMS.find((p) => p.id === platform);
  return <span className="vd-platform">{item && <img src={item.icon} alt="" />}{item?.label || platform}</span>;
}

// 프로필 사진이 없거나 깨지면 이름의 첫 글자를 사용한다.
export function PortalAvatar({ profile, large = false }: { profile: Pick<PortalProfile, 'avatarUrl' | 'displayName'>; large?: boolean }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [broken, setBroken] = useState(false);
  return <div className={`vd-avatar ${large ? 'vd-avatar-large' : ''}`}>{profile.avatarUrl && !broken ? <img src={portalWebUrl(profile.avatarUrl)} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span>{profile.displayName.slice(0, 1)}</span>}</div>;
}

// 일정 상태에 따라 확정 시각과 미정 안내를 구분한다.
export function portalSchedule(profile: PortalProfile, timezone = 'Asia/Seoul'): string {
  if (profile.dateState === 'NONE') return t('데뷔 일정 등록 없음');
  if (profile.dateState === 'DATE_TBD') return t('{0} · 날짜 미정', [profile.targetMonth]);
  if (profile.dateState === 'TIME_TBD') return t('{0} · 시간 미정 ({1})', [profile.debutDate, profile.timezone]);
  if (!profile.startAtUtc || !Number.isFinite(Date.parse(profile.startAtUtc))) return t('일정 확인 중');
  return dateTimeFormatter(getPortalLanguage(), { timeZone: timezone, month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(profile.startAtUtc));
}

// 단일 일정 저장도 전체 내보내기와 같은 형식을 사용한다.
export function downloadPortalSchedule(profile: PortalProfile) {
  if (profile.dateState === 'FIXED') downloadPortalSchedules([profile], `${profile.slug}-debut.ics`);
}

// 기존 전체 일정 저장을 복원하고 내려받기 후 임시 객체 주소를 해제한다.
export function downloadPortalSchedules(profiles: PortalProfile[], filename = 'vdebut-calendar.ics') {
  const url = URL.createObjectURL(new Blob([portalCalendarFile(profiles)], { type: 'text/calendar;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

// 관심 목록 저장 상태를 현재 브라우저의 다른 카드에도 알린다.
export function FavoriteButton({ slug }: { slug: string }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [favorites, setFavorites] = useState<string[]>(() => readPortalStorage('favorites', []));
  const [error, setError] = useState(false);
  useEffect(() => { const sync = () => setFavorites(readPortalStorage('favorites', [])); window.addEventListener('vd-favorites', sync); return () => window.removeEventListener('vd-favorites', sync); }, []);
  const active = favorites.includes(slug);
  return <button type="button" className={`vd-icon-button ${active ? 'is-favorite' : ''}`} aria-pressed={active} aria-label={error ? t("관심 목록 저장 실패 · 다시 시도") : active ? t("관심 목록에서 제거") : t("관심 목록에 저장")} title={error ? t("브라우저 저장을 허용해 주세요.") : active ? t("관심 목록에서 제거") : t("관심 목록에 저장")} onClick={() => { const next = active ? favorites.filter((item) => item !== slug) : [...favorites, slug]; if (savePortalStorage('favorites', next)) { setError(false); setFavorites(next); window.dispatchEvent(new Event('vd-favorites')); } else setError(true); }}><Heart size={18} fill={active ? 'currentColor' : 'none'} /></button>;
}

// 프로필과 활동명을 카드 중심에 두고 실제 소개·일정으로 만남을 연결한다.
export function CreatorCard({ profile, onNavigate, timezone, preview = false }: { profile: PortalProfile; onNavigate: (path: string) => void; timezone?: string; preview?: boolean }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return <article className="vd-creator-card">
    <div className="vd-card-top"><PortalAvatar profile={profile} />{!preview && <FavoriteButton slug={profile.slug} />}</div>
    <div className="vd-card-identity">
      {preview ? <h3 title={profile.displayName}>{profile.displayName}</h3> : <PortalLink to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={onNavigate}><h3 title={profile.displayName}>{profile.displayName}</h3></PortalLink>}
      <PlatformBadge platform={profile.platform} />
    </div>
    <p className="vd-card-description">{profile.headline || profile.description || t("방송 채널에서 소개를 확인해 보세요.")}</p>
    {profile.tags.length > 0 && <div className="vd-tags">{profile.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>}
    <p className="vd-card-schedule">{portalSchedule(profile, timezone)}</p>
    {!preview && <PortalLink to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={onNavigate} className="vd-card-link">{t("소개 보기")}<ArrowUpRight size={16} /></PortalLink>}
  </article>;
}

// 공유 동작의 성공과 실패를 실제 결과에 맞춰 표시한다.
export function CopyButton({ value, label = '주소 복사' }: { value: string; label?: string }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [message, setMessage] = useState('');
  return <button type="button" className="vd-button" onClick={async () => { try { await navigator.clipboard.writeText(value); setMessage('복사 완료'); } catch { setMessage('복사 실패 · 주소를 직접 복사해 주세요.'); } }}>{message === '복사 완료' ? <Check size={16} /> : <Copy size={16} />}{t(message || label)}</button>;
}

// 상세 창은 포커스를 가두고 닫으면 기존 버튼으로 되돌린다.
export function PortalDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; ref.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key !== 'Tab') return;
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex="0"]') || []).filter((item) => !item.hasAttribute('disabled'));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return <div className="vd-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="vd-dialog" role="dialog" aria-modal="true" aria-labelledby="vd-dialog-title" ref={ref} tabIndex={-1}><div className="vd-dialog-heading"><h2 id="vd-dialog-title">{title}</h2><button className="vd-icon-button" type="button" aria-label={t("닫기")} onClick={onClose}><X size={20} /></button></div>{children}</div></div>;
}

// 자신의 데뷔 소식을 등록할 이유와 진입을 함께 제공한다.
export function RegisterCallout({ onNavigate }: { onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return <section className="vd-callout"><div className="vd-callout-icon"><CalendarPlus size={28} /></div><div><h2>{t("곧 데뷔하나요?")}</h2><p>{t("데뷔 소식과 나의 소개를 등록하고 새로운 팬을 만나보세요.")}</p></div><PortalLink to="/upload" onNavigate={onNavigate} className="vd-button vd-primary">{t("데뷔 등록하기")}<ArrowUpRight size={17} /></PortalLink></section>;
}
