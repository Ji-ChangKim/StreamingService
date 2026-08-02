import { useState, useMemo } from 'react';
import { DebutEvent } from '../../types';
import { Language } from '../../utils/i18n';
import { MobileAppHeader } from './MobileAppHeader';
import { WeeklyCalendarStrip } from './WeeklyCalendarStrip';
import { MobileAgendaTimeline } from './MobileAgendaTimeline';
import { MobileBottomNav } from './MobileBottomNav';
import { YearMonthPickerModal } from '../calendar/YearMonthPickerModal';
import { FilterBar } from '../FilterBar';
import { getAvatarUrl } from '../../utils/avatarUtils';
import { ExternalLink } from 'lucide-react';

interface MobileAppLayoutProps {
  events: DebutEvent[];
  selectedTimezone: string;
  selectedPlatform: string;
  setSelectedPlatform: (p: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onDownloadICS: (event: DebutEvent) => void;
  onOpenSubmitModal: (dateStr?: string) => void;
  currentLang: Language;
  eventsByDateMap: Map<string, DebutEvent[]>;
  todayStr: string;
}

export function MobileAppLayout({
  events,
  selectedTimezone,
  selectedPlatform,
  setSelectedPlatform,
  searchQuery,
  setSearchQuery,
  onOpenSubmitModal,
  currentLang,
  eventsByDateMap,
  todayStr,
}: MobileAppLayoutProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [showYearMonthPicker, setShowYearMonthPicker] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('schedule');
  const creatorsList = useMemo(() => {
    const map = new Map<string, any>();
    events.forEach(evt => {
      if (evt.creator && evt.creator.displayName && !map.has(evt.creator.displayName)) {
        map.set(evt.creator.displayName, {
          name: evt.creator.displayName,
          profile_image_url: evt.creator.avatarUrl,
          agency: evt.creator.agency,
          channel_url: evt.links.find(l => l.isPrimary)?.url || evt.links[0]?.url,
        });
      }
    });
    return Array.from(map.values());
  }, [events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(todayStr);
  };

  const selectedEvents = selectedDateStr
    ? (eventsByDateMap.get(selectedDateStr) || []).sort(
        (a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
      )
    : [];

  const filteredCreators = useMemo(() => {
    if (!searchQuery) return creatorsList;
    const q = searchQuery.toLowerCase();
    return creatorsList.filter(c => c.name?.toLowerCase().includes(q) || c.agency?.toLowerCase().includes(q));
  }, [creatorsList, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-14 pb-20">
      {/* 1. 상단 고정 앱 바 (Dark Style) */}
      <MobileAppHeader
        year={year}
        month={month}
        onOpenMonthPicker={() => setShowYearMonthPicker(true)}
        onToday={handleToday}
        onOpenSubmitModal={() => onOpenSubmitModal()}
        currentLang={currentLang}
      />

      {/* 2. 스케줄 탭 메인 뷰 */}
      {activeTab === 'schedule' && (
        <>
          {/* 플랫폼 선택 필터 Bar */}
          <div className="bg-white border-b border-[#E2E8F0] p-2">
            <FilterBar
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              totalCount={events.length}
              viewMode="GRID"
              setViewMode={() => {}}
            />
          </div>

          {/* 7일 주간 달력 스트립 */}
          <WeeklyCalendarStrip
            currentDate={currentDate}
            selectedDateStr={selectedDateStr}
            todayStr={todayStr}
            eventsByDateMap={eventsByDateMap}
            onSelectDate={(dateStr) => setSelectedDateStr(dateStr)}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
          />

          {/* 일별 이벤트 리스트 카드 */}
          <MobileAgendaTimeline
            selectedDateStr={selectedDateStr}
            events={selectedEvents}
            selectedTimezone={selectedTimezone}
            onOpenSubmitModal={onOpenSubmitModal}
          />
        </>
      )}

      {/* 3. 크리에이터 탭 메인 뷰 */}
      {activeTab === 'creators' && (
        <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 font-['Outfit']">
              전체 스트리머 목록 ({filteredCreators.length}명)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {filteredCreators.map((creator) => (
              <div
                key={creator.id || creator.name}
                className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col items-center text-center space-y-2"
              >
                <img
                  src={creator.profile_image_url || getAvatarUrl(creator.name)}
                  alt={creator.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', getAvatarUrl(creator.name));
                  }}
                />
                <div className="min-w-0 w-full">
                  <h4 className="text-xs font-black text-slate-900 truncate font-['Outfit']">{creator.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{creator.agency || 'Indie'}</p>
                </div>
                {creator.chzzk_channel_id && (
                  <a
                    href={`https://chzzk.naver.com/${creator.chzzk_channel_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <span>치지직 채널</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. 하단 고정 앱 탭 바 (Dark + White Pill Active) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSubmitModal={() => onOpenSubmitModal()}
      />

      {/* 년/월 피커 모달 */}
      <YearMonthPickerModal
        isOpen={showYearMonthPicker}
        onClose={() => setShowYearMonthPicker(false)}
        currentYear={year}
        currentMonth={month}
        onSelectYearMonth={(y, m) => {
          setCurrentDate(new Date(y, m, 1));
          setShowYearMonthPicker(false);
        }}
      />
    </div>
  );
}

