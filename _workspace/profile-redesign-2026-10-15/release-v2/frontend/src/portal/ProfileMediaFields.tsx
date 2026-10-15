import type { PortalMedia, PortalProfile } from '../../../shared/portal';
import { PROFILE_MEDIA_KINDS, PROFILE_MEDIA_LABELS, PROFILE_MEDIA_PROVIDERS, profileMediaItems } from '../../../shared/profileMedia';
import { Plus, ArrowUp, ArrowDown, X } from 'lucide-react';
import { t } from './portalLocale';
import './profileMedia.css';

// 영상의 편집 순서는 다른 항목의 내용을 바꾸지 않고 위치만 바꾼다.
function moveMedia(items: PortalMedia[], index: number, direction: number): PortalMedia[] {
  return items.map((item, position) => position === index ? items[index + direction] : position === index + direction ? items[index] : item);
}

// 등록·소유자 수정·운영자 정정에서 같은 플랫폼별 영상 목록을 편집한다.
export function ProfileMediaFields({ profile, onChange }: { profile: PortalProfile; onChange: (patch: Partial<PortalProfile>) => void }) {
  const items = profileMediaItems(profile);
  // 빈 입력도 편집하는 동안에는 유지해 주소와 제목을 차례대로 채울 수 있게 한다.
  const editing = profile.media ?? items;
  const updateItem = (index: number, patch: Partial<PortalMedia>) => onChange({ media: editing.map((item, position) => position === index ? { ...item, ...patch } : item) });
  return <fieldset className="vd-media-fields"><legend>{t('영상 모음')}</legend><p className="vd-muted">{t('개인 영상과 팀 PV, 클립·다시보기를 함께 등록할 수 있어요.')}</p>
    {editing.map((item, index) => <div className="vd-media-field" key={index}>
      <div className="vd-media-field-heading"><strong>{t('영상 {0}', [index + 1])}</strong><div>
        <button type="button" className="vd-icon-button" disabled={index === 0} aria-label={t('영상 위로 이동')} onClick={() => onChange({ media: moveMedia(editing, index, -1) })}><ArrowUp size={16} /></button>
        <button type="button" className="vd-icon-button" disabled={index === editing.length - 1} aria-label={t('영상 아래로 이동')} onClick={() => onChange({ media: moveMedia(editing, index, 1) })}><ArrowDown size={16} /></button>
        <button type="button" className="vd-icon-button" aria-label={t('영상 삭제')} onClick={() => onChange({ media: editing.filter((_, position) => position !== index) })}><X size={16} /></button>
      </div></div>
      <div className="vd-presentation-grid"><label>{t('영상 플랫폼')}<select value={item.provider} onChange={(event) => updateItem(index, { provider: event.target.value as PortalMedia['provider'] })}>{PROFILE_MEDIA_PROVIDERS.map((provider) => <option key={provider} value={provider}>{provider === 'YOUTUBE' ? 'YouTube' : provider === 'CHZZK' ? '치지직' : 'SOOP'}</option>)}</select></label>
        <label>{t('영상 종류')}<select value={item.kind} onChange={(event) => updateItem(index, { kind: event.target.value as PortalMedia['kind'], ...(event.target.value === 'GROUP_PV' ? { featured: false } : {}) })}>{PROFILE_MEDIA_KINDS.map((kind) => <option key={kind} value={kind}>{t(PROFILE_MEDIA_LABELS[kind])}</option>)}</select></label></div>
      <label>{t('영상 제목')}<input required maxLength={100} value={item.title} onChange={(event) => updateItem(index, { title: event.target.value })} /></label>
      <label>{t('영상 주소')}<input required type="url" maxLength={1000} value={item.url} onChange={(event) => updateItem(index, { url: event.target.value })} placeholder={item.provider === 'CHZZK' ? 'https://chzzk.naver.com/clips/…' : item.provider === 'SOOP' ? 'https://vod.sooplive.com/player/…' : 'https://youtu.be/…'} /></label>
      <div className="vd-presentation-grid"><label>{t('썸네일 주소 (선택)')}<input type="url" maxLength={1000} value={item.thumbnailUrl || ''} onChange={(event) => updateItem(index, { thumbnailUrl: event.target.value })} placeholder="https://…" /></label>
        <label>{t('제작·출처')}<input maxLength={80} value={item.credit || ''} onChange={(event) => updateItem(index, { credit: event.target.value })} /></label></div>
      <div className="vd-media-field-options"><label><input type="checkbox" checked={Boolean(item.featured)} disabled={item.kind === 'GROUP_PV'} onChange={(event) => onChange({ media: editing.map((entry, position) => ({ ...entry, featured: position === index && event.target.checked })) })} />{t('처음 만나는 대표 영상')}</label>
        <label><input type="checkbox" checked={Boolean(item.linkOnly)} onChange={(event) => updateItem(index, { linkOnly: event.target.checked })} />{t('원문에서 보기로 표시')}</label></div>
    </div>)}
    {editing.length < 12 && <button type="button" className="vd-button vd-small" onClick={() => onChange({ media: [...editing, { provider: 'YOUTUBE', kind: 'INTRO', title: '', url: '', featured: editing.length === 0 }] })}><Plus size={15} />{t('영상 추가')}</button>}
    <small>{t('치지직 다시보기는 원문에서 볼 수 있어요. 영상은 최대 12개까지 등록할 수 있어요.')}</small>
  </fieldset>;
}

// 주요 소식은 외부 게시물을 복제하지 않고 제목과 원문 주소로 연결한다.
export function ProfileNoticeFields({ profile, onChange }: { profile: PortalProfile; onChange: (patch: Partial<PortalProfile>) => void }) {
  const notices = profile.notices || [];
  return <fieldset className="vd-media-fields"><legend>{t('주요 소식')}</legend>{notices.map((notice, index) => <div className="vd-media-field" key={index}>
    <label>{t('소식 제목')}<input required maxLength={100} value={notice.title} onChange={(event) => onChange({ notices: notices.map((item, position) => position === index ? { ...item, title: event.target.value } : item) })} /></label>
    <label>{t('소식 원문 주소')}<input required type="url" maxLength={1000} value={notice.url} onChange={(event) => onChange({ notices: notices.map((item, position) => position === index ? { ...item, url: event.target.value } : item) })} /></label>
    <button type="button" className="vd-button vd-small" onClick={() => onChange({ notices: notices.filter((_, position) => position !== index) })}>{t('소식 삭제')}</button>
  </div>)}{notices.length < 3 && <button type="button" className="vd-button vd-small" onClick={() => onChange({ notices: [...notices, { title: '', url: '' }] })}><Plus size={15} />{t('소식 추가')}</button>}</fieldset>;
}
