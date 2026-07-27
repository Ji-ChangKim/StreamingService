import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { MonthlyCalendarGrid } from './components/MonthlyCalendarGrid';
import { FooterBanner } from './components/FooterBanner';
import { Footer } from './components/Footer';
import { StudioSubmitModal } from './components/StudioSubmitModal';
import { fetchWithVersion } from './config';
import { DebutEvent } from './types';
import { generateICSContent, triggerFileDownload } from './utils/dateUtils';
import { filterEventsByPlatform, filterEventsByQuery } from './utils/eventUtils';

export function App() {
  const [activeNav, setActiveNav] = useState<string>('schedule');
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
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  useEffect(() => {
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

  const handleDownloadICS = (evt: DebutEvent) => {
    const icsContent = generateICSContent(evt);
    triggerFileDownload(`V-DEBUT_${evt.creator.displayName}.ics`, icsContent);
  };

  const handleAddEvent = (newEvent: DebutEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Inter'] selection:bg-[#2563EB] selection:text-white">
      {/* 1. Header Bar */}
      <Navbar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onOpenSubmitModal={() => setShowSubmitModal(true)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-grow max-w-[1280px] w-full mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <HeroHeader
          totalDebutsThisMonth={filteredEvents.length}
          todayLiveCount={0}
          agencyDebutCount={1}
        />

        {/* Main Monthly Calendar Grid Section */}
        <MonthlyCalendarGrid
          events={filteredEvents}
          selectedTimezone={selectedTimezone}
          setSelectedTimezone={setSelectedTimezone}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onDownloadICS={handleDownloadICS}
        />

        {/* Creator Callout Banner */}
        <FooterBanner onOpenSubmitModal={() => setShowSubmitModal(true)} />
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Studio Submit Modal */}
      <StudioSubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmitSuccess={handleAddEvent}
      />
    </div>
  );
}
