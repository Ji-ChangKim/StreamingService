import { useState, useMemo } from 'react';
import { ExternalLink, Bell } from 'lucide-react';
import { DebutEvent } from '../../types';
import {
  PlatformKey,
  getPlatformSpotlightSummary,
  SpotlightItem
} from '../../utils/spotlightQueue';
import { getCountryBadge } from '../../utils/countryDetector';
import { AvatarImage } from '../calendar/AvatarImage';

interface PlatformMiniSpotlightProps {
  allEvents: DebutEvent[];
  selectedTimezone: string;
  onDownloadICS: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
}

interface PlatformTabConfig {
  id: PlatformKey;
  label: string;
  officialLogo: string;
  accentColor: string;
  borderHoverColor: string;
}

const PLATFORMS: PlatformTabConfig[] = [
  {
    id: 'SOOP',
    label: 'SOOP',
    officialLogo: '/icons/soop/soop_symbol_blue.svg',
    accentColor: '#1E40AF',
    borderHoverColor: 'hover:border-blue-400',
  },
  {
    id: 'CHZZK',
    label: '치지직',
    officialLogo: '/icons/chzzk_icon.png',
    accentColor: '#00FFA3',
    borderHoverColor: 'hover:border-emerald-400',
  },
  {
    id: 'YOUTUBE',
    label: '유튜브',
    officialLogo: '/icons/youtube_icon.png',
    accentColor: '#EF4444',
    borderHoverColor: 'hover:border-red-400',
  },
  {
    id: 'TWITCH',
    label: '트위치',
    officialLogo: '/icons/twitch_icon.svg',
    accentColor: '#9333EA',
    borderHoverColor: 'hover:border-purple-400',
  },
];

