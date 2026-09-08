import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { DebutEvent } from '../../types';
import {
  PlatformKey,
  getPlatformSpotlightSummary,
  SpotlightItem
} from '../../utils/spotlightQueue';
import { getCountryBadge } from '../../utils/countryDetector';
import { AvatarImage } from '../calendar/AvatarImage';

interface PlatformMiniSpotlightProps {
  allEvents: DebutEvent[];
  selectedTimezone: string;
  onDownloadICS: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
}

interface PlatformTabConfig {
  id: PlatformKey;
  label: string;
  officialLogo: string;
}

const PLATFORMS: PlatformTabConfig[] = [
  {
    id: 'SOOP',
    label: 'SOOP',
    officialLogo: '/icons/soop/soop_symbol_blue.svg',
  },
  {
    id: 'CHZZK',
    label: '치지직',
    officialLogo: '/icons/chzzk_icon.png',
  },
  {
    id: 'YOUTUBE',
    label: '유튜브',
    officialLogo: '/icons/youtube_icon.png',
  },
  {
    id: 'TWITCH',
    label: '트위치',
    officialLogo: '/icons/twitch_icon.svg',
  },
];

/**
 * 데뷔 날짜/시간을 사용자 요청 포맷으로 정밀 포맷팅 (단일 기능 함수 - SRP)
 * 포맷: "MM월 DD일 (요일) 오후 00:00" (예: "09월 09일 (수) 오후 12:00")
 */
function formatDebutDateStyle(dateIso: string, timezone: string = 'Asia/Seoul'): string {
  try {
    const d = new Date(dateIso);
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone,
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(d);

    let month = '';
    let day = '';
    let weekday = '';
    let dayPeriod = '';
    let hour = '';
    let minute = '';

    parts.forEach((p) => {
      if (p.type === 'month') month = p.value.padStart(2, '0');
      if (p.type === 'day') day = p.value.padStart(2, '0');
      if (p.type === 'weekday') weekday = p.value;
      if (p.type === 'dayPeriod') dayPeriod = p.value; // '오전' or '오후'
      if (p.type === 'hour') hour = p.value.padStart(2, '0');
      if (p.type === 'minute') minute = p.value.padStart(2, '0');
    });

    return `${month}월 ${day}일 (${weekday}) ${dayPeriod} ${hour}:${minute}`;
  } catch {
    return dateIso.slice(5, 16);
  }
}

