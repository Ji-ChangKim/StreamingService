import { Tv, Sparkles, Flame, PlusCircle } from 'lucide-react';
import { DebutEvent } from '../types';
import { checkIsEventLive } from '../utils/eventUtils';
import { formatLocalTime } from '../utils/dateUtils';

interface SidebarRightProps {
  events: DebutEvent[];
  selectedTimezone: string;
  onOpenSubmitModal: () => void;
}

export function SidebarRight({
  events,
  selectedTimezone,
  onOpenSubmitModal,
}: SidebarRightProps) {
  // Find Live Events
  const liveEvents = events.filter((e) => checkIsEventLive(e.startAtUtc));
  const hotEvents = events.slice(0, 2);

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
      {/* 🔴 LIVE NOW Section */}
      <div className="bg-white rounded-[8px] p-4 border border-[#D8D8D8] shadow-layered-level2">
        <div className="eyebrow-uppercase text-[11px] text-[#EE1D36] mb-3 flex items-center justify-between font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[9999px] bg-[#EE1D36] animate-pulse" />
            LIVE NOW
          </span>
          <span className="text-[10px] text-[#898989] font-normal">{liveEvents.length} 진행 중</span>
        </div>

        {liveEvents.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#898989] bg-[#F8FAFC] rounded-[4px] border border-[#D8D8D8]">
            현재 생방송 진행 중인 데뷔 방송이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {liveEvents.map((evt) => (
              <div key={evt.id} className="bg-[#F8FAFC] p-3 rounded-[4px] border border-[#D8D8D8] space-y-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={evt.creator.avatarUrl}
                    alt={evt.creator.displayName}
                    className="w-8 h-8 rounded-[9999px] object-cover border border-[#D8D8D8]"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-[#080808] line-clamp-1">{evt.creator.displayName}</h4>
                    <span className="text-[10px] text-[#5A5A5A] font-medium">{evt.links[0]?.platform}</span>
                  </div>
                </div>
                <a
                  href={evt.links[0]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary text-xs justify-center py-1.5"
                >
                  <Tv className="w-3 h-3" />
                  방송 보러가기
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 HOT DEBUT PICK Section */}
      <div className="bg-white rounded-[8px] p-4 border border-[#D8D8D8] shadow-layered-level2">
        <div className="eyebrow-uppercase text-[11px] text-[#080808] mb-3 flex items-center gap-1.5 font-semibold">
          <Flame className="w-3.5 h-3.5 text-[#FF6B00]" />
          HOT DEBUT PICK
        </div>

        <div className="space-y-3">
          {hotEvents.map((evt) => (
            <div key={evt.id} className="p-2.5 rounded-[4px] border border-[#D8D8D8] bg-[#F8FAFC] space-y-1">
              <span className="text-[10px] font-semibold text-[#7A3DFF] uppercase tracking-[0.5px]">
                {evt.type}
              </span>
              <h4 className="text-xs font-semibold text-[#080808] line-clamp-1">{evt.creator.displayName}</h4>
              <p className="text-[10px] text-[#5A5A5A]">
                {formatLocalTime(evt.startAtUtc, selectedTimezone)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 💡 10초 간편 제보 안내 미니 카드 */}
      <div className="bg-[#080808] text-white rounded-[8px] p-4 space-y-2 border border-[#080808] shadow-layered-level2">
        <div className="eyebrow-uppercase text-[11px] text-white/80 flex items-center gap-1.5 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#00D722]" />
          COMMUNITY SUBMIT
        </div>
        <h4 className="text-sm font-semibold text-white tracking-[-0.2px]">데뷔 일정을 제보해보세요!</h4>
        <p className="text-xs text-[#ABABAB] leading-relaxed">
          로그인 없이 누구나 10초 만에 신입 버튜버의 데뷔 방송 정보를 등록할 수 있습니다.
        </p>
        <button
          onClick={onOpenSubmitModal}
          className="w-full bg-white hover:bg-slate-100 text-[#080808] text-xs font-medium py-2 rounded-[4px] transition-all flex items-center justify-center gap-1.5 mt-2"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          지금 제보하기
        </button>
      </div>
    </aside>
  );
}
