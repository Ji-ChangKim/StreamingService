import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { HeroCountdownBanner } from './components/HeroCountdownBanner';
import { FilterBar } from './components/FilterBar';
import { CalendarView } from './components/CalendarView';
import { MonthlyCalendarGrid } from './components/MonthlyCalendarGrid';
import { StudioSubmitModal } from './components/StudioSubmitModal';
import { AdminQueue } from './components/AdminQueue';
import { CLIENT_VERSION, fetchWithVersion } from './config';
import { DebutEvent } from './types';
import { generateICSContent, triggerFileDownload } from './utils/dateUtils';
import { filterEventsByPlatform, filterEventsByQuery } from './utils/eventUtils';

export function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'studio' | 'admin'>('calendar');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
    } catch {
      return 'Asia/Seoul';
    }
  });

  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [events, setEvents] = useState<DebutEvent[]>([]);
  const [serverVersion, setServerVersion] = useState<string>('v0.1.0-latest');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [savedNotificationCount, setSavedNotificationCount] = useState<number>(0);

  useEffect(() => {
    fetchWithVersion('/system/version')
      .then((data) => {
        if (data?.serverVersion) setServerVersion(data.serverVersion);
      })
      .catch(() => {});

    fetchWithVersion('/events')
      .then((data) => {
        if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        } else {
          loadMockEvents();
        }
      })
      .catch(() => {
        loadMockEvents();
      });
  }, []);

  const loadMockEvents = () => {
    const now = new Date();
    const mockList: DebutEvent[] = [
      {
        id: 'evt-101',
        title: '나비야 첫 생방송 데뷔',
        type: 'FIRST_DEBUT',
        creator: {
          id: 'cr-101',
          displayName: '나비야 (Nabiya)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          agency: 'Indie',
          countryCode: 'KR',
          languages: ['ko', 'en'],
        },
        startAtUtc: new Date(now.getTime() + 2 * 3600000).toISOString(),
        originalTimezone: 'Asia/Seoul',
        status: 'PUBLISHED',
        verificationStatus: 'COMMUNITY_SUBMITTED',
        links: [{ platform: 'CHZZK', url: 'https://chzzk.naver.com/live', isPrimary: true }],
        description: '안녕하세요! 신입 버튜버 나비야입니다. 글로벌 시청자분들과 첫 데뷔 방송에서 만나요!',
      },
      {
        id: 'evt-102',
        title: '모카 숲(SOOP) 재데뷔 스테이지',
        type: 'REDEBUT',
        creator: {
          id: 'cr-102',
          displayName: '모카 (Moka)',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          agency: 'SOOP Stars',
          countryCode: 'KR',
          languages: ['ko'],
        },
        startAtUtc: new Date(now.getTime() + 18 * 3600000).toISOString(),
        originalTimezone: 'Asia/Seoul',
        status: 'PUBLISHED',
        verificationStatus: 'OFFICIAL_VERIFIED',
        links: [{ platform: 'SOOP', url: 'https://sooplive.co.kr', isPrimary: true }],
        description: 'SOOP 플랫폼에서 새롭게 시작하는 모카의 첫 이적 재데뷔 방송!',
      },
      {
        id: 'evt-103',
        title: 'Aria Eclipse Global Debut Special',
        type: 'FIRST_DEBUT',
        creator: {
          id: 'cr-103',
          displayName: 'Aria Eclipse',
          avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
          agency: 'V-PRO',
          countryCode: 'US',
          languages: ['en', 'ja'],
        },
        startAtUtc: new Date(now.getTime() + 42 * 3600000).toISOString(),
        originalTimezone: 'America/Los_Angeles',
        status: 'PUBLISHED',
        verificationStatus: 'OFFICIAL_VERIFIED',
        links: [{ platform: 'YOUTUBE', url: 'https://youtube.com', isPrimary: true }],
        description: 'V-PRO 소속 글로벌 아티스트 Aria의 첫 영/일 동시 데뷔 라이브 스트림!',
      },
      {
        id: 'evt-104',
        title: '루나 릴리 트위치 첫 무대',
        type: 'FIRST_DEBUT',
        creator: {
          id: 'cr-104',
          displayName: '루나 릴리 (Luna)',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          agency: 'Indie',
          countryCode: 'KR',
          languages: ['ko'],
        },
        startAtUtc: new Date(now.getTime() + 66 * 3600000).toISOString(),
        originalTimezone: 'Asia/Tokyo',
        status: 'PUBLISHED',
        verificationStatus: 'COMMUNITY_SUBMITTED',
        links: [{ platform: 'TWITCH', url: 'https://twitch.tv', isPrimary: true }],
        description: '노래와 소통 중심으로 찾아뵙는 루나 릴리의 트위치 첫 무대.',
      },
    ];
    setEvents(mockList);
  };

  const filteredEvents = filterEventsByQuery(
    filterEventsByPlatform(events, selectedPlatform),
    searchQuery
  );

  const nearestEvent = events.length > 0 ? events[0] : null;

  const handleDownloadICS = (evt: DebutEvent) => {
    const icsContent = generateICSContent(evt);
    triggerFileDownload(`V-DEBUT_${evt.creator.displayName}.ics`, icsContent);
    setSavedNotificationCount((prev) => prev + 1);
  };

  const handleAddEvent = (newEvent: DebutEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleApproveEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, verificationStatus: 'OFFICIAL_VERIFIED' } : e))
    );
  };

  const handleRejectEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#080808] flex flex-col font-['Inter'] selection:bg-[#080808] selection:text-white">
      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTimezone={selectedTimezone}
        setSelectedTimezone={setSelectedTimezone}
        onOpenSubmitModal={() => setShowSubmitModal(true)}
      />

      {/* 3-Column Sandwich Body Layout: SideL | Main | SideR */}
      <div className="flex-grow max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6">
        {/* SideL: Left Sidebar */}
        <SidebarLeft
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          savedNotificationCount={savedNotificationCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'calendar' && (
            <>
              <HeroCountdownBanner
                event={nearestEvent}
                selectedTimezone={selectedTimezone}
                onDownloadICS={handleDownloadICS}
              />

              <FilterBar
                selectedPlatform={selectedPlatform}
                setSelectedPlatform={setSelectedPlatform}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                totalCount={filteredEvents.length}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />

              {viewMode === 'GRID' ? (
                <MonthlyCalendarGrid
                  events={filteredEvents}
                  selectedTimezone={selectedTimezone}
                  onDownloadICS={handleDownloadICS}
                />
              ) : (
                <CalendarView
                  events={filteredEvents}
                  selectedTimezone={selectedTimezone}
                  onDownloadICS={handleDownloadICS}
                />
              )}
            </>
          )}

          {activeTab === 'admin' && (
            <AdminQueue
              events={events}
              onApproveEvent={handleApproveEvent}
              onRejectEvent={handleRejectEvent}
            />
          )}
        </main>

        {/* SideR: Right Sidebar */}
        <SidebarRight
          events={events}
          selectedTimezone={selectedTimezone}
          onOpenSubmitModal={() => setShowSubmitModal(true)}
        />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#D8D8D8] py-8 text-center text-xs text-[#5A5A5A]">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-normal">
            V-DEBUT HUB © 2026 • Visual Web Development Platform for Global VTubers
          </p>
          <div className="flex items-center gap-3 text-[11px] font-mono-timer text-[#898989]">
            <span>Client: {CLIENT_VERSION}</span>
            <span>•</span>
            <span>Server: {serverVersion}</span>
          </div>
        </div>
      </footer>

      {/* 10초 초간편 데뷔 제보 모달 */}
      <StudioSubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmitSuccess={handleAddEvent}
      />
    </div>
  );
}
