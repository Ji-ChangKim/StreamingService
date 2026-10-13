// 요청 데이터 대신 재사용 가능한 포맷터만 최대 24개 보관한다.
const formatters = new Map<string, Intl.DateTimeFormat>();
const MAX_FORMATTERS = 24;

// 동일한 언어·시간대·표시 형식의 생성 비용을 한 번만 지불한다.
export function dateTimeFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify([locale, options]);
  const existing = formatters.get(key);
  if (existing) return existing;
  const formatter = new Intl.DateTimeFormat(locale, options);
  if (formatters.size >= MAX_FORMATTERS) formatters.delete(formatters.keys().next().value!);
  formatters.set(key, formatter);
  return formatter;
}
