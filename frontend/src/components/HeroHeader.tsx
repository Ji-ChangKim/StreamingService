import { DebutEvent } from '../types';
import { getEventDateKey } from '../utils/calendarUtils';
import { Language, UI_TRANSLATIONS } from '../utils/i18n';

interface HeroHeaderProps {
  allEvents: DebutEvent[];
  selectedTimezone: string;
  currentLang: Language;
}

export function HeroHeader({
  allEvents = [],
  selectedTimezone,
  currentLang,
}: HeroHeaderProps) {
  const t = UI_TRANSLATIONS[currentLang];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1 ~ 12

  // 현재 주차 계산 (매월 1일 기준)
  const firstDayOfMonth = new Date(currentYear, now.getMonth(), 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
  const currentWeekNum = Math.ceil((now.getDate() + startingDayOfWeek) / 7);

  // 이번 달 데뷔 이벤트 필터링 (현재 시각 기준)
  const monthEvents = allEvents.filter((evt) => {
    try {
      const dateKey = getEventDateKey(evt.startAtUtc, selectedTimezone); // YYYY-MM-DD
      const [y, m] = dateKey.split('-').map(Number);
      return y === currentYear && m === currentMonthNum;
    } catch {
      return false;
    }
  });

  // 이번 주차 데뷔 이벤트 필터링 (현재 주 일요일 ~ 토요일)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weekEvents = allEvents.filter((evt) => {
    try {
      const evtDate = new Date(evt.startAtUtc);
      return evtDate >= startOfWeek && evtDate <= endOfWeek;
    } catch {
      return false;
    }
  });

  // 플랫폼별 금월 데뷔 인원 수 구하기
  const getPlatformCount = (platformName: string) => {
    return monthEvents.filter((evt) => {
      const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
      return primaryLink?.platform === platformName;
    }).length;
  };

  const chzzkCount = getPlatformCount('CHZZK');
  const soopCount = getPlatformCount('SOOP');
  const youtubeCount = getPlatformCount('YOUTUBE');
  const twitchCount = getPlatformCount('TWITCH');

  // 다국어 통계 레이블 파싱
  const getMonthLabel = (m: number) => {
    if (currentLang === 'ja') return `${m}月デビュー`;
    if (currentLang === 'en') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[m - 1] || m} Debuts`;
    }
    return `${m}월 데뷔`;
  };

  const getWeekLabel = (m: number, w: number) => {
    if (currentLang === 'ja') return `${m}月第${w}週デビュー`;
    if (currentLang === 'en') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `Week ${w} (${monthNames[m - 1] || m})`;
    }
    return `${m}월 ${w}주차 데뷔`;
  };

  const unitCreators = t.unitCreators !== undefined ? t.unitCreators : (currentLang === 'en' ? '' : '명');

  // 가변형 카드 목록 (0명이면 숨김, 1명 이상 시 노출)
  const dynamicCards = [
    { label: t.chzzkMonth || '금월 치지직 데뷔', count: chzzkCount, color: 'text-[#10B981]' },
    { label: t.soopMonth || '금월 SOOP 데뷔', count: soopCount, color: 'text-[#2563EB]' },
    { label: t.youtubeMonth || '금월 유튜브 데뷔', count: youtubeCount, color: 'text-[#EF4444]' },
    { label: t.twitchMonth || '금월 트위치 데뷔', count: twitchCount, color: 'text-[#9333EA]' },
  ].filter((card) => card.count > 0);

  return (
    <div className="py-6 sm:py-8 flex flex-col items-center justify-center text-center space-y-6 max-w-4xl mx-auto">
      {/* 1. 히어로 타이틀 & 설명글 (다국어 바인딩 적용) */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight font-['Outfit']">
          {t.heroTitle || '신입 버튜버 데뷔 일정 통합 캘린더'}
        </h1>
        <h3 className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed max-w-2xl mx-auto">
          {t.heroSubtitle || '전 세계 VTuber의 데뷔 일정을 내 시간대에 맞춰 한눈에 확인하세요.'}
        </h3>
      </div>

      {/* 2. 각각 독립된 둥근 별도 카드 박스 형태 - 텍스트 유연 확장 지원 */}
      <div className="flex flex-nowrap items-center justify-center gap-2.5 sm:gap-3.5 w-full max-w-6xl mx-auto overflow-x-auto pb-1 no-scrollbar px-2">
        {/* 상시 노출 1: {N}월 데뷔 */}
        <div className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-xs px-4 sm:px-5 py-2.5 sm:py-3 text-center shrink-0 min-w-[110px] w-auto hover:border-[#2563EB] hover:shadow-sm transition-all">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#64748B] block mb-1 whitespace-nowrap">{getMonthLabel(currentMonthNum)}</span>
          <div className="text-lg sm:text-xl font-extrabold text-[#2563EB] font-mono flex items-baseline justify-center gap-0.5">
            <span>{monthEvents.length}</span>
            {unitCreators && <span className="text-xs font-normal text-[#94A3B8]">{unitCreators}</span>}
          </div>
        </div>

        {/* 상시 노출 2: {A}월 {B}주차 데뷔 */}
        <div className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-xs px-4 sm:px-5 py-2.5 sm:py-3 text-center shrink-0 min-w-[110px] w-auto hover:border-[#0F172A] hover:shadow-sm transition-all">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#64748B] block mb-1 whitespace-nowrap">{getWeekLabel(currentMonthNum, currentWeekNum)}</span>
          <div className="text-lg sm:text-xl font-extrabold text-[#0F172A] font-mono flex items-baseline justify-center gap-0.5">
            <span>{weekEvents.length}</span>
            {unitCreators && <span className="text-xs font-normal text-[#94A3B8]">{unitCreators}</span>}
          </div>
        </div>

        {/* 가변 노출: 0명이 아닐 때만 등장하는 개별 둥근 카드 */}
        {dynamicCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-xs px-4 sm:px-5 py-2.5 sm:py-3 text-center shrink-0 min-w-[110px] w-auto hover:border-[#2563EB] hover:shadow-sm transition-all animate-fadeIn"
          >
            <span className="text-[10px] sm:text-[11px] font-bold text-[#64748B] block mb-1 whitespace-nowrap">{card.label}</span>
            <div className={`text-lg sm:text-xl font-extrabold font-mono flex items-baseline justify-center gap-0.5 ${card.color}`}>
              <span>{card.count}</span>
              {unitCreators && <span className="text-xs font-normal text-[#94A3B8]">{unitCreators}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


