import { fetchPlatformProfile } from './platformApiService';
import { generateCleanSlug, resolveUniqueSlug } from '../utils/slugUtils';

export interface SubmissionData {
  id: number;
  displayName: string;
  platform: string;
  channelUrl: string;
  avatarUrl?: string;
  description?: string;
  agencyName?: string;
  countryCode?: string;
  debutDate: string;
  debutTime: string;
  timezone: string;
  startAtUtc: string;
  xUrl?: string;
  contactEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

/**
 * 1. 사용자의 신규 데뷔 신청서를 debut_submissions 테이블에 PENDING 상태로 저장
 */
export async function createSubmissionToD1(db: D1Database, body: any): Promise<number> {
  const now = Date.now();
  let displayName = body.creator?.displayName || body.displayName || '신입 버튜버';
  let avatarUrl = body.creator?.avatarUrl || body.avatarUrl || '';
  const agencyName = body.creator?.agency || body.agency || '개인세';
  const countryCode = body.creator?.countryCode || body.countryCode || 'KR';
  let description = body.description || body.creator?.description || `${displayName}의 데뷔 방송입니다.`;

  const primaryLink = body.links?.[0] || null;
  const platform = (primaryLink?.platform || body.platform || 'CHZZK').toUpperCase();
  const channelUrl = primaryLink?.url || body.watchUrl || body.channelUrl || 'https://chzzk.naver.com';
  const xUrl = body.creator?.xUrl || body.xUrl || '';
  const contactEmail = body.contactEmail || '';

  // 프로필 아바타가 없으면 외부 API에서 자동 수집 시도
  if (!avatarUrl && channelUrl) {
    try {
      const apiResult = await fetchPlatformProfile(platform, channelUrl);
      if (apiResult.success) {
        avatarUrl = apiResult.profileImageUrl || avatarUrl;
        displayName = apiResult.creatorName || displayName;
        description = apiResult.description || description;
      }
    } catch {}
  }

  const startAtUtc = body.startAtUtc || new Date(now + 86400000 * 3).toISOString();
  const timezone = body.originalTimezone || body.timezone || 'Asia/Seoul';

  const d = new Date(startAtUtc);
  const debutDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const debutTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const res: any = await db.prepare(`
    INSERT INTO debut_submissions (
      display_name, platform, channel_url, avatar_url, description,
      agency_name, country_code, debut_date, debut_time, timezone,
      start_at_utc, x_url, contact_email, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    RETURNING id
  `).bind(
    displayName, platform, channelUrl, avatarUrl, description,
    agencyName, countryCode, debutDate, debutTime, timezone,
    startAtUtc, xUrl, contactEmail
  ).first();

  return res?.id || now;
}

/**
 * 2. 관리자 CMS용 신청서 목록 조회 (전체 / PENDING / APPROVED / REJECTED)
 */
export async function fetchSubmissionsFromD1(db: D1Database, statusFilter?: string): Promise<SubmissionData[]> {
  try {
    let query = 'SELECT * FROM debut_submissions ORDER BY created_at DESC';
    let stmt;

    if (statusFilter && statusFilter !== 'ALL') {
      query = 'SELECT * FROM debut_submissions WHERE status = ? ORDER BY created_at DESC';
      stmt = db.prepare(query).bind(statusFilter);
    } else {
      stmt = db.prepare(query);
    }

    const { results } = await stmt.all();
    if (!results || results.length === 0) return [];

    return (results as any[]).map((r) => ({
      id: r.id,
      displayName: r.display_name,
      platform: r.platform,
      channelUrl: r.channel_url,
      avatarUrl: r.avatar_url,
      description: r.description,
      agencyName: r.agency_name,
      countryCode: r.country_code,
      debutDate: r.debut_date,
      debutTime: r.debut_time,
      timezone: r.timezone,
      startAtUtc: r.start_at_utc,
      xUrl: r.x_url,
      contactEmail: r.contact_email,
      status: r.status,
      adminNote: r.admin_note,
      createdAt: r.created_at,
      processedAt: r.processed_at,
    }));
  } catch (err) {
    console.error('fetchSubmissionsFromD1 error:', err);
    return [];
  }
}

/**
 * 3. 관리자 1-클릭 승인: debut_submissions ➔ streamerChannel & streamerChannel_info 정식 캘린더 DB 등록!
 * (스마트 깔끔한 영문/로마자 슬러그 및 커스텀 슬러그 지원)
 */
export async function approveSubmissionInD1(
  db: D1Database,
  submissionId: number,
  customSlug?: string
): Promise<{ success: boolean; eventId?: string; slug?: string; error?: string }> {
  try {
    const sub: any = await db
      .prepare('SELECT * FROM debut_submissions WHERE id = ? LIMIT 1')
      .bind(submissionId)
      .first();

    if (!sub) {
      return { success: false, error: '해당 신청서를 찾을 수 없습니다.' };
    }

    const now = Date.now();
    
    // 💡 스마트 슬러그 생성: 관리자 커스텀 슬러그 > 채널URL/이름 기반 자동 생성 > DB 중복 체크 해결
    const rawSlug = customSlug && customSlug.trim()
      ? customSlug.trim()
      : generateCleanSlug(sub.display_name, sub.channel_url, sub.x_url);

    const slug = await resolveUniqueSlug(db, rawSlug);

    // ① 메인 streamerChannel 등록
    const chRes: any = await db.prepare(`
      INSERT INTO streamerChannel (platform, channel_url, channel_name)
      VALUES (?, ?, ?)
      RETURNING id
    `).bind(sub.platform, sub.channel_url, `${sub.display_name} ${sub.platform}`).first();

    const channelId = chRes?.id || now;

    // ② 메인 streamerChannel_info 등록 (깔끔한 슬러그로 저장)
    const infoRes: any = await db.prepare(`
      INSERT INTO streamerChannel_info (
        channel_id, slug, display_name, profile_image_url, description,
        agency_name, debut_date, debut_time, timezone, start_at_utc,
        country_code, x_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      channelId, slug, sub.display_name, sub.avatar_url || '', sub.description || '',
      sub.agency_name || '개인세', sub.debut_date, sub.debut_time, sub.timezone || 'Asia/Seoul',
      sub.start_at_utc, sub.country_code || 'KR', sub.x_url || ''
    ).first();

    const infoId = infoRes?.id || channelId;

    // ③ debut_submissions 상태를 APPROVED로 업데이트
    await db.prepare(`
      UPDATE debut_submissions
      SET status = 'APPROVED', processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(submissionId).run();

    return { success: true, eventId: `evt_${infoId}`, slug };
  } catch (err: any) {
    console.error('approveSubmissionInD1 error:', err);
    return { success: false, error: err?.message || '승인 처리 중 오류 발생' };
  }
}

/**
 * 4. 관리자 신청서 반려
 */
export async function rejectSubmissionInD1(
  db: D1Database,
  submissionId: number,
  adminNote?: string
): Promise<boolean> {
  try {
    await db.prepare(`
      UPDATE debut_submissions
      SET status = 'REJECTED', admin_note = ?, processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(adminNote || null, submissionId).run();
    return true;
  } catch (err) {
    console.error('rejectSubmissionInD1 error:', err);
    return false;
  }
}

/**
 * 5. 관리자 신청서 영구 삭제
 */
export async function deleteSubmissionFromD1(db: D1Database, submissionId: number): Promise<boolean> {
  try {
    await db.prepare('DELETE FROM debut_submissions WHERE id = ?').bind(submissionId).run();
    return true;
  } catch (err) {
    console.error('deleteSubmissionFromD1 error:', err);
    return false;
  }
}

/**
 * 6. CMS용 전체 등록 버튜버 목록 조회 (실시간 검색 및 1-클릭 삭제/관리용)
 */
export async function fetchAllActiveStreamersForAdmin(db: D1Database): Promise<any[]> {
  try {
    const { results } = await db.prepare(`
      SELECT 
        i.id as info_id,
        i.channel_id,
        i.slug,
        i.display_name,
        i.profile_image_url,
        i.description,
        i.agency_name,
        i.debut_date,
        i.debut_time,
        i.timezone,
        i.start_at_utc,
        i.country_code,
        i.x_url,
        c.platform,
        c.channel_url,
        c.channel_name,
        i.created_at,
        i.updated_at
      FROM streamerChannel_info i
      INNER JOIN streamerChannel c ON i.channel_id = c.id
      ORDER BY i.start_at_utc DESC
    `).all();

    return results || [];
  } catch (err) {
    console.error('fetchAllActiveStreamersForAdmin error:', err);
    return [];
  }
}
