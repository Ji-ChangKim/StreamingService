import { ArrowLeft, Shield, Eye, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { Language } from '../../utils/i18n';

interface PrivacyPageProps {
  onNavigateHome: () => void;
  currentLang?: Language;
}

export function PrivacyPage({ onNavigateHome }: PrivacyPageProps) {
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
            개인정보처리방침 (Privacy Policy)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            최종 업데이트: 2026년 8월 17일
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-8 text-xs sm:text-sm text-[#334155] leading-relaxed">
        <p>
          VDébut(이하 '서비스')은 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다. 본 방침을 통해 수집하는 정보, 이용 목적, 그리고 Google 애드센스 광고 쿠키와 관련된 사항을 안내해 드립니다.
        </p>

        {/* 1. 개인정보 수집 항목 */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            1. 수집하는 정보 및 수집 방법
          </h2>
          <p>
            VDébut은 일반적인 캘린더 조회 시 <strong>별도의 회원가입을 요구하지 않으며, 실명이나 주민등록번호 등의 민감한 개인정보를 수집하지 않습니다.</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#475569]">
            <li><strong>자동 생성 정보:</strong> 웹사이트 접속 시 브라우저 종류, 접속 IP, 방문 일시, 기기 정보 등의 비식별 로그 데이터</li>
            <li><strong>일정 등록/제보 시:</strong> 공개된 방송국 채널 링크, 활동명, 일정 정보</li>
          </ul>
        </section>

        {/* 2. Google AdSense 및 쿠키 정책 (구글 애드센스 필수 요구사항) */}
        <section className="space-y-3 bg-[#F8FAFC] border border-[#CBD5E1] p-5 rounded-[12px]">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <Eye className="w-4 h-4 text-[#2563EB]" />
            2. Google AdSense 및 제3자 광고 쿠키 정책 (필수 고지)
          </h2>
          <p>
            본 웹사이트는 원활한 서비스 운영을 위해 Google 및 제3자 광고 사업자의 광고를 게재할 수 있으며, 다음과 같은 쿠키 정책이 적용됩니다:
          </p>
          <div className="space-y-2 text-[#334155]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <p>
                <strong>쿠키(Cookie) 사용:</strong> Google을 포함한 제3자 광고 공급업체는 쿠키를 사용하여 이용자의 본 사이트 및 타 웹사이트 방문 기록을 바탕으로 광고를 게재합니다.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <p>
                <strong>맞춤 광고 게재:</strong> Google의 광고 쿠키 사용으로 인해 Google 및 그 파트너는 인터넷 방문 기록을 바탕으로 적절한 맞춤 광고를 제공할 수 있습니다.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <strong>맞춤 광고 수신 거부(Opt-out):</strong> 사용자는 언제든지 맞춤 광고 설정을 해제할 수 있습니다.
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-xs text-[#64748B]">
                  <li>Google 광고 설정: <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-[#2563EB] underline font-bold">Google Ads Settings</a></li>
                  <li>제3자 광고 쿠키 거부 포털: <a href="https://www.aboutads.info/choices" target="_blank" rel="noreferrer" className="text-[#2563EB] underline font-bold">aboutads.info Choices</a></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 개인정보 보관 및 파기 */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <Lock className="w-4 h-4 text-[#2563EB]" />
            3. 데이터 보관 및 파기
          </h2>
          <p>
            수집된 비식별 접속 로그는 서비스 안정성 유지 및 비정상 접근 차단을 위해 일정 기간(최대 3개월) 보관 후 안전하게 파기됩니다.
          </p>
        </section>

        {/* 4. 문의처 */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <Shield className="w-4 h-4 text-[#2563EB]" />
            4. 개인정보 관련 문의
          </h2>
          <p>
            개인정보 및 일정 정보 관리에 관한 문의 사항은 아래 공식 이메일로 연락해 주시면 확인 후 조치해 드립니다.
          </p>
          <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#CBD5E1] text-xs font-mono text-[#0F172A]">
            문의 이메일: contact@vdebut.live
          </div>
        </section>
      </div>
    </div>
  );
}
