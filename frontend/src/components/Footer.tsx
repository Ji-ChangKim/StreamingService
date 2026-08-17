import { Language, UI_TRANSLATIONS } from '../utils/i18n';

interface FooterProps {
  currentLang?: Language;
  onNavigate?: (path: string) => void;
}

export function Footer({ currentLang = 'ko', onNavigate }: FooterProps) {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.ko;

  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <footer className="bg-white border-t border-[#E2E8F0] py-10 text-xs text-[#64748B] mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#F1F5F9]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="VDébut Logo" className="h-7 w-auto object-contain" />
              <span className="text-[11px] text-[#94A3B8]">|</span>
              <span className="text-xs font-bold text-[#0F172A]">신입 버튜버 데뷔 일정 통합 캘린더</span>
            </div>
            <p className="text-[11px] text-[#64748B] max-w-xl">
              {t.footerDesc || '새로운 버튜버의 첫 무대를 가장 먼저 만나보는 글로벌 캘린더 플랫폼입니다. 치지직, SOOP, 유튜브 버츄얼 스트리머의 데뷔 일정을 실시간으로 집계합니다.'}
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold">
            <a
              href="/about"
              onClick={(e) => handleLinkClick('/about', e)}
              className="text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              {t.aboutTab || '서비스 소개'}
            </a>
            <a
              href="/guide"
              onClick={(e) => handleLinkClick('/guide', e)}
              className="text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              {t.guideTab || '이용 가이드 & FAQ'}
            </a>
            <a
              href="/privacy"
              onClick={(e) => handleLinkClick('/privacy', e)}
              className="text-[#475569] hover:text-[#2563EB] transition-colors font-extrabold text-[#0F172A]"
            >
              {t.privacyTab || '개인정보처리방침'}
            </a>
            <a
              href="/terms"
              onClick={(e) => handleLinkClick('/terms', e)}
              className="text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              {t.termsTab || '이용약관'}
            </a>
            <a
              href="/contact"
              onClick={(e) => handleLinkClick('/contact', e)}
              className="text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              {t.contactTab || '문의하기'}
            </a>
          </div>
        </div>

        {/* Brand Compliance & Copyright Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#94A3B8]">
          <p>
            치지직, SOOP, YouTube, Twitch 등 각 플랫폼 로고 및 크리에이터 창작물의 저작권은 해당 권리자에게 있습니다.
          </p>
          <div className="font-medium text-[#64748B]">
            © 2026 VDebut. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