export function PlatformMiniSpotlight({
  allEvents,
  selectedTimezone,
  onDownloadICS,
  onNavigate,
}: PlatformMiniSpotlightProps) {
  // 1. 디폴트 탭: 라이브 방송이 있는 플랫폼 우선, 없으면 SOOP
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('SOOP');

  // 각 플랫폼별 요약 데이터 계산 (단일 책임)
  const summaries = useMemo(() => {
    const map = new Map<PlatformKey, ReturnType<typeof getPlatformSpotlightSummary>>();
    PLATFORMS.forEach((p) => {
      map.set(p.id, getPlatformSpotlightSummary(allEvents, p.id, selectedTimezone, 5));
    });
    return map;
  }, [allEvents, selectedTimezone]);

  const currentSummary = summaries.get(selectedPlatform) || {
    items: [],
    liveCount: 0,
    totalCount: 0,
    nextDateLabel: '일정 준비 중',
  };

  return (
    <section
      aria-label="Platform Mini Spotlight"
      className="w-full mb-6 bg-white/90 backdrop-blur-sm rounded-[16px] border border-[#E2E8F0] shadow-xs p-3.5 sm:p-4.5"
    >
      {/* 1. 상단 플랫폼 4대 탭 바 & 헤더 요약 라벨 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-[#E2E8F0]">
        
        {/* 플랫폼 선택 탭 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5">
          {PLATFORMS.map((p) => {
            const isSelected = selectedPlatform === p.id;
            const pSummary = summaries.get(p.id);
            const hasLive = (pSummary?.liveCount || 0) > 0;
            const count = pSummary?.totalCount || 0;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[9px] text-xs font-black transition-all cursor-pointer select-none relative ${
                  isSelected
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                }`}
                title={`${p.label} 데뷔 스포트라이트`}
              >
                {/* 공식 로고 (무가공 원칙 준수) */}
                <img
                  src={p.officialLogo}
                  alt={p.label}
                  className="w-4 h-4 object-contain shrink-0"
                />
                <span>{p.label}</span>

                {/* 총 인원 카운트 */}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#CBD5E1] text-[#334155]'
                  }`}
                >
                  {count}
                </span>

                {/* 🔴 라이브 중일 때 빨간 펄스 뱃지 */}
                {hasLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 상태 요약 라벨 (다음 데뷔 예고 or 라이브 진행 중) */}
        <div className="text-xs font-bold text-[#64748B] flex items-center gap-1.5 self-end sm:self-center">
          <span className="px-2 py-0.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]">
            {currentSummary.nextDateLabel}
          </span>
        </div>
      </div>

      {/* 2. 컴팩트 미니 카드 리스트 (가로 스크롤 / 그리드) */}
      <div className="pt-3">
        {currentSummary.items.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-[#64748B] bg-[#F8FAFC] rounded-[10px] border border-dashed border-[#CBD5E1]">
            현재 등록된 {selectedPlatform} 데뷔 일정이 없습니다.
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {currentSummary.items.map((item) => (
              <MiniSpotlightCard
                key={item.event.id}
                item={item}
                onDownloadICS={onDownloadICS}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * 가로 230px × 세로 약 84px의 컴팩트 미니 글래스 카드 (단일 책임 컴포넌트)
 */
function MiniSpotlightCard({
  item,
  onDownloadICS,
  onNavigate,
}: {
  item: SpotlightItem;
  onDownloadICS: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
}) {
  const { event, statusType, statusBadge, badgeColorClass, channelUrl } = item;
  const isLive = statusType === 'LIVE';
  const countryBadge = getCountryBadge(event.creator.countryCode);
  const slug = (event.creator as any)?.slug || '';

  return (
    <div
      className={`shrink-0 w-[230px] sm:w-[245px] h-[86px] bg-white rounded-[12px] border p-2.5 shadow-2xs flex items-center justify-between gap-2.5 transition-all hover:shadow-xs hover:-translate-y-0.5 group relative ${
        isLive
          ? 'border-red-300 bg-gradient-to-r from-red-50/40 to-white ring-1 ring-red-200'
          : 'border-[#CBD5E1] hover:border-[#2563EB]'
      }`}
    >
      {/* 1. 좌측 44px 원형 아바타 (플랫폼 네온 테두리) */}
      <div className="relative shrink-0">
        <AvatarImage
          src={event.creator.avatarUrl || ''}
          alt={event.creator.displayName}
          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
        />
        {/* 국기 미니 뱃지 */}
        <span
          className="absolute -bottom-1 -right-1 text-[11px] leading-none bg-white rounded-full p-0.5 shadow-2xs"
          title={`국가: ${countryBadge.label}`}
        >
          {countryBadge.flag}
        </span>
      </div>

      {/* 2. 중앙 정보 영역 (이름, 소속, 상태 뱃지) */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1">
          <h4
            onClick={() => slug && onNavigate && onNavigate(`/creator/${slug}`)}
            className="text-xs font-black text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors cursor-pointer"
            title={event.creator.displayName}
          >
            {event.creator.displayName}
          </h4>
        </div>

        <p className="text-[10px] text-[#64748B] font-medium truncate">
          {event.creator.agency || '개인세'}
        </p>

        {/* 뱃지: 라이브 또는 오늘/내일 데뷔 시간 */}
        <div className="pt-0.5">
          <span
            className={`inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-[4px] leading-tight ${badgeColorClass}`}
          >
            {statusBadge}
          </span>
        </div>
      </div>

      {/* 3. 우측 액션 버튼 (생방송 바로가기 or 캘린더 알림) */}
      <div className="shrink-0 flex flex-col items-center justify-center gap-1 border-l border-[#F1F5F9] pl-2">
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          className={`p-1.5 rounded-[6px] transition-all flex items-center justify-center ${
            isLive
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-2xs'
              : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#2563EB] hover:text-white'
          }`}
          title={isLive ? '생방송 바로가기' : '방송국 채널 방문'}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {!isLive && (
          <button
            onClick={() => onDownloadICS(event)}
            className="p-1.5 rounded-[6px] bg-[#F1F5F9] text-[#64748B] hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
            title="캘린더 알림(.ics) 다운로드"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
