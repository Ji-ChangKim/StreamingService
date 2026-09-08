// Single Responsibility Principle: Automated Debut Review & Approval Pipeline Service
import { fetchPlatformProfile } from './platformApiService';
import { validateDisplayName, validateChannelUrl, validateDebutDateTime } from './eventValidationService';
import { approveSubmissionInD1, rejectSubmissionInD1 } from './submissionDbService';

export interface AutoReviewItemResult {
  id: number;
  displayName: string;
  platform: string;
  status: 'APPROVED' | 'REJECTED' | 'HELD';
  reason: string;
  slug?: string;
}

export interface AutoReviewReport {
  totalProcessed: number;
  approvedCount: number;
  rejectedCount: number;
  heldCount: number;
  results: AutoReviewItemResult[];
  executedAt: string;
}

/**
 * 1. [1단계] 신청서 주소 및 도메인 유효성 검증 (SRP)
 */
export function validateSubmissionAddress(sub: any): { isValid: boolean; error?: string } {
  const nameCheck = validateDisplayName(sub.display_name);
  if (!nameCheck.isValid) {
    return { isValid: false, error: nameCheck.errorMessage || '스트리머 이름이 유효하지 않습니다.' };
  }

  const urlCheck = validateChannelUrl(sub.channel_url, sub.platform);
  if (!urlCheck.isValid) {
    return { isValid: false, error: urlCheck.errorMessage || '방송국 URL 도메인이 올바르지 않습니다.' };
  }

  return { isValid: true };
}

/**
 * 2. [2단계] 외부 공식 API 실시간 호출을 통한 채널 실존 및 프로필 검증 (SRP)
 */
export async function validateSubmissionProfile(sub: any): Promise<{
  isValid: boolean;
  error?: string;
  profile?: any;
}> {
  try {
    const profile = await fetchPlatformProfile(sub.platform, sub.channel_url);
    if (!profile || !profile.success) {
      return {
        isValid: false,
        error: profile?.error || '플랫폼에서 채널 정보를 확인할 수 없습니다. (비공개 또는 미존재 채널)'
      };
    }

    return { isValid: true, profile };
  } catch (err: any) {
    return {
      isValid: false,
      error: `플랫폼 API 통신 오류: ${err?.message || '네트워크 문제'}`
    };
  }
}

/**
 * 3. [3단계] 데뷔 일정 형식 및 메인 캘린더 기존 등록 중복 여부 검증 (SRP)
 */
export async function validateSubmissionScheduleAndUniqueness(
  db: D1Database,
  sub: any
): Promise<{ isValid: boolean; isDuplicate: boolean; error?: string }> {
  // 데뷔 일정 형식 검사
  const dateCheck = validateDebutDateTime(sub.start_at_utc);
  if (!dateCheck.isValid) {
    return {
      isValid: false,
      isDuplicate: false,
      error: dateCheck.errorMessage || '데뷔 일시가 유효하지 않습니다.'
    };
  }

  try {
    // 이미 등록된 채널 URL인지 중복 검사
    const existing = await db
      .prepare('SELECT id, channel_name FROM streamerChannel WHERE channel_url = ? LIMIT 1')
      .bind(sub.channel_url.trim())
      .first();

    if (existing) {
      return {
        isValid: false,
        isDuplicate: true,
        error: `이미 등록된 방송국 채널입니다. (기등록명: ${existing.channel_name})`
      };
    }

    return { isValid: true, isDuplicate: false };
  } catch (err: any) {
    return {
      isValid: false,
      isDuplicate: false,
      error: `DB 중복 조회 오류: ${err?.message}`
    };
  }
}

/**
 * 4. 단일 신청서 종합 3단계 심사 및 자동 승인/반려/보류 처리 (SRP)
 */
