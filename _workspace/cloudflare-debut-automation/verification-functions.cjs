var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// <stdin>
var stdin_exports = {};
__export(stdin_exports, {
  buildCalendarIndex: () => buildCalendarIndex,
  isPublicProfile: () => isPublicProfile,
  portalChannelKey: () => portalChannelKey
});
module.exports = __toCommonJS(stdin_exports);

// shared/dateTimeFormatter.ts
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

// shared/portal.ts
function portalWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
function portalChannelUrl(value, platform) {
  const safe = portalWebUrl(value);
  if (!safe) return "";
  const hosts = { CHZZK: ["chzzk.naver.com"], SOOP: ["sooplive.co.kr", "sooplive.com", "afreecatv.com"], YOUTUBE: ["youtube.com", "youtu.be"], TWITCH: ["twitch.tv"] };
  const host = new URL(safe).hostname;
  return hosts[platform]?.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)) ? safe : "";
}
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
function portalDateKey(value, timezone) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = dateTimeFormatter("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
}
function portalMonth(profile, timezone) {
  if (profile.dateState === "NONE") return "";
  if (profile.dateState === "DATE_TBD") return profile.targetMonth;
  if (profile.dateState === "TIME_TBD") return profile.debutDate.slice(0, 7);
  return portalDateKey(profile.startAtUtc, timezone).slice(0, 7);
}
function portalDay(profile, timezone) {
  return profile.dateState === "TIME_TBD" ? profile.debutDate : profile.dateState === "FIXED" ? portalDateKey(profile.startAtUtc, timezone) : "";
}

// frontend/src/portal/calendarIndex.ts
function buildCalendarIndex(profiles, timezone) {
  const byDay = /* @__PURE__ */ new Map();
  const byMonth = /* @__PURE__ */ new Map();
  const days = /* @__PURE__ */ new Map();
  for (const profile of profiles) {
    const day = portalDay(profile, timezone);
    const month = day ? day.slice(0, 7) : portalMonth(profile, timezone);
    days.set(profile.slug, day);
    if (day) {
      const group = byDay.get(day) || [];
      group.push(profile);
      byDay.set(day, group);
    }
    if (month) {
      const group = byMonth.get(month) || [];
      group.push(profile);
      byMonth.set(month, group);
    }
  }
  for (const group of byDay.values()) group.sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc) || a.slug.localeCompare(b.slug));
  return { byDay, byMonth, days };
}

// shared/contentReview.ts
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
function looksLikeVideoTitle(name) {
  return /【[^】]*(?:初配信|飲酒配信|新人VTuber)[^】]*】|\[(?:첫\s*방송|데뷔\s*방송|LIVE)\]/i.test(name.normalize("NFKC"));
}
function reviewSnapshot(profile) {
  return JSON.stringify(Object.fromEntries(Object.entries(profile).filter(([key]) => !["contentReview", "ownerVerified", "requesterRole", "source"].includes(key)).sort(([a], [b]) => a.localeCompare(b))));
}
function isPublicProfile(profile) {
  if (looksLikeVideoTitle(profile.displayName)) return false;
  if (needsContentReview(Object.values(profile.details || {}).join(" "))) return false;
  if (needsContentReview([profile.displayName, profile.description, profile.headline, profile.videoTitle, profile.debutGroupName, profile.agency, profile.regularSchedule, profile.fanGuide, ...(profile.media || []).flatMap((item) => [item.title, item.credit]), ...(profile.notices || []).map((item) => item.title), ...profile.tags].join(" "))) return false;
  if (profile.contentReview) {
    return profile.contentReview.state === "APPROVED" && profile.contentReview.snapshot === reviewSnapshot(profile);
  }
  return profile.source === "EXISTING";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildCalendarIndex,
  isPublicProfile,
  portalChannelKey
});
