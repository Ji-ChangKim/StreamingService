import { LiveSample } from '../../services/analyticsApiService';
import { Radio, ExternalLink, Users } from 'lucide-react';

interface LiveSampleSectionProps {
  samples: LiveSample[];
  isLoading?: boolean;
}

export function LiveSampleSection({ samples, isLoading }: LiveSampleSectionProps) {
  if (isLoading || !samples || samples.length === 0) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>현재 실시간 LIVE 방송 참고 (표본 스트리머)</span>
          </h3>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            통계 수치를 구성하고 있는 실제 버튜버 방송 표본을 확인하고 플랫폼으로 이동할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {samples.map((sample) => (
          <a
            key={sample.id}
            href={sample.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between bg-[#F8FAFC] hover:bg-slate-100/80 border border-[#E2E8F0] hover:border-blue-300 rounded-xl p-3.5 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                {/* 플랫폼 공식 로고 준수 */}
                {sample.platform === 'CHZZK' ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold text-emerald-800">
                    <img src="/icons/chzzk/chzzk Icon_01.png" alt="CHZZK" className="w-3.5 h-3.5 object-contain" />
                    <span>치지직</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-extrabold text-blue-800">
                    <img src="/icons/soop/soop_symbol_blue.svg" alt="SOOP" className="w-3.5 h-3.5 object-contain" />
                    <span>SOOP</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                  <Users className="w-3 h-3" />
                  <span>{sample.viewers.toLocaleString()}명</span>
                </div>
              </div>

              {/* 스트리머 정보 */}
              <div className="flex items-center gap-2.5 mb-2">
                <img
                  src={sample.profileImageUrl}
                  alt={sample.streamerName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[#0F172A] text-xs truncate group-hover:text-[#2563EB] transition-colors">
                    {sample.streamerName}
                  </div>
                  <div className="text-[10px] text-[#64748B] truncate">
                    {sample.categoryName}
                  </div>
                </div>
              </div>

              {/* 방송 제목 */}
              <p className="text-[11px] text-[#334155] line-clamp-2 leading-relaxed mb-3">
                {sample.streamTitle}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-[#64748B] group-hover:text-[#2563EB] transition-colors">
              <span>방송 시청하러 가기</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
