import { useState } from 'react';
import { DebutEvent } from '../types';
import { getCalendarGridCells, buildEventsByDateMap, getTodayDateKey } from '../utils/calendarUtils';
import { CalendarControlBar } from './calendar/CalendarControlBar';
import { CalendarMonthGrid } from './calendar/CalendarMonthGrid';
import { CalendarWeekGrid } from './calendar/CalendarWeekGrid';
import { ScheduleInspectorPanel } from './calendar/ScheduleInspectorPanel';
import { ProfileLightboxModal } from './calendar/ProfileLightboxModal';
import { YearMonthPickerModal } from './calendar/YearMonthPickerModal';

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
  selectedPlatform,
  setSelectedPlatform,
  onDownloadICS,
  onOpenSubmitModal,
}: MonthlyCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week'>('month');
  const [showYearMonthPicker, setShowYearMonthPicker] = useState<boolean>(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<{ url: string; name: string } | null>(null);

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
    <div className="space-y-4 mb-8">
      {/* Main Container: 캘린더 그리드는 항시 100% 레이아웃 (col-span-12) 유지 */}
      <div className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-xs p-4 sm:p-5 flex flex-col justify-between">
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

      {/* 📌 우측 슬라이드-오버 모달 뷰 (Right Slide-over Modal View) */}
      {selectedDateStr && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* 1. 반투명 딤드 오버레이 (Dimmed Backdrop) -> 클릭 시 모달 닫힘 & 기존 화면 상호작용 제한 */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setSelectedDateStr(null)}
          />

          {/* 2. 우측 슬라이드-오버 창 (Slide-over Drawer Modal Window) */}
          <div className="relative z-10 w-full max-w-[480px] bg-white h-full shadow-2xl flex flex-col p-5 sm:p-6 overflow-y-auto animate-slideLeft border-l border-[#E2E8F0]">
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
        </div>
      )}

      {/* Lightbox & YearMonth Picker Modals */}
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
  );
}
