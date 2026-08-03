import { useState, useEffect } from 'react';
import { DebutEvent } from '../types';
import { getCalendarGridCells, buildEventsByDateMap, getTodayDateKey } from '../utils/calendarUtils';
import { CalendarControlBar } from './calendar/CalendarControlBar';
import { CalendarMonthGrid } from './calendar/CalendarMonthGrid';
import { CalendarWeekGrid } from './calendar/CalendarWeekGrid';
import { ScheduleInspectorPanel } from './calendar/ScheduleInspectorPanel';
import { ProfileLightboxModal } from './calendar/ProfileLightboxModal';
import { YearMonthPickerModal } from './calendar/YearMonthPickerModal';
import { MobileAppLayout } from './mobile/MobileAppLayout';

interface MonthlyCalendarGridProps {
  events: DebutEvent[];
  selectedTimezone: string;
  setSelectedTimezone: (tz: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (p: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onDownloadICS: (event: DebutEvent) => void;
  onOpenSubmitModal?: (dateStr?: string) => void;
  onEditEvent?: (event: DebutEvent) => void;
}

export function MonthlyCalendarGrid({
  events,
  selectedTimezone,
  selectedPlatform,
  setSelectedPlatform,
  searchQuery,
  setSearchQuery,
  onDownloadICS,
  onOpenSubmitModal,
  onEditEvent,
}: MonthlyCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week'>('month');
  const [showYearMonthPicker, setShowYearMonthPicker] = useState<boolean>(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<{ url: string; name: string } | null>(null);

  // 스케줄 상세 모달 오픈 시 배경 메인 페이지 스크롤 고정 (Body Scroll Lock)
  useEffect(() => {
    if (selectedDateStr) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedDateStr]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    if (currentView === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const handleNextMonth = () => {
    if (currentView === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  const calendarCells = getCalendarGridCells(year, month);
  const eventsByDateMap = buildEventsByDateMap(events, selectedTimezone);
  const todayStr = getTodayDateKey(selectedTimezone);

  const currentSelectedEvents = selectedDateStr
    ? (eventsByDateMap.get(selectedDateStr) || []).sort(
        (a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
      )
    : [];

  return (
    <>
      {/* 📱 1. 스마트폰/모바일 화면 전용 네이티브 캘린더 APP 레이아웃 (<640px) */}
      <div className="block sm:hidden">
        <MobileAppLayout
          events={events}
          selectedTimezone={selectedTimezone}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onDownloadICS={onDownloadICS}
          onOpenSubmitModal={onOpenSubmitModal || (() => {})}
          currentLang="ko"
          eventsByDateMap={eventsByDateMap}
          todayStr={todayStr}
        />
      </div>

      {/* 🖥️ 2. 데스크탑 / 대형 화면 전용 레이아웃 (>=640px) */}
      <div className="hidden sm:block space-y-4 mb-8">
        {/* Main Container */}
        <div className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-3 sm:p-5 flex flex-col justify-between">
          <CalendarControlBar
            year={year}
            month={month}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            selectedPlatform={selectedPlatform}
            onPlatformSelect={setSelectedPlatform}
            currentView={currentView}
            onChangeView={setCurrentView}
            onOpenYearMonthPicker={() => setShowYearMonthPicker(true)}
          />

          {currentView === 'month' ? (
            <CalendarMonthGrid
              year={year}
              month={month}
              calendarCells={calendarCells}
              eventsByDateMap={eventsByDateMap}
              selectedTimezone={selectedTimezone}
              selectedDateStr={selectedDateStr || ''}
              todayStr={todayStr}
              onSelectDate={(dateStr) => setSelectedDateStr(dateStr)}
            />
          ) : (
            <CalendarWeekGrid
              currentDate={currentDate}
              eventsByDateMap={eventsByDateMap}
              selectedTimezone={selectedTimezone}
              selectedDateStr={selectedDateStr || ''}
              todayStr={todayStr}
              onSelectDate={(dateStr) => setSelectedDateStr(dateStr)}
            />
          )}
        </div>

        {/* 우측 슬라이드-오버 드로어 모달 */}
        {selectedDateStr && (
          <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => setSelectedDateStr(null)}
            />

            <div className="relative z-10 w-full max-w-full sm:max-w-[480px] bg-white h-full max-h-screen shadow-2xl flex flex-col p-4 sm:p-6 animate-slideLeft border-l border-[#E2E8F0] overflow-hidden">
              <ScheduleInspectorPanel
                selectedDateStr={selectedDateStr}
                events={currentSelectedEvents}
                selectedTimezone={selectedTimezone}
                onOpenSubmitModal={onOpenSubmitModal}
                onDownloadICS={onDownloadICS}
                onClosePanel={() => setSelectedDateStr(null)}
                onEditEvent={onEditEvent}
              />
            </div>
          </div>
        )}

        <ProfileLightboxModal
          previewAvatar={previewAvatar}
          onClose={() => setPreviewAvatar(null)}
        />

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
    </>
  );
}
