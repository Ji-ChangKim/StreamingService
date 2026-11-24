// 방송 통계 첫 HTML: 예전 활동 대시보드 표 대신, 화면과 같은 새 통계(10분 집계)를 사람이 읽는 글로 제공한다.
// 검색 로봇과 자바스크립트를 끈 방문자가 보는 본문이며, React가 마운트되면 화면으로 바뀐다.
import type { AnalyticsBoard, AnalyticsGameBoard, BoardPlatform } from '../../../shared/analyticsBoard';
import { gameLede, slotLabel } from '../../../shared/gameGuideText';
import { METHOD_CLASSES, METHOD_COLLECT, METHOD_LIMITS, METHOD_RANKS, METHOD_TERMS } from '../../../shared/analyticsMethod';
import { siteCanonical } from '../../../shared/siteSeo';
import { escapeActivityHtml as esc, activityJson } from './activityPageService';
import { INITIAL_PAGE_LOADING_HEAD, initialPageRoot } from './initialPageLoading';
import { profileAgencyName } from '../../../shared/profilePresentation';

const won = (value: number) => Math.round(value).toLocaleString('ko-KR');
const platformName = (platform: 'CHZZK' | 'SOOP') => (platform === 'CHZZK' ? '치지직' : 'SOOP');
const nav = '<nav><a href="/analytics">전체 통계</a> · <a href="/analytics/chzzk">치지직</a> · <a href="/analytics/soop">SOOP</a> · <a href="/analytics/method">집계 기준</a></nav>';

function asOfLabel(asOf: string | null): string {
  if (!asOf || !Number.isFinite(Date.parse(asOf))) return '';
  return `${new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(asOf))} 기준`;
}

export function boardPageTitle(platform: BoardPlatform): string {
  return platform === 'CHZZK' ? '치지직 방송 통계 · 실시간 시청자와 인기 게임 순위 | VDébut'
    : platform === 'SOOP' ? 'SOOP 방송 통계 · 실시간 시청자와 인기 게임 순위 | VDébut'
    : '방송 통계 · 치지직·SOOP 실시간 시청자와 인기 게임 순위 | VDébut';
}

