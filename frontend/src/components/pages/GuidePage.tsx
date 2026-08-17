import { useState } from 'react';
import { ArrowLeft, ChevronDown, PlusCircle } from 'lucide-react';
import { Language } from '../../utils/i18n';

interface GuidePageProps {
  onNavigateHome: () => void;
  onOpenSubmitModal?: () => void;
  currentLang?: Language;
}

interface FaqItem {
  id: string;
  category: string;
  iconSrc?: string;
  iconAlt?: string;
  badgeColor: string;
  question: string;
  content: React.ReactNode;
}

export function GuidePage({ onNavigateHome, onOpenSubmitModal }: GuidePageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      id: 'chzzk',
      category: '치지직 (CHZZK)',
      iconSrc: '/icons/chzzk/chzzk Icon_01.png',
      iconAlt: '치지직 공식 아이콘',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      question: '치지직(CHZZK) 데뷔 일정은 어떻게 등록하나요?',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <p>
            치지직 방송국 채널 주소만 있으면 10초 만에 간편하게 등록할 수 있습니다.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-[#475569]">
            <li>
              <strong>치지직 채널 URL 복사:</strong> 네이버 치지직에서 본인 또는 등록할 스트리머의 채널 페이지 주소(예: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0F172A] font-mono">https://chzzk.naver.com/{'{channelId}'}</code>)를 복사합니다.
            </li>
            <li>
              <strong>등록 폼에 붙여넣기:</strong> VDébut의 [데뷔 일정 등록] 팝업에서 [치지직]을 선택하고 복사한 채널 주소를 입력합니다.
            </li>
            <li>
              <strong>자동 프로필 동기화:</strong> 채널 URL을 입력하면 치지직에 등록된 <strong>공식 닉네임과 프로필 이미지</strong>가 자동으로 연동됩니다.
            </li>
            <li>
              <strong>데뷔 일시 입력:</strong> 첫 방송 예정 날짜와 시작 시간(한국 시간 기준)을 선택하고 [등록하기]를 누르면 즉시 캘린더에 반영됩니다.
            </li>
          </ol>
          <div className="p-3 bg-emerald-50/60 rounded-[8px] border border-emerald-200 text-xs text-emerald-800">
            💡 <strong>팁:</strong> 아직 방송국 프로필 사진이 준비되지 않았더라도 기본 캐릭터 아바타로 먼저 등록 후 나중에 [정보 동기화]를 통해 언제든지 최신 정보로 갱신할 수 있습니다.
          </div>
        </div>
      )
    },
    {
      id: 'soop',
      category: 'SOOP',
      iconSrc: '/icons/soop/soop_symbol_blue.svg',
      iconAlt: 'SOOP 공식 아이콘',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      question: 'SOOP 데뷔 일정은 어떻게 등록하나요?',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <p>
            SOOP 방송국 채널 주소를 통해 신입 스트리머의 첫 방송을 등록합니다.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-[#475569]">
            <li>
              <strong>SOOP 방송국 URL 복사:</strong> 방송국 주소(예: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0F172A] font-mono">https://ch.sooplive.co.kr/{'{userId}'}</code>)를 복사합니다.
            </li>
            <li>
              <strong>등록 정보 작성:</strong> 플랫폼을 [SOOP]으로 선택하고 방송국 URL, 활동명(닉네임), 첫 방송 날짜 및 시작 시간을 설정합니다.
            </li>
            <li>
              <strong>소속 구분:</strong> 개인세인 경우 [개인세]를 선택하거나, 버튜버 크루/소속사가 있다면 소속사명을 입력하시면 프로필에 뱃지로 함께 표시됩니다.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'youtube',
      category: 'YouTube',
      iconSrc: '/icons/youtube_icon.png',
      iconAlt: 'YouTube 공식 아이콘',
      badgeColor: 'bg-red-50 text-red-800 border-red-200',
      question: 'YouTube 데뷔 일정은 어떻게 등록하나요?',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <p>
            YouTube 채널 핸들 주소나 첫 방송 라이브 스트리밍 대기방 링크로 등록할 수 있습니다.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-[#475569]">
            <li>
              <strong>채널 또는 대기방 링크 복사:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>채널 주소: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0F172A] font-mono">https://www.youtube.com/@{'{handle}'}</code></li>
                <li>라이브 대기방: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0F172A] font-mono">https://www.youtube.com/watch?v={'{videoId}'}</code></li>
              </ul>
            </li>
            <li>
              <strong>일정 등록:</strong> 플랫폼을 [YouTube]로 선택 후 링크를 입력하고, 데뷔 방송 일시 및 스트리머 닉네임을 작성합니다.
            </li>
            <li>
              <strong>X(트위터) 공지 링크 추가 (권장):</strong> 데뷔 티저나 첫 방송 공지가 올라온 X(트위터) 포스트 링크를 함께 입력하시면 팬들이 상세 공지를 바로 확인할 수 있습니다.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'twitch',
      category: 'Twitch',
      iconSrc: '/icons/Twitch Logos/02. Glitch/01. Twitch Purple/glitch_flat_purple.svg',
      iconAlt: 'Twitch 공식 아이콘',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      question: 'Twitch 데뷔 일정은 어떻게 등록하나요?',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <p>
            글로벌 Twitch 버츄얼 스트리머의 데뷔 일정 등록 방법입니다.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-[#475569]">
            <li>
              <strong>Twitch 채널 주소 복사:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0F172A] font-mono">https://twitch.tv/{'{username}'}</code> 형식의 채널 링크를 복사합니다.
            </li>
            <li>
              <strong>타임존 자동 변환:</strong> 해외 시청자나 크리에이터도 쉽게 볼 수 있도록, 본인의 현지 시간에 맞춰 시간을 입력하시면 방문자의 지역 시간에 맞게 자동 변환되어 표시됩니다.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'edit',
      category: '정보 수정',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      question: '데뷔 날짜가 연기되거나 프로필 정보를 수정하고 싶을 때는 어떻게 하나요?',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <p>
            등록된 일정과 프로필 정보는 언제든지 손쉽게 수정할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#475569]">
            <li>
              <strong>원클릭 방송국 정보 동기화:</strong> 크리에이터 상세 프로필 페이지 우측 상단의 <strong>[업데이트 : 정보 동기화]</strong> 버튼을 누르면 연동된 방송국의 최신 프로필 사진과 닉네임이 즉시 반영됩니다.
            </li>
            <li>
              <strong>일시 및 세부 내용 수정:</strong> 프로필 페이지 우측 상단의 [더보기 ⋮] 버튼 → <strong>[정보 수정]</strong>을 누르면 데뷔 일시, 소개글, SNS 링크 등을 자유롭게 변경할 수 있습니다.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'delete',
      category: '일정 삭제',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
      question: '일정을 취소하거나 프로필을 삭제하고 싶을 때는 어떻게 하나요?',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <p>
            타인에 의한 악의적인 무단 삭제를 방지하기 위해 <strong>2단계 고유 삭제 코드 검증 시스템</strong>을 운영하고 있습니다.
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-[#475569]">
            <li>해당 크리에이터의 상세 프로필 페이지로 이동합니다.</li>
            <li>우측 상단의 [더보기 ⋮] 메뉴를 누르고 <strong>[삭제]</strong>를 선택합니다.</li>
            <li>
              본인 확인을 위해 <strong>등록된 크리에이터의 공식 방송국 채널 주소</strong>를 삭제 코드로 입력하시면 즉시 안전하게 삭제 처리됩니다.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'ics',
      category: '캘린더 알림',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      question: '구글 캘린더나 스마트폰 캘린더에 데뷔 방송 알림을 맞추려면 어떻게 하나요?',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <p>
            캘린더 화면의 일정 카드에서 <strong>[알림 저장]</strong> 또는 <strong>[.ics 다운로드]</strong> 버튼을 누르면 표준 캘린더 파일이 다운로드됩니다.
          </p>
          <p className="text-[#475569]">
            스마트폰이나 PC에서 해당 파일을 열면 기본 캘린더 앱(Google Calendar, Apple Calendar, Outlook)에 방송 시작 10분 전 알림과 함께 공식 방송국 링크가 자동으로 등록됩니다.
          </p>
        </div>
      )
    }
  ];

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

        {onOpenSubmitModal && (
          <button
            onClick={onOpenSubmitModal}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-[8px] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> 일정 등록하기
          </button>
        )}
      </div>

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-[16px] p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-['Outfit']">
            플랫폼별 데뷔 등록 가이드 & 자주 묻는 질문 (FAQ)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            치지직, SOOP, YouTube, Twitch 신입 버튜버 데뷔 일정 등록 및 수정/삭제 방법을 확인하세요.
          </p>
        </div>
      </section>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id}
              className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 font-extrabold text-sm sm:text-base text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-[6px] border ${faq.badgeColor} shrink-0`}>
                    {faq.iconSrc && (
                      <img
                        src={faq.iconSrc}
                        alt={faq.iconAlt || faq.category}
                        className="w-4 h-4 object-contain shrink-0"
                      />
                    )}
                    <span>{faq.category}</span>
                  </span>
                  <span>{faq.question}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#2563EB]' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-[#F1F5F9] bg-[#F8FAFC]/50 animate-fadeIn">
                  {faq.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
