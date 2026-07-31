import { PlusCircle, Clock, ExternalLink, Download, X } from 'lucide-react';
import { DebutEvent } from '../../types';
import { formatLocalTime } from '../../utils/dateUtils';
import { AvatarImage } from './AvatarImage';

interface ScheduleInspectorPanelProps {
  selectedDateStr: string;
  events: DebutEvent[];
  selectedTimezone: string;
  onOpenSubmitModal?: (dateStr?: string) => void;
  onDownloadICS: (evt: DebutEvent) => void;
  onClosePanel: () => void;
  onEditEvent?: (evt: DebutEvent) => void;
}

export function ScheduleInspectorPanel({
  selectedDateStr,
  events,
  selectedTimezone,
  onOpenSubmitModal,
  onDownloadICS,
  onClosePanel,
}: ScheduleInspectorPanelProps) {
  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden animate-fadeIn">
      {/* Selected Date Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3 shrink-0">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] font-['Outfit'] flex items-center gap-2">
            📌 {selectedDateStr} 데뷔 스케줄
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            해당 날짜에 등록된 데뷔 이벤트 총 <strong className="text-[#2563EB]">{events.length}건</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 1-Click Add Schedule Button */}
          {onOpenSubmitModal && (
            <button
              onClick={() => onOpenSubmitModal(selectedDateStr)}
              className="px-2.5 py-1.5 text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-[8px] transition-colors flex items-center gap-1 shadow-xs shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              일정 등록
            </button>
          )}

          {/* Close Panel Button */}
          <button
            onClick={onClosePanel}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
            title="스케줄 패널 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Event List Container - Scrollable without cutoff */}
      {events.length === 0 ? (
        <div className="py-12 text-center text-[#94A3B8] text-xs space-y-2 flex-1">
          <p className="font-semibold">이 날짜에는 아직 등록된 데뷔 일정이 없습니다.</p>
          {onOpenSubmitModal && (
            <button
              onClick={() => onOpenSubmitModal(selectedDateStr)}
              className="text-[#2563EB] font-bold hover:underline inline-block mt-1"
            >
              👉 첫 번째 데뷔 일정 직접 등록하기
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 pr-1 pb-6">
          {events.map((evt) => {
            const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
            const formattedTime = formatLocalTime(evt.startAtUtc, selectedTimezone);
            const isIndie = evt.creator.agency.toLowerCase().includes('indie') || evt.creator.agency === '개인세';
            const slug = (evt.creator as any).slug || (evt.creator.displayName === '아롱띠' ? 'arongtti' : 'arongtti');

            const handleProfileClick = (e: React.MouseEvent) => {
              e.preventDefault();
              window.history.pushState({}, '', `/creator/${slug}`);
              window.dispatchEvent(new Event('popstate'));
              onClosePanel();
            };

            return (
              <div
                key={evt.id}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[14px] p-3.5 sm:p-4 flex flex-col gap-3 hover:border-[#2563EB] transition-all group shadow-xs"
              >
                {/* Creator Profile Info */}
                <div className="flex items-start gap-3">
                  <a href={`/creator/${slug}`} onClick={handleProfileClick} className="shrink-0">
                    <AvatarImage
                      src={evt.creator.avatarUrl}
                      alt={evt.creator.displayName}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-xs cursor-pointer hover:scale-105 transition-transform"
                    />
                  </a>

                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <a
                        href={`/creator/${slug}`}
                        onClick={handleProfileClick}
                        className="text-sm font-extrabold text-[#0F172A] hover:text-[#2563EB] transition-colors truncate"
                      >
                        {evt.creator.displayName}
                      </a>
                      {primaryLink?.platform === 'CHZZK' ? (
                        <span className="bg-[#00FFA3] text-[#000000] font-extrabold text-[11px] px-2.5 py-1 rounded-[4px] flex items-center gap-1.5 shrink-0">
                          <img src="/icons/chzzk_icon.png" alt="CHZZK" className="w-4 h-4 object-contain shrink-0" />
                          <span>CHZZK</span>
                        </span>
                      ) : primaryLink?.platform === 'YOUTUBE' ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <img src="/icons/youtube_icon.png" alt="YouTube" className="h-4 object-contain shrink-0" />
                        </div>
                      ) : (
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-[4px] bg-[#0F172A] text-white flex items-center gap-1.5 shrink-0">
                          <span>{primaryLink?.platform}</span>
                        </span>
                      )}
                      {/* 개인세 표시는 제외하고 기업/에이전시일 때만 노출 */}
                      {!isIndie && evt.creator.agency && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                          🏢 {evt.creator.agency}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono font-bold text-[#2563EB] flex items-center gap-1 mb-1">
                      <Clock className="w-3.5 h-3.5" /> {formattedTime}
                    </p>

                    <p className="text-xs text-[#475569] font-medium line-clamp-2">
                      {evt.description || evt.title}
                    </p>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-[#E2E8F0]">
                  <a
                    href={primaryLink?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1 px-2.5 py-2 text-[11px] sm:text-xs font-bold bg-[#0F172A] text-white hover:bg-[#2563EB] rounded-[8px] transition-colors shadow-xs"
                  >
                    방송 보러가기 <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onDownloadICS(evt)}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-2.5 py-2 text-[11px] sm:text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-[8px] transition-colors"
                  >
                    캘린더 추가 <Download className="w-3 h-3" />
                  </button>
                  <a
                    href={`/creator/${slug}`}
                    onClick={handleProfileClick}
                    className="w-full text-center py-1.5 text-xs font-extrabold text-[#2563EB] hover:underline bg-blue-50/60 rounded-[6px] border border-blue-100 transition-colors block mt-1"
                  >
                    👉 {evt.creator.displayName} 스트리머 프로필 상세 보기
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
