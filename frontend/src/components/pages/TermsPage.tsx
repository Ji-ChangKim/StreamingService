import { Fragment } from 'react';
import { Language } from '../../utils/i18n';
import { PolicyParagraph } from './PolicyParagraph';
import { translatePortalText } from '../../../../shared/portalTranslations';
import { TERMS_SECTIONS } from '../../../../shared/portalPolicyContent';

interface TermsPageProps { onNavigateHome: () => void; currentLang?: Language; secureManagement?: boolean }

// 광고 도입 가능성과 등록 콘텐츠의 공개 기준을 실제 서비스 범위에 맞춰 안내한다.
export function TermsPage({ onNavigateHome, currentLang = 'ko' }: TermsPageProps) {
  const t = (text: string) => translatePortalText(text, currentLang);
  return <article className="vd-panel vd-form vd-policy">
    <button type="button" className="vd-button" onClick={onNavigateHome}>{t('메인 캘린더로 돌아가기')}</button>
    <h1>{t('이용약관')}</h1>
    {TERMS_SECTIONS.map((section) => <Fragment key={section.heading}>
      <h2>{t(section.heading)}</h2>
      {section.paragraphs.map((paragraph) => <PolicyParagraph key={paragraph} text={t(paragraph)} />)}
      {section.links?.map((link) => <p key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer">{t(link.label)}</a></p>)}
    </Fragment>)}
  </article>;
}
