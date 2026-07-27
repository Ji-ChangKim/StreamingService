import { useState, useEffect } from 'react';
import { Calendar, Download, Clock, ExternalLink, Sparkles, Bell } from 'lucide-react';
import { DebutEvent } from '../types';
import { formatLocalTime, calculateTimeRemaining, generateGoogleCalendarUrl } from '../utils/dateUtils';

interface HeroCountdownBannerProps {
  event: DebutEvent | null;
  selectedTimezone: string;
  onDownloadICS: (event: DebutEvent) => void;
}

export function HeroCountdownBanner({
  event,
  selectedTimezone,
  onDownloadICS,
}: HeroCountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    event ? calculateTimeRemaining(event.startAtUtc) : { hours: '00', minutes: '00', seconds: '00', isPast: false }
  );

  useEffect(() => {
    if (!event) return;

    const updateTimer = () => {
      setTimeLeft(calculateTimeRemaining(event.startAtUtc));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event]);

  if (!event) return null;

  const formattedLocalTime = formatLocalTime(event.startAtUtc, selectedTimezone);
  const googleCalendarUrl = generateGoogleCalendarUrl(event);
  const primaryLink = event.links[0]?.url || '#';

  return (
    <div className="relative overflow-hidden rounded-[8px] bg-white border border-[#D8D8D8] p-6 sm:p-8 mb-8 shadow-layered-level2">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="eyebrow-uppercase bg-[#F8FAFC] text-[#080808] border border-[#D8D8D8] px-3 py-1 rounded-[4px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7A3DFF]" />
              UPCOMING FEATURED DEBUT
            </span>
            <span className="text-xs font-medium text-[#5A5A5A] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formattedLocalTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold text-[#080808] mb-2 tracking-[-0.8px] leading-[1.2]">
            {event.creator.displayName} <span className="text-[#7A3DFF]">첫 데뷔</span>
          </h1>
          <p className="text-[#363636] text-sm max-w-xl line-clamp-2 mb-5 font-normal">
            {event.description || '새로운 글로벌 VTuber의 첫 등장의 순간을 함께 응원해 주세요!'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Calendar className="w-4 h-4" />
              Google 캘린더에 추가
            </a>
            <button
              onClick={() => onDownloadICS(event)}
              className="btn-secondary"
            >
              <Download className="w-4 h-4 text-[#080808]" />
              .ics 알림 저장
            </button>
            <a
              href={primaryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary hover:bg-slate-100"
            >
              <ExternalLink className="w-4 h-4" />
              방송 채널 대기
            </a>
          </div>
        </div>

        <div className="w-full md:w-auto bg-[#F8FAFC] rounded-[8px] p-5 border border-[#D8D8D8] flex flex-col items-center justify-center min-w-[240px]">
          <div className="eyebrow-uppercase text-[11px] text-[#080808] mb-2 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#7A3DFF] animate-pulse" />
            {timeLeft.isPast ? 'LIVE NOW' : 'LIVE COUNTDOWN'}
          </div>

          <div className="flex items-center gap-2 font-mono-timer text-3xl sm:text-4xl font-semibold text-[#080808] my-1">
            <div className="flex flex-col items-center">
              <span className="bg-white px-3 py-1.5 rounded-[4px] border border-[#D8D8D8]">
                {timeLeft.hours}
              </span>
              <span className="text-[10px] font-sans font-medium text-[#898989] mt-1">HRS</span>
            </div>
            <span className="text-[#898989] pb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-white px-3 py-1.5 rounded-[4px] border border-[#D8D8D8]">
                {timeLeft.minutes}
              </span>
              <span className="text-[10px] font-sans font-medium text-[#898989] mt-1">MIN</span>
            </div>
            <span className="text-[#898989] pb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-white px-3 py-1.5 rounded-[4px] border border-[#D8D8D8] text-[#7A3DFF]">
                {timeLeft.seconds}
              </span>
              <span className="text-[10px] font-sans font-medium text-[#898989] mt-1">SEC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
