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
  ZoomIn,
  Calendar as CalendarIcon,
  Sparkles,
  UserCheck
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
}: MonthlyCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showIndieOnly, setShowIndieOnly] = useState<boolean>(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    events: DebutEvent[];
  } | null>(null);
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
    setCurrentDate(new Date());
  };

  // Filter by Indie status if toggled
  const filteredEvents = showIndieOnly
    ? events.filter((e) => e.creator.agency.toLowerCase().includes('indie') || e.creator.agency === '개인세')
    : events;

  const calendarCells = getCalendarGridCells(year, month);
  const eventsByDateMap = buildEventsByDateMap(filteredEvents, selectedTimezone);
  const todayStr = getTodayDateKey(selectedTimezone);

  const platforms = [
    { id: 'ALL', label: '전체 플랫폼', color: 'bg-[#0F172A]' },
    { id: 'YOUTUBE', label: 'YouTube', dot: '🔴' },
    { id: 'TWITCH', label: 'Twitch', dot: '🟣' },
    { id: 'CHZZK', label: 'CHZZK', dot: '🟢' },
    { id: 'SOOP', label: 'SOOP', dot: '🔵' },
  ];

  // Minimal platform badge style (Clean & Non-overlapping)
  const getPlatformChipStyle = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'CHZZK':
        return 'bg-[#F0FDF4] text-[#047857] border-l-2 border-l-[#00D98B]';
      case 'SOOP':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-l-2 border-l-[#2979FF]';
      case 'YOUTUBE':
        return 'bg-[#FEF2F2] text-[#B91C1C] border-l-2 border-l-[#FF0000]';
      case 'TWITCH':
        return 'bg-[#F5F3FF] text-[#6D28D9] border-l-2 border-l-[#9146FF]';
      default:
        return 'bg-slate-50 text-slate-700 border-l-2 border-l-slate-400';
    }
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-6 mb-8 select-none">
      {/* 1. Top Control Bar: Date Nav & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#E2E8F0]">
        {/* Left: Year & Month Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[#CBD5E1] rounded-[8px] p-1 bg-[#F8FAFC]">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-[#E2E8F0] rounded-[4px] text-[#475569] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base sm:text-lg font-bold text-[#0F172A] px-3 font-[#Outfit]">
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
            className="px-3 py-1.5 text-xs font-bold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] rounded-[6px] transition-colors border border-[#CBD5E1]"
          >
            오늘
          </button>
        </div>

        {/* Right: Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="버튜버 이름/언어 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] focus:bg-white text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] pl-9 pr-3 py-2 rounded-[8px] border border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 2. Platform Filter Tabs, Indie Filter & Timezone Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-4">
        {/* Platform Tabs & Indie Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {platforms.map((p) => {
            const isActive = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-white text-[#475569] hover:bg-[#F8FAFC] border border-[#CBD5E1]'
                }`}
              >
                {p.dot && <span className="text-[10px]">{p.dot}</span>}
                <span>{p.label}</span>
              </button>
            );
          })}

          {/* Dedicated Indie Filter Button */}
          <button
            onClick={() => setShowIndieOnly(!showIndieOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-extrabold transition-all border ${
              showIndieOnly
                ? 'bg-[#10B981] text-white border-[#059669] shadow-xs'
                : 'bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5] border-[#A7F3D0]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>개인세만 보기</span>
          </button>
        </div>

        {/* Timezone Info */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-mono self-end lg:self-auto">
          <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>현재 시간대 기준</span>
          <button
            onClick={() => {
              const tz = prompt('시간대를 입력하세요 (예: Asia/Seoul, America/Los_Angeles, UTC)', selectedTimezone);
              if (tz) setSelectedTimezone(tz);
            }}
            className="font-bold text-[#0F172A] hover:underline"
          >
            {selectedTimezone} | KST
          </button>
        </div>
      </div>

      {/* 3. Weekday Header (Fixed Grid Header) */}
      <div className="grid grid-cols-7 border border-[#CBD5E1] rounded-t-[10px] bg-[#F8FAFC] text-center font-bold text-xs text-[#475569] divide-x divide-[#CBD5E1]">
        <div className="py-2.5 text-[#EF4444]">일</div>
        <div className="py-2.5">월</div>
        <div className="py-2.5">화</div>
        <div className="py-2.5">수</div>
        <div className="py-2.5">목</div>
        <div className="py-2.5">금</div>
        <div className="py-2.5 text-[#2563EB]">토</div>
      </div>

      {/* 4. Strict Fixed Height Calendar Grid (No Scrollbars, No Layout Shifts) */}
      <div className="grid grid-cols-7 border-x border-b border-[#CBD5E1] rounded-b-[10px] divide-x divide-y divide-[#CBD5E1] bg-[#F1F5F9]">
        {calendarCells.map((cell, idx) => {
          if (!cell.date) {
            return (
              <div
                key={`empty-${idx}`}
                className="h-[115px] bg-[#F8FAFC]/40"
              />
            );
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.dayNumber).padStart(2, '0')}`;
          const dayEvents = eventsByDateMap.get(dateKey) || [];
          const isToday = dateKey === todayStr;

          return (
            <div
              key={dateKey}
              onClick={() => {
                if (dayEvents.length > 0) {
                  const sorted = [...dayEvents].sort((a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime());
                  setSelectedDayEvents({ dateStr: dateKey, events: sorted });
                }
              }}
              className={`h-[115px] p-2 bg-white flex flex-col justify-between overflow-hidden transition-colors ${
                isToday ? 'bg-[#F0F9FF] ring-2 ring-inset ring-[#2563EB]' : 'hover:bg-[#F8FAFC]'
              } ${dayEvents.length > 0 ? 'cursor-pointer' : ''}`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1 shrink-0">
                <span
                  className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-[4px] ${
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
                  <span className="text-[10px] font-extrabold bg-[#0F172A] text-white px-1.5 py-0.2 rounded-full">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Clean Event List (No Internal Scrollbars, Fixed Space for Max 2 items) */}
              <div className="space-y-1 shrink-0">
                {dayEvents.slice(0, 2).map((evt) => {
                  const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];

                  return (
                    <div
                      key={evt.id}
                      className={`px-1.5 py-1 rounded-[5px] border border-[#CBD5E1]/60 flex items-center gap-1.5 min-w-0 transition-transform ${getPlatformChipStyle(
                        primaryLink?.platform || 'OTHER'
                      )}`}
                    >
                      <img
                        src={evt.creator.avatarUrl}
                        alt={evt.creator.displayName}
                        className="w-4 h-4 rounded-full object-cover shrink-0 border border-white shadow-2xs"
                      />
                      <span className="text-[11px] font-bold truncate tracking-tight">
                        {evt.creator.displayName}
                      </span>
                    </div>
                  );
                })}

                {dayEvents.length > 2 && (
                  <div className="text-[9px] font-bold text-[#2563EB] text-center bg-[#EFF6FF] py-0.5 rounded-[4px] border border-[#BFDBFE]">
                    +{dayEvents.length - 2}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Bottom Info & Feedback Link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span><strong className="text-[#0F172A]">검증된 일정:</strong> 개인세 및 공식 출처 검토 후 등재합니다.</span>
        </div>
        <button
          onClick={() => alert('오정보 제보 및 피드백 문의: support@vdebut.hub')}
          className="font-semibold text-[#475569] hover:text-[#0F172A] hover:underline"
        >
          피드백 및 오정보 제보하기 ↗
        </button>
      </div>

      {/* Expanded Selected Day Event Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[20px] max-w-[960px] w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#CBD5E1] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#1E293B] rounded-xl border border-slate-700 hidden sm:flex items-center justify-center">
                  <CalendarIcon className="w-7 h-7 text-[#38BDF8]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold font-['Outfit'] flex items-center gap-2">
                    {selectedDayEvents.dateStr} 데뷔 릴레이 타임라인 ⏱️
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    총 <span className="font-bold text-[#38BDF8]">{selectedDayEvents.events.length}명</span>의 VTuber / 스트리머가 데뷔 방송을 진행합니다
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex -space-x-3 overflow-hidden bg-[#1E293B] p-1.5 rounded-full border border-slate-700">
                  {selectedDayEvents.events.map((evt) => (
                    <img
                      key={evt.id}
                      src={evt.creator.avatarUrl}
                      alt={evt.creator.displayName}
                      onClick={() => setPreviewAvatar({ url: evt.creator.avatarUrl, name: evt.creator.displayName })}
                      className="inline-block h-11 w-11 rounded-full ring-2 ring-[#0F172A] object-cover cursor-pointer hover:scale-115 hover:z-10 transition-all shadow-md"
                      title={`${evt.creator.displayName} 프로필 크게보기`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setSelectedDayEvents(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Event List in 2-Column Grid Layout */}
            <div className="p-5 sm:p-7 overflow-y-auto max-h-[72vh] bg-[#F8FAFC]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDayEvents.events.map((evt) => {
                  const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
                  const fullFormatted = formatLocalTime(evt.startAtUtc, selectedTimezone);
                  const isIndie = evt.creator.agency.toLowerCase().includes('indie') || evt.creator.agency === '개인세';

                  return (
                    <div
                      key={evt.id}
                      className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 flex flex-col justify-between gap-4 hover:border-[#2563EB] hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative group/avatar shrink-0">
                          <img
                            src={evt.creator.avatarUrl}
                            alt={evt.creator.displayName}
                            onClick={() => setPreviewAvatar({ url: evt.creator.avatarUrl, name: evt.creator.displayName })}
                            className="w-20 h-20 rounded-full object-cover border-2 border-[#E2E8F0] shadow-sm cursor-pointer group-hover/avatar:scale-105 transition-transform"
                          />
                          <button
                            onClick={() => setPreviewAvatar({ url: evt.creator.avatarUrl, name: evt.creator.displayName })}
                            className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-white transition-opacity"
                            title="프로필 이미지 확대하기"
                          >
                            <ZoomIn className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="min-w-0 flex-grow">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="text-base font-extrabold text-[#0F172A] truncate">
                              {evt.creator.displayName}
                            </span>
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-[6px] bg-[#0F172A] text-white">
                              {primaryLink?.platform}
                            </span>

                            {isIndie ? (
                              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-[6px] bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center gap-1">
                                🌱 개인세
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-[#2563EB]" /> {evt.creator.agency}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs font-mono font-bold text-[#2563EB] flex items-center gap-1.5 mb-2">
                            <Clock className="w-3.5 h-3.5" /> {fullFormatted}
                          </p>

                          <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed bg-[#F8FAFC] p-2.5 rounded-[8px] border border-[#F1F5F9]">
                            {evt.description || evt.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9] mt-1">
                        <a
                          href={primaryLink?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-[#0F172A] text-white hover:bg-[#2563EB] rounded-[10px] transition-colors shadow-xs"
                        >
                          방송 보러가기 / 팔로우 <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onDownloadICS(evt)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-[10px] transition-colors"
                        >
                          ICS 캘린더 저장 <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-[#E2E8F0] p-4 text-center flex items-center justify-between px-6">
              <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
                시간순 데뷔 릴레이 라인업입니다. 프로필을 클릭하면 확대 이미지가 제공됩니다.
              </span>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-6 py-2 text-xs font-bold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] rounded-[8px] transition-colors border border-[#CBD5E1] mx-auto sm:mx-0"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Larger Profile Lightbox Modal */}
      {previewAvatar && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewAvatar(null)}
        >
          <div 
            className="bg-white rounded-[24px] p-6 max-w-[480px] w-full flex flex-col items-center relative shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewAvatar(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-bold text-[#0F172A] mb-4 font-['Outfit']">
              {previewAvatar.name} 프로필 이미지
            </h4>
            <img
              src={previewAvatar.url}
              alt={previewAvatar.name}
              className="w-72 h-72 rounded-full object-cover border-4 border-[#2563EB] shadow-xl mb-4"
            />
            <p className="text-xs text-[#64748B] font-medium">배경이나 [X] 버튼을 눌러 닫으실 수 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
