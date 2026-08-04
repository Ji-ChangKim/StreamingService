import React, { useState } from 'react';
import { X, Save, Calendar, Clock, Link, Sparkles, User, FileText } from 'lucide-react';
import { CreatorProfileData, updateCreatorProfile } from '../../services/creatorService';

interface CreatorEditModalProps {
  profile: CreatorProfileData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatorEditModal({ profile, isOpen, onClose, onSuccess }: CreatorEditModalProps) {
  const primaryChannel = profile.channels.find((c) => c.isPrimary) || profile.channels[0];
  const debutEvent = profile.events && profile.events[0];
  
  // Extract initial date and time
  let initialDate = '';
  let initialTime = '20:00';
  if (debutEvent?.startAtUtc) {
    try {
      const d = new Date(debutEvent.startAtUtc);
      initialDate = d.toISOString().split('T')[0];
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      initialTime = `${hours}:${minutes}`;
    } catch {
      // fallback
    }
  }

  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [agencyName, setAgencyName] = useState(profile.agencyName || '개인세');
  const [debutDate, setDebutDate] = useState(initialDate);
  const [debutTime, setDebutTime] = useState(initialTime);
  const [channelUrl, setChannelUrl] = useState(primaryChannel?.channelUrl || '');
  const [xUrl, setXUrl] = useState(profile.xUrl || '');
  const [description, setDescription] = useState(profile.description || '');
  const [profileImageUrl, setProfileImageUrl] = useState(profile.profileImageUrl || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('크리에이터 이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const success = await updateCreatorProfile(profile.slug, {
      displayName: displayName.trim(),
      agencyName: agencyName.trim(),
      debutDate: debutDate || undefined,
      debutTime: debutTime || undefined,
      channelUrl: channelUrl.trim() || undefined,
      xUrl: xUrl.trim() || undefined,
      description: description.trim() || undefined,
      profileImageUrl: profileImageUrl.trim() || undefined,
    });

    setIsSubmitting(false);

    if (success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg('프로필 수정 저장에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-[20px] shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-lg font-black text-[#0F172A]">크리에이터 프로필 정보 수정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-left flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#2563EB]" /> 크리에이터 이름
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="예: 헤티"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-hidden focus:border-[#2563EB] font-bold text-slate-900"
                required
              />
            </div>

            {/* Agency Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                소속 / 그룹
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="예: 개인세, 이세돌, V-LUP 등"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-hidden focus:border-[#2563EB] font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Debut Date */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#2563EB]" /> 데뷔 날짜
              </label>
              <input
                type="date"
                value={debutDate}
                onChange={(e) => setDebutDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-hidden focus:border-[#2563EB] font-bold text-slate-900"
              />
            </div>

            {/* Debut Time */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#2563EB]" /> 데뷔 시간 (한국 시간)
              </label>
              <input
                type="time"
                value={debutTime}
                onChange={(e) => setDebutTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-hidden focus:border-[#2563EB] font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Main Channel URL */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-[#2563EB]" /> 방송 채널 URL (SOOP / 치지직 / 유튜브 등)
            </label>
            <input
              type="url"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="https://chzzk.naver.com/..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-hidden focus:border-[#2563EB] font-bold text-slate-900"
            />
          </div>

          {/* X (Twitter) URL */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 fill-current text-slate-900" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X(구 트위터) 공식 계정 URL
            </label>
            <input
              type="url"
              value={xUrl}
              onChange={(e) => setXUrl(e.target.value)}
              placeholder="https://x.com/username"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-hidden focus:border-[#2563EB] font-bold text-slate-900"
            />
          </div>

          {/* Profile Image URL */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              프로필 이미지 URL
            </label>
            <input
              type="url"
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-hidden focus:border-[#2563EB] font-bold text-slate-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" /> 프로필 소개글
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="크리에이터에 대한 대표 소개글을 입력하세요."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-hidden focus:border-[#2563EB] font-medium text-slate-900 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-[8px] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs rounded-[8px] transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? '저장 중...' : '수정 사항 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
