import { Language, UI_TRANSLATIONS } from '../utils/i18n';

interface FooterProps {
  currentLang?: Language;
}

export function Footer({ currentLang = 'ko' }: FooterProps) {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.ko;

  return (
    <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-8 text-xs text-[#64748B]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="VDébut Logo" className="h-7 w-auto object-contain" />
          <span className="text-[11px] text-[#94A3B8]">|</span>
          <p className="text-[11px]">{t.footerDesc || '새로운 버튜버의 첫 무대를 가장 먼저 만나보는 글로벌 캘린더 플랫폼입니다.'}</p>
        </div>

        <div className="text-[11px] font-medium text-[#64748B]">
          © 2026 VDebut. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

