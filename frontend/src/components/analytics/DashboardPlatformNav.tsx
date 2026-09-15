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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-3 border-b border-white/10">
      {/* 플랫폼 캡슐 탭 (명세서 D1-01 / D2-01) */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl w-fit">
        {/* 전체 플랫폼 */}
        <button
          type="button"
          onClick={() => onSelectPlatform('ALL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentPlatform === 'ALL'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>전체 플랫폼</span>
        </button>

        {/* 치지직 */}
        <button
          type="button"
          onClick={() => onSelectPlatform('CHZZK')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentPlatform === 'CHZZK'
              ? 'bg-[#00ffa3] text-black font-bold shadow-md shadow-[#00ffa3]/25'
              : 'text-gray-400 hover:text-[#00ffa3] hover:bg-white/[0.06]'
          }`}
        >
          <img
            src="/icons/chzzk_icon.png"
            alt="치지직"
            className="w-4 h-4 object-contain"
          />
          <span>치지직</span>
        </button>

        {/* SOOP */}
        <button
          type="button"
          onClick={() => onSelectPlatform('SOOP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentPlatform === 'SOOP'
              ? 'bg-[#1b63ff] text-white font-bold shadow-md shadow-[#1b63ff]/30'
              : 'text-gray-400 hover:text-[#1b63ff] hover:bg-white/[0.06]'
          }`}
        >
          <img
            src="/icons/soop/soop_symbol_blue.svg"
            alt="SOOP"
            className={`w-4 h-4 object-contain ${currentPlatform === 'SOOP' ? 'brightness-200' : ''}`}
          />
          <span>SOOP</span>
        </button>
      </div>

      {/* 우측 상시 스트리머 검색 바 (명세서 2절/8절) */}
      <div className="relative flex-1 md:max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="스트리머 또는 방송 검색..."
          className="w-full pl-9 pr-8 py-2 text-xs bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
