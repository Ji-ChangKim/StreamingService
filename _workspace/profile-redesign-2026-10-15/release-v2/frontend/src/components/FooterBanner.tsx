import { Language, UI_TRANSLATIONS } from '../utils/i18n';

interface FooterBannerProps {
  onOpenSubmitModal: () => void;
  currentLang?: Language;
}

export function FooterBanner({ onOpenSubmitModal, currentLang = 'ko' }: FooterBannerProps) {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.ko;

  return (
    <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-[16px] p-6 sm:p-8 my-10 shadow-lg relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-[#2563EB]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2 text-left">
          <div className="text-[10px] font-extrabold tracking-widest text-[#60A5FA] uppercase font-mono">
            {t.forCreators || 'FOR NEW VTUBERS & CREATORS'}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-['Outfit']">
            {t.bannerTitle || '곧 신입 버튜버 데뷔를 준비하고 있나요?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            {t.bannerDesc || '데뷔 날짜, 치지직·SOOP·유튜브 방송 채널, X(트위터) 공지 링크를 등록하시면 검토 후 VDébut 데뷔 캘린더에 정식 소개됩니다.'}
          </p>
        </div>

        <button
          onClick={onOpenSubmitModal}
          className="bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-extrabold px-5 py-3 rounded-[10px] transition-all shadow-md shrink-0 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        >
          {t.submitButton || '버튜버 데뷔 일정 등록'} <span className="text-sm">↗</span>
        </button>
      </div>
    </div>
  );
}


