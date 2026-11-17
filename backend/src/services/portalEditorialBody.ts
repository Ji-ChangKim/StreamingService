import { type PortalProfile, PORTAL_PLATFORMS, portalWebUrl } from '../../../shared/portal';
import { ABOUT_CARDS, ABOUT_INTRO, ABOUT_SECTIONS, CONTACT_SECTIONS, POLICY_CONTACT_EMAIL, PRIVACY_INTRO, PRIVACY_SECTIONS, TERMS_SECTIONS, type PolicySection } from '../../../shared/portalPolicyContent';
import { PORTAL_GUIDES, currentDebutWeek, profileExcerpt } from '../../../shared/portalEditorial';
import { profileAgencyName, topicName } from '../../../shared/profilePresentation';
import { portalDay } from '../../../shared/portal';
import type { AnalyticsChannelBoard } from '../../../shared/analyticsBoard';
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
    const chars = Array.from(source); // 이모지가 반으로 갈리지 않게 글자 단위로 자른다.
    return chars.length > 90 ? `${chars.slice(0, 90).join('')}…` : source;
  };
  const items = profiles.map((profile) => {
    const platform = PORTAL_PLATFORMS.find((item) => item.id === profile.platform)?.label || '';
    const line = summary(profile);
    return `<li><a href="${link(`/creator/${encodeURIComponent(profile.slug)}`)}">${esc(profile.displayName)}</a>${platform ? ` · ${esc(translatePortalText(platform, language))}` : ''}${line && line !== profile.displayName ? ` — ${esc(line)}` : ''}</li>`;
  }).join('');
  return `<section><h2>${esc(translatePortalText('공개된 버튜버 소개 {0}명', language, [profiles.length]))}</h2><ul>${items}</ul></section>`;
}

// 홈 첫 HTML: 캘린더가 화면에 그리는 실제 데뷔 일정(이번 주·다음 주·최근 2주)을 글로도 제공한다.
const KST = 'Asia/Seoul';
function debutLine(profile: PortalProfile, language: 'ko' | 'ja' | 'en', link: (to: string) => string): string {
  const esc = escapeActivityHtml;
  const text = (source: string) => esc(translatePortalText(source, language));
  const when = profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc))
    ? new Intl.DateTimeFormat(language, { timeZone: KST, month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(profile.startAtUtc))
    : `${new Intl.DateTimeFormat(language, { timeZone: 'UTC', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(`${profile.debutDate}T00:00:00Z`))} · ${text('시간 미정')}`;
  const platform = PORTAL_PLATFORMS.find((item) => item.id === profile.platform)?.label || '';
  const agency = profileAgencyName(profile.agency);
  const where = [platform && translatePortalText(platform, language), agency].filter(Boolean).join(' / ');
  const line = profileExcerpt(profile, 80);
  return `<li><time>${esc(when)}</time> <a href="${link(`/creator/${encodeURIComponent(profile.slug)}`)}">${esc(profile.displayName)}</a>${where ? ` · ${esc(where)}` : ''}${line && line !== profile.displayName ? ` — ${esc(line)}` : ''}</li>`;
}

