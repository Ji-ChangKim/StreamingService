// 보고서 원본은 크기와 형식을 제한하여 로그인 화면을 정상 CSV로 오인하지 않는다.
const MAX_SOURCE_BYTES = 2 * 1024 * 1024;

// 오류가 나면 읽기를 취소하고 호출자에게 실패를 전달한다.
function rejectSource(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<never> {
  return reader.cancel().then(() => Promise.reject(new Error('수집 원본이 허용 크기 2 MiB를 초과했습니다.')));
}

// 제한된 크기의 UTF-8 원본만 누적한다.
function readSourceChunks(reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder, text: string, bytes: number): Promise<string> {
  return reader.read().then(({ done, value }) => done ? text + decoder.decode() : bytes + value.byteLength > MAX_SOURCE_BYTES ? rejectSource(reader) : readSourceChunks(reader, decoder, text + decoder.decode(value, { stream: true }), bytes + value.byteLength));
}

// 읽기 완료와 실패 모두 스트림 잠금을 해제한다.
function readSourceBody(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  return readSourceChunks(reader, new TextDecoder(), '', 0).finally(() => reader.releaseLock());
}

// 빈 응답·HTML·JSON·기본 행 구조가 바뀐 원본을 실패로 처리한다.
function validateSourceText(text: string): string {
  return !text.trim() || /^\s*[<{[]/.test(text)
    ? (() => { throw new Error('수집 원본이 예상한 CSV 형식이 아닙니다.'); })() : text;
}

// 보고 모드에서만 사용하며 저장소나 이메일 서비스에 접근하지 않는다.
export function readCrawlerReportSource(response: Response): Promise<string> {
  return !response.body || /html|json/i.test(response.headers.get('Content-Type') || '')
    ? Promise.reject(new Error('수집 원본이 CSV 대신 빈 응답 또는 HTML/JSON을 반환했습니다.'))
    : readSourceBody(response.body.getReader()).then(validateSourceText);
}
