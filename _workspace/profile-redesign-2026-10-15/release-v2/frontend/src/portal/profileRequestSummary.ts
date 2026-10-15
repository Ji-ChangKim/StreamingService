import { PROFILE_MEDIA_LABELS } from '../../../shared/profileMedia';
import type { PortalMedia } from '../../../shared/portal';
import { t } from './portalLocale';

// 심사 화면에서 영상과 소식의 제목·플랫폼·원문을 빠짐없이 읽을 수 있게 한다.
export function profileRequestArraySummary(key: string, value: unknown[]): string {
  return value.map((item) => typeof item === 'object' && item ? requestItemText(key, item as Record<string, unknown>) : String(item)).join('\n');
}

// 배열 항목은 종류에 맞는 공개 정보만 문자열로 요약한다.
function requestItemText(key: string, item: Record<string, unknown>): string {
  return key === 'media' ? `${item.provider} · ${t(PROFILE_MEDIA_LABELS[item.kind as PortalMedia['kind']] || String(item.kind))} · ${item.title} · ${item.url}${item.credit ? ` · ${item.credit}` : ''}`
    : key === 'notices' ? `${item.title} · ${item.url}` : `${item.platform}: ${item.channelUrl}`;
}
