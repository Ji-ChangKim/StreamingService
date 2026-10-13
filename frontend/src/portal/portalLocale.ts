import { useSyncExternalStore } from 'react';
import { translatePortalText } from '../../../shared/portalTranslations';

export type PortalLanguage = 'ko' | 'ja' | 'en';

// 이전 운영 화면과 같은 URL 언어 선택을 우선하고 저장된 선택을 복원한다.
function initialLanguage(): PortalLanguage {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'ko' || fromUrl === 'ja' || fromUrl === 'en') return fromUrl;
    const saved = localStorage.getItem('vd-language');
    if (saved === 'ko' || saved === 'ja' || saved === 'en') return saved;
    return navigator.language.startsWith('ja') ? 'ja' : navigator.language.startsWith('en') ? 'en' : 'ko';
  } catch { return 'ko'; }
}

let language = initialLanguage();
const listeners = new Set<() => void>();

// React 화면을 다시 만들지 않고 구독 중인 문구만 갱신한다.
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getPortalLanguage(): PortalLanguage { return language; }
export function usePortalLocale(): PortalLanguage { return useSyncExternalStore(subscribe, getPortalLanguage, () => 'ko'); }
export function t(source: string, values: unknown[] = []): string { return translatePortalText(source, language, values); }

// 언어를 바꿔도 필터와 폼 값, 현재 경로는 유지한다.
export function setPortalLanguage(next: PortalLanguage): void {
  language = next;
  document.documentElement.lang = next;
  const url = new URL(window.location.href); url.searchParams.set('lang', next);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  try { localStorage.setItem('vd-language', next); } catch { /* 현재 화면의 언어 선택은 유지한다. */ }
  listeners.forEach((listener) => listener());
}

// 새 탭으로 연 링크와 화면 이동에서도 선택한 언어를 이어 간다.
export function portalLanguagePath(to: string): string {
  const url = new URL(to, window.location.origin);
  url.searchParams.set('lang', language);
  return `${url.pathname}${url.search}${url.hash}`;
}