export function homeDebutBody(profiles: PortalProfile[], language: 'ko' | 'ja' | 'en', link: (to: string) => string, now = Date.now()): string {
  const esc = escapeActivityHtml;
  const text = (source: string, values: unknown[] = []) => esc(translatePortalText(source, language, values));
  const range = (from: string, to: string) => { const f = new Intl.DateTimeFormat(language, { timeZone: 'UTC', month: 'long', day: 'numeric' }); return [f.format(new Date(`${from}T00:00:00Z`)), f.format(new Date(`${to}T00:00:00Z`))]; };
  const list = (items: PortalProfile[]) => `<ul>${items.map((profile) => debutLine(profile, language, link)).join('')}</ul>`;
  const thisWeek = currentDebutWeek(profiles, KST, now);
  const nextWeek = currentDebutWeek(profiles, KST, now + 7 * 86400000);
  const recentFrom = new Date(Date.parse(`${thisWeek.from}T00:00:00Z`) - 14 * 86400000).toISOString().slice(0, 10);
  const recent = profiles.filter((profile) => { const day = portalDay(profile, KST); return Boolean(day && day >= recentFrom && day < thisWeek.from); })
    .sort((a, b) => portalDay(b, KST).localeCompare(portalDay(a, KST))).slice(0, 12);
  const [tf, tt] = range(thisWeek.from, thisWeek.to); const [nf, nt] = range(nextWeek.from, nextWeek.to);
  return `<section><h2>${text('이번 주 데뷔 일정')}</h2>${thisWeek.profiles.length
    ? `<p>${text('{0} ~ {1}, 한국 시간 기준으로 {2}명이 데뷔해요.', [tf, tt, thisWeek.profiles.length])}</p>${list(thisWeek.profiles)}`
    : `<p>${text('이번 주에는 아직 등록된 데뷔 일정이 없어요. 데뷔 캘린더에서 다른 주 일정을 살펴보세요.')}</p>`}</section>`
    + (nextWeek.profiles.length ? `<section><h2>${text('다음 주 데뷔 예정')}</h2><p>${text('{0} ~ {1}에 {2}명이 데뷔할 예정이에요.', [nf, nt, nextWeek.profiles.length])}</p>${list(nextWeek.profiles)}</section>` : '')
    + (recent.length ? `<section><h2>${text('최근 데뷔한 버튜버')}</h2><p>${text('지난 2주 동안 첫 방송을 시작한 버튜버예요.')}</p>${list(recent)}</section>` : '');
}

