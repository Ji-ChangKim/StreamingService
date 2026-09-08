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
      // 숲 스타일 캐러셀을 위해 최대 10명까지 확보
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
      aria-label="SOOP Style Virtual Showcase"
      className="w-full mb-6 bg-[#0B0F19] text-white rounded-[20px] p-4 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden select-none"
    >
      {/* 1. 배경 은은한 네온 그리드 & 앰비언트 글로우 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* 2. 상단 플랫폼 탭 바 */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto justify-center sm:justify-start">
          {PLATFORMS.map((p) => {
            const isSelected = selectedPlatform === p.id;
            const pSummary = summaries.get(p.id);
            const hasLive = (pSummary?.liveCount || 0) > 0;
            const count = pSummary?.totalCount || 0;

            return (
              <button
                key={p.id}
                onClick={() => handleTabChange(p.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-md scale-102'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
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
                    isSelected ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-400'
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

        {/* 인디케이터 (현재 / 전체) */}
        {items.length > 0 && (
          <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
            <span>{activeIndex + 1} / {items.length}</span>
          </div>
        )}
      </div>

      {/* 3. 숲 웰컴 버추얼 3단 중앙 포커스 캐러셀 */}
      <div className="relative z-10 py-2">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            현재 등록된 {selectedPlatform} 데뷔 일정이 없습니다.
          </div>
        ) : (
          <div className="relative flex items-center justify-center min-h-[260px] sm:min-h-[290px]">
            
            {/* 이전 버튼 (<) */}
            {items.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-6 z-30 p-2.5 rounded-full bg-slate-900/80 hover:bg-white hover:text-slate-900 text-slate-300 border border-slate-700 shadow-lg transition-all cursor-pointer backdrop-blur-md"
                aria-label="이전 버튜버"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* 카드 덱: 좌측 카드 / 중앙 메인 카드 / 우측 카드 */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 w-full max-w-4xl px-2">
              
              {/* [좌측 카드] (있을 때만 노출, 약간 축소 & 딤드) */}
              {prevItem && (
                <div
                  onClick={handlePrev}
                  className="hidden md:flex flex-col items-center justify-between w-[220px] h-[245px] bg-[#161F30]/70 rounded-[20px] border border-slate-800/80 p-4 opacity-50 scale-90 cursor-pointer hover:opacity-75 transition-all select-none"
                >
                  <SoopCardContent item={prevItem} timezone={selectedTimezone} isCenter={false} />
                </div>
              )}

              {/* [중앙 메인 카드] (숲 캡처의 1:1 레이아웃 구현) */}
              {currentItem && (
                <div
                  className="flex flex-col items-center justify-between w-[280px] sm:w-[320px] h-[270px] sm:h-[295px] bg-[#131B2B] rounded-[24px] border-2 border-blue-400/50 p-5 shadow-2xl transition-all relative group"
                  style={{
                    boxShadow: '0 0 30px -5px rgba(59, 130, 246, 0.25), 0 20px 25px -5px rgba(0, 0, 0, 0.5)',
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

              {/* [우측 카드] (있을 때만 노출, 약간 축소 & 딤드) */}
              {nextItem && (
                <div
                  onClick={handleNext}
                  className="hidden md:flex flex-col items-center justify-between w-[220px] h-[245px] bg-[#161F30]/70 rounded-[20px] border border-slate-800/80 p-4 opacity-50 scale-90 cursor-pointer hover:opacity-75 transition-all select-none"
                >
                  <SoopCardContent item={nextItem} timezone={selectedTimezone} isCenter={false} />
                </div>
              )}
            </div>

            {/* 다음 버튼 (>) */}
            {items.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-6 z-30 p-2.5 rounded-full bg-slate-900/80 hover:bg-white hover:text-slate-900 text-slate-300 border border-slate-700 shadow-lg transition-all cursor-pointer backdrop-blur-md"
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
 * 레이아웃: [상단 대형 아바타] ➔ [중앙 이름] ➔ [하단 [방송예정] [시간] 캡슐]
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

  return (
    <>
      {/* 1. 상단 큼직한 캐릭터 아바타 비주얼 */}
      <div className="relative pt-1">
        <div
          onClick={() => isCenter && slug && onNavigate && onNavigate(`/creator/${slug}`)}
          className={`relative rounded-full overflow-hidden border-2 transition-transform ${
            isCenter
              ? 'w-24 h-24 sm:w-28 sm:h-28 border-white/80 shadow-md cursor-pointer group-hover:scale-105'
              : 'w-20 h-20 border-slate-600'
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
          className="absolute bottom-0 right-1 text-[11px] leading-none bg-slate-900/90 rounded-full p-1 border border-slate-700"
          title={`국가: ${countryBadge.label}`}
        >
          {countryBadge.flag}
        </span>
      </div>

      {/* 2. 중앙 버튜버 이름 (가운데 정렬, 굵직한 타이포) */}
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
        {isCenter && (
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            {event.creator.agency || '개인세'}
          </p>
        )}
      </div>

      {/* 3. 하단 숲 100% 싱크로율 캡슐 일정 바 */}
      {/* 숲 캡처: [방송 예정] (녹색 알약 뱃지) + 09/11(금) 오후 7시 (날짜시간) */}
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
