import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { MonthlyCalendarGrid } from './components/MonthlyCalendarGrid';
import { FooterBanner } from './components/FooterBanner';
import { Footer } from './components/Footer';
import { StudioSubmitModal } from './components/StudioSubmitModal';
import { DebutEvent } from './types';
import { fetchDebutEvents } from './services/eventService';
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
    fetchDebutEvents().then(setEvents);
  }, []);

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
          allEvents={events}
          selectedTimezone={selectedTimezone}
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
          onOpenSubmitModal={() => setShowSubmitModal(true)}
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
