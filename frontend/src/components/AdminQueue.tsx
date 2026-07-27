import { ShieldCheck, CheckCircle2, Trash2, ExternalLink } from 'lucide-react';
import { DebutEvent } from '../types';

interface AdminQueueProps {
  events: DebutEvent[];
  onApproveEvent: (id: string) => void;
  onRejectEvent: (id: string) => void;
}

export function AdminQueue({ events, onApproveEvent, onRejectEvent }: AdminQueueProps) {
  return (
    <div className="space-y-6 mb-12">
      {/* Header Container */}
      <div className="bg-white rounded-[8px] p-6 border border-[#D8D8D8] shadow-layered-level2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[4px] bg-[#080808] flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#080808] font-['Outfit'] tracking-[-0.4px]">
              오픈 제보 검수 큐 (Admin Triage)
            </h2>
            <p className="text-xs text-[#5A5A5A]">
              누구나 등록한 데뷔 일정의 중복/스팸 여부를 신속하게 관리하고 오피셜 배지를 부여합니다.
            </p>
          </div>
        </div>

        <span className="eyebrow-uppercase bg-[#F8FAFC] text-[#080808] border border-[#D8D8D8] text-[11px] font-medium px-3 py-1 rounded-[4px]">
          SUBMISSIONS: {events.length}
        </span>
      </div>

      {/* Queue List Table */}
      <div className="bg-white rounded-[8px] border border-[#D8D8D8] shadow-layered-level2 overflow-hidden">
        {events.length === 0 ? (
          <div className="p-12 text-center text-[#898989] text-xs font-medium">
            검수 대기 중인 오픈 제보 데이터가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-[#D8D8D8]">
            {events.map((evt) => (
              <div key={evt.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-start gap-4">
                  <img
                    src={evt.creator.avatarUrl}
                    alt={evt.creator.displayName}
                    className="w-10 h-10 rounded-[9999px] object-cover border border-[#D8D8D8]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#080808]">{evt.creator.displayName}</h3>
                      <span className="bg-[#F8FAFC] text-[#080808] text-[10px] font-medium px-2 py-0.5 rounded-[4px] border border-[#D8D8D8] uppercase">
                        {evt.links[0]?.platform || 'LINK'}
                      </span>
                      <span className="bg-[#7A3DFF] text-white text-[10px] font-medium px-2 py-0.5 rounded-[4px]">
                        {evt.verificationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A5A5A] mt-1 line-clamp-1">
                      {evt.description} • 원본: {evt.startAtUtc} ({evt.originalTimezone})
                    </p>
                    <a
                      href={evt.links[0]?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#006ACC] font-medium hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      방송 채널 링크 확인 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => onApproveEvent(evt.id)}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    오피셜 승인
                  </button>
                  <button
                    onClick={() => onRejectEvent(evt.id)}
                    className="btn-secondary text-xs py-1.5 px-3 text-[#EE1D36] hover:bg-red-50 hover:border-[#EE1D36]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    스팸/삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
