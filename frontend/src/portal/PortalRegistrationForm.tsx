import { t, usePortalLocale } from './portalLocale';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Link2, Loader2, Send } from 'lucide-react';
import { PortalProfile, PORTAL_PLATFORMS, portalChannelUrl, portalUtc, portalWebUrl } from '../../../shared/portal';
import { PlatformBadge, PortalAvatar } from './PortalUi';
import { detectRegistrationPlatform, fetchRegistrationProfile } from './registrationProfile';
import { RegistrationRegionFields } from './RegistrationRegionFields';
import { cleanProfilePresentation } from '../../../shared/profilePresentation';
import { ProfilePresentationFields } from './ProfilePresentationFields';
import { ProfileExperience } from './CreatorProfile';

// 기존 URL 중심 등록을 참조 이미지의 세 구역으로 복원한다.
export function PortalRegistrationForm({ initial, profileOnly, onSubmit }: {
  initial: PortalProfile;
  profileOnly: boolean;
  onSubmit: (profile: PortalProfile, email: string) => Promise<void>;
}) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [profile, setProfile] = useState(initial);
  const [url, setUrl] = useState('');
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [languages, setLanguages] = useState(initial.languages.join(', '));
  const lookupAbort = useRef<AbortController | null>(null);
  const platform = detectRegistrationPlatform(url);
  // 표시 중인 쉼표 입력은 그대로 두고 저장할 목록만 정리한다.
  const splitList = (value: string) => [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))].slice(0, 8);

  // 필드 변경은 입력된 소개의 나머지 값을 보존한다.
  const update = (patch: Partial<PortalProfile>) => setProfile((previous) => ({ ...previous, ...patch }));

  // 입력 주소가 바뀌면 이전 채널의 응답이 현재 내용을 덮지 못하게 한다.
  const changeUrl = (value: string) => {
    lookupAbort.current?.abort();
    setUrl(value);
    setLookup('idle');
    setLookupMessage('');
    setProfile((previous) => ({ ...previous, channelUrl: value, displayName: '', avatarUrl: '', description: '' }));
  };

  // 기존 자동 조회를 유지하며 명시적인 불러오기 버튼도 같은 조회를 실행한다.
  useEffect(() => {
    const controller = new AbortController();
    lookupAbort.current = controller;
    if (!platform || !portalChannelUrl(url, platform)) return () => controller.abort();
    const timer = window.setTimeout(async () => {
      setLookup('loading');
      setLookupMessage('방송국 정보를 불러오고 있어요.');
      try {
        const result = await fetchRegistrationProfile(url, platform, controller.signal);
        if (controller.signal.aborted) return;
        setProfile((previous) => ({ ...previous, platform, channelUrl: result.channelUrl, displayName: result.displayName, avatarUrl: result.avatarUrl, description: result.description.slice(0, 600) }));
        setLookup('success');
        setLookupMessage('방송국 정보를 불러왔어요. 활동명과 소개를 확인해 주세요.');
      } catch (cause) {
        if (controller.signal.aborted) return;
        setLookup('error');
        setLookupMessage((cause as Error).message);
      }
    }, lookupAttempt ? 0 : 500);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [url, platform, lookupAttempt]);

  // 공개 전 검토 흐름은 유지하고 별도 확인 단계를 강제하지 않는다.
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!platform || !portalChannelUrl(url, platform)) { setError('지원하는 방송 플랫폼의 HTTPS 주소를 입력해 주세요.'); return; }
    if (lookup === 'loading') { setError('방송국 정보를 불러온 뒤 다시 신청해 주세요.'); return; }
    const startAtUtc = profile.dateState === 'FIXED' ? portalUtc(profile.debutDate, profile.debutTime, profile.timezone) : '';
    if (profile.dateState === 'FIXED' && !startAtUtc) { setError('데뷔 날짜와 시간을 확인해 주세요.'); return; }
    if (!profile.displayName.trim()) { setError('채널 활동명을 입력해 주세요.'); return; }
    if (!profile.description.trim()) { setError('채널 소개를 입력해 주세요.'); return; }
    if (profile.xUrl && !portalWebUrl(profile.xUrl)) { setError('SNS 주소는 HTTPS 주소로 입력해 주세요.'); return; }
    try { cleanProfilePresentation({ ...profile }); } catch (cause) { setError((cause as Error).message); return; }
    if (!agreed) { setError('등록 정보의 공개와 이용 동의를 확인해 주세요.'); return; }
    setBusy(true);
    try { await onSubmit({ ...profile, platform, channelUrl: portalChannelUrl(profile.channelUrl, platform) || portalChannelUrl(url, platform), startAtUtc }, ''); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  };

  return <form className="vd-registration" onSubmit={submit}>
    <section className="vd-registration-section">
      <div className="vd-registration-section-heading"><h2><span>1</span> {t("방송 채널 URL 입력")}</h2><small>{t("치지직 · SOOP · 유튜브 · 트위치 지원")}</small></div>
      <label htmlFor="registration-url">{t("방송 채널 URL")}<b>*</b></label>
      <div className="vd-registration-url"><div><Link2 size={16} /><input id="registration-url" required type="url" value={url} onChange={(event) => changeUrl(event.target.value)} placeholder={t("방송국 또는 라이브 주소를 붙여넣어 주세요.")} maxLength={1000} /></div><button type="button" className="vd-button vd-primary" disabled={!platform || lookup === 'loading'} onClick={() => setLookupAttempt((value) => value + 1)}>{lookup === 'loading' ? <Loader2 size={16} className="vd-loading-icon" /> : <Link2 size={16} />} {t("정보 불러오기")}</button></div>
      <div className="vd-registration-url-note"><span className={platform ? 'is-valid' : ''}>{platform ? <><CheckCircle2 size={13} /> {t("지원하는 방송 채널: {0}", [PORTAL_PLATFORMS.find((item) => item.id === platform)?.label])}</> : t("방송 주소를 입력하면 플랫폼을 자동으로 인식합니다.")}</span><small>{t("활동명과 소개도 함께 불러와요.")}</small></div>
    </section>

    <section className="vd-registration-section">
      <div className="vd-registration-section-heading"><h2><span>2</span> {t("방송 채널 소개 확인")}</h2>{lookup === 'success' && <small className="vd-registration-auto">{t("채널 정보를 불러왔어요")}</small>}</div>
      <div className="vd-registration-profile"><PortalAvatar profile={profile} /><div>{platform && <PlatformBadge platform={platform} />}<strong>{profile.displayName || t("방송 채널을 확인해 주세요")}</strong><p>{profile.channelUrl || t("채널의 활동명과 프로필 이미지가 이곳에 표시됩니다.")}</p>{lookupMessage && <p className={lookup === 'error' ? 'is-error' : ''} role="status">{t(lookupMessage)}</p>}</div></div>
      <div className="vd-registration-label"><label htmlFor="registration-name">{t("채널 활동명")}<b>*</b></label><small>{t("영상 제목이나 홍보 문구 대신 실제 활동명을 입력해 주세요.")}</small></div>
      <input id="registration-name" required value={profile.displayName} onChange={(event) => update({ displayName: event.target.value })} maxLength={80} placeholder={t("채널 활동명")} />
      <div className="vd-registration-label"><label htmlFor="registration-description">{t("방송 소개")}<b>*</b></label><small>{t("불러온 소개글을 확인해 주세요.")}</small></div>
      <textarea id="registration-description" required value={profile.description} onChange={(event) => update({ description: event.target.value })} maxLength={600} rows={2} placeholder={t("주로 하는 콘텐츠, 방송 언어, 팬에게 소개하고 싶은 특징을 적어 주세요.")} />
      <div className="vd-registration-description-note"><small>{t("불러온 문구를 확인하고 나의 소개로 다듬어 주세요.")}</small><small>{profile.description.length} {t("/ 600자")}</small></div>
      <label htmlFor="registration-role">{t("신청자 구분")}<b>*</b></label><select id="registration-role" required value={profile.requesterRole || ''} onChange={(event) => update({ requesterRole: event.target.value as PortalProfile['requesterRole'] })}><option value="" disabled>{t("신청자 구분을 선택해 주세요.")}</option><option value="SELF">{t("본인 직접 신청")}</option><option value="AGENCY">{t("소속사·대리 신청")}</option><option value="FAN">{t("팬 제보")}</option></select>
    </section>

    <section className="vd-registration-section">
      <div className="vd-registration-section-heading"><h2><span>3</span> {profileOnly ? t("데뷔 일정 · 공지 링크") : t("데뷔 일정 설정")}</h2><small><b>*</b> {t("표시는 꼭 입력해 주세요.")}</small></div>
      <RegistrationRegionFields profile={profile} onChange={update} />
      <div className="vd-registration-date-options">{profileOnly && <label><input type="checkbox" checked={profile.dateState === 'NONE'} onChange={(event) => update({ dateState: event.target.checked ? 'NONE' : 'FIXED' })} /> {t("데뷔 일정 없이 소개만 등록")}</label>}{profile.dateState !== 'NONE' && <label><input type="checkbox" checked={profile.dateState === 'DATE_TBD'} onChange={(event) => update({ dateState: event.target.checked ? 'DATE_TBD' : 'FIXED' })} /> {t("데뷔 날짜 미정")}</label>}</div>
      {profile.dateState === 'DATE_TBD' ? <div><label htmlFor="registration-month">{t("데뷔 예정 월")}<b>*</b></label><input id="registration-month" required type="month" value={profile.targetMonth} onChange={(event) => update({ targetMonth: event.target.value })} /></div> : profile.dateState !== 'NONE' && <div className="vd-registration-date-grid"><div><label htmlFor="registration-date">{t("데뷔 일자")}<b>*</b></label><input id="registration-date" required type="date" value={profile.debutDate} onChange={(event) => update({ debutDate: event.target.value })} /></div><div><label htmlFor="registration-time">{t("데뷔 시간")}<b>*</b></label><div className="vd-registration-time"><input id="registration-time" type="time" required={profile.dateState === 'FIXED'} disabled={profile.dateState === 'TIME_TBD'} value={profile.debutTime} onChange={(event) => update({ debutTime: event.target.value })} /><label><input type="checkbox" checked={profile.dateState === 'TIME_TBD'} onChange={(event) => update({ dateState: event.target.checked ? 'TIME_TBD' : 'FIXED' })} /> {t("시간 미정")}</label></div></div></div>}
      {profile.dateState !== 'NONE' && <p className="vd-registration-timezone"><Clock size={14} /> {t("선택한 시간대의 현지 시각으로 입력해 주세요.")}</p>}
    </section>
    <section className="vd-registration-section"><div className="vd-registration-section-heading"><h2><span>4</span> {t('나만의 소개 꾸미기')}</h2><small>{t('선택 입력')}</small></div>
      <div className="vd-presentation-fields"><div className="vd-presentation-grid"><label>{t('소속')}<input maxLength={100} value={profile.agency} onChange={(e) => update({ agency: e.target.value })} placeholder={t('개인 활동이면 비워 두세요.')} /></label><label>{t('프로필 이미지 주소')}<input type="url" maxLength={1000} value={profile.avatarUrl} onChange={(e) => update({ avatarUrl: e.target.value })} placeholder="https://…" /></label></div>
      <div className="vd-presentation-grid"><label>{t('주요 콘텐츠')}<input maxLength={250} value={tags} onChange={(e) => { setTags(e.target.value); update({ tags: splitList(e.target.value) }); }} placeholder={t('노래, 게임, 이야기 · 쉼표로 구분')} /></label><label>{t('방송 언어')}<input maxLength={200} value={languages} onChange={(e) => { setLanguages(e.target.value); update({ languages: splitList(e.target.value) }); }} placeholder={t('한국어, 일본어 · 쉼표로 구분')} /></label></div>
      <ProfilePresentationFields profile={profile} onChange={update} /></div><details className="vd-profile-preview"><summary>{t('개인 페이지 미리보기')}</summary><ProfileExperience preview profile={{ ...profile, platform: platform || profile.platform, displayName: profile.displayName || t('나의 활동명'), startAtUtc: profile.dateState === 'FIXED' ? portalUtc(profile.debutDate, profile.debutTime, profile.timezone) : '' }} onNavigate={() => undefined} /></details></section>
    {error && <p className="vd-error" role="alert">{t(error)}</p>}
    <div className="vd-registration-submit"><label><input type="checkbox" required checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>{t("등록 정보의 공개와")} <a href="/terms" target="_blank" rel="noopener noreferrer">{t("이용약관")}</a>·<a href="/privacy" target="_blank" rel="noopener noreferrer">{t("개인정보처리방침")}</a>{t("에 동의합니다.")}</span></label><button type="submit" disabled={busy || lookup === 'loading'} className="vd-button"><Send size={16} />{busy ? t("신청 중…") : profileOnly ? t("소개 등록 신청") : t("데뷔 일정 등록 신청")}</button></div>
    {/* 공개 기준을 신청 단계에서 안내하고 팬 제보에는 공식 출처를 요청한다. */}
    <section className="vd-panel"><h2>{t('등록 전에 확인해 주세요')}</h2><p>{t('허위 정보, 사칭, 권리 침해 자료, 성적으로 노골적이거나 자극적인 자료, 타인을 비하하거나 괴롭히는 내용은 공개하지 않습니다.')}</p><p>{t('팬 제보에는 확인 가능한 공식 출처를 함께 남겨 주세요.')}</p></section>
    <p className="vd-registration-review-note">{t("등록 신청은 운영자 검토 후 공개됩니다.")}</p>
  </form>;
}
