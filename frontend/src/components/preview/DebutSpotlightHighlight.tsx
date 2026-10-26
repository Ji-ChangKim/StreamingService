import { useState, useMemo } from 'react';
import { ExternalLink, Calendar, Sparkles, ChevronRight, Clock } from 'lucide-react';
import { DebutEvent } from '../../types';
import {
  DebutSpotlightEntry,
  getTodayDebutList,
  getThisWeekDebutList,
  getUpcomingNextDebuts,
  PLATFORM_OFFICIAL_ASSETS,
} from '../../utils/debutSpotlightUtils';
import { AvatarImage } from '../calendar/AvatarImage';
import { profileAgencyName } from '../../../../shared/profilePresentation';

interface DebutSpotlightHighlightProps {
  allEvents: DebutEvent[];
  selectedTimezone: string;
  onDownloadICS: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
  currentLang?: 'ko' | 'ja' | 'en';
}

/**
 * 데뷔 일정 뱃지 생성 함수 (단일 기능 함수 - 팩트 정합성 완벽 보장)
 */
function getDebutStatusBadge(entry: DebutSpotlightEntry) {
  const { isLive, daysDiff, timeStr, dayLabel } = entry;

  if (isLive) {
    return {
      label: 'LIVE 방송 중',
      badgeClass: 'bg-red-600 text-white shadow-xs animate-pulse',
      isLivePulse: true,
    };
  }

  if (daysDiff === 0) {
    return {
      label: `오늘 ${timeStr}`,
      badgeClass: 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/30',
      isLivePulse: false,
    };
  }

  if (daysDiff === 1) {
    return {
      label: `내일 (D-1) ${timeStr}`,
      badgeClass: 'bg-blue-600 text-white shadow-xs',
      isLivePulse: false,
    };
  }

  if (daysDiff === 2) {
    return {
      label: `D-2 (${dayLabel}) ${timeStr}`,
      badgeClass: 'bg-indigo-600 text-white shadow-xs',
      isLivePulse: false,
    };
  }

  return {
    label: `D-${daysDiff} · ${dayLabel} ${timeStr}`,
    badgeClass: 'bg-slate-800 text-white shadow-xs',
    isLivePulse: false,
  };
}

/**
 * 데뷔 카드 컴포넌트 (단일 책임 원칙 - 절대 찌그러지지 않는 여유 있는 너비)
 */
