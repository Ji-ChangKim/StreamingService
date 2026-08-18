import { ArrowLeft, Calendar, ShieldCheck, Radio } from 'lucide-react';
import { Language } from '../../utils/i18n';

interface AboutPageProps {
  onNavigateHome: () => void;
  currentLang?: Language;
}

export function AboutPage({ onNavigateHome }: AboutPageProps) {
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
            서비스 소개 (About VDébut)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            신입 버튜버 데뷔 일정을 한곳에서 모아보는 통합 캘린더 서비스입니다.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <div className="space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-4 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2563EB]" />
            VDébut을 만든 이유
          </h2>
          <p>
            새롭게 방송을 시작하는 신입 버츄얼 스트리머(VTuber)들의 첫 방송 일정은 치지직, SOOP, YouTube, Twitch 등 여러 플랫폼에 흩어져 있어 찾아보기가 쉽지 않았습니다.
          </p>
          <p>
            VDébut(브이데뷔)은 이러한 데뷔 일정들을 하나의 캘린더에 모아 팬들이 좋아하는 스트리머의 첫 무대를 놓치지 않고, 새로 시작하는 크리에이터분들도 더 많은 시청자를 만날 수 있도록 돕기 위해 만들어진 비영리 독립 일정표 서비스입니다.
          </p>
        </div>

        {/* 지원 플랫폼 공식 아이콘 그리드 */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-4 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#2563EB]" />
            지원 플랫폼 (공식 브랜드 기준 준수)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] flex items-center gap-2.5">
              <img src="/icons/chzzk_icon.png" alt="치지직" className="w-5 h-5 object-contain shrink-0" />
              <div>
                <div className="font-extrabold text-xs text-[#0F172A]">치지직 (CHZZK)</div>
                <div className="text-[10px] text-[#64748B]">네이버 스트리밍</div>
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] flex items-center gap-2.5">
              <img src="/icons/soop/soop_symbol_blue.svg" alt="SOOP" className="w-5 h-5 object-contain shrink-0" />
              <div>
                <div className="font-extrabold text-xs text-[#0F172A]">SOOP</div>
                <div className="text-[10px] text-[#64748B]">라이브 스트리밍</div>
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] flex items-center gap-2.5">
              <img src="/icons/youtube_icon.png" alt="YouTube" className="w-5 h-5 object-contain shrink-0" />
              <div>
                <div className="font-extrabold text-xs text-[#0F172A]">YouTube</div>
                <div className="text-[10px] text-[#64748B]">글로벌 비디오/라이브</div>
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] flex items-center gap-2.5">
              <img src="/icons/twitch_icon.svg" alt="Twitch" className="w-5 h-5 object-contain shrink-0" />
              <div>
                <div className="font-extrabold text-xs text-[#0F172A]">Twitch</div>
                <div className="text-[10px] text-[#64748B]">글로벌 스트리밍</div>
              </div>
            </div>
          </div>

          <ul className="list-disc pl-5 space-y-1.5 pt-2 text-[#475569]">
            <li>
              <strong>타임존 자동 변환:</strong> 해외 거주자나 글로벌 팬들도 헷갈리지 않도록 접속자의 로컬 시간대로 데뷔 시간을 자동 계산합니다.
            </li>
            <li>
              <strong>캘린더 알림 (.ics):</strong> 클릭 한 번으로 스마트폰이나 PC 기본 캘린더 앱에 데뷔 시작 10분 전 알림을 등록할 수 있습니다.
            </li>
            <li>
              <strong>10초 간편 제보:</strong> 로그인 없이 누구나 크리에이터의 첫 방송 링크와 일정을 등록하고 공유할 수 있습니다.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-4 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            저작권 및 브랜드 자산 운영 원칙
          </h2>
          <p className="text-[#475569]">
            VDébut에 표시되는 모든 크리에이터 프로필 이미지, 닉네임, 방송 링크는 공개된 공식 방송국 및 SNS 공지를 출처로 합니다. 크리에이터 본인의 요청이 있을 경우 즉시 정보 수정 또는 삭제를 진행하며, 치지직, SOOP, YouTube, Twitch 등 각 플랫폼의 공식 상표 및 로고 가이드라인을 엄격히 준수합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
