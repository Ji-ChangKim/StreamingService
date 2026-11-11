import { PortalPlatform, PortalProfile, portalChannelKey, portalChannelUrl, portalUtc, portalWebUrl } from '../../../shared/portal';
import { isPublicProfile, reviewedProfile } from '../../../shared/contentReview';
import { isAnalyticsAutoRegisteredRow, readPortalProfileBySlug, readPortalProfiles } from './portalProfileRepository';

export interface AdminStreamerItem {
  info_id: string;
  slug: string;
  display_name: string;
  profile_image_url: string;
  banner_url: string;
  description: string;
  headline: string;
  agency_name: string;
  country_code: string;
  x_url: string;
  website_url: string;
  cafe_url: string;
  video_url: string;
  debut_group_id: string;
  debut_group_name: string;
  platform: PortalPlatform;
  channel_url: string;
  channel_name: string;
  date_state: PortalProfile['dateState'];
  debut_date: string;
  debut_time: string;
  target_month: string;
  timezone: string;
  start_at_utc: string;
  details: Record<string, string>;
  is_public: boolean;
  source: string;
}

export interface DuplicateMemberItem {
  slug: string;
  displayName: string;
  platform: PortalPlatform;
  channelUrl: string;
  channelKey: string;
  debutDate: string;
  debutTime: string;
  agency: string;
  avatarUrl: string;
  details: Record<string, string>;
  storageSource: 'PORTAL' | 'LEGACY' | 'BOTH';
  legacyRowCount: number;
  specCount: number;
}

export interface DuplicateIssueGroup {
  id: string;
  type: 'CHANNEL_DUPLICATE' | 'NAME_DUPLICATE' | 'SLUG_VARIANT';
  title: string;
  reason: string;
  recommendedKeepSlug: string;
  members: DuplicateMemberItem[];
}

export interface AdminDuplicateScanResult {
  summary: {
    totalActiveProfiles: number;
    duplicateGroupCount: number;
    channelDuplicateCount: number;
    nameDuplicateCount: number;
    slugVariantCount: number;
    missingAvatarCount: number;
    missingSpecsCount: number;
  };
  groups: DuplicateIssueGroup[];
}

export interface AdminStreamerUpdateInput {
  newSlug?: string;
  displayName?: string;
  platform?: PortalPlatform;
  channelUrl?: string;
  description?: string;
  headline?: string;
  agency?: string;
  countryCode?: string;
  dateState?: PortalProfile['dateState'];
  debutDate?: string;
  debutTime?: string;
  targetMonth?: string;
  timezone?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
  cafeUrl?: string;
  videoUrl?: string;
  debutGroupId?: string;
  debutGroupName?: string;
  publicationState?: 'APPROVED' | 'HOLD';
  details?: Record<string, string>;
}

const SPEC_KEY_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['species', '종족'],
  ['birthday', '생일'],
  ['zodiac', '별자리'],
  ['height', '신장'],
  ['fandomName', '팬덤명'],
  ['oshiMark', '오시마크'],
  ['mbti', 'MBTI'],
];

// 제원(details)의 영문 표준 키와 한글 표시 키를 양방향으로 동기화한다 (단일 책임).
export function normalizeBidirectionalDetails(raw: Record<string, string> | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return result;

  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string' && v.trim()) {
      result[k.trim()] = v.trim();
    }
  }

  for (const [enKey, koKey] of SPEC_KEY_PAIRS) {
    const val = (result[enKey] || result[koKey] || '').trim();
    if (val) {
      result[enKey] = val;
      result[koKey] = val;
    } else {
      delete result[enKey];
      delete result[koKey];
    }
  }

  return result;
}

// 활동명 비교를 위해 공백·괄호·특수기호를 제거한 정규화 키를 반환한다 (단일 책임).
export function normalizeDisplayNameForComparison(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/[\s_\-·•✨🤍🩷💙💜💛💚🖤❤️]/g, '')
    .trim();
}

// 슬러그에서 플랫폼 접미사나 번호 접미사(-2, -3 등)를 제거한 기본 슬러그를 반환한다 (단일 책임).
export function normalizeBaseSlug(slug: string): string {
  return (slug || '')
    .toLowerCase()
    .replace(/-(?:chzzk|soop|youtube|twitch|afreeca)$/i, '')
    .replace(/-\d+$/, '')
    .trim();
}

