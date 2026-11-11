import { useState, useEffect } from 'react';
import { X, Save, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { AvatarImage } from '../calendar/AvatarImage';
import { fetchExternalPlatformProfile } from '../../services/adminService';

interface StreamerProfileEditModalProps {
  isOpen: boolean;
  streamer: any | null;
  onClose: () => void;
  onSave: (slug: string, payload: Record<string, any>) => Promise<boolean>;
}

const MBTI_OPTIONS = [
  '',
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

export function StreamerProfileEditModal({
  isOpen,
  streamer,
  onClose,
  onSave,
}: StreamerProfileEditModalProps) {
  const [newSlug, setNewSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [platform, setPlatform] = useState('CHZZK');
  const [channelUrl, setChannelUrl] = useState('');
  const [agency, setAgency] = useState('개인세');
  const [countryCode, setCountryCode] = useState('KR');
  const [dateState, setDateState] = useState<'FIXED' | 'TIME_TBD' | 'DATE_TBD' | 'NONE'>('FIXED');
  const [debutDate, setDebutDate] = useState('');
  const [debutTime, setDebutTime] = useState('20:00');
  const [targetMonth, setTargetMonth] = useState('');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [cafeUrl, setCafeUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [debutGroupId, setDebutGroupId] = useState('');
  const [debutGroupName, setDebutGroupName] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');

  // 상세 제원 (7대 항목)
  const [species, setSpecies] = useState('');
  const [birthday, setBirthday] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [height, setHeight] = useState('');
  const [fandomName, setFandomName] = useState('');
  const [oshiMark, setOshiMark] = useState('');
  const [mbti, setMbti] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingChannel, setIsSyncingChannel] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!streamer) return;
    setNewSlug(streamer.slug || '');
    setDisplayName(streamer.display_name || '');
    setPlatform(streamer.platform || 'CHZZK');
    setChannelUrl(streamer.channel_url || '');
    setAgency(streamer.agency_name || '개인세');
    setCountryCode(streamer.country_code || 'KR');
    setDateState(streamer.date_state || 'FIXED');
    setDebutDate(streamer.debut_date || '');
    setDebutTime(streamer.debut_time || '20:00');
    setTargetMonth(streamer.target_month || (streamer.debut_date ? streamer.debut_date.slice(0, 7) : ''));
    setTimezone(streamer.timezone || 'Asia/Seoul');
    setAvatarUrl(streamer.profile_image_url || '');
    setBannerUrl(streamer.banner_url || '');
    setXUrl(streamer.x_url || '');
    setWebsiteUrl(streamer.website_url || '');
    setCafeUrl(streamer.cafe_url || '');
    setVideoUrl(streamer.video_url || '');
    setDebutGroupId(streamer.debut_group_id || '');
    setDebutGroupName(streamer.debut_group_name || '');
    setHeadline(streamer.headline || '');
    setDescription(streamer.description || '');

    const d = streamer.details || {};
    setSpecies(d.species || d['종족'] || '');
    setBirthday(d.birthday || d['생일'] || '');
    setZodiac(d.zodiac || d['별자리'] || '');
    setHeight(d.height || d['신장'] || '');
    setFandomName(d.fandomName || d['팬덤명'] || '');
    setOshiMark(d.oshiMark || d['오시마크'] || '');
    setMbti((d.mbti || d['MBTI'] || '').toUpperCase());
    setSyncMessage(null);
  }, [streamer]);

  if (!isOpen || !streamer) return null;

  const handleFetchChannelProfile = async () => {
    if (!channelUrl.trim()) {
      alert('방송국 채널 URL을 먼저 입력해주세요.');
      return;
    }
    setIsSyncingChannel(true);
    setSyncMessage(null);
    const res = await fetchExternalPlatformProfile(platform, channelUrl.trim());
    setIsSyncingChannel(false);

    if (res.success) {
      if (res.channelImageUrl) setAvatarUrl(res.channelImageUrl);
      if (res.channelName && !displayName.trim()) setDisplayName(res.channelName);
      if (res.channelDescription && !description.trim()) setDescription(res.channelDescription);
      setSyncMessage('공식 채널에서 최신 프로필 이미지를 불러왔습니다.');
    } else {
      alert(`채널 프로필 조회 실패: ${res.error || '채널 주소를 확인해 주세요.'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const detailsPayload: Record<string, string> = {};
    if (species.trim()) detailsPayload.species = species.trim();
    if (birthday.trim()) detailsPayload.birthday = birthday.trim();
    if (zodiac.trim()) detailsPayload.zodiac = zodiac.trim();
    if (height.trim()) detailsPayload.height = height.trim();
    if (fandomName.trim()) detailsPayload.fandomName = fandomName.trim();
    if (oshiMark.trim()) detailsPayload.oshiMark = oshiMark.trim();
    if (mbti.trim()) detailsPayload.mbti = mbti.trim().toUpperCase();

    const ok = await onSave(streamer.slug, {
      newSlug: newSlug.trim(),
      displayName: displayName.trim(),
      platform,
      channelUrl: channelUrl.trim(),
      agency: agency.trim(),
      countryCode,
      dateState,
      debutDate: debutDate.trim(),
      debutTime: debutTime.trim(),
      targetMonth: targetMonth.trim(),
      timezone,
      avatarUrl: avatarUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      xUrl: xUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      cafeUrl: cafeUrl.trim(),
      videoUrl: videoUrl.trim(),
      debutGroupId: debutGroupId.trim(),
      debutGroupName: debutGroupName.trim(),
      headline: headline.trim(),
      description: description.trim(),
      details: detailsPayload,
    });
    setIsSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[20px] border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F172A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <AvatarImage
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border border-white/30 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-base font-extrabold truncate">
                버튜버 프로필 & 도감 제원 통합 수정
              </h2>
              <p className="text-xs text-slate-300 font-mono truncate">
                /creator/{newSlug || streamer.slug}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* 1. 기본 프로필 및 채널 정보 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900">1. 기본 프로필 및 방송 채널</h3>
              <button
                type="button"
                onClick={handleFetchChannelProfile}
                disabled={isSyncingChannel}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-[8px] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingChannel ? 'animate-spin' : ''}`} />
                <span>공식 채널에서 아바타 자동 불러오기</span>
              </button>
            </div>

            {syncMessage && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[8px] text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">활동명 *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-bold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL 슬러그 (/creator/...) *</label>
                <input
                  type="text"
                  required
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-mono font-bold text-blue-700 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">소속사 / 팀</label>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="개인세"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">플랫폼 *</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-bold text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="CHZZK">CHZZK (치지직)</option>
                  <option value="SOOP">SOOP (숲)</option>
                  <option value="YOUTUBE">YOUTUBE (유튜브)</option>
                  <option value="TWITCH">TWITCH</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">방송국 채널 URL *</label>
                <input
                  type="url"
                  required
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">국가</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-bold text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="KR">🇰🇷 한국 (KR)</option>
                  <option value="JP">🇯🇵 일본 (JP)</option>
                  <option value="US">🇺🇸 미국/글로벌 (US)</option>
                  <option value="TW">🇹🇼 대만 (TW)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">프로필 아바타 이미지 URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">X(트위터) URL</label>
                <input
                  type="url"
                  value={xUrl}
                  onChange={(e) => setXUrl(e.target.value)}
                  placeholder="https://x.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 2. 데뷔 일정 및 그룹 정보 */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">
              2. 데뷔 일정 및 기수/그룹 설정
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">일정 상태</label>
                <select
                  value={dateState}
                  onChange={(e) => setDateState(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-bold text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="FIXED">일정·시간 확정</option>
                  <option value="TIME_TBD">날짜 확정 (시간 미정)</option>
                  <option value="DATE_TBD">데뷔 월만 예정 (날짜 미정)</option>
                  <option value="NONE">데뷔 일정 없음</option>
                </select>
              </div>
              {['FIXED', 'TIME_TBD'].includes(dateState) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">데뷔 날짜 (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={debutDate}
                    onChange={(e) => setDebutDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-mono font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              )}
              {dateState === 'FIXED' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">데뷔 시간 (HH:MM)</label>
                  <input
                    type="time"
                    value={debutTime}
                    onChange={(e) => setDebutTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-mono font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              )}
              {dateState === 'DATE_TBD' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">예정 월 (YYYY-MM)</label>
                  <input
                    type="month"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-mono font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">그룹/기수 이름 (선택)</label>
                <input
                  type="text"
                  value={debutGroupName}
                  onChange={(e) => setDebutGroupName(e.target.value)}
                  placeholder="예: 스텔라이브 4기"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 3. 도감 상세 제원 (종족 / 생일 / 별자리 / 신장 / 팬덤명 / 오시마크 / MBTI) */}
          <div className="space-y-3 bg-blue-50/40 p-4 rounded-[12px] border border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-blue-950">
                3. 도감 상세 제원 (종족 · 생일 · 별자리 · 신장 · 팬덤명 · 오시마크 · MBTI)
              </h3>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                프로필 위키 즉시 반영
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">종족 (Species)</label>
                <input
                  type="text"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  placeholder="예: 고양이 수인, 인간"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">생일 (Birthday)</label>
                <input
                  type="text"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  placeholder="예: 10월 24일"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">별자리 (Zodiac)</label>
                <input
                  type="text"
                  value={zodiac}
                  onChange={(e) => setZodiac(e.target.value)}
                  placeholder="예: 전갈자리"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">신장 (Height)</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="예: 160cm"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">팬덤명 (Fandom)</label>
                <input
                  type="text"
                  value={fandomName}
                  onChange={(e) => setFandomName(e.target.value)}
                  placeholder="예: 젤리단"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">오시마크 (Oshi Mark)</label>
                <input
                  type="text"
                  value={oshiMark}
                  onChange={(e) => setOshiMark(e.target.value)}
                  placeholder="예: 🐾🤍"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">MBTI</label>
                <select
                  value={mbti}
                  onChange={(e) => setMbti(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[8px] font-bold text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="">미지정</option>
                  {MBTI_OPTIONS.filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">대표 PV / 영상 URL</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[8px] font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 4. 한 줄 소개 및 상세 소개글 */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">
              4. 소개 문구 및 외부 링크
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">한 줄 소개 (Headline)</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="프로필 상단 강조 문구"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">공식 카페 / 홈페이지 URL</label>
                <input
                  type="url"
                  value={cafeUrl || websiteUrl}
                  onChange={(e) => {
                    setCafeUrl(e.target.value);
                    setWebsiteUrl(e.target.value);
                  }}
                  placeholder="https://cafe.naver.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">상세 소개글</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[8px] font-medium text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <a
              href={`/creator/${streamer.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              현재 프로필 페이지 새 창으로 열기 <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-[8px] cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs rounded-[8px] shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? '저장 중...' : '프로필 & 제원 저장'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

