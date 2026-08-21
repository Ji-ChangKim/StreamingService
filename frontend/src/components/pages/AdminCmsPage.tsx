import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  LogOut,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  Search,
  Calendar,
  Clock,
  Clock3,
  Users,
  Inbox,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  adminLogin,
  getAdminToken,
  clearAdminAuth,
  getAdminUser,
  fetchAdminSubmissions,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
  fetchAdminStreamers,
  deleteAdminStreamer
} from '../../services/adminService';
import { generateSuggestedSlug } from '../../utils/slugUtils';
import { AvatarImage } from '../calendar/AvatarImage';

interface AdminCmsPageProps {
  onNavigateHome: () => void;
}

export function AdminCmsPage({ onNavigateHome }: AdminCmsPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getAdminToken());
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // 대시보드 상태
  const [activeTab, setActiveTab] = useState<'submissions' | 'streamers'>('submissions');
  const [submissionFilter, setSubmissionFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [slugInputs, setSlugInputs] = useState<Record<number, string>>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [streamerSearch, setStreamerSearch] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');

  // 작업 처리 상태
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // SEO: 구글 및 검색 봇 크롤링/인덱싱 100% 차단 메타 태그 적용
  useEffect(() => {
    document.title = 'V-DEBUT HUB CMS Console';
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, nofollow, noarchive');

    return () => {
      metaRobots?.setAttribute('content', 'index, follow');
    };
  }, []);

  const loadSubmissions = async (status = submissionFilter) => {
    setIsLoadingData(true);
    const list = await fetchAdminSubmissions(status);
    setSubmissions(list);

    // 각 신청서별 추천 깔끔한 슬러그 자동 초기화
    const initialSlugs: Record<number, string> = {};
    list.forEach((sub: any) => {
      initialSlugs[sub.id] = generateSuggestedSlug(sub.displayName, sub.channelUrl, sub.xUrl);
    });
    setSlugInputs((prev) => ({ ...initialSlugs, ...prev }));

    setIsLoadingData(false);
  };

  const loadStreamers = async () => {
    setIsLoadingData(true);
    const list = await fetchAdminStreamers();
    setStreamers(list);
    setIsLoadingData(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'submissions') {
        loadSubmissions(submissionFilter);
      } else {
        loadStreamers();
      }
    }
  }, [isAuthenticated, activeTab, submissionFilter]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setLoginError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    const res = await adminLogin(usernameInput, passwordInput);
    setIsLoggingIn(false);

    if (res.success) {
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      setLoginError(res.error || '로그인에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    clearAdminAuth();
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleApprove = async (sub: any) => {
    const targetSlug = (slugInputs[sub.id] || generateSuggestedSlug(sub.displayName, sub.channelUrl, sub.xUrl)).trim();
    if (!confirm(`'${sub.displayName}' 님의 데뷔 일정을 승인하시겠습니까?\n\n🔗 프로필 URL: https://vdebut.live/creator/${targetSlug}`)) {
      return;
    }

    setProcessingId(sub.id);
    const res = await approveSubmission(sub.id, targetSlug);
    setProcessingId(null);

    if (res.success) {
      setActionSuccessMsg(`✨ '${sub.displayName}' 님의 일정이 /creator/${res.slug || targetSlug} 주소로 메인 캘린더에 성공적으로 발행되었습니다!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadSubmissions(submissionFilter);
    } else {
      alert(`승인 실패: ${res.error || '오류가 발생했습니다.'}`);
    }
  };

  const handleReject = async (sub: any) => {
    const reason = prompt('반려 사유(선택 사항)를 입력해주세요:');
    if (reason === null) return; // 취소

    setProcessingId(sub.id);
    const ok = await rejectSubmission(sub.id, reason);
    setProcessingId(null);

    if (ok) {
      setActionSuccessMsg(`'${sub.displayName}' 신청서가 반려 처리되었습니다.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      loadSubmissions(submissionFilter);
    } else {
      alert('반려 처리에 실패했습니다.');
    }
  };

  const handleDeleteSubmission = async (sub: any) => {
    if (!confirm(`신청서 '${sub.displayName}' 건을 완전히 삭제하시겠습니까?`)) return;

    setProcessingId(sub.id);
    const ok = await deleteSubmission(sub.id);
    setProcessingId(null);

    if (ok) {
      setActionSuccessMsg(`신청서가 삭제되었습니다.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      loadSubmissions(submissionFilter);
    } else {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleDeleteStreamer = async (streamer: any) => {
    if (!confirm(`🚨 경고: '${streamer.display_name}' 버튜버를 메인 캘린더 및 DB에서 완전히 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingSlug(streamer.slug);
    const ok = await deleteAdminStreamer(streamer.slug);
    setDeletingSlug(null);

    if (ok) {
      setActionSuccessMsg(`'${streamer.display_name}' 스트리머가 캘린더에서 안전하게 삭제되었습니다.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      loadStreamers();
    } else {
      alert('삭제에 실패했습니다.');
    }
  };

  // 등록 스트리머 검색 및 필터링
  const filteredStreamers = streamers.filter((s) => {
    const matchesQuery = !streamerSearch ||
      s.display_name?.toLowerCase().includes(streamerSearch.toLowerCase()) ||
      s.agency_name?.toLowerCase().includes(streamerSearch.toLowerCase()) ||
      s.channel_url?.toLowerCase().includes(streamerSearch.toLowerCase());

    const matchesPlatform = selectedPlatform === 'ALL' || s.platform === selectedPlatform;
    return matchesQuery && matchesPlatform;
  });

  // 1. 관리자 로그인 화면 (인증 전)
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-[20px] border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
              V-DEBUT CMS Console
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              운영자 인증 후 데뷔 일정 심사 및 캘린더 콘텐츠를 관리합니다.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> 관리자 ID
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Vdebut.admin"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 rounded-[10px] text-sm font-semibold text-slate-900 outline-none transition-all"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> 비밀번호 (PW)
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 rounded-[10px] text-sm font-semibold text-slate-900 outline-none transition-all"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-[8px] bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#0F172A] hover:bg-[#2563EB] text-white font-extrabold text-sm rounded-[10px] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>인증 중...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>CMS 콘솔 로그인</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 메인 캘린더로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. 관리자 CMS 대시보드 화면 (인증 완료 후)
  return (
    <div className="py-6 sm:py-8 space-y-6 animate-fadeIn max-w-[1200px] mx-auto px-2 sm:px-4">
      {/* Top Banner Header */}
      <div className="bg-[#0F172A] text-white rounded-[16px] p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-[12px] flex items-center justify-center text-white shadow-xs shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold font-['Outfit']">V-DEBUT 통합 운영 콘솔</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30">
                Authorized
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              접속 관리자: <strong className="text-cyan-400">{getAdminUser()}</strong> • 실시간 데뷔 신청 심사 및 캘린더 데이터베이스 관리
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onNavigateHome}
            className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer text-slate-200"
          >
            <ExternalLink className="w-3.5 h-3.5" /> 메인 캘린더 보기
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> 로그아웃
          </button>
        </div>
      </div>

      {/* Action Success Alert Toast */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-[10px] text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'submissions'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4 text-cyan-400" />
          <span>📋 데뷔 심사 대기열</span>
        </button>

        <button
          onClick={() => setActiveTab('streamers')}
          className={`px-4 py-2 rounded-[10px] text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'streamers'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>👥 등록된 버튜버 관리 & 삭제</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 탭 1: 데뷔 일정 신청서 심사 (Submissions Queue) */}
      {/* ======================================================== */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {/* Sub-filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-[12px] border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSubmissionFilter(st)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-extrabold transition-all cursor-pointer ${
                    submissionFilter === st
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'PENDING' && '⏳ 심사 대기'}
                  {st === 'APPROVED' && '✅ 승인 완료'}
                  {st === 'REJECTED' && '❌ 반려/스팸'}
                  {st === 'ALL' && '전체 보기'}
                </button>
              ))}
            </div>

            <button
              onClick={() => loadSubmissions(submissionFilter)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold"
              title="새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>

          {/* Submissions List */}
          {isLoadingData ? (
            <div className="py-16 text-center text-slate-500 font-bold text-xs">
              신청서 목록을 불러오는 중...
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-[14px] border border-slate-200 p-8 space-y-2 text-slate-500">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">해당 상태의 신청서가 없습니다.</p>
              <p className="text-xs text-slate-400">새로운 데뷔 등록 신청이 들어오면 이곳에 실시간으로 표시됩니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {submissions.map((sub) => {
                const isPending = sub.status === 'PENDING';

                return (
                  <div
                    key={sub.id}
                    className={`bg-white rounded-[14px] border p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      isPending ? 'border-blue-200 hover:border-[#2563EB] bg-blue-50/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Creator Info */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <AvatarImage
                        src={sub.avatarUrl || ''}
                        alt={sub.displayName}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                      />

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-900">{sub.displayName}</h3>
                          
                          {/* Platform Badge */}
                          {sub.platform === 'CHZZK' ? (
                            <span className="bg-[#00FFA3] text-black text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                              <img src="/icons/chzzk_icon.png" alt="CHZZK" className="w-3.5 h-3.5" /> 치지직
                            </span>
                          ) : sub.platform === 'SOOP' ? (
                            <span className="bg-[#0F172A] text-white text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                              <img src="/icons/soop/soop_symbol_white.svg" alt="SOOP" className="w-3.5 h-3.5" /> SOOP
                            </span>
                          ) : sub.platform === 'YOUTUBE' ? (
                            <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                              <img src="/icons/youtube_icon.png" alt="YouTube" className="h-3.5" /> YouTube
                            </span>
                          ) : (
                            <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                              {sub.platform}
                            </span>
                          )}

                          {sub.agencyName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                              {sub.agencyName}
                            </span>
                          )}

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            sub.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : sub.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {sub.status}
                          </span>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-3 text-xs font-mono font-bold text-[#2563EB]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {sub.debutDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {sub.debutTime} ({sub.timezone})
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium line-clamp-2">
                          {sub.description}
                        </p>

                        <div className="pt-1 flex items-center gap-3 flex-wrap">
                          <a
                            href={sub.channelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-extrabold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                          >
                            방송국 채널 바로 확인 <ExternalLink className="w-3 h-3" />
                          </a>
                          {sub.xUrl && (
                            <a
                              href={sub.xUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-slate-500 hover:underline inline-flex items-center gap-1"
                            >
                              X(트위터) 프로필 <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* 🔗 깔끔한 프로필 URL 슬러그 지정 필드 (대기 상태일 때) */}
                        {isPending && (
                          <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <span className="text-slate-400 shrink-0">발행 URL:</span>
                            <span className="font-mono text-slate-500 shrink-0">/creator/</span>
                            <input
                              type="text"
                              value={slugInputs[sub.id] || ''}
                              onChange={(e) => setSlugInputs({ ...slugInputs, [sub.id]: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                              placeholder="clean-slug"
                              className="px-2 py-1 bg-white border border-blue-300 focus:border-[#2563EB] focus:ring-1 focus:ring-blue-200 rounded-[6px] font-mono text-xs text-blue-700 font-bold outline-none w-44"
                            />
                            <button
                              type="button"
                              onClick={() => setSlugInputs({ ...slugInputs, [sub.id]: generateSuggestedSlug(sub.displayName, sub.channelUrl, sub.xUrl) })}
                              className="text-[10px] text-slate-400 hover:text-slate-700 underline shrink-0"
                            >
                              추천 초기화
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                      {isPending && (
                        <button
                          onClick={() => handleApprove(sub)}
                          disabled={processingId === sub.id}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-[8px] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>캘린더 승인 반영</span>
                        </button>
                      )}

                      {isPending && (
                        <button
                          onClick={() => handleReject(sub)}
                          disabled={processingId === sub.id}
                          className="px-3 py-2 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-xs rounded-[8px] transition-all border border-slate-200 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>반려</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteSubmission(sub)}
                        disabled={processingId === sub.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[8px] transition-colors cursor-pointer"
                        title="신청서 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 탭 2: 등록된 버튜버 전체 관리 & 삭제 (Active Streamers) */}
      {/* ======================================================== */}
      {activeTab === 'streamers' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-[12px] border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={streamerSearch}
                  onChange={(e) => setStreamerSearch(e.target.value)}
                  placeholder="이름, 소속사, 방송국 URL 검색..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 focus:border-[#2563EB] rounded-[8px] text-xs font-semibold text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'CHZZK', 'SOOP', 'YOUTUBE', 'TWITCH'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      selectedPlatform === p
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>총 <strong>{streamers.length}</strong>명 중 <strong>{filteredStreamers.length}</strong>명 검색됨</span>
              <button
                onClick={loadStreamers}
                className="hover:text-slate-900 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span>목록 갱신</span>
              </button>
            </div>
          </div>

          {/* Streamers Grid */}
          {isLoadingData ? (
            <div className="py-16 text-center text-slate-500 font-bold text-xs">
              버튜버 목록을 불러오는 중...
            </div>
          ) : filteredStreamers.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-[14px] border border-slate-200 p-8 text-slate-500 font-bold text-sm">
              검색 조건에 맞는 버튜버가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredStreamers.map((st) => (
                <div
                  key={st.info_id}
                  className="bg-white rounded-[14px] border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <AvatarImage
                      src={st.profile_image_url || ''}
                      alt={st.display_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">{st.display_name}</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {st.platform}
                        </span>
                        {st.agency_name && (
                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            • {st.agency_name}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono font-bold text-[#2563EB] flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" /> {st.debut_date} {st.debut_time}
                      </p>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {st.description || `${st.display_name}의 데뷔 방송`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/creator/${st.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                      >
                        프로필 페이지 <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="text-slate-300">•</span>
                      <a
                        href={st.channel_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-slate-500 hover:underline flex items-center gap-1"
                      >
                        방송국 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <button
                      onClick={() => handleDeleteStreamer(st)}
                      disabled={deletingSlug === st.slug}
                      className="px-2.5 py-1 text-xs font-extrabold text-red-600 hover:bg-red-50 border border-red-200 rounded-[6px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{deletingSlug === st.slug ? '삭제 중...' : '캘린더에서 삭제'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
