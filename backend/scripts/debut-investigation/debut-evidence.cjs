const { createHash } = require('node:crypto');

// 결과 지문은 필드 순서에 영향받지 않게 정규화한다.
function canonical(value) {
  return Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
}

// 원문과 승인 검토 자료에는 같은 SHA-256 규칙을 사용한다.
function hash(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(canonical(value))).digest('hex');
}

// 원문을 실행하거나 지시문으로 해석하지 않고 비교할 텍스트로만 정리한다.
function cleanText(value) {
  return String(value || '').normalize('NFKC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200d\ufeff]/g, '').trim();
}

// 긴 공지의 재배포를 피하고 검토에 필요한 짧은 문구만 보관한다.
function excerpt(value) {
  return cleanText(value).split(/\s+/).slice(0, 20).join(' ').slice(0, 160);
}

// 달력에 실제 존재하지 않는 날짜는 거부한다.
function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number(value.slice(0, 4)) >= 2000 && Number(value.slice(0, 4)) <= 2100 && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

// 날짜 표기의 구분자를 정리하되 누락 연도와 날짜를 추측하지 않는다.
function normalizeDate(value) {
  return /^(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})(?:[.일])?$/.exec(cleanText(value).replace(/\s+/g, ''))?.slice(1).map((part, index) => index ? part.padStart(2, '0') : part).join('-') || null;
}

// 시간 미정과 잘못된 숫자는 임의의 오후 8시로 채우지 않는다.
function normalizeTime(hour, minute = '') {
  return /^\d{1,2}(?:시)?$/.test(cleanText(hour)) && /^(?:\d{1,2}(?:분)?)?$/.test(cleanText(minute)) && Number(String(hour).replace(/시$/, '')) <= 23 && Number(String(minute).replace(/분$/, '') || 0) <= 59 ? `${String(hour).replace(/시$/, '').padStart(2, '0')}:${String(minute).replace(/분$/, '').padStart(2, '0') || '00'}` : null;
}

