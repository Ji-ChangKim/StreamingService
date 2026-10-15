import { t, usePortalLocale } from './portalLocale';
import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import { PortalProfile, PORTAL_PLATFORMS, PORTAL_TIMEZONES, portalDateKey, portalChannelUrl, portalUtc } from '../../../shared/portal';
import { CreatorCard, portalSchedule } from './PortalUi';
import { ProfilePresentationFields } from './ProfilePresentationFields';
import { ProfileExperience } from './CreatorProfile';
import { cleanProfilePresentation } from '../../../shared/profilePresentation';

// 등록과 본인 관리에서 동일한 소개 필드를 사용한다.
export function emptyPortalProfile(): PortalProfile {
  return { slug: '', displayName: '', description: '', avatarUrl: '', platform: 'CHZZK', channelUrl: '', countryCode: '', languages: [], tags: [], agency: '', xUrl: '', dateState: 'FIXED', debutDate: portalDateKey(new Date(), 'Asia/Seoul'), debutTime: '20:00', timezone: 'Asia/Seoul', startAtUtc: '', targetMonth: portalDateKey(new Date(), 'Asia/Seoul').slice(0, 7), ownerVerified: false, source: 'REGISTERED' };
}

// 접수 전 본인이 작성한 공개 내용을 미리 확인한다.
export function ProfileForm({ initial, allowNoDate = false, managing = false, onSubmit, onNavigate }: { initial: PortalProfile; allowNoDate?: boolean; managing?: boolean; onSubmit: (profile: PortalProfile, email: string) => Promise<void>; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [profile, setProfile] = useState(initial);
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [languages, setLanguages] = useState(initial.languages.join(', '));
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (patch: Partial<PortalProfile>) => setProfile((value) => ({ ...value, ...patch }));
  const split = (value: string) => [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))].slice(0, 8);
  const preview = { ...profile, slug: profile.slug || 'preview', displayName: profile.displayName || '나의 활동명', tags: split(tags), languages: split(languages), startAtUtc: profile.dateState === 'FIXED' ? portalUtc(profile.debutDate, profile.debutTime, profile.timezone) : '' };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!portalChannelUrl(profile.channelUrl, profile.platform)) { setError('선택한 플랫폼의 올바른 HTTPS 채널 주소를 입력해 주세요.'); return; }
    try { cleanProfilePresentation({ ...profile }); } catch (cause) { setError((cause as Error).message); return; }
    if (profile.dateState === 'FIXED' && !preview.startAtUtc) { setError('날짜·시간·시간대를 확인해 주세요.'); return; }
    if (step === 1) { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!agreed) { setError('공개 정보와 이용 동의를 확인해 주세요.'); return; }
    setBusy(true);
    try { await onSubmit(preview, email); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return <div className="vd-form-layout"><form onSubmit={submit} className="vd-form"><div className="vd-steps"><span className={step === 1 ? 'is-active' : 'is-complete'}>{step > 1 ? <Check size={15} /> : '1'} {t("소개와 일정")}</span><i /><span className={step === 2 ? 'is-active' : ''}>{t("2 공개 내용 확인")}</span></div>
    {step === 1 ? <>
      <section className="vd-form-section"><h2>{t("어떤 버튜버인가요?")}</h2><p>{t("팬이 처음 만나는 나의 소개를 작성해 주세요.")}</p><div className="vd-field-grid"><label>{t("활동명")}<span>*</span><input required maxLength={80} value={profile.displayName} onChange={(e) => update({ displayName: e.target.value })} placeholder={t("팬들에게 불리고 싶은 이름")} /></label><label>{t("활동 국가")}<select value={profile.countryCode} onChange={(e) => update({ countryCode: e.target.value })}><option value="">{t("선택하지 않음")}</option><option value="KR">{t("한국")}</option><option value="JP">{t("일본")}</option><option value="US">{t("미국")}</option><option value="GB">{t("영국")}</option><option value="TW">{t("대만")}</option><option value="OTHER">{t("기타 국가")}</option></select></label></div><label>{t("나의 소개")}<span>*</span><textarea required rows={4} maxLength={2000} value={profile.description} onChange={(e) => update({ description: e.target.value })} placeholder={t("어떤 방송을 하는지, 어떤 매력을 만나볼 수 있는지 소개해 주세요.")} /><small>{profile.description.length}{t("/2,000 · 작성한 내용이 소개 페이지에 공개됩니다.")}</small></label><div className="vd-field-grid"><label>{t("주요 콘텐츠")}<input value={tags} maxLength={250} onChange={(e) => setTags(e.target.value)} placeholder={t("노래, 게임, 이야기 · 쉼표로 구분")} /></label><label>{t("방송 언어")}<input value={languages} maxLength={200} onChange={(e) => setLanguages(e.target.value)} placeholder={t("한국어, 일본어 · 쉼표로 구분")} /></label></div><div className="vd-field-grid"><label>{t("프로필 이미지 주소")}<input type="url" value={profile.avatarUrl} maxLength={1000} onChange={(e) => update({ avatarUrl: e.target.value })} placeholder="https://…" /><small>{t("사용 권한이 있는 이미지의 HTTPS 주소")}</small></label><label>{t("소속")}<input value={profile.agency} maxLength={100} onChange={(e) => update({ agency: e.target.value })} placeholder={t("개인 활동이면 비워 두세요.")} /></label></div></section>
      <section className="vd-form-section"><h2>{t("어디서 만날 수 있나요?")}</h2><div className="vd-field-grid"><label>{t("방송 플랫폼")}<span>*</span><select disabled={managing} value={profile.platform} onChange={(e) => update({ platform: e.target.value as PortalProfile['platform'] })}>{PORTAL_PLATFORMS.map((p) => <option value={p.id} key={p.id}>{p.label}</option>)}</select></label><label>{t("방송 채널 주소")}<span>*</span><input required disabled={managing} type="url" value={profile.channelUrl} maxLength={1000} onChange={(e) => update({ channelUrl: e.target.value })} placeholder={t("나의 공식 방송 채널 주소")} /></label></div>{managing && <p className="vd-muted">{t("방송 채널 변경은 문의를 통해 신청해 주세요.")}</p>}</section>
      <section className="vd-form-section"><h2>{t("언제 데뷔하나요?")}</h2><label>{t("일정 상태")}<select value={profile.dateState} onChange={(e) => update({ dateState: e.target.value as PortalProfile['dateState'] })}><option value="FIXED">{t("날짜와 시간 확정")}</option><option value="TIME_TBD">{t("날짜 확정 · 시간 미정")}</option><option value="DATE_TBD">{t("예정 월만 확정 · 날짜 미정")}</option>{(allowNoDate || managing) && <option value="NONE">{t("데뷔 일정 없이 소개만 등록")}</option>}</select></label>{profile.dateState === 'DATE_TBD' ? <label>{t("데뷔 예정 월")}<span>*</span><input required type="month" value={profile.targetMonth} onChange={(e) => update({ targetMonth: e.target.value })} /></label> : profile.dateState !== 'NONE' && <div className="vd-field-grid"><label>{t("데뷔 날짜")}<span>*</span><input required type="date" value={profile.debutDate} onChange={(e) => update({ debutDate: e.target.value })} /></label>{profile.dateState === 'FIXED' && <label>{t("데뷔 시간")}<span>*</span><input required type="time" value={profile.debutTime} onChange={(e) => update({ debutTime: e.target.value })} /></label>}</div>}{profile.dateState !== 'NONE' && <label>{t("일정의 시간대")}<select value={profile.timezone} onChange={(e) => update({ timezone: e.target.value })}>{PORTAL_TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}</select></label>}</section>
      <section className="vd-form-section"><h2>{t("나만의 소개 꾸미기")}</h2><ProfilePresentationFields profile={profile} onChange={update} /></section>
      {!managing && <section className="vd-form-section"><h2>{t("접수 안내")}</h2><label>{t("연락 이메일")}<input type="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("선택 입력 · 공개되지 않습니다.")} /></label><p className="vd-muted">{t("접수 후 비공개 확인 키로 처리 상태를 확인할 수 있어요. 등록은 검토 후 공개됩니다.")}</p></section>}
    </> : <section className="vd-form-section"><h2>{t("이렇게 소개됩니다")}</h2><dl className="vd-review-list"><dt>{t("활동명")}</dt><dd>{preview.displayName}</dd><dt>{t("소개")}</dt><dd>{preview.description}</dd><dt>{t("방송 채널")}</dt><dd>{preview.channelUrl}</dd><dt>{t("데뷔 일정")}</dt><dd>{portalSchedule(preview, preview.timezone)}{preview.dateState !== 'NONE' && t(" · {0} 기준", [preview.timezone])}</dd><dt>{t("주요 콘텐츠")}</dt><dd>{preview.tags.join(' · ') || t("입력하지 않음")}</dd><dt>{t("방송 언어")}</dt><dd>{preview.languages.join(' · ') || t("입력하지 않음")}</dd></dl><label className="vd-checkbox"><input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>{t("공개할 정보와 이미지 사용 권한을 확인했으며,")}<a href="/terms" target="_blank" rel="noopener noreferrer">{t("이용약관")}</a> {t("및")}<a href="/privacy" target="_blank" rel="noopener noreferrer">{t("개인정보처리방침")}</a>{t("에 동의합니다.")}</span></label><p className="vd-muted">{managing ? t("저장하면 공개 소개에 반영됩니다.") : t("검토 후 공개됩니다. 연락 이메일은 공개되지 않으며 소유권은 별도로 확인합니다.")}</p></section>}
    <details className="vd-profile-preview"><summary>{t("개인 페이지 미리보기")}</summary><ProfileExperience preview profile={preview} onNavigate={() => undefined} /></details>
    {error && <p className="vd-error" role="alert">{t(error)}</p>}<div className="vd-form-actions">{step === 2 && <button className="vd-button" type="button" disabled={busy} onClick={() => setStep(1)}><ArrowLeft size={16} /> {t("수정하기")}</button>}<button className="vd-button vd-primary" type="submit" disabled={busy}>{busy ? t("처리 중…") : step === 1 ? <>{t("공개 내용 확인")}<ArrowRight size={17} /></> : <><Send size={16} />{managing ? t("변경 사항 저장") : t("등록 신청하기")}</>}</button></div></form><aside className="vd-form-preview"><span className="vd-eyebrow">{t("나의 소개 미리보기")}</span><CreatorCard preview profile={preview} onNavigate={() => undefined} timezone={profile.timezone} /><p>{t("입력한 내용을 바탕으로 보여주는 미리보기입니다.")}</p><button type="button" className="vd-text-button" onClick={() => onNavigate('/guide')}>{t("등록 가이드 보기")}<ArrowRight size={15} /></button></aside></div>;
}
