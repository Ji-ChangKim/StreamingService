import type { PortalProfile } from './portal';
import { portalDateKey, portalDay } from './portal';

// 실제 제공하는 탐색·저장·등록 기능만 서비스 설명에 사용한다.
export const HOME_INTRO = '치지직·SOOP·YouTube·Twitch의 데뷔 일정과 소개를 살펴보세요. 관심 있는 버튜버를 저장하고, 첫 방송 일정을 내 캘린더에 담을 수 있어요.';
export const GUIDE_INTRO = '첫 방송을 찾고 저장하는 방법부터 나의 소개와 데뷔 공지를 준비하는 방법까지 안내합니다.';

// 문장 요약을 만들어 내지 않고 입력된 한 줄 소개 또는 원문의 앞부분만 보여준다.
export function profileExcerpt(profile: Pick<PortalProfile, 'headline' | 'description'>, limit = 140): string {
  const source = (profile.headline?.trim() || profile.description.trim()).replace(/\s+/g, ' ');
  return source.slice(0, limit) + (source.length > limit ? '…' : '');
}

// 날짜가 정해진 등록 일정만 선택한 시간대의 이번 주에 포함한다.
export function currentDebutWeek(profiles: PortalProfile[], timezone: string, now = Date.now()) {
  const today = portalDateKey(new Date(now), timezone);
  const midnight = Date.parse(`${today}T00:00:00Z`);
  const from = new Date(midnight - new Date(midnight).getUTCDay() * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.parse(`${from}T00:00:00Z`) + 6 * 86400000).toISOString().slice(0, 10);
  return { from, to, profiles: profiles.filter((profile) => { const day = portalDay(profile, timezone); return Boolean(day && day >= from && day <= to); }).sort((a, b) => portalDay(a, timezone).localeCompare(portalDay(b, timezone)) || a.startAtUtc.localeCompare(b.startAtUtc) || a.displayName.localeCompare(b.displayName)) };
}

