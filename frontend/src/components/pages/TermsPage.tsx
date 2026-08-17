import { ArrowLeft, Scale, FileText, CheckCircle2 } from 'lucide-react';
import { Language } from '../../utils/i18n';

interface TermsPageProps {
  onNavigateHome: () => void;
  currentLang?: Language;
}

export function TermsPage({ onNavigateHome }: TermsPageProps) {
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
            서비스 이용약관 (Terms of Service)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            최종 업데이트: 2026년 8월 17일
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-8 text-xs sm:text-sm text-[#334155] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            1. 서비스 이용 목적
          </h2>
          <p>
            VDébut은 신입 버츄얼 스트리머(VTuber)의 첫 방송 일정을 수집·정리하여 시청자와 팬들에게 편의를 제공하는 비영리 독립 캘린더 서비스입니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
            2. 지적재산권 및 브랜드 정책 준수
          </h2>
          <p>
            • 스트리머의 캐릭터 이미지, 아바타, 프로필 텍스트, 방송 링크에 대한 모든 저작권은 해당 크리에이터 및 원저작권자에게 있습니다.<br />
            • 치지직, SOOP, YouTube, Twitch 등 각 플랫폼 공식 로고와 상표는 해당 기업의 고유 자산이며, 본 서비스는 출처 식별 목적으로만 사용합니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            3. 일정 제보 시 주의사항
          </h2>
          <p>
            • 허위 사실, 타인의 명의를 도용한 장난성 등록, 부적절한 링크 제보는 관리자에 의해 통보 없이 삭제될 수 있습니다.<br />
            • 크리에이터 본인이 정보의 수정이나 삭제를 원하는 경우 프로필 페이지의 삭제 코드(방송국 URL) 기능이나 이메일 문의를 통해 즉시 처리할 수 있습니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <Scale className="w-4 h-4 text-[#2563EB]" />
            4. 면책 조항
          </h2>
          <p>
            스트리머 개인 사정으로 인한 방송 일정 변경, 연기, 취소로 인한 정보 불일치에 대해서는 책임을 지지 않으며, 외부 방송국 링크 내의 콘텐츠는 각 플랫폼의 이용 규칙을 따릅니다.
          </p>
        </section>
      </div>
    </div>
  );
}
