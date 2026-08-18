import { ArrowLeft, Shield, Lock, FileText, Cookie } from 'lucide-react';
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
            최종 업데이트: 2026년 8월 18일
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-8 text-xs sm:text-sm text-[#334155] leading-relaxed">
        <p>
          VDébut(이하 '서비스')은 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다. 본 방침을 통해 수집하는 정보, 이용 목적, 그리고 데이터 보호와 관련된 사항을 안내해 드립니다.
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

        {/* 2. 개인정보 보관 및 파기 */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <Lock className="w-4 h-4 text-[#2563EB]" />
            2. 데이터 보관 및 파기
          </h2>
          <p>
            수집된 비식별 접속 로그는 서비스 안정성 유지 및 비정상 접근 차단을 위해 일정 기간(최대 3개월) 보관 후 안전하게 파기됩니다.
          </p>
        </section>

        {/* 3. 쿠키 및 로컬 데이터 사용 안내 */}
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <Cookie className="w-4 h-4 text-[#2563EB]" />
            3. 쿠키(Cookie) 및 로컬 저장소 이용 안내
          </h2>
          <p>
            서비스는 이용자의 맞춤 환경 제공(선택 언어, 타임존 설정, 뷰 모드 등) 및 서비스 최적화를 위해 브라우저의 로컬 스토리지 및 기본 쿠키를 사용할 수 있습니다. 이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.
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
            문의 이메일: ru_0120@naver.com
          </div>
        </section>
      </div>
    </div>
  );
}
