import { t, usePortalLocale } from './portalLocale';
import { FormEvent, useState } from 'react';
import { ArrowRight, CalendarDays, Megaphone, Search, Send } from 'lucide-react';
import { PortalHeading, PortalLink } from './PortalUi';
import { ReceiptSuccess, SavedReceipt, submitPortalRequest } from './RequestPages';

// 서비스가 제공하는 기능을 소개하고 자세한 절차는 이용 가이드로 연결한다.
export function PortalAbout({ onNavigate }: { onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return (
    <>
      <PortalHeading
        title={t("서비스 소개")}
        description={t("데뷔 일정과 방송 소개로 버튜버와 팬의 첫 만남을 연결합니다.")}
      />

      <section className="vd-about-intro vd-panel">
        <h2>{t("누가 데뷔하는지, 어떤 방송을 하는지.")}</h2>
        <p>{t("여러 나라와 방송 플랫폼에서 새로운 버튜버가 첫 방송을 시작합니다. VDébut에서는 데뷔 일정과 소개를 함께 살펴보고, 마음이 가는 버튜버의 방송 채널로 찾아갈 수 있어요.")}</p>
      </section>

      <div className="vd-info-cards">
        {[
          { icon: <CalendarDays />, title: t("언제 만날까요?"), text: t("달력에서 데뷔 날짜와 시간, 방송 플랫폼을 확인하세요."), to: '/', link: t("데뷔 일정 보기") },
          { icon: <Search />, title: t("어떤 버튜버일까요?"), text: t("소개와 주요 콘텐츠를 살펴보며 내 취향의 방송을 찾아보세요."), to: '/creators', link: t("버튜버 둘러보기") },
          { icon: <Megaphone />, title: t("나를 소개하고 싶어요"), text: t("신규 데뷔 소식이나 활동 중인 나의 소개를 직접 등록하세요."), to: '/upload', link: t("데뷔 소식 등록") }
        ].map((card) => (
          <section className="vd-panel" key={card.title}>
            {card.icon}
            <h2>{card.title}</h2>
            <p>{card.text}</p>
            <PortalLink to={card.to} onNavigate={onNavigate} className="vd-text-button">{card.link} <ArrowRight size={16} /></PortalLink>
          </section>
        ))}
      </div>

      <section className="vd-panel vd-section"><h2>{t("VDébut 이용 가이드")}</h2><p>{t("일정 저장, 시간대 확인, 소개 작성과 변경 안내를 살펴보세요.")}</p><PortalLink to="/guide" onNavigate={onNavigate} className="vd-button">{t("이용 가이드")}</PortalLink></section>
    </>
  );
}

// 문의하기는 접수 번호로 답변까지 확인한다.
export function PortalContact({ onNavigate }: { onNavigate: (path: string) => void }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  const [receipt, setReceipt] = useState<SavedReceipt | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const fields = new FormData(event.currentTarget); setBusy(true); setError('');
    try { setReceipt(await submitPortalRequest({ kind: 'CONTACT', subject: fields.get('subject'), message: fields.get('message'), contactEmail: fields.get('email'), pageUrl: fields.get('pageUrl') })); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return <><PortalHeading title={t("문의하기")} description={t("해당 페이지 주소와 확인이 필요한 내용을 남겨 주세요. 일정 변경, 소개 수정·삭제, 권리 침해와 부적절한 콘텐츠 신고를 접수할 수 있습니다.")} />{receipt ? <ReceiptSuccess receipt={receipt} onNavigate={onNavigate} /> : <div className="vd-narrow"><form className="vd-panel vd-form" onSubmit={submit}><label>{t("문의 유형")}<select name="subject"><option>{t("정보 정정")}</option><option>{t("일정 수정")}</option><option>{t("소개 삭제 요청")}</option><option>{t("등록 접수 확인")}</option><option>{t("기능 제안")}</option><option>{t("부적절한 콘텐츠 신고")}</option><option>{t("이미지·소개글 권리 침해")}</option><option>{t("사칭·채널 정보 오류")}</option><option>{t("기타 문의")}</option></select></label><label>{t("관련 페이지 주소")}<input type="url" name="pageUrl" maxLength={1000} defaultValue={new URLSearchParams(window.location.search).get("pageUrl") || ""} placeholder={t("수정이 필요한 소개 페이지 주소")} /></label><label>{t("문의 내용")}<span>*</span><textarea name="message" required rows={6} maxLength={2000} placeholder={t("문제가 있는 부분과 확인 가능한 출처를 적어 주세요. 신고에 필요하지 않은 개인정보는 입력하지 마세요.")} /></label><label>{t("연락 이메일")}<input name="email" type="email" maxLength={200} placeholder={t("선택 입력 · 공개되지 않습니다.")} /></label><label className="vd-checkbox"><input type="checkbox" required /><span>{t("문의 처리에 필요한 정보 제공과 개인정보처리방침에 동의합니다.")}</span></label><p className="vd-muted">{t("접수 후 비공개 확인 키로 답변을 확인할 수 있어요.")}</p>{error && <p className="vd-error" role="alert">{t(error)}</p>}<button type="submit" disabled={busy} className="vd-button vd-primary"><Send size={16} />{busy ? t("접수 중…") : t("문의 접수하기")}</button></form><p className="vd-muted">{t("이메일 문의:")}<a href="mailto:ru_0120@naver.com">ru_0120@naver.com</a></p></div>}</>;
}

// 개발 플랫폼에서 사용하는 데이터와 권한을 기존 정책에 덧붙여 설명한다.
export function PortalPolicySupplement({ terms }: { terms: boolean }) {
  usePortalLocale(); // 언어 변경은 화면 상태를 유지한 채 문구만 갱신한다.

  return <section className="vd-panel vd-policy-note"><h2>{terms ? t("등록·정보 정정 안내") : t("직접 등록·접수 확인 정보 안내")}</h2>{terms ? <><p>{t("등록 신청은 검토 후 공개됩니다. 타인의 정보나 이미지에는 사용 권한과 출처가 필요합니다.")}</p><p>{t("등록 정보의 수정·삭제와 채널 변경은 문의 화면으로 요청할 수 있습니다. 운영자가 요청 내용과 공식 채널을 확인한 뒤 처리합니다.")}</p></> : <><p>{t("활동명·소개·방송 채널·콘텐츠·일정은 소개 공개를 위해 사용됩니다. 선택 입력한 연락 이메일과 문의 첨부 내용은 접수 확인·문의 처리에 사용되며 공개 소개에 표시되지 않습니다.")}</p><p>{t("문의 답변 조회용 확인 키와 관심 목록은 사용한 브라우저에 저장됩니다. 데뷔·소개 등록에는 개인 관리용 확인 키를 표시하거나 브라우저에 저장하지 않습니다. 서버에는 확인 키의 해시와 과도한 접수 제한을 위한 접속 주소 해시가 저장됩니다. 관리자는 접수 처리에 필요한 정보를 조회합니다.")}</p><p>{t("정보 열람·정정·삭제는 문의 화면 또는 ru_0120@naver.com으로 요청할 수 있습니다.")}</p></>}</section>;
}