// 원문에 연도까지 명시된 일자만 독립 근거로 읽는다.
function textDates(text) {
  return [...cleanText(text).matchAll(/(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*(?:일|\.)?/g)].map((match) => `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`).filter(validDate);
}

// 오전·오후 표기가 명확한 시간과 24시간 시각만 대조에 사용한다.
function textTimes(text) {
  return [...cleanText(text).matchAll(/(?:\b(\d{1,2}):(\d{2})\b)|(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/g)].flatMap((match) => match[1] ? [normalizeTime(match[1], match[2])].filter(Boolean) : Number(match[4]) >= 1 && Number(match[4]) <= 12 ? [normalizeTime(String(Number(match[4]) % 12 + (match[3] === '오후' ? 12 : 0)), match[5])].filter(Boolean) : []);
}

const EVENT_RULES = [
  ['RE_DEBUT', /재\s*데뷔|리\s*데뷔|re[-\s]?debut/i],
  ['NEW_OUTFIT', /신\s*의상|새\s*의상|new\s*outfit/i],
  ['DEBUT_3D', /(?:\b3\s*d\b|3D|쓰리디)/i],
  ['MODEL_2_0', /(?:\b2\.0\b|2\.0\s*(?:데뷔|공개))/i],
  ['MODEL_REVEAL', /(?:1\.0|live\s*2d|라이브\s*2d|새\s*모델|모델\s*공개|비주얼\s*공개|리뉴얼)/i],
  ['RETURN', /복귀|컴백|come\s*back|comeback/i],
];

// 분류는 근거 단어를 함께 반환하며 모델 공개를 첫 데뷔로 바꾸지 않는다.
function eventMatches(text) {
  return ((matches) => matches.filter((match) => match.eventType !== 'MODEL_REVEAL' || !matches.some((other) => ['MODEL_2_0', 'DEBUT_3D'].includes(other.eventType))))(EVENT_RULES.filter(([, pattern]) => pattern.test(cleanText(text))).map(([eventType, pattern]) => ({ eventType, wording: cleanText(text).match(pattern)[0] })));
}

// 이전 활동 언급과 부정·상충 표현은 자동 첫 데뷔 판정을 막는다.
function classify(text) {
  return classifyMatches(cleanText(text), eventMatches(text));
}

// 여러 행사 종류와 검토가 필요한 모호한 표현을 보존한다.
function classifyMatches(text, matches) {
  return { eventType: /(?:데뷔|공개|복귀|컴백).{0,6}(?:아니|아닌|취소)/.test(text) ? 'VERIFY' : matches.length > 1 ? 'MULTIPLE' : matches[0]?.eventType || (/첫\s*(?:방송|데뷔)|데뷔\s*(?:방송|합|합니다|예정|!)/i.test(text) && !/활동하|방송하던|기존\s*활동|주년|년차/.test(text) ? 'FIRST_DEBUT' : 'VERIFY'), eventTypes: matches.map((match) => match.eventType), matchedWording: matches, firstDebutVerified: false, priorActivityMentioned: /활동하|방송하던|기존\s*활동|주년|년차/.test(text), decision: 'LEXICAL_CANDIDATE_ONLY' };
}

// 스키마가 정한 URL만 읽고 알 수 없는 호스트를 치지직으로 추정하지 않는다.
function urlValue(value) {
  return (() => { try { return new URL(/^[a-z][a-z\d+.-]*:/i.test(cleanText(value)) ? cleanText(value) : `https://${cleanText(value)}`); } catch { return null; } })();
}

// 치지직의 완전한 채널 ID만 정규 주소로 변환한다.
function channel(value) {
  return channelFromUrl(urlValue(value));
}

// 단축 주소는 별도로 표시하며 사용자 정보·외부 호스트·포트를 허용하지 않는다.
function channelFromUrl(url) {
  return !url || url.username || url.password || url.port || !['https:', 'http:'].includes(url.protocol) ? { platform: 'UNKNOWN', status: 'INVALID_URL', channelId: null, url: null }
    : url.hostname === 'chzzk.naver.com' ? { platform: 'CHZZK', status: /^\/(?:live\/)?([a-f\d]{32})(?:\/(?:community|videos))?\/?$/i.test(url.pathname) ? 'FORMAT_VALID' : 'INVALID_CHANNEL_ID', channelId: url.pathname.match(/^\/(?:live\/)?([a-f\d]{32})(?:\/(?:community|videos))?\/?$/i)?.[1].toLowerCase() || null, url: url.pathname.match(/^\/(?:live\/)?([a-f\d]{32})(?:\/(?:community|videos))?\/?$/i) ? `https://chzzk.naver.com/${url.pathname.match(/^\/(?:live\/)?([a-f\d]{32})/i)[1].toLowerCase()}` : null }
      : ['chzzk.me', 'chzzk.id', 'buly.kr'].includes(url.hostname) ? { platform: url.hostname === 'buly.kr' ? 'UNKNOWN' : 'CHZZK', status: 'SHORT_URL', channelId: null, url: `https://${url.host}${url.pathname}${url.search}` }
        : { platform: /(?:^|\.)(?:sooplive\.co\.kr|sooplive\.com|afreecatv\.com|youtube\.com|youtu\.be|twitch\.tv)$/.test(url.hostname) ? 'OTHER' : 'UNKNOWN', status: 'UNSUPPORTED_HOST', channelId: null, url: null };
}

// 운영 DB를 읽지 않는 비교 키는 채널 ID를 우선한다.
function identityKey(candidate) {
  return `${candidate.channel.channelId || candidate.rawChannelUrl || candidate.sourceActor || candidate.displayName}:${candidate.classification.eventType}`;
}

// 같은 행사의 날짜·종류·원문 근거를 재현 가능한 지문으로 묶는다.
function fingerprint(candidate) {
  return hash({ displayName: candidate.displayName, identityKey: identityKey(candidate), date: candidate.debutDate, time: candidate.debutTime, eventType: candidate.classification.eventType, evidence: candidate.evidence.map((item) => item.contentHash).sort() });
}

module.exports = { canonical, hash, cleanText, excerpt, validDate, normalizeDate, normalizeTime, textDates, textTimes, classify, channel, urlValue, identityKey, fingerprint };
