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
  const [editingEvent, setEditingEvent] = useState<DebutEvent | null>(null);

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

  const handleEditEvent = (evt: DebutEvent) => {
    setEditingEvent(evt);
    setShowSubmitModal(true);
  };

  const handleUpdateEvent = (updatedEvt: DebutEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvt.id ? updatedEvt : e))
    );
    setEditingEvent(null);
  };

  const handleCloseModal = () => {
    setShowSubmitModal(false);
    setEditingEvent(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Inter'] selection:bg-[#2563EB] selection:text-white">
      {/* 1. Header Bar */}
      <Navbar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onOpenSubmitModal={() => {
          setEditingEvent(null);
          setShowSubmitModal(true);
        }}
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
          onOpenSubmitModal={() => {
            setEditingEvent(null);
            setShowSubmitModal(true);
          }}
          onEditEvent={handleEditEvent}
        />

        {/* Creator Callout Banner */}
        <FooterBanner onOpenSubmitModal={() => {
          setEditingEvent(null);
          setShowSubmitModal(true);
        }} />
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Studio Submit & Edit Modal */}
      <StudioSubmitModal
        isOpen={showSubmitModal}
        onClose={handleCloseModal}
        onSubmitSuccess={handleAddEvent}
        editEvent={editingEvent}
        onUpdateSuccess={handleUpdateEvent}
      />
    </div>
  );
}
