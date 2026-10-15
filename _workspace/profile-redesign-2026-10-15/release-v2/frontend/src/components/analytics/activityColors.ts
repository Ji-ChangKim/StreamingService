const CATEGORY_COLORS = ['#0d9488', '#7c3aed', '#d97706', '#db2777', '#0284c7', '#4f46e5', '#ea580c', '#2563eb'];

// 이름의 앞뒤 문자를 함께 반영해 비슷한 키의 색상 중복을 줄인다.
function activityColorIndex(hash: number): number {
  return ((hash ^ (hash >>> 16)) >>> 0) % CATEGORY_COLORS.length;
}

// 실시간·기간별·개인 화면에서 같은 카테고리는 같은 색을 사용한다.
export function activityCategoryColor(key: string): string {
  return key.endsWith(':unknown') ? '#94a3b8' : CATEGORY_COLORS[activityColorIndex(Array.from(key).reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261))];
}