// 버튜버 상세 첫 HTML: 화면 '소개' 탭과 같은 데뷔 이야기·방송 기록 요약 문장(기획 39·40번).
export function profileStoryBody(profile: PortalProfile, language: 'ko' | 'ja' | 'en', channel30?: AnalyticsChannelBoard | null, now = Date.now()): string {
  const esc = escapeActivityHtml;
  const text = (source: string, values: unknown[] = []) => esc(translatePortalText(source, language, values));
  const at = profile.dateState === 'FIXED' ? Date.parse(profile.startAtUtc) : profile.dateState === 'TIME_TBD' ? Date.parse(`${profile.debutDate}T00:00:00+09:00`) : NaN;
  const parts: string[] = [];
  if (Number.isFinite(at)) {
    const date = new Intl.DateTimeFormat(language, { timeZone: KST, year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(at));
    const platform = translatePortalText(PORTAL_PLATFORMS.find((item) => item.id === profile.platform)?.label || profile.platform, language);
    const agency = profileAgencyName(profile.agency);
    const tags = (profile.tags || []).slice(0, 3);
    const lines = [
      at <= now ? text('{0} {1}에서 데뷔했어요 · 오늘로 {2}일째예요', [date, platform, Math.floor((now - at) / 86400000) + 1]) : text('{0} {1}에서 데뷔할 예정이에요', [date, platform]),
      tags.length ? text('{0} {1} 방송을 주로 하는 {2} 버튜버예요.', [topicName(profile.displayName, language), tags.join('·'), platform]) : text('{0} {1} 버튜버예요.', [topicName(profile.displayName, language), platform]),
      profile.languages?.length ? text('{0}로 방송해요.', [profile.languages.join('·')]) : '',
      agency ? text('{0} 소속이에요.', [agency]) : '',
    ].filter(Boolean);
    parts.push(`<section><h2>${text('데뷔 이야기')}</h2><p>${lines.join(' ')}</p></section>`);
  }
  const k = channel30?.kpis;
  if (channel30 && k && k.broadcasts > 0) {
    const top = channel30.games[0];
    const lines = [
      text('최근 30일 동안 {0}번, 모두 {1}시간 방송했어요.', [k.broadcasts.toLocaleString(language), Math.round(k.minutes / 60).toLocaleString(language)]),
      k.avg !== null ? text('평균 시청자는 {0}명, 가장 많을 때는 {1}명이었어요.', [k.avg.toLocaleString(language), (k.peak ?? k.avg).toLocaleString(language)]) : '',
      top ? text('가장 많이 한 콘텐츠는 「{0}」({1}%)예요.', [top.name, top.share]) : '',
    ].filter(Boolean);
    parts.push(`<section><h2>${text('최근 방송 기록')}</h2><p>${lines.join(' ')}</p></section>`);
  }
  return parts.join('');
}

// 처음 받는 HTML에서도 화면과 같은 안내 글과 검토된 소개를 읽을 수 있게 한다.
export function portalEditorialBody(path: string, language: 'ko' | 'ja' | 'en', profile?: PortalProfile, profiles: PortalProfile[] = [], channel30?: AnalyticsChannelBoard | null): string {
  const esc = escapeActivityHtml;
  const text = (source: string) => esc(translatePortalText(source, language));
  const link = (to: string) => esc(`${to}${language === 'ko' ? '' : `?lang=${language}`}`);
  if (path === '/guide') return PORTAL_GUIDES.map((guide) => `<article id="${guide.id}"><h2>${text(guide.title)}</h2>${guide.paragraphs.map((paragraph) => `<p>${text(paragraph)}</p>`).join('')}<a href="${link(guide.to)}">${text(guide.action)}</a></article>`).join('');
  if (path === '/') return `${homeDebutBody(profiles, language, link)}<section><h2>${text('첫 방송을 만나고 준비하는 방법')}</h2>${PORTAL_GUIDES.filter((guide) => ['save', 'introduction', 'announcement'].includes(guide.id)).map((guide) => `<article><h3>${text(guide.title)}</h3><p>${text(guide.paragraphs[0])}</p><a href="${link('/guide')}#${guide.id}">${text('자세히 읽기')}</a></article>`).join('')}</section>`;
  if (path === '/privacy') return `<p>${text(PRIVACY_INTRO)}</p>${policyBody(PRIVACY_SECTIONS, language)}<p><a href="mailto:${POLICY_CONTACT_EMAIL}">${POLICY_CONTACT_EMAIL}</a></p>`;
  if (path === '/terms') return policyBody(TERMS_SECTIONS, language);
  if (path === '/about') return `<section><h2>${text(ABOUT_INTRO.heading)}</h2><p>${text(ABOUT_INTRO.text)}</p></section>${ABOUT_CARDS.map((card) => `<section><h3>${text(card.title)}</h3><p>${text(card.text)}</p><a href="${link(card.to)}">${text(card.link)}</a></section>`).join('')}${policyBody(ABOUT_SECTIONS, language)}`;
  if (path === '/contact') return `${policyBody(CONTACT_SECTIONS, language)}<p><a href="mailto:${POLICY_CONTACT_EMAIL}">${POLICY_CONTACT_EMAIL}</a></p>`;
  if (path === '/creators') return creatorListBody(profiles, language, link);
  if (!profile) return '';
  const notice = portalWebUrl(profile.noticeUrl || '');
  const reviewedAt = profile.contentReview?.reviewedAt;
  const schedule = profile.dateState === 'FIXED' && Number.isFinite(Date.parse(profile.startAtUtc))
    ? `${new Intl.DateTimeFormat(language, { timeZone: 'Asia/Seoul', dateStyle: 'long', timeStyle: 'short' }).format(new Date(profile.startAtUtc))} · KST`
    : profile.dateState === 'TIME_TBD' ? translatePortalText('{0} · 시간 미정 ({1})', language, [profile.debutDate, profile.timezone])
    : profile.dateState === 'DATE_TBD' ? translatePortalText('{0} · 날짜 미정', language, [profile.targetMonth]) : '';

  return `${profile.headline ? `<p>${esc(profile.headline)}</p>` : ''}${profileStoryBody(profile, language, channel30)}${profile.description || profile.tags.length || profile.languages.length ? `<section>${profile.description ? `<p>${esc(profile.description)}</p>` : ''}<dl>${profile.tags.length ? `<dt>${text('주요 콘텐츠')}</dt><dd>${esc(profile.tags.join(' · '))}</dd>` : ''}${profile.languages.length ? `<dt>${text('방송 언어')}</dt><dd>${esc(profile.languages.join(' · '))}</dd>` : ''}</dl></section>` : ''}<section><h2>${text('소개와 일정 확인하기')}</h2>${schedule ? `<p>${esc(schedule)}</p>` : ''}${reviewedAt && Number.isFinite(Date.parse(reviewedAt)) ? `<p>${text('소개 검토일')} · <time datetime="${esc(reviewedAt)}">${esc(new Intl.DateTimeFormat(language, { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(reviewedAt)))}</time> · KST</p>` : ''}${notice ? `<a href="${esc(notice)}" rel="noopener noreferrer">${text('데뷔 공지 원문 보기')}</a>` : ''}</section>${profileEditorialExtras(profile, language)}`;
}
