import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { PortalProfile } from '../../../shared/portal';
import { WIKI_FIELDS, wikiEvidenceUrl, type WikiSupportMessage } from '../../../shared/wikiParticipation';
import { portalApi } from './portalApi';
import { submitPortalRequest, type SavedReceipt } from './RequestPages';
import { t, portalLanguagePath, getPortalLanguage } from './portalLocale';

// 공식 출처가 포함된 제보를 기존 비공개 검토 대기열에 접수한다.
export function WikiEvidenceModal({ profile, close }: { profile: PortalProfile; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [receipt, setReceipt] = useState<SavedReceipt>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; dialog.current?.showModal(); return () => previous?.focus(); }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const evidenceUrl = wikiEvidenceUrl(fields.get('evidence'));
    if (!evidenceUrl) { setError(t('내용을 확인할 수 있는 공식 채널의 게시물 주소를 입력해 주세요.')); return; }
    setError(''); setBusy(true);
    try { setReceipt(await submitPortalRequest({ kind: 'CONTACT', requestType: 'WIKI_REVISION', slug: profile.slug, targetField: fields.get('field'), message: fields.get('value'), evidenceUrl })); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <dialog className="wiki-contribution-dialog" ref={dialog} aria-label={t('정보 제보 및 수정하기')} onCancel={event => { if (busy) event.preventDefault(); else close(); }} onClick={event => { if (!busy && event.target === event.currentTarget) close(); }}><div className="modal-head"><button className="icon-button" type="button" aria-label={t('닫기')} disabled={busy} onClick={close}><X size={20} /></button></div>{receipt ? <div className="submission-success"><h2>{t('제보가 접수됐어요')}</h2><p>{t('출처를 확인한 뒤 도감에 반영해요.')}</p><a className="primary" href={portalLanguagePath(`/submissions/${receipt.id}`)}>{t('접수 내용 확인')}</a></div> : <><span className="eyebrow">{t('함께 만드는 도감')}</span><h2>{t('{0}의 이야기를 알려주세요', [profile.displayName])}</h2><p className="modal-description">{t('공식 출처에서 확인할 수 있는 정보만 함께 담아요.')}</p><form onSubmit={submit}><label>{t('수정할 항목')}<select name="field" required disabled={busy}><option value="">{t('항목을 선택해 주세요')}</option>{WIKI_FIELDS.map(([id, label]) => <option value={id} key={id}>{t(label)}</option>)}</select></label><label>{t('추가하거나 수정할 내용')}<textarea name="value" required maxLength={2000} rows={4} disabled={busy} placeholder={t('확인한 내용을 적어 주세요.')} /></label><label>{t('공식 출처 URL')}<span className="required">{t('필수')}</span><input name="evidence" type="url" required maxLength={1000} disabled={busy} placeholder="https://x.com/…/status/…" /></label><small>{t('공식 X, YouTube, 치지직, SOOP, 네이버 카페의 게시물')}</small>{error && <p className="form-error" role="alert">{t(error)}</p>}<div className="review-note">{t('출처를 검토한 뒤 도감에 반영해요.')}</div><button className="primary submit" disabled={busy} type="submit">{t(busy ? '접수 중…' : '정보 제보하기')}</button></form></>}</dialog>;
}

// 응원은 서버 승인 자료만 보여주며 접수 성공 전에는 완료 안내를 만들지 않는다.
export function WikiGuestbook({ profile }: { profile: PortalProfile }) {
  const [messages, setMessages] = useState<WikiSupportMessage[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<SavedReceipt>();
  useEffect(() => { const abort = new AbortController(); setLoading(true); setError(''); void portalApi<{ messages: WikiSupportMessage[] }>(`/profiles/${encodeURIComponent(profile.slug)}/support`, { signal: abort.signal }).then(data => { if (!abort.signal.aborted) setMessages(data.messages); }).catch(() => { if (!abort.signal.aborted) setError('응원 메시지를 불러오지 못했어요.'); }).finally(() => { if (!abort.signal.aborted) setLoading(false); }); return () => abort.abort(); }, [profile.slug]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try { setReceipt(await submitPortalRequest({ kind: 'CONTACT', requestType: 'SUPPORT', slug: profile.slug, message: note })); setNote(''); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <section className="content-panel guestbook"><div className="section-title"><div><h2>{t('첫 무대를 함께 응원해요')}</h2></div><span>{t('응원 방명록')}</span></div><p className="muted">{t('첫 인사를 앞둔 {0}에게 따뜻한 한마디를 남겨주세요.', [profile.displayName])}</p><form onSubmit={submit}><input aria-label={t('응원 메시지')} value={note} onChange={event => setNote(event.target.value)} minLength={2} maxLength={150} required disabled={busy} placeholder={t('당신의 첫 무대를 응원해요!')} /><button className="primary" disabled={busy}>{t(busy ? '접수 중…' : '응원 남기기')}</button></form><p className="participation-note">{t('응원 메시지는 확인 후 공개해요.')}</p>{receipt && <p className="participation-success" role="status">{t('응원이 접수됐어요.')} <a href={portalLanguagePath(`/submissions/${receipt.id}`)}>{t('접수 내용 확인')}</a></p>}{error && <p className="form-error" role="alert">{t(error)}</p>}{loading ? <div className="guest-empty">{t('응원 메시지를 불러오는 중이에요.')}</div> : messages.length ? messages.map(message => <div className="guest-message" key={message.id}><p>{message.message}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleDateString(getPortalLanguage())}</time></div>) : !error && <div className="guest-empty">{t('가장 먼저 응원을 남겨보세요.')}</div>}</section>;
}
