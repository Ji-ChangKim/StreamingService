import { Language } from '../../utils/i18n';
import { translatePortalText } from '../../../../shared/portalTranslations';

interface TermsPageProps { onNavigateHome: () => void; currentLang?: Language; secureManagement?: boolean }

// 광고 도입 가능성과 등록 콘텐츠의 공개 기준을 실제 서비스 범위에 맞춰 안내한다.
export function TermsPage({ onNavigateHome, currentLang = 'ko' }: TermsPageProps) {
  const t = (text: string) => translatePortalText(text, currentLang);
  return <article className="vd-panel vd-form">
    <button type="button" className="vd-button" onClick={onNavigateHome}>{t('메인 캘린더로 돌아가기')}</button>
    <h1>{t('이용약관')}</h1>
    <h2>{t('서비스 이용 목적')}</h2>
    <p>{t('VDébut은 버튜버의 데뷔 일정, 소개와 방송 활동 정보를 제공하는 독립 서비스입니다. 서비스 운영을 위해 광고가 표시될 수 있습니다.')}</p>
    <h2>{t('등록 콘텐츠의 공개 기준')}</h2>
    <p>{t('등록 신청은 운영자 검토 후 공개됩니다. 허위 정보, 사칭, 권리 침해 또는 공개 기준에 맞지 않는 콘텐츠는 보완 요청, 공개 보류 또는 삭제할 수 있습니다.')}</p>
    <p>{t('소개·이미지·영상과 외부 링크도 검토 대상입니다. 팬 제보에는 확인 가능한 공식 출처를 함께 남겨 주세요.')}</p>
    <h2>{t('이미지·소개글과 브랜드')}</h2>
    <p>{t('등록하는 이미지·소개글·영상에는 필요한 사용 권한이 있어야 합니다. 크리에이터의 저작물과 각 플랫폼의 상표는 해당 권리자에게 귀속됩니다.')}</p>
    <h2>{t('정보 수정·콘텐츠 신고')}</h2>
    <p>{t('정보나 이미지의 정정·삭제, 사칭과 부적절한 콘텐츠 신고는 문의 화면 또는 ru_0120@naver.com으로 접수합니다. 운영자가 요청 내용과 권리를 확인한 뒤 처리합니다.')}</p>
    <h2>{t('방송 일정 변경')}</h2>
    <p>{t('방송 일정은 변경·연기·취소될 수 있습니다. 최신 일정은 크리에이터의 공지를 함께 확인해 주세요. 저장한 일정은 변경된 공지와 대조해 수정해 주세요.')}</p>
  </article>;
}
