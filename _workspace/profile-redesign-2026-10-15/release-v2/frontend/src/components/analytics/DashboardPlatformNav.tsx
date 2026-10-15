import React from 'react';
import { Layers, Search, X } from 'lucide-react';
import { PlatformFilter } from '../../services/analyticsApiService';

interface DashboardPlatformNavProps {
  currentPlatform: PlatformFilter;
  onSelectPlatform: (platform: PlatformFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
}

export const DashboardPlatformNav: React.FC<DashboardPlatformNavProps> = ({
  currentPlatform,
  onSelectPlatform,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white border border-[#CBD5E1] rounded-2xl shadow-2xs">
      {/* 플랫폼 캡슐 탭 (기존 사이트 표준 스타일) */}
      <div className="inline-flex items-center gap-1.5 p-1 bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl shadow-2xs">
        {/* 전체 플랫폼 */}
        <button
          type="button"
          onClick={() => onSelectPlatform('ALL')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            currentPlatform === 'ALL'
              ? 'bg-[#0F172A] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80'
          }`}
        >
          <Layers className={`w-4 h-4 ${currentPlatform === 'ALL' ? 'text-blue-400' : 'text-slate-500'}`} />
          <span>전체 플랫폼</span>
        </button>

        {/* 치지직 */}
        <button
          type="button"
          onClick={() => onSelectPlatform('CHZZK')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            currentPlatform === 'CHZZK'
              ? 'bg-[#0F172A] text-white shadow-sm border border-emerald-500/50'
              : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80'
          }`}
        >
          <img
            src="/icons/chzzk_icon.png"
            alt="치지직"
            className="w-4 h-4 object-contain shrink-0"
          />
          <span>치지직</span>
        </button>

        {/* SOOP */}
        <button
          type="button"
          onClick={() => onSelectPlatform('SOOP')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            currentPlatform === 'SOOP'
              ? 'bg-[#0F172A] text-white shadow-sm border border-blue-500/50'
              : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/80'
          }`}
        >
          <img
            src={currentPlatform === 'SOOP' ? '/icons/soop/soop_symbol_white.svg' : '/icons/soop/soop_symbol_blue.svg'}
            alt="SOOP"
            className="w-4 h-4 object-contain shrink-0"
          />
          <span>SOOP</span>
        </button>
      </div>

      {/* 우측 상시 스트리머 검색 바 */}
      <div className="relative w-full md:w-80 shrink-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="스트리머 또는 방송 검색..."
          className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-bold bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-slate-800 rounded font-black text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
