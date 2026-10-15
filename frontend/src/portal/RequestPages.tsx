import { t, usePortalLocale } from './portalLocale';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { PortalRequest, RequestKind } from '../../../shared/portal';
import { PortalHeading, PortalLink, PortalState, CopyButton } from './PortalUi';
import { emptyPortalProfile } from './ProfileForm';
import { PortalRegistrationForm } from './PortalRegistrationForm';
import { portalApi, readPortalStorage, savePortalStorage } from './portalApi';
import { registrationSubmission, SubmissionAttempt } from './registrationSubmission';

export interface SavedReceipt { id: string; token: string; kind: RequestKind; slug: string; name: string }

// 문의 접수는 비공개 답변 조회에 필요한 확인 키를 보관한다.
export async function submitPortalRequest(body: Record<string, unknown>): Promise<SavedReceipt> {
  const result = await portalApi<{ id: string; token: string }>('/requests', { method: 'POST', body: JSON.stringify(body) });
  const receipt: SavedReceipt = { ...result, kind: body.kind as RequestKind, slug: String(body.slug || ''), name: String(body.displayName || body.subject || '신청') };
  const saved = readPortalStorage<SavedReceipt[]>('receipts', []);
  savePortalStorage('receipts', [receipt, ...saved].slice(0, 100));
  return receipt;
}

