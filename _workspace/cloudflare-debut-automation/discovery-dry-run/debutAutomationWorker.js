var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../shared/dateTimeFormatter.ts
var formatters = /* @__PURE__ */ new Map();
var MAX_FORMATTERS = 24;
function dateTimeFormatter(locale, options) {
  const key = JSON.stringify([locale, options]);
  const existing = formatters.get(key);
  if (existing) return existing;
  const formatter = new Intl.DateTimeFormat(locale, options);
  if (formatters.size >= MAX_FORMATTERS) formatters.delete(formatters.keys().next().value);
  formatters.set(key, formatter);
  return formatter;
}
__name(dateTimeFormatter, "dateTimeFormatter");

// ../shared/portal.ts
var PORTAL_TIMEZONES = ["Asia/Seoul", "Asia/Tokyo", "UTC", "America/Los_Angeles", "America/New_York", "Europe/London"];
function portalWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
__name(portalWebUrl, "portalWebUrl");
function portalChannelUrl(value, platform) {
  const safe = portalWebUrl(value);
  if (!safe) return "";
  const hosts = { CHZZK: ["chzzk.naver.com"], SOOP: ["sooplive.co.kr", "sooplive.com", "afreecatv.com"], YOUTUBE: ["youtube.com", "youtu.be"], TWITCH: ["twitch.tv"] };
  const host = new URL(safe).hostname;
  return hosts[platform]?.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)) ? safe : "";
}
__name(portalChannelUrl, "portalChannelUrl");
function portalChannelKey(value, platform) {
  const safe = portalChannelUrl(value, platform);
  if (!safe) return "";
  const url = new URL(safe);
  const parts = url.pathname.split("/").filter(Boolean);
  if (platform === "SOOP") {
    const id = ["station", "live"].includes(parts[0]) ? parts[1] : parts[0];
    return id && /^[a-z0-9_]+$/i.test(id) ? `SOOP:${id.toLowerCase()}` : "";
  }
  if (platform === "CHZZK") {
    const id = parts[0] === "live" ? parts[1] : parts[0];
    return id && /^[a-f0-9]{32}$/i.test(id) ? `CHZZK:${id.toLowerCase()}` : "";
  }
  if (platform === "TWITCH") return parts[0] && /^[a-z0-9_]+$/i.test(parts[0]) ? `TWITCH:${parts[0].toLowerCase()}` : "";
  if (platform === "YOUTUBE" && url.hostname.endsWith("youtube.com")) {
    if (parts[0]?.startsWith("@")) return `YOUTUBE:${parts[0].toLowerCase()}`;
    if (["channel", "c", "user"].includes(parts[0]) && parts[1]) return `YOUTUBE:${parts[0]}/${parts[0] === "channel" ? parts[1] : parts[1].toLowerCase()}`;
  }
  return "";
}
__name(portalChannelKey, "portalChannelKey");
function portalDateKey(value, timezone) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = dateTimeFormatter("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
}
__name(portalDateKey, "portalDateKey");
function portalUtc(date, time, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !PORTAL_TIMEZONES.includes(timezone)) return "";
  const target = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(target)) return "";
  let candidate = target;
  const format = dateTimeFormatter("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 3; i++) {
    const parts = format.formatToParts(candidate);
    const part = /* @__PURE__ */ __name((type) => parts.find((p) => p.type === type)?.value, "part");
    const wall = Date.parse(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:00Z`);
    candidate += target - wall;
  }
  const result = new Date(candidate).toISOString();
  return portalDateKey(result, timezone) === date && format.formatToParts(candidate).filter((p) => p.type === "hour" || p.type === "minute").map((p) => p.value).join(":") === time ? result : "";
}
__name(portalUtc, "portalUtc");
function portalDay(profile, timezone) {
  return profile.dateState === "TIME_TBD" ? profile.debutDate : profile.dateState === "FIXED" ? portalDateKey(profile.startAtUtc, timezone) : "";
}
__name(portalDay, "portalDay");

// ../shared/contentReview.ts
var REVIEW_PATTERNS = [
  /(?:야동|성인방송|벗방|섹스|자위|음란물|후방주의|19금)/i,
  /(?:porn(?:ography)?|onlyfans|sexually explicit|nude cam)/i,
  /(?:ミッドナイト叡智|エッな世界|よろシコ|アダルト配信|ポルノ|エロ配信)/i,
  // 성인용 팬아트·콘텐츠 태그 안내는 실제 노출 내용을 확인하기 전까지 공개하지 않는다.
  /(?:^|[^a-z0-9])(?:r-?18g?|nsfw)(?![a-z0-9])/i
];
function needsContentReview(text) {
  return REVIEW_PATTERNS.some((pattern) => pattern.test(text.normalize("NFKC")));
}
__name(needsContentReview, "needsContentReview");
function looksLikeVideoTitle(name) {
  return /【[^】]*(?:初配信|飲酒配信|新人VTuber)[^】]*】|\[(?:첫\s*방송|데뷔\s*방송|LIVE)\]/i.test(name.normalize("NFKC"));
}
__name(looksLikeVideoTitle, "looksLikeVideoTitle");
function reviewSnapshot(profile) {
  return JSON.stringify(Object.fromEntries(Object.entries(profile).filter(([key]) => !["contentReview", "ownerVerified", "requesterRole", "source"].includes(key)).sort(([a], [b]) => a.localeCompare(b))));
}
__name(reviewSnapshot, "reviewSnapshot");
function isPublicProfile(profile) {
  if (looksLikeVideoTitle(profile.displayName)) return false;
  if (needsContentReview(Object.values(profile.details || {}).join(" "))) return false;
  if (needsContentReview([profile.displayName, profile.description, profile.headline, profile.videoTitle, profile.debutGroupName, profile.agency, profile.regularSchedule, profile.fanGuide, ...(profile.media || []).flatMap((item) => [item.title, item.credit]), ...(profile.notices || []).map((item) => item.title), ...profile.tags].join(" "))) return false;
  if (profile.contentReview) {
    return profile.contentReview.state === "APPROVED" && profile.contentReview.snapshot === reviewSnapshot(profile);
  }
  return profile.source === "EXISTING";
}
__name(isPublicProfile, "isPublicProfile");
function reviewedProfile(profile, state, reviewedAt) {
  return { ...profile, contentReview: { state, snapshot: reviewSnapshot(profile), reviewedAt } };
}
__name(reviewedProfile, "reviewedProfile");

// src/services/crawlerCsv.ts
function invalidCsv() {
  throw new Error("\uC218\uC9D1 \uC6D0\uBCF8 CSV\uC758 \uB530\uC634\uD45C \uAD6C\uC870\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
}
__name(invalidCsv, "invalidCsv");
function endField(state) {
  return Object.assign(state, { row: [...state.row, state.field], field: "", quoted: false, closing: false });
}
__name(endField, "endField");
function endRow(state) {
  return Object.assign(state, { rows: [...state.rows, [...state.row, state.field]], row: [], field: "", quoted: false, closing: false });
}
__name(endRow, "endRow");
function appendField(state, character) {
  return Object.assign(state, { field: state.field + character, closing: false });
}
__name(appendField, "appendField");
function afterQuote(state, character) {
  return character === '"' ? appendField(state, '"') : character === "," ? endField(state) : character === "\n" ? endRow(state) : character === " " || character === "	" ? state : invalidCsv();
}
__name(afterQuote, "afterQuote");
function insideQuote(state, character) {
  return state.closing ? afterQuote(state, character) : character === '"' ? Object.assign(state, { closing: true }) : appendField(state, character);
}
__name(insideQuote, "insideQuote");
function consumeCharacter(state, character) {
  return state.quoted ? insideQuote(state, character) : character === "," ? endField(state) : character === "\n" ? endRow(state) : character === '"' ? state.field ? invalidCsv() : Object.assign(state, { quoted: true }) : appendField(state, character);
}
__name(consumeCharacter, "consumeCharacter");
function finishCsv(state) {
  return state.quoted && !state.closing ? invalidCsv() : state.row.length || state.field || state.quoted ? endRow(state).rows : state.rows;
}
__name(finishCsv, "finishCsv");
function validateRows(rows) {
  return rows.length < 5 || rows.slice(5).some((row) => row.some((field) => field.trim()) && row.length < 5) ? (() => {
    throw new Error("\uC218\uC9D1 \uC6D0\uBCF8 CSV\uC758 \uD589\xB7\uC5F4 \uAD6C\uC870\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  })() : rows;
}
__name(validateRows, "validateRows");
function parseCrawlerCsv(text) {
  return validateRows(finishCsv(Array.from(text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n")).reduce(consumeCharacter, { rows: [], row: [], field: "", quoted: false, closing: false })));
}
__name(parseCrawlerCsv, "parseCrawlerCsv");

// src/debutAutomation/policy.ts
var LIMITS = Object.freeze({
  external: 40,
  candidates: 20,
  weeklyProfiles: 10,
  cpuMs: 5e3,
  dbCalls: 220,
  dbReads: 3e4,
  dbWrites: 700,
  monthlyRuns: 70,
  wallMs: 15e4,
  sourceBytes: 2 * 1024 * 1024
});
var SHEET_URL = "https://docs.google.com/spreadsheets/d/1SEcOZAhMqFLUW7bxSsBkWK0UriMD3fD82xXX2HrUf38/export?format=csv&gid=1884409648";
var CALENDAR_URL = "https://welcomevirtual.sooplive.com/";
var CURATORS = ["VtuberDebutBot", "KRVtubefollower", "vvw_kr"];
function kstDay(now) {
  return new Date(now + 9 * 36e5).toISOString().slice(0, 10);
}
__name(kstDay, "kstDay");
function addDays(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);
}
__name(addDays, "addDays");
function windowFor(time, mode) {
  const today = kstDay(time);
  return { today, from: addDays(today, mode === "WEEKLY" ? -30 : -7), to: addDays(today, mode === "WEEKLY" ? 90 : 30) };
}
__name(windowFor, "windowFor");
function modeFor(cron) {
  return cron === "0 0 * * *" ? "DISCOVER" : cron === "0 12 * * *" ? "RECHECK" : cron === "0 1 * * MON" ? "WEEKLY" : null;
}
__name(modeFor, "modeFor");
function canonicalChannel(value) {
  for (const platform of ["SOOP", "CHZZK"]) {
    const key = portalChannelKey(value, platform);
    if (key) return { key, platform, url: platform === "SOOP" ? `https://www.sooplive.com/station/${key.slice(5)}` : `https://chzzk.naver.com/${key.slice(6)}` };
  }
  return null;
}
__name(canonicalChannel, "canonicalChannel");
function validDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && (/* @__PURE__ */ new Date(`${value}T00:00:00Z`)).toISOString().slice(0, 10) === value;
}
__name(validDay, "validDay");
function parseSoop(value, from, to, sourceUrl) {
  if (!value || typeof value !== "object" || !Array.isArray(value.data)) throw new Error("SOOP_SCHEMA_CHANGED");
  const seeds = [];
  for (const item of value.data) {
    if (item.expose_yn !== "Y") continue;
    const id = String(item.strm_id || ""), dt = String(item.schedule_dtm || "");
    const date = dt.slice(0, 10), time = dt.slice(11, 16);
    if (!/^[a-z0-9_]{1,50}$/i.test(id) || !validDay(date) || !portalUtc(date, time, "Asia/Seoul")) throw new Error("SOOP_INVALID_ITEM");
    if (date < from || date > to) continue;
    const channel = canonicalChannel(String(item.strm_img_link_path || `https://www.sooplive.com/station/${id}`));
    if (!channel || channel.key !== `SOOP:${id.toLowerCase()}`) throw new Error("SOOP_CHANNEL_MISMATCH");
    seeds.push({
      id: `soop:${item.idx}`,
      channelKey: channel.key,
      platform: "SOOP",
      channelUrl: channel.url,
      name: String(item.strm_nick || "").slice(0, 100),
      date,
      time,
      timezone: "Asia/Seoul",
      kind: item.schedule_type === "debut" ? "PLATFORM_DEBUT" : item.schedule_type === "transfer" ? "TRANSFER" : "UNKNOWN",
      source: "SOOP_CALENDAR",
      sourceUrl,
      primaryUrl: CALENDAR_URL,
      scopeConfirmed: item.schedule_type === "debut"
    });
  }
  return seeds;
}
__name(parseSoop, "parseSoop");
function parseSheet(text, from, to) {
  const rows = parseCrawlerCsv(text);
  if (!rows[4]?.some((cell) => cell.includes("\uB0A0\uC9DC"))) throw new Error("SHEET_HEADER_CHANGED");
  return rows.slice(5).flatMap((row) => {
    const match = (row[1] || "").match(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
    if (!match) return [];
    const date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    const channel = canonicalChannel(row[5] || "");
    if (!channel || !validDay(date) || date < from || date > to) return [];
    const h = (row[2] || "").match(/\d{1,2}/)?.[0], m = (row[3] || "").match(/\d{1,2}/)?.[0] || "00";
    return [{
      id: `sheet:${channel.key}:${date}`,
      channelKey: channel.key,
      platform: channel.platform,
      channelUrl: channel.url,
      name: (row[4] || "").slice(0, 100),
      date,
      time: h ? `${h.padStart(2, "0")}:${m.padStart(2, "0")}` : "",
      timezone: "",
      kind: "UNKNOWN",
      source: "COMMUNITY_SHEET",
      sourceUrl: SHEET_URL,
      primaryUrl: /^https:\/\/(?:www\.)?(?:x|twitter)\.com\/[\w]+\/status\/\d+\/?$/.test(row[7] || "") ? row[7] : "",
      xUrl: /^@?[a-z0-9_]{1,15}$/i.test(row[6] || "") ? `https://x.com/${row[6].replace("@", "")}` : "",
      scopeConfirmed: false
    }];
  });
}
__name(parseSheet, "parseSheet");
function decodeHtml(text) {
  return text.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => {
    const n = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : parseInt(code, 10);
    return n > 0 && n <= 1114111 ? String.fromCodePoint(n) : "";
  }).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
__name(decodeHtml, "decodeHtml");
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map((m) => [m[1].toLowerCase(), decodeHtml(m[3])]));
}
__name(attributes, "attributes");
function xMetadata(html) {
  const meta = Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attributes(m[0])).filter((a) => a.property).map((a) => [a.property, a.content || ""]));
  const links = [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => attributes(m[0]));
  return { title: meta["og:title"] || "", text: meta["og:description"] || "", links };
}
__name(xMetadata, "xMetadata");
function noticeLinks(html, ownAuthor) {
  const urls = xMetadata(html).links.flatMap(({ href = "" }) => {
    const match = href.match(/^(?:https:\/\/(?:x|twitter)\.com)?\/([a-z0-9_]{1,15})\/status\/(\d+)(?:[/?#].*)?$/i);
    return match && (!ownAuthor || match[1].toLowerCase() === ownAuthor.toLowerCase()) ? [`https://x.com/${match[1]}/status/${match[2]}`] : [];
  });
  return [...new Set(urls)];
}
__name(noticeLinks, "noticeLinks");
function primaryChannels(html) {
  const { text, links } = xMetadata(html);
  const values = [...text.matchAll(/https:\/\/[^\s<>"'…]+/g)].map((m) => m[0]);
  for (const a of links) if (a.href && text.includes(a.href) && a.title) values.push(a.title);
  return [...new Map(values.map(canonicalChannel).filter((c) => !!c).map((c) => [c.key, c])).values()];
}
__name(primaryChannels, "primaryChannels");
function parsePrimaryNotice(html, url) {
  const { title, text } = xMetadata(html), author = url.match(/x\.com\/([\w]+)\/status\/(\d+)/i);
  if (!author || !title.toLowerCase().includes(`@${author[1].toLowerCase()}`) || !text || needsContentReview(text)) return null;
  if (/(재데뷔|재\s*데뷔|프리\s*데뷔|신의상|모델\s*공개|Live\s*2D|이적|플랫폼\s*데뷔|연기|취소|해외|시차)/i.test(text)) return null;
  if (!/(첫\s*방송|버[튜츄]버\s*데뷔|버[튜츄]얼\s*데뷔)/i.test(text)) return null;
  const dates = [...text.matchAll(/(20\d{2})\s*[년.\-/]\s*(\d{1,2})\s*[월.\-/]\s*(\d{1,2})\s*일?/g)];
  const times = [...text.matchAll(/(?:(오전|오후|AM|PM)\s*)?(\d{1,2})(?:\s*:\s*(\d{2})|\s*시(?:\s*(\d{1,2})\s*분)?)/gi)];
  if (dates.length !== 1 || times.length !== 1 || !/(KST|한국\s*시간|서울\s*시간)/i.test(text)) return null;
  const d = dates[0], t = times[0], date = `${d[1]}-${d[2].padStart(2, "0")}-${d[3].padStart(2, "0")}`;
  let hour = Number(t[2]);
  if (t[1]) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (/오후|PM/i.test(t[1]) ? 12 : 0);
  }
  const time = `${String(hour).padStart(2, "0")}:${(t[3] || t[4] || "00").padStart(2, "0")}`;
  const channels = primaryChannels(html);
  if (channels.length !== 1 || !channels[0] || !validDay(date) || !portalUtc(date, time, "Asia/Seoul")) return null;
  const channel = channels[0];
  return { id: `x:${author[2]}`, channelKey: channel.key, platform: channel.platform, channelUrl: channel.url, name: "", date, time, timezone: "Asia/Seoul", kind: "FIRST_DEBUT", source: "X_NOTICE", sourceUrl: url, primaryUrl: url, xUrl: `https://x.com/${author[1]}`, scopeConfirmed: true };
}
__name(parsePrimaryNotice, "parsePrimaryNotice");
function extractLabelledDetails(text) {
  const result = {};
  const labels = [["species", "\uC885\uC871"], ["birthday", "\uC0DD\uC77C"], ["height", "\uC2E0\uC7A5|\uD0A4"], ["mbti", "MBTI"], ["fandomName", "\uD32C\uB364\uBA85|\uD32C\uB124\uC784"], ["oshiMark", "\uC624\uC2DC\uB9C8\uD06C|\uD32C\uB9C8\uD06C"]];
  for (const [key, label] of labels) {
    const m = text.normalize("NFKC").match(new RegExp(`(?:^|\\n)\\s*(?:${label})\\s*[:\uFF1A]\\s*([^\\r\\n<>]{1,60})`, "i"));
    if (!m || needsContentReview(m[1]) || /미정|비공개|추후|TBD/i.test(m[1])) continue;
    const value = m[1].trim();
    if (key === "mbti" && !/^[IE][NS][FT][JP]$/i.test(value)) continue;
    if (key === "height" && !/^\d{2,3}(?:\.\d)?\s*cm$/i.test(value)) continue;
    if (key === "birthday" && !/^\d{1,2}월\s*\d{1,2}일$/.test(value)) continue;
    result[key] = value;
  }
  return result;
}
__name(extractLabelledDetails, "extractLabelledDetails");
function buildProfile(seed, name, avatarUrl, now) {
  if (!seed.scopeConfirmed || !["FIRST_DEBUT", "PLATFORM_DEBUT"].includes(seed.kind)) throw new Error("EVENT_SCOPE_UNCONFIRMED");
  if (!name || name.length > 100 || looksLikeVideoTitle(name) || needsContentReview(name)) throw new Error("NAME_CONTENT_HOLD");
  const startAtUtc = portalUtc(seed.date, seed.time, seed.timezone);
  if (!startAtUtc) throw new Error("SCHEDULE_UNCONFIRMED");
  const scope = seed.kind === "PLATFORM_DEBUT" ? `${seed.platform} \uD50C\uB7AB\uD3FC \uB370\uBDD4` : "\uBC84\uD29C\uBC84 \uB370\uBDD4";
  const profile = {
    slug: `${seed.channelKey.split(":")[1]}-${seed.platform.toLowerCase()}`,
    displayName: name,
    description: `${name}\uC758 ${scope} \uC77C\uC815\uC785\uB2C8\uB2E4. \uACF5\uC2DD \uACF5\uC9C0\uC640 \uBC29\uC1A1\uAD6D\uC5D0\uC11C \uD655\uC778\uD55C \uC815\uBCF4\uB97C \uC548\uB0B4\uD569\uB2C8\uB2E4.`,
    avatarUrl,
    platform: seed.platform,
    channelUrl: seed.channelUrl,
    countryCode: seed.timezone === "Asia/Seoul" ? "KR" : "",
    languages: [],
    tags: [],
    agency: "",
    xUrl: seed.xUrl || "",
    debutKind: seed.kind,
    dateState: "FIXED",
    debutDate: seed.date,
    debutTime: seed.time,
    timezone: seed.timezone,
    startAtUtc,
    targetMonth: seed.date.slice(0, 7),
    ownerVerified: false,
    source: "REGISTERED",
    noticeUrl: seed.primaryUrl,
    headline: scope
  };
  const reviewed = reviewedProfile(profile, "APPROVED", now);
  if (!isPublicProfile(reviewed)) throw new Error("PUBLIC_POLICY_HOLD");
  return reviewed;
}
__name(buildProfile, "buildProfile");

// src/debutAutomation/network.ts
var ALLOWED = ["welcomevirtual.sooplive.com", "chapi.sooplive.co.kr", "api.chzzk.naver.com", "docs.google.com", "doc-0c-0o-sheets.googleusercontent.com", "x.com", "twitter.com", "www.sooplive.com", "profile.img.sooplive.co.kr", "stimg.sooplive.co.kr", "nng-phinf.pstatic.net"];
var BudgetNetwork = class {
  constructor(deadline, fetcher = fetch) {
    this.deadline = deadline;
    this.fetcher = fetcher;
    this.requests = 0;
    this.bytes = 0;
  }
  static {
    __name(this, "BudgetNetwork");
  }
  async get(url, maxBytes = LIMITS.sourceBytes, headers = {}) {
    let target = new URL(url);
    for (let redirects = 0; redirects < 4; redirects++) {
      if (target.protocol !== "https:" || target.username || target.password || target.port || !ALLOWED.includes(target.hostname) && !target.hostname.endsWith("-sheets.googleusercontent.com")) throw new Error("SOURCE_HOST_REJECTED");
      if (this.requests >= LIMITS.external) throw new Error("EXTERNAL_BUDGET_EXCEEDED");
      if (Date.now() >= this.deadline) throw new Error("WALL_BUDGET_EXCEEDED");
      this.requests++;
      const response = await this.fetcher(target.href, { redirect: "manual", headers: { Accept: "*/*", ...headers }, signal: AbortSignal.timeout(Math.min(12e3, this.deadline - Date.now())) });
      if (response.status >= 300 && response.status < 400 && response.status !== 304) {
        await response.body?.cancel();
        const location = response.headers.get("Location");
        if (!location) throw new Error("INVALID_REDIRECT");
        target = new URL(location, target);
        continue;
      }
      if (response.status !== 200) {
        await response.body?.cancel();
        return { status: response.status, text: "", bytes: new Uint8Array(), headers: response.headers };
      }
      if (Number(response.headers.get("Content-Length") || 0) > maxBytes) {
        await response.body?.cancel();
        throw new Error("SOURCE_TOO_LARGE");
      }
      const chunks = [];
      let size = 0;
      const reader = response.body?.getReader();
      if (!reader) throw new Error("EMPTY_SOURCE");
      try {
        for (; ; ) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          this.bytes += value.byteLength;
          if (size > maxBytes) {
            await reader.cancel();
            throw new Error("SOURCE_TOO_LARGE");
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { status: 200, text: new TextDecoder().decode(bytes), bytes, headers: response.headers };
    }
    throw new Error("REDIRECT_LIMIT");
  }
  async json(url) {
    const r = await this.get(url);
    if (r.status !== 200) throw new Error(`SOURCE_HTTP_${r.status}`);
    return JSON.parse(r.text);
  }
};
async function sha256(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
async function verifyImage(net, url) {
  const u = new URL(url);
  if (!["profile.img.sooplive.co.kr", "stimg.sooplive.co.kr", "nng-phinf.pstatic.net"].includes(u.hostname)) throw new Error("IMAGE_HOST_HOLD");
  const r = await net.get(url, 2 * 1024 * 1024);
  if (r.status !== 200) throw new Error(`IMAGE_HTTP_${r.status}`);
  if (!rasterDimensions(r.bytes)) throw new Error("IMAGE_INVALID_RASTER");
  return sha256(r.bytes);
}
__name(verifyImage, "verifyImage");
function rasterDimensions(b) {
  if (b.length < 32) return false;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength), text = /* @__PURE__ */ __name((a, z) => new TextDecoder().decode(b.slice(a, z)), "text");
  let width = 0, height = 0;
  if (b[0] === 137 && text(1, 8) === "PNG\r\n\n" && text(12, 16) === "IHDR" && text(b.length - 8, b.length - 4) === "IEND") {
    width = v.getUint32(16);
    height = v.getUint32(20);
  } else if (["GIF87a", "GIF89a"].includes(text(0, 6)) && b[b.length - 1] === 59) {
    width = v.getUint16(6, true);
    height = v.getUint16(8, true);
  } else if (b[0] === 255 && b[1] === 216 && b[b.length - 2] === 255 && b[b.length - 1] === 217) {
    for (let p = 2; p + 9 < b.length; ) {
      if (b[p] !== 255) break;
      const marker = b[p + 1];
      if (marker === 218 || marker === 217) break;
      if (marker === 255) {
        p++;
        continue;
      }
      const size = v.getUint16(p + 2);
      if (size < 2 || p + 2 + size > b.length) break;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
        height = v.getUint16(p + 5);
        width = v.getUint16(p + 7);
        break;
      }
      p += size + 2;
    }
  } else if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP" && v.getUint32(4, true) + 8 === b.length) {
    const format = text(12, 16);
    if (format === "VP8X") {
      width = 1 + b[24] + (b[25] << 8) + (b[26] << 16);
      height = 1 + b[27] + (b[28] << 8) + (b[29] << 16);
    } else if (format === "VP8L" && b[20] === 47) {
      const bits = v.getUint32(21, true);
      width = (bits & 16383) + 1;
      height = (bits >>> 14 & 16383) + 1;
    } else if (format === "VP8 " && b[23] === 157 && b[24] === 1 && b[25] === 42) {
      width = v.getUint16(26, true) & 16383;
      height = v.getUint16(28, true) & 16383;
    }
  }
  return width > 0 && height > 0 && width <= 4096 && height <= 4096;
}
__name(rasterDimensions, "rasterDimensions");

// src/services/portalProfileRepository.ts
function legacyProfile(row) {
  const registrationOnly = row.description === `${row.display_name} \uC2A4\uD2B8\uB9AC\uBA38\uC758 \uCC44\uB110\uC785\uB2C8\uB2E4.` && row.debut_time === "00:00";
  const dateUnknown = /\[일정 미정\]|\[날짜 미정\]|\[미정\]/.test(row.description || "") || !row.start_at_utc;
  const timeUnknown = /\[시간 미정\]/.test(row.description || "");
  return {
    slug: row.slug,
    displayName: row.display_name,
    description: row.description || "",
    avatarUrl: portalWebUrl(row.profile_image_url || ""),
    agency: row.agency_name || "",
    platform: row.platform,
    channelUrl: portalChannelUrl(row.channel_url || "", row.platform),
    countryCode: row.country_code === "EN" ? "" : row.country_code || "",
    languages: [],
    tags: [],
    xUrl: portalWebUrl(row.x_url || ""),
    dateState: registrationOnly ? "NONE" : timeUnknown ? "TIME_TBD" : dateUnknown ? "DATE_TBD" : "FIXED",
    debutDate: registrationOnly ? "" : row.debut_date || "",
    debutTime: registrationOnly ? "" : row.debut_time || "",
    timezone: row.timezone || "Asia/Seoul",
    startAtUtc: row.start_at_utc || "",
    targetMonth: (row.debut_date || row.start_at_utc || "").slice(0, 7),
    ownerVerified: false,
    source: "EXISTING"
  };
}
__name(legacyProfile, "legacyProfile");

// src/debutAutomation/store.ts
var DiscoveryStore = class {
  constructor(db, runId) {
    this.db = db;
    this.runId = runId;
    this.calls = 0;
    this.reads = 0;
    this.writes = 0;
  }
  static {
    __name(this, "DiscoveryStore");
  }
  before(count = 1, writeAllowance = 60) {
    if (this.calls + count > LIMITS.dbCalls || this.reads > LIMITS.dbReads - 8e3 || this.writes > LIMITS.dbWrites - writeAllowance) throw new Error("DATABASE_BUDGET_EXCEEDED");
    this.calls += count;
  }
  account(results) {
    for (const r of results) {
      this.reads += r.meta.rows_read || 0;
      this.writes += r.meta.rows_written || 0;
    }
  }
  async all(sql, args = []) {
    this.before();
    const r = await this.db.prepare(sql).bind(...args).all();
    this.account([r]);
    return r.results;
  }
  async execute(sql, args = [], writeAllowance = 60) {
    this.before(1, writeAllowance);
    const r = await this.db.prepare(sql).bind(...args).run();
    this.account([r]);
    return r;
  }
  async batch(statements) {
    this.before(statements.length);
    const results = await this.db.batch(statements.map((s) => this.db.prepare(s.sql).bind(...s.args)));
    this.account(results);
    return results;
  }
  // 슬롯 고유키와 전역 임대로 중복 실행을 막고 월 사용량을 실행 전에 예약한다.
  async begin(slot, month, mode, now) {
    const until = new Date(Date.parse(now) + 10 * 6e4).toISOString();
    const r = await this.batch([
      { sql: `INSERT OR IGNORE INTO debut_automation_months(month) VALUES(?)`, args: [month] },
      { sql: `INSERT OR IGNORE INTO debut_automation_runs(slot,id,month,mode,status,started_at)
       SELECT ?,?,?,?,'RUNNING',? WHERE EXISTS(SELECT 1 FROM debut_automation_control WHERE id='discovery' AND enabled=1 AND lease_until<?)
       AND EXISTS(SELECT 1 FROM debut_automation_months WHERE month=? AND runs<?)`, args: [slot, this.runId, month, mode, now, now, month, LIMITS.monthlyRuns] },
      { sql: `UPDATE debut_automation_control SET lease_owner=?,lease_until=? WHERE id='discovery' AND enabled=1 AND lease_until<?
       AND EXISTS(SELECT 1 FROM debut_automation_runs WHERE id=? AND status='RUNNING')`, args: [this.runId, until, now, this.runId] },
      { sql: `UPDATE debut_automation_months SET runs=runs+1,reserved_external=reserved_external+?,reserved_reads=reserved_reads+?,reserved_writes=reserved_writes+?
       WHERE month=? AND EXISTS(SELECT 1 FROM debut_automation_control WHERE id='discovery' AND lease_owner=?)`, args: [LIMITS.external, LIMITS.dbReads, LIMITS.dbWrites, month, this.runId] }
    ]);
    return r[2].meta.changes === 1;
  }
  async finish(status, summary) {
    await this.db.batch([
      this.db.prepare("UPDATE debut_automation_runs SET status=?,finished_at=?,summary=? WHERE id=?").bind(status, (/* @__PURE__ */ new Date()).toISOString(), JSON.stringify(summary), this.runId),
      this.db.prepare("UPDATE debut_automation_control SET lease_owner='',lease_until='' WHERE id='discovery' AND lease_owner=?").bind(this.runId)
    ]);
  }
  async saveSeed(seed, now) {
    const json = JSON.stringify(seed), hash = await sha256(json);
    const r = await this.execute(`INSERT INTO debut_automation_candidates(id,channel_key,source,seed,source_hash,first_seen_at,last_seen_at)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET seed=excluded.seed,source_hash=excluded.source_hash,last_seen_at=excluded.last_seen_at,
      status='QUEUED',next_check_at='' WHERE debut_automation_candidates.source_hash!=excluded.source_hash`, [seed.id, seed.channelKey, seed.source, json, hash, now, now]);
    return r.meta.changes === 1;
  }
  async snapshot() {
    const legacyRows = await this.all(`SELECT i.slug,i.display_name,i.description,i.profile_image_url,i.agency_name,i.country_code,i.x_url,i.debut_date,i.debut_time,i.timezone,i.start_at_utc,c.platform,c.channel_url FROM streamerChannel_info i JOIN streamerChannel c ON c.id=i.channel_id WHERE i.slug IS NOT NULL AND i.slug!='' LIMIT 2001`);
    const additions = await this.all("SELECT data FROM portal_profiles LIMIT 2001");
    const pending = await this.all(`SELECT slug,json_extract(payload,'$.platform') AS platform,json_extract(payload,'$.channelUrl') AS channel_url,COALESCE(json_extract(payload,'$.additionalChannels'),'[]') AS payload_channels FROM portal_requests WHERE status='PENDING' LIMIT 501`);
    const pendingKeys = await this.all("SELECT channel_key FROM portal_pending_channels LIMIT 501");
    if (legacyRows.length > 2e3 || additions.length > 2e3 || pending.length > 500 || pendingKeys.length > 500) throw new Error("REGISTRY_SNAPSHOT_LIMIT");
    const legacy = new Map(legacyRows.map((r) => [r.slug, r])), profiles = new Map(legacyRows.map((r) => [r.slug, legacyProfile(r)]));
    const raw = /* @__PURE__ */ new Map();
    for (const row of additions) {
      const p = JSON.parse(row.data);
      raw.set(p.slug, row.data);
      profiles.set(p.slug, p);
    }
    const keys = /* @__PURE__ */ new Map();
    for (const p of profiles.values()) for (const c of [{ platform: p.platform, channelUrl: p.channelUrl }, ...p.additionalChannels || []]) {
      const key = portalChannelKey(c.channelUrl, c.platform);
      if (key) keys.set(key, p);
    }
    const pk = new Set(pendingKeys.map((r) => r.channel_key)), ps = /* @__PURE__ */ new Set();
    for (const r of pending) {
      if (r.slug) ps.add(r.slug);
      const key = portalChannelKey(r.channel_url || "", r.platform);
      if (key) pk.add(key);
      for (const c of JSON.parse(r.payload_channels || "[]")) {
        const k = portalChannelKey(c.channelUrl || "", c.platform);
        if (k) pk.add(k);
      }
    }
    return { profiles: [...profiles.values()], raw, legacy, keys, pending: pk, pendingSlugs: ps };
  }
  async mark(candidate, status, reason, now, next, evidence = {}, imageHash = "") {
    await this.execute(`UPDATE debut_automation_candidates SET status=?,reason=?,last_checked_at=?,next_check_at=?,evidence=?,image_hash=CASE WHEN ?!='' THEN ? ELSE image_hash END,
      failures=CASE WHEN ?='FAILED' THEN failures+1 ELSE 0 END WHERE id=?`, [status, reason, now, next, JSON.stringify(evidence), imageHash, imageHash, status, candidate.id]);
  }
  async adopt(candidate, profile, raw) {
    await this.execute("UPDATE debut_automation_candidates SET profile_slug=?,managed_json=? WHERE id=? AND managed_json=''", [profile.slug, raw, candidate.id]);
    candidate.profile_slug = profile.slug;
    candidate.managed_json = raw;
  }
  async publish(candidate, profile, previous, snapshot, now) {
    const json = JSON.stringify(profile), key = portalChannelKey(profile.channelUrl, profile.platform), aliases = channelAliases(profile);
    const placeholders = aliases.map(() => "?").join(","), old = previous ? snapshot.raw.get(previous.slug) : void 0;
    const legacy = previous ? snapshot.legacy.get(previous.slug) : void 0;
    if (previous && candidate.managed_json !== (old || JSON.stringify(previous))) throw new Error("OPERATOR_MODIFICATION_HOLD");
    const guardArgs = [this.runId, now, key, profile.slug];
    let guard = `EXISTS(SELECT 1 FROM debut_automation_control WHERE id='discovery' AND enabled=1 AND lease_owner=? AND lease_until>?)
      AND NOT EXISTS(SELECT 1 FROM portal_pending_channels WHERE channel_key=?)
      AND NOT EXISTS(SELECT 1 FROM portal_requests WHERE status='PENDING' AND (slug=?`;
    guard += ` OR json_extract(payload,'$.channelUrl') IN (${placeholders})))`;
    guardArgs.push(...aliases);
    guard += ` AND NOT EXISTS(SELECT 1 FROM debut_submissions WHERE status='PENDING' AND channel_url IN (${placeholders}))`;
    guardArgs.push(...aliases);
    if (old !== void 0) {
      guard += " AND EXISTS(SELECT 1 FROM portal_profiles WHERE slug=? AND data=?)";
      guardArgs.push(profile.slug, old);
    } else {
      guard += " AND NOT EXISTS(SELECT 1 FROM portal_profiles WHERE slug=? OR channel_url IN (" + placeholders + "))";
      guardArgs.push(profile.slug, ...aliases);
      if (legacy) {
        const entries = Object.entries(legacy).filter(([k]) => !["platform", "channel_url"].includes(k));
        guard += ` AND EXISTS(SELECT 1 FROM streamerChannel_info WHERE ${entries.map(([k]) => `${k} IS ?`).join(" AND ")})`;
        guardArgs.push(...entries.map(([, v]) => v));
      } else {
        guard += ` AND NOT EXISTS(SELECT 1 FROM streamerChannel_info WHERE slug=?) AND NOT EXISTS(SELECT 1 FROM streamerChannel_info i JOIN streamerChannel c ON c.id=i.channel_id WHERE c.channel_url IN (${placeholders}))`;
        guardArgs.push(profile.slug, ...aliases);
      }
    }
    guard += " AND NOT EXISTS(SELECT 1 FROM portal_profile_channels WHERE (channel_key=? AND slug!=?) OR (slug=? AND channel_key!=?))";
    guardArgs.push(key, profile.slug, profile.slug, key);
    const tokenSql = "EXISTS(SELECT 1 FROM debut_automation_candidates WHERE id=? AND publish_token=?)";
    const r = await this.batch([
      { sql: `UPDATE debut_automation_candidates SET publish_token=? WHERE id=? AND source_hash=? AND ${guard}`, args: [this.runId, candidate.id, candidate.source_hash, ...guardArgs] },
      { sql: `INSERT INTO portal_profile_channels(channel_key,slug) SELECT ?,? WHERE ${tokenSql} ON CONFLICT(channel_key) DO NOTHING`, args: [key, profile.slug, candidate.id, this.runId] },
      { sql: `INSERT INTO portal_profiles(slug,channel_url,data,updated_at) SELECT ?,?,?,? WHERE ${tokenSql} ON CONFLICT(slug) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`, args: [profile.slug, profile.channelUrl, json, now, candidate.id, this.runId] },
      { sql: `INSERT INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash,created_at) SELECT ?,?,?,?,?,?,? WHERE ${tokenSql}`, args: [crypto.randomUUID(), profile.slug, old || JSON.stringify(previous || {}), json, `\uACF5\uC2DD \uCD9C\uCC98 \uC790\uB3D9 \uAC80\uC99D: ${candidate.id}`, `automation:${this.runId}`, now, candidate.id, this.runId] },
      { sql: `UPDATE debut_automation_candidates SET managed_json=?,profile_slug=?,status='PUBLISHED_PENDING_CHECK',reason='',publish_token='' WHERE id=? AND publish_token=?`, args: [json, profile.slug, candidate.id, this.runId] }
    ]);
    if (r[0].meta.changes !== 1) return false;
    snapshot.raw.set(profile.slug, json);
    snapshot.keys.set(key, profile);
    snapshot.profiles = snapshot.profiles.filter((p) => p.slug !== profile.slug).concat(profile);
    candidate.managed_json = json;
    candidate.profile_slug = profile.slug;
    return true;
  }
};
function channelAliases(profile) {
  const key = portalChannelKey(profile.channelUrl, profile.platform), id = key.split(":")[1];
  if (profile.platform === "CHZZK") return [`https://chzzk.naver.com/${id}`, `https://chzzk.naver.com/live/${id}`];
  return ["www.sooplive.com/station/", "ch.sooplive.co.kr/", "www.sooplive.co.kr/station/", "bj.afreecatv.com/", "ch.sooplive.com/"].map((p) => `https://${p}${id}`);
}
__name(channelAliases, "channelAliases");

// src/debutAutomation/sources.ts
function safeError(error) {
  const message = error instanceof Error ? error.message : "";
  return /^[A-Z][A-Z0-9_]{2,80}$/.test(message) ? message : "SOURCE_OR_PARSE_ERROR";
}
__name(safeError, "safeError");
async function collectSources(store, net, from, to, now) {
  const previous = new Map((await store.all("SELECT * FROM debut_automation_sources LIMIT 10")).map((r) => [r.id, r]));
  const definitions = [
    { id: "soop-calendar", url: `${CALENDAR_URL}api/api.php?work=getScheduleList&startDate=${from}&endDate=${to}`, kind: "soop" },
    { id: "community-sheet", url: SHEET_URL, kind: "sheet" },
    ...CURATORS.map((author) => ({ id: `x-curator:${author}`, url: `https://x.com/${author}`, kind: "x" }))
  ];
  const seeds = [], sources = [];
  for (let offset = 0; offset < definitions.length; offset += 3) {
    const results = await Promise.allSettled(definitions.slice(offset, offset + 3).map(async (definition) => {
      const old = previous.get(definition.id);
      if (old && old.failures >= 3 && Date.parse(old.checked_at) + 864e5 > Date.parse(now)) return { definition, old, status: "BACKOFF", value: old.cached, reason: old.reason };
      if (definition.kind === "x" && old?.status === "OK" && Date.parse(old.checked_at) + 2 * 36e5 > Date.parse(now)) return { definition, old, status: "CACHED", value: old.cached, reason: "" };
      try {
        const r = await net.get(definition.url);
        if (r.status !== 200) throw new Error(`SOURCE_HTTP_${r.status}`);
        const parsed = definition.kind === "soop" ? parseSoop(JSON.parse(r.text), from, to, definition.url) : definition.kind === "sheet" ? parseSheet(r.text, from, to) : noticeLinks(r.text);
        if (definition.kind === "x" && parsed.length === 0) throw new Error("X_PUBLIC_FEED_UNAVAILABLE");
        return { definition, old, status: "OK", value: JSON.stringify(parsed), reason: "" };
      } catch (error) {
        return { definition, old, status: "FAILED", value: old?.cached || "", reason: safeError(error) };
      }
    }));
    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      if (result.status !== "fulfilled") throw result.reason;
      const { definition, old, status, value, reason } = result.value;
      if (status === "OK") {
        await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,last_success_at,content_hash,cached) VALUES(?,?,'OK',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET url=excluded.url,status='OK',checked_at=excluded.checked_at,last_success_at=excluded.last_success_at,failures=0,reason='',content_hash=excluded.content_hash,cached=excluded.cached`, [definition.id, definition.url, now, now, await sha256(value), value]);
      } else if (status === "FAILED") {
        await store.execute(`INSERT INTO debut_automation_sources(id,url,status,checked_at,failures,reason) VALUES(?,?,'FAILED',?,1,?)
         ON CONFLICT(id) DO UPDATE SET status='FAILED',checked_at=excluded.checked_at,failures=failures+1,reason=excluded.reason`, [definition.id, definition.url, now, reason]);
      }
      const items = status === "OK" || status === "CACHED" ? JSON.parse(value) : [];
      if (definition.kind === "x") {
        const urls = items.slice(0, 60);
        if (urls.length) await store.execute(`INSERT OR IGNORE INTO debut_automation_notices(url,source_url,first_seen_at) VALUES ${urls.map(() => "(?,?,?)").join(",")}`, urls.flatMap((url) => [url, definition.url, now]), urls.length * 4 + 10);
      } else seeds.push(...items);
      sources.push({ id: definition.id, status, count: items.length, reason: reason || "" });
    }
  }
  return { seeds, sources };
}
__name(collectSources, "collectSources");
async function officialChannel(net, seed) {
  const id = seed.channelKey.split(":")[1];
  const apiUrl = seed.platform === "SOOP" ? `https://chapi.sooplive.co.kr/api/${id}/station` : `https://api.chzzk.naver.com/service/v1/channels/${id}`;
  const value = await net.json(apiUrl);
  if (seed.platform === "SOOP") {
    const station = value.station;
    if (!station || String(station.user_id || "").toLowerCase() !== id) throw new Error("CHANNEL_ID_MISMATCH");
    const image = String(value.profile_image || "");
    return { name: String(station.user_nick || ""), image: image.startsWith("//") ? `https:${image}` : image, bio: String(station.station_title || ""), apiUrl };
  }
  const content = value.content;
  if (value.code !== 200 || !content || content.channelId !== id) throw new Error("CHANNEL_ID_MISMATCH");
  return { name: String(content.channelName || ""), image: String(content.channelImageUrl || ""), bio: String(content.channelDescription || ""), apiUrl };
}
__name(officialChannel, "officialChannel");

// src/debutAutomation/runner.ts
var KNOWN_NOTICES = {
  "CHZZK:037d7ba305538de29dbf2789071dbb82": "https://x.com/_amyangyang/status/2119427989998108786",
  "CHZZK:7795f5c37a5941cc20f44f5ee2744cd8": "https://x.com/leopyaco/status/2117611502249312379",
  "CHZZK:bce5bac086baed274db13a2c9aacd41b": "https://x.com/huto00q/status/2118989751785226662"
};
function registeredSeeds(snapshot, seen, from, to) {
  return snapshot.profiles.filter((p) => ["CHZZK", "SOOP"].includes(p.platform) && p.dateState === "FIXED" && p.debutDate >= from && p.debutDate <= to).flatMap((p) => {
    const id = p.channelUrl.match(/[a-f0-9]{32}/i)?.[0];
    if (p.platform !== "CHZZK" || !id || seen.has(`CHZZK:${id}`)) return [];
    const key = `CHZZK:${id}`;
    return [{
      id: `registered:${key}`,
      channelKey: key,
      platform: "CHZZK",
      channelUrl: p.channelUrl,
      name: p.displayName,
      date: p.debutDate,
      time: p.debutTime,
      timezone: p.timezone,
      kind: p.debutKind || "FIRST_DEBUT",
      source: "REGISTERED",
      sourceUrl: p.noticeUrl || KNOWN_NOTICES[key] || p.xUrl,
      primaryUrl: p.noticeUrl || KNOWN_NOTICES[key] || "",
      xUrl: p.xUrl,
      scopeConfirmed: false
    }];
  });
}
__name(registeredSeeds, "registeredSeeds");
function aligned(profile, seed, name, image) {
  return profile.displayName === name && profile.avatarUrl === image && profile.debutDate === seed.date && profile.debutTime === seed.time && profile.timezone === seed.timezone && profile.dateState === "FIXED";
}
__name(aligned, "aligned");
function confirmsRegisteredNotice(html, seed) {
  const { text, title } = xMetadata(html), author = seed.primaryUrl.match(/x\.com\/([\w]+)\/status\//)?.[1];
  if (!author || !title.toLowerCase().includes(`@${author.toLowerCase()}`) || !text || /(취소|연기|해외|시차)/.test(text)) return false;
  const month = Number(seed.date.slice(5, 7)), day = Number(seed.date.slice(8, 10)), hour = Number(seed.time.slice(0, 2)), minute = seed.time.slice(3);
  const date = new RegExp(`(?:^|[^0-9])0?${month}\\s*[\uC6D4./-]\\s*0?${day}(?:\uC77C|[^0-9]|$)`);
  const time24 = new RegExp(`(?:^|[^0-9])${hour}\\s*(?::\\s*${minute}|\uC2DC${minute === "00" ? "" : `\\s*${Number(minute)}\\s*\uBD84`})(?:[^0-9]|$)`);
  const time12 = new RegExp(`(?:${hour >= 12 ? "\uC624\uD6C4|PM" : "\uC624\uC804|AM"})\\s*${hour % 12 || 12}\\s*(?::\\s*${minute}|\uC2DC${minute === "00" ? "" : `\\s*${Number(minute)}\\s*\uBD84`})`, "i");
  return date.test(text) && (time24.test(text) || time12.test(text)) && /(첫\s*방송|데뷔)/.test(text);
}
__name(confirmsRegisteredNotice, "confirmsRegisteredNotice");
async function validateSeed(net, seed, existing, sourceOk) {
  if (seed.source === "SOOP_CALENDAR") {
    if (!sourceOk) throw new Error("SOURCE_NOT_FRESH");
    if (seed.kind !== "PLATFORM_DEBUT") throw new Error("EVENT_SCOPE_HOLD");
    return seed;
  }
  if (!seed.primaryUrl) throw new Error("PRIMARY_NOTICE_REQUIRED");
  const r = await net.get(seed.primaryUrl);
  if (r.status !== 200) throw new Error(`PRIMARY_HTTP_${r.status}`);
  const parsed = parsePrimaryNotice(r.text, seed.primaryUrl);
  if (parsed && parsed.channelKey === seed.channelKey) return { ...parsed, id: seed.id, sourceUrl: seed.sourceUrl };
  if (existing && seed.source === "REGISTERED" && isPublicProfile(existing) && KNOWN_NOTICES[seed.channelKey] === seed.primaryUrl && confirmsRegisteredNotice(r.text, seed)) return { ...seed, scopeConfirmed: true };
  throw new Error("PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD");
}
__name(validateSeed, "validateSeed");
async function checkCandidate(store, net, candidate, snapshot, summary, now, freshIds) {
  let seed = JSON.parse(candidate.seed);
  const existing = snapshot.keys.get(seed.channelKey);
  if (snapshot.pending.has(seed.channelKey) || existing && snapshot.pendingSlugs.has(existing.slug)) throw new Error("PENDING_OR_OPERATOR_CONFLICT");
  if (seed.date > addDays(summary.range.today, 30)) throw new Error("LONG_RANGE_CANDIDATE_ONLY");
  if (seed.source === "SOOP_CALENDAR" && seed.kind !== "PLATFORM_DEBUT") throw new Error("EVENT_SCOPE_HOLD");
  if (seed.source === "SOOP_CALENDAR" && !freshIds.has(seed.id)) throw new Error("OFFICIAL_SCHEDULE_NOT_PRESENT_NO_DELETE");
  const channel = await officialChannel(net, seed);
  if (needsContentReview(`${channel.name}
${channel.bio}`)) throw new Error("CONTENT_REVIEW_HOLD");
  const imageHash = await verifyImage(net, channel.image);
  seed = await validateSeed(net, seed, existing, summary.sources.some((s) => s.id === "soop-calendar" && s.status === "OK"));
  const fresh = buildProfile(seed, channel.name, channel.image, now);
  let profile = fresh;
  if (existing) {
    profile = { ...existing, displayName: channel.name, avatarUrl: channel.image, countryCode: existing.countryCode || fresh.countryCode, debutDate: seed.date, debutTime: seed.time, timezone: seed.timezone, startAtUtc: portalUtc(seed.date, seed.time, seed.timezone), targetMonth: seed.date.slice(0, 7), dateState: "FIXED", debutKind: seed.kind };
    profile.slug = existing.slug;
    const original = snapshot.raw.get(existing.slug) || JSON.stringify(existing);
    if (!candidate.managed_json) {
      if (!aligned(existing, seed, channel.name, channel.image)) throw new Error("EXISTING_INFORMATION_CONFLICT_HOLD");
      if (!isPublicProfile(existing)) throw new Error("EXISTING_REVIEW_HOLD");
      await store.adopt(candidate, existing, original);
    } else if (candidate.managed_json !== original) throw new Error("OPERATOR_MODIFICATION_HOLD");
    if (summary.mode === "WEEKLY" && seed.date >= addDays(summary.range.today, -7) && seed.date < summary.range.today) {
      const details = extractLabelledDetails(channel.bio), merged = { ...existing.details };
      for (const [key, value] of Object.entries(details)) if (!merged[key]) merged[key] = value;
      profile.details = merged;
    }
    if (reviewSnapshot(existing) === reviewSnapshot(profile)) {
      summary.unchanged++;
      const retryPublicCheck = candidate.status === "PUBLISHED_PENDING_CHECK";
      if (retryPublicCheck) summary.updated.push(existing.slug);
      await store.mark(candidate, retryPublicCheck ? "PUBLISHED_PENDING_CHECK" : "UNCHANGED", "", now, new Date(Date.parse(now) + 12 * 36e5).toISOString(), { channel: channel.apiUrl, notice: seed.primaryUrl, verifiedAt: now, scope: seed.kind, imagePolicy: "OFFICIAL_CDN_RASTER_AND_TEXT_SCREEN" }, imageHash);
      return;
    }
    profile = reviewedProfile(profile, "APPROVED", now);
    if (!isPublicProfile(profile)) throw new Error("PUBLIC_POLICY_HOLD");
  }
  if (!await store.publish(candidate, profile, existing || null, snapshot, now)) throw new Error("CONCURRENT_CHANGE_OR_PENDING_HOLD");
  if (existing) summary.updated.push(profile.slug);
  else summary.published.push({ name: profile.displayName, slug: profile.slug, date: profile.debutDate, time: profile.debutTime, kind: profile.debutKind || "FIRST_DEBUT" });
  await store.mark(candidate, "PUBLISHED_PENDING_CHECK", "", now, new Date(Date.parse(now) + 12 * 36e5).toISOString(), { channel: channel.apiUrl, notice: seed.primaryUrl, verifiedAt: now, scope: seed.kind, imagePolicy: "OFFICIAL_CDN_RASTER_AND_TEXT_SCREEN" }, imageHash);
}
__name(checkCandidate, "checkCandidate");
async function collectNotices(store, net, summary, now) {
  const notices = await store.all(`SELECT url FROM debut_automation_notices WHERE next_check_at<=? ORDER BY checked_at,first_seen_at LIMIT 2`, [now]);
  for (const notice of notices) {
    try {
      const r = await net.get(notice.url);
      if (r.status !== 200) throw new Error(`PRIMARY_HTTP_${r.status}`);
      const seed = parsePrimaryNotice(r.text, notice.url);
      const inRange = seed && seed.date >= summary.range.from && seed.date <= summary.range.to;
      if (inRange && await store.saveSeed(seed, now)) summary.discovered++;
      await store.execute("UPDATE debut_automation_notices SET checked_at=?,next_check_at=?,status=?,reason=? WHERE url=?", [now, new Date(Date.parse(now) + 7 * 864e5).toISOString(), inRange ? "PARSED" : "HOLD", inRange ? "" : "PRIMARY_SCOPE_DATE_OR_TIMEZONE_HOLD", notice.url]);
    } catch (error) {
      summary.failed.push({ id: notice.url, reason: safeError(error) });
      await store.execute("UPDATE debut_automation_notices SET checked_at=?,next_check_at=?,status='FAILED',reason=? WHERE url=?", [now, new Date(Date.parse(now) + 12 * 36e5).toISOString(), safeError(error), notice.url]);
    }
  }
}
__name(collectNotices, "collectNotices");
async function verifyPublic(env, summary, snapshot) {
  const slugs = [...summary.published.map((p) => p.slug), ...summary.updated];
  if (!slugs.length) {
    summary.publicVerified = true;
    return;
  }
  const request = new Request("https://vdebut.live/api/v1/portal/profiles?version=3", { headers: { "Cache-Control": "no-cache" } });
  const response = await env.SITE.fetch(request);
  if (!response.ok) throw new Error("PUBLIC_PROFILE_HTTP_FAILURE");
  const text = await readPublicBody(response), payload = JSON.parse(text);
  if (!Array.isArray(payload.profiles)) throw new Error("PUBLIC_PROFILE_SCHEMA_FAILURE");
  const eventResponse = await env.SITE.fetch(new Request("https://vdebut.live/api/v1/events", { headers: { "Cache-Control": "no-cache" } }));
  if (!eventResponse.ok) throw new Error("PUBLIC_CALENDAR_HTTP_FAILURE");
  const eventPayload = JSON.parse(await readPublicBody(eventResponse));
  const events = eventPayload.events;
  if (!eventPayload.success || !Array.isArray(events)) throw new Error("PUBLIC_CALENDAR_SCHEMA_FAILURE");
  for (const slug of slugs) {
    const wanted = snapshot.profiles.find((p) => p.slug === slug), actual = payload.profiles.find((p) => p.slug === slug), event = events.find((e) => e.creator.slug === slug);
    if (!wanted || !actual || reviewSnapshot(wanted) !== reviewSnapshot(actual) || !event || event.type !== (wanted.debutKind || "FIRST_DEBUT") || event.startAtUtc !== wanted.startAtUtc || !event.links.some((l) => l.url === wanted.channelUrl) || portalDay(actual, "Asia/Seoul") !== wanted.debutDate || actual.countryCode !== wanted.countryCode) throw new Error("PUBLIC_PROFILE_CALENDAR_MISMATCH");
  }
  summary.publicVerified = true;
}
__name(verifyPublic, "verifyPublic");
async function readPublicBody(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("PUBLIC_BODY_EMPTY");
  let bytes = 0, text = "";
  const decoder = new TextDecoder();
  try {
    for (; ; ) {
      const r = await reader.read();
      if (r.done) break;
      bytes += r.value.byteLength;
      if (bytes > 4 * 1024 * 1024) {
        await reader.cancel();
        throw new Error("PUBLIC_BODY_LIMIT");
      }
      text += decoder.decode(r.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
__name(readPublicBody, "readPublicBody");
async function runDiscovery(env, mode, scheduledTime, slot, fetcher = fetch) {
  const started = Date.now(), now = new Date(started).toISOString(), range = windowFor(scheduledTime, mode), runId = crypto.randomUUID();
  const store = new DiscoveryStore(env.DB, runId);
  if (!await store.begin(slot, range.today.slice(0, 7), mode, now)) return null;
  const net = new BudgetNetwork(started + LIMITS.wallMs, fetcher);
  const summary = { runId, mode, slot, range, status: "RUNNING", coverage: "LIMITED_PUBLIC_SOURCES", sources: [], discovered: 0, sourceChanges: 0, checked: 0, published: [], updated: [], unchanged: 0, held: [], failed: [], remaining: 0, externalRequests: 0, downloadBytes: 0, dbCalls: 0, dbRowsRead: 0, dbRowsWritten: 0, publicVerified: false, errors: [] };
  try {
    const { seeds, sources } = await collectSources(store, net, range.from, range.to, now);
    summary.sources = sources;
    const snapshot = await store.snapshot(), seen = new Set(seeds.map((s) => s.channelKey));
    const existingIds = new Set((await store.all("SELECT id FROM debut_automation_candidates LIMIT 2001")).map((c) => c.id));
    if (existingIds.size > 2e3) throw new Error("CANDIDATE_STORAGE_LIMIT");
    const allSeeds = [...seeds, ...registeredSeeds(snapshot, seen, range.today, addDays(range.today, 3))];
    for (const seed of allSeeds) {
      if (await store.saveSeed(seed, now)) {
        if (existingIds.has(seed.id)) summary.sourceChanges++;
        else if (!snapshot.keys.has(seed.channelKey)) summary.discovered++;
      }
    }
    const candidates = await store.all(`SELECT * FROM debut_automation_candidates WHERE next_check_at<=? AND json_extract(seed,'$.date') BETWEEN ? AND ?
      ORDER BY CASE WHEN json_extract(seed,'$.date') BETWEEN ? AND ? THEN 0
        WHEN ?='WEEKLY' AND json_extract(seed,'$.date') BETWEEN ? AND ? THEN 1 ELSE 2 END,
        last_checked_at,CASE WHEN managed_json='' THEN 0 ELSE 1 END,json_extract(seed,'$.date'),id LIMIT ?`, [now, range.from, range.to, range.today, addDays(range.today, 3), mode, addDays(range.today, -7), addDays(range.today, -1), mode === "WEEKLY" ? LIMITS.weeklyProfiles : LIMITS.candidates]);
    for (const candidate of candidates) {
      if (net.requests > LIMITS.external - 3 || Date.now() > started + LIMITS.wallMs - 15e3) {
        summary.errors.push("DETAIL_BUDGET_DEFERRED");
        break;
      }
      summary.checked++;
      try {
        await checkCandidate(store, net, candidate, snapshot, summary, now, new Set(seeds.filter((s) => s.source === "SOOP_CALENDAR").map((s) => s.id)));
      } catch (error) {
        const reason = safeError(error);
        if (/BUDGET/.test(reason)) throw error;
        const failure = !/HOLD|REQUIRED|NO_DELETE|CANDIDATE_ONLY|PENDING_OR_OPERATOR_CONFLICT/.test(reason);
        (failure ? summary.failed : summary.held).push({ id: candidate.id, reason });
        await store.mark(candidate, failure ? "FAILED" : "HOLD", reason, now, new Date(Date.parse(now) + (candidate.failures >= 2 ? 24 : 12) * 36e5).toISOString());
      }
    }
    if (net.requests < LIMITS.external - 2 && Date.now() < started + LIMITS.wallMs - 25e3) await collectNotices(store, net, summary, now);
    const pending = await store.all(`SELECT COUNT(*) AS count FROM debut_automation_candidates WHERE next_check_at<=? AND json_extract(seed,'$.date') BETWEEN ? AND ?`, [now, range.from, range.to]);
    summary.remaining = pending[0]?.count || 0;
    await verifyPublic(env, summary, snapshot);
    for (const slug of [...summary.published.map((p) => p.slug), ...summary.updated]) await store.execute("UPDATE debut_automation_candidates SET status='PUBLIC_VERIFIED' WHERE profile_slug=? AND status='PUBLISHED_PENDING_CHECK'", [slug]);
    summary.status = summary.sources.some((s) => s.status === "FAILED" || s.status === "BACKOFF") || summary.failed.length || summary.remaining || summary.errors.length ? "PARTIAL" : summary.held.length ? "COMPLETED_WITH_HOLDS" : "COMPLETED";
    await store.execute("DELETE FROM debut_automation_runs WHERE slot IN (SELECT slot FROM debut_automation_runs WHERE started_at<? LIMIT 10)", [new Date(started - 90 * 864e5).toISOString()]);
  } catch (error) {
    summary.errors.push(safeError(error));
    summary.status = "FAILED";
  } finally {
    Object.assign(summary, { externalRequests: net.requests, downloadBytes: net.bytes, dbCalls: store.calls, dbRowsRead: store.reads, dbRowsWritten: store.writes });
    await store.finish(summary.status, summary);
    console.log(JSON.stringify({ event: "debut-discovery", ...summary }));
  }
  return summary;
}
__name(runDiscovery, "runDiscovery");

// src/debutAutomationWorker.ts
var debutAutomationWorker_default = {
  async scheduled(event, env, ctx) {
    let mode = modeFor(event.cron);
    if (!mode && event.cron === "* * * * *" && Date.now() < Date.parse(env.SMOKE_TEST_UNTIL)) mode = "SMOKE";
    if (!mode) return;
    const slot = mode === "SMOKE" ? `smoke:${new Date(event.scheduledTime).toISOString().slice(0, 16)}` : `${kstDay(event.scheduledTime)}:${mode}`;
    ctx.waitUntil(runDiscovery(env, mode, event.scheduledTime, slot).then((result) => {
      if (!result) console.log(JSON.stringify({ event: "debut-discovery-skipped", slot, reason: "LEASE_SLOT_MONTHLY_BUDGET_OR_DISABLED" }));
    }));
  }
};
export {
  debutAutomationWorker_default as default
};
//# sourceMappingURL=debutAutomationWorker.js.map