// 프로필의 제원(종족·생일·별자리·신장·팬덤명·오시마크·MBTI) 보유 개수를 계산한다 (단일 책임).
function countFilledSpecs(details: Record<string, string> | undefined): number {
  if (!details) return 0;
  let count = 0;
  for (const [enKey, koKey] of SPEC_KEY_PAIRS) {
    if ((details[enKey] || details[koKey] || '').trim()) count++;
  }
  return count;
}

// 중복 그룹 내에서 가장 정보가 풍부한 대표 슬러그를 추천한다 (단일 책임).
function pickRecommendedKeepSlug(members: DuplicateMemberItem[]): string {
  if (members.length === 0) return '';
  const sorted = [...members].sort((a, b) => {
    if (b.specCount !== a.specCount) return b.specCount - a.specCount;
    const aHasAvatar = a.avatarUrl && !a.avatarUrl.includes('unsplash.com') ? 1 : 0;
    const bHasAvatar = b.avatarUrl && !b.avatarUrl.includes('unsplash.com') ? 1 : 0;
    if (bHasAvatar !== aHasAvatar) return bHasAvatar - aHasAvatar;
    const aIsCleanSlug = !/-\d+$/.test(a.slug) ? 1 : 0;
    const bIsCleanSlug = !/-\d+$/.test(b.slug) ? 1 : 0;
    if (bIsCleanSlug !== aIsCleanSlug) return bIsCleanSlug - aIsCleanSlug;
    return a.slug.length - b.slug.length;
  });
  return sorted[0].slug;
}

// 관리자 CMS 목록용 전체 버튜버 상세 배열을 반환한다 (단일 책임).
export async function listAdminStreamersDetailed(db: D1Database): Promise<AdminStreamerItem[]> {
  const profiles = await readPortalProfiles(db);
  return profiles.map((profile) => {
    const details = normalizeBidirectionalDetails(profile.details);
    return {
      info_id: profile.slug,
      slug: profile.slug,
      display_name: profile.displayName,
      profile_image_url: profile.avatarUrl || '',
      banner_url: profile.bannerUrl || '',
      description: profile.description || '',
      headline: profile.headline || '',
      agency_name: profile.agency || '개인세',
      country_code: profile.countryCode || 'KR',
      x_url: profile.xUrl || '',
      website_url: profile.websiteUrl || '',
      cafe_url: profile.cafeUrl || '',
      video_url: profile.videoUrl || '',
      debut_group_id: profile.debutGroupId || '',
      debut_group_name: profile.debutGroupName || '',
      platform: profile.platform,
      channel_url: profile.channelUrl,
      channel_name: profile.displayName,
      date_state: profile.dateState || 'FIXED',
      debut_date: profile.debutDate || '',
      debut_time: profile.debutTime || '',
      target_month: profile.targetMonth || (profile.debutDate ? profile.debutDate.slice(0, 7) : ''),
      timezone: profile.timezone || 'Asia/Seoul',
      start_at_utc: profile.startAtUtc || '',
      details,
      is_public: isPublicProfile(profile),
      source: profile.source || 'EXISTING',
    };
  });
}

type RawLegacyRow = {
  id: number;
  channel_id: number;
  slug: string;
  display_name: string;
  description: string;
  profile_image_url: string;
  agency_name: string;
  country_code: string;
  x_url: string;
  debut_date: string;
  debut_time: string;
  timezone: string;
  start_at_utc: string;
  platform: PortalPlatform;
  channel_url: string;
};

