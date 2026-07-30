import { PlusCircle, Clock, ExternalLink, Download, X } from 'lucide-react';
import { DebutEvent } from '../../types';
import { formatLocalTime } from '../../utils/dateUtils';
import { AvatarImage } from './AvatarImage';

interface ScheduleInspectorPanelProps {
  selectedDateStr: string;
  events: DebutEvent[];
  selectedTimezone: string;
  onOpenSubmitModal?: () => void;
  onDownloadICS: (evt: DebutEvent) => void;
  onPreviewAvatar: (url: string, name: string) => void;
  onClosePanel: () => void;
}

export function ScheduleInspectorPanel({
  selectedDateStr,
  events,
  selectedTimezone,
  onOpenSubmitModal,
  onDownloadICS,
  onPreviewAvatar,
  onClosePanel,
}: ScheduleInspectorPanelProps) {
  return (
    <div className="flex flex-col justify-between h-full animate-fadeIn">
      <div>
        {/* Selected Date Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
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
                onClick={onOpenSubmitModal}
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

        {/* Event List */}
        {events.length === 0 ? (
          <div className="py-12 text-center text-[#94A3B8] text-xs space-y-2">
            <p className="font-semibold">이 날짜에는 아직 등록된 데뷔 일정이 없습니다.</p>
            {onOpenSubmitModal && (
              <button
                onClick={onOpenSubmitModal}
                className="text-[#2563EB] font-bold hover:underline inline-block mt-1"
              >
                👉 첫 번째 데뷔 일정 직접 등록하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
            {events.map((evt) => {
              const primaryLink = evt.links.find((l) => l.isPrimary) || evt.links[0];
              const formattedTime = formatLocalTime(evt.startAtUtc, selectedTimezone);
              const isIndie = evt.creator.agency.toLowerCase().includes('indie') || evt.creator.agency === '개인세';

              return (
                <div
                  key={evt.id}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[14px] p-4 flex flex-col gap-3 hover:border-[#2563EB] transition-all group"
                >
                  {/* Creator Profile Info */}
                  <div className="flex items-start gap-3">
                    <AvatarImage
                      src={evt.creator.avatarUrl}
                      alt={evt.creator.displayName}
                      onClick={() => onPreviewAvatar(evt.creator.avatarUrl, evt.creator.displayName)}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs cursor-pointer hover:scale-105 transition-transform"
                    />

                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-sm font-extrabold text-[#0F172A] truncate">
                          {evt.creator.displayName}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[4px] bg-[#0F172A] text-white">
                          {primaryLink?.platform}
                        </span>
                        {isIndie ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[4px] bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                            🌱 개인세
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                            {evt.creator.agency}
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
                  <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
                    <a
                      href={primaryLink?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold bg-[#0F172A] text-white hover:bg-[#2563EB] rounded-[8px] transition-colors shadow-xs"
                    >
                      방송 보러가기 / 팔로우 <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => onDownloadICS(evt)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9] rounded-[8px] transition-colors"
                    >
                      캘린더 추가 <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
