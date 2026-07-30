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
  // 광고 활성화 제어 플래그
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

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  // 1. 개인세 필터링
  const filteredEvents = showIndieOnly
    ? events.filter((e) => e.creator.agency.toLowerCase().includes('indie') || e.creator.agency === '개인세')
    : events;

  // 2. 날짜 셀 및 데뷔 이벤트 Map 계산
  const calendarCells = getCalendarGridCells(year, month);
  const eventsByDateMap = buildEventsByDateMap(filteredEvents, selectedTimezone);
  const todayStr = getTodayDateKey(selectedTimezone);

  // 3. 선택 날짜의 스케줄 리스트 정렬
  const currentSelectedEvents = (eventsByDateMap.get(selectedDateStr) || []).sort(
    (a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
  );

  const handleChangeTimezone = () => {
    const tz = prompt('시간대 입력 (예: Asia/Seoul, UTC)', selectedTimezone);
    if (tz) setSelectedTimezone(tz);
  };

  return (
    <div className="space-y-4 mb-8">
      {/* 🎯 ZONE 1: 상단 와이드 광고 배너 슬롯 */}
      <AdBannerSlot zone="ZONE1_TOP" enableAds={ENABLE_ADS} />

      {/* Main Split Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 Cols): Calendar View Container */}
        <div className="lg:col-span-7 bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Top Controls & Search Bar */}
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

            {/* Fixed Height Month Grid */}
            <CalendarMonthGrid
              year={year}
              month={month}
              calendarCells={calendarCells}
              eventsByDateMap={eventsByDateMap}
              selectedDateStr={selectedDateStr}
              todayStr={todayStr}
              onSelectDate={setSelectedDateStr}
            />
          </div>
        </div>

        {/* Right (5 Cols): Side Inspector Panel Container */}
        <div className="lg:col-span-5 bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* 🎯 ZONE 2: 사이드 패널 상단 Pinned 광고 */}
            <AdBannerSlot zone="ZONE2_PINNED" enableAds={ENABLE_ADS} />

            {/* Schedule Inspector Panel */}
            <ScheduleInspectorPanel
              selectedDateStr={selectedDateStr}
              events={currentSelectedEvents}
              selectedTimezone={selectedTimezone}
              onOpenSubmitModal={onOpenSubmitModal}
              onDownloadICS={onDownloadICS}
              onPreviewAvatar={(url, name) => setPreviewAvatar({ url, name })}
            />
          </div>

          {/* 🎯 ZONE 4: 사이드 패널 하단 스티키 광고 */}
          <AdBannerSlot zone="ZONE4_STICKY" enableAds={ENABLE_ADS} />
        </div>
      </div>

      {/* Profile Image Lightbox Modal */}
      <ProfileLightboxModal
        previewAvatar={previewAvatar}
        onClose={() => setPreviewAvatar(null)}
      />
    </div>
  );
}
