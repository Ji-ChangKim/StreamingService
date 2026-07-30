import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Globe, 
  Clock, 
  ExternalLink, 
  Download, 
  X,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  Megaphone
} from 'lucide-react';
import { DebutEvent } from '../types';
import { formatLocalTime } from '../utils/dateUtils';
import { 
  getCalendarGridCells, 
  buildEventsByDateMap, 
  getTodayDateKey 
} from '../utils/calendarUtils';

interface MonthlyCalendarGridProps {
  events: DebutEvent[];
  selectedTimezone: string;
  setSelectedTimezone: (tz: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (p: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onDownloadICS: (event: DebutEvent) => void;
  onOpenSubmitModal?: () => void;
}

export function MonthlyCalendarGrid({
  events,
  selectedTimezone,
  setSelectedTimezone,
  selectedPlatform,
  setSelectedPlatform,
  searchQuery,
  setSearchQuery,
  onDownloadICS,
  onOpenSubmitModal
}: MonthlyCalendarGridProps) {
  // 광고 영역 비활성화 플래그 (추후 스폰서십/애드센스 유치 시 true로 전환)
  const ENABLE_ADS = false;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showIndieOnly, setShowIndieOnly] = useState<boolean>(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [previewAvatar, setPreviewAvatar] = useState<{ url: string; name: string } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  // Filter by Indie status if toggled
  const filteredEvents = showIndieOnly
    ? events.filter((e) => e.creator.agency.toLowerCase().includes('indie') || e.creator.agency === '개인세')
    : events;

  const calendarCells = getCalendarGridCells(year, month);
  const eventsByDateMap = buildEventsByDateMap(filteredEvents, selectedTimezone);
  const todayStr = getTodayDateKey(selectedTimezone);

  // Selected date events for Side Panel
  const currentSelectedEvents = (eventsByDateMap.get(selectedDateStr) || []).sort(
    (a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
  );

  const platforms = [
    { id: 'ALL', label: '전체 플랫폼' },
    { id: 'CHZZK', label: 'CHZZK', dot: '🟢' },
    { id: 'SOOP', label: 'SOOP', dot: '🔵' },
    { id: 'YOUTUBE', label: 'YouTube', dot: '🔴' },
    { id: 'TWITCH', label: 'Twitch', dot: '🟣' },
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* 🎯 ZONE 1: 캘린더 최상단 와이드 광고 배너 스팟 (비활성화 상태) */}
      {ENABLE_ADS && (
        <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-[14px] p-3 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#8B5CF6] text-white rounded-[4px] uppercase tracking-wider">
              AD / SPONSORED
            </span>
            <p className="text-xs font-semibold text-slate-200">
              🔥 <strong className="text-amber-300">신입 버튜버 데뷔 프로모션:</strong> 이번 주 주목해야 할 데뷔 라인업 배너
            </p>
          </div>
          <button
            onClick={() => alert('데뷔 프로모션 광고 문의: ads@vdebut.hub')}
            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 hover:underline hidden sm:inline-block"
          >
            배너 광고 문의 ↗
          </button>
        </div>
      )}

      {/* Main Split Grid (Left: Clean Calendar Grid 65% | Right: Side Inspector Panel 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Clean Fixed Height Calendar Grid (7 Cols on LG) */}
        <div className="lg:col-span-7 bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Top Navigation & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-[#CBD5E1] rounded-[8px] p-1 bg-[#F8FAFC]">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-base font-extrabold text-[#0F172A] px-2 font-['Outfit']">
                    {year}년 {month + 1}월
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-bold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] rounded-[6px] transition-colors border border-[#CBD5E1]"
                >
                  오늘
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="버튜버/이벤트 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] pl-8 pr-3 py-1.5 rounded-[8px] border border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Platform & Indie Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {platforms.map((p) => {
                  const isActive = selectedPlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id)}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#0F172A] text-white shadow-xs'
                          : 'bg-white text-[#475569] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                      }`}
                    >
                      {p.dot && <span className="mr-1">{p.dot}</span>}
                      {p.label}
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowIndieOnly(!showIndieOnly)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-extrabold transition-all border ${
                    showIndieOnly
                      ? 'bg-[#10B981] text-white border-[#059669]'
                      : 'bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5] border-[#A7F3D0]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  🌱 개인세만 보기
                </button>
              </div>

              {/* Timezone Setting */}
              <div className="flex items-center gap-1 text-[11px] text-[#64748B] font-mono">
                <Globe className="w-3 h-3 text-[#2563EB]" />
                <button
                  onClick={() => {
                    const tz = prompt('시간대 입력 (예: Asia/Seoul, UTC)', selectedTimezone);
                    if (tz) setSelectedTimezone(tz);
                  }}
                  className="font-bold text-[#0F172A] hover:underline"
                >
                  {selectedTimezone}
                </button>
              </div>
            </div>

            {/* Weekday Header Grid */}
            <div className="grid grid-cols-7 border border-[#CBD5E1] rounded-t-[8px] bg-[#F8FAFC] text-center font-bold text-xs text-[#475569] divide-x divide-[#CBD5E1]">
              <div className="py-2 text-[#EF4444]">일</div>
              <div className="py-2">월</div>
              <div className="py-2">화</div>
              <div className="py-2">수</div>
              <div className="py-2">목</div>
              <div className="py-2">금</div>
              <div className="py-2 text-[#2563EB]">토</div>
            </div>

            {/* Strict Fixed Height Grid Cells */}
            <div className="grid grid-cols-7 border-x border-b border-[#CBD5E1] rounded-b-[8px] divide-x divide-y divide-[#CBD5E1] bg-[#F1F5F9]">
              {calendarCells.map((cell, idx) => {
                if (!cell.date) {
                  return <div key={`empty-${idx}`} className="h-[95px] bg-[#F8FAFC]/40" />;
                }

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.dayNumber).padStart(2, '0')}`;
                const dayEvents = eventsByDateMap.get(dateKey) || [];
                const isSelected = dateKey === selectedDateStr;
                const isToday = dateKey === todayStr;

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`h-[95px] p-1.5 bg-white flex flex-col justify-between overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#F0F9FF] ring-2 ring-inset ring-[#2563EB] shadow-xs'
                        : isToday
                        ? 'bg-[#F8FAFC] border-t-2 border-t-[#2563EB]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-[11px] font-bold font-mono px-1 rounded-[3px] ${
                          isToday
                            ? 'bg-[#2563EB] text-white'
                            : idx % 7 === 0
                            ? 'text-[#EF4444]'
                            : idx % 7 === 6
                            ? 'text-[#2563EB]'
                            : 'text-[#334155]'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-extrabold bg-[#0F172A] text-white px-1.5 rounded-full">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Neat Event Chip Pills (Max 2 items) */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((evt) => {
                        const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                        const platformDot =
                          primaryLink?.platform === 'CHZZK'
                            ? '🟢'
                            : primaryLink?.platform === 'SOOP'
                            ? '🔵'
                            : primaryLink?.platform === 'YOUTUBE'
                            ? '🔴'
                            : '🟣';

                        return (
                          <div
                            key={evt.id}
                            className="px-1 py-0.5 rounded-[4px] bg-[#F1F5F9] border border-[#CBD5E1]/70 flex items-center gap-1 text-[10px] font-semibold text-[#0F172A] truncate"
                          >
                            <span className="text-[8px]">{platformDot}</span>
                            <span className="truncate">{evt.creator.displayName}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <div className="text-[9px] font-bold text-[#2563EB] text-center bg-[#EFF6FF] py-0.2 rounded-[3px]">
                          + {dayEvents.length - 2}개 더보기
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 소유권 검증 및 공공 API 자동 연동 데이터
            </span>
          </div>
        </div>

        {/* Right: Side Schedule Inspector Panel (5 Cols on LG) */}
        <div className="lg:col-span-5 bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Selected Date Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] font-['Outfit'] flex items-center gap-2">
                  📌 {selectedDateStr} 데뷔 스케줄
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  해당 날짜에 등록된 데뷔 이벤트 총 <strong className="text-[#2563EB]">{currentSelectedEvents.length}건</strong>
                </p>
              </div>

              {/* Creator 1-Click Add Schedule Button */}
              {onOpenSubmitModal && (
                <button
                  onClick={onOpenSubmitModal}
                  className="px-3 py-1.5 text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-[8px] transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                  일정 등록
                </button>
              )}
            </div>

            {/* 🎯 ZONE 2: 사이드 패널 상단 Pinned Ad (비활성화 상태) */}
            {ENABLE_ADS && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-[12px] p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded-[4px] shrink-0">
                    ⭐ PROMOTED
                  </span>
                  <span className="text-xs font-bold text-amber-900 truncate">
                    금주의 핫라이트 데뷔 스폰서십 스팟
                  </span>
                </div>
                <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
              </div>
            )}

            {/* Event List for Selected Date */}
            {currentSelectedEvents.length === 0 ? (
              <div className="py-12 text-center text-[#94A3B8] text-xs space-y-2">
                <p className="font-semibold">이 날짜에는 아직 등록된 데뷔 일정이 없습니다.</p>
                {onOpenSubmitModal && (
                  <button
                    onClick={onOpenSubmitModal}
                    className="text-[#2563EB] font-bold hover:underline inline-block mt-1"
                  >
                    👉 첫 번째 데뷔 일정 직접 등록하기
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                {currentSelectedEvents.map((evt) => {
                  const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                  const formattedTime = formatLocalTime(evt.startAtUtc, selectedTimezone);
                  const isIndie = evt.creator.agency.toLowerCase().includes('indie') || evt.creator.agency === '개인세';

                  return (
                    <div
                      key={evt.id}
                      className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[14px] p-4 flex flex-col gap-3 hover:border-[#2563EB] transition-all group"
                    >
                      {/* Top Info */}
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={evt.creator.avatarUrl}
                            alt={evt.creator.displayName}
                            onClick={() => setPreviewAvatar({ url: evt.creator.avatarUrl, name: evt.creator.displayName })}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs cursor-pointer hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-sm font-extrabold text-[#0F172A] truncate">
                              {evt.creator.displayName}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[4px] bg-[#0F172A] text-white">
                              {primaryLink?.platform}
                            </span>
                            {isIndie ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[4px] bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                                🌱 개인세
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                                {evt.creator.agency}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-mono font-bold text-[#2563EB] flex items-center gap-1 mb-1">
                            <Clock className="w-3.5 h-3.5" /> {formattedTime}
                          </p>

                          <p className="text-xs text-[#475569] font-medium line-clamp-2">
                            {evt.description || evt.title}
                          </p>
                        </div>
                      </div>

                      {/* Bottom 2 Action CTAs */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
                        <a
                          href={primaryLink?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold bg-[#0F172A] text-white hover:bg-[#2563EB] rounded-[8px] transition-colors shadow-xs"
                        >
                          방송 보러가기 / 팔로우 <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onDownloadICS(evt)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-[8px] transition-colors"
                        >
                          캘린더 추가 <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 🎯 ZONE 4: 사이드 패널 하단 스티키 광고 배너 스팟 (비활성화 상태) */}
          {ENABLE_ADS && (
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[12px] border border-[#CBD5E1] text-center">
              <span className="text-[9px] font-bold text-[#94A3B8] uppercase block mb-1">SPONSORED ADVERTISEMENT</span>
              <div className="h-[90px] bg-slate-200 rounded-[8px] flex items-center justify-center text-xs font-bold text-slate-500">
                300x90 Sticky Banner Slot
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Image Lightbox */}
      {previewAvatar && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewAvatar(null)}
        >
          <div 
            className="bg-white rounded-[24px] p-6 max-w-[420px] w-full flex flex-col items-center relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewAvatar(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#F1F5F9] text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-[#0F172A] mb-3">
              {previewAvatar.name} 프로필 이미지
            </h4>
            <img
              src={previewAvatar.url}
              alt={previewAvatar.name}
              className="w-64 h-64 rounded-full object-cover border-4 border-[#2563EB] shadow-xl mb-3"
            />
          </div>
        </div>
      )}
    </div>
  );
}
