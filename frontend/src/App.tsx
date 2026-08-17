import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { MonthlyCalendarGrid } from './components/MonthlyCalendarGrid';
import { FooterBanner } from './components/FooterBanner';
import { Footer } from './components/Footer';
import { StudioSubmitModal } from './components/StudioSubmitModal';
import { CreatorProfilePage } from './components/profile/CreatorProfilePage';
import { AboutPage } from './components/pages/AboutPage';
import { GuidePage } from './components/pages/GuidePage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { TermsPage } from './components/pages/TermsPage';
import { ContactPage } from './components/pages/ContactPage';
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
      } else {
        setShowSubmitModal(false);
      }

      if (path === '/about') setActiveNav('about');
      else if (path === '/guide') setActiveNav('guide');
      else if (path === '/') setActiveNav('schedule');
    };
    window.addEventListener('popstate', handlePopState);

    // Initial mount check
    const initialPath = window.location.pathname;
    if (initialPath === '/upload') {
      setShowSubmitModal(true);
    } else if (initialPath === '/about') {
      setActiveNav('about');
    } else if (initialPath === '/guide') {
      setActiveNav('guide');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 언어 및 경로 변경 시 SEO Meta 태그 및 html lang 속성 동적 업데이트
  useEffect(() => {
    if (currentPath.startsWith('/creator/')) return; // 크리에이터 페이지의 경우 전용 SEO 유지

    const seo = SEO_DATA[currentLang];
    let pageTitle = seo.title;
    let pageDesc = seo.description;

    if (currentPath === '/upload') {
      pageTitle = '데뷔 일정 등록 | VDébut';
    } else if (currentPath === '/about') {
      pageTitle = '서비스 소개 | VDébut - 신입 버튜버 데뷔 캘린더 플랫폼';
      pageDesc = 'VDébut(브이데뷔)의 설립 미션과 치지직·SOOP·유튜브 버튜버 데뷔 일정 집계 및 창작자 지원 서비스를 소개합니다.';
    } else if (currentPath === '/guide') {
      pageTitle = '이용 가이드 & FAQ | VDébut';
      pageDesc = '신입 버튜버 데뷔 일정 10초 간편 등록법, 캘린더(.ics) 알림 연동 및 자주 묻는 질문(FAQ)을 확인하세요.';
    } else if (currentPath === '/privacy') {
      pageTitle = '개인정보처리방침 | VDébut';
      pageDesc = 'VDébut 개인정보처리방침 및 Google AdSense 광고 쿠키 정책 안내입니다.';
    } else if (currentPath === '/terms') {
      pageTitle = '서비스 이용약관 | VDébut';
      pageDesc = 'VDébut 서비스 이용약관 및 저작권, 면책 조항 안내입니다.';
    } else if (currentPath === '/contact') {
      pageTitle = '문의 및 제보 안내 | VDébut';
      pageDesc = 'VDébut 운영팀 문의, 일정 수정 및 삭제 요청, 비즈니스 제휴 안내입니다.';
    }

    document.title = pageTitle;
    document.documentElement.lang = currentLang;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDesc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);
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

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    if (path === '/about') setActiveNav('about');
    else if (path === '/guide') setActiveNav('guide');
    else if (path === '/') setActiveNav('schedule');
    else setActiveNav('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCreatorPage = currentPath.startsWith('/creator/');
  const creatorSlug = isCreatorPage ? currentPath.replace('/creator/', '').split('/')[0] : '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Inter'] selection:bg-[#2563EB] selection:text-white">
      {/* 1. Desktop Header Bar */}
      <Navbar
        activeNav={activeNav}
        setActiveNav={(nav) => {
          setActiveNav(nav);
          if (nav === 'schedule') handleNavigate('/');
          else if (nav === 'about') handleNavigate('/about');
          else if (nav === 'guide') handleNavigate('/guide');
        }}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenSubmitModal={() => handleOpenSubmitModal()}
      />

      {/* 2. Main Content Container */}
      <main className="flex-grow max-w-[1280px] w-full mx-auto px-0 sm:px-6">
        {isCreatorPage && creatorSlug ? (
          <CreatorProfilePage
            slug={creatorSlug}
            onNavigateHome={() => handleNavigate('/')}
            currentLang={currentLang}
          />
        ) : currentPath === '/about' ? (
          <AboutPage
            onNavigateHome={() => handleNavigate('/')}
            currentLang={currentLang}
          />
        ) : currentPath === '/guide' ? (
          <GuidePage
            onNavigateHome={() => handleNavigate('/')}
            onOpenSubmitModal={() => handleOpenSubmitModal()}
            currentLang={currentLang}
          />
        ) : currentPath === '/privacy' ? (
          <PrivacyPage
            onNavigateHome={() => handleNavigate('/')}
            currentLang={currentLang}
          />
        ) : currentPath === '/terms' ? (
          <TermsPage
            onNavigateHome={() => handleNavigate('/')}
            currentLang={currentLang}
          />
        ) : currentPath === '/contact' ? (
          <ContactPage
            onNavigateHome={() => handleNavigate('/')}
            onOpenSubmitModal={() => handleOpenSubmitModal()}
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
              <FooterBanner onOpenSubmitModal={() => handleOpenSubmitModal()} currentLang={currentLang} />
            </div>
          </>
        )}
      </main>

      {/* 3. Footer */}
      <Footer currentLang={currentLang} onNavigate={handleNavigate} />

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
