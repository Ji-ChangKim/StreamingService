import { RawParsedSubmission } from './submissionFileParser';

export interface ValidSubmissionItem {
  rowIndex: number;
  displayName: string;
  platform: 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH';
  channelUrl: string;
  debutDate: string;
  debutTime: string;
  agencyName: string;
  countryCode: string;
  description: string;
  avatarUrl: string;
  xUrl: string;
  contactEmail: string;
}

export interface InvalidSubmissionRow {
  rowIndex: number;
  row: RawParsedSubmission;
  errors: string[];
}

export interface ValidationSummary {
  totalCount: number;
  validCount: number;
  invalidCount: number;
  validItems: ValidSubmissionItem[];
  invalidItems: InvalidSubmissionRow[];
}

const PLATFORM_DOMAINS: Record<string, string[]> = {
  CHZZK: ['chzzk.naver.com'],
  SOOP: ['sooplive.co.kr', 'afreecatv.com'],
  YOUTUBE: ['youtube.com', 'youtu.be'],
  TWITCH: ['twitch.tv'],
};

/**
 * 1. 단일 행 유효성 검사 (Single Responsibility Principle)
 */
export function validateSubmissionRow(row: RawParsedSubmission): string[] {
  const errors: string[] = [];

  // 1. 스트리머명 검사
  if (!row.displayName) {
    errors.push('스트리머명이 누락되었습니다.');
  } else if (row.displayName.length > 30) {
    errors.push('스트리머명은 30자 이하이어야 합니다.');
  } else if (['(알 수 없음)', '알 수 없음', 'unknown', 'null', 'undefined'].includes(row.displayName.toLowerCase())) {
    errors.push('유효한 스트리머명을 입력해주세요.');
  }

  // 2. 플랫폼 검사
  const validPlatforms = ['CHZZK', 'SOOP', 'YOUTUBE', 'TWITCH'];
  if (!validPlatforms.includes(row.platform)) {
    errors.push(`지원하지 않는 플랫폼입니다. (${row.platform || '비어있음'})`);
  }

  // 3. 채널 URL 검사
  if (!row.channelUrl) {
    errors.push('채널 URL이 누락되었습니다.');
  } else {
    try {
      const url = new URL(row.channelUrl);
      const host = url.hostname.toLowerCase();
      const allowedDomains = PLATFORM_DOMAINS[row.platform] || [];
      const isAllowed = allowedDomains.some((d) => host === d || host.endsWith(`.${d}`));
      if (!isAllowed) {
        errors.push(`${row.platform} 공식 방송국 URL이 아닙니다. (${host})`);
      }
    } catch {
      errors.push('올바른 URL 형식(http:// 또는 https://)이 아닙니다.');
    }
  }

  // 4. 데뷔 날짜 검사 (YYYY-MM-DD)
  if (!row.debutDate) {
    errors.push('데뷔 날짜가 누락되었습니다.');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.debutDate)) {
    errors.push('데뷔 날짜는 YYYY-MM-DD 형식이어야 합니다.');
  } else {
    const year = parseInt(row.debutDate.substring(0, 4), 10);
    if (year < 2020 || year > 2035) {
      errors.push('데뷔 연도는 2020~2035년 사이여야 합니다.');
    }
  }

  // 5. 데뷔 시간 검사 (HH:mm)
  if (!row.debutTime) {
    errors.push('데뷔 시간이 누락되었습니다.');
  } else if (!/^\d{2}:\d{2}$/.test(row.debutTime)) {
    errors.push('데뷔 시간은 HH:mm 형식이어야 합니다.');
  }

  return errors;
}

/**
 * 2. 전체 파싱 행 목록 유효성 검사 및 통계 집계
 */
export function validateAllSubmissions(rawRows: RawParsedSubmission[]): ValidationSummary {
  const validItems: ValidSubmissionItem[] = [];
  const invalidItems: InvalidSubmissionRow[] = [];

  for (const row of rawRows) {
    const errors = validateSubmissionRow(row);
    if (errors.length === 0) {
      validItems.push(row as ValidSubmissionItem);
    } else {
      invalidItems.push({
        rowIndex: row.rowIndex,
        row,
        errors,
      });
    }
  }

  return {
    totalCount: rawRows.length,
    validCount: validItems.length,
    invalidCount: invalidItems.length,
    validItems,
    invalidItems,
  };
}
