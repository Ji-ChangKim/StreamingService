import { useState } from 'react';
import { ExternalLink, Calendar, Sparkles, ChevronRight, Radio } from 'lucide-react';
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
 * 금일 데뷔 개별 카드 컴포넌트 (단일 책임 원칙)
 */
function TodayDebutCard({
  entry,
  onDownloadICS,
  onNavigate,
}: {
  entry: DebutSpotlightEntry;
  onDownloadICS: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
}) {
  const { event, isLive, timeStr, primaryPlatform, channelUrl } = entry;
  const platformAsset = PLATFORM_OFFICIAL_ASSETS[primaryPlatform] || PLATFORM_OFFICIAL_ASSETS.OTHER;
  const agency = profileAgencyName(event.creator.agency);
  const creatorSlug = (event.creator as any)?.slug || event.creator.id || '';
  const description = event.description || `${event.creator.displayName}의 첫 데뷔 방송입니다. 함께 응원해 주세요!`;

  return (
    <div className="relative group bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* 배경 은은한 포인트 라이트 효과 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />

      {/* 1. 상단: 플랫폼 공식 로고 & 방송 상태 & 데뷔 시간 */}
      <div className="flex items-center justify-between gap-2 mb-3.5 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 rounded-full border border-slate-200/80 shadow-2xs">
          <img
            src={platformAsset.logo}
            alt={platformAsset.label}
            className="w-3.5 h-3.5 object-contain shrink-0"
          />
          <span className="text-[11px] font-bold text-slate-700">{platformAsset.label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white text-[11px] font-black rounded-full shadow-xs animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              LIVE 방송 중
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/10 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-600/20">
              <Radio className="w-3 h-3 text-emerald-600" />
              오늘 {timeStr}
            </span>
          )}
        </div>
      </div>

      {/* 2. 중앙: 아바타 & 크리에이터 정보 */}
      <div className="flex items-center gap-3.5 mb-4 relative z-10">
        <div
          onClick={() => creatorSlug && onNavigate?.(`/creator/${creatorSlug}`)}
          className="relative shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden ring-2 ring-white shadow-md bg-slate-100">
            <AvatarImage
              src={event.creator.avatarUrl}
              alt={event.creator.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          {agency && (
            <span className="absolute -bottom-1.5 -right-1 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md shadow-xs">
              {agency}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4
              onClick={() => creatorSlug && onNavigate?.(`/creator/${creatorSlug}`)}
              className="text-base sm:text-lg font-black text-slate-900 truncate hover:text-blue-600 cursor-pointer transition-colors"
            >
              {event.creator.displayName}
            </h4>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* 3. 하단 액션 버튼 (공식 방송국 1-Click 이동 + 캘린더 등록) */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 relative z-10">
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:from-blue-700 hover:to-indigo-700 hover:shadow-md transition-all cursor-pointer"
        >
          <span>방송국 가기</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>

        <button
          onClick={() => onDownloadICS(event)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>일정 저장</span>
        </button>
      </div>
    </div>
  );
}

/**
 * 이번 주 데뷔 가로 슬림 칩 컴포넌트 (단일 기능 함수)
 */
function WeeklyTimelineChip({
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
      : daysDiff === 2
      ? 'D-2'
      : `D-${daysDiff}`;

  return (
    <div className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-white/80 hover:bg-white backdrop-blur-md rounded-xl border border-white/70 shadow-2xs hover:shadow-md transition-all shrink-0 select-none">
      {/* D-Day 뱃지 */}
      <span
        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
          daysDiff === 0
            ? 'bg-red-500 text-white'
            : daysDiff === 1
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 text-slate-700'
        }`}
      >
        {dDayBadge}
      </span>

      {/* 날짜 및 시간 */}
      <span className="text-xs font-bold text-slate-500">{dayLabel} {timeStr}</span>

      {/* 플랫폼 로고 */}
      <img
        src={platformAsset.logo}
        alt={platformAsset.label}
        className="w-3.5 h-3.5 object-contain shrink-0"
      />

      {/* 아바타 & 닉네임 */}
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
        <span className="text-xs font-black text-slate-800 truncate max-w-[90px] sm:max-w-[120px]">
          {event.creator.displayName}
        </span>
      </div>

      {/* 방송국 빠른 이동 버튼 */}
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
 * 오늘 데뷔가 없을 때의 친절한 안내 & 최신 예정 데뷔 추천 (단일 기능 컴포넌트)
 */
function EmptyTodayFallback({
  upcomingList,
  onDownloadICS,
  onNavigate,
}: {
  upcomingList: DebutSpotlightEntry[];
  onDownloadICS: (event: DebutEvent) => void;
  onNavigate?: (path: string) => void;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/80 p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-sm">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-2xs">
        <Sparkles className="w-6 h-6 animate-pulse" />
      </div>
      <h4 className="text-base sm:text-lg font-black text-slate-800 mb-1">
        오늘 예정된 데뷔는 없습니다
      </h4>
      <p className="text-xs sm:text-sm text-slate-500 mb-6">
        곧 시작될 가장 가까운 데뷔 일정을 미리 캘린더에 담아두고 첫 방송을 함께해 보세요!
      </p>

      {upcomingList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
          {upcomingList.map((entry) => (
            <TodayDebutCard
              key={entry.event.id}
              entry={entry}
              onDownloadICS={onDownloadICS}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * [메인 하이라이트 시안] 금일/금주 데뷔 시인성 강화 통합 컴포넌트
 */
export function DebutSpotlightHighlight({
  allEvents = [],
  selectedTimezone = 'Asia/Seoul',
  onDownloadICS,
  onNavigate,
}: DebutSpotlightHighlightProps) {
  const [viewTab, setViewTab] = useState<'TODAY' | 'WEEK'>('TODAY');

  const todayList = getTodayDebutList(allEvents, selectedTimezone);
  const weekList = getThisWeekDebutList(allEvents, selectedTimezone);
  const nearestUpcoming = getUpcomingNextDebuts(allEvents, selectedTimezone, 3);

  return (
    <div className="w-full relative select-none pt-2 pb-6">
      {/* 1. 상단 탭 헤더: [🔥 오늘 데뷔] vs [📅 이번 주 라인업] */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTab('TODAY')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              viewTab === 'TODAY'
                ? 'bg-[#0F172A] text-white shadow-md scale-102 ring-2 ring-blue-500/20'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-white/80 shadow-2xs'
            }`}
          >
            <span>🔥 오늘 데뷔</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                viewTab === 'TODAY' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {todayList.length}
            </span>
          </button>

          <button
            onClick={() => setViewTab('WEEK')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              viewTab === 'WEEK'
                ? 'bg-[#0F172A] text-white shadow-md scale-102 ring-2 ring-blue-500/20'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-white/80 shadow-2xs'
            }`}
          >
            <span>📅 이번 주 라인업</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                viewTab === 'WEEK' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {weekList.length}
            </span>
          </button>
        </div>

        {/* 안내 텍스트 */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white/50 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/60">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>신입 버튜버의 생애 첫 데뷔 방송을 실시간으로 확인하세요</span>
        </div>
      </div>

      {/* 2. 뷰 본문 */}
      {viewTab === 'TODAY' ? (
        todayList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayList.map((entry) => (
              <TodayDebutCard
                key={entry.event.id}
                entry={entry}
                onDownloadICS={onDownloadICS}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          <EmptyTodayFallback
            upcomingList={nearestUpcoming}
            onDownloadICS={onDownloadICS}
            onNavigate={onNavigate}
          />
        )
      ) : (
        /* 이번 주 라인업 뷰 */
        <div className="space-y-4">
          {weekList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekList.map((entry) => (
                <TodayDebutCard
                  key={entry.event.id}
                  entry={entry}
                  onDownloadICS={onDownloadICS}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/75 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 text-xs font-bold text-slate-500">
              이번 주 예정된 데뷔 일정이 등록 준비 중입니다.
            </div>
          )}
        </div>
      )}

      {/* 3. 하단: 이번 주 전체 빠른 가로 스캔 바 (오늘 탭일 때도 하단에 보조 노출하여 즉시 훑어보기 지원) */}
      {viewTab === 'TODAY' && weekList.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-200/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <span>📅 이번 주 데뷔 예정 퀵 스캔</span>
              <span className="text-[10px] font-bold text-slate-400">({weekList.length}명)</span>
            </span>
            <button
              onClick={() => setViewTab('WEEK')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>전체보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2">
            {weekList.map((entry) => (
              <WeeklyTimelineChip
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
