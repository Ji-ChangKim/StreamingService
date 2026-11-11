// Single Responsibility Principle: Weekly Monday VTuber Discovery, Official Spec Research & Portal/Calendar Sync Service
import { PortalProfile, portalChannelKey, portalChannelUrl, portalUtc, portalWebUrl } from '../../../shared/portal';
import { isPublicProfile, reviewedProfile } from '../../../shared/contentReview';
import { computeWikiDiffs } from '../../../shared/wikiParticipation';
import { readPortalProfileBySlug } from './portalProfileRepository';

export interface ExtractedVtuberSpecs {
  종족?: string;
  생일?: string;
  별자리?: string;
  신장?: string;
  팬덤명?: string;
  오시마크?: string;
  MBTI?: string;
}

export interface ResearchedCreatorSpecResult {
  displayName: string;
  avatarUrl: string;
  description: string;
  xUrl?: string;
  youtubeUrl?: string;
  details: ExtractedVtuberSpecs;
  evidenceUrl: string;
}

export interface UpsertPortalProfileParams {
  slug: string;
  displayName: string;
  platform: 'CHZZK' | 'SOOP' | 'YOUTUBE';
  channelUrl: string;
  avatarUrl: string;
  description: string;
  agencyName: string;
  debutDate: string;
  debutTime: string;
  dateState?: 'FIXED' | 'TIME_TBD' | 'DATE_TBD' | 'NONE';
  targetMonth?: string;
  timezone?: string;
  countryCode?: string;
  xUrl?: string;
  details: ExtractedVtuberSpecs;
  evidenceUrl: string;
}

