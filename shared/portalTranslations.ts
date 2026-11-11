// 번역 조회만 담당한다. 사전 데이터는 portalTranslationData.ts를 불러올 때 등록된다.
// 한국어 화면은 사전을 받지 않아 첫 화면의 스크립트 처리량을 줄인다.
let dictionary: Record<string, readonly [string, string]> = {};

export function registerPortalTranslations(next: Record<string, readonly [string, string]>): void { dictionary = next; }
export function hasPortalTranslations(): boolean { return Object.keys(dictionary).length > 0; }

// 동적 값은 번역하지 않고 자리표시자에 그대로 넣는다.
export function translatePortalText(source: string, language: 'ko' | 'ja' | 'en', values: unknown[] = []): string {
  const message = language === 'ko' ? source : dictionary[source]?.[language === 'ja' ? 0 : 1] || source;
  return message.replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)] ?? `{${index}}`));
}
