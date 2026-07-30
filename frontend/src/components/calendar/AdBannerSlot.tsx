import { Megaphone } from 'lucide-react';

interface AdBannerSlotProps {
  zone: 'ZONE1_TOP' | 'ZONE2_PINNED' | 'ZONE4_STICKY';
  enableAds?: boolean;
}

export function AdBannerSlot({ zone, enableAds = false }: AdBannerSlotProps) {
  if (!enableAds) return null;

  if (zone === 'ZONE1_TOP') {
    return (
      <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-[14px] p-3 text-white flex items-center justify-between shadow-xs mb-4">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#8B5CF6] text-white rounded-[4px] uppercase tracking-wider">
            AD / SPONSORED
          </span>
          <p className="text-xs font-semibold text-slate-200">
            🔥 <strong className="text-amber-300">신입 버튜버 데뷔 프로모션:</strong> 이번 주 주목해야 할 데뷔 라인업 배너
          </p>
        </div>
        <button
          onClick={() => alert('데뷔 프로모션 광고 문의: ads@vdebut.hub')}
          className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 hover:underline hidden sm:inline-block"
        >
          배너 광고 문의 ↗
        </button>
      </div>
    );
  }

  if (zone === 'ZONE2_PINNED') {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-[12px] p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded-[4px] shrink-0">
            ⭐ PROMOTED
          </span>
          <span className="text-xs font-bold text-amber-900 truncate">
            금주의 핫라이트 데뷔 스폰서십 스팟
          </span>
        </div>
        <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
      </div>
    );
  }

  if (zone === 'ZONE4_STICKY') {
    return (
      <div className="mt-4 pt-3 border-t border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[12px] border border-[#CBD5E1] text-center">
        <span className="text-[9px] font-bold text-[#94A3B8] uppercase block mb-1">SPONSORED ADVERTISEMENT</span>
        <div className="h-[90px] bg-slate-200 rounded-[8px] flex items-center justify-center text-xs font-bold text-slate-500">
          300x90 Sticky Banner Slot
        </div>
      </div>
    );
  }

  return null;
}