export interface DiscoveredChzzkDebutCandidate {
  displayName: string;
  platform: 'CHZZK';
  channelUrl: string;
  avatarUrl: string;
  description: string;
  debutDate: string;
  debutTime: string;
  details: ExtractedVtuberSpecs;
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

/**
 * 1. 생일 문자열(M월 D일)에서 12별자리를 계산하는 순수 함수 (SRP)
 */
export function calculateZodiacFromBirthday(birthdayText?: string): string | undefined {
  if (!birthdayText) return undefined;
  const match = birthdayText.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (!match) return undefined;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;

  const md = month * 100 + day;
  if (md >= 120 && md <= 218) return '물병자리';
  if (md >= 219 && md <= 320) return '물고기자리';
  if (md >= 321 && md <= 419) return '양자리';
  if (md >= 420 && md <= 520) return '황소자리';
  if (md >= 521 && md <= 621) return '쌍둥이자리';
  if (md >= 622 && md <= 722) return '게자리';
  if (md >= 723 && md <= 822) return '사자자리';
  if (md >= 823 && md <= 922) return '처녀자리';
  if (md >= 923 && md <= 1022) return '천칭자리';
  if (md >= 1023 && md <= 1122) return '전갈자리';
  if (md >= 1123 && md <= 1224) return '사수자리';
  return '염소자리';
}

/**
 * 2. 추출된 값에서 불필요한 장식 기호·줄바꿈·해시태그를 정리하는 순수 헬퍼 (SRP)
 */
function sanitizeExtractedValue(raw: string, maxLength: number = 40): string {
  return raw
    .replace(/^[\s:：\-~·•|︱/]+/, '')
    .replace(/[\s,，/]+$/, '')
    .split(/\r?\n/)[0]
    .trim()
    .slice(0, maxLength);
}

/**
 * 3. 공식 소개글·공지 원문에서 명시적 라벨 및 자기소개 문맥의 6대 제원을 추출하는 순수 함수 (SRP)
 */
export function extractVerifiedSpecsFromText(rawText: string): ExtractedVtuberSpecs {
  if (!rawText || !rawText.trim()) return {};
  const text = rawText.normalize('NFKC');
  const specs: ExtractedVtuberSpecs = {};

  // 3-1. 생일 추출 (예: 생일: 10월 25일, 제작일자: 1998년 6월 19일, B-DAY : 03.15)
  const bdayKoreanMatch = text.match(
    /(?:생일|탄신일|제작일자|귀빠진\s*날|B-?DAY|Birthday)\s*[:：\-·•|]?\s*(?:\d{4}\s*[년.\-/]\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일/i
  );
  const bdayDotMatch = !bdayKoreanMatch
    ? text.match(
        /(?:생일|탄신일|제작일자|B-?DAY|Birthday)\s*[:：\-·•|]\s*(?:\d{4}[.\-/])?(\d{1,2})\s*[.\-/]\s*(\d{1,2})(?!\s*[.\-/]\d)/i
      )
    : null;

  const bdayMatch = bdayKoreanMatch || bdayDotMatch;
  if (bdayMatch) {
    const m = Number(bdayMatch[1]);
    const d = Number(bdayMatch[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      specs.생일 = `${m}월 ${d}일`;
    }
  }

  // 3-2. 별자리 추출 또는 생일 기반 자동 산출
  const zodiacMatch = text.match(
    /(물병자리|물고기자리|양자리|황소자리|쌍둥이자리|게자리|사자자리|처녀자리|천칭자리|전갈자리|사수자리|염소자리)/
  );
  if (zodiacMatch) {
    specs.별자리 = zodiacMatch[1];
  } else if (specs.생일) {
    const calculated = calculateZodiacFromBirthday(specs.생일);
    if (calculated) specs.별자리 = calculated;
  }

  // 3-3. 신장(키) 추출 (예: 키: 162cm, 신장 158.5 cm)
  const heightLabeledMatch = text.match(/(?:신장|키|Height)\s*[:：\-·•|]?\s*(\d{2,3}(?:\.\d)?)\s*cm/i);
  const heightStandaloneMatch = !heightLabeledMatch
    ? text.match(/(?:^|[\s/|•·(])(1[3-9]\d(?:\.\d)?)\s*cm(?=$|[\s/|•·),])/im)
    : null;
  const heightMatch = heightLabeledMatch || heightStandaloneMatch;
  if (heightMatch) {
    specs.신장 = `${heightMatch[1]}cm`;
  }

  // 3-4. 팬덤명(팬네임/애칭) 추출
  const fandomMatch = text.match(
    /(?:팬덤명|팬덤|팬\s*네임|팬\s*애칭|시청자\s*애칭|구독자\s*애칭|FAN\s*NAME)\s*[:：\-·•|]\s*([^\r\n/|•·#]{1,25})/i
  );
  if (fandomMatch) {
    const cleaned = sanitizeExtractedValue(fandomMatch[1], 24);
    if (cleaned && !/^(?:미정|없음|추후\s*공개|TBD|-)$/i.test(cleaned)) {
      specs.팬덤명 = cleaned;
    }
  }

  // 3-5. 오시마크(팬마크/FM) 추출
  const oshiMatch = text.match(
    /(?:오시마크|오시\s*마크|팬\s*마크|상징\s*이모지|이모지|FM|Oshi\s*Mark)\s*[:：\-·•|]\s*([^\r\na-zA-Z가-힣0-9]{1,16})/i
  );
  if (oshiMatch) {
    const cleaned = sanitizeExtractedValue(oshiMatch[1], 16);
    if (cleaned) {
      specs.오시마크 = cleaned;
    }
  }

  // 3-6. 종족 추출 (라벨 기반 우선 + 자기소개 명시적 종족 키워드 보조)
  const speciesMatch = text.match(/(?:종족|출신\s*종족|정체|Species)\s*[:：\-·•|]\s*([^\r\n/|•·#]{1,25})/i);
  if (speciesMatch) {
    const cleaned = sanitizeExtractedValue(speciesMatch[1], 24);
    if (cleaned && !/^(?:미정|없음|비밀|TBD|-)$/i.test(cleaned)) {
      specs.종족 = cleaned;
    }
  } else {
    const contextualSpecies = text.match(
      /(삼미호\s*요괴|구미호|쇠족제비|이로치\s*족제비|박쥐\s*메이드|여성형\s*안드로이드|안드로이드|뱀파이어\s*백작|뱀파이어|명계고양이|클리오네|도라곤|드래곤|이세계\s*마법사)/
    );
    if (contextualSpecies) {
      const matched = contextualSpecies[1].trim();
      specs.종족 = matched === '도라곤' ? '드래곤' : matched;
    }
  }

  // 3-7. MBTI 추출
  const mbtiMatch = text.match(/(?:MBTI|엠비티아이)\s*[:：\-·•|]?\s*([IE][NS][FT][JP])/i);
  if (mbtiMatch) {
    specs.MBTI = mbtiMatch[1].toUpperCase();
  }

  return specs;
}

/**
 * 4. 치지직 채널 URL에서 32자리 채널 해시 ID를 추출하는 순수 함수 (SRP)
 */
export function extractChzzkChannelId(channelUrl: string): string | null {
  const match = channelUrl.match(/([a-f0-9]{32})/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * 5. SOOP 채널 URL에서 방송국 스트리머 ID를 추출하는 순수 함수 (SRP)
 */
export function extractSoopStreamerId(channelUrl: string): string | null {
  const clean = channelUrl.trim().replace(/\/+$/, '');
  const stationMatch = clean.match(/(?:sooplive\.co\.kr|sooplive\.com|afreecatv\.com)\/(?:station\/)?([a-zA-Z0-9_]+)/i);
  if (stationMatch && stationMatch[1] && !['ch', 'play', 'www', 'station'].includes(stationMatch[1].toLowerCase())) {
    return stationMatch[1];
  }
  return null;
}

/**
 * 6. 치지직 공식 채널 정보 및 커뮤니티 공지글 원문을 수집하는 함수 (SRP)
 */
export async function fetchChzzkChannelAndNotices(channelUrl: string): Promise<{
  displayName?: string;
  avatarUrl?: string;
  description?: string;
  noticeTexts: string[];
  evidenceUrl: string;
}> {
  const channelId = extractChzzkChannelId(channelUrl);
  if (!channelId) {
    return { noticeTexts: [], evidenceUrl: channelUrl };
  }

  let displayName: string | undefined;
  let avatarUrl: string | undefined;
  let description: string | undefined;
  const noticeTexts: string[] = [];

  try {
    const chRes = await fetch(`https://api.chzzk.naver.com/service/v1/channels/${channelId}`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8_000),
    });
    if (chRes.ok) {
      const chJson: any = await chRes.json();
      const content = chJson?.content;
      if (content) {
        if (content.channelName) displayName = String(content.channelName).trim();
        if (content.channelImageUrl) avatarUrl = String(content.channelImageUrl).trim();
        if (content.channelDescription) description = String(content.channelDescription).trim();
      }
    }
  } catch {}

  try {
    const communityUrl = `https://apis.naver.com/nng_main/nng_comment_api/v1/type/CHANNEL_POST/id/${channelId}/comments?limit=5&offset=0&orderType=DESC&pagingType=PAGE`;
    const commRes = await fetch(communityUrl, {
      headers: {
        ...BROWSER_HEADERS,
        Referer: `https://chzzk.naver.com/${channelId}/community`,
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (commRes.ok) {
      const commJson: any = await commRes.json();
      const comments = commJson?.content?.comments?.data || [];
      for (const item of comments) {
        const content = item?.comment?.content;
        if (typeof content === 'string' && content.trim()) {
          noticeTexts.push(content.trim());
        }
      }
    }
  } catch {}

  return {
    displayName,
    avatarUrl,
    description,
    noticeTexts,
    evidenceUrl: `https://chzzk.naver.com/${channelId}`,
  };
}

/**
 * 7. SOOP 공식 방송국 프로필 및 소개글 원문을 수집하는 함수 (SRP)
 */
export async function fetchSoopStationData(channelUrl: string): Promise<{
  displayName?: string;
  avatarUrl?: string;
  description?: string;
  noticeTexts: string[];
  evidenceUrl: string;
}> {
  const userId = extractSoopStreamerId(channelUrl);
  if (!userId) {
    return { noticeTexts: [], evidenceUrl: channelUrl };
  }

  let displayName: string | undefined;
  let avatarUrl: string | undefined;
  let description: string | undefined;
  const noticeTexts: string[] = [];

  try {
    const res = await fetch(`https://chapi.sooplive.co.kr/api/${userId}/station`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.station?.user_nick) displayName = String(data.station.user_nick).trim();
      if (data?.profile_image) {
        avatarUrl = data.profile_image.startsWith('//')
          ? `https:${data.profile_image}`
          : String(data.profile_image).trim();
      }
      if (data?.station?.profile_text) {
        description = String(data.station.profile_text).trim();
      }
    }
  } catch {}

  // SOOP 방송국 홈 API 및 프로필 게시글 원문 API 조회 (6대 제원 자동 추출용)
  try {
    const homeRes = await fetch(`https://chapi.sooplive.co.kr/api/${userId}/home`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8_000),
    });
    if (homeRes.ok) {
      const homeData: any = await homeRes.json();
      const boards: any[] = Array.isArray(homeData?.boards) ? homeData.boards : [];
      const prioritized = boards
        .filter((b) => b?.title_no)
        .sort((a, b) => {
          const aScore = /프로필|profile|소개|정보|입양|규칙|데뷔|웰컴/i.test(`${a.bbs_name || ''} ${a.title_name || ''}`) ? 0 : 1;
          const bScore = /프로필|profile|소개|정보|입양|규칙|데뷔|웰컴/i.test(`${b.bbs_name || ''} ${b.title_name || ''}`) ? 0 : 1;
          return aScore - bScore;
        })
        .slice(0, 3);

      for (const post of prioritized) {
        if (post.title_name) noticeTexts.push(String(post.title_name).trim());
        try {
          const detailRes = await fetch(`https://chapi.sooplive.co.kr/api/${userId}/title/${post.title_no}`, {
            headers: BROWSER_HEADERS,
            signal: AbortSignal.timeout(6_000),
          });
          if (detailRes.ok) {
            const detailJson: any = await detailRes.json();
            const html = detailJson?.content?.content || '';
            const plainText = String(html)
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/[ \t]+/g, ' ')
              .trim();
            if (plainText) noticeTexts.push(plainText);
          }
        } catch {}
      }
    }
  } catch {}

  return {
    displayName,
    avatarUrl,
    description,
    noticeTexts,
    evidenceUrl: `https://ch.sooplive.co.kr/${userId}`,
  };
}

/**
 * 7-B. SOOP 공식 웰컴 버추얼 일정 API에서 기간 내 신규 데뷔·이적 일정을 수집하는 함수 (SRP)
 */
export async function fetchSoopWelcomeVirtualSchedules(
  startDate: string,
  endDate: string
): Promise<
  Array<{
    displayName: string;
    platform: 'SOOP';
    debutDate: string;
    debutTime: string;
    channelUrl: string;
    profileImageUrl?: string;
  }>
> {
  try {
    const url = `https://welcomevirtual.sooplive.co.kr/api/api.php?work=getScheduleList&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const list: any[] = Array.isArray(data?.result?.list) ? data.result.list : [];
    const results: Array<{
      displayName: string;
      platform: 'SOOP';
      debutDate: string;
      debutTime: string;
      channelUrl: string;
      profileImageUrl?: string;
    }> = [];
    for (const item of list) {
      const userId = String(item?.user_id || '').trim();
      const nick = String(item?.user_nick || '').trim();
      const dtm = String(item?.schedule_dtm || '').trim(); // YYYY-MM-DD HH:mm:ss
      if (!userId || !nick || !/^\d{4}-\d{2}-\d{2}/.test(dtm)) continue;
      const debutDate = dtm.slice(0, 10);
      const debutTime = dtm.length >= 16 ? dtm.slice(11, 16) : '20:00';
      results.push({
        displayName: nick,
        platform: 'SOOP',
        debutDate,
        debutTime,
        channelUrl: `https://www.sooplive.com/station/${userId}`,
        profileImageUrl: item?.image_url ? String(item.image_url).trim() : undefined,
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * 8. 단일 버튜버 채널의 공식 프로필 및 6대 제원을 종합 리서치하는 함수 (SRP)
 */
export async function researchCreatorProfileAndSpecs(
  platform: 'CHZZK' | 'SOOP',
  channelUrl: string,
  fallbackName: string,
  fallbackDescription?: string
): Promise<ResearchedCreatorSpecResult> {
  const source =
    platform === 'SOOP'
      ? await fetchSoopStationData(channelUrl)
      : await fetchChzzkChannelAndNotices(channelUrl);

  const combinedCorpus = [source.description || '', ...source.noticeTexts, fallbackDescription || '']
    .filter(Boolean)
    .join('\n\n');

  const details = extractVerifiedSpecsFromText(combinedCorpus);
  const cleanDescription =
    source.description ||
    fallbackDescription ||
    `${source.displayName || fallbackName}의 공식 방송 채널입니다.`;

  return {
    displayName: source.displayName || fallbackName,
    avatarUrl: source.avatarUrl || '',
    description: cleanDescription,
    details,
    evidenceUrl: source.evidenceUrl || channelUrl,
  };
}

/**
 * 9. 기존 제원 객체를 보존하면서 새로 확인된 제원만 병합하는 순수 함수 (SRP)
 */
export function mergeProfileDetails(
  existing: Record<string, string> | undefined,
  discovered: ExtractedVtuberSpecs
): { merged: Record<string, string>; addedKeys: string[] } {
  const merged: Record<string, string> = { ...(existing || {}) };
  const addedKeys: string[] = [];

  const keyMap: Array<{ ko: keyof ExtractedVtuberSpecs; en: string }> = [
    { ko: '종족', en: 'species' },
    { ko: '생일', en: 'birthday' },
    { ko: '별자리', en: 'zodiac' },
    { ko: '신장', en: 'height' },
    { ko: '팬덤명', en: 'fandomName' },
    { ko: '오시마크', en: 'oshiMark' },
    { ko: 'MBTI', en: 'mbti' },
  ];

  for (const { ko, en } of keyMap) {
    const newVal = discovered[ko]?.trim();
    const curVal = (merged[en] || merged[ko] || '').trim();
    if (newVal && !curVal) {
      merged[en] = newVal;
      merged[ko] = newVal;
      addedKeys.push(ko);
    } else if (curVal) {
      merged[en] = curVal;
      merged[ko] = curVal;
    }
  }

  const bdayVal = merged['birthday'] || merged['생일'];
  if (bdayVal && !(merged['zodiac'] || merged['별자리'])) {
    const zodiac = calculateZodiacFromBirthday(bdayVal);
    if (zodiac) {
      merged['zodiac'] = zodiac;
      merged['별자리'] = zodiac;
      addedKeys.push('별자리');
    }
  }

  return { merged, addedKeys };
}

/**
 * 10. 조사된 프로필과 6대 제원을 portal_profiles 및 portal_profile_history에 저장/갱신하는 함수 (SRP)
 */
export async function upsertPortalProfileWithSpecs(
  db: D1Database,
  params: UpsertPortalProfileParams
): Promise<{ slug: string; addedKeys: string[]; isNewPortalProfile: boolean }> {
  const existingRow = await db
    .prepare('SELECT data FROM portal_profiles WHERE slug = ? LIMIT 1')
    .bind(params.slug)
    .first<{ data: string }>();

  const existingProfile = await readPortalProfileBySlug(db, params.slug);
  const nowIso = new Date().toISOString();
  const normalizedChannelUrl = portalChannelUrl(params.channelUrl, params.platform);
  const timezone = params.timezone || 'Asia/Seoul';
  const debutTime = params.debutTime || '20:00';
  const dateState = params.dateState || (params.debutDate ? (debutTime === '00:00' ? 'TIME_TBD' : 'FIXED') : 'NONE');
  const startAtUtc = dateState === 'FIXED' && params.debutDate ? portalUtc(params.debutDate, debutTime, timezone) : '';

  const baseProfile: PortalProfile = existingProfile
    ? {
        ...existingProfile,
        avatarUrl: existingProfile.avatarUrl || portalWebUrl(params.avatarUrl),
        description:
          existingProfile.description && !existingProfile.description.endsWith('데뷔 방송입니다.')
            ? existingProfile.description
            : params.description || existingProfile.description,
        xUrl: existingProfile.xUrl || portalWebUrl(params.xUrl || ''),
      }
    : {
        slug: params.slug,
        displayName: params.displayName,
        description: params.description || `${params.displayName}의 공식 방송 채널입니다.`,
        avatarUrl: portalWebUrl(params.avatarUrl),
        agency: params.agencyName || '개인세',
        platform: params.platform,
        channelUrl: normalizedChannelUrl,
        countryCode: params.countryCode || 'KR',
        languages: ['한국어'],
        tags: ['버튜버'],
        xUrl: portalWebUrl(params.xUrl || ''),
        dateState,
        debutDate: ['FIXED', 'TIME_TBD'].includes(dateState) ? params.debutDate : '',
        debutTime: dateState === 'FIXED' ? debutTime : '',
        timezone,
        startAtUtc,
        targetMonth: params.targetMonth || (params.debutDate || nowIso).slice(0, 7),
        ownerVerified: false,
        source: 'EXISTING',
      };

  const { merged, addedKeys } = mergeProfileDetails(baseProfile.details, params.details);
  let nextProfile: PortalProfile = {
    ...baseProfile,
    ...(Object.keys(merged).length > 0 ? { details: merged } : {}),
  };

  nextProfile = reviewedProfile(nextProfile, 'APPROVED', nowIso);
  if (!isPublicProfile(nextProfile)) {
    return { slug: params.slug, addedKeys: [], isNewPortalProfile: false };
  }

  const isNewPortalProfile = !existingRow?.data;
  const beforeData = existingProfile ? JSON.stringify(existingProfile) : '{}';
  const afterData = JSON.stringify(nextProfile);

  if (!isNewPortalProfile && addedKeys.length === 0 && existingRow?.data === afterData) {
    return { slug: params.slug, addedKeys: [], isNewPortalProfile: false };
  }

  const diffs = existingProfile ? computeWikiDiffs(existingProfile, nextProfile) : [];
  if (!isNewPortalProfile && diffs.length === 0 && addedKeys.length === 0) {
    return { slug: params.slug, addedKeys: [], isNewPortalProfile: false };
  }

  const summaryLabel = isNewPortalProfile
    ? `주간 자동 리서치 신규 도감 등록${addedKeys.length > 0 ? ` (${addedKeys.join(', ')})` : ''}`
    : `주간 자동 리서치 제원 업데이트 (${addedKeys.join(', ')})`;
  const reason = `${summaryLabel} [출처: ${params.evidenceUrl}]`;

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        'INSERT INTO portal_profiles(slug, channel_url, data) VALUES(?, ?, ?) ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP'
      )
      .bind(params.slug, nextProfile.channelUrl, afterData),
    db
      .prepare(
        'INSERT INTO portal_profile_history(id, slug, before_data, after_data, reason, admin_hash) VALUES(?, ?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), params.slug, beforeData, afterData, reason, 'wiki:weekly-auto-research'),
  ];

  const channelKey = portalChannelKey(nextProfile.channelUrl, nextProfile.platform);
  if (channelKey) {
    statements.push(
      db
        .prepare('INSERT OR IGNORE INTO portal_profile_channels(channel_key, slug) VALUES(?, ?)')
        .bind(channelKey, params.slug)
    );
  }

  await db.batch(statements);
  return { slug: params.slug, addedKeys, isNewPortalProfile };
}

/**
 * 11. 기존 등록 버튜버 중 6대 제원이 비어 있는 대상을 배치 단위로 추가 리서치하는 함수 (SRP)
 */
export async function enrichMissingSpecsBatchInD1(
  db: D1Database,
  batchLimit: number = 12
): Promise<
  Array<{
    slug: string;
    displayName: string;
    addedKeys: string[];
    details: ExtractedVtuberSpecs;
  }>
> {
  const { results } = await db
    .prepare(
      `SELECT i.slug, i.display_name, i.description, i.profile_image_url, i.agency_name,
              i.debut_date, i.debut_time, i.timezone, i.country_code, i.x_url,
              c.platform, c.channel_url, p.data AS portal_data
       FROM streamerChannel_info i
       INNER JOIN streamerChannel c ON i.channel_id = c.id
       LEFT JOIN portal_profiles p ON p.slug = i.slug
       WHERE i.slug IS NOT NULL AND i.slug != ''
         AND c.platform IN ('CHZZK', 'SOOP')
       ORDER BY i.debut_date DESC, i.id DESC
       LIMIT 80`
    )
    .all<any>();

  const candidates: any[] = [];
  for (const row of results || []) {
    if (candidates.length >= batchLimit) break;
    let existingDetails: Record<string, string> = {};
    if (row.portal_data) {
      try {
        const parsed = JSON.parse(row.portal_data);
        existingDetails = parsed.details || {};
      } catch {}
    }
    const filledCount = ['종족', '생일', '별자리', '신장', '팬덤명', '오시마크'].filter(
      (k) => existingDetails[k] && String(existingDetails[k]).trim()
    ).length;
    if (filledCount < 3) {
      candidates.push(row);
    }
  }

  const enriched: Array<{
    slug: string;
    displayName: string;
    addedKeys: string[];
    details: ExtractedVtuberSpecs;
  }> = [];

  for (const row of candidates) {
    const platform = (row.platform === 'SOOP' ? 'SOOP' : 'CHZZK') as 'CHZZK' | 'SOOP';
    const researched = await researchCreatorProfileAndSpecs(
      platform,
      row.channel_url,
      row.display_name,
      row.description
    );

    if (Object.keys(researched.details).length === 0) continue;

    const upserted = await upsertPortalProfileWithSpecs(db, {
      slug: row.slug,
      displayName: row.display_name,
      platform,
      channelUrl: row.channel_url,
      avatarUrl: row.profile_image_url || researched.avatarUrl,
      description: researched.description || row.description,
      agencyName: row.agency_name || '개인세',
      debutDate: row.debut_date || '',
      debutTime: row.debut_time || '20:00',
      timezone: row.timezone || 'Asia/Seoul',
      countryCode: row.country_code || 'KR',
      xUrl: row.x_url || '',
      details: researched.details,
      evidenceUrl: researched.evidenceUrl,
    });

    if (upserted.addedKeys.length > 0) {
      enriched.push({
        slug: row.slug,
        displayName: row.display_name,
        addedKeys: upserted.addedKeys,
        details: researched.details,
      });
    }
  }

  return enriched;
}