// DB의 레거시 테이블과 포털 테이블 원시 데이터를 전수 비교하여 중복 이슈 및 데이터 누락 현황을 진단한다 (단일 책임).
export async function scanAdminDuplicatesAndIssues(db: D1Database): Promise<AdminDuplicateScanResult> {
  const [legacyRes, portalRes, activeProfiles] = await Promise.all([
    db.prepare(`
      SELECT i.id, i.channel_id, i.slug, i.display_name, i.description, i.profile_image_url,
             i.agency_name, i.country_code, i.x_url, i.debut_date, i.debut_time, i.timezone,
             i.start_at_utc, c.platform, c.channel_url
      FROM streamerChannel_info i
      JOIN streamerChannel c ON c.id = i.channel_id
      WHERE i.slug IS NOT NULL AND TRIM(i.slug) != ''
      ORDER BY i.id ASC
    `).all<RawLegacyRow>(),
    db.prepare(`SELECT slug, channel_url, data FROM portal_profiles`).all<{ slug: string; channel_url: string; data: string }>(),
    readPortalProfiles(db),
  ]);

  const bySlug = new Map<string, DuplicateMemberItem>();

  for (const row of legacyRes.results || []) {
    if (isAnalyticsAutoRegisteredRow(row)) continue;
    const slug = row.slug.trim();
    const channelUrl = portalChannelUrl(row.channel_url || '', row.platform) || row.channel_url || '';
    const channelKey = portalChannelKey(channelUrl, row.platform) || `${row.platform}:${channelUrl.toLowerCase()}`;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.legacyRowCount += 1;
      continue;
    }
    bySlug.set(slug, {
      slug,
      displayName: row.display_name || slug,
      platform: row.platform,
      channelUrl,
      channelKey,
      debutDate: row.debut_date || '',
      debutTime: row.debut_time || '',
      agency: row.agency_name || '개인세',
      avatarUrl: row.profile_image_url || '',
      details: {},
      storageSource: 'LEGACY',
      legacyRowCount: 1,
      specCount: 0,
    });
  }

  for (const row of portalRes.results || []) {
    try {
      const parsed = JSON.parse(row.data) as PortalProfile;
      const slug = (row.slug || parsed.slug || '').trim();
      if (!slug) continue;
      const channelUrl = portalChannelUrl(parsed.channelUrl || row.channel_url || '', parsed.platform) || parsed.channelUrl || row.channel_url || '';
      const channelKey = portalChannelKey(channelUrl, parsed.platform) || `${parsed.platform}:${channelUrl.toLowerCase()}`;
      const details = normalizeBidirectionalDetails(parsed.details);
      const specCount = countFilledSpecs(details);
      const prev = bySlug.get(slug);
      bySlug.set(slug, {
        slug,
        displayName: parsed.displayName || prev?.displayName || slug,
        platform: parsed.platform || prev?.platform || 'CHZZK',
        channelUrl: channelUrl || prev?.channelUrl || '',
        channelKey: channelKey || prev?.channelKey || '',
        debutDate: parsed.debutDate || prev?.debutDate || '',
        debutTime: parsed.debutTime || prev?.debutTime || '',
        agency: parsed.agency || prev?.agency || '개인세',
        avatarUrl: parsed.avatarUrl || prev?.avatarUrl || '',
        details,
        storageSource: prev ? 'BOTH' : 'PORTAL',
        legacyRowCount: prev ? prev.legacyRowCount : 0,
        specCount,
      });
    } catch {
      // 잘못된 JSON 행 무시
    }
  }

  const allMembers = [...bySlug.values()];
  const groups: DuplicateIssueGroup[] = [];
  const groupedSlugPairs = new Set<string>();

  const makePairKey = (slugs: string[]) => [...slugs].sort().join('||');

  // 1) 동일 채널 키(channelKey) 중복 또는 단일 슬러그 내 다중 레거시 행 중복 검사
  const byChannelKey = new Map<string, DuplicateMemberItem[]>();
  for (const m of allMembers) {
    if (!m.channelKey) continue;
    const list = byChannelKey.get(m.channelKey) || [];
    list.push(m);
    byChannelKey.set(m.channelKey, list);
  }

  for (const [cKey, members] of byChannelKey.entries()) {
    if (members.length > 1 || members.some((m) => m.legacyRowCount > 1)) {
      const pairKey = makePairKey(members.map((m) => m.slug));
      groupedSlugPairs.add(pairKey);
      const keepSlug = pickRecommendedKeepSlug(members);
      groups.push({
        id: `channel:${cKey}`,
        type: 'CHANNEL_DUPLICATE',
        title: `${members[0].displayName} (${members[0].platform})`,
        reason: members.length > 1
          ? `동일한 방송국 채널(${cKey})이 서로 다른 슬러그(${members.map((m) => m.slug).join(', ')})로 중복 등록되어 있습니다.`
          : `동일 슬러그(${members[0].slug})가 레거시 테이블에 ${members[0].legacyRowCount}건 중복 저장되어 있습니다.`,
        recommendedKeepSlug: keepSlug,
        members,
      });
    }
  }

  // 2) 동일 활동명(displayName) 중복 검사
  const byNameKey = new Map<string, DuplicateMemberItem[]>();
  for (const m of allMembers) {
    const nKey = normalizeDisplayNameForComparison(m.displayName);
    if (!nKey || nKey.length < 2) continue;
    const list = byNameKey.get(nKey) || [];
    list.push(m);
    byNameKey.set(nKey, list);
  }

  for (const [nKey, members] of byNameKey.entries()) {
    if (members.length > 1) {
      const pairKey = makePairKey(members.map((m) => m.slug));
      if (groupedSlugPairs.has(pairKey)) continue;
      groupedSlugPairs.add(pairKey);
      const keepSlug = pickRecommendedKeepSlug(members);
      groups.push({
        id: `name:${nKey}`,
        type: 'NAME_DUPLICATE',
        title: `${members[0].displayName} (${members.length}건 중복 의심)`,
        reason: `활동명이 동일한 프로필(${members.map((m) => `${m.displayName}[${m.slug}]`).join(', ')})이 복수 등록되어 있습니다.`,
        recommendedKeepSlug: keepSlug,
        members,
      });
    }
  }

  // 3) 슬러그 변형(-2, -chzzk, -soop 등) 충돌 검사
  const byBaseSlug = new Map<string, DuplicateMemberItem[]>();
  for (const m of allMembers) {
    const bSlug = normalizeBaseSlug(m.slug);
    if (!bSlug || bSlug.length < 3) continue;
    const list = byBaseSlug.get(bSlug) || [];
    list.push(m);
    byBaseSlug.set(bSlug, list);
  }

  for (const [bSlug, members] of byBaseSlug.entries()) {
    if (members.length > 1) {
      const pairKey = makePairKey(members.map((m) => m.slug));
      if (groupedSlugPairs.has(pairKey)) continue;
      groupedSlugPairs.add(pairKey);
      const keepSlug = pickRecommendedKeepSlug(members);
      groups.push({
        id: `slug:${bSlug}`,
        type: 'SLUG_VARIANT',
        title: `${members[0].displayName} (슬러그 변형: ${bSlug})`,
        reason: `유사한 슬러그(${members.map((m) => m.slug).join(', ')})가 복수 존재합니다.`,
        recommendedKeepSlug: keepSlug,
        members,
      });
    }
  }

  const missingAvatarCount = activeProfiles.filter(
    (p) => !p.avatarUrl || p.avatarUrl.includes('unsplash.com') || p.avatarUrl.includes('bg_profile.png')
  ).length;
  const missingSpecsCount = activeProfiles.filter((p) => countFilledSpecs(p.details) === 0).length;

  return {
    summary: {
      totalActiveProfiles: activeProfiles.length,
      duplicateGroupCount: groups.length,
      channelDuplicateCount: groups.filter((g) => g.type === 'CHANNEL_DUPLICATE').length,
      nameDuplicateCount: groups.filter((g) => g.type === 'NAME_DUPLICATE').length,
      slugVariantCount: groups.filter((g) => g.type === 'SLUG_VARIANT').length,
      missingAvatarCount,
      missingSpecsCount,
    },
    groups,
  };
}

