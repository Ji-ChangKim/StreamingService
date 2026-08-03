import React, { useState, useEffect } from 'react';
import { X, Send, Globe, CheckCircle2, Search, Edit2, Check, Building2, User, Clock, Flame } from 'lucide-react';
import { DebutEvent } from '../types';
import { getAvatarUrl } from '../utils/avatarUtils';
import { createDebutEvent, updateDebutEvent } from '../services/eventService';
import { Language, UI_TRANSLATIONS } from '../utils/i18n';

interface StudioSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newEvent: DebutEvent) => void;
  editEvent?: DebutEvent | null;
  initialDate?: string;
  onUpdateSuccess?: (updatedEvent: DebutEvent) => void;
  currentLang?: Language;
}

export function StudioSubmitModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  editEvent,
  initialDate,
  onUpdateSuccess,
  currentLang = 'ko',
}: StudioSubmitModalProps) {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.ko;
  const [watchUrl, setWatchUrl] = useState('');
  const [platform, setPlatform] = useState('CHZZK');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  
  const getTodayString = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(initialDate || getTodayString());
  const [time, setTime] = useState('20:00');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [description, setDescription] = useState('');

  // 소속: 'INDIE' | 'AGENCY'
  const [agencyType, setAgencyType] = useState<'INDIE' | 'AGENCY'>('INDIE');
  const [agencyName, setAgencyName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  const [isFetchedSuccess, setIsFetchedSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 💡 2. 모달이 열려있는 동안 뒤 화면 및 전체 스크롤 고정 (Body Scroll Lock)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // isOpen 및 editEvent 상태 변경 시 폼 필드 동기화 또는 리셋
  useEffect(() => {
    if (!isOpen) return;

    if (editEvent) {
      const primaryLink = editEvent.links.find((l) => l.isPrimary) || editEvent.links[0];
      setWatchUrl(primaryLink?.url || '');
      setPlatform(primaryLink?.platform || 'CHZZK');
      setDisplayName(editEvent.creator.displayName || '');
      setAvatarUrl(editEvent.creator.avatarUrl || '');
      setDescription(editEvent.description || '');
      setTimezone(editEvent.originalTimezone || 'Asia/Seoul');
      setIsFetchedSuccess(true);
      setFetchMessage(`✏️ [기존 데뷔 일정 수정 모드]`);

      if (editEvent.creator.agency && !editEvent.creator.agency.toLowerCase().includes('indie') && editEvent.creator.agency !== '개인세') {
        setAgencyType('AGENCY');
        setAgencyName(editEvent.creator.agency);
      } else {
        setAgencyType('INDIE');
        setAgencyName('');
      }

      try {
        const d = new Date(editEvent.startAtUtc);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          setDate(`${yyyy}-${mm}-${dd}`);
          setTime(`${hh}:${min}`);
        }
      } catch {
        // fallback
      }
    } else {
      setWatchUrl('');
      setPlatform('CHZZK');
      setDisplayName('');
      setAvatarUrl('');
      setIsEditingName(false);
      setDate(initialDate || getTodayString());
      setTime('20:00');
      setTimezone('Asia/Seoul');
      setDescription('');
      setAgencyType('INDIE');
      setAgencyName('');
      setIsFetchedSuccess(false);
      setFetchMessage('');
    }
  }, [isOpen, editEvent, initialDate]);

  // URL 패턴 기반 플랫폼 자동 파싱
  const parsePlatformFromUrl = (url: string): string => {
    if (!url || url.trim().length === 0) return '';
    const lower = url.toLowerCase();
    if (lower.includes('chzzk.naver.com')) return 'CHZZK';
    if (lower.includes('afreecatv.com') || lower.includes('sooplive.co.kr') || lower.includes('sooplive.com')) return 'SOOP';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YOUTUBE';
    if (lower.includes('twitch.tv')) return 'TWITCH';
    return '';
  };

  // 프로필 정보 백엔드 조회 함수
  const fetchProfileInfo = async (targetPlatform: string, url: string) => {
    if (!url || url.trim().length < 5) return;

    setIsFetchingProfile(true);
    setFetchMessage('방송국 프로필 정보 조회 중...');

    try {
      const apiHost = (import.meta as any).env?.VITE_API_HOST || '';
      const res = await fetch(
        `${apiHost}/api/v1/platform/profile?platform=${targetPlatform}&url=${encodeURIComponent(url)}`
      );
      const data = await res.json();

      const platformLabel = targetPlatform === 'SOOP' ? 'SOOP' : targetPlatform === 'CHZZK' ? '치지직' : targetPlatform === 'YOUTUBE' ? '유튜브' : '트위치';

      if (data.success && data.creatorName) {
        setDisplayName(data.creatorName);
        const img = data.profileImageUrl || getAvatarUrl(data.creatorName);
        setAvatarUrl(img);
        
        if (data.description) {
          setDescription(data.description);
        } else {
          setDescription(`${data.creatorName} 버튜버의 공식 ${platformLabel} 방송국입니다. 많은 관심 부탁드립니다!`);
        }

        setIsFetchedSuccess(true);
        setIsEditingName(false);
        setFetchMessage(`✅ [${platformLabel}] 프로필 연동 완료!`);
      } else {
        setIsFetchedSuccess(false);
        setDisplayName('');
        setAvatarUrl('');
        setDescription(`신입 버튜버의 공식 ${platformLabel} 방송국입니다.`);
        setFetchMessage(`⚠️ ${data.error || '방송국 정보를 찾을 수 없습니다. 활동명을 직접 입력해 주세요.'}`);
      }
    } catch {
      setIsFetchedSuccess(false);
      setDisplayName('');
      setAvatarUrl('');
      const platformLabel = targetPlatform === 'SOOP' ? 'SOOP' : '치지직';
      setDescription(`신입 버튜버의 공식 ${platformLabel} 방송국입니다.`);
      setFetchMessage('⚠️ 연동 중 오류가 발생했습니다. 아래에서 활동명을 수동 입력해 주세요.');
    } finally {
      setIsFetchingProfile(false);
    }
  };

  useEffect(() => {
    if (!watchUrl || watchUrl.trim().length < 8) {
      setFetchMessage('');
      setIsFetchedSuccess(false);
      return;
    }

    const autoDetectedPlatform = parsePlatformFromUrl(watchUrl);
    setPlatform(autoDetectedPlatform);

    const timer = setTimeout(() => {
      fetchProfileInfo(autoDetectedPlatform, watchUrl);
    }, 500);

    return () => clearTimeout(timer);
  }, [watchUrl]);

  if (!isOpen) return null;

  const previewLocalTime = (() => {
    try {
      const dateStr = `${date}T${time}:00`;
      const localDate = new Date(dateStr);
      return new Intl.DateTimeFormat('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(localDate);
    } catch {
      return `${date} ${time}`;
    }
  })();

  // 💡 6 & 7. D - N 및 D-0 당일 디자이너 타임 뱃지 계산 로직
  const getDdayBadgeInfo = () => {
    try {
      const targetTime = new Date(`${date}T${time}:00`).getTime();
      const nowTime = new Date().getTime();
      const diffMs = targetTime - nowTime;

      // 자정 기준 일수 계산
      const targetMidnight = new Date(`${date}T00:00:00`).getTime();
      const today = new Date();
      const todayMidnight = new Date(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00`).getTime();
      const diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return {
          type: 'DAY',
          label: `D - ${diffDays}`,
          colorClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs border border-purple-400',
        };
      } else if (diffDays < 0) {
        return {
          type: 'PASSED',
          label: `D + ${Math.abs(diffDays)}`,
          colorClass: 'bg-slate-200 text-slate-700 font-bold border border-slate-300',
        };
      } else {
        // D-0 (당일 데뷔)
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);

        if (diffMinutes < 10) {
          return {
            type: 'URGENT',
            label: '곧 데뷔!',
            colorClass: 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white font-extrabold shadow-md border border-pink-300 animate-pulse',
            icon: <Flame className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />,
          };
        } else if (diffMinutes < 60) {
          return {
            type: 'MINUTES',
            label: `데뷔까지 ${diffMinutes}분`,
            colorClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-xs border border-amber-300',
            icon: <Clock className="w-3.5 h-3.5 text-white" />,
          };
        } else {
          return {
            type: 'HOURS',
            label: `데뷔까지 ${diffHours}시간`,
            colorClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs border border-blue-300',
            icon: <Clock className="w-3.5 h-3.5 text-white" />,
          };
        }
      }
    } catch {
      return { type: 'DAY', label: 'D - 0', colorClass: 'bg-purple-600 text-white' };
    }
  };

  const ddayBadge = getDdayBadgeInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchUrl || !displayName) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const utcIso = new Date(`${date}T${time}:00`).toISOString();
      const finalAgency = agencyType === 'AGENCY' ? (agencyName || '소속사') : 'Indie';
      const finalAvatar = avatarUrl || getAvatarUrl(displayName);

      const targetEvt: DebutEvent = {
        id: editEvent?.id || `evt-${Date.now()}`,
        title: `${displayName} 데뷔 방송`,
        type: editEvent?.type || 'FIRST_DEBUT',
        creator: {
          id: editEvent?.creator.id || `cr-${Date.now()}`,
          displayName,
          avatarUrl: finalAvatar,
          agency: finalAgency,
          countryCode: editEvent?.creator.countryCode || 'KR',
          languages: editEvent?.creator.languages || ['ko'],
        },
        startAtUtc: utcIso,
        originalTimezone: timezone,
        status: 'PUBLISHED',
        verificationStatus: editEvent?.verificationStatus || 'COMMUNITY_SUBMITTED',
        links: [{ platform, url: watchUrl, isPrimary: true }],
        description: description || `${displayName} 버튜버의 공식 데뷔 방송입니다.`,
      };

      if (editEvent) {
        const saved = await updateDebutEvent(editEvent.id, targetEvt);
        if (!saved) throw new Error('데뷔 일정 수정 저장에 실패했습니다.');
        onUpdateSuccess?.(targetEvt);
      } else {
        const saved = await createDebutEvent(targetEvt);
        if (!saved) throw new Error('데뷔 일정 등록 저장에 실패했습니다.');
        onSubmitSuccess(targetEvt);
      }

      setIsSubmitting(false);
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Submit Error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      {/* 팝업 모달 창 컨테이너 (모바일 풀스크린 최적화) */}
      <div className="bg-white rounded-none sm:rounded-[12px] max-w-[640px] w-full h-full sm:h-auto max-h-screen sm:max-h-[92vh] shadow-2xl border-0 sm:border border-[#CBD5E1] flex flex-col overflow-hidden">
        
        {/* Header: 좌측 [X] 닫기 버튼, 중앙 로고/타이틀, 우측 [등록] 제출 버튼 배치 */}
        <div className="bg-[#0F172A] text-white px-3.5 py-3 sm:px-5 sm:py-4 rounded-t-none sm:rounded-t-[12px] flex items-center justify-between shrink-0 border-b border-slate-800">
          
          {/* 좌측 상단 X 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-[6px] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            title={t.close}
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">{t.close}</span>
          </button>

          {/* 중앙 1. logo_white_bg 로고 및 타이틀 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1 bg-white rounded-[6px] shrink-0 shadow-xs">
              <img src="/logo_white_bg.png" alt="VDébut Logo" className="h-6 sm:h-7 w-auto object-contain" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold font-['Outfit'] text-white">
              {t.modalTitle}
            </h3>
          </div>

          {/* 우측 상단 등록 (Submit) 버튼 */}
          <button
            onClick={() => {
              const formEle = document.getElementById('debut-submit-form') as HTMLFormElement;
              if (formEle) formEle.requestSubmit();
            }}
            disabled={isSubmitting || !watchUrl || !displayName}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-[6px] font-extrabold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? t.submitting : t.submit}</span>
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-[#10B981] animate-bounce" />
            <h4 className="text-xl font-bold text-[#0F172A]">등록이 완료되었습니다!</h4>
            <p className="text-sm text-[#64748B]">
              검수 후 캘린더에 즉시 등재됩니다. 등록해 주셔서 감사합니다.
            </p>
          </div>
        ) : (
          <form id="debut-submit-form" onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-4.5 text-sm font-medium text-[#0F172A] overflow-y-auto">
            
            {/* Step 1: 방송/프로필 URL 입력 */}
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-[#0F172A] text-sm flex items-center gap-1.5">
                  <span>방송국 / 라이브 URL</span> <span className="text-red-500">*</span>
                </label>
                {parsePlatformFromUrl(watchUrl) && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#2563EB] text-white animate-fadeIn flex items-center gap-1">
                    {parsePlatformFromUrl(watchUrl) === 'SOOP' && (
                      <img src="/icons/soop/soop_symbol_white.svg" alt="SOOP" className="w-3.5 h-3.5 object-contain" />
                    )}
                    <span>{parsePlatformFromUrl(watchUrl)} 감지됨</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="예: https://chzzk.naver.com/live/... 또는 https://sooplive.co.kr/station/..."
                  value={watchUrl}
                  onChange={(e) => setWatchUrl(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-[6px] pl-10 pr-3 py-2.5 text-xs sm:text-sm focus:border-[#2563EB] focus:outline-none transition-all font-mono shadow-xs"
                />
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#64748B] absolute left-3 top-3 sm:top-3.5" />
              </div>

              {fetchMessage && (
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                  fetchMessage.includes('완료') || fetchMessage.includes('성공') ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {isFetchingProfile && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  <span>{fetchMessage}</span>
                </div>
              )}
            </div>

            {/* Step 2: 프로필 연동 결과 카드 */}
            {isFetchedSuccess && displayName ? (
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-[#BFDBFE] rounded-[6px] p-3.5 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={avatarUrl || getAvatarUrl(displayName)}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', getAvatarUrl(displayName));
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#64748B] font-bold">크리에이터 활동명</div>
                    {isEditingName ? (
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1 w-full bg-white border border-[#2563EB] rounded-[6px] px-2.5 py-1 text-sm font-bold focus:outline-none"
                        placeholder="활동명 직접 수정"
                      />
                    ) : (
                      <div className="text-base font-extrabold text-[#0F172A] truncate">
                        {displayName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {!isEditingName ? (
                    <>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 rounded-[6px] bg-[#10B981] text-white text-xs font-bold flex items-center gap-1 shadow-2xs cursor-default"
                      >
                        <Check className="w-4 h-4" /> 연동됨
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="px-2.5 py-1.5 rounded-[6px] bg-white border border-[#CBD5E1] text-[#334155] text-xs font-bold hover:bg-slate-100 flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#2563EB]" /> 활동명 수정
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-3 py-1.5 rounded-[6px] bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-4 h-4" /> 수정 완료
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <label className="block font-bold mb-1.5 text-[#334155] text-sm">
                  스트리머 활동명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 하츠네 미쿠 (初音ミク)"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (e.target.value) {
                      setAvatarUrl(getAvatarUrl(e.target.value));
                    }
                  }}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] px-3.5 py-2.5 text-sm focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-bold"
                />
              </div>
            )}

            {/* Step 3: 날짜 & 시간 & 기준 타임존 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1.5 text-[#334155] text-sm">날짜</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] px-3 py-2 text-xs sm:text-sm focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5 text-[#334155] text-sm">시간</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] px-3 py-2 text-xs sm:text-sm focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-mono"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold mb-1.5 text-[#334155] text-sm">기준 시간대</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] px-3 py-2 text-xs sm:text-sm focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-mono"
                >
                  <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            {/* Step 4: 소속 선택 */}
            <div className="space-y-1.5">
              <label className="block font-bold text-[#334155] text-sm">소속 구분</label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-[6px] border cursor-pointer transition-all ${
                  agencyType === 'INDIE' 
                    ? 'bg-blue-50/70 border-[#2563EB] text-[#2563EB] font-bold' 
                    : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B]'
                }`}>
                  <input
                    type="radio"
                    name="agencyType"
                    checked={agencyType === 'INDIE'}
                    onChange={() => setAgencyType('INDIE')}
                    className="sr-only"
                  />
                  <User className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">개인세 / 인디 (Indie)</span>
                </label>

                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-[6px] border cursor-pointer transition-all ${
                  agencyType === 'AGENCY' 
                    ? 'bg-blue-50/70 border-[#2563EB] text-[#2563EB] font-bold' 
                    : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B]'
                }`}>
                  <input
                    type="radio"
                    name="agencyType"
                    checked={agencyType === 'AGENCY'}
                    onChange={() => setAgencyType('AGENCY')}
                    className="sr-only"
                  />
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">기업 / 에이전시</span>
                </label>
              </div>

              {agencyType === 'AGENCY' && (
                <div className="pt-1.5 animate-fadeIn">
                  <label className="block font-bold mb-1.5 text-[#334155] text-sm">
                    기업 / 에이전시명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={agencyType === 'AGENCY'}
                    placeholder="예: 스텔라이브, 이세돌, VSPO!, HOLOLIVE 등"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-[6px] px-3.5 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none transition-all font-medium"
                  />
                </div>
              )}
            </div>

            {/* Step 5: 데뷔 인사말 & 소식 */}
            <div>
              <label className="block font-bold mb-1.5 text-[#334155] text-sm">데뷔 인사말 & 소식</label>
              <textarea
                rows={3}
                placeholder="안녕하세요! 신입 버튜버 데뷔 방송에서 만나요!"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] px-3.5 py-2.5 text-sm focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all"
              />
              <p className="text-xs text-[#64748B] mt-1">
                * 방송국 프로필 소개글이 자동으로 불러와지며 자유롭게 수정 가능합니다.
              </p>
            </div>

            {/* 💡 5, 6, 7. "캘린더 표시 시간:" 및 D - N / 데뷔까지 N시간 / 곧 데뷔! 뱃지 박스 */}
            <div className="bg-[#F0F9FF] border border-[#BFDBFE] rounded-[6px] p-3.5 text-xs sm:text-sm text-[#1E40AF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="flex items-center gap-1.5 font-bold text-[#1E3A8A]">
                  <Globe className="w-4 h-4 text-[#2563EB] shrink-0" /> {t.calendarDisplayTime}
                </span>
                <span className="font-mono font-extrabold text-sm sm:text-base text-[#1E40AF] break-words pl-5">
                  {previewLocalTime} ({timezone})
                </span>
              </div>

              {/* 💡 D-day 카운트다운 박스 (우측) */}
              <div className="shrink-0 self-start sm:self-center pl-5 sm:pl-0">
                <span className={`px-3 py-1.5 rounded-[6px] text-xs sm:text-sm font-black flex items-center gap-1.5 ${ddayBadge.colorClass}`}>
                  {ddayBadge.icon}
                  <span>{ddayBadge.label}</span>
                </span>
              </div>
            </div>

            {/* 하단 버튼 영역 */}
            {submitError && (
              <div className="rounded-[6px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700">
                {submitError}
              </div>
            )}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-[6px] font-bold text-sm bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !watchUrl || !displayName}
                className="px-6 py-2.5 rounded-[6px] font-extrabold text-sm bg-[#0F172A] hover:bg-[#2563EB] text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '등록 중...' : '등록'} <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
