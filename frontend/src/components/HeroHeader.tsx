import { DebutEvent } from '../types';
import { getEventDateKey } from '../utils/calendarUtils';

interface HeroHeaderProps {
  allEvents: DebutEvent[];
  selectedTimezone: string;
}

export function HeroHeader({
  allEvents = [],
  selectedTimezone,
}: HeroHeaderProps) {
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

  // 가변형 카드 목록 (0명이면 숨김, 1명 이상 시 노출)
  const dynamicCards = [
    { label: '금월 치지직 데뷔', count: chzzkCount, color: 'text-[#10B981]' },
    { label: '금월 SOOP 데뷔', count: soopCount, color: 'text-[#2563EB]' },
    { label: '금월 유튜브 데뷔', count: youtubeCount, color: 'text-[#EF4444]' },
    { label: '금월 트위치 데뷔', count: twitchCount, color: 'text-[#9333EA]' },
  ].filter((card) => card.count > 0);

  return (
    <div className="py-6 sm:py-8 flex flex-col items-center justify-center text-center space-y-6 max-w-4xl mx-auto">
      {/* 1. 히어로 타이틀 & 설명글 (가운데 정렬) */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight font-['Outfit']">
          이번 달, 새롭게 시작하는 <span className="text-[#2563EB]">목소리들을 만나보세요.</span>
        </h1>
        <h3 className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed max-w-2xl mx-auto">
          전 세계 다양한 VTuber의 데뷔 일정을 내 시간대에 맞춰 한눈에 확인합니다.
        </h3>
      </div>

      {/* 2. 각각 독립된 둥근 별도 카드 박스 형태 (Separate Rounded Cards) */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-3xl mx-auto">
        {/* 상시 노출 1: {N}월 데뷔 */}
        <div className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-xs px-5 py-3 text-center min-w-[130px] hover:border-[#2563EB] hover:shadow-sm transition-all">
          <span className="text-[11px] font-bold text-[#64748B] block mb-0.5">{currentMonthNum}월 데뷔</span>
          <span className="text-xl font-extrabold text-[#2563EB] font-mono">
            {monthEvents.length}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">명</span>
          </span>
        </div>

        {/* 상시 노출 2: {A}월 {B}주차 데뷔 */}
        <div className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-xs px-5 py-3 text-center min-w-[130px] hover:border-[#0F172A] hover:shadow-sm transition-all">
          <span className="text-[11px] font-bold text-[#64748B] block mb-0.5">{currentMonthNum}월 {currentWeekNum}주차 데뷔</span>
          <span className="text-xl font-extrabold text-[#0F172A] font-mono">
            {weekEvents.length}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">명</span>
          </span>
        </div>

        {/* 가변 노출: 0명이 아닐 때만 등장하는 개별 둥근 카드 */}
        {dynamicCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-xs px-5 py-3 text-center min-w-[130px] hover:border-[#2563EB] hover:shadow-sm transition-all animate-fadeIn"
          >
            <span className="text-[11px] font-bold text-[#64748B] block mb-0.5">{card.label}</span>
            <span className={`text-xl font-extrabold font-mono ${card.color}`}>
              {card.count}<span className="text-xs font-normal text-[#94A3B8] ml-0.5">명</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
