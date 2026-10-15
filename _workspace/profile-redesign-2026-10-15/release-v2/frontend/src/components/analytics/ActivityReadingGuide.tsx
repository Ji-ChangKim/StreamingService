import { STATISTICS_GUIDE } from '../../../../shared/portalEditorial';
import { t, usePortalLocale } from '../../portal/portalLocale';

// 비교 조건과 차트의 의미를 실제 집계 방식에 맞춰 안내한다.
export function ActivityReadingGuide() {
  usePortalLocale();
  return <details className="bs-panel ad-reading-guide"><summary>{t('방송 통계 읽는 법')}</summary>{STATISTICS_GUIDE.map((item) => <section key={item.title}><h3>{t(item.title)}</h3><p>{t(item.text)}</p></section>)}</details>;
}
