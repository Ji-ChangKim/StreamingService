import { useState, useEffect, useRef } from 'react';
import { ExternalLink, ArrowLeft, CheckCircle2, Calendar, Sparkles, Pencil, Trash2, RefreshCw, MoreVertical, AlertTriangle, X } from 'lucide-react';
import { fetchCreatorProfile, CreatorProfileData, deleteCreatorProfile, updateCreatorProfile } from '../../services/creatorService';
import { getAvatarUrl } from '../../utils/avatarUtils';
import { CreatorEditModal } from './CreatorEditModal';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 세로 말줄임표 드롭다운 메뉴 및 삭제 검증 모달 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCodeInput, setDeleteCodeInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // 드롭다운 메뉴 외부 클릭 시 자동 닫기 처리
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    const data = await fetchCreatorProfile(slug);
    if (data) {
      setProfile(data);
    } else {
      setError('크리에이터 프로필을 찾을 수 없습니다.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  // SEO: 크리에이터 프로필 페이지 접근 시 동적 브라우저 타이틀 설정
  useEffect(() => {
    if (profile?.displayName) {
      const prevTitle = document.title;
      const agencyText = profile.agencyName ? ` (${profile.agencyName})` : '';
      document.title = `${profile.displayName}${agencyText} 버튜버 데뷔 일정 & 프로필 | VDébut`;

      return () => {
        document.title = prevTitle;
      };
    }
  }, [profile]);

  // 2단계 삭제 코드(방송국 URL) 입력 검증 및 프로필 삭제 처리
  const handleConfirmDelete = async () => {
    if (!profile) return;

    const trimmedInput = deleteCodeInput.trim();
    if (!trimmedInput) {
      setDeleteError('삭제 코드를 입력해주세요.');
      return;
    }

    // 크리에이터에 등록된 방송국 URL 목록과 완벽히 일치하는지 비교 (대소문자 무시)
    const validUrls = profile.channels.map((c) => c.channelUrl.trim());
    const isValidCode = validUrls.some(
      (url) => url.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (!isValidCode) {
      setDeleteError('삭제 코드가 일치하지 않습니다.');
      return;
    }

    setIsDeleting(true);
    const success = await deleteCreatorProfile(profile.slug);
    setIsDeleting(false);

    if (success) {
      setIsDeleteModalOpen(false);
      alert(`'${profile.displayName}' 프로필이 정상 삭제되었습니다.`);
      onNavigateHome();
    } else {
      setDeleteError('프로필 삭제에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const primaryChannel = profile?.channels.find((c) => c.isPrimary) || profile?.channels[0];
  const primaryPlatform = primaryChannel?.platform || 'CHZZK';

  // 원클릭 방송국 정보 최신화 동기화
  const handleSyncFromBroadcast = async () => {
    if (!profile || !primaryChannel?.channelUrl) return;
    setIsSyncing(true);

    try {
      const platform = primaryPlatform;
      const apiHost = (import.meta as any).env?.VITE_API_HOST || '';
      const res = await fetch(
        `${apiHost}/api/v1/platform/profile?platform=${platform}&url=${encodeURIComponent(primaryChannel.channelUrl.trim())}`
      );
      const data = await res.json();

      if (data.success && (data.profileImageUrl || data.creatorName)) {
        const updated = await updateCreatorProfile(profile.slug, {
          displayName: data.creatorName || profile.displayName,
          profileImageUrl: data.profileImageUrl || profile.profileImageUrl,
          description: data.description || profile.description
        });

        if (updated) {
          alert('✅ 방송국 기준 최신 프로필 정보(이름, 프로필 이미지, 소개글)로 동기화 완료되었습니다!');
          await loadData();
        } else {
          alert('⚠️ DB 동기화 업데이트에 실패했습니다.');
        }
      } else {
        alert(`⚠️ 방송국 정보 동기화 실패: ${data.error || '최신 정보를 불러올 수 없습니다.'}`);
      }
    } catch (err) {
      alert('⚠️ 방송국 정보 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

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
      <div className="max-w-[960px] mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-500">크리에이터 프로필 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-base font-bold text-red-600">{error || '크리에이터 정보가 존재하지 않습니다.'}</p>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-[8px] hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 메인 캘린더로 이동
        </button>
      </div>
    );
  }

  const platformLabel = primaryPlatform === 'CHZZK' ? '치지직' : primaryPlatform === 'SOOP' ? 'SOOP' : primaryPlatform === 'YOUTUBE' ? '유튜브' : '트위치';
  
  // 💡 3. 개인세 / 인디 여부 확인 (개인세는 완전히 숨김!)
  const isIndie = !profile.agencyName || profile.creatorType === 'INDIE' || profile.agencyName.toLowerCase().includes('indie') || profile.agencyName === '개인세';

  const debutEvent = profile.events[0];
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
      {/* Top Header Navigation & Edit/Delete Action Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#64748B] hover:text-[#0F172A] transition-colors py-1.5 px-3 rounded-[6px] hover:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 메인 캘린더로 돌아가기
        </button>

        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <button
            onClick={handleSyncFromBroadcast}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2563EB] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-[8px] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? '동기화 중...' : '업데이트 : 정보 동기화'}
          </button>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center w-8 h-8 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-[8px] transition-all shadow-2xs cursor-pointer"
            title="더보기 메뉴"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* 세로 말줄임표 드롭다운 메뉴 */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-slate-200 rounded-[10px] shadow-lg py-1 z-30 animate-fadeIn">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                정보 수정
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setDeleteCodeInput('');
                  setDeleteError(null);
                  setIsDeleteModalOpen(true);
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                삭제
              </button>
            </div>
          )}
        </div>
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
                <span className="text-[#2563EB] font-extrabold flex items-center gap-1">
                  {primaryPlatform === 'SOOP' && (
                    <img src="/icons/soop/soop_symbol_blue.svg" alt="SOOP" className="w-4 h-4 object-contain inline-block" />
                  )}
                  <span>{platformLabel}</span>
                </span>
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

        {/* [채널 방문] & [X(트위터)] 이동 버튼 */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center justify-center md:justify-end gap-2.5 shrink-0 self-stretch md:self-center">
          {primaryChannel && (
            <a
              href={primaryChannel.channelUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${profile.displayName}의 ${platformLabel} 공식 채널 열기`}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm group ${
                primaryPlatform === 'TWITCH'
                  ? 'bg-[#9146FF] hover:bg-[#772CE8]'
                  : 'bg-[#0F172A] hover:bg-[#2563EB]'
              }`}
            >
              {primaryPlatform === 'SOOP' ? (
                <img src="/icons/soop/soop_logo_white.svg" alt="SOOP" className="h-5 w-auto object-contain" />
              ) : (
                <span>[{platformLabel} 채널 방문]</span>
              )}
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}

          {profile.xUrl && (
            <a
              href={profile.xUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${profile.displayName}의 X(트위터) 공식 프로필`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#0F172A] hover:bg-black text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm border border-slate-800 hover:border-slate-600 group"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>[X 프로필]</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}
        </div>
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

          {profile.xUrl && (
            <a
              href={profile.xUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#0F172A] hover:bg-black text-white font-bold text-xs sm:text-sm transition-all shadow-2xs hover:border-slate-700"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>[X (구 트위터) 공식 계정]</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </a>
          )}
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

      {/* 6. 정보 수정 (Edit) 모달 */}
      {profile && (
        <CreatorEditModal
          profile={profile}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* 7. 커스텀 삭제 코드 검증 모달 */}
      {isDeleteModalOpen && profile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-[16px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                프로필 삭제 확인
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                해당 버튜버 데뷔일을 삭제하시겠습니까? 정말 삭제를 원하면 삭제 코드를 입력해주세요.
              </p>

              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  value={deleteCodeInput}
                  onChange={(e) => {
                    setDeleteCodeInput(e.target.value);
                    if (deleteError) setDeleteError(null);
                  }}
                  placeholder="삭제 코드를 입력해주세요"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-[8px] text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmDelete();
                  }}
                  autoFocus
                />
                {deleteError && (
                  <p className="text-xs font-bold text-red-600 animate-fadeIn">{deleteError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-[8px] transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-[8px] transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? '삭제 처리 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
