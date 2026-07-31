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
import { Language, SEO_DATA } from './utils/i18n';

export function App() {
  const [activeNav, setActiveNav] = useState<string>('schedule');
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang')?.toLowerCase();
      if (langParam === 'ja' || langParam === 'en' || langParam === 'ko') {
        return langParam as Language;
      }
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('ja')) return 'ja';
      if (navLang.startsWith('en')) return 'en';
      return 'ko';
    } catch {
      return 'ko';
    }
  });

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
  const [submitModalInitialDate, setSubmitModalInitialDate] = useState<string | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<DebutEvent | null>(null);

  // 언어 변경 시 SEO Meta 태그 및 html lang 속성 동적 업데이트
  useEffect(() => {
    const seo = SEO_DATA[currentLang];
    document.title = seo.title;
    document.documentElement.lang = currentLang;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', seo.description);

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', seo.keywords);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', seo.ogTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', seo.ogDescription);
  }, [currentLang]);

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

  const handleOpenSubmitModal = (dateStr?: string) => {
    setEditingEvent(null);
    setSubmitModalInitialDate(dateStr);
    setShowSubmitModal(true);
  };

  const handleEditEvent = (evt: DebutEvent) => {
    setEditingEvent(evt);
    setSubmitModalInitialDate(undefined);
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
    setSubmitModalInitialDate(undefined);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Inter'] selection:bg-[#2563EB] selection:text-white">
      {/* 1. Header Bar */}
      <Navbar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenSubmitModal={() => handleOpenSubmitModal()}
      />

      {/* 2. Main Content Container */}
      <main className="flex-grow max-w-[1280px] w-full mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <HeroHeader
          allEvents={events}
          selectedTimezone={selectedTimezone}
          currentLang={currentLang}
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
          onOpenSubmitModal={handleOpenSubmitModal}
          onEditEvent={handleEditEvent}
        />

        {/* Creator Callout Banner */}
        <FooterBanner onOpenSubmitModal={() => handleOpenSubmitModal()} />
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Studio Submit & Edit Modal */}
      <StudioSubmitModal
        isOpen={showSubmitModal}
        onClose={handleCloseModal}
        onSubmitSuccess={handleAddEvent}
        editEvent={editingEvent}
        initialDate={submitModalInitialDate}
        onUpdateSuccess={handleUpdateEvent}
      />
    </div>
  );
}
