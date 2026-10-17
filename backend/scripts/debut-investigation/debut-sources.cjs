const { parse } = require('csv-parse/sync');
const E = require('./debut-evidence.cjs');
const SHEET_ID = '1SEcOZAhMqFLUW7bxSsBkWK0UriMD3fD82xXX2HrUf38';
const SHEET_GID = '1884409648';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
const UA = 'VDebut-Debut-Investigation/2.0';
const X_QUERIES = ['(치지직 OR CHZZK) (데뷔 OR 첫방송 OR 신인버튜버) -is:retweet', '(치지직 OR CHZZK) (재데뷔 OR 2.0 OR 3D OR 신의상 OR 복귀) -is:retweet'];

// 네트워크 오류에 인증 헤더나 외부 원문을 포함하지 않는다.
function failure(code) { throw new Error(code); }

// 스트림을 최대 크기까지만 읽어 거대한 HTML·JSON을 수집하지 않는다.
function chunks(reader, parts = [], size = 0, limit = 2 * 1024 * 1024) {
  return reader.read().then(({ done, value }) => done ? Buffer.concat(parts).toString('utf8') : size + value.byteLength > limit ? reader.cancel().then(() => failure('SOURCE_TOO_LARGE')) : chunks(reader, [...parts, Buffer.from(value)], size + value.byteLength, limit));
}

// 상태와 크기를 확인하고 읽은 뒤 스트림 잠금을 해제한다.
function responseText(response, limit) {
  return !response.ok ? Promise.reject(new Error(`SOURCE_HTTP_${response.status}`)) : !response.body ? Promise.reject(new Error('SOURCE_EMPTY_BODY')) : ((reader) => chunks(reader, [], 0, limit).finally(() => reader.releaseLock()))(response.body.getReader());
}

// 인증 API는 리다이렉트를 따르지 않아 다른 호스트로 비밀키를 보내지 않는다.
function apiJson(url, headers, fetcher) {
  return fetcher(url, { method: 'GET', redirect: 'error', headers: { 'User-Agent': UA, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(15000) }).catch(() => failure('API_NETWORK_OR_TIMEOUT')).then((response) => responseText(response, 512 * 1024)).then((text) => JSON.parse(text));
}

// Google 공개 export의 제한된 리다이렉트만 허용한다.
function googleCsv(fetcher, url = SHEET_URL, remaining = 3) {
  return !/^https:\/\/(?:docs\.google\.com|[a-z0-9.-]+\.googleusercontent\.com)\//i.test(url) ? Promise.reject(new Error('SHEET_REDIRECT_HOST_BLOCKED')) : fetcher(url, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': UA, Accept: 'text/csv' }, signal: AbortSignal.timeout(20000) }).catch(() => failure('SHEET_NETWORK_OR_TIMEOUT')).then((response) => response.status >= 300 && response.status < 400 ? Promise.resolve(response.body?.cancel()).then(() => remaining > 0 && response.headers.get('Location') ? googleCsv(fetcher, new URL(response.headers.get('Location'), url).href, remaining - 1) : failure('SHEET_REDIRECT_LIMIT')) : /html|json/i.test(response.headers.get('Content-Type') || '') ? failure('SHEET_NOT_CSV') : responseText(response, 2 * 1024 * 1024));
}

// 검사 범위는 KST 최근 45일과 향후 180일로 명시한다.
function windowFor(now) {
  return ((today) => ({ timezone: 'Asia/Seoul', today, startDate: new Date(Date.parse(`${today}T00:00:00Z`) - 45 * 86400000).toISOString().slice(0, 10), endDate: new Date(Date.parse(`${today}T00:00:00Z`) + 180 * 86400000).toISOString().slice(0, 10) }))(new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10));
}