// 안내 글은 확인된 서비스 동작과 직접 작성할 수 있는 절차로 구성한다.
export const PORTAL_GUIDES = [
  { id: 'save', title: '관심 저장과 일정 저장 활용하기', paragraphs: [
    '마음에 드는 소개 카드의 하트를 누르면 관심 목록에서 다시 찾을 수 있어요. 관심 목록은 사용한 브라우저에 저장되므로 다른 기기나 브라우저에서는 별도로 저장해 주세요.',
    '날짜와 시간이 정해진 일정은 내 캘린더에 저장할 수 있어요. 내려받은 일정 파일을 사용하는 캘린더에서 열고, 알림은 해당 캘린더의 설정에서 확인해 주세요.',
    '저장한 일정은 자동 구독이 아닙니다. 데뷔 공지가 바뀌면 개인 캘린더의 날짜와 시간도 직접 수정해 주세요.'
  ], to: '/creators', action: '버튜버 둘러보기' },
  { id: 'timezone', title: '해외 데뷔 일정의 시간 확인하기', paragraphs: [
    '달력의 일정 표시 시간대를 선택하면 확정된 일정이 해당 지역 시각으로 표시됩니다. 자정 전후의 방송은 지역에 따라 날짜가 달라질 수 있어요.',
    '시간 미정 일정은 공지된 날짜와 원래 시간대를 함께 확인해 주세요. 날짜 미정 일정은 예정 월로 안내하며 임의의 날짜나 시간을 정하지 않습니다.',
    '날짜와 시간이 확정된 소개 상세의 일정은 한국 시간(KST) 기준입니다. 방송 직전에는 연결된 데뷔 공지에서 날짜와 시간을 다시 확인해 주세요.'
  ], to: '/', action: '데뷔 캘린더로' },
  { id: 'introduction', title: '팬에게 전달할 방송 소개 작성하기', paragraphs: [
    '활동명과 방송 채널을 먼저 확인하고, 주로 할 콘텐츠와 방송 언어를 적어 보세요. 처음 찾아온 팬이 어떤 방송인지 이해할 수 있는 정보가 좋습니다.',
    '게임 이름이나 노래 장르처럼 실제 계획을 구체적으로 적고, 첫 방송에서 무엇을 소개할 예정인지 덧붙여 주세요. 아직 정해지지 않은 계획은 확정된 것처럼 쓰지 않아도 됩니다.',
    '한 줄 소개에는 가장 전하고 싶은 특징을, 소개글에는 콘텐츠와 첫 방송 계획을 담아 주세요. 프로필과 영상은 사용 권한이 있는 자료로 준비합니다.'
  ], to: '/creators/register', action: '버튜버 소개 등록' },
  { id: 'announcement', title: '데뷔 공지에 담을 정보와 변경 안내', paragraphs: [
    '데뷔 공지에는 활동명, 날짜, 시간, 기준 시간대와 방송 채널 주소를 함께 적어 주세요. 팬 제보라면 날짜와 시간을 확인할 수 있는 공식 공지 주소를 남겨 주세요.',
    '날짜나 시간이 미정이면 등록 화면에서 미정 상태를 선택하세요. 확정되지 않은 시간을 임시로 넣으면 팬이 잘못된 일정을 저장할 수 있어요.',
    '일정이 바뀌면 공식 공지를 수정하고 VDébut 문의 화면에 소개 주소, 변경 내용과 공지 출처를 남겨 주세요. 개인 캘린더에 저장한 팬도 수정할 수 있도록 변경된 날짜와 시간을 분명하게 알립니다.'
  ], to: '/upload', action: '데뷔 일정 등록' },
  { id: 'statistics', title: '방송 통계로 나의 계획 검토하기', paragraphs: [
    '조회 기간과 플랫폼을 먼저 선택하고, 관심 있는 콘텐츠의 방송 횟수와 방송 시간을 함께 살펴보세요. 같은 기간과 조건으로 비교하면 차이를 읽기 쉽습니다.',
    '방송 활동은 해당 시간에 방송한 채널을, 방송 시작은 방송이 시작된 시각을 살펴보는 항목입니다. 시간대 칸을 선택하면 연결된 방송 이력을 확인할 수 있어요.',
    '채널이 적었던 시간만 고르기보다 내가 꾸준히 방송할 수 있는 시간과 콘텐츠 준비 계획을 함께 검토해 보세요.'
  ], to: '/analytics', action: '방송 통계 살펴보기' }
] as const;

// 통계 코드의 시간대·방송 집계 정의를 이용자의 읽기 순서로 안내한다.
export const STATISTICS_GUIDE = [
  { title: '기간과 플랫폼부터 확인하세요', text: '방송 통계는 치지직·SOOP에서 수집된 기록을 조회 조건에 맞춰 보여줍니다. 날짜와 시간대는 한국 시간(KST) 기준이며, 버튜버 소개 목록과 집계 대상이 다를 수 있어요.' },
  { title: '방송 활동과 방송 시작을 비교하세요', text: '전체 통계의 방송 활동은 시간대별 평균 방송 채널 수, 개인 통계는 기록된 시점의 방송 활동 비율입니다. 방송 시작은 시작 시각이 확인된 방송의 횟수예요. 칸을 선택해 관련 이력을 살펴보세요.' },
  { title: '방송 시간과 기록 범위를 함께 읽으세요', text: '방송 시간은 이어서 확인된 활동 구간을 합산합니다. 한 방송이 여러 콘텐츠를 진행하면 카테고리별 방송 횟수를 더한 값이 전체 방송 횟수와 다를 수 있어요.' },
  { title: '기록 없음과 0은 다릅니다', text: '방송 활동의 0은 확인한 구간에 방송 중인 채널이 없었다는 뜻입니다. 방송 시작의 0은 확인된 시작 기록이 없다는 뜻이에요. 기록 없음은 비교할 기록이 없는 칸입니다. 오늘 남은 시간과 기록 누락 여부도 함께 확인해 주세요.' }
] as const;
