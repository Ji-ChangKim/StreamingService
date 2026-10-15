import React from 'react';
import { Language, UI_TRANSLATIONS } from '../../utils/i18n';

interface ErrorPageProps {
  code?: string | number;
  message?: string;
  onNavigateHome: () => void;
  currentLang?: Language;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  code = '404',
  message,
  onNavigateHome,
  currentLang = 'ko'
}) => {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.ko;

  const isNotFound = String(code) === '404';
  const defaultDesc = isNotFound ? t.errorPageDesc404 : t.errorPageDescGeneral;
  const displayMessage = message || defaultDesc;

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* 배경 무대 및 은은한 방사형 글로우 효과 */}
      <div 
        className="absolute inset-0 bg-cover bg-center sm:bg-bottom bg-no-repeat opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/images/spotlight_stage_bg.png')" }}
      />
      <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />

      {/* 중앙 에러 카드 (글래스모피즘) */}
      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-900/10 text-center flex flex-col items-center animate-fade-in">
        {/* 아이콘 원형 배지 */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-300/40 flex items-center justify-center shadow-inner">
            {isNotFound ? (
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-md">
            {code}
          </span>
        </div>

        {/* 타이틀 및 에러 설명 */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
          {t.errorPageTitle}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mb-4">
          {displayMessage}
        </p>

        {/* 오류 코드 안내 박스 */}
        <div className="w-full bg-slate-100/80 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-mono text-slate-500 mb-8 flex items-center justify-center gap-2">
          <span className="font-semibold text-slate-700">{t.errorCodePrefix}:</span>
          <span className="text-blue-600 font-bold">{code}</span>
        </div>

        {/* 액션 버튼 그룹 (새로고침 & 홈으로) */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleReload}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{t.btnReload}</span>
          </button>
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{t.btnHome}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
