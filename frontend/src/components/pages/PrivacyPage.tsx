import { Language } from '../../utils/i18n';
import { translatePortalText } from '../../../../shared/portalTranslations';

interface PrivacyPageProps { onNavigateHome: () => void; currentLang?: Language }

// 확인 가능한 수집 항목만 안내하고 미확정 보관기간이나 광고 운영 사실을 만들지 않는다.
export function PrivacyPage({ onNavigateHome, currentLang = 'ko' }: PrivacyPageProps) {
  const t = (text: string) => translatePortalText(text, currentLang);
  return <article className="vd-panel vd-form">
    <button type="button" className="vd-button" onClick={onNavigateHome}>{t('메인 캘린더로 돌아가기')}</button>
    <h1>{t('개인정보처리방침')}</h1>
    <p>{t('VDébut은 데뷔 일정과 소개 공개, 문의 처리 및 서비스 이용 현황 분석에 필요한 정보를 사용합니다.')}</p>
    <h2>{t('등록·문의 정보')}</h2>
    <p>{t('활동명, 소개, 방송 채널, 일정과 등록한 이미지는 소개 공개에 사용됩니다. 문의에 입력한 이메일과 내용은 문의 처리에 사용되며 공개 소개에 표시하지 않습니다.')}</p>
    <h2>{t('브라우저 저장 정보')}</h2>
    <p>{t('언어와 일정 표시 설정, 관심 목록, 문의 답변 조회용 확인 키는 사용한 브라우저에 저장됩니다. 브라우저 설정에서 저장 정보를 삭제할 수 있습니다.')}</p>
    <h2>{t('접속 정보')}</h2>
    <p>{t('서비스 요청 처리와 과도한 접수 제한을 위해 접속 정보를 처리합니다. 문의 확인 키와 접수 제한에 사용하는 접속 주소는 해시로 저장합니다.')}</p>
    <h2>{t('Google Analytics')}</h2>
    <p>{t('운영 사이트에는 Google Analytics 방문 분석 태그가 포함되어 있습니다. Google은 이용 현황 분석을 위해 쿠키, IP 주소, 기기 및 브라우저 정보 등을 처리할 수 있습니다.')}</p>
    <a href="https://policies.google.com/technologies/partner-sites?hl=ko" target="_blank" rel="noopener noreferrer">{t('Google의 파트너 사이트 데이터 사용 안내')}</a>
    <h2>{t('광고 서비스')}</h2>
    <p>{t('Google 광고 서비스를 도입할 경우 광고 제공에 필요한 데이터 사용과 이용자의 선택 방법을 안내합니다.')}</p>
    <h2>{t('정보 열람·정정·삭제 문의')}</h2>
    <p>{t('정보의 열람·정정·삭제 요청은 문의 화면 또는 아래 이메일로 접수할 수 있습니다.')}</p>
    <a href="mailto:ru_0120@naver.com">ru_0120@naver.com</a>
  </article>;
}
