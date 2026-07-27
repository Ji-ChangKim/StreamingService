import React, { useState } from 'react';
import { X, Sparkles, Send, Globe, CheckCircle2 } from 'lucide-react';
import { DebutEvent } from '../types';

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
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          agency: agency || 'Indie',
          countryCode: 'KR',
          languages: ['ko'],
        },
        startAtUtc: utcIso,
        originalTimezone: timezone,
        status: 'PUBLISHED',
        verificationStatus: 'COMMUNITY_SUBMITTED',
        links: [{ platform, url: watchUrl, isPrimary: true }],
        description: description || '누구나 자유롭게 제보한 VTuber 데뷔 일정입니다.',
      };

      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onSubmitSuccess(newEvt);
        setSubmitted(false);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-[8px] max-w-lg w-full p-6 sm:p-8 border border-[#D8D8D8] shadow-layered-level3 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#898989] hover:text-[#080808] bg-[#F8FAFC] p-1.5 rounded-[4px] border border-[#D8D8D8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="eyebrow-uppercase bg-[#F8FAFC] text-[#080808] border border-[#D8D8D8] px-2.5 py-0.5 rounded-[4px]">
            <Sparkles className="w-3 h-3 text-[#7A3DFF] inline mr-1" />
            OPEN SUBMISSION
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-[#080808] font-['Outfit'] mb-1 tracking-[-0.4px]">
          데뷔 일정 등록하기
        </h2>
        <p className="text-xs text-[#5A5A5A] mb-6 font-normal">
          로그인 없이 누구나 자유롭게 새로운 버튜버 데뷔 일정을 공유할 수 있습니다.
        </p>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#00D722] mx-auto" />
            <h3 className="text-lg font-semibold text-[#080808]">제보해 주셔서 감사합니다!</h3>
            <p className="text-xs text-[#5A5A5A]">메인 캘린더에 즉시 등록되었습니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#080808] mb-1.5">
                버튜버 / 크리에이터 이름 <span className="text-[#EE1D36]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 나비야 (Nabiya)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] px-3.5 py-2 text-xs font-medium text-[#080808] focus:bg-white focus:border-[#080808] focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#080808] mb-1.5">방송 플랫폼</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] px-3 py-2 text-xs font-medium text-[#080808] focus:bg-white focus:border-[#080808] focus:outline-none"
                >
                  <option value="CHZZK">치지직 (CHZZK)</option>
                  <option value="YOUTUBE">유튜브 (YouTube)</option>
                  <option value="SOOP">숲 (SOOP)</option>
                  <option value="TWITCH">트위치 (Twitch)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#080808] mb-1.5">
                  방송 URL <span className="text-[#EE1D36]">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={watchUrl}
                  onChange={(e) => setWatchUrl(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] px-3.5 py-2 text-xs font-medium text-[#080808] focus:bg-white focus:border-[#080808] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#080808] mb-1.5">데뷔 날짜</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] px-3 py-2 text-xs font-medium text-[#080808] focus:bg-white focus:border-[#080808] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#080808] mb-1.5">시각</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] px-3 py-2 text-xs font-medium text-[#080808] focus:bg-white focus:border-[#080808] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#080808] mb-1.5">기준 시간대</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] px-2 py-2 text-xs font-medium text-[#080808] focus:bg-white focus:border-[#080808] focus:outline-none"
                >
                  <option value="Asia/Seoul">KST (한국)</option>
                  <option value="Asia/Tokyo">JST (일본)</option>
                  <option value="America/Los_Angeles">PST (태평양)</option>
                  <option value="UTC">UTC (세계시)</option>
                </select>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] p-2.5 flex items-center justify-between text-xs">
              <span className="font-medium text-[#080808] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#080808]" />
                등록될 예상 시각:
              </span>
              <span className="font-semibold text-[#080808]">{previewLocalTime} ({timezone})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#080808] mb-1.5">소속 (옵션)</label>
                <input
                  type="text"
                  placeholder="예: Indie, V-PRO 등"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] px-3.5 py-2 text-xs font-medium text-[#080808] focus:bg-white focus:border-[#080808] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#080808] mb-1.5">소개글 (옵션)</label>
                <input
                  type="text"
                  placeholder="한 줄 한마디..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8D8D8] rounded-[4px] px-3.5 py-2 text-xs font-medium text-[#080808] focus:bg-white focus:border-[#080808] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary justify-center py-2.5 text-sm font-medium mt-4"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? '제보 등록 중...' : '즉시 캘린더에 등록하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

