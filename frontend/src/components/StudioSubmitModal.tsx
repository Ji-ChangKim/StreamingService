import React, { useState, useEffect } from 'react';
import { X, Send, Globe, CheckCircle2, Search, Edit2, Check, Building2, User } from 'lucide-react';
import { DebutEvent } from '../types';
import { getAvatarUrl } from '../utils/avatarUtils';
import { createDebutEvent, updateDebutEvent } from '../services/eventService';

interface StudioSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newEvent: DebutEvent) => void;
  editEvent?: DebutEvent | null;
  initialDate?: string;
  onUpdateSuccess?: (updatedEvent: DebutEvent) => void;
}

export function StudioSubmitModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  editEvent,
  initialDate,
  onUpdateSuccess,
}: StudioSubmitModalProps) {
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

  // isOpen 및 editEvent 상태 변경 시 폼 필드 동기화 또는 신규 작성 리셋
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
      // 신규 등록 모드: 이전 잔여 데이터 깨끗이 리셋 & 전달된 initialDate 또는 오늘 날짜로 세팅!
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  const [isFetchedSuccess, setIsFetchedSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    } catch (err) {
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

  // URL 변경 시 500ms Debounce 후 자동 프로필 조회
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchUrl || !displayName) return;

    setIsSubmitting(true);

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
        await updateDebutEvent(editEvent.id, targetEvt);
        onUpdateSuccess?.(targetEvt);
      } else {
        await createDebutEvent(targetEvt);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* 팝업 모달 창 컨테이너 (relative 지정으로 우측 상단 X 버튼 absolute 배치) */}
      <div className="relative bg-white rounded-[8px] max-w-[640px] w-full shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[90vh]">
        
        {/* 팝업 우측 상단 X 닫기 버튼 (2번 이미지 와이어프레임 100% 반영) */}
        <button
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 z-20 p-2 bg-[#0F172A] hover:bg-[#2563EB] text-white rounded-full shadow-lg border border-slate-700 transition-all cursor-pointer group"
          title="닫기"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Header */}
        <div className="bg-[#0F172A] text-white p-4 sm:p-5 rounded-t-[8px] flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-[6px] shrink-0">
              <img src="/logo.png" alt="VDébut Logo" className="h-7 sm:h-8 w-auto object-contain" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold font-['Outfit']">
                데뷔 일정 등록
              </h3>
              <p className="text-xs text-slate-300">
                방송국 URL을 입력하면 프로필 정보가 자동으로 불러와집니다.
              </p>
            </div>
          </div>
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
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-4.5 text-sm font-medium text-[#0F172A] overflow-y-auto">
            
            {/* Step 1: 방송/프로필 URL 입력 (최상단) */}
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-[#0F172A] text-sm flex items-center gap-1.5">
                  <span>방송국 / 라이브 URL</span> <span className="text-red-500">*</span>
                </label>
                {parsePlatformFromUrl(watchUrl) && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#2563EB] text-white animate-fadeIn">
                    {parsePlatformFromUrl(watchUrl)} 감지됨
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

            {/* Step 2: 프로필 연동 결과 카드 (성공 시 적용/수정 토글) */}
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

                {/* 적용 / 수정 선택 버튼 */}
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
              /* 수동 닉네임 입력 (자동 조회가 미동작 시 또는 404 URL 일 때) */
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

            {/* Step 4: 소속 선택 (개인 vs 기업) */}
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

              {/* 기업 선택 시 에이전시/기업명 입력 필드 활성화 */}
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

            {/* Step 5: 데뷔 인사말 & 소식 (프로필 소개글 자동 바인딩 -> 자유 수정 가능) */}
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

            {/* 시각 변환 미리보기 박스 (두 줄 레이아웃 적용으로 긴 타임존 짤림 방지) */}
            <div className="bg-[#F0F9FF] border border-[#BFDBFE] rounded-[6px] p-3.5 text-xs sm:text-sm text-[#1E40AF] flex flex-col gap-1.5 shadow-2xs">
              <span className="flex items-center gap-1.5 font-bold">
                <Globe className="w-4 h-4 text-[#2563EB] shrink-0" /> 표출 변환 시각:
              </span>
              <span className="font-mono font-extrabold text-sm sm:text-base text-[#1E40AF] break-words pl-5">
                {previewLocalTime} ({timezone})
              </span>
            </div>

            {/* 하단 버튼 (2번 이미지 구조 및 세련된 다크/라이트 디자인 개선) */}
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
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-[6px] font-bold text-sm bg-[#0F172A] text-white hover:bg-[#2563EB] transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
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
