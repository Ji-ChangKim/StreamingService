import { Clock, Download, Tv } from 'lucide-react';
import { DebutEvent } from '../types';
import { formatLocalTime } from '../utils/dateUtils';
import { checkIsEventLive } from '../utils/eventUtils';

interface EventCardProps {
  event: DebutEvent;
  selectedTimezone: string;
  onDownloadICS: (event: DebutEvent) => void;
}

export function EventCard({
  event,
  selectedTimezone,
  onDownloadICS,
}: EventCardProps) {
  const formattedLocalTime = formatLocalTime(event.startAtUtc, selectedTimezone);
  const isLive = checkIsEventLive(event.startAtUtc);

  const primaryLink = event.links[0]?.url || '#';
  const primaryPlatform = event.links[0]?.platform || 'YOUTUBE';

  const getPlatformBadgeStyle = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'CHZZK':
        return 'bg-[#00FFA3] text-[#000000] font-extrabold';
      case 'YOUTUBE':
        return 'bg-[#EE1D36] text-white';
      case 'SOOP':
        return 'bg-[#FF6B00] text-white';
      case 'TWITCH':
        return 'bg-[#7A3DFF] text-white';
      default:
        return 'bg-[#F8FAFC] text-[#080808] border border-[#D8D8D8]';
    }
  };

  return (
    <div className="bg-white rounded-[8px] p-5 border border-[#D8D8D8] shadow-layered-level2 flex flex-col justify-between hover:border-[#080808] transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {primaryPlatform === 'CHZZK' ? (
            <img
              src="/icons/chzzk/chzzklogo_Combi(Black).png"
              alt="치지직 CHZZK"
              className="h-5.5 object-contain shrink-0"
            />
          ) : (
            <span
              className={`eyebrow-uppercase text-[10px] font-medium px-2.5 py-0.5 rounded-[4px] uppercase tracking-[1px] flex items-center gap-1.5 ${getPlatformBadgeStyle(
                primaryPlatform
              )}`}
            >
              {primaryPlatform === 'YOUTUBE' && (
                <img src="/icons/youtube_icon.png" alt="YouTube" className="w-4 h-4 object-contain shrink-0" />
              )}
              <span>{primaryPlatform}</span>
            </span>
          )}

          <div className="flex items-center gap-1.5">
            {isLive ? (
              <span className="bg-[#EE1D36] text-white text-[10px] font-semibold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.6px] animate-pulse">
                🔴 LIVE NOW
              </span>
            ) : (
              <span className="bg-[#F8FAFC] text-[#5A5A5A] text-[10px] font-medium px-2 py-0.5 rounded-[4px] border border-[#D8D8D8]">
                {event.type}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3.5 mb-4">
          <img
            src={event.creator.avatarUrl}
            alt={event.creator.displayName}
            className="w-11 h-11 rounded-[9999px] object-cover border border-[#D8D8D8]"
          />
          <div>
            <h3 className="text-base font-semibold text-[#080808] leading-snug line-clamp-1 tracking-[-0.16px]">
              {event.creator.displayName}
            </h3>
            <p className="text-xs font-normal text-[#5A5A5A] mt-0.5">
              소속: <span className="text-[#080808] font-medium">{event.creator.agency || 'Indie'}</span>
            </p>
            <div className="flex items-center gap-1 mt-1">
              {event.creator.languages.map((lang) => (
                <span
                  key={lang}
                  className="bg-[#F8FAFC] text-[#5A5A5A] text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] border border-[#D8D8D8]"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#F8FAFC] rounded-[4px] p-2.5 border border-[#D8D8D8] mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#080808]">
            <Clock className="w-3.5 h-3.5 text-[#080808] flex-shrink-0" />
            <span>{formattedLocalTime}</span>
          </div>
          <p className="text-[11px] text-[#898989] mt-0.5 pl-5">
            (원본 설정: {event.originalTimezone})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[#D8D8D8]">
        <button
          onClick={() => onDownloadICS(event)}
          className="flex-1 btn-secondary text-xs font-medium py-1.5 justify-center"
        >
          <Download className="w-3.5 h-3.5 text-[#080808]" />
          알림 저장
        </button>

        <a
          href={primaryLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 btn-primary text-xs font-medium py-1.5 justify-center"
        >
          <Tv className="w-3.5 h-3.5" />
          방송 보러가기
        </a>
      </div>
    </div>
  );
}
