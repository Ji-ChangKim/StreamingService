import { pageStructuredData } from '../../../shared/siteSeo';
import { sitemapEntry } from './sitemapEntry';
import { STATISTICS_GUIDE } from '../../../shared/portalEditorial';
import { translatePortalText } from '../../../shared/portalTranslations';
import type { ActivityFilters, BroadcastActivity } from '../../../shared/broadcastActivity';
import { activitySeo, activityStreamerPath, activityNoindex } from '../../../shared/activitySeo';
import { INITIAL_PAGE_LOADING_HEAD, initialPageRoot } from './initialPageLoading';
import { publicBroadcastPayload, publicBroadcastTitle } from '../../../shared/contentReview';

// 외부 채널명·제목을 HTML 텍스트와 속성에 안전하게 표시한다.
export function escapeActivityHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

// 초기 JSON 안의 태그가 script 요소를 종료하지 못하게 한다.
export function activityJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

// 자바스크립트 실행 전에도 실제 요약·카테고리·방송 이력을 읽을 수 있게 한다.
export function activityInitialBody(data: BroadcastActivity, language: 'ko' | 'ja' | 'en' = 'ko'): string {
  data = publicBroadcastPayload(data);
  const esc = escapeActivityHtml;
  const text = (source: string) => esc(translatePortalText(source, language));
  const readingGuide = `<section><h2>${text('방송 통계 읽는 법')}</h2>${STATISTICS_GUIDE.map((item) => `<h3>${text(item.title)}</h3><p>${text(item.text)}</p>`).join('')}</section>`;
  const heading = data.streamer ? `${data.streamer.name} 방송 통계` : '방송 통계';
  const rows = data.broadcasts.slice(0, 25).map(row => `<tr><td><a href="${activityStreamerPath(row.channelKey)}">${esc(row.channelName)}</a></td><td>${esc(row.title)}</td><td>${esc(row.categories)}</td><td>${Math.round(row.minutes)}분</td></tr>`).join('');
  return `<main class="bs-dashboard ad-dashboard" id="activity-initial"><header class="ad-heading"><h1>${esc(heading)}</h1></header><nav class="ad-view-nav"><a href="/analytics">전체 통계</a><a href="/analytics/chzzk">치지직</a><a href="/analytics/soop">SOOP</a></nav><p>${esc(data.meta.from)} — ${esc(data.meta.to)}</p><section class="ad-summary"><div><span>방송 채널</span><strong>${data.summary.streamers}개</strong></div><div><span>방송 횟수</span><strong>${data.summary.broadcasts}회</strong></div><div><span>방송 시간</span><strong>${Math.round(data.summary.minutes)}분</strong></div></section><section><h2>카테고리별 방송 통계</h2><ul>${data.categories.map(row => `<li>${esc(row.name)} · ${row.broadcasts}회 · ${Math.round(row.minutes)}분</li>`).join('')}</ul></section><section><h2>방송 이력</h2>${rows ? `<div class="ad-table-scroll"><table class="ad-table"><thead><tr><th>스트리머</th><th>방송 제목</th><th>카테고리</th><th>방송 시간</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p>선택한 기간의 방송 기록이 없습니다.</p>'}</section>${readingGuide}</main>`;
}

// 기존 앱의 초기 본문과 메타데이터를 통계 주소에 맞춰 교체한다.
export function renderActivityPage(html: string, url: URL, filters: ActivityFilters, data: BroadcastActivity): string {
  data = publicBroadcastPayload(data);
  const seo = activitySeo(filters, data, url.searchParams.get('search') || '');
  const esc = escapeActivityHtml;
  const noindex = activityNoindex(url, data);
  const language = url.searchParams.get('lang');
  html = html.replace(/<html\b[^>]*>/, `<html lang="${language === 'ja' || language === 'en' ? language : 'ko'}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`);
  html = html.replace(/<meta\b[^>]*(?:name="(?:title|description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '');
  html = html.replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/g, '');
  html = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '');
  html = html.replace('</head>', `<meta name="description" content="${esc(seo.description)}"><link rel="canonical" href="${esc(seo.canonical)}"><meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}"><meta property="og:title" content="${esc(seo.title)}"><meta property="og:description" content="${esc(seo.description)}"><meta property="og:url" content="${esc(seo.canonical)}"><meta property="og:type" content="website"><meta property="og:image" content="${esc(seo.image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(seo.title)}"><meta name="twitter:description" content="${esc(seo.description)}"><meta name="twitter:image" content="${esc(seo.image)}"><script type="application/ld+json">${activityJson(pageStructuredData(seo))}</script></head>`);
  const start = html.indexOf('<div id="root">');
  const end = html.lastIndexOf('</div>');
  if (start < 0 || end < start) throw new Error('통계 초기 본문을 찾을 수 없습니다.');
  return html.slice(0, start).replace('</head>', `${INITIAL_PAGE_LOADING_HEAD}</head>`) + initialPageRoot(activityInitialBody(data, url.searchParams.get('lang') === 'ja' ? 'ja' : url.searchParams.get('lang') === 'en' ? 'en' : 'ko'), '화면을 불러오고 있어요') + `<script id="activity-bootstrap" type="application/json">${activityJson({ filters, data: { ...data, broadcasts: data.broadcasts.slice(0, 25) } })}</script>` + html.slice(end + 6);
}

// 실제 수집 기록이 있는 채널만 개인 통계 사이트맵에 포함한다.
export async function activitySitemapEntries(db: D1Database): Promise<string> {
  const rows = await db.prepare(`SELECT s.channel_key AS channel, MAX(r.observed_at) AS modified
    FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id=s.run_id
    WHERE r.state IN ('available','partial') GROUP BY s.channel_key`).all<{ channel: string; modified: string }>();
  const modified = rows.results.reduce((max, row) => row.modified > max ? row.modified : max, '');
  return ['/analytics', '/analytics/chzzk', '/analytics/soop'].map((path) => sitemapEntry(path, 'ko', false, modified)).join('')
    + rows.results.map((row) => sitemapEntry(activityStreamerPath(row.channel), 'ko', false, row.modified)).join('');
}
