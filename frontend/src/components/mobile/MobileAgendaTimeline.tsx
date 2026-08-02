import { ExternalLink, CalendarX, Sparkles, Clock } from 'lucide-react';
import { DebutEvent } from '../../types';
import { getAvatarUrl } from '../../utils/avatarUtils';
import { formatTimeInTimezone } from '../../utils/dateUtils';

interface MobileAgendaTimelineProps {
  selectedDateStr: string;
  events: DebutEvent[];
  selectedTimezone: string;
  onOpenSubmitModal?: (dateStr?: string) => void;
}

export function MobileAgendaTimeline({
  selectedDateStr,
  events,
  selectedTimezone,
  onOpenSubmitModal,
}: MobileAgendaTimelineProps) {
  const formattedSelectedDate = (() => {
    if (!selectedDateStr) return '';
    try {
      const [yyyy, mm, dd] = selectedDateStr.split('-').map(Number);
      const d = new Date(yyyy, mm - 1, dd);
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      return `${yyyy}년 ${mm}월 ${dd}일 (${dayNames[d.getDay()]})`;
    } catch {
      return selectedDateStr;
    }
  })();

  return (
    <div className="flex-1 bg-[#F8FAFC] p-3.5 pb-24 space-y-3 overflow-y-auto">
      {/* 어젠다 타이틀 헤더 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-xs font-extrabold text-[#0F172A] font-['Outfit']">
            {formattedSelectedDate} 데뷔 & 방송 일정
          </h3>
        </div>
        <span className="text-[11px] font-extrabold text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full shadow-2xs">
          총 <span className="text-[#2563EB]">{events.length}</span>개
        </span>
      </div>

      {/* 이벤트 카드리스트 */}
      {events.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-[#CBD5E1] p-8 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="p-3 bg-slate-100 rounded-full text-[#64748B]">
            <CalendarX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-[#0F172A]">등록된 데뷔 일정이 없습니다</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">첫 데뷔 방송 일정을 직접 등록해 보세요!</p>
          </div>
          {onOpenSubmitModal && (
            <button
              onClick={() => onOpenSubmitModal(selectedDateStr)}
              className="mt-1 px-4 py-2 bg-[#0F172A] hover:bg-[#2563EB] text-white text-xs font-bold rounded-[10px] transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              + 데뷔 일정 등록하기
            </button>
          )}
        </div>
      ) : (
        events.map((evt) => {
          const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
          const startTime = formatTimeInTimezone(evt.startAtUtc, selectedTimezone);

          // 이벤트 유형 뱃지 감지 (DEBUT / STREAM / COLLAB)
          const isCollab = evt.title?.includes('콜라보') || evt.title?.includes('합방') || evt.creator.displayName?.includes('&');
          const isDebut = evt.title?.includes('데뷔') || evt.title?.includes('Debut');
          const categoryTag = isDebut ? 'DEBUT' : isCollab ? 'COLLAB' : 'STREAM';
          const tagBgStyle = isDebut
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : isCollab
            ? 'bg-purple-100 text-purple-800 border-purple-200'
            : 'bg-[#D9F99D] text-[#365314] border-[#BEF264]'; // 형광 그린 뱃지

          const avatarUrl = evt.creator.avatarUrl || getAvatarUrl(evt.creator.displayName);

          return (
            <div
              key={evt.id}
              className="bg-white rounded-[20px] border border-[#CBD5E1] p-3.5 shadow-sm hover:shadow-md transition-all flex gap-3.5 items-stretch relative overflow-hidden"
            >
              {/* 좌측: 썸네일 이미지 & 소요시간 Overlay (시안 스타일) */}
              <div className="relative w-24 h-24 rounded-[14px] overflow-hidden bg-slate-900 shrink-0 border border-slate-200 shadow-inner">
                <img
                  src={avatarUrl}
                  alt={evt.creator.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', getAvatarUrl(evt.creator.displayName));
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs border border-white/20">
                  1.5H
                </div>
              </div>

              {/* 우측: 이벤트 정보 & 카테고리 뱃지/시간 & 스트리머 프로필 */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                {/* 우측 상단: 카테고리 뱃지 & 시간 */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md border ${tagBgStyle}`}>
                    {categoryTag}
                  </span>
                  <div className="flex items-center gap-1 text-slate-500 font-mono font-bold text-xs">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{startTime}</span>
                  </div>
                </div>

                {/* 우측 중앙/하단: 아바타 + 스트리머/행사 이름 */}
                <div className="flex items-center gap-2 my-1">
                  <img
                    src={avatarUrl}
                    alt={evt.creator.displayName}
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <span className="text-xs font-black text-slate-900 truncate font-['Outfit']">
                    {evt.creator.displayName}
                  </span>
                </div>

                {/* 하단: 소속 agency 및 바로가기 */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-medium truncate">
                    {evt.creator.agency || 'Indie'}
                  </span>
                  {primaryLink?.url && (
                    <a
                      href={primaryLink.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 shrink-0"
                    >
                      <span>방송국</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

