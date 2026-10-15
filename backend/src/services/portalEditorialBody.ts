import { type PortalProfile, portalWebUrl } from '../../../shared/portal';
import { PORTAL_GUIDES } from '../../../shared/portalEditorial';
import { translatePortalText } from '../../../shared/portalTranslations';
import { escapeActivityHtml } from './activityPageService';

// 처음 받는 HTML에서도 화면과 같은 안내 글과 검토된 소개를 읽을 수 있게 한다.
export function portalEditorialBody(path: string, language: 'ko' | 'ja' | 'en', profile?: PortalProfile): string {
  const esc = escapeActivityHtml;
  const text = (source: string) => esc(translatePortalText(source, language));
  const link = (to: string) => esc(`${to}${language === 'ko' ? '' : `?lang=${language}`}`);
  if (path === '/guide') return PORTAL_GUIDES.map((guide) => `<article id="${guide.id}"><h2>${text(guide.title)}</h2>${guide.paragraphs.map((paragraph) => `<p>${text(paragraph)}</p>`).join('')}<a href="${link(guide.to)}">${text(guide.action)}</a></article>`).join('');
  if (path === '/') return `<section><h2>${text('첫 방송을 만나고 준비하는 방법')}</h2>${PORTAL_GUIDES.filter((guide) => ['save', 'introduction', 'announcement'].includes(guide.id)).map((guide) => `<article><h3>${text(guide.title)}</h3><p>${text(guide.paragraphs[0])}</p><a href="${link('/guide')}#${guide.id}">${text('자세히 읽기')}</a></article>`).join('')}</section>`;
  if (!profile) return '';
  const notice = portalWebUrl(profile.noticeUrl || '');
  const reviewedAt = profile.contentReview?.reviewedAt;
  const schedule = profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc))
    ? `${new Intl.DateTimeFormat(language, { timeZone: 'Asia/Seoul', dateStyle: 'long', timeStyle: 'short' }).format(new Date(profile.startAtUtc))} · KST`
    : profile.dateState === 'TIME_TBD' ? translatePortalText('{0} · 시간 미정 ({1})', language, [profile.debutDate, profile.timezone])
    : profile.dateState === 'DATE_TBD' ? translatePortalText('{0} · 날짜 미정', language, [profile.targetMonth]) : '';

  return `${profile.headline ? `<p>${esc(profile.headline)}</p>` : ''}${profile.description || profile.tags.length || profile.languages.length ? `<section><h2>${text('어떤 방송을 하나요?')}</h2>${profile.description ? `<p>${esc(profile.description)}</p>` : ''}<dl>${profile.tags.length ? `<dt>${text('주요 콘텐츠')}</dt><dd>${esc(profile.tags.join(' · '))}</dd>` : ''}${profile.languages.length ? `<dt>${text('방송 언어')}</dt><dd>${esc(profile.languages.join(' · '))}</dd>` : ''}</dl></section>` : ''}<section><h2>${text('소개와 일정 확인하기')}</h2>${schedule ? `<p>${esc(schedule)}</p>` : ''}${reviewedAt && Number.isFinite(Date.parse(reviewedAt)) ? `<p>${text('소개 검토일')} · <time datetime="${esc(reviewedAt)}">${esc(new Intl.DateTimeFormat(language, { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(reviewedAt)))}</time> · KST</p>` : ''}${notice ? `<a href="${esc(notice)}" rel="noopener noreferrer">${text('데뷔 공지 원문 보기')}</a>` : ''}</section>`;
}
