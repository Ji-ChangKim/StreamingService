import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { PlatformMiniSpotlight } from './components/preview/PlatformMiniSpotlight';
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
import { AdminCmsPage } from './components/pages/AdminCmsPage';
import { DebutEvent } from './types';
import { fetchDebutEvents } from './services/eventService';
import { generateICSContent, triggerFileDownload } from './utils/dateUtils';
import { filterEventsByPlatform, filterEventsByQuery, filterEventsByCountry } from './utils/eventUtils';
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
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [events, setEvents] = useState<DebutEvent[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [submitModalInitialDate, setSubmitModalInitialDate] = useState<string | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<DebutEvent | null>(null);

  // 개발 프리뷰 모드 감지 (dev.vdebut.live 도메인 또는 /updatepage 경로)
  const isDevHost = typeof window !== 'undefined' && window.location.hostname === 'dev.vdebut.live';
  const isUpdatePath = currentPath === '/updatepage' || currentPath === '/upadepage';

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

    if (isDevHost) {
      pageTitle = '[DEV] VDébut - 컴포넌트 랩 (Live DB)';
      let metaRobots = document.querySelector('meta[name="robots"]');
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow, noarchive');
    } else if (currentPath === '/upload') {
      pageTitle = '데뷔 일정 등록 | VDébut';
    } else if (currentPath === '/about') {
      pageTitle = '서비스 소개 | VDébut - 신입 버튜버 데뷔 캘린더 플랫폼';
      pageDesc = 'VDébut(브이데뷔)의 설립 미션과 치지직·SOOP·유튜브 버튜버 데뷔 일정 집계 및 창작자 지원 서비스를 소개합니다.';
    } else if (currentPath === '/guide') {
      pageTitle = '이용 가이드 & FAQ | VDébut';
      pageDesc = '신입 버튜버 데뷔 일정 10초 간편 등록법, 캘린더(.ics) 알림 연동 및 자주 묻는 질문(FAQ)을 확인하세요.';
    } else if (currentPath === '/privacy') {
      pageTitle = '개인정보처리방침 | VDébut';
      pageDesc = 'VDébut의 개인정보처리방침 및 이용자 데이터 보호 정책 안내입니다.';
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
    filterEventsByCountry(
      filterEventsByPlatform(events, selectedPlatform),
      selectedCountry
    ),
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

      {/* 1-1. 3D 무대 스포트라이트 쇼케이스 섹션 (Live & Dev 메인 홈 전면 적용) */}
      {!isCreatorPage && (currentPath === '/' || isUpdatePath) && (
        <section
          aria-label="Stage Showcase"
          className="w-full relative bg-[url('/images/spotlight_stage_bg.png')] bg-cover bg-center sm:bg-bottom bg-no-repeat overflow-hidden"
        >
          {/* DEV 환경 전용 안내 바 (dev.vdebut.live 접속 시에만 표시) */}
          {isDevHost && (
            <div className="bg-amber-500/15 backdrop-blur-xs border-b border-amber-300/60 px-4 py-2 text-center text-xs font-bold text-amber-950 flex items-center justify-center gap-2">
              <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                DEV LAB
              </span>
              <span>
                dev.vdebut.live 프리뷰 모드 (Live DB 실시간 연동 • SEO/크롤링 차단됨)
              </span>
            </div>
          )}

          <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 pt-4 pb-6 sm:pb-8 relative z-10">
            {/* Hero Section (Desktop only) */}
            <div className="hidden sm:block">
              <HeroHeader
                allEvents={events}
                selectedTimezone={selectedTimezone}
                currentLang={currentLang}
              />
            </div>

            {/* 신규 플랫폼별 컴팩트 스포트라이트 (무대 배경 일체형) */}
            <PlatformMiniSpotlight
              allEvents={events}
              selectedTimezone={selectedTimezone}
              onDownloadICS={handleDownloadICS}
              onNavigate={handleNavigate}
            />
          </div>

          {/* 하단 본문(#F8FAFC) 연결 페이드 그라데이션 오버레이 (경계선 그림자 제거 및 스무스 블렌딩) */}
          <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-36 pointer-events-none bg-gradient-to-b from-transparent via-[#F8FAFC]/50 to-[#F8FAFC] z-10" />
        </section>
      )}

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
        ) : currentPath === '/admin' ? (
          <AdminCmsPage
            onNavigateHome={() => handleNavigate('/')}
          />
        ) : (
          <>
            {/* Main Monthly / Mobile Calendar Grid Section */}
            <div className="mt-6 sm:mt-8">
              <MonthlyCalendarGrid
                events={filteredEvents}
                selectedTimezone={selectedTimezone}
                setSelectedTimezone={setSelectedTimezone}
                selectedPlatform={selectedPlatform}
                setSelectedPlatform={setSelectedPlatform}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onDownloadICS={handleDownloadICS}
                onOpenSubmitModal={handleOpenSubmitModal}
                onEditEvent={handleEditEvent}
              />
            </div>

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
