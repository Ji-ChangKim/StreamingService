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

  // 오늘 데뷔하는 이벤트 필터링
  const todayEvents = allEvents.filter((evt) => {
    try {
      return getEventDateKey(evt.startAtUtc, selectedTimezone) === todayKey;
    } catch {
      return false;
    }
  });

  // 오늘 데뷔하는 스트리머가 없으면 아무것도 렌더링하지 않음 (달력 본래 화면 깔끔하게 유지)
  if (todayEvents.length === 0) {
    return null;
  }

  // 라이브 중인 스트리머를 맨 앞으로 정렬, 그 후 시작 시간순 정렬
  const sortedEvents = [...todayEvents].sort((a, b) => {
    const aLive = checkIsEventLive(a.startAtUtc) ? 1 : 0;
    const bLive = checkIsEventLive(b.startAtUtc) ? 1 : 0;
    if (aLive !== bLive) return bLive - aLive;
    return new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime();
  });

  const hasLiveStream = sortedEvents.some((evt) => checkIsEventLive(evt.startAtUtc));

  return (
    <section aria-label="Today Debut Promotion" className="w-full mb-6 sm:mb-8 animate-fadeIn">
      {/* 1. Header (아이콘/이모지 없는 미니멀하고 고급스러운 타이포그래피) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-2 mb-3.5 px-1">
        <div>
          <span className="text-[10px] sm:text-[11px] font-mono font-extrabold tracking-wider text-[#2563EB] uppercase block">
            {t.todayDebutsEyebrow || "TODAY'S DEBUT STREAM"}
          </span>
          <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#0F172A] tracking-tight font-['Outfit'] mt-0.5">
            {hasLiveStream
              ? t.todayLiveTitle || '현재 데뷔 라이브 방송 중'
              : t.todayDebutsTitle || '오늘 데뷔하는 스트리머'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#64748B] bg-white border border-[#CBD5E1] px-2.5 py-1 rounded-[6px] shadow-2xs">
            {sortedEvents.length}
            {t.todayCountSuffix || '명 데뷔'}
          </span>
        </div>
      </div>

      {/* 2. 스트리머 방송 채널 프로모션 카드 그리드 */}
      <div
        className={`grid gap-3.5 ${
          sortedEvents.length === 1
            ? 'grid-cols-1'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {sortedEvents.map((evt) => {
          const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
          const isLive = checkIsEventLive(evt.startAtUtc);
          const startTime = formatTimeInTimezone(evt.startAtUtc, selectedTimezone);
          const platform = primaryLink?.platform?.toUpperCase() || 'CHZZK';
          const channelUrl = primaryLink?.url || '#';
          const isIndie =
            evt.creator.agency?.toLowerCase().includes('indie') ||
            evt.creator.agency === '개인세';
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
              className={`rounded-[16px] border p-4 sm:p-5 flex flex-col justify-between transition-all relative overflow-hidden bg-white shadow-xs hover:shadow-md ${
                isLive
                  ? 'border-red-400/90 ring-1 ring-red-400/30'
                  : 'border-[#CBD5E1] hover:border-[#2563EB]'
              }`}
            >
              {/* Top Row: 상태 뱃지 & 플랫폼 공식 로고 */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  {/* 상태 뱃지 (LIVE NOW vs UPCOMING) */}
                  {isLive ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-red-600 text-white text-[11px] font-mono font-extrabold tracking-wider shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>LIVE NOW</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] text-[11px] font-mono font-bold">
                      <span className="text-[#2563EB] font-extrabold">{startTime}</span>
                      <span className="text-[#64748B]">START</span>
                    </div>
                  )}

                  {/* 타사 플랫폼 공식 로고 (무가공 원본 원칙) */}
                  <div className="flex items-center shrink-0">
                    {platform === 'CHZZK' && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#00FFA3] text-black font-extrabold text-[10px]">
                        <img
                          src="/icons/chzzk_icon.png"
                          alt="CHZZK"
                          className="w-3.5 h-3.5 object-contain shrink-0"
                        />
                        <span>CHZZK</span>
                      </div>
                    )}
                    {platform === 'SOOP' && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#0F172A] text-white font-extrabold text-[10px]">
                        <img
                          src="/icons/soop/soop_symbol_white.svg"
                          alt="SOOP"
                          className="w-3.5 h-3.5 object-contain shrink-0"
                        />
                        <span>SOOP</span>
                      </div>
                    )}
                    {platform === 'YOUTUBE' && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EF4444] text-white font-extrabold text-[10px]">
                        <img
                          src="/icons/youtube_icon.png"
                          alt="YouTube"
                          className="h-3.5 object-contain shrink-0"
                        />
                        <span>YouTube</span>
                      </div>
                    )}
                    {platform === 'TWITCH' && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#9333EA] text-white font-extrabold text-[10px]">
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

                {/* Middle: 스트리머 정보 (아바타, 이름, 소속, 방송 소개) */}
                <div className="flex items-start gap-3.5 mb-3">
                  <a
                    href={`/creator/${slug}`}
                    onClick={handleProfileClick}
                    className="shrink-0"
                  >
                    <AvatarImage
                      src={evt.creator.avatarUrl}
                      alt={evt.creator.displayName}
                      className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 shadow-xs cursor-pointer hover:scale-105 transition-transform ${
                        isLive ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                  </a>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                      <a
                        href={`/creator/${slug}`}
                        onClick={handleProfileClick}
                        className="text-base sm:text-lg font-extrabold text-[#0F172A] hover:text-[#2563EB] transition-colors truncate font-['Outfit']"
                      >
                        {evt.creator.displayName}
                      </a>
                      <span className="text-[11px] font-medium text-[#64748B]">
                        {isIndie ? '개인세' : evt.creator.agency || 'Indie'}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-[#334155] line-clamp-1">
                      {evt.title}
                    </h3>
                    {evt.description && (
                      <p className="text-[11px] text-[#64748B] line-clamp-2 mt-0.5 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom: 방송 채널 직접 홍보 CTA 버튼들 */}
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center gap-2">
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] text-xs font-extrabold transition-all shadow-xs text-center cursor-pointer ${
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
                    className="px-3 py-2.5 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold transition-all shrink-0 cursor-pointer"
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
    </section>
  );
}
