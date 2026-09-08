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
 * 데뷔 날짜/시간을 숲 레퍼런스 형식으로 포맷팅: "09/11(금) 오후 7시" (단일 기능 함수 - SRP)
 */
function formatSoopDateStyle(dateIso: string, timezone: string = 'Asia/Seoul'): string {
  try {
    const d = new Date(dateIso);
    const month = new Intl.DateTimeFormat('ko-KR', { timeZone: timezone, month: '2-digit' }).format(d);
    const day = new Intl.DateTimeFormat('ko-KR', { timeZone: timezone, day: '2-digit' }).format(d);
    const weekday = new Intl.DateTimeFormat('ko-KR', { timeZone: timezone, weekday: 'short' }).format(d);
    const time = new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return `${month}/${day}(${weekday}) ${time}`;
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

  // 이전/다음 슬라이드
  const handlePrev = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  // 좌-중-우 3장의 카드 인덱스 계산
  const prevIndex = items.length > 0 ? (activeIndex - 1 + items.length) % items.length : -1;
  const nextIndex = items.length > 0 ? (activeIndex + 1) % items.length : -1;

  const currentItem = items[activeIndex];
  const prevItem = items.length > 1 ? items[prevIndex] : null;
  const nextItem = items.length > 2 ? items[nextIndex] : null;

  return (
    <section
      aria-label="Platform Debut Showcase"
      className="w-full mb-6 bg-white/70 backdrop-blur-sm rounded-[24px] border border-[#CBD5E1] p-4 sm:p-6 shadow-xs relative select-none"
    >
      {/* 1. 상단 플랫폼 탭 바 (완전한 중앙 정렬, 지저분한 밑줄 제거) */}
      <div className="flex items-center justify-center relative mb-5">
        <div className="inline-flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
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
                    ? 'bg-[#0F172A] text-white shadow-xs scale-102'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A] border border-[#CBD5E1]'
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
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#CBD5E1] text-[#334155]'
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

        {/* 우측 상단 카운터 인디케이터 (중앙정렬 방해하지 않도록 absolute 배치) */}
        {items.length > 0 && (
          <div className="hidden sm:flex absolute right-2 text-xs font-mono font-bold text-[#64748B] items-center gap-2">
            <span>{activeIndex + 1} / {items.length}</span>
          </div>
        )}
      </div>

      {/* 2. 숲 웰컴 버추얼 3단 중앙 포커스 캐러셀 (라이트 배경 위 고품격 무대) */}
      <div className="py-2">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[#64748B] bg-[#F8FAFC] rounded-2xl border border-dashed border-[#CBD5E1]">
            현재 등록된 {selectedPlatform} 데뷔 일정이 없습니다.
          </div>
        ) : (
          <div className="relative flex items-center justify-center min-h-[260px] sm:min-h-[290px]">
            
            {/* 이전 버튼 (<) */}
            {items.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-6 z-30 p-2.5 rounded-full bg-white hover:bg-[#0F172A] hover:text-white text-[#0F172A] border border-[#CBD5E1] shadow-md transition-all cursor-pointer"
                aria-label="이전 버튜버"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* 카드 덱: 좌측 카드 / 중앙 메인 카드 / 우측 카드 */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 w-full max-w-4xl px-2">
              
              {/* [좌측 카드] (있을 때만 노출, 중앙 카드와 동일 톤 & 60% 투명도) */}
              {prevItem && (
                <div
                  onClick={handlePrev}
                  className="hidden md:flex flex-col items-center justify-between w-[240px] h-[255px] bg-[#131B2B] rounded-[22px] border border-slate-800 p-4.5 opacity-60 scale-90 cursor-pointer hover:opacity-85 transition-all select-none shadow-md"
                >
                  <SoopCardContent item={prevItem} timezone={selectedTimezone} isCenter={false} />
                </div>
              )}

              {/* [중앙 메인 카드] (숲 캡처의 1:1 레이아웃 구현) */}
              {currentItem && (
                <div
                  className="flex flex-col items-center justify-between w-[280px] sm:w-[320px] h-[270px] sm:h-[295px] bg-[#0F172A] rounded-[24px] border-2 border-blue-400/60 p-5 shadow-xl transition-all relative group"
                  style={{
                    boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.3), 0 0 20px -3px rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <SoopCardContent
                    item={currentItem}
                    timezone={selectedTimezone}
                    isCenter={true}
                    onNavigate={onNavigate}
                  />
                </div>
              )}

              {/* [우측 카드] (있을 때만 노출, 중앙 카드와 동일 톤 & 60% 투명도) */}
              {nextItem && (
                <div
                  onClick={handleNext}
                  className="hidden md:flex flex-col items-center justify-between w-[240px] h-[255px] bg-[#131B2B] rounded-[22px] border border-slate-800 p-4.5 opacity-60 scale-90 cursor-pointer hover:opacity-85 transition-all select-none shadow-md"
                >
                  <SoopCardContent item={nextItem} timezone={selectedTimezone} isCenter={false} />
                </div>
              )}
            </div>

            {/* 다음 버튼 (>) */}
            {items.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-6 z-30 p-2.5 rounded-full bg-white hover:bg-[#0F172A] hover:text-white text-[#0F172A] border border-[#CBD5E1] shadow-md transition-all cursor-pointer"
                aria-label="다음 버튜버"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * 숲 레퍼런스 100% 싱크로율 세로형 카드 콘텐츠 (단일 책임 컴포넌트)
 * 레이아웃: [상단 대형 아바타 (LIVE 뱃지 좌측 상단)] ➔ [중앙 이름 (개인세 제거)] ➔ [하단 캡슐 일정 바]
 */
function SoopCardContent({
  item,
  timezone,
  isCenter,
  onNavigate,
}: {
  item: SpotlightItem;
  timezone: string;
  isCenter: boolean;
  onNavigate?: (path: string) => void;
}) {
  const { event, statusType, channelUrl } = item;
  const isLive = statusType === 'LIVE';
  const countryBadge = getCountryBadge(event.creator.countryCode);
  const formattedDate = formatSoopDateStyle(event.startAtUtc, timezone);
  const slug = (event.creator as any)?.slug || '';

  // 소속사가 실제 기업세일 경우에만 노출 ('개인세'는 운영자 전용이므로 사용자 화면에서 완전 제거!)
  const agency = event.creator.agency?.trim();
  const hasRealAgency = agency && agency !== '개인세' && agency !== 'None';

  return (
    <>
      {/* 1. 상단 큼직한 캐릭터 아바타 비주얼 */}
      <div className="relative pt-1">
        
        {/* 🔴 사용자 지정 레퍼런스 LIVE 뱃지 (아바타 좌측 상단) */}
        {isLive && (
          <span className="absolute -top-1 -left-2 z-20 bg-[#E11D48] text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-[6px] shadow-md tracking-wider flex items-center justify-center animate-pulse select-none">
            LIVE
          </span>
        )}

        <div
          onClick={() => isCenter && slug && onNavigate && onNavigate(`/creator/${slug}`)}
          className={`relative rounded-full overflow-hidden border-2 transition-transform ${
            isLive
              ? 'border-red-500 ring-2 ring-red-400/40'
              : isCenter
              ? 'border-white/80 shadow-md cursor-pointer group-hover:scale-105'
              : 'border-slate-600'
          } ${
            isCenter ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20'
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
          className="absolute bottom-0 right-1 text-[12px] leading-none bg-white rounded-full p-0.5 border border-slate-200 shadow-sm"
          title={`국가: ${countryBadge.label}`}
        >
          {countryBadge.flag}
        </span>
      </div>

      {/* 2. 중앙 버튜버 이름 (가운데 정렬, 굵직한 타이포 - "개인세" 완전 제거) */}
      <div className="w-full text-center px-1">
        <h3
          onClick={() => isCenter && slug && onNavigate && onNavigate(`/creator/${slug}`)}
          className={`font-black text-white truncate cursor-pointer hover:underline ${
            isCenter ? 'text-base sm:text-lg' : 'text-sm'
          }`}
          title={event.creator.displayName}
        >
          {event.creator.displayName}
        </h3>

        {/* 실제 기업세 소속사가 있을 때만 표시 (개인세는 완전히 미노출) */}
        {isCenter && hasRealAgency && (
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            {agency}
          </p>
        )}
      </div>

      {/* 3. 하단 숲 100% 싱크로율 캡슐 일정 바 */}
      <div className="w-full flex items-center justify-center px-1">
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none max-w-full overflow-hidden ${
            isLive
              ? 'bg-red-950/80 border-red-500/60 text-red-200 hover:bg-red-900'
              : 'bg-[#1E293B] border-slate-700 hover:border-slate-500 text-slate-200'
          }`}
          title={isLive ? '생방송 바로가기' : '방송국 채널 바로가기'}
        >
          {/* 상태 알약 뱃지 (줄바꿈 원천 차단) */}
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
              isLive
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isLive ? 'LIVE' : '방송 예정'}
          </span>

          {/* 일시 텍스트 (줄바꿈 원천 차단) */}
          <span className="text-[11px] sm:text-xs font-bold text-slate-200 whitespace-nowrap truncate">
            {isLive ? '생방송 진행 중' : formattedDate}
          </span>

          <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
        </a>
      </div>
    </>
  );
}
