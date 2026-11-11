import { Fragment } from 'react';
import { Language } from '../../utils/i18n';
import { translatePortalText } from '../../../../shared/portalTranslations';
import { POLICY_CONTACT_EMAIL, PRIVACY_INTRO, PRIVACY_SECTIONS } from '../../../../shared/portalPolicyContent';

interface PrivacyPageProps { onNavigateHome: () => void; currentLang?: Language }

// 서버 초기 HTML과 같은 공용 본문을 사용해 화면과 크롤러가 보는 내용을 맞춘다.
export function PrivacyPage({ onNavigateHome, currentLang = 'ko' }: PrivacyPageProps) {
  const t = (text: string) => translatePortalText(text, currentLang);
  return <article className="vd-panel vd-form">
    <button type="button" className="vd-button" onClick={onNavigateHome}>{t('메인 캘린더로 돌아가기')}</button>
    <h1>{t('개인정보처리방침')}</h1>
    <p>{t(PRIVACY_INTRO)}</p>
    {PRIVACY_SECTIONS.map((section) => <Fragment key={section.heading}>
      <h2>{t(section.heading)}</h2>
      {section.paragraphs.map((paragraph) => <p key={paragraph}>{t(paragraph)}</p>)}
      {section.links?.map((link) => <p key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer">{t(link.label)}</a></p>)}
    </Fragment>)}
    <a href={`mailto:${POLICY_CONTACT_EMAIL}`}>{POLICY_CONTACT_EMAIL}</a>
  </article>;
}
