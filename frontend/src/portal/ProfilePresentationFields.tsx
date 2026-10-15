import { PortalProfile, PORTAL_PLATFORMS } from '../../../shared/portal';
import { Plus, X } from 'lucide-react';
import { t, usePortalLocale } from './portalLocale';
import './profilePresentation.css';
import { ProfileMediaFields, ProfileNoticeFields } from './ProfileMediaFields';

// 등록·본인 수정·운영 정정에서 같은 선택 입력과 길이 제한을 제공한다.
export function ProfilePresentationFields({ profile, onChange, allowGroups = false }: {
  profile: PortalProfile; onChange: (patch: Partial<PortalProfile>) => void; allowGroups?: boolean;
}) {
  usePortalLocale();
  const channels = profile.additionalChannels || [];
  // 추가 채널 한 항목만 수정하며 다른 채널의 입력을 보존한다.
  const updateChannel = (index: number, patch: Partial<typeof channels[number]>) => onChange({ additionalChannels: channels.map((channel, i) => i === index ? { ...channel, ...patch } : channel) });
  return <div className="vd-presentation-fields">
    <label>{t('한 줄 소개')}<input maxLength={100} value={profile.headline || ''} onChange={(e) => onChange({ headline: e.target.value })} placeholder={t('나의 방송을 한 문장으로 소개해 주세요.')} /></label>
    <label>{t('개인 배너 이미지 주소')}<input type="url" maxLength={1000} value={profile.bannerUrl || ''} onChange={(e) => onChange({ bannerUrl: e.target.value })} placeholder="https://…" /><small>{t('사용 권한이 있는 이미지의 HTTPS 주소')}</small></label>
    <div className="vd-presentation-grid">
      <label>{t('X / SNS 주소')}<input type="url" maxLength={1000} value={profile.xUrl || ''} onChange={(e) => onChange({ xUrl: e.target.value })} placeholder="https://x.com/…" /></label>
      <label>{t('공식 홈페이지')}<input type="url" maxLength={1000} value={profile.websiteUrl || ''} onChange={(e) => onChange({ websiteUrl: e.target.value })} placeholder="https://…" /></label>
    </div>
    <label>{t('공식 카페')}<input type="url" maxLength={1000} value={profile.cafeUrl || ''} onChange={(e) => onChange({ cafeUrl: e.target.value })} placeholder="https://cafe.naver.com/…" /></label>
    <label>{t('공지 원문 링크 (선택)')}<input type="url" maxLength={1000} value={profile.noticeUrl || ''} onChange={(e) => onChange({ noticeUrl: e.target.value })} placeholder={t('https://x.com/… 또는 데뷔 공지 주소')} /><small>{t('SNS 계정과 데뷔 공지 주소를 각각 입력해 주세요.')}</small></label>
    <fieldset className="vd-presentation-channels"><legend>{t('추가 방송·영상 채널')}</legend><p className="vd-muted">{t('YouTube 등 다른 채널을 최대 4개까지 연결할 수 있어요.')}</p>
      {channels.map((channel, index) => <div className="vd-presentation-channel" key={index}>
        <label><span className="vd-sr-only">{t('방송 플랫폼')}</span><select value={channel.platform} onChange={(e) => updateChannel(index, { platform: e.target.value as PortalProfile['platform'] })}>{PORTAL_PLATFORMS.map((platform) => <option key={platform.id} value={platform.id}>{platform.label}</option>)}</select></label>
        <label><span className="vd-sr-only">{t('방송 채널 주소')}</span><input required type="url" maxLength={1000} value={channel.channelUrl} onChange={(e) => updateChannel(index, { channelUrl: e.target.value })} placeholder="https://…" /></label>
        <button type="button" className="vd-icon-button" aria-label={t('추가 채널 삭제')} onClick={() => onChange({ additionalChannels: channels.filter((_, i) => i !== index) })}><X size={16} /></button>
      </div>)}
      {channels.length < 4 && <button type="button" className="vd-button vd-small" onClick={() => onChange({ additionalChannels: [...channels, { platform: 'YOUTUBE', channelUrl: '' }] })}><Plus size={15} />{t('채널 추가')}</button>}
    </fieldset>
    <ProfileMediaFields profile={profile} onChange={onChange} />
    <label>{t('정기 방송 안내 (선택)')}<input maxLength={160} value={profile.regularSchedule || ''} onChange={(event) => onChange({ regularSchedule: event.target.value })} /></label>
    <label>{t('팬 가이드 (선택)')}<textarea rows={5} maxLength={1500} value={profile.fanGuide || ''} onChange={(event) => onChange({ fanGuide: event.target.value })} placeholder={t('공식 팬명·해시태그·방송 규칙을 안내해 주세요.')} /></label>
    <ProfileNoticeFields profile={profile} onChange={onChange} />
    {allowGroups && <div className="vd-presentation-group"><h3>{t('함께 데뷔하는 팀·기수')}</h3><p className="vd-muted">{t('공식 공지로 확인한 멤버에게만 같은 그룹 식별자를 지정해 주세요.')}</p><div className="vd-presentation-grid">
      <label>{t('데뷔 그룹 이름')}<input maxLength={100} value={profile.debutGroupName || ''} onChange={(e) => onChange({ debutGroupName: e.target.value })} placeholder="STELLIVE 4th Generation ABYSS" /></label>
      <label>{t('데뷔 그룹 식별자')}<input maxLength={80} pattern="[a-z0-9_-]+" value={profile.debutGroupId || ''} onChange={(e) => onChange({ debutGroupId: e.target.value })} placeholder="stellive-abyss-2026" /></label>
    </div></div>}
  </div>;
}
