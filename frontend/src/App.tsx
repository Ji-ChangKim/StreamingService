import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { MonthlyCalendarGrid } from './components/MonthlyCalendarGrid';
import { FooterBanner } from './components/FooterBanner';
import { Footer } from './components/Footer';
import { StudioSubmitModal } from './components/StudioSubmitModal';
import { CreatorProfilePage } from './components/profile/CreatorProfilePage';
import { DebutEvent } from './types';
import { fetchDebutEvents } from './services/eventService';
import { generateICSContent, triggerFileDownload } from './utils/dateUtils';
import { filterEventsByPlatform, filterEventsByQuery } from './utils/eventUtils';
import { Language, SEO_DATA } from './utils/i18n';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
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

  // Popstate event listener for client-side routing & /upload URL sync
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      if (path === '/upload') {
        setShowSubmitModal(true);
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Initial mount check for /upload path
    if (window.location.pathname === '/upload') {
      setShowSubmitModal(true);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 언어 변경 시 SEO Meta 태그 및 html lang 속성 동적 업데이트
  useEffect(() => {
    if (currentPath.startsWith('/creator/')) return; // 크리에이터 페이지의 경우 전용 SEO 유지

    const seo = SEO_DATA[currentLang];
    document.title = currentPath === '/upload' ? '데뷔 일정 등록 | VDébut' : seo.title;
    document.documentElement.lang = currentLang;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', seo.description);

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', seo.keywords);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', currentPath === '/upload' ? '데뷔 일정 등록 | VDébut' : seo.ogTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', seo.ogDescription);
  }, [currentLang, currentPath]);

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
    if (window.location.pathname !== '/upload') {
      window.history.pushState(null, '', '/upload');
      setCurrentPath('/upload');
    }
  };

  const handleEditEvent = (evt: DebutEvent) => {
    setEditingEvent(evt);
    setSubmitModalInitialDate(undefined);
    setShowSubmitModal(true);
    if (window.location.pathname !== '/upload') {
      window.history.pushState(null, '', '/upload');
      setCurrentPath('/upload');
    }
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
    if (window.location.pathname === '/upload') {
      window.history.pushState(null, '', '/');
      setCurrentPath('/');
    }
  };

  const handleNavigateHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  const isCreatorPage = currentPath.startsWith('/creator/');
  const creatorSlug = isCreatorPage ? currentPath.replace('/creator/', '').split('/')[0] : '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Inter'] selection:bg-[#2563EB] selection:text-white">
      {/* 1. Desktop Header Bar (sm:block) */}
      <div className="hidden sm:block">
        <Navbar
          activeNav={activeNav}
          setActiveNav={(nav) => {
            setActiveNav(nav);
            if (currentPath !== '/') {
              handleNavigateHome();
            }
          }}
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          onOpenSubmitModal={() => handleOpenSubmitModal()}
        />
      </div>

      {/* 2. Main Content Container */}
      <main className="flex-grow max-w-[1280px] w-full mx-auto px-0 sm:px-6">
        {isCreatorPage && creatorSlug ? (
          <CreatorProfilePage
            slug={creatorSlug}
            onNavigateHome={handleNavigateHome}
            currentLang={currentLang}
          />
        ) : (
          <>
            {/* Hero Section (Desktop only) */}
            <div className="hidden sm:block">
              <HeroHeader
                allEvents={events}
                selectedTimezone={selectedTimezone}
                currentLang={currentLang}
              />
            </div>

            {/* Main Monthly / Mobile Calendar Grid Section */}
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

            {/* Creator Callout Banner (Desktop only) */}
            <div className="hidden sm:block">
              <FooterBanner onOpenSubmitModal={() => handleOpenSubmitModal()} />
            </div>
          </>
        )}
      </main>

      {/* 3. Footer (Desktop only) */}
      <div className="hidden sm:block">
        <Footer />
      </div>

      {/* 4. Studio Submit & Edit Modal */}
      <StudioSubmitModal
        isOpen={showSubmitModal}
        onClose={handleCloseModal}
        onSubmitSuccess={handleAddEvent}
        editEvent={editingEvent}
        initialDate={submitModalInitialDate}
        onUpdateSuccess={handleUpdateEvent}
        currentLang={currentLang}
      />
    </div>
  );
}
