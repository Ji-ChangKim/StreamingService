import * as XLSX from 'xlsx';

export interface RawParsedSubmission {
  rowIndex: number;
  displayName: string;
  platform: string;
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

/**
 * 1. 플랫폼 명칭 정규화 (한글/영문 다양한 별칭 지원)
 */
export function normalizePlatform(rawPlatform?: string): string {
  if (!rawPlatform) return 'CHZZK';
  const clean = String(rawPlatform).trim().toLowerCase().replace(/[\s_-]/g, '');

  if (['치지직', 'chzzk', 'naver', '네이버치지직', '네이버'].includes(clean)) {
    return 'CHZZK';
  }
  if (['숲', 'soop', '아프리카', '아프리카tv', 'afreeca', 'afreecatv'].includes(clean)) {
    return 'SOOP';
  }
  if (['유튜브', 'youtube', 'yt', '유툽'].includes(clean)) {
    return 'YOUTUBE';
  }
  if (['트위치', 'twitch'].includes(clean)) {
    return 'TWITCH';
  }
  return rawPlatform.trim().toUpperCase();
}

/**
 * 2. 데뷔 날짜 정규화 (YYYY-MM-DD 형식으로 변환)
 */
export function normalizeDate(val: any): string {
  if (!val) return '';

  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 숫자형 엑셀 날짜 일련번호인 경우
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {}
  }

  const str = String(val).trim();
  const match = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * 3. 데뷔 시간 정규화 (HH:mm 형식으로 변환)
 */
export function normalizeTime(val: any): string {
  if (!val) return '19:00';

  if (val instanceof Date && !isNaN(val.getTime())) {
    const h = String(val.getHours()).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  // 숫자형 엑셀 시간(소수점)인 경우
  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalSeconds = Math.round(val * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const str = String(val).trim();
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }

  return '19:00';
}

/**
 * 4. 엑셀/CSV 파일 파싱 Facade 함수 (브라우저 비동기 처리)
 */
export async function parseSubmissionFile(file: File): Promise<RawParsedSubmission[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('엑셀/CSV 파일 내 유효한 시트를 찾을 수 없습니다.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (!rows || rows.length === 0) {
    throw new Error('파일에 데이터 행이 없습니다.');
  }

  return rows.map((row, idx) => {
    // 키 매핑 (헤더 컬럼 유연한 매핑)
    const findValue = (...keys: string[]) => {
      for (const k of keys) {
        for (const rowKey of Object.keys(row)) {
          if (rowKey.replace(/[\s*]/g, '').toLowerCase() === k.toLowerCase()) {
            return row[rowKey];
          }
        }
      }
      return '';
    };

    const displayName = String(findValue('스트리머명', '이름', 'name', 'displayname', 'creator')).trim();
    const platform = normalizePlatform(String(findValue('플랫폼', 'platform', '방송국')));
    const channelUrl = String(findValue('채널url', '채널링크', '방송국url', 'url', 'channelurl')).trim();
    const debutDate = normalizeDate(findValue('데뷔날짜', '날짜', 'date', 'debutdate'));
    const debutTime = normalizeTime(findValue('데뷔시간', '시간', 'time', 'debuttime'));
    const agencyName = String(findValue('소속사', '소속', 'agency', 'agencyname')).trim() || '개인세';
    const countryCode = String(findValue('국가코드', '국가', 'country', 'countrycode')).trim().toUpperCase() || 'KR';
    const description = String(findValue('소개글', '소개', '설명', 'description')).trim();
    const avatarUrl = String(findValue('프로필이미지url', '아바타url', '프로필url', 'avatarurl', 'imageurl')).trim();
    const xUrl = String(findValue('x(트위터)url', 'xurl', '트위터url', 'twitterurl', 'x')).trim();
    const contactEmail = String(findValue('연락처이메일', '이메일', 'email', 'contactemail')).trim();

    return {
      rowIndex: idx + 2, // 1행은 헤더이므로 실제 엑셀 행 번호는 +2
      displayName,
      platform,
      channelUrl,
      debutDate,
      debutTime,
      agencyName,
      countryCode,
      description,
      avatarUrl,
      xUrl,
      contactEmail,
    };
  });
}
