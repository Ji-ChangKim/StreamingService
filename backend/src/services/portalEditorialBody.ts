import { type PortalProfile, PORTAL_PLATFORMS, portalWebUrl } from '../../../shared/portal';
import { ABOUT_CARDS, ABOUT_INTRO, POLICY_CONTACT_EMAIL, PRIVACY_INTRO, PRIVACY_SECTIONS, TERMS_SECTIONS, type PolicySection } from '../../../shared/portalPolicyContent';
import { PORTAL_GUIDES } from '../../../shared/portalEditorial';
import { translatePortalText } from '../../../shared/portalTranslations';
import '../../../shared/portalTranslationData'; // 서버 초기 HTML은 세 언어 사전을 항상 사용한다.
import { escapeActivityHtml } from './activityPageService';
import { profileMediaItems } from '../../../shared/profileMedia';

// 초기 HTML에도 검수한 영상의 제목과 원문을 남겨 재생 불가 환경에서 찾을 수 있게 한다.
function profileEditorialExtras(profile: PortalProfile, language: 'ko' | 'ja' | 'en'): string {
  const esc = escapeActivityHtml;
  return `${profileMediaItems(profile).length ? `<section><h2>${esc(translatePortalText('영상 모음', language))}</h2><ul>${profileMediaItems(profile).map((item) => `<li><a href="${esc(item.url)}" rel="noopener noreferrer">${esc(item.title)}</a></li>`).join('')}</ul></section>` : ''}${profile.regularSchedule ? `<p>${esc(profile.regularSchedule)}</p>` : ''}${profile.fanGuide ? `<section><h2>${esc(translatePortalText('팬으로 함께하기', language))}</h2><p>${esc(profile.fanGuide)}</p></section>` : ''}${profile.notices?.length ? `<section><h2>${esc(translatePortalText('주요 소식', language))}</h2><ul>${profile.notices.filter((item) => portalWebUrl(item.url)).map((item) => `<li><a href="${esc(portalWebUrl(item.url))}" rel="noopener noreferrer">${esc(item.title)}</a></li>`).join('')}</ul></section>` : ''}`;
}

