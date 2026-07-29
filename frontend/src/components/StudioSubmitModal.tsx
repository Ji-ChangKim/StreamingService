import React, { useState } from 'react';
import { X, Sparkles, Send, Globe, CheckCircle2 } from 'lucide-react';
import { DebutEvent } from '../types';
import { getAvatarUrl } from '../utils/avatarUtils';

interface StudioSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newEvent: DebutEvent) => void;
}

export function StudioSubmitModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: StudioSubmitModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [platform, setPlatform] = useState('CHZZK');
  const [watchUrl, setWatchUrl] = useState('');
  const [date, setDate] = useState('2026-07-29');
  const [time, setTime] = useState('20:00');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [description, setDescription] = useState('');
  const [agency, setAgency] = useState('Indie');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !watchUrl) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const utcIso = new Date(`${date}T${time}:00`).toISOString();
      const newEvt: DebutEvent = {
        id: `evt-${Date.now()}`,
        title: `${displayName} 데뷔 방송`,
        type: 'FIRST_DEBUT',
        creator: {
          id: `cr-${Date.now()}`,
          displayName,
          avatarUrl: getAvatarUrl(displayName),
          agency: agency || 'Indie',
          countryCode: 'KR',
          languages: ['ko'],
        },
        startAtUtc: utcIso,
        originalTimezone: timezone,
        status: 'PUBLISHED',
        verificationStatus: 'COMMUNITY_SUBMITTED',
        links: [{ platform, url: watchUrl, isPrimary: true }],
        description: description || `${displayName} 버튜버의 공식 데뷔 방송입니다.`,
      };

      onSubmitSuccess(newEvt);
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-[20px] max-w-[540px] w-full shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2563EB] rounded-[8px]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Outfit']">
                데뷔 일정 제출하기
              </h3>
              <p className="text-xs text-slate-300">
                버튜버 본인 또는 에이전시/팬 커뮤니티 등록
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-[#10B981] animate-bounce" />
            <h4 className="text-lg font-bold text-[#0F172A]">제출이 완료되었습니다!</h4>
            <p className="text-xs text-[#64748B]">
              검수 후 캘린더에 즉시 등재됩니다. 등록해 주셔서 감사합니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs font-medium text-[#0F172A]">
            {/* Display Name */}
            <div>
              <label className="block font-bold mb-1 text-[#334155]">
                버튜버 / 스트리머 활동명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 나비야 (Nabiya)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all"
              />
            </div>

            {/* Platform & Watch URL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1 text-[#334155]">방송 플랫폼</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-bold"
                >
                  <option value="CHZZK">CHZZK (치지직)</option>
                  <option value="SOOP">SOOP (숲)</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TWITCH">Twitch</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-[#334155]">
                  방송 / 프로필 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://chzzk.naver.com/live/..."
                  value={watchUrl}
                  onChange={(e) => setWatchUrl(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-[#334155]">데뷔 날짜</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#334155]">데뷔 시각</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Timezone & Agency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-[#334155]">기준 시간대</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all font-mono"
                >
                  <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#334155]">소속 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 개인세 / V-PRO"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold mb-1 text-[#334155]">데뷔 인사말 & 소식</label>
              <textarea
                rows={2}
                placeholder="안녕하세요! 신입 버튜버 데뷔 방송에서 만나요!"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all"
              />
            </div>

            {/* Preview Box */}
            <div className="bg-[#F0F9FF] border border-[#BFDBFE] rounded-[8px] p-3 text-[11px] text-[#1E40AF] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Globe className="w-3.5 h-3.5 text-[#2563EB]" /> 표출 변환 시각:
              </span>
              <span className="font-mono font-extrabold">{previewLocalTime} ({timezone})</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[8px] font-semibold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-[8px] font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {isSubmitting ? '제출 중...' : '등록 제출'} <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
