import { useState, useEffect } from 'react';
import { ExternalLink, ArrowLeft, Tv, CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import { fetchCreatorProfile, CreatorProfileData } from '../../services/creatorService';
import { getAvatarUrl } from '../../utils/avatarUtils';

interface CreatorProfilePageProps {
  slug: string;
  onNavigateHome: () => void;
  currentLang?: string;
}

export function CreatorProfilePage({ slug, onNavigateHome }: CreatorProfilePageProps) {
  const [profile, setProfile] = useState<CreatorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState<string>('');
  const [isDebuted, setIsDebuted] = useState(false);
  const [passedDays, setPassedDays] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      const data = await fetchCreatorProfile(slug);
      if (data) {
        setProfile(data);
      } else {
        setError('크리에이터 프로필을 찾을 수 없습니다.');
      }
      setIsLoading(false);
    }
    loadData();
  }, [slug]);

  // 데뷔 일정 D-Day 카운트다운 및 D + N일 계산 연동
  useEffect(() => {
    if (!profile || profile.events.length === 0) return;

    const debutEvent = profile.events[0];
    const targetDate = new Date(debutEvent.startAtUtc);

    function updateCountdown() {
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setIsDebuted(true);
        // 💡 4. 데뷔 완료 시: 데뷔일로부터 D + N일 계산
        const daysPassed = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
        setPassedDays(daysPassed);
        setCountdownText(daysPassed === 0 ? '데뷔 당일 (D + 0)' : `데뷔일로부터 D + ${daysPassed}일`);
      } else {
        setIsDebuted(false);
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffHours / 24);
        const hours = diffHours % 24;
        setCountdownText(`데뷔까지 ${days > 0 ? `${days}일 ` : ''}${hours}시간`);
      }
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#64748B]">크리에이터 프로필 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <Tv className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-[#0F172A]">프로필을 찾을 수 없습니다</h2>
        <p className="text-sm text-[#64748B]">존재하지 않거나 비공개 처리된 크리에이터 프로필입니다.</p>
        <button
          onClick={onNavigateHome}
          className="px-5 py-2.5 bg-[#0F172A] text-white font-bold text-sm rounded-[8px] hover:bg-[#2563EB] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 데뷔 일정 캘린더로 돌아가기
        </button>
      </div>
    );
  }

  const primaryChannel = profile.channels.find((c) => c.isPrimary) || profile.channels[0];
  const debutEvent = profile.events[0];
  const primaryPlatform = primaryChannel?.platform || 'CHZZK';
  const platformLabel = primaryPlatform === 'CHZZK' ? '치지직' : primaryPlatform === 'SOOP' ? 'SOOP' : primaryPlatform === 'YOUTUBE' ? '유튜브' : '트위치';
  
  // 💡 3. 개인세 / 인디 여부 확인 (개인세는 완전히 숨김!)
  const isIndie = !profile.agencyName || profile.creatorType === 'INDIE' || profile.agencyName.toLowerCase().includes('indie') || profile.agencyName === '개인세';

  const formattedDebutDate = debutEvent ? (() => {
    try {
      const d = new Date(debutEvent.startAtUtc);
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours() > 12 ? `오후 ${d.getHours() - 12}` : `오전 ${d.getHours()}`}시`;
    } catch {
      return '데뷔 일정이 예정되어 있습니다.';
    }
  })() : '';

  const finalDescription = profile.description && profile.description.trim().length > 0
    ? profile.description
    : `${profile.displayName}님은 ${platformLabel}에서 활동하는 버튜버로, ${formattedDebutDate} 첫 데뷔 방송을 진행합니다.`;

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Back Button */}
      <div>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#64748B] hover:text-[#0F172A] transition-colors py-1.5 px-3 rounded-[6px] hover:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 메인 캘린더로 돌아가기
        </button>
      </div>

      {/* 1. 상단 프로필 카드 리뉴얼 (모바일 반응형 수직/수평 정렬 최적화) */}
      <section className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* 프로필 이미지 & 기본 정보 */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5 w-full md:w-auto">
          <div className="relative shrink-0">
            <img
              src={profile.profileImageUrl || getAvatarUrl(profile.displayName)}
              alt={`${profile.displayName} 프로필`}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', getAvatarUrl(profile.displayName));
              }}
            />
          </div>

          <div className="flex-1 space-y-2 min-w-0 flex flex-col items-center sm:items-start">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-['Outfit'] tracking-tight">
                {profile.displayName} 버튜버 프로필
              </h1>
              <p className="text-xs sm:text-sm font-bold text-[#64748B] mt-0.5 flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[#2563EB] font-extrabold">{platformLabel}</span>
                {!isIndie && (
                  <>
                    <span>•</span>
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-[4px] text-xs font-bold">{profile.agencyName}</span>
                  </>
                )}
              </p>
            </div>

            {/* 데뷔 일정 및 D + N일 박스 */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>{formattedDebutDate} 데뷔</span>
              {isDebuted && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] sm:text-xs font-black">
                  D + {passedDays}일
                </span>
              )}
            </div>
          </div>
        </div>

        {/* [채널 방문] 버튼 (모바일 풀 너비 모드 지원) */}
        {primaryChannel && (
          <div className="w-full md:w-auto flex justify-center md:justify-end shrink-0 self-stretch md:self-center">
            <a
              href={primaryChannel.channelUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#0F172A] hover:bg-[#2563EB] text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm group"
            >
              <span>[{platformLabel} 채널 방문]</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        )}
      </section>

      {/* 2. 데뷔 일정 영역 (상태 자동 전환: D + N일 표현) */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-[16px] p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/30 text-blue-300 border border-blue-400/30 inline-block">
              {isDebuted ? '✨ 성공적인 첫 데뷔' : '🚀 D-Day 카운트다운'}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold">첫 방송 데뷔 일정</h2>
            <p className="text-sm text-slate-300">
              {formattedDebutDate}
            </p>
            <p className="text-xs text-slate-400">
              {platformLabel} 공식 방송국에서 데뷔 방송을 진행하였습니다.
            </p>
          </div>

          <div className="text-center md:text-right space-y-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-[12px] p-5 shrink-0 min-w-[240px]">
            {isDebuted ? (
              <>
                <div className="text-xs text-emerald-300 font-bold flex items-center justify-center md:justify-end gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 데뷔 완료 스트리머
                </div>
                {/* 💡 4. 데뷔 완료 시 "데뷔일로부터 D + N일" */}
                <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-wide">
                  {countdownText}
                </div>
                {primaryChannel && (
                  <a
                    href={primaryChannel.channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 px-4 py-2 rounded-[8px] transition-colors shadow-xs"
                  >
                    [다시보기 / 채널 이동] <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </>
            ) : (
              <>
                <div className="text-xs text-slate-300 font-bold">남은 시간</div>
                <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono tracking-wider">
                  {countdownText || '데뷔 임박'}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. 스트리머 프로필 소개 영역 */}
      <section className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-3">
        <h3 className="text-lg font-extrabold text-[#0F172A] font-['Outfit'] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#2563EB]" /> {profile.displayName} 프로필 소개
        </h3>
        <div className="text-sm sm:text-base text-[#334155] leading-relaxed whitespace-pre-line bg-[#F8FAFC] p-4 sm:p-5 rounded-[10px] border border-[#E2E8F0]">
          {finalDescription}
        </div>
      </section>

      {/* 4. 활동 채널 목록 */}
      <section className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold text-[#0F172A] font-['Outfit'] flex items-center gap-2">
          🌐 공식 활동 채널
        </h3>
        <div className="flex flex-wrap gap-3">
          {profile.channels.map((ch) => (
            <a
              key={ch.id}
              href={ch.channelUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs sm:text-sm transition-all shadow-2xs hover:border-[#2563EB]"
            >
              <span>[{ch.platform}] {ch.channelName || `${ch.platform} 방송국`}</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
            </a>
          ))}
        </div>
      </section>

      {/* 5. 하단 추천 영역 */}
      <section className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] p-6 sm:p-8 space-y-4">
        <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] font-['Outfit'] flex items-center gap-2">
          ⭐ 추천 데뷔 일정 & 관련 소식
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={onNavigateHome}
            className="p-4 bg-white border border-[#E2E8F0] rounded-[12px] text-left hover:border-[#2563EB] transition-all group cursor-pointer"
          >
            <div className="text-xs font-bold text-[#2563EB] mb-1">📅 동일 날짜 데뷔</div>
            <div className="text-sm font-extrabold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
              같은 날 데뷔 버튜버 목록
            </div>
          </button>

          <button
            onClick={onNavigateHome}
            className="p-4 bg-white border border-[#E2E8F0] rounded-[12px] text-left hover:border-[#2563EB] transition-all group cursor-pointer"
          >
            <div className="text-xs font-bold text-[#2563EB] mb-1">🎮 동일 플랫폼</div>
            <div className="text-sm font-extrabold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
              {platformLabel} 신규 버튜버 보기
            </div>
          </button>

          <button
            onClick={onNavigateHome}
            className="p-4 bg-white border border-[#E2E8F0] rounded-[12px] text-left hover:border-[#2563EB] transition-all group cursor-pointer"
          >
            <div className="text-xs font-bold text-[#2563EB] mb-1">🗓️ 이번 주 스케줄</div>
            <div className="text-sm font-extrabold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
              이번 주 전체 데뷔 캘린더
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
