import { useMemo } from 'react';
import { Calendar, HelpCircle, ExternalLink, PlusCircle, Edit3 } from 'lucide-react';
import { DebutEvent } from '../../types';
import { AvatarImage } from './AvatarImage';
import { getCountryBadge } from '../../utils/countryDetector';
import { filterEventsByPlatform, filterEventsByQuery, filterEventsByCountry } from '../../utils/eventUtils';

interface UndecidedDebutSectionProps {
  year: number;
  month: number; // 0-indexed (0: 1월, 8: 9월 ...)
  events: DebutEvent[];
  selectedPlatform: string;
  selectedCountry?: string;
  searchQuery?: string;
  selectedTimezone?: string;
  onOpenSubmitModal?: (dateStr?: string) => void;
  onEditEvent?: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
}

/**
 * 플랫폼별 공식 로고 이미지 경로 반환 (브랜드 자산 무가공 준수)
 */
function getPlatformOfficialLogo(platform: string): string {
  const p = platform?.toUpperCase() || '';
  if (p === 'SOOP') return '/icons/soop/soop_symbol_blue.svg';
  if (p === 'CHZZK') return '/icons/chzzk_icon.png';
  if (p === 'YOUTUBE') return '/icons/youtube_icon.png';
  if (p === 'TWITCH') return '/icons/twitch_icon.svg';
  return '/icons/chzzk_icon.png';
}

/**
 * 이벤트가 '일자 또는 시간 미정(TBD)'인지 판별하는 단일 책임 함수 (SRP)
 */
export function checkIsTbdEvent(evt: DebutEvent): boolean {
  if (evt.isTbd) return true;
  if (evt.tbdType) return true;
  const combined = `${evt.title || ''} ${evt.description || ''}`.toLowerCase();
  return (
    combined.includes('[미정]') ||
    combined.includes('[일정 미정]') ||
    combined.includes('[일자 미정]') ||
    combined.includes('[시간 미정]') ||
    combined.includes('일정 미정') ||
    combined.includes('시간 미정')
  );
}

export function UndecidedDebutSection({
  year,
  month,
  events,
  selectedPlatform,
  selectedCountry = 'ALL',
  searchQuery = '',
  onOpenSubmitModal,
  onEditEvent,
}: UndecidedDebutSectionProps) {
  const monthNumber = month + 1;
  const targetYearMonth = `${year}-${String(monthNumber).padStart(2, '0')}`;

  // 해당 연월의 '일정 미정' 이벤트만 추출 및 필터링
  const tbdEvents = useMemo(() => {
    const rawTbd = events.filter((evt) => {
      const isTbd = checkIsTbdEvent(evt);
      if (!isTbd) return false;

      // 대상 월 검증: targetMonth가 지정되어 있거나, startAtUtc가 해당 연월에 속하는 경우
      const evtYearMonth = evt.targetMonth || evt.startAtUtc?.slice(0, 7) || '';
      return evtYearMonth === targetYearMonth;
    });

    // 플랫폼, 국가, 검색어 필터링 적용
    return filterEventsByQuery(
      filterEventsByCountry(
        filterEventsByPlatform(rawTbd, selectedPlatform),
        selectedCountry
      ),
      searchQuery
    );
  }, [events, targetYearMonth, selectedPlatform, selectedCountry, searchQuery]);

  return (
    <section
      aria-label={`${monthNumber}월 데뷔 예정 (일자·시간 미정) 버튜버`}
      className="mt-6 sm:mt-8 bg-white rounded-[20px] border border-[#CBD5E1] p-4 sm:p-6 shadow-xs relative overflow-hidden"
    >
      {/* 1. 상단 섹션 타이틀 및 제보 액션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight flex items-center gap-2">
              <span>{monthNumber}월 데뷔 예정</span>
              <span className="text-xs sm:text-sm font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                일자·시간 미정
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {tbdEvents.length}명
              </span>
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1 ml-10 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{monthNumber}월 데뷔를 예고했으나 구체적인 날짜나 방송 시간이 아직 확정되지 않은 신입 버튜버입니다.</span>
          </p>
        </div>

        {/* 미정 일정 등록 버튼 */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => onOpenSubmitModal && onOpenSubmitModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer select-none"
            title={`${monthNumber}월 데뷔 예정 버튜버 등록`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{monthNumber}월 예정 등록</span>
          </button>
        </div>
      </div>

      {/* 2. 카드 그리드 또는 빈 상태 */}
      {tbdEvents.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
            <Calendar className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-[#334155]">
            현재 {monthNumber}월 데뷔 예정(일정 미정)으로 등록된 버튜버가 없습니다.
          </p>
          <p className="text-xs text-[#64748B] mt-1 max-w-md">
            {monthNumber}월 중 첫 방송을 준비 중이신가요? 날짜와 시간이 아직 확정되지 않았더라도 미리 등록하여 팬들에게 데뷔 소식을 알려보세요!
          </p>
          <button
            onClick={() => onOpenSubmitModal && onOpenSubmitModal()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>10초 만에 데뷔 예정 등록하기</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {tbdEvents.map((evt) => {
            const primaryLink = evt.links?.find((l) => l.isPrimary) || evt.links?.[0];
            const platform = primaryLink?.platform || 'CHZZK';
            const channelUrl = primaryLink?.url || 'https://vdebut.live';
            const countryBadge = getCountryBadge(evt.creator.countryCode);
            const agency = evt.creator.agency?.trim();
            const hasRealAgency = agency && agency !== '개인세' && agency !== 'None';
            const isTimeTbd = evt.tbdType === 'TIME_TBD';

            return (
              <div
                key={evt.id}
                className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* 상단: 프로필 및 기본 정보 */}
                <div>
                  <div className="flex items-start gap-3">
                    {/* 아바타 + 국가 뱃지 */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                        <AvatarImage
                          src={evt.creator.avatarUrl}
                          alt={evt.creator.displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className="absolute -bottom-1 -right-1 text-[10px] px-1 py-0.2 rounded-full bg-white shadow-2xs border border-slate-200 font-bold"
                        title={countryBadge.label}
                      >
                        {countryBadge.code}
                      </span>
                    </div>

                    {/* 이름 및 소속 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <img
                          src={getPlatformOfficialLogo(platform)}
                          alt={platform}
                          className="w-3.5 h-3.5 object-contain shrink-0"
                        />
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                          {platform}
                        </span>
                      </div>
                      <h3
                        className="text-sm font-black text-[#0F172A] truncate group-hover:text-blue-600 transition-colors"
                        title={evt.creator.displayName}
                      >
                        {evt.creator.displayName}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {hasRealAgency ? (
                          <span className="font-semibold text-slate-700">{agency}</span>
                        ) : (
                          <span className="text-slate-400">신입 버츄얼 크리에이터</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 미정 뱃지 라벨 */}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-extrabold w-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span className="truncate">
                      {isTimeTbd ? `${monthNumber}월 데뷔 (시간 미정)` : `✨ ${monthNumber}월 중 데뷔 예정 (일자 미정)`}
                    </span>
                  </div>

                  {/* 짧은 설명글 (존재할 경우) */}
                  {evt.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {evt.description.replace(/^\[(미정|일정 미정|시간 미정|날짜 미정)\]\s*/i, '')}
                    </p>
                  )}
                </div>

                {/* 하단: 채널 바로가기 및 일정 확정 제보 액션 */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>채널 방문</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {onEditEvent && (
                    <button
                      onClick={() => onEditEvent(evt)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                      title="일정 확정 시 날짜와 시간을 등록합니다"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>일정 확정 제보</span>
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