// 정책 화면과 같은 공용 본문을 초기 HTML로 제공한다.
function policyBody(sections: PolicySection[], language: 'ko' | 'ja' | 'en'): string {
  const esc = escapeActivityHtml;
  const text = (source: string) => esc(translatePortalText(source, language));
  return sections.map((section) => `<section><h2>${text(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${text(paragraph)}</p>`).join('')}${section.links?.map((link) => `<p><a href="${esc(link.href)}" rel="noopener noreferrer">${text(link.label)}</a></p>`).join('') || ''}</section>`).join('');
}

// 소개 목록은 공개 기준을 통과한 소개만 이름·플랫폼·짧은 소개로 연결한다.
function creatorListBody(profiles: PortalProfile[], language: 'ko' | 'ja' | 'en', link: (to: string) => string): string {
  const esc = escapeActivityHtml;
  if (!profiles.length) return '';
  const summary = (profile: PortalProfile) => {
    const source = (profile.headline || profile.description || '').replace(/\s+/g, ' ').trim();
    return source.length > 90 ? `${source.slice(0, 90)}…` : source;
  };
  const items = profiles.map((profile) => {
    const platform = PORTAL_PLATFORMS.find((item) => item.id === profile.platform)?.label || '';
    const line = summary(profile);
    return `<li><a href="${link(`/creator/${encodeURIComponent(profile.slug)}`)}">${esc(profile.displayName)}</a>${platform ? ` · ${esc(translatePortalText(platform, language))}` : ''}${line && line !== profile.displayName ? ` — ${esc(line)}` : ''}</li>`;
  }).join('');
  return `<section><h2>${esc(translatePortalText('공개된 버튜버 소개 {0}명', language, [profiles.length]))}</h2><ul>${items}</ul></section>`;
}

// 처음 받는 HTML에서도 화면과 같은 안내 글과 검토된 소개를 읽을 수 있게 한다.
export function portalEditorialBody(path: string, language: 'ko' | 'ja' | 'en', profile?: PortalProfile, profiles: PortalProfile[] = []): string {
  const esc = escapeActivityHtml;
  const text = (source: string) => esc(translatePortalText(source, language));
  const link = (to: string) => esc(`${to}${language === 'ko' ? '' : `?lang=${language}`}`);
  if (path === '/guide') return PORTAL_GUIDES.map((guide) => `<article id="${guide.id}"><h2>${text(guide.title)}</h2>${guide.paragraphs.map((paragraph) => `<p>${text(paragraph)}</p>`).join('')}<a href="${link(guide.to)}">${text(guide.action)}</a></article>`).join('');
  if (path === '/') return `<section><h2>${text('첫 방송을 만나고 준비하는 방법')}</h2>${PORTAL_GUIDES.filter((guide) => ['save', 'introduction', 'announcement'].includes(guide.id)).map((guide) => `<article><h3>${text(guide.title)}</h3><p>${text(guide.paragraphs[0])}</p><a href="${link('/guide')}#${guide.id}">${text('자세히 읽기')}</a></article>`).join('')}</section>`;
  if (path === '/privacy') return `<p>${text(PRIVACY_INTRO)}</p>${policyBody(PRIVACY_SECTIONS, language)}<p><a href="mailto:${POLICY_CONTACT_EMAIL}">${POLICY_CONTACT_EMAIL}</a></p>`;
  if (path === '/terms') return policyBody(TERMS_SECTIONS, language);
  if (path === '/about') return `<section><h2>${text(ABOUT_INTRO.heading)}</h2><p>${text(ABOUT_INTRO.text)}</p></section>${ABOUT_CARDS.map((card) => `<section><h3>${text(card.title)}</h3><p>${text(card.text)}</p><a href="${link(card.to)}">${text(card.link)}</a></section>`).join('')}`;
  if (path === '/creators') return creatorListBody(profiles, language, link);
  if (!profile) return '';
  const notice = portalWebUrl(profile.noticeUrl || '');
  const reviewedAt = profile.contentReview?.reviewedAt;
  const schedule = profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc))
    ? `${new Intl.DateTimeFormat(language, { timeZone: 'Asia/Seoul', dateStyle: 'long', timeStyle: 'short' }).format(new Date(profile.startAtUtc))} · KST`
    : profile.dateState === 'TIME_TBD' ? translatePortalText('{0} · 시간 미정 ({1})', language, [profile.debutDate, profile.timezone])
    : profile.dateState === 'DATE_TBD' ? translatePortalText('{0} · 날짜 미정', language, [profile.targetMonth]) : '';

  return `${profile.headline ? `<p>${esc(profile.headline)}</p>` : ''}${profile.description || profile.tags.length || profile.languages.length ? `<section>${profile.description ? `<p>${esc(profile.description)}</p>` : ''}<dl>${profile.tags.length ? `<dt>${text('주요 콘텐츠')}</dt><dd>${esc(profile.tags.join(' · '))}</dd>` : ''}${profile.languages.length ? `<dt>${text('방송 언어')}</dt><dd>${esc(profile.languages.join(' · '))}</dd>` : ''}</dl></section>` : ''}<section><h2>${text('소개와 일정 확인하기')}</h2>${schedule ? `<p>${esc(schedule)}</p>` : ''}${reviewedAt && Number.isFinite(Date.parse(reviewedAt)) ? `<p>${text('소개 검토일')} · <time datetime="${esc(reviewedAt)}">${esc(new Intl.DateTimeFormat(language, { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(reviewedAt)))}</time> · KST</p>` : ''}${notice ? `<a href="${esc(notice)}" rel="noopener noreferrer">${text('데뷔 공지 원문 보기')}</a>` : ''}</section>${profileEditorialExtras(profile, language)}`;
}
