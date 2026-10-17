// 따옴표 안의 쉼표·줄바꿈·겹따옴표를 보존하는 CSV 상태다.
type CsvState = { rows: string[][]; row: string[]; field: string; quoted: boolean; closing: boolean };

// 잘못 닫힌 따옴표를 정상 수집으로 취급하지 않는다.
function invalidCsv(): never {
  throw new Error('수집 원본 CSV의 따옴표 구조가 올바르지 않습니다.');
}

// 현재 필드를 행에 추가한다.
function endField(state: CsvState): CsvState {
  return Object.assign(state, { row: [...state.row, state.field], field: '', quoted: false, closing: false });
}

// 현재 행을 결과에 추가한다.
function endRow(state: CsvState): CsvState {
  return Object.assign(state, { rows: [...state.rows, [...state.row, state.field]], row: [], field: '', quoted: false, closing: false });
}

// 필드 안의 문자를 누적한다.
function appendField(state: CsvState, character: string): CsvState {
  return Object.assign(state, { field: state.field + character, closing: false });
}

// 닫는 따옴표 다음의 구분자만 허용한다.
function afterQuote(state: CsvState, character: string): CsvState {
  return character === '"' ? appendField(state, '"') : character === ',' ? endField(state) : character === '\n' ? endRow(state) : character === ' ' || character === '\t' ? state : invalidCsv();
}

// 인용 필드 안의 줄바꿈을 행 구분자로 해석하지 않는다.
function insideQuote(state: CsvState, character: string): CsvState {
  return state.closing ? afterQuote(state, character) : character === '"' ? Object.assign(state, { closing: true }) : appendField(state, character);
}

// 인용되지 않은 필드의 구분자와 시작 따옴표를 처리한다.
function consumeCharacter(state: CsvState, character: string): CsvState {
  return state.quoted ? insideQuote(state, character) : character === ',' ? endField(state) : character === '\n' ? endRow(state) : character === '"' ? state.field ? invalidCsv() : Object.assign(state, { quoted: true }) : appendField(state, character);
}

// 마지막 필드를 마감하며 닫히지 않은 따옴표는 거부한다.
function finishCsv(state: CsvState): string[][] {
  return state.quoted && !state.closing ? invalidCsv() : state.row.length || state.field || state.quoted ? endRow(state).rows : state.rows;
}

// 기존 시트의 머리말 다섯 레코드와 데이터 열 구조를 확인한다.
function validateRows(rows: string[][]): string[][] {
  return rows.length < 5 || rows.slice(5).some((row) => row.some((field) => field.trim()) && row.length < 5)
    ? (() => { throw new Error('수집 원본 CSV의 행·열 구조가 변경되었습니다.'); })() : rows;
}

// 실제 레코드 단위로 파싱하여 머리말 안의 줄바꿈에 영향을 받지 않는다.
export function parseCrawlerCsv(text: string): string[][] {
  return validateRows(finishCsv(Array.from(text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')).reduce(consumeCharacter, { rows: [], row: [], field: '', quoted: false, closing: false })));
}
