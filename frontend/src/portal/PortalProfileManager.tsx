import { FormEvent, useEffect, useState } from 'react';
import { PortalProfile } from '../../../shared/portal';
import { portalApi } from './portalApi';
import { PortalDialog, PortalState } from './PortalUi';
import { RegistrationRegionFields } from './RegistrationRegionFields';
import { t } from './portalLocale';
import { ProfilePresentationFields } from './ProfilePresentationFields';
import { ProfileExperience } from './CreatorProfile';
import { portalUtc } from '../../../shared/portal';

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
  const update = (patch: Partial<PortalProfile>) => setDraft((value) => value ? { ...value, ...patch } : value);
  // 버전과 사유를 함께 저장하고 성공한 뒤 목록을 다시 읽는다.
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected || !draft) return; setBusy(true); setError('');
    try {
      await portalApi(`/admin/profiles/${encodeURIComponent(selected.profile.slug)}`, { method: 'PUT', headers: { 'X-Admin-Key': token }, body: JSON.stringify({ profile: draft, revision: selected.revision, reason }) });
      setSelected(null); setDraft(null); setReload((value) => value + 1); setMessage('공개 정보를 수정했습니다.'); onRefreshProfiles();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };
  const filtered = profiles.filter(({ profile }) => `${profile.displayName} ${profile.channelUrl}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <>
    <div className="vd-section-heading"><h2>{t("공개 정보 수정")}</h2><button className="vd-button" type="button" onClick={() => setReload((value) => value + 1)}>{t("새로고침")}</button></div>
    <label className="vd-form">{t("버튜버 이름·소개 검색")}<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    {message && <p role="status">{t(message)}</p>}{error && !selected && <p className="vd-error" role="alert">{t(error)}</p>}
    {loading ? <PortalState loading title={t("버튜버 소개를 불러오는 중이에요")} /> : <div className="vd-admin-list">{filtered.slice(0, 50).map((item) => <button key={item.profile.slug} type="button" className="vd-panel vd-admin-row" onClick={() => { setSelected(item); setDraft({ ...item.profile }); setReason(''); setError(''); }}><strong>{item.profile.displayName}</strong><span>{item.profile.platform}</span><span>{item.profile.slug}</span><span>{t("수정하기")}</span></button>)}{filtered.length > 50 && <p>{t("이름이나 채널 주소로 검색해 주세요.")}</p>}</div>}
    {selected && draft && <PortalDialog title={t("공개 정보 수정")} onClose={() => { if (!busy) { setSelected(null); setDraft(null); } }}><form className="vd-form" onSubmit={save}>
      <p>{draft.channelUrl}</p>
      <label>{t("채널 활동명")}<input required maxLength={80} value={draft.displayName} onChange={(event) => update({ displayName: event.target.value })} /></label>
      <label>{t("채널 대표 문구 / 소개글")}<textarea rows={4} maxLength={2000} value={draft.description} onChange={(event) => update({ description: event.target.value })} /></label>
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
