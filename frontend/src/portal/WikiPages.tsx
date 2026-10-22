import { useEffect, useState, type ReactNode } from 'react';
import type { PortalProfile } from '../../../shared/portal';
import { WikiDirectoryContent, WikiProfileContent } from './WikiContent';
import { WikiEvidenceModal } from './WikiParticipation';
import { readPortalStorage, savePortalStorage } from './portalApi';
import { useProfileDetail } from './useProfileDetail';
import { t, usePortalLocale } from './portalLocale';

export interface WikiListingProps { profiles: PortalProfile[]; loading: boolean; error: string; refresh: () => void; onNavigate: (path: string) => void }

// 기존 관심 목록의 저장 키와 변경 알림을 그대로 사용한다.
export function useWikiFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => readPortalStorage('favorites', []));
  const [message, setMessage] = useState('');
  useEffect(() => { const sync = () => setFavorites(readPortalStorage('favorites', [])); window.addEventListener('vd-favorites', sync); return () => window.removeEventListener('vd-favorites', sync); }, []);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 4000); return () => clearTimeout(timer); }, [message]);
  const toggle = (slug: string) => {
    const current = readPortalStorage<string[]>('favorites', []);
    const next = current.includes(slug) ? current.filter(value => value !== slug) : [...current, slug];
    if (!savePortalStorage('favorites', next)) { setMessage('관심 목록을 저장하지 못했어요.'); return; }
    setFavorites(next); window.dispatchEvent(new Event('vd-favorites'));
  };
  return { favorites, toggle, message, setMessage };
}

// Header·Footer와 무관한 본문 컨테이너에서만 승인된 반응형 스타일을 적용한다.
export function WikiBody({ children }: { children: ReactNode }) { return <div className="wiki-content-boundary"><div className="wiki-design">{children}</div></div>; }

// 조회 중·실패를 실제 빈 목록과 구분하고 장식 아이콘은 사용하지 않는다.
export function WikiLoadState({ loading, error, refresh }: { loading: boolean; error: string; refresh: () => void }) {
  return <div className="big-empty" role={error ? 'alert' : 'status'}><h2>{t(loading ? '이야기를 불러오는 중이에요.' : '자료를 불러오지 못했어요.')}</h2>{error && <><p>{t(error)}</p><button className="primary" onClick={refresh}>{t('다시 시도')}</button></>}</div>;
}

// 기존 목록 API와 즐겨찾기 전용 경로를 새 도감 카드에 연결한다.
export function WikiDirectoryPage({ profiles, favoritesOnly = false, loading, error, refresh, onNavigate }: WikiListingProps & { favoritesOnly?: boolean }) {
  usePortalLocale();
  const favorite = useWikiFavorites();
  return <WikiBody>{loading || error ? <WikiLoadState loading={loading} error={error} refresh={refresh} /> : <WikiDirectoryContent profiles={[...profiles].sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'))} favoritesOnly={favoritesOnly} open={slug => onNavigate(slug ? `/creator/${encodeURIComponent(slug)}` : '/creators')} now={Date.now()} favorites={favorite.favorites} toggle={favorite.toggle} />}{favorite.message && <div className="participation-success" role="status">{t(favorite.message)}</div>}</WikiBody>;
}

// 소개 진입 시 직접 조회하며 예정 시각의 경과는 추가 API 폴링 없이 화면만 전환한다.
export function WikiProfilePage({ profile, onNavigate }: { profile: PortalProfile; profiles?: PortalProfile[]; onNavigate: (path: string) => void }) {
  usePortalLocale();
  const detail = useProfileDetail(profile.slug);
  const favorite = useWikiFavorites();
  const [now, setNow] = useState(Date.now());
  const [modal, setModal] = useState(false);
  useEffect(() => {
    const start = Date.parse(profile.startAtUtc); setNow(Date.now()); setModal(false);
    if (profile.dateState !== 'FIXED' || !Number.isFinite(start) || start <= Date.now()) return;
    const timer = setInterval(() => { const current = Date.now(); setNow(current); if (current >= start) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [profile.slug, profile.startAtUtc, profile.dateState]);
  if (detail.missing) return <WikiBody><div className="big-empty"><h1>{t('버튜버 소개를 찾을 수 없어요')}</h1><button className="primary" onClick={() => onNavigate('/creators')}>{t('전체 버튜버')}</button></div></WikiBody>;
  const current = detail.data?.profile || profile;
  const fallback = detail.error ? { profile: current, broadcast: { state: 'UNAVAILABLE' as const }, channelMedia: { videos: { state: 'UNAVAILABLE' as const, items: [] }, clips: { state: 'UNAVAILABLE' as const, items: [] } } } : undefined;
  return <WikiBody>{detail.error && <p className="form-error" role="alert">{t('상세 정보를 불러오지 못했어요.')} <button className="text-button" onClick={detail.retry}>{t('다시 시도')}</button></p>}<WikiProfileContent profile={current} detail={detail.data || fallback} loading={!detail.data && !detail.error} report={() => setModal(true)} now={now} favorites={favorite.favorites} toggle={favorite.toggle} back={() => onNavigate('/creators')} toast={favorite.setMessage} />{favorite.message && <div className="participation-success" role="status">{t(favorite.message)}</div>}{modal && <WikiEvidenceModal profile={current} close={() => setModal(false)} />}</WikiBody>;
}