export function boardInitialBody(board: AnalyticsBoard, platform: BoardPlatform): string {
  const heading = platform === 'ALL' ? '방송 통계' : `${platformName(platform)} 방송 통계`;
  const notReady = platform === 'SOOP' && !board.availability?.platformReady?.SOOP;
  const parts: string[] = [`<h1>${esc(heading)}</h1>`, nav];
  const when = asOfLabel(board.asOf);
  parts.push(`<p>치지직·SOOP에서 지금 어떤 방송을 얼마나 보고 있는지 10분마다 모아 보여 줘요.${when ? ` ${esc(when)}이에요.` : ''}</p>`);
  if (notReady) parts.push('<p>SOOP은 아직 쌓인 기록이 충분하지 않아 통계를 준비하고 있어요. 그동안 전체 통계와 치지직 통계를 확인해 주세요.</p>');
  if (board.summary) parts.push(`<section><h2>지금 판도</h2><p>${esc(board.summary)}</p></section>`);
  const cards = board.platforms.filter((card) => platform === 'ALL' || card.platform === platform);
  if (cards.length) {
    parts.push(`<section><h2>플랫폼 현황</h2><ul>${cards.map((card) => `<li>${platformName(card.platform)}: 지금 ${won(card.viewers)}명이 보고 있어요.${card.usualDelta !== null ? ` 평소 이 시간보다 ${card.usualDelta >= 0 ? `${card.usualDelta}% 많아요` : `${Math.abs(card.usualDelta)}% 적어요`}.` : ''} 오늘 최고는 ${won(card.peakToday)}명이고, 시청자 1,000명 이상인 방송은 ${won(card.bigCount)}개예요.</li>`).join('')}</ul></section>`);
  }
  const games = board.games.now.slice(0, 10);
  if (games.length) {
    parts.push(`<section><h2>지금 인기 게임 순위</h2><ol>${games.map((game) => `<li><a href="/analytics/game/${encodeURIComponent(game.name)}">${esc(game.name)}</a> — 시청자 ${won(game.viewers)}명, 방송 ${won(game.broadcasts)}개${game.perBroadcast !== null ? `, 방송당 ${won(game.perBroadcast)}명(${esc(game.competition)})` : ''}</li>`).join('')}</ol></section>`);
  }
  if (board.rising.length) {
    parts.push(`<section><h2>급상승 게임</h2><p>지난 7일 시청자가 그 전 7일보다 크게 늘어난 게임이에요.</p><ul>${board.rising.slice(0, 5).map((game) => `<li><a href="/analytics/game/${encodeURIComponent(game.name)}">${esc(game.name)}</a> — ${won(game.growth)}% 증가, 7일 평균 ${won(game.viewers)}명</li>`).join('')}</ul></section>`);
  }
  if (board.nonGame.length) {
    parts.push(`<section><h2>게임 외 콘텐츠</h2><ul>${board.nonGame.slice(0, 5).map((item) => `<li>${esc(item.name)} — 시청자 ${won(item.viewers)}명, 방송 ${won(item.broadcasts)}개</li>`).join('')}</ul></section>`);
  }
  const channels = board.channels.slice(0, 10);
  if (channels.length) {
    parts.push(`<section><h2>실시간 채널 순위</h2><ol>${channels.map((channel) => `<li>${esc(channel.name)} · ${esc([platformName(channel.platform), profileAgencyName(channel.affiliation)].filter(Boolean).join(' / '))}${channel.category ? ` · ${esc(channel.category)}` : ''} — ${won(channel.viewers)}명</li>`).join('')}</ol></section>`);
  }
  if (board.tags.length) {
    parts.push(`<section><h2>방송 태그 순위</h2><ol>${board.tags.slice(0, 10).map((tag) => `<li><a href="/analytics/tag/${encodeURIComponent(tag.tag)}">#${esc(tag.tag)}</a> — 시청자 ${won(tag.viewers)}명, 방송 ${won(tag.broadcasts)}개</li>`).join('')}</ol></section>`);
  }
  parts.push('<p>숫자를 어떻게 계산하는지는 <a href="/analytics/method">집계 기준</a>에서 확인할 수 있어요.</p>');
  return `<main>${parts.join('')}</main>`;
}

// 게임 페이지 첫 HTML(기획문서 42번): 화면과 같은 결론·덜 붐비는 시간·신입 기록·다른 게임·상위 채널.
export const gamePageTitle = (name: string) => `${name} 방송 통계 · 언제 켜면 덜 붐빌까 | VDébut`;
export const gamePageDescription = (name: string) => `${name} 방송의 요일·시간대별 시청자와 방송 수, 방송 1개당 시청자가 많은 시간, 신입 버튜버 기록을 최근 4주 치지직 방송 기록으로 보여 줘요.`;
export function gameInitialBody(board: AnalyticsGameBoard): string {
  const g = board.guide;
  const parts: string[] = [`<h1>${esc(board.name)} 방송 통계</h1>`];
  const lede = g ? gameLede(g) : null;
  parts.push(`<p>${esc(lede || gamePageDescription(board.name))}</p>`);
  if (board.now.broadcasts) parts.push(`<p>${esc(`지금 방송 ${won(board.now.broadcasts)}개에 ${won(board.now.viewers)}명이 보고 있어요.${board.now.perBroadcast ? ` 방송 1개당 시청자는 ${won(board.now.perBroadcast)}명이고, 같은 시간 평소와 비교한 경쟁은 ${board.now.competition}${board.now.competition === '여유' ? '예요' : '이에요'}.` : ''}`)}</p>`);
  if (g?.best.length) parts.push(`<section><h2>덜 붐비는 시간 TOP ${g.best.length}</h2><ol>${g.best.map((b) => `<li>${esc(`${slotLabel(b.day, b.start)} — 방송 1개당 ${won(b.per)}명, 방송 ${b.broadcasts}개${b.note ? `. ${b.note}` : ''}`)}</li>`).join('')}</ol><p>방송 1개당 시청자는 그 시간 방송들의 가운데 값이에요. 큰 방송 하나가 숫자를 끌어올리지 않게 했고, 방송이 3개 미만인 시간은 빼고 계산해요.</p></section>`);
  if (g?.newcomers) {
    const n = g.newcomers;
    parts.push(`<section><h2>신입 버튜버는 이 게임을 어떻게 하고 있나요</h2><p>${esc(`최근 30일 동안 데뷔 90일 이내 버튜버 ${n.people}명이 이 게임으로 ${n.streams}번 방송했어요.${n.avgViewers !== null ? ` 방송 시청자의 가운데 값은 ${won(n.avgViewers)}명이에요.` : ''}`)}</p><ul>${n.list.map((p) => `<li><a href="/creator/${encodeURIComponent(p.slug)}">${esc(p.name)}</a> — 이 게임 ${p.streams}회${p.avgViewers !== null ? `, 평균 ${won(p.avgViewers)}명` : ''}</li>`).join('')}</ul></section>`);
  }
  if (g?.alternatives) parts.push(`<section><h2>${esc(slotLabel(g.alternatives.day, g.alternatives.start))}, 다른 게임은</h2><ul>${g.alternatives.games.map((x) => `<li>${esc(`${x.name} — 방송 1개당 ${won(x.per)}명, 방송 ${x.broadcasts}개, 경쟁 ${x.competition}`)}</li>`).join('')}</ul></section>`);
  if (board.top.length) parts.push(`<section><h2>이 게임에서 시청자가 많은 채널</h2><ol>${board.top.slice(0, 5).map((t) => `<li>${esc(`${t.name} — 이 게임 방송 평균 ${won(t.avg)}명`)}</li>`).join('')}</ol></section>`);
  parts.push(`<p>치지직 상위 100개 방송(10분마다)과 VDébut에 등록된 버튜버 방송(5분마다) 기록으로 계산해요. 작은 방송은 등록된 버튜버만 포함돼요.<a href="/analytics/method">집계 기준</a> · <a href="/analytics">방송 통계</a></p>`);
  return `<main>${parts.join('')}</main>`;
}

export function methodInitialBody(): string {
  const dl = (rows: Array<[string, string]>) => `<dl>${rows.map(([name, desc]) => `<dt>${esc(name)}</dt><dd>${esc(desc)}</dd>`).join('')}</dl>`;
  return `<main><h1>집계 기준</h1>${nav}<p>VDébut 방송 통계가 무엇을, 얼마나 자주, 어떤 기준으로 계산하는지 정리했어요.</p>`
    + `<section><h2>어떻게 모으나요</h2>${dl(METHOD_COLLECT)}</section>`
    + `<section><h2>숫자의 뜻</h2>${dl(METHOD_TERMS)}</section>`
    + `<section><h2>순위는 어떻게 정하나요</h2>${dl(METHOD_RANKS.map(([name, by, when]) => [name, `${by} · ${when} 갱신`]))}</section>`
    + `<section><h2>분류 기준</h2>${METHOD_CLASSES.map(([name, desc]) => `<h3>${esc(name)}</h3><p>${esc(desc)}</p>`).join('')}</section>`
    + `<section><h2>알아 두면 좋은 점</h2><ul>${METHOD_LIMITS.map((line) => `<li>${esc(line)}</li>`).join('')}</ul></section></main>`;
}

// 앱 셸의 제목·설명·대표 주소를 통계 주소에 맞추고 본문을 넣는다.
export function renderBoardPage(html: string, path: string, title: string, description: string, body: string, noindex = false): string {
  const canonical = siteCanonical(path);
  html = html.replace(/<html\b[^>]*>/, '<html lang="ko">');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/<meta\b[^>]*(?:name="(?:title|description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '');
  html = html.replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/g, '');
  html = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '');
  const structured = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonical, inLanguage: 'ko' };
  html = html.replace('</head>', `<meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:image" content="https://vdebut.live/og-image.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><script type="application/ld+json">${activityJson(structured)}</script>${INITIAL_PAGE_LOADING_HEAD}</head>`);
  return html.replace(/<div id="root">[\s\S]*?<\/div>/, initialPageRoot(body, '화면을 불러오고 있어요'));
}