// 시트의 공지 본문과 행 번호를 함께 읽으며 소속·플랫폼을 임의로 채우지 않는다.
function sheetSeed(row, rowNumber, fetchedAt) {
  return { displayName: E.cleanText(row[4]), rawChannelUrl: E.cleanText(row[5]), sourceActor: E.cleanText(row[6]), text: E.cleanText(row[7]), debutDate: E.normalizeDate(row[1]), rawDate: E.cleanText(row[1]), rawHour: E.cleanText(row[2]), rawMinute: E.cleanText(row[3]), debutTime: E.normalizeTime(row[2], row[3]), source: { sourceId: 'community-sheet', authority: 'COMMUNITY_UNVERIFIED', rowNumber, url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${SHEET_GID}&range=B${rowNumber}:H${rowNumber}`, publishedAt: null, fetchedAt, contentHash: E.hash(row.slice(1, 8)), excerpt: E.excerpt(row[7]) } };
}

// 날짜가 없는 후보도 검토 대상으로 보존하고 타 플랫폼은 별도로 집계한다.
function eligible(seed, window) {
  return seed.displayName && E.channel(seed.rawChannelUrl).platform !== 'OTHER' && (!E.validDate(seed.debutDate) || seed.debutDate >= window.startDate && seed.debutDate <= window.endDate);
}

// 머리말을 건너뛰는 대신 필수 열 이름과 실제 CSV 구조를 검증한다.
function sheetRows(rows, now, sourceHash) {
  return ((header) => header < 0 ? failure('SHEET_HEADER_CHANGED') : ((seeds) => ({ status: 'OK', sourceId: 'community-sheet', url: SHEET_URL, fetchedAt: now.toISOString(), contentHash: sourceHash, recordCount: rows.length, dataRowCount: seeds.length, excludedRowCount: seeds.filter((seed) => !eligible(seed, windowFor(now))).length, seeds: seeds.filter((seed) => eligible(seed, windowFor(now))) }))(rows.slice(header + 1).map((row, index) => row.length < 8 && row.some((cell) => cell.trim()) ? failure('SHEET_ROW_STRUCTURE_CHANGED') : sheetSeed(row, header + index + 2, now.toISOString())).filter((seed) => seed.displayName)))(rows.slice(0, 20).findIndex((row) => ['날짜', '시간', '분', '이름', '방송 링크', '트위터 ID'].every((label, index) => row[index + 1]?.trim() === label) && /^하고싶은말/.test(row[7]?.trim() || '')));
}

// 표준 CSV 파서로 줄바꿈·따옴표·쉼표를 보존하며 원문 전체는 보고서에 복사하지 않는다.
function parseSheet(text, now) {
  return !text.trim() || /^\s*[<{[]/.test(text) ? failure('SHEET_NOT_CSV') : sheetRows(parse(text, { bom: true, relax_column_count: true, max_record_size: 65536 }), now, E.hash(text));
}

// 단축 주소는 알려진 호스트에서만 최대 세 번 해석하고 외부 호스트는 조회하지 않는다.
function resolveChannel(raw, fetcher, remaining = 3) {
  return ((current) => current.status !== 'SHORT_URL' ? Promise.resolve(current) : remaining === 0 ? Promise.resolve({ ...current, status: 'REDIRECT_LIMIT' }) : fetcher(current.url, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000) }).then((response) => Promise.resolve(response.body?.cancel()).then(() => response.status >= 300 && response.status < 400 && response.headers.get('Location') ? resolveChannel(new URL(response.headers.get('Location'), current.url).href, fetcher, remaining - 1) : { ...current, status: `UNRESOLVED_HTTP_${response.status}` })).catch(() => ({ ...current, status: 'RESOLUTION_FAILED' })))(E.channel(raw));
}

// X 응답의 명시된 URL과 작성자만 후보로 읽고 사용자 이름을 채널 소유권으로 간주하지 않는다.
function xSeed(post, users, now) {
  return ((user, urls) => ({ displayName: E.cleanText(user?.name || user?.username || `X:${post.author_id}`), sourceActor: user?.username ? `@${user.username}` : null, authorId: post.author_id, rawChannelUrl: urls.find((url) => ['CHZZK', 'UNKNOWN'].includes(E.channel(url).platform) && E.channel(url).status !== 'UNSUPPORTED_HOST') || '', text: E.cleanText(post.text), rawDate: null, debutDate: E.textDates(post.text).length === 1 ? E.textDates(post.text)[0] : null, debutTime: E.textTimes(post.text).length === 1 ? E.textTimes(post.text)[0] : null, source: { sourceId: 'x-recent-search', authority: 'PUBLIC_POST_UNVERIFIED_AUTHOR', url: `https://x.com/${/^[A-Za-z0-9_]{1,15}$/.test(user?.username || '') ? user.username : 'i/web'}/status/${post.id}`, postId: post.id, publishedAt: post.created_at || null, fetchedAt: now.toISOString(), contentHash: E.hash({ id: post.id, authorId: post.author_id, text: post.text, urls }), excerpt: E.excerpt(post.text) } }))(users.find((user) => user.id === post.author_id), (post.entities?.urls || []).map((item) => item.unwound_url || item.expanded_url || item.url).concat(E.cleanText(post.text).match(/https?:\/\/[^\s<>]+/g) || []));
}

// 검색은 두 쿼리·각 한 페이지·최대 20건으로 제한하고 누락 가능성을 명시한다.
function xQuery(query, token, now, fetcher) {
  return apiJson(`https://api.x.com/2/tweets/search/recent?${new URLSearchParams({ query, max_results: '20', 'tweet.fields': 'created_at,author_id,entities,attachments,note_tweet', expansions: 'author_id', 'user.fields': 'username,name' })}`, { Authorization: `Bearer ${token}` }, fetcher).then((data) => data.errors?.length ? failure('X_API_PARTIAL_ERRORS') : !Number.isSafeInteger(data.meta?.result_count) || !Array.isArray(data.data || []) || (data.data || []).length !== data.meta.result_count || (data.data || []).some((post) => !/^\d{1,25}$/.test(post.id) || !post.author_id || typeof post.text !== 'string') ? failure('X_API_INVALID_RESPONSE') : ({ seeds: (data.data || []).map((post) => xSeed({ ...post, text: post.note_tweet?.text || post.text, entities: post.note_tweet?.entities || post.entities }, data.includes?.users || [], now)), pageLimited: Boolean(data.meta?.next_token) }));
}

// 인증이 없으면 검색을 수행한 것처럼 표시하지 않고 연결 상태를 남긴다.
function collectX(env, now, fetcher) {
  return !env.X_BEARER_TOKEN ? Promise.resolve({ sourceId: 'x-recent-search', status: 'NOT_CONFIGURED', reason: 'X_BEARER_TOKEN_MISSING', seeds: [] }) : Promise.all(X_QUERIES.map((query) => xQuery(query, env.X_BEARER_TOKEN, now, fetcher))).then((pages) => ({ sourceId: 'x-recent-search', status: 'OK', lookbackDays: 7, queryCount: 2, maxPosts: 40, pageLimited: pages.some((page) => page.pageLimited), seeds: pages.flatMap((page) => page.seeds) })).catch((error) => ({ sourceId: 'x-recent-search', status: 'FAILED', reason: /^SOURCE_HTTP_\d+$|^X_API_|^API_/.test(error.message) ? error.message : 'X_API_INVALID_RESPONSE', seeds: [] }));
}

// 공식 채널 API는 채널 존재만 확인하며 최초 활동·본인 소유를 인증하지 않는다.
function channelBatch(ids, env, fetcher) {
  return apiJson(`https://openapi.chzzk.naver.com/open/v1/channels?${new URLSearchParams(ids.map((id) => ['channelIds', id]))}`, { 'Client-Id': env.CHZZK_CLIENT_ID, 'Client-Secret': env.CHZZK_CLIENT_SECRET }, fetcher).then((data) => data.code !== 200 || !Array.isArray(data.content?.data) ? failure('CHZZK_INVALID_RESPONSE') : data.content.data);
}

// 최대 100개 채널을 20개씩 조회하고 키가 누락된 상태도 보고한다.
function verifyChannels(candidates, env, fetcher) {
  return !env.CHZZK_CLIENT_ID && !env.CHZZK_CLIENT_SECRET ? Promise.resolve({ sourceId: 'chzzk-official-channel', status: 'NOT_CONFIGURED', reason: 'CHZZK_CLIENT_CREDENTIALS_MISSING', channels: [] }) : !env.CHZZK_CLIENT_ID || !env.CHZZK_CLIENT_SECRET ? Promise.resolve({ sourceId: 'chzzk-official-channel', status: 'FAILED', reason: 'CHZZK_CLIENT_CREDENTIALS_INCOMPLETE', channels: [] }) : ((ids) => ids.length ? Promise.all(Array.from({ length: Math.ceil(ids.length / 20) }, (_, index) => channelBatch(ids.slice(index * 20, index * 20 + 20), env, fetcher))).then((batches) => ({ sourceId: 'chzzk-official-channel', status: 'OK', checkedChannelIds: ids, channels: batches.flat() })).catch((error) => ({ sourceId: 'chzzk-official-channel', status: 'FAILED', reason: /^SOURCE_HTTP_\d+$|^CHZZK_|^API_/.test(error.message) ? error.message : 'CHZZK_INVALID_RESPONSE', channels: [] })) : Promise.resolve({ sourceId: 'chzzk-official-channel', status: 'OK', checkedChannelIds: [], channels: [] }))([...new Set(candidates.map((candidate) => candidate.channel.channelId).filter(Boolean))]);
}

module.exports = { SHEET_URL, UA, failure, googleCsv, parseSheet, windowFor, eligible, resolveChannel, collectX, verifyChannels, responseText };
