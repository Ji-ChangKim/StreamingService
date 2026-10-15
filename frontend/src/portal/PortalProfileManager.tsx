import { FormEvent, useEffect, useState } from 'react';
import { PortalProfile } from '../../../shared/portal';
import { portalApi } from './portalApi';
import { PortalDialog, PortalState } from './PortalUi';
import { RegistrationRegionFields } from './RegistrationRegionFields';
import { t } from './portalLocale';
import { ProfilePresentationFields } from './ProfilePresentationFields';
import { ProfileExperience } from './CreatorProfile';
import { portalUtc } from '../../../shared/portal';
import { isPublicProfile, looksLikeVideoTitle, needsContentReview } from '../../../shared/contentReview';

interface ManagedProfile { profile: PortalProfile; revision: string }
interface HistoryEntry { id: string; before: PortalProfile; reason: string; createdAt: string }

// 공개 정보 정정과 이력 복구는 관리자 화면에서만 제공한다.
export function PortalProfileManager({ token, onRefreshProfiles }: { token: string; onRefreshProfiles: () => void }) {
  const [profiles, setProfiles] = useState<ManagedProfile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<ManagedProfile | null>(null);
  const [draft, setDraft] = useState<PortalProfile | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [message, setMessage] = useState('');
  // 공개와 보류를 명시적으로 선택하고 자료를 열 때마다 검토 확인을 초기화한다.
  const [publicationState, setPublicationState] = useState<'APPROVED' | 'HOLD'>('HOLD');
  const [contentChecked, setContentChecked] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    portalApi<{ profiles: ManagedProfile[] }>('/admin/profiles', { signal: controller.signal, headers: { 'X-Admin-Key': token } }).then((data) => { if (!controller.signal.aborted) setProfiles(data.profiles); }).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, reload]);
  useEffect(() => {
    setHistory([]); setHistoryError(''); if (!selected) return;
    const controller = new AbortController();
    portalApi<{ history: HistoryEntry[] }>(`/admin/profiles/${encodeURIComponent(selected.profile.slug)}/history`, { signal: controller.signal, headers: { 'X-Admin-Key': token } }).then((data) => { if (!controller.signal.aborted) setHistory(data.history); }).catch((cause) => { if (!controller.signal.aborted) setHistoryError(cause.message); });
    return () => controller.abort();
  }, [selected, token]);
  // 수정 초안은 저장 전까지 공개 정보에 반영하지 않는다.
  const update = (patch: Partial<PortalProfile>) => { setContentChecked(false); setDraft((value) => value ? { ...value, ...patch } : value); };
  // 버전과 사유를 함께 저장하고 성공한 뒤 목록을 다시 읽는다.
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected || !draft) return; setBusy(true); setError('');
    try {
      await portalApi(`/admin/profiles/${encodeURIComponent(selected.profile.slug)}`, { method: 'PUT', headers: { 'X-Admin-Key': token }, body: JSON.stringify({ profile: draft, revision: selected.revision, reason, publicationState, contentChecked }) });
      setSelected(null); setDraft(null); setReload((value) => value + 1); setMessage('검토 상태와 정보를 저장했습니다.'); onRefreshProfiles();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };
  const filtered = profiles.filter(({ profile }) => `${profile.displayName} ${profile.channelUrl}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a, b) => Number(isPublicProfile(a.profile)) - Number(isPublicProfile(b.profile)));
  return <>
    <div className="vd-section-heading"><h2>{t("콘텐츠 검토·공개 관리")}</h2><button className="vd-button" type="button" onClick={() => setReload((value) => value + 1)}>{t("새로고침")}</button></div>
    <p>{t('활동명·소속·일정의 공식 출처와 소개·이미지·영상의 내용 및 사용 권한을 확인한 뒤 공개하세요. 미검토 자료는 공개되지 않습니다.')}</p>
    <label className="vd-form">{t("버튜버 이름·소개 검색")}<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    {message && <p role="status">{t(message)}</p>}{error && !selected && <p className="vd-error" role="alert">{t(error)}</p>}
    {loading ? <PortalState loading title={t("버튜버 소개를 불러오는 중이에요")} /> : <div className="vd-admin-list">{filtered.slice(0, 50).map((item) => <button key={item.profile.slug} type="button" className="vd-panel vd-admin-row" onClick={() => { setSelected(item); setDraft({ ...item.profile }); setReason(''); setError(''); setPublicationState(isPublicProfile(item.profile) ? 'APPROVED' : 'HOLD'); setContentChecked(false); }}><strong>{item.profile.displayName}</strong><span>{item.profile.platform}</span><span>{item.profile.slug}</span><span>{isPublicProfile(item.profile) ? t("공개 중") : t("검토·보류")}</span></button>)}{filtered.length > 50 && <p>{t("이름이나 채널 주소로 검색해 주세요.")}</p>}</div>}
    {selected && draft && <PortalDialog title={t("공개 정보 수정")} onClose={() => { if (!busy) { setSelected(null); setDraft(null); } }}><form className="vd-form" onSubmit={save}>
      <p>{draft.channelUrl}</p>
      <label>{t('공개 상태')}<select value={publicationState} onChange={(event) => { setPublicationState(event.target.value as 'APPROVED' | 'HOLD'); setContentChecked(false); }}><option value="HOLD">{t('공개 보류')}</option><option value="APPROVED">{t('검토 후 공개')}</option></select></label>
      {(looksLikeVideoTitle(draft.displayName) || needsContentReview(draft.description)) && <p className="vd-error">{t('활동명 또는 소개에 재검토가 필요한 표현이 있습니다. 공식 출처와 내용을 확인해 주세요.')}</p>}
      {publicationState === 'APPROVED' && <label className="vd-checkbox"><input type="checkbox" required checked={contentChecked} onChange={(event) => setContentChecked(event.target.checked)} /><span>{t('활동명·소속·일정의 출처와 소개·이미지·영상의 내용 및 사용 권한을 직접 확인했습니다.')}</span></label>}
      <label>{t("채널 활동명")}<input required maxLength={80} value={draft.displayName} onChange={(event) => update({ displayName: event.target.value })} /></label>
      <label>{t("채널 대표 문구 / 소개글")}<textarea rows={4} maxLength={2000} value={draft.description} onChange={(event) => update({ description: event.target.value })} /></label>
      <label>{t('소속')}<input maxLength={100} value={draft.agency} onChange={(event) => update({ agency: event.target.value })} /></label>
      <label>{t('프로필 이미지 주소')}<input type="url" maxLength={1000} value={draft.avatarUrl} onChange={(event) => update({ avatarUrl: event.target.value })} /></label>
      <RegistrationRegionFields profile={draft} onChange={update} allowUnknown />
      <label>{t("일정 상태")}<select value={draft.dateState} onChange={(event) => update({ dateState: event.target.value as PortalProfile['dateState'] })}><option value="FIXED">{t("확정")}</option><option value="TIME_TBD">{t("시간 미정")}</option><option value="DATE_TBD">{t("데뷔 날짜 미정")}</option><option value="NONE">{t("데뷔 일정 없이 소개만 등록")}</option></select></label>
      {['FIXED', 'TIME_TBD'].includes(draft.dateState) && <label>{t("데뷔 일자")}<input type="date" required value={draft.debutDate} onChange={(event) => update({ debutDate: event.target.value })} /></label>}
      {draft.dateState === 'FIXED' && <label>{t("데뷔 시간")}<input type="time" required value={draft.debutTime} onChange={(event) => update({ debutTime: event.target.value })} /></label>}
      {draft.dateState === 'DATE_TBD' && <label>{t("데뷔 예정 월")}<input type="month" required value={draft.targetMonth} onChange={(event) => update({ targetMonth: event.target.value })} /></label>}
      <ProfilePresentationFields profile={draft} onChange={update} allowGroups />
      <details className="vd-profile-preview"><summary>{t('개인 페이지 미리보기')}</summary><ProfileExperience preview profile={{ ...draft, startAtUtc: draft.dateState === 'FIXED' ? portalUtc(draft.debutDate, draft.debutTime, draft.timezone) : '' }} onNavigate={() => undefined} /></details>
      <label>{t("변경 사유")}<textarea required maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
      {error && <p className="vd-error" role="alert">{t(error)}</p>}<button disabled={busy} type="submit" className="vd-button vd-primary">{busy ? t("저장 중…") : t("공개 정보 저장")}</button>
      <h3>{t("변경 이력")}</h3>{historyError && <p className="vd-error">{t(historyError)}</p>}{!history.length && !historyError && <p>{t("아직 변경 이력이 없습니다.")}</p>}
      {history.map((item) => <div className="vd-panel" key={item.id}><strong>{item.createdAt}</strong><p>{item.reason}</p><button type="button" disabled={busy} className="vd-button" onClick={() => { setDraft({ ...item.before }); setReason(t("이전 내용 복구: {0}", [item.createdAt])); }}>{t("변경 전 내용 불러오기")}</button></div>)}
    </form></PortalDialog>}
  </>;
}
