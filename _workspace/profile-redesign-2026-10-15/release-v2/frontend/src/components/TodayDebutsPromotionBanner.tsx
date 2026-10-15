import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DebutEvent } from '../types';
import { getEventDateKey, getTodayDateKey } from '../utils/calendarUtils';
import { formatTimeInTimezone } from '../utils/dateUtils';
import { checkIsEventLive } from '../utils/eventUtils';
import { Language, UI_TRANSLATIONS } from '../utils/i18n';
import { AvatarImage } from './calendar/AvatarImage';

interface TodayDebutsPromotionBannerProps {
  allEvents: DebutEvent[];
  selectedTimezone: string;
  currentLang: Language;
  onDownloadICS: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
}

export function TodayDebutsPromotionBanner({
  allEvents = [],
  selectedTimezone,
  currentLang,
  onDownloadICS,
  onNavigate,
}: TodayDebutsPromotionBannerProps) {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.ko;
  const todayKey = getTodayDateKey(selectedTimezone);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 1. 오늘 데뷔하는 이벤트 필터링
  const todayEvents = allEvents.filter((evt) => {
    try {
      return getEventDateKey(evt.startAtUtc, selectedTimezone) === todayKey;
    } catch {
      return false;
    }
  });

  // 2. 현재 실제 라이브 방송 중인 이벤트 필터링
  const liveEvents = todayEvents.filter((evt) => checkIsEventLive(evt.startAtUtc));

  // 3. 디폴트 탭 설정: 라이브 중인 스트리머가 1명 이상이면 'live', 없으면 'today'가 디폴트
  const [activeTab, setActiveTab] = useState<'live' | 'today'>(() =>
    liveEvents.length > 0 ? 'live' : 'today'
  );

  // liveEvents 상태 변경 시 탭 자동 동기화
  useEffect(() => {
    if (liveEvents.length > 0) {
      setActiveTab('live');
    } else {
      setActiveTab('today');
    }
  }, [liveEvents.length]);

  // 오늘 데뷔하는 스트리머가 없으면 상단 프로모션 영역 자동 숨김 (하단 캘린더 화면 깔끔하게 유지)
  if (todayEvents.length === 0) {
    return null;
  }

  // 탭별 표시할 이벤트 목록 결정
  const displayedEvents =
    activeTab === 'live'
      ? liveEvents
      : [...todayEvents].sort(
          (a, b) =>
            new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
        );

  // 좌우 슬라이드 스크롤 핸들러 (1줄 고정 캐러셀)
  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-label="Today Debut Promotion Tabs"
      className="w-full mb-6 sm:mb-8 animate-fadeIn"
    >
      {/* 1. 상단 2단 탭 바 (아이콘 없는 정갈한 텍스트 탭 & 우측 슬라이드 컨트롤) */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-[#CBD5E1]">
        {/* Left: [ 데뷔 라이브 (N) ] | [ 금일 데뷔 (M) ] 2단 탭 */}
        <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-[10px] border border-[#CBD5E1]">
          {/* 탭 1: 데뷔 라이브 */}
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-[7px] text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <span>{t.tabDebutLive || '데뷔 라이브'}</span>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'live'
                  ? liveEvents.length > 0
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                  : liveEvents.length > 0
                  ? 'bg-red-100 text-red-700 font-black'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {liveEvents.length}
            </span>
          </button>

          {/* 탭 2: 금일 데뷔 */}
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-[7px] text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              activeTab === 'today'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <span>{t.tabTodayDebut || '금일 데뷔'}</span>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'today'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {todayEvents.length}
            </span>
          </button>
        </div>

        {/* Right: 좌우 슬라이드 네비게이션 버튼 (인원 많을 때 가로 탐색) */}
        {displayedEvents.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleScrollLeft}
              className="p-1.5 rounded-[8px] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#475569] transition-all cursor-pointer shadow-2xs"
              aria-label="이전 스트리머"
              title="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrollRight}
              className="p-1.5 rounded-[8px] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#475569] transition-all cursor-pointer shadow-2xs"
              aria-label="다음 스트리머"
              title="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. 1줄 고정 가로 슬라이더 캐러셀 (5명, 10명 이상이어도 높이 1줄 고정) */}
      {displayedEvents.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-[#CBD5E1] p-6 text-center space-y-1.5">
          <p className="text-xs font-bold text-[#64748B]">
            {activeTab === 'live'
              ? t.noLiveNow || '현재 진행 중인 데뷔 생방송이 없습니다.'
              : t.noTodayDebuts || '오늘 예정된 데뷔 방송이 없습니다.'}
          </p>
          {activeTab === 'live' && todayEvents.length > 0 && (
            <button
              onClick={() => setActiveTab('today')}
              className="text-xs font-extrabold text-[#2563EB] hover:underline cursor-pointer inline-block mt-0.5"
            >
              금일 데뷔 방송 일정 보기 ({todayEvents.length}개)
            </button>
          )}
        </div>
      ) : (
        <div
          ref={carouselRef}
          className="flex flex-nowrap overflow-x-auto no-scrollbar scroll-smooth gap-3.5 pb-1 px-0.5 items-stretch"
        >
          {displayedEvents.map((evt) => {
            const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
            const isLive = checkIsEventLive(evt.startAtUtc);
            const startTime = formatTimeInTimezone(evt.startAtUtc, selectedTimezone);
            const platform = primaryLink?.platform?.toUpperCase() || 'CHZZK';
            const channelUrl = primaryLink?.url || '#';
            const slug =
              (evt.creator as any).slug ||
              (evt.creator.displayName === '아롱띠' ? 'arongtti' : 'arongtti');

            const handleProfileClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (onNavigate) {
                onNavigate(`/creator/${slug}`);
              } else {
                window.history.pushState({}, '', `/creator/${slug}`);
                window.dispatchEvent(new Event('popstate'));
              }
            };

            return (
              <div
                key={evt.id}
                className={`rounded-[14px] border p-4 flex flex-col justify-between transition-all bg-white shadow-xs hover:shadow-md shrink-0 ${
                  displayedEvents.length === 1
                    ? 'w-full'
                    : displayedEvents.length === 2
                    ? 'w-full sm:w-[calc(50%-7px)]'
                    : 'w-[85%] sm:w-[320px]'
                } ${
                  isLive
                    ? 'border-red-400/90 ring-1 ring-red-400/30'
                    : 'border-[#CBD5E1] hover:border-[#2563EB]'
                }`}
              >
                {/* Top Row: 상태 뱃지 & 타사 플랫폼 공식 로고 (무가공 원본) */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* 상태 뱃지 */}
                    {isLive ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] bg-red-600 text-white text-[11px] font-mono font-extrabold tracking-wider shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>LIVE NOW</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] text-[11px] font-mono font-bold">
                        <span className="text-[#2563EB] font-extrabold">{startTime}</span>
                        <span className="text-[#64748B]">START</span>
                      </div>
                    )}

                    {/* 타사 플랫폼 공식 로고 (무가공 원본) */}
                    <div className="flex items-center shrink-0">
                      {platform === 'CHZZK' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#00FFA3] text-black font-extrabold text-[10px]">
                          <img
                            src="/icons/chzzk_icon.png"
                            alt="CHZZK"
                            className="w-3.5 h-3.5 object-contain shrink-0"
                          />
                          <span>CHZZK</span>
                        </div>
                      )}
                      {platform === 'SOOP' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#0F172A] text-white font-extrabold text-[10px]">
                          <img
                            src="/icons/soop/soop_symbol_white.svg"
                            alt="SOOP"
                            className="w-3.5 h-3.5 object-contain shrink-0"
                          />
                          <span>SOOP</span>
                        </div>
                      )}
                      {platform === 'YOUTUBE' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#EF4444] text-white font-extrabold text-[10px]">
                          <img
                            src="/icons/youtube_icon.png"
                            alt="YouTube"
                            className="h-3.5 object-contain shrink-0"
                          />
                          <span>YouTube</span>
                        </div>
                      )}
                      {platform === 'TWITCH' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#9333EA] text-white font-extrabold text-[10px]">
                          <img
                            src="/icons/logo_twitch_white.png"
                            alt="Twitch"
                            className="w-3.5 h-3.5 object-contain shrink-0"
                          />
                          <span>Twitch</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: 스트리머 정보 (아바타, 이름, 방송 소개) */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <a
                      href={`/creator/${slug}`}
                      onClick={handleProfileClick}
                      className="shrink-0"
                    >
                      <AvatarImage
                        src={evt.creator.avatarUrl}
                        alt={evt.creator.displayName}
                        className={`w-12 h-12 rounded-full object-cover border-2 shadow-xs cursor-pointer hover:scale-105 transition-transform ${
                          isLive ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                    </a>

                    <div className="min-w-0 flex-1">
                      <a
                        href={`/creator/${slug}`}
                        onClick={handleProfileClick}
                        className="text-sm sm:text-base font-extrabold text-[#0F172A] hover:text-[#2563EB] transition-colors truncate font-['Outfit'] block"
                      >
                        {evt.creator.displayName}
                      </a>

                      <h3 className="text-xs font-bold text-[#334155] line-clamp-1 mt-0.5">
                        {evt.title}
                      </h3>
                      {evt.description && (
                        <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5 leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom: 방송 채널 직접 홍보 CTA 버튼 */}
                <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center gap-2 mt-auto">
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[8px] text-xs font-extrabold transition-all shadow-xs text-center cursor-pointer ${
                      isLive
                        ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-600/20'
                        : 'bg-[#0F172A] hover:bg-[#2563EB] text-white'
                    }`}
                  >
                    <span>
                      {isLive
                        ? t.watchLiveNow || '지금 생방송 보러가기'
                        : t.goToChannel || '방송 채널 바로가기'}
                    </span>
                    <span className="text-[11px]">↗</span>
                  </a>

                  {!isLive && (
                    <button
                      onClick={() => onDownloadICS(evt)}
                      className="px-2.5 py-2 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold transition-all shrink-0 cursor-pointer"
                      title={t.saveIcs || '알림 저장'}
                    >
                      {t.saveIcs || '알림 저장'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
