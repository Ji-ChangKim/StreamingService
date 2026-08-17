import { ArrowLeft, Mail, Sparkles, ShieldAlert, MessageSquare, Send } from 'lucide-react';
import { Language } from '../../utils/i18n';

interface ContactPageProps {
  onNavigateHome: () => void;
  onOpenSubmitModal?: () => void;
  currentLang?: Language;
}

export function ContactPage({ onNavigateHome, onOpenSubmitModal }: ContactPageProps) {
  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn text-[#0F172A]">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#64748B] hover:text-[#0F172A] transition-colors py-1.5 px-3 rounded-[6px] hover:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 메인 캘린더로 돌아가기
        </button>
      </div>

      {/* Hero Header */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-[16px] p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-['Outfit']">
            문의 및 제보 안내 (Contact Us)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            신입 데뷔 일정 등록, 정보 수정/삭제 요청, 기능 제안 안내입니다.
          </p>
        </div>
      </section>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. 신입 데뷔 일정 등록 */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-[8px] bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-[#0F172A]">신입 일정 등록</h2>
            <p className="text-xs text-[#475569] leading-relaxed">
              로그인 없이 누구나 신입 스트리머의 방송국 링크와 데뷔 일정을 10초 만에 등록할 수 있습니다.
            </p>
          </div>
          {onOpenSubmitModal && (
            <button
              onClick={onOpenSubmitModal}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-extrabold rounded-[8px] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> 일정 등록 폼 열기
            </button>
          )}
        </div>

        {/* 2. 크리에이터 정보 수정 / 삭제 */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-[#0F172A]">수정 / 삭제 요청</h2>
            <p className="text-xs text-[#475569] leading-relaxed">
              프로필 페이지에서 방송국 URL을 삭제 코드로 입력하여 즉시 삭제하거나, 메일로 수정을 요청할 수 있습니다.
            </p>
          </div>
          <a
            href="mailto:contact@vdebut.live?subject=[VDébut%20수정/삭제%20요청]"
            className="w-full py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] text-xs font-extrabold rounded-[8px] transition-all flex items-center justify-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-[#2563EB]" /> 메일 보내기
          </a>
        </div>

        {/* 3. 기타 제안 및 문의 */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-[8px] bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-[#0F172A]">기능 제안 / 문의</h2>
            <p className="text-xs text-[#475569] leading-relaxed">
              버그 제보나 사이트 개선 의견은 언제든지 이메일로 보내주시면 빠르게 반영하겠습니다.
            </p>
          </div>
          <a
            href="mailto:contact@vdebut.live?subject=[VDébut%20기능%20제안/문의]"
            className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold rounded-[8px] transition-all flex items-center justify-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" /> 이메일 문의하기
          </a>
        </div>
      </div>

      {/* Official Email Box */}
      <div className="p-4 bg-white rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm text-[#334155] space-y-1">
        <span className="font-bold text-[#0F172A]">공식 문의처: </span>
        <a href="mailto:contact@vdebut.live" className="text-[#2563EB] font-mono font-bold hover:underline">contact@vdebut.live</a>
      </div>
    </div>
  );
}