function DebutSpotlightCard({
  entry,
  onDownloadICS,
  onNavigate,
}: {
  entry: DebutSpotlightEntry;
  onDownloadICS: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
}) {
  const { event, primaryPlatform, channelUrl } = entry;
  const platformAsset = PLATFORM_OFFICIAL_ASSETS[primaryPlatform] || PLATFORM_OFFICIAL_ASSETS.OTHER;
  const agency = profileAgencyName(event.creator.agency);
  const creatorSlug = (event.creator as any)?.slug || event.creator.id || '';
  const description = event.description || `${event.creator.displayName}의 첫 데뷔 방송입니다. 함께 응원해 주세요!`;
  const badgeInfo = getDebutStatusBadge(entry);

  return (
    <div className="relative group bg-white/95 backdrop-blur-xl rounded-2xl border border-white/90 p-5 shadow-sm hover:shadow-xl hover:border-blue-300/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* 1. 상단: 플랫폼 공식 로고 & 팩트 정밀 일정 뱃지 */}
      <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200/80 shadow-2xs whitespace-nowrap shrink-0">
          <img
            src={platformAsset.logo}
            alt={platformAsset.label}
            className="w-4 h-4 object-contain shrink-0"
          />
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{platformAsset.label}</span>
        </div>

        <div className="flex items-center shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full whitespace-nowrap shrink-0 ${badgeInfo.badgeClass}`}
          >
            {badgeInfo.isLivePulse ? (
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            ) : (
              <Clock className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{badgeInfo.label}</span>
          </span>
        </div>
      </div>

      {/* 2. 중앙: 아바타 & 크리에이터 정보 */}
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div
          onClick={() => creatorSlug && onNavigate?.(`/creator/${creatorSlug}`)}
          className="relative shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-3 ring-white shadow-md bg-slate-100">
            <AvatarImage
              src={event.creator.avatarUrl}
              alt={event.creator.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          {agency && (
            <span className="absolute -bottom-1.5 -right-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs whitespace-nowrap">
              {agency}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h4
            onClick={() => creatorSlug && onNavigate?.(`/creator/${creatorSlug}`)}
            className="text-base sm:text-lg font-black text-slate-900 truncate hover:text-blue-600 cursor-pointer transition-colors mb-1"
            title={event.creator.displayName}
          >
            {event.creator.displayName}
          </h4>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* 3. 하단 액션 버튼 (글자 깨짐 방지 whitespace-nowrap) */}
      <div className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-slate-100 relative z-10">
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all whitespace-nowrap cursor-pointer"
        >
          <span className="whitespace-nowrap">방송국 가기</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>

        <button
          type="button"
          onClick={() => onDownloadICS(event)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="whitespace-nowrap">일정 저장</span>
        </button>
      </div>
    </div>
  );
}

/**
 * 하단 빠른 타임라인 칩
 */
function TimelineChip({
  entry,
  onNavigate,
}: {
  entry: DebutSpotlightEntry;
  onNavigate?: (path: string) => void;
}) {
  const { event, timeStr, dayLabel, daysDiff, primaryPlatform, channelUrl } = entry;
  const platformAsset = PLATFORM_OFFICIAL_ASSETS[primaryPlatform] || PLATFORM_OFFICIAL_ASSETS.OTHER;
  const creatorSlug = (event.creator as any)?.slug || event.creator.id || '';

  const dDayBadge =
    daysDiff === 0
      ? '오늘'
      : daysDiff === 1
      ? '내일 D-1'
      : `D-${daysDiff}`;

  return (
    <div className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-white/90 hover:bg-white backdrop-blur-md rounded-xl border border-white/80 shadow-2xs hover:shadow-md transition-all shrink-0 select-none whitespace-nowrap">
      <span
        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
          daysDiff === 0
            ? 'bg-red-500 text-white'
            : daysDiff === 1
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 text-slate-700'
        }`}
      >
        {dDayBadge}
      </span>

      <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
        {dayLabel} {timeStr}
      </span>

      <img
        src={platformAsset.logo}
        alt={platformAsset.label}
        className="w-3.5 h-3.5 object-contain shrink-0"
      />

      <div
        onClick={() => creatorSlug && onNavigate?.(`/creator/${creatorSlug}`)}
        className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors"
      >
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200">
          <AvatarImage
            src={event.creator.avatarUrl}
            alt={event.creator.displayName}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs font-black text-slate-800 truncate max-w-[110px] whitespace-nowrap">
          {event.creator.displayName}
        </span>
      </div>

      <a
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`${event.creator.displayName} 방송국 바로가기`}
        className="text-slate-400 hover:text-blue-600 p-0.5 ml-0.5 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

/**
 * [메인 하이라이트] 스마트 스포트라이트 컴포넌트
 */
export function DebutSpotlightHighlight({
  allEvents = [],
  selectedTimezone = 'Asia/Seoul',
  onDownloadICS,
  onNavigate,
}: DebutSpotlightHighlightProps) {
  const todayList = useMemo(() => getTodayDebutList(allEvents, selectedTimezone), [allEvents, selectedTimezone]);
  const weekList = useMemo(() => getThisWeekDebutList(allEvents, selectedTimezone), [allEvents, selectedTimezone]);
  const nearestUpcoming = useMemo(() => getUpcomingNextDebuts(allEvents, selectedTimezone, 3), [allEvents, selectedTimezone]);

  // 오늘 데뷔가 있으면 TODAY, 없으면 이번 주 라인업(WEEK)을 스마트 기본 탭으로 설정
  const hasToday = todayList.length > 0;
  const [viewTab, setViewTab] = useState<'TODAY' | 'WEEK'>(hasToday ? 'TODAY' : 'WEEK');

  // 활성 목록 결정
  const activeList = viewTab === 'TODAY' ? todayList : weekList;
  const fallbackList = nearestUpcoming;

  return (
    <div className="w-full relative select-none pt-1 pb-4">
      {/* 1. 상단 탭 헤더: [🔥 오늘 데뷔] vs [📅 이번 주 라인업] */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 px-1 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewTab('TODAY')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              viewTab === 'TODAY'
                ? 'bg-slate-900 text-white shadow-md scale-102 ring-2 ring-blue-500/20'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-white/80 shadow-2xs'
            }`}
          >
            <span>🔥 오늘 데뷔</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                viewTab === 'TODAY' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {todayList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('WEEK')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              viewTab === 'WEEK'
                ? 'bg-slate-900 text-white shadow-md scale-102 ring-2 ring-blue-500/20'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-white/80 shadow-2xs'
            }`}
          >
            <span>📅 이번 주 라인업</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                viewTab === 'WEEK' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {weekList.length}
            </span>
          </button>
        </div>

        {/* 상단 서브 안내문구 */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 shadow-2xs whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {viewTab === 'TODAY' && !hasToday
              ? '오늘 예정된 데뷔 방송은 없습니다. 곧 데뷔할 스트리머를 확인해 보세요!'
              : viewTab === 'TODAY'
              ? '오늘 첫 데뷔 방송을 시작하는 신입 버튜버입니다'
              : '이번 주에 첫 만남을 갖는 버튜버 데뷔 라인업입니다'}
          </span>
        </div>
      </div>

      {/* 2. 카드 그리드 본체 (시원시원한 max-w-7xl 와이드 3열 그리드) */}
      <div className="max-w-7xl mx-auto px-1">
        {activeList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {activeList.map((entry) => (
              <DebutSpotlightCard
                key={entry.event.id}
                entry={entry}
                onDownloadICS={onDownloadICS}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          /* 오늘 데뷔가 없는 경우: 다가오는 가장 가까운 데뷔자들을 시원하게 노출 */
          <div>
            <div className="text-center py-6 mb-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1 text-sm font-black text-slate-800 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                오늘 예정된 데뷔 방송은 없습니다
              </span>
              <p className="text-xs text-slate-500">
                곧 시작될 가장 가까운 데뷔 일정을 미리 캘린더에 담아두고 첫 방송을 함께해 보세요!
              </p>
            </div>

            {fallbackList.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {fallbackList.map((entry) => (
                  <DebutSpotlightCard
                    key={entry.event.id}
                    entry={entry}
                    onDownloadICS={onDownloadICS}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. 하단 퀵 스캔 타임라인 바 */}
      {weekList.length > 0 && (
        <div className="max-w-7xl mx-auto px-1 mt-6 pt-5 border-t border-slate-200/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
              <span>📅 이번 주 데뷔 예정 퀵 스캔</span>
              <span className="text-[10px] font-bold text-slate-400">({weekList.length}명)</span>
            </span>
            {viewTab === 'TODAY' && (
              <button
                type="button"
                onClick={() => setViewTab('WEEK')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
              >
                <span>전체보기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2">
            {weekList.map((entry) => (
              <TimelineChip
                key={entry.event.id}
                entry={entry}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