// 관리자 프로필·제원 상세 수정: portal_profiles 및 streamerChannel_info를 동시에 갱신한다 (단일 책임).
export async function updateAdminStreamerInD1(
  db: D1Database,
  currentSlug: string,
  input: AdminStreamerUpdateInput
): Promise<{ success: boolean; slug: string; profile?: AdminStreamerItem; error?: string }> {
  const existing = await readPortalProfileBySlug(db, currentSlug);
  if (!existing) {
    return { success: false, slug: currentSlug, error: '해당 버튜버 프로필을 찾을 수 없습니다.' };
  }

  const targetSlug = (input.newSlug || currentSlug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!targetSlug) {
    return { success: false, slug: currentSlug, error: '유효한 URL 슬러그를 입력해 주세요.' };
  }

  if (targetSlug !== currentSlug) {
    const conflict = await readPortalProfileBySlug(db, targetSlug);
    if (conflict) {
      return { success: false, slug: currentSlug, error: `이미 사용 중인 슬러그(${targetSlug})입니다.` };
    }
  }

  const platform = (input.platform || existing.platform || 'CHZZK').toUpperCase() as PortalPlatform;
  const rawChannelUrl = (input.channelUrl !== undefined ? input.channelUrl : existing.channelUrl).trim();
  const channelUrl = portalChannelUrl(rawChannelUrl, platform) || rawChannelUrl;
  if (!channelUrl) {
    return { success: false, slug: currentSlug, error: '올바른 방송 채널 URL을 입력해 주세요.' };
  }

  const displayName = (input.displayName !== undefined ? input.displayName : existing.displayName).trim();
  if (!displayName) {
    return { success: false, slug: currentSlug, error: '활동명을 입력해 주세요.' };
  }

  const dateState = input.dateState || existing.dateState || 'FIXED';
  const timezone = input.timezone || existing.timezone || 'Asia/Seoul';
  const debutDate = ['FIXED', 'TIME_TBD'].includes(dateState)
    ? (input.debutDate !== undefined ? input.debutDate : existing.debutDate).trim()
    : '';
  const debutTime = dateState === 'FIXED'
    ? (input.debutTime !== undefined ? input.debutTime : existing.debutTime || '20:00').trim()
    : '';
  const startAtUtc = dateState === 'FIXED' && debutDate && debutTime
    ? portalUtc(debutDate, debutTime, timezone)
    : dateState === 'TIME_TBD' && debutDate
    ? portalUtc(debutDate, '12:00', timezone)
    : '';
  const targetMonth = dateState === 'DATE_TBD'
    ? (input.targetMonth || existing.targetMonth || '').trim()
    : debutDate ? debutDate.slice(0, 7) : (existing.targetMonth || '');

  const mergedDetails = normalizeBidirectionalDetails(
    input.details !== undefined ? input.details : existing.details
  );

  let nextProfile: PortalProfile = {
    ...existing,
    slug: targetSlug,
    displayName,
    platform,
    channelUrl,
    description: input.description !== undefined ? input.description.trim() : existing.description,
    headline: input.headline !== undefined ? input.headline.trim() : existing.headline,
    agency: input.agency !== undefined ? input.agency.trim() : existing.agency,
    countryCode: input.countryCode !== undefined ? input.countryCode.trim() : existing.countryCode,
    dateState,
    debutDate,
    debutTime,
    timezone,
    startAtUtc,
    targetMonth,
    avatarUrl: input.avatarUrl !== undefined ? (portalWebUrl(input.avatarUrl.trim()) || input.avatarUrl.trim()) : existing.avatarUrl,
    bannerUrl: input.bannerUrl !== undefined ? (portalWebUrl(input.bannerUrl.trim()) || input.bannerUrl.trim()) : existing.bannerUrl,
    xUrl: input.xUrl !== undefined ? (portalWebUrl(input.xUrl.trim()) || input.xUrl.trim()) : existing.xUrl,
    websiteUrl: input.websiteUrl !== undefined ? (portalWebUrl(input.websiteUrl.trim()) || input.websiteUrl.trim()) : existing.websiteUrl,
    cafeUrl: input.cafeUrl !== undefined ? (portalWebUrl(input.cafeUrl.trim()) || input.cafeUrl.trim()) : existing.cafeUrl,
    videoUrl: input.videoUrl !== undefined ? (portalWebUrl(input.videoUrl.trim()) || input.videoUrl.trim()) : existing.videoUrl,
    debutGroupId: input.debutGroupId !== undefined ? input.debutGroupId.trim() : existing.debutGroupId,
    debutGroupName: input.debutGroupName !== undefined ? input.debutGroupName.trim() : existing.debutGroupName,
    details: mergedDetails,
  };

  if (input.publicationState === 'HOLD') {
    nextProfile = reviewedProfile(nextProfile, 'HOLD', new Date().toISOString());
  } else if (input.publicationState === 'APPROVED' || existing.contentReview?.state === 'APPROVED' || existing.source === 'REGISTERED') {
    nextProfile = reviewedProfile(nextProfile, 'APPROVED', new Date().toISOString());
  }

  const beforeJson = JSON.stringify(existing);
  const afterJson = JSON.stringify(nextProfile);
  const statements: D1PreparedStatement[] = [];

  if (targetSlug !== currentSlug) {
    statements.push(db.prepare('DELETE FROM portal_profiles WHERE slug = ?').bind(currentSlug));
    statements.push(db.prepare('DELETE FROM portal_profile_channels WHERE slug = ?').bind(currentSlug));
  }

  // 동일 channel_url을 가진 다른 portal_profiles 행과 충돌하지 않도록 먼저 정리
  statements.push(
    db.prepare('UPDATE portal_profiles SET slug = ?, channel_url = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ? OR channel_url = ?')
      .bind(targetSlug, channelUrl, afterJson, targetSlug, channelUrl)
  );
  statements.push(
    db.prepare('INSERT INTO portal_profiles (slug, channel_url, data) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM portal_profiles WHERE slug = ? OR channel_url = ?)')
      .bind(targetSlug, channelUrl, afterJson, targetSlug, channelUrl)
  );

  const channelKey = portalChannelKey(channelUrl, platform);
  if (channelKey) {
    statements.push(
      db.prepare('INSERT INTO portal_profile_channels (channel_key, slug) VALUES (?, ?) ON CONFLICT(channel_key) DO UPDATE SET slug = excluded.slug')
        .bind(channelKey, targetSlug)
    );
  }

  // 레거시 streamerChannel_info & streamerChannel 동기화
  const legacyRows = await db.prepare('SELECT id, channel_id FROM streamerChannel_info WHERE slug = ?').bind(currentSlug).all<{ id: number; channel_id: number }>();
  if (legacyRows.results && legacyRows.results.length > 0) {
    const primaryLegacy = legacyRows.results[0];
    statements.push(
      db.prepare(`
        UPDATE streamerChannel_info
        SET slug = ?, display_name = ?, description = ?, profile_image_url = ?, agency_name = ?,
            country_code = ?, x_url = ?, debut_date = ?, debut_time = ?, timezone = ?,
            start_at_utc = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        targetSlug,
        displayName,
        nextProfile.description || '',
        nextProfile.avatarUrl || '',
        nextProfile.agency || '개인세',
        nextProfile.countryCode || 'KR',
        nextProfile.xUrl || '',
        debutDate,
        debutTime,
        timezone,
        startAtUtc,
        primaryLegacy.id
      )
    );
    statements.push(
      db.prepare('UPDATE streamerChannel SET platform = ?, channel_name = ?, channel_url = ? WHERE id = ?')
        .bind(platform, displayName, channelUrl, primaryLegacy.channel_id)
    );
    // 만약 동일 슬러그로 중복된 여분 레거시 행이 있다면 정리
    for (let i = 1; i < legacyRows.results.length; i++) {
      statements.push(db.prepare('DELETE FROM streamerChannel_info WHERE id = ?').bind(legacyRows.results[i].id));
    }
  }

  statements.push(
    db.prepare('INSERT INTO portal_profile_history (id, slug, before_data, after_data, reason, admin_hash) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), targetSlug, beforeJson, afterJson, '관리자 콘솔 프로필·제원 수정', 'admin:cms')
  );

  await db.batch(statements);

  const updatedList = await listAdminStreamersDetailed(db);
  const updatedItem = updatedList.find((item) => item.slug === targetSlug);
  return { success: true, slug: targetSlug, profile: updatedItem };
}

// 버튜버 완전 삭제: 클릭한 슬러그뿐만 아니라 동일 채널 키(channelKey)로 얽힌 모든 숨은 중복·레거시 행까지 일괄 삭제하여 재출현(좀비 현상)을 막는다 (단일 책임).
export async function deleteAdminStreamerCompletely(db: D1Database, slug: string): Promise<{ success: boolean; deletedSlugs: string[] }> {
  const targetProfile = await readPortalProfileBySlug(db, slug);
  const targetChannelKey = targetProfile ? portalChannelKey(targetProfile.channelUrl, targetProfile.platform) : '';
  const targetChannelUrl = targetProfile?.channelUrl || '';

  const slugsToDelete = new Set<string>([slug]);
  const channelIdsToDelete = new Set<number>();

  // 1) 레거시 테이블에서 동일 slug 또는 동일 channelKey를 가진 모든 행 탐색
  const legacyRows = await db.prepare(`
    SELECT i.id, i.channel_id, i.slug, c.platform, c.channel_url
    FROM streamerChannel_info i
    LEFT JOIN streamerChannel c ON c.id = i.channel_id
  `).all<{ id: number; channel_id: number; slug: string; platform: PortalPlatform; channel_url: string }>();

  for (const row of legacyRows.results || []) {
    const rowSlug = (row.slug || '').trim();
    const rowCKey = row.channel_url && row.platform ? portalChannelKey(row.channel_url, row.platform) : '';
    if (
      rowSlug === slug ||
      (targetChannelKey && rowCKey === targetChannelKey) ||
      (targetChannelUrl && row.channel_url === targetChannelUrl)
    ) {
      if (rowSlug) slugsToDelete.add(rowSlug);
      if (row.channel_id) channelIdsToDelete.add(row.channel_id);
    }
  }

  // 2) 포털 테이블에서 동일 slug 또는 동일 channelKey를 가진 모든 행 탐색
  const portalRows = await db.prepare('SELECT slug, channel_url, data FROM portal_profiles').all<{ slug: string; channel_url: string; data: string }>();
  for (const row of portalRows.results || []) {
    let rowCKey = '';
    try {
      const parsed = JSON.parse(row.data) as PortalProfile;
      rowCKey = portalChannelKey(parsed.channelUrl || row.channel_url, parsed.platform);
    } catch {
      // 파싱 실패 시 channel_url만 비교
    }
    if (
      row.slug === slug ||
      (targetChannelKey && rowCKey === targetChannelKey) ||
      (targetChannelUrl && row.channel_url === targetChannelUrl)
    ) {
      slugsToDelete.add(row.slug);
    }
  }

  const statements: D1PreparedStatement[] = [];
  for (const s of slugsToDelete) {
    statements.push(db.prepare('DELETE FROM streamerChannel WHERE id IN (SELECT channel_id FROM streamerChannel_info WHERE slug = ?)').bind(s));
    statements.push(db.prepare('DELETE FROM streamerChannel_info WHERE slug = ?').bind(s));
    statements.push(db.prepare('DELETE FROM portal_profiles WHERE slug = ?').bind(s));
    statements.push(db.prepare('DELETE FROM portal_profile_channels WHERE slug = ?').bind(s));
  }
  for (const cId of channelIdsToDelete) {
    statements.push(db.prepare('DELETE FROM streamerChannel_info WHERE channel_id = ?').bind(cId));
    statements.push(db.prepare('DELETE FROM streamerChannel WHERE id = ?').bind(cId));
  }
  if (targetChannelKey) {
    statements.push(db.prepare('DELETE FROM portal_profile_channels WHERE channel_key = ?').bind(targetChannelKey));
    statements.push(db.prepare('DELETE FROM portal_pending_channels WHERE channel_key = ?').bind(targetChannelKey));
  }

  if (statements.length === 0) {
    return { success: false, deletedSlugs: [] };
  }

  await db.batch(statements);
  return { success: true, deletedSlugs: [...slugsToDelete] };
}

// 중복 그룹 병합 해결: 대표 슬러그(keepSlug)로 제원·프로필을 통합하고 나머지 중복 슬러그(removeSlugs) 및 여분 레거시 행을 완전 제거한다 (단일 책임).
export async function resolveAdminDuplicateGroup(
  db: D1Database,
  keepSlug: string,
  removeSlugs: string[]
): Promise<{ success: boolean; keptSlug: string; removedSlugs: string[]; error?: string }> {
  const keepProfile = await readPortalProfileBySlug(db, keepSlug);
  if (!keepProfile) {
    return { success: false, keptSlug: keepSlug, removedSlugs: [], error: `유지할 대표 프로필(${keepSlug})을 찾을 수 없습니다.` };
  }

  const mergedDetails: Record<string, string> = { ...(keepProfile.details || {}) };
  let mergedAvatar = keepProfile.avatarUrl;
  let mergedDescription = keepProfile.description;
  let mergedAgency = keepProfile.agency;
  let mergedXUrl = keepProfile.xUrl;
  let mergedVideoUrl = keepProfile.videoUrl;
  let mergedBannerUrl = keepProfile.bannerUrl;
  let mergedGroupId = keepProfile.debutGroupId;
  let mergedGroupName = keepProfile.debutGroupName;

  const cleanRemoveSlugs = removeSlugs.map((s) => s.trim()).filter((s) => s && s !== keepSlug);

  for (const rSlug of cleanRemoveSlugs) {
    const rProfile = await readPortalProfileBySlug(db, rSlug);
    if (!rProfile) continue;
    if ((!mergedAvatar || mergedAvatar.includes('unsplash.com')) && rProfile.avatarUrl) {
      mergedAvatar = rProfile.avatarUrl;
    }
    if (!mergedDescription && rProfile.description) mergedDescription = rProfile.description;
    if ((!mergedAgency || mergedAgency === '개인세') && rProfile.agency && rProfile.agency !== '개인세') {
      mergedAgency = rProfile.agency;
    }
    if (!mergedXUrl && rProfile.xUrl) mergedXUrl = rProfile.xUrl;
    if (!mergedVideoUrl && rProfile.videoUrl) mergedVideoUrl = rProfile.videoUrl;
    if (!mergedBannerUrl && rProfile.bannerUrl) mergedBannerUrl = rProfile.bannerUrl;
    if (!mergedGroupId && rProfile.debutGroupId) {
      mergedGroupId = rProfile.debutGroupId;
      mergedGroupName = rProfile.debutGroupName;
    }
    if (rProfile.details) {
      for (const [k, v] of Object.entries(rProfile.details)) {
        if (v && !mergedDetails[k]) mergedDetails[k] = v;
      }
    }
  }

  const statements: D1PreparedStatement[] = [];

  // 1) 제거 대상 슬러그 삭제 (portal_profiles 및 streamerChannel_info)
  for (const rSlug of cleanRemoveSlugs) {
    statements.push(db.prepare('DELETE FROM portal_profiles WHERE slug = ?').bind(rSlug));
    statements.push(db.prepare('DELETE FROM portal_profile_channels WHERE slug = ?').bind(rSlug));
    statements.push(db.prepare('DELETE FROM streamerChannel WHERE id IN (SELECT channel_id FROM streamerChannel_info WHERE slug = ? AND slug != ?)').bind(rSlug, keepSlug));
    statements.push(db.prepare('DELETE FROM streamerChannel_info WHERE slug = ?').bind(rSlug));
  }

  // 2) keepSlug 자체에 레거시 중복 행이 여러 개 있는 경우 1개만 남기고 정리
  const legacyKeepRows = await db.prepare('SELECT id FROM streamerChannel_info WHERE slug = ? ORDER BY id ASC').bind(keepSlug).all<{ id: number }>();
  if (legacyKeepRows.results && legacyKeepRows.results.length > 1) {
    for (let i = 1; i < legacyKeepRows.results.length; i++) {
      statements.push(db.prepare('DELETE FROM streamerChannel_info WHERE id = ?').bind(legacyKeepRows.results[i].id));
    }
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  // 3) 병합된 정보로 keepSlug 업데이트 저장
  await updateAdminStreamerInD1(db, keepSlug, {
    avatarUrl: mergedAvatar,
    description: mergedDescription,
    agency: mergedAgency,
    xUrl: mergedXUrl,
    videoUrl: mergedVideoUrl,
    bannerUrl: mergedBannerUrl,
    debutGroupId: mergedGroupId,
    debutGroupName: mergedGroupName,
    details: normalizeBidirectionalDetails(mergedDetails),
  });

  return {
    success: true,
    keptSlug: keepSlug,
    removedSlugs: cleanRemoveSlugs,
  };
}

