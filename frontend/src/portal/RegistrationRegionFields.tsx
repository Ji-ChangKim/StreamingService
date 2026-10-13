import { PortalProfile, REGISTRATION_REGIONS } from '../../../shared/portal';
import { t } from './portalLocale';

const ZONE_LABELS: Record<string, string> = { 'Asia/Seoul': '한국 (KST)', 'Asia/Tokyo': '일본 (JST)', 'America/Los_Angeles': '미국 서부 (LA)', 'America/New_York': '미국 동부 (뉴욕)' };

// 국가 변경 시 해당 국가의 시간대로 전환하며 기존의 미확인 국가는 운영 화면에서 보존한다.
export function RegistrationRegionFields({ profile, onChange, allowUnknown = false }: { profile: PortalProfile; onChange: (patch: Partial<PortalProfile>) => void; allowUnknown?: boolean }) {
  const region = REGISTRATION_REGIONS.find((item) => item.code === profile.countryCode);
  const zones: readonly string[] = region?.zones || [profile.timezone];
  return <div className="vd-registration-date-grid"><label>{t("활동 국가")}<select value={profile.countryCode} required={!allowUnknown} onChange={(event) => { const next = REGISTRATION_REGIONS.find((item) => item.code === event.target.value); onChange({ countryCode: event.target.value, timezone: next?.zones[0] || profile.timezone }); }}>{allowUnknown && <option value="">{t("확인 필요")}</option>}{REGISTRATION_REGIONS.map((item) => <option value={item.code} key={item.code}>{t(item.label)}</option>)}</select></label><label>{t("일정 기준 시간대")}<select value={profile.timezone} onChange={(event) => onChange({ timezone: event.target.value })}>{[...new Set([...zones, ...(allowUnknown ? [profile.timezone] : [])])].map((zone) => <option value={zone} key={zone}>{t(ZONE_LABELS[zone] || zone)}</option>)}</select></label></div>;
}