export async function reviewSingleSubmission(
  db: D1Database,
  sub: any
): Promise<AutoReviewItemResult> {
  const result: AutoReviewItemResult = {
    id: sub.id,
    displayName: sub.display_name,
    platform: sub.platform,
    status: 'HELD',
    reason: '',
  };

  // 1단계: 주소 및 도메인 검증
  const addressCheck = validateSubmissionAddress(sub);
  if (!addressCheck.isValid) {
    result.status = 'REJECTED';
    result.reason = `[1단계 주소 검증 실패] ${addressCheck.error}`;
    await rejectSubmissionInD1(db, sub.id, result.reason);
    return result;
  }

  // 2단계: 외부 플랫폼 공식 API 프로필 검증
  const profileCheck = await validateSubmissionProfile(sub);
  if (!profileCheck.isValid) {
    // API 조회 실패 시 일시적 오류일 수 있으므로 즉시 반려하지 않고 보류(HELD) 처리
    result.status = 'HELD';
    result.reason = `[2단계 프로필 검증 보류] ${profileCheck.error}`;
    await db.prepare(`
      UPDATE debut_submissions
      SET admin_note = ?
      WHERE id = ?
    `).bind(result.reason, sub.id).run();
    return result;
  }

  // 3단계: 일정 및 중복 검증
  const scheduleCheck = await validateSubmissionScheduleAndUniqueness(db, sub);
  if (!scheduleCheck.isValid) {
    if (scheduleCheck.isDuplicate) {
      result.status = 'REJECTED';
      result.reason = `[3단계 중복 반려] ${scheduleCheck.error}`;
      await rejectSubmissionInD1(db, sub.id, result.reason);
    } else {
      result.status = 'HELD';
      result.reason = `[3단계 일정 오류 보류] ${scheduleCheck.error}`;
      await db.prepare(`
        UPDATE debut_submissions
        SET admin_note = ?
        WHERE id = ?
      `).bind(result.reason, sub.id).run();
    }
    return result;
  }

  // 💡 3단계 모두 통과 ➔ 캘린더 자동 승인 및 발행
  try {
    const approveRes = await approveSubmissionInD1(db, sub.id);
    if (approveRes.success) {
      result.status = 'APPROVED';
      result.slug = approveRes.slug;
      result.reason = `[자동 승인 완료] 주소/프로필/일정 3단계 검증 통과 (발행: /creator/${approveRes.slug})`;

      await db.prepare(`
        UPDATE debut_submissions
        SET admin_note = ?
        WHERE id = ?
      `).bind(result.reason, sub.id).run();
    } else {
      result.status = 'HELD';
      result.reason = `[승인 처리 실패] ${approveRes.error || 'DB 삽입 오류'}`;
    }
  } catch (err: any) {
    result.status = 'HELD';
    result.reason = `[승인 예외 발생] ${err?.message}`;
  }

  return result;
}

/**
 * 5. 1시간 주기 전체 대기열 자동 심사 파이프라인 총괄 실행 (Facade Function)
 */
export async function runAutoReviewPipeline(db: D1Database): Promise<AutoReviewReport> {
  const executedAt = new Date().toISOString();

  try {
    // 심사 대기(PENDING) 상태인 모든 신청서 조회
    const { results } = await db
      .prepare("SELECT * FROM debut_submissions WHERE status = 'PENDING' ORDER BY id ASC")
      .all();

    const pendingList = (results || []) as any[];
    const itemResults: AutoReviewItemResult[] = [];

    let approvedCount = 0;
    let rejectedCount = 0;
    let heldCount = 0;

    for (const sub of pendingList) {
      const res = await reviewSingleSubmission(db, sub);
      itemResults.push(res);

      if (res.status === 'APPROVED') approvedCount++;
      else if (res.status === 'REJECTED') rejectedCount++;
      else heldCount++;
    }

    return {
      totalProcessed: pendingList.length,
      approvedCount,
      rejectedCount,
      heldCount,
      results: itemResults,
      executedAt,
    };
  } catch (err: any) {
    console.error('runAutoReviewPipeline error:', err);
    return {
      totalProcessed: 0,
      approvedCount: 0,
      rejectedCount: 0,
      heldCount: 0,
      results: [],
      executedAt,
    };
  }
}
