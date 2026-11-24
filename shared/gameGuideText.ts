// 게임 페이지 신입 가이드 문장(기획문서 42번). 화면과 첫 HTML이 같은 문장을 쓴다.
import type { GameGuide } from './analyticsBoard';

export const GUIDE_DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const part = (h: number) => (h < 6 ? '새벽' : h < 12 ? '오전' : h < 18 ? '오후' : '밤');
const twelve = (h: number) => { const x = h % 12; return x === 0 ? 12 : x; };
// "오후 2~5시", "밤 9~12시"
export function hourRange(start: number, length = 3): string {
  const end = start + length;
  return `${part(start)} ${twelve(start)}~${end === 24 ? 12 : twelve(end)}시`;
}
export const hourLabel = (h: number) => `${part(h)} ${twelve(h)}시`;
export const slotLabel = (day: number, start: number) => `${GUIDE_DAYS[day]} ${hourRange(start)}`;

// 덜 붐비는 시간이 평일 여러 날에 걸쳐 같은 시간이면 "평일 오후 2~5시"로 묶는다.
export function bestPhrase(guide: GameGuide): string | null {
  const best = guide.best[0];
  if (!best) return null;
  const same = guide.best.filter((b) => b.start === best.start);
  if (same.length >= 2 && same.every((b) => b.day < 5)) return `평일 ${hourRange(best.start)}`;
  if (same.length >= 2 && same.every((b) => b.day >= 5)) return `주말 ${hourRange(best.start)}`;
  return slotLabel(best.day, best.start);
}

export function gameLede(guide: GameGuide): string | null {
  const best = bestPhrase(guide);
  if (!best) return null;
  if (!guide.busiest) return `방송 1개당 시청자가 가장 많은 때는 ${best}예요.`;
  const busy = `${GUIDE_DAYS[guide.busiest.day]}요일 ${hourLabel(guide.busiest.hour)}`;
  return `시청자가 가장 많이 몰리는 때는 ${busy}지만 방송도 그만큼 많아요. 방송 1개당 시청자가 가장 많은 때는 ${best}예요.`;
}
export const gameHeading = (guide: GameGuide) => { const best = bestPhrase(guide); return best ? `신입이라면 ${best}를 노려 보세요` : '언제 켜면 좋을까요'; };