export function PlatformMiniSpotlight({
  allEvents,
  selectedTimezone,
  onNavigate,
}: PlatformMiniSpotlightProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('SOOP');
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // 플랫폼별 요약 데이터 계산
  const summaries = useMemo(() => {
    const map = new Map<PlatformKey, ReturnType<typeof getPlatformSpotlightSummary>>();
    PLATFORMS.forEach((p) => {
      map.set(p.id, getPlatformSpotlightSummary(allEvents, p.id, selectedTimezone, 10));
    });
    return map;
  }, [allEvents, selectedTimezone]);

  const currentSummary = summaries.get(selectedPlatform) || {
    items: [],
    liveCount: 0,
    totalCount: 0,
    nextDateLabel: '일정 준비 중',
  };

  const items = currentSummary.items;

  // 탭 변경 시 인덱스 리셋
  const handleTabChange = (platform: PlatformKey) => {
    setSelectedPlatform(platform);
    setActiveIndex(0);
  };

  // 슬라이드 이동 함수들 (SRP)
  const handlePrev = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const handleFarPrev = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev - 2 + items.length) % items.length);
  };

  const handleFarNext = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev + 2) % items.length);
  };

  // 5단 피라미드 덱 인덱스 계산: [1(소) - 2(중) - 3(대) - 4(중) - 5(소)]
  const currentItem = items.length > 0 ? items[activeIndex] : null;
  const prevItem = items.length > 1 ? items[(activeIndex - 1 + items.length) % items.length] : null;
  const nextItem = items.length > 2 ? items[(activeIndex + 1) % items.length] : null;
  const farLeftItem = items.length > 3 ? items[(activeIndex - 2 + items.length) % items.length] : null;
  const farRightItem = items.length > 4 ? items[(activeIndex + 2) % items.length] : null;

  return (
    <section
      aria-label="Platform Debut Showcase"
      className="w-full relative select-none pt-2 pb-6 sm:pb-8"
    >
      {/* 1. 상단 플랫폼 탭 바 (글래스모피즘 & 완전한 중앙 정렬) */}
      <div className="flex items-center justify-center relative mb-6">
        <div className="inline-flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-xs">
          {PLATFORMS.map((p) => {
            const isSelected = selectedPlatform === p.id;
            const pSummary = summaries.get(p.id);
            const hasLive = (pSummary?.liveCount || 0) > 0;
            const count = pSummary?.totalCount || 0;

            return (
              <button
                key={p.id}
                onClick={() => handleTabChange(p.id)}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#0F172A] text-white shadow-md scale-102 ring-2 ring-blue-500/20'
                    : 'bg-white/80 text-[#475569] hover:bg-white hover:text-[#0F172A] border border-white/80 shadow-2xs'
                }`}
              >
                <img
                  src={p.officialLogo}
                  alt={p.label}
                  className="w-4 h-4 object-contain shrink-0"
                />
                <span>{p.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#334155]'
                  }`}
                >
                  {count}
                </span>

                {hasLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 5단 피라미드 커버플로우 덱 [1(소) - 2(중) - 3(대) - 4(중) - 5(소)] */}
      <div className="py-2">
        {items.length === 0 ? (
          <div className="py-14 text-center text-xs font-bold text-[#64748B] bg-white/75 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 max-w-md mx-auto shadow-xs">
            현재 등록된 {selectedPlatform} 데뷔 일정이 없습니다.
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full max-w-7xl mx-auto min-h-[300px] sm:min-h-[330px]">
            
            {/* 5단 피라미드 카드 덱 컨테이너 (커버플로우 중첩 계층 구조) */}
            <div className="flex items-center justify-center w-full overflow-visible px-1">
              
              {/* [1번 카드: 가장 작은 크기 - 맨 뒤 좌측] */}
              {farLeftItem && (
                <div
                  onClick={handleFarPrev}
                  className="hidden xl:flex flex-col items-center justify-between w-[185px] lg:w-[200px] h-[220px] bg-[#0F172A]/90 backdrop-blur-md rounded-[20px] border border-slate-700/70 p-3 opacity-55 scale-85 cursor-pointer hover:opacity-85 hover:z-25 transition-all select-none shadow-md shrink-0 z-10 -mr-6 lg:-mr-8"
                >
                  <SpotlightCardContent
                    item={farLeftItem}
                    timezone={selectedTimezone}
                    tier="small"
                  />
                </div>
              )}

              {/* [2번 카드: 중간 크기 - 중앙 카드 바로 뒤 좌측] */}
              {prevItem && (
                <div
                  onClick={handlePrev}
                  className="hidden md:flex flex-col items-center justify-between w-[220px] lg:w-[240px] h-[255px] bg-[#0F172A]/95 backdrop-blur-md rounded-[22px] border border-slate-700 p-4 opacity-80 scale-92 cursor-pointer hover:opacity-100 hover:z-25 transition-all select-none shadow-xl shrink-0 z-20 -mr-7 lg:-mr-10"
                >
                  <SpotlightCardContent
                    item={prevItem}
                    timezone={selectedTimezone}
                    tier="medium"
                  />
                </div>
              )}

              {/* [3번 카드: 가장 크게 중앙 - 메인 주인공 & 최상위 z-30] */}
              {currentItem && (
                <div className="relative shrink-0 z-30">
                  
                  {/* 🔴 좌측 이전 화살표 (<) : 최상단 z-40 */}
                  {items.length > 1 && (
                    <button
                      onClick={handlePrev}
                      className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#0F172A] hover:text-white text-[#0F172A] border border-slate-200 shadow-xl transition-all cursor-pointer hover:scale-108"
                      title="이전 버튜버"
                      aria-label="이전 버튜버"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {/* 중앙 메인 카드 본체 (bg_profile.png 3D 무대 배경 적용) */}
                  <div
                    className="flex flex-col items-center justify-between w-[300px] sm:w-[340px] h-[290px] sm:h-[315px] bg-[url('/images/bg_profile.png')] bg-cover bg-center rounded-[24px] border-2 border-blue-400/90 p-5 transition-all relative group scale-100 overflow-hidden"
                    style={{
                      boxShadow: '0 16px 40px -6px rgba(15, 23, 42, 0.45), 0 0 35px -2px rgba(59, 130, 246, 0.35)',
                    }}
                  >
                    <SpotlightCardContent
                      item={currentItem}
                      timezone={selectedTimezone}
                      tier="large"
                      onNavigate={onNavigate}
                    />
                  </div>

                  {/* 🔴 우측 다음 화살표 (>) : 최상단 z-40 */}
                  {items.length > 1 && (
                    <button
                      onClick={handleNext}
                      className="absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#0F172A] hover:text-white text-[#0F172A] border border-slate-200 shadow-xl transition-all cursor-pointer hover:scale-108"
                      title="다음 버튜버"
                      aria-label="다음 버튜버"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* [4번 카드: 중간 크기 - 중앙 카드 바로 뒤 우측] */}
              {nextItem && (
                <div
                  onClick={handleNext}
                  className="hidden md:flex flex-col items-center justify-between w-[220px] lg:w-[240px] h-[255px] bg-[#0F172A]/95 backdrop-blur-md rounded-[22px] border border-slate-700 p-4 opacity-80 scale-92 cursor-pointer hover:opacity-100 hover:z-25 transition-all select-none shadow-xl shrink-0 z-20 -ml-7 lg:-ml-10"
                >
                  <SpotlightCardContent
                    item={nextItem}
                    timezone={selectedTimezone}
                    tier="medium"
                  />
                </div>
              )}

              {/* [5번 카드: 가장 작은 크기 - 맨 뒤 우측] */}
              {farRightItem && (
                <div
                  onClick={handleFarNext}
                  className="hidden xl:flex flex-col items-center justify-between w-[185px] lg:w-[200px] h-[220px] bg-[#0F172A]/90 backdrop-blur-md rounded-[20px] border border-slate-700/70 p-3 opacity-55 scale-85 cursor-pointer hover:opacity-85 hover:z-25 transition-all select-none shadow-md shrink-0 z-10 -ml-6 lg:-ml-8"
                >
                  <SpotlightCardContent
                    item={farRightItem}
                    timezone={selectedTimezone}
                    tier="small"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * 5단 피라미드 단계별 카드 콘텐츠 렌더러 (단일 책임 컴포넌트 - SRP)
 * tier: 'small' (1번, 5번) | 'medium' (2번, 4번) | 'large' (3번 중앙)
 */
function SpotlightCardContent({
  item,
  timezone,
  tier,
  onNavigate,
}: {
  item: SpotlightItem;
  timezone: string;
  tier: 'small' | 'medium' | 'large';
  onNavigate?: (path: string) => void;
}) {
  const { event, statusType, channelUrl } = item;
  const isLive = statusType === 'LIVE';
  const countryBadge = getCountryBadge(event.creator.countryCode);
  const formattedDate = formatDebutDateStyle(event.startAtUtc, timezone);
  const slug = (event.creator as any)?.slug || '';

  // 소속사가 실제 기업세일 경우에만 노출 ('개인세'는 운영자 전용이므로 사용자 화면에서 완전 제거)
  const agency = event.creator.agency?.trim();
  const hasRealAgency = agency && agency !== '개인세' && agency !== 'None';

  const isCenter = tier === 'large';
  const isSmall = tier === 'small';

  return (
    <>
      {/* 1. 상단 아바타 비주얼 */}
      <div className="relative pt-0.5">
        
        {/* 🔴 LIVE 뱃지 (아바타 좌측 상단) */}
        {isLive && (
          <span
            className={`absolute -top-1 -left-2 z-20 bg-[#E11D48] text-white font-black rounded-[6px] shadow-md tracking-wider flex items-center justify-center animate-pulse select-none ${
              isCenter
                ? 'text-[10px] sm:text-[11px] px-2 py-0.5'
                : isSmall
                ? 'text-[8px] px-1 py-0.2 -left-1'
                : 'text-[9px] px-1.5 py-0.2'
            }`}
          >
            LIVE
          </span>
        )}

        <div
          onClick={() => isCenter && slug && onNavigate && onNavigate(`/creator/${slug}`)}
          className={`relative rounded-full overflow-hidden border-2 transition-transform ${
            isLive
              ? 'border-red-500 ring-2 ring-red-400/40'
              : isCenter
              ? 'border-4 border-white shadow-xl ring-4 ring-blue-400/40 cursor-pointer group-hover:scale-105'
              : 'border-slate-600'
          } ${
            isCenter
              ? 'w-24 h-24 sm:w-28 sm:h-28'
              : isSmall
              ? 'w-14 h-14'
              : 'w-18 h-18'
          }`}
        >
          <AvatarImage
            src={event.creator.avatarUrl || ''}
            alt={event.creator.displayName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 국기 뱃지 */}
        <span
          className={`absolute bottom-0 right-1 leading-none bg-white rounded-full border border-slate-200 shadow-sm ${
            isSmall ? 'text-[10px] p-0.2' : 'text-[12px] p-0.5'
          }`}
          title={`국가: ${countryBadge.label}`}
        >
          {countryBadge.flag}
        </span>
      </div>

      {/* 2. 중앙 버튜버 이름 (가운데 정렬, "개인세" 완전 제거) */}
      <div className="w-full text-center px-1">
        <h3
          onClick={() => isCenter && slug && onNavigate && onNavigate(`/creator/${slug}`)}
          className={`font-black truncate ${
            isCenter
              ? 'text-base sm:text-lg text-[#0F172A] drop-shadow-xs cursor-pointer hover:underline'
              : isSmall
              ? 'text-xs text-white'
              : 'text-sm text-white'
          }`}
          title={event.creator.displayName}
        >
          {event.creator.displayName}
        </h3>

        {/* 실제 기업세 소속사가 있을 때만 표시 (중앙 카드에 한함) */}
        {isCenter && hasRealAgency && (
          <p className="text-[11px] text-slate-700 font-bold truncate mt-0.5">
            {agency}
          </p>
        )}
      </div>

      {/* 3. 하단 캡슐 일정 바 (상태: "데뷔일" 로 명확히 표시) */}
      <div className="w-full flex items-center justify-center px-0.5">
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center rounded-full border transition-all cursor-pointer select-none max-w-full overflow-hidden ${
            isCenter
              ? 'gap-1.5 px-2.5 sm:px-3 py-1.5'
              : isSmall
              ? 'gap-1 px-1.5 py-0.5'
              : 'gap-1.2 px-2 py-1'
          } ${
            isLive
              ? 'bg-red-950/80 border-red-500/60 text-red-200 hover:bg-red-900'
              : isCenter
              ? 'bg-[#0F172A] border-slate-700/80 hover:bg-[#1E293B] text-white shadow-md'
              : 'bg-[#1E293B] border-slate-700 hover:border-slate-500 text-slate-200'
          }`}
          title={isLive ? '생방송 바로가기' : '방송국 채널 바로가기'}
        >
          {/* 상태 알약 뱃지: "데뷔일" (라이브 시 LIVE) */}
          <span
            className={`font-black rounded-full whitespace-nowrap shrink-0 ${
              isCenter
                ? 'text-[10px] px-2 py-0.5'
                : isSmall
                ? 'text-[8px] px-1 py-0.2'
                : 'text-[9px] px-1.5 py-0.2'
            } ${
              isLive
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isLive ? 'LIVE' : '데뷔일'}
          </span>

          {/* 일시 텍스트: "MM월 DD일 (요일) 오후 00:00" */}
          <span
            className={`font-bold whitespace-nowrap truncate ${
              isCenter
                ? 'text-[11px] sm:text-xs text-white'
                : isSmall
                ? 'text-[9px] text-slate-200'
                : 'text-[10px] text-slate-200'
            }`}
          >
            {isLive ? '생방송 진행 중' : formattedDate}
          </span>

          <ExternalLink
            className={`text-slate-300 shrink-0 ${
              isSmall ? 'w-2.5 h-2.5 ml-0.2' : 'w-3 h-3 ml-0.5'
            }`}
          />
        </a>
      </div>
    </>
  );
}