// 문의자는 비공개 확인 키로 운영자의 답변을 확인한다.
export function ReceiptSuccess({ receipt, onNavigate }: { receipt: SavedReceipt; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return <section className="vd-success"><CheckCircle2 size={44} /><h2>{t("문의가 접수됐어요")}</h2><p>{t("아래 확인 키로 운영자의 답변을 확인할 수 있어요.")}</p><div className="vd-key-box"><span>{t("접수 번호")}</span><code>{receipt.id}</code><span>{t("비공개 확인 키")}</span><code>{receipt.token}</code></div><p className="vd-muted">{t("다른 기기에서도 확인하려면 키를 별도로 보관해 주세요. 다른 사람에게 공유하지 마세요.")}</p><div className="vd-actions"><CopyButton value={t("접수 번호: {0}\n확인 키: {1}", [receipt.id, receipt.token])} label={t("접수 정보 복사")} /><PortalLink to={`/submissions/${receipt.id}`} onNavigate={onNavigate} className="vd-button vd-primary">{t("문의 답변 확인")}<ArrowRight size={16} /></PortalLink></div></section>;
}

// 데뷔·소개 등록은 관리자 접수 성공을 확인한 뒤 완료 안내만 표시한다.
export function RegistrationPage({ profileOnly, onNavigate }: { profileOnly: boolean; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [submitted, setSubmitted] = useState(false);
  const attempt = useRef<SubmissionAttempt | null>(null);
  const initial = emptyPortalProfile();
  initial.countryCode = 'KR';
  if (profileOnly) initial.dateState = 'NONE';
  const date = new URLSearchParams(window.location.search).get('date');
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) initial.debutDate = date;
  return <div className="vd-registration-page"><PortalHeading title={profileOnly ? t("버튜버 소개 등록") : t("데뷔 일정 등록")} description={t("방송 채널 정보를 불러오고 소개와 일정을 확인해 주세요.")} />{submitted ? <section className="vd-success"><CheckCircle2 size={44} /><h2>{t("등록 신청이 접수됐어요")}</h2><p>{t("운영자가 등록 정보와 방송 채널을 확인한 뒤 공개합니다.")}</p><PortalLink to="/" onNavigate={onNavigate} className="vd-button vd-primary">{t("데뷔 캘린더로")}<ArrowRight size={16} /></PortalLink></section> : <PortalRegistrationForm initial={initial} profileOnly={profileOnly} onSubmit={async (profile, email) => { await registrationSubmission({ ...profile, kind: profileOnly ? 'PROFILE' : 'DEBUT', contactEmail: email }, attempt); setSubmitted(true); }} />}</div>;
}

const STATUS_LABEL = { PENDING: '검토 대기', APPROVED: '처리 완료', REJECTED: '보완 필요' };
const KIND_LABEL: Record<RequestKind, string> = { DEBUT: '데뷔 등록', PROFILE: '버튜버 소개 등록', CLAIM: '소유권 확인', UPDATE: '소개 수정', CONTACT: '문의·정정 요청' };

// 접수 상태 조회는 주소에 키를 넣지 않고 비공개 헤더로 요청한다.
export function SubmissionStatusPage({ id, onNavigate }: { id: string; onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const saved = readPortalStorage<SavedReceipt[]>('receipts', []).find((r) => r.id === id);
  const [token, setToken] = useState(saved?.token || '');
  const [activeToken, setActiveToken] = useState(saved?.token || '');
  const [request, setRequest] = useState<PortalRequest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!activeToken) return;
    const abort = new AbortController(); setLoading(true); setError(''); setRequest(null);
    portalApi<{ request: PortalRequest }>(`/requests/${encodeURIComponent(id)}`, { signal: abort.signal, headers: { 'X-Request-Key': activeToken } }).then(({ request: value }) => {
      if (abort.signal.aborted) return;
      setRequest(value);
      const receipts = readPortalStorage<SavedReceipt[]>('receipts', []);
      const current: SavedReceipt = { id, token: activeToken, kind: value.kind, slug: value.slug, name: String(value.payload.displayName || value.payload.subject || '신청') };
      savePortalStorage('receipts', [current, ...receipts.filter((r) => r.id !== id)]);
    }).catch((e: Error) => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [id, activeToken, attempt]);
  return <><PortalHeading title={t("접수 상태 확인")} description={t("등록 검토 상태와 공개된 소개 주소를 확인하세요.")} /><div className="vd-narrow"><form className="vd-panel vd-form" onSubmit={(e) => { e.preventDefault(); setActiveToken(token.trim()); setAttempt((v) => v + 1); }}><label>{t("비공개 확인 키")}<input type="password" autoComplete="off" required value={token} onChange={(e) => setToken(e.target.value)} placeholder={t("접수할 때 발급받은 키")} maxLength={128} /></label><button className="vd-button" type="submit"><KeyRound size={16} /> {t("상태 확인")}</button></form>{loading && <PortalState loading title={t("접수 상태를 확인하고 있어요")} />}{error && <p className="vd-error" role="alert">{t(error)}</p>}{request && <section className="vd-panel vd-status-panel"><span className={`vd-status vd-status-${request.status.toLowerCase()}`}>{t(STATUS_LABEL[request.status])}</span><h2>{t(KIND_LABEL[request.kind])}</h2><p className="vd-muted">{t("접수일: {0}", [request.createdAt])} · {request.id}</p><div className="vd-status-steps"><span className="is-complete">{t("1 접수 완료")}</span><span className={request.status !== 'PENDING' ? 'is-complete' : 'is-active'}>{t("2 검토")}</span><span className={request.status === 'APPROVED' ? 'is-complete' : ''}>3 {request.kind === 'CLAIM' ? t("관리 권한 확인") : request.kind === 'CONTACT' ? t("답변 확인") : t("소개 공개")}</span></div><p>{request.status === 'PENDING' ? t("등록 정보와 채널을 확인하고 있어요. 처리 결과는 이 화면에서 확인할 수 있습니다.") : request.status === 'REJECTED' ? t("아래 내용을 확인하고 보완해 다시 신청해 주세요.") : t("신청 처리가 완료됐어요.")}</p>{request.note && <div className="vd-note"><strong>{t("운영자 안내")}</strong><p>{request.note}</p></div>}{request.slug && request.status === 'APPROVED' && <div className="vd-actions"><PortalLink className="vd-button vd-primary" to={`/creator/${encodeURIComponent(request.slug)}`} onNavigate={onNavigate}>{t("공개 소개 보기")}<ArrowRight size={16} /></PortalLink></div>}{request.status === 'REJECTED' && <PortalLink className="vd-button" to={request.kind === 'CLAIM' || request.kind === 'CONTACT' ? '/contact' : request.kind === 'PROFILE' ? '/creators/register' : '/upload'} onNavigate={onNavigate}>{t("보완 후 다시 신청")}</PortalLink>}</section>}</div></>;
}

