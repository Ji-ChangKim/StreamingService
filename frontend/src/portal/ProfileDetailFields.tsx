import type { PortalProfile } from '../../../shared/portal';
import { PROFILE_DETAIL_FIELDS } from '../../../shared/profileDetails';
import { t } from './portalLocale';

// 모든 등록·수정 화면에서 공개 캐릭터 스펙과 소개 카드 내용을 함께 편집한다.
export function ProfileDetailFields({ profile, onChange }: { profile: PortalProfile; onChange: (patch: Partial<PortalProfile>) => void }) {
  return <fieldset className="vd-presentation-channels"><legend>{t('상세 프로필')}</legend><p className="vd-muted">{t('공개된 캐릭터 정보만 입력해 주세요. 모르는 항목은 비워 두세요.')}</p><div className="vd-presentation-grid">
    {PROFILE_DETAIL_FIELDS.map(({ key, label, max }) => <label key={key}>{t(label)}{max > 100
      ? <textarea rows={3} maxLength={max} value={profile.details?.[key] || ''} onChange={(event) => onChange({ details: { ...profile.details, [key]: event.target.value } })} />
      : <input maxLength={max} value={profile.details?.[key] || ''} onChange={(event) => onChange({ details: { ...profile.details, [key]: event.target.value } })} />}</label>)}
  </div></fieldset>;
}
