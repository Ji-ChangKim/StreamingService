import { useState } from 'react';
import { DebutEvent } from '../types';
import { getCalendarGridCells, buildEventsByDateMap, getTodayDateKey } from '../utils/calendarUtils';
import { CalendarControlBar } from './calendar/CalendarControlBar';
import { CalendarMonthGrid } from './calendar/CalendarMonthGrid';
import { ScheduleInspectorPanel } from './calendar/ScheduleInspectorPanel';
import { ProfileLightboxModal } from './calendar/ProfileLightboxModal';
import { AdBannerSlot } from './calendar/AdBannerSlot';

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
  onOpenSubmitModal,
}: MonthlyCalendarGridProps) {
  const ENABLE_ADS = false;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showIndieOnly, setShowIndieOnly] = useState<boolean>(false);
  // 처음 진입 시 캘린더가 전면에 100% 나오며, 일자 클릭 시에만 패널이 오픈됨
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<{ url: string; name: string } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  const filteredEvents = showIndieOnly
    ? events.filter((e) => e.creator.agency.toLowerCase().includes('indie') || e.creator.agency === '개인세')
    : events;

  const calendarCells = getCalendarGridCells(year, month);
  const eventsByDateMap = buildEventsByDateMap(filteredEvents, selectedTimezone);
  const todayStr = getTodayDateKey(selectedTimezone);

  const currentSelectedEvents = selectedDateStr
    ? (eventsByDateMap.get(selectedDateStr) || []).sort(
        (a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
      )
    : [];

  const handleChangeTimezone = () => {
    const tz = prompt('시간대 입력 (예: Asia/Seoul, UTC)', selectedTimezone);
    if (tz) setSelectedTimezone(tz);
  };

  return (
    <div className="space-y-4 mb-8">
      <AdBannerSlot zone="ZONE1_TOP" enableAds={ENABLE_ADS} />

      {/* Main Container: selectedDateStr 유무에 따라 100% 전면 뷰 ↔ Split 패널 뷰 전환 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 transition-all">
        {/* Calendar View: 선택된 날짜가 없을 땐 12Cols (100% 전면), 선택되었을 땐 7Cols */}
        <div
          className={`${
            selectedDateStr ? 'lg:col-span-7' : 'lg:col-span-12'
          } bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-5 flex flex-col justify-between transition-all`}
        >
          <div>
            <CalendarControlBar
              year={year}
              month={month}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedPlatform={selectedPlatform}
              onPlatformSelect={setSelectedPlatform}
              showIndieOnly={showIndieOnly}
              onToggleIndieOnly={() => setShowIndieOnly(!showIndieOnly)}
              selectedTimezone={selectedTimezone}
              onChangeTimezone={handleChangeTimezone}
            />

            <CalendarMonthGrid
              year={year}
              month={month}
              calendarCells={calendarCells}
              eventsByDateMap={eventsByDateMap}
              selectedDateStr={selectedDateStr || ''}
              todayStr={todayStr}
              onSelectDate={(dateStr) => setSelectedDateStr(dateStr)}
            />
          </div>
        </div>

        {/* Side Inspector Panel Modal/Panel: selectedDateStr가 있을 때만 우측에 노출 */}
        {selectedDateStr && (
          <div className="lg:col-span-5 bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-5 flex flex-col justify-between animate-fadeIn">
            <div>
              <AdBannerSlot zone="ZONE2_PINNED" enableAds={ENABLE_ADS} />

              <ScheduleInspectorPanel
                selectedDateStr={selectedDateStr}
                events={currentSelectedEvents}
                selectedTimezone={selectedTimezone}
                onOpenSubmitModal={onOpenSubmitModal}
                onDownloadICS={onDownloadICS}
                onPreviewAvatar={(url, name) => setPreviewAvatar({ url, name })}
                onClosePanel={() => setSelectedDateStr(null)}
              />
            </div>

            <AdBannerSlot zone="ZONE4_STICKY" enableAds={ENABLE_ADS} />
          </div>
        )}
      </div>

      <ProfileLightboxModal
        previewAvatar={previewAvatar}
        onClose={() => setPreviewAvatar(null)}
      />
    </div>
  );
}
