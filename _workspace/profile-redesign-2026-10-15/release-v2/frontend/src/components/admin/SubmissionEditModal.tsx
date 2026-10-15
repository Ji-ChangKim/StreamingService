import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Sparkles,
  XCircle,
  ExternalLink,
  Calendar,
  Clock,
  Building2,
  Film,
  Globe,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { generateSuggestedSlug } from '../../utils/slugUtils';
import { AvatarImage } from '../calendar/AvatarImage';

interface SubmissionEditModalProps {
  isOpen: boolean;
  submission: any | null;
  onClose: () => void;
  onSave: (id: number, updatedData: any) => Promise<boolean>;
  onApprove: (id: number, customSlug: string, updatedData: any) => Promise<boolean>;
  onReject: (id: number, reason: string) => Promise<boolean>;
}

export function SubmissionEditModal({
  isOpen,
  submission,
  onClose,
  onSave,
  onApprove,
  onReject,
}: SubmissionEditModalProps) {
  // 폼 상태
  const [displayName, setDisplayName] = useState('');
  const [platform, setPlatform] = useState('CHZZK');
  const [channelUrl, setChannelUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [debutDate, setDebutDate] = useState('');
  const [debutTime, setDebutTime] = useState('20:00');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [agencyType, setAgencyType] = useState<'INDIE' | 'AGENCY'>('INDIE');
  const [agencyName, setAgencyName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [countryCode, setCountryCode] = useState('KR');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // 처리 상태
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [fetchMsg, setFetchMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 데이터 동기화
  useEffect(() => {
    if (!isOpen || !submission) return;

    setDisplayName(submission.displayName || '');
    setPlatform((submission.platform || 'CHZZK').toUpperCase());
    setChannelUrl(submission.channelUrl || '');
    setAvatarUrl(submission.avatarUrl || '');
    setDebutDate(submission.debutDate || '');
    setDebutTime(submission.debutTime || '20:00');
    setTimezone(submission.timezone || 'Asia/Seoul');

    const isAgency = Boolean(
      submission.agencyName &&
      submission.agencyName.trim() &&
      submission.agencyName !== '개인세' &&
      !submission.agencyName.toLowerCase().includes('indie')
    );
    setAgencyType(isAgency ? 'AGENCY' : 'INDIE');
    setAgencyName(isAgency ? submission.agencyName : '');
    setGroupName(submission.groupName || '');
    setVideoUrl(submission.videoUrl || '');
    setWebsiteUrl(submission.websiteUrl || '');
    setXUrl(submission.xUrl || '');
    setCountryCode(submission.countryCode || 'KR');
    setDescription(submission.description || '');
    setAdminNote(submission.adminNote || '');

    // 슬러그 초기값
    const initialSlug = generateSuggestedSlug(
      submission.displayName,
      submission.channelUrl,
      submission.xUrl
    );
    setSlug(initialSlug);
    setFetchMsg('');
    setErrorMsg('');
  }, [isOpen, submission]);

  if (!isOpen || !submission) return null;

  // 외부 채널 프로필 실시간 불러오기
  const handleFetchProfile = async () => {
    if (!channelUrl) {
      setFetchMsg('방송국 채널 주소를 먼저 입력해주세요.');
      return;
    }

    setIsFetchingProfile(true);
    setFetchMsg('방송국 프로필 정보 조회 중...');
    try {
      const apiHost = (import.meta as any).env?.VITE_API_HOST || '';
      const res = await fetch(
        `${apiHost}/api/v1/platform/profile?platform=${platform}&url=${encodeURIComponent(channelUrl)}`
      );
      const data = await res.json();
      if (data.success && data.creatorName) {
        setDisplayName(data.creatorName);
        if (data.profileImageUrl) setAvatarUrl(data.profileImageUrl);
        if (data.description) setDescription(data.description);
        setFetchMsg(`✅ [${platform}] 프로필 정보(이름, 아바타, 소개)를 성공적으로 연동했습니다!`);
      } else {
        setFetchMsg(`⚠️ ${data.error || '프로필 정보를 찾을 수 없습니다.'}`);
      }
    } catch {
      setFetchMsg('⚠️ 프로필 조회 중 통신 오류가 발생했습니다.');
    } finally {
      setIsFetchingProfile(false);
    }
  };

  // 추천 슬러그 재생성
  const handleResetSlug = () => {
    const newSlug = generateSuggestedSlug(displayName, channelUrl, xUrl);
    setSlug(newSlug);
  };

  // 1. 단순 수정 저장
  const handleSaveOnly = async () => {
    if (!displayName || !channelUrl) {
      setErrorMsg('활동명과 채널 URL은 필수 입력 항목입니다.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const payload = {
      displayName: displayName.trim(),
      platform,
      channelUrl: channelUrl.trim(),
      avatarUrl: avatarUrl.trim(),
      debutDate: debutDate.trim(),
      debutTime: debutTime.trim(),
      timezone,
      agencyName: agencyType === 'AGENCY' ? (agencyName.trim() || '소속사') : '개인세',
      groupName: groupName.trim(),
      videoUrl: videoUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      xUrl: xUrl.trim(),
      countryCode,
      description: description.trim(),
      adminNote: adminNote.trim(),
    };

    const ok = await onSave(submission.id, payload);
    setIsSaving(false);
    if (ok) {
      onClose();
    } else {
      setErrorMsg('신청서 데이터 수정 저장에 실패했습니다.');
    }
  };

  // 2. 수정 데이터 반영 후 즉시 승인
  const handleApproveWithData = async () => {
    if (!displayName || !channelUrl) {
      setErrorMsg('활동명과 채널 URL은 필수 입력 항목입니다.');
      return;
    }

    const targetSlug = slug.trim() || generateSuggestedSlug(displayName, channelUrl, xUrl);

    if (!confirm(`'${displayName}' 님의 데뷔 일정을 수정한 데이터로 정식 승인하여 캘린더에 즉시 발행하시겠습니까?\n\n🔗 발행 URL: https://vdebut.live/creator/${targetSlug}`)) {
      return;
    }

    setIsApproving(true);
    setErrorMsg('');

    const payload = {
      displayName: displayName.trim(),
      platform,
      channelUrl: channelUrl.trim(),
      avatarUrl: avatarUrl.trim(),
      debutDate: debutDate.trim(),
      debutTime: debutTime.trim(),
      timezone,
      agencyName: agencyType === 'AGENCY' ? (agencyName.trim() || '소속사') : '개인세',
      groupName: groupName.trim(),
      videoUrl: videoUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      xUrl: xUrl.trim(),
      countryCode,
      description: description.trim(),
      adminNote: adminNote.trim(),
    };

    const ok = await onApprove(submission.id, targetSlug, payload);
    setIsApproving(false);
    if (ok) {
      onClose();
    } else {
      setErrorMsg('승인 처리에 실패했습니다.');
    }
  };

  // 3. 반려
  const handleRejectClick = async () => {
    const reason = prompt('반려 사유(선택 사항)를 입력해주세요:', adminNote);
    if (reason === null) return;

    setIsRejecting(true);
    const ok = await onReject(submission.id, reason);
    setIsRejecting(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-[20px] shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F172A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              ✏️
            </div>
            <div>
              <h2 className="text-base font-extrabold font-['Outfit']">
                데뷔 신청서 검수 및 데이터 수정
              </h2>
              <p className="text-xs text-slate-400">
                신청 데이터 확인·수정 및 대기업·그룹·공식 PV 정보 추가 보강
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-800">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: 기본 정보 & 채널 연동 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>1. 기본 활동 정보 & 방송국</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  활동명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="스트리머 활동명"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-blue-500 outline-none text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  방송 플랫폼 <span className="text-red-500">*</span>
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-blue-500 outline-none text-xs sm:text-sm"
                >
                  <option value="CHZZK">치지직 (CHZZK)</option>
                  <option value="SOOP">SOOP</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TWITCH">Twitch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">활동 국가</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-blue-500 outline-none text-xs sm:text-sm"
                >
                  <option value="KR">🇰🇷 한국 (KR)</option>
                  <option value="JP">🇯🇵 일본 (JP)</option>
                  <option value="US">🇺🇸 미국/글로벌 (US)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 text-xs">
                  방송 채널 URL <span className="text-red-500">*</span>
                </label>
                {channelUrl && (
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    채널 바로 방문 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://chzzk.naver.com/..., https://sooplive.co.kr/..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleFetchProfile}
                  disabled={isFetchingProfile}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="플랫폼 공식 API를 통해 프로필 사진과 소개글을 새로 수집합니다"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingProfile ? 'animate-spin' : ''}`} />
                  <span>정보 조회</span>
                </button>
              </div>
              {fetchMsg && (
                <p className="text-xs text-blue-700 font-medium mt-1 animate-fadeIn">{fetchMsg}</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
              />
              <div className="flex-1">
                <label className="block font-bold text-slate-700 mb-1 text-xs">아바타 이미지 URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: 데뷔 일정 정보 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>2. 데뷔 일정 & 시간대</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> 데뷔 날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={debutDate}
                  onChange={(e) => setDebutDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:border-blue-500 outline-none text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> 데뷔 시간 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={debutTime}
                  onChange={(e) => setDebutTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:border-blue-500 outline-none text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-600" /> 기준 시간대
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:border-blue-500 outline-none text-xs sm:text-sm"
                >
                  <option value="Asia/Seoul">Asia/Seoul (KST, +09:00)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST, +09:00)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="UTC">UTC (세계 표준시)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: 소속 & 대기업·그룹·공식 PV 확장 정보 */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-blue-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>3. 소속 구분 & 대기업·그룹·공식 PV (선택 보강)</span>
              </h3>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-blue-200">
                <button
                  type="button"
                  onClick={() => setAgencyType('INDIE')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    agencyType === 'INDIE'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  개인세
                </button>
                <button
                  type="button"
                  onClick={() => setAgencyType('AGENCY')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    agencyType === 'AGENCY'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  기업 / 에이전시
                </button>
              </div>
            </div>

            {agencyType === 'AGENCY' && (
              <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                      기업 / 소속사명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="예: 스텔라이브, 패러블 등"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                      그룹 / 유닛 / 기수명 <span className="text-slate-400 font-normal">(선택)</span>
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="예: ABYSS (4기생), 1기생 등"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs flex items-center gap-1">
                      <Film className="w-3.5 h-3.5 text-blue-600" />
                      <span>공식 데뷔 PV / 티저 영상 URL <span className="text-slate-400 font-normal">(선택)</span></span>
                    </label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtu.be/... (YouTube 영상 주소)"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>소속사 공식 홈페이지 <span className="text-slate-400 font-normal">(선택)</span></span>
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://stellive.me/..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">
                공식 X (트위터) 프로필 주소 <span className="text-slate-400 font-normal">(개인/소속사 공통 선택)</span>
              </label>
              <input
                type="url"
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                placeholder="https://x.com/아이디"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Section 4: 소개글 & 발행 슬러그 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              4. 소개글 & 메인 캘린더 발행 설정
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">채널 소개글</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="방송 소개 및 데뷔 안내 문구"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 text-xs">
                  발행 프로필 URL 슬러그 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetSlug}
                  className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                >
                  추천 슬러그로 재생성
                </button>
              </div>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-200 text-slate-600 rounded-l-lg border border-r-0 border-slate-300 font-mono text-xs select-none">
                  https://vdebut.live/creator/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="clean-slug"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-r-lg font-mono font-bold text-blue-700 text-xs sm:text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">
                운영자 검토 메모 <span className="text-slate-400 font-normal">(관리자 전용)</span>
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="예: 공식 채널 PV 및 스텔라이브 공지 확인 완료"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-5 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div>
            {submission.status === 'PENDING' && (
              <button
                type="button"
                onClick={handleRejectClick}
                disabled={isRejecting}
                className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRejecting ? '반려 처리 중...' : '신청서 반려'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              닫기
            </button>

            <button
              type="button"
              onClick={handleSaveOnly}
              disabled={isSaving || isApproving}
              className="px-4 py-2 text-xs font-extrabold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? '수정 저장 중...' : '수정 사항 저장'}</span>
            </button>

            {submission.status === 'PENDING' && (
              <button
                type="button"
                onClick={handleApproveWithData}
                disabled={isApproving || isSaving}
                className="px-4 py-2 text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-100" />
                <span>{isApproving ? '승인 발행 중...' : '수정 후 즉시 승인 반영'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
