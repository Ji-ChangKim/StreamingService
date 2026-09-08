import * as XLSX from 'xlsx';

// 템플릿 컬럼 및 샘플 데이터 정의
export const SUBMISSION_TEMPLATE_COLUMNS = [
  '스트리머명*',
  '플랫폼*',
  '채널URL*',
  '데뷔날짜*',
  '데뷔시간*',
  '소속사',
  '국가코드',
  '소개글',
  '프로필이미지URL',
  'X(트위터)URL',
  '연락처이메일',
] as const;

export const SUBMISSION_SAMPLE_ROWS = [
  {
    '스트리머명*': '잘님',
    '플랫폼*': '치지직',
    '채널URL*': 'https://chzzk.naver.com/c63f8c12f6d0178457b82413d45efd5a',
    '데뷔날짜*': '2026-09-15',
    '데뷔시간*': '19:00',
    '소속사': '개인세',
    '국가코드': 'KR',
    '소개글': '네 마음을 이해하고 싶은 창조의 여신. 토크, 타로, 그림, 게임 데뷔 방송!',
    '프로필이미지URL': '',
    'X(트위터)URL': 'https://x.com/zalnim',
    '연락처이메일': 'tokuhane@gmail.com',
  },
  {
    '스트리머명*': '윤지아',
    '플랫폼*': 'SOOP',
    '채널URL*': 'https://www.sooplive.co.kr/station/ziin05566',
    '데뷔날짜*': '2026-09-28',
    '데뷔시간*': '15:00',
    '소속사': '개인세',
    '국가코드': 'KR',
    '소개글': 'SOOP 신입 버튜버 윤지아의 첫 공식 데뷔 방송입니다.',
    '프로필이미지URL': '',
    'X(트위터)URL': '',
    '연락처이메일': '',
  },
  {
    '스트리머명*': '愛星しゅが',
    '플랫폼*': '유튜브',
    '채널URL*': 'https://www.youtube.com/@manase_shuga',
    '데뷔날짜*': '2026-09-26',
    '데뷔시간*': '19:00',
    '소속사': 'Laugh Re:verse',
    '국가코드': 'JP',
    '소개글': '마법소녀를 꿈꾸는 신입 버튜버 사랑별 슈가의 유튜브 데뷔 방송!',
    '프로필이미지URL': '',
    'X(트위터)URL': '',
    '연락처이메일': '',
  },
];

/**
 * 1. 엑셀(.xlsx) 표준 양식 템플릿 생성 및 즉시 다운로드
 */
export function downloadExcelTemplate(): void {
  const ws = XLSX.utils.json_to_sheet(SUBMISSION_SAMPLE_ROWS, {
    header: [...SUBMISSION_TEMPLATE_COLUMNS],
  });

  // 열 너비 자동 조정
  ws['!cols'] = [
    { wch: 16 }, // 스트리머명
    { wch: 10 }, // 플랫폼
    { wch: 48 }, // 채널URL
    { wch: 14 }, // 데뷔날짜
    { wch: 12 }, // 데뷔시간
    { wch: 16 }, // 소속사
    { wch: 10 }, // 국가코드
    { wch: 40 }, // 소개글
    { wch: 30 }, // 프로필이미지URL
    { wch: 28 }, // X(트위터)URL
    { wch: 24 }, // 연락처이메일
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '데뷔심사_등록양식');
  XLSX.writeFile(wb, 'vdebut_submission_template.xlsx');
}

/**
 * 2. CSV(.csv) 표준 양식 템플릿 생성 및 즉시 다운로드 (UTF-8 BOM 포함으로 엑셀 한글 깨짐 완전 방지)
 */
export function downloadCsvTemplate(): void {
  const headers = [...SUBMISSION_TEMPLATE_COLUMNS].join(',');

  const escapeCsvCell = (val: string) => {
    if (!val) return '';
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = SUBMISSION_SAMPLE_ROWS.map((row) =>
    SUBMISSION_TEMPLATE_COLUMNS.map((col) => escapeCsvCell(row[col] || '')).join(',')
  );

  // UTF-8 BOM (\uFEFF) 추가
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'vdebut_submission_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
